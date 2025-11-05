import { pool, PoolClientLike } from '../db/client';
import { Subscription, SubscriptionPlan, SubscriptionStatus } from '../types/models';

type SubscriptionCreateInput = {
  tenant_id: string;
  plan_id: string;
  status?: SubscriptionStatus;
  current_period_start?: Date;
  current_period_end: Date;
  trial_ends_at?: Date | null;
};

type SubscriptionUpdateInput = {
  plan_id?: string;
  status?: SubscriptionStatus;
  current_period_start?: Date;
  current_period_end?: Date;
  trial_ends_at?: Date | null;
  cancelled_at?: Date | null;
};

export class SubscriptionRepository {
  async create(data: SubscriptionCreateInput, client: PoolClientLike = pool): Promise<Subscription> {
    const result = await client.query(
      `INSERT INTO subscriptions (tenant_id, plan_id, status, current_period_start, current_period_end, trial_ends_at)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        data.tenant_id,
        data.plan_id,
        data.status ?? 'active',
        data.current_period_start ?? new Date(),
        data.current_period_end,
        data.trial_ends_at ?? null,
      ]
    );

    return result.rows[0] as Subscription;
  }

  async findById(id: string, client: PoolClientLike = pool): Promise<Subscription | null> {
    const result = await client.query('SELECT * FROM subscriptions WHERE id = $1', [id]);
    const rows = result.rows as Subscription[];
    return rows[0] ?? null;
  }

  async findByTenantId(tenantId: string, client: PoolClientLike = pool): Promise<Subscription | null> {
    const result = await client.query(
      `SELECT s.*, 
        json_build_object(
          'id', sp.id,
          'name', sp.name,
          'description', sp.description,
          'price', sp.price,
          'currency', sp.currency,
          'billing_period', sp.billing_period,
          'features', sp.features,
          'is_active', sp.is_active,
          'created_at', sp.created_at,
          'updated_at', sp.updated_at
        ) as plan
       FROM subscriptions s
       LEFT JOIN subscription_plans sp ON s.plan_id = sp.id
       WHERE s.tenant_id = $1
       ORDER BY s.created_at DESC
       LIMIT 1`,
      [tenantId]
    );
    const rows = result.rows;
    return rows[0] ?? null;
  }

  async update(id: string, data: SubscriptionUpdateInput, client: PoolClientLike = pool): Promise<Subscription> {
    const fields: string[] = [];
    const values: unknown[] = [];

    const pushField = (column: string, value: unknown) => {
      values.push(value);
      fields.push(`${column} = $${values.length}`);
    };

    if (data.plan_id !== undefined) {
      pushField('plan_id', data.plan_id);
    }
    if (data.status !== undefined) {
      pushField('status', data.status);
    }
    if (data.current_period_start !== undefined) {
      pushField('current_period_start', data.current_period_start);
    }
    if (data.current_period_end !== undefined) {
      pushField('current_period_end', data.current_period_end);
    }
    if (data.trial_ends_at !== undefined) {
      pushField('trial_ends_at', data.trial_ends_at);
    }
    if (data.cancelled_at !== undefined) {
      pushField('cancelled_at', data.cancelled_at);
    }

    pushField('updated_at', new Date());

    if (fields.length === 1) {
      const existing = await this.findById(id, client);
      if (!existing) {
        throw new Error('Subscription not found');
      }
      return existing;
    }

    values.push(id);
    const query = `UPDATE subscriptions SET ${fields.join(', ')} WHERE id = $${values.length} RETURNING *`;

    const result = await client.query(query, values);

    if (result.rows.length === 0) {
      throw new Error('Subscription not found');
    }

    return result.rows[0] as Subscription;
  }

  async listAllPlans(client: PoolClientLike = pool): Promise<SubscriptionPlan[]> {
    const result = await client.query(
      'SELECT * FROM subscription_plans WHERE is_active = true ORDER BY price ASC'
    );
    return result.rows as SubscriptionPlan[];
  }

  async findPlanById(planId: string, client: PoolClientLike = pool): Promise<SubscriptionPlan | null> {
    const result = await client.query('SELECT * FROM subscription_plans WHERE id = $1', [planId]);
    const rows = result.rows as SubscriptionPlan[];
    return rows[0] ?? null;
  }

  async renewSubscription(tenantId: string, months: number = 1, client: PoolClientLike = pool): Promise<Subscription> {
    const subscription = await this.findByTenantId(tenantId, client);
    if (!subscription) {
      throw new Error('No subscription found for this tenant');
    }

    const now = new Date();
    const currentPeriodEnd = new Date(subscription.current_period_end);
    const newPeriodStart = currentPeriodEnd > now ? currentPeriodEnd : now;
    const newPeriodEnd = new Date(newPeriodStart);
    newPeriodEnd.setMonth(newPeriodEnd.getMonth() + months);

    return this.update(
      subscription.id,
      {
        status: 'active',
        current_period_start: newPeriodStart,
        current_period_end: newPeriodEnd,
      },
      client
    );
  }
}
