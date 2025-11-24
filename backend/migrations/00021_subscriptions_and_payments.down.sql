BEGIN;

DROP POLICY IF EXISTS payments_tenant_isolation ON payments;
DROP POLICY IF EXISTS subscriptions_tenant_isolation ON subscriptions;
DROP POLICY IF EXISTS subscription_plans_public_read ON subscription_plans;

DROP TABLE IF EXISTS payments;
DROP TABLE IF EXISTS subscriptions;
DROP TABLE IF EXISTS subscription_plans;

COMMIT;
