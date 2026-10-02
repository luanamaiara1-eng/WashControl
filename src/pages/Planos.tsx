import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Check, Plus, Save, Shield, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCreateSaasPlan, useSaasPlans, useUpdateSaasPlan, SaasPlan } from "@/hooks/useAdmin";

const Planos = () => {
  const { data: plans = [], isLoading } = useSaasPlans();
  const updatePlan = useUpdateSaasPlan();
  const createPlan = useCreateSaasPlan();
  const [editing, setEditing] = useState<Record<string, Partial<SaasPlan>>>({});

  const value = (plan: SaasPlan, key: keyof SaasPlan) =>
    editing[plan.id]?.[key] !== undefined ? editing[plan.id]?.[key] : plan[key];

  const patch = (plan: SaasPlan, patchValue: Partial<SaasPlan>) =>
    setEditing((prev) => ({ ...prev, [plan.id]: { ...prev[plan.id], ...patchValue } }));

  const save = (plan: SaasPlan) => {
    const changes = editing[plan.id];
    if (!changes) return;
    updatePlan.mutate({ id: plan.id, ...changes });
    setEditing((prev) => {
      const next = { ...prev };
      delete next[plan.id];
      return next;
    });
  };

  const addPlan = () => {
    createPlan.mutate({
      name: "Novo plano",
      slug: `plano-${Date.now()}`,
      description: "Configure este plano no Super Admin.",
      price_monthly: 0,
      price_yearly: 0,
      is_active: true,
      max_whatsapp_central: 1,
      max_users: 1,
      max_employees: 1,
      max_vehicles: 100,
      features: { finance: true, appointments: true },
    });
  };

  return (
    <div className="min-h-screen bg-background p-4 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <Link to="/admin" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-3">
              <ArrowLeft className="w-4 h-4" /> Voltar ao Admin
            </Link>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Shield className="w-6 h-6 text-warning" /> Planos do WashControl
            </h1>
            <p className="text-muted-foreground">Controle preços, limites e recursos sem alterar código.</p>
          </div>
          <Button onClick={addPlan} disabled={createPlan.isPending}><Plus className="w-4 h-4 mr-2" /> Novo plano</Button>
        </div>

        {isLoading ? <div className="py-12 text-center">Carregando planos...</div> : (
          <div className="grid gap-5 lg:grid-cols-3">
            {plans.map((plan) => (
              <Card key={plan.id} className="border-border">
                <CardHeader>
                  <div className="flex items-center justify-between gap-3">
                    <CardTitle className="text-lg">{plan.name}</CardTitle>
                    <Switch checked={Boolean(value(plan, "is_active"))} onCheckedChange={(checked) => patch(plan, { is_active: checked })} />
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <label className="text-sm">Nome<Input className="mt-1" value={String(value(plan,"name") ?? "")} onChange={(e) => patch(plan,{name:e.target.value})} /></label>
                    <label className="text-sm">Slug<Input className="mt-1" value={String(value(plan,"slug") ?? "")} onChange={(e) => patch(plan,{slug:e.target.value})} /></label>
                  </div>
                  <label className="text-sm">Descrição<Input className="mt-1" value={String(value(plan,"description") ?? "")} onChange={(e) => patch(plan,{description:e.target.value})} /></label>
                  <div className="grid grid-cols-2 gap-3">
                    <label className="text-sm">Mensal (R$)<Input type="number" step="0.01" className="mt-1" value={Number(value(plan,"price_monthly") ?? 0)} onChange={(e) => patch(plan,{price_monthly:Number(e.target.value)})} /></label>
                    <label className="text-sm">Anual (R$)<Input type="number" step="0.01" className="mt-1" value={Number(value(plan,"price_yearly") ?? 0)} onChange={(e) => patch(plan,{price_yearly:Number(e.target.value)})} /></label>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <label className="text-sm">WhatsApps Central<Input type="number" min="0" className="mt-1" value={Number(value(plan,"max_whatsapp_central") ?? 0)} onChange={(e) => patch(plan,{max_whatsapp_central:Number(e.target.value)})} /></label>
                    <label className="text-sm">Usuários<Input type="number" min="0" className="mt-1" value={Number(value(plan,"max_users") ?? 0)} onChange={(e) => patch(plan,{max_users:Number(e.target.value)})} /></label>
                    <label className="text-sm">Funcionários<Input type="number" min="0" className="mt-1" value={Number(value(plan,"max_employees") ?? 0)} onChange={(e) => patch(plan,{max_employees:Number(e.target.value)})} /></label>
                    <label className="text-sm">Veículos<Input type="number" min="0" className="mt-1" value={Number(value(plan,"max_vehicles") ?? 0)} onChange={(e) => patch(plan,{max_vehicles:Number(e.target.value)})} /></label>
                  </div>
                  <div className="rounded-xl border border-border p-3 space-y-2">
                    <p className="text-sm font-medium mb-2">Recursos</p>
                    {["finance","appointments","public_booking","customer_whatsapp_booking","reminders","automation","advanced_reports"].map((feature) => (
                      <div key={feature} className="flex items-center justify-between text-sm">
                        <span>{feature === "customer_whatsapp_booking" ? "Agendamento pelo WhatsApp do cliente" : feature === "public_booking" ? "Link público de agendamento" : feature === "advanced_reports" ? "Relatórios avançados" : feature === "appointments" ? "Agenda" : feature === "finance" ? "Financeiro" : feature === "reminders" ? "Lembretes" : "Automações"}</span>
                        <Switch checked={Boolean((value(plan,"features") as Record<string,boolean> | undefined)?.[feature])} onCheckedChange={(checked) => patch(plan,{features:{...(value(plan,"features") as Record<string,boolean>),[feature]:checked}})} />
                      </div>
                    ))}
                  </div>
                  <Button className="w-full" onClick={() => save(plan)} disabled={!editing[plan.id] || updatePlan.isPending}>
                    <Save className="w-4 h-4 mr-2" /> Salvar alterações
                  </Button>
                  <div className="text-xs text-muted-foreground flex items-center gap-1"><Check className="w-3 h-3" /> Limites são aplicados por empresa conforme o plano.</div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Planos;
