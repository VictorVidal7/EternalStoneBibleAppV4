/**
 * Tests for src/lib/reading/redLetterText.web.ts — the web variant of
 * redLetterText.ts, which fetches red-letter spans at runtime instead of
 * statically importing WEB_RED_LETTER.
 *
 * spansByVersion/loadPromises are module-level singletons keyed by version id
 * (by design — see the source file's doc comment), so each test below gets a
 * FRESH module instance via jest.resetModules() + require() rather than the
 * static top-of-file import — otherwise a successful load in one test would
 * leak into and mask the "before load" / "fails open" assertions of later
 * tests.
 */
import {getBookByName} from '../src/constants/bible';
import type {LinkifiedSegment} from '../src/lib/references/parseReference';
import type {RedLetterRun} from '../src/lib/reading/redLetterText.web';

type RedLetterTextWebModule =
  typeof import('../src/lib/reading/redLetterText.web');

let redLetterTextWeb: RedLetterTextWebModule;

function mockFetchOnce(response: {
  ok: boolean;
  status?: number;
  json?: () => Promise<unknown>;
}) {
  (global.fetch as jest.Mock).mockResolvedValueOnce(response);
}

beforeEach(() => {
  jest.resetModules();
  global.fetch = jest.fn();
  redLetterTextWeb = require('../src/lib/reading/redLetterText.web');
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('mergeRedLetterSpans (copied from redLetterText.ts — must behave identically)', () => {
  it('with no spans, returns the link segments unchanged (just adding isRedLetter: false)', () => {
    const segments: LinkifiedSegment[] = [{text: 'Hello world'}];
    const result = redLetterTextWeb.mergeRedLetterSpans(
      'Hello world',
      segments,
      [],
    );
    expect(result).toEqual([
      {text: 'Hello world', ref: undefined, isRedLetter: false},
    ]);
  });

  it('a span covering the middle of a single no-ref segment splits into before/red/after runs', () => {
    const text = 'before RED after';
    expect(text.slice(7, 10)).toBe('RED');
    const segments: LinkifiedSegment[] = [{text}];
    const result = redLetterTextWeb.mergeRedLetterSpans(text, segments, [
      [7, 10],
    ]);
    expect(result).toEqual([
      {text: 'before ', ref: undefined, isRedLetter: false},
      {text: 'RED', ref: undefined, isRedLetter: true},
      {text: ' after', ref: undefined, isRedLetter: false},
    ]);
  });

  it('a ref segment overlapping a red-letter span stays ONE run with isRedLetter: false and its ref preserved (link wins)', () => {
    const john = getBookByName('John')!;
    expect(john).toBeDefined();
    const fakeRef = {
      book: john,
      chapter: 3,
      verse: 16,
    };
    const text = 'as it says in John 3:16 today';
    const linkText = 'John 3:16';
    const linkStart = text.indexOf(linkText);
    const segments: LinkifiedSegment[] = [
      {text: text.slice(0, linkStart)},
      {text: linkText, ref: fakeRef},
      {text: text.slice(linkStart + linkText.length)},
    ];
    const overlapStart = 5;
    const overlapEnd = linkStart + 4;
    const result = redLetterTextWeb.mergeRedLetterSpans(text, segments, [
      [overlapStart, overlapEnd],
    ]);

    const refRun = result.find(r => r.ref !== undefined);
    expect(refRun).toEqual({text: linkText, ref: fakeRef, isRedLetter: false});
    expect(result.some(r => r.isRedLetter === true)).toBe(true);
    expect(result.map(r => r.text).join('')).toBe(text);
  });

  it('never produces zero-length runs, even when a span end lands exactly on a segment boundary', () => {
    const partA = 'red words here';
    const partB = 'more plain text';
    const text = partA + partB;
    const segments: LinkifiedSegment[] = [{text: partA}, {text: partB}];
    const result = redLetterTextWeb.mergeRedLetterSpans(text, segments, [
      [0, partA.length],
    ]);

    expect(result.every(r => r.text.length > 0)).toBe(true);
    expect(result).toEqual([
      {text: partA, ref: undefined, isRedLetter: true},
      {text: partB, ref: undefined, isRedLetter: false},
    ]);
    expect(result.map(r => r.text).join('')).toBe(text);
  });

  it('drops a zero-length run when a span starts exactly where the previous span ended, at a segment boundary', () => {
    const text = 'AAAABBBB';
    const segments: LinkifiedSegment[] = [{text: 'AAAA'}, {text: 'BBBB'}];
    const result: RedLetterRun[] = redLetterTextWeb.mergeRedLetterSpans(
      text,
      segments,
      [
        [0, 4],
        [4, 8],
      ],
    );
    expect(result.every(r => r.text.length > 0)).toBe(true);
    expect(result).toEqual([
      {text: 'AAAA', ref: undefined, isRedLetter: true},
      {text: 'BBBB', ref: undefined, isRedLetter: true},
    ]);
    expect(result.map(r => r.text).join('')).toBe(text);
  });
});

describe('getRedLetterSpans / loadRedLetterSpans', () => {
  it('returns undefined before loadRedLetterSpans() has resolved', () => {
    expect(
      redLetterTextWeb.getRedLetterSpans('WEB', 43, 3, 16),
    ).toBeUndefined();
  });

  it('after a successful load, returns the right spans for a matching key and undefined for a non-matching one', async () => {
    const fixture = [
      {book_id: 43, chapter: 3, verse: 16, spans: [[0, 10]]},
      {book_id: 40, chapter: 5, verse: 3, spans: [[2, 6]]},
    ];
    mockFetchOnce({ok: true, json: async () => fixture});

    await redLetterTextWeb.loadRedLetterSpans('WEB');

    expect(redLetterTextWeb.getRedLetterSpans('WEB', 43, 3, 16)).toEqual([
      [0, 10],
    ]);
    expect(redLetterTextWeb.getRedLetterSpans('WEB', 40, 5, 3)).toEqual([
      [2, 6],
    ]);
    expect(redLetterTextWeb.getRedLetterSpans('WEB', 1, 1, 1)).toBeUndefined();
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('web-red-letter.json'),
    );
  });

  it('fails open on a rejected fetch: getRedLetterSpans keeps returning undefined without throwing', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(
      new Error('network down'),
    );
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    await expect(
      redLetterTextWeb.loadRedLetterSpans('WEB'),
    ).resolves.toBeUndefined();

    expect(
      redLetterTextWeb.getRedLetterSpans('WEB', 43, 3, 16),
    ).toBeUndefined();
    expect(redLetterTextWeb.getRedLetterSpans('WEB', 1, 1, 1)).toBeUndefined();
    expect(warnSpy).toHaveBeenCalled();
  });

  it('fails open on a non-ok response: getRedLetterSpans keeps returning undefined without throwing', async () => {
    mockFetchOnce({ok: false, status: 404});
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    await expect(
      redLetterTextWeb.loadRedLetterSpans('WEB'),
    ).resolves.toBeUndefined();

    expect(
      redLetterTextWeb.getRedLetterSpans('WEB', 43, 3, 16),
    ).toBeUndefined();
    expect(warnSpy).toHaveBeenCalled();
  });

  it('calling loadRedLetterSpans() twice concurrently for the SAME version only triggers ONE fetch call', async () => {
    let resolveJson: (value: unknown[]) => void;
    const jsonPromise = new Promise<unknown[]>(resolve => {
      resolveJson = resolve;
    });
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => jsonPromise,
    });

    const p1 = redLetterTextWeb.loadRedLetterSpans('WEB');
    const p2 = redLetterTextWeb.loadRedLetterSpans('WEB');

    resolveJson!([{book_id: 43, chapter: 3, verse: 16, spans: [[0, 5]]}]);
    await Promise.all([p1, p2]);

    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(redLetterTextWeb.getRedLetterSpans('WEB', 43, 3, 16)).toEqual([
      [0, 5],
    ]);
  });

  it('a subsequent call after a successful load resolves immediately without re-fetching', async () => {
    mockFetchOnce({
      ok: true,
      json: async () => [{book_id: 43, chapter: 3, verse: 16, spans: [[0, 5]]}],
    });

    await redLetterTextWeb.loadRedLetterSpans('WEB');
    await redLetterTextWeb.loadRedLetterSpans('WEB');

    expect(global.fetch).toHaveBeenCalledTimes(1);
  });
});

/**
 * Per-version packs. Until 2026-09-15 this module knew one pack,
 * web-red-letter.json, so reading in Spanish on the web got no red letters at
 * all while native had had RVR1960 spans since 2026-08-18.
 *
 * These are the assertions that would catch the two ways of getting it wrong:
 * fetching the WRONG file for a version, and letting one version's spans
 * answer for another. The second matters more than it looks — a span is a
 * character offset into that translation's verse text, so serving WEB offsets
 * over RVR1960 text would not render "nothing", it would render red on the
 * wrong words.
 */
describe('one pack per version', () => {
  it('fetches rvr1960-red-letter.json for RVR1960, not the WEB pack', async () => {
    mockFetchOnce({
      ok: true,
      json: async () => [
        {book_id: 43, chapter: 3, verse: 16, spans: [[0, 145]]},
      ],
    });

    await redLetterTextWeb.loadRedLetterSpans('RVR1960');

    expect(global.fetch).toHaveBeenCalledTimes(1);
    const url = (global.fetch as jest.Mock).mock.calls[0][0] as string;
    expect(url).toContain('rvr1960-red-letter.json');
    expect(url).not.toContain('web-red-letter.json');
  });

  it('keeps the two versions separate: WEB spans never answer for RVR1960', async () => {
    mockFetchOnce({
      ok: true,
      json: async () => [
        {book_id: 43, chapter: 3, verse: 16, spans: [[0, 130]]},
      ],
    });
    await redLetterTextWeb.loadRedLetterSpans('WEB');

    // Same verse, different translation: still unknown, and asking for it
    // fires its OWN fetch rather than reusing the WEB map.
    expect(
      redLetterTextWeb.getRedLetterSpans('RVR1960', 43, 3, 16),
    ).toBeUndefined();

    mockFetchOnce({
      ok: true,
      json: async () => [
        {book_id: 43, chapter: 3, verse: 16, spans: [[0, 145]]},
      ],
    });
    await redLetterTextWeb.loadRedLetterSpans('RVR1960');

    expect(global.fetch).toHaveBeenCalledTimes(2);
    // The offsets differ because the sentences do — that IS the reason the
    // maps must not be shared.
    expect(redLetterTextWeb.getRedLetterSpans('WEB', 43, 3, 16)).toEqual([
      [0, 130],
    ]);
    expect(redLetterTextWeb.getRedLetterSpans('RVR1960', 43, 3, 16)).toEqual([
      [0, 145],
    ]);
  });

  it('a failed load for one version does not poison the other', async () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    mockFetchOnce({ok: false, status: 404});
    await redLetterTextWeb.loadRedLetterSpans('RVR1960');
    expect(
      redLetterTextWeb.getRedLetterSpans('RVR1960', 43, 3, 16),
    ).toBeUndefined();

    mockFetchOnce({
      ok: true,
      json: async () => [
        {book_id: 43, chapter: 3, verse: 16, spans: [[0, 130]]},
      ],
    });
    await redLetterTextWeb.loadRedLetterSpans('WEB');

    expect(redLetterTextWeb.getRedLetterSpans('WEB', 43, 3, 16)).toEqual([
      [0, 130],
    ]);
    expect(warnSpy).toHaveBeenCalled();
  });

  it('a TRANSIENT failure is not permanent: the next call retries and succeeds', async () => {
    // R9-71. The failure path used to settle the version as an empty Map,
    // which is indistinguishable from "loaded, and this version genuinely has
    // no spans" — so nothing ever retried and red-letter stayed dead for the
    // rest of the page's life, while `hasRedLetterData` kept the switch
    // enabled and the reader kept painting plain text with no explanation.
    // One dropped request on a flaky connection was enough. It is easier to
    // hit than it looks: a GitHub Pages 404 is served with NO CORS header, so
    // a cross-origin fetch that receives one rejects with
    // `TypeError: Failed to fetch` and lands in this same catch.
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    (global.fetch as jest.Mock).mockRejectedValueOnce(
      new TypeError('Failed to fetch'),
    );

    await redLetterTextWeb.loadRedLetterSpans('RVR1960');
    expect(
      redLetterTextWeb.getRedLetterSpans('RVR1960', 43, 3, 16),
    ).toBeUndefined();
    expect(warnSpy).toHaveBeenCalled();

    // The reader asks again on the next mount / version switch / toggle.
    mockFetchOnce({
      ok: true,
      json: async () => [
        {book_id: 43, chapter: 3, verse: 16, spans: [[0, 145]]},
      ],
    });
    await redLetterTextWeb.loadRedLetterSpans('RVR1960');

    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(redLetterTextWeb.getRedLetterSpans('RVR1960', 43, 3, 16)).toEqual([
      [0, 145],
    ]);
  });

  it('retries even when fetch throws SYNCHRONOUSLY', async () => {
    // The cleanup cannot live in a `finally` inside the loader closure: that
    // body runs synchronously up to its first `await`, so a synchronous throw
    // would run the cleanup BEFORE the in-flight entry is recorded, leaving it
    // stuck forever — the no-retry bug re-entering through the back door.
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    (global.fetch as jest.Mock).mockImplementationOnce(() => {
      throw new TypeError('Failed to fetch');
    });

    await redLetterTextWeb.loadRedLetterSpans('RVR1960');
    expect(warnSpy).toHaveBeenCalled();

    mockFetchOnce({
      ok: true,
      json: async () => [
        {book_id: 43, chapter: 3, verse: 16, spans: [[0, 145]]},
      ],
    });
    await redLetterTextWeb.loadRedLetterSpans('RVR1960');

    expect(redLetterTextWeb.getRedLetterSpans('RVR1960', 43, 3, 16)).toEqual([
      [0, 145],
    ]);
  });

  it('a SUCCESSFUL load is still never re-fetched (the control for the retry above)', async () => {
    // Without this, "always retry" would pass the test above and turn every
    // render into a network request. Success must still settle for good.
    mockFetchOnce({
      ok: true,
      json: async () => [
        {book_id: 43, chapter: 3, verse: 16, spans: [[0, 145]]},
      ],
    });
    await redLetterTextWeb.loadRedLetterSpans('RVR1960');
    await redLetterTextWeb.loadRedLetterSpans('RVR1960');
    await redLetterTextWeb.loadRedLetterSpans('RVR1960');

    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('a version with no pack still settles for good, without ever fetching', async () => {
    // The other control. "No pack at all" is a FACT about the version, not a
    // failure, so it must NOT be retried — otherwise every render of a
    // red-letter-free version would walk this path again.
    await redLetterTextWeb.loadRedLetterSpans('KJV');
    await redLetterTextWeb.loadRedLetterSpans('KJV');

    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('a version with no pack settles as empty WITHOUT fetching anything', async () => {
    await redLetterTextWeb.loadRedLetterSpans('KJV');

    expect(global.fetch).not.toHaveBeenCalled();
    expect(
      redLetterTextWeb.getRedLetterSpans('KJV', 43, 3, 16),
    ).toBeUndefined();
  });
});

/**
 * R9-13 regression. `ReaderPreferencesSheet` imports `hasRedLetterData` from
 * the BARE specifier `@lib/reading/redLetterText`, which Metro resolves to
 * the .web file in a web bundle — so a symbol the native file exports and
 * this one does not is a TypeError in the component body, i.e. a crash of
 * the whole web app under the global ErrorBoundary.
 *
 * These assert the MECHANISM (the web module's own contract) and live apart
 * from the consequence test that renders the screen
 * (chapterReaderWebFontPicker.test.tsx) on purpose: chained into one body,
 * a revert would trip the first assertion and the rest would prove nothing.
 */
describe('hasRedLetterData (web)', () => {
  it('agrees with the NATIVE module, version for version', () => {
    // The parity that matters, and the one that broke twice: first because
    // this file did not export the symbol at all (R9-13), then because it
    // exported it with a shorter list than native's. Asserted against the
    // real native module rather than a hardcoded list, so adding a version
    // to one map and not the other fails here.
    const native = require('../src/lib/reading/redLetterText');
    for (const versionId of ['WEB', 'RVR1960', 'KJV', 'NVI']) {
      expect([versionId, redLetterTextWeb.hasRedLetterData(versionId)]).toEqual(
        [versionId, native.hasRedLetterData(versionId)],
      );
    }
    // Control: the loop above would also pass if BOTH were false for
    // everything, which is the failure mode it exists to catch.
    expect(redLetterTextWeb.hasRedLetterData('WEB')).toBe(true);
    expect(redLetterTextWeb.hasRedLetterData('RVR1960')).toBe(true);
    expect(redLetterTextWeb.hasRedLetterData('KJV')).toBe(false);
  });

  it('answers before the pack is fetched, and still answers after a failed fetch', async () => {
    // Availability is a property of the VERSION, not of load state. An
    // implementation keyed off the loaded map (absent before load, an EMPTY
    // Map after a failed one) would answer false in both moments here, and
    // the sheet's red-letter switch would flip from disabled to enabled a
    // beat after opening.
    expect(redLetterTextWeb.hasRedLetterData('RVR1960')).toBe(true);
    expect(global.fetch).not.toHaveBeenCalled();

    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    mockFetchOnce({ok: false, status: 404});
    await redLetterTextWeb.loadRedLetterSpans('RVR1960');

    expect(
      redLetterTextWeb.getRedLetterSpans('RVR1960', 43, 3, 16),
    ).toBeUndefined();
    expect(redLetterTextWeb.hasRedLetterData('RVR1960')).toBe(true);
    expect(warnSpy).toHaveBeenCalled();
  });
});
