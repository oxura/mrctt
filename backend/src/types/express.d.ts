import type { User } from './models';
import type { PoolClient } from 'pg';

declare global {
  namespace Express {
    interface Request {
      user?: User;
      userId?: string;
      tenantId?: string;
      permissions?: string[];
      requestId?: string;
      db?: PoolClient;
    }

    interface Locals {
      cspNonce?: string;
    }
  }
}
