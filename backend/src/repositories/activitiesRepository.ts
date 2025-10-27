import { pool } from '../db/client';
import { AppError } from '../utils/appError';

export interface Activity {
  id: string;
  tenant_id: string;
  lead_id: string;
  user_id: string | null;
  activity_type: string;
  description: string | null;
  metadata: Record<string, any>;
  created_at: Date;
  user_name?: string | null;
  user_avatar?: string | null;
}

export interface CreateActivityInput {
  activity_type: string;
  description?: string | null;
  metadata?: Record<string, any>;
}

export class ActivitiesRepository {
  async findByLeadId(tenantId: string, leadId: string): Promise<Activity[]> {
    const query = `
      SELECT
        la.*,
        CASE
          WHEN u.first_name IS NOT NULL OR u.last_name IS NOT NULL
          THEN COALESCE(u.first_name || ' ' || u.last_name, u.first_name, u.last_name)
          ELSE u.email
        END AS user_name,
        u.avatar_url AS user_avatar
      FROM lead_activities la
      LEFT JOIN users u ON la.user_id = u.id
      WHERE la.lead_id = $1 AND la.tenant_id = $2
      ORDER BY la.created_at DESC
    `;

    const result = await pool.query(query, [leadId, tenantId]);
    return result.rows;
  }

  async findById(tenantId: string, activityId: string): Promise<Activity> {
    const query = `
      SELECT
        la.*,
        CASE
          WHEN u.first_name IS NOT NULL OR u.last_name IS NOT NULL
          THEN COALESCE(u.first_name || ' ' || u.last_name, u.first_name, u.last_name)
          ELSE u.email
        END AS user_name,
        u.avatar_url AS user_avatar
      FROM lead_activities la
      LEFT JOIN users u ON la.user_id = u.id
      WHERE la.id = $1 AND la.tenant_id = $2
    `;

    const result = await pool.query(query, [activityId, tenantId]);

    if (result.rows.length === 0) {
      throw new AppError('Activity not found', 404);
    }

    return result.rows[0];
  }

  async create(
    tenantId: string,
    leadId: string,
    userId: string | null,
    input: CreateActivityInput
  ): Promise<Activity> {
    const query = `
      INSERT INTO lead_activities (
        tenant_id,
        lead_id,
        user_id,
        activity_type,
        description,
        metadata
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id
    `;

    const result = await pool.query(query, [
      tenantId,
      leadId,
      userId,
      input.activity_type,
      input.description ?? null,
      JSON.stringify(input.metadata ?? {}),
    ]);

    return this.findById(tenantId, result.rows[0].id);
  }
}

export default new ActivitiesRepository();
