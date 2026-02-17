import { describe, expect, it } from "vitest";
import {
  fallbackLocale,
  i18nNamespaces,
  normalizeLocale,
  pluralCategoriesByLocale,
  resolveFirstVisitLocale,
  supportedLocales,
} from "./contracts";

describe("i18n contracts", () => {
  it("defines expected locales and fallback", () => {
    expect(supportedLocales).toEqual(["pl", "en"]);
    expect(fallbackLocale).toBe("en");
  });

  it("defines expected namespaces", () => {
    expect(i18nNamespaces).toEqual([
      "common",
      "landing",
      "auth",
      "generator",
      "flashcards",
      "study",
      "errors",
      "validation",
    ]);
  });

  it("resolves first visit locale from navigator language", () => {
    expect(resolveFirstVisitLocale("pl-PL")).toBe("pl");
    expect(resolveFirstVisitLocale("pl")).toBe("pl");
    expect(resolveFirstVisitLocale("en-US")).toBe("en");
    expect(resolveFirstVisitLocale("de-DE")).toBe("en");
    expect(resolveFirstVisitLocale(undefined)).toBe("en");
  });

  it("normalizes locale to supported values", () => {
    expect(normalizeLocale("pl-PL")).toBe("pl");
    expect(normalizeLocale("en-US")).toBe("en");
    expect(normalizeLocale("EN")).toBe("en");
    expect(normalizeLocale("de-DE")).toBeNull();
    expect(normalizeLocale(null)).toBeNull();
  });

  it("uses CLDR plural categories from step 1 contract", () => {
    expect(pluralCategoriesByLocale.pl).toEqual(["one", "few", "many", "other"]);
    expect(pluralCategoriesByLocale.en).toEqual(["one", "other"]);
  });
});
