-- Drop duplicate policies that may have been created
DROP POLICY IF EXISTS "Public can view business settings with public booking enabled" ON public.business_settings;
DROP POLICY IF EXISTS "Public can view services for businesses with public booking" ON public.services;
DROP POLICY IF EXISTS "Public can view appointments for availability" ON public.appointments;
DROP POLICY IF EXISTS "Public can create clients via public booking" ON public.clients;
DROP POLICY IF EXISTS "Public can create vehicles via public booking" ON public.vehicles;
DROP POLICY IF EXISTS "Public can view vehicles for booking lookup" ON public.vehicles;
DROP POLICY IF EXISTS "Public can view clients for booking lookup" ON public.clients;
DROP POLICY IF EXISTS "Public can create appointments via public booking" ON public.appointments;
DROP POLICY IF EXISTS "Public can cancel appointments via token" ON public.appointments;
DROP POLICY IF EXISTS "Public can create audit logs" ON public.audit_logs;