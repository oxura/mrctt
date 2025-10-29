import { pool, PoolClientLike } from '../db/client';

export interface TeamInvite {
  id: string;
  tenant_id: string;
  email: string;
  role: 'admin' | 'manager';
  token: string;
  created_by: string;
  expires_at: string;
  accepted_at?: string | null;
  created_at: string;
}

export class TeamInviteRepository {
  async create(
    data: {
      tenant_id: string;
      email: string;
      role: 'admin' | 'manager';
      token: string;
      created_by: string;
      expires_at: Date;
    },
    client: PoolClientLike = pool
  ): Promise<TeamInvite> {
    const result = await client.query(
      `INSERT INTO team_invites (tenant_id, email, role, token, created_by, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (tenant_id, email) 
       DO UPDATE SET 
         token = EXCLUDED.token,
         role = EXCLUDED.role,
         created_by = EXCLUDED.created_by,
         expires_at = EXCLUDED.expires_at,
         created_at = CURRENT_TIMESTAMP,
         accepted_at = NULL
       RETURNING *`,
      [data.tenant_id, data.email, data.role, data.token, data.created_by, data.expires_at]
    );
    return result.rows[0] as TeamInvite;
  }

  async findByToken(token: string, client: PoolClientLike = pool): Promise<TeamInvite | null> {
    const result = await client.query(
      'SELECT * FROM team_invites WHERE token = $1',
      [token]
    );
    return result.rows[0] || null;
  }

  async findByEmail(email: string, tenantId: string, client: PoolClientLike = pool): Promise<TeamInvite | null> {
    const result = await client.query(
      'SELECT * FROM team_invites WHERE lower(email) = lower($1) AND tenant_id = $2',
      [email, tenantId]
    );
    return result.rows[0] || null;
  }

  async markAsAccepted(token: string, client: PoolClientLike = pool): Promise<void> {
    await client.query(
      'UPDATE team_invites SET accepted_at = CURRENT_TIMESTAMP WHERE token = $1',
      [token]
    );
  }

  async delete(id: string, client: PoolClientLike = pool): Promise<void> {
    await client.query('DELETE FROM team_invites WHERE id = $1', [id]);
  }

  async deleteByEmail(email: string, tenantId: string, client: PoolClientLike = pool): Promise<void> {
    await client.query(
      'DELETE FROM team_invites WHERE lower(email) = lower($1) AND tenant_id = $2',
      [email, tenantId]
    );
  }

  async listByTenant(tenantId: string, client: PoolClientLike = pool): Promise<TeamInvite[]> {
    const result = await client.query(
      'SELECT * FROM team_invites WHERE tenant_id = $1 AND accepted_at IS NULL ORDER BY created_at DESC',
      [tenantId]
    );
    return result.rows as TeamInvite[];
  }
}
