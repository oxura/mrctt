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
  token_family_id: string | null;
  last_used_at: Date | null;
}

interface CreateRefreshTokenData {
  user_id: string;
  tenant_id: string;
  token: string;
  expires_at: Date;
  token_family_id?: string;
}

export class RefreshTokenRepository {
  constructor(private db: Pool | PoolClient = pool) {}

  async create(data: CreateRefreshTokenData): Promise<RefreshToken> {
    const tokenHash = await hashPassword(data.token);
    const tokenFamilyId = data.token_family_id ?? null;
    const result = await this.db.query<RefreshToken>(
      `INSERT INTO refresh_tokens (user_id, tenant_id, token_hash, expires_at, token_family_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [data.user_id, data.tenant_id, tokenHash, data.expires_at, tokenFamilyId]
    );
    return result.rows[0];
  }

  async findByToken(token: string, userId: string, tenantId: string): Promise<RefreshToken | null> {
    const activeTokens = await this.db.query<RefreshToken>(
      `SELECT * FROM refresh_tokens
       WHERE user_id = $1
         AND tenant_id = $2
         AND is_revoked = false
         AND expires_at > NOW()
       ORDER BY created_at DESC
       LIMIT 10`,
      [userId, tenantId]
    );

    for (const row of activeTokens.rows) {
      const match = await bcrypt.compare(token, row.token_hash);
      if (match) {
        return row;
      }
    }

    const revokedTokens = await this.db.query<RefreshToken>(
      `SELECT * FROM refresh_tokens
       WHERE user_id = $1
         AND tenant_id = $2
         AND is_revoked = true
         AND revoked_at > NOW() - INTERVAL '30 days'
       ORDER BY revoked_at DESC NULLS LAST
       LIMIT 5`,
      [userId, tenantId]
    );

    for (const row of revokedTokens.rows) {
      const match = await bcrypt.compare(token, row.token_hash);
      if (match) {
        return row;
      }
    }

    return null;
  }

  async revokeToken(id: string): Promise<void> {
    await this.db.query(
      `UPDATE refresh_tokens SET is_revoked = true, revoked_at = NOW()
       WHERE id = $1`,
      [id]
    );
  }

  async revokeAllUserTokens(userId: string, tenantId: string): Promise<void> {
    await this.db.query(
      `UPDATE refresh_tokens SET is_revoked = true, revoked_at = NOW()
       WHERE user_id = $1 AND tenant_id = $2 AND is_revoked = false`,
      [userId, tenantId]
    );
  }

  async revokeTokenFamily(tokenFamilyId: string, tenantId: string): Promise<void> {
    await this.db.query(
      `UPDATE refresh_tokens SET is_revoked = true, revoked_at = NOW()
       WHERE token_family_id = $1 AND tenant_id = $2 AND is_revoked = false`,
      [tokenFamilyId, tenantId]
    );
  }

  async revokeAndCreateNew(
    oldTokenId: string,
    newToken: CreateRefreshTokenData,
    client: Pool | PoolClient = this.db
  ): Promise<RefreshToken> {
    const dbClient = client;

    await dbClient.query('BEGIN');
    try {
      await dbClient.query(
        `UPDATE refresh_tokens
         SET is_revoked = true, revoked_at = NOW(), last_used_at = NOW()
         WHERE id = $1`,
        [oldTokenId]
      );

      const tokenHash = await hashPassword(newToken.token);
      const tokenFamilyId = newToken.token_family_id ?? null;
      const result = await dbClient.query<RefreshToken>(
        `INSERT INTO refresh_tokens (user_id, tenant_id, token_hash, expires_at, token_family_id)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [newToken.user_id, newToken.tenant_id, tokenHash, newToken.expires_at, tokenFamilyId]
      );

      await dbClient.query('COMMIT');
      return result.rows[0];
    } catch (error) {
      await dbClient.query('ROLLBACK');
      throw error;
    }
  }

  async markTokenUsed(tokenId: string): Promise<void> {
    await this.db.query(
      `UPDATE refresh_tokens
       SET last_used_at = NOW()
       WHERE id = $1`,
      [tokenId]
    );
  }

  async deleteExpired(): Promise<number> {
    const result = await this.db.query(
      `DELETE FROM refresh_tokens WHERE expires_at < NOW() OR (is_revoked = true AND revoked_at < NOW() - INTERVAL '30 days')`
    );
    return result.rowCount || 0;
  }
}
