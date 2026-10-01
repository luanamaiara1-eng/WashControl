-- Add custom footer message field to business_settings
ALTER TABLE public.business_settings 
ADD COLUMN IF NOT EXISTS note_footer_message text DEFAULT 'Obrigado pela preferência!';