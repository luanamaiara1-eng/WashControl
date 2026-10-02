-- SaaS foundation: dynamic plans and authorized WhatsApp numbers
CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  price_monthly NUMERIC(10,2) NOT NULL DEFAULT 0,
  price_yearly NUMERIC(10,2) NOT NULL DEFAULT 0,
  max_central_whatsapp INTEGER NOT NULL DEFAULT 1 CHECK (max_central_whatsapp >= 0),
  max_users INTEGER NOT NULL DEFAULT 1 CHECK (max_users >= 0),
  max_employees INTEGER NOT NULL DEFAULT 0 CHECK (max_employees >= 0),
  max_vehicles INTEGER NOT NULL DEFAULT 0 CHECK (max_vehicles >= 0),
  features JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view active subscription plans" ON public.subscription_plans;
CREATE POLICY "Authenticated users can view active subscription plans"
  ON public.subscription_plans FOR SELECT
  TO authenticated
  USING (is_active = true OR EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = (SELECT auth.uid()) AND role = 'admin'
  ));

DROP POLICY IF EXISTS "Admins can insert subscription plans" ON public.subscription_plans;
CREATE POLICY "Admins can insert subscription plans"
  ON public.subscription_plans FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = (SELECT auth.uid()) AND role = 'admin'
  ));

DROP POLICY IF EXISTS "Admins can update subscription plans" ON public.subscription_plans;
CREATE POLICY "Admins can update subscription plans"
  ON public.subscription_plans FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = (SELECT auth.uid()) AND role = 'admin'
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = (SELECT auth.uid()) AND role = 'admin'
  ));

DROP POLICY IF EXISTS "Admins can delete subscription plans" ON public.subscription_plans;
CREATE POLICY "Admins can delete subscription plans"
  ON public.subscription_plans FOR DELETE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = (SELECT auth.uid()) AND role = 'admin'
  ));

INSERT INTO public.subscription_plans
  (code, name, description, price_monthly, price_yearly, max_central_whatsapp, max_users, max_employees, max_vehicles, features, sort_order)
VALUES
  ('free', 'Gratuito', 'Plano inicial para testes', 0, 0, 1, 1, 2, 50,
   '{"agenda":true,"financeiro":true,"whatsapp_central":true,"whatsapp_cliente":false,"lembretes":false,"automacoes":false,"public_booking":false}'::jsonb, 0),
  ('basic', 'Básico', 'Essencial para pequenas empresas', 0, 0, 2, 3, 5, 500,
   '{"agenda":true,"financeiro":true,"whatsapp_central":true,"whatsapp_cliente":false,"lembretes":false,"automacoes":false,"public_booking":true}'::jsonb, 1),
  ('pro', 'Profissional', 'Recursos avançados para empresas em crescimento', 0, 0, 5, 10, 20, 5000,
   '{"agenda":true,"financeiro":true,"whatsapp_central":true,"whatsapp_cliente":true,"lembretes":true,"automacoes":true,"public_booking":true}'::jsonb, 2)
ON CONFLICT (code) DO NOTHING;

ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS plan_id UUID REFERENCES public.subscription_plans(id) ON DELETE SET NULL;

UPDATE public.subscriptions s
SET plan_id = p.id
FROM public.subscription_plans p
WHERE s.plan_id IS NULL AND p.code = s.plan::text;

CREATE INDEX IF NOT EXISTS subscriptions_plan_id_idx
  ON public.subscriptions(plan_id);

CREATE TABLE IF NOT EXISTS public.whatsapp_authorized_numbers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  phone TEXT NOT NULL,
  label TEXT,
  role TEXT NOT NULL DEFAULT 'owner' CHECK (role IN ('owner','manager','employee')),
  permissions JSONB NOT NULL DEFAULT '{"agenda":true,"cadastro":true,"financeiro":true}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(phone)
);

CREATE INDEX IF NOT EXISTS whatsapp_authorized_numbers_user_idx
  ON public.whatsapp_authorized_numbers(user_id);

ALTER TABLE public.whatsapp_authorized_numbers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their authorized WhatsApp numbers" ON public.whatsapp_authorized_numbers;
CREATE POLICY "Users can view their authorized WhatsApp numbers"
  ON public.whatsapp_authorized_numbers FOR SELECT
  TO authenticated
  USING (
    user_id = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = (SELECT auth.uid()) AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Users can add their authorized WhatsApp numbers" ON public.whatsapp_authorized_numbers;
CREATE POLICY "Users can add their authorized WhatsApp numbers"
  ON public.whatsapp_authorized_numbers FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = (SELECT auth.uid()) AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Users can update their authorized WhatsApp numbers" ON public.whatsapp_authorized_numbers;
CREATE POLICY "Users can update their authorized WhatsApp numbers"
  ON public.whatsapp_authorized_numbers FOR UPDATE
  TO authenticated
  USING (
    user_id = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = (SELECT auth.uid()) AND role = 'admin'
    )
  )
  WITH CHECK (
    user_id = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = (SELECT auth.uid()) AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Users can delete their authorized WhatsApp numbers" ON public.whatsapp_authorized_numbers;
CREATE POLICY "Users can delete their authorized WhatsApp numbers"
  ON public.whatsapp_authorized_numbers FOR DELETE
  TO authenticated
  USING (
    user_id = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = (SELECT auth.uid()) AND role = 'admin'
    )
  );

CREATE OR REPLACE FUNCTION public.enforce_central_whatsapp_limit()
RETURNS TRIGGER AS $$
DECLARE
  v_limit INTEGER;
  v_current INTEGER;
BEGIN
  SELECT sp.max_central_whatsapp
    INTO v_limit
  FROM public.subscriptions s
  JOIN public.subscription_plans sp ON sp.id = s.plan_id
  WHERE s.user_id = NEW.user_id
    AND s.status IN ('active','trial')
  ORDER BY s.updated_at DESC
  LIMIT 1;

  IF v_limit IS NULL THEN
    v_limit := 1;
  END IF;

  SELECT COUNT(*) INTO v_current
  FROM public.whatsapp_authorized_numbers
  WHERE user_id = NEW.user_id
    AND is_active = true
    AND (TG_OP <> 'UPDATE' OR id <> NEW.id);

  IF v_current >= v_limit AND NEW.is_active THEN
    RAISE EXCEPTION 'Limite de WhatsApps da Central atingido para o plano atual (%).', v_limit;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS enforce_central_whatsapp_limit_trigger ON public.whatsapp_authorized_numbers;
CREATE TRIGGER enforce_central_whatsapp_limit_trigger
  BEFORE INSERT OR UPDATE ON public.whatsapp_authorized_numbers
  FOR EACH ROW EXECUTE FUNCTION public.enforce_central_whatsapp_limit();

CREATE OR REPLACE FUNCTION public.update_subscription_plans_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS subscription_plans_updated_at ON public.subscription_plans;
CREATE TRIGGER subscription_plans_updated_at
  BEFORE UPDATE ON public.subscription_plans
  FOR EACH ROW EXECUTE FUNCTION public.update_subscription_plans_updated_at();

DROP TRIGGER IF EXISTS whatsapp_authorized_numbers_updated_at ON public.whatsapp_authorized_numbers;
CREATE TRIGGER whatsapp_authorized_numbers_updated_at
  BEFORE UPDATE ON public.whatsapp_authorized_numbers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
