/**
 * 🔴 redLetterText — compose red-letter (Words of Christ) spans with the
 * inline Bible-reference linkifier for a single verse's rendered text.
 *
 * `WEB_RED_LETTER` (src/lib/database/bible-data-web-redletter.ts) gives, per
 * WEB verse, the raw character spans that are Jesus's own words.
 * `linkifyReferences` (src/lib/references/parseReference.ts) independently
 * splits a verse's text into plain vs. tappable-cross-reference segments.
 * The reader needs BOTH signals applied to the same verse text at once, so
 * this pure module merges them into an ordered list of runs, each flagged
 * with whether it is red-letter, and (if it's a recognized inline
 * reference) its `ref` for the tap handler — with no React/RN import, so it
 * stays unit-testable and reusable outside the reader screen.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */
import {WEB_RED_LETTER} from '@lib/database/bible-data-web-redletter';
import type {LinkifiedSegment} from '@lib/references/parseReference';

export interface RedLetterRun {
  text: string;
  ref?: LinkifiedSegment['ref'];
  isRedLetter: boolean;
}

const redLetterByKey = new Map<string, ReadonlyArray<[number, number]>>();
for (const entry of WEB_RED_LETTER) {
  redLetterByKey.set(
    `${entry.book_id}|${entry.chapter}:${entry.verse}`,
    entry.spans,
  );
}

export function getRedLetterSpans(
  bookNumber: number,
  chapter: number,
  verse: number,
): ReadonlyArray<[number, number]> | undefined {
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
