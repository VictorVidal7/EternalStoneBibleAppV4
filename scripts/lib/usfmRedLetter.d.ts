/**
 * Type declarations for usfmRedLetter.js — see that file for the algorithm
 * and its documented, current source-mismatch limitation.
 */

export interface RedLetterSpan {
  /** Inclusive start offset into `plainText`. */
  start: number;
  /** Exclusive end offset into `plainText`. */
  end: number;
}

export interface RedLetterVerse {
  /** USFM 3-letter book code (e.g. "MAT", "JHN"). */
  book: string;
  chapter: number;
  verse: number;
  /** Fully USFM-stripped, whitespace-normalized reading text of the verse. */
  plainText: string;
  /** "Words of Jesus" runs within `plainText`, in reading order. */
  spans: RedLetterSpan[];
}

export interface UsfmVerseRaw {
  book: string;
  chapter: number;
  verse: number;
  /** Verse text with USFM markup (incl. \wj) still in place. */
  raw: string;
}

export interface RedLetterExtraction {
  plainText: string;
  spans: RedLetterSpan[];
}

export function stripFootnotesAndXrefs(s: string): string;
export function extractRedLetterSpans(rawVerse: string): RedLetterExtraction;
export function parseUsfmBook(usfmText: string): UsfmVerseRaw[];
export function extractBookRedLetter(usfmText: string): RedLetterVerse[];
