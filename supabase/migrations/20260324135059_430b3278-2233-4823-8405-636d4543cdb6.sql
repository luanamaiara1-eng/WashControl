
-- Fix the security definer view issue by recreating with security_invoker = on
DROP VIEW IF EXISTS public.business_settings_public;

CREATE OR REPLACE VIEW public.business_settings_public
WITH (security_invoker = on) AS
SELECT
  user_id,
  business_name,
  logo_url,
  working_hours,
  default_appointment_duration,
  min_advance_hours,
  max_advance_days,
  allow_client_cancellation,
  cancellation_limit_hours,
  max_simultaneous_vehicles,
  service_interval_minutes,
  primary_color,
  public_booking_slug,
  public_booking_enabled
FROM public.business_settings
WHERE public_booking_enabled = true
  AND public_booking_slug IS NOT NULL;

-- Re-add a restricted public SELECT policy on business_settings that only allows reading booking-necessary fields via the view
-- Since we use security_invoker=on, the view queries as the calling user, so we need a policy
CREATE POLICY "Public can view booking settings only"
ON public.business_settings
FOR SELECT
TO anon
USING (public_booking_enabled = true AND public_booking_slug IS NOT NULL);
