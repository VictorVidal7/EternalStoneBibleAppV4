import {
  filterDictionaryEntries,
  titleCaseHeadword,
  type DictionaryListEntry,
} from '../dictionary';

describe('dictionary — pure helpers for the browse/search screen', () => {
  describe('titleCaseHeadword', () => {
    it('sentence-cases a single-word ALL-CAPS headword', () => {
      expect(titleCaseHeadword('AARÓN')).toBe('Aarón');
      expect(titleCaseHeadword('BELÉN')).toBe('Belén');
      expect(titleCaseHeadword('GALILEA')).toBe('Galilea');
      expect(titleCaseHeadword('JERICÓ')).toBe('Jericó');
      expect(titleCaseHeadword('NAZARET')).toBe('Nazaret');
      expect(titleCaseHeadword('SANEDRÍN')).toBe('Sanedrín');
      expect(titleCaseHeadword('SINAGOGA')).toBe('Sinagoga');
      expect(titleCaseHeadword('TIRO')).toBe('Tiro');
    });

    it('sentence-cases (not per-word title-cases) a multi-word headword', () => {
      // A per-word title-case would wrongly produce "Camino De Un Día De
      // Reposo" — this is the exact case that ruled that approach out.
      expect(titleCaseHeadword('CAMINO DE UN DÍA DE REPOSO')).toBe(
        'Camino de un día de reposo',
      );
    });

    it('keeps a parenthetical qualifier lowercase past its first letter', () => {
      expect(titleCaseHeadword('JOSUÉ (persona)')).toBe('Josué (persona)');
    });

    it('trims surrounding whitespace and handles an empty string', () => {
      expect(titleCaseHeadword('  AARÓN  ')).toBe('Aarón');
      expect(titleCaseHeadword('')).toBe('');
      expect(titleCaseHeadword('   ')).toBe('');
    });
  });

  describe('filterDictionaryEntries', () => {
    const entries: DictionaryListEntry[] = [
      {
        slug: 'josue',
        headword_es: 'JOSUÉ (persona)',
        gloss_es: 'Sucesor de Moisés, líder de la conquista de Canaán.',
      },
      {
        slug: 'aaron',
        headword_es: 'AARÓN',
        gloss_es: 'Hermano de Moisés, primer sumo sacerdote de Israel.',
      },
      {
        slug: 'jornada-sabado',
        headword_es: 'CAMINO DE UN DÍA DE REPOSO',
        gloss_es: 'Distancia que un judío piadoso podía recorrer en sábado.',
      },
    ];

    it('returns every entry, alphabetically sorted, for an empty query', () => {
      const result = filterDictionaryEntries(entries, '');
      expect(result.map(e => e.slug)).toEqual([
        'aaron',
        'jornada-sabado',
        'josue',
      ]);
    });

    it('matches on the headword', () => {
      const result = filterDictionaryEntries(entries, 'josué');
      expect(result.map(e => e.slug)).toEqual(['josue']);
    });

    it('matches on the gloss text, not just the headword', () => {
      const result = filterDictionaryEntries(entries, 'sumo sacerdote');
      expect(result.map(e => e.slug)).toEqual(['aaron']);
    });

    it('is diacritic-insensitive, like the notes search it mirrors', () => {
      // "AARÓN" folds to "aaron" for comparison, so the unaccented query
      // still matches the accented stored headword.
      const result = filterDictionaryEntries(entries, 'aaron');
      expect(result.map(e => e.slug)).toEqual(['aaron']);
    });

    it('returns an empty array when nothing matches', () => {
      expect(filterDictionaryEntries(entries, 'faraón')).toEqual([]);
    });

    it('does not mutate the input array', () => {
      const copy = [...entries];
      filterDictionaryEntries(entries, '');
      expect(entries).toEqual(copy);
    });
  });
});
