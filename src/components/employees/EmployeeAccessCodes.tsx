import { useState } from "react";
import { 
  KeyRound, 
  Copy, 
  RefreshCw, 
  Trash2, 
  ToggleLeft, 
  ToggleRight,
  Loader2,
  Check,
  Plus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  useEmployeeAccounts,
  useCreateEmployeeAccount,
  useRegenerateAccessCode,
  useToggleEmployeeAccount,
  useDeleteEmployeeAccount,
} from "@/hooks/useEmployeeAccounts";
import { useEmployees } from "@/hooks/useEmployees";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface EmployeeAccessCodesProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const EmployeeAccessCodes = ({ open, onOpenChange }: EmployeeAccessCodesProps) => {
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const { data: accounts = [], isLoading: accountsLoading } = useEmployeeAccounts();
  const { data: employees = [] } = useEmployees();
  const createAccount = useCreateEmployeeAccount();
  const regenerateCode = useRegenerateAccessCode();
  const toggleAccount = useToggleEmployeeAccount();
  const deleteAccount = useDeleteEmployeeAccount();

  // Employees that don't have access codes yet
  const employeesWithoutAccess = employees.filter(
    (emp) => emp.is_active && !accounts.find((acc) => acc.employee_id === emp.id)
  );

  const handleCreateAccess = async () => {
    if (!selectedEmployeeId) {
      toast.error("Selecione um funcionário");
      return;
    }
    await createAccount.mutateAsync(selectedEmployeeId);
    setSelectedEmployeeId("");
  };

  const handleCopyCode = async (code: string, accountId: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedId(accountId);
      toast.success("Código copiado!");
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      toast.error("Erro ao copiar código");
    }
  };

  const handleDeleteAccount = async (accountId: string) => {
    if (window.confirm("Tem certeza que deseja remover este código de acesso?")) {
      await deleteAccount.mutateAsync(accountId);
    }
  };

  const getEmployeeName = (employeeId: string | null) => {
    if (!employeeId) return "Sem funcionário vinculado";
    const employee = employees.find((e) => e.id === employeeId);
    return employee?.name || "Funcionário removido";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound className="w-5 h-5" />
            Códigos de Acesso
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Create new access */}
          {employeesWithoutAccess.length > 0 && (
            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <Label>Criar código para funcionário</Label>
              <div className="flex gap-2">
                <Select value={selectedEmployeeId} onValueChange={setSelectedEmployeeId}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Selecione um funcionário" />
                  </SelectTrigger>
                  <SelectContent>
                    {employeesWithoutAccess.map((emp) => (
                      <SelectItem key={emp.id} value={emp.id}>
                        {emp.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="hero"
                  onClick={handleCreateAccess}
                  disabled={!selectedEmployeeId || createAccount.isPending}
                >
                  {createAccount.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Existing access codes */}
          <div className="space-y-3">
            <Label>Códigos ativos</Label>
            
            {accountsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : accounts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <KeyRound className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Nenhum código de acesso criado</p>
              </div>
            ) : (
              <div className="space-y-2">
                {accounts.map((account) => (
                  <div
                    key={account.id}
                    className={cn(
                      "bg-card border border-border rounded-lg p-4",
                      !account.is_active && "opacity-60"
                    )}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-foreground">
                        {getEmployeeName(account.employee_id)}
                      </span>
                      <span
                        className={cn(
                          "text-xs px-2 py-1 rounded-full",
                          account.is_active
                            ? "bg-success/10 text-success"
                            : "bg-muted text-muted-foreground"
                        )}
                      >
                        {account.is_active ? "Ativo" : "Inativo"}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mb-3">
                      <code className="flex-1 bg-muted px-3 py-2 rounded font-mono text-lg tracking-widest text-center">
                        {account.access_code}
                      </code>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleCopyCode(account.access_code, account.id)}
                      >
                        {copiedId === account.id ? (
                          <Check className="w-4 h-4 text-success" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </Button>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => regenerateCode.mutateAsync(account.id)}
                        disabled={regenerateCode.isPending}
                      >
                        <RefreshCw className="w-3 h-3 mr-1" />
                        Novo código
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          toggleAccount.mutateAsync({
                            accountId: account.id,
                            isActive: !account.is_active,
                          })
                        }
                        disabled={toggleAccount.isPending}
                      >
                        {account.is_active ? (
                          <>
                            <ToggleLeft className="w-3 h-3 mr-1" />
                            Desativar
                          </>
                        ) : (
                          <>
                            <ToggleRight className="w-3 h-3 mr-1" />
                            Ativar
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDeleteAccount(account.id)}
                        disabled={deleteAccount.isPending}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Instructions */}
          <div className="bg-primary/5 border border-primary/10 rounded-lg p-4 text-sm text-muted-foreground">
            <p className="font-medium text-foreground mb-2">Como funciona?</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Compartilhe o código com seu funcionário</li>
              <li>Ele acessa pelo menu "Acesso Funcionário" na página inicial</li>
              <li>Com o código, ele pode ver a agenda e atualizar serviços</li>
              <li>Funcionários NÃO têm acesso ao financeiro</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EmployeeAccessCodes;
