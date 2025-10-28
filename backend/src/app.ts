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
app.use(limiter);

const connectSources = ["'self'", env.FRONTEND_URL];
if (env.API_URL) {
  connectSources.push(env.API_URL);
}

const contentSecurityPolicyDirectives: Record<string, string[] | undefined> = {
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
app.use(
  cors({
    origin: [env.FRONTEND_URL, ...(env.API_URL ? [env.API_URL] : [])],
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
