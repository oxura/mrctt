import { pool, PoolClientLike } from '../db/client';
import { Tenant } from '../types/models';

export class TenantRepository {
  async create(
    data: {
      name: string;
      slug: string;
      country?: string | null;
      city?: string | null;
      industry?: string | null;
      settings?: Record<string, unknown>;
    },
    client: PoolClientLike = pool
  ): Promise<Tenant> {
    const result = await client.query(
      `INSERT INTO tenants (name, slug, country, city, industry, settings)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        data.name,
        data.slug,
        data.country || null,
        data.city || null,
        data.industry || null,
        data.settings || {},
      ]
    );

    return result.rows[0] as Tenant;
  }

  async findById(tenantId: string, client: PoolClientLike = pool): Promise<Tenant | null> {
    const result = await client.query('SELECT * FROM tenants WHERE id = $1', [tenantId]);
    const rows = result.rows as Tenant[];
    return rows[0] || null;
  }

  async findBySlug(slug: string, client: PoolClientLike = pool): Promise<Tenant | null> {
    const result = await client.query('SELECT * FROM tenants WHERE lower(slug) = lower($1)', [slug]);
    const rows = result.rows as Tenant[];
    return rows[0] || null;
  }

  async listAll(client: PoolClientLike = pool): Promise<Tenant[]> {
    const result = await client.query('SELECT * FROM tenants ORDER BY created_at DESC');
    return result.rows as Tenant[];
  }

  async update(
    tenantId: string,
    data: {
      name?: string;
      logo_url?: string | null;
      country?: string | null;
      city?: string | null;
      industry?: string | null;
      settings?: Record<string, unknown>;
    },
    client: PoolClientLike = pool
  ): Promise<Tenant> {
    const fields: string[] = [];
    const values: (string | null | Record<string, unknown>)[] = [];
    let paramIndex = 1;

    if (data.name !== undefined) {
      fields.push(`name = $${paramIndex++}`);
      values.push(data.name);
    }
    if (data.logo_url !== undefined) {
      fields.push(`logo_url = $${paramIndex++}`);
      values.push(data.logo_url);
    }
    if (data.country !== undefined) {
      fields.push(`country = $${paramIndex++}`);
      values.push(data.country);
    }
    if (data.city !== undefined) {
      fields.push(`city = $${paramIndex++}`);
      values.push(data.city);
    }
    if (data.industry !== undefined) {
      fields.push(`industry = $${paramIndex++}`);
      values.push(data.industry);
    }
    if (data.settings !== undefined) {
      fields.push(`settings = $${paramIndex++}`);
      values.push(data.settings);
    }

    if (fields.length === 0) {
      const existing = await this.findById(tenantId, client);
      if (!existing) {
        throw new Error('Tenant not found');
      }
      return existing;
    }

    values.push(tenantId);
    const query = `UPDATE tenants SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`;

    const result = await client.query(query, values);

    if (result.rows.length === 0) {
      throw new Error('Tenant not found');
    }

    return result.rows[0] as Tenant;
  }
}
