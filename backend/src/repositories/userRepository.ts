import { pool, PoolClientLike } from '../db/client';
import { User, UserRole } from '../types/models';

export class UserRepository {
  async findById(id: string, client: PoolClientLike = pool): Promise<User | null> {
    const result = await client.query(
      'SELECT * FROM users WHERE id = $1',
      [id]
    );
    const rows = result.rows as User[];
    return rows[0] || null;
  }

  async findByEmail(email: string, tenantId: string, client: PoolClientLike = pool): Promise<User | null> {
    const result = await client.query(
      'SELECT * FROM users WHERE lower(email) = lower($1) AND tenant_id = $2',
      [email, tenantId]
    );
    const rows = result.rows as User[];
    return rows[0] || null;
  }

  async findByEmailGlobal(email: string, client: PoolClientLike = pool): Promise<User | null> {
    const result = await client.query(
      'SELECT * FROM users WHERE lower(email) = lower($1) LIMIT 1',
      [email]
    );
    const rows = result.rows as User[];
    return rows[0] || null;
  }

  async create(
    data: {
      tenant_id: string | null;
      email: string;
      password_hash: string;
      first_name?: string;
      last_name?: string;
      role?: UserRole;
    },
    client: PoolClientLike = pool
  ): Promise<User> {
    let role = data.role ?? 'manager';

    if (data.tenant_id) {
      const isFirstUser = await this.isFirstUserInTenant(data.tenant_id, client);
      if (isFirstUser) {
        role = 'owner';
      }
    }

    const result = await client.query(
      `INSERT INTO users (tenant_id, email, password_hash, first_name, last_name, role)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        data.tenant_id,
        data.email,
        data.password_hash,
        data.first_name || null,
        data.last_name || null,
        role,
      ]
    );
    return result.rows[0] as User;
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
    const result = await client.query(
      'SELECT * FROM users WHERE tenant_id = $1 ORDER BY created_at DESC',
      [tenantId]
    );
    return result.rows as User[];
  }

  async countByTenant(tenantId: string, client: PoolClientLike = pool): Promise<number> {
    const result = await client.query<{ count: string }>(
      'SELECT COUNT(*) as count FROM users WHERE tenant_id = $1',
      [tenantId]
    );
    return parseInt(result.rows[0].count, 10);
  }

  async isFirstUserInTenant(tenantId: string, client: PoolClientLike = pool): Promise<boolean> {
    const count = await this.countByTenant(tenantId, client);
    return count === 0;
  }
}
