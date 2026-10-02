export function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

/** Finds the item whose label best matches a free-text query (accent/case-insensitive). */
export function findBestMatch<T>(query: string, items: T[], getLabel: (item: T) => string): T | null {
  const q = normalize(query);
  if (!q || !items.length) return null;

  const exact = items.find((item) => normalize(getLabel(item)) === q);
  if (exact) return exact;

  const candidates = items.filter((item) => {
    const label = normalize(getLabel(item));
    return label.includes(q) || q.includes(label);
  });
  if (!candidates.length) return null;

  // prefer the most specific (longest label) match among candidates
  return candidates.sort((a, b) => normalize(getLabel(b)).length - normalize(getLabel(a)).length)[0];
}

/** Parses a Brazilian-formatted number ("80", "80,00", "1.250,50") into a float. */
export function parseBrazilianNumber(raw: string): number | null {
  const cleaned = raw.replace(/[^\d.,]/g, "");
  if (!cleaned) return null;

  let normalized = cleaned;
  if (cleaned.includes(",") && cleaned.includes(".")) {
    normalized = cleaned.replace(/\./g, "").replace(",", ".");
  } else if (cleaned.includes(",")) {
    normalized = cleaned.replace(",", ".");
  }

  const value = parseFloat(normalized);
  return Number.isFinite(value) ? value : null;
}

const TIME_REGEX = /(?:[àa]s\s+)?\b(\d{1,2})[:h](\d{2})?\b/i;

/** Matches a HH:MM time from phrases like "às 8h", "as 14:30", "8h30", returning the matched text too (so callers can strip it out). */
export function matchTime(text: string): { time: string; raw: string } | null {
  const match = text.match(TIME_REGEX);
  if (!match) return null;
  const hour = parseInt(match[1], 10);
  const minute = match[2] ? parseInt(match[2], 10) : 0;
  if (hour > 23 || minute > 59) return null;
  return { time: `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`, raw: match[0] };
}

export function parseTime(text: string): string | null {
  return matchTime(text)?.time ?? null;
}

function todayInTimezone(timeZone: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(
    new Date()
  );
  const map = Object.fromEntries(parts.map((p) => [p.type, p.value]));
  return `${map.year}-${map.month}-${map.day}`;
}

/** Resolves "hoje"/"amanhã" (default: hoje) to a yyyy-mm-dd date in the business's timezone. */
export function resolveDate(text: string, timeZone: string): string {
  const todayStr = todayInTimezone(timeZone || "America/Sao_Paulo");
  if (!/amanh[ãa]/i.test(text)) return todayStr;

  const [y, m, d] = todayStr.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + 1)).toISOString().slice(0, 10);
}
