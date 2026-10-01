import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2, Calendar, DollarSign, Users, FileText, Shield } from "lucide-react";
import { AppShowcase } from "./AppShowcase";
import { useEffect, useState } from "react";

export const HeroSection = () => {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const highlights = [{
    icon: Calendar,
    text: "Agendamento manual e automático"
  }, {
    icon: DollarSign,
    text: "Controle financeiro completo"
  }, {
    icon: Users,
    text: "Acesso individual para funcionários"
  }, {
    icon: FileText,
    text: "Nota simples em PDF personalizada"
  }, {
    icon: Shield,
    text: "Segurança total dos dados"
  }];

  return (
    <section className="relative min-h-screen flex flex-col pt-20 pb-12 overflow-hidden">
      {/* Background Pattern with Parallax */}
      <div className="absolute inset-0 gradient-hero" />
      <div className="absolute inset-0 opacity-30 pointer-events-none">
        <div 
          className="absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl animate-pulse-slow transition-transform duration-100"
          style={{ transform: `translateY(${scrollY * 0.15}px) translateX(${scrollY * 0.05}px)` }}
        />
        <div 
          className="absolute bottom-20 right-10 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-pulse-slow transition-transform duration-100"
          style={{ animationDelay: "1s", transform: `translateY(${scrollY * 0.1}px) translateX(${-scrollY * 0.03}px)` }}
        />
        <div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl transition-transform duration-100"
          style={{ transform: `translate(-50%, -50%) scale(${1 + scrollY * 0.0003})` }}
        />
        <div 
          className="absolute top-40 right-1/4 w-48 h-48 bg-success/10 rounded-full blur-2xl animate-pulse-slow transition-transform duration-100"
          style={{ animationDelay: "2s", transform: `translateY(${scrollY * 0.2}px)` }}
        />
        <div 
          className="absolute bottom-40 left-1/4 w-64 h-64 bg-warning/10 rounded-full blur-2xl animate-pulse-slow transition-transform duration-100"
          style={{ animationDelay: "1.5s", transform: `translateY(${scrollY * 0.12}px)` }}
        />
      </div>

      <div className="container mx-auto px-4 relative z-10 flex-1 flex flex-col">
        {/* Text Content */}
        <div className="max-w-4xl mx-auto text-center animate-slide-up pt-8">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
            <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
            <span className="text-sm text-primary font-medium">Não é planilha. É um aplicativo profissional.</span>
          </div>

          {/* Headline */}
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 leading-tight text-destructive">
            Controle total{" "}
            <span className="text-muted-foreground">do seu</span>{" "}
            <span className="text-gradient">lava-rápido</span>{" "}
            <span className="text-muted-foreground">e</span>{" "}
            <span className="text-gradient">estética automotiva</span>
            <span className="text-muted-foreground">.</span>
          </h1>

          {/* Subheadline */}
          <p className="text-lg md:text-xl text-muted-foreground font-medium mb-3">
            Sem planilhas. Sem bagunça. Sem improviso.
          </p>

          <p className="text-base text-muted-foreground mb-6 max-w-2xl mx-auto">
            Um aplicativo profissional para gerenciar agenda, equipe, veículos, financeiro e clientes 
            em lava-rápidos e estética automotiva — tudo na palma da sua mão.
          </p>

          {/* Highlights - Compact */}
          <div className="flex flex-wrap justify-center gap-2 mb-6">
            {highlights.map((item, index) => (
              <div key={index} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-card/50 border border-border text-xs">
                <item.icon className="w-3.5 h-3.5 text-primary" />
                <span className="text-foreground">{item.text}</span>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-4">
            <Button variant="hero" size="lg" asChild className="text-base px-6 py-5">
              <Link to="/registro">
                Testar grátis por 7 dias
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
          </div>

          {/* Trust Indicators */}
          <div className="flex flex-wrap gap-4 justify-center text-muted-foreground text-xs">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-success" />
              <span>Sem cartão de crédito</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-success" />
              <span>Sem compromisso</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-success" />
              <span>Cancele quando quiser</span>
            </div>
          </div>
        </div>

        {/* Interactive App Showcase */}
        <div className="flex-1 flex items-center justify-center mt-4">
          <AppShowcase />
        </div>
      </div>
    </section>
  );
};