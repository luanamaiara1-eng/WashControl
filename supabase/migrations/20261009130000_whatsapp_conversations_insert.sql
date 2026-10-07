-- Lets the app start a new conversation with an existing client (before
-- any message has been exchanged yet) instead of only ever reacting to an
-- inbound message. Actual message content still only ever gets written by
-- the bridge's service-role key.
DROP POLICY IF EXISTS "Users can create their own conversations" ON public.whatsapp_conversations;
CREATE POLICY "Users can create their own conversations"
  ON public.whatsapp_conversations FOR INSERT WITH CHECK (auth.uid() = user_id);
