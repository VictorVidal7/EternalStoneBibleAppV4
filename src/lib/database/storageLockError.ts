/**
 * Recognizes the OPFS/wa-sqlite "storage locked" failure class distinctly
 * from an ordinary network/fetch error during web boot (T22).
 *
 * wa-sqlite's AccessHandlePoolVFS (expo-sqlite's web VFS — see
 * node_modules/expo-sqlite/web/wa-sqlite/AccessHandlePoolVFS.js) opens every
 * OPFS file via `FileSystemFileHandle.createSyncAccessHandle()`, which the
 * browser refuses with a DOMException (`NoModificationAllowedError`, or in
 * some contention shapes `InvalidStateError`) when a PRIOR tab/page-load
 * still holds that file's exclusive lock — exactly what an interrupted
 * first-run pack download (hard reload mid-fetch, crash, closed tab) leaves
 * behind (T21).
 *
 * That DOMException crosses the SQLite worker's postMessage boundary and is
 * re-wrapped by expo-sqlite as `new Error(originalError)` (see
 * node_modules/expo-sqlite/web/WorkerChannel.ts, `workerMessageHandler`),
 * which stringifies the original error into the new Error's `.message` and
 * resets `.name` back to the generic `"Error"`. So by the time this reaches
 * app/_layout.web.tsx, `.name` alone is NOT reliable for classification —
 * only the message text (which still contains the original DOMException's
 * `"Name: message"` rendering) survives intact. `.name` is still checked as
 * a defensive fallback in case a future expo-sqlite version stops wrapping.
 *
 * `"Invalid VFS state"` is a second, related signature: expo-sqlite's worker
 * keeps a module-level VFS singleton that never retries after the first
 * failed acquisition (see web/worker.ts, `maybeInitAsync`), so an in-place
 * retry within the SAME worker/page-load throws this literal string on every
 * subsequent attempt — which is exactly why the app's existing generic
 * retry button cannot recover from this case without a real page reload.
 */
const STORAGE_LOCK_SIGNATURES: readonly RegExp[] = [
  /NoModificationAllowedError/i,
  /InvalidStateError/i,
  /Invalid VFS state/i,
  /createSyncAccessHandle/i,
];

/**
 * Duck-types name/message off the error instead of requiring
 * `instanceof Error` — deliberately, for two reasons: (1) DOMException
 * (the class the browser actually throws for a locked
 * createSyncAccessHandle) does NOT extend Error in either Node or real
 * browsers, and (2) a caught error's exact prototype chain is not
 * guaranteed to survive every hop of this app's worker → postMessage →
 * re-wrap → catch chain intact across browser versions.
 */
function extractNameAndMessage(error: unknown): {name: string; message: string} {
  if (error && typeof error === 'object' && typeof (error as {message?: unknown}).message === 'string') {
    const name = typeof (error as {name?: unknown}).name === 'string'
      ? (error as {name: string}).name
      : '';
    return {name, message: (error as {message: string}).message};
  }
  if (typeof error === 'string') {
    return {name: '', message: error};
  }
  return {name: '', message: ''};
}

export function isStorageLockError(error: unknown): boolean {
  const {name, message} = extractNameAndMessage(error);
  const haystack = `${name} ${message}`;
  if (!haystack.trim()) return false;
  return STORAGE_LOCK_SIGNATURES.some(pattern => pattern.test(haystack));
}
