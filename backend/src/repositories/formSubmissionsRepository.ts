import { pool, PoolClientLike } from '../db/client';

export interface CreateFormSubmissionDto {
  tenant_id: string;
  form_id: string;
  lead_id: string | null;
  data: Record<string, any>;
  ip_address?: string | null;
  user_agent?: string | null;
}

export class FormSubmissionsRepository {
  async create(data: CreateFormSubmissionDto, client?: PoolClientLike): Promise<void> {
    const db = client || pool;

    const query = `
      INSERT INTO form_submissions (
        tenant_id, form_id, lead_id, data, ip_address, user_agent
      ) VALUES ($1, $2, $3, $4, $5, $6)
    `;

    const values = [
      data.tenant_id,
      data.form_id,
      data.lead_id,
      JSON.stringify(data.data),
      data.ip_address || null,
      data.user_agent || null,
    ];

    await db.query(query, values);
  }
}

export default new FormSubmissionsRepository();
