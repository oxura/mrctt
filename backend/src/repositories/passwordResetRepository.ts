import { pool, PoolClientLike } from '../db/client';

interface PasswordResetToken {
  id: string;
  user_id: string;
  token: string;
  expires_at: string;
  used: boolean;
  created_at: string;
}

export class PasswordResetRepository {
  async create(
    data: {
      user_id: string;
      token: string;
      expires_at: Date;
    },
    client: PoolClientLike = pool
  ): Promise<PasswordResetToken> {
    const result = await client.query(
      `INSERT INTO password_reset_tokens (user_id, token, expires_at)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [data.user_id, data.token, data.expires_at]
    );
    return result.rows[0] as PasswordResetToken;
  }

  async findByToken(token: string, client: PoolClientLike = pool): Promise<PasswordResetToken | null> {
    const result = await client.query(
      'SELECT * FROM password_reset_tokens WHERE token = $1 AND used = false AND expires_at > NOW()',
      [token]
    );
    const rows = result.rows as PasswordResetToken[];
    return rows[0] || null;
  }

  async markAsUsed(token: string, client: PoolClientLike = pool): Promise<void> {
    await client.query('UPDATE password_reset_tokens SET used = true WHERE token = $1', [token]);
  }

  async deleteExpired(client: PoolClientLike = pool): Promise<void> {
    await client.query('DELETE FROM password_reset_tokens WHERE expires_at < NOW()');
  }
}
