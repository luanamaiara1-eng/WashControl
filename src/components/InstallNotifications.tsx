import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Smartphone, Share, PlusSquare, MoreVertical, Bell, BellRing, CheckCircle2 } from "lucide-react";
import { usePushNotifications, isStandalone } from "@/hooks/usePushNotifications";
import { toast } from "sonner";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallNotifications() {
  const [installed, setInstalled] = useState(isStandalone());
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const { isSupported, permission, subscribing, subscribed, subscribe } = usePushNotifications();

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", () => setInstalled(true));
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") setInstalled(true);
    setDeferredPrompt(null);
  };

  const handleEnableNotifications = async () => {
    const ok = await subscribe();
    if (ok) toast.success("Notificações ativadas!");
    else if (permission === "denied") toast.error("As notificações estão bloqueadas no navegador. Ative nas configurações do site.");
    else toast.error("Não foi possível ativar as notificações.");
  };

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Smartphone className="h-5 w-5" /> Instalar o app e ativar notificações
        </CardTitle>
        <CardDescription>
          Instale o WashControl na tela inicial do celular pra abrir como um aplicativo, e ative as
          notificações pra ser avisado na hora de coisas importantes.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {installed ? (
          <div className="flex items-center gap-2 rounded-lg border border-success/30 bg-success/10 p-3 text-sm text-success">
            <CheckCircle2 className="h-4 w-4" /> App já instalado neste aparelho.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border p-4 space-y-2">
              <p className="font-semibold flex items-center gap-2"><Smartphone className="h-4 w-4" /> Android (Chrome)</p>
              {deferredPrompt ? (
                <Button size="sm" onClick={handleInstallClick} className="w-full">Instalar agora</Button>
              ) : (
                <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-1">
                  <li>Abra o WashControl pelo Chrome</li>
                  <li>Toque nos três pontinhos <MoreVertical className="inline h-3 w-3" /> no canto superior</li>
                  <li>Toque em "Instalar aplicativo" ou "Adicionar à tela inicial"</li>
                </ol>
              )}
            </div>
            <div className="rounded-xl border p-4 space-y-2">
              <p className="font-semibold flex items-center gap-2"><Smartphone className="h-4 w-4" /> iPhone (Safari)</p>
              <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-1">
                <li>Abra o WashControl pelo <strong>Safari</strong> (não funciona no Chrome do iPhone)</li>
                <li>Toque no ícone de compartilhar <Share className="inline h-3 w-3" /> na barra inferior</li>
                <li>Role e toque em <PlusSquare className="inline h-3 w-3" /> "Adicionar à Tela de Início"</li>
                <li>Toque em "Adicionar"</li>
              </ol>
            </div>
          </div>
        )}

        <div className="rounded-xl border p-4 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <p className="font-semibold flex items-center gap-2">
              {subscribed ? <BellRing className="h-4 w-4 text-success" /> : <Bell className="h-4 w-4" />}
              Notificações
            </p>
            {subscribed ? (
              <Badge className="bg-success/10 text-success hover:bg-success/10">Ativadas</Badge>
            ) : (
              <Button size="sm" onClick={handleEnableNotifications} disabled={!isSupported || subscribing} className="gap-2">
                <Bell className="h-4 w-4" /> {subscribing ? "Ativando..." : "Ativar notificações"}
              </Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            No iPhone, notificações só funcionam a partir do <strong>iOS 16.4</strong> e somente depois
            de instalar o app na Tela de Início (acima) — abra pelo ícone instalado antes de ativar.
            No Android funciona direto pelo navegador, instalado ou não.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
