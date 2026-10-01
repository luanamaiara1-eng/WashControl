
-- 1. Fix: Replace broken appointment cancel policies with a secure RPC function
-- Drop the insecure policies
DROP POLICY IF EXISTS "Anyone can cancel appointments with valid token" ON public.appointments;
DROP POLICY IF EXISTS "Anyone can view appointments with valid cancel token" ON public.appointments;

-- Create a secure RPC to cancel appointments by verifying the token
CREATE OR REPLACE FUNCTION public.cancel_appointment_by_token(p_cancel_token text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_appointment record;
  v_settings record;
BEGIN
  -- Find the appointment with matching token
  SELECT a.*, bs.allow_client_cancellation, bs.cancellation_limit_hours
  INTO v_appointment
  FROM public.appointments a
  LEFT JOIN public.business_settings bs ON bs.user_id = a.user_id
  WHERE a.cancel_token = p_cancel_token
    AND a.source = 'public'
  LIMIT 1;

  IF v_appointment IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Agendamento não encontrado');
  END IF;

  IF v_appointment.status = 'cancelled' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Agendamento já foi cancelado');
  END IF;

  -- Update the appointment
  UPDATE public.appointments
  SET status = 'cancelled', updated_at = now()
  WHERE id = v_appointment.id;

  RETURN jsonb_build_object('success', true);
END;
$$;

-- Create a secure RPC to view appointment by token
CREATE OR REPLACE FUNCTION public.get_appointment_by_token(p_cancel_token text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'id', a.id,
    'scheduled_date', a.scheduled_date,
    'scheduled_time', a.scheduled_time,
    'status', a.status,
    'notes', a.notes,
    'source', a.source,
    'cancel_token', a.cancel_token,
    'service', jsonb_build_object('name', s.name, 'price', s.price),
    'client', jsonb_build_object('name', c.name, 'phone', c.phone),
    'vehicle', jsonb_build_object('brand', v.brand, 'model', v.model, 'plate', v.plate),
    'allow_client_cancellation', bs.allow_client_cancellation,
    'cancellation_limit_hours', bs.cancellation_limit_hours
  )
  INTO v_result
  FROM public.appointments a
  LEFT JOIN public.services s ON s.id = a.service_id
  LEFT JOIN public.clients c ON c.id = a.client_id
  LEFT JOIN public.vehicles v ON v.id = a.vehicle_id
  LEFT JOIN public.business_settings bs ON bs.user_id = a.user_id
  WHERE a.cancel_token = p_cancel_token
    AND a.source = 'public'
  LIMIT 1;

  IF v_result IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Agendamento não encontrado');
  END IF;

  RETURN v_result;
END;
$$;

-- 2. Fix: Restrict business_settings public exposure - create a view with only necessary fields
CREATE OR REPLACE VIEW public.business_settings_public
WITH (security_invoker = off) AS
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

-- Drop the overly permissive public SELECT policy
DROP POLICY IF EXISTS "Anyone can view enabled public booking settings" ON public.business_settings;

-- 3. Fix: Restrict clients table public exposure
-- Drop the overly permissive public SELECT policy
DROP POLICY IF EXISTS "Public can view clients for booking" ON public.clients;
