/**
 * R9-23 / R9-38 — the account the local store belongs to: the last one that
 * signed in with Google on this phone (`AuthContext` claims it on every
 * sign-in). `AuthContext` asks before handing the store to another account;
 * the sync engine queues for it what is edited with no session (see
 * `SyncEngine.queueWrite`).
 *
 * Its own module, so both can import it without the rest of either.
 */
export const LOCAL_STORE_OWNER_KEY = '@local_store_owner_uid';

/**
 * R9-38 — written when the owner deletes its account: no account's uid (a
 * Firebase uid has no parentheses), so the next sign-in still asks before
 * taking the store, and the engine queues for no one. Not '': an empty value
 * can read back as null, and a null owner means «first sign-in, don't ask».
 */
export const DELETED_STORE_OWNER = '(deleted)';

/** R9-38 — the account a stored marker names, if any. */
export function storeOwnerAccount(marker: string | null): string | null {
  return marker && marker !== DELETED_STORE_OWNER ? marker : null;
}
