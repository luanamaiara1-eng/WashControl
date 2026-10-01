// WashControl stores client phones as local Brazilian digits (DDD + number,
// no country code) — see src/components/appointments/ServiceNote.tsx which
// builds wa.me links as `55${clientPhone}`. We mirror that convention here.

export function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

/** Normalizes a phone number as typed by a user into WashControl's stored format (no "55"). */
export function toLocalPhone(raw: string): string {
  const digits = digitsOnly(raw);
  return digits.startsWith("55") && digits.length > 11 ? digits.slice(2) : digits;
}

/** Builds the WhatsApp JID EvolutionGo expects from a stored local phone number. */
export function toWhatsAppNumber(localPhone: string): string {
  const digits = digitsOnly(localPhone);
  return digits.startsWith("55") ? digits : `55${digits}`;
}

/** Extracts the local phone from an inbound WhatsApp JID like "5511999998888@s.whatsapp.net". */
export function fromRemoteJid(remoteJid: string): string {
  const digits = digitsOnly(remoteJid.split("@")[0] ?? "");
  return toLocalPhone(digits);
}

export function isValidBrazilianPhone(localPhone: string): boolean {
  return /^\d{10,11}$/.test(localPhone);
}
