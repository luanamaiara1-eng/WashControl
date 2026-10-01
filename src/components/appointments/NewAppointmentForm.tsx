import { useState, useEffect } from "react";
import { format } from "date-fns";
import { X, Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useClients, useCreateClient } from "@/hooks/useClients";
import { useVehicles, useCreateVehicle } from "@/hooks/useVehicles";
import { useServices, useCreateService } from "@/hooks/useServices";
import { useEmployees, useCreateEmployee } from "@/hooks/useEmployees";
import { useCreateAppointment } from "@/hooks/useAppointments";
import { PaymentMethod } from "@/types/database";

interface NewAppointmentFormProps {
  open: boolean;
  onClose: () => void;
  selectedDate: Date;
}

const NewAppointmentForm = ({
  open,
  onClose,
  selectedDate,
}: NewAppointmentFormProps) => {
  const [step, setStep] = useState<"main" | "new-client" | "new-vehicle" | "new-service" | "new-employee">("main");
  
  // Form state
  const [clientId, setClientId] = useState("");
  const [vehicleId, setVehicleId] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [scheduledDate, setScheduledDate] = useState(format(selectedDate, "yyyy-MM-dd"));
  const [scheduledTime, setScheduledTime] = useState("09:00");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | "">("");
  const [notes, setNotes] = useState("");
  
  // New item forms
  const [newClientName, setNewClientName] = useState("");
  const [newClientPhone, setNewClientPhone] = useState("");
  const [newVehicleBrand, setNewVehicleBrand] = useState("");
  const [newVehicleModel, setNewVehicleModel] = useState("");
  const [newVehiclePlate, setNewVehiclePlate] = useState("");
  const [newVehicleColor, setNewVehicleColor] = useState("");
  const [newServiceName, setNewServiceName] = useState("");
  const [newServicePrice, setNewServicePrice] = useState("");
  const [newServiceDuration, setNewServiceDuration] = useState("60");
  const [newEmployeeName, setNewEmployeeName] = useState("");
  const [newEmployeePhone, setNewEmployeePhone] = useState("");

  // Queries
  const { data: clients = [] } = useClients();
  const { data: vehicles = [] } = useVehicles(clientId || undefined);
  const { data: services = [] } = useServices();
  const { data: employees = [] } = useEmployees();

  // Mutations
  const createAppointment = useCreateAppointment();
  const createClient = useCreateClient();
  const createVehicle = useCreateVehicle();
  const createService = useCreateService();
  const createEmployee = useCreateEmployee();

  useEffect(() => {
    setScheduledDate(format(selectedDate, "yyyy-MM-dd"));
  }, [selectedDate]);

  // Reset vehicle when client changes
  useEffect(() => {
    setVehicleId("");
  }, [clientId]);

  const selectedService = services.find((s) => s.id === serviceId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    await createAppointment.mutateAsync({
      client_id: clientId || undefined,
      vehicle_id: vehicleId || undefined,
      service_id: serviceId || undefined,
      employee_id: employeeId || undefined,
      scheduled_date: scheduledDate,
      scheduled_time: scheduledTime,
      price: selectedService?.price,
      payment_method: paymentMethod as PaymentMethod || undefined,
      notes: notes || undefined,
    });

    resetForm();
    onClose();
  };

  const handleCreateClient = async () => {
    const result = await createClient.mutateAsync({
      name: newClientName,
      phone: newClientPhone || undefined,
    });
    setClientId(result.id);
    setNewClientName("");
    setNewClientPhone("");
    setStep("main");
  };

  const handleCreateVehicle = async () => {
    if (!clientId) return;
    const result = await createVehicle.mutateAsync({
      client_id: clientId,
      brand: newVehicleBrand,
      model: newVehicleModel,
      plate: newVehiclePlate,
      color: newVehicleColor || undefined,
    });
    setVehicleId(result.id);
    setNewVehicleBrand("");
    setNewVehicleModel("");
    setNewVehiclePlate("");
    setNewVehicleColor("");
    setStep("main");
  };

  const handleCreateService = async () => {
    const result = await createService.mutateAsync({
      name: newServiceName,
      price: parseFloat(newServicePrice),
      duration_minutes: parseInt(newServiceDuration),
    });
    setServiceId(result.id);
    setNewServiceName("");
    setNewServicePrice("");
    setNewServiceDuration("60");
    setStep("main");
  };

  const handleCreateEmployee = async () => {
    const result = await createEmployee.mutateAsync({
      name: newEmployeeName,
      phone: newEmployeePhone || undefined,
    });
    setEmployeeId(result.id);
    setNewEmployeeName("");
    setNewEmployeePhone("");
    setStep("main");
  };

  const resetForm = () => {
    setClientId("");
    setVehicleId("");
    setServiceId("");
    setEmployeeId("");
    setScheduledTime("09:00");
    setPaymentMethod("");
    setNotes("");
    setStep("main");
  };

  const renderNewClientForm = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-medium">Novo Cliente</h4>
        <Button variant="ghost" size="sm" onClick={() => setStep("main")}>
          <X className="w-4 h-4" />
        </Button>
      </div>
      <div className="space-y-3">
        <div>
          <Label>Nome *</Label>
          <Input
            value={newClientName}
            onChange={(e) => setNewClientName(e.target.value)}
            placeholder="Nome do cliente"
          />
        </div>
        <div>
          <Label>Telefone</Label>
          <Input
            value={newClientPhone}
            onChange={(e) => setNewClientPhone(e.target.value)}
            placeholder="(11) 99999-9999"
          />
        </div>
        <Button
          onClick={handleCreateClient}
          disabled={!newClientName || createClient.isPending}
          className="w-full"
        >
          {createClient.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            "Criar Cliente"
          )}
        </Button>
      </div>
    </div>
  );

  const renderNewVehicleForm = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-medium">Novo Veículo</h4>
        <Button variant="ghost" size="sm" onClick={() => setStep("main")}>
          <X className="w-4 h-4" />
        </Button>
      </div>
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Marca *</Label>
            <Input
              value={newVehicleBrand}
              onChange={(e) => setNewVehicleBrand(e.target.value)}
              placeholder="Ex: Honda"
            />
          </div>
          <div>
            <Label>Modelo *</Label>
            <Input
              value={newVehicleModel}
              onChange={(e) => setNewVehicleModel(e.target.value)}
              placeholder="Ex: Civic"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Placa *</Label>
            <Input
              value={newVehiclePlate}
              onChange={(e) => setNewVehiclePlate(e.target.value.toUpperCase())}
              placeholder="ABC-1234"
            />
          </div>
          <div>
            <Label>Cor</Label>
            <Input
              value={newVehicleColor}
              onChange={(e) => setNewVehicleColor(e.target.value)}
              placeholder="Ex: Preto"
            />
          </div>
        </div>
        <Button
          onClick={handleCreateVehicle}
          disabled={!newVehicleBrand || !newVehicleModel || !newVehiclePlate || createVehicle.isPending}
          className="w-full"
        >
          {createVehicle.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            "Criar Veículo"
          )}
        </Button>
      </div>
    </div>
  );

  const renderNewServiceForm = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-medium">Novo Serviço</h4>
        <Button variant="ghost" size="sm" onClick={() => setStep("main")}>
          <X className="w-4 h-4" />
        </Button>
      </div>
      <div className="space-y-3">
        <div>
          <Label>Nome *</Label>
          <Input
            value={newServiceName}
            onChange={(e) => setNewServiceName(e.target.value)}
            placeholder="Ex: Lavagem Completa"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Preço (R$) *</Label>
            <Input
              type="number"
              step="0.01"
              value={newServicePrice}
              onChange={(e) => setNewServicePrice(e.target.value)}
              placeholder="50.00"
            />
          </div>
          <div>
            <Label>Duração (min)</Label>
            <Input
              type="number"
              value={newServiceDuration}
              onChange={(e) => setNewServiceDuration(e.target.value)}
              placeholder="60"
            />
          </div>
        </div>
        <Button
          onClick={handleCreateService}
          disabled={!newServiceName || !newServicePrice || createService.isPending}
          className="w-full"
        >
          {createService.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            "Criar Serviço"
          )}
        </Button>
      </div>
    </div>
  );

  const renderNewEmployeeForm = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-medium">Novo Funcionário</h4>
        <Button variant="ghost" size="sm" onClick={() => setStep("main")}>
          <X className="w-4 h-4" />
        </Button>
      </div>
      <div className="space-y-3">
        <div>
          <Label>Nome *</Label>
          <Input
            value={newEmployeeName}
            onChange={(e) => setNewEmployeeName(e.target.value)}
            placeholder="Nome do funcionário"
          />
        </div>
        <div>
          <Label>Telefone</Label>
          <Input
            value={newEmployeePhone}
            onChange={(e) => setNewEmployeePhone(e.target.value)}
            placeholder="(11) 99999-9999"
          />
        </div>
        <Button
          onClick={handleCreateEmployee}
          disabled={!newEmployeeName || createEmployee.isPending}
          className="w-full"
        >
          {createEmployee.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            "Criar Funcionário"
          )}
        </Button>
      </div>
    </div>
  );

  const renderMainForm = () => (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Client Selection */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Cliente</Label>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setStep("new-client")}
          >
            <Plus className="w-4 h-4 mr-1" />
            Novo
          </Button>
        </div>
        <Select value={clientId} onValueChange={setClientId}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione um cliente" />
          </SelectTrigger>
          <SelectContent>
            {clients.map((client) => (
              <SelectItem key={client.id} value={client.id}>
                {client.name} {client.phone && `• ${client.phone}`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Vehicle Selection */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Veículo</Label>
          {clientId && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setStep("new-vehicle")}
            >
              <Plus className="w-4 h-4 mr-1" />
              Novo
            </Button>
          )}
        </div>
        <Select value={vehicleId} onValueChange={setVehicleId} disabled={!clientId}>
          <SelectTrigger>
            <SelectValue placeholder={clientId ? "Selecione um veículo" : "Selecione um cliente primeiro"} />
          </SelectTrigger>
          <SelectContent>
            {vehicles.map((vehicle) => (
              <SelectItem key={vehicle.id} value={vehicle.id}>
                {vehicle.brand} {vehicle.model} • {vehicle.plate}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Service Selection */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Serviço</Label>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setStep("new-service")}
          >
            <Plus className="w-4 h-4 mr-1" />
            Novo
          </Button>
        </div>
        <Select value={serviceId} onValueChange={setServiceId}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione um serviço" />
          </SelectTrigger>
          <SelectContent>
            {services.map((service) => (
              <SelectItem key={service.id} value={service.id}>
                {service.name} • R$ {Number(service.price).toFixed(2)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Employee Selection */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Funcionário</Label>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setStep("new-employee")}
          >
            <Plus className="w-4 h-4 mr-1" />
            Novo
          </Button>
        </div>
        <Select value={employeeId} onValueChange={setEmployeeId}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione um funcionário" />
          </SelectTrigger>
          <SelectContent>
            {employees.map((employee) => (
              <SelectItem key={employee.id} value={employee.id}>
                {employee.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Date and Time */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Data</Label>
          <Input
            type="date"
            value={scheduledDate}
            onChange={(e) => setScheduledDate(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label>Horário</Label>
          <Input
            type="time"
            value={scheduledTime}
            onChange={(e) => setScheduledTime(e.target.value)}
            required
          />
        </div>
      </div>

      {/* Payment Method */}
      <div className="space-y-2">
        <Label>Forma de Pagamento</Label>
        <Select value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione (opcional)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="cash">Dinheiro</SelectItem>
            <SelectItem value="pix">PIX</SelectItem>
            <SelectItem value="credit_card">Cartão de Crédito</SelectItem>
            <SelectItem value="debit_card">Cartão de Débito</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Notes */}
      <div className="space-y-2">
        <Label>Observações</Label>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Observações sobre o agendamento..."
          rows={3}
        />
      </div>

      {/* Price Display */}
      {selectedService && (
        <div className="p-4 bg-muted rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Valor do serviço</span>
            <span className="text-xl font-bold text-foreground">
              R$ {Number(selectedService.price).toFixed(2)}
            </span>
          </div>
        </div>
      )}

      {/* Submit Button */}
      <div className="flex gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onClose} className="flex-1">
          Cancelar
        </Button>
        <Button
          type="submit"
          variant="hero"
          disabled={createAppointment.isPending}
          className="flex-1"
        >
          {createAppointment.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            "Criar Agendamento"
          )}
        </Button>
      </div>
    </form>
  );

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo Agendamento</DialogTitle>
        </DialogHeader>

        {step === "main" && renderMainForm()}
        {step === "new-client" && renderNewClientForm()}
        {step === "new-vehicle" && renderNewVehicleForm()}
        {step === "new-service" && renderNewServiceForm()}
        {step === "new-employee" && renderNewEmployeeForm()}
      </DialogContent>
    </Dialog>
  );
};

export default NewAppointmentForm;
