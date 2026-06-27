import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import type { ActionResult } from "@/lib/utils/action-result";

interface UseActionOptions<T = unknown> {
  successMessage?: string;
  errorMessage?: string;
  onSuccess?: (data?: T) => void;
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
export function useAction<TInput = FormData, TData = unknown>(
  action: (input: TInput) => Promise<ActionResult<TData>>,
  options: UseActionOptions<TData> = {}
) {
  const [loading, setLoading] = useState(false);
  const submittingRef = useRef(false);
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const execute = useCallback(
    async (input: TInput): Promise<void> => {
      if (submittingRef.current) return;

      submittingRef.current = true;
      setLoading(true);
      try {
        const result = await action(input);
        if (result.success) {
          if (optionsRef.current.successMessage) {
            toast.success(optionsRef.current.successMessage);
          }
          optionsRef.current.onSuccess?.(result.data);
        } else {
          const errorMsg =
            result.error || optionsRef.current.errorMessage || "Something went wrong";
          toast.error(errorMsg);
          optionsRef.current.onError?.(errorMsg);
        }
      } catch {
        const errorMsg = optionsRef.current.errorMessage || "An unexpected error occurred";
        toast.error(errorMsg);
      } finally {
        submittingRef.current = false;
        setLoading(false);
      }
    },
    [action]
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
