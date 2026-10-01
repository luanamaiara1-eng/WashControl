import { 
  CalendarX, 
  AlertTriangle, 
  Eye, 
  FileSpreadsheet, 
  UserX, 
  TrendingDown 
} from "lucide-react";

const painPoints = [
  {
    icon: CalendarX,
    title: "Agenda desorganizada",
    description: "Horários perdidos, clientes esperando e confusão no atendimento.",
  },
  {
    icon: TrendingDown,
    title: "Falta de controle financeiro",
    description: "Não sabe quanto entrou, quanto saiu ou qual é o lucro real.",
  },
  {
    icon: Eye,
    title: "Funcionário vendo dados que não deveria",
    description: "Valores, comissões e informações sigilosas expostas.",
  },
  {
    icon: FileSpreadsheet,
    title: "Dependência de planilhas",
    description: "Usando papel, WhatsApp e Excel para gerenciar o negócio.",
  },
  {
    icon: UserX,
    title: "Falta de histórico de clientes",
    description: "Não sabe a frequência, preferências ou como fidelizar.",
  },
  {
    icon: AlertTriangle,
    title: "Improviso constante",
    description: "Cada dia é uma surpresa, sem previsibilidade ou controle.",
  },
];

export const PainPointsSection = () => {
  return (
    <section className="py-20 bg-destructive/5 relative overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12 animate-slide-up">
            <span className="inline-block px-4 py-1.5 rounded-full bg-destructive/10 text-destructive text-sm font-medium mb-4">
              O problema
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Reconhece essa realidade?
            </h2>
            <p className="text-lg text-muted-foreground">
              Milhares de donos de lava-rápido e estética automotiva enfrentam isso todos os dias.
            </p>
          </div>

          {/* Pain Points Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {painPoints.map((point, index) => (
              <div
                key={point.title}
                className="p-6 rounded-xl bg-card border border-destructive/20 animate-slide-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center mb-4">
                  <point.icon className="w-6 h-6 text-destructive" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {point.title}
                </h3>
                <p className="text-muted-foreground text-sm">
                  {point.description}
                </p>
              </div>
            ))}
          </div>

          {/* Impact Statement */}
          <div className="text-center animate-slide-up">
            <div className="inline-block px-8 py-6 rounded-2xl bg-card border-2 border-destructive/30">
              <p className="text-2xl md:text-3xl font-bold text-foreground">
                O problema <span className="text-destructive">não é falta de serviço</span>.
              </p>
              <p className="text-2xl md:text-3xl font-bold text-foreground">
                É <span className="text-gradient">falta de controle</span>.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
