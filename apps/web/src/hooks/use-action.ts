import { useCallback, useState } from "react";
import { toast } from "sonner";
import type { ActionResult } from "@/lib/utils/action-result";

interface UseActionOptions {
  successMessage?: string;
  errorMessage?: string;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

/**
 * Hook for calling server actions with automatic toast notifications.
 *
 * Usage:
 *   const { execute, loading } = useAction(createEmployee, {
 *     successMessage: "Employee created!",
 *     onSuccess: () => setMode("list"),
 *   });
 *
 *   <form action={execute}>...</form>
 */
export function useAction<TInput = FormData>(
  action: (input: TInput) => Promise<ActionResult>,
  options: UseActionOptions = {}
) {
  const [loading, setLoading] = useState(false);

  const execute = useCallback(
    async (input: TInput): Promise<void> => {
      setLoading(true);
      try {
        const result = await action(input);
        if (result.success) {
          if (options.successMessage) {
            toast.success(options.successMessage);
          }
          options.onSuccess?.();
        } else {
          const errorMsg = result.error || options.errorMessage || "Something went wrong";
          toast.error(errorMsg);
          options.onError?.(errorMsg);
        }
      } catch {
        const errorMsg = options.errorMessage || "An unexpected error occurred";
        toast.error(errorMsg);
      } finally {
        setLoading(false);
      }
    },
    [action, options]
  );

  return { execute, loading };
}

/**
 * Wraps an ActionResult-returning server action for use in <form action={...}>.
 * Shows toast on success/error automatically.
 */
export function toastAction(
  fn: (formData: FormData) => Promise<ActionResult>,
  successMsg?: string
): (formData: FormData) => Promise<void> {
  return async (formData: FormData) => {
    const result = await fn(formData);
    if (result.success) {
      if (successMsg) toast.success(successMsg);
    } else {
      toast.error(result.error || "Something went wrong");
    }
  };
}
