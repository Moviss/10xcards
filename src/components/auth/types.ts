/**
 * Stan formularza logowania
 */
export interface LoginFormState {
  email: string;
  password: string;
}

/**
 * Błędy walidacji formularza logowania
 */
export interface LoginFormErrors {
  email?: string;
  password?: string;
  general?: string;
}

/**
 * Stan formularza rejestracji
 */
export interface RegisterFormState {
  email: string;
  password: string;
}

/**
 * Błędy walidacji formularza rejestracji
 */
export interface RegisterFormErrors {
  email?: string;
  password?: string;
  general?: string;
}

/**
 * Wspólny interfejs stanu UI formularza auth
 */
export interface AuthFormUIState {
  isSubmitting: boolean;
  showPassword: boolean;
  showPasswordRequirements: boolean;
}

/**
 * Odpowiedź błędu z API
 */
export interface ApiErrorResponse {
  error: string;
}
