import { useState, useEffect, useMemo } from "react";
import {
  useFinancialSummary,
  useDailyRevenue,
  useMonthlyComparison,
  useTransactions,
  useCreateTransaction,
  useUpdateTransaction,
  useDeleteTransaction,
  useTransactionsRealtime,
  Transaction,
} from "@/hooks/useFinanceiro";
import { useEmployees } from "@/hooks/useEmployees";
import { useCashDrawer, useUpsertCashDrawer } from "@/hooks/useCashDrawer";
import { useCustomCategories, useCreateCategory, useUpdateCategory, useDeleteCategory } from "@/hooks/useCustomCategories";
import { AccountsReceivableSection } from "@/components/financeiro/AccountsReceivableSection";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus,
  DollarSign,
  TrendingUp,
  TrendingDown,
  CreditCard,
  Banknote,
  Smartphone,
  Wallet,
  ArrowUpCircle,
  ArrowDownCircle,
  Trash2,
  Calendar,
  Wrench,
  ChevronLeft,
  ChevronRight,
  User,
  Pencil,
  Settings,
  Tag,
  Vault,
} from "lucide-react";
import { format, startOfMonth, endOfMonth, addMonths, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { formatDateToLocal, parseDateFromLocal } from "@/lib/utils";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const paymentMethodLabels: Record<string, string> = {
  cash: "Dinheiro",
  pix: "PIX",
  credit_card: "Cartão de Crédito",
  debit_card: "Cartão de Débito",
  transfer: "Transferência",
  other: "Outro",
};

const paymentMethodIcons: Record<string, React.ReactNode> = {
  cash: <Banknote className="w-4 h-4" />,
  pix: <Smartphone className="w-4 h-4" />,
  credit_card: <CreditCard className="w-4 h-4" />,
  debit_card: <CreditCard className="w-4 h-4" />,
  transfer: <Wallet className="w-4 h-4" />,
  other: <DollarSign className="w-4 h-4" />,
};

const incomeCategories = [
  "Serviços",
  "Vendas de Produtos",
  "Outros",
];

const expenseCategories = [
  "Funcionário",
  "Aluguel",
  "Energia",
  "Água",
  "Internet",
  "Telefone",
  "Salários",
  "Impostos",
  "Seguro",
  "Manutenção",
  "Fornecedores",
  "Produtos de Limpeza",
  "Combustível",
  "Marketing",
  "Equipamentos",
  "Material de Escritório",
  "Outros",
];

const categoryColors: Record<string, string> = {
  "Funcionário": "bg-violet-500/10 text-violet-600",
  "Aluguel": "bg-red-500/10 text-red-600",
  "Energia": "bg-yellow-500/10 text-yellow-600",
  "Água": "bg-blue-500/10 text-blue-600",
  "Internet": "bg-purple-500/10 text-purple-600",
  "Telefone": "bg-indigo-500/10 text-indigo-600",
  "Salários": "bg-emerald-500/10 text-emerald-600",
  "Impostos": "bg-orange-500/10 text-orange-600",
  "Seguro": "bg-cyan-500/10 text-cyan-600",
  "Manutenção": "bg-amber-500/10 text-amber-600",
  "Fornecedores": "bg-lime-500/10 text-lime-600",
  "Produtos de Limpeza": "bg-teal-500/10 text-teal-600",
  "Combustível": "bg-rose-500/10 text-rose-600",
  "Marketing": "bg-pink-500/10 text-pink-600",
  "Equipamentos": "bg-slate-500/10 text-slate-600",
  "Material de Escritório": "bg-zinc-500/10 text-zinc-600",
  "Serviços": "bg-green-500/10 text-green-600",
  "Vendas de Produtos": "bg-sky-500/10 text-sky-600",
  "Outros": "bg-gray-500/10 text-gray-600",
};

const COLORS = ["hsl(var(--primary))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];

const FinanceiroPage = () => {
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [cashDrawerDialogOpen, setCashDrawerDialogOpen] = useState(false);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [manageCategoriesOpen, setManageCategoriesOpen] = useState(false);
  const [employeeFilter, setEmployeeFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  
  const [formData, setFormData] = useState({
    type: "income" as "income" | "expense",
    amount: "",
    description: "",
    category: "",
    payment_method: "",
    transaction_date: formatDateToLocal(new Date()),
    notes: "",
    employee_id: "",
  });
  const [cashDrawerAmount, setCashDrawerAmount] = useState("");
  const [cashDrawerNotes, setCashDrawerNotes] = useState("");
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryType, setNewCategoryType] = useState<"income" | "expense">("expense");
  const [newCategoryColor, setNewCategoryColor] = useState("");

  const { data: summary, isLoading: summaryLoading } = useFinancialSummary(selectedMonth);
  const { data: dailyRevenue } = useDailyRevenue(new Date());
  const { data: comparison } = useMonthlyComparison();
  const { data: transactions = [], isLoading: transactionsLoading } = useTransactions(
    startOfMonth(selectedMonth),
    endOfMonth(selectedMonth)
  );
  const { data: employees = [] } = useEmployees();
  const { data: cashDrawer } = useCashDrawer(new Date());
  const { data: customCategories = [] } = useCustomCategories();
  
  const createTransaction = useCreateTransaction();
  const updateTransaction = useUpdateTransaction();
  const deleteTransaction = useDeleteTransaction();
  const upsertCashDrawer = useUpsertCashDrawer();
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();
  
  // Enable real-time updates
  useTransactionsRealtime();

  // Merge default and custom categories
  const mergedIncomeCategories = useMemo(() => {
    const custom = customCategories.filter(c => c.type === "income").map(c => c.name);
    return [...incomeCategories, ...custom.filter(c => !incomeCategories.includes(c))];
  }, [customCategories]);

  const mergedExpenseCategories = useMemo(() => {
    const custom = customCategories.filter(c => c.type === "expense").map(c => c.name);
    return [...expenseCategories, ...custom.filter(c => !expenseCategories.includes(c))];
  }, [customCategories]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingTransaction) {
      await updateTransaction.mutateAsync({
        id: editingTransaction.id,
        type: formData.type,
        amount: parseCurrencyToNumber(formData.amount),
        description: formData.description,
        category: formData.category || undefined,
        payment_method: formData.payment_method || undefined,
        transaction_date: formData.transaction_date,
        notes: formData.notes || undefined,
        employee_id: formData.employee_id || undefined,
      });
    } else {
      await createTransaction.mutateAsync({
        type: formData.type,
        amount: parseCurrencyToNumber(formData.amount),
        description: formData.description,
        category: formData.category || undefined,
        payment_method: formData.payment_method || undefined,
        transaction_date: formData.transaction_date,
        notes: formData.notes || undefined,
        employee_id: formData.employee_id || undefined,
      });
    }
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      type: "income",
      amount: "",
      description: "",
      category: "",
      payment_method: "",
      transaction_date: formatDateToLocal(new Date()),
      notes: "",
      employee_id: "",
    });
    setEditingTransaction(null);
    setDialogOpen(false);
  };

  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setFormData({
      type: transaction.type,
      amount: formatNumberToCurrency(Number(transaction.amount)),
      description: transaction.description,
      category: transaction.category || "",
      payment_method: transaction.payment_method || "",
      transaction_date: transaction.transaction_date,
      notes: transaction.notes || "",
      employee_id: transaction.employee_id || "",
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir esta transação?")) {
      await deleteTransaction.mutateAsync(id);
    }
  };

  const handleSaveCashDrawer = async () => {
    await upsertCashDrawer.mutateAsync({
      drawer_date: formatDateToLocal(new Date()),
      opening_balance: parseCurrencyToNumber(cashDrawerAmount),
      notes: cashDrawerNotes || undefined,
    });
    setCashDrawerDialogOpen(false);
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;
    await createCategory.mutateAsync({
      name: newCategoryName.trim(),
      type: newCategoryType,
      color: newCategoryColor || undefined,
    });
    setNewCategoryName("");
    setNewCategoryColor("");
    setCategoryDialogOpen(false);
  };

  const handleDeleteCategory = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir esta categoria?")) {
      await deleteCategory.mutateAsync(id);
    }
  };


  // Load cash drawer data when opening dialog
  useEffect(() => {
    if (cashDrawerDialogOpen && cashDrawer) {
      setCashDrawerAmount(formatNumberToCurrency(Number(cashDrawer.opening_balance)));
      setCashDrawerNotes(cashDrawer.notes || "");
    } else if (cashDrawerDialogOpen) {
      setCashDrawerAmount("");
      setCashDrawerNotes("");
    }
  }, [cashDrawerDialogOpen, cashDrawer]);

  const previousMonth = () => setSelectedMonth(subMonths(selectedMonth, 1));
  const nextMonth = () => setSelectedMonth(addMonths(selectedMonth, 1));

  // Prepare chart data
  const dailyChartData = summary?.dailyData
    ? Object.entries(summary.dailyData)
        .map(([date, data]) => ({
          date: format(parseDateFromLocal(date), "dd/MM"),
          receita: data.income,
          despesa: data.expense,
        }))
        .sort((a, b) => a.date.localeCompare(b.date))
    : [];

  const paymentChartData = summary?.paymentMethods
    ? Object.entries(summary.paymentMethods).map(([method, value]) => ({
        name: paymentMethodLabels[method] || method,
        value,
      }))
    : [];

  // Prepare expense by category data
  const expenseByCategoryData = transactions
    .filter((t) => t.type === "expense" && t.category)
    .reduce((acc, t) => {
      const category = t.category || "Outros";
      acc[category] = (acc[category] || 0) + Number(t.amount);
      return acc;
    }, {} as Record<string, number>);

  const expenseCategoryChartData = Object.entries(expenseByCategoryData)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  const CATEGORY_COLORS = [
    "hsl(0, 70%, 50%)",      // Red
    "hsl(45, 90%, 50%)",     // Yellow
    "hsl(200, 80%, 50%)",    // Blue
    "hsl(280, 70%, 50%)",    // Purple
    "hsl(160, 70%, 45%)",    // Teal
    "hsl(30, 90%, 50%)",     // Orange
    "hsl(320, 70%, 50%)",    // Pink
    "hsl(100, 60%, 45%)",    // Green
    "hsl(220, 70%, 55%)",    // Indigo
    "hsl(60, 70%, 50%)",     // Lime
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={previousMonth}>
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <h2 className="text-lg font-semibold min-w-[160px] text-center">
            {format(selectedMonth, "MMMM yyyy", { locale: ptBR })}
          </h2>
          <Button variant="ghost" size="icon" onClick={nextMonth}>
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {/* Cash Drawer Button */}
          <Dialog open={cashDrawerDialogOpen} onOpenChange={setCashDrawerDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Vault className="w-4 h-4 mr-2" />
                Caixa Inicial
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Caixa Inicial do Dia</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Defina o valor inicial do caixa para começar o dia com mais controle.
                </p>
                <div className="space-y-2">
                  <Label>Valor Inicial</Label>
                  <CurrencyInput
                    value={cashDrawerAmount}
                    onChange={setCashDrawerAmount}
                    placeholder="0,00"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Observações</Label>
                  <Textarea
                    value={cashDrawerNotes}
                    onChange={(e) => setCashDrawerNotes(e.target.value)}
                    placeholder="Anotações sobre o caixa..."
                    rows={2}
                  />
                </div>
                {cashDrawer && (
                  <p className="text-xs text-muted-foreground">
                    Último registro: R$ {formatNumberToCurrency(Number(cashDrawer.opening_balance))}
                  </p>
                )}
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setCashDrawerDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleSaveCashDrawer} disabled={upsertCashDrawer.isPending}>
                    Salvar
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Manage Categories Button */}
          <Dialog open={manageCategoriesOpen} onOpenChange={setManageCategoriesOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Tag className="w-4 h-4 mr-2" />
                Categorias
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Gerenciar Categorias</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {/* Add new category */}
                <div className="space-y-3 p-3 border rounded-lg">
                  <Label className="font-medium">Nova Categoria</Label>
                  <Input
                    placeholder="Nome da categoria"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <Select value={newCategoryType} onValueChange={(v: "income" | "expense") => setNewCategoryType(v)}>
                      <SelectTrigger className="flex-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="income">Entrada</SelectItem>
                        <SelectItem value="expense">Saída</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button onClick={handleCreateCategory} disabled={!newCategoryName.trim() || createCategory.isPending}>
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* List custom categories */}
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Suas categorias personalizadas</Label>
                  {customCategories.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Nenhuma categoria personalizada criada
                    </p>
                  ) : (
                    <div className="space-y-2 max-h-[300px] overflow-y-auto">
                      {customCategories.map((cat) => (
                        <div key={cat.id} className="flex items-center justify-between p-2 border rounded-lg">
                          <div className="flex items-center gap-2">
                            <Badge variant={cat.type === "income" ? "default" : "destructive"}>
                              {cat.type === "income" ? "Entrada" : "Saída"}
                            </Badge>
                            <span className="text-sm">{cat.name}</span>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive h-8 w-8"
                            onClick={() => handleDeleteCategory(cat.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* New Transaction Button */}
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) {
              setEditingTransaction(null);
              resetForm();
            }
          }}>
            <DialogTrigger asChild>
              <Button variant="hero">
                <Plus className="w-4 h-4" />
                Nova Transação
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingTransaction ? "Editar Transação" : "Nova Transação"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant={formData.type === "income" ? "default" : "outline"}
                      className="flex-1"
                      onClick={() => setFormData({ ...formData, type: "income" })}
                    >
                      <ArrowUpCircle className="w-4 h-4 mr-2" />
                      Entrada
                    </Button>
                    <Button
                      type="button"
                      variant={formData.type === "expense" ? "destructive" : "outline"}
                      className="flex-1"
                      onClick={() => setFormData({ ...formData, type: "expense" })}
                    >
                      <ArrowDownCircle className="w-4 h-4 mr-2" />
                      Saída
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="amount">Valor *</Label>
                    <CurrencyInput
                      id="amount"
                      value={formData.amount}
                      onChange={(value) => setFormData({ ...formData, amount: value })}
                      placeholder="0,00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="transaction_date">Data *</Label>
                    <Input
                      id="transaction_date"
                      type="date"
                      value={formData.transaction_date}
                      onChange={(e) => setFormData({ ...formData, transaction_date: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Descrição *</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">Categoria</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) => setFormData({ ...formData, category: value, employee_id: value !== "Funcionário" ? "" : formData.employee_id })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {(formData.type === "income" ? mergedIncomeCategories : mergedExpenseCategories).map((cat) => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="payment_method">Forma de Pagamento</Label>
                    <Select
                      value={formData.payment_method}
                      onValueChange={(value) => setFormData({ ...formData, payment_method: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">Dinheiro</SelectItem>
                        <SelectItem value="pix">PIX</SelectItem>
                        <SelectItem value="credit_card">Cartão de Crédito</SelectItem>
                        <SelectItem value="debit_card">Cartão de Débito</SelectItem>
                        <SelectItem value="transfer">Transferência</SelectItem>
                        <SelectItem value="other">Outro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {formData.category === "Funcionário" && (
                  <div className="space-y-2">
                    <Label htmlFor="employee_id">Funcionário</Label>
                    <Select
                      value={formData.employee_id}
                      onValueChange={(value) => setFormData({ ...formData, employee_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o funcionário" />
                      </SelectTrigger>
                      <SelectContent>
                        {employees.filter(e => e.is_active).map((employee) => (
                          <SelectItem key={employee.id} value={employee.id}>
                            {employee.name} {employee.role ? `(${employee.role})` : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="notes">Observações</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={2}
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancelar
                  </Button>
                  <Button type="submit" variant="hero" disabled={editingTransaction ? updateTransaction.isPending : createTransaction.isPending}>
                    {editingTransaction ? "Salvar" : "Criar"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Receita Total</p>
                <p className="text-2xl font-bold text-success">
                  R$ {(summary?.totalIncome || 0).toFixed(2)}
                </p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Despesas</p>
                <p className="text-2xl font-bold text-destructive">
                  R$ {(summary?.totalExpense || 0).toFixed(2)}
                </p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                <TrendingDown className="w-5 h-5 text-destructive" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Saldo</p>
                <p className={`text-2xl font-bold ${(summary?.balance || 0) >= 0 ? "text-success" : "text-destructive"}`}>
                  R$ {(summary?.balance || 0).toFixed(2)}
                </p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Serviços</p>
                <p className="text-2xl font-bold">{summary?.servicesCount || 0}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Wrench className="w-5 h-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Today's Revenue */}
      {dailyRevenue && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Hoje ({format(new Date(), "dd/MM/yyyy", { locale: ptBR })})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Serviços</p>
                <p className="text-lg font-bold">R$ {dailyRevenue.serviceRevenue.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Outras Entradas</p>
                <p className="text-lg font-bold">R$ {dailyRevenue.manualIncome.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Despesas</p>
                <p className="text-lg font-bold text-destructive">R$ {dailyRevenue.totalExpense.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Saldo do Dia</p>
                <p className={`text-lg font-bold ${dailyRevenue.balance >= 0 ? "text-success" : "text-destructive"}`}>
                  R$ {dailyRevenue.balance.toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Month Comparison */}
      {comparison && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Comparação com mês anterior</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-lg font-bold ${comparison.percentChange >= 0 ? "text-success" : "text-destructive"}`}>
                    {comparison.percentChange >= 0 ? "+" : ""}
                    {comparison.percentChange.toFixed(1)}%
                  </span>
                  {comparison.percentChange >= 0 ? (
                    <TrendingUp className="w-4 h-4 text-success" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-destructive" />
                  )}
                </div>
              </div>
              <div className="text-right text-sm text-muted-foreground">
                <p>Mês atual: R$ {comparison.currentMonth.toFixed(2)}</p>
                <p>Mês anterior: R$ {comparison.lastMonth.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Daily Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Receitas e Despesas Diárias</CardTitle>
          </CardHeader>
          <CardContent>
            {dailyChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={dailyChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" fontSize={12} stroke="hsl(var(--muted-foreground))" />
                  <YAxis fontSize={12} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                    formatter={(value: number) => `R$ ${value.toFixed(2)}`}
                  />
                  <Bar dataKey="receita" fill="hsl(var(--success))" name="Receita" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="despesa" fill="hsl(var(--destructive))" name="Despesa" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                Nenhum dado disponível
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment Methods Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Formas de Pagamento</CardTitle>
          </CardHeader>
          <CardContent>
            {paymentChartData.length > 0 ? (
              <div className="flex items-center gap-4">
                <ResponsiveContainer width="50%" height={200}>
                  <PieChart>
                    <Pie
                      data={paymentChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {paymentChartData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                      formatter={(value: number) => `R$ ${value.toFixed(2)}`}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex-1 space-y-2">
                  {paymentChartData.map((item, index) => (
                    <div key={item.name} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <span>{item.name}</span>
                      </div>
                      <span className="font-medium">R$ {item.value.toFixed(2)}</span>
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

      {/* Expense by Category Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Despesas por Categoria</CardTitle>
        </CardHeader>
        <CardContent>
          {expenseCategoryChartData.length > 0 ? (
            <div className="flex flex-col lg:flex-row items-center gap-6">
              <ResponsiveContainer width="100%" height={280} className="lg:max-w-[50%]">
                <PieChart>
                  <Pie
                    data={expenseCategoryChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    labelLine={false}
                  >
                    {expenseCategoryChartData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                    formatter={(value: number) => `R$ ${value.toFixed(2)}`}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 w-full space-y-2">
                {expenseCategoryChartData.map((item, index) => (
                  <div key={item.name} className="flex items-center justify-between text-sm p-2 rounded-lg hover:bg-muted/50">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-4 h-4 rounded-full flex-shrink-0"
                        style={{ backgroundColor: CATEGORY_COLORS[index % CATEGORY_COLORS.length] }}
                      />
                      <span className="font-medium">{item.name}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-semibold">R$ {item.value.toFixed(2)}</span>
                      <span className="text-muted-foreground ml-2 text-xs">
                        ({((item.value / expenseCategoryChartData.reduce((acc, i) => acc + i.value, 0)) * 100).toFixed(1)}%)
                      </span>
                    </div>
                  </div>
                ))}
                <div className="pt-3 mt-3 border-t border-border">
                  <div className="flex items-center justify-between font-semibold">
                    <span>Total de Despesas</span>
                    <span className="text-destructive">
                      R$ {expenseCategoryChartData.reduce((acc, i) => acc + i.value, 0).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-muted-foreground">
              Nenhuma despesa com categoria registrada neste mês
            </div>
          )}
        </CardContent>
      </Card>

      {/* Accounts Receivable Section */}
      <AccountsReceivableSection />

      {/* Transactions List */}
      <Card>
        <CardHeader className="flex flex-col gap-4">
          <CardTitle className="text-base">Transações Manuais do Mês</CardTitle>
          <div className="flex flex-col sm:flex-row gap-3 w-full">
            <div className="flex items-center gap-2 flex-1">
              <Label htmlFor="category-filter" className="text-sm text-muted-foreground whitespace-nowrap">
                Categoria:
              </Label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {[...mergedIncomeCategories, ...mergedExpenseCategories.filter(c => !mergedIncomeCategories.includes(c))].map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2 flex-1">
              <Label htmlFor="employee-filter" className="text-sm text-muted-foreground whitespace-nowrap">
                Funcionário:
              </Label>
              <Select value={employeeFilter} onValueChange={setEmployeeFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {employees.filter(e => e.is_active).map((employee) => (
                    <SelectItem key={employee.id} value={employee.id}>
                      {employee.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {transactionsLoading ? (
            <div className="p-8 text-center">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
            </div>
          ) : (() => {
            const filteredTransactions = transactions
              .filter(t => categoryFilter === "all" || t.category === categoryFilter)
              .filter(t => employeeFilter === "all" || t.employee_id === employeeFilter);
            
            return filteredTransactions.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                {categoryFilter === "all" && employeeFilter === "all"
                  ? "Nenhuma transação manual registrada neste mês"
                  : "Nenhuma transação encontrada com os filtros selecionados"}
              </div>
            ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Pagamento</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTransactions.map((t) => (
                      <TableRow key={t.id}>
                        <TableCell>{format(new Date(t.transaction_date), "dd/MM/yyyy")}</TableCell>
                        <TableCell>
                          <Badge variant={t.type === "income" ? "default" : "destructive"}>
                            {t.type === "income" ? "Entrada" : "Saída"}
                          </Badge>
                        </TableCell>
                        <TableCell>{t.description}</TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            {t.category ? (
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${categoryColors[t.category] || "bg-gray-500/10 text-gray-600"}`}>
                                {t.category}
                              </span>
                            ) : "-"}
                            {t.category === "Funcionário" && t.employees && (
                              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                                <User className="w-3 h-3" />
                                {t.employees.name}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {t.payment_method && paymentMethodIcons[t.payment_method]}
                            {t.payment_method ? paymentMethodLabels[t.payment_method] : "-"}
                          </div>
                        </TableCell>
                        <TableCell className={`text-right font-medium ${t.type === "income" ? "text-success" : "text-destructive"}`}>
                          {t.type === "income" ? "+" : "-"} R$ {Number(t.amount).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(t)}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive"
                              onClick={() => handleDelete(t.id)}
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
                {filteredTransactions.map((t) => (
                  <div key={t.id} className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant={t.type === "income" ? "default" : "destructive"}>
                          {t.type === "income" ? "Entrada" : "Saída"}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {format(new Date(t.transaction_date), "dd/MM/yyyy")}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(t)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive"
                          onClick={() => handleDelete(t.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <p className="font-medium">{t.description}</p>
                    <div className="flex flex-wrap gap-2">
                      {t.category && (
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${categoryColors[t.category] || "bg-gray-500/10 text-gray-600"}`}>
                          {t.category}
                        </span>
                      )}
                      {t.category === "Funcionário" && t.employees && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-muted text-muted-foreground">
                          <User className="w-3 h-3" />
                          {t.employees.name}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        {t.payment_method ? paymentMethodLabels[t.payment_method] : "-"}
                      </span>
                      <span className={`font-bold ${t.type === "income" ? "text-success" : "text-destructive"}`}>
                        {t.type === "income" ? "+" : "-"} R$ {Number(t.amount).toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          );
          })()}
        </CardContent>
      </Card>
    </div>
  );
};

export default FinanceiroPage;