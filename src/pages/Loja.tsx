import { useEffect, useState } from "react";
import { Eye, Package, Plus, Pencil, Trash2, Store, Loader2, Copy, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  useStoreProducts,
  useStoreSettings,
  useUpdateStoreSettings,
  useCreateStoreProduct,
  useUpdateStoreProduct,
  useDeleteStoreProduct,
} from "@/hooks/useStore";
import { toast } from "sonner";

const money = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

const DEFAULT_MESSAGE =
  "Olá! Gostaria de fazer um pedido:\n\n{produtos}\n\nTotal: {total}\n\nGostaria de confirmar o pedido.";

export default function LojaPage() {
  const { data: settings, isLoading } = useStoreSettings();
  const { data: products = [] } = useStoreProducts();
  const update = useUpdateStoreSettings();
  const create = useCreateStoreProduct();
  const edit = useUpdateStoreProduct();
  const remove = useDeleteStoreProduct();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ name: "", description: "", price: "", image_url: "" });
  const [whatsapp, setWhatsapp] = useState("");
  const [message, setMessage] = useState(DEFAULT_MESSAGE);

  useEffect(() => {
    if (!settings) return;
    setWhatsapp(settings.store_whatsapp || "");
    setMessage(settings.store_whatsapp_message || DEFAULT_MESSAGE);
  }, [settings]);

  const publicUrl = settings?.public_booking_slug
    ? window.location.origin + "/loja/" + settings.public_booking_slug
    : "";

  const editProduct = (p?: any) => {
    setEditing(p || null);
    setForm(
      p
        ? {
            name: p.name,
            description: p.description || "",
            price: String(p.price),
            image_url: p.image_url || "",
          }
        : { name: "", description: "", price: "", image_url: "" }
    );
    setOpen(true);
  };

  const save = async () => {
    if (!form.name.trim() || !form.price) return;
    const data = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      price: Number(form.price),
      image_url: form.image_url.trim() || null,
      category_id: null,
    };
    if (editing) await edit.mutateAsync({ id: editing.id, ...data });
    else await create.mutateAsync(data);
    setOpen(false);
  };

  const saveWhatsApp = () => {
    const normalized = whatsapp.replace(/\D/g, "");
    if (!normalized) {
      toast.error("Informe o número de WhatsApp para receber os pedidos.");
      return;
    }
    update.mutate({
      store_whatsapp: normalized,
      store_whatsapp_message: message.trim() || DEFAULT_MESSAGE,
    });
  };

  const copyLink = async () => {
    if (!publicUrl) return;
    await navigator.clipboard.writeText(publicUrl);
    toast.success("Link da vitrine copiado!");
  };

  if (isLoading)
    return (
      <div className="py-12 flex justify-center">
        <Loader2 className="animate-spin" />
      </div>
    );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Vitrine</h2>
          <p className="text-muted-foreground">Produtos e serviços do seu negócio em um link público.</p>
        </div>
        {publicUrl && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={copyLink}>
              <Copy className="w-4 h-4 mr-2" /> Copiar link
            </Button>
            <Button variant="outline" asChild>
              <a href={publicUrl} target="_blank" rel="noreferrer">
                <Eye className="w-4 h-4 mr-2" /> Ver vitrine
              </a>
            </Button>
          </div>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Store className="w-5 h-5" /> Configuração
          </CardTitle>
          <CardDescription>Escolha o que aparece na vitrine e configure o WhatsApp dos pedidos.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {!settings?.public_booking_slug && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
              Configure primeiro o link público de agendamento em Configurações para liberar o endereço da vitrine.
            </div>
          )}

          <div className="grid gap-3 md:grid-cols-3">
            <div className="flex items-center justify-between border rounded-xl p-4">
              <div>
                <p className="font-medium">Ativar vitrine</p>
                <p className="text-xs text-muted-foreground">Publica o link.</p>
              </div>
              <Switch checked={!!settings?.store_enabled} onCheckedChange={(v) => update.mutate({ store_enabled: v })} />
            </div>
            <div className="flex items-center justify-between border rounded-xl p-4">
              <div>
                <p className="font-medium">Exibir serviços</p>
                <p className="text-xs text-muted-foreground">Usa os serviços já cadastrados.</p>
              </div>
              <Switch checked={!!settings?.store_show_services} onCheckedChange={(v) => update.mutate({ store_show_services: v })} />
            </div>
            <div className="flex items-center justify-between border rounded-xl p-4">
              <div>
                <p className="font-medium">Exibir produtos</p>
                <p className="text-xs text-muted-foreground">Produtos com carrinho.</p>
              </div>
              <Switch checked={!!settings?.store_show_products} onCheckedChange={(v) => update.mutate({ store_show_products: v })} />
            </div>
          </div>

          <div className="rounded-2xl border bg-muted/20 p-4 space-y-4">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-primary" />
              <div>
                <h3 className="font-semibold">Pedidos pelo WhatsApp</h3>
                <p className="text-xs text-muted-foreground">O cliente monta o carrinho e envia o pedido para este número.</p>
              </div>
            </div>

            <div>
              <Label>WhatsApp para pedidos</Label>
              <Input
                className="mt-1"
                value={whatsapp}
                placeholder="5511999999999"
                onChange={(e) => setWhatsapp(e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1">Use DDI + DDD + número. Ex.: 5511999999999</p>
            </div>

            <div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-1">
                <div>
                  <Label>Mensagem do pedido</Label>
                  <p className="text-xs text-muted-foreground">Personalize o texto que será aberto no WhatsApp.</p>
                </div>
                <Button type="button" variant="ghost" size="sm" onClick={() => setMessage(DEFAULT_MESSAGE)}>
                  Restaurar padrão
                </Button>
              </div>
              <Textarea
                className="min-h-[150px]"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={DEFAULT_MESSAGE}
              />
              <div className="rounded-xl bg-muted p-3 mt-2 text-xs text-muted-foreground">
                <p className="font-medium text-foreground mb-1">Variáveis disponíveis</p>
                <p><code>{"{produtos}"}</code> = produtos e quantidades &nbsp;•&nbsp; <code>{"{total}"}</code> = total do pedido</p>
              </div>
            </div>

            <Button onClick={saveWhatsApp} disabled={update.isPending}>
              {update.isPending ? "Salvando..." : "Salvar configuração do WhatsApp"}
            </Button>
          </div>

          {publicUrl && <div className="bg-muted rounded-lg p-3 text-sm break-all">{publicUrl}</div>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2"><Package className="w-5 h-5" /> Produtos</span>
            <Button variant="hero" size="sm" onClick={() => editProduct()}>
              <Plus className="w-4 h-4 mr-1" /> Produto
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {products.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Nenhum produto cadastrado.</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((p: any) => (
                <div key={p.id} className="border rounded-xl p-4 flex gap-3">
                  <div className="w-16 h-16 rounded-lg bg-muted overflow-hidden flex-shrink-0">
                    {p.image_url ? (
                      <img src={p.image_url} className="w-full h-full object-cover" alt={p.name} />
                    ) : (
                      <Package className="w-7 h-7 m-5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold truncate">{p.name}</p>
                    <p className="font-bold">{money(Number(p.price))}</p>
                    <p className="text-xs text-muted-foreground line-clamp-2">{p.description || "Sem descrição"}</p>
                    <div className="flex gap-1 mt-2">
                      <Button variant="ghost" size="icon" onClick={() => editProduct(p)}><Pencil className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => remove.mutate(p.id)}><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Editar produto" : "Novo produto"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Nome</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div><Label>Descrição</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
            <div><Label>Preço</Label><Input type="number" min="0" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} /></div>
            <div><Label>URL da imagem</Label><Input placeholder="https://..." value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button variant="hero" onClick={save}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}