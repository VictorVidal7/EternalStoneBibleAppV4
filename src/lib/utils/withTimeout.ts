/**
 * ⏱️ withTimeout — a deadline for a network call (R9-40).
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
