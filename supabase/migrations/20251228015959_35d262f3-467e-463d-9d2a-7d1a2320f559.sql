-- Add employee_id column to transactions table
ALTER TABLE public.transactions 
ADD COLUMN employee_id UUID REFERENCES public.employees(id) ON DELETE SET NULL;