import { matchTime, parseBrazilianNumber, parseTime } from "./text.js";
import { isValidBrazilianPhone, toLocalPhone } from "./phone.js";

export const HELP_MESSAGE = `🤖 *Comandos disponíveis no WhatsApp*

*Cadastrar cliente*
cadastrar cliente Nome, Telefone (opcional), Carro (opcional), Placa (opcional)
Se o telefone não for informado, uso automaticamente o WhatsApp que enviou a mensagem.

Exemplos:
cadastrar cliente João, 11999998888, Jetta, ABC1D23
cadastrar cliente João, Jetta
cadastrar cliente João, ABC1D23

*Cadastrar serviço*
cadastrar serviço Nome, Preço, Duração em minutos (opcional)

*Agendar*
Nome do cliente agendou Nome do serviço pro Carro às HH:MM valor Valor
(ou: agendar Nome, Serviço, Carro, HH:MM, Valor)

*Vale (adiantamento) pro funcionário*
vale Nome do funcionário, Valor

*Pagamento de funcionário*
pagamento funcionário Nome do funcionário, Valor

Manda *ajuda* a qualquer momento pra ver essa lista de novo.`;

// ---- ajuda ----
export function isHelpTrigger(text: string): boolean {
  return /^\s*(ajuda|menu|comandos)\s*$/i.test(text);
}

// ---- cadastrar cliente ----
const CLIENT_TRIGGER = /^\s*(cadastrar|novo)\s+client[ea]\s*[:\-]?\s*/i;

export interface RegisterClientCommand {
  name: string;
  phone: string | null;
  vehicleText: string | null;
  plate: string | null;
}

export function isRegisterClientTrigger(text: string): boolean {
  return CLIENT_TRIGGER.test(text);
}

function looksLikePlate(value: string): boolean {
  const compact = value.replace(/[^a-z0-9]/gi, "").toUpperCase();
  return /^[A-Z]{3}\d{4}$/.test(compact) || /^[A-Z]{3}\d[A-Z]\d{2}$/.test(compact);
}

export function parseRegisterClientCommand(text: string): RegisterClientCommand | null {
  if (!CLIENT_TRIGGER.test(text)) return null;

  const parts = text.replace(CLIENT_TRIGGER, "").trim().split(",").map((p) => p.trim()).filter(Boolean);
  const [name, second, third, fourth] = parts;
  if (!name) return null;

  let phone: string | null = null;
  let vehicleText: string | null = null;
  let plate: string | null = null;

  if (second && isValidBrazilianPhone(toLocalPhone(second))) {
    phone = toLocalPhone(second);
    vehicleText = third || null;
    plate = fourth || null;
  } else if (second && looksLikePlate(second)) {
    plate = second.toUpperCase();
    vehicleText = third || null;
  } else {
    vehicleText = second || null;
    plate = third || null;
  }

  return { name, phone, vehicleText, plate };
}

// ---- cadastrar serviço ----
const SERVICE_TRIGGER = /^\s*cadastrar\s+servi[cç]o\s*[:\-]?\s*/i;

export interface RegisterServiceCommand {
  name: string;
  price: number;
  durationMinutes: number;
}

export function isRegisterServiceTrigger(text: string): boolean {
  return SERVICE_TRIGGER.test(text);
}

export function parseRegisterServiceCommand(text: string): RegisterServiceCommand | null {
  if (!SERVICE_TRIGGER.test(text)) return null;
  const parts = text.replace(SERVICE_TRIGGER, "").trim().split(",").map((p) => p.trim()).filter(Boolean);
  const [name, priceText, durationText] = parts;
  if (!name || !priceText) return null;

  const price = parseBrazilianNumber(priceText);
  if (price === null) return null;

  const duration = durationText ? parseInt(durationText, 10) : 60;
  return { name, price, durationMinutes: Number.isFinite(duration) && duration > 0 ? duration : 60 };
}

// ---- agendar ----
const SCHEDULE_VERB = /\b(agendar|agendou|marcar|marcou)\b/i;

export interface ScheduleCommand {
  clientText: string;
  serviceText: string | null;
  vehicleText: string | null;
  time: string | null;
  value: number | null;
  rawText: string;
}

export function isScheduleTrigger(text: string): boolean {
  return SCHEDULE_VERB.test(text);
}

export function parseScheduleCommand(text: string): ScheduleCommand | null {
  const match = text.match(SCHEDULE_VERB);
  if (!match || match.index === undefined) return null;

  // Verb at the very start: structured format "agendar Cliente, Serviço, Carro, HH:MM, Valor"
  if (match.index === 0) {
    const rest = text.slice(match[0].length).replace(/^[:\-]\s*/, "").trim();
    const parts = rest.split(",").map((p) => p.trim()).filter(Boolean);
    const [clientText, serviceText, vehicleText, timeText, valueText] = parts;
    if (!clientText) return null;

    return {
      clientText,
      serviceText: serviceText || null,
      vehicleText: vehicleText || null,
      time: timeText ? parseTime(timeText) : null,
      value: valueText ? parseBrazilianNumber(valueText) : null,
      rawText: text,
    };
  }

  // Natural phrasing: "Nome agendou Serviço pro Carro às HH:MM valor Valor"
  const clientText = text.slice(0, match.index).trim();
  if (!clientText) return null;
  let rest = text.slice(match.index + match[0].length).trim();

  const timeMatch = matchTime(rest);
  const time = timeMatch?.time ?? null;
  if (timeMatch) rest = rest.replace(timeMatch.raw, " ");

  const valueMatch = rest.match(/valor\s*(?:r\$)?\s*([\d.,]+)/i);
  const value = valueMatch ? parseBrazilianNumber(valueMatch[1]) : null;
  if (valueMatch) rest = rest.replace(valueMatch[0], " ");

  const vehicleMatch = rest.match(/\b(?:pro|pra o|pra|para o|para)\s+([a-zà-ú0-9 ]+)/i);
  const vehicleText = vehicleMatch ? vehicleMatch[1].trim() || null : null;
  if (vehicleMatch) rest = rest.replace(vehicleMatch[0], " ");

  const serviceText = rest.replace(/[,.]/g, " ").replace(/\s+/g, " ").trim() || null;

  return { clientText, serviceText, vehicleText, time, value, rawText: text };
}

// ---- vale (adiantamento) ----
const ADVANCE_TRIGGER = /^\s*vale\s*[:\-]?\s*/i;

export interface MoneyCommand {
  employeeText: string;
  value: number;
}

export function isAdvanceTrigger(text: string): boolean {
  return ADVANCE_TRIGGER.test(text);
}

export function parseAdvanceCommand(text: string): MoneyCommand | null {
  if (!ADVANCE_TRIGGER.test(text)) return null;
  return parseEmployeeMoneyCommand(text.replace(ADVANCE_TRIGGER, ""));
}

// ---- pagamento de funcionário ----
const PAYMENT_TRIGGER = /^\s*pagamento(?:\s+(?:de\s+)?funcion[áa]ri[oa])?\s*[:\-]?\s*/i;

export function isPaymentTrigger(text: string): boolean {
  return PAYMENT_TRIGGER.test(text);
}

export function parsePaymentCommand(text: string): MoneyCommand | null {
  if (!PAYMENT_TRIGGER.test(text)) return null;
  return parseEmployeeMoneyCommand(text.replace(PAYMENT_TRIGGER, ""));
}

function parseEmployeeMoneyCommand(rest: string): MoneyCommand | null {
  const trimmed = rest.trim();
  if (!trimmed) return null;

  let employeeText: string | undefined;
  let valueText: string | undefined;

  if (trimmed.includes(",")) {
    [employeeText, valueText] = trimmed.split(",").map((p) => p.trim());
  } else {
    // allow "vale Carlos 50" without a comma — the last token is the amount
    const match = trimmed.match(/^(.*\S)\s+([\d.,]+)$/);
    if (match) {
      employeeText = match[1].trim();
      valueText = match[2].trim();
    }
  }

  if (!employeeText || !valueText) return null;

  const value = parseBrazilianNumber(valueText);
  if (value === null || value <= 0) return null;

  return { employeeText, value };
}
