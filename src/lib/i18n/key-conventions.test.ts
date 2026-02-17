import { describe, expect, it } from "vitest";
import { buildTranslationKey, isTranslationKeyFormatValid, toPluralKey, translationKeyRegex } from "./key-conventions";

describe("translation key conventions", () => {
  it("accepts valid base keys", () => {
    expect(isTranslationKeyFormatValid("auth.login.submit_button.label")).toBe(true);
    expect(isTranslationKeyFormatValid("common.nav.generator.label")).toBe(true);
    expect(translationKeyRegex.test("errors.common.server_error.error")).toBe(true);
  });

  it("accepts plural suffix keys", () => {
    expect(isTranslationKeyFormatValid("flashcards.pagination.count.label_one")).toBe(true);
    expect(isTranslationKeyFormatValid("flashcards.pagination.count.label_few")).toBe(true);
    expect(isTranslationKeyFormatValid("flashcards.pagination.count.label_many")).toBe(true);
    expect(isTranslationKeyFormatValid("flashcards.pagination.count.label_other")).toBe(true);
  });

  it("rejects keys with invalid namespace or structure", () => {
    expect(isTranslationKeyFormatValid("billing.invoice.total.label")).toBe(false);
    expect(isTranslationKeyFormatValid("auth.login.submit-button.label")).toBe(false);
    expect(isTranslationKeyFormatValid("auth.login.submit_button.cta")).toBe(false);
    expect(isTranslationKeyFormatValid("auth.login.label")).toBe(false);
  });

  it("builds keys from typed parts", () => {
    const key = buildTranslationKey({
      module: "study",
      view: "answer",
      element: "remembered",
      type: "label",
    });

    expect(key).toBe("study.answer.remembered.label");
  });

  it("throws when segment is invalid", () => {
    expect(() =>
      buildTranslationKey({
        module: "study",
        view: "answer-section",
        element: "remembered",
        type: "label",
      })
    ).toThrow("Invalid translation key segment: view");
  });

  it("creates plural key variants", () => {
    expect(toPluralKey("label", "few")).toBe("label_few");
  });
});
