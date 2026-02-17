import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getUserEmailFromToken } from "@/lib/auth.client";
import { useNavigation } from "@/lib/hooks/useNavigation";
import { Navigation } from "./Navigation";

vi.mock("@/lib/hooks/useNavigation", () => ({
  useNavigation: vi.fn(),
}));

vi.mock("@/lib/auth.client", () => ({
  getUserEmailFromToken: vi.fn(),
}));

const mockUseNavigation = vi.mocked(useNavigation);
const mockGetUserEmailFromToken = vi.mocked(getUserEmailFromToken);

const buildNavigationState = () => ({
  isLoggingOut: false,
  isDeleting: false,
  isDeleteDialogOpen: false,
  isMobileMenuOpen: true,
  openDeleteDialog: vi.fn(),
  closeDeleteDialog: vi.fn(),
  openMobileMenu: vi.fn(),
  closeMobileMenu: vi.fn(),
  handleLogout: vi.fn(() => Promise.resolve()),
  handleDeleteAccount: vi.fn(() => Promise.resolve()),
});

describe("Navigation feature flag control points", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUserEmailFromToken.mockReturnValue("test@example.com");
    mockUseNavigation.mockReturnValue(buildNavigationState());
    window.history.replaceState({}, "", "/generator");
    window.__10XCARDS_FEATURE_FLAGS__ = {
      "feature.i18n_mvp": false,
    };
  });

  it("does not render language switcher slots when feature flag is OFF", () => {
    render(<Navigation />);

    expect(screen.getAllByTestId("nav-link-generator")).toHaveLength(2);
    expect(screen.getAllByTestId("nav-link-flashcards")).toHaveLength(2);
    expect(screen.getAllByTestId("nav-link-study")).toHaveLength(2);
    expect(screen.getByTestId("account-dropdown-trigger")).toBeInTheDocument();
    expect(screen.queryByTestId("language-switcher-slot-desktop")).not.toBeInTheDocument();
    expect(screen.queryByTestId("language-switcher-slot-mobile")).not.toBeInTheDocument();
  });

  it("renders desktop and mobile language switcher slots when feature flag is ON", () => {
    window.__10XCARDS_FEATURE_FLAGS__ = {
      "feature.i18n_mvp": true,
    };

    render(<Navigation />);

    expect(screen.getAllByTestId("nav-link-generator")).toHaveLength(2);
    expect(screen.getAllByTestId("nav-link-flashcards")).toHaveLength(2);
    expect(screen.getAllByTestId("nav-link-study")).toHaveLength(2);
    expect(screen.getByTestId("language-switcher-slot-desktop")).toBeInTheDocument();
    expect(screen.getByTestId("language-switcher-slot-mobile")).toBeInTheDocument();
  });
});
