import { useState, useEffect } from "react";
import logoImage from "@/assets/logo.png";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  Droplets, 
  LayoutDashboard, 
  Calendar, 
  Car, 
  Wrench, 
  Store,
  Users, 
  DollarSign, 
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  Plus,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  Wallet,
  Bell,
  RefreshCw,
  Shield,
  HelpCircle
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useIsAdmin } from "@/hooks/useAdmin";
import AgendamentosPage from "./Agendamentos";
import ServicosPage from "./Servicos";
import FuncionariosPage from "./Funcionarios";
import ClientesPage from "./Clientes";
import VeiculosPage from "./Veiculos";
import FinanceiroPage from "./Financeiro";
import RelatoriosPage from "./Relatorios";
import ConfiguracoesPage from "./Configuracoes";
import LojaPage from "./Loja";
import PagamentosFuncionariosPage from "./PagamentosFuncionarios";
import { useAppointments, useAppointmentsRealtime } from "@/hooks/useAppointments";
import { useUpcomingExpenses } from "@/hooks/useFixedExpenses";
import UserDashboardHome from "./UserDashboardHome";
import AjudaPage from "./Ajuda";
import { OnboardingWizard } from "@/components/OnboardingWizard";

const Dashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { data: isAdmin } = useIsAdmin();
  const [sidebarOpen, setSidebarOpen] = useState(() => typeof window === "undefined" ? true : window.innerWidth >= 1024);
  const [onboardingOpen, setOnboardingOpen] = useState(false);

  const currentPath = location.pathname;

  useEffect(() => {
    const openOnboarding = () => setOnboardingOpen(true);
    window.addEventListener("washcontrol:open-onboarding", openOnboarding);
    return () => window.removeEventListener("washcontrol:open-onboarding", openOnboarding);
  }, []);

  const navItems = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
    { icon: Calendar, label: "Agendamentos", href: "/dashboard/agendamentos" },
    { icon: Users, label: "Clientes", href: "/dashboard/clientes" },
    { icon: Car, label: "Veículos", href: "/dashboard/veiculos" },
    { icon: Wrench, label: "Serviços", href: "/dashboard/servicos" },
    { icon: Store, label: "Vitrine", href: "/dashboard/loja" },
    { icon: Users, label: "Funcionários", href: "/dashboard/funcionarios" },
    { icon: Wallet, label: "Pagamentos Func.", href: "/dashboard/pagamentos-funcionarios" },
    { icon: DollarSign, label: "Financeiro", href: "/dashboard/financeiro" },
    { icon: BarChart3, label: "Relatórios", href: "/dashboard/relatorios" },
    { icon: Settings, label: "Configurações", href: "/dashboard/configuracoes" },
    { icon: HelpCircle, label: "Ajuda", href: "/dashboard/ajuda" },
  ];

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  const renderContent = () => {
    if (currentPath === "/dashboard/agendamentos") {
      return <AgendamentosPage />;
    }
    if (currentPath === "/dashboard/clientes") {
      return <ClientesPage />;
    }
    if (currentPath === "/dashboard/veiculos") {
      return <VeiculosPage />;
    }
    if (currentPath === "/dashboard/servicos") {
      return <ServicosPage />;
    }
    if (currentPath === "/dashboard/loja") {
      return <LojaPage />;
    }
    if (currentPath === "/dashboard/funcionarios") {
      return <FuncionariosPage />;
    }
    if (currentPath === "/dashboard/financeiro") {
      return <FinanceiroPage />;
    }
    if (currentPath === "/dashboard/pagamentos-funcionarios") {
      return <PagamentosFuncionariosPage />;
    }
    if (currentPath === "/dashboard/relatorios") {
      return <RelatoriosPage />;
    }
    if (currentPath === "/dashboard/configuracoes") {
      return <ConfiguracoesPage />;
    }
    if (currentPath === "/dashboard/ajuda") {
      return <AjudaPage />;
    }
    
    // Default dashboard content
    return <UserDashboardHome />;
  };

  const getPageTitle = () => {
    if (currentPath === "/dashboard/agendamentos") return "Agendamentos";
    if (currentPath === "/dashboard/clientes") return "Clientes";
    if (currentPath === "/dashboard/veiculos") return "Veículos";
    if (currentPath === "/dashboard/servicos") return "Serviços";
    if (currentPath === "/dashboard/loja") return "Vitrine";
    if (currentPath === "/dashboard/funcionarios") return "Funcionários";
    if (currentPath === "/dashboard/financeiro") return "Financeiro";
    if (currentPath === "/dashboard/pagamentos-funcionarios") return "Pagamentos de Funcionários";
    if (currentPath === "/dashboard/relatorios") return "Relatórios";
    if (currentPath === "/dashboard/configuracoes") return "Configurações";
    if (currentPath === "/dashboard/ajuda") return "Central de Ajuda";
    return "Dashboard";
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 bg-sidebar transform transition-all duration-300 ease-in-out ${
          sidebarOpen 
            ? "w-64 translate-x-0" 
            : "lg:w-16 lg:translate-x-0 -translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className={`flex items-center p-4 border-b border-sidebar-border ${sidebarOpen ? "justify-between" : "justify-center"}`}>
            <Link to="/" className="flex items-center gap-2">
              <img 
                src={logoImage} 
                alt="WashControl Logo" 
                className="w-10 h-10 rounded-xl flex-shrink-0 object-cover"
              />
              {sidebarOpen && (
                <span className="text-lg font-bold text-sidebar-foreground">
                  Wash<span className="text-primary">Control</span>
                </span>
              )}
            </Link>
            {sidebarOpen && (
              <button 
                className="lg:hidden text-sidebar-foreground"
                onClick={() => setSidebarOpen(false)}
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const isActive = currentPath === item.href || 
                (item.href !== "/dashboard" && currentPath.startsWith(item.href));
              
              return (
                <Link
                  key={item.label}
                  to={item.href}
                  onClick={() => window.innerWidth < 1024 && setSidebarOpen(false)}
                  title={!sidebarOpen ? item.label : undefined}
                  className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${
                    sidebarOpen ? "" : "justify-center"
                  } ${
                    isActive
                      ? "bg-sidebar-accent text-sidebar-primary"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                  }`}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  {sidebarOpen && <span className="font-medium">{item.label}</span>}
                </Link>
              );
            })}

            {/* Admin Link - only for admins */}
            {isAdmin && (
              <Link
                to="/admin"
                onClick={() => window.innerWidth < 1024 && setSidebarOpen(false)}
                title={!sidebarOpen ? "Admin" : undefined}
                className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${
                  sidebarOpen ? "" : "justify-center"
                } text-warning hover:bg-sidebar-accent`}
              >
                <Shield className="w-5 h-5 flex-shrink-0" />
                {sidebarOpen && <span className="font-medium">Admin</span>}
              </Link>
            )}
          </nav>

          {/* User & Logout */}
          <div className="p-2 border-t border-sidebar-border">
            {sidebarOpen ? (
              <>
                <div className="flex items-center gap-3 px-3 py-3">
                  <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-bold flex-shrink-0">
                    {user?.email?.charAt(0).toUpperCase() || "U"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-sidebar-foreground truncate">
                      Meu negócio
                    </p>
                    <p className="text-xs text-sidebar-foreground/60 truncate">
                      {user?.email}
                    </p>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  className="w-full justify-start text-sidebar-foreground/70 hover:text-destructive mt-2"
                  onClick={handleLogout}
                >
                  <LogOut className="w-5 h-5 mr-3" />
                  Sair
                </Button>
              </>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-bold">
                  {user?.email?.charAt(0).toUpperCase() || "U"}
                </div>
                <button 
                  onClick={handleLogout}
                  title="Sair"
                  className="p-2 rounded-lg text-sidebar-foreground/70 hover:text-destructive hover:bg-sidebar-accent transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`flex-1 transition-all duration-300 ${sidebarOpen ? "lg:ml-64" : "lg:ml-16"}`}>
        {/* Top Bar */}
        <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border">
          <div className="flex items-center justify-between px-4 lg:px-8 h-16">
            <div className="flex items-center gap-4">
              <button 
                className="text-foreground hover:text-primary transition-colors"
                onClick={() => setSidebarOpen(!sidebarOpen)}
              >
                {sidebarOpen ? <X className="w-6 h-6 hidden lg:block" /> : <Menu className="w-6 h-6 hidden lg:block" />}
                <Menu className="w-6 h-6 lg:hidden" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-foreground">{getPageTitle()}</h1>
                <p className="text-sm text-muted-foreground">Bem-vindo de volta!</p>
              </div>
            </div>
            {currentPath === "/dashboard" && (
              <Button variant="hero" size="default" onClick={() => navigate("/dashboard/agendamentos")}>
                <Plus className="w-4 h-4" />
                Novo Agendamento
              </Button>
            )}
          </div>
        </header>

        {/* Content */}
        <div className="p-4 lg:p-8">
          {renderContent()}
        </div>
      </main>

      <OnboardingWizard forceOpen={onboardingOpen} onClose={() => setOnboardingOpen(false)} />

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

// Dashboard Home Component
const DashboardHome = () => {
  const { data: appointments = [], isLoading, refetch: refetchAppointments, isFetching } = useAppointments(new Date());
  const { data: upcomingExpenses = [], refetch: refetchExpenses } = useUpcomingExpenses();
  
  // Enable real-time updates
  useAppointmentsRealtime();

  const handleRefresh = () => {
    refetchAppointments();
    refetchExpenses();
  };

  const today = new Date();
  const currentDay = today.getDate();
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();

  const stats = [
    { 
      label: "Faturamento Hoje", 
      value: `R$ ${appointments.filter(a => a.status === 'completed').reduce((acc, a) => acc + (Number(a.price) || 0), 0).toFixed(2)}`, 
      change: "+12%", 
      trend: "up",
      icon: DollarSign 
    },
    { 
      label: "Serviços Hoje", 
      value: appointments.length.toString(), 
      change: "", 
      trend: "neutral",
      icon: Wrench 
    },
    { 
      label: "Em Andamento", 
      value: appointments.filter(a => a.status === 'in_progress').length.toString(), 
      change: "", 
      trend: "neutral",
      icon: Clock 
    },
    { 
      label: "Finalizados", 
      value: appointments.filter(a => a.status === 'completed').length.toString(), 
      change: "", 
      trend: "up",
      icon: CheckCircle2 
    },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "in_progress":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-warning/10 text-warning text-xs font-medium">
            <Clock className="w-3 h-3" />
            Em andamento
          </span>
        );
      case "scheduled":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
            <AlertCircle className="w-3 h-3" />
            Aguardando
          </span>
        );
      case "completed":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-success/10 text-success text-xs font-medium">
            <CheckCircle2 className="w-3 h-3" />
            Finalizado
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-muted text-muted-foreground text-xs font-medium">
            Agendado
          </span>
        );
    }
  };

  return (
    <div className="space-y-8">
      {/* Header with Refresh Button */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Resumo do Dia</h2>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleRefresh}
          disabled={isFetching}
          className="gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="p-6 rounded-2xl bg-card border border-border hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <stat.icon className="w-6 h-6 text-primary" />
              </div>
              {stat.change && (
                <span className={`flex items-center gap-1 text-sm font-medium ${
                  stat.trend === "up" ? "text-success" : stat.trend === "down" ? "text-destructive" : "text-muted-foreground"
                }`}>
                  {stat.trend === "up" && <TrendingUp className="w-4 h-4" />}
                  {stat.change}
                </span>
              )}
            </div>
            <p className="text-2xl font-bold text-foreground mb-1">{stat.value}</p>
            <p className="text-sm text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Upcoming Expenses Reminder */}
      {upcomingExpenses.length > 0 && (
        <div className="rounded-2xl bg-warning/10 border border-warning/20 overflow-hidden">
          <div className="flex items-center gap-3 p-4 border-b border-warning/20">
            <div className="w-10 h-10 rounded-xl bg-warning/20 flex items-center justify-center">
              <Bell className="w-5 h-5 text-warning" />
            </div>
            <div>
              <h2 className="font-semibold text-foreground">Gastos Próximos do Vencimento</h2>
              <p className="text-sm text-muted-foreground">
                {upcomingExpenses.length} {upcomingExpenses.length === 1 ? "gasto" : "gastos"} para pagar em breve
              </p>
            </div>
          </div>
          <div className="divide-y divide-warning/20">
            {upcomingExpenses.map((expense) => {
              const dueDay = expense.due_day > daysInMonth ? daysInMonth : expense.due_day;
              let daysUntilDue = dueDay - currentDay;
              if (daysUntilDue < 0) daysUntilDue = daysInMonth - currentDay + dueDay;
              
              return (
                <div key={expense.id} className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-warning/20 flex items-center justify-center">
                      <Wallet className="w-4 h-4 text-warning" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{expense.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Vence dia {expense.due_day} • {expense.category || "Sem categoria"}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-foreground">R$ {expense.amount.toFixed(2)}</p>
                    <p className={`text-xs ${daysUntilDue === 0 ? "text-destructive font-medium" : "text-warning"}`}>
                      {daysUntilDue === 0 ? "Vence hoje!" : `em ${daysUntilDue} dia${daysUntilDue > 1 ? "s" : ""}`}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Appointments Section */}
      <div className="rounded-2xl bg-card border border-border overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Agendamentos de Hoje</h2>
            <p className="text-sm text-muted-foreground">
              {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </div>
          <Link to="/dashboard/agendamentos">
            <Button variant="outline" size="sm">
              Ver Todos
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
          </div>
        ) : appointments.length === 0 ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
              <Calendar className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">Nenhum agendamento para hoje</p>
            <Link to="/dashboard/agendamentos">
              <Button variant="hero" size="sm" className="mt-4">
                <Plus className="w-4 h-4" />
                Criar Agendamento
              </Button>
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {appointments.slice(0, 5).map((appointment) => (
              <div 
                key={appointment.id}
                className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors"
              >
                <div className="text-center min-w-[60px]">
                  <p className="text-lg font-semibold text-foreground">
                    {appointment.scheduled_time?.slice(0, 5)}
                  </p>
                </div>
                <div className="w-px h-12 bg-border" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium text-foreground truncate">
                      {appointment.clients?.name || "Cliente"}
                    </p>
                    {getStatusBadge(appointment.status)}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {appointment.vehicles 
                      ? `${appointment.vehicles.brand} ${appointment.vehicles.model} • ${appointment.vehicles.plate}` 
                      : "Veículo não informado"} • {appointment.services?.name || "Serviço"}
                  </p>
                </div>
                {appointment.employees && (
                  <div className="hidden sm:block text-right">
                    <p className="text-sm text-muted-foreground">Responsável</p>
                    <p className="font-medium text-foreground">{appointment.employees.name}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
