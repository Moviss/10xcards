import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useAuthForm } from "./useAuthForm";
import { loginSchema, registerSchema } from "@/lib/schemas/auth.schema";

// Mock setAuthToken
vi.mock("@/lib/auth.client", () => ({
  setAuthToken: vi.fn(),
}));

import { setAuthToken } from "@/lib/auth.client";
const mockSetAuthToken = vi.mocked(setAuthToken);

// Mock global fetch
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

// Mock window.location
const mockLocation = { href: "" };
Object.defineProperty(window, "location", {
  value: mockLocation,
  writable: true,
});

describe("useAuthForm", () => {
  // ==========================================================================
  // Setup & Teardown
  // ==========================================================================

  beforeEach(() => {
    vi.clearAllMocks();
    mockLocation.href = "";
  });

  // ==========================================================================
  // Helper Functions
  // ==========================================================================

  const renderLoginForm = () => {
    return renderHook(() =>
      useAuthForm({
        schema: loginSchema,
        submitUrl: "/api/auth/login",
        redirectUrl: "/dashboard",
      })
    );
  };

  const renderRegisterForm = () => {
    return renderHook(() =>
      useAuthForm({
        schema: registerSchema,
        submitUrl: "/api/auth/register",
        redirectUrl: "/dashboard",
      })
    );
  };

  const mockSuccessfulResponse = (responseData = {}) => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          user: { id: "123", email: "test@example.com" },
          session: { access_token: "token-123" },
          ...responseData,
        }),
    } as Response);
  };

  const createMockEvent = () => ({
    preventDefault: vi.fn(),
  });

  // ==========================================================================
  // Initial State
  // ==========================================================================

  describe("initial state", () => {
    it("should initialize with empty form data", () => {
      // Arrange & Act
      const { result } = renderLoginForm();

      // Assert
      expect(result.current.formData).toEqual({ email: "", password: "" });
    });

    it("should initialize with no errors", () => {
      // Arrange & Act
      const { result } = renderLoginForm();

      // Assert
      expect(result.current.errors).toEqual({});
    });

    it("should initialize with isSubmitting false", () => {
      // Arrange & Act
      const { result } = renderLoginForm();

      // Assert
      expect(result.current.isSubmitting).toBe(false);
    });
  });

  // ==========================================================================
  // handleChange
  // ==========================================================================

  describe("handleChange", () => {
    it("should update email field", () => {
      // Arrange
      const { result } = renderLoginForm();

      // Act
      act(() => {
        result.current.handleChange("email", "test@example.com");
      });

      // Assert
      expect(result.current.formData.email).toBe("test@example.com");
    });

    it("should update password field", () => {
      // Arrange
      const { result } = renderLoginForm();

      // Act
      act(() => {
        result.current.handleChange("password", "secret123");
      });

      // Assert
      expect(result.current.formData.password).toBe("secret123");
    });

    it("should clear field error on change", () => {
      // Arrange
      const { result } = renderLoginForm();

      // Trigger validation error first
      const mockEvent = createMockEvent();
      act(() => {
        result.current.handleSubmit(mockEvent as unknown as React.FormEvent);
      });

      expect(result.current.errors.email).toBeDefined();

      // Act
      act(() => {
        result.current.handleChange("email", "test@example.com");
      });

      // Assert
      expect(result.current.errors.email).toBeUndefined();
    });
  });

  // ==========================================================================
  // Zod Validation - Login Schema
  // ==========================================================================

  describe("login schema validation", () => {
    it("should show error for empty email", async () => {
      // Arrange
      const { result } = renderLoginForm();
      const mockEvent = createMockEvent();

      act(() => {
        result.current.handleChange("password", "somepassword");
      });

      // Act
      await act(async () => {
        await result.current.handleSubmit(mockEvent as unknown as React.FormEvent);
      });

      // Assert
      expect(result.current.errors.email).toBe("Invalid email format");
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("should show error for invalid email format", async () => {
      // Arrange
      const { result } = renderLoginForm();
      const mockEvent = createMockEvent();

      act(() => {
        result.current.handleChange("email", "not-an-email");
        result.current.handleChange("password", "somepassword");
      });

      // Act
      await act(async () => {
        await result.current.handleSubmit(mockEvent as unknown as React.FormEvent);
      });

      // Assert
      expect(result.current.errors.email).toBe("Invalid email format");
    });

    it("should show error for empty password", async () => {
      // Arrange
      const { result } = renderLoginForm();
      const mockEvent = createMockEvent();

      act(() => {
        result.current.handleChange("email", "test@example.com");
      });

      // Act
      await act(async () => {
        await result.current.handleSubmit(mockEvent as unknown as React.FormEvent);
      });

      // Assert
      expect(result.current.errors.password).toBe("Password is required");
    });

    it("should pass validation with valid login data", async () => {
      // Arrange
      const { result } = renderLoginForm();
      const mockEvent = createMockEvent();
      mockSuccessfulResponse();

      act(() => {
        result.current.handleChange("email", "test@example.com");
        result.current.handleChange("password", "a");
      });

      // Act
      await act(async () => {
        await result.current.handleSubmit(mockEvent as unknown as React.FormEvent);
      });

      // Assert
      expect(result.current.errors).toEqual({});
      expect(mockFetch).toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // Zod Validation - Register Schema
  // ==========================================================================

  describe("register schema validation", () => {
    it("should show error for password shorter than 8 characters", async () => {
      // Arrange
      const { result } = renderRegisterForm();
      const mockEvent = createMockEvent();

      act(() => {
        result.current.handleChange("email", "test@example.com");
        result.current.handleChange("password", "short");
      });

      // Act
      await act(async () => {
        await result.current.handleSubmit(mockEvent as unknown as React.FormEvent);
      });

      // Assert
      expect(result.current.errors.password).toBe("Password must be at least 8 characters");
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("should pass validation with 8+ character password", async () => {
      // Arrange
      const { result } = renderRegisterForm();
      const mockEvent = createMockEvent();
      mockSuccessfulResponse();

      act(() => {
        result.current.handleChange("email", "test@example.com");
        result.current.handleChange("password", "password123");
      });

      // Act
      await act(async () => {
        await result.current.handleSubmit(mockEvent as unknown as React.FormEvent);
      });

      // Assert
      expect(result.current.errors).toEqual({});
      expect(mockFetch).toHaveBeenCalled();
    });

    it("should show multiple validation errors", async () => {
      // Arrange
      const { result } = renderRegisterForm();
      const mockEvent = createMockEvent();

      act(() => {
        result.current.handleChange("email", "invalid");
        result.current.handleChange("password", "short");
      });

      // Act
      await act(async () => {
        await result.current.handleSubmit(mockEvent as unknown as React.FormEvent);
      });

      // Assert
      expect(result.current.errors.email).toBe("Invalid email format");
      expect(result.current.errors.password).toBe("Password must be at least 8 characters");
    });
  });

  // ==========================================================================
  // Server Error Mapping
  // ==========================================================================

  describe("server error mapping", () => {
    it("should map 409 to email already registered error", async () => {
      // Arrange
      const { result } = renderRegisterForm();
      const mockEvent = createMockEvent();

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 409,
        json: () => Promise.resolve({ error: "Email already exists" }),
      } as Response);

      act(() => {
        result.current.handleChange("email", "test@example.com");
        result.current.handleChange("password", "password123");
      });

      // Act
      await act(async () => {
        await result.current.handleSubmit(mockEvent as unknown as React.FormEvent);
      });

      // Assert
      expect(result.current.errors.email).toBe("Ten adres email jest już zarejestrowany");
    });

    it("should map 401 to invalid credentials error", async () => {
      // Arrange
      const { result } = renderLoginForm();
      const mockEvent = createMockEvent();

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ error: "Invalid credentials" }),
      } as Response);

      act(() => {
        result.current.handleChange("email", "test@example.com");
        result.current.handleChange("password", "wrongpassword");
      });

      // Act
      await act(async () => {
        await result.current.handleSubmit(mockEvent as unknown as React.FormEvent);
      });

      // Assert
      expect(result.current.errors.general).toBe("Nieprawidłowy email lub hasło");
    });

    it("should show generic error for other server errors", async () => {
      // Arrange
      const { result } = renderLoginForm();
      const mockEvent = createMockEvent();

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: "Internal server error" }),
      } as Response);

      act(() => {
        result.current.handleChange("email", "test@example.com");
        result.current.handleChange("password", "password123");
      });

      // Act
      await act(async () => {
        await result.current.handleSubmit(mockEvent as unknown as React.FormEvent);
      });

      // Assert
      expect(result.current.errors.general).toBe("Internal server error");
    });

    it("should show default error when no error message in response", async () => {
      // Arrange
      const { result } = renderLoginForm();
      const mockEvent = createMockEvent();

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.resolve({}),
      } as Response);

      act(() => {
        result.current.handleChange("email", "test@example.com");
        result.current.handleChange("password", "password123");
      });

      // Act
      await act(async () => {
        await result.current.handleSubmit(mockEvent as unknown as React.FormEvent);
      });

      // Assert
      expect(result.current.errors.general).toBe("Wystąpił błąd");
    });

    it("should handle network error", async () => {
      // Arrange
      const { result } = renderLoginForm();
      const mockEvent = createMockEvent();

      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      act(() => {
        result.current.handleChange("email", "test@example.com");
        result.current.handleChange("password", "password123");
      });

      // Act
      await act(async () => {
        await result.current.handleSubmit(mockEvent as unknown as React.FormEvent);
      });

      // Assert
      expect(result.current.errors.general).toBe("Nie można połączyć z serwerem. Spróbuj ponownie.");
    });
  });

  // ==========================================================================
  // Successful Submission
  // ==========================================================================

  describe("successful submission", () => {
    it("should call fetch with correct parameters", async () => {
      // Arrange
      const { result } = renderLoginForm();
      const mockEvent = createMockEvent();
      mockSuccessfulResponse();

      act(() => {
        result.current.handleChange("email", "test@example.com");
        result.current.handleChange("password", "password123");
      });

      // Act
      await act(async () => {
        await result.current.handleSubmit(mockEvent as unknown as React.FormEvent);
      });

      // Assert
      expect(mockFetch).toHaveBeenCalledWith("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "test@example.com", password: "password123" }),
      });
    });

    it("should store auth token from response", async () => {
      // Arrange
      const { result } = renderLoginForm();
      const mockEvent = createMockEvent();
      mockSuccessfulResponse({ session: { access_token: "my-token-123" } });

      act(() => {
        result.current.handleChange("email", "test@example.com");
        result.current.handleChange("password", "password123");
      });

      // Act
      await act(async () => {
        await result.current.handleSubmit(mockEvent as unknown as React.FormEvent);
      });

      // Assert
      expect(mockSetAuthToken).toHaveBeenCalledWith("my-token-123");
    });

    it("should redirect to redirectUrl after success", async () => {
      // Arrange
      const { result } = renderLoginForm();
      const mockEvent = createMockEvent();
      mockSuccessfulResponse();

      act(() => {
        result.current.handleChange("email", "test@example.com");
        result.current.handleChange("password", "password123");
      });

      // Act
      await act(async () => {
        await result.current.handleSubmit(mockEvent as unknown as React.FormEvent);
      });

      // Assert
      expect(mockLocation.href).toBe("/dashboard");
    });

    it("should not store token if not present in response", async () => {
      // Arrange
      const { result } = renderLoginForm();
      const mockEvent = createMockEvent();

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            user: { id: "123", email: "test@example.com" },
            // No session
          }),
      } as Response);

      act(() => {
        result.current.handleChange("email", "test@example.com");
        result.current.handleChange("password", "password123");
      });

      // Act
      await act(async () => {
        await result.current.handleSubmit(mockEvent as unknown as React.FormEvent);
      });

      // Assert
      expect(mockSetAuthToken).not.toHaveBeenCalled();
      expect(mockLocation.href).toBe("/dashboard"); // Still redirects
    });
  });

  // ==========================================================================
  // isSubmitting State
  // ==========================================================================

  describe("isSubmitting state", () => {
    it("should set isSubmitting during API call", async () => {
      // Arrange
      const { result } = renderLoginForm();
      const mockEvent = createMockEvent();

      const promiseControls = {
        resolve: (value: Response) => {
          void value;
        },
      };
      const pendingPromise = new Promise<Response>((resolve) => {
        promiseControls.resolve = resolve;
      });
      mockFetch.mockReturnValueOnce(pendingPromise);

      act(() => {
        result.current.handleChange("email", "test@example.com");
        result.current.handleChange("password", "password123");
      });

      // Act
      let submitPromise: Promise<void>;
      act(() => {
        submitPromise = result.current.handleSubmit(mockEvent as unknown as React.FormEvent);
      });

      // Assert - during submission
      expect(result.current.isSubmitting).toBe(true);

      // Cleanup
      await act(async () => {
        promiseControls.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              user: { id: "123", email: "test@example.com" },
              session: { access_token: "token" },
            }),
        } as Response);
        await submitPromise;
      });
    });

    it("should reset isSubmitting after error", async () => {
      // Arrange
      const { result } = renderLoginForm();
      const mockEvent = createMockEvent();

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ error: "Invalid" }),
      } as Response);

      act(() => {
        result.current.handleChange("email", "test@example.com");
        result.current.handleChange("password", "password123");
      });

      // Act
      await act(async () => {
        await result.current.handleSubmit(mockEvent as unknown as React.FormEvent);
      });

      // Assert
      expect(result.current.isSubmitting).toBe(false);
    });

    it("should not set isSubmitting for validation errors", async () => {
      // Arrange
      const { result } = renderLoginForm();
      const mockEvent = createMockEvent();

      // Act - submit with empty form
      await act(async () => {
        await result.current.handleSubmit(mockEvent as unknown as React.FormEvent);
      });

      // Assert - isSubmitting should never have been true
      expect(result.current.isSubmitting).toBe(false);
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // preventDefault
  // ==========================================================================

  describe("form event handling", () => {
    it("should call preventDefault on form submit", async () => {
      // Arrange
      const { result } = renderLoginForm();
      const mockEvent = createMockEvent();

      // Act
      await act(async () => {
        await result.current.handleSubmit(mockEvent as unknown as React.FormEvent);
      });

      // Assert
      expect(mockEvent.preventDefault).toHaveBeenCalled();
    });

    it("should clear errors before validation", async () => {
      // Arrange
      const { result } = renderLoginForm();
      const mockEvent = createMockEvent();

      // First submit - get errors
      await act(async () => {
        await result.current.handleSubmit(mockEvent as unknown as React.FormEvent);
      });
      expect(Object.keys(result.current.errors).length).toBeGreaterThan(0);

      // Fill valid data
      act(() => {
        result.current.handleChange("email", "test@example.com");
        result.current.handleChange("password", "password123");
      });

      mockSuccessfulResponse();

      // Act - second submit
      await act(async () => {
        await result.current.handleSubmit(mockEvent as unknown as React.FormEvent);
      });

      // Assert - errors should be cleared
      expect(result.current.errors).toEqual({});
    });
  });

  // ==========================================================================
  // Edge Cases
  // ==========================================================================

  describe("edge cases", () => {
    it("should handle rapid form changes", () => {
      // Arrange
      const { result } = renderLoginForm();

      // Act - rapid changes
      act(() => {
        result.current.handleChange("email", "a");
        result.current.handleChange("email", "ab");
        result.current.handleChange("email", "abc");
        result.current.handleChange("email", "test@example.com");
      });

      // Assert
      expect(result.current.formData.email).toBe("test@example.com");
    });

    it("should use correct redirectUrl from config", async () => {
      // Arrange
      const { result } = renderHook(() =>
        useAuthForm({
          schema: loginSchema,
          submitUrl: "/api/auth/login",
          redirectUrl: "/custom-redirect",
        })
      );

      const mockEvent = createMockEvent();
      mockSuccessfulResponse();

      act(() => {
        result.current.handleChange("email", "test@example.com");
        result.current.handleChange("password", "password123");
      });

      // Act
      await act(async () => {
        await result.current.handleSubmit(mockEvent as unknown as React.FormEvent);
      });

      // Assert
      expect(mockLocation.href).toBe("/custom-redirect");
    });

    it("should use correct submitUrl from config", async () => {
      // Arrange
      const { result } = renderHook(() =>
        useAuthForm({
          schema: loginSchema,
          submitUrl: "/api/custom/endpoint",
          redirectUrl: "/dashboard",
        })
      );

      const mockEvent = createMockEvent();
      mockSuccessfulResponse();

      act(() => {
        result.current.handleChange("email", "test@example.com");
        result.current.handleChange("password", "password123");
      });

      // Act
      await act(async () => {
        await result.current.handleSubmit(mockEvent as unknown as React.FormEvent);
      });

      // Assert
      expect(mockFetch).toHaveBeenCalledWith("/api/custom/endpoint", expect.any(Object));
    });
  });
});
