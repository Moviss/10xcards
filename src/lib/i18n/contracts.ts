export const supportedLocales = ["pl", "en"] as const;
export type SupportedLocale = (typeof supportedLocales)[number];

export const fallbackLocale: SupportedLocale = "en";

export const intlLocaleByLanguage = {
  pl: "pl-PL",
  en: "en-US",
} as const satisfies Record<SupportedLocale, string>;

export type IntlLocale = (typeof intlLocaleByLanguage)[SupportedLocale];

export const localePreferenceOrder = ["profile", "storage", "navigator"] as const;
export type LocalePreferenceSource = (typeof localePreferenceOrder)[number];

export const i18nNamespaces = [
  "common",
  "landing",
  "auth",
  "generator",
  "flashcards",
  "study",
  "errors",
  "validation",
] as const;
export type I18nNamespace = (typeof i18nNamespaces)[number];

export type PluralCategory = "one" | "few" | "many" | "other";

export const pluralCategoriesByLocale = {
  pl: ["one", "few", "many", "other"],
  en: ["one", "other"],
} as const satisfies Record<SupportedLocale, readonly PluralCategory[]>;

export const missingTranslationKey = "errors.common.translation_missing";

export const missingTranslationResolutionOrder = ["active_locale", "fallback_en", "translation_missing_key"] as const;

export function isSupportedLocale(value: string | null | undefined): value is SupportedLocale {
  if (!value) {
    return false;
  }

  return supportedLocales.includes(value as SupportedLocale);
}

export function resolveFirstVisitLocale(navigatorLanguage: string | null | undefined): SupportedLocale {
  const normalized = navigatorLanguage?.toLowerCase().trim();
  if (!normalized) {
    return fallbackLocale;
  }

  return normalized.startsWith("pl") ? "pl" : "en";
}

export function normalizeLocale(value: string | null | undefined): SupportedLocale | null {
  if (!value) {
    return null;
  }

  const primaryTag = value.toLowerCase().trim().split("-")[0];
  return isSupportedLocale(primaryTag) ? primaryTag : null;
}
