/**
 * 🔴 redLetterText.web — web variant of redLetterText.ts (Phase 3).
 *
 * Native statically imports both red-letter arrays (src/lib/database/
 * bible-data-web-redletter.ts and bible-data-rvr1960-redletter.ts, ~163KB
 * each) — fine to bundle natively, since native already embeds the whole
 * Bible text too. The web build deliberately does NOT bundle Bible text data
 * into the JS (see data-loader.web.ts's header comment for the established
 * precedent): web instead fetches small data files at runtime from
 * https://eternalstonebible.github.io/packs/. This file mirrors that pattern
 * for red-letter data — it fetches one JSON pack PER VERSION (built by
 * scripts/build-web-packs.js directly from those same arrays) instead of
 * importing them, so Metro never bundles either array into the web build.
 *
 * Both versions, not just WEB, as of 2026-09-15. Until then this file knew
 * only about web-red-letter.json, so "Words of Christ" silently did nothing
 * for anyone reading in Spanish on the web — the native build has had
 * RVR1960 red-letter since 2026-08-18. Keep RED_LETTER_PACKS below in sync
 * with redLetterByVersion in redLetterText.ts (native) and with
 * redLetterSpecs in scripts/build-web-packs.js; a version in the native map
 * with no pack here reads red-letter-free on web while the UI says otherwise,
 * which is exactly the bug that was fixed.
 *
 * `mergeRedLetterSpans` below is copied VERBATIM from redLetterText.ts — it
 * is a pure algorithm with no data dependency, so it needs no changes here.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */
import type {LinkifiedSegment} from '@lib/references/parseReference';
// Type-only import: erased entirely at compile time (zero runtime code), so
// this does NOT bundle the underlying 163KB WEB_RED_LETTER array — it only
// reuses the row shape so this file doesn't have to redeclare it.
import type {RedLetterVerse} from '@lib/database/bible-data-web-redletter';

export interface RedLetterRun {
  text: string;
  ref?: LinkifiedSegment['ref'];
  isRedLetter: boolean;
}

/**
 * Base URL for the web-only bootstrap packs. Duplicated from
 * data-loader.web.ts (not imported from it) — a parallel Phase 3 agent is
 * independently editing that file, and this module must not depend on it to
 * keep its own gate self-contained. Keep this definition in sync with
 * data-loader.web.ts's WEB_PACKS_BASE_URL if that ever changes.
 */
const WEB_PACKS_BASE_URL =
  process.env.EXPO_PUBLIC_WEB_PACKS_BASE_URL ??
  'https://eternalstonebible.github.io/packs/';

/**
 * Which reading versions have a red-letter pack on web, and what each pack
 * is called. The web counterpart of redLetterByVersion in redLetterText.ts:
 * same two version ids, so `hasRedLetterData` now answers identically on
 * both platforms. Filenames must match redLetterSpecs in
 * scripts/build-web-packs.js.
 */
const RED_LETTER_PACKS: ReadonlyMap<string, string> = new Map([
  ['WEB', 'web-red-letter.json'],
  ['RVR1960', 'rvr1960-red-letter.json'],
]);

type SpanMap = Map<string, ReadonlyArray<[number, number]>>;

/** Loaded packs, keyed by version id. A present entry means "settled". */
const spansByVersion = new Map<string, SpanMap>();
/** In-flight loads, keyed by version id, so two callers share one fetch. */
const loadPromises = new Map<string, Promise<void>>();

/**
 * Whether `versionId` has real red-letter data — the web port of
 * redLetterText.ts's `hasRedLetterData`, and the single source of truth
 * callers should use instead of hardcoding version-id comparisons.
 *
 * R9-13: this export is NOT optional. `ReaderPreferencesSheet.tsx` imports
 * the BARE specifier `@lib/reading/redLetterText`, which Metro resolves to
 * THIS file in a web bundle, and calls it in the component body on every
 * render. While this file did not export it the binding was `undefined` and
 * the call threw `hasRedLetterData is not a function`, which the global
 * ErrorBoundary turned into a whole-app web crash on both screens that
 * render the sheet (the chapter reader and the dictionary entry). Neither
 * gate could see it: `tsc` has no platform awareness and resolves the bare
 * specifier to the native file, and jest runs a native preset.
 *
 * Deliberately synchronous and independent of `loadRedLetterSpans`:
 * availability is a property of the VERSION, not of whether that version's
 * pack has arrived yet. Answering "not available" while the fetch is in
 * flight would make the sheet's red-letter switch flip from disabled to
 * enabled a moment after opening.
 */
export function hasRedLetterData(versionId: string): boolean {
  return RED_LETTER_PACKS.has(versionId);
}

/**
 * Fetches `versionId`'s red-letter pack and builds its lookup map.
 * Idempotent PER VERSION: a second call once that version is loaded resolves
 * immediately, and a second call while its load is in flight returns the
 * SAME promise rather than firing a second fetch. Two DIFFERENT versions
 * load independently, which matters because switching the UI language
 * switches the reading version (useBibleVersion.tsx) — the reader can ask
 * for RVR1960 while WEB is already cached, and must not get WEB's spans.
 *
 * Fails open: any failure (network error, non-200, bad JSON) is logged via
 * console.warn and settles that version as an empty Map rather than
 * throwing — a missing red-letter file must never break chapter reading, it
 * should just render with no red-letter highlighting, consistent with this
 * feature's "silently inert where there is no data" precedent from the
 * native implementation. A version with no pack at all settles the same way,
 * without a fetch.
 */
export async function loadRedLetterSpans(versionId: string): Promise<void> {
  if (spansByVersion.has(versionId)) return;
  const inFlight = loadPromises.get(versionId);
  if (inFlight) return inFlight;

  const file = RED_LETTER_PACKS.get(versionId);
  if (!file) {
    spansByVersion.set(versionId, new Map());
    return;
  }

  const promise = (async () => {
    try {
      const res = await fetch(`${WEB_PACKS_BASE_URL}${file}`);
      if (!res.ok) {
        throw new Error(`Red-letter pack fetch failed: HTTP ${res.status}`);
      }
      const rows = (await res.json()) as RedLetterVerse[];
      const map: SpanMap = new Map();
      for (const entry of rows) {
        map.set(
          `${entry.book_id}|${entry.chapter}:${entry.verse}`,
          entry.spans,
        );
      }
      spansByVersion.set(versionId, map);
    } catch (error) {
      console.warn(
        `⚠️ [web] Red-letter pack load failed for ${versionId} (continuing without red-letter highlighting):`,
        error,
      );
      spansByVersion.set(versionId, new Map());
    }
  })();

  loadPromises.set(versionId, promise);
  return promise;
}

/**
 * Signature-identical to redLetterText.ts's `getRedLetterSpans` as of
 * 2026-09-15 — `versionId` first. It used to take only (book, chapter,
 * verse), because this file knew about a single version; that arity
 * mismatch was a landmine, since the bare specifier resolves HERE on web
 * and a 4-argument native call would have silently read `versionId` as a
 * book number and returned undefined for every verse.
 *
 * Returns undefined until that version's pack has loaded, so callers should
 * await `loadRedLetterSpans(versionId)` first.
 */
export function getRedLetterSpans(
  versionId: string,
  bookNumber: number,
  chapter: number,
  verse: number,
): ReadonlyArray<[number, number]> | undefined {
  return spansByVersion
    .get(versionId)
    ?.get(`${bookNumber}|${chapter}:${verse}`);
}

export function mergeRedLetterSpans(
  text: string,
  linkSegments: ReadonlyArray<LinkifiedSegment>,
  spans: ReadonlyArray<[number, number]>,
): RedLetterRun[] {
  if (spans.length === 0) {
    return linkSegments.map(seg => ({
      text: seg.text,
      ref: seg.ref,
      isRedLetter: false,
    }));
  }
  const runs: RedLetterRun[] = [];
  let offset = 0;
  for (const seg of linkSegments) {
    const segStart = offset;
    const segEnd = offset + seg.text.length;
    offset = segEnd;
    if (seg.ref) {
      // A recognized cross-reference always keeps its link color/tap
      // affordance, even if it falls inside a red-letter span — two
      // simultaneous color signals on the same run would be ambiguous, and
      // the link's tappability is the more load-bearing one.
      runs.push({text: seg.text, ref: seg.ref, isRedLetter: false});
      continue;
    }
    // Split this plain (non-link) segment further wherever a red-letter
    // span boundary falls inside it, alternating red/non-red runs.
    let cursor = segStart;
    while (cursor < segEnd) {
      const activeSpan = spans.find(([s, e]) => s <= cursor && cursor < e);
      if (activeSpan) {
        const runEnd = Math.min(activeSpan[1], segEnd);
        runs.push({text: text.slice(cursor, runEnd), isRedLetter: true});
        cursor = runEnd;
      } else {
        const nextStart = spans
          .map(([s]) => s)
          .filter(s => s > cursor && s < segEnd)
          .sort((a, b) => a - b)[0];
        const runEnd = nextStart !== undefined ? nextStart : segEnd;
        runs.push({text: text.slice(cursor, runEnd), isRedLetter: false});
        cursor = runEnd;
      }
    }
  }
  // Drop any zero-length runs (can happen if a span boundary lands exactly
  // on a segment boundary) — they'd render as harmless but pointless empty
  // <Text> nodes.
  return runs.filter(r => r.text.length > 0);
}
