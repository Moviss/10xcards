import { render, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  GlobalI18nBootstrap,
  I18N_RUNTIME_MARKER_ATTRIBUTE,
  I18N_RUNTIME_MARKER_VALUE,
  I18N_RUNTIME_STARTED_EVENT,
} from "./GlobalI18nBootstrap";

function resetRuntimeMarkers() {
  delete window.__10XCARDS_I18N_BOOTSTRAP_INITIALIZED__;
  delete window.__10XCARDS_I18N_RUNTIME_MARKER__;
  document.documentElement.removeAttribute(I18N_RUNTIME_MARKER_ATTRIBUTE);
}

describe("GlobalI18nBootstrap", () => {
  beforeEach(() => {
    resetRuntimeMarkers();
  });

  afterEach(() => {
    delete window.__10XCARDS_FEATURE_FLAGS__;
    resetRuntimeMarkers();
    vi.restoreAllMocks();
  });

  it("does not produce side-effects when i18n feature flag is OFF", async () => {
    window.__10XCARDS_FEATURE_FLAGS__ = { "feature.i18n_mvp": false };
    const dispatchEventSpy = vi.spyOn(window, "dispatchEvent");

    render(<GlobalI18nBootstrap />);

    await waitFor(() => {
      expect(document.documentElement.getAttribute(I18N_RUNTIME_MARKER_ATTRIBUTE)).toBeNull();
    });

    expect(window.__10XCARDS_I18N_BOOTSTRAP_INITIALIZED__).toBeUndefined();
    expect(window.__10XCARDS_I18N_RUNTIME_MARKER__).toBeUndefined();
    expect(dispatchEventSpy).not.toHaveBeenCalled();
  });

  it("initializes runtime marker and emits start event once when flag is ON", async () => {
    window.__10XCARDS_FEATURE_FLAGS__ = { "feature.i18n_mvp": true };
    const dispatchEventSpy = vi.spyOn(window, "dispatchEvent");

    render(<GlobalI18nBootstrap />);

    await waitFor(() => {
      expect(document.documentElement.getAttribute(I18N_RUNTIME_MARKER_ATTRIBUTE)).toBe(I18N_RUNTIME_MARKER_VALUE);
    });

    expect(window.__10XCARDS_I18N_BOOTSTRAP_INITIALIZED__).toBe(true);
    expect(window.__10XCARDS_I18N_RUNTIME_MARKER__).toBe(I18N_RUNTIME_MARKER_VALUE);
    expect(dispatchEventSpy).toHaveBeenCalledTimes(1);
    expect((dispatchEventSpy.mock.calls[0][0] as Event).type).toBe(I18N_RUNTIME_STARTED_EVENT);
  });

  it("is idempotent across multiple mounts", async () => {
    window.__10XCARDS_FEATURE_FLAGS__ = { "feature.i18n_mvp": true };
    const dispatchEventSpy = vi.spyOn(window, "dispatchEvent");

    const firstRender = render(<GlobalI18nBootstrap />);
    await waitFor(() => {
      expect(window.__10XCARDS_I18N_BOOTSTRAP_INITIALIZED__).toBe(true);
    });
    firstRender.unmount();

    render(<GlobalI18nBootstrap />);

    expect(dispatchEventSpy).toHaveBeenCalledTimes(1);
    expect(document.documentElement.getAttribute(I18N_RUNTIME_MARKER_ATTRIBUTE)).toBe(I18N_RUNTIME_MARKER_VALUE);
  });
});
