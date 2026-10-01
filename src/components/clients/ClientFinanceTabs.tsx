import { useState } from "react";
import { useClientDebts, useCreateClientDebt, useMarkClientDebtAsReceived, useDeleteClientDebt, ClientDebt } from "@/hooks/useClientDebt";
import { useClientPackages, useCreateClientPackage, useUsePackageCredit, useDeleteClientPackage, ClientPackage } from "@/hooks/useClientPackages";
import { useServices } from "@/hooks/useServices";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { CurrencyInput, parseCurrencyToNumber, formatNumberToCurrency } from "@/components/ui/currency-input";
import { Plus, Trash2, DollarSign, Package, Calendar, CheckCircle, AlertCircle, MinusCircle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ClientFinanceTabsProps {
  clientId: string;
  clientName: string;
}

const PAYMENT_METHODS = [
  { value: "cash", label: "Dinheiro" },
  { value: "pix", label: "PIX" },
  { value: "credit_card", label: "Cartão de Crédito" },
  { value: "debit_card", label: "Cartão de Débito" },
];

export const ClientFinanceTabs = ({ clientId, clientName }: ClientFinanceTabsProps) => {
  const { data: debts = [], isLoading: debtsLoading } = useClientDebts(clientId);
  const { data: packages = [], isLoading: packagesLoading } = useClientPackages(clientId);
  const { data: services = [] } = useServices();
  
  const createDebt = useCreateClientDebt();
  const markDebtAsReceived = useMarkClientDebtAsReceived();
  const deleteDebt = useDeleteClientDebt();
  const createPackage = useCreateClientPackage();
  const useCredit = useUsePackageCredit();
  const deletePackage = useDeleteClientPackage();

  const [showDebtForm, setShowDebtForm] = useState(false);
  const [debtForm, setDebtForm] = useState({ amount: 0, description: "", due_date: "" });
  const [showPackageForm, setShowPackageForm] = useState(false);
  const [packageForm, setPackageForm] = useState({ package_name: "", service_id: "", total_credits: 1, price_paid: 0, expires_at: "", notes: "" });
  const [receiveDialog, setReceiveDialog] = useState<{ open: boolean; debt: ClientDebt | null }>({ open: false, debt: null });
  const [receivePaymentMethod, setReceivePaymentMethod] = useState("cash");
  const [useCreditDialog, setUseCreditDialog] = useState<{ open: boolean; pkg: ClientPackage | null }>({ open: false, pkg: null });
  const [useCreditNotes, setUseCreditNotes] = useState("");
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; type: "debt" | "package"; id: string } | null>(null);

  const totalDebt = debts.reduce((sum, d) => sum + Number(d.amount), 0);
  const totalCredits = packages.filter(p => p.is_active).reduce((sum, p) => sum + (p.total_credits - p.used_credits), 0);

  const handleCreateDebt = async () => {
    await createDebt.mutateAsync({ client_id: clientId, client_name: clientName, amount: debtForm.amount, description: debtForm.description || undefined, due_date: debtForm.due_date || undefined });
    setDebtForm({ amount: 0, description: "", due_date: "" });
    setShowDebtForm(false);
  };

  const handleCreatePackage = async () => {
    await createPackage.mutateAsync({ client_id: clientId, package_name: packageForm.package_name, service_id: packageForm.service_id || null, total_credits: packageForm.total_credits, price_paid: packageForm.price_paid, expires_at: packageForm.expires_at || null, notes: packageForm.notes || null });
    setPackageForm({ package_name: "", service_id: "", total_credits: 1, price_paid: 0, expires_at: "", notes: "" });
    setShowPackageForm(false);
  };

  const handleMarkAsReceived = async () => {
    if (!receiveDialog.debt) return;
    await markDebtAsReceived.mutateAsync({ id: receiveDialog.debt.id, clientId, paymentMethod: receivePaymentMethod, amount: Number(receiveDialog.debt.amount), description: `Pagamento fiado: ${clientName}` });
    setReceiveDialog({ open: false, debt: null });
  };

  const handleUseCredit = async () => {
    if (!useCreditDialog.pkg) return;
    await useCredit.mutateAsync({ packageId: useCreditDialog.pkg.id, notes: useCreditNotes || undefined });
    setUseCreditDialog({ open: false, pkg: null });
    setUseCreditNotes("");
  };

  const handleDelete = async () => {
    if (!deleteDialog) return;
    if (deleteDialog.type === "debt") await deleteDebt.mutateAsync({ id: deleteDialog.id, clientId });
    else await deletePackage.mutateAsync({ id: deleteDialog.id, clientId });
    setDeleteDialog(null);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Card className={totalDebt > 0 ? "border-destructive/50" : ""}>
          <CardContent className="p-3 text-center">
            <AlertCircle className={`w-5 h-5 mx-auto mb-1 ${totalDebt > 0 ? "text-destructive" : "text-muted-foreground"}`} />
            <p className={`text-lg font-bold ${totalDebt > 0 ? "text-destructive" : ""}`}>R$ {totalDebt.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">Em Débito</p>
          </CardContent>
        </Card>
        <Card className={totalCredits > 0 ? "border-primary/50" : ""}>
          <CardContent className="p-3 text-center">
            <Package className={`w-5 h-5 mx-auto mb-1 ${totalCredits > 0 ? "text-primary" : "text-muted-foreground"}`} />
            <p className={`text-lg font-bold ${totalCredits > 0 ? "text-primary" : ""}`}>{totalCredits}</p>
            <p className="text-xs text-muted-foreground">Créditos Disponíveis</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="debt" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="debt" className="flex items-center gap-1">
            <DollarSign className="w-4 h-4" /> Fiado {debts.length > 0 && <Badge variant="destructive" className="ml-1 h-5 px-1.5">{debts.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="packages" className="flex items-center gap-1">
            <Package className="w-4 h-4" /> Pacotes {packages.filter(p => p.is_active && p.used_credits < p.total_credits).length > 0 && <Badge variant="default" className="ml-1 h-5 px-1.5">{packages.filter(p => p.is_active && p.used_credits < p.total_credits).length}</Badge>}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="debt" className="space-y-3 mt-3">
          <Button variant="outline" size="sm" className="w-full" onClick={() => setShowDebtForm(true)}><Plus className="w-4 h-4 mr-2" />Adicionar Fiado</Button>
          {debtsLoading ? <div className="text-center py-4"><div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto" /></div> : debts.length === 0 ? <p className="text-sm text-muted-foreground text-center py-4">Nenhum fiado pendente</p> : (
            <div className="space-y-2">
              {debts.map((debt) => (
                <Card key={debt.id} className="border-destructive/30">
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-semibold text-destructive">R$ {Number(debt.amount).toFixed(2)}</p>
                        {debt.description && <p className="text-sm text-muted-foreground">{debt.description}</p>}
                        {debt.due_date && <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1"><Calendar className="w-3 h-3" />Venc: {format(new Date(debt.due_date + "T12:00:00"), "dd/MM/yyyy", { locale: ptBR })}</p>}
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-primary" onClick={() => setReceiveDialog({ open: true, debt })}><CheckCircle className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteDialog({ open: true, type: "debt", id: debt.id })}><Trash2 className="w-4 h-4" /></Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="packages" className="space-y-3 mt-3">
          <Button variant="outline" size="sm" className="w-full" onClick={() => setShowPackageForm(true)}><Plus className="w-4 h-4 mr-2" />Novo Pacote</Button>
          {packagesLoading ? <div className="text-center py-4"><div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto" /></div> : packages.length === 0 ? <p className="text-sm text-muted-foreground text-center py-4">Nenhum pacote cadastrado</p> : (
            <div className="space-y-2">
              {packages.map((pkg) => {
                const remaining = pkg.total_credits - pkg.used_credits;
                const progress = (pkg.used_credits / pkg.total_credits) * 100;
                const isExpired = pkg.expires_at && new Date(pkg.expires_at) < new Date();
                const isExhausted = remaining <= 0;
                return (
                  <Card key={pkg.id} className={isExpired || isExhausted ? "opacity-60" : "border-primary/30"}>
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold">{pkg.package_name}</p>
                            {isExpired && <Badge variant="destructive" className="text-xs">Expirado</Badge>}
                            {isExhausted && !isExpired && <Badge variant="secondary" className="text-xs">Esgotado</Badge>}
                          </div>
                          {pkg.services?.name && <p className="text-xs text-muted-foreground">{pkg.services.name}</p>}
                        </div>
                        <div className="flex gap-1">
                          {!isExpired && !isExhausted && <Button variant="ghost" size="icon" className="h-8 w-8 text-primary" onClick={() => setUseCreditDialog({ open: true, pkg })}><MinusCircle className="w-4 h-4" /></Button>}
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteDialog({ open: true, type: "package", id: pkg.id })}><Trash2 className="w-4 h-4" /></Button>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm"><span className="text-muted-foreground">{pkg.used_credits} de {pkg.total_credits} usados</span><span className="font-medium text-primary">{remaining} restantes</span></div>
                        <Progress value={progress} className="h-2" />
                      </div>
                      <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                        <span>Pago: R$ {Number(pkg.price_paid).toFixed(2)}</span>
                        {pkg.expires_at && <span>Expira: {format(new Date(pkg.expires_at + "T12:00:00"), "dd/MM/yyyy", { locale: ptBR })}</span>}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={showDebtForm} onOpenChange={setShowDebtForm}>
        <DialogContent>
          <DialogHeader><DialogTitle>Adicionar Fiado</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>Valor *</Label><CurrencyInput value={formatNumberToCurrency(debtForm.amount)} onChange={(v) => setDebtForm({ ...debtForm, amount: parseCurrencyToNumber(v) })} /></div>
            <div className="space-y-2"><Label>Descrição</Label><Input value={debtForm.description} onChange={(e) => setDebtForm({ ...debtForm, description: e.target.value })} placeholder="Ex: Lavagem completa" /></div>
            <div className="space-y-2"><Label>Data de Vencimento</Label><Input type="date" value={debtForm.due_date} onChange={(e) => setDebtForm({ ...debtForm, due_date: e.target.value })} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setShowDebtForm(false)}>Cancelar</Button><Button onClick={handleCreateDebt} disabled={!debtForm.amount || createDebt.isPending}>Adicionar</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showPackageForm} onOpenChange={setShowPackageForm}>
        <DialogContent>
          <DialogHeader><DialogTitle>Novo Pacote Pré-pago</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>Nome do Pacote *</Label><Input value={packageForm.package_name} onChange={(e) => setPackageForm({ ...packageForm, package_name: e.target.value })} placeholder="Ex: 10 Lavagens Completas" /></div>
            <div className="space-y-2"><Label>Serviço Vinculado</Label><Select value={packageForm.service_id} onValueChange={(v) => setPackageForm({ ...packageForm, service_id: v })}><SelectTrigger><SelectValue placeholder="Selecione (opcional)" /></SelectTrigger><SelectContent>{services.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent></Select></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Quantidade *</Label><Input type="number" min="1" value={packageForm.total_credits} onChange={(e) => setPackageForm({ ...packageForm, total_credits: parseInt(e.target.value) || 1 })} /></div>
              <div className="space-y-2"><Label>Valor Pago *</Label><CurrencyInput value={formatNumberToCurrency(packageForm.price_paid)} onChange={(v) => setPackageForm({ ...packageForm, price_paid: parseCurrencyToNumber(v) })} /></div>
            </div>
            <div className="space-y-2"><Label>Data de Validade</Label><Input type="date" value={packageForm.expires_at} onChange={(e) => setPackageForm({ ...packageForm, expires_at: e.target.value })} /></div>
            <div className="space-y-2"><Label>Observações</Label><Textarea value={packageForm.notes} onChange={(e) => setPackageForm({ ...packageForm, notes: e.target.value })} rows={2} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setShowPackageForm(false)}>Cancelar</Button><Button onClick={handleCreatePackage} disabled={!packageForm.package_name || !packageForm.total_credits || !packageForm.price_paid || createPackage.isPending}>Criar Pacote</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={receiveDialog.open} onOpenChange={(open) => !open && setReceiveDialog({ open: false, debt: null })}>
        <DialogContent>
          <DialogHeader><DialogTitle>Receber Pagamento</DialogTitle></DialogHeader>
          {receiveDialog.debt && (
            <div className="space-y-4">
              <Card><CardContent className="p-4"><p className="text-lg font-bold text-primary">R$ {Number(receiveDialog.debt.amount).toFixed(2)}</p>{receiveDialog.debt.description && <p className="text-sm text-muted-foreground">{receiveDialog.debt.description}</p>}</CardContent></Card>
              <div className="space-y-2"><Label>Forma de Pagamento</Label><Select value={receivePaymentMethod} onValueChange={setReceivePaymentMethod}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{PAYMENT_METHODS.map((pm) => <SelectItem key={pm.value} value={pm.value}>{pm.label}</SelectItem>)}</SelectContent></Select></div>
            </div>
          )}
          <DialogFooter><Button variant="outline" onClick={() => setReceiveDialog({ open: false, debt: null })}>Cancelar</Button><Button onClick={handleMarkAsReceived} disabled={markDebtAsReceived.isPending}><CheckCircle className="w-4 h-4 mr-2" />Confirmar</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={useCreditDialog.open} onOpenChange={(open) => !open && setUseCreditDialog({ open: false, pkg: null })}>
        <DialogContent>
          <DialogHeader><DialogTitle>Usar Crédito do Pacote</DialogTitle></DialogHeader>
          {useCreditDialog.pkg && (
            <div className="space-y-4">
              <Card><CardContent className="p-4"><p className="font-semibold">{useCreditDialog.pkg.package_name}</p><p className="text-sm text-muted-foreground">{useCreditDialog.pkg.total_credits - useCreditDialog.pkg.used_credits} créditos restantes</p></CardContent></Card>
              <div className="space-y-2"><Label>Observação (opcional)</Label><Input value={useCreditNotes} onChange={(e) => setUseCreditNotes(e.target.value)} placeholder="Ex: Lavagem do Civic" /></div>
            </div>
          )}
          <DialogFooter><Button variant="outline" onClick={() => setUseCreditDialog({ open: false, pkg: null })}>Cancelar</Button><Button onClick={handleUseCredit} disabled={useCredit.isPending}><MinusCircle className="w-4 h-4 mr-2" />Usar 1 Crédito</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialog?.open} onOpenChange={(open) => !open && setDeleteDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle><AlertDialogDescription>{deleteDialog?.type === "debt" ? "Tem certeza que deseja excluir este fiado?" : "Tem certeza que deseja excluir este pacote?"}</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">Excluir</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
