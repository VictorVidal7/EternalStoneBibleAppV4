import {
  filterDictionaryEntries,
  getRelatedSlugs,
  parseMarkdownSegments,
  RELATED_DICTIONARY_SLUGS,
  titleCaseHeadword,
  type DictionaryListEntry,
} from '../dictionary';

// The real bundled entry sets (same "require the real asset" idiom as
// dictionaryV1.test.ts / dictionaryV2.test.ts) — used to confirm every slug
// named in the related-entries map actually exists as a shipped entry (so a
// typo can't silently render a link into the "entry not found" state), and
// to run `parseMarkdownSegments` regression checks against the real bundled
// article text below, not a synthetic simplification.
interface BundledSection {
  bodyEs: string;
}
interface BundledEntry {
  slug: string;
  articleEs?: string | null;
  glossEs?: string;
  sections?: BundledSection[];
}
const V1_ENTRIES: BundledEntry[] = require('../../../../assets/dictionary-v1-es.json');
const V2_ENTRIES: BundledEntry[] = require('../../../../assets/dictionary-v2-es.json');
const MULTIVIEW_ENTRIES: BundledEntry[] = require('../../../../assets/dictionary-v2-multiview-es.json');
const ALL_SLUGS = new Set([
  ...V1_ENTRIES.map(e => e.slug),
  ...V2_ENTRIES.map(e => e.slug),
]);
// Every markdown-bearing text field across all 3 bundled dictionary assets
// (v1, v2, and the v2 multiview split), used by the corpus-wide regression
// check below.
const ALL_BUNDLED_MARKDOWN_FIELDS: {path: string; text: string}[] = [
  ...V1_ENTRIES.flatMap(e =>
    e.articleEs ? [{path: `v1/${e.slug}.articleEs`, text: e.articleEs}] : [],
  ),
  ...[...V2_ENTRIES, ...MULTIVIEW_ENTRIES].flatMap(e => {
    const tier = V2_ENTRIES.includes(e) ? 'v2' : 'multiview';
    const fields: {path: string; text: string}[] = [];
    if (e.articleEs)
      fields.push({path: `${tier}/${e.slug}.articleEs`, text: e.articleEs});
    if (e.glossEs)
      fields.push({path: `${tier}/${e.slug}.glossEs`, text: e.glossEs});
    (e.sections ?? []).forEach((s, i) =>
      fields.push({
        path: `${tier}/${e.slug}.sections[${i}].bodyEs`,
        text: s.bodyEs,
      }),
    );
    return fields;
  }),
];

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

    describe('nested bold-wraps-italic (regression: "pascua" desync bug)', () => {
      // Real heading text sliced straight out of the bundled "pascua" article
      // — not a synthetic simplification — so this test can't silently drift
      // from what actually ships. Before the fix, this exact pattern
      // ("**N. *término*...**") desynced the split for the rest of the
      // ~17,558-char article: every later paragraph/heading came out with
      // the wrong style, ending in a stray unpaired "*".
      const REAL_PASCUA_HEADING = '**1. *Pesaḥ* y *matsot***';

      it('is actually present verbatim in the bundled pascua article (guards against drift)', () => {
        const pascua = V1_ENTRIES.find(e => e.slug === 'pascua')!;
        expect(pascua.articleEs).toContain(REAL_PASCUA_HEADING);
      });

      it('splits a bold heading that wraps two italic runs into bold + bold-italic segments, no stray asterisks', () => {
        const result = parseMarkdownSegments(REAL_PASCUA_HEADING);
        expect(result).toEqual([
          {text: '1. ', style: 'bold'},
          {text: 'Pesaḥ', style: 'bold-italic'},
          {text: ' y ', style: 'bold'},
          {text: 'matsot', style: 'bold-italic'},
        ]);
        for (const seg of result) {
          expect(seg.text).not.toContain('*');
        }
      });

      it('parses the full real pascua article end-to-end with no desync into the rest of the document', () => {
        const pascua = V1_ENTRIES.find(e => e.slug === 'pascua')!;
        const segments = parseMarkdownSegments(pascua.articleEs as string);

        // No stray asterisks leak into ANY rendered segment.
        for (const seg of segments) {
          expect(seg.text).not.toContain('*');
        }
        // Lossless rejoin — every character survives except the stripped
        // markdown delimiters themselves.
        const rejoined = segments.map(s => s.text).join('');
        expect(rejoined).toBe(
          (pascua.articleEs as string).replace(/\*\*|\*/g, ''),
        );

        // All 5 numbered nested headings resolved as bold, with their
        // wrapped transliterated terms as bold-italic (not swallowed and
        // not downgraded to plain italic).
        for (const term of ['Pesaḥ mitsrayim', 'Pesaḥ dorot', 'matsot']) {
          const hit = segments.find(
            s => s.text === term && s.style === 'bold-italic',
          );
          expect(hit).toBeDefined();
        }

        // The article's closing byline (well past the last nested heading)
        // must still render as ordinary plain prose, not a style corrupted
        // by an earlier desync.
        const last = segments[segments.length - 1];
        expect(last.style).toBe('plain');
        expect(last.text).toContain('Nathan Isaacs');
      });

      it('does not change parsed output for any other bundled entry/field (v1, v2, multiview)', () => {
        // Every field is confirmed non-lossy and stray-asterisk-free — a
        // proxy for "identical to the pre-fix parser", since the only
        // behavioral difference introduced is how a genuinely nested
        // bold+italic span is handled, and pascua's 5 headings are the only
        // such spans anywhere in the bundled corpus (confirmed by scanning
        // all 3 JSON assets).
        expect(ALL_BUNDLED_MARKDOWN_FIELDS.length).toBeGreaterThan(30);
        for (const {path, text} of ALL_BUNDLED_MARKDOWN_FIELDS) {
          const segments = parseMarkdownSegments(text);
          const rejoined = segments.map(s => s.text).join('');
          // `path` is embedded in the failure message via the field label —
          // jest reports the failing assertion's stack, and this loop body
          // is small enough that the offending `text` is easy to spot too.
          expect({path, ok: rejoined === text.replace(/\*\*|\*/g, '')}).toEqual(
            {path, ok: true},
          );
          for (const seg of segments) {
            expect(seg.text.includes('*')).toBe(false);
          }
        }
      });
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
