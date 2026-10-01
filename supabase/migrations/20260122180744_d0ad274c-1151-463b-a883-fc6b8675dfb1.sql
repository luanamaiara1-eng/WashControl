-- Add client_id to accounts_receivable for linking debts to clients
ALTER TABLE public.accounts_receivable 
ADD COLUMN client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL;

-- Create index for faster lookups
CREATE INDEX idx_accounts_receivable_client_id ON public.accounts_receivable(client_id);

-- Create table for client prepaid packages
CREATE TABLE public.client_packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  service_id uuid REFERENCES public.services(id) ON DELETE SET NULL,
  package_name text NOT NULL,
  total_credits integer NOT NULL,
  used_credits integer NOT NULL DEFAULT 0,
  price_paid numeric NOT NULL,
  purchased_at timestamp with time zone DEFAULT now(),
  expires_at date,
  is_active boolean DEFAULT true,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create table for package usage history
CREATE TABLE public.package_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id uuid NOT NULL REFERENCES public.client_packages(id) ON DELETE CASCADE,
  appointment_id uuid REFERENCES public.appointments(id) ON DELETE SET NULL,
  used_at timestamp with time zone DEFAULT now(),
  notes text
);

-- Enable RLS on client_packages
ALTER TABLE public.client_packages ENABLE ROW LEVEL SECURITY;

-- RLS policies for client_packages
CREATE POLICY "Users can view their own packages"
ON public.client_packages FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own packages"
ON public.client_packages FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own packages"
ON public.client_packages FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own packages"
ON public.client_packages FOR DELETE
USING (auth.uid() = user_id);

-- Enable RLS on package_usage
ALTER TABLE public.package_usage ENABLE ROW LEVEL SECURITY;

-- RLS policies for package_usage (through package ownership)
CREATE POLICY "Users can view usage of their packages"
ON public.package_usage FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.client_packages cp 
  WHERE cp.id = package_usage.package_id 
  AND cp.user_id = auth.uid()
));

CREATE POLICY "Users can create usage for their packages"
ON public.package_usage FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.client_packages cp 
  WHERE cp.id = package_usage.package_id 
  AND cp.user_id = auth.uid()
));

CREATE POLICY "Users can delete usage of their packages"
ON public.package_usage FOR DELETE
USING (EXISTS (
  SELECT 1 FROM public.client_packages cp 
  WHERE cp.id = package_usage.package_id 
  AND cp.user_id = auth.uid()
));

-- Create triggers for updated_at
CREATE TRIGGER update_client_packages_updated_at
BEFORE UPDATE ON public.client_packages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();