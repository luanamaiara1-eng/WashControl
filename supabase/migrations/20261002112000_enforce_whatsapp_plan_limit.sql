-- Enforce the plan's WhatsApp Central limit at database level.
CREATE OR REPLACE FUNCTION public.enforce_whatsapp_central_limit()
RETURNS TRIGGER AS $$
DECLARE
  v_limit INTEGER;
  v_current INTEGER;
BEGIN
  SELECT COALESCE(p.max_whatsapp_central, 0)
    INTO v_limit
  FROM public.subscriptions s
  LEFT JOIN public.saas_plans p ON p.id = s.plan_id
  WHERE s.user_id = NEW.user_id
  LIMIT 1;

  SELECT COUNT(*)::INTEGER
    INTO v_current
  FROM public.whatsapp_authorized_numbers
  WHERE user_id = NEW.user_id AND is_active = true;

  IF v_current >= COALESCE(v_limit, 0) THEN
    RAISE EXCEPTION 'Limite de WhatsApps do plano atingido';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS enforce_whatsapp_central_limit ON public.whatsapp_authorized_numbers;
CREATE TRIGGER enforce_whatsapp_central_limit
  BEFORE INSERT ON public.whatsapp_authorized_numbers
  FOR EACH ROW
  WHEN (NEW.is_active = true)
  EXECUTE FUNCTION public.enforce_whatsapp_central_limit();
