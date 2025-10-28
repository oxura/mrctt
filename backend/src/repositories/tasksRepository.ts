import { pool } from '../db/client';
import { AppError } from '../utils/appError';

export interface Task {
  id: string;
  tenant_id: string;
  lead_id: string | null;
  assigned_to: string | null;
  created_by: string | null;
  title: string;
  description: string | null;
  due_date: Date | null;
  is_completed: boolean;
  completed_at: Date | null;
  priority: string;
  created_at: Date;
  updated_at: Date;
  assigned_name?: string | null;
  created_name?: string | null;
}

export interface CreateTaskDto {
  lead_id?: string | null;
  assigned_to?: string | null;
  title: string;
  description?: string | null;
  due_date?: Date | string | null;
  priority?: string;
}

export interface UpdateTaskDto {
  assigned_to?: string | null;
  title?: string;
  description?: string | null;
  due_date?: Date | string | null;
  is_completed?: boolean;
  priority?: string;
}

export class TasksRepository {
  async create(tenantId: string, data: CreateTaskDto, userId: string): Promise<Task> {
    const query = `
      INSERT INTO tasks (
        tenant_id, lead_id, assigned_to, created_by,
        title, description, due_date, priority
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;

    const values = [
      tenantId,
      data.lead_id || null,
      data.assigned_to || null,
      userId,
      data.title,
      data.description || null,
      data.due_date || null,
      data.priority || 'medium',
    ];

    const result = await pool.query(query, values);
    return this.findById(tenantId, result.rows[0].id);
  }

  async getOwnerIdIfExists(tenantId: string, taskId: string): Promise<string | null> {
    const query = `
      SELECT assigned_to
      FROM tasks
      WHERE id = $1 AND tenant_id = $2
    `;

    const result = await pool.query(query, [taskId, tenantId]);

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0].assigned_to || null;
  }

  async findById(tenantId: string, taskId: string): Promise<Task> {
    const query = `
      SELECT
        t.*,
        CASE
          WHEN u1.first_name IS NOT NULL OR u1.last_name IS NOT NULL
          THEN COALESCE(u1.first_name || ' ' || u1.last_name, u1.first_name, u1.last_name)
          ELSE u1.email
        END AS assigned_name,
        CASE
          WHEN u2.first_name IS NOT NULL OR u2.last_name IS NOT NULL
          THEN COALESCE(u2.first_name || ' ' || u2.last_name, u2.first_name, u2.last_name)
          ELSE u2.email
        END AS created_name
      FROM tasks t
      LEFT JOIN users u1 ON t.assigned_to = u1.id
      LEFT JOIN users u2 ON t.created_by = u2.id
      WHERE t.id = $1 AND t.tenant_id = $2
    `;

    const result = await pool.query(query, [taskId, tenantId]);

    if (result.rows.length === 0) {
      throw new AppError('Task not found', 404);
    }

    return result.rows[0];
  }

  async findByLeadId(tenantId: string, leadId: string): Promise<Task[]> {
    const query = `
      SELECT
        t.*,
        CASE
          WHEN u1.first_name IS NOT NULL OR u1.last_name IS NOT NULL
          THEN COALESCE(u1.first_name || ' ' || u1.last_name, u1.first_name, u1.last_name)
          ELSE u1.email
        END AS assigned_name,
        CASE
          WHEN u2.first_name IS NOT NULL OR u2.last_name IS NOT NULL
          THEN COALESCE(u2.first_name || ' ' || u2.last_name, u2.first_name, u2.last_name)
          ELSE u2.email
        END AS created_name
      FROM tasks t
      LEFT JOIN users u1 ON t.assigned_to = u1.id
      LEFT JOIN users u2 ON t.created_by = u2.id
      WHERE t.lead_id = $1 AND t.tenant_id = $2
      ORDER BY
        CASE WHEN t.is_completed THEN 1 ELSE 0 END,
        t.due_date ASC NULLS LAST,
        t.created_at DESC
    `;

    const result = await pool.query(query, [leadId, tenantId]);
    return result.rows;
  }

  async update(tenantId: string, taskId: string, data: UpdateTaskDto): Promise<Task> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 0;

    if (data.title !== undefined) {
      paramCount++;
      fields.push(`title = $${paramCount}`);
      values.push(data.title);
    }

    if (data.description !== undefined) {
      paramCount++;
      fields.push(`description = $${paramCount}`);
      values.push(data.description);
    }

    if (data.assigned_to !== undefined) {
      paramCount++;
      fields.push(`assigned_to = $${paramCount}`);
      values.push(data.assigned_to);
    }

    if (data.due_date !== undefined) {
      paramCount++;
      fields.push(`due_date = $${paramCount}`);
      values.push(data.due_date);
    }

    if (data.priority !== undefined) {
      paramCount++;
      fields.push(`priority = $${paramCount}`);
      values.push(data.priority);
    }

    if (data.is_completed !== undefined) {
      paramCount++;
      fields.push(`is_completed = $${paramCount}`);
      values.push(data.is_completed);

      if (data.is_completed) {
        paramCount++;
        fields.push(`completed_at = $${paramCount}`);
        values.push(new Date());
      } else {
        paramCount++;
        fields.push(`completed_at = $${paramCount}`);
        values.push(null);
      }
    }

    if (fields.length === 0) {
      return this.findById(tenantId, taskId);
    }

    paramCount++;
    const taskIdParam = paramCount;
    paramCount++;
    const tenantIdParam = paramCount;

    const query = `
      UPDATE tasks
      SET ${fields.join(', ')}
      WHERE id = $${taskIdParam} AND tenant_id = $${tenantIdParam}
      RETURNING *
    `;

    await pool.query(query, [...values, taskId, tenantId]);
    return this.findById(tenantId, taskId);
  }

  async delete(tenantId: string, taskId: string): Promise<void> {
    const query = `
      DELETE FROM tasks
      WHERE id = $1 AND tenant_id = $2
    `;

    const result = await pool.query(query, [taskId, tenantId]);

    if (result.rowCount === 0) {
      throw new AppError('Task not found', 404);
    }
  }
}

export default new TasksRepository();
