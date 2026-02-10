/**
 * Generic Result type for service operations
 * Provides type-safe error handling without exceptions
 */

export type Result<T, E = string> =
  | { success: true; data: T }
  | { success: false; error: E };

/**
 * Creates a successful result
 */
export function ok<T>(data: T): Result<T, never> {
  return { success: true, data };
}

/**
 * Creates a failed result
 */
export function err<E = string>(error: E): Result<never, E> {
  return { success: false, error };
}

/**
 * Wraps an async function with error handling
 * Returns Result instead of throwing
 */
export async function tryCatch<T>(
  fn: () => Promise<T>,
  errorMessage?: string,
): Promise<Result<T, string>> {
  try {
    const data = await fn();
    return ok(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return err(errorMessage ? `${errorMessage}: ${message}` : message);
  }
}

/**
 * Unwraps a Result, throwing if it's an error
 * Use sparingly - prefer pattern matching
 */
export function unwrap<T>(result: Result<T>): T {
  if (result.success) {
    return result.data;
  }
  throw new Error(result.error);
}

/**
 * Unwraps a Result with a default value
 */
export function unwrapOr<T>(result: Result<T>, defaultValue: T): T {
  if (result.success) {
    return result.data;
  }
  return defaultValue;
}

/**
 * Maps a successful Result to a new value
 */
export function map<T, U>(result: Result<T>, fn: (data: T) => U): Result<U> {
  if (result.success) {
    return ok(fn(result.data));
  }
  return result;
}

/**
 * Chains Result operations
 */
export async function flatMap<T, U>(
  result: Result<T>,
  fn: (data: T) => Promise<Result<U>>,
): Promise<Result<U>> {
  if (result.success) {
    return fn(result.data);
  }
  return result;
}
