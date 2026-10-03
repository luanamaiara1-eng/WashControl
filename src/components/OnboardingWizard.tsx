import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useBusinessSettings } from "@/hooks/useConfiguracoes";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Building2, Wrench, Users, Car, Calendar, MessageCircle, Store, CheckCircle2, ArrowRight, PlayCircle } from "lucide-react";
import { toast } from "sonner";

type Step = {
  title: string;
  description: string;
  icon: typeof Building2;
  href: string;
  action: string;
};

const steps: Step[] = [
  { title: "Cadastre seu negócio", description: "Coloque nome, telefone, endereço, horário e logo para deixar o sistema com a cara da sua empresa.", icon: Building2, href: "/dashboard/configuracoes", action: "Configurar negócio" },
  { title: "Cadastre seus serviços", description: "Adicione lavagem, polimento, higienização, detalhamento e os serviços que você oferece.", icon: Wrench, href: "/dashboard/servicos", action: "Cadastrar serviços" },
  { title: "Cadastre funcionários", description: "Se sua equipe usa o sistema, cadastre os funcionários e organize os responsáveis pelos atendimentos.", icon: Users, href: "/dashboard/funcionarios", action: "Cadastrar equipe" },
  { title: "Cadastre clientes e veículos", description: "Mantenha histórico, contatos e veículos organizados para agilizar o próximo atendimento.", icon: Car, href: "/dashboard/clientes", action: "Cadastrar clientes" },
  { title: "Use a agenda", description: "Crie agendamentos, acompanhe o dia e mantenha os horários organizados.", icon: Calendar, href: "/dashboard/agendamentos", action: "Abrir agenda" },
  { title: "Conecte o WhatsApp", description: "Conecte seu número para usar comandos, lembretes e mensagens automáticas.", icon: MessageCircle, href: "/dashboard/configuracoes", action: "Configurar WhatsApp" },
  { title: "Ative sua Vitrine", description: "Mostre serviços e produtos online e receba pedidos pelo WhatsApp.", icon: Store, href: "/dashboard/loja", action: "Configurar Vitrine" },
];

export function OnboardingWizard({ forceOpen = false, onClose }: { forceOpen?: boolean; onClose?: () => void }) {
  const { user } = useAuth();
  const { data: settings, refetch } = useBusinessSettings();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (forceOpen) {
      setStep(0);
      setOpen(true);
      return;
    }
    if (settings && !settings.onboarding_completed) {
      setOpen(true);
    }
  }, [settings, forceOpen]);

  const close = () => {
    setOpen(false);
    onClose?.();
  };

  const complete = async () => {
    if (!user) return;
    const { error } = await supabase
      .from("business_settings")
      .update({ onboarding_completed: true } as any)
      .eq("user_id", user.id);
    if (error) {
      toast.error("Não foi possível salvar o progresso. Tente novamente.");
      return;
    }
    await refetch();
    close();
    toast.success("Pronto! Seu WashControl está configurado.");
  };

  const goToStep = () => {
    const current = steps[step];
    close();
    navigate(current.href);
  };

  const current = steps[step];
  const Icon = current.icon;
  const progress = ((step + 1) / steps.length) * 100;

  return (
    <Dialog open={open} onOpenChange={(value) => { if (!value) close(); else setOpen(true); }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Icon className="h-7 w-7" />
          </div>
          <DialogTitle className="text-center text-xl">Vamos configurar seu WashControl</DialogTitle>
          <DialogDescription className="text-center">
            Um passo a passo rápido para você começar a usar o sistema.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div>
            <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
              <span>Passo {step + 1} de {steps.length}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} />
          </div>

          <div className="rounded-2xl border bg-muted/30 p-5">
            <h3 className="text-lg font-semibold">{current.title}</h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{current.description}</p>
            <Button className="mt-4 w-full gap-2" variant="outline" onClick={goToStep}>
              {current.action}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="grid grid-cols-7 gap-1">
            {steps.map((item, index) => {
              const StepIcon = item.icon;
              return (
                <button
                  key={item.title}
                  type="button"
                  onClick={() => setStep(index)}
                  title={item.title}
                  className={`flex h-9 items-center justify-center rounded-lg transition-colors ${index === step ? "bg-primary text-primary-foreground" : index < step ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}
                >
                  {index < step ? <CheckCircle2 className="h-4 w-4" /> : <StepIcon className="h-4 w-4" />}
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-between gap-2">
            <Button variant="ghost" onClick={complete}>Pular por enquanto</Button>
            <div className="flex gap-2">
              {step > 0 && <Button variant="outline" onClick={() => setStep((value) => value - 1)}>Voltar</Button>}
              {step < steps.length - 1 ? (
                <Button onClick={() => setStep((value) => value + 1)} className="gap-2">Próximo <ArrowRight className="h-4 w-4" /></Button>
              ) : (
                <Button onClick={complete} className="gap-2"><CheckCircle2 className="h-4 w-4" />Tudo pronto!</Button>
              )}
            </div>
          </div>

          <button type="button" className="mx-auto flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground" onClick={() => { close(); navigate("/dashboard/ajuda"); }}>
            <PlayCircle className="h-4 w-4" />
            Quero ver os vídeos de treinamento
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
