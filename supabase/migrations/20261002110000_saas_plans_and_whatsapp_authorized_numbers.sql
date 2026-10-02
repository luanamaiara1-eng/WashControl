-- SaaS plans and authorized WhatsApp numbers
CREATE TABLE IF NOT EXISTS public.saas_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  price_monthly NUMERIC(10,2) NOT NULL DEFAULT 0,
  price_yearly NUMERIC(10,2) NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  max_whatsapp_central INTEGER NOT NULL DEFAULT 1 CHECK (max_whatsapp_central >= 0),
  max_users INTEGER NOT NULL DEFAULT 1 CHECK (max_users >= 0),
  max_employees INTEGER NOT NULL DEFAULT 0 CHECK (max_employees >= 0),
  max_vehicles INTEGER NOT NULL DEFAULT 0 CHECK (max_vehicles >= 0),
  features JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.saas_plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage SaaS plans" ON public.saas_plans;
CREATE POLICY "Admins can manage SaaS plans"
  ON public.saas_plans FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
    )
  );

DROP TRIGGER IF EXISTS update_saas_plans_updated_at ON public.saas_plans;
CREATE TRIGGER update_saas_plans_updated_at
  BEFORE UPDATE ON public.saas_plans
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Keep the existing subscription table, but make the plan reference explicit.
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS plan_id UUID REFERENCES public.saas_plans(id) ON DELETE SET NULL;

-- Authorized numbers for the single WashControl central WhatsApp.
CREATE TABLE IF NOT EXISTS public.whatsapp_authorized_numbers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  phone TEXT NOT NULL,
  label TEXT,
  role TEXT NOT NULL DEFAULT 'owner',
  permissions JSONB NOT NULL DEFAULT '{"appointments":true,"clients":true,"vehicles":true,"finance":true,"employees":false,"settings":false}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, phone)
);

ALTER TABLE public.whatsapp_authorized_numbers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their authorized WhatsApps" ON public.whatsapp_authorized_numbers;
CREATE POLICY "Users can view their authorized WhatsApps"
  ON public.whatsapp_authorized_numbers FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their authorized WhatsApps" ON public.whatsapp_authorized_numbers;
CREATE POLICY "Users can create their authorized WhatsApps"
  ON public.whatsapp_authorized_numbers FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their authorized WhatsApps" ON public.whatsapp_authorized_numbers;
CREATE POLICY "Users can update their authorized WhatsApps"
  ON public.whatsapp_authorized_numbers FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their authorized WhatsApps" ON public.whatsapp_authorized_numbers;
CREATE POLICY "Users can delete their authorized WhatsApps"
  ON public.whatsapp_authorized_numbers FOR DELETE USING (auth.uid() = user_id);

DROP TRIGGER IF EXISTS update_whatsapp_authorized_numbers_updated_at ON public.whatsapp_authorized_numbers;
CREATE TRIGGER update_whatsapp_authorized_numbers_updated_at
  BEFORE UPDATE ON public.whatsapp_authorized_numbers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Initial plans. These are editable later from Super Admin.
INSERT INTO public.saas_plans
  (name, slug, description, price_monthly, price_yearly, max_whatsapp_central, max_users, max_employees, max_vehicles, features)
VALUES
  ('Básico', 'basic', 'Recursos essenciais para começar', 29.90, 299.00, 1, 2, 5, 500,
   '{"finance":true,"appointments":true,"public_booking":false,"customer_whatsapp_booking":false,"reminders":false,"automation":false}'::jsonb),
  ('Profissional', 'pro', 'Automação e atendimento ampliados', 59.90, 599.00, 3, 10, 20, 2000,
   '{"finance":true,"appointments":true,"public_booking":true,"customer_whatsapp_booking":true,"reminders":true,"automation":true}'::jsonb),
  ('Premium', 'premium', 'Todos os recursos e limites ampliados', 99.90, 999.00, 10, 50, 100, 10000,
   '{"finance":true,"appointments":true,"public_booking":true,"customer_whatsapp_booking":true,"reminders":true,"automation":true,"advanced_reports":true}'::jsonb)
ON CONFLICT (slug) DO NOTHING;

-- Link legacy subscriptions to the matching SaaS plan when possible.
UPDATE public.subscriptions s
SET plan_id = p.id
FROM public.saas_plans p
WHERE s.plan_id IS NULL
  AND s.plan::text = p.slug;
