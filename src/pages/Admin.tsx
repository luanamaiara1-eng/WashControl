import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Link, useNavigate } from "react-router-dom";
import logoImage from "@/assets/logo.png";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Shield, Users, LayoutDashboard, LogOut, Menu, X, Crown, UserCheck, UserX, MoreVertical, RefreshCw, ArrowLeft, DollarSign, Clock3, CalendarClock, Activity, TrendingUp, PlayCircle, Plus, Pencil, Trash2, Upload, Eye, EyeOff, Smartphone, Wifi, MessageSquareText, Phone, QrCode, Unplug, CheckCircle2, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useAllUsers, useAdminStats, useUpdateUserSubscription, useUpdateUserStatus, SubscriptionPlan, SubscriptionStatus } from "@/hooks/useAdmin";
import { testEvolutionConnection, getCentralStatus, connectCentral, disconnectCentral, type CentralStatus } from "@/lib/whatsappBridge";
import { format, addDays, isBefore } from "date-fns";
import { ptBR } from "date-fns/locale";

const money = (value = 0) => value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const Admin = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(() => typeof window === "undefined" ? true : window.innerWidth >= 1024);
  const { data: users = [], isLoading: usersLoading, refetch: refetchUsers } = useAllUsers();
  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useAdminStats();
  const updateSubscription = useUpdateUserSubscription();
  const updateStatus = useUpdateUserStatus();
  const [videos, setVideos] = useState<any[]>([]);
  const [videoLoading, setVideoLoading] = useState(false);
  const [videoForm, setVideoForm] = useState({ id: "", title: "", description: "", category: "Começando", video_url: "", thumbnail_url: "", sort_order: 0, is_active: true });
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [evoSettings, setEvoSettings] = useState({ base_url: "", api_key: "" });
  const [evoLoading, setEvoLoading] = useState(false);
  const [evoSaving, setEvoSaving] = useState(false);
  const [evoTesting, setEvoTesting] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [authorizedNumbers, setAuthorizedNumbers] = useState<any[]>([]);
  const [authorizedLoading, setAuthorizedLoading] = useState(false);
  const [centralStatus, setCentralStatus] = useState<CentralStatus | null>(null);
  const [centralLoadingStatus, setCentralLoadingStatus] = useState(false);
  const [centralConnecting, setCentralConnecting] = useState(false);
  const [centralDisconnecting, setCentralDisconnecting] = useState(false);
  const [centralQrCode, setCentralQrCode] = useState<string | null>(null);
  const centralPollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const centralQrRefreshRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadVideos = async () => {
    setVideoLoading(true);
    const { data, error } = await supabase.from("help_videos").select("*").order("sort_order").order("created_at");
    if (error) toast.error("Erro ao carregar tutoriais: " + error.message);
    else setVideos(data || []);
    setVideoLoading(false);
  };
  const resetVideo = () => { setVideoForm({ id: "", title: "", description: "", category: "Começando", video_url: "", thumbnail_url: "", sort_order: 0, is_active: true }); setVideoFile(null); };
  const saveVideo = async () => {
    if (!videoForm.title.trim()) return toast.error("Informe o título do tutorial.");
    let videoUrl = videoForm.video_url.trim();
    if (videoFile) {
      const ext = videoFile.name.split(".").pop() || "mp4";
      const path = `tutorials/${crypto.randomUUID()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("help-videos").upload(path, videoFile, { upsert: false });
      if (uploadError) return toast.error("Erro no upload: " + uploadError.message);
      videoUrl = supabase.storage.from("help-videos").getPublicUrl(path).data.publicUrl;
    }
    const payload = { title: videoForm.title.trim(), description: videoForm.description.trim() || null, category: videoForm.category, video_url: videoUrl || null, thumbnail_url: videoForm.thumbnail_url.trim() || null, sort_order: Number(videoForm.sort_order) || 0, is_active: videoForm.is_active };
    const result = videoForm.id ? await supabase.from("help_videos").update(payload).eq("id", videoForm.id) : await supabase.from("help_videos").insert(payload);
    if (result.error) return toast.error("Erro ao salvar tutorial: " + result.error.message);
    toast.success(videoForm.id ? "Tutorial atualizado!" : "Tutorial publicado!"); resetVideo(); loadVideos();
  };
  const deleteVideo = async (id: string) => { if (!confirm("Excluir este tutorial?")) return; const { error } = await supabase.from("help_videos").delete().eq("id", id); if (error) toast.error(error.message); else { toast.success("Tutorial excluído."); loadVideos(); } };

  const loadEvolutionSettings = async () => {
    setEvoLoading(true);
    const { data, error } = await supabase.from("evolution_settings").select("*").maybeSingle();
    if (error) toast.error("Erro ao carregar configurações da Evolution Go: " + error.message);
    else if (data) setEvoSettings({ base_url: data.base_url, api_key: data.api_key });
    setEvoLoading(false);
  };
  const saveEvolutionSettings = async () => {
    if (!evoSettings.base_url.trim() || !evoSettings.api_key.trim()) return toast.error("Preencha a URL e a API Key da Evolution Go.");
    setEvoSaving(true);
    const { error } = await supabase.from("evolution_settings").upsert({ id: true, base_url: evoSettings.base_url.trim(), api_key: evoSettings.api_key.trim() });
    setEvoSaving(false);
    if (error) toast.error("Erro ao salvar: " + error.message);
    else toast.success("Configurações da Evolution Go salvas!");
  };
  const testEvolution = async () => {
    setEvoTesting(true);
    try {
      const result = await testEvolutionConnection();
      if (result.ok) toast.success("Conexão com a Evolution Go funcionando! ✅");
      else toast.error("Falha na conexão: " + (result.error || "erro desconhecido"));
    } catch (e: any) {
      toast.error("Falha na conexão: " + e.message);
    } finally {
      setEvoTesting(false);
    }
  };

  const loadAuthorizedNumbers = async () => {
    setAuthorizedLoading(true);
    const [{ data: numbers, error }, { data: profiles }] = await Promise.all([
      supabase.from("whatsapp_authorized_numbers").select("*").order("created_at", { ascending: false }),
      supabase.from("profiles").select("id, business_name, email"),
    ]);
    if (error) toast.error("Erro ao carregar números autorizados: " + error.message);
    else {
      const profileMap = new Map((profiles || []).map((p) => [p.id, p]));
      setAuthorizedNumbers((numbers || []).map((n) => ({ ...n, business: profileMap.get(n.user_id) })));
    }
    setAuthorizedLoading(false);
  };
  const toggleAuthorizedNumber = async (id: string, isActive: boolean) => {
    const { error } = await supabase.from("whatsapp_authorized_numbers").update({ is_active: isActive }).eq("id", id);
    if (error) toast.error(error.message); else loadAuthorizedNumbers();
  };
  const deleteAuthorizedNumber = async (id: string) => {
    if (!confirm("Remover este número autorizado?")) return;
    const { error } = await supabase.from("whatsapp_authorized_numbers").delete().eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Número removido."); loadAuthorizedNumbers(); }
  };

  const refreshCentralStatus = async () => {
    setCentralLoadingStatus(true);
    try {
      setCentralStatus(await getCentralStatus());
    } catch (e: any) {
      toast.error("Erro ao consultar status do número central: " + e.message);
    } finally {
      setCentralLoadingStatus(false);
    }
  };
  const handleConnectCentral = async () => {
    setCentralConnecting(true);
    try {
      const result = await connectCentral();
      setCentralQrCode(result.qrCode);
      if (result.alreadyConnected) toast.success("O número central já estava conectado!");

      if (centralPollRef.current) clearInterval(centralPollRef.current);
      centralPollRef.current = setInterval(async () => {
        const next = await getCentralStatus().catch(() => null);
        if (next) {
          setCentralStatus(next);
          if (next.connected) {
            clearInterval(centralPollRef.current!);
            if (centralQrRefreshRef.current) clearInterval(centralQrRefreshRef.current);
            setCentralQrCode(null);
            toast.success("Número central conectado!");
          }
        }
      }, 4000);

      // The QR Code expires after a short while — keep fetching a fresh one
      // while the dialog is open so it doesn't go stale before it gets
      // scanned (especially on iOS, where opening the scanner and granting
      // camera access takes longer).
      if (centralQrRefreshRef.current) clearInterval(centralQrRefreshRef.current);
      if (!result.alreadyConnected) {
        centralQrRefreshRef.current = setInterval(async () => {
          const fresh = await connectCentral().catch(() => null);
          if (fresh?.qrCode) setCentralQrCode(fresh.qrCode);
        }, 25000);
      }
    } catch (e: any) {
      toast.error("Erro ao conectar: " + e.message);
    } finally {
      setCentralConnecting(false);
    }
  };
  const handleDisconnectCentral = async () => {
    setCentralDisconnecting(true);
    try {
      await disconnectCentral();
      if (centralPollRef.current) clearInterval(centralPollRef.current);
      if (centralQrRefreshRef.current) clearInterval(centralQrRefreshRef.current);
      setCentralQrCode(null);
      toast.success("Número central desconectado. Clique em \"Conectar\" pra parear de novo.");
      refreshCentralStatus();
    } catch (e: any) {
      toast.error("Erro ao desconectar: " + e.message);
    } finally {
      setCentralDisconnecting(false);
    }
  };

  const refresh = () => { refetchUsers(); refetchStats(); loadVideos(); loadEvolutionSettings(); loadAuthorizedNumbers(); refreshCentralStatus(); };
  const handleLogout = async () => { await signOut(); navigate("/"); };

  const planLabel: Record<string,string> = { free:"Gratuito", basic:"Básico", pro:"Pro", premium:"Premium" };
  const statusLabel: Record<SubscriptionStatus,string> = { active:"Ativo", canceled:"Cancelado", expired:"Expirado", trial:"Trial" };
  const statusClass: Record<string,string> = {
    active:"bg-success/10 text-success", trial:"bg-info/10 text-info",
    canceled:"bg-destructive/10 text-destructive", expired:"bg-muted text-muted-foreground"
  };
  const extend = (userId:string, current:string|null|undefined, days:number) => {
    const base = current && !isBefore(new Date(current), new Date()) ? new Date(current) : new Date();
    updateSubscription.mutate({ userId, expiresAt: addDays(base, days).toISOString(), status:"active" });
  };

  useEffect(() => {
    loadVideos(); loadEvolutionSettings(); loadAuthorizedNumbers(); refreshCentralStatus();
    return () => {
      if (centralPollRef.current) clearInterval(centralPollRef.current);
      if (centralQrRefreshRef.current) clearInterval(centralQrRefreshRef.current);
    };
  }, []);

  const navItems = [
    { icon: LayoutDashboard, label:"Visão geral", href:"/admin" },
    { icon: Users, label:"Usuários", href:"/admin#usuarios" },
    { icon: Crown, label:"Planos", href:"/admin/planos" },
    { icon: PlayCircle, label:"Tutoriais", href:"/admin#tutoriais" },
    { icon: Smartphone, label:"Evolution Go", href:"/admin#evolution" },
    { icon: Phone, label:"WhatsApp Central", href:"/admin#whatsapp-central" },
  ];

  const commandReference = [
    { trigger: "ajuda", description: "Mostra a lista de comandos disponíveis." },
    { trigger: "cadastrar cliente Nome, Telefone, Carro (opcional)", description: "Cadastra um novo cliente." },
    { trigger: "cadastrar serviço Nome, Preço, Duração em minutos (opcional)", description: "Cadastra um novo serviço." },
    { trigger: "Nome agendou Serviço pro Carro às HH:MM valor Valor", description: "Cria um agendamento e lança no financeiro." },
    { trigger: "vale Nome do funcionário, Valor", description: "Registra um vale (adiantamento) pro funcionário." },
    { trigger: "pagamento funcionário Nome do funcionário, Valor", description: "Registra o pagamento de um funcionário." },
  ];

  return <div className="min-h-screen bg-background flex">
    <aside className={`fixed inset-y-0 left-0 z-50 bg-sidebar transition-all duration-300 ${sidebarOpen ? "w-64 translate-x-0" : "lg:w-16 lg:translate-x-0 -translate-x-full"}`}>
      <div className="flex flex-col h-full">
        <div className={`flex items-center p-4 border-b border-sidebar-border ${sidebarOpen ? "justify-between" : "justify-center"}`}>
          <Link to="/" className="flex items-center gap-2"><img src={logoImage} alt="WashControl" className="w-10 h-10 rounded-xl object-cover"/>{sidebarOpen && <span className="text-lg font-bold text-sidebar-foreground">Wash<span className="text-primary">Control</span></span>}</Link>
          {sidebarOpen && <button className="lg:hidden text-sidebar-foreground" onClick={()=>setSidebarOpen(false)}><X className="w-5 h-5"/></button>}
        </div>
        <nav className="flex-1 p-2 space-y-1">
          {navItems.map(item=><Link key={item.label} to={item.href} className={`flex items-center gap-3 px-3 py-3 rounded-lg bg-sidebar-accent text-sidebar-primary ${!sidebarOpen ? "justify-center":""}`}><item.icon className="w-5 h-5"/>{sidebarOpen&&<span className="font-medium">{item.label}</span>}</Link>)}
          <Link to="/dashboard" className={`flex items-center gap-3 px-3 py-3 rounded-lg text-sidebar-foreground/70 hover:bg-sidebar-accent ${!sidebarOpen ? "justify-center":""}`}><ArrowLeft className="w-5 h-5"/>{sidebarOpen&&<span className="font-medium">Voltar ao app</span>}</Link>
        </nav>
        <div className="p-3 border-t border-sidebar-border">
          {sidebarOpen && <div className="flex items-center gap-3 px-2 py-2"><div className="w-10 h-10 rounded-full bg-warning/20 flex items-center justify-center"><Shield className="w-5 h-5 text-warning"/></div><div className="min-w-0"><p className="text-sm font-medium text-sidebar-foreground">Administrador</p><p className="text-xs text-sidebar-foreground/60 truncate">{user?.email}</p></div></div>}
          <Button variant="ghost" className="w-full justify-start text-sidebar-foreground/70 mt-2" onClick={handleLogout}><LogOut className="w-5 h-5 mr-3"/>Sair</Button>
        </div>
      </div>
    </aside>

    <main className={`flex-1 transition-all duration-300 ${sidebarOpen ? "lg:ml-64":"lg:ml-16"}`}>
      <header className="sticky top-0 z-40 bg-background/85 backdrop-blur-xl border-b border-border">
        <div className="flex items-center justify-between px-4 lg:px-8 h-16">
          <div className="flex items-center gap-4"><button className="text-foreground" onClick={()=>setSidebarOpen(!sidebarOpen)}><Menu className="w-6 h-6"/></button><div><h1 className="text-xl font-bold flex items-center gap-2"><Shield className="w-5 h-5 text-warning"/>Super Admin</h1><p className="text-sm text-muted-foreground">Visão geral da operação SaaS</p></div></div>
          <Button variant="outline" size="sm" onClick={refresh} className="gap-2"><RefreshCw className="w-4 h-4"/>Atualizar</Button>
        </div>
      </header>

      <div className="p-4 lg:p-8 space-y-6">
        <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {[
            ["Usuários", stats?.totalUsers ?? 0, Users, "bg-primary/10 text-primary"],
            ["Ativos", stats?.activeUsers ?? 0, UserCheck, "bg-success/10 text-success"],
            ["Assinaturas ativas", stats?.activeSubscriptions ?? 0, Crown, "bg-warning/10 text-warning"],
            ["MRR contratado", money(stats?.mrr ?? 0), DollarSign, "bg-info/10 text-info"],
          ].map(([label,value,Icon,style]:any)=><Card key={label} className="rounded-2xl"><CardContent className="p-5"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">{label}</p><p className="text-2xl font-bold mt-1">{statsLoading?"...":value}</p></div><div className={`w-11 h-11 rounded-xl flex items-center justify-center ${style}`}><Icon className="w-5 h-5"/></div></div></CardContent></Card>)}
        </section>

        <section className="grid lg:grid-cols-3 gap-6 min-w-0">
          <Card className="lg:col-span-2 rounded-2xl"><CardHeader><CardTitle className="text-base flex items-center gap-2"><TrendingUp className="w-4 h-4"/>Crescimento de usuários</CardTitle></CardHeader><CardContent><ResponsiveContainer width="100%" height={260}><AreaChart data={stats?.usersByMonth || []}><CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))"/><XAxis dataKey="month" fontSize={12}/><YAxis allowDecimals={false} fontSize={12}/><Tooltip/><Area type="monotone" dataKey="users" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.14} strokeWidth={2}/></AreaChart></ResponsiveContainer></CardContent></Card>
          <Card className="rounded-2xl"><CardHeader><CardTitle className="text-base">Distribuição dos planos</CardTitle></CardHeader><CardContent><ResponsiveContainer width="100%" height={260}><PieChart><Pie data={stats?.planDistribution || []} dataKey="value" nameKey="name" innerRadius={58} outerRadius={90} paddingAngle={3}>{(stats?.planDistribution || []).map((_:any,i:number)=><Cell key={i} fill={["hsl(var(--primary))","hsl(var(--chart-2))","hsl(var(--chart-3))","hsl(var(--chart-4))"][i%4]}/>)}</Pie><Tooltip/></PieChart></ResponsiveContainer><div className="space-y-2">{(stats?.planDistribution||[]).map((p:any)=><div key={p.name} className="flex justify-between text-sm"><span>{p.name}</span><b>{p.value}</b></div>)}</div></CardContent></Card>
        </section>

        <section className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="rounded-2xl"><CardContent className="p-5"><p className="text-sm text-muted-foreground">Valor anual contratado</p><p className="text-xl font-bold mt-1">{money(stats?.annualContractValue||0)}</p><p className="text-xs text-muted-foreground mt-1">MRR × 12, sem simular recebimentos</p></CardContent></Card>
          <Card className="rounded-2xl"><CardContent className="p-5"><p className="text-sm text-muted-foreground">Trials ativos</p><p className="text-xl font-bold mt-1">{stats?.trialSubscriptions||0}</p></CardContent></Card>
          <Card className="rounded-2xl"><CardContent className="p-5"><p className="text-sm text-muted-foreground">Vencendo em 7 dias</p><p className="text-xl font-bold mt-1">{stats?.expiringSoon||0}</p><p className="text-xs text-muted-foreground mt-1">Assinaturas a acompanhar</p></CardContent></Card>
          <Card className="rounded-2xl"><CardContent className="p-5"><p className="text-sm text-muted-foreground">Inativos</p><p className="text-xl font-bold mt-1">{stats?.inactiveUsers||0}</p></CardContent></Card>
        </section>


        <section id="tutoriais">
          <Card className="rounded-2xl">
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><PlayCircle className="w-4 h-4"/>Central de Tutoriais</CardTitle><p className="text-sm text-muted-foreground">Cadastre, envie, edite, organize e publique os vídeos que aparecem na Central de Ajuda dos clientes.</p></CardHeader>
            <CardContent className="space-y-5">
              <div className="grid lg:grid-cols-2 gap-4">
                <div className="space-y-3 rounded-xl border p-4">
                  <div className="flex items-center justify-between"><h3 className="font-semibold">{videoForm.id ? "Editar tutorial" : "Novo tutorial"}</h3>{videoForm.id && <Button size="sm" variant="ghost" onClick={resetVideo}>Cancelar</Button>}</div>
                  <input className="w-full rounded-md border bg-background px-3 py-2 text-sm" placeholder="Título" value={videoForm.title} onChange={e=>setVideoForm({...videoForm,title:e.target.value})}/>
                  <textarea className="w-full rounded-md border bg-background px-3 py-2 text-sm min-h-20" placeholder="Descrição" value={videoForm.description} onChange={e=>setVideoForm({...videoForm,description:e.target.value})}/>
                  <div className="grid grid-cols-2 gap-3"><input className="rounded-md border bg-background px-3 py-2 text-sm" placeholder="Categoria" value={videoForm.category} onChange={e=>setVideoForm({...videoForm,category:e.target.value})}/><input type="number" className="rounded-md border bg-background px-3 py-2 text-sm" placeholder="Ordem" value={videoForm.sort_order} onChange={e=>setVideoForm({...videoForm,sort_order:Number(e.target.value)})}/></div>
                  <input className="w-full rounded-md border bg-background px-3 py-2 text-sm" placeholder="URL do YouTube ou vídeo externo (opcional)" value={videoForm.video_url} onChange={e=>setVideoForm({...videoForm,video_url:e.target.value})}/>
                  <input className="w-full rounded-md border bg-background px-3 py-2 text-sm" placeholder="URL da thumbnail (opcional)" value={videoForm.thumbnail_url} onChange={e=>setVideoForm({...videoForm,thumbnail_url:e.target.value})}/>
                  <label className="flex items-center gap-2 rounded-md border p-3 text-sm cursor-pointer"><Upload className="w-4 h-4"/><span>Ou enviar arquivo de vídeo</span><input type="file" accept="video/*" className="hidden" onChange={e=>setVideoFile(e.target.files?.[0]||null)}/>{videoFile&&<span className="text-xs text-muted-foreground truncate">{videoFile.name}</span>}</label>
                  <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={videoForm.is_active} onChange={e=>setVideoForm({...videoForm,is_active:e.target.checked})}/> Publicar na Central de Ajuda</label>
                  <Button onClick={saveVideo} className="w-full gap-2"><Plus className="w-4 h-4"/>{videoForm.id ? "Salvar alterações" : "Adicionar tutorial"}</Button>
                </div>
                <div className="space-y-3"><h3 className="font-semibold">Tutoriais publicados</h3>{videoLoading?<p className="text-sm text-muted-foreground">Carregando...</p>:videos.length===0?<div className="rounded-xl border p-8 text-center text-sm text-muted-foreground">Nenhum tutorial cadastrado.</div>:videos.map(v=><div key={v.id} className="flex items-center gap-3 rounded-xl border p-3"><div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center shrink-0"><PlayCircle className="w-5 h-5 text-primary"/></div><div className="min-w-0 flex-1"><p className="font-medium truncate">{v.title}</p><p className="text-xs text-muted-foreground">{v.category} · ordem {v.sort_order}</p></div><Button variant="ghost" size="icon" onClick={()=>setVideoForm(v)}>{v.is_active?<Eye className="w-4 h-4"/>:<EyeOff className="w-4 h-4"/>}</Button><Button variant="ghost" size="icon" onClick={()=>setVideoForm(v)}><Pencil className="w-4 h-4"/></Button><Button variant="ghost" size="icon" onClick={()=>deleteVideo(v.id)}><Trash2 className="w-4 h-4 text-destructive"/></Button></div>)}</div>
              </div>
            </CardContent>
          </Card>
        </section>
        <section id="evolution">
          <Card className="rounded-2xl">
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><Smartphone className="w-4 h-4"/>Evolution Go</CardTitle><p className="text-sm text-muted-foreground">URL e API Key da sua instância Evolution Go. O bridge do WhatsApp lê daqui — não precisa mais editar .env na VPS pra trocar isso.</p></CardHeader>
            <CardContent className="space-y-4 max-w-xl">
              {evoLoading ? <p className="text-sm text-muted-foreground">Carregando...</p> : <>
                <div className="space-y-1">
                  <label className="text-sm font-medium">URL base</label>
                  <input className="w-full rounded-md border bg-background px-3 py-2 text-sm" placeholder="https://evolution.seudominio.com.br" value={evoSettings.base_url} onChange={e=>setEvoSettings({...evoSettings,base_url:e.target.value})}/>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">API Key (global/admin)</label>
                  <div className="relative">
                    <input type={showApiKey?"text":"password"} className="w-full rounded-md border bg-background px-3 py-2 pr-10 text-sm" placeholder="sua-api-key" value={evoSettings.api_key} onChange={e=>setEvoSettings({...evoSettings,api_key:e.target.value})}/>
                    <button type="button" className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground" onClick={()=>setShowApiKey(!showApiKey)}>{showApiKey?<EyeOff className="w-4 h-4"/>:<Eye className="w-4 h-4"/>}</button>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={saveEvolutionSettings} disabled={evoSaving} className="gap-2"><Plus className="w-4 h-4"/>{evoSaving?"Salvando...":"Salvar"}</Button>
                  <Button variant="outline" onClick={testEvolution} disabled={evoTesting} className="gap-2"><Wifi className="w-4 h-4"/>{evoTesting?"Testando...":"Testar conexão"}</Button>
                </div>
              </>}
            </CardContent>
          </Card>
        </section>
        <section id="whatsapp-central" className="space-y-6">
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2"><Phone className="w-4 h-4"/>Número Central de Comandos</CardTitle>
              <p className="text-sm text-muted-foreground">O único número de WhatsApp de todo o WashControl que recebe comandos ("cadastrar cliente...", "João agendou...", "vale..."). O sistema identifica a empresa pelo telefone de quem manda (lista de números autorizados abaixo) — diferente do WhatsApp que cada empresa conecta em Configurações, que serve só pra falar com os clientes dela.</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-3">
                {centralLoadingStatus ? (
                  <Badge variant="outline" className="gap-1"><Loader2 className="w-3 h-3 animate-spin"/>Verificando...</Badge>
                ) : centralStatus?.connected ? (
                  <Badge className="gap-1 bg-green-600 hover:bg-green-600"><CheckCircle2 className="w-3 h-3"/>Conectado</Badge>
                ) : (
                  <Badge variant="secondary">Desconectado</Badge>
                )}
                <div className="flex gap-2">
                  <Button onClick={handleConnectCentral} disabled={centralConnecting} className="gap-2">
                    {centralConnecting ? <Loader2 className="w-4 h-4 animate-spin"/> : <QrCode className="w-4 h-4"/>}
                    Conectar número central
                  </Button>
                  <Button variant="outline" onClick={handleDisconnectCentral} disabled={centralDisconnecting} className="gap-2">
                    {centralDisconnecting ? <Loader2 className="w-4 h-4 animate-spin"/> : <Unplug className="w-4 h-4"/>}
                    Desconectar
                  </Button>
                </div>
              </div>
              {!centralStatus?.connected && (
                <p className="text-xs text-muted-foreground">
                  Escaneie o QR Code com o WhatsApp que vai ser o número oficial do WashControl pra receber comandos.
                  Se "Conectar" não mostrar um QR novo, clique em "Desconectar" primeiro e tente de novo.
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-2xl">
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><Phone className="w-4 h-4"/>Números autorizados (todas as empresas)</CardTitle><p className="text-sm text-muted-foreground">Cada empresa autoriza seus próprios números em Configurações → WhatsApp. Aqui você acompanha e pode desativar/remover em caso de suporte.</p></CardHeader>
            <CardContent>
              {authorizedLoading ? <p className="text-sm text-muted-foreground">Carregando...</p> : authorizedNumbers.length === 0 ? <div className="rounded-xl border p-8 text-center text-sm text-muted-foreground">Nenhum número autorizado em nenhuma empresa ainda.</div> : (
                <div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Empresa</TableHead><TableHead>Telefone</TableHead><TableHead>Nome</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Ações</TableHead></TableRow></TableHeader><TableBody>
                  {authorizedNumbers.map((n) => <TableRow key={n.id}>
                    <TableCell><p className="font-medium">{n.business?.business_name || "Sem nome"}</p><p className="text-xs text-muted-foreground">{n.business?.email}</p></TableCell>
                    <TableCell>{n.phone}</TableCell>
                    <TableCell>{n.label || "—"}</TableCell>
                    <TableCell>{n.is_active ? <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-success/10 text-success text-xs"><UserCheck className="w-3 h-3"/>Ativo</span> : <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-muted text-muted-foreground text-xs"><UserX className="w-3 h-3"/>Inativo</span>}</TableCell>
                    <TableCell className="text-right"><div className="flex justify-end gap-1"><Button variant="ghost" size="sm" onClick={()=>toggleAuthorizedNumber(n.id, !n.is_active)}>{n.is_active?"Desativar":"Ativar"}</Button><Button variant="ghost" size="icon" onClick={()=>deleteAuthorizedNumber(n.id)}><Trash2 className="w-4 h-4 text-destructive"/></Button></div></TableCell>
                  </TableRow>)}
                </TableBody></Table></div>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-2xl">
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><MessageSquareText className="w-4 h-4"/>Comandos do agente de WhatsApp</CardTitle><p className="text-sm text-muted-foreground">Referência dos comandos que o sistema reconhece hoje (fixos, não editáveis). Cada empresa usa seu próprio número conectado pra receber esses comandos dos números autorizados.</p></CardHeader>
            <CardContent>
              <div className="space-y-2">
                {commandReference.map((c) => (
                  <div key={c.trigger} className="rounded-lg border p-3">
                    <code className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded">{c.trigger}</code>
                    <p className="text-xs text-muted-foreground mt-1">{c.description}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>
        <Card id="usuarios" className="rounded-2xl overflow-hidden">
          <CardHeader><CardTitle className="text-base">Gestão de usuários</CardTitle><p className="text-sm text-muted-foreground">Ative, desative, altere plano e estenda a assinatura sem precisar editar banco.</p></CardHeader>
          {usersLoading ? <div className="p-10 text-center">Carregando...</div> : <div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Empresa</TableHead><TableHead>Status</TableHead><TableHead>Plano</TableHead><TableHead>Assinatura</TableHead><TableHead>Vencimento</TableHead><TableHead>Cadastro</TableHead><TableHead className="text-right">Ações</TableHead></TableRow></TableHeader><TableBody>
            {users.map(u=><TableRow key={u.id}>
              <TableCell><p className="font-medium">{u.business_name||"Sem nome"}</p><p className="text-xs text-muted-foreground">{u.email}</p></TableCell>
              <TableCell>{u.is_active?<span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-success/10 text-success text-xs"><UserCheck className="w-3 h-3"/>Ativo</span>:<span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-destructive/10 text-destructive text-xs"><UserX className="w-3 h-3"/>Inativo</span>}</TableCell>
              <TableCell><Select value={u.subscription?.plan||"free"} onValueChange={v=>updateSubscription.mutate({userId:u.id,plan:v as SubscriptionPlan})}><SelectTrigger className="w-32"><SelectValue/></SelectTrigger><SelectContent>{Object.entries(planLabel).map(([v,l])=><SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent></Select></TableCell>
              <TableCell>{u.subscription?<span className={`px-2 py-1 rounded-full text-xs ${statusClass[u.subscription.status]||"bg-muted"}`}>{statusLabel[u.subscription.status]}</span>:<span className="text-xs text-muted-foreground">Sem assinatura</span>}</TableCell>
              <TableCell>{u.subscription?.expires_at?format(new Date(u.subscription.expires_at),"dd/MM/yyyy",{locale:ptBR}):"—"}</TableCell>
              <TableCell className="text-muted-foreground">{format(new Date(u.created_at),"dd/MM/yyyy",{locale:ptBR})}</TableCell>
              <TableCell className="text-right"><DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="sm"><MoreVertical className="w-4 h-4"/></Button></DropdownMenuTrigger><DropdownMenuContent align="end">
                {u.is_active?<DropdownMenuItem className="text-destructive" onClick={()=>updateStatus.mutate({userId:u.id,isActive:false})}><UserX className="w-4 h-4 mr-2"/>Desativar</DropdownMenuItem>:<DropdownMenuItem onClick={()=>updateStatus.mutate({userId:u.id,isActive:true})}><UserCheck className="w-4 h-4 mr-2"/>Ativar</DropdownMenuItem>}
                <DropdownMenuSeparator/>
                <DropdownMenuItem onClick={()=>extend(u.id,u.subscription?.expires_at,7)}><CalendarClock className="w-4 h-4 mr-2"/>+7 dias</DropdownMenuItem>
                <DropdownMenuItem onClick={()=>extend(u.id,u.subscription?.expires_at,15)}><CalendarClock className="w-4 h-4 mr-2"/>+15 dias</DropdownMenuItem>
                <DropdownMenuItem onClick={()=>extend(u.id,u.subscription?.expires_at,30)}><CalendarClock className="w-4 h-4 mr-2"/>+30 dias</DropdownMenuItem>
                <DropdownMenuItem onClick={()=>extend(u.id,u.subscription?.expires_at,60)}><CalendarClock className="w-4 h-4 mr-2"/>+60 dias</DropdownMenuItem>
                <DropdownMenuSeparator/>
                <DropdownMenuItem className="text-destructive" onClick={()=>updateSubscription.mutate({userId:u.id,status:"canceled"})}><Clock3 className="w-4 h-4 mr-2"/>Cancelar assinatura</DropdownMenuItem>
              </DropdownMenuContent></DropdownMenu></TableCell>
            </TableRow>)}
          </TableBody></Table></div>}
        </Card>
      </div>
    </main>
    {sidebarOpen&&<div className="fixed inset-0 bg-foreground/20 z-40 lg:hidden" onClick={()=>setSidebarOpen(false)}/>}
    <Dialog open={!!centralQrCode} onOpenChange={(open)=>{ if(!open){ setCentralQrCode(null); if (centralQrRefreshRef.current) clearInterval(centralQrRefreshRef.current); } }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Escaneie com o WhatsApp do número central</DialogTitle>
          <DialogDescription>No celular: WhatsApp → Configurações → Aparelhos conectados → Conectar um aparelho.</DialogDescription>
        </DialogHeader>
        {centralQrCode && <div className="flex justify-center p-4"><img src={centralQrCode} alt="QR Code do número central" className="w-64 h-64"/></div>}
      </DialogContent>
    </Dialog>
  </div>;
};
export default Admin;
