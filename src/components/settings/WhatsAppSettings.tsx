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
import { MessageCircle, Loader2, QrCode, Unplug, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import {
  isWhatsAppBridgeConfigured,
  getWhatsAppStatus,
  connectWhatsApp,
  disconnectWhatsApp,
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
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

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
    };
  }, [refreshStatus]);

  const handleConnect = async () => {
    setConnecting(true);
    try {
      const result = await connectWhatsApp();
      setQrCode(result.qrCode);

      // Poll until the number is confirmed connected, then close the QR dialog.
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = setInterval(async () => {
        const next = await getWhatsAppStatus().catch(() => null);
        if (next) {
          setStatus(next);
          if (next.connected) {
            clearInterval(pollRef.current!);
            setQrCode(null);
            toast.success("WhatsApp conectado!");
          }
        }
      }, 4000);
    } catch (error: any) {
      toast.error("Erro ao conectar: " + error.message);
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnectWhatsApp();
      toast.success("WhatsApp desconectado.");
      refreshStatus();
    } catch (error: any) {
      toast.error("Erro ao desconectar: " + error.message);
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

            {status?.connected ? (
              <Button variant="outline" onClick={handleDisconnect} className="gap-2">
                <Unplug className="w-4 h-4" /> Desconectar
              </Button>
            ) : (
              <Button onClick={handleConnect} disabled={connecting} className="gap-2">
                {connecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <QrCode className="w-4 h-4" />}
                Conectar WhatsApp
              </Button>
            )}
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

      <Dialog open={!!qrCode} onOpenChange={(open) => !open && setQrCode(null)}>
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
