import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import logoImage from "@/assets/logo.png";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Shield,
  Users,
  LayoutDashboard,
  LogOut,
  Menu,
  X,
  Crown,
  TrendingUp,
  UserCheck,
  UserX,
  MoreVertical,
  RefreshCw,
  ArrowLeft,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  useAllUsers,
  useAdminStats,
  useUpdateUserSubscription,
  useUpdateUserStatus,
  SubscriptionPlan,
  SubscriptionStatus,
} from "@/hooks/useAdmin";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const Admin = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const { data: users = [], isLoading: usersLoading, refetch } = useAllUsers();
  const { data: stats, isLoading: statsLoading } = useAdminStats();
  const updateSubscription = useUpdateUserSubscription();
  const updateStatus = useUpdateUserStatus();

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  const getPlanBadge = (plan: SubscriptionPlan) => {
    const styles = {
      free: "bg-muted text-muted-foreground",
      basic: "bg-primary/10 text-primary",
      pro: "bg-warning/10 text-warning",
    };

    const labels = {
      free: "Gratuito",
      basic: "Básico",
      pro: "Pro",
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[plan]}`}>
        {labels[plan]}
      </span>
    );
  };

  const getStatusBadge = (status: SubscriptionStatus) => {
    const styles = {
      active: "bg-success/10 text-success",
      canceled: "bg-destructive/10 text-destructive",
      expired: "bg-muted text-muted-foreground",
      trial: "bg-info/10 text-info",
    };

    const labels = {
      active: "Ativo",
      canceled: "Cancelado",
      expired: "Expirado",
      trial: "Trial",
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  };

  const navItems = [
    { icon: LayoutDashboard, label: "Dashboard Admin", href: "/admin" },
  ];

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
                  Admin<span className="text-primary">Panel</span>
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
            {navItems.map((item) => (
              <Link
                key={item.label}
                to={item.href}
                className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${
                  sidebarOpen ? "" : "justify-center"
                } bg-sidebar-accent text-sidebar-primary`}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {sidebarOpen && <span className="font-medium">{item.label}</span>}
              </Link>
            ))}

            <Link
              to="/dashboard"
              className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${
                sidebarOpen ? "" : "justify-center"
              } text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground`}
            >
              <ArrowLeft className="w-5 h-5 flex-shrink-0" />
              {sidebarOpen && <span className="font-medium">Voltar ao App</span>}
            </Link>
          </nav>

          {/* User & Logout */}
          <div className="p-2 border-t border-sidebar-border">
            {sidebarOpen ? (
              <>
                <div className="flex items-center gap-3 px-3 py-3">
                  <div className="w-10 h-10 rounded-full bg-warning flex items-center justify-center text-warning-foreground font-bold flex-shrink-0">
                    <Shield className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-sidebar-foreground truncate">
                      Administrador
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
                <div className="w-10 h-10 rounded-full bg-warning flex items-center justify-center text-warning-foreground font-bold">
                  <Shield className="w-5 h-5" />
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
                <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
                  <Shield className="w-5 h-5 text-warning" />
                  Painel Administrativo
                </h1>
                <p className="text-sm text-muted-foreground">Gerencie todos os usuários do sistema</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2">
              <RefreshCw className="w-4 h-4" />
              Atualizar
            </Button>
          </div>
        </header>

        {/* Content */}
        <div className="p-4 lg:p-8 space-y-8">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-6 rounded-2xl bg-card border border-border">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Users className="w-6 h-6 text-primary" />
                </div>
              </div>
              <p className="text-2xl font-bold text-foreground mb-1">
                {statsLoading ? "..." : stats?.totalUsers}
              </p>
              <p className="text-sm text-muted-foreground">Total de Usuários</p>
            </div>

            <div className="p-6 rounded-2xl bg-card border border-border">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
                  <UserCheck className="w-6 h-6 text-success" />
                </div>
              </div>
              <p className="text-2xl font-bold text-foreground mb-1">
                {statsLoading ? "..." : stats?.activeUsers}
              </p>
              <p className="text-sm text-muted-foreground">Usuários Ativos</p>
            </div>

            <div className="p-6 rounded-2xl bg-card border border-border">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center">
                  <Crown className="w-6 h-6 text-warning" />
                </div>
              </div>
              <p className="text-2xl font-bold text-foreground mb-1">
                {statsLoading ? "..." : stats?.planCounts.pro}
              </p>
              <p className="text-sm text-muted-foreground">Planos Pro</p>
            </div>

            <div className="p-6 rounded-2xl bg-card border border-border">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-info/10 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-info" />
                </div>
              </div>
              <p className="text-2xl font-bold text-foreground mb-1">
                {statsLoading ? "..." : stats?.planCounts.basic}
              </p>
              <p className="text-sm text-muted-foreground">Planos Básico</p>
            </div>
          </div>

          {/* Users Table */}
          <div className="rounded-2xl bg-card border border-border overflow-hidden">
            <div className="p-6 border-b border-border">
              <h2 className="text-lg font-semibold text-foreground">Todos os Usuários</h2>
              <p className="text-sm text-muted-foreground">
                Lista completa de lava-rápidos cadastrados na plataforma
              </p>
            </div>

            {usersLoading ? (
              <div className="p-8 text-center">
                <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
              </div>
            ) : users.length === 0 ? (
              <div className="p-8 text-center">
                <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Nenhum usuário cadastrado</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Usuário</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Plano</TableHead>
                      <TableHead>Situação</TableHead>
                      <TableHead>Cadastro</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((u) => (
                      <TableRow key={u.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium text-foreground">
                              {u.business_name || "Sem nome"}
                            </p>
                            <p className="text-sm text-muted-foreground">{u.email}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          {u.is_active ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-success/10 text-success text-xs font-medium">
                              <UserCheck className="w-3 h-3" />
                              Ativo
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-destructive/10 text-destructive text-xs font-medium">
                              <UserX className="w-3 h-3" />
                              Inativo
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Select
                            value={u.subscription?.plan || "free"}
                            onValueChange={(value) =>
                              updateSubscription.mutate({
                                userId: u.id,
                                plan: value as SubscriptionPlan,
                              })
                            }
                          >
                            <SelectTrigger className="w-28">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="free">Gratuito</SelectItem>
                              <SelectItem value="basic">Básico</SelectItem>
                              <SelectItem value="pro">Pro</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          {u.subscription && getStatusBadge(u.subscription.status)}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {format(new Date(u.created_at), "dd/MM/yyyy", { locale: ptBR })}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {u.is_active ? (
                                <DropdownMenuItem
                                  onClick={() =>
                                    updateStatus.mutate({ userId: u.id, isActive: false })
                                  }
                                  className="text-destructive"
                                >
                                  <UserX className="w-4 h-4 mr-2" />
                                  Desativar Usuário
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem
                                  onClick={() =>
                                    updateStatus.mutate({ userId: u.id, isActive: true })
                                  }
                                >
                                  <UserCheck className="w-4 h-4 mr-2" />
                                  Ativar Usuário
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem
                                onClick={() =>
                                  updateSubscription.mutate({
                                    userId: u.id,
                                    status: "canceled",
                                  })
                                }
                                className="text-destructive"
                              >
                                Cancelar Assinatura
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </div>
      </main>

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

export default Admin;
