CREATE TABLE IF NOT EXISTS public.whatsapp_instance_credentials (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  instance_name TEXT NOT NULL UNIQUE,
  instance_token TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.whatsapp_instance_credentials ENABLE ROW LEVEL SECURITY;

-- Intentionally no authenticated-user policies: this table is server-only.
-- The WhatsApp bridge accesses it with the Supabase service-role key.

DROP TRIGGER IF EXISTS whatsapp_instance_credentials_updated_at ON public.whatsapp_instance_credentials;
CREATE TRIGGER whatsapp_instance_credentials_updated_at
  BEFORE UPDATE ON public.whatsapp_instance_credentials
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.business_settings
  DROP COLUMN IF EXISTS evolution_instance_token;
