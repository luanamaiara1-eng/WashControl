import { useRef } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Printer, Droplets, Share2, Instagram, Globe, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Appointment } from "@/types/database";
import { useBusinessSettings } from "@/hooks/useConfiguracoes";

interface ServiceNoteProps {
  open: boolean;
  onClose: () => void;
  appointment: Appointment;
}

const paymentMethodLabels: Record<string, string> = {
  cash: "Dinheiro",
  pix: "PIX",
  credit_card: "Cartão de Crédito",
  debit_card: "Cartão de Débito",
  transfer: "Transferência",
  other: "Outro",
};

const ServiceNote = ({ open, onClose, appointment }: ServiceNoteProps) => {
  const { data: settings } = useBusinessSettings();
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    // Use custom color from settings or fallback to primary
    const primaryColor = (settings as any)?.primary_color || '#3b82f6';

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Nota de Serviço - ${appointment.clients?.name || "Cliente"}</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              padding: 20px;
              max-width: 400px;
              margin: 0 auto;
              color: #333;
            }
            .header {
              display: flex;
              align-items: center;
              gap: 12px;
              padding-bottom: 16px;
              border-bottom: 2px dashed #ddd;
              margin-bottom: 16px;
            }
            .logo {
              width: 64px;
              height: 64px;
              border-radius: 12px;
              object-fit: cover;
              flex-shrink: 0;
            }
            .logo-placeholder {
              width: 64px;
              height: 64px;
              border-radius: 12px;
              background: ${primaryColor};
              display: flex;
              align-items: center;
              justify-content: center;
              flex-shrink: 0;
            }
            .logo-placeholder svg {
              width: 32px;
              height: 32px;
              color: white;
            }
            .business-info {
              flex: 1;
              min-width: 0;
            }
            .business-name {
              font-size: 18px;
              font-weight: bold;
              color: ${primaryColor};
              margin-bottom: 2px;
            }
            .business-contact {
              font-size: 11px;
              color: #666;
              line-height: 1.4;
            }
            .section {
              margin-bottom: 16px;
            }
            .section-title {
              font-size: 12px;
              font-weight: 600;
              color: ${primaryColor};
              margin-bottom: 8px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .row {
              display: flex;
              justify-content: space-between;
              font-size: 12px;
              padding: 4px 0;
            }
            .row-label {
              color: #666;
            }
            .row-value {
              font-weight: 500;
              text-align: right;
            }
            .divider {
              border-top: 1px dashed #ddd;
              margin: 12px 0;
            }
            .total-section {
              background: #f5f5f5;
              padding: 12px;
              border-radius: 8px;
              margin-top: 16px;
            }
            .total-row {
              display: flex;
              justify-content: space-between;
              font-size: 16px;
              font-weight: bold;
            }
            .total-value {
              color: ${primaryColor};
            }
            .footer {
              text-align: center;
              padding-top: 16px;
              border-top: 2px dashed #ddd;
              margin-top: 16px;
            }
            .footer-text {
              font-size: 11px;
              color: #666;
            }
            .thank-you {
              font-size: 14px;
              font-weight: 600;
              color: ${primaryColor};
              margin-bottom: 4px;
            }
            .powered-by {
              font-size: 9px;
              color: #aaa;
              margin-top: 16px;
            }
            @media print {
              body {
                padding: 10px;
              }
            }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  const handleShareWhatsApp = () => {
    const clientPhone = appointment.clients?.phone?.replace(/\D/g, "");
    
    const businessName = settings?.business_name || "WashControl";
    const clientName = appointment.clients?.name || "Cliente";
    const vehicleInfo = appointment.vehicles 
      ? `${appointment.vehicles.brand} ${appointment.vehicles.model} - ${appointment.vehicles.plate}`
      : "Não informado";
    const serviceName = appointment.services?.name || "Serviço";
    const price = Number(appointment.price || 0).toFixed(2);
    const date = format(new Date(appointment.scheduled_date), "dd/MM/yyyy", { locale: ptBR });
    const time = appointment.scheduled_time?.slice(0, 5) || "";
    const paymentMethod = appointment.payment_method 
      ? paymentMethodLabels[appointment.payment_method] || appointment.payment_method
      : "";

    let message = `*${businessName}*\n`;
    message += `━━━━━━━━━━━━━━━━━━\n\n`;
    message += `📋 *NOTA DE SERVIÇO*\n\n`;
    message += `👤 *Cliente:* ${clientName}\n`;
    message += `🚗 *Veículo:* ${vehicleInfo}\n`;
    message += `🔧 *Serviço:* ${serviceName}\n`;
    message += `📅 *Data:* ${date} às ${time}\n`;
    if (paymentMethod) {
      message += `💳 *Pagamento:* ${paymentMethod}\n`;
    }
    message += `\n💰 *TOTAL: R$ ${price}*\n\n`;
    message += `━━━━━━━━━━━━━━━━━━\n`;
    message += `✨ Obrigado pela preferência!`;

    const encodedMessage = encodeURIComponent(message);
    
    // If client has phone, send directly to them, otherwise open WhatsApp to choose contact
    const whatsappUrl = clientPhone 
      ? `https://wa.me/55${clientPhone}?text=${encodedMessage}`
      : `https://wa.me/?text=${encodedMessage}`;
    
    window.open(whatsappUrl, "_blank");
    toast.success("Abrindo WhatsApp...");
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Nota de Serviço</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleShareWhatsApp} className="text-green-600 border-green-600 hover:bg-green-50">
                <Share2 className="w-4 h-4" />
                WhatsApp
              </Button>
              <Button variant="hero" size="sm" onClick={handlePrint}>
                <Printer className="w-4 h-4" />
                Imprimir
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        {/* Preview */}
        <div 
          ref={printRef}
          className="bg-background rounded-lg border border-border p-6 text-sm"
        >
          {/* Header */}
          <div className="flex items-center gap-4 pb-4 border-b-2 border-dashed border-border mb-4">
            {settings?.logo_url ? (
              <img 
                src={settings.logo_url} 
                alt="Logo" 
                className="w-16 h-16 rounded-xl object-cover flex-shrink-0"
              />
            ) : (
              <div className="w-16 h-16 rounded-xl gradient-primary flex items-center justify-center flex-shrink-0">
                <Droplets className="w-8 h-8 text-primary-foreground" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-bold text-primary truncate">
                {settings?.business_name || "WashControl"}
              </h2>
              {(settings as any)?.document && (
                <p className="text-xs text-muted-foreground truncate">
                  {(settings as any).document}
                </p>
              )}
              {(settings?.phone || settings?.email) && (
                <p className="text-xs text-muted-foreground truncate">
                  {settings?.phone}
                  {settings?.phone && settings?.email && " • "}
                  {settings?.email}
                </p>
              )}
              {(settings?.address || settings?.city) && (
                <p className="text-xs text-muted-foreground truncate">
                  {settings?.address}
                  {settings?.address && settings?.city && ", "}
                  {settings?.city}
                  {settings?.state && ` - ${settings?.state}`}
                </p>
              )}
              {((settings as any)?.instagram || (settings as any)?.website || (settings as any)?.whatsapp) && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                  {(settings as any)?.whatsapp && (
                    <span className="flex items-center gap-1">
                      <MessageCircle className="w-3 h-3" />
                      {(settings as any).whatsapp}
                    </span>
                  )}
                  {(settings as any)?.instagram && (
                    <span className="flex items-center gap-1">
                      <Instagram className="w-3 h-3" />
                      {(settings as any).instagram}
                    </span>
                  )}
                  {(settings as any)?.website && (
                    <span className="flex items-center gap-1">
                      <Globe className="w-3 h-3" />
                      {(settings as any).website}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Date & Time */}
          <div className="mb-4">
            <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-2">
              Data do Serviço
            </p>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Data</span>
              <span className="font-medium">
                {format(new Date(appointment.scheduled_date), "dd/MM/yyyy", { locale: ptBR })}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Horário</span>
              <span className="font-medium">{appointment.scheduled_time?.slice(0, 5)}</span>
            </div>
          </div>

          <div className="border-t border-dashed border-border my-3" />

          {/* Client */}
          <div className="mb-4">
            <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-2">
              Cliente
            </p>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Nome</span>
              <span className="font-medium">{appointment.clients?.name || "-"}</span>
            </div>
            {appointment.clients?.phone && (
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Telefone</span>
                <span className="font-medium">{appointment.clients.phone}</span>
              </div>
            )}
          </div>

          <div className="border-t border-dashed border-border my-3" />

          {/* Vehicle */}
          <div className="mb-4">
            <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-2">
              Veículo
            </p>
            {appointment.vehicles ? (
              <>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Modelo</span>
                  <span className="font-medium">
                    {appointment.vehicles.brand} {appointment.vehicles.model}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Placa</span>
                  <span className="font-medium">{appointment.vehicles.plate}</span>
                </div>
                {appointment.vehicles.color && (
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Cor</span>
                    <span className="font-medium">{appointment.vehicles.color}</span>
                  </div>
                )}
              </>
            ) : (
              <p className="text-xs text-muted-foreground">Não informado</p>
            )}
          </div>

          <div className="border-t border-dashed border-border my-3" />

          {/* Service */}
          <div className="mb-4">
            <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-2">
              Serviço
            </p>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Descrição</span>
              <span className="font-medium">{appointment.services?.name || "-"}</span>
            </div>
            {appointment.employees && (
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Responsável</span>
                <span className="font-medium">{appointment.employees.name}</span>
              </div>
            )}
          </div>

          {/* Notes */}
          {appointment.notes && (
            <>
              <div className="border-t border-dashed border-border my-3" />
              <div className="mb-4">
                <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-2">
                  Observações
                </p>
                <p className="text-xs text-muted-foreground">{appointment.notes}</p>
              </div>
            </>
          )}

          {/* Total */}
          <div className="bg-muted/50 rounded-lg p-3 mt-4">
            <div className="flex justify-between items-center">
              <span className="font-semibold">Total</span>
              <span className="text-lg font-bold text-primary">
                R$ {Number(appointment.price || 0).toFixed(2)}
              </span>
            </div>
            {appointment.payment_method && (
              <div className="flex justify-between text-xs mt-1">
                <span className="text-muted-foreground">Pagamento</span>
                <span className="font-medium">
                  {paymentMethodLabels[appointment.payment_method] || appointment.payment_method}
                </span>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="text-center pt-4 border-t-2 border-dashed border-border mt-4">
            <p className="text-sm font-semibold text-primary">
              {(settings as any)?.note_footer_message || "Obrigado pela preferência!"}
            </p>
            <p className="text-xs text-muted-foreground">
              Volte sempre
            </p>
            <p className="text-[10px] text-muted-foreground/50 mt-4">
              Powered by WashControl
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ServiceNote;
