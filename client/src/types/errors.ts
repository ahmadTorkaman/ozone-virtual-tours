/**
 * Error codes returned by Tauri commands.
 * These match the ErrorCode enum in src-tauri/src/utils/errors.rs
 */
export type ErrorCode =
  | 'DATABASE_ERROR'
  | 'IO_ERROR'
  | 'NOT_FOUND'
  | 'VALIDATION_ERROR'
  | 'SERIALIZATION_ERROR'
  | 'LICENSE_ERROR'
  | 'FEATURE_NOT_AVAILABLE'
  | 'UNSUPPORTED_FORMAT'
  | 'CANCELLED'
  | 'INTERNAL_ERROR';

/**
 * Structured error response from Tauri commands.
 * Commands return this as a JSON string when they fail.
 */
export interface TauriError {
  /** Machine-readable error code */
  code: ErrorCode;
  /** Human-readable error message */
  message: string;
  /** Optional additional details (e.g., field name for validation errors) */
  details?: string;
}

/**
 * Type guard to check if an error string is a TauriError JSON
 */
export function isTauriErrorJson(error: unknown): boolean {
  if (typeof error !== 'string') return false;
  try {
    const parsed = JSON.parse(error);
    return typeof parsed === 'object' && 'code' in parsed && 'message' in parsed;
  } catch {
    return false;
  }
}

/**
 * Parse a Tauri error string into a structured TauriError object.
 * Falls back to INTERNAL_ERROR if parsing fails.
 */
export function parseTauriError(error: unknown): TauriError {
  if (typeof error === 'string') {
    try {
      const parsed = JSON.parse(error);
      if (typeof parsed === 'object' && 'code' in parsed && 'message' in parsed) {
        return parsed as TauriError;
      }
    } catch {
      // Not JSON, treat as plain message
    }
    // Plain string error (legacy format)
    return {
      code: 'INTERNAL_ERROR',
      message: error,
    };
  }

  if (error instanceof Error) {
    return {
      code: 'INTERNAL_ERROR',
      message: error.message,
    };
  }

  return {
    code: 'INTERNAL_ERROR',
    message: String(error),
  };
}

/**
 * Human-readable error messages for each error code.
 * Use this for displaying user-friendly error messages.
 */
export const errorCodeMessages: Record<ErrorCode, string> = {
  DATABASE_ERROR: 'A database error occurred',
  IO_ERROR: 'A file system error occurred',
  NOT_FOUND: 'The requested resource was not found',
  VALIDATION_ERROR: 'Invalid input provided',
  SERIALIZATION_ERROR: 'Failed to process data',
  LICENSE_ERROR: 'License validation failed',
  FEATURE_NOT_AVAILABLE: 'This feature is not available in your license tier',
  UNSUPPORTED_FORMAT: 'The file format is not supported',
  CANCELLED: 'The operation was cancelled',
  INTERNAL_ERROR: 'An unexpected error occurred',
};

/**
 * Get a user-friendly error message from a TauriError.
 * Uses the error's message if available, otherwise falls back to the code's default message.
 */
export function getErrorMessage(error: TauriError): string {
  return error.message || errorCodeMessages[error.code] || 'An error occurred';
}

/**
 * Check if an error is of a specific type.
 * Useful for handling specific error cases.
 *
 * @example
 * try {
 *   await createProject({ name: '' });
 * } catch (err) {
 *   const error = parseTauriError(err);
 *   if (isErrorCode(error, 'VALIDATION_ERROR')) {
 *     // Handle validation error specifically
 *   }
 * }
 */
export function isErrorCode(error: TauriError, code: ErrorCode): boolean {
  return error.code === code;
}

/**
 * Check if an error is recoverable (user can retry or fix the issue).
 */
export function isRecoverableError(error: TauriError): boolean {
  const recoverableCodes: ErrorCode[] = [
    'VALIDATION_ERROR',
    'NOT_FOUND',
    'FEATURE_NOT_AVAILABLE',
    'CANCELLED',
  ];
  return recoverableCodes.includes(error.code);
}

/**
 * Higher-order function to wrap Tauri invoke calls with structured error handling.
 *
 * @example
 * const projects = await withErrorHandling(
 *   () => invoke<Project[]>('list_projects'),
 *   (error) => {
 *     console.error('Failed to list projects:', error.message);
 *     return []; // Return fallback value
 *   }
 * );
 */
export async function withErrorHandling<T>(
  fn: () => Promise<T>,
  onError: (error: TauriError) => T | Promise<T>
): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    const error = parseTauriError(err);
    return onError(error);
  }
}
