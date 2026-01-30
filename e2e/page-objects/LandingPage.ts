import { type Page, type Locator } from "@playwright/test";

export class LandingPage {
  readonly page: Page;
  readonly registerButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.registerButton = page.getByTestId("register-button");
  }

  async goto() {
    await this.page.goto("/");
  }

  async clickRegister() {
    await this.registerButton.click();
  }
}
