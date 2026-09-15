/**
 * Tests for src/lib/reading/redLetterText.web.ts — the web variant of
 * redLetterText.ts, which fetches red-letter spans at runtime instead of
 * statically importing WEB_RED_LETTER.
 *
 * redLetterByKey/loadPromise are module-level singletons (by design — see
 * the source file's doc comment), so each test below gets a FRESH module
 * instance via jest.resetModules() + require() rather than the static
 * top-of-file import — otherwise a successful load in one test would leak
 * into and mask the "before load" / "fails open" assertions of later tests.
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
    expect(redLetterTextWeb.getRedLetterSpans(43, 3, 16)).toBeUndefined();
  });

  it('after a successful load, returns the right spans for a matching key and undefined for a non-matching one', async () => {
    const fixture = [
      {book_id: 43, chapter: 3, verse: 16, spans: [[0, 10]]},
      {book_id: 40, chapter: 5, verse: 3, spans: [[2, 6]]},
    ];
    mockFetchOnce({ok: true, json: async () => fixture});

    await redLetterTextWeb.loadRedLetterSpans();

    expect(redLetterTextWeb.getRedLetterSpans(43, 3, 16)).toEqual([[0, 10]]);
    expect(redLetterTextWeb.getRedLetterSpans(40, 5, 3)).toEqual([[2, 6]]);
    expect(redLetterTextWeb.getRedLetterSpans(1, 1, 1)).toBeUndefined();
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
      redLetterTextWeb.loadRedLetterSpans(),
    ).resolves.toBeUndefined();

    expect(redLetterTextWeb.getRedLetterSpans(43, 3, 16)).toBeUndefined();
    expect(redLetterTextWeb.getRedLetterSpans(1, 1, 1)).toBeUndefined();
    expect(warnSpy).toHaveBeenCalled();
  });

  it('fails open on a non-ok response: getRedLetterSpans keeps returning undefined without throwing', async () => {
    mockFetchOnce({ok: false, status: 404});
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    await expect(
      redLetterTextWeb.loadRedLetterSpans(),
    ).resolves.toBeUndefined();

    expect(redLetterTextWeb.getRedLetterSpans(43, 3, 16)).toBeUndefined();
    expect(warnSpy).toHaveBeenCalled();
  });

  it('calling loadRedLetterSpans() twice concurrently only triggers ONE fetch call', async () => {
    let resolveJson: (value: unknown[]) => void;
    const jsonPromise = new Promise<unknown[]>(resolve => {
      resolveJson = resolve;
    });
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => jsonPromise,
    });

    const p1 = redLetterTextWeb.loadRedLetterSpans();
    const p2 = redLetterTextWeb.loadRedLetterSpans();

    resolveJson!([{book_id: 43, chapter: 3, verse: 16, spans: [[0, 5]]}]);
    await Promise.all([p1, p2]);

    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(redLetterTextWeb.getRedLetterSpans(43, 3, 16)).toEqual([[0, 5]]);
  });

  it('a subsequent call after a successful load resolves immediately without re-fetching', async () => {
    mockFetchOnce({
      ok: true,
      json: async () => [{book_id: 43, chapter: 3, verse: 16, spans: [[0, 5]]}],
    });

    await redLetterTextWeb.loadRedLetterSpans();
    await redLetterTextWeb.loadRedLetterSpans();

    expect(global.fetch).toHaveBeenCalledTimes(1);
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
  it('reports data for WEB, the one version whose pack this build fetches', () => {
    expect(redLetterTextWeb.hasRedLetterData('WEB')).toBe(true);
  });

  it('reports NO data for RVR1960 on web, deliberately diverging from native', () => {
    // Not an oversight and not a second bug: scripts/build-web-packs.js
    // emits only web-red-letter.json, so RVR1960's red-letter array never
    // reaches the web build. Asserted against the native module in the same
    // breath so the divergence stays a decision someone made rather than
    // something that quietly drifts.
    expect(redLetterTextWeb.hasRedLetterData('RVR1960')).toBe(false);
    const native = require('../src/lib/reading/redLetterText');
    expect(native.hasRedLetterData('RVR1960')).toBe(true);
  });

  it('reports no data for a version that has none', () => {
    expect(redLetterTextWeb.hasRedLetterData('KJV')).toBe(false);
  });

  it('answers before the pack is fetched, and still answers after a failed fetch', async () => {
    // Availability is a property of the VERSION, not of load state. An
    // implementation keyed off redLetterByKey (null before load, an EMPTY
    // Map after a failed one) would answer false in both moments here, and
    // the sheet's red-letter switch would flip from disabled to enabled a
    // beat after opening.
    expect(redLetterTextWeb.hasRedLetterData('WEB')).toBe(true);
    expect(global.fetch).not.toHaveBeenCalled();

    mockFetchOnce({ok: false, status: 404});
    await redLetterTextWeb.loadRedLetterSpans();

    expect(redLetterTextWeb.getRedLetterSpans(43, 3, 16)).toBeUndefined();
    expect(redLetterTextWeb.hasRedLetterData('WEB')).toBe(true);
  });
});
