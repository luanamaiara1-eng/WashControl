-- Stores the credentials for the one platform-wide WhatsApp number used to
-- receive commands from authorized owners (distinct from each business's
-- own number, used only to talk to their own clients). Lives alongside the
-- Evolution Go connection settings since it's also a Super Admin-only,
-- single-row concern.
ALTER TABLE public.evolution_settings
  ADD COLUMN IF NOT EXISTS central_instance_name TEXT,
  ADD COLUMN IF NOT EXISTS central_instance_token TEXT;
