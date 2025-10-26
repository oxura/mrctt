import { pool, PoolClientLike } from '../db/client';
import { Tenant } from '../types/models';

type TenantCreateInput = {
  name: string;
  slug: string;
  country?: string | null;
  city?: string | null;
  industry?: string | null;
  settings?: Record<string, unknown>;
};

type TenantUpdateInput = {
  name?: string;
  slug?: string;
  logo_url?: string | null;
  country?: string | null;
  city?: string | null;
  industry?: string | null;
  settings?: Record<string, unknown>;
};

export class TenantRepository {
  async create(data: TenantCreateInput, client: PoolClientLike = pool): Promise<Tenant> {
    const result = await client.query(
      `INSERT INTO tenants (name, slug, country, city, industry, settings)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        data.name,
        data.slug,
        data.country ?? null,
        data.city ?? null,
        data.industry ?? null,
        data.settings ?? {},
      ]
    );

    return result.rows[0] as Tenant;
  }

  async findById(tenantId: string, client: PoolClientLike = pool): Promise<Tenant | null> {
    const result = await client.query('SELECT * FROM tenants WHERE id = $1', [tenantId]);
    const rows = result.rows as Tenant[];
    return rows[0] ?? null;
  }

  async findBySlug(slug: string, client: PoolClientLike = pool): Promise<Tenant | null> {
    const result = await client.query('SELECT * FROM tenants WHERE lower(slug) = lower($1)', [slug]);
    const rows = result.rows as Tenant[];
    return rows[0] ?? null;
  }

  async listAll(client: PoolClientLike = pool): Promise<Tenant[]> {
    const result = await client.query('SELECT * FROM tenants ORDER BY created_at DESC');
    return result.rows as Tenant[];
  }

  async update(tenantId: string, data: TenantUpdateInput, client: PoolClientLike = pool): Promise<Tenant> {
    const fields: string[] = [];
    const values: (string | null | Record<string, unknown>)[] = [];

    const pushField = (column: string, value: string | null | Record<string, unknown>) => {
      values.push(value);
      fields.push(`${column} = $${values.length}`);
    };

    if (data.name !== undefined) {
      pushField('name', data.name);
    }
    if (data.slug !== undefined) {
      pushField('slug', data.slug);
    }
    if (data.logo_url !== undefined) {
      pushField('logo_url', data.logo_url);
    }
    if (data.country !== undefined) {
      pushField('country', data.country);
    }
    if (data.city !== undefined) {
      pushField('city', data.city);
    }
    if (data.industry !== undefined) {
      pushField('industry', data.industry);
    }
    if (data.settings !== undefined) {
      pushField('settings', data.settings);
    }

    if (fields.length === 0) {
      const existing = await this.findById(tenantId, client);
      if (!existing) {
        throw new Error('Tenant not found');
      }
      return existing;
    }

    values.push(tenantId);
    const query = `UPDATE tenants SET ${fields.join(', ')} WHERE id = $${values.length} RETURNING *`;

    const result = await client.query(query, values);

    if (result.rows.length === 0) {
      throw new Error('Tenant not found');
    }

    return result.rows[0] as Tenant;
  }
}
