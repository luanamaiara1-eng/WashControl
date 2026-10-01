-- Add column to control employee commission display
ALTER TABLE public.business_settings
ADD COLUMN show_employee_commission BOOLEAN NOT NULL DEFAULT true;