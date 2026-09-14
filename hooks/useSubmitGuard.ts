import { useCallback, useRef } from 'react';

/**
 * Synchronous double-submit guard for async submit handlers.
 *
 * State flags (`isSaving`) are only set after the first `await`/re-render, so
 * two taps in the same tick both pass an `if (isSaving) return;` check — and
 * handlers that fan out into several mutations (loops) produce whole duplicate
 * batches. A ref flips synchronously, closing that window.
 *
 * Usage:
 *   const handleSave = useGuardedSubmit(async () => { ... });
 *   // wire handleSave to the button / onSubmitEditing as before
 */
export function useGuardedSubmit<A extends any[]>(
  fn: (...args: A) => Promise<any> | any
): (...args: A) => Promise<void> {
  const inFlight = useRef(false);
  return useCallback(
    async (...args: A) => {
      if (inFlight.current) return;
      inFlight.current = true;
      try {
        await fn(...args);
      } finally {
        inFlight.current = false;
      }
    },
    [fn]
  );
}
