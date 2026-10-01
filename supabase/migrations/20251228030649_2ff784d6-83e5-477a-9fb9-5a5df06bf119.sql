-- Add primary color field to business_settings
ALTER TABLE public.business_settings 
ADD COLUMN IF NOT EXISTS primary_color text DEFAULT '#3b82f6';