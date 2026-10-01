import { Check, Smartphone, Calendar, Clock, Car, User, DollarSign, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const benefits = [
  "Sistema SaaS profissional",
  "Desenvolvido exclusivamente para lava-rápidos e estética automotiva",
  "Centraliza toda a operação em um só lugar",
  "Dono controla tudo, funcionário vê apenas o necessário",
  "Cliente agenda sozinho pelo link",
  "Funciona em qualquer dispositivo",
];

// Mock data para preview do dashboard
const mockAppointments = [
  { id: 1, client: "João Silva", vehicle: "Civic Preto", service: "Lavagem Completa", time: "09:00", status: "completed", price: "R$ 80" },
  { id: 2, client: "Maria Santos", vehicle: "Corolla Branco", service: "Polimento", time: "10:30", status: "in_progress", price: "R$ 250" },
  { id: 3, client: "Pedro Costa", vehicle: "HB20 Prata", service: "Lavagem Simples", time: "14:00", status: "scheduled", price: "R$ 45" },
  { id: 4, client: "Ana Oliveira", vehicle: "Onix Vermelho", service: "Higienização", time: "15:30", status: "scheduled", price: "R$ 180" },
];

const getStatusColor = (status: string) => {
  switch (status) {
    case "completed": return "bg-success/20 text-success border-success/30";
    case "in_progress": return "bg-warning/20 text-warning border-warning/30";
    case "scheduled": return "bg-primary/20 text-primary border-primary/30";
    default: return "bg-muted text-muted-foreground";
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case "completed": return "Concluído";
    case "in_progress": return "Em andamento";
    case "scheduled": return "Agendado";
    default: return status;
  }
};

export const SolutionSection = () => {
  return (
    <section className="py-24 bg-background relative">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div className="animate-slide-up">
            <span className="inline-block px-4 py-1.5 rounded-full bg-success/10 text-success text-sm font-medium mb-4">
              A solução
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
              Conheça o <span className="text-gradient">WashControl</span>
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Um aplicativo profissional feito especificamente para donos de lava-rápido, 
              lava-jato, estética automotiva e detalhamento que querem ter controle total 
              do seu negócio.
            </p>

            <div className="space-y-4 mb-8">
              {benefits.map((benefit, index) => (
                <div 
                  key={index} 
                  className="flex items-center gap-3 animate-slide-up"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="w-6 h-6 rounded-full bg-success/10 flex items-center justify-center flex-shrink-0">
                    <Check className="w-4 h-4 text-success" />
                  </div>
                  <span className="text-foreground">{benefit}</span>
                </div>
              ))}
            </div>

            <Button variant="hero" size="lg" asChild>
              <Link to="/registro">
                Testar grátis por 7 dias
              </Link>
            </Button>
          </div>

          {/* Dashboard Preview com Cartões Flutuantes */}
          <div className="relative animate-slide-up" style={{ animationDelay: "0.2s" }}>
            {/* Container principal do dashboard */}
            <div className="relative z-10 rounded-2xl overflow-hidden bg-card border border-border p-6">
              {/* Header do Dashboard */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold text-foreground">Agendamentos de Hoje</h3>
                  <p className="text-sm text-muted-foreground">Segunda, 30 de Dezembro</p>
                </div>
                <div className="flex gap-2">
                  <div className="px-3 py-1.5 rounded-lg bg-success/10 text-success text-sm font-medium">
                    4 serviços
                  </div>
                  <div className="px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-sm font-medium">
                    R$ 555
                  </div>
                </div>
              </div>

              {/* Cards de Agendamentos */}
              <div className="space-y-3">
                {mockAppointments.map((appointment, index) => (
                  <div 
                    key={appointment.id}
                    className="p-4 rounded-xl bg-muted/50 border border-border/50 hover:border-primary/30 transition-all duration-300 animate-slide-up"
                    style={{ animationDelay: `${0.3 + index * 0.1}s` }}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex gap-3">
                        <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center flex-shrink-0">
                          <Clock className="w-5 h-5 text-primary-foreground" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-foreground">{appointment.time}</span>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(appointment.status)}`}>
                              {getStatusLabel(appointment.status)}
                            </span>
                          </div>
                          <p className="text-sm text-foreground font-medium">{appointment.client}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                            <Car className="w-3 h-3" />
                            <span>{appointment.vehicle}</span>
                            <span className="text-border">•</span>
                            <span>{appointment.service}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-success">{appointment.price}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Mini Stats */}
              <div className="grid grid-cols-4 gap-2 mt-4 pt-4 border-t border-border">
                <div className="text-center p-2 rounded-lg bg-muted/30">
                  <Calendar className="w-4 h-4 mx-auto text-primary mb-1" />
                  <span className="text-xs text-muted-foreground">Agenda</span>
                </div>
                <div className="text-center p-2 rounded-lg bg-muted/30">
                  <User className="w-4 h-4 mx-auto text-primary mb-1" />
                  <span className="text-xs text-muted-foreground">Clientes</span>
                </div>
                <div className="text-center p-2 rounded-lg bg-muted/30">
                  <DollarSign className="w-4 h-4 mx-auto text-primary mb-1" />
                  <span className="text-xs text-muted-foreground">Finanças</span>
                </div>
                <div className="text-center p-2 rounded-lg bg-muted/30">
                  <CheckCircle2 className="w-4 h-4 mx-auto text-primary mb-1" />
                  <span className="text-xs text-muted-foreground">Relatórios</span>
                </div>
              </div>
            </div>

            {/* Cartões Flutuantes Decorativos */}
            <div className="absolute -top-4 -right-4 p-3 rounded-xl bg-success/90 text-success-foreground shadow-lg animate-float z-20">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span className="text-sm font-medium">+R$ 250</span>
              </div>
              <span className="text-xs opacity-80">Serviço concluído</span>
            </div>

            <div className="absolute -bottom-2 -left-4 p-3 rounded-xl bg-primary text-primary-foreground shadow-lg animate-float z-20" style={{ animationDelay: "0.5s" }}>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span className="text-sm font-medium">Novo agendamento</span>
              </div>
              <span className="text-xs opacity-80">15:30 - Polimento</span>
            </div>

            <div className="absolute top-1/2 -left-8 p-2 rounded-lg bg-warning/90 text-warning-foreground shadow-lg animate-float z-20" style={{ animationDelay: "1s" }}>
              <div className="flex items-center gap-1.5">
                <Clock className="w-3 h-3" />
                <span className="text-xs font-medium">Em andamento</span>
              </div>
            </div>

            {/* Decorative blurs */}
            <div className="absolute -top-4 -right-4 w-32 h-32 bg-primary/20 rounded-full blur-3xl" />
            <div className="absolute -bottom-4 -left-4 w-40 h-40 bg-success/20 rounded-full blur-3xl" />
          </div>
        </div>
      </div>
    </section>
  );
};
