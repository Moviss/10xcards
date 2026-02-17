export const apiErrorCodeToTranslationKey = {
  "common.unauthorized": "errors.common.unauthorized.error",
  "common.forbidden": "errors.common.forbidden.error",
  "common.not_found": "errors.common.not_found.error",
  "common.validation_failed": "errors.common.validation_failed.error",
  "common.rate_limited": "errors.common.rate_limited.error",
  "common.server_error": "errors.common.server_error.error",
  "common.network_error": "errors.common.network_error.error",
  "common.unknown": "errors.common.unknown.error",

  "auth.invalid_credentials": "errors.auth.invalid_credentials.error",
  "auth.email_already_exists": "errors.auth.email_already_exists.error",
  "auth.weak_password": "errors.auth.weak_password.error",
  "auth.session_expired": "errors.auth.session_expired.error",
  "auth.logout_failed": "errors.auth.logout_failed.error",
  "auth.delete_account_failed": "errors.auth.delete_account_failed.error",
  "auth.user_not_found": "errors.auth.user_not_found.error",
  "auth.invalid_confirmation_token": "errors.auth.invalid_confirmation_token.error",

  "generator.invalid_source_text": "errors.generator.invalid_source_text.error",
  "generator.ai_unavailable": "errors.generator.ai_unavailable.error",
  "generator.request_timeout": "errors.generator.request_timeout.error",
  "generator.generation_failed": "errors.generator.generation_failed.error",
  "generator.generation_log_not_found": "errors.generator.generation_log_not_found.error",
  "generator.save_failed": "errors.generator.save_failed.error",

  "flashcards.not_found": "errors.flashcards.not_found.error",
  "flashcards.create_failed": "errors.flashcards.create_failed.error",
  "flashcards.update_failed": "errors.flashcards.update_failed.error",
  "flashcards.delete_failed": "errors.flashcards.delete_failed.error",
  "flashcards.batch_create_failed": "errors.flashcards.batch_create_failed.error",
  "flashcards.reset_progress_failed": "errors.flashcards.reset_progress_failed.error",
  "flashcards.generation_log_not_found": "errors.flashcards.generation_log_not_found.error",

  "study.session_fetch_failed": "errors.study.session_fetch_failed.error",
  "study.review_failed": "errors.study.review_failed.error",
  "study.card_not_found": "errors.study.card_not_found.error",
  "study.no_cards_due": "errors.study.no_cards_due.error",
} as const;

export type ApiErrorCode = keyof typeof apiErrorCodeToTranslationKey;
export type ErrorTranslationKey = (typeof apiErrorCodeToTranslationKey)[ApiErrorCode];

export const apiErrorCodesByDomain = {
  common: [
    "common.unauthorized",
    "common.forbidden",
    "common.not_found",
    "common.validation_failed",
    "common.rate_limited",
    "common.server_error",
    "common.network_error",
    "common.unknown",
  ],
  auth: [
    "auth.invalid_credentials",
    "auth.email_already_exists",
    "auth.weak_password",
    "auth.session_expired",
    "auth.logout_failed",
    "auth.delete_account_failed",
    "auth.user_not_found",
    "auth.invalid_confirmation_token",
  ],
  generator: [
    "generator.invalid_source_text",
    "generator.ai_unavailable",
    "generator.request_timeout",
    "generator.generation_failed",
    "generator.generation_log_not_found",
    "generator.save_failed",
  ],
  flashcards: [
    "flashcards.not_found",
    "flashcards.create_failed",
    "flashcards.update_failed",
    "flashcards.delete_failed",
    "flashcards.batch_create_failed",
    "flashcards.reset_progress_failed",
    "flashcards.generation_log_not_found",
  ],
  study: ["study.session_fetch_failed", "study.review_failed", "study.card_not_found", "study.no_cards_due"],
} as const satisfies Record<string, readonly ApiErrorCode[]>;

export function isApiErrorCode(value: string): value is ApiErrorCode {
  return value in apiErrorCodeToTranslationKey;
}

export function getErrorTranslationKey(errorCode: ApiErrorCode): ErrorTranslationKey {
  return apiErrorCodeToTranslationKey[errorCode];
}
