import { pool } from '../db/client';
import { AppError } from '../utils/appError';

export interface Lead {
  id: string;
  tenant_id: string;
  product_id: string | null;
  group_id: string | null;
  assigned_to: string | null;
  status: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  source: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  custom_fields: Record<string, any>;
  created_at: Date;
  updated_at: Date;
  product_name?: string | null;
  group_name?: string | null;
  assigned_name?: string | null;
}

export interface CreateLeadDto {
  product_id?: string | null;
  group_id?: string | null;
  assigned_to?: string | null;
  status?: string;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  phone?: string | null;
  source?: string | null;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  custom_fields?: unknown;
}

export interface UpdateLeadDto {
  product_id?: string | null;
  group_id?: string | null;
  assigned_to?: string | null;
  status?: string;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  phone?: string | null;
  source?: string | null;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  custom_fields?: unknown;
}

export interface LeadsFilter {
  status?: string;
  assigned_to?: string;
  product_id?: string;
  search?: string;
  sort_by?: string;
  sort_direction?: 'asc' | 'desc';
  page?: number;
  page_size?: number;
}

export interface LeadsListResult {
  leads: Lead[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export class LeadsRepository {
  async create(tenantId: string, data: CreateLeadDto, userId?: string): Promise<Lead> {
    const query = `
      INSERT INTO leads (
        tenant_id, product_id, group_id, assigned_to, status,
        first_name, last_name, email, phone, source,
        utm_source, utm_medium, utm_campaign, custom_fields
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *
    `;

    let customFieldsJson: string;
    try {
      customFieldsJson = JSON.stringify(data.custom_fields || {});
    } catch (error) {
      throw new AppError('Invalid custom_fields: cannot serialize to JSON', 400);
    }

    const values = [
      tenantId,
      data.product_id || null,
      data.group_id || null,
      data.assigned_to || null,
      data.status || 'new',
      data.first_name || null,
      data.last_name || null,
      data.email || null,
      data.phone || null,
      data.source || null,
      data.utm_source || null,
      data.utm_medium || null,
      data.utm_campaign || null,
      customFieldsJson,
    ];

    const result = await pool.query(query, values);
    const lead = result.rows[0];

    if (userId) {
      await this.logActivity(
        tenantId,
        lead.id,
        userId,
        'lead_created',
        'Лид создан'
      );
    }

    return this.findById(tenantId, lead.id);
  }

  async getOwnerIdIfExists(tenantId: string, leadId: string): Promise<string | null> {
    const query = `
      SELECT assigned_to
      FROM leads
      WHERE id = $1 AND tenant_id = $2
    `;

    const result = await pool.query(query, [leadId, tenantId]);

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0].assigned_to || null;
  }

  async findById(tenantId: string, leadId: string): Promise<Lead> {
    const query = `
      SELECT
        l.*,
        p.name AS product_name,
        g.name AS group_name,
        CASE
          WHEN u.first_name IS NOT NULL OR u.last_name IS NOT NULL
          THEN COALESCE(u.first_name || ' ' || u.last_name, u.first_name, u.last_name)
          ELSE NULL
        END AS assigned_name
      FROM leads l
      LEFT JOIN products p ON l.product_id = p.id
      LEFT JOIN groups g ON l.group_id = g.id
      LEFT JOIN users u ON l.assigned_to = u.id
      WHERE l.id = $1 AND l.tenant_id = $2
    `;

    const result = await pool.query(query, [leadId, tenantId]);

    if (result.rows.length === 0) {
      throw new AppError('Lead not found', 404);
    }

    return result.rows[0];
  }

  async findAll(tenantId: string, filters: LeadsFilter): Promise<LeadsListResult> {
    const {
      status,
      assigned_to,
      product_id,
      search,
      sort_by = 'created_at',
      sort_direction = 'desc',
      page = 1,
      page_size = 25,
    } = filters;

    const resolveSortColumn = (column: string): string => {
      switch (column) {
        case 'updated_at':
          return 'l.updated_at';
        case 'status':
          return 'l.status';
        case 'first_name':
          return 'l.first_name';
        case 'last_name':
          return 'l.last_name';
        default:
          return 'l.created_at';
      }
    };

    const resolvedSortColumn = resolveSortColumn(sort_by);
    const resolvedSortDirection = sort_direction === 'asc' ? 'ASC' : 'DESC';
    const pageSize = Math.min(page_size, 100);

    const conditions: string[] = ['l.tenant_id = $1'];
    const values: any[] = [tenantId];
    let paramCount = 1;

    if (status) {
      paramCount++;
      conditions.push('l.status = $' + paramCount);
      values.push(status);
    }

    if (assigned_to) {
      paramCount++;
      conditions.push('l.assigned_to = $' + paramCount);
      values.push(assigned_to);
    }

    if (product_id) {
      paramCount++;
      conditions.push('l.product_id = $' + paramCount);
      values.push(product_id);
    }

    if (search) {
      paramCount++;
      const searchParam = '$' + paramCount;
      conditions.push('(' +
        'l.first_name ILIKE ' + searchParam + ' OR ' +
        'l.last_name ILIKE ' + searchParam + ' OR ' +
        'l.email ILIKE ' + searchParam + ' OR ' +
        'l.phone ILIKE ' + searchParam + ' OR ' +
        'p.name ILIKE ' + searchParam +
      ')');
      values.push(`%${search}%`);
    }

    const whereClause = conditions.join(' AND ');

    const countQuery = `
      SELECT COUNT(*)::int AS total
      FROM leads l
      LEFT JOIN products p ON l.product_id = p.id
      WHERE ${whereClause}
    `;
    const countResult = await pool.query(countQuery, values);
    const total = countResult.rows[0].total;

    const offset = (page - 1) * pageSize;

    const dataValues = [...values];
    const limitParamIndex = dataValues.push(pageSize);
    const offsetParamIndex = dataValues.push(offset);

    const dataQuery = `
      SELECT
        l.*,
        p.name AS product_name,
        g.name AS group_name,
        CASE
          WHEN u.first_name IS NOT NULL OR u.last_name IS NOT NULL
          THEN COALESCE(u.first_name || ' ' || u.last_name, u.first_name, u.last_name)
          ELSE NULL
        END AS assigned_name
      FROM leads l
      LEFT JOIN products p ON l.product_id = p.id
      LEFT JOIN groups g ON l.group_id = g.id
      LEFT JOIN users u ON l.assigned_to = u.id
      WHERE ${whereClause}
      ORDER BY ${resolvedSortColumn} ${resolvedSortDirection}
      LIMIT $${limitParamIndex} OFFSET $${offsetParamIndex}
    `;

    const dataResult = await pool.query(dataQuery, dataValues);

    return {
      leads: dataResult.rows,
      total,
      page,
      page_size: pageSize,
      total_pages: Math.ceil(total / pageSize),
    };
  }

  async update(
    tenantId: string,
    leadId: string,
    data: UpdateLeadDto,
    userId?: string
  ): Promise<Lead> {
    const oldLead = await this.findById(tenantId, leadId);

    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 0;

    if (data.product_id !== undefined) {
      paramCount++;
      fields.push(`product_id = $${paramCount}`);
      values.push(data.product_id);
    }

    if (data.group_id !== undefined) {
      paramCount++;
      fields.push(`group_id = $${paramCount}`);
      values.push(data.group_id);
    }

    if (data.assigned_to !== undefined) {
      paramCount++;
      fields.push(`assigned_to = $${paramCount}`);
      values.push(data.assigned_to);
    }

    if (data.status !== undefined) {
      paramCount++;
      fields.push(`status = $${paramCount}`);
      values.push(data.status);
    }

    if (data.first_name !== undefined) {
      paramCount++;
      fields.push(`first_name = $${paramCount}`);
      values.push(data.first_name);
    }

    if (data.last_name !== undefined) {
      paramCount++;
      fields.push(`last_name = $${paramCount}`);
      values.push(data.last_name);
    }

    if (data.email !== undefined) {
      paramCount++;
      fields.push(`email = $${paramCount}`);
      values.push(data.email);
    }

    if (data.phone !== undefined) {
      paramCount++;
      fields.push(`phone = $${paramCount}`);
      values.push(data.phone);
    }

    if (data.source !== undefined) {
      paramCount++;
      fields.push(`source = $${paramCount}`);
      values.push(data.source);
    }

    if (data.utm_source !== undefined) {
      paramCount++;
      fields.push(`utm_source = $${paramCount}`);
      values.push(data.utm_source);
    }

    if (data.utm_medium !== undefined) {
      paramCount++;
      fields.push(`utm_medium = $${paramCount}`);
      values.push(data.utm_medium);
    }

    if (data.utm_campaign !== undefined) {
      paramCount++;
      fields.push(`utm_campaign = $${paramCount}`);
      values.push(data.utm_campaign);
    }

    if (data.custom_fields !== undefined) {
      paramCount++;
      fields.push(`custom_fields = $${paramCount}`);
      try {
        values.push(JSON.stringify(data.custom_fields));
      } catch (error) {
        throw new AppError('Invalid custom_fields: cannot serialize to JSON', 400);
      }
    }

    if (fields.length === 0) {
      return oldLead;
    }

    paramCount++;
    const leadIdParam = paramCount;
    paramCount++;
    const tenantIdParam = paramCount;

    const query = `
      UPDATE leads
      SET ${fields.join(', ')}
      WHERE id = $${leadIdParam} AND tenant_id = $${tenantIdParam}
      RETURNING *
    `;

    await pool.query(query, [...values, leadId, tenantId]);

    if (userId) {
      const changes: string[] = [];
      if (data.status !== undefined && data.status !== oldLead.status) {
        changes.push(`статус изменен на "${data.status}"`);
      }
      if (data.assigned_to !== undefined && data.assigned_to !== oldLead.assigned_to) {
        changes.push('изменен ответственный');
      }

      if (changes.length > 0) {
        await this.logActivity(
          tenantId,
          leadId,
          userId,
          'lead_updated',
          `Лид обновлен: ${changes.join(', ')}`
        );
      }
    }

    return this.findById(tenantId, leadId);
  }

  async updateStatus(
    tenantId: string,
    leadId: string,
    status: string,
    userId?: string
  ): Promise<Lead> {
    const oldLead = await this.findById(tenantId, leadId);

    const query = `
      UPDATE leads
      SET status = $1
      WHERE id = $2 AND tenant_id = $3
      RETURNING *
    `;

    await pool.query(query, [status, leadId, tenantId]);

    if (userId) {
      await this.logActivity(
        tenantId,
        leadId,
        userId,
        'status_changed',
        `Статус изменен: ${oldLead.status} → ${status}`
      );
    }

    return this.findById(tenantId, leadId);
  }

  async delete(tenantId: string, leadId: string, userId?: string): Promise<void> {
    if (userId) {
      await this.logActivity(tenantId, leadId, userId, 'lead_deleted', 'Лид удален');
    }

    const query = `
      DELETE FROM leads
      WHERE id = $1 AND tenant_id = $2
    `;

    const result = await pool.query(query, [leadId, tenantId]);

    if (result.rowCount === 0) {
      throw new AppError('Lead not found', 404);
    }
  }

  private async logActivity(
    tenantId: string,
    leadId: string,
    userId: string,
    activityType: string,
    description: string
  ): Promise<void> {
    const query = `
      INSERT INTO lead_activities (tenant_id, lead_id, user_id, activity_type, description)
      VALUES ($1, $2, $3, $4, $5)
    `;

    await pool.query(query, [tenantId, leadId, userId, activityType, description]);
  }
}

export default new LeadsRepository();
