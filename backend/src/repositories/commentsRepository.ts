import { pool } from '../db/client';
import { AppError } from '../utils/appError';

export interface Comment {
  id: string;
  tenant_id: string;
  lead_id: string;
  user_id: string;
  content: string;
  created_at: Date;
  user_name?: string | null;
  user_avatar?: string | null;
}

export interface CreateCommentDto {
  content: string;
}

export class CommentsRepository {
  async create(
    tenantId: string,
    leadId: string,
    userId: string,
    data: CreateCommentDto
  ): Promise<Comment> {
    const query = `
      INSERT INTO lead_comments (tenant_id, lead_id, user_id, content)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;

    const result = await pool.query(query, [tenantId, leadId, userId, data.content]);
    return this.findById(tenantId, result.rows[0].id);
  }

  async findById(tenantId: string, commentId: string): Promise<Comment> {
    const query = `
      SELECT
        lc.*,
        CASE
          WHEN u.first_name IS NOT NULL OR u.last_name IS NOT NULL
          THEN COALESCE(u.first_name || ' ' || u.last_name, u.first_name, u.last_name)
          ELSE u.email
        END AS user_name,
        u.avatar_url AS user_avatar
      FROM lead_comments lc
      LEFT JOIN users u ON lc.user_id = u.id
      WHERE lc.id = $1 AND lc.tenant_id = $2
    `;

    const result = await pool.query(query, [commentId, tenantId]);

    if (result.rows.length === 0) {
      throw new AppError('Comment not found', 404);
    }

    return result.rows[0];
  }

  async findByLeadId(tenantId: string, leadId: string): Promise<Comment[]> {
    const query = `
      SELECT
        lc.*,
        CASE
          WHEN u.first_name IS NOT NULL OR u.last_name IS NOT NULL
          THEN COALESCE(u.first_name || ' ' || u.last_name, u.first_name, u.last_name)
          ELSE u.email
        END AS user_name,
        u.avatar_url AS user_avatar
      FROM lead_comments lc
      LEFT JOIN users u ON lc.user_id = u.id
      WHERE lc.lead_id = $1 AND lc.tenant_id = $2
      ORDER BY lc.created_at DESC
    `;

    const result = await pool.query(query, [leadId, tenantId]);
    return result.rows;
  }
}

export default new CommentsRepository();
