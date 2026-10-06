-- Global Evolution Go connection settings, editable from Super Admin instead
-- of requiring a VPS/.env edit. Single-row table (id is always `true`).
CREATE TABLE IF NOT EXISTS public.evolution_settings (
  id BOOLEAN PRIMARY KEY DEFAULT true CHECK (id = true),
  base_url TEXT NOT NULL,
  api_key TEXT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.evolution_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage Evolution settings" ON public.evolution_settings;
CREATE POLICY "Admins can manage Evolution settings"
  ON public.evolution_settings FOR ALL
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

DROP TRIGGER IF EXISTS update_evolution_settings_updated_at ON public.evolution_settings;
CREATE TRIGGER update_evolution_settings_updated_at
  BEFORE UPDATE ON public.evolution_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
