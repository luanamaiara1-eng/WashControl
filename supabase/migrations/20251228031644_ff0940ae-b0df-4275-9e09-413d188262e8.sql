-- Add WhatsApp field to business_settings
ALTER TABLE public.business_settings 
ADD COLUMN IF NOT EXISTS whatsapp text;