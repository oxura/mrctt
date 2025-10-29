import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { randomBytes } from 'crypto';
import routes from './routes';
import { env } from './config/env';
import { requestId } from './middleware/requestId';
import { requestLogger } from './middleware/requestLogger';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { csrfProtection } from './middleware/csrf';
import logger from './utils/logger';

const app = express();

const limiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 100,
});

app.set('trust proxy', 1);

app.use(requestId);

if (env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (req.method === 'OPTIONS' || req.path === '/api/v1/health') {
      return next();
    }
    
    const proto = req.headers['x-forwarded-proto'];
    if (proto && proto !== 'https') {
      logger.warn('Redirecting non-HTTPS request', {
        requestId: req.requestId,
        originProto: proto,
        host: req.headers.host,
        url: req.originalUrl,
      });
      return res.redirect(301, `https://${req.headers.host}${req.url}`);
    }
    next();
  });
  
  app.use(
    helmet.hsts({
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    })
  );
}

app.use(limiter);

app.use((req, res, next) => {
  res.locals.cspNonce = randomBytes(16).toString('base64');
  next();
});

const rawFrontendOrigins = [env.FRONTEND_URL, env.FRONTEND_ORIGINS]
  .filter(Boolean)
  .flatMap((value) =>
    (value as string).split(',').map((origin) => origin.trim()).filter((origin) => origin.length > 0)
  );

const normalizeOrigin = (origin: string): string => {
  try {
    const url = new URL(origin);
    return `${url.protocol}//${url.hostname}${url.port ? ':' + url.port : ''}`;
  } catch {
    return origin.replace(/\/$/, '');
  }
};

const frontendOrigins = Array.from(new Set(rawFrontendOrigins.map(normalizeOrigin)));

const connectSources = ["'self'", ...frontendOrigins];
if (env.COOKIE_DOMAIN) {
  const domain = env.COOKIE_DOMAIN.replace(/^\./, '');
  connectSources.push(`https://*.${domain}`);
}

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", (req, res) => `'nonce-${res.locals.cspNonce}'`],
        styleSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc,
        fontSrc: ["'self'", 'data:'],
        objectSrc: ["'none'"],
        ...(env.NODE_ENV === 'production' ? { upgradeInsecureRequests: [] } : {}),
        ...(env.CSP_REPORT_URI ? { 'report-uri': [env.CSP_REPORT_URI] } : {}),
      },
    },
  })
);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) {
        return callback(null, true);
      }
      
      const normalized = normalizeOrigin(origin);
      if (frontendOrigins.includes(normalized)) {
        callback(null, true);
      } else {
        const requestId = randomBytes(8).toString('hex');
        logger.warn('CORS origin blocked', {
          requestId,
          origin,
          normalizedOrigin: normalized,
          allowedOrigins: frontendOrigins,
        });
        callback(null, false);
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-CSRF-Token',
      'X-Tenant-ID',
      'X-Request-ID',
    ],
    exposedHeaders: ['X-Request-ID', 'X-CSRF-Token'],
  })
);
app.use(cookieParser());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);
app.use(csrfProtection);

app.use('/api/v1', routes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
