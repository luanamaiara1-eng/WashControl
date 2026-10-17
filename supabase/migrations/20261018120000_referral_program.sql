-- Referral program ("Indique e Ganhe"): every business gets a unique code
-- and link, clicks are tracked even before signup, and a commission
-- (percent, first-payment or recurring, set by Super Admin) is owed once a
-- referred business becomes a paying customer. Payment itself happens
-- manually via Pix outside the system; Super Admin marks it paid and
-- attaches the receipt here.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS referred_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  candidate TEXT;
BEGIN
  LOOP
    candidate := upper(substr(md5(random()::text || clock_timestamp()::text), 1, 8));
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.profiles WHERE referral_code = candidate);
  END LOOP;
  RETURN candidate;
END;
$$;

-- Backfill codes for any profile created before this migration.
UPDATE public.profiles SET referral_code = public.generate_referral_code() WHERE referral_code IS NULL;

-- Give every new profile a referral code, and link it to its referrer when
-- the signup carried one (passed as raw_user_meta_data.ref_code via
-- supabase.auth.signUp's options.data).
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  ref_code TEXT;
  referrer_id UUID;
BEGIN
  ref_code := NEW.raw_user_meta_data ->> 'ref_code';
  IF ref_code IS NOT NULL AND ref_code <> '' THEN
    SELECT id INTO referrer_id FROM public.profiles WHERE referral_code = upper(ref_code) LIMIT 1;
  END IF;

  INSERT INTO public.profiles (id, email, business_name, referral_code, referred_by)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data ->> 'business_name', public.generate_referral_code(), referrer_id);

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');

  INSERT INTO public.subscriptions (user_id, plan, status)
  VALUES (NEW.id, 'free', 'active');

  RETURN NEW;
END;
$$;

-- Platform-wide settings (Super Admin only writes; any signed-in user can
-- read, so the referrer's own dashboard can show the current rate).
CREATE TABLE IF NOT EXISTS public.referral_settings (
  id BOOLEAN PRIMARY KEY DEFAULT true CHECK (id = true),
  commission_percent NUMERIC(5,2) NOT NULL DEFAULT 10,
  commission_mode TEXT NOT NULL DEFAULT 'first_payment' CHECK (commission_mode IN ('first_payment', 'recurring')),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.referral_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage referral settings" ON public.referral_settings;
CREATE POLICY "Admins can manage referral settings"
  ON public.referral_settings FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Signed-in users can read referral settings" ON public.referral_settings;
CREATE POLICY "Signed-in users can read referral settings"
  ON public.referral_settings FOR SELECT TO authenticated USING (true);

INSERT INTO public.referral_settings (id) VALUES (true) ON CONFLICT (id) DO NOTHING;

DROP TRIGGER IF EXISTS update_referral_settings_updated_at ON public.referral_settings;
CREATE TRIGGER update_referral_settings_updated_at
  BEFORE UPDATE ON public.referral_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Click tracking — logged the moment someone lands on a referral link,
-- before they necessarily sign up. No PII, write-only for the public.
CREATE TABLE IF NOT EXISTS public.referral_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.referral_clicks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can log a referral click" ON public.referral_clicks;
CREATE POLICY "Anyone can log a referral click"
  ON public.referral_clicks FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Owners and admins can view referral clicks" ON public.referral_clicks;
CREATE POLICY "Owners and admins can view referral clicks"
  ON public.referral_clicks FOR SELECT
  USING (referrer_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS idx_referral_clicks_referrer ON public.referral_clicks(referrer_id);

-- Bank/Pix details each referrer fills in themselves to receive payment.
CREATE TABLE IF NOT EXISTS public.referral_payout_info (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  cpf_cnpj TEXT NOT NULL,
  pix_key_type TEXT NOT NULL CHECK (pix_key_type IN ('cpf', 'cnpj', 'email', 'phone', 'random')),
  pix_key TEXT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.referral_payout_info ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage their own payout info" ON public.referral_payout_info;
CREATE POLICY "Users manage their own payout info"
  ON public.referral_payout_info FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins can view all payout info" ON public.referral_payout_info;
CREATE POLICY "Admins can view all payout info"
  ON public.referral_payout_info FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

DROP TRIGGER IF EXISTS update_referral_payout_info_updated_at ON public.referral_payout_info;
CREATE TRIGGER update_referral_payout_info_updated_at
  BEFORE UPDATE ON public.referral_payout_info
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Commission ledger. "period" is 'first' for one-time commissions or a
-- 'YYYY-MM' tag for recurring ones, and the unique constraint keeps a
-- given referral from ever being double-paid for the same period even if
-- Super Admin records a renewal twice.
CREATE TABLE IF NOT EXISTS public.referral_earnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  referred_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  base_amount NUMERIC(10,2) NOT NULL,
  commission_percent NUMERIC(5,2) NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  period TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid')),
  proof_url TEXT,
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (referred_user_id, period)
);
ALTER TABLE public.referral_earnings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Referrers can view their own earnings" ON public.referral_earnings;
CREATE POLICY "Referrers can view their own earnings"
  ON public.referral_earnings FOR SELECT
  USING (referrer_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can manage earnings" ON public.referral_earnings;
CREATE POLICY "Admins can manage earnings"
  ON public.referral_earnings FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Referrers themselves never write earnings directly (only Super Admin's
-- client, which passes the admin RLS check above, and the one app flow
-- that creates them runs under an admin session) — but the insert needs
-- to succeed from an authenticated admin session, which "Admins can
-- manage earnings" already covers via its WITH CHECK.

CREATE INDEX IF NOT EXISTS idx_referral_earnings_referrer ON public.referral_earnings(referrer_id);

-- Storage for Pix payment receipts — Super Admin only, private bucket.
INSERT INTO storage.buckets (id, name, public)
VALUES ('referral-proofs', 'referral-proofs', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Admins can manage referral proof files" ON storage.objects;
CREATE POLICY "Admins can manage referral proof files"
  ON storage.objects FOR ALL
  USING (bucket_id = 'referral-proofs' AND public.has_role(auth.uid(), 'admin'))
  WITH CHECK (bucket_id = 'referral-proofs' AND public.has_role(auth.uid(), 'admin'));
