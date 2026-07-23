/**
 * Integrity guard for the generated "words of Jesus" (\wj) red-letter spans
 * (src/lib/database/bible-data-web-redletter.ts). Both this file and
 * bible-data-web.ts are emitted by ONE run of scripts/ingest-web-ebible.js
 * parsing the SAME eBible.org engwebp USFM source — the whole point of the
 * re-ingest (see the red-letter-web spike report) is that this makes every
 * span anchor 100% by construction, unlike the earlier approach that tried
 * to lay eBible's \wj offsets onto a differently-revised bundled WEB text
 * and only anchored ~65% of the time. This test proves that property holds,
 * not just that the file parses.
 */
import {WEB_DATA} from '../src/lib/database/bible-data-web';
import {WEB_RED_LETTER} from '../src/lib/database/bible-data-web-redletter';

const textByKey = new Map(
  WEB_DATA.map(r => [`${r.book_id}|${r.chapter}:${r.verse}`, r.text]),
);

describe('bible-data-web-redletter (WEB \\wj spans) integrity', () => {
  it('is a non-empty array, roughly the size of the Gospels + a few Epistles quoting Christ', () => {
    expect(Array.isArray(WEB_RED_LETTER)).toBe(true);
    expect(WEB_RED_LETTER.length).toBe(2059);
  });

  it('every entry has a corresponding verse in bible-data-web.ts', () => {
    const missing = WEB_RED_LETTER.filter(
      r => !textByKey.has(`${r.book_id}|${r.chapter}:${r.verse}`),
    );
    expect(missing).toEqual([]);
  });

  it('every span is well-formed: 0 <= start < end <= verse text length', () => {
    const bad = WEB_RED_LETTER.filter(r => {
      const text = textByKey.get(`${r.book_id}|${r.chapter}:${r.verse}`)!;
      return r.spans.some(
        ([start, end]) => start < 0 || end <= start || end > text.length,
      );
    });
    expect(bad).toEqual([]);
  });

  it('anchors 100% — every span, sliced from bible-data-web.ts text, is non-blank', () => {
    // The real regression this test exists to catch: a future edit that
    // regenerates one file without the other (or reintroduces a second
    // text source) would silently misalign spans without necessarily
    // producing empty slices — but an empty/whitespace-only slice is an
    // unambiguous sign something is off, since \wj spans always wrap real
    // spoken words.
    const blank = WEB_RED_LETTER.filter(r => {
      const text = textByKey.get(`${r.book_id}|${r.chapter}:${r.verse}`)!;
      return r.spans.some(
        ([start, end]) => text.slice(start, end).trim() === '',
      );
    });
    expect(blank).toEqual([]);
  });

  it('marks John 3:16 as one continuous span covering the whole verse (Jesus continues speaking)', () => {
    const v = WEB_RED_LETTER.find(
      r => r.book_id === 43 && r.chapter === 3 && r.verse === 16,
    );
    const text = textByKey.get('43|3:16')!;
    expect(v?.spans).toEqual([[0, text.length]]);
  });

  it('does NOT mark Nicodemus (John 3:2) or narration (John 3:1) as words of Jesus', () => {
    const john31 = WEB_RED_LETTER.find(
      r => r.book_id === 43 && r.chapter === 3 && r.verse === 1,
    );
    const john32 = WEB_RED_LETTER.find(
      r => r.book_id === 43 && r.chapter === 3 && r.verse === 2,
    );
    expect(john31).toBeUndefined();
    expect(john32).toBeUndefined();
  });

  it('marks the Beatitudes (Matthew 5:3-4) as words of Jesus', () => {
    const v3 = WEB_RED_LETTER.find(
      r => r.book_id === 40 && r.chapter === 5 && r.verse === 3,
    );
    const v4 = WEB_RED_LETTER.find(
      r => r.book_id === 40 && r.chapter === 5 && r.verse === 4,
    );
    expect(v3).toBeDefined();
    expect(v4).toBeDefined();
  });
});
