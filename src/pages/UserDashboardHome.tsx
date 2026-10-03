import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { DollarSign, TrendingUp, TrendingDown, Wrench, Users, UserPlus, Car, Wallet, Calendar, ArrowRight, RefreshCw, Clock, CheckCircle2 } from "lucide-react";
import { useFinancialSummary } from "@/hooks/useFinanceiro";
import { useServiceRanking, useEmployeeRanking, useClientAnalysis, useRevenueOverTime } from "@/hooks/useRelatorios";
import { useEmployeesWithStats } from "@/hooks/useEmployees";
import { useUpcomingExpenses } from "@/hooks/useFixedExpenses";

const money = (v:number) => v.toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
const COLORS = ["hsl(var(--primary))","hsl(var(--chart-2))","hsl(var(--chart-3))","hsl(var(--chart-4))","hsl(var(--chart-5))"];

const UserDashboardHome = () => {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth()+1, 0);
  const { data: financial, isLoading: financialLoading, refetch: refetchFinancial } = useFinancialSummary(now);
  const { data: services=[] } = useServiceRanking(monthStart, monthEnd);
  const { data: employees=[] } = useEmployeeRanking(monthStart, monthEnd);
  const { data: clients } = useClientAnalysis(monthStart, monthEnd);
  const { data: revenue=[] } = useRevenueOverTime(monthStart, monthEnd);
  const { data: employeeStats=[] } = useEmployeesWithStats();
  const { data: upcomingExpenses=[] } = useUpcomingExpenses();

  const completed = financial?.servicesCount || 0;
  const avgTicket = completed ? (financial?.serviceRevenue || 0) / completed : 0;
  const topServices = services.slice(0,6);
  const topEmployees = employees.slice(0,5);

  const refresh = () => refetchFinancial();

  return <div className="space-y-6">
    <div className="flex flex-col sm:flex-row justify-between gap-3">
      <div><p className="text-sm text-muted-foreground">Visão geral</p><h2 className="text-2xl font-bold">Resumo do seu negócio</h2><p className="text-sm text-muted-foreground mt-1">Indicadores do mês atual</p></div>
      <div className="flex gap-2"><Button variant="outline" size="sm" onClick={refresh} className="gap-2"><RefreshCw className="w-4 h-4"/>Atualizar</Button><Link to="/dashboard/agendamentos"><Button size="sm">Novo agendamento</Button></Link></div>
    </div>

    <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
      {[
        ["Faturamento", money(financial?.totalIncome||0), DollarSign, "bg-primary/10 text-primary"],
        ["Despesas", money(financial?.totalExpense||0), TrendingDown, "bg-destructive/10 text-destructive"],
        ["Resultado", money(financial?.balance||0), TrendingUp, "bg-success/10 text-success"],
        ["Ticket médio", money(avgTicket), Wallet, "bg-warning/10 text-warning"],
      ].map(([label,value,Icon,style]:any)=><Card key={label} className="rounded-2xl"><CardContent className="p-5"><div className="flex justify-between items-start"><div><p className="text-xs text-muted-foreground">{label}</p><p className="text-xl font-bold mt-1">{financialLoading?"...":value}</p></div><div className={`w-10 h-10 rounded-xl flex items-center justify-center ${style}`}><Icon className="w-5 h-5"/></div></div></CardContent></Card>)}
    </div>

    <div className="grid lg:grid-cols-3 gap-6">
      <Card className="lg:col-span-2 rounded-2xl"><CardHeader><CardTitle className="text-base">Evolução do faturamento</CardTitle></CardHeader><CardContent><ResponsiveContainer width="100%" height={280}><AreaChart data={revenue}><CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))"/><XAxis dataKey="label" fontSize={11}/><YAxis fontSize={11}/><Tooltip formatter={(v:number)=>money(v)}/><Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.14} strokeWidth={2}/></AreaChart></ResponsiveContainer></CardContent></Card>
      <Card className="rounded-2xl"><CardHeader><CardTitle className="text-base">Operação</CardTitle></CardHeader><CardContent className="space-y-4">
        <div className="flex items-center justify-between"><span className="flex gap-2 items-center text-sm"><Wrench className="w-4 h-4 text-primary"/>Serviços concluídos</span><b>{completed}</b></div>
        <div className="flex items-center justify-between"><span className="flex gap-2 items-center text-sm"><UserPlus className="w-4 h-4 text-success"/>Novos clientes</span><b>{clients?.newClients||0}</b></div>
        <div className="flex items-center justify-between"><span className="flex gap-2 items-center text-sm"><Users className="w-4 h-4 text-info"/>Recorrentes</span><b>{clients?.returningClients||0}</b></div>
        <div className="flex items-center justify-between"><span className="flex gap-2 items-center text-sm"><Users className="w-4 h-4 text-warning"/>Funcionários ativos</span><b>{employeeStats.filter((e:any)=>e.is_active).length}</b></div>
        <Link to="/dashboard/relatorios"><Button variant="outline" className="w-full mt-2">Abrir relatórios <ArrowRight className="w-4 h-4 ml-2"/></Button></Link>
      </CardContent></Card>
    </div>

    <div className="grid lg:grid-cols-2 gap-6">
      <Card className="rounded-2xl"><CardHeader><CardTitle className="text-base">Serviços mais realizados</CardTitle></CardHeader><CardContent><ResponsiveContainer width="100%" height={260}><BarChart data={topServices} layout="vertical" margin={{left:10,right:10}}><CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))"/><XAxis type="number" allowDecimals={false}/><YAxis type="category" dataKey="name" width={110} fontSize={11}/><Tooltip/><Bar dataKey="count" name="Serviços" fill="hsl(var(--primary))" radius={[0,4,4,0]}/></BarChart></ResponsiveContainer></CardContent></Card>
      <Card className="rounded-2xl"><CardHeader><CardTitle className="text-base">Faturamento por funcionário</CardTitle></CardHeader><CardContent><ResponsiveContainer width="100%" height={260}><BarChart data={topEmployees} layout="vertical" margin={{left:10,right:10}}><CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))"/><XAxis type="number"/><YAxis type="category" dataKey="name" width={110} fontSize={11}/><Tooltip formatter={(v:number)=>money(v)}/><Bar dataKey="revenue" name="Faturamento" fill="hsl(var(--chart-2))" radius={[0,4,4,0]}/></BarChart></ResponsiveContainer></CardContent></Card>
    </div>

    <div className="grid lg:grid-cols-3 gap-6">
      <Card className="rounded-2xl"><CardHeader><CardTitle className="text-base">Resumo financeiro</CardTitle></CardHeader><CardContent><div className="space-y-3"><div className="flex justify-between text-sm"><span>Serviços</span><b>{money(financial?.serviceRevenue||0)}</b></div><div className="flex justify-between text-sm"><span>Outras entradas</span><b>{money(financial?.manualIncome||0)}</b></div><div className="flex justify-between text-sm"><span>Despesas</span><b className="text-destructive">{money(financial?.manualExpense||0)}</b></div><div className="border-t pt-3 flex justify-between"><span className="font-medium">Saldo</span><b>{money(financial?.balance||0)}</b></div></div><Link to="/dashboard/financeiro"><Button variant="outline" className="w-full mt-4">Ver financeiro</Button></Link></CardContent></Card>
      <Card className="rounded-2xl"><CardHeader><CardTitle className="text-base">Próximos gastos</CardTitle></CardHeader><CardContent>{upcomingExpenses.length? <div className="space-y-3">{upcomingExpenses.slice(0,4).map((e:any)=><div key={e.id} className="flex justify-between gap-3 text-sm"><div><p className="font-medium">{e.name}</p><p className="text-xs text-muted-foreground">Vence dia {e.due_day}</p></div><b>{money(Number(e.amount))}</b></div>)}</div>:<div className="py-6 text-center text-sm text-muted-foreground">Nenhum gasto próximo.</div>}</CardContent></Card>
      <Card className="rounded-2xl"><CardHeader><CardTitle className="text-base">Atalhos</CardTitle></CardHeader><CardContent className="grid gap-2"><Link to="/dashboard/clientes"><Button variant="outline" className="w-full justify-start"><Users className="w-4 h-4 mr-2"/>Clientes</Button></Link><Link to="/dashboard/veiculos"><Button variant="outline" className="w-full justify-start"><Car className="w-4 h-4 mr-2"/>Veículos</Button></Link><Link to="/dashboard/funcionarios"><Button variant="outline" className="w-full justify-start"><Users className="w-4 h-4 mr-2"/>Funcionários</Button></Link></CardContent></Card>
    </div>
  </div>;
};

export default UserDashboardHome;
