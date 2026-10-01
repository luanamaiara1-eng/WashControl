-- Fix RLS for public booking inserts by making authenticated-user policies permissive and scoped,
-- so anon inserts don't have to satisfy authenticated-only checks.

-- CLIENTS
DROP POLICY IF EXISTS "Users can create their own clients" ON public.clients;
CREATE POLICY "Users can create their own clients"
ON public.clients
AS PERMISSIVE
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Anyone can create clients via public booking" ON public.clients;
CREATE POLICY "Anyone can create clients via public booking"
ON public.clients
AS PERMISSIVE
FOR INSERT
TO anon
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.business_settings bs
    WHERE bs.user_id = clients.user_id
      AND bs.public_booking_enabled = true
  )
);

-- VEHICLES
DROP POLICY IF EXISTS "Users can create their own vehicles" ON public.vehicles;
CREATE POLICY "Users can create their own vehicles"
ON public.vehicles
AS PERMISSIVE
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Anyone can create vehicles via public booking" ON public.vehicles;
CREATE POLICY "Anyone can create vehicles via public booking"
ON public.vehicles
AS PERMISSIVE
FOR INSERT
TO anon
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.business_settings bs
    WHERE bs.user_id = vehicles.user_id
      AND bs.public_booking_enabled = true
  )
);
