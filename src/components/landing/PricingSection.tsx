import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const plans = [
  {
    name: "Básico",
    price: "49",
    description: "Para quem está começando",
    features: [
      "1 funcionário",
      "Agendamentos ilimitados",
      "Controle de veículos",
      "Relatórios básicos",
      "Suporte por email",
    ],
    popular: false,
  },
  {
    name: "Profissional",
    price: "99",
    description: "Para lava-rápidos em crescimento",
    features: [
      "Até 5 funcionários",
      "Tudo do Básico",
      "Controle financeiro completo",
      "Relatórios avançados",
      "Comissões automáticas",
      "Nota em PDF personalizada",
      "Suporte prioritário",
    ],
    popular: true,
  },
  {
    name: "Premium",
    price: "199",
    description: "Para grandes operações",
    features: [
      "Funcionários ilimitados",
      "Tudo do Profissional",
      "Multi-unidades",
      "API de integração",
      "Dashboard personalizado",
      "Suporte 24/7",
      "Treinamento incluso",
    ],
    popular: false,
  },
];

export const PricingSection = () => {
  return (
    <section id="precos" className="py-24 bg-background relative">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16 animate-slide-up">
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            Preços
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Planos que cabem no seu bolso
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Comece grátis por 7 dias. Sem compromisso, sem cartão de crédito.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((plan, index) => (
            <div
              key={plan.name}
              className={`relative p-8 rounded-2xl animate-slide-up ${
                plan.popular
                  ? "bg-card border-2 border-primary shadow-xl scale-105"
                  : "bg-card border border-border"
              }`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="px-4 py-1 rounded-full gradient-primary text-primary-foreground text-sm font-medium shadow-lg">
                    Mais Popular
                  </span>
                </div>
              )}

              <div className="text-center mb-8">
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  {plan.name}
                </h3>
                <p className="text-muted-foreground text-sm mb-4">
                  {plan.description}
                </p>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-muted-foreground">R$</span>
                  <span className="text-5xl font-bold text-foreground">
                    {plan.price}
                  </span>
                  <span className="text-muted-foreground">/mês</span>
                </div>
              </div>

              <ul className="space-y-4 mb-8">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-success/10 flex items-center justify-center flex-shrink-0">
                      <Check className="w-3 h-3 text-success" />
                    </div>
                    <span className="text-sm text-foreground">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                variant={plan.popular ? "hero" : "outline"}
                size="lg"
                className="w-full"
                asChild
              >
                <Link to="/registro">
                  Testar grátis por 7 dias
                </Link>
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
