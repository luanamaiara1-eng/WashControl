import { useState } from "react";
import { useVehicles, useCreateVehicle, useUpdateVehicle, useDeleteVehicle, useVehicleWithHistory } from "@/hooks/useVehicles";
import { useClients } from "@/hooks/useClients";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Plus, 
  Search, 
  Pencil, 
  Trash2, 
  Car,
  DollarSign,
  Wrench,
  Calendar,
  Eye,
  Clock,
  User
} from "lucide-react";
import { Vehicle } from "@/types/database";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const VeiculosPage = () => {
  const { data: vehicles = [], isLoading } = useVehicles();
  const { data: clients = [] } = useClients();
  const createVehicle = useCreateVehicle();
  const updateVehicle = useUpdateVehicle();
  const deleteVehicle = useDeleteVehicle();

  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    client_id: "",
    brand: "",
    model: "",
    plate: "",
    color: "",
    year: "",
  });

  const filteredVehicles = vehicles.filter(
    (vehicle) =>
      vehicle.brand.toLowerCase().includes(search.toLowerCase()) ||
      vehicle.model.toLowerCase().includes(search.toLowerCase()) ||
      vehicle.plate.toLowerCase().includes(search.toLowerCase()) ||
      (vehicle.clients as any)?.name?.toLowerCase().includes(search.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const vehicleData = {
      client_id: formData.client_id,
      brand: formData.brand,
      model: formData.model,
      plate: formData.plate.toUpperCase(),
      color: formData.color || undefined,
      year: formData.year ? parseInt(formData.year) : undefined,
    };

    if (editingVehicle) {
      await updateVehicle.mutateAsync({
        id: editingVehicle.id,
        ...vehicleData,
      });
    } else {
      await createVehicle.mutateAsync(vehicleData);
    }
    
    resetForm();
  };

  const resetForm = () => {
    setFormData({ client_id: "", brand: "", model: "", plate: "", color: "", year: "" });
    setEditingVehicle(null);
    setDialogOpen(false);
  };

  const handleEdit = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle);
    setFormData({
      client_id: vehicle.client_id,
      brand: vehicle.brand,
      model: vehicle.model,
      plate: vehicle.plate,
      color: vehicle.color || "",
      year: vehicle.year?.toString() || "",
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir este veículo?")) {
      await deleteVehicle.mutateAsync(id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por marca, modelo, placa ou cliente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button variant="hero">
              <Plus className="w-4 h-4" />
              Novo Veículo
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingVehicle ? "Editar Veículo" : "Novo Veículo"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="client_id">Cliente *</Label>
                <Select
                  value={formData.client_id}
                  onValueChange={(value) => setFormData({ ...formData, client_id: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="brand">Marca *</Label>
                  <Input
                    id="brand"
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="model">Modelo *</Label>
                  <Input
                    id="model"
                    value={formData.model}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="plate">Placa *</Label>
                  <Input
                    id="plate"
                    value={formData.plate}
                    onChange={(e) => setFormData({ ...formData, plate: e.target.value.toUpperCase() })}
                    placeholder="ABC1234"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="color">Cor</Label>
                  <Input
                    id="color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="year">Ano</Label>
                  <Input
                    id="year"
                    type="number"
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                    placeholder="2024"
                  />
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancelar
                </Button>
                <Button type="submit" variant="hero" disabled={createVehicle.isPending || updateVehicle.isPending}>
                  {editingVehicle ? "Salvar" : "Criar"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Car className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{vehicles.length}</p>
              <p className="text-sm text-muted-foreground">Total de Veículos</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
            </div>
          ) : filteredVehicles.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              {search ? "Nenhum veículo encontrado" : "Nenhum veículo cadastrado"}
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Veículo</TableHead>
                      <TableHead>Placa</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Cor</TableHead>
                      <TableHead>Ano</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredVehicles.map((vehicle) => (
                      <TableRow key={vehicle.id}>
                        <TableCell className="font-medium">
                          {vehicle.brand} {vehicle.model}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{vehicle.plate}</Badge>
                        </TableCell>
                        <TableCell>{(vehicle.clients as any)?.name || "-"}</TableCell>
                        <TableCell>{vehicle.color || "-"}</TableCell>
                        <TableCell>{vehicle.year || "-"}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-1 justify-end">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setSelectedVehicleId(vehicle.id)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(vehicle)}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive"
                              onClick={() => handleDelete(vehicle.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden divide-y divide-border">
                {filteredVehicles.map((vehicle) => (
                  <div key={vehicle.id} className="p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold">{vehicle.brand} {vehicle.model}</p>
                        <Badge variant="outline" className="mt-1">{vehicle.plate}</Badge>
                        <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                          <User className="w-3 h-3" /> {(vehicle.clients as any)?.name || "-"}
                        </p>
                        {vehicle.color && (
                          <p className="text-sm text-muted-foreground">
                            {vehicle.color} {vehicle.year && `• ${vehicle.year}`}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => setSelectedVehicleId(vehicle.id)}>
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(vehicle)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(vehicle.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Vehicle History Sheet */}
      <VehicleHistorySheet 
        vehicleId={selectedVehicleId} 
        onClose={() => setSelectedVehicleId(null)} 
      />
    </div>
  );
};

const VehicleHistorySheet = ({ vehicleId, onClose }: { vehicleId: string | null; onClose: () => void }) => {
  const { data, isLoading } = useVehicleWithHistory(vehicleId || "");

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      scheduled: { label: "Agendado", variant: "outline" },
      in_progress: { label: "Em andamento", variant: "secondary" },
      completed: { label: "Finalizado", variant: "default" },
      cancelled: { label: "Cancelado", variant: "destructive" },
      no_show: { label: "Não compareceu", variant: "destructive" },
    };
    const s = statusMap[status] || { label: status, variant: "outline" as const };
    return <Badge variant={s.variant}>{s.label}</Badge>;
  };

  return (
    <Sheet open={!!vehicleId} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Histórico do Veículo</SheetTitle>
        </SheetHeader>
        
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        ) : !data?.vehicle ? (
          <div className="text-center text-muted-foreground py-8">Veículo não encontrado</div>
        ) : (
          <ScrollArea className="h-[calc(100vh-8rem)] pr-4">
            <div className="space-y-6 py-4">
              {/* Vehicle Info */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Car className="w-5 h-5" />
                    {data.vehicle.brand} {data.vehicle.model}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-base">{data.vehicle.plate}</Badge>
                  </div>
                  <div className="flex gap-4 text-muted-foreground">
                    {data.vehicle.color && <span>{data.vehicle.color}</span>}
                    {data.vehicle.year && <span>{data.vehicle.year}</span>}
                  </div>
                  {(data.vehicle as any).clients && (
                    <div className="flex items-center gap-2 pt-2 border-t">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">{(data.vehicle as any).clients.name}</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3">
                <Card>
                  <CardContent className="p-4 text-center">
                    <DollarSign className="w-6 h-6 mx-auto mb-2 text-primary" />
                    <p className="text-xl font-bold">R$ {data.totalSpent.toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">Total Gasto</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <Wrench className="w-6 h-6 mx-auto mb-2 text-primary" />
                    <p className="text-xl font-bold">{data.totalServices}</p>
                    <p className="text-xs text-muted-foreground">Serviços</p>
                  </CardContent>
                </Card>
              </div>

              {/* Service History */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Calendar className="w-4 h-4" /> Histórico de Serviços ({data.appointments.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {data.appointments.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Nenhum serviço realizado</p>
                  ) : (
                    <div className="space-y-3">
                      {data.appointments.map((a) => (
                        <div key={a.id} className="p-3 bg-muted rounded-lg text-sm space-y-1">
                          <div className="flex items-center justify-between">
                            <p className="font-medium">{a.services?.name || "Serviço"}</p>
                            {getStatusBadge(a.status)}
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            {format(new Date(a.scheduled_date), "dd/MM/yyyy", { locale: ptBR })} às {a.scheduled_time.slice(0, 5)}
                          </div>
                          {a.employees && (
                            <p className="text-muted-foreground">
                              Responsável: {a.employees.name}
                            </p>
                          )}
                          {a.price && (
                            <p className="text-primary font-medium">R$ {Number(a.price).toFixed(2)}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </ScrollArea>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default VeiculosPage;