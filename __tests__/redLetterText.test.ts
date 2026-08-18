/**
 * Tests for src/lib/reading/redLetterText.ts — composes version-specific
 * red-letter spans (WEB_RED_LETTER / RVR1960_RED_LETTER) with the inline
 * reference linkifier (parseReference.ts's `linkifyReferences`) into
 * ordered, flagged runs for the reader's verse-rendering loop.
 */
import {getBookByName} from '../src/constants/bible';
import {WEB_DATA} from '../src/lib/database/bible-data-web';
import {RVR1960_DATA} from '../src/lib/database/bible-data-rvr1960';
import type {LinkifiedSegment} from '../src/lib/references/parseReference';
import {
  getRedLetterSpans,
  hasRedLetterData,
  mergeRedLetterSpans,
  type RedLetterRun,
} from '../src/lib/reading/redLetterText';

const webTextByKey = new Map(
  WEB_DATA.map(r => [`${r.book_id}|${r.chapter}:${r.verse}`, r.text]),
);
const rvrTextByKey = new Map(
  RVR1960_DATA.map(r => [`${r.book_id}|${r.chapter}:${r.verse}`, r.text]),
);

describe('hasRedLetterData', () => {
  it('is true for WEB and RVR1960, the 2 versions with real data', () => {
    expect(hasRedLetterData('WEB')).toBe(true);
    expect(hasRedLetterData('RVR1960')).toBe(true);
  });

  it('is false for a version id with no red-letter data', () => {
    expect(hasRedLetterData('KJV')).toBe(false);
    expect(hasRedLetterData('made-up-version-id')).toBe(false);
  });
});

describe('getRedLetterSpans', () => {
  it('returns undefined for a WEB verse with no red-letter data (Genesis 1:1)', () => {
    expect(getRedLetterSpans('WEB', 1, 1, 1)).toBeUndefined();
  });

  it('returns undefined for a version id with no red-letter data at all', () => {
    expect(getRedLetterSpans('KJV', 43, 3, 16)).toBeUndefined();
  });

  it('returns the correct spans for a known WEB entry (John 3:16 — one continuous span covering the whole verse)', () => {
    const text = webTextByKey.get('43|3:16')!;
    expect(text).toBeDefined();
    expect(getRedLetterSpans('WEB', 43, 3, 16)).toEqual([[0, text.length]]);
  });

  it('returns undefined for an RVR1960 verse with no red-letter data (Génesis 1:1)', () => {
    expect(getRedLetterSpans('RVR1960', 1, 1, 1)).toBeUndefined();
  });

  it("returns a multi-span entry for a known RVR1960 verse (Mateo 9:6 — narration in the middle splits Jesus's words into two spans)", () => {
    const text = rvrTextByKey.get('40|9:6')!;
    expect(text).toBeDefined();
    const spans = getRedLetterSpans('RVR1960', 40, 9, 6);
    expect(spans).toEqual([
      [0, 93],
      [125, 167],
    ]);
    expect(text.slice(0, 93)).toBe(
      'Pues para que sepáis que el Hijo del Hombre tiene potestad en la tierra para perdonar pecados',
    );
    expect(text.slice(125, 167)).toBe(
      'Levántate, toma tu cama, y vete a tu casa.',
    );
  });
});

describe('mergeRedLetterSpans', () => {
  it('with no spans, returns the link segments unchanged (just adding isRedLetter: false)', () => {
    const segments: LinkifiedSegment[] = [{text: 'Hello world'}];
    const result = mergeRedLetterSpans('Hello world', segments, []);
    expect(result).toEqual([
      {text: 'Hello world', ref: undefined, isRedLetter: false},
    ]);
  });

  it('a span covering the whole text with a single no-ref segment produces one fully red-letter run', () => {
    const text = 'Peace be with you.';
    const segments: LinkifiedSegment[] = [{text}];
    const result = mergeRedLetterSpans(text, segments, [[0, text.length]]);
    expect(result).toEqual([{text, ref: undefined, isRedLetter: true}]);
  });

  it('a span covering the middle of a single no-ref segment splits into before/red/after runs', () => {
    const text = 'before RED after';
    // "RED" occupies indices 7..10.
    expect(text.slice(7, 10)).toBe('RED');
    const segments: LinkifiedSegment[] = [{text}];
    const result = mergeRedLetterSpans(text, segments, [[7, 10]]);
    expect(result).toEqual([
      {text: 'before ', ref: undefined, isRedLetter: false},
      {text: 'RED', ref: undefined, isRedLetter: true},
      {text: ' after', ref: undefined, isRedLetter: false},
    ]);
  });

  it('multiple disjoint spans within one segment alternate correctly', () => {
    const text = 'aa BB cc DD ee';
    // "BB" = indices 3..5, "DD" = indices 9..11.
    expect(text.slice(3, 5)).toBe('BB');
    expect(text.slice(9, 11)).toBe('DD');
    const segments: LinkifiedSegment[] = [{text}];
    const result = mergeRedLetterSpans(text, segments, [
      [3, 5],
      [9, 11],
    ]);
    expect(result).toEqual([
      {text: 'aa ', ref: undefined, isRedLetter: false},
      {text: 'BB', ref: undefined, isRedLetter: true},
      {text: ' cc ', ref: undefined, isRedLetter: false},
      {text: 'DD', ref: undefined, isRedLetter: true},
      {text: ' ee', ref: undefined, isRedLetter: false},
    ]);
    // No-gaps invariant.
    expect(result.map(r => r.text).join('')).toBe(text);
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
    // A red-letter span that overlaps the ref segment's character range —
    // starts inside "as it says in " and ends inside the link text itself.
    const overlapStart = 5;
    const overlapEnd = linkStart + 4; // a few chars into "John 3:16"
    expect(overlapStart).toBeLessThan(linkStart);
    expect(overlapEnd).toBeGreaterThan(linkStart);
    expect(overlapEnd).toBeLessThan(linkStart + linkText.length);

    const result = mergeRedLetterSpans(text, segments, [
      [overlapStart, overlapEnd],
    ]);

    // The ref run must appear intact, as ONE run, not split.
    const refRun = result.find(r => r.ref !== undefined);
    expect(refRun).toEqual({text: linkText, ref: fakeRef, isRedLetter: false});
    // The plain segment before it should still get split by the overlapping
    // span's portion that falls inside ITS bounds.
    expect(result.some(r => r.isRedLetter === true)).toBe(true);
    // No-gaps invariant still holds across the whole output.
    expect(result.map(r => r.text).join('')).toBe(text);
  });

  it('a realistic composite: plain + red-letter-split + ref segments reproduce the full text with no gaps', () => {
    // Simulated verse: a narration lead-in, then Jesus speaking (red
    // letter), including a cross-reference link inside the red-letter
    // portion, then a plain trailing clause.
    const lead = 'Jesus said, ';
    const spoken1 = 'as it is written in ';
    const link = 'Isaiah 53:5';
    const spoken2 = ', I have come to save you.';
    const trail = ' The crowd was amazed.';
    const text = lead + spoken1 + link + spoken2 + trail;

    const isaiah = getBookByName('Isaiah')!;
    expect(isaiah).toBeDefined();
    const fakeRef = {
      book: isaiah,
      chapter: 53,
      verse: 5,
    };

    const segments: LinkifiedSegment[] = [
      {text: lead + spoken1},
      {text: link, ref: fakeRef},
      {text: spoken2 + trail},
    ];

    // Red-letter span covers everything Jesus says: from the start of
    // spoken1 through the end of spoken2 (i.e. NOT the lead-in narration,
    // NOT the trailing crowd reaction) — this deliberately spans across
    // the link segment's boundaries too.
    const spanStart = lead.length;
    const spanEnd = lead.length + spoken1.length + link.length + spoken2.length;

    const result = mergeRedLetterSpans(text, segments, [[spanStart, spanEnd]]);

    expect(result).toEqual([
      {text: lead, ref: undefined, isRedLetter: false},
      {text: spoken1, ref: undefined, isRedLetter: true},
      {text: link, ref: fakeRef, isRedLetter: false},
      {text: spoken2, ref: undefined, isRedLetter: true},
      {text: trail, ref: undefined, isRedLetter: false},
    ]);

    // Coverage / no-gaps invariant: concatenating every run's text
    // reproduces the original full text exactly.
    expect(result.map(r => r.text).join('')).toBe(text);
  });

  it('never produces zero-length runs, even when a span end lands exactly on a segment boundary', () => {
    const partA = 'red words here';
    const partB = 'more plain text';
    const text = partA + partB;
    const segments: LinkifiedSegment[] = [{text: partA}, {text: partB}];
    // Span exactly covers partA, ending precisely at the segment boundary.
    const result = mergeRedLetterSpans(text, segments, [[0, partA.length]]);

    expect(result.every(r => r.text.length > 0)).toBe(true);
    expect(result).toEqual([
      {text: partA, ref: undefined, isRedLetter: true},
      {text: partB, ref: undefined, isRedLetter: false},
    ]);
    expect(result.map(r => r.text).join('')).toBe(text);
  });

  it('drops a zero-length run when a span starts exactly where the previous span ended, at a segment boundary', () => {
    // Two adjacent spans meeting exactly at a boundary that also happens to
    // fall on a segment boundary — exercises the "boundary lands exactly on
    // a segment boundary" edge case from both sides at once.
    const text = 'AAAABBBB';
    const segments: LinkifiedSegment[] = [{text: 'AAAA'}, {text: 'BBBB'}];
    const result: RedLetterRun[] = mergeRedLetterSpans(text, segments, [
      [0, 4],
      [4, 8],
    ]);
    expect(result.every(r => r.text.length > 0)).toBe(true);
    expect(result).toEqual([
      {text: 'AAAA', ref: undefined, isRedLetter: true},
      {text: 'BBBB', ref: undefined, isRedLetter: true},
    ]);
    expect(result.map(r => r.text).join('')).toBe(text);
  });
});
