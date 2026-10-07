-- Lets Super Admin view/manage authorized WhatsApp command numbers across
-- every business (for support), alongside each business's own self-service
-- access (already granted by the original policies on this table).
DROP POLICY IF EXISTS "Admins can manage all authorized numbers" ON public.whatsapp_authorized_numbers;
CREATE POLICY "Admins can manage all authorized numbers"
  ON public.whatsapp_authorized_numbers FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
