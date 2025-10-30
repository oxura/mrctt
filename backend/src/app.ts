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
import { dbSession } from './middleware/dbSession';
import logger from './utils/logger';

const app = express();

const limiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 100,
  skip: (req) => ['/api/v1/health', '/api/v1/ready'].includes(req.path),
});

app.set('trust proxy', 1);

app.use(requestId);

if (env.NODE_ENV === 'production') {
  const allowedHosts = env.ALLOWED_HOSTS 
    ? env.ALLOWED_HOSTS.split(',').map((host) => host.trim().toLowerCase())
    : [];

  app.use((req, res, next) => {
    if (req.method === 'OPTIONS' || req.path === '/api/v1/health') {
      return next();
    }
    
    const proto = req.headers['x-forwarded-proto'];
    if (proto && proto !== 'https') {
      const host = req.headers.host;
      
      if (allowedHosts.length > 0) {
        const hostWithoutPort = host?.split(':')[0].toLowerCase();
        if (!hostWithoutPort || !allowedHosts.includes(hostWithoutPort)) {
          logger.warn('HTTPS redirect blocked: host not in allowlist', {
            requestId: req.requestId,
            host,
            allowedHosts,
          });
          return res.status(400).send('Host not allowed');
        }
      }

      logger.warn('Redirecting non-HTTPS request', {
        requestId: req.requestId,
        originProto: proto,
        host,
        url: req.originalUrl,
      });
      return res.redirect(301, `https://${host}${req.url}`);
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

const normalizeOrigin = (origin: string): string => {
  try {
    const url = new URL(origin);
    return `${url.protocol}//${url.hostname}${url.port ? ':' + url.port : ''}`;
  } catch {
    return origin.replace(/\/$/, '');
  }
};

const rawFrontendOrigins = [
  env.FRONTEND_URL,
  env.FRONTEND_URLS,
  env.FRONTEND_ORIGINS,
  env.PUBLIC_FORM_BASE_URL,
]
  .filter(Boolean)
  .flatMap((value) =>
    (value as string).split(',').map((origin) => origin.trim()).filter((origin) => origin.length > 0)
  );

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
        styleSrc: [
          "'self'",
          ...(env.NODE_ENV !== 'production' ? ["'unsafe-inline'"] : []),
          (req, res) => `'nonce-${res.locals.cspNonce}'`,
        ],
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
        return callback(null, true);
      }

      logger.warn('CORS origin blocked', {
        origin,
        normalizedOrigin: normalized,
        allowedOrigins: frontendOrigins,
      });

      if (env.NODE_ENV !== 'production') {
        return callback(new Error(`CORS blocked for origin: ${origin}`));
      }

      return callback(null, false);
    },
    credentials: (req, res) => {
      const publicPaths = ['/api/v1/health', '/api/v1/ready'];
      if (
        req.path?.startsWith('/api/v1/forms/public') ||
        publicPaths.includes(req.path)
      ) {
        return false;
      }
      return true;
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-CSRF-Token',
      'X-Tenant-ID',
      'X-Request-ID',
    ],
    exposedHeaders: ['X-Request-ID', 'X-CSRF-Token', 'RateLimit-Limit', 'RateLimit-Remaining', 'RateLimit-Reset'],
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
