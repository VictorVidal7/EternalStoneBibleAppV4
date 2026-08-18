/**
 * originals-download-service unit tests — the originals-pack staleness
 * mechanism (fetchOriginalsMeta / parseOriginalsMeta / isOriginalsUpdateAvailable)
 * plus downloadAndImportOriginals persisting the installed sha256 on success.
 * Mocks expo-file-system/legacy + ../index the same way
 * version-download-service.test.ts does, and global fetch the same way
 * giftCodeService.test.ts does. AsyncStorage runs against the real jest mock
 * wired up in jest.setup.js (in-memory), so getInstalledOriginalsSha256 exercises
 * a genuine read/write round trip.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import {PackDownloadError} from '../pack-catalog';

const mockCreateDownloadResumable = jest.fn();
const mockGetInfoAsync = jest.fn();
const mockDeleteAsync = jest.fn();

jest.mock('expo-file-system/legacy', () => ({
  cacheDirectory: '/cache/',
  createDownloadResumable: (...args: unknown[]) =>
    mockCreateDownloadResumable(...args),
  getInfoAsync: (...args: unknown[]) => mockGetInfoAsync(...args),
  deleteAsync: (...args: unknown[]) => mockDeleteAsync(...args),
}));

const mockImportOriginalsPack = jest.fn();
const mockOriginalsInstalled = jest.fn();

jest.mock('../index', () => ({
  __esModule: true,
  default: {
    importOriginalsPack: (...args: unknown[]) =>
      mockImportOriginalsPack(...args),
    originalsInstalled: (...args: unknown[]) => mockOriginalsInstalled(...args),
  },
}));

import {
  parseOriginalsMeta,
  fetchOriginalsMeta,
  getInstalledOriginalsSha256,
  isOriginalsUpdateAvailable,
  downloadAndImportOriginals,
  ORIGINALS_META_URL,
} from '../originals-download-service';

const VALID_META = {
  schema: 1,
  bytes: 31178752,
  sha256: 'A'.repeat(64), // uppercase on purpose — parse must lowercase it
  generated: '2026-08-18',
  wordCount: 425424,
  lexiconEntries: 14197,
  note: 'corrected pack',
};

function mockFetchJsonOnce(ok: boolean, body: unknown) {
  (global.fetch as jest.Mock).mockResolvedValueOnce({
    ok,
    json: jest.fn().mockResolvedValue(body),
  });
}

describe('parseOriginalsMeta', () => {
  it('parses a valid payload, lowercasing the sha256', () => {
    expect(parseOriginalsMeta(VALID_META)).toEqual({
      schema: 1,
      bytes: 31178752,
      sha256: 'a'.repeat(64),
      generated: '2026-08-18',
      wordCount: 425424,
      lexiconEntries: 14197,
      note: 'corrected pack',
    });
  });

  it('defaults optional/missing fields without failing', () => {
    expect(parseOriginalsMeta({sha256: 'abc', bytes: 100})).toEqual({
      schema: 1,
      bytes: 100,
      sha256: 'abc',
      generated: '',
      wordCount: 0,
      lexiconEntries: 0,
      note: undefined,
    });
  });

  it.each([
    null,
    undefined,
    'not an object',
    42,
    {},
    {sha256: '', bytes: 100},
    {sha256: '   ', bytes: 100},
    {bytes: 100},
    {sha256: 'abc'},
    {sha256: 'abc', bytes: 0},
    {sha256: 'abc', bytes: -5},
    {sha256: 'abc', bytes: NaN},
    {sha256: 'abc', bytes: 'huge'},
  ])('rejects a malformed payload %p', payload => {
    expect(parseOriginalsMeta(payload)).toBeNull();
  });
});

describe('fetchOriginalsMeta', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  it('fetches with a cache-busting query and returns the parsed meta', async () => {
    mockFetchJsonOnce(true, VALID_META);
    const meta = await fetchOriginalsMeta();
    expect(meta?.sha256).toBe('a'.repeat(64));
    const url = (global.fetch as jest.Mock).mock.calls[0][0] as string;
    expect(url).toContain(ORIGINALS_META_URL);
    expect(url).toMatch(/\?t=\d+$/);
  });

  it('returns null on a non-ok response', async () => {
    mockFetchJsonOnce(false, VALID_META);
    expect(await fetchOriginalsMeta()).toBeNull();
  });

  it('returns null on malformed JSON body', async () => {
    mockFetchJsonOnce(true, {not: 'the right shape'});
    expect(await fetchOriginalsMeta()).toBeNull();
  });

  it('returns null when fetch itself throws (offline)', async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error('network down'));
    expect(await fetchOriginalsMeta()).toBeNull();
  });

  it('returns null when the body is not valid JSON', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockRejectedValue(new Error('not json')),
    });
    expect(await fetchOriginalsMeta()).toBeNull();
  });
});

describe('getInstalledOriginalsSha256 + isOriginalsUpdateAvailable', () => {
  beforeEach(async () => {
    global.fetch = jest.fn();
    await AsyncStorage.clear();
  });

  it('is null when nothing was ever installed', async () => {
    expect(await getInstalledOriginalsSha256()).toBeNull();
  });

  it('reports no update when the metadata fetch fails (offline)', async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error('offline'));
    expect(await isOriginalsUpdateAvailable()).toBe(false);
  });

  it('reports an update when there is no local sha at all (pre-dates tracking)', async () => {
    mockFetchJsonOnce(true, VALID_META);
    expect(await isOriginalsUpdateAvailable()).toBe(true);
  });

  it('reports an update when the local sha differs from the remote one', async () => {
    await AsyncStorage.setItem('@originals_pack_sha256', 'b'.repeat(64));
    mockFetchJsonOnce(true, VALID_META);
    expect(await isOriginalsUpdateAvailable()).toBe(true);
  });

  it('reports no update when the local sha matches the remote one', async () => {
    await AsyncStorage.setItem('@originals_pack_sha256', 'a'.repeat(64));
    mockFetchJsonOnce(true, VALID_META);
    expect(await isOriginalsUpdateAvailable()).toBe(false);
  });
});

describe('downloadAndImportOriginals — persists the installed sha256', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
    await AsyncStorage.clear();
    mockImportOriginalsPack.mockResolvedValue(247);
    mockDeleteAsync.mockResolvedValue(undefined);
  });

  it('stores the remote sha256 after a successful download + import', async () => {
    mockCreateDownloadResumable.mockReturnValue({
      downloadAsync: jest.fn().mockResolvedValue({status: 200}),
    });
    mockFetchJsonOnce(true, VALID_META);

    const words = await downloadAndImportOriginals();

    expect(words).toBe(247);
    expect(mockImportOriginalsPack).toHaveBeenCalledWith('/cache/originals.db');
    expect(await getInstalledOriginalsSha256()).toBe('a'.repeat(64));
  });

  it('still resolves when the post-import metadata fetch fails (best-effort)', async () => {
    mockCreateDownloadResumable.mockReturnValue({
      downloadAsync: jest.fn().mockResolvedValue({status: 200}),
    });
    (global.fetch as jest.Mock).mockRejectedValue(new Error('offline'));

    const words = await downloadAndImportOriginals();

    expect(words).toBe(247);
    expect(await getInstalledOriginalsSha256()).toBeNull();
  });

  it('throws a network PackDownloadError and never imports on a bad HTTP status', async () => {
    mockCreateDownloadResumable.mockReturnValue({
      downloadAsync: jest.fn().mockResolvedValue({status: 500}),
    });

    await expect(downloadAndImportOriginals()).rejects.toBeInstanceOf(
      PackDownloadError,
    );
    expect(mockImportOriginalsPack).not.toHaveBeenCalled();
  });
});
