/* eslint-disable no-console -- mirrors data-loader.ts's dev-mode init logging. */
import * as SQLite from 'expo-sqlite';
import AsyncStorage from '@react-native-async-storage/async-storage';
import bibleDB from './index';
import {packLoadedKey, packVersionKey} from './pack-import';
import {sha256Hex} from './sha256';

/**
 * Web variant of data-loader.ts (T21). Native embeds RVR1960 + WEB in
 * assets/bible-seed.db and falls back to the in-repo bible-data-*.ts arrays
 * (~6 MB of JS each) if that seed copy fails. Web deliberately has NEITHER:
 * this file must never import bible-data-rvr1960.ts / bible-data-web.ts, or
 * Metro would bundle that weight into the web build regardless of whether
 * it's ever used (T19 §3.1a chose "start empty, download a ~4.7 MB pack" over
 * embarking the 20.8 MB seed specifically to keep the Hosting deploy light).
 *
 * Instead: fetch the small web-only bootstrap pack (built by
 * scripts/build-web-packs.js, published alongside — but NOT listed in —
 * web/packs/versions.json, since that catalog is also read by the native
 * download-versions screen, which doesn't filter out already-bundled
 * versions), open it as a temporary in-memory SQLite db, read its rows over
 * the public getAllAsync API, and insert them into the main (OPFS-persisted)
 * db via the same bibleDB.insertVerses() the legacy JS loader already uses.
 * No ATTACH DATABASE / OPFS-naming needed for the pack itself — it's only
 * read once, then discarded.
 */

/**
 * Both bundled versions download on first run — the shared BIBLE_VERSIONS
 * catalog (src/constants/bible.ts) marks RVR1960 + WEB `bundled: true`
 * unconditionally (it's not platform-aware), so useBibleVersion's
 * language-sync effect treats both as "available" regardless of what's
 * actually in the web DB. Importing only one left the other selectable but
 * empty — confirmed live in Chrome: the UI language auto-selected WEB
 * (unimported) and every chapter query returned zero rows.
 */
const DATA_LOADED_KEY_RVR1960 = packLoadedKey('RVR1960');
const DATA_LOADED_KEY_WEB = packLoadedKey('WEB');

/**
 * Base URL for the web-only bootstrap packs. Points at the same GitHub Pages
 * host the native downloadable packs already use (T20 confirmed cross-origin
 * fetch works fine under COEP credentialless). Overridable via
 * EXPO_PUBLIC_WEB_PACKS_BASE_URL for local verification against a same-origin
 * dev static server before the packs are uploaded to Pages.
 */
const WEB_PACKS_BASE_URL =
  process.env.EXPO_PUBLIC_WEB_PACKS_BASE_URL ??
  'https://eternalstonebible.github.io/packs/';

interface PackRow {
  book_id: number;
  book_name: string;
  chapter: number;
  verse: number;
  text: string;
}

/**
 * The served bytes are not the ones web-bootstrap.json pins (R9-109). Its own
 * class so initializeBibleData can tell it from every other import failure:
 * this is the one it forgives when the browser already holds the pack.
 */
class WebPackMismatchError extends Error {}

/**
 * Fetch + import one web-bootstrap pack into the main db, tagged `versionId`.
 *
 * R9-109: when the manifest pins a sha256 for this pack, the bytes are hashed
 * and checked against it BEFORE anything is deserialized or inserted. Without
 * that, the pin was only a cache token: bytes the manifest does not describe
 * were imported (INSERT OR REPLACE) and the caller then recorded the
 * manifest's sha256 as the imported version — so every later boot saw
 * "already current" and skipped, and re-uploading the good pack cured nobody,
 * because the manifest sha256 it would have to change never changes. That is
 * not hypothetical: the default build output held a same-size RVR1960 pack
 * with chatbot text inside 2 Kings 22:9, sitting next to the manifest that
 * pins the good one.
 *
 * A mismatch throws a WebPackMismatchError before anything is written — no
 * verses, no loaded flag, no version — so the next start downloads it again.
 * What that costs this boot is the caller's call (initializeBibleData): a
 * browser with no text for this version fails the boot, one that already has
 * it keeps reading it.
 *
 * sha256Hex is the pure-JS digest native already verifies packs with
 * (version-download-service.ts), not crypto.subtle: WebCrypto is undefined
 * outside a secure context (plain http on a LAN IP, the usual way to try the
 * web build on a phone). Measured in headless Chromium on 4.7 MB: ~200 ms,
 * against ~30 ms for crypto.subtle — paid only when a pack is downloaded.
 */
async function importWebPack(
  versionId: string,
  fileName: string,
  expectedSha256: string | null,
  onProgress?: (loaded: number, total: number) => void,
): Promise<void> {
  const res = await fetch(`${WEB_PACKS_BASE_URL}${fileName}`);
  if (!res.ok) {
    throw new Error(`Web pack fetch failed (${fileName}): HTTP ${res.status}`);
  }
  const bytes = new Uint8Array(await res.arrayBuffer());

  if (expectedSha256 !== null) {
    const actualSha256 = sha256Hex(bytes);
    if (actualSha256 !== expectedSha256) {
      throw new WebPackMismatchError(
        `Web pack ${fileName} does NOT match web-bootstrap.json: the manifest ` +
          `pins sha256 ${expectedSha256}, the ${bytes.length} bytes served ` +
          `hash to ${actualSha256}. Refusing to import it: nothing was ` +
          'written, so the next start downloads it again.',
      );
    }
  }

  const packDb = await SQLite.deserializeDatabaseAsync(bytes);
  try {
    const rows = await packDb.getAllAsync<PackRow>(
      'SELECT book_id, book_name, chapter, verse, text FROM verses ORDER BY book_id, chapter, verse',
    );
    const total = rows.length;
    const CHUNK_SIZE = 1000;
    for (let i = 0; i < total; i += CHUNK_SIZE) {
      const chunk = rows.slice(i, i + CHUNK_SIZE).map(r => ({
        book: r.book_name,
        bookNumber: r.book_id,
        chapter: r.chapter,
        verse: r.verse,
        text: r.text,
        version: versionId,
      }));
      await bibleDB.insertVerses(chunk);
      onProgress?.(Math.min(i + CHUNK_SIZE, total), total);
    }
  } finally {
    await packDb.closeAsync();
  }

  await AsyncStorage.setItem(packLoadedKey(versionId), 'true');
}

const BOOTSTRAP_PACKS: Array<{versionId: string; key: string; file: string}> = [
  {versionId: 'RVR1960', key: DATA_LOADED_KEY_RVR1960, file: 'rvr1960.sqlite'},
  {versionId: 'WEB', key: DATA_LOADED_KEY_WEB, file: 'web.sqlite'},
];

/**
 * The subset of web-bootstrap.json (scripts/build-web-packs.js) this file
 * actually reads. `schema`/`generated`/`redLetter` exist in the real
 * manifest but belong to other Phase 3 work, not the version-gate below.
 */
interface WebBootstrapManifestPack {
  id: string;
  sha256: string;
}

interface WebBootstrapManifest {
  packs: WebBootstrapManifestPack[];
}

/**
 * Fetch the live manifest so a server-side pack update (e.g. the Phase 1
 * WEB re-ingest from eBible.org, commit 086882b) actually reaches browsers
 * that already imported an older pack — see packVersionKey's doc comment
 * for why packLoadedKey alone can't do this (once set it is never
 * re-checked against the pack's actual content).
 *
 * Never lets a manifest problem block app boot: offline, a non-200, or
 * malformed JSON all land in the catch and this resolves to `null`, which
 * the caller treats as "fall back to the original flag-only check".
 */
async function fetchWebBootstrapManifest(): Promise<WebBootstrapManifest | null> {
  try {
    const res = await fetch(`${WEB_PACKS_BASE_URL}web-bootstrap.json`);
    if (!res.ok) {
      throw new Error(`Manifest fetch failed: HTTP ${res.status}`);
    }
    const parsed = (await res.json()) as WebBootstrapManifest;
    if (!Array.isArray(parsed?.packs)) {
      throw new Error('Manifest fetch succeeded but had an unexpected shape');
    }
    return parsed;
  } catch (error) {
    console.warn(
      '⚠️ [web] Bootstrap manifest unavailable, falling back to flag-only pack checks:',
      error,
    );
    return null;
  }
}

/**
 * The sha256 the live manifest pins for `versionId`, lowercased the way
 * sha256Hex prints it (native compares against `.toLowerCase()` too), or
 * `null` when there is nothing to check the bytes against: no manifest this
 * run, no entry for this version, or an entry whose sha256 is not a string.
 *
 * R9-109: those three are one case, the flag-only check. A missing entry used
 * to be re-imported on EVERY boot — 4.7 MB each time, and now that a pin is
 * what gets verified, unverified bytes each time too. The type check is what
 * keeps an entry without a sha256 (it is parsed JSON, the interface is only a
 * hope) from throwing here and failing the boot.
 */
function pinnedSha256(
  manifest: WebBootstrapManifest | null,
  versionId: string,
): string | null {
  const sha256: unknown = manifest?.packs.find(p => p.id === versionId)?.sha256;
  return typeof sha256 === 'string' ? sha256.toLowerCase() : null;
}

export async function initializeBibleData(
  onProgress?: (loaded: number, total: number) => void,
): Promise<void> {
  try {
    console.log('🔵 [web] Starting Bible data initialization...');
    await bibleDB.initialize();

    const manifest = await fetchWebBootstrapManifest();

    for (const pack of BOOTSTRAP_PACKS) {
      const expectedSha256 = pinnedSha256(manifest, pack.versionId);
      if (expectedSha256 === null) {
        // Nothing pins this pack this run — exactly the original flag-only
        // check. No version is stored, so the next boot that does get a pin
        // re-imports (verified) instead of trusting these bytes.
        const isLoaded = await AsyncStorage.getItem(pack.key);
        if (isLoaded === 'true') {
          console.log(`🟢 [web] ${pack.versionId} already loaded, skipping`);
          continue;
        }
        console.log(`📖 [web] Downloading ${pack.versionId} bootstrap pack...`);
        await importWebPack(pack.versionId, pack.file, null, onProgress);
        console.log(`✅ [web] ${pack.versionId} bootstrap pack imported`);
        continue;
      }

      const isLoaded = await AsyncStorage.getItem(pack.key);
      const storedVersion = await AsyncStorage.getItem(
        packVersionKey(pack.versionId),
      );

      if (isLoaded === 'true' && storedVersion === expectedSha256) {
        console.log(
          `🟢 [web] ${pack.versionId} already loaded (current version), skipping`,
        );
        continue;
      }

      if (isLoaded === 'true') {
        console.log(
          `📖 [web] Newer ${pack.versionId} bootstrap pack available, re-importing...`,
        );
      } else {
        console.log(`📖 [web] Downloading ${pack.versionId} bootstrap pack...`);
      }
      try {
        await importWebPack(
          pack.versionId,
          pack.file,
          expectedSha256,
          onProgress,
        );
      } catch (error) {
        // Bytes that do not verify, on a browser that already reads this
        // version: most likely the ~10 minutes after a publish, while the
        // GitHub Pages cache still serves the old pack next to the new
        // manifest. The error screen would take away text that is fine, so
        // keep it. Nothing was written (the check runs before deserializing),
        // and skipping the setItem below leaves the old version stored, so
        // the next start tries again. A browser with no text for it has
        // nothing to keep: that still throws, as does any other failure.
        if (isLoaded === 'true' && error instanceof WebPackMismatchError) {
          console.warn(
            `⚠️ [web] Keeping the ${pack.versionId} text this browser already ` +
              `has (stored version ${storedVersion ?? 'none'}); the next start ` +
              'tries the update again.',
            error,
          );
          continue;
        }
        throw error;
      }
      // importWebPack refused any bytes whose sha256 is not this one, so this
      // records the version of the bytes actually imported — not merely the
      // one the manifest names (R9-109).
      await AsyncStorage.setItem(
        packVersionKey(pack.versionId),
        expectedSha256,
      );
      console.log(`✅ [web] ${pack.versionId} bootstrap pack imported`);
    }
  } catch (error) {
    console.error('❌ [web] Bible data initialization error:', error);
    throw error;
  }
}

export async function checkDataStatus(): Promise<{
  isLoaded: boolean;
  stats?: {totalVerses: number; versions: string[]};
}> {
  const isLoaded =
    (await AsyncStorage.getItem(DATA_LOADED_KEY_RVR1960)) === 'true';
  if (!isLoaded) return {isLoaded: false};

  try {
    await bibleDB.initialize();
    const db = await bibleDB.getDatabase();
    const result = await db.getFirstAsync<{count: number; versions: string}>(
      'SELECT COUNT(*) as count, GROUP_CONCAT(DISTINCT version) as versions FROM verses',
    );
    if (result && result.count > 0) {
      return {
        isLoaded: true,
        stats: {
          totalVerses: result.count,
          versions: result.versions ? result.versions.split(',') : [],
        },
      };
    }
  } catch (error) {
    console.warn('[web] Could not check database stats:', error);
  }
  return {isLoaded: false};
}

export async function resetBibleData(): Promise<void> {
  console.log('🔄 [web] Resetting Bible data...');
  await AsyncStorage.removeItem(DATA_LOADED_KEY_RVR1960);
  await AsyncStorage.removeItem(packLoadedKey('WEB'));
  try {
    const db = await bibleDB.getDatabase();
    await db.execAsync('DELETE FROM verses;');
    console.log('✅ [web] Database cleared successfully');
  } catch (error) {
    console.error('❌ [web] Error clearing database:', error);
  }
}

/**
 * Recovery path for the OPFS stale-lock case (T22, isStorageLockError).
 * Unlike resetBibleData(), this must NOT touch bibleDB — opening the
 * database is exactly what's failing, so any SQL-based clear would hit the
 * same lock. Instead it drops down to the browser storage APIs directly:
 * every file expo-sqlite's AccessHandlePoolVFS keeps in the origin's OPFS
 * (under a directory it names 'expo-sqlite', see
 * node_modules/expo-sqlite/web/worker.ts's VFS_NAME_PERSISTENT) holds the
 * exclusive lock, and the only way to release a lock left by a crashed or
 * hard-reloaded prior page load is to delete the underlying OPFS file and
 * let SQLite recreate it fresh.
 *
 * Clears the WHOLE OPFS root for this origin rather than targeting just the
 * 'expo-sqlite' subdirectory by name — this app has no other OPFS
 * consumer today, and an origin-wide clear can't drift out of sync with
 * expo-sqlite's internal file-naming scheme (random per-file names, not
 * 'bible.db') the way a narrower guess could. Also clears any IndexedDB
 * databases on this origin as a defensive no-op today (nothing here uses
 * IDB; AsyncStorage-web is backed by localStorage, not IDB — see
 * @react-native-async-storage/async-storage's web AsyncStorage.ts) in case
 * a future expo-sqlite version adds an IDB-backed VFS. The caller is
 * responsible for the actual window.location.reload() afterward — a real
 * page reload is what tears down the poisoned SQLite worker (see
 * isStorageLockError's doc comment) and lets the browser drop the handle.
 */
export async function clearWebStorageForLockRecovery(): Promise<void> {
  console.log(
    '🔓 [web] Clearing OPFS/IndexedDB storage to recover from a stale lock...',
  );

  try {
    const root = await navigator.storage.getDirectory();
    const names: string[] = [];
    for await (const name of (
      root as unknown as {keys(): AsyncIterableIterator<string>}
    ).keys()) {
      names.push(name);
    }
    await Promise.all(
      names.map(name =>
        root.removeEntry(name, {recursive: true}).catch(entryError => {
          console.warn(
            `⚠️ [web] Could not remove OPFS entry "${name}":`,
            entryError,
          );
        }),
      ),
    );
    console.log(
      `✅ [web] Cleared ${names.length} OPFS entr${names.length === 1 ? 'y' : 'ies'}`,
    );
  } catch (error) {
    console.warn('⚠️ [web] OPFS clear failed (continuing anyway):', error);
  }

  try {
    if (typeof indexedDB !== 'undefined' && indexedDB.databases) {
      const dbs = await indexedDB.databases();
      await Promise.all(
        dbs
          .map(db => db.name)
          .filter((name): name is string => !!name)
          .map(
            name =>
              new Promise<void>(resolve => {
                const req = indexedDB.deleteDatabase(name);
                req.onsuccess = () => resolve();
                req.onerror = () => resolve();
                req.onblocked = () => resolve();
              }),
          ),
      );
    }
  } catch (error) {
    console.warn('⚠️ [web] IndexedDB clear failed (continuing anyway):', error);
  }

  await AsyncStorage.removeItem(DATA_LOADED_KEY_RVR1960);
  await AsyncStorage.removeItem(DATA_LOADED_KEY_WEB);
}
