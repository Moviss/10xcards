import { type Page, type Locator } from "@playwright/test";

export class RegisterPage {
  readonly page: Page;
  readonly form: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.form = page.getByTestId("register-form");
    this.emailInput = page.getByTestId("register-email-input");
    this.passwordInput = page.getByTestId("register-password-input");
    this.submitButton = page.getByTestId("register-submit-button");
    this.errorMessage = page.getByTestId("register-error-message");
  }

  async goto() {
    await this.page.goto("/register");
  }

  async register(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }
}
