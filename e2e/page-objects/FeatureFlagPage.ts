import { type Locator, type Page } from "@playwright/test";

interface FeatureFlagsSnapshot {
  "feature.i18n_mvp": boolean;
}

export class FeatureFlagPage {
  readonly page: Page;
  readonly htmlElement: Locator;
  readonly loginHeading: Locator;

  constructor(page: Page) {
    this.page = page;
    this.htmlElement = page.locator("html");
    this.loginHeading = page.getByRole("heading", { name: "Zaloguj się" });
  }

  async gotoLogin() {
    await this.page.goto("/login");
  }

  async getLayoutFlagMode(): Promise<string | null> {
    return this.htmlElement.getAttribute("data-feature-i18n-mvp");
  }

  async getRuntimeMarker(): Promise<string | null> {
    return this.htmlElement.getAttribute("data-i18n-runtime");
  }

  async getWindowFeatureFlags(): Promise<FeatureFlagsSnapshot | null> {
    return this.page.evaluate(() => window.__10XCARDS_FEATURE_FLAGS__ ?? null);
  }
}
