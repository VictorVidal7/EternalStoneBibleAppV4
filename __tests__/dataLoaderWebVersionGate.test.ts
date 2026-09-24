/**
 * Version-gate coverage for data-loader.web.ts's initializeBibleData (Phase
 * 3, red-letter web port). Before this gate, `packLoadedKey` alone made a
 * pack's AsyncStorage flag permanent — once a browser imported a pack, a
 * server-side content update (e.g. the Phase 1 WEB re-ingest, commit
 * 086882b) never reached it. `initializeBibleData` now also fetches
 * web-bootstrap.json and compares its per-pack sha256 against
 * `packVersionKey`'s stored value, re-importing whenever they differ — and
 * degrades to the original flag-only check if the manifest is unreachable.
 *
 * R9-109: the manifest sha256 is also checked against the BYTES before they
 * are imported. So the fixture below serves, for each pack file, bytes that
 * really hash to the sha256 the manifest pins (computed with node's own
 * crypto, an implementation independent of the app's sha256Hex). It used to
 * serve the same 8 zero bytes for every pack under made-up hashes
 * ('sha-rvr-current'), which is exactly the case the loader now refuses:
 * the assertions of the first five cases are unchanged, only what the fake
 * Pages serves became true.
 *
 * Mocks stub ONLY what a unit test cannot run, over the real modules: the
 * real `bibleDB` instance with `initialize`/`insertVerses` spied (they open
 * and write the OPFS database), and the real `expo-sqlite` with
 * `deserializeDatabaseAsync` replaced (it needs the web SQLite worker). A
 * literal factory would have BEEN those modules inside this test. The
 * expo-sqlite stub goes through a closure because `jest.mock` factories run
 * while this file's imports are being evaluated, before the `const mock...`
 * below exists.
 *
 * AsyncStorage itself needs no local mock — jest.setup.js already installs
 * the official in-memory `@react-native-async-storage/async-storage/jest/
 * async-storage-mock` for every test, so this file just seeds/reads it
 * directly and resets it with `AsyncStorage.clear()` between cases.
 */
import {createHash} from 'crypto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import bibleDB from '../src/lib/database';
import {initializeBibleData} from '../src/lib/database/data-loader.web';
import {packLoadedKey, packVersionKey} from '../src/lib/database/pack-import';

const mockGetAllAsync = jest.fn(async (_sql: unknown) => [
  {
    book_id: 1,
    book_name: 'Genesis',
    chapter: 1,
    verse: 1,
    text: 'In the beginning, God created the heavens and the earth.',
  },
]);
const mockCloseAsync = jest.fn(async (): Promise<void> => undefined);
const mockDeserializeDatabaseAsync = jest.fn(async (_bytes: unknown) => ({
  getAllAsync: (sql: unknown) => mockGetAllAsync(sql),
  closeAsync: () => mockCloseAsync(),
}));
jest.mock('expo-sqlite', () => ({
  ...jest.requireActual('expo-sqlite'),
  deserializeDatabaseAsync: (bytes: unknown) =>
    mockDeserializeDatabaseAsync(bytes),
}));

let mockInitialize: jest.SpyInstance;
let mockInsertVerses: jest.SpyInstance;

interface FakeResponse {
  ok: boolean;
  status: number;
  json: () => Promise<unknown>;
  arrayBuffer: () => Promise<ArrayBuffer>;
}

/** Stand-in pack bytes: what matters here is only what they hash to. */
function packBytes(label: string): Uint8Array {
  return new Uint8Array(Buffer.from(`SQLite format 3\0 fixture: ${label}`));
}

function sha256Of(bytes: Uint8Array): string {
  return createHash('sha256').update(bytes).digest('hex');
}

const RVR_BYTES = packBytes('rvr1960, current');
const WEB_BYTES = packBytes('web, current');
const WEB_BYTES_NEW = packBytes('web, after the re-ingest');
const RVR_SHA = sha256Of(RVR_BYTES);
const WEB_SHA = sha256Of(WEB_BYTES);
const WEB_SHA_NEW = sha256Of(WEB_BYTES_NEW);

/** What the fake Pages serves for each pack file, unless a case overrides it. */
const SERVED_BY_DEFAULT: Record<string, Uint8Array> = {
  'rvr1960.sqlite': RVR_BYTES,
  'web.sqlite': WEB_BYTES,
};

function buildManifest(rvrSha = RVR_SHA, webSha = WEB_SHA) {
  return {
    schema: 1,
    generated: '2026-07-23',
    packs: [
      {
        id: 'RVR1960',
        file: 'rvr1960.sqlite',
        bytes: 0,
        sha256: rvrSha,
        verseCount: 0,
      },
      {id: 'WEB', file: 'web.sqlite', bytes: 0, sha256: webSha, verseCount: 0},
    ],
    redLetter: {
      file: 'web-red-letter.json',
      bytes: 0,
      sha256: 'irrelevant-to-this-file',
      entries: 0,
      spans: 0,
    },
  };
}

/**
 * Routes `fetch` by URL: the manifest per `manifestMode`, else the pack file's
 * bytes from `served` (a copy, so nothing downstream can alias the fixture),
 * or an HTTP 404 for a file `served` maps to `null`.
 */
function installFetchMock(
  manifestMode:
    {kind: 'ok'; manifest: unknown} | {kind: 'reject'} | {kind: 'http-error'},
  served: Record<string, Uint8Array | null> = {},
): jest.Mock {
  const files = {...SERVED_BY_DEFAULT, ...served};
  const mock = jest.fn(async (input: unknown): Promise<FakeResponse> => {
    const url = String(input);
    if (url.endsWith('web-bootstrap.json')) {
      if (manifestMode.kind === 'reject') {
        throw new Error('network down');
      }
      if (manifestMode.kind === 'http-error') {
        return {
          ok: false,
          status: 500,
          json: async () => ({}),
          arrayBuffer: async () => new ArrayBuffer(0),
        };
      }
      return {
        ok: true,
        status: 200,
        json: async () => manifestMode.manifest,
        arrayBuffer: async () => new ArrayBuffer(0),
      };
    }
    // Any other URL is a pack-file fetch (rvr1960.sqlite / web.sqlite).
    const bytes = files[url.slice(url.lastIndexOf('/') + 1)];
    if (bytes === null) {
      return {
        ok: false,
        status: 404,
        json: async () => ({}),
        arrayBuffer: async () => new ArrayBuffer(0),
      };
    }
    if (!bytes) {
      throw new Error(`the fake Pages has no ${url}`);
    }
    return {
      ok: true,
      status: 200,
      json: async () => ({}),
      arrayBuffer: async () => new Uint8Array(bytes).buffer,
    };
  });
  global.fetch = mock as unknown as typeof fetch;
  return mock;
}

/** The pack files (not the manifest) a boot actually downloaded. */
function packFilesFetched(fetchMock: jest.Mock): string[] {
  return fetchMock.mock.calls
    .map(([input]) => String(input))
    .filter(url => !url.endsWith('web-bootstrap.json'))
    .map(url => url.slice(url.lastIndexOf('/') + 1));
}

/** The bytes each `deserializeDatabaseAsync` call was handed, as sha256. */
function deserializedShas(): string[] {
  return mockDeserializeDatabaseAsync.mock.calls.map(([bytes]) =>
    sha256Of(bytes as Uint8Array),
  );
}

beforeEach(async () => {
  jest.clearAllMocks();
  await AsyncStorage.clear();
  mockInitialize = jest
    .spyOn(bibleDB, 'initialize')
    .mockImplementation(async () => undefined);
  mockInsertVerses = jest
    .spyOn(bibleDB, 'insertVerses')
    .mockImplementation(async () => undefined);
});

afterEach(() => {
  mockInitialize.mockRestore();
  mockInsertVerses.mockRestore();
});

describe('initializeBibleData version gate', () => {
  it('skips the import when the flag is true and the stored hash matches the manifest sha256', async () => {
    await AsyncStorage.setItem(packLoadedKey('RVR1960'), 'true');
    await AsyncStorage.setItem(packVersionKey('RVR1960'), RVR_SHA);
    await AsyncStorage.setItem(packLoadedKey('WEB'), 'true');
    await AsyncStorage.setItem(packVersionKey('WEB'), WEB_SHA);
    const fetchMock = installFetchMock({kind: 'ok', manifest: buildManifest()});

    await initializeBibleData();

    // Only the manifest itself was fetched — neither pack file was touched.
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(mockInsertVerses).not.toHaveBeenCalled();
  });

  it('re-imports when the stored hash differs from the manifest, even though the flag is true', async () => {
    await AsyncStorage.setItem(packLoadedKey('RVR1960'), 'true');
    await AsyncStorage.setItem(packVersionKey('RVR1960'), RVR_SHA);
    await AsyncStorage.setItem(packLoadedKey('WEB'), 'true');
    await AsyncStorage.setItem(
      packVersionKey('WEB'),
      'stale-hash-from-before-the-reingest',
    );
    const fetchMock = installFetchMock(
      {kind: 'ok', manifest: buildManifest(RVR_SHA, WEB_SHA_NEW)},
      {'web.sqlite': WEB_BYTES_NEW},
    );

    await initializeBibleData();

    // Manifest + only the WEB pack file (RVR1960 still matched, so skipped).
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(mockInsertVerses).toHaveBeenCalledTimes(1);
    expect(await AsyncStorage.getItem(packVersionKey('WEB'))).toBe(WEB_SHA_NEW);
    // The flag importWebPack sets is untouched by the gate logic itself.
    expect(await AsyncStorage.getItem(packLoadedKey('WEB'))).toBe('true');
  });

  it('imports both packs on a fresh browser with nothing stored yet', async () => {
    const fetchMock = installFetchMock({kind: 'ok', manifest: buildManifest()});

    await initializeBibleData();

    expect(fetchMock).toHaveBeenCalledTimes(3); // manifest + 2 pack files
    expect(mockInsertVerses).toHaveBeenCalledTimes(2);
    expect(await AsyncStorage.getItem(packVersionKey('RVR1960'))).toBe(RVR_SHA);
    expect(await AsyncStorage.getItem(packVersionKey('WEB'))).toBe(WEB_SHA);
    expect(await AsyncStorage.getItem(packLoadedKey('RVR1960'))).toBe('true');
    expect(await AsyncStorage.getItem(packLoadedKey('WEB'))).toBe('true');
  });

  it('falls back to flag-only behavior when the manifest fetch rejects, without throwing', async () => {
    await AsyncStorage.setItem(packLoadedKey('RVR1960'), 'true'); // should stay skipped
    // WEB has never been loaded — should still import despite the manifest
    // being unreachable.
    installFetchMock({kind: 'reject'});

    await expect(initializeBibleData()).resolves.toBeUndefined();

    expect(mockInsertVerses).toHaveBeenCalledTimes(1);
    // No manifest was ever readable, so no sha256 was available to store.
    expect(await AsyncStorage.getItem(packVersionKey('WEB'))).toBeNull();
    expect(await AsyncStorage.getItem(packLoadedKey('WEB'))).toBe('true');
  });

  it('falls back to flag-only behavior when the manifest responds non-200, without throwing', async () => {
    await AsyncStorage.setItem(packLoadedKey('RVR1960'), 'true');
    await AsyncStorage.setItem(packLoadedKey('WEB'), 'true');
    installFetchMock({kind: 'http-error'});

    await expect(initializeBibleData()).resolves.toBeUndefined();

    // Both flags were already true, and with no manifest there's nothing to
    // compare against — the original flag-only check skips both.
    expect(mockInsertVerses).not.toHaveBeenCalled();
  });
});

describe('the bytes are checked against the manifest before they are imported (R9-109)', () => {
  // The same LENGTH as the good pack, like the contaminated RVR1960 pack that
  // sat next to the manifest in the default build output: a size check would
  // not have caught it.
  const RVR_BYTES_BAD = packBytes('rvr1960, CHATBOT');
  const RVR_BYTES_OLD = packBytes('rvr1960, before the fix');
  const RVR_SHA_OLD = sha256Of(RVR_BYTES_OLD);

  let errorSpy: jest.SpyInstance;
  let warnSpy: jest.SpyInstance;
  beforeEach(() => {
    errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });
  afterEach(() => {
    errorSpy.mockRestore();
    warnSpy.mockRestore();
  });

  /** A browser that already reads both packs, RVR1960 on its OLD version. */
  async function seedBootedOnOldRvr() {
    await AsyncStorage.setItem(packLoadedKey('RVR1960'), 'true');
    await AsyncStorage.setItem(packVersionKey('RVR1960'), RVR_SHA_OLD);
    await AsyncStorage.setItem(packLoadedKey('WEB'), 'true');
    await AsyncStorage.setItem(packVersionKey('WEB'), WEB_SHA);
  }

  it('the bad fixture really is the same size and a different hash', () => {
    expect(RVR_BYTES_BAD.length).toBe(RVR_BYTES.length);
    expect(sha256Of(RVR_BYTES_BAD)).not.toBe(RVR_SHA);
  });

  it('refuses a mismatching pack on a fresh browser — nothing imported, flagged or recorded — and the next start retries', async () => {
    installFetchMock(
      {kind: 'ok', manifest: buildManifest()},
      {'rvr1960.sqlite': RVR_BYTES_BAD},
    );

    await expect(initializeBibleData()).rejects.toThrow(
      /rvr1960\.sqlite does NOT match/,
    );

    expect(mockDeserializeDatabaseAsync).not.toHaveBeenCalled();
    expect(mockInsertVerses).not.toHaveBeenCalled();
    expect(await AsyncStorage.getItem(packLoadedKey('RVR1960'))).toBeNull();
    expect(await AsyncStorage.getItem(packVersionKey('RVR1960'))).toBeNull();
    // Loud: logged, naming both hashes, not swallowed.
    const logged = errorSpy.mock.calls.map(args => args.map(String).join(' '));
    expect(logged).toEqual([
      expect.stringContaining(
        `pins sha256 ${RVR_SHA}, the ${RVR_BYTES_BAD.length} bytes served ` +
          `hash to ${sha256Of(RVR_BYTES_BAD)}`,
      ),
    ]);

    // Next start: Pages serves the good bytes again.
    const fetchMock = installFetchMock({kind: 'ok', manifest: buildManifest()});
    await initializeBibleData();

    expect(packFilesFetched(fetchMock)).toEqual([
      'rvr1960.sqlite',
      'web.sqlite',
    ]);
    expect(deserializedShas()).toEqual([RVR_SHA, WEB_SHA]);
    expect(await AsyncStorage.getItem(packVersionKey('RVR1960'))).toBe(RVR_SHA);
    expect(await AsyncStorage.getItem(packLoadedKey('RVR1960'))).toBe('true');
  });

  it('keeps an already-booted browser reading its OLD version, with a warning and no error screen, and retries on the next start', async () => {
    // The ~10 minutes after a publish: the manifest pins the new RVR1960, but
    // the GitHub Pages cache still serves the old pack. Before R9-109 the
    // bytes went in AND the new sha256 was stored, so every later boot said
    // "current version" and the good pack was never fetched again. The first
    // R9-109 fix refused them by failing the boot — which put the error
    // screen in front of a reader whose text was fine. Now it keeps that text.
    await seedBootedOnOldRvr();
    installFetchMock(
      {kind: 'ok', manifest: buildManifest()},
      {'rvr1960.sqlite': RVR_BYTES_OLD},
    );

    await expect(initializeBibleData()).resolves.toBeUndefined();

    // Nothing of the old pack was overwritten: the bytes never got past the
    // check, and the flag and the OLD version are still what is stored.
    expect(mockDeserializeDatabaseAsync).not.toHaveBeenCalled();
    expect(mockInsertVerses).not.toHaveBeenCalled();
    expect(await AsyncStorage.getItem(packLoadedKey('RVR1960'))).toBe('true');
    expect(await AsyncStorage.getItem(packVersionKey('RVR1960'))).toBe(
      RVR_SHA_OLD,
    );
    // Not the error path (initializeBibleData's console.error, which
    // app/_layout.web.tsx turns into the error screen), but one clear warning
    // naming the version kept and both hashes.
    expect(errorSpy).not.toHaveBeenCalled();
    const warned = warnSpy.mock.calls.map(args => args.map(String).join(' '));
    expect(warned).toEqual([
      expect.stringContaining(
        `Keeping the RVR1960 text this browser already has (stored version ${RVR_SHA_OLD})`,
      ),
    ]);
    expect(warned[0]).toContain(
      `pins sha256 ${RVR_SHA}, the ${RVR_BYTES_OLD.length} bytes served ` +
        `hash to ${RVR_SHA_OLD}`,
    );

    // Next start, the cache still stale: it downloads again, and keeps again.
    let fetchMock = installFetchMock(
      {kind: 'ok', manifest: buildManifest()},
      {'rvr1960.sqlite': RVR_BYTES_OLD},
    );
    await expect(initializeBibleData()).resolves.toBeUndefined();
    expect(packFilesFetched(fetchMock)).toEqual(['rvr1960.sqlite']);
    expect(await AsyncStorage.getItem(packVersionKey('RVR1960'))).toBe(
      RVR_SHA_OLD,
    );

    // The start after that, Pages serves the new pack: imported and recorded.
    fetchMock = installFetchMock({kind: 'ok', manifest: buildManifest()});
    await initializeBibleData();

    expect(packFilesFetched(fetchMock)).toEqual(['rvr1960.sqlite']);
    expect(deserializedShas()).toEqual([RVR_SHA]);
    expect(await AsyncStorage.getItem(packVersionKey('RVR1960'))).toBe(RVR_SHA);
    expect(errorSpy).not.toHaveBeenCalled();
  });

  it('keeping one pack does not stop the other pack from updating on the same start', async () => {
    await seedBootedOnOldRvr();
    await AsyncStorage.setItem(packVersionKey('WEB'), 'stale-web-hash');
    const fetchMock = installFetchMock(
      {kind: 'ok', manifest: buildManifest(RVR_SHA, WEB_SHA_NEW)},
      {'rvr1960.sqlite': RVR_BYTES_BAD, 'web.sqlite': WEB_BYTES_NEW},
    );

    await expect(initializeBibleData()).resolves.toBeUndefined();

    expect(packFilesFetched(fetchMock)).toEqual([
      'rvr1960.sqlite',
      'web.sqlite',
    ]);
    expect(deserializedShas()).toEqual([WEB_SHA_NEW]);
    expect(await AsyncStorage.getItem(packVersionKey('RVR1960'))).toBe(
      RVR_SHA_OLD,
    );
    expect(await AsyncStorage.getItem(packVersionKey('WEB'))).toBe(WEB_SHA_NEW);
  });

  it('forgives only a mismatch: any other failure updating a booted browser still fails the boot', async () => {
    // Decided for bytes that do not verify, and only for those. A pack that
    // does not arrive at all fails exactly as it did before R9-109.
    await seedBootedOnOldRvr();
    installFetchMock(
      {kind: 'ok', manifest: buildManifest()},
      {'rvr1960.sqlite': null},
    );

    await expect(initializeBibleData()).rejects.toThrow(
      'Web pack fetch failed (rvr1960.sqlite): HTTP 404',
    );

    expect(warnSpy).not.toHaveBeenCalled();
    expect(await AsyncStorage.getItem(packVersionKey('RVR1960'))).toBe(
      RVR_SHA_OLD,
    );
  });

  it('imports a matching pack exactly as before (the control)', async () => {
    const fetchMock = installFetchMock({kind: 'ok', manifest: buildManifest()});

    await initializeBibleData();

    expect(packFilesFetched(fetchMock)).toEqual([
      'rvr1960.sqlite',
      'web.sqlite',
    ]);
    // The very bytes served reached the importer, and each pack's rows were
    // inserted tagged with its own version.
    expect(deserializedShas()).toEqual([RVR_SHA, WEB_SHA]);
    expect(
      mockInsertVerses.mock.calls.map(([rows]) => rows[0].version),
    ).toEqual(['RVR1960', 'WEB']);
    expect(errorSpy).not.toHaveBeenCalled();
  });

  it('accepts an UPPERCASE manifest sha256 and records it so the next boot skips', async () => {
    // sha256Hex prints lowercase; native compares against `.toLowerCase()`.
    installFetchMock({
      kind: 'ok',
      manifest: buildManifest(RVR_SHA.toUpperCase(), WEB_SHA.toUpperCase()),
    });

    await initializeBibleData();
    expect(deserializedShas()).toEqual([RVR_SHA, WEB_SHA]);

    const fetchMock = installFetchMock({
      kind: 'ok',
      manifest: buildManifest(RVR_SHA.toUpperCase(), WEB_SHA.toUpperCase()),
    });
    await initializeBibleData();
    expect(packFilesFetched(fetchMock)).toEqual([]);
  });
});

describe('a manifest that pins nothing for a pack is the flag-only check (R9-109)', () => {
  /** A manifest whose WEB entry is `webEntry` (or absent when undefined). */
  function manifestWithWebEntry(webEntry?: Record<string, unknown>) {
    const manifest = buildManifest();
    return {
      ...manifest,
      packs: [manifest.packs[0], ...(webEntry === undefined ? [] : [webEntry])],
    };
  }

  beforeEach(async () => {
    await AsyncStorage.setItem(packLoadedKey('RVR1960'), 'true');
    await AsyncStorage.setItem(packVersionKey('RVR1960'), RVR_SHA);
  });

  it('does not re-download an already-loaded pack the manifest does not list, on every boot', async () => {
    await AsyncStorage.setItem(packLoadedKey('WEB'), 'true');
    const fetchMock = installFetchMock({
      kind: 'ok',
      manifest: manifestWithWebEntry(),
    });

    await initializeBibleData();

    expect(packFilesFetched(fetchMock)).toEqual([]);
    expect(mockInsertVerses).not.toHaveBeenCalled();
  });

  it('treats an entry with no sha256 the same way, instead of failing the boot', async () => {
    await AsyncStorage.setItem(packLoadedKey('WEB'), 'true');
    const fetchMock = installFetchMock({
      kind: 'ok',
      manifest: manifestWithWebEntry({id: 'WEB', file: 'web.sqlite'}),
    });

    await expect(initializeBibleData()).resolves.toBeUndefined();

    expect(packFilesFetched(fetchMock)).toEqual([]);
  });

  it('treats an entry whose sha256 is not a string the same way, instead of failing the boot', async () => {
    // The manifest is parsed JSON: a missing sha256 is not the only way it
    // can fail the interface. The case above would pass with a check that
    // only handles `undefined` (`sha256?.toLowerCase()`); a number reaches
    // `.toLowerCase` and throws a TypeError that fails the boot.
    await AsyncStorage.setItem(packLoadedKey('WEB'), 'true');
    const fetchMock = installFetchMock({
      kind: 'ok',
      manifest: manifestWithWebEntry({
        id: 'WEB',
        file: 'web.sqlite',
        sha256: 12345,
      }),
    });

    await expect(initializeBibleData()).resolves.toBeUndefined();

    expect(packFilesFetched(fetchMock)).toEqual([]);
    expect(await AsyncStorage.getItem(packVersionKey('WEB'))).toBeNull();
  });

  it('still imports it on a fresh browser, recording no version (the control)', async () => {
    // Without this, refusing every unpinned pack would pass the two cases
    // above and leave a fresh browser with no WEB text at all.
    const fetchMock = installFetchMock({
      kind: 'ok',
      manifest: manifestWithWebEntry(),
    });

    await initializeBibleData();

    expect(packFilesFetched(fetchMock)).toEqual(['web.sqlite']);
    expect(await AsyncStorage.getItem(packLoadedKey('WEB'))).toBe('true');
    // Nothing verified these bytes, so nothing claims a version for them: the
    // first boot whose manifest does pin WEB re-imports it, checked.
    expect(await AsyncStorage.getItem(packVersionKey('WEB'))).toBeNull();
  });
});
