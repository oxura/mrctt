import { pool, PoolClientLike } from '../db/client';
import { User } from '../types/models';

export class UserRepository {
  async findById(id: string, client: PoolClientLike = pool): Promise<User | null> {
    const result = await client.query<User>(
      'SELECT * FROM users WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  async findByEmail(email: string, tenantId: string, client: PoolClientLike = pool): Promise<User | null> {
    const result = await client.query<User>(
      'SELECT * FROM users WHERE lower(email) = lower($1) AND tenant_id = $2',
      [email, tenantId]
    );
    return result.rows[0] || null;
  }

  async findByEmailGlobal(email: string, client: PoolClientLike = pool): Promise<User | null> {
    const result = await client.query<User>(
      'SELECT * FROM users WHERE lower(email) = lower($1) LIMIT 1',
      [email]
    );
    return result.rows[0] || null;
  }

  async create(
    data: {
      tenant_id: string | null;
      email: string;
      password_hash: string;
      first_name?: string;
      last_name?: string;
      role: string;
    },
    client: PoolClientLike = pool
  ): Promise<User> {
    const result = await client.query<User>(
      `INSERT INTO users (tenant_id, email, password_hash, first_name, last_name, role)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        data.tenant_id,
        data.email,
        data.password_hash,
        data.first_name || null,
        data.last_name || null,
        data.role,
      ]
    );
    return result.rows[0];
  }

  async updateLastLogin(userId: string, client: PoolClientLike = pool): Promise<void> {
    await client.query('UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = $1', [
      userId,
    ]);
  }

  async updatePassword(userId: string, passwordHash: string, client: PoolClientLike = pool): Promise<void> {
    await client.query('UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [
      passwordHash,
      userId,
    ]);
  }

  async listByTenant(tenantId: string, client: PoolClientLike = pool): Promise<User[]> {
    const result = await client.query<User>(
      'SELECT * FROM users WHERE tenant_id = $1 ORDER BY created_at DESC',
      [tenantId]
    );
    return result.rows;
  }
}
