-- Add slug and public booking settings to business_settings
ALTER TABLE public.business_settings
ADD COLUMN IF NOT EXISTS public_booking_slug TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS public_booking_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS min_advance_hours INTEGER DEFAULT 2,
ADD COLUMN IF NOT EXISTS max_advance_days INTEGER DEFAULT 7,
ADD COLUMN IF NOT EXISTS allow_client_cancellation BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS cancellation_limit_hours INTEGER DEFAULT 2,
ADD COLUMN IF NOT EXISTS max_simultaneous_vehicles INTEGER DEFAULT 3,
ADD COLUMN IF NOT EXISTS service_interval_minutes INTEGER DEFAULT 15;

-- Add source and cancel_token to appointments table
ALTER TABLE public.appointments
ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'internal',
ADD COLUMN IF NOT EXISTS cancel_token TEXT UNIQUE;

-- Create index for slug lookups
CREATE INDEX IF NOT EXISTS idx_business_settings_slug ON public.business_settings(public_booking_slug);

-- Create index for cancel token lookups
CREATE INDEX IF NOT EXISTS idx_appointments_cancel_token ON public.appointments(cancel_token);

-- Function to generate unique slug from business name
CREATE OR REPLACE FUNCTION public.generate_slug(input_text TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  slug TEXT;
  counter INTEGER := 0;
  final_slug TEXT;
BEGIN
  -- Convert to lowercase, replace spaces with hyphens, remove special chars
  slug := lower(regexp_replace(
    regexp_replace(input_text, '[^a-zA-Z0-9\s-]', '', 'g'),
    '\s+', '-', 'g'
  ));
  
  -- Remove leading/trailing hyphens
  slug := trim(both '-' from slug);
  
  final_slug := slug;
  
  -- Check for uniqueness and add counter if needed
  WHILE EXISTS (SELECT 1 FROM public.business_settings WHERE public_booking_slug = final_slug) LOOP
    counter := counter + 1;
    final_slug := slug || '-' || counter;
  END LOOP;
  
  RETURN final_slug;
END;
$$;

-- Function to generate cancel token
CREATE OR REPLACE FUNCTION public.generate_cancel_token()
RETURNS TEXT
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  chars TEXT := 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..32 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$;

-- Create RLS policy for public access to business_settings (read-only for enabled public booking)
CREATE POLICY "Anyone can view enabled public booking settings" 
ON public.business_settings 
FOR SELECT 
USING (public_booking_enabled = true AND public_booking_slug IS NOT NULL);

-- Create RLS policy for public access to services (read-only for active services of businesses with public booking)
CREATE POLICY "Anyone can view active services for public booking" 
ON public.services 
FOR SELECT 
USING (
  is_active = true AND 
  EXISTS (
    SELECT 1 FROM public.business_settings 
    WHERE business_settings.user_id = services.user_id 
    AND business_settings.public_booking_enabled = true
  )
);

-- Create policy for public appointment creation
CREATE POLICY "Anyone can create appointments via public booking" 
ON public.appointments 
FOR INSERT 
WITH CHECK (
  source = 'public' AND
  EXISTS (
    SELECT 1 FROM public.business_settings 
    WHERE business_settings.user_id = appointments.user_id 
    AND business_settings.public_booking_enabled = true
  )
);

-- Create policy for viewing appointments by cancel token
CREATE POLICY "Anyone can view appointments with valid cancel token" 
ON public.appointments 
FOR SELECT 
USING (cancel_token IS NOT NULL AND source = 'public');

-- Create policy for updating appointments via cancel token (cancellation)
CREATE POLICY "Anyone can cancel appointments with valid token" 
ON public.appointments 
FOR UPDATE 
USING (cancel_token IS NOT NULL AND source = 'public')
WITH CHECK (status = 'cancelled');