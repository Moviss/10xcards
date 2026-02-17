import type { SupportedLocale } from "./contracts";

export interface GlossaryEntry {
  id: string;
  pl: string;
  en: string;
  note: string;
}

export const glossaryV1: readonly GlossaryEntry[] = [
  { id: "flashcard", pl: "fiszka", en: "flashcard", note: "Primary domain entity." },
  { id: "flashcard_front", pl: "przod fiszki", en: "flashcard front", note: "Use front/back naming consistently." },
  { id: "flashcard_back", pl: "tyl fiszki", en: "flashcard back", note: "Use front/back naming consistently." },
  { id: "study_session", pl: "sesja nauki", en: "study session", note: "Name for /study flow." },
  { id: "review", pl: "powtorka", en: "review", note: "Do not replace with revision." },
  { id: "new_flashcard", pl: "nowa fiszka", en: "new flashcard", note: "Cards with is_new=true." },
  {
    id: "flashcard_generator",
    pl: "generator fiszek",
    en: "flashcard generator",
    note: "Name for /generator module.",
  },
  { id: "source_text", pl: "tekst zrodlowy", en: "source text", note: "AI input text." },
  { id: "proposal", pl: "propozycja fiszki", en: "flashcard proposal", note: "Draft in staging area." },
  { id: "remembered", pl: "zapamietane", en: "remembered", note: "Positive answer state." },
  { id: "dont_remember", pl: "nie pamietam", en: "don't remember", note: "Negative answer CTA in study flow." },
  { id: "ease_factor", pl: "wspolczynnik latwosci", en: "ease factor", note: "SM-2 term." },
  { id: "interval", pl: "interwal", en: "interval", note: "SM-2 term in days." },
  { id: "next_review", pl: "nastepna powtorka", en: "next review", note: "Planned review date." },
  { id: "log_out", pl: "wyloguj", en: "log out", note: "Session action." },
  { id: "delete_account", pl: "usun konto", en: "delete account", note: "Destructive account action." },
  { id: "server_error", pl: "blad serwera", en: "server error", note: "Generic runtime failure message." },
] as const;

export const copyStyleRules = [
  "Use plain and instructional language.",
  "CTA text uses imperative verb and max 3 words.",
  "Error copy explains what happened and what to do next.",
  "Validation messages stay short and field-scoped.",
  "Use only glossary terms for domain language.",
  "Pluralization uses i18next count rules, never manual branching in UI.",
  "A11y copy follows the same language and tone rules as visible UI text.",
] as const;

export type StudySummaryTranslationPolicy = "adaptive";

export const studySummaryTranslationPolicy: StudySummaryTranslationPolicy = "adaptive";

export const deleteAccountConfirmationTokenByLocale = {
  pl: "USUŃ",
  en: "DELETE",
} as const satisfies Record<SupportedLocale, string>;

export function getDeleteAccountConfirmationToken(locale: SupportedLocale): string {
  return deleteAccountConfirmationTokenByLocale[locale];
}
