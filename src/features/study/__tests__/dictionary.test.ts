import {
  filterDictionaryEntries,
  getRelatedSlugs,
  parseMarkdownSegments,
  RELATED_DICTIONARY_SLUGS,
  titleCaseHeadword,
  type DictionaryListEntry,
} from '../dictionary';

// The real bundled entry sets (same "require the real asset" idiom as
// dictionaryV1.test.ts / dictionaryV2.test.ts) — used only to confirm every
// slug named in the related-entries map actually exists as a shipped entry,
// so a typo can't silently render a link into the "entry not found" state.
const V1_ENTRIES: {
  slug: string;
}[] = require('../../../../assets/dictionary-v1-es.json');
const V2_ENTRIES: {
  slug: string;
}[] = require('../../../../assets/dictionary-v2-es.json');
const ALL_SLUGS = new Set([
  ...V1_ENTRIES.map(e => e.slug),
  ...V2_ENTRIES.map(e => e.slug),
]);

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

    it('keeps a common-noun parenthetical qualifier lowercase past its first letter', () => {
      expect(titleCaseHeadword('JOSUÉ (persona)')).toBe('Josué (persona)');
    });

    it('capitalizes a known proper-noun parenthetical qualifier instead of lowercasing it', () => {
      // "Gólgota" is the Aramaic name for Calvary — a proper place name, not
      // a descriptive common noun like "persona" above — so it must keep
      // its capital letter rather than following the blanket sentence-case
      // rule applied to the rest of the headword.
      expect(titleCaseHeadword('CALVARIO (GÓLGOTA)')).toBe(
        'Calvario (Gólgota)',
      );
    });

    it('matches the known proper-noun qualifier case-insensitively', () => {
      expect(titleCaseHeadword('calvario (gólgota)')).toBe(
        'Calvario (Gólgota)',
      );
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

  describe('parseMarkdownSegments', () => {
    it('splits a real ISBE-style heading out of running prose', () => {
      const result = parseMarkdownSegments(
        '**JOSUÉ**\n\n**I. Forma y significado del nombre.** — El nombre Josué...',
      );
      expect(result).toEqual([
        {text: 'JOSUÉ', style: 'bold'},
        {text: '\n\n', style: 'plain'},
        {text: 'I. Forma y significado del nombre.', style: 'bold'},
        {text: ' — El nombre Josué...', style: 'plain'},
      ]);
    });

    it('italicizes a transliterated term marked with a single "*"', () => {
      const result = parseMarkdownSegments(
        'El nombre es una forma contraída de *beth-lehem*, que significa "casa de pan".',
      );
      expect(result).toEqual([
        {text: 'El nombre es una forma contraída de ', style: 'plain'},
        {text: 'beth-lehem', style: 'italic'},
        {text: ', que significa "casa de pan".', style: 'plain'},
      ]);
    });

    it('does not misread a "**bold**" span as nested italics', () => {
      const result = parseMarkdownSegments('**I. Primera aparición.** texto');
      expect(result).toEqual([
        {text: 'I. Primera aparición.', style: 'bold'},
        {text: ' texto', style: 'plain'},
      ]);
    });

    it('returns a single plain segment for text with no markdown markers', () => {
      expect(parseMarkdownSegments('Texto sin formato.')).toEqual([
        {text: 'Texto sin formato.', style: 'plain'},
      ]);
    });

    it('returns an empty array for empty input', () => {
      expect(parseMarkdownSegments('')).toEqual([]);
    });

    it('leaves an unmatched (odd) "**" as literal text rather than guessing', () => {
      const result = parseMarkdownSegments('**foo** bar **baz');
      expect(result).toEqual([
        {text: 'foo', style: 'bold'},
        {text: ' bar **baz', style: 'plain'},
      ]);
    });

    it('joining every segment.text reproduces the original content losslessly', () => {
      const original =
        '**JOSUÉ**\n\n**I. Forma.** — texto de *beth-lehem* con **II. Historia.** más texto.';
      const rejoined = parseMarkdownSegments(original)
        .map(s => s.text)
        .join('');
      // The rejoined text differs only by the stripped "*"/"**" delimiters —
      // confirms no source content is silently dropped.
      expect(rejoined).toBe(original.replace(/\*\*|\*/g, ''));
    });
  });

  describe('getRelatedSlugs ("Ver también")', () => {
    it('returns the expected pairs for a few representative entries', () => {
      expect(getRelatedSlugs('sabado')).toEqual(['jornada-sabado', 'creacion']);
      expect(getRelatedSlugs('jornada-sabado')).toEqual(['sabado']);
      expect(getRelatedSlugs('nazaret')).toEqual([
        'belen',
        'galilea',
        'sinagoga',
      ]);
      expect(getRelatedSlugs('milenio')).toEqual(['reino-de-dios']);
    });

    it('returns an empty array for an entry with no related links', () => {
      expect(getRelatedSlugs('sanedrin')).toEqual([]);
      expect(getRelatedSlugs('tiro')).toEqual([]);
    });

    it('returns an empty array for an unknown slug rather than throwing', () => {
      expect(getRelatedSlugs('does-not-exist')).toEqual([]);
    });

    it('is symmetric: every A→B link has a matching B→A link back', () => {
      for (const [slug, related] of Object.entries(RELATED_DICTIONARY_SLUGS)) {
        for (const other of related) {
          expect(RELATED_DICTIONARY_SLUGS[other]).toBeDefined();
          expect(RELATED_DICTIONARY_SLUGS[other]).toContain(slug);
        }
      }
    });

    it('never links an entry to itself', () => {
      for (const [slug, related] of Object.entries(RELATED_DICTIONARY_SLUGS)) {
        expect(related).not.toContain(slug);
      }
    });

    it('every slug named in the map (key or value) is a real shipped entry', () => {
      for (const [slug, related] of Object.entries(RELATED_DICTIONARY_SLUGS)) {
        expect(ALL_SLUGS.has(slug)).toBe(true);
        for (const other of related) {
          expect(ALL_SLUGS.has(other)).toBe(true);
        }
      }
    });

    it('has no duplicate related slugs within one entry', () => {
      for (const related of Object.values(RELATED_DICTIONARY_SLUGS)) {
        expect(new Set(related).size).toBe(related.length);
      }
    });
  });
});
