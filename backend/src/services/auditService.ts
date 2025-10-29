import type { Request } from 'express';
import crypto from 'crypto';
import { AuditLogRepository, CreateAuditLogInput } from '../repositories/auditLogRepository';
import { PoolClientLike } from '../db/client';

interface RecordAuditLogInput extends Omit<CreateAuditLogInput, 'ipAddress' | 'userAgent'> {
  request?: Request;
  client?: PoolClientLike;
}

const hashValue = (value: string): string => {
  return crypto.createHash('sha256').update(value).digest('hex').slice(0, 16);
};

const sanitizeAuditDetails = (details: Record<string, any>): Record<string, any> => {
  const sanitized = { ...details };
  const sensitiveFields = ['password', 'token', 'refresh_token', 'access_token', 'csrf_token', 'passwordHash'];
  
  for (const field of sensitiveFields) {
    if (field in sanitized) {
      sanitized[field] = '[REDACTED]';
    }
  }
  
  if (sanitized.email && typeof sanitized.email === 'string') {
    sanitized.email = `${hashValue(sanitized.email)}@masked`;
  }
  
  return sanitized;
};

export class AuditService {
  private readonly auditRepo: AuditLogRepository;

  constructor() {
    this.auditRepo = new AuditLogRepository();
  }

  async record(input: RecordAuditLogInput): Promise<void> {
    const { request, client, ...rest } = input;

    const rawIp = request?.headers['x-forwarded-for']
      ? (request.headers['x-forwarded-for'] as string).split(',')[0].trim()
      : request?.ip ?? request?.socket?.remoteAddress ?? null;

    const rawUserAgent = (request?.headers['user-agent'] as string | undefined) ?? null;

    const ipAddress = rawIp ? hashValue(rawIp) : null;
    const userAgent = rawUserAgent ? hashValue(rawUserAgent) : null;

    await this.auditRepo.create(
      {
        ...rest,
        tenantId: rest.tenantId ?? null,
        userId: rest.userId ?? null,
        resourceId: rest.resourceId ?? null,
        details: sanitizeAuditDetails(rest.details ?? {}),
        ipAddress,
        userAgent,
      },
      client
    );
  }
}
