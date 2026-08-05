/**
 * Security hardening — pack-download URL allow-list, enforced a second time
 * (defense-in-depth) at the actual download call site in
 * version-download-service.ts, in case a `RemotePackVersion` somehow reaches
 * `downloadAndImportPack` without having gone through
 * pack-catalog.ts's `parsePackVersion` (which already rejects untrusted
 * hosts — see pack-catalog.test.ts). This test focuses narrowly on that
 * guard: a version whose `url` isn't allow-listed must be rejected with
 * `PackDownloadError('untrusted-source', ...)` *before* any filesystem or
 * network work (free-space check, download) is attempted.
 */
import {PackDownloadError, type RemotePackVersion} from '../pack-catalog';
import {downloadAndImportPack} from '../version-download-service';

const mockGetFreeDiskStorageAsync = jest.fn();
const mockCreateDownloadResumable = jest.fn();
const mockGetInfoAsync = jest.fn();
const mockDeleteAsync = jest.fn();

jest.mock('expo-file-system/legacy', () => ({
  cacheDirectory: '/cache/',
  getFreeDiskStorageAsync: (...args: unknown[]) =>
    mockGetFreeDiskStorageAsync(...args),
  createDownloadResumable: (...args: unknown[]) =>
    mockCreateDownloadResumable(...args),
  getInfoAsync: (...args: unknown[]) => mockGetInfoAsync(...args),
  deleteAsync: (...args: unknown[]) => mockDeleteAsync(...args),
}));

jest.mock('expo-file-system', () => ({
  File: jest.fn(),
}));

jest.mock('../index', () => ({
  __esModule: true,
  default: {importVersionPack: jest.fn(), deleteVersion: jest.fn()},
}));

jest.mock('../sha256', () => ({sha256Hex: jest.fn()}));

const BASE_VERSION: RemotePackVersion = {
  id: 'RVR1960',
  name: 'Reina-Valera 1960',
  abbreviation: 'RVR1960',
  language: 'es',
  year: '1960',
  license: 'Public Domain',
  url: 'https://eternalstonebible.github.io/packs/rvr1960.sqlite',
  bytes: 4_700_000,
  sha256: 'a'.repeat(64),
  verseCount: 31103,
};

describe('downloadAndImportPack — URL allow-list guard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('rejects a version whose url is off the allow-listed host, before any download work', async () => {
    const malicious: RemotePackVersion = {
      ...BASE_VERSION,
      url: 'https://evil.example.com/rvr1960.sqlite',
    };

    await expect(downloadAndImportPack(malicious)).rejects.toMatchObject({
      code: 'untrusted-source',
    });
    await expect(downloadAndImportPack(malicious)).rejects.toBeInstanceOf(
      PackDownloadError,
    );

    expect(mockGetFreeDiskStorageAsync).not.toHaveBeenCalled();
    expect(mockCreateDownloadResumable).not.toHaveBeenCalled();
  });

  it('does not reject a version whose url IS on the allow-listed host on that basis', async () => {
    // Let the free-space check short-circuit immediately after (return 0 disables
    // the check per the implementation), so this only proves the allow-list gate
    // itself doesn't fire for a legitimate host — not a full happy-path download.
    mockGetFreeDiskStorageAsync.mockResolvedValue(0);
    mockCreateDownloadResumable.mockReturnValue({
      downloadAsync: jest.fn().mockResolvedValue(null),
    });

    await expect(downloadAndImportPack(BASE_VERSION)).rejects.not.toMatchObject(
      {code: 'untrusted-source'},
    );
    expect(mockCreateDownloadResumable).toHaveBeenCalledWith(
      BASE_VERSION.url,
      expect.any(String),
      {},
      expect.any(Function),
    );
  });
});
