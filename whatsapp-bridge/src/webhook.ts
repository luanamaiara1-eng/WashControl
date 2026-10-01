import { Router } from "express";
import { supabaseAdmin } from "./supabaseAdmin.js";
import * as evolution from "./evolution.js";
import { parseRegisterClientCommand, isRegisterClientTrigger } from "./commands.js";
import { fromRemoteJid, isValidBrazilianPhone, toLocalPhone } from "./phone.js";

export const webhookRouter = Router();

// Extracts the plain text body across the message shapes EvolutionGo/Evolution API use.
function extractText(data: any): string | null {
  const message = data?.message ?? {};
  return (
    message.conversation ??
    message.extendedTextMessage?.text ??
    message.ephemeralMessage?.message?.conversation ??
    null
  );
}

webhookRouter.post("/evolution/:instanceName", async (req, res) => {
  // Always ack fast so the gateway doesn't retry; errors are logged, not surfaced.
  res.status(200).json({ ok: true });

  try {
    const { instanceName } = req.params;
    const data = req.body?.data ?? req.body;

    const fromMe: boolean = data?.key?.fromMe ?? false;
    const remoteJid: string | undefined = data?.key?.remoteJid;
    const text = extractText(data);

    if (fromMe || !remoteJid || !text || !isRegisterClientTrigger(text)) return;

    const { data: business, error } = await supabaseAdmin
      .from("business_settings")
      .select("user_id, whatsapp_auto_register_enabled")
      .eq("evolution_instance_name", instanceName)
      .maybeSingle();

    if (error || !business || !business.whatsapp_auto_register_enabled) return;

    const senderPhone = fromRemoteJid(remoteJid);
    const command = parseRegisterClientCommand(text);

    if (!command) {
      await evolution.sendText(
        instanceName,
        senderPhone,
        "Não entendi 🤔. Pra cadastrar um cliente manda assim:\n\n*cadastrar cliente Nome, Telefone, Carro (opcional)*\n\nEx: cadastrar cliente João Silva, 11999998888, Onix Prata"
      );
      return;
    }

    const clientPhone = toLocalPhone(command.phone);
    if (!isValidBrazilianPhone(clientPhone)) {
      await evolution.sendText(
        instanceName,
        senderPhone,
        `O telefone "${command.phone}" não parece válido. Manda com DDD, só números (ex: 11999998888).`
      );
      return;
    }

    const { error: insertError } = await supabaseAdmin.from("clients").insert({
      user_id: business.user_id,
      name: command.name,
      phone: clientPhone,
      notes: command.car ? `Carro (cadastro via WhatsApp): ${command.car}` : null,
    });

    if (insertError) {
      await evolution.sendText(instanceName, senderPhone, "Deu erro ao cadastrar o cliente. Tenta de novo em instantes.");
      return;
    }

    const confirmation = command.car
      ? `✅ Cliente cadastrado!\n👤 ${command.name}\n📞 ${clientPhone}\n🚗 ${command.car}`
      : `✅ Cliente cadastrado!\n👤 ${command.name}\n📞 ${clientPhone}`;
    await evolution.sendText(instanceName, senderPhone, confirmation);
  } catch (err) {
    console.error("webhook error:", err);
  }
});
