-- Allow public read access to business_settings when public_booking_enabled is true
CREATE POLICY "Public can view business settings with public booking enabled"
ON public.business_settings
FOR SELECT
USING (public_booking_enabled = true);

-- Allow public read access to services for businesses with public booking enabled
CREATE POLICY "Public can view services for businesses with public booking"
ON public.services
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.business_settings bs
    WHERE bs.user_id = services.user_id
    AND bs.public_booking_enabled = true
  )
);

-- Allow public read access to appointments for availability checking
CREATE POLICY "Public can view appointments for availability"
ON public.appointments
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.business_settings bs
    WHERE bs.user_id = appointments.user_id
    AND bs.public_booking_enabled = true
  )
);

-- Allow public to insert clients via public booking
CREATE POLICY "Public can create clients via public booking"
ON public.clients
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.business_settings bs
    WHERE bs.user_id = clients.user_id
    AND bs.public_booking_enabled = true
  )
);

-- Allow public to insert vehicles via public booking
CREATE POLICY "Public can create vehicles via public booking"
ON public.vehicles
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.business_settings bs
    WHERE bs.user_id = vehicles.user_id
    AND bs.public_booking_enabled = true
  )
);

-- Allow public to view vehicles for lookup during booking
CREATE POLICY "Public can view vehicles for booking lookup"
ON public.vehicles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.business_settings bs
    WHERE bs.user_id = vehicles.user_id
    AND bs.public_booking_enabled = true
  )
);

-- Allow public to view clients for lookup during booking
CREATE POLICY "Public can view clients for booking lookup"
ON public.clients
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.business_settings bs
    WHERE bs.user_id = clients.user_id
    AND bs.public_booking_enabled = true
  )
);

-- Allow public to insert appointments via public booking
CREATE POLICY "Public can create appointments via public booking"
ON public.appointments
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.business_settings bs
    WHERE bs.user_id = appointments.user_id
    AND bs.public_booking_enabled = true
  )
);

-- Allow public to update appointments for cancellation
CREATE POLICY "Public can cancel appointments via token"
ON public.appointments
FOR UPDATE
USING (
  cancel_token IS NOT NULL 
  AND source = 'public'
  AND EXISTS (
    SELECT 1 FROM public.business_settings bs
    WHERE bs.user_id = appointments.user_id
    AND bs.public_booking_enabled = true
  )
);

-- Allow public to insert audit logs for public bookings
CREATE POLICY "Public can create audit logs"
ON public.audit_logs
FOR INSERT
WITH CHECK (source = 'public');