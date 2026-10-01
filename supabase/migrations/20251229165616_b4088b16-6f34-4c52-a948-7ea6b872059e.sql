-- Allow public-booking inserts for BOTH anon and authenticated sessions
-- Reason: if a logged-in user visits a public booking link, their session is authenticated and anon-only policies won't apply.

-- CLIENTS: broaden public booking insert policy
DROP POLICY IF EXISTS "Anyone can create clients via public booking" ON public.clients;
CREATE POLICY "Anyone can create clients via public booking"
ON public.clients
AS PERMISSIVE
FOR INSERT
TO public
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.business_settings bs
    WHERE bs.user_id = clients.user_id
      AND bs.public_booking_enabled = true
  )
);

-- VEHICLES: broaden public booking insert policy
DROP POLICY IF EXISTS "Anyone can create vehicles via public booking" ON public.vehicles;
CREATE POLICY "Anyone can create vehicles via public booking"
ON public.vehicles
AS PERMISSIVE
FOR INSERT
TO public
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.business_settings bs
    WHERE bs.user_id = vehicles.user_id
      AND bs.public_booking_enabled = true
  )
);
