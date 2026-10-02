-- A WhatsApp number can belong to only one WashControl company.
CREATE UNIQUE INDEX IF NOT EXISTS whatsapp_authorized_numbers_phone_key
  ON public.whatsapp_authorized_numbers (phone);
