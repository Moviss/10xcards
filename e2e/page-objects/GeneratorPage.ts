import { type Page, type Locator } from "@playwright/test";

export class GeneratorPage {
  readonly page: Page;
  readonly sourceTextForm: Locator;
  readonly sourceTextTextarea: Locator;
  readonly generateButton: Locator;
  readonly stagingArea: Locator;
  readonly acceptAllButton: Locator;
  readonly saveAcceptedButton: Locator;
  readonly proposalCards: Locator;

  constructor(page: Page) {
    this.page = page;
    this.sourceTextForm = page.getByTestId("source-text-form");
    this.sourceTextTextarea = page.getByTestId("source-text-textarea");
    this.generateButton = page.getByTestId("generate-button");
    this.stagingArea = page.getByTestId("staging-area");
    this.acceptAllButton = page.getByTestId("accept-all-button");
    this.saveAcceptedButton = page.getByTestId("save-accepted-button");
    this.proposalCards = page.getByTestId("proposal-card");
  }

  async goto() {
    await this.page.goto("/generator");
  }

  async fillSourceText(text: string) {
    // Wait for textarea to be visible
    await this.sourceTextTextarea.waitFor({ state: "visible" });

    // Wait for React hydration by checking if character count element exists
    await this.page.waitForSelector('[data-testid="source-text-form"] p[aria-live="polite"]', {
      state: "visible",
      timeout: 5000,
    });

    // Additional wait for React to fully hydrate
    await this.page.waitForTimeout(500);

    // Focus and fill
    await this.sourceTextTextarea.focus();
    await this.sourceTextTextarea.fill(text);

    // Verify fill worked by checking character count changed from 0
    const countUpdated = await this.page
      .waitForFunction(
        () => {
          const countEl = document.querySelector('[data-testid="source-text-form"] p[aria-live="polite"]');
          if (!countEl) return false;
          const text = countEl.textContent || "";
          // Extract the number before the slash
          const match = text.match(/^([\d\s]+)\s*\//);
          if (!match) return false;
          const count = parseInt(match[1].replace(/\s/g, ""), 10);
          return count > 0;
        },
        { timeout: 3000 }
      )
      .catch(() => false);

    if (!countUpdated) {
      console.log("Fill did not update React state, trying type approach...");
      // Fallback: clear and type character by character (slower but more reliable)
      await this.sourceTextTextarea.click();
      await this.sourceTextTextarea.press("Control+a");
      await this.sourceTextTextarea.press("Backspace");
      // Type just enough to meet minimum (1000 chars) - faster than full text
      const textToType = text.length > 1100 ? text.substring(0, 1100) : text;
      await this.sourceTextTextarea.type(textToType, { delay: 0 });
    }
  }

  async clickGenerate() {
    // Wait for button to be enabled (text validation passed)
    await this.generateButton.waitFor({ state: "visible" });
    await this.page.waitForFunction(
      (selector) => {
        const button = document.querySelector(selector);
        return button && !button.hasAttribute("disabled");
      },
      '[data-testid="generate-button"]',
      { timeout: 10000 }
    );
    await this.generateButton.click();
  }

  async waitForProposals() {
    await this.stagingArea.waitFor({ state: "visible", timeout: 120000 });
  }

  async acceptAllProposals() {
    await this.acceptAllButton.click();
  }

  async saveAcceptedProposals() {
    await this.saveAcceptedButton.click();
  }

  async getProposalCount() {
    return this.proposalCards.count();
  }
}
