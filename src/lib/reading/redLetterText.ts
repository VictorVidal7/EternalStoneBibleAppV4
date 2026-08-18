/**
 * 🔴 redLetterText — compose red-letter (Words of Christ) spans with the
 * inline Bible-reference linkifier for a single verse's rendered text.
 *
 * Red-letter data is version-specific: `WEB_RED_LETTER`
 * (src/lib/database/bible-data-web-redletter.ts) gives, per WEB verse, the
 * raw character spans that are Jesus's own words, anchored by construction
 * from a single USFM parse; `RVR1960_RED_LETTER`
 * (src/lib/database/bible-data-rvr1960-redletter.ts) gives the equivalent
 * for RVR1960, generated from a human editorial pass (see that file's header
 * and scripts/data/rvr1960-red-letter/generate.js) since translations don't
 * share sentence boundaries. Both arrays share the same `RedLetterVerse`
 * shape, so `getRedLetterSpans` takes a version id and looks up the matching
 * map — callers should check `hasRedLetterData(versionId)` first rather than
 * hardcoding which version ids have data. Any other reading version simply
 * has no data and this module is not consulted for it.
 *
 * `linkifyReferences` (src/lib/references/parseReference.ts) independently
 * splits a verse's text into plain vs. tappable-cross-reference segments.
 * The reader needs BOTH signals applied to the same verse text at once, so
 * this pure module merges them into an ordered list of runs, each flagged
 * with whether it is red-letter, and (if it's a recognized inline
 * reference) its `ref` for the tap handler — with no React/RN import, so it
 * stays unit-testable and reusable outside the reader screen.
 *
 * NATIVE only — this file statically imports both (small enough) in-repo TS
 * arrays. The web build has a separate port, redLetterText.web.ts, which
 * fetches a small JSON pack at runtime instead of bundling the arrays (see
 * that file's header) — it is a deliberately separate, later piece of work
 * and is not touched here.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */
import {WEB_RED_LETTER} from '@lib/database/bible-data-web-redletter';
import {RVR1960_RED_LETTER} from '@lib/database/bible-data-rvr1960-redletter';
import type {LinkifiedSegment} from '@lib/references/parseReference';

export interface RedLetterRun {
  text: string;
  ref?: LinkifiedSegment['ref'];
  isRedLetter: boolean;
}

type SpanMap = Map<string, ReadonlyArray<[number, number]>>;

function buildSpanMap(
  entries: ReadonlyArray<{
    book_id: number;
    chapter: number;
    verse: number;
    spans: [number, number][];
  }>,
): SpanMap {
  const map: SpanMap = new Map();
  for (const entry of entries) {
    map.set(`${entry.book_id}|${entry.chapter}:${entry.verse}`, entry.spans);
  }
  return map;
}

const redLetterByVersion = new Map<string, SpanMap>([
  ['WEB', buildSpanMap(WEB_RED_LETTER)],
  ['RVR1960', buildSpanMap(RVR1960_RED_LETTER)],
]);

/**
 * Whether `versionId` has real red-letter data — the single source of truth
 * callers (the reader screen, ReaderPreferencesSheet, etc.) should use
 * instead of hardcoding `=== 'WEB'` / `=== 'RVR1960'` string comparisons.
 */
export function hasRedLetterData(versionId: string): boolean {
  return redLetterByVersion.has(versionId);
}

export function getRedLetterSpans(
  versionId: string,
  bookNumber: number,
  chapter: number,
  verse: number,
): ReadonlyArray<[number, number]> | undefined {
  return redLetterByVersion
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
