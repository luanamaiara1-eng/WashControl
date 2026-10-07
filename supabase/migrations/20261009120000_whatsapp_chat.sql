-- WhatsApp chat: one conversation thread per phone number per business,
-- with every inbound/outbound message, so the app can show a real inbox
-- instead of only reacting to command phrases.

CREATE TABLE IF NOT EXISTS public.whatsapp_conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  phone TEXT NOT NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  contact_name TEXT,
  last_message_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_message_preview TEXT,
  unread_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, phone)
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_conversations_user_last_message
  ON public.whatsapp_conversations (user_id, last_message_at DESC);

ALTER TABLE public.whatsapp_conversations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own conversations" ON public.whatsapp_conversations;
CREATE POLICY "Users can view their own conversations"
  ON public.whatsapp_conversations FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update their own conversations" ON public.whatsapp_conversations;
CREATE POLICY "Users can update their own conversations"
  ON public.whatsapp_conversations FOR UPDATE USING (auth.uid() = user_id);

CREATE TRIGGER update_whatsapp_conversations_updated_at
  BEFORE UPDATE ON public.whatsapp_conversations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.whatsapp_chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  conversation_id UUID REFERENCES public.whatsapp_conversations(id) ON DELETE CASCADE NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  message_type TEXT NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'audio', 'document', 'other')),
  body TEXT,
  media_url TEXT,
  external_id TEXT,
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_chat_messages_conversation
  ON public.whatsapp_chat_messages (conversation_id, sent_at);

ALTER TABLE public.whatsapp_chat_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own chat messages" ON public.whatsapp_chat_messages;
CREATE POLICY "Users can view their own chat messages"
  ON public.whatsapp_chat_messages FOR SELECT USING (auth.uid() = user_id);

-- Writes (inbound from the webhook, outbound after Evolution Go confirms
-- the send) go through the bridge's service-role key, never directly from
-- the browser — that's what guarantees the chat matches what was actually
-- sent/received instead of drifting from it.

ALTER PUBLICATION supabase_realtime ADD TABLE public.whatsapp_chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.whatsapp_conversations;
