import { Router } from "express";
import * as evolution from "./evolution.js";
import { findBusinessByInstanceName, findBusinessByAuthorizedPhone, isAuthorizedPhone } from "./business.js";
import { fromRemoteJid } from "./phone.js";
import { recordMessage, type MessageType } from "./conversations.js";
import { CENTRAL_INSTANCE_NAME, getCentralInstanceToken } from "./central.js";
import {
  HELP_MESSAGE,
  isHelpTrigger,
  isRegisterClientTrigger,
  parseRegisterClientCommand,
  isRegisterServiceTrigger,
  parseRegisterServiceCommand,
  isScheduleTrigger,
  parseScheduleCommand,
  isAdvanceTrigger,
  parseAdvanceCommand,
  isPaymentTrigger,
  parsePaymentCommand,
} from "./commands.js";
import {
  handleRegisterClient,
  handleRegisterService,
  handleSchedule,
  handleAdvance,
  handlePayment,
} from "./handlers.js";

export const webhookRouter = Router();

// Media (image/audio/document) isn't downloaded/stored yet — that's a later
// phase — but we still record that *something* arrived so the chat doesn't
// silently drop it, with the caption/filename as a stand-in body.
//
// Evolution Go (whatsmeow) wraps each event as { Info: {...}, event, ... },
// PascalCase, not the Baileys-style { key, message } shape — confirmed from
// production logs. `Info.Message` still holds the same WhatsApp protobuf
// field names (conversation, extendedTextMessage, ...) either way.
function extractMessage(info: any): { type: MessageType; body: string | null } | null {
  const message = info?.Message ?? {};
  if (message.conversation) return { type: "text", body: message.conversation };
  if (message.extendedTextMessage?.text) return { type: "text", body: message.extendedTextMessage.text };
  if (message.ephemeralMessage?.message?.conversation) return { type: "text", body: message.ephemeralMessage.message.conversation };
  if (message.imageMessage) return { type: "image", body: message.imageMessage.caption ?? null };
  if (message.audioMessage) return { type: "audio", body: null };
  if (message.documentMessage) return { type: "document", body: message.documentMessage.fileName ?? null };
  return null;
}

async function resolveReply(
  userId: string,
  timezone: string | null,
  senderPhone: string,
  text: string,
): Promise<string | null> {
  if (isHelpTrigger(text)) return HELP_MESSAGE;

  if (isRegisterClientTrigger(text)) {
    const cmd = parseRegisterClientCommand(text);
    return cmd
      ? handleRegisterClient(userId, cmd, senderPhone)
      : "Não entendi 🤔. Pra cadastrar um cliente manda assim:\n\n*cadastrar cliente Nome, Telefone, Carro (opcional)*\n\nEx: cadastrar cliente João Silva, 11999998888, Onix Prata";
  }

  if (isRegisterServiceTrigger(text)) {
    const cmd = parseRegisterServiceCommand(text);
    return cmd
      ? handleRegisterService(userId, cmd)
      : "Não entendi 🤔. Pra cadastrar um serviço manda assim:\n\ncadastrar serviço Nome, Preço, Duração em minutos (opcional)";
  }

  if (isScheduleTrigger(text)) {
    const cmd = parseScheduleCommand(text);
    return cmd
      ? handleSchedule(userId, timezone, cmd)
      : "Não entendi o agendamento 🤔. Manda assim:\n\n*Nome agendou Serviço pro Carro às HH:MM valor Valor*\n\nEx: João agendou lavagem completa pro jetta às 8h valor 80,00";
  }

  if (isAdvanceTrigger(text)) {
    const cmd = parseAdvanceCommand(text);
    return cmd
      ? handleAdvance(userId, timezone, cmd)
      : "Não entendi o vale 🤔. Manda assim:\n\n*vale Nome do funcionário, Valor*\n\nEx: vale Carlos, 50";
  }

  if (isPaymentTrigger(text)) {
    const cmd = parsePaymentCommand(text);
    return cmd
      ? handlePayment(userId, timezone, cmd)
      : "Não entendi o pagamento 🤔. Manda assim:\n\n*pagamento funcionário Nome do funcionário, Valor*\n\nEx: pagamento funcionário Carlos, 200";
  }

  return null;
}

/** The one platform-wide command number: identifies the business purely by
 * who's texting (an authorized owner/manager), not by which number received
 * it. Replies go out from the central number, and nothing is stored as a
 * client conversation — this channel has nothing to do with a business's
 * clients. */
async function handleCentralMessage(senderPhone: string, message: { type: MessageType; body: string | null }) {
  if (message.type !== "text" || !message.body) return;

  const business = await findBusinessByAuthorizedPhone(senderPhone);
  if (!business) return;

  const centralToken = await getCentralInstanceToken();
  if (!centralToken) return;

  if (!business.subscription_active) {
    const warning = "🔒 Seu acesso ao WashControl está inativo ou expirado. Para continuar usando a Central, renove ou escolha seu plano no painel do WashControl.";
    await evolution.sendText(centralToken, senderPhone, warning);
    return;
  }

  if (!business.whatsapp_auto_register_enabled) return;

  const reply = await resolveReply(business.user_id, business.timezone, senderPhone, message.body);
  if (reply) {
    await evolution.sendText(centralToken, senderPhone, reply);
  }
}

webhookRouter.post("/evolution/:instanceName", async (req, res) => {
  // Always ack fast so the gateway doesn't retry; errors are logged, not surfaced.
  res.status(200).json({ ok: true });

  try {
    const { instanceName } = req.params;
    const payload = req.body?.data ?? req.body;

    console.log(`Webhook event for instance ${instanceName}:`, JSON.stringify(req.body).slice(0, 2000));

    // Only "Message" events carry a chat message — CONNECTION/QRCODE events
    // (also subscribed, for the connect flow) use a different shape and
    // aren't relevant here.
    if (payload?.event && payload.event !== "Message") return;

    const info = payload?.Info ?? {};
    const fromMe: boolean = info?.IsFromMe ?? false;
    const remoteJid: string | undefined = info?.Chat || info?.Sender;
    const externalId: string | undefined = info?.ID;
    const pushName: string | undefined = info?.PushName;
    const message = extractMessage(info);

    // Outbound messages are recorded where we send them (the command reply
    // below, or POST /api/whatsapp/send-message), not from the webhook —
    // Evolution Go echoes our own sends back here too, and there's no
    // reliable way yet to tell that apart from something typed on the
    // linked phone itself without risking duplicate chat rows.
    if (fromMe || !remoteJid || !message) return;

    const senderPhone = fromRemoteJid(remoteJid);

    if (instanceName === CENTRAL_INSTANCE_NAME) {
      await handleCentralMessage(senderPhone, message);
      return;
    }

    const business = await findBusinessByInstanceName(instanceName);
    if (!business) return;

    // Every inbound message is recorded so it shows up in the app's chat,
    // whether or not the sender is allowed to issue commands.
    await recordMessage({
      userId: business.user_id,
      phone: senderPhone,
      direction: "inbound",
      type: message.type,
      body: message.body,
      externalId,
      senderName: pushName,
    });

    if (!business.evolution_instance_token || message.type !== "text" || !message.body) return;

    if (!business.subscription_active) {
      const authorized = await isAuthorizedPhone(business.user_id, senderPhone);
      if (authorized) {
        const warning = "🔒 Seu acesso ao WashControl está inativo ou expirado. Para continuar usando a Central, renove ou escolha seu plano no painel do WashControl.";
        await evolution.sendText(business.evolution_instance_token, senderPhone, warning);
        await recordMessage({ userId: business.user_id, phone: senderPhone, direction: "outbound", body: warning });
      }
      return;
    }

    if (!business.whatsapp_auto_register_enabled) return;
    if (!(await isAuthorizedPhone(business.user_id, senderPhone))) return;

    const reply = await resolveReply(business.user_id, business.timezone, senderPhone, message.body);
    if (reply) {
      await evolution.sendText(business.evolution_instance_token, senderPhone, reply);
      await recordMessage({ userId: business.user_id, phone: senderPhone, direction: "outbound", body: reply });
    }
  } catch (err) {
    console.error("webhook error:", err);
  }
});
