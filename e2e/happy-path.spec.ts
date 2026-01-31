import { test, expect } from "@playwright/test";
import {
  LandingPage,
  RegisterPage,
  NavigationComponent,
  DeleteAccountDialog,
  GeneratorPage,
  FlashcardsPage,
} from "./page-objects";

// Sample text for flashcard generation (min 1000 characters)
const SAMPLE_SOURCE_TEXT = `
Sztuczna inteligencja (AI) to dziedzina informatyki zajmująca się tworzeniem systemów zdolnych do wykonywania zadań wymagających ludzkiej inteligencji. Obejmuje to rozpoznawanie mowy, podejmowanie decyzji, tłumaczenie językowe i rozpoznawanie obrazów.

Uczenie maszynowe (ML) jest podzbiorem AI, który wykorzystuje algorytmy do analizy danych, uczenia się na ich podstawie i podejmowania decyzji. Sieci neuronowe, inspirowane strukturą ludzkiego mózgu, są kluczowym elementem głębokiego uczenia.

Historia AI sięga lat 50. XX wieku, kiedy Alan Turing zaproponował test na inteligencję maszynową. Od tego czasu dziedzina przeszła wiele okresów rozwoju i zastoju, znanych jako "zimy AI".

Współczesne systemy AI wykorzystują ogromne ilości danych i mocy obliczeniowej. Modele językowe, takie jak GPT, potrafią generować tekst, odpowiadać na pytania i prowadzić konwersacje na poziomie zbliżonym do ludzkiego.

Etyka AI staje się coraz ważniejszym tematem. Kwestie takie jak prywatność danych, stronniczość algorytmów i wpływ na rynek pracy wymagają starannego rozważenia podczas rozwoju systemów AI.

Przyszłość AI obejmuje rozwój sztucznej superinteligencji (ASI), która mogłaby przewyższyć ludzkie zdolności poznawcze. Naukowcy debatują nad potencjalnymi korzyściami i zagrożeniami związanymi z tą technologią.

Zastosowania AI są wszechobecne: od asystentów głosowych przez systemy rekomendacji po autonomiczne pojazdy. Każda z tych aplikacji wymaga specjalistycznych algorytmów i danych treningowych.
`;

// Generate unique email for each test run
function generateTestEmail(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `e2e-test-${timestamp}-${random}@example.com`;
}

// Test password - user is deleted at the end of the test
const TEST_PASSWORD = "TestPassword123!";

test.describe("Happy Path - User Registration to Account Deletion", () => {
  test("complete user journey: register, generate flashcards, verify, and delete account", async ({ page }) => {
    // Generate unique email for this test run
    const email = generateTestEmail();

    console.log(`Testing with email: ${email}`);

    // Initialize page objects
    const landingPage = new LandingPage(page);
    const registerPage = new RegisterPage(page);
    const navigation = new NavigationComponent(page);
    const deleteAccountDialog = new DeleteAccountDialog(page);
    const generatorPage = new GeneratorPage(page);
    const flashcardsPage = new FlashcardsPage(page);

    // Step 1: Go to landing page
    await landingPage.goto();
    await expect(page).toHaveURL("/");

    // Step 2: Click register button
    await landingPage.clickRegister();
    await expect(page).toHaveURL("/register");

    // Step 3: Fill registration form and submit
    await registerPage.register(email, TEST_PASSWORD);

    // Wait for redirect after successful registration
    await expect(page).toHaveURL("/generator", { timeout: 10000 });

    // Step 4: Click Generator link in navigation (verify navigation works)
    await navigation.goToGenerator();
    await expect(page).toHaveURL("/generator");

    // Step 5: Fill textarea with source text
    await generatorPage.fillSourceText(SAMPLE_SOURCE_TEXT);

    // Step 6: Click generate button
    await generatorPage.clickGenerate();

    // Step 7: Wait for AI generation to complete
    await generatorPage.waitForProposals();

    // Step 8: Verify flashcards were generated
    const proposalCount = await generatorPage.getProposalCount();
    expect(proposalCount).toBeGreaterThan(0);

    // Step 9: Accept all flashcards
    await generatorPage.acceptAllProposals();
    await generatorPage.saveAcceptedProposals();

    // Wait for save confirmation
    await page.waitForTimeout(2000);

    // Step 10: Navigate to "Moje Fiszki" page
    await navigation.goToFlashcards();
    await expect(page).toHaveURL("/flashcards");

    // Step 11: Verify flashcards were added
    await flashcardsPage.waitForFlashcards();
    const flashcardCount = await flashcardsPage.getFlashcardCount();
    expect(flashcardCount).toBeGreaterThan(0);

    // Step 12: Click delete account in account dropdown
    await navigation.clickDeleteAccount();

    // Step 13: Confirm deletion by typing "USUŃ" and clicking confirm
    await expect(deleteAccountDialog.dialog).toBeVisible();
    await deleteAccountDialog.confirmDeletion();

    // Verify user is redirected to landing page after account deletion
    await expect(page).toHaveURL("/", { timeout: 10000 });
  });
});
