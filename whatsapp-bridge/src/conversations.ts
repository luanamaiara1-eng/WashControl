import { supabaseAdmin } from "./supabaseAdmin.js";
import { getClientByPhone } from "./business.js";

export type MessageDirection = "inbound" | "outbound";
export type MessageType = "text" | "image" | "audio" | "document" | "other";

async function getOrCreateConversation(userId: string, phone: string, senderName?: string | null) {
  const { data: existing } = await supabaseAdmin
    .from("whatsapp_conversations")
    .select("id, contact_name, client_id")
    .eq("user_id", userId)
    .eq("phone", phone)
    .maybeSingle();

  if (existing) return existing;

  const client = await getClientByPhone(userId, phone);
  const { data: created, error } = await supabaseAdmin
    .from("whatsapp_conversations")
    .insert({ user_id: userId, phone, contact_name: client?.name ?? senderName ?? null, client_id: client?.id ?? null })
    .select("id, contact_name, client_id")
    .single();

  if (error) throw error;
  return created;
}

function previewFor(type: MessageType, body: string | null): string {
  if (type === "image") return "📷 Imagem";
  if (type === "audio") return "🎤 Áudio";
  if (type === "document") return "📄 Documento";
  return (body ?? "").slice(0, 120);
}

export async function recordMessage(params: {
  userId: string;
  phone: string;
  direction: MessageDirection;
  type?: MessageType;
  body?: string | null;
  mediaUrl?: string | null;
  externalId?: string | null;
  senderName?: string | null;
}) {
  const type = params.type ?? "text";
  const conversation = await getOrCreateConversation(params.userId, params.phone, params.senderName);

  const { error: insertError } = await supabaseAdmin.from("whatsapp_chat_messages").insert({
    user_id: params.userId,
    conversation_id: conversation.id,
    direction: params.direction,
    message_type: type,
    body: params.body ?? null,
    media_url: params.mediaUrl ?? null,
    external_id: params.externalId ?? null,
  });
  if (insertError) throw insertError;

  // Keep the client link fresh in case the contact was registered after the
  // conversation started (e.g. "cadastrar cliente" on this same phone).
  let clientId = conversation.client_id;
  let contactName = conversation.contact_name;
  if (!clientId) {
    const client = await getClientByPhone(params.userId, params.phone);
    if (client) {
      clientId = client.id;
      contactName = client.name;
    }
  }

  await supabaseAdmin
    .from("whatsapp_conversations")
    .update({
      last_message_at: new Date().toISOString(),
      last_message_preview: previewFor(type, params.body ?? null),
      client_id: clientId,
      contact_name: contactName,
      ...(params.direction === "inbound" ? { unread_count: (await getUnreadCount(conversation.id)) + 1 } : {}),
    })
    .eq("id", conversation.id);
}

async function getUnreadCount(conversationId: string): Promise<number> {
  const { data } = await supabaseAdmin.from("whatsapp_conversations").select("unread_count").eq("id", conversationId).maybeSingle();
  return data?.unread_count ?? 0;
}
