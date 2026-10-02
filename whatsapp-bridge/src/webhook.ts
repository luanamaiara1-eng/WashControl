import { Router } from "express";
import * as evolution from "./evolution.js";
import { findBusinessByInstance } from "./business.js";
import { fromRemoteJid } from "./phone.js";
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

function extractText(data: any): string | null {
  const message = data?.message ?? {};
  return (
    message.conversation ??
    message.extendedTextMessage?.text ??
    message.ephemeralMessage?.message?.conversation ??
    null
  );
}

async function resolveReply(userId: string, timezone: string | null, text: string): Promise<string | null> {
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
      : "Não entendi 🤔. Pra cadastrar um serviço manda assim:\n\n*cadastrar serviço Nome, Preço, Duração em minutos (opcional)*\n\nEx: cadastrar serviço Lavagem Completa, 80, 60";
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

webhookRouter.post("/evolution/:instanceName", async (req, res) => {
  // Always ack fast so the gateway doesn't retry; errors are logged, not surfaced.
  res.status(200).json({ ok: true });

  try {
    const { instanceName } = req.params;
    const data = req.body?.data ?? req.body;

    const fromMe: boolean = data?.key?.fromMe ?? false;
    const remoteJid: string | undefined = data?.key?.remoteJid;
    const text = extractText(data);

    if (fromMe || !remoteJid || !text) return;

    const business = await findBusinessByInstance(instanceName);
    if (!business || !business.whatsapp_auto_register_enabled) return;

    const senderPhone = fromRemoteJid(remoteJid);
    const reply = await resolveReply(business.user_id, business.timezone, senderPhone, text);
    if (reply) await evolution.sendText(instanceName, senderPhone, reply);
  } catch (err) {
    console.error("webhook error:", err);
  }
});
