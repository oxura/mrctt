import { pool, PoolClientLike } from '../db/client';
import { Payment, PaymentStatus } from '../types/models';

type PaymentCreateInput = {
  tenant_id: string;
  subscription_id?: string | null;
  amount: number;
  currency?: string;
  status?: PaymentStatus;
  payment_method?: string | null;
  transaction_id?: string | null;
  invoice_url?: string | null;
  description?: string | null;
  paid_at?: Date | null;
};

export class PaymentRepository {
  async create(data: PaymentCreateInput, client: PoolClientLike = pool): Promise<Payment> {
    const result = await client.query(
      `INSERT INTO payments (tenant_id, subscription_id, amount, currency, status, payment_method, transaction_id, invoice_url, description, paid_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        data.tenant_id,
        data.subscription_id ?? null,
        data.amount,
        data.currency ?? 'USD',
        data.status ?? 'pending',
        data.payment_method ?? null,
        data.transaction_id ?? null,
        data.invoice_url ?? null,
        data.description ?? null,
        data.paid_at ?? null,
      ]
    );

    return result.rows[0] as Payment;
  }

  async listByTenant(tenantId: string, client: PoolClientLike = pool): Promise<Payment[]> {
    const result = await client.query(
      `SELECT * FROM payments
       WHERE tenant_id = $1
       ORDER BY created_at DESC`,
      [tenantId]
    );

    return result.rows as Payment[];
  }
}
