/**
 * Pure helpers for the downloadable translation-pack catalog (phase 4).
 *
 * The catalog (`/packs/versions.json`, hosted on the GitHub Pages site) lists
 * each downloadable pack with the metadata needed to download + verify + import
 * it. Parsing/validation lives here, DB-/network-free, so it stays unit-testable;
 * the actual fetch + download run in version-download-service.ts.
 */

/** The hosted catalog of downloadable packs. */
export const CATALOG_URL =
  'https://eternalstonebible.github.io/packs/versions.json';

/**
 * Security hardening — allow-list of origins a pack `url` (and the originals
 * pack, see originals-download-service.ts's ORIGINALS_PACK_URL) is ever
 * permitted to point at. The catalog itself is fetched from this same GitHub
 * Pages host (see CATALOG_URL), but its `versions` array is untrusted
 * third-party-shaped data once parsed — a compromised catalog response (bad
 * deploy, DNS/MITM on a network that doesn't validate the TLS cert, etc.)
 * should not be able to redirect a download to an arbitrary attacker host.
 * This is defense-in-depth only: downloads are already verified by exact
 * byte-size + SHA-256 before import (see version-download-service.ts), so an
 * attacker-controlled URL still couldn't get an unverified file imported —
 * but it could exfiltrate the device's IP/UA to an arbitrary host, or serve
 * a large file as a denial-of-service, so it's worth rejecting outright.
 *
 * Every `startsWith` prefix ends in a trailing slash so a lookalike host
 * (e.g. `https://eternalstonebible.github.io.evil.com/`) can never match.
 */
const ALLOWED_PACK_URL_PREFIXES = ['https://eternalstonebible.github.io/'];

/** Whether `url` is hosted on an allow-listed pack origin. */
export function isAllowedPackUrl(url: string): boolean {
  return ALLOWED_PACK_URL_PREFIXES.some(prefix => url.startsWith(prefix));
}

/** One downloadable version as described by versions.json. */
export interface RemotePackVersion {
  id: string;
  name: string;
  abbreviation: string;
  language: string;
  year: string;
  license: string;
  /** Absolute URL of the .sqlite pack. */
  url: string;
  /** Exact byte size of the .sqlite pack (for the size check + progress). */
  bytes: number;
  /** Lowercase hex SHA-256 of the .sqlite pack (integrity check). */
  sha256: string;
  /** Verse count (shown in the UI; informational). */
  verseCount: number;
}

const isNonEmptyString = (x: unknown): x is string =>
  typeof x === 'string' && x.trim().length > 0;

/**
 * Validate one raw catalog entry into a RemotePackVersion, or return null if it
 * is missing required fields / has the wrong shape. Defensive: a malformed entry
 * is skipped, not allowed to crash the whole catalog parse.
 */
export function parsePackVersion(raw: unknown): RemotePackVersion | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  if (
    !isNonEmptyString(o.id) ||
    !isNonEmptyString(o.url) ||
    !isNonEmptyString(o.sha256) ||
    typeof o.bytes !== 'number' ||
    !Number.isFinite(o.bytes) ||
    o.bytes <= 0
  ) {
    return null;
  }
  // Security hardening: a catalog entry pointing off the allow-listed pack
  // host is dropped here, at parse time, so it never reaches the UI as a
  // selectable/downloadable version in the first place. See
  // isAllowedPackUrl's doc comment for why this matters despite the
  // downstream size + SHA-256 verification.
  if (!isAllowedPackUrl(o.url.trim())) {
    return null;
  }
  return {
    id: o.id.trim(),
    name: isNonEmptyString(o.name) ? o.name : o.id.trim(),
    abbreviation: isNonEmptyString(o.abbreviation)
      ? o.abbreviation
      : o.id.trim(),
    language: isNonEmptyString(o.language) ? o.language : 'en',
    year: isNonEmptyString(o.year) ? o.year : '',
    license: isNonEmptyString(o.license) ? o.license : '',
    url: o.url.trim(),
    bytes: o.bytes,
    sha256: o.sha256.trim().toLowerCase(),
    verseCount:
      typeof o.verseCount === 'number' && Number.isFinite(o.verseCount)
        ? o.verseCount
        : 0,
  };
}

/**
 * Parse the catalog JSON (already-parsed object or a raw string) into the list
 * of valid downloadable versions. Tolerates a missing/oddly-shaped payload by
 * returning [] rather than throwing.
 */
export function parseVersionCatalog(json: unknown): RemotePackVersion[] {
  let data = json;
  if (typeof data === 'string') {
    try {
      data = JSON.parse(data);
    } catch {
      return [];
    }
  }
  if (!data || typeof data !== 'object') return [];
  const versions = (data as Record<string, unknown>).versions;
  if (!Array.isArray(versions)) return [];
  const out: RemotePackVersion[] = [];
  for (const raw of versions) {
    const parsed = parsePackVersion(raw);
    if (parsed) out.push(parsed);
  }
  return out;
}

/** Human-readable size like "4.7 MB" for the catalog UI. */
export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '—';
  const mb = bytes / (1024 * 1024);
  if (mb >= 1) return `${mb.toFixed(1)} MB`;
  const kb = bytes / 1024;
  return `${Math.max(1, Math.round(kb))} KB`;
}

/** Error codes the download service throws, so the UI can localize each case. */
export type PackDownloadErrorCode =
  | 'network'
  | 'insufficient-space'
  | 'checksum-mismatch'
  | 'size-mismatch'
  | 'import-failed'
  | 'untrusted-source';

export class PackDownloadError extends Error {
  code: PackDownloadErrorCode;
  constructor(code: PackDownloadErrorCode, message?: string) {
    super(message ?? code);
    this.name = 'PackDownloadError';
    this.code = code;
  }
}
