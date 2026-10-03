-- Onboarding inicial do WashControl
ALTER TABLE public.business_settings
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN public.business_settings.onboarding_completed IS
'Indica se o usuário concluiu ou dispensou o passo a passo inicial do WashControl.';
