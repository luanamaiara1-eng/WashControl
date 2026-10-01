-- Add Instagram and website fields to business_settings
ALTER TABLE public.business_settings 
ADD COLUMN IF NOT EXISTS instagram text,
ADD COLUMN IF NOT EXISTS website text;