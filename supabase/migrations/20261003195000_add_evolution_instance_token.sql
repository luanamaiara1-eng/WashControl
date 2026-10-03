ALTER TABLE public.business_settings
  ADD COLUMN IF NOT EXISTS evolution_instance_token TEXT;

COMMENT ON COLUMN public.business_settings.evolution_instance_token IS
  'Private Evolution Go token for this WashControl instance. Never expose to the frontend.';
