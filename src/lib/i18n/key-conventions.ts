import { i18nNamespaces, type I18nNamespace, type PluralCategory } from "./contracts";

export const translationKeyBaseTypes = [
  "title",
  "text",
  "label",
  "placeholder",
  "hint",
  "aria",
  "error",
  "success",
  "loading",
  "helper",
] as const;

export const translationPluralSuffixes = ["one", "few", "many", "other"] as const;

export type TranslationKeyBaseType = (typeof translationKeyBaseTypes)[number];
export type TranslationPluralSuffix = (typeof translationPluralSuffixes)[number];
export type TranslationKeyType = TranslationKeyBaseType | `${TranslationKeyBaseType}_${TranslationPluralSuffix}`;

const segmentPattern = "[a-z]+(?:_[a-z]+)*";
const modulePattern = i18nNamespaces.join("|");
const baseTypePattern = translationKeyBaseTypes.join("|");
const pluralSuffixPattern = translationPluralSuffixes.join("|");

const segmentRegex = new RegExp(`^${segmentPattern}$`);

export const translationKeyRegex = new RegExp(
  `^(?:${modulePattern})\\.${segmentPattern}\\.${segmentPattern}\\.(?:${baseTypePattern})(?:_(?:${pluralSuffixPattern}))?$`
);

export interface TranslationKeyParts {
  module: I18nNamespace;
  view: string;
  element: string;
  type: TranslationKeyType;
}

function isValidSegment(segment: string): boolean {
  return segmentRegex.test(segment);
}

export function isTranslationKeyFormatValid(key: string): boolean {
  return translationKeyRegex.test(key);
}

export function buildTranslationKey(parts: TranslationKeyParts): string {
  if (!isValidSegment(parts.view)) {
    throw new Error("Invalid translation key segment: view");
  }

  if (!isValidSegment(parts.element)) {
    throw new Error("Invalid translation key segment: element");
  }

  return `${parts.module}.${parts.view}.${parts.element}.${parts.type}`;
}

export function toPluralKey(type: TranslationKeyBaseType, suffix: PluralCategory): TranslationKeyType {
  return `${type}_${suffix}`;
}
