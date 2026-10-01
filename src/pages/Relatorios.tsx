import { useState } from "react";
import {
  useServiceRanking,
  useEmployeeRanking,
  useClientAnalysis,
  useRevenueOverTime,
  useMonthlyComparison,
  useStatusBreakdown,
  useWeekdayAnalysis,
} from "@/hooks/useRelatorios";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts";
import {
  TrendingUp,
  Users,
  Wrench,
  DollarSign,
  Award,
  UserPlus,
  RefreshCw,
  Calendar,
  BarChart3,
  Trophy,
  Target,
} from "lucide-react";
import { format, startOfMonth, endOfMonth, subMonths, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

const STATUS_COLORS: Record<string, string> = {
  completed: "hsl(var(--success))",
  scheduled: "hsl(var(--primary))",
  in_progress: "hsl(var(--warning))",
  cancelled: "hsl(var(--destructive))",
  no_show: "hsl(var(--muted-foreground))",
};

type PeriodType = "7d" | "30d" | "thisMonth" | "lastMonth" | "3months";

const RelatoriosPage = () => {
  const [period, setPeriod] = useState<PeriodType>("thisMonth");

  const getDateRange = () => {
    const now = new Date();
    switch (period) {
      case "7d":
        return { start: subDays(now, 7), end: now };
      case "30d":
        return { start: subDays(now, 30), end: now };
      case "thisMonth":
        return { start: startOfMonth(now), end: endOfMonth(now) };
      case "lastMonth":
        const lastMonth = subMonths(now, 1);
        return { start: startOfMonth(lastMonth), end: endOfMonth(lastMonth) };
      case "3months":
        return { start: subMonths(now, 3), end: now };
      default:
        return { start: startOfMonth(now), end: endOfMonth(now) };
    }
  };

  const { start, end } = getDateRange();

  const { data: serviceRanking = [], isLoading: servicesLoading } = useServiceRanking(start, end);
  const { data: employeeRanking = [], isLoading: employeesLoading } = useEmployeeRanking(start, end);
  const { data: clientAnalysis, isLoading: clientsLoading } = useClientAnalysis(start, end);
  const { data: revenueData = [], isLoading: revenueLoading } = useRevenueOverTime(start, end);
  const { data: monthlyData = [] } = useMonthlyComparison();
  const { data: statusData = [] } = useStatusBreakdown(start, end);
  const { data: weekdayData = [] } = useWeekdayAnalysis(start, end);

  const totalRevenue = serviceRanking.reduce((acc, s) => acc + s.revenue, 0);
  const totalServices = serviceRanking.reduce((acc, s) => acc + s.count, 0);

  const periodLabels: Record<PeriodType, string> = {
    "7d": "Últimos 7 dias",
    "30d": "Últimos 30 dias",
    thisMonth: "Este mês",
    lastMonth: "Mês passado",
    "3months": "Últimos 3 meses",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h2 className="text-lg font-semibold">Relatórios de Desempenho</h2>
          <p className="text-sm text-muted-foreground">
            {format(start, "dd/MM/yyyy", { locale: ptBR })} - {format(end, "dd/MM/yyyy", { locale: ptBR })}
          </p>
        </div>
        <Select value={period} onValueChange={(v) => setPeriod(v as PeriodType)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Últimos 7 dias</SelectItem>
            <SelectItem value="30d">Últimos 30 dias</SelectItem>
            <SelectItem value="thisMonth">Este mês</SelectItem>
            <SelectItem value="lastMonth">Mês passado</SelectItem>
            <SelectItem value="3months">Últimos 3 meses</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">R$ {totalRevenue.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">Faturamento</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Wrench className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalServices}</p>
                <p className="text-xs text-muted-foreground">Serviços Realizados</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                <UserPlus className="w-5 h-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">{clientAnalysis?.newClients || 0}</p>
                <p className="text-xs text-muted-foreground">Novos Clientes</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <RefreshCw className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{clientAnalysis?.returningClients || 0}</p>
                <p className="text-xs text-muted-foreground">Clientes Recorrentes</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="services">Serviços</TabsTrigger>
          <TabsTrigger value="employees">Funcionários</TabsTrigger>
          <TabsTrigger value="clients">Clientes</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Revenue Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Faturamento no Período
              </CardTitle>
            </CardHeader>
            <CardContent>
              {revenueLoading ? (
                <div className="h-[300px] flex items-center justify-center">
                  <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
                </div>
              ) : revenueData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={revenueData}>
                    <defs>
                      <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="label" fontSize={12} stroke="hsl(var(--muted-foreground))" />
                    <YAxis fontSize={12} stroke="hsl(var(--muted-foreground))" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                      formatter={(value: number) => [`R$ ${value.toFixed(2)}`, "Faturamento"]}
                    />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="hsl(var(--primary))"
                      fill="url(#revenueGradient)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  Nenhum dado disponível
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Monthly Comparison */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" />
                  Comparativo Mensal
                </CardTitle>
              </CardHeader>
              <CardContent>
                {monthlyData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="month" fontSize={12} stroke="hsl(var(--muted-foreground))" />
                      <YAxis fontSize={12} stroke="hsl(var(--muted-foreground))" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                        formatter={(value: number, name: string) => [
                          name === "revenue" ? `R$ ${value.toFixed(2)}` : value,
                          name === "revenue" ? "Faturamento" : "Serviços",
                        ]}
                      />
                      <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                    Nenhum dado disponível
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Status Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  Status dos Agendamentos
                </CardTitle>
              </CardHeader>
              <CardContent>
                {statusData.length > 0 ? (
                  <div className="flex items-center gap-4">
                    <ResponsiveContainer width="50%" height={200}>
                      <PieChart>
                        <Pie
                          data={statusData}
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={80}
                          paddingAngle={2}
                          dataKey="count"
                        >
                          {statusData.map((entry) => (
                            <Cell key={entry.status} fill={STATUS_COLORS[entry.status] || COLORS[0]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="flex-1 space-y-2">
                      {statusData.map((item) => (
                        <div key={item.status} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: STATUS_COLORS[item.status] || COLORS[0] }}
                            />
                            <span>{item.label}</span>
                          </div>
                          <span className="font-medium">{item.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                    Nenhum dado disponível
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Weekday Analysis */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Análise por Dia da Semana
              </CardTitle>
            </CardHeader>
            <CardContent>
              {weekdayData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={weekdayData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="label" fontSize={12} stroke="hsl(var(--muted-foreground))" />
                    <YAxis yAxisId="left" fontSize={12} stroke="hsl(var(--muted-foreground))" />
                    <YAxis yAxisId="right" orientation="right" fontSize={12} stroke="hsl(var(--muted-foreground))" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                      formatter={(value: number, name: string) => [
                        name === "revenue" ? `R$ ${value.toFixed(2)}` : value,
                        name === "revenue" ? "Faturamento" : "Serviços",
                      ]}
                    />
                    <Bar yAxisId="left" dataKey="count" fill="hsl(var(--chart-2))" name="count" radius={[4, 4, 0, 0]} />
                    <Bar yAxisId="right" dataKey="revenue" fill="hsl(var(--primary))" name="revenue" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                  Nenhum dado disponível
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Services Tab */}
        <TabsContent value="services" className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Trophy className="w-4 h-4" />
                  Serviços Mais Vendidos
                </CardTitle>
              </CardHeader>
              <CardContent>
                {servicesLoading ? (
                  <div className="h-[300px] flex items-center justify-center">
                    <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
                  </div>
                ) : serviceRanking.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={serviceRanking.slice(0, 8)} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis type="number" fontSize={12} stroke="hsl(var(--muted-foreground))" />
                      <YAxis type="category" dataKey="name" width={120} fontSize={12} stroke="hsl(var(--muted-foreground))" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                      />
                      <Bar dataKey="count" fill="hsl(var(--primary))" name="Quantidade" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    Nenhum dado disponível
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Ranking de Serviços</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {serviceRanking.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>#</TableHead>
                        <TableHead>Serviço</TableHead>
                        <TableHead className="text-center">Qtd</TableHead>
                        <TableHead className="text-right">Faturamento</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {serviceRanking.slice(0, 10).map((service, index) => (
                        <TableRow key={service.id}>
                          <TableCell>
                            {index < 3 ? (
                              <Badge variant={index === 0 ? "default" : "secondary"}>
                                {index + 1}º
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">{index + 1}º</span>
                            )}
                          </TableCell>
                          <TableCell className="font-medium">{service.name}</TableCell>
                          <TableCell className="text-center">{service.count}</TableCell>
                          <TableCell className="text-right font-medium">
                            R$ {service.revenue.toFixed(2)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="p-8 text-center text-muted-foreground">
                    Nenhum serviço registrado
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Employees Tab */}
        <TabsContent value="employees" className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Award className="w-4 h-4" />
                  Faturamento por Funcionário
                </CardTitle>
              </CardHeader>
              <CardContent>
                {employeesLoading ? (
                  <div className="h-[300px] flex items-center justify-center">
                    <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
                  </div>
                ) : employeeRanking.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={employeeRanking.slice(0, 8)} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis type="number" fontSize={12} stroke="hsl(var(--muted-foreground))" />
                      <YAxis type="category" dataKey="name" width={100} fontSize={12} stroke="hsl(var(--muted-foreground))" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                        formatter={(value: number) => `R$ ${value.toFixed(2)}`}
                      />
                      <Bar dataKey="revenue" fill="hsl(var(--primary))" name="Faturamento" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    Nenhum dado disponível
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Ranking de Funcionários</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {employeeRanking.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>#</TableHead>
                        <TableHead>Funcionário</TableHead>
                        <TableHead className="text-center">Serviços</TableHead>
                        <TableHead className="text-right">Faturamento</TableHead>
                        <TableHead className="text-right">Comissão</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {employeeRanking.map((employee, index) => (
                        <TableRow key={employee.id}>
                          <TableCell>
                            {index < 3 ? (
                              <Badge variant={index === 0 ? "default" : "secondary"}>
                                {index + 1}º
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">{index + 1}º</span>
                            )}
                          </TableCell>
                          <TableCell className="font-medium">{employee.name}</TableCell>
                          <TableCell className="text-center">{employee.count}</TableCell>
                          <TableCell className="text-right">R$ {employee.revenue.toFixed(2)}</TableCell>
                          <TableCell className="text-right text-success">
                            R$ {employee.commission.toFixed(2)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="p-8 text-center text-muted-foreground">
                    Nenhum funcionário registrado
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Clients Tab */}
        <TabsContent value="clients" className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <UserPlus className="w-8 h-8 mx-auto mb-2 text-success" />
                <p className="text-2xl font-bold">{clientAnalysis?.newClients || 0}</p>
                <p className="text-xs text-muted-foreground">Novos Clientes</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <RefreshCw className="w-8 h-8 mx-auto mb-2 text-primary" />
                <p className="text-2xl font-bold">{clientAnalysis?.returningClients || 0}</p>
                <p className="text-xs text-muted-foreground">Clientes Recorrentes</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <Users className="w-8 h-8 mx-auto mb-2 text-primary" />
                <p className="text-2xl font-bold">
                  {(clientAnalysis?.newClients || 0) + (clientAnalysis?.returningClients || 0)}
                </p>
                <p className="text-xs text-muted-foreground">Total Atendidos</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <DollarSign className="w-8 h-8 mx-auto mb-2 text-primary" />
                <p className="text-2xl font-bold">
                  R$ {totalServices > 0 ? (totalRevenue / totalServices).toFixed(2) : "0.00"}
                </p>
                <p className="text-xs text-muted-foreground">Ticket Médio</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Trophy className="w-4 h-4" />
                Top 10 Clientes
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {clientsLoading ? (
                <div className="p-8 text-center">
                  <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
                </div>
              ) : (clientAnalysis?.topClients?.length || 0) > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>#</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead className="text-center">Serviços</TableHead>
                      <TableHead className="text-right">Total Gasto</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {clientAnalysis?.topClients.map((client, index) => (
                      <TableRow key={client.id}>
                        <TableCell>
                          {index < 3 ? (
                            <Badge variant={index === 0 ? "default" : "secondary"}>
                              {index + 1}º
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">{index + 1}º</span>
                          )}
                        </TableCell>
                        <TableCell className="font-medium">{client.name}</TableCell>
                        <TableCell className="text-center">{client.count}</TableCell>
                        <TableCell className="text-right font-medium">
                          R$ {client.revenue.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={client.isNew ? "default" : "outline"}>
                            {client.isNew ? "Novo" : "Recorrente"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="p-8 text-center text-muted-foreground">
                  Nenhum cliente registrado no período
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RelatoriosPage;