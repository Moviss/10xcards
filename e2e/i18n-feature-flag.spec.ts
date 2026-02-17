import { expect, test } from "@playwright/test";
import { FeatureFlagPage } from "./page-objects";

function isFeatureFlagEnabled(rawValue: string | undefined): boolean {
  if (!rawValue) {
    return false;
  }

  const normalized = rawValue.trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "on";
}

const i18nMvpEnabled = isFeatureFlagEnabled(process.env.FEATURE_I18N_MVP);

test.describe("i18n feature flag markers", () => {
  test("OFF mode keeps legacy runtime markers", async ({ page }) => {
    test.skip(i18nMvpEnabled, "OFF scenario requires FEATURE_I18N_MVP disabled.");

    const featureFlagPage = new FeatureFlagPage(page);
    await featureFlagPage.gotoLogin();

    await expect(page).toHaveURL("/login");
    await expect(featureFlagPage.loginHeading).toBeVisible();

    expect(await featureFlagPage.getLayoutFlagMode()).toBe("off");
    expect(await featureFlagPage.getWindowFeatureFlags()).toEqual({ "feature.i18n_mvp": false });
    expect(await featureFlagPage.getRuntimeMarker()).toBeNull();
  });

  test("ON mode enables runtime bootstrap markers", async ({ page }) => {
    test.skip(!i18nMvpEnabled, "ON scenario requires FEATURE_I18N_MVP enabled.");

    const featureFlagPage = new FeatureFlagPage(page);
    await featureFlagPage.gotoLogin();

    await expect(page).toHaveURL("/login");
    await expect(featureFlagPage.loginHeading).toBeVisible();

    expect(await featureFlagPage.getLayoutFlagMode()).toBe("on");
    expect(await featureFlagPage.getWindowFeatureFlags()).toEqual({ "feature.i18n_mvp": true });
    expect(await featureFlagPage.getRuntimeMarker()).toBe("on");
  });
});
