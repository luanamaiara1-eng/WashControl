import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  Plus, 
  Pencil, 
  Trash2, 
  MoreVertical,
  Search,
  Users,
  ToggleLeft,
  ToggleRight,
  Loader2,
  Phone,
  Percent,
  DollarSign,
  Calendar,
  Briefcase,
  TrendingUp,
  CheckCircle2,
  Wallet,
  KeyRound
} from "lucide-react";
import EmployeeAccessCodes from "@/components/employees/EmployeeAccessCodes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  useEmployeesWithStats, 
  useCreateEmployee, 
  useUpdateEmployee, 
  useDeleteEmployee 
} from "@/hooks/useEmployees";
import { useBusinessSettings } from "@/hooks/useConfiguracoes";
import { Employee } from "@/types/database";
import { cn } from "@/lib/utils";

interface EmployeeWithStats extends Employee {
  completedServices: number;
  totalCommission: number;
  directPayments: number;
  totalRevenue: number;
}

const FuncionariosPage = () => {
  const [showForm, setShowForm] = useState(false);
  const [showAccessCodes, setShowAccessCodes] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<EmployeeWithStats | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showInactive, setShowInactive] = useState(false);

  const { data: employees = [], isLoading } = useEmployeesWithStats();
  const { data: settings } = useBusinessSettings();
  const createEmployee = useCreateEmployee();
  const updateEmployee = useUpdateEmployee();
  const deleteEmployee = useDeleteEmployee();

  const showCommissionStats = settings?.show_employee_commission ?? true;

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    role: "",
    commission_rate: "",
    fixed_salary: "",
    hire_date: "",
  });

  const filteredEmployees = (employees as EmployeeWithStats[]).filter((employee) => {
    const matchesSearch = employee.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      employee.role?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesActive = showInactive ? true : employee.is_active;
    return matchesSearch && matchesActive;
  });

  const handleOpenForm = (employee?: EmployeeWithStats) => {
    if (employee) {
      setEditingEmployee(employee);
      setFormData({
        name: employee.name,
        phone: employee.phone || "",
        role: employee.role || "",
        commission_rate: employee.commission_rate?.toString() || "",
        fixed_salary: employee.fixed_salary?.toString() || "",
        hire_date: employee.hire_date || "",
      });
    } else {
      setEditingEmployee(null);
      setFormData({
        name: "",
        phone: "",
        role: "",
        commission_rate: "",
        fixed_salary: "",
        hire_date: format(new Date(), "yyyy-MM-dd"),
      });
    }
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingEmployee(null);
    setFormData({
      name: "",
      phone: "",
      role: "",
      commission_rate: "",
      fixed_salary: "",
      hire_date: "",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const data = {
      name: formData.name.trim(),
      phone: formData.phone.trim() || undefined,
      role: formData.role.trim() || undefined,
      commission_rate: formData.commission_rate ? parseFloat(formData.commission_rate) : undefined,
      fixed_salary: formData.fixed_salary ? parseFloat(formData.fixed_salary) : undefined,
      hire_date: formData.hire_date || undefined,
    };

    if (editingEmployee) {
      await updateEmployee.mutateAsync({ id: editingEmployee.id, ...data });
    } else {
      await createEmployee.mutateAsync(data);
    }

    handleCloseForm();
  };

  const handleToggleActive = async (employee: EmployeeWithStats) => {
    await updateEmployee.mutateAsync({
      id: employee.id,
      is_active: !employee.is_active,
    });
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Tem certeza que deseja excluir este funcionário?")) {
      await deleteEmployee.mutateAsync(id);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const totalEmployees = employees.length;
  const activeEmployees = employees.filter(e => e.is_active).length;
  const totalCommissions = (employees as EmployeeWithStats[]).reduce((acc, e) => acc + e.totalCommission, 0);
  const totalRevenue = (employees as EmployeeWithStats[]).reduce((acc, e) => acc + e.totalRevenue, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Funcionários</h1>
          <p className="text-muted-foreground">
            Gerencie sua equipe {showCommissionStats && "e acompanhe o desempenho"}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowAccessCodes(true)}>
            <KeyRound className="w-4 h-4" />
            <span className="hidden sm:inline ml-2">Códigos de Acesso</span>
          </Button>
          <Button variant="hero" onClick={() => handleOpenForm()}>
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline ml-2">Novo Funcionário</span>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className={cn(
        "grid gap-4",
        showCommissionStats ? "grid-cols-2 lg:grid-cols-4" : "grid-cols-2"
      )}>
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Users className="w-4 h-4" />
            <span className="text-sm">Total</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{totalEmployees}</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <ToggleRight className="w-4 h-4" />
            <span className="text-sm">Ativos</span>
          </div>
          <p className="text-2xl font-bold text-success">{activeEmployees}</p>
        </div>
        {showCommissionStats && (
          <>
            <div className="bg-card rounded-xl border border-border p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <TrendingUp className="w-4 h-4" />
                <span className="text-sm">Faturamento Total</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{formatCurrency(totalRevenue)}</p>
            </div>
            <div className="bg-card rounded-xl border border-border p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Percent className="w-4 h-4" />
                <span className="text-sm">Comissões + Pagamentos</span>
              </div>
              <p className="text-2xl font-bold text-primary">{formatCurrency(totalCommissions)}</p>
            </div>
          </>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar funcionários..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-2">
          <Switch
            id="show-inactive"
            checked={showInactive}
            onCheckedChange={setShowInactive}
          />
          <Label htmlFor="show-inactive" className="text-sm text-muted-foreground">
            Mostrar inativos
          </Label>
        </div>
      </div>

      {/* Employees Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : filteredEmployees.length === 0 ? (
        <div className="bg-card rounded-2xl border border-border p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
            <Users className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            {searchQuery ? "Nenhum funcionário encontrado" : "Nenhum funcionário cadastrado"}
          </h3>
          <p className="text-muted-foreground mb-4">
            {searchQuery 
              ? "Tente buscar com outros termos" 
              : "Comece adicionando membros da sua equipe"}
          </p>
          {!searchQuery && (
            <Button variant="hero" onClick={() => handleOpenForm()}>
              <Plus className="w-4 h-4" />
              Adicionar Funcionário
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredEmployees.map((employee) => (
            <div 
              key={employee.id}
              className={cn(
                "bg-card rounded-2xl border border-border p-5 hover:shadow-lg transition-shadow",
                !employee.is_active && "opacity-60"
              )}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-bold text-lg">
                    {employee.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{employee.name}</h3>
                    {employee.role && (
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Briefcase className="w-3 h-3" />
                        {employee.role}
                      </p>
                    )}
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleOpenForm(employee)}>
                      <Pencil className="w-4 h-4 mr-2" />
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleToggleActive(employee)}>
                      {employee.is_active ? (
                        <>
                          <ToggleLeft className="w-4 h-4 mr-2" />
                          Desativar
                        </>
                      ) : (
                        <>
                          <ToggleRight className="w-4 h-4 mr-2" />
                          Ativar
                        </>
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      className="text-destructive"
                      onClick={() => handleDelete(employee.id)}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Excluir
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Contact */}
              {employee.phone && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                  <Phone className="w-4 h-4" />
                  {employee.phone}
                </div>
              )}

              {/* Stats */}
              {showCommissionStats ? (
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-muted/50 rounded-lg p-3">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Serviços
                    </div>
                    <p className="text-lg font-bold text-foreground">
                      {employee.completedServices}
                    </p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                      <DollarSign className="w-3 h-3" />
                      Faturado
                    </div>
                    <p className="text-lg font-bold text-foreground">
                      {formatCurrency(employee.totalRevenue)}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="bg-muted/50 rounded-lg p-3 mb-4">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                    <Wallet className="w-3 h-3" />
                    Total de Ganhos
                  </div>
                  <p className="text-lg font-bold text-primary">
                    {formatCurrency(employee.directPayments || 0)}
                  </p>
                </div>
              )}

              {/* Commission Info - only show if enabled */}
              {showCommissionStats && (
                <div className="pt-3 border-t border-border">
                  <div className="flex items-center justify-between">
                    <div className="text-sm">
                      <span className="text-muted-foreground">Comissão: </span>
                      <span className="font-medium text-foreground">
                        {employee.commission_rate ? `${employee.commission_rate}%` : "Não definida"}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Total ganho</p>
                      <p className="font-bold text-primary">
                        {formatCurrency(employee.totalCommission)}
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              {employee.hire_date && (
                <p className={cn(
                  "text-xs text-muted-foreground flex items-center gap-1",
                  showCommissionStats ? "mt-2" : "mt-3 pt-3 border-t border-border"
                )}>
                  <Calendar className="w-3 h-3" />
                  Desde {format(new Date(employee.hire_date), "MMM yyyy", { locale: ptBR })}
                </p>
              )}

              {/* Status Badge */}
              <div className="mt-3">
                <span className={cn(
                  "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium",
                  employee.is_active 
                    ? "bg-success/10 text-success" 
                    : "bg-muted text-muted-foreground"
                )}>
                  {employee.is_active ? "Ativo" : "Inativo"}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form Dialog */}
      <Dialog open={showForm} onOpenChange={handleCloseForm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingEmployee ? "Editar Funcionário" : "Novo Funcionário"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome completo *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: João da Silva"
                required
                maxLength={100}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="(11) 99999-9999"
                    className="pl-10"
                    maxLength={20}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Função</Label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="role"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    placeholder="Ex: Lavador"
                    className="pl-10"
                    maxLength={50}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="commission_rate">Comissão (%)</Label>
                <div className="relative">
                  <Percent className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="commission_rate"
                    type="number"
                    step="0.5"
                    min="0"
                    max="100"
                    value={formData.commission_rate}
                    onChange={(e) => setFormData({ ...formData, commission_rate: e.target.value })}
                    placeholder="10"
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fixed_salary">Salário Fixo (R$)</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="fixed_salary"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.fixed_salary}
                    onChange={(e) => setFormData({ ...formData, fixed_salary: e.target.value })}
                    placeholder="1500.00"
                    className="pl-10"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="hire_date">Data de Admissão</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="hire_date"
                  type="date"
                  value={formData.hire_date}
                  onChange={(e) => setFormData({ ...formData, hire_date: e.target.value })}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleCloseForm}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                variant="hero"
                disabled={createEmployee.isPending || updateEmployee.isPending}
                className="flex-1"
              >
                {(createEmployee.isPending || updateEmployee.isPending) ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : editingEmployee ? (
                  "Salvar"
                ) : (
                  "Criar Funcionário"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Access Codes Dialog */}
      <EmployeeAccessCodes open={showAccessCodes} onOpenChange={setShowAccessCodes} />
    </div>
  );
};

export default FuncionariosPage;