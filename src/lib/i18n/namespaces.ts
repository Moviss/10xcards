import type { I18nNamespace } from "./contracts";

export interface NamespaceDefinition {
  namespace: I18nNamespace;
  responsibility: string;
  includes: readonly string[];
  excludes: readonly string[];
}

export const namespaceDefinitions: readonly NamespaceDefinition[] = [
  {
    namespace: "common",
    responsibility: "Global layout, navigation, and shared account/a11y copy.",
    includes: ["src/layouts/Layout.astro", "src/layouts/AuthenticatedLayout.astro", "src/components/navigation/*"],
    excludes: ["feature-specific module copy", "validation messages"],
  },
  {
    namespace: "landing",
    responsibility: "Marketing copy for the public landing page.",
    includes: ["src/pages/index.astro", "src/components/landing/*"],
    excludes: ["authenticated app modules", "technical error messages"],
  },
  {
    namespace: "auth",
    responsibility: "Login/register views and auth form copy.",
    includes: ["src/pages/login.astro", "src/pages/register.astro", "src/components/auth/*"],
    excludes: ["api error texts", "zod validation texts"],
  },
  {
    namespace: "generator",
    responsibility: "Flashcard generation flow (input, staging, modal, local toasts).",
    includes: ["src/pages/generator.astro", "src/components/generator/*", "src/lib/hooks/useGenerator.ts"],
    excludes: ["error code mapping", "validation schema messages"],
  },
  {
    namespace: "flashcards",
    responsibility: "Flashcard list, CRUD views, pagination, search, local toasts.",
    includes: ["src/pages/flashcards.astro", "src/components/flashcards/*", "src/lib/hooks/useFlashcards.ts"],
    excludes: ["api error code mapping", "validation schema messages"],
  },
  {
    namespace: "study",
    responsibility: "Study session flow and view copy.",
    includes: ["src/pages/study.astro", "src/components/study/*", "src/lib/hooks/useStudySession.ts"],
    excludes: ["api error code mapping", "validation schema messages"],
  },
  {
    namespace: "errors",
    responsibility: "All user-facing runtime errors from API/network/session flows.",
    includes: [
      "src/pages/api/**",
      "src/lib/services/**",
      "src/lib/hooks/useAuthForm.ts",
      "src/lib/hooks/useNavigation.ts",
    ],
    excludes: ["labels/placeholders/cta copy", "field-level validation texts"],
  },
  {
    namespace: "validation",
    responsibility: "Validation messages for schemas and form field constraints.",
    includes: ["src/lib/schemas/*"],
    excludes: ["runtime/api errors", "screen copy"],
  },
];

export const namespaceByRoute = {
  "/": "landing",
  "/login": "auth",
  "/register": "auth",
  "/generator": "generator",
  "/flashcards": "flashcards",
  "/study": "study",
} as const satisfies Record<string, I18nNamespace>;
