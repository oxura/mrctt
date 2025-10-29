import { pool, PoolClientLike } from '../db/client';
import { UserRole } from '../types/models';

export type TeamMemberStatus = 'active' | 'invited' | 'inactive';

export interface TeamMember {
  id: string;
  tenant_id: string;
  user_id: string;
  role: Exclude<UserRole, 'platform_owner'>;
  status: TeamMemberStatus;
  invited_by?: string | null;
  invited_at?: string | null;
  joined_at?: string | null;
  created_at: string;
  updated_at: string;
}

export class TeamMemberRepository {
  async create(
    data: {
      tenant_id: string;
      user_id: string;
      role: Exclude<UserRole, 'platform_owner'>;
      status?: TeamMemberStatus;
      invited_by?: string | null;
      invited_at?: Date | null;
      joined_at?: Date | null;
    },
    client: PoolClientLike = pool
  ): Promise<TeamMember> {
    const result = await client.query(
      `INSERT INTO team_members (tenant_id, user_id, role, status, invited_by, invited_at, joined_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        data.tenant_id,
        data.user_id,
        data.role,
        data.status || 'active',
        data.invited_by || null,
        data.invited_at || null,
        data.joined_at || new Date(),
      ]
    );

    return result.rows[0] as TeamMember;
  }

  async findByUserId(tenantId: string, userId: string, client: PoolClientLike = pool): Promise<TeamMember | null> {
    const result = await client.query(
      'SELECT * FROM team_members WHERE tenant_id = $1 AND user_id = $2',
      [tenantId, userId]
    );
    return result.rows[0] || null;
  }

  async listByTenant(tenantId: string, client: PoolClientLike = pool): Promise<TeamMember[]> {
    const result = await client.query(
      'SELECT * FROM team_members WHERE tenant_id = $1 ORDER BY created_at DESC',
      [tenantId]
    );
    return result.rows as TeamMember[];
  }

  async updateRole(
    tenantId: string,
    userId: string,
    role: Exclude<UserRole, 'platform_owner'>,
    client: PoolClientLike = pool
  ): Promise<TeamMember | null> {
    const result = await client.query(
      `UPDATE team_members
       SET role = $3,
           updated_at = CURRENT_TIMESTAMP
       WHERE tenant_id = $1 AND user_id = $2
       RETURNING *`,
      [tenantId, userId, role]
    );

    return result.rows[0] || null;
  }

  async updateStatus(
    tenantId: string,
    userId: string,
    status: TeamMemberStatus,
    client: PoolClientLike = pool
  ): Promise<void> {
    await client.query(
      `UPDATE team_members
       SET status = $3,
           updated_at = CURRENT_TIMESTAMP
       WHERE tenant_id = $1 AND user_id = $2`,
      [tenantId, userId, status]
    );
  }

  async delete(tenantId: string, userId: string, client: PoolClientLike = pool): Promise<void> {
    await client.query('DELETE FROM team_members WHERE tenant_id = $1 AND user_id = $2', [tenantId, userId]);
  }
}
