/**
 * ⏱️ withTimeout — a deadline for a network call (R9-40), and
 * withStallTimeout — one that moves while a large download keeps arriving
 * (R9-620).
 *
 * React Native's `fetch` has no default timeout: on a network that accepts the
 * connection and never answers (captive portal, degraded wifi) the promise
 * never settles, and a screen waiting on it spins forever with no retry.
 *
 * `run` gets an `AbortSignal` to hand to `fetch`; at `ms` the signal aborts
 * and the returned promise rejects with a {@link TimeoutError}. The race does
 * not trust the abort alone: if a `fetch` ignores the signal, the caller is
 * still released. The deadline covers everything `run` awaits (headers AND
 * body), so a response that stalls mid-body times out too.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

export class TimeoutError extends Error {
  constructor(label: string, ms: number) {
    super(`${label} timed out after ${ms} ms`);
    this.name = 'TimeoutError';
  }
}

export function withTimeout<T>(
  run: (signal: AbortSignal) => Promise<T>,
  ms: number,
  label = 'request',
): Promise<T> {
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  const deadline = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      controller.abort();
      reject(new TimeoutError(label, ms));
    }, ms);
  });
  return Promise.race([run(controller.signal), deadline]).finally(() =>
    clearTimeout(timer),
  );
}

/**
 * R9-620 — a deadline for a LARGE download, which a fixed total would cut
 * while it is still slowly arriving. The clock restarts every time `run`
 * calls `progress()` (when the headers land, and on every chunk of the
 * body), so only a transfer that delivers nothing for `ms` is aborted and
 * rejected with a {@link TimeoutError}. Same race as {@link withTimeout}.
 */
export function withStallTimeout<T>(
  run: (signal: AbortSignal, progress: () => void) => Promise<T>,
  ms: number,
  label = 'download',
): Promise<T> {
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  let settled = false;
  let fail: (error: TimeoutError) => void = () => {};
  const deadline = new Promise<never>((_, reject) => {
    fail = reject;
  });
  const progress = () => {
    if (settled) return;
    clearTimeout(timer);
    timer = setTimeout(() => {
      controller.abort();
      fail(new TimeoutError(label, ms));
    }, ms);
  };
  progress();
  return Promise.race([run(controller.signal, progress), deadline]).finally(
    () => {
      settled = true;
      clearTimeout(timer);
    },
  );
}
