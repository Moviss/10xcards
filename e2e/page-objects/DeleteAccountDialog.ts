import { type Page, type Locator } from "@playwright/test";

export class DeleteAccountDialog {
  readonly page: Page;
  readonly dialog: Locator;
  readonly confirmInput: Locator;
  readonly confirmButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.dialog = page.getByTestId("delete-account-dialog");
    this.confirmInput = page.getByTestId("delete-confirm-input");
    this.confirmButton = page.getByTestId("delete-account-confirm-button");
  }

  async confirmDeletion() {
    await this.confirmInput.fill("USUŃ");
    await this.confirmButton.click();
  }

  async isVisible() {
    return this.dialog.isVisible();
  }
}
