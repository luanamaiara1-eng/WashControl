-- subscription_plan only ever had ('free', 'basic', 'pro') — "premium" is
-- used throughout the app (Super Admin's plan selector, saas_plans seed
-- data) but was never added to the underlying enum, so assigning it to a
-- subscription fails with "invalid input value for enum subscription_plan".
ALTER TYPE public.subscription_plan ADD VALUE IF NOT EXISTS 'premium';
