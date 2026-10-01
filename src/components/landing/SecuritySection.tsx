import { Shield, Lock, Cloud, UserCheck } from "lucide-react";

const securityFeatures = [
  {
    icon: Lock,
    title: "Dados criptografados",
    description: "Todas as informações são protegidas com criptografia de ponta.",
  },
  {
    icon: UserCheck,
    title: "Acessos individuais",
    description: "Cada funcionário tem seu próprio login com permissões específicas.",
  },
  {
    icon: Cloud,
    title: "Backup automático",
    description: "Seus dados são salvos automaticamente na nuvem, sem perder nada.",
  },
  {
    icon: Shield,
    title: "Segurança profissional SaaS",
    description: "Infraestrutura de segurança empresarial para proteger seu negócio.",
  },
];

export const SecuritySection = () => {
  return (
    <section className="py-24 bg-muted/50 relative">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12 animate-slide-up">
            <span className="inline-block px-4 py-1.5 rounded-full bg-success/10 text-success text-sm font-medium mb-4">
              Segurança
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Seus dados estão <span className="text-gradient">protegidos</span>
            </h2>
            <p className="text-lg text-muted-foreground">
              Segurança profissional para você focar no que importa: seu negócio.
            </p>
          </div>

          {/* Security Features Grid */}
          <div className="grid md:grid-cols-2 gap-6">
            {securityFeatures.map((feature, index) => (
              <div
                key={feature.title}
                className="flex gap-4 p-6 rounded-2xl bg-card border border-border animate-slide-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center flex-shrink-0">
                  <feature.icon className="w-6 h-6 text-success" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-1">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
