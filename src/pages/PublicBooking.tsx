import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { format, addDays, isBefore, startOfDay, isToday } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  usePublicBusinessBySlug,
  usePublicServices,
  usePublicBookedSlots,
  useCreatePublicAppointment,
  generateTimeSlots,
} from "@/hooks/usePublicBooking";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Car,
  Clock,
  Calendar as CalendarIcon,
  User,
  Phone,
  Mail,
  CheckCircle2,
  ArrowLeft,
  ArrowRight,
  MapPin,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

const vehicleTypes = [
  { value: "Carro", label: "Carro" },
  { value: "Moto", label: "Moto" },
  { value: "Caminhonete", label: "Caminhonete" },
  { value: "SUV", label: "SUV" },
  { value: "Van", label: "Van" },
];

const steps = [
  { id: 1, title: "Seus Dados", icon: User },
  { id: 2, title: "Veículo", icon: Car },
  { id: 3, title: "Serviço", icon: Clock },
  { id: 4, title: "Data e Hora", icon: CalendarIcon },
  { id: 5, title: "Confirmar", icon: CheckCircle2 },
];

export default function PublicBooking() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTime, setSelectedTime] = useState<string>("");

  // Form data
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    vehicleType: "",
    vehicleModel: "",
    vehiclePlate: "",
    vehicleNotes: "",
    serviceId: "",
  });

  // Fetch business data
  const { data: business, isLoading: loadingBusiness, error: businessError } = usePublicBusinessBySlug(slug || "");
  const { data: services = [], isLoading: loadingServices } = usePublicServices(business?.user_id);

  const selectedDateStr = selectedDate ? format(selectedDate, "yyyy-MM-dd") : undefined;
  const { data: bookedSlots = [] } = usePublicBookedSlots(business?.user_id, selectedDateStr);

  const createAppointment = useCreatePublicAppointment();

  // SEO básico (título, descrição e canonical) para a página pública
  useEffect(() => {
    const name = business?.business_name?.trim() || "Agendamento";
    document.title = `Agendar | ${name}`;

    const description = `Agende seu serviço em ${name} em poucos passos.`;

    let meta = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "description";
      document.head.appendChild(meta);
    }
    meta.content = description;

    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.appendChild(canonical);
    }
    canonical.href = `${window.location.origin}${window.location.pathname}`;
  }, [business?.business_name]);

  // Get selected service
  const selectedService = useMemo(
    () => services.find((s) => s.id === formData.serviceId),
    [services, formData.serviceId]
  );

  // Get working hours for selected date
  const workingHoursForDate = useMemo(() => {
    if (!selectedDate || !business?.working_hours) return undefined;
    const dayName = format(selectedDate, "EEEE", { locale: ptBR }).toLowerCase();
    const dayMap: { [key: string]: string } = {
      "segunda-feira": "monday",
      "terça-feira": "tuesday",
      "quarta-feira": "wednesday",
      "quinta-feira": "thursday",
      "sexta-feira": "friday",
      "sábado": "saturday",
      "domingo": "sunday",
    };
    return business.working_hours[dayMap[dayName]];
  }, [selectedDate, business?.working_hours]);

  // Generate available time slots
  const availableSlots = useMemo(() => {
    if (!workingHoursForDate || !selectedService) return [];

    const formattedSlots = bookedSlots.map((slot) => ({
      scheduled_time: slot.scheduled_time,
      services: slot.services as { duration_minutes: number } | null,
    }));

    let slots = generateTimeSlots(
      workingHoursForDate,
      formattedSlots,
      selectedService.duration_minutes,
      business?.service_interval_minutes || 15
    );

    // Filter out past times if today
    if (selectedDate && isToday(selectedDate)) {
      const now = new Date();
      const minAdvanceHours = business?.min_advance_hours || 2;
      const minTime = now.getHours() * 60 + now.getMinutes() + minAdvanceHours * 60;

      slots = slots.filter((slot) => {
        const [h, m] = slot.split(":").map(Number);
        return h * 60 + m >= minTime;
      });
    }

    return slots;
  }, [workingHoursForDate, bookedSlots, selectedService, selectedDate, business]);

  // Disabled dates for calendar
  const disabledDates = useMemo(() => {
    if (!business?.working_hours) return () => false;

    const minDate = addDays(new Date(), 0);
    const maxDate = addDays(new Date(), business.max_advance_days || 7);

    return (date: Date) => {
      // Check if before today or after max days
      if (isBefore(date, startOfDay(minDate)) || isBefore(maxDate, date)) {
        return true;
      }

      // Check if day is enabled in working hours
      const dayName = format(date, "EEEE", { locale: ptBR }).toLowerCase();
      const dayMap: { [key: string]: string } = {
        "segunda-feira": "monday",
        "terça-feira": "tuesday",
        "quarta-feira": "wednesday",
        "quinta-feira": "thursday",
        "sexta-feira": "friday",
        "sábado": "saturday",
        "domingo": "sunday",
      };
      const workingDay = business.working_hours?.[dayMap[dayName]];
      return !workingDay?.enabled;
    };
  }, [business]);

  // Validation
  const canProceed = useMemo(() => {
    switch (currentStep) {
      case 1:
        return formData.name.trim().length >= 2 && formData.phone.trim().length >= 10;
      case 2:
        return formData.vehicleType && formData.vehicleModel.trim().length >= 2;
      case 3:
        return !!formData.serviceId;
      case 4:
        return !!selectedDate && !!selectedTime;
      default:
        return true;
    }
  }, [currentStep, formData, selectedDate, selectedTime]);

  const handleNext = () => {
    if (currentStep < 5 && canProceed) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleSubmit = async () => {
    if (!business || !selectedDate || !selectedTime) return;

    try {
      const result = await createAppointment.mutateAsync({
        user_id: business.user_id,
        client_name: formData.name,
        client_phone: formData.phone,
        client_email: formData.email || undefined,
        vehicle_type: formData.vehicleType,
        vehicle_model: formData.vehicleModel,
        vehicle_plate: formData.vehiclePlate || undefined,
        vehicle_notes: formData.vehicleNotes || undefined,
        service_id: formData.serviceId,
        scheduled_date: format(selectedDate, "yyyy-MM-dd"),
        scheduled_time: selectedTime,
      });

      toast.success("Agendamento realizado com sucesso!");

      // Navigate to success page with cancel token
      navigate(`/agendamento-confirmado/${result.cancel_token}`);
    } catch (error) {
      // Error is handled in mutation
    }
  };

  if (loadingBusiness) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (businessError || !business) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Estabelecimento não encontrado</h2>
            <p className="text-muted-foreground">
              O link de agendamento pode estar desativado ou o estabelecimento não existe.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur sticky top-0 z-10">
        <div className="container max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            {business.logo_url ? (
              <img
                src={business.logo_url}
                alt={business.business_name || "Logo"}
                className="w-12 h-12 object-contain rounded-lg"
              />
            ) : (
              <div
                className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-lg"
                style={{ backgroundColor: business.primary_color || "#3b82f6" }}
              >
                {business.business_name?.[0] || "L"}
              </div>
            )}
            <div>
              <h1 className="font-semibold text-lg">{business.business_name || "Lava-Rápido"}</h1>
              {business.address && (
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {business.city}, {business.state}
                </p>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="container max-w-4xl mx-auto px-4 py-6">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors ${
                    currentStep >= step.id
                      ? "bg-primary border-primary text-primary-foreground"
                      : "border-muted-foreground/30 text-muted-foreground"
                  }`}
                >
                  <step.icon className="w-5 h-5" />
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`hidden sm:block w-16 h-0.5 mx-2 ${
                      currentStep > step.id ? "bg-primary" : "bg-muted"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="mt-4 text-center">
            <h2 className="text-xl font-semibold">{steps[currentStep - 1].title}</h2>
          </div>
        </div>

        <Card>
          <CardContent className="pt-6">
            {/* Step 1: Client Data */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">
                    <User className="w-4 h-4 inline mr-2" />
                    Nome completo *
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Seu nome completo"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">
                    <Phone className="w-4 h-4 inline mr-2" />
                    WhatsApp *
                  </Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="(00) 00000-0000"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">
                    <Mail className="w-4 h-4 inline mr-2" />
                    E-mail (opcional)
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="seu@email.com"
                  />
                </div>
              </div>
            )}

            {/* Step 2: Vehicle */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Tipo de veículo *</Label>
                  <Select
                    value={formData.vehicleType}
                    onValueChange={(value) => setFormData({ ...formData, vehicleType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {vehicleTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="model">Modelo *</Label>
                  <Input
                    id="model"
                    value={formData.vehicleModel}
                    onChange={(e) => setFormData({ ...formData, vehicleModel: e.target.value })}
                    placeholder="Ex: Honda Civic, Toyota Hilux..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="plate">Placa (opcional)</Label>
                  <Input
                    id="plate"
                    value={formData.vehiclePlate}
                    onChange={(e) => setFormData({ ...formData, vehiclePlate: e.target.value.toUpperCase() })}
                    placeholder="ABC-1234"
                    maxLength={8}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Observações (opcional)</Label>
                  <Textarea
                    id="notes"
                    value={formData.vehicleNotes}
                    onChange={(e) => setFormData({ ...formData, vehicleNotes: e.target.value })}
                    placeholder="Alguma observação sobre o veículo..."
                    rows={3}
                  />
                </div>
              </div>
            )}

            {/* Step 3: Service */}
            {currentStep === 3 && (
              <div className="space-y-4">
                {loadingServices ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin" />
                  </div>
                ) : services.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    Nenhum serviço disponível no momento.
                  </p>
                ) : (
                  <div className="grid gap-3">
                    {services.map((service) => (
                      <div
                        key={service.id}
                        onClick={() => setFormData({ ...formData, serviceId: service.id })}
                        className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                          formData.serviceId === service.id
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-medium">{service.name}</h3>
                            {service.description && (
                              <p className="text-sm text-muted-foreground mt-1">
                                {service.description}
                              </p>
                            )}
                            <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {service.duration_minutes} min
                              </span>
                            </div>
                          </div>
                          <Badge variant="secondary" className="text-lg font-semibold">
                            R$ {Number((service as any).price ?? 0).toFixed(2)}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Step 4: Date and Time */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div>
                  <Label className="mb-3 block">Selecione a data</Label>
                  <div className="flex justify-center">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={(date) => {
                        setSelectedDate(date);
                        setSelectedTime("");
                      }}
                      disabled={disabledDates}
                      locale={ptBR}
                      className="rounded-md border"
                    />
                  </div>
                </div>

                {selectedDate && (
                  <>
                    <Separator />
                    <div>
                      <Label className="mb-3 block">
                        Horários disponíveis para{" "}
                        {format(selectedDate, "EEEE, d 'de' MMMM", { locale: ptBR })}
                      </Label>
                      {availableSlots.length === 0 ? (
                        <p className="text-center text-muted-foreground py-4">
                          Nenhum horário disponível para esta data.
                        </p>
                      ) : (
                        <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                          {availableSlots.map((time) => (
                            <Button
                              key={time}
                              variant={selectedTime === time ? "default" : "outline"}
                              size="sm"
                              onClick={() => setSelectedTime(time)}
                              className="w-full"
                            >
                              {time}
                            </Button>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Step 5: Confirmation */}
            {currentStep === 5 && (
              <div className="space-y-4">
                <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                  <h3 className="font-semibold">Resumo do Agendamento</h3>
                  <Separator />

                  <div className="grid gap-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Cliente:</span>
                      <span className="font-medium">{formData.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">WhatsApp:</span>
                      <span className="font-medium">{formData.phone}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Veículo:</span>
                      <span className="font-medium">
                        {formData.vehicleType} - {formData.vehicleModel}
                      </span>
                    </div>
                    {formData.vehiclePlate && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Placa:</span>
                        <span className="font-medium">{formData.vehiclePlate}</span>
                      </div>
                    )}
                    <Separator />
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Serviço:</span>
                      <span className="font-medium">{selectedService?.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Duração:</span>
                      <span className="font-medium">{selectedService?.duration_minutes} minutos</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Data:</span>
                      <span className="font-medium">
                        {selectedDate && format(selectedDate, "EEEE, d 'de' MMMM", { locale: ptBR })}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Horário:</span>
                      <span className="font-medium">{selectedTime}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between text-lg">
                      <span className="font-semibold">Total:</span>
                      <span className="font-bold text-primary">
                        R$ {Number((selectedService as any)?.price ?? 0).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground text-center">
                  Ao confirmar, você receberá um link para cancelar o agendamento se necessário.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-6">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 1}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>

          {currentStep < 5 ? (
            <Button onClick={handleNext} disabled={!canProceed}>
              Próximo
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={createAppointment.isPending}
              className="bg-green-600 hover:bg-green-700"
            >
              {createAppointment.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Confirmando...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Confirmar Agendamento
                </>
              )}
            </Button>
          )}
        </div>
      </main>
    </div>
  );
}
