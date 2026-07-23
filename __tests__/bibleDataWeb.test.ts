/**
 * Integrity guard for the generated World English Bible data module
 * (src/lib/database/bible-data-web.ts). The text is fetched + emitted by
 * scripts/ingest-web-ebible.js (eBible.org's own engwebp USFM distribution —
 * replaced the original getbible.net source, Sprint 66, after it turned out
 * to be a different WEB revision than any current eBible.org edition); this
 * locks the invariants the runtime SQLite loader and the reader rely on, so a
 * future re-generation can't silently ship a broken or mis-versified WEB:
 *  - every row is shaped like a KJV/RVR row and tagged version 'WEB'
 *  - the book set is exactly the 66-book Protestant canon (ids 1..66)
 *  - each row's book_name is the canonical English name for its id
 *  - per-book chapter counts match the static book table (versification parity,
 *    so the chapter grid never points the reader at a non-existent WEB chapter)
 *  - no empty verse text
 *  - the content is really WEB, not a relabelled KJV (spot checks)
 */
import {WEB_DATA} from '../src/lib/database/bible-data-web';
import {BIBLE_BOOKS} from '../src/constants/bible';

type Row = (typeof WEB_DATA)[number];

const byId = new Map(BIBLE_BOOKS.map(b => [b.id, b]));

describe('bible-data-web (WEB) integrity', () => {
  it('is a non-empty array of ~31k verses, all tagged WEB', () => {
    expect(Array.isArray(WEB_DATA)).toBe(true);
    // eBible's engwebp includes Romans 14:24-26 (a textual-tradition variant
    // some editions fold into ch.16 or omit) that the old getbible source
    // didn't — 31,098 vs the prior 31,095. Lock the exact count so a partial
    // re-ingest is caught.
    expect(WEB_DATA.length).toBe(31098);
    expect(WEB_DATA.every((r: Row) => r.version === 'WEB')).toBe(true);
  });

  it('covers exactly the 66-book canon, ids 1..66', () => {
    const ids = new Set(WEB_DATA.map((r: Row) => r.book_id));
    expect(ids.size).toBe(66);
    for (let id = 1; id <= 66; id++) expect(ids.has(id)).toBe(true);
  });

  it('keys every row to the canonical English book name for its id', () => {
    const bad = WEB_DATA.find(
      (r: Row) => byId.get(r.book_id)?.nameEn !== r.book_name,
    );
    expect(bad).toBeUndefined();
  });

  it('matches the book table chapter count for every book (versification parity)', () => {
    const maxChapter = new Map<number, number>();
    for (const r of WEB_DATA as Row[]) {
      maxChapter.set(
        r.book_id,
        Math.max(maxChapter.get(r.book_id) ?? 0, r.chapter),
      );
    }
    for (const book of BIBLE_BOOKS) {
      expect(maxChapter.get(book.id)).toBe(book.chapters);
    }
  });

  it('has non-empty, trimmed verse text everywhere', () => {
    const blank = WEB_DATA.find(
      (r: Row) => typeof r.text !== 'string' || r.text.trim().length === 0,
    );
    expect(blank).toBeUndefined();
  });

  it('contains genuine WEB wording (not a relabelled KJV)', () => {
    const gen11 = WEB_DATA.find(
      (r: Row) => r.book_id === 1 && r.chapter === 1 && r.verse === 1,
    );
    // WEB: "...the heavens and the earth." (KJV: "...the heaven and the earth.")
    expect(gen11?.text).toBe(
      'In the beginning, God created the heavens and the earth.',
    );
    const john316 = WEB_DATA.find(
      (r: Row) => r.book_id === 43 && r.chapter === 3 && r.verse === 16,
    );
    // eBible's engwebp wording ("only born Son") differs from the old
    // getbible-sourced text ("one and only Son") — same translation lineage,
    // different revision, which is exactly why the two sources couldn't be
    // safely mixed for red-letter spans (see bible-data-web-redletter.ts).
    expect(john316?.text).toMatch(/only born Son/);
  });
});
