import { 
  Calendar, 
  Users, 
  DollarSign, 
  BarChart3, 
  Car, 
  Percent,
  UserCheck,
  FileText
} from "lucide-react";

const features = [
  {
    icon: Calendar,
    title: "Agendamento Inteligente",
    highlights: [
      "Manual ou automático",
      "Link público para clientes",
      "Bloqueio de horários",
    ],
  },
  {
    icon: Car,
    title: "Controle de Veículos",
    highlights: [
      "Check-in e check-out",
      "Histórico por veículo",
      "Registro completo",
    ],
  },
  {
    icon: Users,
    title: "Gestão de Equipe",
    highlights: [
      "Login individual",
      "Permissões configuráveis",
      "Funcionário não vê financeiro",
    ],
  },
  {
    icon: Percent,
    title: "Comissões Personalizadas",
    highlights: [
      "Comissão por funcionário",
      "Cálculo automático",
      "Transparência total",
    ],
  },
  {
    icon: DollarSign,
    title: "Controle Financeiro Completo",
    highlights: [
      "Entradas e saídas",
      "Gastos operacionais",
      "Lucro real",
    ],
  },
  {
    icon: BarChart3,
    title: "Relatórios Completos",
    highlights: [
      "Diário, semanal e mensal",
      "Por funcionário e serviço",
      "Exportação em PDF",
    ],
  },
  {
    icon: UserCheck,
    title: "Histórico de Clientes",
    highlights: [
      "Frequência de visitas",
      "Preferências salvas",
      "Fidelização automática",
    ],
  },
  {
    icon: FileText,
    title: "Nota em PDF Personalizada",
    highlights: [
      "Logo e cores da empresa",
      "Profissionalismo na entrega",
      "Diferencial competitivo",
    ],
    featured: true,
  },
];

export const FeaturesSection = () => {
  return (
    <section id="recursos" className="py-24 bg-muted/50 relative">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16 animate-slide-up">
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            Funcionalidades
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Tudo que seu lava-rápido precisa para crescer
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Funcionalidades pensadas para resolver os problemas reais do dia a dia 
            de quem trabalha com estética automotiva.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className={`group p-6 rounded-2xl bg-card border transition-all duration-300 animate-slide-up ${
                feature.featured 
                  ? "border-primary shadow-lg shadow-primary/10" 
                  : "border-border hover:border-primary/30 hover:shadow-lg"
              }`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {feature.featured && (
                <div className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-3">
                  Diferencial
                </div>
              )}
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-shadow duration-300 ${
                feature.featured 
                  ? "gradient-primary shadow-glow" 
                  : "gradient-primary group-hover:shadow-glow"
              }`}>
                <feature.icon className="w-6 h-6 text-primary-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-3">
                {feature.title}
              </h3>
              <ul className="space-y-2">
                {feature.highlights.map((highlight, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                    {highlight}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
