import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle2 } from "lucide-react";

export const CTASection = () => {
  return (
    <section className="py-24 bg-background relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-10 left-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-accent/20 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-3xl mx-auto text-center">
          {/* Trial CTA */}
          <div className="p-8 md:p-12 rounded-3xl gradient-primary shadow-2xl mb-16 animate-slide-up">
            <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
              Teste grátis por 7 dias
            </h2>
            <p className="text-xl text-primary-foreground/80 mb-8">
              Sem cartão • Sem compromisso • Cancele quando quiser
            </p>
            <Button 
              size="xl" 
              variant="glass"
              asChild 
              className="text-lg px-10 py-6 bg-background/20 hover:bg-background/30 text-primary-foreground border-primary-foreground/30"
            >
              <Link to="/registro">
                Testar grátis agora
                <ArrowRight className="w-5 h-5" />
              </Link>
            </Button>
          </div>

          {/* Final CTA */}
          <div className="animate-slide-up" style={{ animationDelay: "0.2s" }}>
            <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
              Profissionalize seu lava-rápido ou estética automotiva <span className="text-gradient">hoje</span>.
            </h3>
            <p className="text-lg text-muted-foreground mb-8">
              Tenha controle total desde o primeiro dia.
            </p>

            <Button variant="hero" size="xl" asChild className="text-lg px-10 py-6">
              <Link to="/registro">
                Testar grátis por 7 dias
                <ArrowRight className="w-5 h-5" />
              </Link>
            </Button>

            {/* Trust Indicators */}
            <div className="flex flex-wrap gap-6 justify-center mt-8 text-muted-foreground text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-success" />
                <span>Suporte incluído</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-success" />
                <span>Setup em minutos</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-success" />
                <span>Resultados imediatos</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
