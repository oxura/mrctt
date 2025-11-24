-- Migration: Add subscriptions and payments tables for billing
-- Created at 2024-01-01

BEGIN;

-- Plans table (predefined subscription plans)
CREATE TABLE subscription_plans (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'USD',
  billing_period VARCHAR(20) NOT NULL CHECK (billing_period IN ('monthly', 'yearly')),
  features JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Subscriptions table (tenant subscriptions)
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  plan_id VARCHAR(50) NOT NULL REFERENCES subscription_plans(id),
  status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('trial', 'active', 'cancelled', 'expired', 'past_due')),
  current_period_start TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  current_period_end TIMESTAMP NOT NULL,
  trial_ends_at TIMESTAMP,
  cancelled_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(tenant_id, id)
);

-- Payments table (payment history)
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'USD',
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  payment_method VARCHAR(50),
  transaction_id VARCHAR(255),
  invoice_url TEXT,
  description TEXT,
  paid_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for better query performance
CREATE INDEX idx_subscriptions_tenant_id ON subscriptions(tenant_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_period_end ON subscriptions(current_period_end);
CREATE INDEX idx_payments_tenant_id ON payments(tenant_id);
CREATE INDEX idx_payments_subscription_id ON payments(subscription_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_created_at ON payments(created_at DESC);

-- Enable RLS on new tables
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- RLS policies for subscription_plans (public read)
CREATE POLICY subscription_plans_public_read ON subscription_plans
  FOR SELECT
  USING (is_active = true);

-- RLS policies for subscriptions (tenant isolation)
CREATE POLICY subscriptions_tenant_isolation ON subscriptions
  FOR ALL
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

-- RLS policies for payments (tenant isolation)
CREATE POLICY payments_tenant_isolation ON payments
  FOR ALL
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

-- Insert default subscription plans
INSERT INTO subscription_plans (id, name, description, price, currency, billing_period, features, is_active) VALUES
  ('free', 'Free', 'For individuals just getting started', 0.00, 'USD', 'monthly', 
   '["Up to 100 leads", "1 user", "Basic CRM features", "Email support"]'::jsonb, true),
  ('starter', 'Starter', 'For small teams', 29.00, 'USD', 'monthly', 
   '["Up to 1,000 leads", "Up to 3 users", "All CRM features", "Email & chat support", "Custom forms", "Basic analytics"]'::jsonb, true),
  ('pro', 'Pro', 'For growing businesses', 99.00, 'USD', 'monthly', 
   '["Up to 10,000 leads", "Up to 10 users", "All CRM features", "Priority support", "Advanced analytics", "API access", "Custom integrations"]'::jsonb, true),
  ('enterprise', 'Enterprise', 'For large organizations', 299.00, 'USD', 'monthly', 
   '["Unlimited leads", "Unlimited users", "All features", "Dedicated support", "Custom development", "SLA", "Advanced security"]'::jsonb, true);

COMMIT;
