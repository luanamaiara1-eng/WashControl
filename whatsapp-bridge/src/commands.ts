const TRIGGER = /^\s*(cadastrar|novo)\s+client[ea]\s*[:\-]?\s*/i;

export interface RegisterClientCommand {
  name: string;
  phone: string;
  car: string | null;
}

/**
 * Parses commands like:
 *   "cadastrar cliente João Silva, 11999998888, Onix Prata"
 *   "novo cliente: Maria Souza, 11988887777"
 * Fields are comma-separated: nome, telefone, carro (carro é opcional).
 */
export function parseRegisterClientCommand(text: string): RegisterClientCommand | null {
  if (!TRIGGER.test(text)) return null;

  const rest = text.replace(TRIGGER, "").trim();
  const parts = rest.split(",").map((p) => p.trim()).filter(Boolean);

  const [name, phone, car] = parts;
  if (!name || !phone) return null;

  return { name, phone, car: car || null };
}

export function isRegisterClientTrigger(text: string): boolean {
  return TRIGGER.test(text);
}
