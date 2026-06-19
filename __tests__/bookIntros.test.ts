import {BOOK_INTROS, getBookIntro} from '../src/constants/book-intros';
import {BIBLE_BOOKS} from '../src/constants/bible';

describe('book-intros — "Sobre este libro" catalog', () => {
  const ids = BIBLE_BOOKS.map(b => b.id);

  it('covers all 66 canonical books', () => {
    expect(ids).toHaveLength(66);
    for (const id of ids) {
      expect(BOOK_INTROS[id]).toBeDefined();
    }
  });

  describe.each(BIBLE_BOOKS.map(b => [b.id, b.nameEn] as const))(
    'book %i (%s)',
    id => {
      for (const lang of ['es', 'en'] as const) {
        it(`has complete ${lang} fields`, () => {
          const intro = getBookIntro(id, lang);
          expect(intro).not.toBeNull();
          if (!intro) return;
          // Every prose field is a non-empty, trimmed string.
          for (const field of [
            'author',
            'date',
            'theme',
            'context',
            'christ',
          ] as const) {
            expect(typeof intro[field]).toBe('string');
            expect(intro[field].trim().length).toBeGreaterThan(0);
          }
          // At least one key verse, each "C:V" or "C:V-V".
          expect(intro.keyVerses.length).toBeGreaterThan(0);
          for (const ref of intro.keyVerses) {
            expect(ref).toMatch(/^\d+:\d+(-\d+)?$/);
          }
          // The Christ note actually names Christ/Jesus (book-level lens).
          // Case-insensitive so "Jesucristo" (es) counts.
          expect(intro.christ).toMatch(/crist|christ|jes[uú]s/i);
        });
      }
    },
  );
});
