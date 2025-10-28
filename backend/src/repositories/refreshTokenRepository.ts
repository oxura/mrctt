import { Pool, PoolClient } from 'pg';
import bcrypt from 'bcryptjs';
import { pool } from '../db/client';
import { hashPassword } from '../utils/password';

interface RefreshToken {
  id: string;
  user_id: string;
  tenant_id: string;
  token_hash: string;
  expires_at: Date;
  is_revoked: boolean;
  created_at: Date;
  revoked_at: Date | null;
}

interface CreateRefreshTokenData {
  user_id: string;
  tenant_id: string;
  token: string;
  expires_at: Date;
}

export class RefreshTokenRepository {
  constructor(private db: Pool | PoolClient = pool) {}

  async create(data: CreateRefreshTokenData): Promise<RefreshToken> {
    const tokenHash = await hashPassword(data.token);
    const result = await this.db.query<RefreshToken>(
      `INSERT INTO refresh_tokens (user_id, tenant_id, token_hash, expires_at)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [data.user_id, data.tenant_id, tokenHash, data.expires_at]
    );
    return result.rows[0];
  }

  async findByToken(token: string, userId: string): Promise<RefreshToken | null> {
    const result = await this.db.query<RefreshToken>(
      `SELECT * FROM refresh_tokens 
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [userId]
    );

    for (const row of result.rows) {
      const match = await bcrypt.compare(token, row.token_hash);
      if (match) {
        return row;
      }
    }

    return null;
  }

  async findValidByToken(token: string, userId: string): Promise<RefreshToken | null> {
    const matched = await this.findByToken(token, userId);

    if (!matched) {
      return null;
    }

    return matched;
  }

  async revokeToken(id: string): Promise<void> {
    await this.db.query(
      `UPDATE refresh_tokens SET is_revoked = true, revoked_at = NOW() WHERE id = $1`,
      [id]
    );
  }

  async revokeAllUserTokens(userId: string): Promise<void> {
    await this.db.query(
      `UPDATE refresh_tokens SET is_revoked = true, revoked_at = NOW() 
       WHERE user_id = $1 AND is_revoked = false`,
      [userId]
    );
  }

  async revokeTokenFamily(userId: string, tenantId: string): Promise<void> {
    await this.db.query(
      `UPDATE refresh_tokens SET is_revoked = true, revoked_at = NOW() 
       WHERE user_id = $1 AND tenant_id = $2 AND is_revoked = false`,
      [userId, tenantId]
    );
  }

  async deleteExpired(): Promise<number> {
    const result = await this.db.query(
      `DELETE FROM refresh_tokens WHERE expires_at < NOW() OR (is_revoked = true AND revoked_at < NOW() - INTERVAL '30 days')`
    );
    return result.rowCount || 0;
  }
}
