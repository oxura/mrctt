import { Pool } from 'pg';
import { pool, PoolClientLike } from '../db/client';
import { AppError } from '../utils/appError';
import { Form, FormField } from '../types/models';
import crypto from 'crypto';

export interface CreateFormDto {
  name: string;
  product_id?: string | null;
  fields?: FormField[];
  success_message?: string | null;
}

export interface UpdateFormDto {
  name?: string;
  product_id?: string | null;
  fields?: FormField[];
  success_message?: string | null;
  is_active?: boolean;
}

export interface FormsFilter {
  product_id?: string;
  is_active?: boolean;
  search?: string;
  sort_by?: string;
  sort_direction?: 'asc' | 'desc';
  page?: number;
  page_size?: number;
}

export interface FormsListResult {
  forms: Form[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

const getDbClient = (client?: PoolClientLikeLike): PoolClientLike | Pool => client ?? pool;

class FormsRepository {
  private async generateUniquePublicUrl(client?: PoolClientLikeLike): Promise<string> {
    let token: string;
    // eslint-disable-next-line no-constant-condition
    while (true) {
      token = crypto.randomBytes(16).toString('hex');
      const exists = await this.publicUrlExists(token, client);
      if (!exists) {
        return token;
      }
    }
  }

  private async generateUniqueSlug(name: string, tenantId: string, client?: PoolClientLike): Promise<string> {
    const baseSlug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 80);

    // Ensure slug is not empty
    const normalizedBase = baseSlug.length > 0 ? baseSlug : 'form';

    // eslint-disable-next-line no-constant-condition
    while (true) {
      const slug = `${normalizedBase}-${crypto.randomBytes(4).toString('hex')}`;
      const exists = await this.slugExists(tenantId, slug, client);
      if (!exists) {
        return slug;
      }
    }
  }

  private async slugExists(tenantId: string, slug: string, client?: PoolClientLike): Promise<boolean> {
    const db = getDbClient(client);
    const result = await db.query<{ exists: boolean }>(
      'SELECT EXISTS (SELECT 1 FROM forms WHERE tenant_id = $1 AND slug = $2) AS exists',
      [tenantId, slug]
    );
    return result.rows[0]?.exists ?? false;
  }

  private async publicUrlExists(publicUrl: string, client?: PoolClientLike): Promise<boolean> {
    const db = getDbClient(client);
    const result = await db.query<{ exists: boolean }>(
      'SELECT EXISTS (SELECT 1 FROM forms WHERE public_url = $1) AS exists',
      [publicUrl]
    );
    return result.rows[0]?.exists ?? false;
  }

  async create(tenantId: string, data: CreateFormDto, client?: PoolClientLike): Promise<Form> {
    const db = getDbClient(client);
    const slug = await this.generateUniqueSlug(data.name, tenantId, client);
    const publicUrl = await this.generateUniquePublicUrl(client);

    const query = `
      INSERT INTO forms (
        tenant_id, product_id, name, slug, fields, success_message, public_url, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;

    const values = [
      tenantId,
      data.product_id || null,
      data.name,
      slug,
      JSON.stringify(data.fields || []),
      data.success_message || 'Спасибо! Мы свяжемся с вами в ближайшее время.',
      publicUrl,
      true,
    ];

    const result = await db.query<Form>(query, values);
    const form = result.rows[0];

    return {
      ...form,
      fields: typeof form.fields === 'string' ? JSON.parse(form.fields) : form.fields,
    };
  }

  async findById(tenantId: string, formId: string, client?: PoolClientLike): Promise<Form> {
    const db = getDbClient(client);
    const query = `
      SELECT *
      FROM forms
      WHERE id = $1 AND tenant_id = $2
    `;

    const result = await db.query<Form>(query, [formId, tenantId]);

    if (result.rows.length === 0) {
      throw new AppError('Form not found', 404);
    }

    const form = result.rows[0];
    return {
      ...form,
      fields: typeof form.fields === 'string' ? JSON.parse(form.fields) : form.fields,
    };
  }

  async findByPublicUrl(publicUrl: string, client?: PoolClientLike): Promise<Form> {
    const db = getDbClient(client);
    const query = `
      SELECT *
      FROM forms
      WHERE public_url = $1 AND is_active = true
    `;

    const result = await db.query<Form>(query, [publicUrl]);

    if (result.rows.length === 0) {
      throw new AppError('Form not found', 404);
    }

    const form = result.rows[0];
    return {
      ...form,
      fields: typeof form.fields === 'string' ? JSON.parse(form.fields) : form.fields,
    };
  }

  async findAll(tenantId: string, filters: FormsFilter, client?: PoolClientLike): Promise<FormsListResult> {
    const db = getDbClient(client);
    const conditions: string[] = ['tenant_id = $1'];
    const values: any[] = [tenantId];
    let paramCount = 1;

    if (filters.product_id) {
      paramCount++;
      conditions.push(`product_id = $${paramCount}`);
      values.push(filters.product_id);
    }

    if (filters.is_active !== undefined) {
      paramCount++;
      conditions.push(`is_active = $${paramCount}`);
      values.push(filters.is_active);
    }

    if (filters.search) {
      paramCount++;
      conditions.push(`name ILIKE $${paramCount}`);
      values.push(`%${filters.search}%`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countQuery = `
      SELECT COUNT(*) as total
      FROM forms
      ${whereClause}
    `;

    const countResult = await db.query<{ total: string }>(countQuery, values);
    const total = parseInt(countResult.rows[0].total, 10);

    const sortBy = filters.sort_by || 'created_at';
    const sortDirection = filters.sort_direction || 'desc';
    const allowedSortFields = ['created_at', 'updated_at', 'name'];
    const finalSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'created_at';

    const page = filters.page || 1;
    const pageSize = filters.page_size || 25;
    const offset = (page - 1) * pageSize;

    const dataQuery = `
      SELECT f.*, p.name as product_name
      FROM forms f
      LEFT JOIN products p ON f.product_id = p.id
      ${whereClause}
      ORDER BY f.${finalSortBy} ${sortDirection.toUpperCase()}
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `;

    values.push(pageSize, offset);

    const dataResult = await db.query<Form & { product_name: string | null }>(dataQuery, values);

    return {
      forms: dataResult.rows.map((form) => ({
        ...form,
        fields: typeof form.fields === 'string' ? JSON.parse(form.fields) : form.fields,
      })),
      total,
      page,
      page_size: pageSize,
      total_pages: Math.ceil(total / pageSize),
    };
  }

  async update(tenantId: string, formId: string, data: UpdateFormDto, client?: PoolClientLike): Promise<Form> {
    const db = getDbClient(client);
    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 0;

    if (data.name !== undefined) {
      paramCount++;
      fields.push(`name = $${paramCount}`);
      values.push(data.name);
    }

    if (data.product_id !== undefined) {
      paramCount++;
      fields.push(`product_id = $${paramCount}`);
      values.push(data.product_id);
    }

    if (data.fields !== undefined) {
      paramCount++;
      fields.push(`fields = $${paramCount}`);
      values.push(JSON.stringify(data.fields));
    }

    if (data.success_message !== undefined) {
      paramCount++;
      fields.push(`success_message = $${paramCount}`);
      values.push(data.success_message);
    }

    if (data.is_active !== undefined) {
      paramCount++;
      fields.push(`is_active = $${paramCount}`);
      values.push(data.is_active);
    }

    if (fields.length === 0) {
      return this.findById(tenantId, formId, client);
    }

    paramCount++;
    values.push(formId);
    paramCount++;
    values.push(tenantId);

    const query = `
      UPDATE forms
      SET ${fields.join(', ')}
      WHERE id = $${paramCount - 1} AND tenant_id = $${paramCount}
      RETURNING *
    `;

    const result = await db.query<Form>(query, values);

    if (result.rows.length === 0) {
      throw new AppError('Form not found', 404);
    }

    const form = result.rows[0];
    return {
      ...form,
      fields: typeof form.fields === 'string' ? JSON.parse(form.fields) : form.fields,
    };
  }

  async delete(tenantId: string, formId: string, client?: PoolClientLike): Promise<void> {
    const db = getDbClient(client);
    const query = `
      DELETE FROM forms
      WHERE id = $1 AND tenant_id = $2
    `;

    const result = await db.query(query, [formId, tenantId]);

    if (result.rowCount === 0) {
      throw new AppError('Form not found', 404);
    }
  }

  async regeneratePublicUrl(tenantId: string, formId: string, client?: PoolClientLike): Promise<Form> {
    const db = getDbClient(client);
    const publicUrl = await this.generateUniquePublicUrl(client);

    const query = `
      UPDATE forms
      SET public_url = $1
      WHERE id = $2 AND tenant_id = $3
      RETURNING *
    `;

    const result = await db.query<Form>(query, [publicUrl, formId, tenantId]);

    if (result.rows.length === 0) {
      throw new AppError('Form not found', 404);
    }

    const form = result.rows[0];
    return {
      ...form,
      fields: typeof form.fields === 'string' ? JSON.parse(form.fields) : form.fields,
    };
  }
}

export default new FormsRepository();
