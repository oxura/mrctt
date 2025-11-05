import { SubscriptionRepository } from '../repositories/subscriptionRepository';
import { PaymentRepository } from '../repositories/paymentRepository';
import { TenantRepository } from '../repositories/tenantRepository';
import { Subscription, SubscriptionPlan, Payment } from '../types/models';

export class BillingService {
  private subscriptionRepo: SubscriptionRepository;
  private paymentRepo: PaymentRepository;
  private tenantRepo: TenantRepository;

  constructor() {
    this.subscriptionRepo = new SubscriptionRepository();
    this.paymentRepo = new PaymentRepository();
    this.tenantRepo = new TenantRepository();
  }

  async getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    return this.subscriptionRepo.listAllPlans();
  }

  async getCurrentSubscription(tenantId: string): Promise<Subscription | null> {
    return this.subscriptionRepo.findByTenantId(tenantId);
  }

  async getPaymentHistory(tenantId: string): Promise<Payment[]> {
    return this.paymentRepo.listByTenant(tenantId);
  }

  async createPayment(tenantId: string, data: {
    subscriptionId?: string;
    amount: number;
    planId: string;
    paymentMethod?: string;
  }): Promise<Payment> {
    const plan = await this.subscriptionRepo.findPlanById(data.planId);
    if (!plan) {
      throw new Error('Invalid subscription plan');
    }

    const payment = await this.paymentRepo.create({
      tenant_id: tenantId,
      subscription_id: data.subscriptionId ?? null,
      amount: data.amount,
      currency: plan.currency,
      status: 'completed',
      payment_method: data.paymentMethod ?? 'manual',
      transaction_id: `TXN-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
      description: `Payment for ${plan.name} plan`,
      paid_at: new Date(),
    });

    return payment;
  }

  private async updateTenantSubscriptionMetadata(
    tenantId: string,
    status: string,
    expiresAt: Date
  ): Promise<void> {
    await this.tenantRepo.update(tenantId, {
      subscription_status: status,
      subscription_expires_at: expiresAt.toISOString(),
    });
  }

  async changePlan(tenantId: string, planId: string): Promise<Subscription> {
    const plan = await this.subscriptionRepo.findPlanById(planId);
    if (!plan) {
      throw new Error('Invalid subscription plan');
    }

    const existingSubscription = await this.subscriptionRepo.findByTenantId(tenantId);

    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setMonth(periodEnd.getMonth() + (plan.billing_period === 'yearly' ? 12 : 1));

    let subscription: Subscription;

    if (existingSubscription) {
      subscription = await this.subscriptionRepo.update(existingSubscription.id, {
        plan_id: planId,
        status: 'active',
        current_period_start: now,
        current_period_end: periodEnd,
      });
    } else {
      subscription = await this.subscriptionRepo.create({
        tenant_id: tenantId,
        plan_id: planId,
        status: 'active',
        current_period_start: now,
        current_period_end: periodEnd,
      });
    }

    await this.updateTenantSubscriptionMetadata(tenantId, 'active', periodEnd);

    return subscription;
  }

  async renewSubscription(tenantId: string, months: number = 1): Promise<Subscription> {
    const subscription = await this.subscriptionRepo.renewSubscription(tenantId, months);
    const newExpiry = new Date(subscription.current_period_end);
    await this.updateTenantSubscriptionMetadata(tenantId, subscription.status, newExpiry);
    return subscription;
  }

  async cancelSubscription(tenantId: string): Promise<Subscription> {
    const subscription = await this.subscriptionRepo.findByTenantId(tenantId);
    if (!subscription) {
      throw new Error('No active subscription found');
    }

    const updated = await this.subscriptionRepo.update(subscription.id, {
      status: 'cancelled',
      cancelled_at: new Date(),
    });

    await this.updateTenantSubscriptionMetadata(tenantId, 'cancelled', new Date(updated.current_period_end));

    return updated;
  }
}
