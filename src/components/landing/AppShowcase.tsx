import { useEffect, useState } from "react";
import { Calendar, DollarSign, Users, Car, Clock, CheckCircle2, TrendingUp, FileText, Settings } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

const screens = [
  {
    id: "agenda",
    title: "Agenda",
    fullTitle: "Agenda Inteligente",
    icon: Calendar,
    content: (
      <div className="space-y-2 md:space-y-3">
        <div className="flex items-center justify-between mb-2 md:mb-4">
          <h4 className="font-semibold text-foreground text-xs md:text-base">Agendamentos de Hoje</h4>
          <span className="text-[10px] md:text-xs bg-primary/10 text-primary px-1.5 md:px-2 py-0.5 md:py-1 rounded-full">5 serviços</span>
        </div>
        {[
          { time: "09:00", client: "João Silva", service: "Lavagem Completa", status: "completed", car: "Civic Preto" },
          { time: "10:30", client: "Maria Santos", service: "Polimento", status: "in_progress", car: "Corolla Branco" },
          { time: "14:00", client: "Pedro Costa", service: "Higienização", status: "scheduled", car: "HB20 Prata" },
        ].map((item, i) => (
          <div key={i} className="flex items-center gap-2 md:gap-3 p-2 md:p-3 rounded-lg bg-background/50 border border-border/50">
            <div className="text-center min-w-[35px] md:min-w-[50px]">
              <Clock className="w-3 h-3 md:w-4 md:h-4 mx-auto text-muted-foreground mb-0.5 md:mb-1" />
              <span className="text-[10px] md:text-xs font-medium text-foreground">{item.time}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] md:text-sm font-medium text-foreground truncate">{item.client}</p>
              <p className="text-[10px] md:text-xs text-muted-foreground truncate">{item.service} • {item.car}</p>
            </div>
            <span className={`text-[9px] md:text-xs px-1.5 md:px-2 py-0.5 md:py-1 rounded-full whitespace-nowrap ${
              item.status === 'completed' ? 'bg-success/10 text-success' :
              item.status === 'in_progress' ? 'bg-warning/10 text-warning' :
              'bg-primary/10 text-primary'
            }`}>
              {item.status === 'completed' ? 'Concluído' : item.status === 'in_progress' ? 'Em andamento' : 'Agendado'}
            </span>
          </div>
        ))}
      </div>
    )
  },
  {
    id: "financeiro",
    title: "Financeiro",
    fullTitle: "Controle Financeiro",
    icon: DollarSign,
    content: (
      <div className="space-y-3 md:space-y-4">
        <div className="grid grid-cols-2 gap-2 md:gap-3">
          <div className="p-2 md:p-3 rounded-lg bg-success/10 border border-success/20">
            <TrendingUp className="w-4 h-4 md:w-5 md:h-5 text-success mb-1 md:mb-2" />
            <p className="text-[10px] md:text-xs text-muted-foreground">Receita do Mês</p>
            <p className="text-sm md:text-lg font-bold text-success">R$ 12.450</p>
          </div>
          <div className="p-2 md:p-3 rounded-lg bg-primary/10 border border-primary/20">
            <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5 text-primary mb-1 md:mb-2" />
            <p className="text-[10px] md:text-xs text-muted-foreground">Serviços</p>
            <p className="text-sm md:text-lg font-bold text-primary">127</p>
          </div>
        </div>
        <div className="space-y-1.5 md:space-y-2">
          <p className="text-xs md:text-sm font-medium text-foreground">Últimas Transações</p>
          {[
            { desc: "Lavagem Completa", value: "+R$ 80", type: "income" },
            { desc: "Polimento Cristalizado", value: "+R$ 250", type: "income" },
          ].map((t, i) => (
            <div key={i} className="flex items-center justify-between p-1.5 md:p-2 rounded bg-background/50">
              <span className="text-[11px] md:text-sm text-foreground">{t.desc}</span>
              <span className={`text-[11px] md:text-sm font-medium ${t.type === 'income' ? 'text-success' : 'text-destructive'}`}>
                {t.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    )
  },
  {
    id: "clientes",
    title: "Clientes",
    fullTitle: "Gestão de Clientes",
    icon: Users,
    content: (
      <div className="space-y-2 md:space-y-3">
        <div className="flex items-center justify-between mb-1 md:mb-2">
          <h4 className="font-semibold text-foreground text-xs md:text-base">Clientes Recentes</h4>
          <span className="text-[10px] md:text-xs text-muted-foreground">+23 este mês</span>
        </div>
        {[
          { name: "João Silva", visits: 12, lastVisit: "Hoje", vehicle: "Honda Civic" },
          { name: "Maria Santos", visits: 8, lastVisit: "Ontem", vehicle: "Toyota Corolla" },
          { name: "Pedro Costa", visits: 5, lastVisit: "3 dias", vehicle: "Hyundai HB20" },
        ].map((client, i) => (
          <div key={i} className="flex items-center gap-2 md:gap-3 p-2 md:p-3 rounded-lg bg-background/50 border border-border/50">
            <div className="w-7 h-7 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground font-semibold text-[10px] md:text-sm">
              {client.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] md:text-sm font-medium text-foreground truncate">{client.name}</p>
              <p className="text-[10px] md:text-xs text-muted-foreground truncate">{client.vehicle}</p>
            </div>
            <span className="text-[10px] md:text-xs text-muted-foreground">{client.lastVisit}</span>
          </div>
        ))}
      </div>
    )
  },
  {
    id: "veiculos",
    title: "Veículos",
    fullTitle: "Registro de Veículos",
    icon: Car,
    content: (
      <div className="space-y-2 md:space-y-3">
        <div className="flex items-center justify-between mb-1 md:mb-2">
          <h4 className="font-semibold text-foreground text-xs md:text-base">Veículos Cadastrados</h4>
          <span className="text-[10px] md:text-xs bg-primary/10 text-primary px-1.5 md:px-2 py-0.5 md:py-1 rounded-full">89</span>
        </div>
        {[
          { plate: "ABC-1234", model: "Honda Civic", color: "Preto", owner: "João Silva" },
          { plate: "XYZ-5678", model: "Toyota Corolla", color: "Branco", owner: "Maria Santos" },
        ].map((vehicle, i) => (
          <div key={i} className="flex items-center gap-2 md:gap-3 p-2 md:p-3 rounded-lg bg-background/50 border border-border/50">
            <div className="w-7 h-7 md:w-10 md:h-10 rounded-lg bg-muted flex items-center justify-center">
              <Car className="w-3.5 h-3.5 md:w-5 md:h-5 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1 md:gap-2">
                <p className="text-[11px] md:text-sm font-medium text-foreground truncate">{vehicle.model}</p>
                <span className="text-[9px] md:text-xs bg-muted px-1 md:px-2 py-0.5 rounded text-muted-foreground">{vehicle.plate}</span>
              </div>
              <p className="text-[10px] md:text-xs text-muted-foreground">{vehicle.owner}</p>
            </div>
          </div>
        ))}
      </div>
    )
  },
  {
    id: "notas",
    title: "Notas",
    fullTitle: "Notas de Serviço",
    icon: FileText,
    content: (
      <div className="space-y-2 md:space-y-3">
        <div className="p-2.5 md:p-4 rounded-lg border border-border bg-background/80">
          <div className="flex items-center justify-between mb-2 md:mb-3">
            <div>
              <h4 className="font-semibold text-foreground text-xs md:text-base">Nota #00127</h4>
              <p className="text-[9px] md:text-xs text-muted-foreground">29/12/2025</p>
            </div>
            <span className="text-[9px] md:text-xs bg-success/10 text-success px-1.5 md:px-2 py-0.5 md:py-1 rounded-full">Pago</span>
          </div>
          <div className="space-y-1 md:space-y-2 text-[11px] md:text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Cliente:</span>
              <span className="text-foreground">João Silva</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Serviço:</span>
              <span className="text-foreground">Lavagem</span>
            </div>
            <div className="border-t border-border pt-1.5 md:pt-2 mt-1.5 md:mt-2 flex justify-between font-medium">
              <span className="text-foreground">Total:</span>
              <span className="text-primary">R$ 80,00</span>
            </div>
          </div>
        </div>
        <button className="w-full py-1.5 md:py-2 rounded-lg bg-primary/10 text-primary text-[11px] md:text-sm font-medium hover:bg-primary/20 transition-colors">
          Gerar PDF
        </button>
      </div>
    )
  }
];

// Desktop Laptop Mockup
const LaptopMockup = ({ activeScreen, setActiveScreen, setIsAutoPlaying }: { 
  activeScreen: number; 
  setActiveScreen: (index: number) => void;
  setIsAutoPlaying: (value: boolean) => void;
}) => (
  <div className="relative">
    {/* Screen bezel */}
    <div className="relative bg-gradient-to-b from-zinc-800 to-zinc-900 rounded-t-2xl p-2 shadow-2xl">
      {/* Camera */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-zinc-700" />
      
      {/* Screen */}
      <div className="relative bg-background rounded-lg overflow-hidden aspect-[16/10]">
        {/* App Header */}
        <div className="bg-card border-b border-border px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-xs">WC</span>
            </div>
            <span className="font-semibold text-foreground">WashControl</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
              <Settings className="w-4 h-4 text-muted-foreground" />
            </div>
          </div>
        </div>

        {/* Sidebar + Content */}
        <div className="flex h-[calc(100%-52px)]">
          {/* Sidebar */}
          <div className="w-16 bg-card border-r border-border py-4 flex flex-col items-center gap-2">
            {screens.map((screen, index) => {
              const Icon = screen.icon;
              return (
                <button
                  key={screen.id}
                  onClick={() => {
                    setActiveScreen(index);
                    setIsAutoPlaying(false);
                  }}
                  onMouseEnter={() => setIsAutoPlaying(false)}
                  className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-300 ${
                    activeScreen === index 
                      ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/30' 
                      : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </button>
              );
            })}
          </div>

          {/* Main Content */}
          <div className="flex-1 p-4 overflow-hidden">
            <div className="h-full transition-all duration-500 ease-out" key={activeScreen}>
              <div className="animate-fade-in">
                <div className="flex items-center gap-2 mb-4">
                  {(() => {
                    const Icon = screens[activeScreen].icon;
                    return <Icon className="w-5 h-5 text-primary" />;
                  })()}
                  <h3 className="font-semibold text-foreground">{screens[activeScreen].fullTitle}</h3>
                </div>
                {screens[activeScreen].content}
              </div>
            </div>
          </div>
        </div>

        {/* Progress indicator */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-muted">
          <div 
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${((activeScreen + 1) / screens.length) * 100}%` }}
          />
        </div>
      </div>
    </div>

    {/* Laptop base */}
    <div className="relative h-4 bg-gradient-to-b from-zinc-800 to-zinc-700 rounded-b-lg">
      <div className="absolute inset-x-1/3 top-0 h-1 bg-zinc-600 rounded-b" />
    </div>
    <div className="relative h-2 bg-gradient-to-b from-zinc-700 to-zinc-600 rounded-b-xl mx-8" />

    {/* Floating elements */}
    <div className="absolute -top-4 -right-4 px-3 py-2 bg-success/90 text-success-foreground rounded-lg shadow-lg animate-float text-sm font-medium">
      +R$ 80,00
    </div>
    <div className="absolute -bottom-2 -left-4 px-3 py-2 bg-primary/90 text-primary-foreground rounded-lg shadow-lg animate-float text-sm font-medium" style={{ animationDelay: '1s' }}>
      Novo cliente!
    </div>
  </div>
);

// Mobile Phone Mockup
const PhoneMockup = ({ activeScreen, setActiveScreen, setIsAutoPlaying }: { 
  activeScreen: number; 
  setActiveScreen: (index: number) => void;
  setIsAutoPlaying: (value: boolean) => void;
}) => (
  <div className="relative mx-auto" style={{ maxWidth: '280px' }}>
    {/* Phone Frame */}
    <div className="relative bg-gradient-to-b from-zinc-800 to-zinc-900 rounded-[2.5rem] p-2 shadow-2xl">
      {/* Notch */}
      <div className="absolute top-2 left-1/2 -translate-x-1/2 w-20 h-5 bg-zinc-900 rounded-b-xl z-10 flex items-center justify-center gap-2">
        <div className="w-2 h-2 rounded-full bg-zinc-700" />
        <div className="w-8 h-1.5 rounded-full bg-zinc-700" />
      </div>
      
      {/* Screen */}
      <div className="relative bg-background rounded-[2rem] overflow-hidden" style={{ aspectRatio: '9/19' }}>
        {/* Status Bar */}
        <div className="h-8 bg-card flex items-center justify-between px-6 pt-1">
          <span className="text-[10px] text-muted-foreground font-medium">9:41</span>
          <div className="flex items-center gap-1">
            <div className="w-4 h-2 border border-muted-foreground rounded-sm">
              <div className="w-3 h-1.5 bg-success rounded-sm" />
            </div>
          </div>
        </div>

        {/* App Header */}
        <div className="bg-card border-b border-border px-3 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-[8px]">WC</span>
            </div>
            <span className="font-semibold text-foreground text-xs">WashControl</span>
          </div>
          <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center">
            <Settings className="w-3 h-3 text-muted-foreground" />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-3 overflow-hidden h-[calc(100%-88px-48px)]">
          <div className="h-full transition-all duration-500 ease-out" key={activeScreen}>
            <div className="animate-fade-in">
              <div className="flex items-center gap-1.5 mb-2">
                {(() => {
                  const Icon = screens[activeScreen].icon;
                  return <Icon className="w-3.5 h-3.5 text-primary" />;
                })()}
                <h3 className="font-semibold text-foreground text-xs">{screens[activeScreen].title}</h3>
              </div>
              {screens[activeScreen].content}
            </div>
          </div>
        </div>

        {/* Bottom Navigation */}
        <div className="absolute bottom-0 left-0 right-0 bg-card border-t border-border px-2 py-2 flex justify-around">
          {screens.map((screen, index) => {
            const Icon = screen.icon;
            return (
              <button
                key={screen.id}
                onClick={() => {
                  setActiveScreen(index);
                  setIsAutoPlaying(false);
                }}
                className={`w-10 h-10 rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all duration-300 ${
                  activeScreen === index 
                    ? 'bg-primary/10 text-primary' 
                    : 'text-muted-foreground'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-[8px] font-medium">{screen.title}</span>
              </button>
            );
          })}
        </div>

        {/* Progress indicator */}
        <div className="absolute bottom-12 left-0 right-0 h-0.5 bg-muted">
          <div 
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${((activeScreen + 1) / screens.length) * 100}%` }}
          />
        </div>
      </div>
    </div>

    {/* Floating elements - Mobile */}
    <div className="absolute -top-2 -right-2 px-2 py-1 bg-success/90 text-success-foreground rounded-lg shadow-lg animate-float text-xs font-medium">
      +R$ 80
    </div>
    <div className="absolute -bottom-1 -left-2 px-2 py-1 bg-primary/90 text-primary-foreground rounded-lg shadow-lg animate-float text-xs font-medium" style={{ animationDelay: '1s' }}>
      Novo!
    </div>
  </div>
);

export const AppShowcase = () => {
  const [activeScreen, setActiveScreen] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (!isAutoPlaying) return;
    
    const interval = setInterval(() => {
      setActiveScreen((prev) => (prev + 1) % screens.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  return (
    <div className="relative w-full max-w-4xl mx-auto mt-8 md:mt-16">
      {isMobile ? (
        <PhoneMockup 
          activeScreen={activeScreen} 
          setActiveScreen={setActiveScreen} 
          setIsAutoPlaying={setIsAutoPlaying} 
        />
      ) : (
        <LaptopMockup 
          activeScreen={activeScreen} 
          setActiveScreen={setActiveScreen} 
          setIsAutoPlaying={setIsAutoPlaying} 
        />
      )}

      {/* Screen indicators - Only on desktop */}
      {!isMobile && (
        <div className="flex justify-center gap-2 mt-8">
          {screens.map((screen, index) => (
            <button
              key={screen.id}
              onClick={() => {
                setActiveScreen(index);
                setIsAutoPlaying(false);
              }}
              className={`flex items-center gap-2 px-3 py-2 rounded-full transition-all duration-300 ${
                activeScreen === index 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-muted/50 text-muted-foreground hover:bg-muted'
              }`}
            >
              {(() => {
                const Icon = screen.icon;
                return <Icon className="w-4 h-4" />;
              })()}
              <span className={`text-sm font-medium transition-all duration-300 ${
                activeScreen === index ? 'max-w-[100px] opacity-100' : 'max-w-0 opacity-0 overflow-hidden'
              }`}>
                {screen.fullTitle}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
