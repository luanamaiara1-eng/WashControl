-- Create enum for business roles
CREATE TYPE public.business_role AS ENUM ('proprietario', 'funcionario');

-- Create table for employee accounts (linked to business owner)
CREATE TABLE public.employee_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_user_id UUID NOT NULL,
  employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE,
  access_code TEXT NOT NULL,
  role business_role NOT NULL DEFAULT 'funcionario',
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_login_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create unique index on access_code
CREATE UNIQUE INDEX employee_accounts_access_code_idx ON public.employee_accounts(access_code);

-- Enable RLS
ALTER TABLE public.employee_accounts ENABLE ROW LEVEL SECURITY;

-- RLS policies for employee_accounts
CREATE POLICY "Owners can view their employee accounts"
ON public.employee_accounts
FOR SELECT
USING (auth.uid() = owner_user_id);

CREATE POLICY "Owners can create employee accounts"
ON public.employee_accounts
FOR INSERT
WITH CHECK (auth.uid() = owner_user_id);

CREATE POLICY "Owners can update their employee accounts"
ON public.employee_accounts
FOR UPDATE
USING (auth.uid() = owner_user_id);

CREATE POLICY "Owners can delete their employee accounts"
ON public.employee_accounts
FOR DELETE
USING (auth.uid() = owner_user_id);

-- Function to generate unique access code
CREATE OR REPLACE FUNCTION public.generate_access_code()
RETURNS TEXT
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$;

-- Function to validate access code and return employee info
CREATE OR REPLACE FUNCTION public.validate_access_code(code TEXT)
RETURNS TABLE(
  employee_account_id UUID,
  owner_user_id UUID,
  employee_id UUID,
  employee_name TEXT,
  role business_role
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ea.id AS employee_account_id,
    ea.owner_user_id,
    ea.employee_id,
    e.name AS employee_name,
    ea.role
  FROM public.employee_accounts ea
  LEFT JOIN public.employees e ON e.id = ea.employee_id
  WHERE ea.access_code = UPPER(code)
    AND ea.is_active = true;
END;
$$;

-- Trigger for updated_at
CREATE TRIGGER update_employee_accounts_updated_at
BEFORE UPDATE ON public.employee_accounts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();