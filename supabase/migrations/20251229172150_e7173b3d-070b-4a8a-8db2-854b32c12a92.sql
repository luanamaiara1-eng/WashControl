-- Add column to control if employees can see service values
ALTER TABLE public.business_settings 
ADD COLUMN IF NOT EXISTS show_service_values_to_employees BOOLEAN NOT NULL DEFAULT false;