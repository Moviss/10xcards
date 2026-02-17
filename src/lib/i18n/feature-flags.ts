import { defaultFeatureFlags, i18nMvpFeatureFlagKey } from "./contracts";

type FeatureFlagsEnv = Pick<ImportMetaEnv, "FEATURE_I18N_MVP">;

export type FeatureFlagsSnapshot = Record<typeof i18nMvpFeatureFlagKey, boolean>;

const ENABLED_FLAG_VALUES = new Set(["1", "true", "on"]);

function parseFeatureFlagValue(rawValue: string | null | undefined): boolean {
  if (!rawValue) {
    return false;
  }

  return ENABLED_FLAG_VALUES.has(rawValue.trim().toLowerCase());
}

function createSnapshot(i18nMvpEnabled: boolean): FeatureFlagsSnapshot {
  return {
    [i18nMvpFeatureFlagKey]: i18nMvpEnabled,
  };
}

function sanitizeSnapshot(snapshot: Partial<FeatureFlagsSnapshot> | null | undefined): FeatureFlagsSnapshot {
  if (!snapshot) {
    return { ...defaultFeatureFlags };
  }

  return createSnapshot(snapshot[i18nMvpFeatureFlagKey] === true);
}

function getDefaultWindow(): Window | undefined {
  return typeof window === "undefined" ? undefined : window;
}

export function getServerFeatureFlags(env: FeatureFlagsEnv = import.meta.env): FeatureFlagsSnapshot {
  return createSnapshot(parseFeatureFlagValue(env.FEATURE_I18N_MVP));
}

export function getClientFeatureFlags(win: Window | undefined = getDefaultWindow()): FeatureFlagsSnapshot {
  if (!win) {
    return { ...defaultFeatureFlags };
  }

  return sanitizeSnapshot(win.__10XCARDS_FEATURE_FLAGS__);
}

export function isI18nMvpEnabled(snapshot: FeatureFlagsSnapshot): boolean {
  return snapshot[i18nMvpFeatureFlagKey];
}
