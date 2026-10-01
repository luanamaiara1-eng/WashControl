-- Add missing SELECT policies for public booking to work correctly
-- For clients lookup during booking
CREATE POLICY "Public can view clients for booking"
ON public.clients
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.business_settings bs
    WHERE bs.user_id = clients.user_id
    AND bs.public_booking_enabled = true
  )
);

-- For vehicles lookup during booking  
CREATE POLICY "Public can view vehicles for booking"
ON public.vehicles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.business_settings bs
    WHERE bs.user_id = vehicles.user_id
    AND bs.public_booking_enabled = true
  )
);