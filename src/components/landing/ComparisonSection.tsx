import { Check, X } from "lucide-react";

const comparisons = [
  {
    feature: "Controle de acesso",
    spreadsheet: "Qualquer um acessa tudo",
    washcontrol: "Permissões individuais",
  },
  {
    feature: "Automação",
    spreadsheet: "Tudo manual",
    washcontrol: "Agendamento automático",
  },
  {
    feature: "Relatórios",
    spreadsheet: "Criar na mão",
    washcontrol: "Gerados automaticamente",
  },
  {
    feature: "Segurança",
    spreadsheet: "Arquivo pode ser perdido",
    washcontrol: "Backup automático na nuvem",
  },
  {
    feature: "Escalabilidade",
    spreadsheet: "Fica confuso ao crescer",
    washcontrol: "Cresce com seu negócio",
  },
  {
    feature: "Profissionalismo",
    spreadsheet: "Imagem amadora",
    washcontrol: "Gestão profissional",
  },
];

export const ComparisonSection = () => {
  return (
    <section className="py-24 bg-background relative">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12 animate-slide-up">
            <span className="inline-block px-4 py-1.5 rounded-full bg-warning/10 text-warning text-sm font-medium mb-4">
              Comparativo
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Por que <span className="text-gradient">não é planilha</span>
            </h2>
            <p className="text-lg text-muted-foreground">
              Veja a diferença entre improvisar com planilhas e usar um sistema profissional.
            </p>
          </div>

          {/* Comparison Table */}
          <div className="rounded-2xl overflow-hidden border border-border animate-slide-up">
            {/* Header Row */}
            <div className="grid grid-cols-3 bg-muted">
              <div className="p-4 font-semibold text-foreground border-r border-border">
                Funcionalidade
              </div>
              <div className="p-4 text-center border-r border-border">
                <div className="flex items-center justify-center gap-2">
                  <X className="w-5 h-5 text-destructive" />
                  <span className="font-semibold text-destructive">Planilha</span>
                </div>
              </div>
              <div className="p-4 text-center">
                <div className="flex items-center justify-center gap-2">
                  <Check className="w-5 h-5 text-success" />
                  <span className="font-semibold text-gradient">WashControl</span>
                </div>
              </div>
            </div>

            {/* Comparison Rows */}
            {comparisons.map((item, index) => (
              <div 
                key={item.feature}
                className={`grid grid-cols-3 ${index % 2 === 0 ? 'bg-card' : 'bg-muted/30'}`}
              >
                <div className="p-4 font-medium text-foreground border-r border-border">
                  {item.feature}
                </div>
                <div className="p-4 text-center text-muted-foreground border-r border-border text-sm">
                  {item.spreadsheet}
                </div>
                <div className="p-4 text-center text-foreground text-sm font-medium">
                  {item.washcontrol}
                </div>
              </div>
            ))}
          </div>

          {/* Bottom CTA */}
          <div className="text-center mt-12 animate-slide-up">
            <p className="text-xl font-semibold text-foreground mb-2">
              Ainda usando planilhas?
            </p>
            <p className="text-muted-foreground">
              É hora de profissionalizar seu lava-rápido.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
