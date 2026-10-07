import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { sendChatMessage, isWhatsAppBridgeConfigured } from "@/lib/whatsappBridge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MessageCircle, Send, Loader2, Image as ImageIcon, Mic, FileText, User, Plus, Search } from "lucide-react";
import { format, isToday, isYesterday } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

interface Conversation {
  id: string;
  phone: string;
  contact_name: string | null;
  client_id: string | null;
  last_message_at: string;
  last_message_preview: string | null;
  unread_count: number;
}

interface Client {
  id: string;
  name: string;
  phone: string | null;
}

interface ChatMessage {
  id: string;
  conversation_id: string;
  direction: "inbound" | "outbound";
  message_type: "text" | "image" | "audio" | "document" | "other";
  body: string | null;
  sent_at: string;
}

function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 11) return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  if (digits.length === 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return phone;
}

function initialsFor(name: string): string {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "?";
}

function formatConversationTime(iso: string): string {
  const date = new Date(iso);
  if (isToday(date)) return format(date, "HH:mm");
  if (isYesterday(date)) return "Ontem";
  return format(date, "dd/MM", { locale: ptBR });
}

function MessageTypeIcon({ type }: { type: ChatMessage["message_type"] }) {
  if (type === "image") return <ImageIcon className="h-3.5 w-3.5" />;
  if (type === "audio") return <Mic className="h-3.5 w-3.5" />;
  if (type === "document") return <FileText className="h-3.5 w-3.5" />;
  return null;
}

export default function ConversasPage() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const [newChatOpen, setNewChatOpen] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [clientSearch, setClientSearch] = useState("");
  const [startingChat, setStartingChat] = useState(false);

  const selected = useMemo(() => conversations.find((c) => c.id === selectedId) ?? null, [conversations, selectedId]);

  useEffect(() => {
    if (!user) return;

    const loadConversations = async () => {
      setLoadingConversations(true);
      const { data } = await supabase
        .from("whatsapp_conversations")
        .select("id, phone, contact_name, client_id, last_message_at, last_message_preview, unread_count")
        .eq("user_id", user.id)
        .order("last_message_at", { ascending: false });
      setConversations(data ?? []);
      setLoadingConversations(false);
    };
    loadConversations();

    const channel = supabase
      .channel("whatsapp-conversations")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "whatsapp_conversations", filter: `user_id=eq.${user.id}` },
        () => loadConversations()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  useEffect(() => {
    if (!selectedId || !user) {
      setMessages([]);
      return;
    }

    const loadMessages = async () => {
      setLoadingMessages(true);
      const { data } = await supabase
        .from("whatsapp_chat_messages")
        .select("id, conversation_id, direction, message_type, body, sent_at")
        .eq("conversation_id", selectedId)
        .order("sent_at", { ascending: true });
      setMessages((data ?? []) as ChatMessage[]);
      setLoadingMessages(false);
    };
    loadMessages();

    supabase
      .from("whatsapp_conversations")
      .update({ unread_count: 0 })
      .eq("id", selectedId)
      .then(() => {});

    const channel = supabase
      .channel(`whatsapp-messages-${selectedId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "whatsapp_chat_messages", filter: `conversation_id=eq.${selectedId}` },
        (payload) => setMessages((prev) => [...prev, payload.new as ChatMessage])
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedId, user]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!selected || !draft.trim()) return;
    setSending(true);
    try {
      await sendChatMessage(selected.phone, draft.trim());
      setDraft("");
    } catch (error: any) {
      toast.error("Erro ao enviar: " + error.message);
    } finally {
      setSending(false);
    }
  };

  const openNewChat = async () => {
    setNewChatOpen(true);
    if (!user || clients.length) return;
    const { data } = await supabase
      .from("clients")
      .select("id, name, phone")
      .eq("user_id", user.id)
      .not("phone", "is", null)
      .order("name");
    setClients(data ?? []);
  };

  const filteredClients = useMemo(() => {
    const q = clientSearch.toLowerCase();
    return clients.filter((c) => c.name.toLowerCase().includes(q) || (c.phone ?? "").includes(q));
  }, [clients, clientSearch]);

  const handleStartChat = async (client: Client) => {
    if (!user || !client.phone) return;

    const existing = conversations.find((c) => c.phone === client.phone);
    if (existing) {
      setSelectedId(existing.id);
      setNewChatOpen(false);
      return;
    }

    setStartingChat(true);
    try {
      const { data, error } = await supabase
        .from("whatsapp_conversations")
        .insert({ user_id: user.id, phone: client.phone, contact_name: client.name, client_id: client.id })
        .select("id, phone, contact_name, client_id, last_message_at, last_message_preview, unread_count")
        .single();
      if (error) throw error;

      setConversations((prev) => [data as Conversation, ...prev]);
      setSelectedId(data.id);
      setNewChatOpen(false);
    } catch (error: any) {
      toast.error("Erro ao iniciar conversa: " + error.message);
    } finally {
      setStartingChat(false);
    }
  };

  if (!isWhatsAppBridgeConfigured()) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          Conecte o WhatsApp em Configurações para ver suas conversas aqui.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-4">
      <div className={`w-full sm:w-80 shrink-0 border rounded-xl overflow-hidden flex flex-col ${selectedId ? "hidden sm:flex" : "flex"}`}>
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="font-bold flex items-center gap-2">
            <MessageCircle className="h-5 w-5" /> Conversas
          </h2>
          <Button size="icon" variant="outline" onClick={openNewChat} title="Nova conversa">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <ScrollArea className="flex-1">
          {loadingConversations ? (
            <p className="p-4 text-sm text-muted-foreground">Carregando...</p>
          ) : conversations.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">
              Nenhuma conversa ainda. Assim que alguém mandar mensagem pro seu WhatsApp conectado, aparece aqui.
            </p>
          ) : (
            conversations.map((c) => {
              const name = c.contact_name || formatPhone(c.phone);
              return (
                <button
                  key={c.id}
                  onClick={() => setSelectedId(c.id)}
                  className={`w-full flex items-center gap-3 p-3 text-left border-b hover:bg-muted/50 transition-colors ${selectedId === c.id ? "bg-muted" : ""}`}
                >
                  <Avatar>
                    <AvatarFallback>{initialsFor(name)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium truncate">{name}</p>
                      <span className="text-xs text-muted-foreground shrink-0">{formatConversationTime(c.last_message_at)}</span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm text-muted-foreground truncate">{c.last_message_preview || "—"}</p>
                      {c.unread_count > 0 && (
                        <Badge className="shrink-0 h-5 min-w-5 flex items-center justify-center rounded-full px-1.5">{c.unread_count}</Badge>
                      )}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </ScrollArea>
      </div>

      <div className={`flex-1 border rounded-xl overflow-hidden flex flex-col ${selectedId ? "flex" : "hidden sm:flex"}`}>
        {!selected ? (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            Selecione uma conversa
          </div>
        ) : (
          <>
            <div className="p-4 border-b flex items-center gap-3">
              <Button variant="ghost" size="sm" className="sm:hidden" onClick={() => setSelectedId(null)}>
                ←
              </Button>
              <Avatar>
                <AvatarFallback>{initialsFor(selected.contact_name || formatPhone(selected.phone))}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="font-medium truncate">{selected.contact_name || formatPhone(selected.phone)}</p>
                <p className="text-xs text-muted-foreground">{formatPhone(selected.phone)}</p>
              </div>
              {!selected.client_id && (
                <Badge variant="outline" className="gap-1 shrink-0">
                  <User className="h-3 w-3" /> Não cadastrado
                </Badge>
              )}
            </div>

            <ScrollArea className="flex-1 p-4">
              {loadingMessages ? (
                <p className="text-sm text-muted-foreground">Carregando...</p>
              ) : (
                <div className="space-y-2">
                  {messages.map((m) => (
                    <div key={m.id} className={`flex ${m.direction === "outbound" ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${
                          m.direction === "outbound" ? "bg-primary text-primary-foreground" : "bg-muted"
                        }`}
                      >
                        {m.message_type !== "text" && (
                          <div className="flex items-center gap-1 text-xs opacity-75 mb-1">
                            <MessageTypeIcon type={m.message_type} />
                            <span>Mídia (ainda não é possível ver aqui)</span>
                          </div>
                        )}
                        {m.body && <p className="whitespace-pre-wrap break-words">{m.body}</p>}
                        <p className="text-[10px] opacity-60 mt-1 text-right">{format(new Date(m.sent_at), "HH:mm")}</p>
                      </div>
                    </div>
                  ))}
                  <div ref={scrollRef} />
                </div>
              )}
            </ScrollArea>

            <div className="p-3 border-t flex gap-2 items-end">
              <Textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Digite uma mensagem..."
                rows={1}
                className="resize-none min-h-10"
              />
              <Button onClick={handleSend} disabled={sending || !draft.trim()} size="icon">
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
          </>
        )}
      </div>

      <Dialog open={newChatOpen} onOpenChange={setNewChatOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova conversa</DialogTitle>
          </DialogHeader>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={clientSearch}
              onChange={(e) => setClientSearch(e.target.value)}
              placeholder="Buscar cliente por nome ou telefone..."
              className="pl-9"
              autoFocus
            />
          </div>
          <ScrollArea className="h-80">
            {filteredClients.length === 0 ? (
              <p className="p-4 text-sm text-muted-foreground text-center">
                {clients.length === 0 ? "Nenhum cliente com telefone cadastrado." : "Nenhum cliente encontrado."}
              </p>
            ) : (
              filteredClients.map((client) => (
                <button
                  key={client.id}
                  onClick={() => handleStartChat(client)}
                  disabled={startingChat}
                  className="w-full flex items-center gap-3 p-3 text-left hover:bg-muted/50 rounded-lg transition-colors disabled:opacity-50"
                >
                  <Avatar>
                    <AvatarFallback>{initialsFor(client.name)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="font-medium truncate">{client.name}</p>
                    <p className="text-xs text-muted-foreground">{formatPhone(client.phone ?? "")}</p>
                  </div>
                </button>
              ))
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
