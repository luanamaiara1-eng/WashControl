-- Allow public booking to create clients
CREATE POLICY "Anyone can create clients via public booking" 
ON public.clients 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM business_settings 
    WHERE business_settings.user_id = clients.user_id 
    AND business_settings.public_booking_enabled = true
  )
);

-- Allow public booking to create vehicles
CREATE POLICY "Anyone can create vehicles via public booking" 
ON public.vehicles 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM business_settings 
    WHERE business_settings.user_id = vehicles.user_id 
    AND business_settings.public_booking_enabled = true
  )
);