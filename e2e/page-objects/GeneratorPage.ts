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
    await this.sourceTextTextarea.fill(text);
  }

  async clickGenerate() {
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
