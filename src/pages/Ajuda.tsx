import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Search, PlayCircle, BookOpen, MessageCircle, Store, Calendar, Wrench, Users, Car, DollarSign, BarChart3, Settings } from "lucide-react";

type HelpVideo = {
  title: string;
  description: string;
  category: string;
  icon: typeof PlayCircle;
  youtubeUrl?: string;
};

const videos: HelpVideo[] = [
  { title: "Primeiros passos no WashControl", description: "Conheça o painel e configure seu negócio.", category: "Começando", icon: BookOpen },
  { title: "Como cadastrar serviços", description: "Crie seus serviços, preços e duração.", category: "Começando", icon: Wrench },
  { title: "Clientes e veículos", description: "Cadastre clientes, veículos e mantenha o histórico organizado.", category: "Operação", icon: Car },
  { title: "Como usar os agendamentos", description: "Crie, acompanhe e atualize seus atendimentos.", category: "Operação", icon: Calendar },
  { title: "Funcionários e equipe", description: "Organize sua equipe e responsáveis pelos serviços.", category: "Operação", icon: Users },
  { title: "WhatsApp e automações", description: "Conecte seu WhatsApp e configure comandos e mensagens.", category: "Automação", icon: MessageCircle },
  { title: "Lembretes automáticos", description: "Entenda como os lembretes de agendamento funcionam.", category: "Automação", icon: MessageCircle },
  { title: "Vitrine e pedidos pelo WhatsApp", description: "Publique produtos e serviços e receba pedidos.", category: "Vendas", icon: Store },
  { title: "Financeiro", description: "Registre entradas, saídas e acompanhe seu caixa.", category: "Gestão", icon: DollarSign },
  { title: "Relatórios", description: "Acompanhe os principais números do negócio.", category: "Gestão", icon: BarChart3 },
  { title: "Configurações", description: "Ajuste dados do estabelecimento, horários e preferências.", category: "Configurações", icon: Settings },
];

const categories = ["Todos", "Começando", "Operação", "Automação", "Vendas", "Gestão", "Configurações"];

export default function AjudaPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("Todos");

  const filtered = useMemo(() => videos.filter((video) => {
    const text = `${video.title} ${video.description}`.toLowerCase();
    return (category === "Todos" || video.category === category) && text.includes(search.toLowerCase());
  }), [search, category]);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Central de Ajuda</h2>
        <p className="mt-1 text-muted-foreground">Aprenda a usar o WashControl com tutoriais rápidos.</p>
      </div>

      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-semibold">Quer rever o passo a passo inicial?</p>
            <p className="text-sm text-muted-foreground">Você pode abrir o treinamento guiado novamente quando quiser.</p>
          </div>
          <Button onClick={() => window.dispatchEvent(new Event("washcontrol:open-onboarding"))} className="gap-2">
            <BookOpen className="h-4 w-4" /> Abrir passo a passo
          </Button>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar tutorial..." className="pl-9" />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {categories.map((item) => (
            <Button key={item} size="sm" variant={category === item ? "default" : "outline"} onClick={() => setCategory(item)}>
              {item}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((video) => {
          const Icon = video.icon;
          const hasVideo = Boolean(video.youtubeUrl);
          return (
            <Card key={video.title} className="overflow-hidden">
              <div className="aspect-video bg-muted flex items-center justify-center">
                {hasVideo ? (
                  <iframe className="h-full w-full" src={video.youtubeUrl} title={video.title} allowFullScreen />
                ) : (
                  <div className="text-center p-6">
                    <Icon className="mx-auto h-10 w-10 text-primary" />
                    <p className="mt-2 text-sm font-medium">Vídeo em breve</p>
                    <p className="mt-1 text-xs text-muted-foreground">O tutorial será disponibilizado aqui.</p>
                  </div>
                )}
              </div>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{video.title}</CardTitle>
                <CardDescription>{video.category}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{video.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="rounded-xl border p-10 text-center text-muted-foreground">Nenhum tutorial encontrado.</div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Precisa de ajuda?</CardTitle>
          <CardDescription>Se algo não funcionar como esperado, fale com o suporte.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" className="gap-2">
            <MessageCircle className="h-4 w-4" /> Falar com suporte
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
