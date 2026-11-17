/**
 * useSaveErrorToast — R9-52. The Mesa's stores (notes, self-review and the
 * banks of illustrations and series) and the sermon notes reject when a
 * write failed; they used to swallow it, and the screens said nothing or
 * reported success. A screen whose writes are fire-and-forget (an autosave
 * on every pause in typing, a blur, a flush on leaving) reports them through
 * the function this returns: ONE error toast per burst of failures, not one
 * per write — a failure within `SAVE_ERROR_BURST_MS` of the last toast shown
 * is silent.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import {useCallback, useRef} from 'react';
import {useToast} from '@context/ToastContext';

/**
 * How long after a "could not save" toast another failed write stays silent.
 * Longer than the toast's own 3 s, so a burst shows one, and short enough
 * that a write that keeps failing while the user types is still reported now
 * and then.
 */
export const SAVE_ERROR_BURST_MS = 10_000;

/** Returns a stable `() => void` that shows `message` once per burst. */
export function useSaveErrorToast(message: string): () => void {
  const toast = useToast();
  const lastToastAtRef = useRef<number | null>(null);
  return useCallback(() => {
    const now = Date.now();
    const last = lastToastAtRef.current;
    if (last !== null && now - last < SAVE_ERROR_BURST_MS) return;
    lastToastAtRef.current = now;
    toast.error(message);
  }, [toast, message]);
}
