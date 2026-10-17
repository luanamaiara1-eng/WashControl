import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Gift, Copy, MousePointerClick, UserPlus, Wallet, Loader2, Check } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const money = (value = 0) => value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

interface Earning {
  id: string;
  amount: number;
  base_amount: number;
  commission_percent: number;
  period: string;
  status: string;
  created_at: string;
  paid_at: string | null;
}

const pixKeyTypeLabel: Record<string, string> = { cpf: "CPF", cnpj: "CNPJ", email: "E-mail", phone: "Telefone", random: "Chave aleatória" };

export default function IndicacoesPage() {
  const { user } = useAuth();
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [clickCount, setClickCount] = useState(0);
  const [referredCount, setReferredCount] = useState(0);
  const [earnings, setEarnings] = useState<Earning[]>([]);
  const [settings, setSettings] = useState<{ commission_percent: number; commission_mode: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const [payout, setPayout] = useState({ full_name: "", cpf_cnpj: "", pix_key_type: "cpf", pix_key: "" });
  const [savingPayout, setSavingPayout] = useState(false);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const [{ data: profile }, { count: clicks }, { count: referred }, { data: earningsData }, { data: settingsData }, { data: payoutData }] =
      await Promise.all([
        supabase.from("profiles").select("referral_code").eq("id", user.id).maybeSingle(),
        supabase.from("referral_clicks").select("id", { count: "exact", head: true }).eq("referrer_id", user.id),
        supabase.from("profiles").select("id", { count: "exact", head: true }).eq("referred_by", user.id),
        supabase.from("referral_earnings").select("*").eq("referrer_id", user.id).order("created_at", { ascending: false }),
        supabase.from("referral_settings").select("commission_percent, commission_mode").eq("id", true).maybeSingle(),
        supabase.from("referral_payout_info").select("*").eq("user_id", user.id).maybeSingle(),
      ]);

    setReferralCode(profile?.referral_code ?? null);
    setClickCount(clicks ?? 0);
    setReferredCount(referred ?? 0);
    setEarnings((earningsData as Earning[]) ?? []);
    setSettings(settingsData ?? null);
    if (payoutData) {
      setPayout({
        full_name: payoutData.full_name,
        cpf_cnpj: payoutData.cpf_cnpj,
        pix_key_type: payoutData.pix_key_type,
        pix_key: payoutData.pix_key,
      });
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [user]);

  const referralLink = referralCode ? `${window.location.origin}/registro?ref=${referralCode}` : "";

  const handleCopy = async () => {
    if (!referralLink) return;
    await navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast.success("Link copiado!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSavePayout = async () => {
    if (!user) return;
    if (!payout.full_name.trim() || !payout.cpf_cnpj.trim() || !payout.pix_key.trim()) {
      toast.error("Preencha nome, CPF/CNPJ e a chave Pix.");
      return;
    }
    setSavingPayout(true);
    const { error } = await supabase.from("referral_payout_info").upsert({ user_id: user.id, ...payout });
    setSavingPayout(false);
    if (error) toast.error("Erro ao salvar dados de recebimento: " + error.message);
    else toast.success("Dados de recebimento salvos!");
  };

  const pendingTotal = earnings.filter((e) => e.status === "pending").reduce((acc, e) => acc + Number(e.amount), 0);
  const paidTotal = earnings.filter((e) => e.status === "paid").reduce((acc, e) => acc + Number(e.amount), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="w-5 h-5" /> Indique e Ganhe
          </CardTitle>
          <CardDescription>
            Indique outros lava-rápidos pro WashControl e ganhe uma comissão quando eles virarem clientes pagantes.
            {settings && (
              <>
                {" "}Taxa atual: <strong>{settings.commission_percent}%</strong>{" "}
                {settings.commission_mode === "recurring" ? "sobre cada pagamento recorrente" : "sobre o primeiro pagamento"}.
              </>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Label>Seu link de indicação</Label>
          <div className="flex gap-2">
            <Input readOnly value={referralLink} className="font-mono text-sm" />
            <Button onClick={handleCopy} variant="outline" className="gap-2 shrink-0">
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? "Copiado" : "Copiar"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          ["Cliques no link", clickCount, MousePointerClick, "bg-primary/10 text-primary"],
          ["Cadastros indicados", referredCount, UserPlus, "bg-info/10 text-info"],
          ["A receber", money(pendingTotal), Wallet, "bg-warning/10 text-warning"],
          ["Já recebido", money(paidTotal), Wallet, "bg-success/10 text-success"],
        ].map(([label, value, Icon, style]: any) => (
          <Card key={label}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{label}</p>
                  <p className="text-2xl font-bold mt-1">{value}</p>
                </div>
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${style}`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Dados pra recebimento via Pix</CardTitle>
          <CardDescription>Preencha pra gente saber pra quem e pra qual chave Pix mandar sua comissão.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 max-w-xl">
          <div className="space-y-2">
            <Label>Nome completo</Label>
            <Input value={payout.full_name} onChange={(e) => setPayout({ ...payout, full_name: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>CPF ou CNPJ</Label>
            <Input value={payout.cpf_cnpj} onChange={(e) => setPayout({ ...payout, cpf_cnpj: e.target.value })} />
          </div>
          <div className="grid grid-cols-[160px_1fr] gap-3">
            <div className="space-y-2">
              <Label>Tipo da chave</Label>
              <Select value={payout.pix_key_type} onValueChange={(v) => setPayout({ ...payout, pix_key_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(pixKeyTypeLabel).map(([v, l]) => (
                    <SelectItem key={v} value={v}>{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Chave Pix</Label>
              <Input value={payout.pix_key} onChange={(e) => setPayout({ ...payout, pix_key: e.target.value })} />
            </div>
          </div>
          <Button onClick={handleSavePayout} disabled={savingPayout} variant="hero">
            {savingPayout ? "Salvando..." : "Salvar dados de recebimento"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Suas comissões</CardTitle>
        </CardHeader>
        <CardContent>
          {earnings.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma comissão ainda. Assim que alguém indicado por você virar cliente pagante, aparece aqui.</p>
          ) : (
            <div className="space-y-2">
              {earnings.map((e) => (
                <div key={e.id} className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="font-medium">{money(e.amount)} <span className="text-xs text-muted-foreground font-normal">({e.commission_percent}% de {money(e.base_amount)})</span></p>
                    <p className="text-xs text-muted-foreground">{format(new Date(e.created_at), "dd/MM/yyyy", { locale: ptBR })}</p>
                  </div>
                  {e.status === "paid" ? (
                    <Badge className="bg-success/10 text-success hover:bg-success/10">Pago</Badge>
                  ) : (
                    <Badge variant="secondary">Pendente</Badge>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
