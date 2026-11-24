/**
 * R9-51 — one note per verse, on every device.
 *
 * A note used to be keyed on `note_${Date.now()}_${random}`, and the sync
 * adapter synced it on that id. Two devices that wrote a note for the same
 * verse made two docs that the engine never saw as a conflict: after a sync
 * each device held both rows, and the reader (`getNoteForVerse`, the lowest
 * `rowid`) showed its OWN note forever, while the Notes tab listed both.
 * `migrateCanonicalBookKeys` (a «Juan 3:16» and a «John 3:16» note) and a
 * backup imported from another device made the same pair on one device.
 *
 * The highlights already solved it: the doc id IS the verse
 * (`adapters/highlights.ts`). Notes now do the same: `vnote:<canonical
 * book>:<chapter>:<verse>`. The rows written under the old ids are folded
 * into that one row by `mergeVerseNotes` (design: `detail/S171-tanda-v5.md`
 * §3; written in `detail/S174-*.md`).
 */

import {canonicalBookName} from '@/constants/bible';

export const VERSE_NOTE_PREFIX = 'vnote:';

/** The note id for a verse: the same on every device, for every version. */
export function verseNoteId(
  book: string,
  chapter: number,
  verse: number,
): string {
  // A Firestore doc id cannot hold a `/`. No canonical name has one, but an
  // unknown name passes `canonicalBookName` unchanged (a backup file).
  const name = canonicalBookName(book).replace(/\//g, '_');
  return `${VERSE_NOTE_PREFIX}${name}:${chapter}:${verse}`;
}

export function isVerseNoteId(id: string): boolean {
  return id.startsWith(VERSE_NOTE_PREFIX);
}

/** A notes row, as `getNotes` returns it. */
export interface VerseNoteRow {
  id: string;
  book: string;
  chapter: number;
  verse: number;
  text: string;
  note: string;
  createdAt: string;
  updatedAt: string;
}

/** A fold joins its texts with a blank line; R9-625 splits on it. */
const PARAGRAPH = '\n\n';

/**
 * A text's paragraphs, trimmed, without the empty ones: a note that ends in a
 * newline, joined into a fold, must still be found there whole.
 */
function paragraphsOf(text: string): string[] {
  return text
    .split(/\n\s*\n/)
    .map(p => p.trim())
    .filter(p => p.length > 0);
}

/**
 * The text of several notes of ONE verse, folded into one. No text of the
 * user is lost and none is made up:
 *  - a text is dropped only when it is already there: equal to another, or
 *    made of PARAGRAPHS (split on a blank line) that are all, whole, among
 *    another's paragraphs. A fold is joined with a blank line, so folding a
 *    note into a fold that already holds it changes nothing, and two devices
 *    that fold the same notes get the same text: a second fold is a no-op,
 *    wherever it runs. R9-625: it used to be a substring test, and «Ver Juan
 *    1» was dropped beside «Ver Juan 14:6», gone for good (the fold runs once);
 *  - two texts with the same paragraphs in another order: the first is kept;
 *  - the rest are joined oldest first (`createdAt`), with a blank line.
 */
export function mergeNoteTexts(
  rows: ReadonlyArray<Pick<VerseNoteRow, 'note' | 'createdAt'>>,
): string {
  const ordered = rows
    .map((r, i) => ({r, i}))
    .sort((a, b) => a.r.createdAt.localeCompare(b.r.createdAt) || a.i - b.i)
    .map(x => x.r.note);
  const distinct: string[] = [];
  for (const t of ordered) if (!distinct.includes(t)) distinct.push(t);
  const paragraphs = distinct.map(t => new Set(paragraphsOf(t)));
  const within = (a: number, b: number) =>
    [...paragraphs[a]].every(p => paragraphs[b].has(p));
  // `b` holds `a` when `a`'s paragraphs are all in `b`, and `b`'s are not all
  // in `a` (or are, and `b` comes first): a strict order, so one always stays.
  const kept = distinct.filter(
    (_, a) =>
      !distinct.some(
        (__, b) => b !== a && within(a, b) && (b < a || !within(b, a)),
      ),
  );
  return (kept.length > 0 ? kept : distinct.slice(0, 1)).join(PARAGRAPH);
}

/**
 * The one row the notes of a verse fold into, or `null` when there is
 * nothing to fold (no rows, or only the verse-keyed row).
 *
 * - `note`: `mergeNoteTexts`. `verse_text`: the newest row's.
 * - `createdAt`: the oldest.
 * - `updatedAt`: the newest row's when the fold holds nothing more than that
 *   row (a re-key, equal texts, or a fold already folded: nothing new to
 *   win with); otherwise `bumpTo` — the migration and the import pass «now»,
 *   so the fold wins on the other devices — or, with `bumpTo` null (the
 *   adapter, which does not push), the newest of the rows.
 */
export function mergeVerseNotes(
  rows: ReadonlyArray<VerseNoteRow>,
  bumpTo: string | null,
): {row: VerseNoteRow; removedIds: string[]} | null {
  if (rows.length === 0) return null;
  const first = rows[0];
  const id = verseNoteId(first.book, first.chapter, first.verse);
  if (rows.length === 1 && first.id === id) return null;
  const newest = rows.reduce((a, b) => (b.updatedAt > a.updatedAt ? b : a));
  const oldest = rows.reduce((a, b) => (b.createdAt < a.createdAt ? b : a));
  const note = mergeNoteTexts(rows);
  const updatedAt =
    note === newest.note ? newest.updatedAt : (bumpTo ?? newest.updatedAt);
  return {
    row: {
      id,
      book: canonicalBookName(first.book),
      chapter: first.chapter,
      verse: first.verse,
      text: newest.text,
      note,
      createdAt: oldest.createdAt,
      updatedAt,
    },
    removedIds: rows.filter(r => r.id !== id).map(r => r.id),
  };
}
