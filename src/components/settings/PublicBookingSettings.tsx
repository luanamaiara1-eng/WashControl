import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Link2, Copy, QrCode, ExternalLink, Loader2, Download } from "lucide-react";
import { toast } from "sonner";
import { QRCodeSVG } from "qrcode.react";

interface PublicBookingSettingsProps {
  settings: any;
  onUpdate: () => void;
}

export function PublicBookingSettings({ settings, onUpdate }: PublicBookingSettingsProps) {
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    public_booking_enabled: false,
    public_booking_slug: "",
    min_advance_hours: 2,
    max_advance_days: 7,
    allow_client_cancellation: true,
    cancellation_limit_hours: 2,
    max_simultaneous_vehicles: 3,
    service_interval_minutes: 15,
  });

  useEffect(() => {
    if (settings) {
      setFormData({
        public_booking_enabled: settings.public_booking_enabled || false,
        public_booking_slug: settings.public_booking_slug || "",
        min_advance_hours: settings.min_advance_hours || 2,
        max_advance_days: settings.max_advance_days || 7,
        allow_client_cancellation: settings.allow_client_cancellation ?? true,
        cancellation_limit_hours: settings.cancellation_limit_hours || 2,
        max_simultaneous_vehicles: settings.max_simultaneous_vehicles || 3,
        service_interval_minutes: settings.service_interval_minutes || 15,
      });
    }
  }, [settings]);

  const generateSlug = async () => {
    if (!settings?.business_name) {
      toast.error("Defina o nome do estabelecimento primeiro");
      return;
    }

    const slug = settings.business_name
      .toLowerCase()
      .replace(/[^a-zA-Z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();

    setFormData((prev) => ({ ...prev, public_booking_slug: slug }));
  };

  const checkSlugAvailability = async (slug: string): Promise<boolean> => {
    if (!slug) return true;
    
    const { data, error } = await supabase
      .from("business_settings")
      .select("user_id")
      .eq("public_booking_slug", slug)
      .neq("user_id", user?.id || "")
      .maybeSingle();

    if (error) {
      console.error("Error checking slug:", error);
      return false;
    }

    return !data; // true if slug is available (no other user has it)
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);

    try {
      // Validate slug format
      if (formData.public_booking_slug && formData.public_booking_slug.length < 3) {
        toast.error("O slug deve ter pelo menos 3 caracteres");
        setSaving(false);
        return;
      }

      // Check if slug is available
      if (formData.public_booking_slug) {
        const isAvailable = await checkSlugAvailability(formData.public_booking_slug);
        if (!isAvailable) {
          toast.error("Este slug já está em uso. Escolha outro nome.");
          setSaving(false);
          return;
        }
      }

      const { error } = await supabase
        .from("business_settings")
        .update({
          public_booking_enabled: formData.public_booking_enabled,
          public_booking_slug: formData.public_booking_slug || null,
          min_advance_hours: formData.min_advance_hours,
          max_advance_days: formData.max_advance_days,
          allow_client_cancellation: formData.allow_client_cancellation,
          cancellation_limit_hours: formData.cancellation_limit_hours,
          max_simultaneous_vehicles: formData.max_simultaneous_vehicles,
          service_interval_minutes: formData.service_interval_minutes,
        })
        .eq("user_id", user.id);

      if (error) throw error;
      toast.success("Configurações do link público salvas!");
      onUpdate();
    } catch (error: any) {
      toast.error("Erro ao salvar: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  const publicUrl = formData.public_booking_slug
    ? `${window.location.origin}/agendar/${formData.public_booking_slug}`
    : "";

  const copyLink = () => {
    if (publicUrl) {
      navigator.clipboard.writeText(publicUrl);
      toast.success("Link copiado!");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Link2 className="w-4 h-4" />
          Link Público de Agendamento
        </CardTitle>
        <CardDescription>
          Permita que clientes agendem online sem precisar de login
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Label>Ativar Link Público</Label>
            <p className="text-sm text-muted-foreground">
              Clientes poderão agendar pelo link
            </p>
          </div>
          <Switch
            checked={formData.public_booking_enabled}
            onCheckedChange={(checked) =>
              setFormData((prev) => ({ ...prev, public_booking_enabled: checked }))
            }
          />
        </div>

        <Separator />

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Slug do Link</Label>
            <div className="flex gap-2">
              <Input
                value={formData.public_booking_slug}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    public_booking_slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""),
                  }))
                }
                placeholder="meu-lava-rapido"
              />
              <Button variant="outline" onClick={generateSlug}>
                Gerar
              </Button>
            </div>
          </div>

          {publicUrl && (
            <div className="p-3 bg-muted rounded-lg space-y-3">
              <p className="text-sm text-muted-foreground">Seu link:</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-sm break-all">{publicUrl}</code>
                <Button variant="ghost" size="icon" onClick={copyLink} title="Copiar link">
                  <Copy className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" asChild title="Abrir link">
                  <a href={publicUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </Button>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="icon" title="QR Code">
                      <QrCode className="w-4 h-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>QR Code do Link Público</DialogTitle>
                    </DialogHeader>
                    <div className="flex flex-col items-center gap-4 py-4">
                      <div className="bg-white p-4 rounded-lg" id="qrcode-container">
                        <QRCodeSVG
                          value={publicUrl}
                          size={200}
                          level="H"
                          includeMargin
                        />
                      </div>
                      <p className="text-sm text-muted-foreground text-center break-all">
                        {publicUrl}
                      </p>
                      <Button
                        onClick={() => {
                          const svg = document.querySelector("#qrcode-container svg");
                          if (svg) {
                            const svgData = new XMLSerializer().serializeToString(svg);
                            const canvas = document.createElement("canvas");
                            const ctx = canvas.getContext("2d");
                            const img = new Image();
                            img.onload = () => {
                              canvas.width = img.width;
                              canvas.height = img.height;
                              ctx?.drawImage(img, 0, 0);
                              const link = document.createElement("a");
                              link.download = `qrcode-${formData.public_booking_slug}.png`;
                              link.href = canvas.toDataURL("image/png");
                              link.click();
                            };
                            img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
                          }
                        }}
                        className="w-full"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Baixar QR Code
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          )}
        </div>

        <Separator />

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Antecedência Mínima (horas)</Label>
            <Input
              type="number"
              min="1"
              value={formData.min_advance_hours}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, min_advance_hours: parseInt(e.target.value) || 2 }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Antecedência Máxima (dias)</Label>
            <Input
              type="number"
              min="1"
              max="30"
              value={formData.max_advance_days}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, max_advance_days: parseInt(e.target.value) || 7 }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Intervalo entre Serviços (min)</Label>
            <Input
              type="number"
              min="5"
              step="5"
              value={formData.service_interval_minutes}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  service_interval_minutes: parseInt(e.target.value) || 15,
                }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Veículos Simultâneos</Label>
            <Input
              type="number"
              min="1"
              value={formData.max_simultaneous_vehicles}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  max_simultaneous_vehicles: parseInt(e.target.value) || 3,
                }))
              }
            />
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <Label>Permitir Cancelamento pelo Cliente</Label>
            <p className="text-sm text-muted-foreground">
              Cliente pode cancelar pelo link
            </p>
          </div>
          <Switch
            checked={formData.allow_client_cancellation}
            onCheckedChange={(checked) =>
              setFormData((prev) => ({ ...prev, allow_client_cancellation: checked }))
            }
          />
        </div>

        <Button onClick={handleSave} disabled={saving} className="w-full">
          {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
          Salvar Configurações
        </Button>
      </CardContent>
    </Card>
  );
}
