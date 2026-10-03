-- WhatsApp reminder automation
ALTER TABLE public.business_settings
  ADD COLUMN IF NOT EXISTS whatsapp_reminder_message text NOT NULL DEFAULT 'Olá {{nome}}! 🚗 Seu atendimento está agendado para {{data}} às {{hora}}.\n\nServiço: {{servico}}\n\nSe precisar remarcar, fale conosco.';

CREATE TABLE IF NOT EXISTS public.whatsapp_message_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  appointment_id uuid references public.appointments(id) on delete set null,
  client_id uuid references public.clients(id) on delete set null,
  message_type text not null check (message_type in ('appointment_reminder','followup','confirmation','cancellation')),
  recipient_phone text not null,
  message text not null,
  status text not null default 'sent' check (status in ('sent','failed')),
  error_message text,
  sent_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

CREATE UNIQUE INDEX IF NOT EXISTS whatsapp_message_logs_appointment_type_key
  ON public.whatsapp_message_logs(appointment_id, message_type)
  WHERE appointment_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS whatsapp_message_logs_user_date_idx
  ON public.whatsapp_message_logs(user_id, sent_at desc);

ALTER TABLE public.whatsapp_message_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own WhatsApp logs" ON public.whatsapp_message_logs;
CREATE POLICY "Users view own WhatsApp logs"
  ON public.whatsapp_message_logs FOR SELECT TO authenticated
  USING (user_id = auth.uid());