import * as LegacyFS from 'expo-file-system/legacy';
import {File} from 'expo-file-system';
import bibleDB from './index';
import {sha256Hex} from './sha256';
import {
  CATALOG_URL,
  PackDownloadError,
  parseVersionCatalog,
  type RemotePackVersion,
} from './pack-catalog';

/**
 * Downloadable translation-pack service (translation packs, phase 4).
 *
 * Flow per pack: fetch the catalog → check free space → download the .sqlite to
 * the cache dir with progress → verify byte size + SHA-256 → import via
 * bibleDB.importVersionPack (its triggers index FTS) → delete the temp file.
 * Every failure throws a typed {@link PackDownloadError} so the UI localizes it,
 * and the temp file is always cleaned up. The download is resumable/retryable —
 * the import is idempotent (INSERT OR IGNORE), so a retry never duplicates rows.
 */

/** Headroom over the pack size we require free before downloading + importing. */
const SPACE_HEADROOM = 2.5;

/**
 * Fetch + parse the hosted catalog of downloadable versions. A cache-buster
 * query keeps a freshly-deployed versions.json from being served stale.
 */
export async function fetchVersionCatalog(): Promise<RemotePackVersion[]> {
  try {
    const res = await fetch(`${CATALOG_URL}?t=${Date.now()}`);
    if (!res.ok) {
      throw new PackDownloadError('network', `catalog HTTP ${res.status}`);
    }
    return parseVersionCatalog(await res.json());
  } catch (error) {
    if (error instanceof PackDownloadError) throw error;
    throw new PackDownloadError('network', String(error));
  }
}

/** Best-effort delete of a temp download (never throws). */
async function safeDelete(uri: string): Promise<void> {
  try {
    await LegacyFS.deleteAsync(uri, {idempotent: true});
  } catch {
    // Already gone — nothing to clean up.
  }
}

/**
 * Download a pack and import its verses. Reports progress in [0, 1]. Returns the
 * number of verses actually inserted (0 if the version was already imported).
 * The caller refreshes the version registry afterwards.
 */
export async function downloadAndImportPack(
  version: RemotePackVersion,
  onProgress?: (fraction: number) => void,
): Promise<number> {
  const cacheDir = LegacyFS.cacheDirectory;
  if (!cacheDir) {
    throw new PackDownloadError('network', 'no cache directory');
  }
  const dest = `${cacheDir}pack-${version.id.toLowerCase()}.sqlite`;

  // 1) Free-space check (download file + the rows it adds to bible.db).
  try {
    const free = await LegacyFS.getFreeDiskStorageAsync();
    if (free > 0 && free < version.bytes * SPACE_HEADROOM) {
      throw new PackDownloadError('insufficient-space');
    }
  } catch (error) {
    if (error instanceof PackDownloadError) throw error;
    // getFreeDiskStorageAsync failed — don't block the download over it.
  }

  await safeDelete(dest);

  try {
    // 2) Download with progress.
    const task = LegacyFS.createDownloadResumable(version.url, dest, {}, p => {
      if (!onProgress) return;
      const total = p.totalBytesExpectedToWrite;
      const fraction =
        total > 0
          ? p.totalBytesWritten / total
          : version.bytes > 0
            ? p.totalBytesWritten / version.bytes
            : 0;
      onProgress(Math.max(0, Math.min(1, fraction)));
    });
    const result = await task.downloadAsync();
    if (!result || !result.uri) {
      throw new PackDownloadError('network', 'download produced no file');
    }

    // 3) Verify byte size (cheap) before the hash (expensive).
    const info = await LegacyFS.getInfoAsync(dest);
    if (!info.exists) {
      throw new PackDownloadError('size-mismatch', 'missing after download');
    }
    if (info.size !== version.bytes) {
      throw new PackDownloadError(
        'size-mismatch',
        `expected ${version.bytes} got ${info.size}`,
      );
    }

    // 4) Verify SHA-256.
    const bytes = await new File(dest).bytes();
    const digest = sha256Hex(bytes);
    if (digest !== version.sha256.toLowerCase()) {
      throw new PackDownloadError(
        'checksum-mismatch',
        `expected ${version.sha256} got ${digest}`,
      );
    }

    // 5) Import (ATTACH + INSERT OR IGNORE; triggers index FTS).
    let inserted: number;
    try {
      inserted = await bibleDB.importVersionPack(dest, version.id);
    } catch (error) {
      throw new PackDownloadError('import-failed', String(error));
    }

    onProgress?.(1);
    return inserted;
  } finally {
    await safeDelete(dest);
  }
}

/**
 * Remove a downloaded version's verses (and its loaded-flag). Returns the number
 * of verses removed. Bundled versions are refused by bibleDB.deleteVersion.
 */
export async function removeInstalledVersion(
  versionId: string,
): Promise<number> {
  return bibleDB.deleteVersion(versionId);
}
