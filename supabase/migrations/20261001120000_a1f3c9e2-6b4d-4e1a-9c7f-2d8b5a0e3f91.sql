-- WhatsApp integration (Evolution/EvolutionGo): settings + return-reminder scheduling

-- Settings for WhatsApp auto-registration and return reminders, per business
ALTER TABLE public.business_settings
  ADD COLUMN IF NOT EXISTS whatsapp_auto_register_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS whatsapp_followup_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS whatsapp_followup_days integer NOT NULL DEFAULT 15,
  ADD COLUMN IF NOT EXISTS whatsapp_followup_message text NOT NULL DEFAULT 'Oi {{nome}}! Já faz {{dias}} dias desde a sua última lavagem. Que tal agendar um horário pra deixar o carro novo de novo? 🚗✨',
  ADD COLUMN IF NOT EXISTS evolution_instance_name text;

ALTER TABLE public.business_settings
  ADD CONSTRAINT business_settings_whatsapp_followup_days_check
  CHECK (whatsapp_followup_days > 0);

-- One Evolution instance maps to exactly one business
CREATE UNIQUE INDEX IF NOT EXISTS business_settings_evolution_instance_name_key
  ON public.business_settings (evolution_instance_name)
  WHERE evolution_instance_name IS NOT NULL;

-- Tracks the scheduled "come back" message for a client after a completed wash
CREATE TABLE public.client_followups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  due_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'cancelled', 'failed')),
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_client_followups_due ON public.client_followups (status, due_date);
CREATE INDEX idx_client_followups_client ON public.client_followups (client_id);

ALTER TABLE public.client_followups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own client followups"
  ON public.client_followups FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own client followups"
  ON public.client_followups FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own client followups"
  ON public.client_followups FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own client followups"
  ON public.client_followups FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_client_followups_updated_at
  BEFORE UPDATE ON public.client_followups
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- When a wash is marked as completed, (re)schedule the client's return reminder
CREATE OR REPLACE FUNCTION public.schedule_client_followup()
RETURNS TRIGGER AS $$
DECLARE
  v_followup_enabled boolean;
  v_followup_days integer;
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS DISTINCT FROM 'completed') AND NEW.client_id IS NOT NULL THEN
    SELECT whatsapp_followup_enabled, whatsapp_followup_days
      INTO v_followup_enabled, v_followup_days
      FROM public.business_settings
      WHERE user_id = NEW.user_id;

    IF COALESCE(v_followup_enabled, false) THEN
      -- a fresh completed visit supersedes any reminder still pending from a previous one
      UPDATE public.client_followups
        SET status = 'cancelled'
        WHERE user_id = NEW.user_id
          AND client_id = NEW.client_id
          AND status = 'pending';

      INSERT INTO public.client_followups (user_id, client_id, appointment_id, due_date)
        VALUES (NEW.user_id, NEW.client_id, NEW.id, NEW.scheduled_date + (COALESCE(v_followup_days, 15) || ' days')::interval);
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER appointments_schedule_followup
  AFTER UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.schedule_client_followup();

-- If the client books again on their own before the reminder fires, drop it
CREATE OR REPLACE FUNCTION public.cancel_client_followup_on_rebooking()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.client_id IS NOT NULL THEN
    UPDATE public.client_followups
      SET status = 'cancelled'
      WHERE user_id = NEW.user_id
        AND client_id = NEW.client_id
        AND status = 'pending'
        AND due_date > CURRENT_DATE;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER appointments_cancel_followup_on_rebooking
  AFTER INSERT ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.cancel_client_followup_on_rebooking();
