/**
 * 📣 restoreSignal — "a backup was just imported; re-read your store".
 *
 * R9-28 — `importBackup` writes straight to SQLite and AsyncStorage, behind
 * the back of every provider that hydrated from those same keys once, on
 * mount, and has held the result in `useState` ever since. Nothing told them,
 * and the `importBackup` docstring's own escape hatch ("see Settings' import
 * handler, which asks the user to close and reopen the app") was never
 * actually implemented — the handler shows a plain success toast.
 *
 * The result is worse than a stale screen. The providers that persist on
 * every change write their PRE-IMPORT state back over the restored data at
 * the first interaction: `MemoryDeckContext` re-serializes the old deck on
 * the next review, `ReadingProgressContext` and `ReadingPlanProgressContext`
 * write whole maps derived from stale state. The restored data disappears
 * with no toast, no error and no log — the user is told "Copia de seguridad
 * importada correctamente" and then silently loses it again.
 *
 * This is a deliberately tiny module-level emitter rather than a context:
 * `BackupService` is decoupled from the React tree on purpose (see its
 * file docstring), and a provider must be able to subscribe without the
 * service knowing it exists.
 *
 * There is no programmatic app reload available here (the project doesn't
 * depend on expo-updates), so this does NOT claim to refresh everything —
 * it covers the stores that would otherwise actively DESTROY restored data.
 * Settings still tells the user to restart for the rest.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

type RestoreListener = () => void;

const listeners = new Set<RestoreListener>();

/**
 * Subscribe to "a backup was just imported". Returns the unsubscribe
 * function, so a `useEffect` can return it directly.
 */
export function subscribeBackupRestored(listener: RestoreListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Announce that an import finished writing. Called by `importBackup` once
 * both storage engines are done, never before — a listener that re-read
 * mid-write would just cache a half-restored state.
 *
 * A throwing listener must not take the others down with it (nor fail the
 * import, which has already committed by this point).
 */
export function emitBackupRestored(): void {
  for (const listener of Array.from(listeners)) {
    try {
      listener();
    } catch {
      // A provider that can't re-hydrate is no worse off than before this
      // signal existed; the user still gets the "restart the app" prompt.
    }
  }
}

/** Test-only: drop every subscription between cases. */
export function __resetBackupRestoredListenersForTests(): void {
  listeners.clear();
}
