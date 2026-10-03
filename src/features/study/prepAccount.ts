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
 * A join keeps both maps; on the same entry, the one already there wins.
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
 * process moves the Mesa written before R9-59 (see the header) before any
 * key resolves.
 */
export async function setPrepAccount(uid: string | null): Promise<void> {
  account = uid;
  if (firstState) {
    firstState = false;
    await migrateLegacyPrep(uid);
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
    if (owner) await joinPrep(null, owner);
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
    await joinPrep(null, uid);
  } catch (error) {
    logger.warn('Failed to bring the Mesa into the account', {
      error: String(error),
    });
  }
}

/** The account was deleted: its Mesa joins the Mesa «sin cuenta». */
export async function releasePrepAccount(uid: string): Promise<void> {
  try {
    await joinPrep(uid, null);
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

/**
 * Every Mesa key of `from` joins the one of `to`, and `from`'s goes. A value
 * that is not a map is left where it is: nothing would read it there, and
 * nothing is lost by keeping it.
 */
async function joinPrep(from: string | null, to: string | null) {
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
    pairs.push([toKey, JSON.stringify({...source, ...target})]);
    gone.push(fromKey);
  }
  if (pairs.length === 0) return;
  // The joined copies first: a process that dies between the two keeps both.
  await AsyncStorage.multiSet(pairs);
  await AsyncStorage.multiRemove(gone);
}

export function __resetPrepAccountForTests(): void {
  account = null;
  managed = false;
  known = Promise.resolve();
  markKnown = null;
  firstState = true;
}
