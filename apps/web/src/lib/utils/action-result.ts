/**
 * Standard result type for server actions.
 * Actions return { success, error } instead of throwing,
 * so the UI can show errors without crashing the page.
 */
export type ActionResult<T = unknown> = {
  success: boolean;
  error?: string;
  data?: T;
};

/**
 * Wraps an ActionResult-returning server action for use in <form action={...}>.
 * React expects form actions to return void, but our actions return ActionResult.
 * This wrapper discards the return value (errors are handled via revalidation).
 */
export function formAction(
  fn: (formData: FormData) => Promise<ActionResult>
): (formData: FormData) => Promise<void> {
  return async (formData: FormData) => {
    await fn(formData);
  };
}
