/**
 * 🔐 prepAccount — whose "Mesa de preparación" the stores read and write
 * (R9-59, decided by Victor on 2026-10-03: the Mesa is kept per account).
 *
 * Every Mesa key (`@prep_notes`, `@prep_series`, `@prep_illustrations`,
 * `@prep_self_review`) is suffixed with the uid of the Google account signed
 * in (`@prep_notes:<uid>`). With no Google account (anonymous, or no user) the
 * key has no suffix: the Mesa «sin cuenta», which is where every Mesa lived
 * before this. On a shared phone each account sees only its own, and signing
 * out deletes nothing: it shows the Mesa «sin cuenta».
 *
 * An anonymous uid is not an account here: it is new after every sign-out, so
 * a Mesa per anonymous uid would vanish each time.
 *
 * What moves between them, decided by the orchestrator (the «how» was
 * delegated), and why:
 * - The Mesa written before this (the unsuffixed keys) goes ONCE to the owner
 *   of the local store (`@local_store_owner_uid`, the last account that
 *   signed in here) or, with none recorded, to the Google account signed in
 *   at that moment. With neither, it stays the Mesa «sin cuenta». The owner is
 *   the best guess of whose it was; it runs at the first auth state of the
 *   process, before any sign-in can claim the store for someone else.
 * - On a Google sign-in that keeps the local data (no previous owner, or the
 *   migration question answered «Migrar»), the Mesa «sin cuenta» joins the
 *   account's: what was written before signing in follows the person, as the
 *   synced data does. Declined, it stays where it was (R9-23, R9-166).
 * - Deleting the account gives its Mesa back to the Mesa «sin cuenta»: it was
 *   never in the cloud, and deleting the account deletes the cloud copy only.
 *   R9-274 — a give-back that does not finish is finished at the next start.
 *
 * R9-269 — a join loses no entry. An entry the destination does not have
 * moves; on the same entry (the same passage written in both), the one
 * already there stays, and the other STAYS WHERE IT WAS: joining into an
 * account, the Mesa «sin cuenta» keeps it, and it is there on signing out.
 * It used to go with its key, and signing in again deleted the sermon written
 * signed out (or restored from a backup signed out). Giving the Mesa back on
 * deleting the account is the one join whose source goes away: there, of two
 * entries with a clock (`updatedAt`), the newer one stays; else the one
 * already there. And the Mesa's writes and its joins run one at a time
 * (`prepWrite`): a write that landed between a join's reads and its removal
 * went with the key. R9-273 — the restore of a backup writes the Mesa too,
 * and takes the same turn (`prepTurn`).
 *
 * The backup exports and restores the Mesa of the account signed in, so a
 * backup made by one account does not carry another's (R9-59).
 *
 * Until the auth state is known, keys wait for it: `AuthProvider` says so as
 * it mounts (`managePrepAccount`). Without it (tests that mount no
 * `AuthProvider`), the Mesa «sin cuenta» is used at once.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {logger} from '@lib/utils/logger';
import {
  LOCAL_STORE_OWNER_KEY,
  storeOwnerAccount,
} from '@lib/sync/localStoreOwner';

export const PREP_KEYS = [
  '@prep_notes',
  '@prep_series',
  '@prep_illustrations',
  '@prep_self_review',
] as const;

/** Set once the Mesa written before R9-59 found its account. */
const MIGRATED_KEY = '@prep_by_account';

/** R9-274 — the deleted account whose Mesa is being given back. */
const RELEASE_KEY = '@prep_release_pending';

let account: string | null = null;
let managed = false;
let known: Promise<void> = Promise.resolve();
let markKnown: (() => void) | null = null;
let firstState = true;

/** The key of `base` for `uid` (null: the Mesa «sin cuenta»). */
export function prepKeyFor(base: string, uid: string | null): string {
  return uid ? `${base}:${uid}` : base;
}

/**
 * The key of `base` for the account signed in now: taken at the call once the
 * auth state is known (a write queued behind others still goes to the account
 * of when it was asked for), else at the first auth state.
 */
export function prepKey(base: string): Promise<string> {
  if (!markKnown) return Promise.resolve(prepKeyFor(base, account));
  return known.then(() => prepKeyFor(base, account));
}

/** R9-269 — the Mesa's writes and its joins, one at a time. */
let turn: Promise<void> = Promise.resolve();
function oneAtATime<T>(fn: () => Promise<T>): Promise<T> {
  const run = turn.then(fn);
  turn = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

/**
 * R9-269 — a store's read-modify-write of its key (from `prepKey`, taken when
 * the write was asked for), one at a time with the joins. The key is awaited
 * first: it waits for the first auth state, whose join takes a turn.
 */
export async function prepWrite(
  key: Promise<string>,
  fn: (key: string) => Promise<void>,
): Promise<void> {
  const resolved = await key;
  return oneAtATime(() => fn(resolved));
}

/**
 * R9-273 — a write of Mesa keys from outside the stores (the restore of a
 * backup), one at a time with the stores' writes and the joins. Its keys are
 * resolved before asking, as `prepWrite` does: nothing inside a turn may wait
 * for one. Outside it, the restore landed between a join's reads and its
 * writes, and the join wrote over it (or removed it with the key).
 */
export function prepTurn<T>(fn: () => Promise<T>): Promise<T> {
  return oneAtATime(fn);
}

/** `AuthProvider`, as it mounts: keys wait for the first auth state. */
export function managePrepAccount(): void {
  if (managed) return;
  managed = true;
  known = new Promise<void>(resolve => {
    markKnown = resolve;
  });
}

/**
 * The Google account signed in now (null: none). The first call of the
 * process moves the Mesa written before R9-59 (see the header), and finishes
 * giving back the Mesa of a deleted account (R9-274), before any key
 * resolves.
 */
export async function setPrepAccount(uid: string | null): Promise<void> {
  account = uid;
  if (firstState) {
    firstState = false;
    await migrateLegacyPrep(uid);
    await finishRelease();
  }
  markKnown?.();
  markKnown = null;
}

async function migrateLegacyPrep(signedIn: string | null): Promise<void> {
  try {
    if ((await AsyncStorage.getItem(MIGRATED_KEY)) === '1') return;
    const owner =
      storeOwnerAccount(await AsyncStorage.getItem(LOCAL_STORE_OWNER_KEY)) ??
      signedIn;
    if (owner) await oneAtATime(() => joinPrep(null, owner));
    await AsyncStorage.setItem(MIGRATED_KEY, '1');
  } catch (error) {
    // Tried again on the next start; until then, the Mesa «sin cuenta».
    logger.warn('Failed to move the Mesa to its account', {
      error: String(error),
    });
  }
}

/** A sign-in that keeps the local data: the Mesa «sin cuenta» joins `uid`'s. */
export async function adoptNoAccountPrep(uid: string): Promise<void> {
  try {
    await oneAtATime(() => joinPrep(null, uid));
  } catch (error) {
    logger.warn('Failed to bring the Mesa into the account', {
      error: String(error),
    });
  }
}

/**
 * The account was deleted: its Mesa joins the Mesa «sin cuenta». R9-274 —
 * noted on disk first (`RELEASE_KEY`), and finished at the next start if it
 * does not finish here (the join fails, or the process ends in it): nothing
 * else reads a deleted account's keys, and its Mesa stayed under its uid for
 * good. Noted only once the account is gone (`deleteAccount` calls this after
 * `deleteUser`), so the next start gives it back without asking whether.
 */
export async function releasePrepAccount(uid: string): Promise<void> {
  try {
    await AsyncStorage.setItem(RELEASE_KEY, uid);
  } catch (error) {
    // The join is tried all the same: only its retry is lost.
    logger.warn('Failed to note the Mesa to give back', {
      error: String(error),
    });
  }
  await giveBack(uid);
}

/** R9-274 — a Mesa given back that did not finish (see `releasePrepAccount`). */
async function finishRelease(): Promise<void> {
  let uid: string | null;
  try {
    uid = await AsyncStorage.getItem(RELEASE_KEY);
  } catch (error) {
    // Read again on the next start.
    logger.warn('Failed to read the Mesa to give back', {
      error: String(error),
    });
    return;
  }
  if (uid) await giveBack(uid);
}

async function giveBack(uid: string): Promise<void> {
  try {
    await oneAtATime(() => joinPrep(uid, null, true));
    await AsyncStorage.removeItem(RELEASE_KEY);
  } catch (error) {
    logger.warn('Failed to give the Mesa back', {error: String(error)});
  }
}

function asMap(raw: string | null): Record<string, unknown> | null {
  if (raw == null) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

/** R9-269 — whether `a` has a later clock than `b` (both need one). */
function isNewer(a: unknown, b: unknown): boolean {
  const at = (a as {updatedAt?: unknown} | null)?.updatedAt;
  const bt = (b as {updatedAt?: unknown} | null)?.updatedAt;
  return typeof at === 'number' && typeof bt === 'number' && at > bt;
}

/**
 * Every Mesa key of `from` joins the one of `to`. R9-269 — an entry `to`
 * lacks moves, and one `to` holds as well stays in `from` (see the header);
 * `sourceGoes` (the account deleted): it cannot stay, and the newer of the
 * two is kept. `from`'s key goes once nothing is left in it. A value that is
 * not a map is left where it is: nothing would read it there, and nothing is
 * lost by keeping it.
 */
async function joinPrep(
  from: string | null,
  to: string | null,
  sourceGoes = false,
) {
  const pairs: Array<[string, string]> = [];
  const gone: string[] = [];
  for (const base of PREP_KEYS) {
    const fromKey = prepKeyFor(base, from);
    const toKey = prepKeyFor(base, to);
    const [fromRaw, toRaw] = await Promise.all([
      AsyncStorage.getItem(fromKey),
      AsyncStorage.getItem(toKey),
    ]);
    const source = asMap(fromRaw);
    if (!source) continue;
    const target = toRaw == null ? {} : asMap(toRaw);
    if (!target) continue;
    const joined: Record<string, unknown> = {...target};
    const stays: Record<string, unknown> = {};
    let moved = false;
    for (const [id, entry] of Object.entries(source)) {
      if (!(id in target)) {
        joined[id] = entry;
        moved = true;
      } else if (JSON.stringify(entry) === JSON.stringify(target[id])) {
        // Already there, the same.
      } else if (!sourceGoes) {
        stays[id] = entry;
      } else if (isNewer(entry, target[id])) {
        joined[id] = entry;
        moved = true;
      }
    }
    if (moved) pairs.push([toKey, JSON.stringify(joined)]);
    const left = Object.keys(stays).length;
    if (left === 0) gone.push(fromKey);
    else if (left < Object.keys(source).length) {
      pairs.push([fromKey, JSON.stringify(stays)]);
    }
  }
  // The joined copies first: a process that dies between the two keeps both.
  if (pairs.length > 0) await AsyncStorage.multiSet(pairs);
  if (gone.length > 0) await AsyncStorage.multiRemove(gone);
}

export function __resetPrepAccountForTests(): void {
  account = null;
  managed = false;
  known = Promise.resolve();
  markKnown = null;
  firstState = true;
  turn = Promise.resolve();
}
