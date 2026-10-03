import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import logoImage from "@/assets/logo.png";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Shield, Users, LayoutDashboard, LogOut, Menu, X, Crown, UserCheck, UserX, MoreVertical, RefreshCw, ArrowLeft, DollarSign, Clock3, CalendarClock, Activity, TrendingUp } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useAllUsers, useAdminStats, useUpdateUserSubscription, useUpdateUserStatus, SubscriptionPlan, SubscriptionStatus } from "@/hooks/useAdmin";
import { format, addDays, isBefore } from "date-fns";
import { ptBR } from "date-fns/locale";

const money = (value = 0) => value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const Admin = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { data: users = [], isLoading: usersLoading, refetch: refetchUsers } = useAllUsers();
  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useAdminStats();
  const updateSubscription = useUpdateUserSubscription();
  const updateStatus = useUpdateUserStatus();

  const refresh = () => { refetchUsers(); refetchStats(); };
  const handleLogout = async () => { await signOut(); navigate("/"); };

  const planLabel: Record<string,string> = { free:"Gratuito", basic:"Básico", pro:"Pro", premium:"Premium" };
  const statusLabel: Record<SubscriptionStatus,string> = { active:"Ativo", canceled:"Cancelado", expired:"Expirado", trial:"Trial" };
  const statusClass: Record<string,string> = {
    active:"bg-success/10 text-success", trial:"bg-info/10 text-info",
    canceled:"bg-destructive/10 text-destructive", expired:"bg-muted text-muted-foreground"
  };
  const extend = (userId:string, current:string|null|undefined, days:number) => {
    const base = current && !isBefore(new Date(current), new Date()) ? new Date(current) : new Date();
    updateSubscription.mutate({ userId, expiresAt: addDays(base, days).toISOString(), status:"active" });
  };

  const navItems = [
    { icon: LayoutDashboard, label:"Visão geral", href:"/admin" },
    { icon: Users, label:"Usuários", href:"/admin#usuarios" },
    { icon: Crown, label:"Planos", href:"/admin/planos" },
  ];

  return <div className="min-h-screen bg-background flex">
    <aside className={`fixed inset-y-0 left-0 z-50 bg-sidebar transition-all duration-300 ${sidebarOpen ? "w-64 translate-x-0" : "lg:w-16 lg:translate-x-0 -translate-x-full"}`}>
      <div className="flex flex-col h-full">
        <div className={`flex items-center p-4 border-b border-sidebar-border ${sidebarOpen ? "justify-between" : "justify-center"}`}>
          <Link to="/" className="flex items-center gap-2"><img src={logoImage} alt="WashControl" className="w-10 h-10 rounded-xl object-cover"/>{sidebarOpen && <span className="text-lg font-bold text-sidebar-foreground">Wash<span className="text-primary">Control</span></span>}</Link>
          {sidebarOpen && <button className="lg:hidden text-sidebar-foreground" onClick={()=>setSidebarOpen(false)}><X className="w-5 h-5"/></button>}
        </div>
        <nav className="flex-1 p-2 space-y-1">
          {navItems.map(item=><Link key={item.label} to={item.href} className={`flex items-center gap-3 px-3 py-3 rounded-lg bg-sidebar-accent text-sidebar-primary ${!sidebarOpen ? "justify-center":""}`}><item.icon className="w-5 h-5"/>{sidebarOpen&&<span className="font-medium">{item.label}</span>}</Link>)}
          <Link to="/dashboard" className={`flex items-center gap-3 px-3 py-3 rounded-lg text-sidebar-foreground/70 hover:bg-sidebar-accent ${!sidebarOpen ? "justify-center":""}`}><ArrowLeft className="w-5 h-5"/>{sidebarOpen&&<span className="font-medium">Voltar ao app</span>}</Link>
        </nav>
        <div className="p-3 border-t border-sidebar-border">
          {sidebarOpen && <div className="flex items-center gap-3 px-2 py-2"><div className="w-10 h-10 rounded-full bg-warning/20 flex items-center justify-center"><Shield className="w-5 h-5 text-warning"/></div><div className="min-w-0"><p className="text-sm font-medium text-sidebar-foreground">Administrador</p><p className="text-xs text-sidebar-foreground/60 truncate">{user?.email}</p></div></div>}
          <Button variant="ghost" className="w-full justify-start text-sidebar-foreground/70 mt-2" onClick={handleLogout}><LogOut className="w-5 h-5 mr-3"/>Sair</Button>
        </div>
      </div>
    </aside>

    <main className={`flex-1 transition-all duration-300 ${sidebarOpen ? "lg:ml-64":"lg:ml-16"}`}>
      <header className="sticky top-0 z-40 bg-background/85 backdrop-blur-xl border-b border-border">
        <div className="flex items-center justify-between px-4 lg:px-8 h-16">
          <div className="flex items-center gap-4"><button className="text-foreground" onClick={()=>setSidebarOpen(!sidebarOpen)}><Menu className="w-6 h-6"/></button><div><h1 className="text-xl font-bold flex items-center gap-2"><Shield className="w-5 h-5 text-warning"/>Super Admin</h1><p className="text-sm text-muted-foreground">Visão geral da operação SaaS</p></div></div>
          <Button variant="outline" size="sm" onClick={refresh} className="gap-2"><RefreshCw className="w-4 h-4"/>Atualizar</Button>
        </div>
      </header>

      <div className="p-4 lg:p-8 space-y-6">
        <section className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          {[
            ["Usuários", stats?.totalUsers ?? 0, Users, "bg-primary/10 text-primary"],
            ["Ativos", stats?.activeUsers ?? 0, UserCheck, "bg-success/10 text-success"],
            ["Assinaturas ativas", stats?.activeSubscriptions ?? 0, Crown, "bg-warning/10 text-warning"],
            ["MRR contratado", money(stats?.mrr ?? 0), DollarSign, "bg-info/10 text-info"],
          ].map(([label,value,Icon,style]:any)=><Card key={label} className="rounded-2xl"><CardContent className="p-5"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">{label}</p><p className="text-2xl font-bold mt-1">{statsLoading?"...":value}</p></div><div className={`w-11 h-11 rounded-xl flex items-center justify-center ${style}`}><Icon className="w-5 h-5"/></div></div></CardContent></Card>)}
        </section>

        <section className="grid lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 rounded-2xl"><CardHeader><CardTitle className="text-base flex items-center gap-2"><TrendingUp className="w-4 h-4"/>Crescimento de usuários</CardTitle></CardHeader><CardContent><ResponsiveContainer width="100%" height={260}><AreaChart data={stats?.usersByMonth || []}><CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))"/><XAxis dataKey="month" fontSize={12}/><YAxis allowDecimals={false} fontSize={12}/><Tooltip/><Area type="monotone" dataKey="users" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.14} strokeWidth={2}/></AreaChart></ResponsiveContainer></CardContent></Card>
          <Card className="rounded-2xl"><CardHeader><CardTitle className="text-base">Distribuição dos planos</CardTitle></CardHeader><CardContent><ResponsiveContainer width="100%" height={260}><PieChart><Pie data={stats?.planDistribution || []} dataKey="value" nameKey="name" innerRadius={58} outerRadius={90} paddingAngle={3}>{(stats?.planDistribution || []).map((_:any,i:number)=><Cell key={i} fill={["hsl(var(--primary))","hsl(var(--chart-2))","hsl(var(--chart-3))","hsl(var(--chart-4))"][i%4]}/>)}</Pie><Tooltip/></PieChart></ResponsiveContainer><div className="space-y-2">{(stats?.planDistribution||[]).map((p:any)=><div key={p.name} className="flex justify-between text-sm"><span>{p.name}</span><b>{p.value}</b></div>)}</div></CardContent></Card>
        </section>

        <section className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="rounded-2xl"><CardContent className="p-5"><p className="text-sm text-muted-foreground">Valor anual contratado</p><p className="text-xl font-bold mt-1">{money(stats?.annualContractValue||0)}</p><p className="text-xs text-muted-foreground mt-1">MRR × 12, sem simular recebimentos</p></CardContent></Card>
          <Card className="rounded-2xl"><CardContent className="p-5"><p className="text-sm text-muted-foreground">Trials ativos</p><p className="text-xl font-bold mt-1">{stats?.trialSubscriptions||0}</p></CardContent></Card>
          <Card className="rounded-2xl"><CardContent className="p-5"><p className="text-sm text-muted-foreground">Vencendo em 7 dias</p><p className="text-xl font-bold mt-1">{stats?.expiringSoon||0}</p><p className="text-xs text-muted-foreground mt-1">Assinaturas a acompanhar</p></CardContent></Card>
          <Card className="rounded-2xl"><CardContent className="p-5"><p className="text-sm text-muted-foreground">Inativos</p><p className="text-xl font-bold mt-1">{stats?.inactiveUsers||0}</p></CardContent></Card>
        </section>

        <Card id="usuarios" className="rounded-2xl overflow-hidden">
          <CardHeader><CardTitle className="text-base">Gestão de usuários</CardTitle><p className="text-sm text-muted-foreground">Ative, desative, altere plano e estenda a assinatura sem precisar editar banco.</p></CardHeader>
          {usersLoading ? <div className="p-10 text-center">Carregando...</div> : <div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Empresa</TableHead><TableHead>Status</TableHead><TableHead>Plano</TableHead><TableHead>Assinatura</TableHead><TableHead>Vencimento</TableHead><TableHead>Cadastro</TableHead><TableHead className="text-right">Ações</TableHead></TableRow></TableHeader><TableBody>
            {users.map(u=><TableRow key={u.id}>
              <TableCell><p className="font-medium">{u.business_name||"Sem nome"}</p><p className="text-xs text-muted-foreground">{u.email}</p></TableCell>
              <TableCell>{u.is_active?<span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-success/10 text-success text-xs"><UserCheck className="w-3 h-3"/>Ativo</span>:<span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-destructive/10 text-destructive text-xs"><UserX className="w-3 h-3"/>Inativo</span>}</TableCell>
              <TableCell><Select value={u.subscription?.plan||"free"} onValueChange={v=>updateSubscription.mutate({userId:u.id,plan:v as SubscriptionPlan})}><SelectTrigger className="w-32"><SelectValue/></SelectTrigger><SelectContent>{Object.entries(planLabel).map(([v,l])=><SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent></Select></TableCell>
              <TableCell>{u.subscription?<span className={`px-2 py-1 rounded-full text-xs ${statusClass[u.subscription.status]||"bg-muted"}`}>{statusLabel[u.subscription.status]}</span>:<span className="text-xs text-muted-foreground">Sem assinatura</span>}</TableCell>
              <TableCell>{u.subscription?.expires_at?format(new Date(u.subscription.expires_at),"dd/MM/yyyy",{locale:ptBR}):"—"}</TableCell>
              <TableCell className="text-muted-foreground">{format(new Date(u.created_at),"dd/MM/yyyy",{locale:ptBR})}</TableCell>
              <TableCell className="text-right"><DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="sm"><MoreVertical className="w-4 h-4"/></Button></DropdownMenuTrigger><DropdownMenuContent align="end">
                {u.is_active?<DropdownMenuItem className="text-destructive" onClick={()=>updateStatus.mutate({userId:u.id,isActive:false})}><UserX className="w-4 h-4 mr-2"/>Desativar</DropdownMenuItem>:<DropdownMenuItem onClick={()=>updateStatus.mutate({userId:u.id,isActive:true})}><UserCheck className="w-4 h-4 mr-2"/>Ativar</DropdownMenuItem>}
                <DropdownMenuSeparator/>
                <DropdownMenuItem onClick={()=>extend(u.id,u.subscription?.expires_at,7)}><CalendarClock className="w-4 h-4 mr-2"/>+7 dias</DropdownMenuItem>
                <DropdownMenuItem onClick={()=>extend(u.id,u.subscription?.expires_at,15)}><CalendarClock className="w-4 h-4 mr-2"/>+15 dias</DropdownMenuItem>
                <DropdownMenuItem onClick={()=>extend(u.id,u.subscription?.expires_at,30)}><CalendarClock className="w-4 h-4 mr-2"/>+30 dias</DropdownMenuItem>
                <DropdownMenuItem onClick={()=>extend(u.id,u.subscription?.expires_at,60)}><CalendarClock className="w-4 h-4 mr-2"/>+60 dias</DropdownMenuItem>
                <DropdownMenuSeparator/>
                <DropdownMenuItem className="text-destructive" onClick={()=>updateSubscription.mutate({userId:u.id,status:"canceled"})}><Clock3 className="w-4 h-4 mr-2"/>Cancelar assinatura</DropdownMenuItem>
              </DropdownMenuContent></DropdownMenu></TableCell>
            </TableRow>)}
          </TableBody></Table></div>}
        </Card>
      </div>
    </main>
    {sidebarOpen&&<div className="fixed inset-0 bg-foreground/20 z-40 lg:hidden" onClick={()=>setSidebarOpen(false)}/>}
  </div>;
};
export default Admin;
