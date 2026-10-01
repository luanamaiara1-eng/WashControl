
-- Drop the broad public SELECT policy on vehicles
DROP POLICY IF EXISTS "Public can view vehicles for booking" ON public.vehicles;

-- Create a secure RPC to find a vehicle by plate for public booking
CREATE OR REPLACE FUNCTION public.find_vehicle_by_plate(p_user_id uuid, p_plate text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_vehicle_id uuid;
  v_booking_enabled boolean;
BEGIN
  -- Verify business has public booking enabled
  SELECT public_booking_enabled INTO v_booking_enabled
  FROM public.business_settings
  WHERE user_id = p_user_id;

  IF v_booking_enabled IS NOT TRUE THEN
    RETURN NULL;
  END IF;

  SELECT id INTO v_vehicle_id
  FROM public.vehicles
  WHERE user_id = p_user_id AND plate = p_plate
  LIMIT 1;

  RETURN v_vehicle_id;
END;
$$;
