import { useEffect } from "react";
import { getClientFeatureFlags, isI18nMvpEnabled } from "@/lib/i18n";

export const I18N_RUNTIME_MARKER_ATTRIBUTE = "data-i18n-runtime";
export const I18N_RUNTIME_MARKER_VALUE = "on";
export const I18N_RUNTIME_STARTED_EVENT = "10xcards:i18n-runtime-start";

function getBrowserWindow(): Window | undefined {
  return typeof window === "undefined" ? undefined : window;
}

export function runGlobalI18nBootstrap(win: Window | undefined = getBrowserWindow()): void {
  if (!win) {
    return;
  }

  if (!isI18nMvpEnabled(getClientFeatureFlags(win))) {
    return;
  }

  if (win.__10XCARDS_I18N_BOOTSTRAP_INITIALIZED__) {
    return;
  }

  win.__10XCARDS_I18N_BOOTSTRAP_INITIALIZED__ = true;
  win.__10XCARDS_I18N_RUNTIME_MARKER__ = I18N_RUNTIME_MARKER_VALUE;
  win.document.documentElement.setAttribute(I18N_RUNTIME_MARKER_ATTRIBUTE, I18N_RUNTIME_MARKER_VALUE);
  win.dispatchEvent(new CustomEvent(I18N_RUNTIME_STARTED_EVENT));
}

export function GlobalI18nBootstrap() {
  useEffect(() => {
    runGlobalI18nBootstrap();
  }, []);

  return null;
}
