import { useState, useMemo } from "react";
import { format, subDays, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useEmployees } from "@/hooks/useEmployees";
import {
  useEmployeePaymentSummaries,
  useEmployeeEarnings,
  useEmployeeAdvances,
  useEmployeePaymentRecords,
  useCreateEarning,
  useCreateAdvance,
  useCreatePayment,
  useDeleteEarning,
  EmployeeSummary,
} from "@/hooks/useEmployeePayments";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { CurrencyInput, parseCurrencyToNumber, formatNumberToCurrency } from "@/components/ui/currency-input";
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
  DollarSign,
  Plus,
  ArrowLeft,
  Banknote,
  TrendingUp,
  TrendingDown,
  Wallet,
  Trash2,
  Filter,
} from "lucide-react";

type PeriodFilter = "week" | "15days" | "30days" | "custom" | "all";

const earningTypeLabels: Record<string, string> = {
  daily: "Diária",
  commission: "Comissão",
  bonus: "Meta",
  extra: "Extra",
};

const PagamentosFuncionarios = () => {
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeSummary | null>(null);
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>("30days");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  // Dialogs
  const [earningOpen, setEarningOpen] = useState(false);
  const [advanceOpen, setAdvanceOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);

  // Form states
  const [earningForm, setEarningForm] = useState({ employee_id: "", earning_date: format(new Date(), "yyyy-MM-dd"), type: "daily", description: "", amount: "" });
  const [advanceForm, setAdvanceForm] = useState({ employee_id: "", advance_date: format(new Date(), "yyyy-MM-dd"), notes: "", amount: "" });
  const [paymentForm, setPaymentForm] = useState({ employee_id: "", payment_date: format(new Date(), "yyyy-MM-dd"), payment_method: "pix", notes: "", amount: "", pay_all: true });

  const { data: employees = [] } = useEmployees();
  const createEarning = useCreateEarning();
  const createAdvance = useCreateAdvance();
  const createPayment = useCreatePayment();
  const deleteEarning = useDeleteEarning();

  // Period calculation
  const { startDate, endDate } = useMemo(() => {
    const today = new Date();
    if (periodFilter === "week") return { startDate: format(subDays(today, 7), "yyyy-MM-dd"), endDate: format(today, "yyyy-MM-dd") };
    if (periodFilter === "15days") return { startDate: format(subDays(today, 15), "yyyy-MM-dd"), endDate: format(today, "yyyy-MM-dd") };
    if (periodFilter === "30days") return { startDate: format(subDays(today, 30), "yyyy-MM-dd"), endDate: format(today, "yyyy-MM-dd") };
    if (periodFilter === "custom" && customStart && customEnd) return { startDate: customStart, endDate: customEnd };
    return { startDate: undefined, endDate: undefined };
  }, [periodFilter, customStart, customEnd]);

  // Unfiltered summaries for real cumulative balances
  const { data: summaries = [], isLoading } = useEmployeePaymentSummaries();
  // Filtered data only for history tables
  const { data: earnings = [] } = useEmployeeEarnings(selectedEmployee?.employee_id, startDate, endDate);
  const { data: advances = [] } = useEmployeeAdvances(selectedEmployee?.employee_id, startDate, endDate);
  const { data: paymentRecords = [] } = useEmployeePaymentRecords(selectedEmployee?.employee_id, startDate, endDate);

  const totals = useMemo(() => {
    return summaries.reduce(
      (acc, s) => ({
        total_earnings: acc.total_earnings + s.total_earnings,
        total_payments: acc.total_payments + s.total_payments + s.total_advances,
        pending: acc.pending + s.pending_balance,
      }),
      { total_earnings: 0, total_payments: 0, pending: 0 }
    );
  }, [summaries]);

  const handleCreateEarning = () => {
    const amount = parseCurrencyToNumber(earningForm.amount);
    if (!earningForm.employee_id || !amount) return;
    createEarning.mutate(
      { employee_id: earningForm.employee_id, earning_date: earningForm.earning_date, type: earningForm.type, description: earningForm.description || undefined, amount },
      { onSuccess: () => { setEarningOpen(false); setEarningForm({ employee_id: "", earning_date: format(new Date(), "yyyy-MM-dd"), type: "daily", description: "", amount: "" }); } }
    );
  };

  const handleCreateAdvance = () => {
    const amount = parseCurrencyToNumber(advanceForm.amount);
    if (!advanceForm.employee_id || !amount) return;
    const emp = employees.find((e) => e.id === advanceForm.employee_id);
    createAdvance.mutate(
      { employee_id: advanceForm.employee_id, amount, advance_date: advanceForm.advance_date, notes: advanceForm.notes || undefined, employee_name: emp?.name || "" },
      { onSuccess: () => { setAdvanceOpen(false); setAdvanceForm({ employee_id: "", advance_date: format(new Date(), "yyyy-MM-dd"), notes: "", amount: "" }); } }
    );
  };

  const handleCreatePayment = () => {
    const emp = employees.find((e) => e.id === paymentForm.employee_id);
    const summary = summaries.find((s) => s.employee_id === paymentForm.employee_id);
    const amount = paymentForm.pay_all ? (summary?.pending_balance || 0) : parseCurrencyToNumber(paymentForm.amount);
    if (!paymentForm.employee_id || !amount || amount <= 0) return;
    createPayment.mutate(
      { employee_id: paymentForm.employee_id, amount, payment_method: paymentForm.payment_method, payment_date: paymentForm.payment_date, notes: paymentForm.notes || undefined, employee_name: emp?.name || "" },
      { onSuccess: () => { setPaymentOpen(false); setPaymentForm({ employee_id: "", payment_date: format(new Date(), "yyyy-MM-dd"), payment_method: "pix", notes: "", amount: "", pay_all: true }); } }
    );
  };

  // Merge history for detail view
  const history = useMemo(() => {
    const items: { date: string; type: string; description: string; amount: number; status: string; id: string; kind: string }[] = [];
    earnings.forEach((e) => items.push({ date: e.earning_date, type: earningTypeLabels[e.type] || e.type, description: e.description || "—", amount: e.amount, status: e.status === "paid" ? "Pago" : "Pendente", id: e.id, kind: "earning" }));
    advances.forEach((a) => items.push({ date: a.advance_date, type: "Vale", description: a.notes || "Adiantamento", amount: -a.amount, status: "Pago", id: a.id, kind: "advance" }));
    paymentRecords.forEach((p) => items.push({ date: p.payment_date, type: "Pagamento", description: p.notes || `Pagamento via ${p.payment_method}`, amount: -p.amount, status: "Pago", id: p.id, kind: "payment" }));
    items.sort((a, b) => b.date.localeCompare(a.date));
    return items;
  }, [earnings, advances, paymentRecords]);

  if (selectedEmployee) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setSelectedEmployee(null)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h2 className="text-2xl font-bold text-foreground">{selectedEmployee.employee_name}</h2>
          <Badge variant={selectedEmployee.pending_balance > 0 ? "destructive" : "default"}>
            Saldo: {formatNumberToCurrency(selectedEmployee.pending_balance)}
          </Badge>
        </div>

        {/* Quick actions */}
        <div className="flex flex-wrap gap-2">
          <Dialog open={earningOpen} onOpenChange={setEarningOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setEarningForm((f) => ({ ...f, employee_id: selectedEmployee.employee_id }))}>
                <Plus className="h-4 w-4 mr-1" /> Adicionar valor do dia
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Registrar Ganho</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div><Label>Data</Label><Input type="date" value={earningForm.earning_date} onChange={(e) => setEarningForm((f) => ({ ...f, earning_date: e.target.value }))} /></div>
                <div><Label>Tipo</Label>
                  <Select value={earningForm.type} onValueChange={(v) => setEarningForm((f) => ({ ...f, type: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Diária</SelectItem>
                      <SelectItem value="commission">Comissão</SelectItem>
                      <SelectItem value="bonus">Meta do dia</SelectItem>
                      <SelectItem value="extra">Extra</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Descrição (opcional)</Label><Input value={earningForm.description} onChange={(e) => setEarningForm((f) => ({ ...f, description: e.target.value }))} /></div>
                <div><Label>Valor</Label><CurrencyInput value={earningForm.amount} onChange={(v) => setEarningForm((f) => ({ ...f, amount: v }))} /></div>
                <Button className="w-full" onClick={handleCreateEarning} disabled={createEarning.isPending}>Salvar</Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={advanceOpen} onOpenChange={setAdvanceOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" onClick={() => setAdvanceForm((f) => ({ ...f, employee_id: selectedEmployee.employee_id }))}>
                <Banknote className="h-4 w-4 mr-1" /> Registrar vale
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Registrar Vale / Adiantamento</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div><Label>Data</Label><Input type="date" value={advanceForm.advance_date} onChange={(e) => setAdvanceForm((f) => ({ ...f, advance_date: e.target.value }))} /></div>
                <div><Label>Valor</Label><CurrencyInput value={advanceForm.amount} onChange={(v) => setAdvanceForm((f) => ({ ...f, amount: v }))} /></div>
                <div><Label>Observação</Label><Textarea value={advanceForm.notes} onChange={(e) => setAdvanceForm((f) => ({ ...f, notes: e.target.value }))} /></div>
                <Button className="w-full" onClick={handleCreateAdvance} disabled={createAdvance.isPending}>Registrar Vale</Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={paymentOpen} onOpenChange={setPaymentOpen}>
            <DialogTrigger asChild>
              <Button variant="default" className="bg-green-600 hover:bg-green-700" onClick={() => setPaymentForm((f) => ({ ...f, employee_id: selectedEmployee.employee_id, pay_all: true }))}>
                <Wallet className="h-4 w-4 mr-1" /> Realizar pagamento
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Realizar Pagamento</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Button variant={paymentForm.pay_all ? "default" : "outline"} onClick={() => setPaymentForm((f) => ({ ...f, pay_all: true }))} className="flex-1">Pagar tudo</Button>
                  <Button variant={!paymentForm.pay_all ? "default" : "outline"} onClick={() => setPaymentForm((f) => ({ ...f, pay_all: false }))} className="flex-1">Parcial</Button>
                </div>
                {paymentForm.pay_all && (
                  <div className="p-3 bg-muted rounded-lg text-center">
                    <p className="text-sm text-muted-foreground">Valor a pagar</p>
                    <p className="text-2xl font-bold text-foreground">{formatNumberToCurrency(selectedEmployee.pending_balance)}</p>
                  </div>
                )}
                {!paymentForm.pay_all && (
                  <div><Label>Valor</Label><CurrencyInput value={paymentForm.amount} onChange={(v) => setPaymentForm((f) => ({ ...f, amount: v }))} /></div>
                )}
                <div><Label>Data</Label><Input type="date" value={paymentForm.payment_date} onChange={(e) => setPaymentForm((f) => ({ ...f, payment_date: e.target.value }))} /></div>
                <div><Label>Forma de pagamento</Label>
                  <Select value={paymentForm.payment_method} onValueChange={(v) => setPaymentForm((f) => ({ ...f, payment_method: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pix">Pix</SelectItem>
                      <SelectItem value="cash">Dinheiro</SelectItem>
                      <SelectItem value="transfer">Transferência</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Observação</Label><Textarea value={paymentForm.notes} onChange={(e) => setPaymentForm((f) => ({ ...f, notes: e.target.value }))} /></div>
                <Button className="w-full" onClick={handleCreatePayment} disabled={createPayment.isPending}>Confirmar Pagamento</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* History table */}
        <Card>
          <CardHeader><CardTitle>Histórico</CardTitle></CardHeader>
          <CardContent>
            {history.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">Nenhum registro no período.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.map((h) => (
                    <TableRow key={h.id + h.kind}>
                      <TableCell>{format(new Date(h.date + "T12:00:00"), "dd/MM/yyyy")}</TableCell>
                      <TableCell><Badge variant="outline">{h.type}</Badge></TableCell>
                      <TableCell>{h.description}</TableCell>
                      <TableCell className={`text-right font-medium ${h.amount >= 0 ? "text-green-600" : "text-red-600"}`}>
                        {h.amount >= 0 ? "+" : ""}{formatNumberToCurrency(h.amount)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={h.status === "Pendente" ? "destructive" : "secondary"}>{h.status}</Badge>
                      </TableCell>
                      <TableCell>
                        {h.kind === "earning" && h.status === "Pendente" && (
                          <Button variant="ghost" size="icon" onClick={() => deleteEarning.mutate(h.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // ---- Main list view ----
  return (
    <div className="space-y-6">
      {/* Period filter */}
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <Label className="text-xs text-muted-foreground">Período</Label>
          <Select value={periodFilter} onValueChange={(v) => setPeriodFilter(v as PeriodFilter)}>
            <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Semana</SelectItem>
              <SelectItem value="15days">15 dias</SelectItem>
              <SelectItem value="30days">30 dias</SelectItem>
              <SelectItem value="custom">Personalizado</SelectItem>
              <SelectItem value="all">Tudo</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {periodFilter === "custom" && (
          <>
            <div><Label className="text-xs text-muted-foreground">De</Label><Input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)} className="w-[160px]" /></div>
            <div><Label className="text-xs text-muted-foreground">Até</Label><Input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} className="w-[160px]" /></div>
          </>
        )}

        {/* Action buttons */}
        <div className="flex gap-2 ml-auto">
          <Dialog open={earningOpen} onOpenChange={setEarningOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-1" /> Adicionar valor do dia</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Registrar Ganho</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div><Label>Funcionário</Label>
                  <Select value={earningForm.employee_id} onValueChange={(v) => setEarningForm((f) => ({ ...f, employee_id: v }))}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>{employees.map((e) => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>Data</Label><Input type="date" value={earningForm.earning_date} onChange={(e) => setEarningForm((f) => ({ ...f, earning_date: e.target.value }))} /></div>
                <div><Label>Tipo</Label>
                  <Select value={earningForm.type} onValueChange={(v) => setEarningForm((f) => ({ ...f, type: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Diária</SelectItem>
                      <SelectItem value="commission">Comissão</SelectItem>
                      <SelectItem value="bonus">Meta do dia</SelectItem>
                      <SelectItem value="extra">Extra</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Descrição (opcional)</Label><Input value={earningForm.description} onChange={(e) => setEarningForm((f) => ({ ...f, description: e.target.value }))} /></div>
                <div><Label>Valor</Label><CurrencyInput value={earningForm.amount} onChange={(v) => setEarningForm((f) => ({ ...f, amount: v }))} /></div>
                <Button className="w-full" onClick={handleCreateEarning} disabled={createEarning.isPending}>Salvar</Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={advanceOpen} onOpenChange={setAdvanceOpen}>
            <DialogTrigger asChild>
              <Button variant="outline"><Banknote className="h-4 w-4 mr-1" /> Registrar vale</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Registrar Vale / Adiantamento</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div><Label>Funcionário</Label>
                  <Select value={advanceForm.employee_id} onValueChange={(v) => setAdvanceForm((f) => ({ ...f, employee_id: v }))}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>{employees.map((e) => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>Data</Label><Input type="date" value={advanceForm.advance_date} onChange={(e) => setAdvanceForm((f) => ({ ...f, advance_date: e.target.value }))} /></div>
                <div><Label>Valor</Label><CurrencyInput value={advanceForm.amount} onChange={(v) => setAdvanceForm((f) => ({ ...f, amount: v }))} /></div>
                <div><Label>Observação</Label><Textarea value={advanceForm.notes} onChange={(e) => setAdvanceForm((f) => ({ ...f, notes: e.target.value }))} /></div>
                <Button className="w-full" onClick={handleCreateAdvance} disabled={createAdvance.isPending}>Registrar Vale</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
              <TrendingUp className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Acumulado</p>
              <p className="text-lg font-bold text-foreground">{formatNumberToCurrency(totals.total_earnings)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <TrendingDown className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Pago</p>
              <p className="text-lg font-bold text-foreground">{formatNumberToCurrency(totals.total_payments)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/30">
              <Wallet className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Saldo Pendente</p>
              <p className="text-lg font-bold text-foreground">{formatNumberToCurrency(totals.pending)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Employee list */}
      {isLoading ? (
        <p className="text-center text-muted-foreground py-8">Carregando...</p>
      ) : summaries.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">Nenhum funcionário ativo encontrado.</CardContent></Card>
      ) : (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {summaries.map((s) => (
            <Card key={s.employee_id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelectedEmployee(s)}>
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-foreground text-lg">{s.employee_name}</h3>
                  <Badge variant={s.pending_balance > 0 ? "destructive" : "secondary"}>
                    {s.pending_balance > 0 ? "Pendente" : "Em dia"}
                  </Badge>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs">Acumulado</p>
                    <p className="font-medium text-green-600">{formatNumberToCurrency(s.total_earnings)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Pago</p>
                    <p className="font-medium text-blue-600">{formatNumberToCurrency(s.total_payments + s.total_advances)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Saldo</p>
                    <p className={`font-bold ${s.pending_balance > 0 ? "text-orange-600" : "text-foreground"}`}>{formatNumberToCurrency(s.pending_balance)}</p>
                  </div>
                </div>
                <Button variant="outline" className="w-full" size="sm">Ver Detalhes</Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default PagamentosFuncionarios;
