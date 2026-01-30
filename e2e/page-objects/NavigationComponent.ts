import { type Page, type Locator } from "@playwright/test";

export class NavigationComponent {
  readonly page: Page;
  readonly generatorLink: Locator;
  readonly flashcardsLink: Locator;
  readonly studyLink: Locator;
  readonly accountDropdownTrigger: Locator;
  readonly deleteAccountOption: Locator;

  constructor(page: Page) {
    this.page = page;
    this.generatorLink = page.getByTestId("nav-link-generator");
    this.flashcardsLink = page.getByTestId("nav-link-flashcards");
    this.studyLink = page.getByTestId("nav-link-study");
    this.accountDropdownTrigger = page.getByTestId("account-dropdown-trigger");
    this.deleteAccountOption = page.getByTestId("account-delete-option");
  }

  async goToGenerator() {
    await this.generatorLink.click();
  }

  async goToFlashcards() {
    await this.flashcardsLink.click();
  }

  async goToStudy() {
    await this.studyLink.click();
  }

  async openAccountDropdown() {
    await this.accountDropdownTrigger.click();
  }

  async clickDeleteAccount() {
    await this.openAccountDropdown();
    await this.deleteAccountOption.click();
  }
}
