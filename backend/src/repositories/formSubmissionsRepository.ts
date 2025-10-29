import { pool } from '../db/client';
import { AppError } from '../utils/appError';

export interface FormSubmission {
  id: string;
  tenant_id: string;
  form_id: string;
  lead_id: string | null;
  data: Record<string, any>;
  ip_address: string | null;
  user_agent: string | null;
  created_at: Date;
}

export interface CreateFormSubmissionDto {
  form_id: string;
  lead_id: string | null;
  data: Record<string, any>;
  ip_address: string | null;
  user_agent: string | null;
}

export class FormSubmissionsRepository {
  async create(tenantId: string, dto: CreateFormSubmissionDto): Promise<FormSubmission> {
    const query = `
      INSERT INTO form_submissions (
        tenant_id,
        form_id,
        lead_id,
        data,
        ip_address,
        user_agent
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;

    const result = await pool.query(query, [
      tenantId,
      dto.form_id,
      dto.lead_id,
      JSON.stringify(dto.data),
      dto.ip_address,
      dto.user_agent,
    ]);

    return result.rows[0];
  }

  async findById(tenantId: string, id: string): Promise<FormSubmission> {
    const query = `
      SELECT * FROM form_submissions
      WHERE id = $1 AND tenant_id = $2
    `;

    const result = await pool.query(query, [id, tenantId]);

    if (result.rows.length === 0) {
      throw new AppError('Form submission not found', 404);
    }

    return result.rows[0];
  }

  async findByFormId(
    tenantId: string,
    formId: string,
    limit = 50,
    offset = 0
  ): Promise<{ submissions: FormSubmission[]; total: number }> {
    const countQuery = `
      SELECT COUNT(*) as total
      FROM form_submissions
      WHERE form_id = $1 AND tenant_id = $2
    `;

    const dataQuery = `
      SELECT *
      FROM form_submissions
      WHERE form_id = $1 AND tenant_id = $2
      ORDER BY created_at DESC
      LIMIT $3 OFFSET $4
    `;

    const [countResult, dataResult] = await Promise.all([
      pool.query(countQuery, [formId, tenantId]),
      pool.query(dataQuery, [formId, tenantId, limit, offset]),
    ]);

    return {
      submissions: dataResult.rows,
      total: parseInt(countResult.rows[0].total, 10),
    };
  }
}

export default new FormSubmissionsRepository();
