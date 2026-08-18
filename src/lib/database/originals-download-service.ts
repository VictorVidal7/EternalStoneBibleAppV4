/**
 * 📜 originals-download-service — fetch + import the original-languages pack.
 *
 * The pack (~30 MB Hebrew/Greek words + Strong's lexicon) is OPTIONAL and lives
 * on the same GitHub Pages host as the translation packs. Flow: download the
 * .db to the cache dir with progress → import via bibleDB.importOriginalsPack →
 * delete the temp file. Idempotent (the import clears+reloads), resumable.
 *
 * `importLocalOriginalsIfPresent` also imports a pack file already sitting in
 * the cache (a resumed/sideloaded download) — the path the in-app download
 * writes to, so a partially-completed flow finishes cleanly on next open.
 *
 * The pack has no version number of its own — staleness is tracked by SHA-256
 * against a small hosted `originals-meta.json` (fetchOriginalsMeta), so an
 * already-installed user can be told a corrected pack is available without
 * re-downloading the ~30 MB file just to check.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */
import * as LegacyFS from 'expo-file-system/legacy';
import AsyncStorage from '@react-native-async-storage/async-storage';
import bibleDB from './index';
import {PackDownloadError} from './pack-catalog';

/** Where the originals pack is hosted (same Pages host as translation packs). */
export const ORIGINALS_PACK_URL =
  'https://eternalstonebible.github.io/packs/originals.db';

/** Small metadata file alongside the pack — lets the UI check for a newer
 *  pack without downloading the full ~30 MB file. */
export const ORIGINALS_META_URL =
  'https://eternalstonebible.github.io/packs/originals-meta.json';

const ORIGINALS_PACK_SHA256_KEY = '@originals_pack_sha256';

/** Shape of the hosted originals-meta.json. */
export interface OriginalsPackMeta {
  schema: number;
  bytes: number;
  sha256: string;
  generated: string;
  wordCount: number;
  lexiconEntries: number;
  note?: string;
}

/**
 * Validate a raw originals-meta.json payload, or return null if it's missing
 * the fields staleness detection needs. Defensive: a malformed payload never
 * throws, it just means "no update detected".
 */
export function parseOriginalsMeta(json: unknown): OriginalsPackMeta | null {
  if (!json || typeof json !== 'object') return null;
  const o = json as Record<string, unknown>;
  if (typeof o.sha256 !== 'string' || o.sha256.trim().length === 0) return null;
  if (
    typeof o.bytes !== 'number' ||
    !Number.isFinite(o.bytes) ||
    o.bytes <= 0
  ) {
    return null;
  }
  return {
    schema: typeof o.schema === 'number' ? o.schema : 1,
    bytes: o.bytes,
    sha256: o.sha256.trim().toLowerCase(),
    generated: typeof o.generated === 'string' ? o.generated : '',
    wordCount: typeof o.wordCount === 'number' ? o.wordCount : 0,
    lexiconEntries: typeof o.lexiconEntries === 'number' ? o.lexiconEntries : 0,
    note: typeof o.note === 'string' ? o.note : undefined,
  };
}

/**
 * Fetch + parse the hosted originals-pack metadata. Never throws — a network
 * failure or malformed payload just means "no update detected", same spirit
 * as {@link importLocalOriginalsIfPresent}. A cache-buster query keeps a
 * freshly-deployed file from being served stale.
 */
export async function fetchOriginalsMeta(): Promise<OriginalsPackMeta | null> {
  try {
    const res = await fetch(`${ORIGINALS_META_URL}?t=${Date.now()}`);
    if (!res.ok) return null;
    return parseOriginalsMeta(await res.json());
  } catch {
    return null;
  }
}

/** The sha256 of the originals pack currently installed, or null when unknown
 *  (installed before this staleness tracking existed). */
export async function getInstalledOriginalsSha256(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(ORIGINALS_PACK_SHA256_KEY);
  } catch {
    return null;
  }
}

/**
 * Whether a newer originals pack is available: the installed sha256 differs
 * from the remote metadata's, OR is unknown (installed before staleness was
 * tracked) — both cases are treated the same way by the caller (offer the
 * update, don't nag). A failed metadata fetch (offline) never signals one.
 */
export async function isOriginalsUpdateAvailable(): Promise<boolean> {
  const meta = await fetchOriginalsMeta();
  if (!meta) return false;
  const installedSha = await getInstalledOriginalsSha256();
  return installedSha !== meta.sha256;
}

/** Local cache path the pack downloads to / is imported from. */
export function localOriginalsPackPath(): string | null {
  const cacheDir = LegacyFS.cacheDirectory;
  return cacheDir ? `${cacheDir}originals.db` : null;
}

async function safeDelete(uri: string): Promise<void> {
  try {
    await LegacyFS.deleteAsync(uri, {idempotent: true});
  } catch {
    // Already gone.
  }
}

/**
 * If the pack isn't imported yet but a downloaded file is already in the cache,
 * import it (and clean up). Returns true when it imported something. Never
 * throws — a failure just leaves the feature uninstalled.
 */
export async function importLocalOriginalsIfPresent(): Promise<boolean> {
  try {
    if (await bibleDB.originalsInstalled()) return false;
    const path = localOriginalsPackPath();
    if (!path) return false;
    const info = await LegacyFS.getInfoAsync(path);
    if (!info.exists || (info.size ?? 0) < 1_000_000) return false;
    await bibleDB.importOriginalsPack(path);
    await safeDelete(path);
    return true;
  } catch {
    return false;
  }
}

/**
 * Download the originals pack and import it. Reports progress in [0, 1].
 * Throws a typed {@link PackDownloadError} on failure (UI localizes it); the
 * temp file is cleaned up on both success and failure.
 */
export async function downloadAndImportOriginals(
  onProgress?: (fraction: number) => void,
): Promise<number> {
  const dest = localOriginalsPackPath();
  if (!dest) throw new PackDownloadError('network', 'no cache directory');

  const resumable = LegacyFS.createDownloadResumable(
    ORIGINALS_PACK_URL,
    dest,
    {},
    p => {
      if (onProgress && p.totalBytesExpectedToWrite > 0) {
        onProgress(p.totalBytesWritten / p.totalBytesExpectedToWrite);
      }
    },
  );

  try {
    const result = await resumable.downloadAsync();
    if (!result || result.status !== 200) {
      throw new PackDownloadError(
        'network',
        `download HTTP ${result?.status ?? '?'}`,
      );
    }
    const words = await bibleDB.importOriginalsPack(dest);
    try {
      const meta = await fetchOriginalsMeta();
      if (meta) {
        await AsyncStorage.setItem(ORIGINALS_PACK_SHA256_KEY, meta.sha256);
      }
    } catch {
      // Best-effort — a failed metadata fetch/save doesn't undo a successful
      // import; the next update check just won't have a local sha to compare.
    }
    return words;
  } catch (error) {
    if (error instanceof PackDownloadError) throw error;
    throw new PackDownloadError('network', String(error));
  } finally {
    await safeDelete(dest);
  }
}
