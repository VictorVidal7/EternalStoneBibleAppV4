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
 * Para la gloria de Dios Todopoderoso ✨
 */
import * as LegacyFS from 'expo-file-system/legacy';
import bibleDB from './index';
import {PackDownloadError} from './pack-catalog';

/** Where the originals pack is hosted (same Pages host as translation packs). */
export const ORIGINALS_PACK_URL =
  'https://eternalstonebible.github.io/packs/originals.db';

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
    return words;
  } catch (error) {
    if (error instanceof PackDownloadError) throw error;
    throw new PackDownloadError('network', String(error));
  } finally {
    await safeDelete(dest);
  }
}
