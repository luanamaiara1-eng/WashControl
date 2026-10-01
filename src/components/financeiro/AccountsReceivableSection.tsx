import { useState, useMemo } from "react";
import {
  useAccountsReceivable,
  useCreateReceivable,
  useMarkAsReceived,
  useDeleteReceivable,
  AccountReceivable,
} from "@/hooks/useAccountsReceivable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CurrencyInput, parseCurrencyToNumber } from "@/components/ui/currency-input";
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Plus,
  Trash2,
  Clock,
  Check,
  Receipt,
  ChevronDown,
  ChevronRight,
  User,
  ShoppingBag,
} from "lucide-react";
import { format } from "date-fns";

interface GroupedReceivable {
  clientName: string;
  items: AccountReceivable[];
  total: number;
}

export const AccountsReceivableSection = () => {
  const [receivableDialogOpen, setReceivableDialogOpen] = useState(false);
  const [addItemDialogOpen, setAddItemDialogOpen] = useState(false);
  const [receivePaymentDialogOpen, setReceivePaymentDialogOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<string>("");
  const [selectedReceivable, setSelectedReceivable] = useState<{
    id: string;
    client_name: string;
    amount: number;
  } | null>(null);
  const [receivePaymentMethod, setReceivePaymentMethod] = useState("");
  const [expandedClients, setExpandedClients] = useState<Set<string>>(new Set());

  const [receivableFormData, setReceivableFormData] = useState({
    client_name: "",
    amount: "",
    description: "",
    due_date: "",
  });

  const [itemFormData, setItemFormData] = useState({
    amount: "",
    description: "",
  });

  const { data: accountsReceivable = [], isLoading } = useAccountsReceivable();
  const createReceivable = useCreateReceivable();
  const markAsReceived = useMarkAsReceived();
  const deleteReceivable = useDeleteReceivable();

  // Group receivables by client name
  const groupedReceivables = useMemo(() => {
    const groups: Record<string, GroupedReceivable> = {};
    
    accountsReceivable.forEach((receivable) => {
      const clientName = receivable.client_name;
      if (!groups[clientName]) {
        groups[clientName] = {
          clientName,
          items: [],
          total: 0,
        };
      }
      groups[clientName].items.push(receivable);
      groups[clientName].total += Number(receivable.amount);
    });

    return Object.values(groups).sort((a, b) => b.total - a.total);
  }, [accountsReceivable]);

  // Get unique client names for dropdown
  const uniqueClientNames = useMemo(() => {
    return [...new Set(accountsReceivable.map((r) => r.client_name))].sort();
  }, [accountsReceivable]);

  const totalReceivables = accountsReceivable.reduce(
    (acc, r) => acc + Number(r.amount),
    0
  );

  const handleCreateReceivable = async (e: React.FormEvent) => {
    e.preventDefault();
    await createReceivable.mutateAsync({
      client_name: receivableFormData.client_name,
      amount: parseCurrencyToNumber(receivableFormData.amount),
      description: receivableFormData.description || undefined,
      due_date: receivableFormData.due_date || undefined,
    });
    setReceivableFormData({
      client_name: "",
      amount: "",
      description: "",
      due_date: "",
    });
    setReceivableDialogOpen(false);
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    await createReceivable.mutateAsync({
      client_name: selectedClient,
      amount: parseCurrencyToNumber(itemFormData.amount),
      description: itemFormData.description || undefined,
    });
    setItemFormData({ amount: "", description: "" });
    setAddItemDialogOpen(false);
  };

  const handleMarkAsReceived = async () => {
    if (!selectedReceivable || !receivePaymentMethod) return;
    await markAsReceived.mutateAsync({
      id: selectedReceivable.id,
      payment_method: receivePaymentMethod,
    });
    setReceivePaymentDialogOpen(false);
    setSelectedReceivable(null);
    setReceivePaymentMethod("");
  };

  const handleDeleteReceivable = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir este item?")) {
      await deleteReceivable.mutateAsync(id);
    }
  };

  const openReceivePaymentDialog = (receivable: {
    id: string;
    client_name: string;
    amount: number;
  }) => {
    setSelectedReceivable(receivable);
    setReceivePaymentMethod("");
    setReceivePaymentDialogOpen(true);
  };

  const openAddItemDialog = (clientName: string) => {
    setSelectedClient(clientName);
    setItemFormData({ amount: "", description: "" });
    setAddItemDialogOpen(true);
  };

  const toggleClient = (clientName: string) => {
    const newExpanded = new Set(expandedClients);
    if (newExpanded.has(clientName)) {
      newExpanded.delete(clientName);
    } else {
      newExpanded.add(clientName);
    }
    setExpandedClients(newExpanded);
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-primary" />
            <CardTitle className="text-base">Vendas Fiadas / Contas a Receber</CardTitle>
            {totalReceivables > 0 && (
              <Badge variant="secondary" className="ml-2">
                R$ {totalReceivables.toFixed(2)}
              </Badge>
            )}
          </div>
          <Dialog open={receivableDialogOpen} onOpenChange={setReceivableDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline">
                <Plus className="w-4 h-4 mr-1" />
                Novo Fiado
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nova Venda Fiada</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateReceivable} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="client_name">Nome do Cliente *</Label>
                  <Input
                    id="client_name"
                    value={receivableFormData.client_name}
                    onChange={(e) =>
                      setReceivableFormData({
                        ...receivableFormData,
                        client_name: e.target.value,
                      })
                    }
                    placeholder="Nome do cliente"
                    list="client-suggestions"
                    required
                  />
                  <datalist id="client-suggestions">
                    {uniqueClientNames.map((name) => (
                      <option key={name} value={name} />
                    ))}
                  </datalist>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="receivable_description">
                    Serviço/Produto *
                  </Label>
                  <Input
                    id="receivable_description"
                    value={receivableFormData.description}
                    onChange={(e) =>
                      setReceivableFormData({
                        ...receivableFormData,
                        description: e.target.value,
                      })
                    }
                    placeholder="Ex: Lavagem completa, Troca de óleo..."
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="receivable_amount">Valor *</Label>
                    <CurrencyInput
                      id="receivable_amount"
                      value={receivableFormData.amount}
                      onChange={(value) =>
                        setReceivableFormData({
                          ...receivableFormData,
                          amount: value,
                        })
                      }
                      placeholder="0,00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="due_date">Vencimento</Label>
                    <Input
                      id="due_date"
                      type="date"
                      value={receivableFormData.due_date}
                      onChange={(e) =>
                        setReceivableFormData({
                          ...receivableFormData,
                          due_date: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setReceivableDialogOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={
                      !receivableFormData.client_name ||
                      !receivableFormData.amount ||
                      !receivableFormData.description ||
                      createReceivable.isPending
                    }
                  >
                    Cadastrar
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
            </div>
          ) : groupedReceivables.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              Nenhuma venda fiada pendente
            </div>
          ) : (
            <div className="divide-y divide-border">
              {groupedReceivables.map((group) => (
                <Collapsible
                  key={group.clientName}
                  open={expandedClients.has(group.clientName)}
                  onOpenChange={() => toggleClient(group.clientName)}
                >
                  <CollapsibleTrigger asChild>
                    <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-3">
                        {expandedClients.has(group.clientName) ? (
                          <ChevronDown className="w-4 h-4 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        )}
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-semibold">{group.clientName}</p>
                          <p className="text-xs text-muted-foreground">
                            {group.items.length}{" "}
                            {group.items.length === 1 ? "item" : "itens"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-lg text-destructive">
                          R$ {group.total.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="px-4 pb-4 pt-0">
                      <div className="bg-muted/30 rounded-lg overflow-hidden">
                        {/* Items list */}
                        <div className="divide-y divide-border">
                          {group.items.map((item) => (
                            <div
                              key={item.id}
                              className="flex items-center justify-between p-3"
                            >
                              <div className="flex items-center gap-3">
                                <ShoppingBag className="w-4 h-4 text-muted-foreground" />
                                <div>
                                  <p className="text-sm font-medium">
                                    {item.description || "Sem descrição"}
                                  </p>
                                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <span>
                                      {format(
                                        new Date(item.created_at),
                                        "dd/MM/yyyy"
                                      )}
                                    </span>
                                    {item.due_date && (
                                      <>
                                        <span>•</span>
                                        <span
                                          className={
                                            new Date(item.due_date) < new Date()
                                              ? "text-destructive font-medium"
                                              : ""
                                          }
                                        >
                                          <Clock className="w-3 h-3 inline mr-1" />
                                          Venc:{" "}
                                          {format(
                                            new Date(item.due_date),
                                            "dd/MM"
                                          )}
                                        </span>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-success">
                                  R$ {Number(item.amount).toFixed(2)}
                                </span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    openReceivePaymentDialog({
                                      id: item.id,
                                      client_name: item.client_name,
                                      amount: Number(item.amount),
                                    })
                                  }
                                >
                                  <Check className="w-4 h-4 text-success" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-destructive h-8 w-8"
                                  onClick={() => handleDeleteReceivable(item.id)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                        {/* Add more items button */}
                        <div className="p-3 border-t border-border bg-muted/50">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full"
                            onClick={() => openAddItemDialog(group.clientName)}
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Adicionar serviço para {group.clientName}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Item Dialog */}
      <Dialog open={addItemDialogOpen} onOpenChange={setAddItemDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Serviço para {selectedClient}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddItem} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="item_description">Serviço/Produto *</Label>
              <Input
                id="item_description"
                value={itemFormData.description}
                onChange={(e) =>
                  setItemFormData({
                    ...itemFormData,
                    description: e.target.value,
                  })
                }
                placeholder="Ex: Lavagem completa, Troca de óleo..."
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="item_amount">Valor *</Label>
              <CurrencyInput
                id="item_amount"
                value={itemFormData.amount}
                onChange={(value) =>
                  setItemFormData({ ...itemFormData, amount: value })
                }
                placeholder="0,00"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setAddItemDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={
                  !itemFormData.amount ||
                  !itemFormData.description ||
                  createReceivable.isPending
                }
              >
                Adicionar
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Receive Payment Dialog */}
      <Dialog
        open={receivePaymentDialogOpen}
        onOpenChange={setReceivePaymentDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Recebimento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedReceivable && (
              <div className="p-4 bg-muted rounded-lg space-y-2">
                <p className="font-medium">{selectedReceivable.client_name}</p>
                <p className="text-2xl font-bold text-success">
                  R$ {selectedReceivable.amount.toFixed(2)}
                </p>
              </div>
            )}
            <div className="space-y-2">
              <Label>Forma de Pagamento *</Label>
              <Select
                value={receivePaymentMethod}
                onValueChange={setReceivePaymentMethod}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a forma de pagamento" />
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
            <p className="text-sm text-muted-foreground">
              O valor será lançado automaticamente como entrada no financeiro.
            </p>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setReceivePaymentDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleMarkAsReceived}
                disabled={!receivePaymentMethod || markAsReceived.isPending}
              >
                Confirmar Recebimento
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
