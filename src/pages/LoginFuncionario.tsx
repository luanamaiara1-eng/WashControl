import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, KeyRound, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useEmployeeSession } from "@/hooks/useEmployeeSession";
import { toast } from "sonner";
import logo from "@/assets/logo.png";

const LoginFuncionario = () => {
  const navigate = useNavigate();
  const { isEmployeeLoggedIn, loading: sessionLoading, loginWithCode } = useEmployeeSession();
  const [accessCode, setAccessCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isEmployeeLoggedIn) {
      navigate("/funcionario");
    }
  }, [isEmployeeLoggedIn, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!accessCode.trim()) {
      toast.error("Digite o código de acesso");
      return;
    }

    setIsLoading(true);
    const result = await loginWithCode(accessCode.trim());
    setIsLoading(false);

    if (result.success) {
      toast.success("Login realizado com sucesso!");
      navigate("/funcionario");
    } else {
      toast.error(result.error || "Código inválido");
    }
  };

  if (sessionLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Left side - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>

          <div className="text-center">
            <div className="flex justify-center mb-6">
              <img src={logo} alt="Logo" className="h-16 w-auto" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">
              Acesso de Funcionário
            </h1>
            <p className="text-muted-foreground mt-2">
              Digite o código de acesso fornecido pelo seu empregador
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="accessCode">Código de Acesso</Label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="accessCode"
                  type="text"
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
                  placeholder="Ex: ABCD1234"
                  className="pl-12 text-center text-xl tracking-widest font-mono uppercase"
                  maxLength={8}
                  autoComplete="off"
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              variant="hero"
              disabled={isLoading || !accessCode.trim()}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Entrando...
                </>
              ) : (
                "Entrar"
              )}
            </Button>
          </form>

          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              É proprietário?{" "}
              <Button
                variant="link"
                className="p-0 h-auto"
                onClick={() => navigate("/login")}
              >
                Acesse aqui
              </Button>
            </p>
          </div>
        </div>
      </div>

      {/* Right side - Visual */}
      <div className="hidden lg:flex flex-1 gradient-primary items-center justify-center p-12">
        <div className="text-center text-primary-foreground max-w-md">
          <KeyRound className="w-24 h-24 mx-auto mb-8 opacity-80" />
          <h2 className="text-3xl font-bold mb-4">
            Área do Funcionário
          </h2>
          <p className="text-lg opacity-90">
            Acesse a agenda, registre entrada e saída de veículos e atualize o status dos serviços.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginFuncionario;
