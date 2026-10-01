import { useState, useEffect } from "react";
import { useBusinessSettings, useSaveBusinessSettings, WorkingHours } from "@/hooks/useConfiguracoes";
import { useAuth } from "@/hooks/useAuth";
import { useFixedExpenses, useCreateFixedExpense, useUpdateFixedExpense, useDeleteFixedExpense, FixedExpense } from "@/hooks/useFixedExpenses";
import { PublicBookingSettings } from "@/components/settings/PublicBookingSettings";
import { WhatsAppSettings } from "@/components/settings/WhatsAppSettings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { CurrencyInput, parseCurrencyToNumber, formatNumberToCurrency } from "@/components/ui/currency-input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Building2,
  Clock,
  Bell,
  Settings,
  Save,
  MapPin,
  Phone,
  Mail,
  User,
  Users,
  Wallet,
  Plus,
  Pencil,
  Trash2,
  Calendar,
  Upload,
  Image,
  X,
  Droplets,
  FileText,
  Instagram,
  Globe,
  MessageCircle,
  Link2,
  RefreshCw,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const weekDays = [
  { key: "monday", label: "Segunda-feira" },
  { key: "tuesday", label: "Terça-feira" },
  { key: "wednesday", label: "Quarta-feira" },
  { key: "thursday", label: "Quinta-feira" },
  { key: "friday", label: "Sexta-feira" },
  { key: "saturday", label: "Sábado" },
  { key: "sunday", label: "Domingo" },
] as const;

const expenseCategories = [
  "Aluguel",
  "Energia",
  "Água",
  "Internet",
  "Telefone",
  "Salários",
  "Impostos",
  "Seguro",
  "Manutenção",
  "Fornecedores",
  "Outros",
];

const brazilianStates = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA",
  "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN",
  "RS", "RO", "RR", "SC", "SP", "SE", "TO",
];

const ConfiguracoesPage = () => {
  const { user } = useAuth();
  const { data: settings, isLoading, refetch: refetchSettings } = useBusinessSettings();
  const saveSettings = useSaveBusinessSettings();
  
  // Fixed expenses
  const { data: fixedExpenses = [], isLoading: isLoadingExpenses } = useFixedExpenses();
  const createExpense = useCreateFixedExpense();
  const updateExpense = useUpdateFixedExpense();
  const deleteExpense = useDeleteFixedExpense();

  const [expenseDialogOpen, setExpenseDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<FixedExpense | null>(null);
  const [expenseForm, setExpenseForm] = useState({
    name: "",
    amount: "",
    due_day: "",
    category: "",
    description: "",
    reminder_days_before: "3",
    is_active: true,
  });

  const [formData, setFormData] = useState({
    business_name: "",
    document: "",
    phone: "",
    whatsapp: "",
    email: "",
    instagram: "",
    website: "",
    address: "",
    city: "",
    state: "",
    zip_code: "",
    logo_url: "",
    primary_color: "#3b82f6",
    note_footer_message: "Obrigado pela preferência!",
    working_hours: {
      monday: { open: "08:00", close: "18:00", enabled: true },
      tuesday: { open: "08:00", close: "18:00", enabled: true },
      wednesday: { open: "08:00", close: "18:00", enabled: true },
      thursday: { open: "08:00", close: "18:00", enabled: true },
      friday: { open: "08:00", close: "18:00", enabled: true },
      saturday: { open: "08:00", close: "12:00", enabled: true },
      sunday: { open: "", close: "", enabled: false },
    } as WorkingHours,
    default_appointment_duration: 60,
    allow_online_booking: false,
    send_reminders: true,
    reminder_hours_before: 24,
    currency: "BRL",
    timezone: "America/Sao_Paulo",
    show_employee_commission: true,
    show_service_values_to_employees: false,
  });

  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (settings) {
      setFormData({
        business_name: settings.business_name || "",
        document: (settings as any).document || "",
        phone: settings.phone || "",
        whatsapp: (settings as any).whatsapp || "",
        email: settings.email || "",
        instagram: (settings as any).instagram || "",
        website: (settings as any).website || "",
        address: settings.address || "",
        city: settings.city || "",
        state: settings.state || "",
        zip_code: settings.zip_code || "",
        logo_url: settings.logo_url || "",
        primary_color: (settings as any).primary_color || "#3b82f6",
        note_footer_message: (settings as any).note_footer_message || "Obrigado pela preferência!",
        working_hours: settings.working_hours,
        default_appointment_duration: settings.default_appointment_duration,
        allow_online_booking: settings.allow_online_booking,
        send_reminders: settings.send_reminders,
        reminder_hours_before: settings.reminder_hours_before,
        currency: settings.currency,
        timezone: settings.timezone,
        show_employee_commission: settings.show_employee_commission,
        show_service_values_to_employees: settings.show_service_values_to_employees,
      });
    }
  }, [settings]);

  const handleSave = async () => {
    await saveSettings.mutateAsync(formData);
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Por favor, selecione uma imagem");
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error("A imagem deve ter no máximo 2MB");
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/logo.${fileExt}`;

      // Delete old logo if exists
      if (formData.logo_url) {
        const oldPath = formData.logo_url.split("/logos/")[1];
        if (oldPath) {
          await supabase.storage.from("logos").remove([oldPath]);
        }
      }

      const { error: uploadError } = await supabase.storage
        .from("logos")
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: publicUrl } = supabase.storage
        .from("logos")
        .getPublicUrl(fileName);

      setFormData((prev) => ({ ...prev, logo_url: publicUrl.publicUrl }));
      toast.success("Logo carregado com sucesso!");
    } catch (error: any) {
      toast.error("Erro ao carregar logo: " + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveLogo = async () => {
    if (!formData.logo_url || !user) return;

    try {
      const path = formData.logo_url.split("/logos/")[1];
      if (path) {
        await supabase.storage.from("logos").remove([path]);
      }
      setFormData((prev) => ({ ...prev, logo_url: "" }));
      toast.success("Logo removido");
    } catch (error: any) {
      toast.error("Erro ao remover logo: " + error.message);
    }
  };

  const updateWorkingHours = (
    day: keyof WorkingHours,
    field: "open" | "close" | "enabled",
    value: string | boolean
  ) => {
    setFormData((prev) => ({
      ...prev,
      working_hours: {
        ...prev.working_hours,
        [day]: {
          ...prev.working_hours[day],
          [field]: value,
        },
      },
    }));
  };

  const resetExpenseForm = () => {
    setExpenseForm({
      name: "",
      amount: "",
      due_day: "",
      category: "",
      description: "",
      reminder_days_before: "3",
      is_active: true,
    });
    setEditingExpense(null);
  };

  const openEditExpense = (expense: FixedExpense) => {
    setEditingExpense(expense);
    setExpenseForm({
      name: expense.name,
      amount: formatNumberToCurrency(expense.amount),
      due_day: expense.due_day.toString(),
      category: expense.category || "",
      description: expense.description || "",
      reminder_days_before: (expense.reminder_days_before || 3).toString(),
      is_active: expense.is_active,
    });
    setExpenseDialogOpen(true);
  };

  const handleSaveExpense = async () => {
    const expenseData = {
      name: expenseForm.name,
      amount: parseCurrencyToNumber(expenseForm.amount),
      due_day: parseInt(expenseForm.due_day),
      category: expenseForm.category || null,
      description: expenseForm.description || null,
      reminder_days_before: parseInt(expenseForm.reminder_days_before),
      is_active: expenseForm.is_active,
    };

    if (editingExpense) {
      await updateExpense.mutateAsync({ id: editingExpense.id, ...expenseData });
    } else {
      await createExpense.mutateAsync(expenseData);
    }
    
    setExpenseDialogOpen(false);
    resetExpenseForm();
  };

  const handleDeleteExpense = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir este gasto fixo?")) {
      await deleteExpense.mutateAsync(id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Configurações</h2>
          <p className="text-sm text-muted-foreground">Gerencie as configurações do seu estabelecimento</p>
        </div>
        <Button variant="hero" onClick={handleSave} disabled={saveSettings.isPending}>
          <Save className="w-4 h-4" />
          {saveSettings.isPending ? "Salvando..." : "Salvar"}
        </Button>
      </div>

      <Tabs defaultValue="business" className="space-y-6">
        <TabsList className="grid w-full grid-cols-7 lg:w-auto lg:inline-grid">
          <TabsTrigger value="business" className="flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            <span className="hidden sm:inline">Estabelecimento</span>
          </TabsTrigger>
          <TabsTrigger value="hours" className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            <span className="hidden sm:inline">Horários</span>
          </TabsTrigger>
          <TabsTrigger value="public-booking" className="flex items-center gap-2">
            <Link2 className="w-4 h-4" />
            <span className="hidden sm:inline">Link Público</span>
          </TabsTrigger>
          <TabsTrigger value="whatsapp" className="flex items-center gap-2">
            <MessageCircle className="w-4 h-4" />
            <span className="hidden sm:inline">WhatsApp</span>
          </TabsTrigger>
          <TabsTrigger value="expenses" className="flex items-center gap-2">
            <Wallet className="w-4 h-4" />
            <span className="hidden sm:inline">Gastos Fixos</span>
          </TabsTrigger>
          <TabsTrigger value="preferences" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            <span className="hidden sm:inline">Preferências</span>
          </TabsTrigger>
          <TabsTrigger value="system" className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            <span className="hidden sm:inline">Sistema</span>
          </TabsTrigger>
        </TabsList>

        {/* Business Tab */}
        <TabsContent value="business" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                Dados do Estabelecimento
              </CardTitle>
              <CardDescription>Informações básicas sobre seu negócio</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="business_name">Nome do Estabelecimento</Label>
                  <Input
                    id="business_name"
                    value={formData.business_name}
                    onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                    placeholder="Ex: Lava-Rápido Express"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="document">CNPJ/CPF</Label>
                  <Input
                    id="document"
                    value={formData.document}
                    onChange={(e) => setFormData({ ...formData, document: e.target.value })}
                    placeholder="00.000.000/0000-00"
                  />
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone" className="flex items-center gap-2">
                    <Phone className="w-3 h-3" /> Telefone
                  </Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="(00) 00000-0000"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="whatsapp" className="flex items-center gap-2">
                    <MessageCircle className="w-3 h-3" /> WhatsApp
                  </Label>
                  <Input
                    id="whatsapp"
                    value={formData.whatsapp}
                    onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                    placeholder="(00) 00000-0000"
                  />
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-2">
                    <Mail className="w-3 h-3" /> Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="contato@empresa.com"
                  />
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="instagram" className="flex items-center gap-2">
                    <Instagram className="w-3 h-3" /> Instagram
                  </Label>
                  <Input
                    id="instagram"
                    value={formData.instagram}
                    onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                    placeholder="@seuinstagram"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website" className="flex items-center gap-2">
                    <Globe className="w-3 h-3" /> Site
                  </Label>
                  <Input
                    id="website"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    placeholder="www.seusite.com.br"
                  />
                </div>
              </div>

              {/* Logo Upload Section */}
              <Separator className="my-4" />
              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <Image className="w-3 h-3" /> Logo do Estabelecimento
                </Label>
                <div className="flex items-center gap-4">
                  {formData.logo_url ? (
                    <div className="relative">
                      <img
                        src={formData.logo_url}
                        alt="Logo"
                        className="w-20 h-20 object-contain rounded-lg border bg-background"
                      />
                      <button
                        type="button"
                        onClick={handleRemoveLogo}
                        className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 hover:bg-destructive/90 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-20 h-20 border-2 border-dashed rounded-lg flex items-center justify-center bg-muted/50">
                      <Image className="w-6 h-6 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1">
                    <Label
                      htmlFor="logo-upload"
                      className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
                    >
                      <Upload className="w-4 h-4" />
                      {uploading ? "Carregando..." : "Escolher imagem"}
                    </Label>
                    <input
                      id="logo-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      disabled={uploading}
                      className="hidden"
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      PNG, JPG ou SVG. Máximo 2MB.
                    </p>
                  </div>
                </div>
              </div>

              {/* Color Picker Section */}
              <Separator className="my-4" />
              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  Cor Principal (Nota de Serviço)
                </Label>
                <div className="flex items-center gap-4">
                  <input
                    type="color"
                    value={formData.primary_color}
                    onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                    className="w-12 h-12 rounded-lg border cursor-pointer"
                  />
                  <div className="flex-1">
                    <Input
                      value={formData.primary_color}
                      onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                      placeholder="#3b82f6"
                      className="w-32"
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      Cor usada nos títulos e destaques da nota de serviço
                    </p>
                  </div>
                </div>
              </div>

              {/* Footer Message Section */}
              <Separator className="my-4" />
              <div className="space-y-3">
                <Label htmlFor="note_footer_message">
                  Mensagem de Rodapé da Nota
                </Label>
                <Input
                  id="note_footer_message"
                  value={formData.note_footer_message}
                  onChange={(e) => setFormData({ ...formData, note_footer_message: e.target.value })}
                  placeholder="Obrigado pela preferência!"
                />
                <p className="text-xs text-muted-foreground">
                  Mensagem exibida no final da nota de serviço
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Service Note Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Prévia da Nota de Serviço
              </CardTitle>
              <CardDescription>Visualize como a nota ficará com as configurações atuais</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-white rounded-lg border p-4 text-sm max-w-xs mx-auto shadow-sm">
                {/* Header Preview */}
                <div className="flex items-center gap-3 pb-3 border-b-2 border-dashed border-gray-200 mb-3">
                  {formData.logo_url ? (
                    <img 
                      src={formData.logo_url} 
                      alt="Logo" 
                      className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                    />
                  ) : (
                    <div 
                      className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: formData.primary_color }}
                    >
                      <Droplets className="w-6 h-6 text-white" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 
                      className="text-sm font-bold truncate"
                      style={{ color: formData.primary_color }}
                    >
                      {formData.business_name || "Nome da Empresa"}
                    </h3>
                    {formData.document && (
                      <p className="text-[10px] text-gray-500 truncate">
                        {formData.document}
                      </p>
                    )}
                    {(formData.phone || formData.email) && (
                      <p className="text-[10px] text-gray-500 truncate">
                        {formData.phone}
                        {formData.phone && formData.email && " • "}
                        {formData.email}
                      </p>
                    )}
                    {(formData.instagram || formData.website || formData.whatsapp) && (
                      <div className="flex items-center gap-2 text-[10px] text-gray-500 flex-wrap">
                        {formData.whatsapp && (
                          <span className="flex items-center gap-0.5">
                            <MessageCircle className="w-2.5 h-2.5" />
                            {formData.whatsapp}
                          </span>
                        )}
                        {formData.instagram && (
                          <span className="flex items-center gap-0.5">
                            <Instagram className="w-2.5 h-2.5" />
                            {formData.instagram}
                          </span>
                        )}
                        {formData.website && (
                          <span className="flex items-center gap-0.5">
                            <Globe className="w-2.5 h-2.5" />
                            {formData.website}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Sample Content */}
                <div className="space-y-2">
                  <p 
                    className="text-[10px] font-semibold uppercase tracking-wide"
                    style={{ color: formData.primary_color }}
                  >
                    Data do Serviço
                  </p>
                  <div className="flex justify-between text-[10px]">
                    <span className="text-gray-500">Data</span>
                    <span className="font-medium text-gray-700">28/12/2025</span>
                  </div>
                  <div className="flex justify-between text-[10px]">
                    <span className="text-gray-500">Horário</span>
                    <span className="font-medium text-gray-700">14:00</span>
                  </div>
                </div>

                <div className="border-t border-dashed border-gray-200 my-2" />

                {/* Total Preview */}
                <div 
                  className="rounded-md p-2 mt-2"
                  style={{ backgroundColor: `${formData.primary_color}10` }}
                >
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-semibold text-gray-700">Total</span>
                    <span 
                      className="text-sm font-bold"
                      style={{ color: formData.primary_color }}
                    >
                      R$ 150,00
                    </span>
                  </div>
                </div>

                {/* Footer Preview */}
                <div className="text-center pt-2 border-t border-dashed border-gray-200 mt-2">
                  <p 
                    className="text-[10px] font-semibold"
                    style={{ color: formData.primary_color }}
                  >
                    {formData.note_footer_message || "Obrigado pela preferência!"}
                  </p>
                  <p className="text-[8px] text-gray-400 mt-2">
                    Powered by WashControl
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Endereço
              </CardTitle>
              <CardDescription>Localização do estabelecimento</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="address">Endereço</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Rua, número, complemento"
                />
              </div>
              <div className="grid sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">Cidade</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">Estado</Label>
                  <Select
                    value={formData.state}
                    onValueChange={(value) => setFormData({ ...formData, state: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {brazilianStates.map((state) => (
                        <SelectItem key={state} value={state}>
                          {state}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="zip_code">CEP</Label>
                  <Input
                    id="zip_code"
                    value={formData.zip_code}
                    onChange={(e) => setFormData({ ...formData, zip_code: e.target.value })}
                    placeholder="00000-000"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <User className="w-4 h-4" />
                Conta
              </CardTitle>
              <CardDescription>Informações da sua conta</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label>Email da Conta</Label>
                <Input value={user?.email || ""} disabled className="bg-muted" />
                <p className="text-xs text-muted-foreground">Este é o email usado para login</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Hours Tab */}
        <TabsContent value="hours" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Horário de Funcionamento
              </CardTitle>
              <CardDescription>Configure os horários de atendimento para cada dia da semana</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {weekDays.map(({ key, label }) => (
                <div key={key} className="flex items-center gap-4 py-2">
                  <div className="flex items-center gap-3 w-40">
                    <Switch
                      checked={formData.working_hours[key].enabled}
                      onCheckedChange={(checked) => updateWorkingHours(key, "enabled", checked)}
                    />
                    <span className={`text-sm font-medium ${!formData.working_hours[key].enabled && "text-muted-foreground"}`}>
                      {label}
                    </span>
                  </div>
                  {formData.working_hours[key].enabled ? (
                    <div className="flex items-center gap-2">
                      <Input
                        type="time"
                        value={formData.working_hours[key].open}
                        onChange={(e) => updateWorkingHours(key, "open", e.target.value)}
                        className="w-28"
                      />
                      <span className="text-muted-foreground">até</span>
                      <Input
                        type="time"
                        value={formData.working_hours[key].close}
                        onChange={(e) => updateWorkingHours(key, "close", e.target.value)}
                        className="w-28"
                      />
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">Fechado</span>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Public Booking Tab */}
        <TabsContent value="public-booking" className="space-y-6">
          <PublicBookingSettings settings={settings} onUpdate={refetchSettings} />
        </TabsContent>

        {/* WhatsApp Tab */}
        <TabsContent value="whatsapp" className="space-y-6">
          <WhatsAppSettings settings={settings} onUpdate={refetchSettings} />
        </TabsContent>

        {/* Fixed Expenses Tab */}
        <TabsContent value="expenses" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Wallet className="w-4 h-4" />
                    Gastos Fixos
                  </CardTitle>
                  <CardDescription>Cadastre suas despesas mensais recorrentes</CardDescription>
                </div>
                <Dialog open={expenseDialogOpen} onOpenChange={(open) => {
                  setExpenseDialogOpen(open);
                  if (!open) resetExpenseForm();
                }}>
                  <DialogTrigger asChild>
                    <Button variant="hero" size="sm">
                      <Plus className="w-4 h-4" />
                      Novo Gasto
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{editingExpense ? "Editar Gasto Fixo" : "Novo Gasto Fixo"}</DialogTitle>
                      <DialogDescription>
                        {editingExpense ? "Atualize os dados do gasto fixo" : "Adicione uma despesa mensal recorrente"}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="expense_name">Nome</Label>
                        <Input
                          id="expense_name"
                          value={expenseForm.name}
                          onChange={(e) => setExpenseForm({ ...expenseForm, name: e.target.value })}
                          placeholder="Ex: Aluguel do galpão"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="expense_amount">Valor</Label>
                          <CurrencyInput
                            id="expense_amount"
                            value={expenseForm.amount}
                            onChange={(value) => setExpenseForm({ ...expenseForm, amount: value })}
                            placeholder="0,00"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="expense_day">Dia do Vencimento</Label>
                          <Input
                            id="expense_day"
                            type="number"
                            min="1"
                            max="31"
                            value={expenseForm.due_day}
                            onChange={(e) => setExpenseForm({ ...expenseForm, due_day: e.target.value })}
                            placeholder="1-31"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Categoria</Label>
                          <Select
                            value={expenseForm.category}
                            onValueChange={(value) => setExpenseForm({ ...expenseForm, category: value })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                            <SelectContent>
                              {expenseCategories.map((cat) => (
                                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Lembrete (dias antes)</Label>
                          <Select
                            value={expenseForm.reminder_days_before}
                            onValueChange={(value) => setExpenseForm({ ...expenseForm, reminder_days_before: value })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1">1 dia</SelectItem>
                              <SelectItem value="2">2 dias</SelectItem>
                              <SelectItem value="3">3 dias</SelectItem>
                              <SelectItem value="5">5 dias</SelectItem>
                              <SelectItem value="7">7 dias</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="expense_description">Descrição (opcional)</Label>
                        <Input
                          id="expense_description"
                          value={expenseForm.description}
                          onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                          placeholder="Observações sobre este gasto"
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Ativo</p>
                          <p className="text-sm text-muted-foreground">Exibir nos lembretes</p>
                        </div>
                        <Switch
                          checked={expenseForm.is_active}
                          onCheckedChange={(checked) => setExpenseForm({ ...expenseForm, is_active: checked })}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setExpenseDialogOpen(false)}>
                        Cancelar
                      </Button>
                      <Button 
                        variant="hero" 
                        onClick={handleSaveExpense}
                        disabled={!expenseForm.name || !expenseForm.amount || !expenseForm.due_day}
                      >
                        {editingExpense ? "Salvar" : "Adicionar"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingExpenses ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin w-6 h-6 border-4 border-primary border-t-transparent rounded-full" />
                </div>
              ) : fixedExpenses.length === 0 ? (
                <div className="text-center py-8">
                  <Wallet className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Nenhum gasto fixo cadastrado</p>
                  <p className="text-sm text-muted-foreground">Clique em "Novo Gasto" para adicionar</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {fixedExpenses.map((expense) => (
                    <div key={expense.id} className="flex items-center justify-between py-4">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${expense.is_active ? "bg-primary/10" : "bg-muted"}`}>
                          <Calendar className={`w-5 h-5 ${expense.is_active ? "text-primary" : "text-muted-foreground"}`} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className={`font-medium ${!expense.is_active && "text-muted-foreground"}`}>
                              {expense.name}
                            </p>
                            {expense.category && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                                {expense.category}
                              </span>
                            )}
                            {!expense.is_active && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                                Inativo
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Vence dia {expense.due_day} • Lembrete {expense.reminder_days_before} dias antes
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <p className="font-semibold text-lg">
                          R$ {expense.amount.toFixed(2)}
                        </p>
                        <div className="flex items-center gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => openEditExpense(expense)}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleDeleteExpense(expense.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {fixedExpenses.length > 0 && (
                <div className="mt-6 p-4 rounded-lg bg-muted/50">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">Total de gastos fixos mensais</p>
                    <p className="text-xl font-bold text-primary">
                      R$ {fixedExpenses.filter(e => e.is_active).reduce((acc, e) => acc + e.amount, 0).toFixed(2)}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preferences Tab */}
        <TabsContent value="preferences" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Agendamentos
              </CardTitle>
              <CardDescription>Configurações padrão para agendamentos</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="duration">Duração Padrão do Serviço</Label>
                <Select
                  value={formData.default_appointment_duration.toString()}
                  onValueChange={(value) =>
                    setFormData({ ...formData, default_appointment_duration: parseInt(value) })
                  }
                >
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30 minutos</SelectItem>
                    <SelectItem value="45">45 minutos</SelectItem>
                    <SelectItem value="60">1 hora</SelectItem>
                    <SelectItem value="90">1h 30min</SelectItem>
                    <SelectItem value="120">2 horas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Agendamento Online</p>
                  <p className="text-sm text-muted-foreground">
                    Permitir que clientes façam agendamentos pelo site
                  </p>
                </div>
                <Switch
                  checked={formData.allow_online_booking}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, allow_online_booking: checked })
                  }
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Bell className="w-4 h-4" />
                Notificações
              </CardTitle>
              <CardDescription>Configure lembretes e notificações</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Enviar Lembretes</p>
                  <p className="text-sm text-muted-foreground">
                    Lembrar clientes sobre agendamentos próximos
                  </p>
                </div>
                <Switch
                  checked={formData.send_reminders}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, send_reminders: checked })
                  }
                />
              </div>
              {formData.send_reminders && (
                <div className="space-y-2">
                  <Label>Enviar lembrete com antecedência de</Label>
                  <Select
                    value={formData.reminder_hours_before.toString()}
                    onValueChange={(value) =>
                      setFormData({ ...formData, reminder_hours_before: parseInt(value) })
                    }
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 hora</SelectItem>
                      <SelectItem value="2">2 horas</SelectItem>
                      <SelectItem value="6">6 horas</SelectItem>
                      <SelectItem value="12">12 horas</SelectItem>
                      <SelectItem value="24">24 horas</SelectItem>
                      <SelectItem value="48">48 horas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="w-4 h-4" />
                Funcionários
              </CardTitle>
              <CardDescription>Configurações de exibição para funcionários</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Exibir Comissões e Serviços (Admin)</p>
                  <p className="text-sm text-muted-foreground">
                    Mostrar estatísticas de serviços realizados e comissões na página de funcionários
                  </p>
                </div>
                <Switch
                  checked={formData.show_employee_commission}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, show_employee_commission: checked })
                  }
                />
              </div>
              <p className="text-xs text-muted-foreground border-l-2 border-primary pl-3">
                {formData.show_employee_commission 
                  ? "Serão exibidos: serviços realizados, faturamento, comissões e pagamentos diretos"
                  : "Serão exibidos apenas os pagamentos diretos (gastos com categoria 'Funcionário')"
                }
              </p>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Exibir Valores para Funcionários</p>
                  <p className="text-sm text-muted-foreground">
                    Permitir que funcionários vejam valores dos serviços na agenda
                  </p>
                </div>
                <Switch
                  checked={formData.show_service_values_to_employees}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, show_service_values_to_employees: checked })
                  }
                />
              </div>
              <p className="text-xs text-muted-foreground border-l-2 border-primary pl-3">
                {formData.show_service_values_to_employees 
                  ? "Funcionários verão: valor do serviço, valor total e valor a pagar pelo cliente"
                  : "Funcionários verão apenas: cliente, serviço, data/hora, status e observações (sem valores)"
                }
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Localização e Moeda</CardTitle>
              <CardDescription>Configurações regionais</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Fuso Horário</Label>
                  <Select
                    value={formData.timezone}
                    onValueChange={(value) => setFormData({ ...formData, timezone: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="America/Sao_Paulo">Brasília (GMT-3)</SelectItem>
                      <SelectItem value="America/Manaus">Manaus (GMT-4)</SelectItem>
                      <SelectItem value="America/Cuiaba">Cuiabá (GMT-4)</SelectItem>
                      <SelectItem value="America/Rio_Branco">Rio Branco (GMT-5)</SelectItem>
                      <SelectItem value="America/Noronha">Fernando de Noronha (GMT-2)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Moeda</Label>
                  <Select
                    value={formData.currency}
                    onValueChange={(value) => setFormData({ ...formData, currency: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BRL">Real (R$)</SelectItem>
                      <SelectItem value="USD">Dólar (US$)</SelectItem>
                      <SelectItem value="EUR">Euro (€)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* System Tab */}
        <TabsContent value="system">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <RefreshCw className="w-4 h-4" />
                Atualizações do Sistema
              </CardTitle>
              <CardDescription>
                Gerencie as atualizações do aplicativo
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Versão atual</h4>
                    <p className="text-sm text-muted-foreground">
                      O sistema verifica atualizações automaticamente a cada minuto
                    </p>
                  </div>
                  <span className="text-sm text-muted-foreground">v1.0.0</span>
                </div>
                
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Forçar atualização</h4>
                    <p className="text-sm text-muted-foreground">
                      Limpa o cache e recarrega a versão mais recente
                    </p>
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={async () => {
                      toast.info("Limpando cache e atualizando...");
                      if ("caches" in window) {
                        const cacheNames = await caches.keys();
                        await Promise.all(cacheNames.map((name) => caches.delete(name)));
                      }
                      if ("serviceWorker" in navigator) {
                        const registrations = await navigator.serviceWorker.getRegistrations();
                        await Promise.all(registrations.map((r) => r.unregister()));
                      }
                      window.location.reload();
                    }}
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Atualizar agora
                  </Button>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
                  <div>
                    <h4 className="font-medium">Atualizações automáticas</h4>
                    <p className="text-sm text-muted-foreground">
                      Quando uma nova versão estiver disponível, uma notificação aparecerá na tela
                    </p>
                  </div>
                  <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">Ativo</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ConfiguracoesPage;