import type { Locale } from "@/i18n/translations";

const BCP47: Record<Locale, string> = { de: "de-DE", en: "en-US" };

export function formatDateLongLocale(date: Date | string, locale: Locale): string {
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat(BCP47[locale], {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(d);
}

/** e.g. "11. Mai, 12:03" (de) or "May 11, 12:03" (en) */
export function formatDateShortMonthWithTimeLocale(date: Date | string, locale: Locale): string {
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat(BCP47[locale], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}
