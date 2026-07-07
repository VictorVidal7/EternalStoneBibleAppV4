import {
  pickGloss,
  glossLanguage,
  hasLexicon,
  strongsLabel,
  occurrenceRef,
  findWordByStrongs,
} from '../src/features/study/originals';
import type {OriginalWord} from '../src/lib/database';

describe('originals — pure helpers', () => {
  describe('glossLanguage', () => {
    it('is Spanish whenever the UI is Spanish', () => {
      expect(glossLanguage('es', 'KJV')).toBe('es');
      expect(glossLanguage('es', undefined)).toBe('es');
    });
    it('follows a Spanish version even with an English UI', () => {
      expect(glossLanguage('en', 'RVR1960')).toBe('es');
    });
    it('is English for an English UI + English/unknown version', () => {
      expect(glossLanguage('en', 'KJV')).toBe('en');
      expect(glossLanguage('en', 'WEB')).toBe('en');
      expect(glossLanguage('en', undefined)).toBe('en');
      expect(glossLanguage('en', 'NOPE')).toBe('en');
    });
  });

  describe('pickGloss', () => {
    it('prefers the Spanish gloss for a Spanish UI', () => {
      expect(pickGloss({gloss_es: 'amó', gloss_en: 'to love'}, 'es')).toBe(
        'amó',
      );
    });
    it('falls back to English when Spanish is absent (Hebrew rows)', () => {
      expect(pickGloss({gloss_es: null, gloss_en: 'God'}, 'es')).toBe('God');
      expect(pickGloss({gloss_es: '  ', gloss_en: 'God'}, 'es')).toBe('God');
    });
    it('prefers English for an English UI', () => {
      expect(pickGloss({gloss_es: 'amó', gloss_en: 'to love'}, 'en')).toBe(
        'to love',
      );
    });
    it('returns null when no gloss is present', () => {
      expect(pickGloss({gloss_es: null, gloss_en: null}, 'es')).toBeNull();
      expect(pickGloss({gloss_es: '', gloss_en: ''}, 'en')).toBeNull();
    });
  });

  describe('findWordByStrongs (Ficha #13 — original-word chip)', () => {
    const ow = (strongs: string | null, word: string): OriginalWord => ({
      position: 1,
      lang: 'grc',
      word,
      translit: null,
      gloss_en: null,
      gloss_es: null,
      strongs,
      grammar: null,
    });

    it('finds the word tagged with the given Strongs number', () => {
      const words = [ow('G846', 'αὐτῆς'), ow('G3778', 'ταῦτα')];
      expect(findWordByStrongs(words, 'G3778')?.word).toBe('ταῦτα');
    });

    it('returns null when the verse has no matching word', () => {
      const words = [ow('G846', 'αὐτῆς')];
      expect(findWordByStrongs(words, 'G3778')).toBeNull();
    });

    it('returns null for an empty verse', () => {
      expect(findWordByStrongs([], 'G3778')).toBeNull();
    });

    it('returns the FIRST match when a Strongs number repeats in the verse', () => {
      const words = [ow('G3778', 'first'), ow('G3778', 'second')];
      expect(findWordByStrongs(words, 'G3778')?.word).toBe('first');
    });
  });

  describe('hasLexicon', () => {
    it('accepts a real Strongs key', () => {
      expect(hasLexicon('G25')).toBe(true);
      expect(hasLexicon('H7225')).toBe(true);
    });
    it('rejects null/empty/malformed', () => {
      expect(hasLexicon(null)).toBe(false);
      expect(hasLexicon('')).toBe(false);
      expect(hasLexicon('X12')).toBe(false);
      expect(hasLexicon('H')).toBe(false);
    });
  });

  describe('strongsLabel', () => {
    it('upper-cases + trims', () => {
      expect(strongsLabel(' g25 ')).toBe('G25');
    });
  });

  describe('occurrenceRef', () => {
    it('formats by book id in the UI language', () => {
      // 43 = John / Juan, 1 = Genesis / Génesis.
      expect(occurrenceRef({book_id: 43, chapter: 3, verse: 16}, 'en')).toBe(
        'John 3:16',
      );
      expect(occurrenceRef({book_id: 43, chapter: 3, verse: 16}, 'es')).toBe(
        'Juan 3:16',
      );
      expect(occurrenceRef({book_id: 1, chapter: 1, verse: 1}, 'en')).toBe(
        'Genesis 1:1',
      );
    });
    it('degrades to #id for an unknown book', () => {
      expect(occurrenceRef({book_id: 999, chapter: 1, verse: 1}, 'en')).toBe(
        '#999 1:1',
      );
    });
  });
});
