/**
 * 🔴 redLetterText.web — web variant of redLetterText.ts (Phase 3).
 *
 * Native statically imports WEB_RED_LETTER (src/lib/database/
 * bible-data-web-redletter.ts), a ~163KB in-repo TS array — fine to bundle
 * natively, since native already embeds the whole Bible text too. The web
 * build deliberately does NOT bundle Bible text data into the JS (see
 * data-loader.web.ts's header comment for the established precedent): web
 * instead fetches small data files at runtime from
 * https://eternalstonebible.github.io/packs/. This file mirrors that
 * pattern for red-letter data — it fetches web-red-letter.json (built by
 * scripts/build-web-packs.js directly from WEB_RED_LETTER) instead of
 * importing the TS array, so Metro never bundles the 163KB array into the
 * web build.
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

let redLetterByKey: Map<string, ReadonlyArray<[number, number]>> | null = null;
let loadPromise: Promise<void> | null = null;

/**
 * Fetches web-red-letter.json and builds the lookup map. Idempotent: a
 * second call while already loaded resolves immediately, and a second call
 * while a load is in flight returns the SAME promise rather than firing a
 * second fetch.
 *
 * Fails open: any failure (network error, non-200, bad JSON) is logged via
 * console.warn and leaves redLetterByKey as an empty Map rather than
 * throwing — a missing red-letter file must never break chapter reading, it
 * should just silently render with no red-letter highlighting, consistent
 * with this feature's "silently inert on non-WEB versions" precedent from
 * the native Phase 2 implementation.
 */
export async function loadRedLetterSpans(): Promise<void> {
  if (redLetterByKey) return;
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    try {
      const res = await fetch(`${WEB_PACKS_BASE_URL}web-red-letter.json`);
      if (!res.ok) {
        throw new Error(`Red-letter pack fetch failed: HTTP ${res.status}`);
      }
      const rows = (await res.json()) as RedLetterVerse[];
      const map = new Map<string, ReadonlyArray<[number, number]>>();
      for (const entry of rows) {
        map.set(
          `${entry.book_id}|${entry.chapter}:${entry.verse}`,
          entry.spans,
        );
      }
      redLetterByKey = map;
    } catch (error) {
      console.warn(
        '⚠️ [web] Red-letter pack load failed (continuing without red-letter highlighting):',
        error,
      );
      redLetterByKey = new Map();
    }
  })();

  return loadPromise;
}

export function getRedLetterSpans(
  bookNumber: number,
  chapter: number,
  verse: number,
): ReadonlyArray<[number, number]> | undefined {
  if (!redLetterByKey) return undefined;
  return redLetterByKey.get(`${bookNumber}|${chapter}:${verse}`);
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
