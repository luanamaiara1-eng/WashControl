import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Loader2, QrCode, Unplug, CheckCircle2, Send, Users, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  isWhatsAppBridgeConfigured,
  getWhatsAppStatus,
  connectWhatsApp,
  disconnectWhatsApp,
  refreshWhatsAppQr,
  sendTestWhatsAppMessage,
  type WhatsAppStatus,
} from "@/lib/whatsappBridge";

interface WhatsAppSettingsProps {
  settings: any;
  onUpdate: () => void;
}

export function WhatsAppSettings({ settings, onUpdate }: WhatsAppSettingsProps) {
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    whatsapp_auto_register_enabled: false,
    whatsapp_followup_enabled: false,
    whatsapp_followup_days: 15,
    whatsapp_followup_message: "",
    whatsapp_reminder_message: "",
  });

  const [status, setStatus] = useState<WhatsAppStatus | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [disconnecting, setDisconnecting] = useState(false);
  const [testPhone, setTestPhone] = useState("");
  const [testMessage, setTestMessage] = useState("Teste do WashControl 👋");
  const [sendingTest, setSendingTest] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const qrRefreshRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [authorizedNumbers, setAuthorizedNumbers] = useState<any[]>([]);
  const [maxWhatsappCentral, setMaxWhatsappCentral] = useState<number | null>(null);
  const [loadingAuthorized, setLoadingAuthorized] = useState(false);
  const [newNumberPhone, setNewNumberPhone] = useState("");
  const [newNumberLabel, setNewNumberLabel] = useState("");
  const [addingNumber, setAddingNumber] = useState(false);

  useEffect(() => {
    if (settings) {
      setFormData({
        whatsapp_auto_register_enabled: settings.whatsapp_auto_register_enabled ?? false,
        whatsapp_followup_enabled: settings.whatsapp_followup_enabled ?? false,
        whatsapp_followup_days: settings.whatsapp_followup_days ?? 15,
        whatsapp_followup_message: settings.whatsapp_followup_message ?? "",
        whatsapp_reminder_message: settings.whatsapp_reminder_message ?? "Olá {{nome}}! 🚗 Seu atendimento está agendado para {{data}} às {{hora}}.\\n\\nServiço: {{servico}}\\n\\nSe precisar remarcar, fale conosco.",
      });
    }
  }, [settings]);

  const bridgeConfigured = isWhatsAppBridgeConfigured();

  const refreshStatus = useCallback(async () => {
    if (!bridgeConfigured) return;
    setLoadingStatus(true);
    try {
      setStatus(await getWhatsAppStatus());
    } catch (error: any) {
      toast.error("Erro ao consultar status do WhatsApp: " + error.message);
    } finally {
      setLoadingStatus(false);
    }
  }, [bridgeConfigured]);

  useEffect(() => {
    refreshStatus();
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      if (qrRefreshRef.current) clearInterval(qrRefreshRef.current);
    };
  }, [refreshStatus]);

  const loadAuthorizedNumbers = useCallback(async () => {
    if (!user) return;
    setLoadingAuthorized(true);
    try {
      const [{ data: numbers, error: numbersError }, { data: sub }] = await Promise.all([
        supabase
          .from("whatsapp_authorized_numbers")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at"),
        supabase.from("subscriptions").select("plan, plan_id").eq("user_id", user.id).maybeSingle(),
      ]);
      if (numbersError) throw numbersError;
      setAuthorizedNumbers(numbers || []);

      if (sub) {
        const { data: plan } = sub.plan_id
          ? await supabase.from("saas_plans").select("max_whatsapp_central").eq("id", sub.plan_id).maybeSingle()
          : await supabase.from("saas_plans").select("max_whatsapp_central").eq("slug", sub.plan).maybeSingle();
        setMaxWhatsappCentral(plan?.max_whatsapp_central ?? null);
      }
    } catch (error: any) {
      toast.error("Erro ao carregar números autorizados: " + error.message);
    } finally {
      setLoadingAuthorized(false);
    }
  }, [user]);

  useEffect(() => {
    loadAuthorizedNumbers();
  }, [loadAuthorizedNumbers]);

  const handleAddAuthorizedNumber = async () => {
    if (!user) return;
    // Mirror the bridge's toLocalPhone(): a number typed with the "55"
    // country code must be stored the same way it'll arrive from a real
    // WhatsApp message, or the match against the sender's phone never hits.
    const digits = newNumberPhone.replace(/\D/g, "");
    const phone = digits.startsWith("55") && digits.length > 11 ? digits.slice(2) : digits;
    if (!phone) {
      toast.error("Informe o telefone (DDD + número).");
      return;
    }
    setAddingNumber(true);
    try {
      const { error } = await supabase.from("whatsapp_authorized_numbers").insert({
        user_id: user.id,
        phone,
        label: newNumberLabel.trim() || null,
      });
      if (error) {
        if (error.message.includes("Limite de WhatsApps")) {
          toast.error("Limite de números do seu plano atingido. Fale com o suporte pra aumentar.");
        } else if (error.code === "23505") {
          toast.error("Esse número já está autorizado.");
        } else {
          throw error;
        }
        return;
      }
      toast.success("Número autorizado!");
      setNewNumberPhone("");
      setNewNumberLabel("");
      loadAuthorizedNumbers();
    } catch (error: any) {
      toast.error("Erro ao autorizar número: " + error.message);
    } finally {
      setAddingNumber(false);
    }
  };

  const handleToggleAuthorizedNumber = async (id: string, isActive: boolean) => {
    const { error } = await supabase.from("whatsapp_authorized_numbers").update({ is_active: isActive }).eq("id", id);
    if (error) toast.error("Erro ao atualizar: " + error.message);
    else loadAuthorizedNumbers();
  };

  const handleDeleteAuthorizedNumber = async (id: string) => {
    if (!confirm("Remover este número da lista de autorizados?")) return;
    const { error } = await supabase.from("whatsapp_authorized_numbers").delete().eq("id", id);
    if (error) toast.error("Erro ao remover: " + error.message);
    else {
      toast.success("Número removido.");
      loadAuthorizedNumbers();
    }
  };

  const handleConnect = async () => {
    setConnecting(true);
    try {
      const result = await connectWhatsApp();
      setQrCode(result.qrCode);

      if (result.alreadyConnected) {
        toast.success("Esse WhatsApp já estava conectado!");
      }

      // Poll until the number is confirmed connected, then close the QR dialog.
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = setInterval(async () => {
        const next = await getWhatsAppStatus().catch(() => null);
        if (next) {
          setStatus(next);
          if (next.connected) {
            clearInterval(pollRef.current!);
            if (qrRefreshRef.current) clearInterval(qrRefreshRef.current);
            setQrCode(null);
            toast.success("WhatsApp conectado!");
          }
        }
      }, 4000);

      // The QR Code expires after a short while (~20-60s) — keep fetching a
      // fresh one while the dialog is open so it doesn't go stale before the
      // phone's camera gets a chance to scan it (especially on iOS, where
      // opening WhatsApp's scanner and granting camera access takes longer).
      // This must only ever fetch a QR (GET /qr) — re-running the full
      // connect flow would re-register the connection and could kick a
      // pairing that just succeeded.
      if (qrRefreshRef.current) clearInterval(qrRefreshRef.current);
      if (!result.alreadyConnected) {
        qrRefreshRef.current = setInterval(async () => {
          const fresh = await refreshWhatsAppQr().catch(() => null);
          if (fresh?.alreadyConnected) {
            clearInterval(qrRefreshRef.current!);
          } else if (fresh?.qrCode) {
            setQrCode(fresh.qrCode);
          }
        }, 25000);
      }
    } catch (error: any) {
      toast.error("Erro ao conectar: " + error.message);
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    setDisconnecting(true);
    try {
      await disconnectWhatsApp();
      if (pollRef.current) clearInterval(pollRef.current);
      if (qrRefreshRef.current) clearInterval(qrRefreshRef.current);
      setQrCode(null);
      toast.success("WhatsApp desconectado. Pode clicar em \"Conectar WhatsApp\" pra parear de novo.");
      refreshStatus();
    } catch (error: any) {
      toast.error("Erro ao desconectar: " + error.message);
    } finally {
      setDisconnecting(false);
    }
  };

  const handleSendTest = async () => {
    if (!testPhone.trim()) {
      toast.error("Informe um telefone (DDD + número).");
      return;
    }
    setSendingTest(true);
    try {
      await sendTestWhatsAppMessage(testPhone, testMessage);
      toast.success("Mensagem de teste enviada!");
    } catch (error: any) {
      toast.error("Erro ao enviar teste: " + error.message);
    } finally {
      setSendingTest(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("business_settings")
        .update({
          whatsapp_auto_register_enabled: formData.whatsapp_auto_register_enabled,
          whatsapp_followup_enabled: formData.whatsapp_followup_enabled,
          whatsapp_followup_days: formData.whatsapp_followup_days,
          whatsapp_followup_message: formData.whatsapp_followup_message,
          whatsapp_reminder_message: formData.whatsapp_reminder_message,
        })
        .eq("user_id", user.id);

      if (error) throw error;
      toast.success("Configurações de WhatsApp salvas!");
      onUpdate();
    } catch (error: any) {
      toast.error("Erro ao salvar: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  if (!bridgeConfigured) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5" /> WhatsApp
          </CardTitle>
          <CardDescription>
            A integração com WhatsApp ainda não foi configurada neste ambiente (falta
            <code className="mx-1 px-1 py-0.5 bg-muted rounded text-xs">VITE_WHATSAPP_BRIDGE_URL</code>
            no build do app). Consulte <code className="px-1 py-0.5 bg-muted rounded text-xs">whatsapp-bridge/README.md</code>.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5" /> Conexão do WhatsApp
          </CardTitle>
          <CardDescription>
            Conecte o número que vai mandar e receber mensagens pelo WashControl.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2">
              {loadingStatus ? (
                <Badge variant="outline" className="gap-1">
                  <Loader2 className="w-3 h-3 animate-spin" /> Verificando...
                </Badge>
              ) : status?.connected ? (
                <Badge className="gap-1 bg-green-600 hover:bg-green-600">
                  <CheckCircle2 className="w-3 h-3" /> Conectado
                </Badge>
              ) : (
                <Badge variant="secondary">Desconectado</Badge>
              )}
            </div>

            <div className="flex gap-2">
              <Button onClick={handleConnect} disabled={connecting} className="gap-2">
                {connecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <QrCode className="w-4 h-4" />}
                Conectar WhatsApp
              </Button>
              <Button variant="outline" onClick={handleDisconnect} disabled={disconnecting} className="gap-2">
                {disconnecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Unplug className="w-4 h-4" />}
                Desconectar
              </Button>
            </div>
          </div>
          {!status?.connected && (
            <p className="text-xs text-muted-foreground">
              Se "Conectar" não mostrar um QR Code novo, clique em "Desconectar" primeiro (força
              encerrar qualquer sessão travada) e tente "Conectar" de novo.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="w-5 h-5" /> Testar envio
          </CardTitle>
          <CardDescription>Manda uma mensagem de teste pra um número, pra confirmar que o envio está funcionando.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-[200px_1fr]">
            <Input
              placeholder="DDD + número (ex: 11999998888)"
              value={testPhone}
              onChange={(e) => setTestPhone(e.target.value)}
            />
            <Input
              placeholder="Mensagem"
              value={testMessage}
              onChange={(e) => setTestMessage(e.target.value)}
            />
          </div>
          <Button variant="outline" size="sm" onClick={handleSendTest} disabled={sendingTest} className="gap-2">
            {sendingTest ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Enviar teste
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" /> Números autorizados
          </CardTitle>
          <CardDescription>
            Só os números da lista abaixo conseguem mandar comandos pelo WhatsApp (cadastrar cliente,
            agendar, vale, etc.). Qualquer outro número que escrever é ignorado.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {maxWhatsappCentral !== null && (
            <p className="text-xs text-muted-foreground">
              {authorizedNumbers.length} de {maxWhatsappCentral} número(s) permitido(s) pelo seu plano.
            </p>
          )}

          {loadingAuthorized ? (
            <p className="text-sm text-muted-foreground">Carregando...</p>
          ) : authorizedNumbers.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum número autorizado ainda. Adicione o seu abaixo.</p>
          ) : (
            <div className="space-y-2">
              {authorizedNumbers.map((n) => (
                <div key={n.id} className="flex items-center justify-between gap-3 rounded-lg border p-3">
                  <div className="min-w-0">
                    <p className="font-medium truncate">{n.label || "Sem nome"}</p>
                    <p className="text-xs text-muted-foreground">{n.phone}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Switch checked={n.is_active} onCheckedChange={(checked) => handleToggleAuthorizedNumber(n.id, checked)} />
                    <Button variant="ghost" size="icon" onClick={() => handleDeleteAuthorizedNumber(n.id)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <Separator />

          <div className="grid gap-3 sm:grid-cols-[200px_1fr_auto] items-end">
            <div className="space-y-1">
              <Label>Telefone</Label>
              <Input placeholder="DDD + número" value={newNumberPhone} onChange={(e) => setNewNumberPhone(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Nome (opcional)</Label>
              <Input placeholder="Ex: Eu, Sócio, Gerente" value={newNumberLabel} onChange={(e) => setNewNumberLabel(e.target.value)} />
            </div>
            <Button onClick={handleAddAuthorizedNumber} disabled={addingNumber} className="gap-2">
              {addingNumber ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Autorizar
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Comandos pelo WhatsApp</CardTitle>
          <CardDescription>
            Manda uma mensagem pro próprio número conectado e o sistema executa na hora: cadastra
            cliente, cadastra serviço, agenda um atendimento, registra vale ou pagamento de
            funcionário.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="whatsapp_auto_register_enabled">Ativar comandos por mensagem</Label>
            <Switch
              id="whatsapp_auto_register_enabled"
              checked={formData.whatsapp_auto_register_enabled}
              onCheckedChange={(checked) => setFormData({ ...formData, whatsapp_auto_register_enabled: checked })}
            />
          </div>
          {formData.whatsapp_auto_register_enabled && (
            <div className="text-sm text-muted-foreground bg-muted rounded-md p-3 space-y-2">
              <p>
                Manda <strong>ajuda</strong> pelo WhatsApp a qualquer momento pra ver a lista
                completa de comandos. Alguns exemplos:
              </p>
              <ul className="list-disc list-inside space-y-1">
                <li>
                  <em>cadastrar cliente João Silva, 11999998888, Onix Prata</em>
                </li>
                <li>
                  <em>cadastrar serviço Lavagem Completa, 80, 60</em>
                </li>
                <li>
                  <em>João agendou lavagem completa pro jetta às 8h valor 80,00</em>
                </li>
                <li>
                  <em>vale Carlos, 50</em>
                </li>
                <li>
                  <em>pagamento funcionário Carlos, 200</em>
                </li>
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lembrete de agendamento</CardTitle>
          <CardDescription>Envie automaticamente um lembrete pelo WhatsApp antes do horário marcado.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Ativar lembretes</Label>
              <p className="text-xs text-muted-foreground">Usa a configuração de lembretes da aba Preferências.</p>
            </div>
            <span className="text-sm text-muted-foreground">{settings?.send_reminders ? `Ativado · ${settings.reminder_hours_before || 24}h antes` : "Desativado"}</span>
          </div>
          <div className="space-y-2">
            <Label>Mensagem do lembrete</Label>
            <Textarea rows={5} value={formData.whatsapp_reminder_message} onChange={(e) => setFormData({ ...formData, whatsapp_reminder_message: e.target.value })} />
            <p className="text-xs text-muted-foreground">
              Variáveis: <code className="px-1 bg-muted rounded">{"{{nome}}"}</code>, <code className="px-1 bg-muted rounded">{"{{data}}"}</code>, <code className="px-1 bg-muted rounded">{"{{hora}}"}</code>, <code className="px-1 bg-muted rounded">{"{{servico}}"}</code>.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Mensagem de retorno automática</CardTitle>
          <CardDescription>
            Quando o cliente lava o carro, agenda sozinho uma mensagem chamando ele de volta
            depois de alguns dias sem aparecer.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="whatsapp_followup_enabled">Ativar mensagem de retorno</Label>
            <Switch
              id="whatsapp_followup_enabled"
              checked={formData.whatsapp_followup_enabled}
              onCheckedChange={(checked) => setFormData({ ...formData, whatsapp_followup_enabled: checked })}
            />
          </div>

          {formData.whatsapp_followup_enabled && (
            <>
              <Separator />
              <div className="space-y-2">
                <Label htmlFor="whatsapp_followup_days">Enviar depois de quantos dias</Label>
                <Input
                  id="whatsapp_followup_days"
                  type="number"
                  min={1}
                  className="w-32"
                  value={formData.whatsapp_followup_days}
                  onChange={(e) =>
                    setFormData({ ...formData, whatsapp_followup_days: parseInt(e.target.value) || 1 })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="whatsapp_followup_message">Mensagem</Label>
                <Textarea
                  id="whatsapp_followup_message"
                  rows={4}
                  value={formData.whatsapp_followup_message}
                  onChange={(e) => setFormData({ ...formData, whatsapp_followup_message: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  Use <code className="px-1 bg-muted rounded">{"{{nome}}"}</code> e{" "}
                  <code className="px-1 bg-muted rounded">{"{{dias}}"}</code> pra personalizar.
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Button variant="hero" onClick={handleSave} disabled={saving} className="w-full">
        {saving ? "Salvando..." : "Salvar configurações de WhatsApp"}
      </Button>

      <Dialog open={!!qrCode} onOpenChange={(open) => { if (!open) { setQrCode(null); if (qrRefreshRef.current) clearInterval(qrRefreshRef.current); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Escaneie com o WhatsApp</DialogTitle>
            <DialogDescription>
              No celular: WhatsApp → Configurações → Aparelhos conectados → Conectar um aparelho.
            </DialogDescription>
          </DialogHeader>
          {qrCode && (
            <div className="flex justify-center p-4">
              <img src={qrCode} alt="QR Code do WhatsApp" className="w-64 h-64" />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
