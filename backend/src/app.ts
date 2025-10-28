import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import routes from './routes';
import { env } from './config/env';
import { requestLogger } from './middleware/requestLogger';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { csrfProtection } from './middleware/csrf';

const app = express();

const limiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 100,
});

app.set('trust proxy', 1);

if (env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    const proto = req.headers['x-forwarded-proto'];
    if (proto && proto !== 'https') {
      return res.redirect(301, `https://${req.headers.host}${req.url}`);
    }
    next();
  });
}

app.use(limiter);

const connectSources = ["'self'"];
if (env.FRONTEND_URL) {
  const frontendOrigin = env.FRONTEND_URL.replace(/\/$/, '');
  if (frontendOrigin) {
    connectSources.push(frontendOrigin);
  }
}
if (env.API_URL) {
  const apiOrigin = env.API_URL.replace(/\/$/, '');
  if (apiOrigin) {
    connectSources.push(apiOrigin);
  }
}

const contentSecurityPolicyDirectives: any = {
  defaultSrc: ["'self'"],
  scriptSrc: ["'self'"],
  styleSrc: ["'self'"],
  imgSrc: ["'self'", 'data:', 'https:'],
  connectSrc: connectSources,
  fontSrc: ["'self'", 'data:'],
  objectSrc: ["'none'"],
};

if (env.NODE_ENV === 'production') {
  contentSecurityPolicyDirectives.upgradeInsecureRequests = [];
}

if (env.CSP_REPORT_URI) {
  contentSecurityPolicyDirectives['report-uri'] = [env.CSP_REPORT_URI];
}

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: contentSecurityPolicyDirectives,
    },
  })
);
const allowedOrigins = [env.FRONTEND_URL];
if (env.API_URL) {
  allowedOrigins.push(env.API_URL);
}

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
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
