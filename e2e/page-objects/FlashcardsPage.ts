import { type Page, type Locator } from "@playwright/test";

export class FlashcardsPage {
  readonly page: Page;
  readonly container: Locator;
  readonly table: Locator;
  readonly rows: Locator;

  constructor(page: Page) {
    this.page = page;
    this.container = page.getByTestId("flashcards-container");
    this.table = page.getByTestId("flashcards-table");
    this.rows = page.getByTestId("flashcard-row");
  }

  async goto() {
    await this.page.goto("/flashcards");
  }

  async waitForFlashcards() {
    await this.container.waitFor({ state: "visible" });
    // Wait for loading state to disappear
    await this.page.getByLabel("Ładowanie fiszek").waitFor({ state: "hidden", timeout: 10000 });
    // Wait for at least one flashcard row to appear
    await this.rows.first().waitFor({ state: "visible", timeout: 10000 });
  }

  async getFlashcardCount() {
    return this.rows.count();
  }

  async hasFlashcards() {
    const count = await this.getFlashcardCount();
    return count > 0;
  }
}
