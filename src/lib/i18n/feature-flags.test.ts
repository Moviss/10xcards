import { describe, expect, it } from "vitest";
import { i18nMvpFeatureFlagKey } from "./contracts";
import { getClientFeatureFlags, getServerFeatureFlags, isI18nMvpEnabled } from "./feature-flags";

describe("i18n feature flags", () => {
  describe("getServerFeatureFlags", () => {
    it("returns safe-mode OFF when env value is undefined", () => {
      const snapshot = getServerFeatureFlags({ FEATURE_I18N_MVP: undefined });

      expect(snapshot[i18nMvpFeatureFlagKey]).toBe(false);
      expect(isI18nMvpEnabled(snapshot)).toBe(false);
    });

    it("returns OFF for explicit 0", () => {
      const snapshot = getServerFeatureFlags({ FEATURE_I18N_MVP: "0" });

      expect(snapshot[i18nMvpFeatureFlagKey]).toBe(false);
    });

    it("returns ON for explicit 1", () => {
      const snapshot = getServerFeatureFlags({ FEATURE_I18N_MVP: "1" });

      expect(snapshot[i18nMvpFeatureFlagKey]).toBe(true);
    });

    it("returns ON for true and on (case-insensitive)", () => {
      const trueSnapshot = getServerFeatureFlags({ FEATURE_I18N_MVP: "true" });
      const onSnapshot = getServerFeatureFlags({ FEATURE_I18N_MVP: "ON" });

      expect(trueSnapshot[i18nMvpFeatureFlagKey]).toBe(true);
      expect(onSnapshot[i18nMvpFeatureFlagKey]).toBe(true);
    });

    it("returns OFF for invalid values", () => {
      const snapshot = getServerFeatureFlags({ FEATURE_I18N_MVP: "yesplease" });

      expect(snapshot[i18nMvpFeatureFlagKey]).toBe(false);
    });
  });

  describe("getClientFeatureFlags", () => {
    it("reads snapshot from window", () => {
      const snapshot = getClientFeatureFlags({
        __10XCARDS_FEATURE_FLAGS__: {
          "feature.i18n_mvp": true,
        },
      } as Window);

      expect(snapshot[i18nMvpFeatureFlagKey]).toBe(true);
    });

    it("falls back to OFF when window snapshot is missing", () => {
      const snapshot = getClientFeatureFlags({} as Window);

      expect(snapshot[i18nMvpFeatureFlagKey]).toBe(false);
    });

    it("falls back to OFF when window is unavailable", () => {
      const snapshot = getClientFeatureFlags(undefined);

      expect(snapshot[i18nMvpFeatureFlagKey]).toBe(false);
    });
  });
});
