import { Pool, PoolClient } from 'pg';
import { pool } from '../db/client';

interface CreateLoginAttemptData {
  email: string;
  tenant_slug: string;
  ip_address?: string | null;
  success: boolean;
}

interface AccountLockout {
  id: string;
  email: string;
  tenant_slug: string;
  locked_until: Date;
  created_at: Date;
}

export class LoginAttemptRepository {
  constructor(private db: Pool | PoolClient = pool) {}

  async create(data: CreateLoginAttemptData): Promise<void> {
    await this.db.query(
      `INSERT INTO login_attempts (email, tenant_slug, ip_address, success)
       VALUES ($1, $2, $3, $4)`,
      [data.email, data.tenant_slug, data.ip_address ?? null, data.success]
    );
  }

  async countFailedAttempts(email: string, tenantSlug: string, sinceMinutes = 15): Promise<number> {
    const result = await this.db.query(
      `SELECT COUNT(*)::int AS failures
       FROM login_attempts
       WHERE email = $1 AND tenant_slug = $2 AND success = false AND attempted_at > NOW() - ($3 || ' minutes')::interval`,
      [email, tenantSlug, sinceMinutes.toString()]
    );
    return result.rows[0]?.failures ?? 0;
  }

  async createLockout(email: string, tenantSlug: string, lockedUntil: Date): Promise<void> {
    await this.db.query(
      `INSERT INTO account_lockouts (email, tenant_slug, locked_until)
       VALUES ($1, $2, $3)
       ON CONFLICT (email, tenant_slug)
       DO UPDATE SET locked_until = EXCLUDED.locked_until, created_at = NOW()`,
      [email, tenantSlug, lockedUntil]
    );
  }

  async getLockout(email: string, tenantSlug: string): Promise<AccountLockout | null> {
    const result = await this.db.query<AccountLockout>(
      `SELECT * FROM account_lockouts WHERE email = $1 AND tenant_slug = $2 AND locked_until > NOW()`
        + ` ORDER BY locked_until DESC LIMIT 1`,
      [email, tenantSlug]
    );
    return result.rows[0] ?? null;
  }

  async clearLockout(email: string, tenantSlug: string): Promise<void> {
    await this.db.query(`DELETE FROM account_lockouts WHERE email = $1 AND tenant_slug = $2`, [email, tenantSlug]);
  }
}
