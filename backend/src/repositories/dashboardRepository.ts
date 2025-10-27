import { pool } from '../db/client';

interface LeadsStats {
  today: number;
  yesterday: number;
  percentChange: number;
}

interface SalesStats {
  totalAmount: number;
  currency: string;
}

interface OverdueTasksCount {
  count: number;
}

interface ActiveDealsCount {
  count: number;
}

interface LeadsChartData {
  date: string;
  count: number;
}

interface ActivityItem {
  id: string;
  type: string;
  description: string;
  actor_name: string;
  created_at: Date;
  lead_id: string | null;
}

interface Task {
  id: string;
  title: string;
  description: string | null;
  due_date: Date;
  is_completed: boolean;
  lead_id: string | null;
  lead_name: string | null;
}

export class DashboardRepository {
  async getNewLeadsStats(tenantId: string): Promise<LeadsStats> {
    const query = `
      SELECT
        COUNT(CASE WHEN DATE(created_at) = CURRENT_DATE THEN 1 END)::int AS today,
        COUNT(CASE WHEN DATE(created_at) = CURRENT_DATE - INTERVAL '1 day' THEN 1 END)::int AS yesterday
      FROM leads
      WHERE tenant_id = $1
    `;

    const result = await pool.query(query, [tenantId]);
    const row = result.rows[0];

    const today = row.today || 0;
    const yesterday = row.yesterday || 0;

    let percentChange = 0;
    if (yesterday === 0) {
      percentChange = today > 0 ? 100 : 0;
    } else {
      percentChange = ((today - yesterday) / yesterday) * 100;
    }

    return {
      today,
      yesterday,
      percentChange: Math.round(percentChange * 10) / 10,
    };
  }

  async getActiveDealsCount(tenantId: string): Promise<ActiveDealsCount> {
    const query = `
      SELECT COUNT(*)::int AS count
      FROM leads
      WHERE tenant_id = $1
        AND status NOT IN ('success', 'rejected', 'cancelled')
    `;

    const result = await pool.query(query, [tenantId]);
    return { count: result.rows[0].count || 0 };
  }

  async getSalesStats(tenantId: string): Promise<SalesStats> {
    // Get tenant currency
    const tenantQuery = `SELECT currency FROM tenants WHERE id = $1`;
    const tenantResult = await pool.query(tenantQuery, [tenantId]);
    const currency = tenantResult.rows[0]?.currency || 'USD';

    // For now, we'll calculate from leads marked as 'success' with products
    // In the future, this should come from a payments/orders table
    const query = `
      SELECT COALESCE(SUM(p.price), 0)::numeric AS total_amount
      FROM leads l
      LEFT JOIN products p ON l.product_id = p.id
      WHERE l.tenant_id = $1
        AND l.status = 'success'
        AND DATE_TRUNC('month', l.updated_at) = DATE_TRUNC('month', CURRENT_DATE)
    `;

    const result = await pool.query(query, [tenantId]);
    return {
      totalAmount: parseFloat(result.rows[0].total_amount) || 0,
      currency,
    };
  }

  async getOverdueTasksCount(tenantId: string): Promise<OverdueTasksCount> {
    const query = `
      SELECT COUNT(*)::int AS count
      FROM tasks
      WHERE tenant_id = $1
        AND is_completed = false
        AND due_date < CURRENT_TIMESTAMP
    `;

    const result = await pool.query(query, [tenantId]);
    return { count: result.rows[0].count || 0 };
  }

  async getLeadsChartData(tenantId: string, days: number = 30): Promise<LeadsChartData[]> {
    const query = `
      WITH date_series AS (
        SELECT generate_series(
          CURRENT_DATE - $2 * INTERVAL '1 day',
          CURRENT_DATE,
          '1 day'::interval
        )::date AS date
      )
      SELECT
        ds.date::text AS date,
        COALESCE(COUNT(l.id)::int, 0) AS count
      FROM date_series ds
      LEFT JOIN leads l ON DATE(l.created_at) = ds.date AND l.tenant_id = $1
      GROUP BY ds.date
      ORDER BY ds.date
    `;

    const result = await pool.query(query, [tenantId, days - 1]);
    return result.rows;
  }

  async getActivityFeed(tenantId: string, limit: number = 10): Promise<ActivityItem[]> {
    const query = `
      SELECT
        la.id,
        la.activity_type AS type,
        la.description,
        COALESCE(u.first_name || ' ' || u.last_name, 'Система') AS actor_name,
        la.created_at,
        la.lead_id
      FROM lead_activities la
      LEFT JOIN users u ON la.user_id = u.id
      WHERE la.tenant_id = $1
      ORDER BY la.created_at DESC
      LIMIT $2
    `;

    const result = await pool.query(query, [tenantId, limit]);
    return result.rows;
  }

  async getMyTasksToday(tenantId: string, userId: string): Promise<Task[]> {
    const query = `
      SELECT
        t.id,
        t.title,
        t.description,
        t.due_date,
        t.is_completed,
        t.lead_id,
        CASE
          WHEN l.first_name IS NOT NULL OR l.last_name IS NOT NULL
          THEN COALESCE(l.first_name || ' ' || l.last_name, l.first_name, l.last_name)
          ELSE NULL
        END AS lead_name
      FROM tasks t
      LEFT JOIN leads l ON t.lead_id = l.id
      WHERE t.tenant_id = $1
        AND t.assigned_to = $2
        AND DATE(t.due_date) = CURRENT_DATE
      ORDER BY t.is_completed ASC, t.due_date ASC
    `;

    const result = await pool.query(query, [tenantId, userId]);
    return result.rows;
  }

  async updateTaskCompletion(taskId: string, tenantId: string, isCompleted: boolean): Promise<void> {
    const query = `
      UPDATE tasks
      SET
        is_completed = $1,
        completed_at = CASE WHEN $1 = true THEN CURRENT_TIMESTAMP ELSE NULL END
      WHERE id = $2 AND tenant_id = $3
    `;

    await pool.query(query, [isCompleted, taskId, tenantId]);
  }
}

export default new DashboardRepository();
