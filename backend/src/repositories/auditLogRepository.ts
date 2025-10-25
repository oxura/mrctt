import { pool, PoolClientLike } from '../db/client';

export interface CreateAuditLogInput {
  tenantId?: string | null;
  userId?: string | null;
  action: string;
  resourceType: string;
  resourceId?: string | null;
  details?: Record<string, unknown> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export interface AuditLog {
  id: string;
  tenant_id: string | null;
  user_id: string | null;
  action: string;
  resource_type: string;
  resource_id: string | null;
  details: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export class AuditLogRepository {
  async create(input: CreateAuditLogInput, client: PoolClientLike = pool): Promise<void> {
    await client.query(
      `INSERT INTO audit_logs (
        tenant_id,
        user_id,
        action,
        resource_type,
        resource_id,
        details,
        ip_address,
        user_agent
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        input.tenantId ?? null,
        input.userId ?? null,
        input.action,
        input.resourceType,
        input.resourceId ?? null,
        input.details ?? {},
        input.ipAddress ?? null,
        input.userAgent ?? null,
      ]
    );
  }

  async listByTenant(
    tenantId: string,
    limit = 50,
    offset = 0,
    client: PoolClientLike = pool
  ): Promise<AuditLog[]> {
    const result = await client.query<AuditLog>(
      `SELECT * FROM audit_logs
       WHERE tenant_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [tenantId, limit, offset]
    );

    return result.rows;
  }
}
