import {parseNoteMarkdown} from '../src/lib/notes/noteMarkdown';
import {parseNoteMarkdownRanges} from '../src/lib/notes/noteMarkdownRanges';
import type {MarkdownRange} from '@expensify/react-native-live-markdown';

/**
 * Differential test: `parseNoteMarkdownRanges`'s bold/italic span
 * boundaries must agree EXACTLY with `parseNoteMarkdown`
 * (`src/lib/notes/noteMarkdown.ts`) across a shared adversarial corpus.
 * `noteMarkdown.ts` is the source of truth here — it already renders real,
 * already-stored user notes today (notes list, share-image card). Any
 * mismatch below is a bug in the new range parser, never in
 * `noteMarkdown.ts`.
 */

/**
 * Re-derive the {type, start, length} content spans (bold/italic content
 * only, markers excluded) that `parseNoteMarkdown` implies for a given
 * input, expressed as offsets against the ORIGINAL text — the same
 * coordinate space `parseNoteMarkdownRanges` uses. This is the bridge
 * between `noteMarkdown.ts`'s segment-output shape and
 * `noteMarkdownRanges.ts`'s range-output shape.
 *
 * Two things make this arithmetic valid against the original (marker- and
 * dash-included) text even though `parseNoteMarkdown` internally works
 * against a marker-stripped, bullet-substituted string:
 *  - bullet substitution ("- " line-start -> "•") swaps exactly one
 *    character and never touches "*", so it never changes any offset used
 *    below.
 *  - marker stripping removes a fixed-width prefix/suffix per style ("**"
 *    + "**" = 4 total for bold, "*" + "*" = 2 total for italic), which is
 *    added back in explicitly here.
 */
function expectedContentSpans(
  text: string,
): Array<{type: 'bold' | 'italic'; start: number; length: number}> {
  const segments = parseNoteMarkdown(text);
  const spans: Array<{type: 'bold' | 'italic'; start: number; length: number}> =
    [];
  let cursor = 0;
  for (const segment of segments) {
    if (segment.style === 'bold') {
      spans.push({
        type: 'bold',
        start: cursor + 2,
        length: segment.text.length,
      });
      cursor += segment.text.length + 4;
    } else if (segment.style === 'italic') {
      spans.push({
        type: 'italic',
        start: cursor + 1,
        length: segment.text.length,
      });
      cursor += segment.text.length + 2;
    } else {
      cursor += segment.text.length;
    }
  }
  // If this arithmetic ever drifts (e.g. a future edit to the marker-length
  // constants above), the spans below would silently be computed against
  // the wrong offsets and the differential comparison could pass for the
  // wrong reason. Asserting the cursor lands exactly on the original
  // text's length turns that into a loud failure instead.
  expect(cursor).toBe(text.length);
  return spans;
}

function actualContentSpans(text: string) {
  return parseNoteMarkdownRanges(text)
    .filter(r => r.type === 'bold' || r.type === 'italic')
    .map(r => ({type: r.type, start: r.start, length: r.length}));
}

// Seeded directly from `noteMarkdown.ts`'s own header comment (the
// adversarial cases it documents being hardened against) plus the explicit
// additions called for by this task.
const CORPUS: Array<[label: string, text: string]> = [
  ['empty string', ''],
  ['plain text with no markers at all', 'Just a plain note.'],
  ['a lone unpaired "*"', 'a lone *star with no partner'],
  [
    'hand-typed "* punto" bullets that must not italicize across lines',
    '* punto uno\n* punto dos',
  ],
  ['an unterminated "**bold" with no closing marker', 'This is **almost bold'],
  [
    'two bold markers on different lines that must NOT pair across the newline',
    '**start of note\nsecond line** end',
  ],
  [
    'two italic markers on different lines that must NOT pair across the newline',
    'Line one *opens here\nand closes* on the next line',
  ],
  ['"**bold**" read as ONE bold span, never two adjacent italics', '**bold**'],
  ['mixed bold and italic in one line', '**Key**: read *slowly* and **pray**'],
  [
    'a basic bold span with surrounding plain text',
    'This is **important** to remember',
  ],
  [
    'a basic italic span with surrounding plain text',
    'He said *hesed* means loyalty',
  ],
  [
    'a genuine same-line italic span alongside unrelated other lines',
    'Line one\nThis has *real emphasis* here\nLine three',
  ],
  ['bold/italic inside a bullet line', '- esto es **muy** importante'],
  [
    'a mix of bullet and non-bullet lines with no emphasis',
    'Puntos clave:\n- primero\n- segundo\nFin.',
  ],
];

describe('parseNoteMarkdownRanges — differential vs. parseNoteMarkdown', () => {
  it.each(CORPUS)('%s', (_label, text) => {
    expect(actualContentSpans(text)).toEqual(expectedContentSpans(text));
  });
});

describe('parseNoteMarkdownRanges — range shape', () => {
  it('emits exactly 3 ranges per matched span, in syntax/content/syntax order, with correct marker lengths', () => {
    const ranges = parseNoteMarkdownRanges('**bold** and *italic*');
    expect(ranges).toEqual<MarkdownRange[]>([
      {type: 'syntax', start: 0, length: 2},
      {type: 'bold', start: 2, length: 4},
      {type: 'syntax', start: 6, length: 2},
      {type: 'syntax', start: 13, length: 1},
      {type: 'italic', start: 14, length: 6},
      {type: 'syntax', start: 20, length: 1},
    ]);
  });

  it('never sets the optional syntaxType field', () => {
    const ranges = parseNoteMarkdownRanges('**bold**');
    for (const range of ranges) {
      expect(range.syntaxType).toBeUndefined();
    }
  });

  it('returns [] for empty input', () => {
    expect(parseNoteMarkdownRanges('')).toEqual([]);
  });

  it('returns [] for plain text with no markers', () => {
    expect(parseNoteMarkdownRanges('Just a plain note.')).toEqual([]);
  });
});

describe('parseNoteMarkdownRanges — bullets get no live-editor decoration', () => {
  it('emits no ranges at all for a bullet-only line (deliberate scope decision, not a bug)', () => {
    expect(parseNoteMarkdownRanges('- primer punto')).toEqual([]);
  });

  it('still decorates bold/italic content that happens to sit inside a bullet line', () => {
    const ranges = parseNoteMarkdownRanges('- esto es **muy** importante');
    // "- " itself must not appear in any range's covered text; only "muy"
    // (the bold content) and its markers should be present.
    expect(ranges).toEqual<MarkdownRange[]>([
      {type: 'syntax', start: 10, length: 2},
      {type: 'bold', start: 12, length: 3},
      {type: 'syntax', start: 15, length: 2},
    ]);
  });
});

describe('parseNoteMarkdownRanges — hard invariants (never throws, degrades safely)', () => {
  it('never throws on non-string input and returns []', () => {
    // Cast through unknown to simulate a truly malformed call site — the
    // worklet boundary gives no compile-time guarantee against this.
    expect(() =>
      parseNoteMarkdownRanges(null as unknown as string),
    ).not.toThrow();
    expect(parseNoteMarkdownRanges(null as unknown as string)).toEqual([]);
    expect(() =>
      parseNoteMarkdownRanges(undefined as unknown as string),
    ).not.toThrow();
    expect(parseNoteMarkdownRanges(undefined as unknown as string)).toEqual([]);
    expect(() =>
      parseNoteMarkdownRanges(42 as unknown as string),
    ).not.toThrow();
    expect(parseNoteMarkdownRanges(42 as unknown as string)).toEqual([]);
  });

  it('degrades to [] above the 4000-character threshold rather than parsing', () => {
    const huge = `**bold** ${'x'.repeat(4000)}`;
    expect(huge.length).toBeGreaterThan(4000);
    expect(parseNoteMarkdownRanges(huge)).toEqual([]);
  });

  it('still parses normally at exactly the threshold boundary', () => {
    const atLimit = `**b** ${'x'.repeat(4000 - 6)}`;
    expect(atLimit.length).toBe(4000);
    expect(parseNoteMarkdownRanges(atLimit)).toEqual([
      {type: 'syntax', start: 0, length: 2},
      {type: 'bold', start: 2, length: 1},
      {type: 'syntax', start: 3, length: 2},
    ]);
  });
});

describe('parseNoteMarkdownRanges — worklet instrumentation', () => {
  it("is instrumented as a worklet under this project's babel config (same mechanism Metro uses at bundle time)", () => {
    expect(
      (parseNoteMarkdownRanges as unknown as {__workletHash?: number})
        .__workletHash,
    ).toBeDefined();
  });
});
