import winston from 'winston';
import { env } from '../config/env';

const SENSITIVE_KEYS = [
  'password',
  'password_hash',
  'token',
  'refresh_token',
  'access_token',
  'authorization',
  'cookie',
  'csrf_token',
  'secret',
];

const maskEmail = (email: string): string => {
  const [local, domain] = email.split('@');
  if (!domain || local.length <= 2) return '*'.repeat(email.length);
  return `${local[0]}${'*'.repeat(Math.max(local.length - 2, 0))}${local[local.length - 1] || ''}@${domain}`;
};

const redactSensitiveData = (obj: any): any => {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== 'object') return obj;

  if (Array.isArray(obj)) {
    return obj.map(redactSensitiveData);
  }

  const result: any = {};
  for (const [key, value] of Object.entries(obj)) {
    const lowerKey = key.toLowerCase();
    
    if (SENSITIVE_KEYS.some((s) => lowerKey.includes(s))) {
      result[key] = '[REDACTED]';
    } else if (lowerKey === 'email' && typeof value === 'string' && value.includes('@')) {
      result[key] = maskEmail(value);
    } else if (typeof value === 'object') {
      result[key] = redactSensitiveData(value);
    } else {
      result[key] = value;
    }
  }
  return result;
};

const redactionFormat = winston.format((info) => {
  return redactSensitiveData(info);
});

const logFormat = winston.format.combine(
  redactionFormat(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let metaStr = '';
    if (Object.keys(meta).length > 0) {
      metaStr = '\n' + JSON.stringify(meta, null, 2);
    }
    return `${timestamp} [${level}]: ${message}${metaStr}`;
  })
);

const transports: winston.transport[] = [
  new winston.transports.Console({
    format: env.NODE_ENV === 'production' ? logFormat : consoleFormat,
  }),
];

if (env.NODE_ENV === 'production') {
  transports.push(
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      format: logFormat,
    }),
    new winston.transports.File({
      filename: 'logs/combined.log',
      format: logFormat,
    })
  );
}

export const logger = winston.createLogger({
  level: env.LOG_LEVEL,
  format: logFormat,
  transports,
  exitOnError: false,
});

export default logger;
