/**
 * Tanda 5 — Bible-dictionary v2-doctrinal data layer. Batch 1 (2026-07-21):
 * Expiación, Sábado, Creación, Tabernáculo. Batch 2 (same day, continuation
 * after context compaction): Reino de Dios, Predestinación, Espíritu Santo,
 * Salvación — all 4 had open `[REVISAR]` markers as of batch 1, all resolved
 * this session (12 contextual notes + 1 excision). See
 * project_essb-premium-audit-pastors-teachers.
 *
 * Batch 3 (Bautismo, Milenio, `treatment: 'multi-view'`): unlike batches 1-2,
 * these two entries' premium content is several signed pieces/postures, not
 * one article — `article_es` ships `null` and the content instead lives in
 * `dictionary_multiview_sections`, one row per labeled section, sliced by
 * `scripts/split-dictionary-views.js` (see its own header comment).
 *
 * Batch 4 (Comunión, also `treatment: 'multi-view'`): same shape as batch 3,
 * but entirely freshly-authored (not ISBE-derived, no `split-dictionary-
 * views.js` source .md — that script is hardcoded to Bautismo/Milenio's own
 * source files and doesn't apply here). 6 sections: 5 doctrinal postures
 * (Conmemorativa, Reformada, Luterana, Católica romana, Ortodoxa) + 1
 * non-doctrinal "Diferencias de práctica" section.
 *
 * Mirrors dictionaryV1.test.ts's "fake handle, real business logic" idiom.
 * Also covers the cross-tier safety property that motivated scoping both
 * seed functions' DELETE by `source_tier`: seeding one tier must never wipe
 * the other's already-imported rows, regardless of call order.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  BibleDatabase,
  DictionaryEntry,
  DictionaryMultiviewSection,
} from '../index';

type BundledSection = {position: number; labelEs: string; bodyEs: string};
type BundledEntry = {
  slug: string;
  headwordEs: string;
  glossEs: string;
  articleEs: string | null;
  sourceTier: string;
  treatment: string;
  sections?: BundledSection[];
};
const BUNDLED_V1: BundledEntry[] = require('../../../../assets/dictionary-v1-es.json');
const BUNDLED_V2: BundledEntry[] = require('../../../../assets/dictionary-v2-es.json');

const ANNOTATED_V2 = BUNDLED_V2.filter(e => e.treatment === 'annotated');
const MULTIVIEW_V2 = BUNDLED_V2.filter(e => e.treatment === 'multi-view');

interface DictRow {
  slug: string;
  headword_es: string;
  gloss_es: string;
  article_es: string | null;
  source_tier: string;
  treatment: string;
  updated_at: string | null;
}

interface MultiviewRow {
  slug: string;
  position: number;
  label_es: string;
  body_es: string;
}

/** Same fake as dictionaryV1.test.ts, duplicated here (not imported — test
 *  files should stay independently readable) so both v1 and v2 seeds can be
 *  exercised against the SAME in-memory table, the only way to prove the
 *  cross-tier DELETE scoping actually holds. Extended (batch 3) with a
 *  second in-memory table for `dictionary_multiview_sections`. */
class FakeDictHandle {
  rows: DictRow[] = [];
  multiviewRows: MultiviewRow[] = [];

  async runAsync(
    sql: string,
    params: unknown[] = [],
  ): Promise<{changes: number; lastInsertRowId: number}> {
    const s = sql.trim();
    if (/^DELETE FROM dictionary_entries/i.test(s)) {
      const tierMatch = s.match(/source_tier\s*=\s*'([^']+)'/i);
      this.rows = tierMatch
        ? this.rows.filter(r => r.source_tier !== tierMatch[1])
        : [];
      return {changes: 0, lastInsertRowId: 0};
    }
    if (/^DELETE FROM dictionary_multiview_sections/i.test(s)) {
      this.multiviewRows = [];
      return {changes: 0, lastInsertRowId: 0};
    }
    if (/^INSERT INTO dictionary_entries/i.test(s)) {
      const [
        slug,
        headword_es,
        gloss_es,
        article_es,
        source_tier,
        treatment,
        updated_at,
      ] = params as [
        string,
        string,
        string,
        string | null,
        string,
        string,
        string | null,
      ];
      this.rows.push({
        slug,
        headword_es,
        gloss_es,
        article_es,
        source_tier,
        treatment,
        updated_at,
      });
      return {changes: 1, lastInsertRowId: 0};
    }
    if (/^INSERT INTO dictionary_multiview_sections/i.test(s)) {
      const [slug, position, label_es, body_es] = params as [
        string,
        number,
        string,
        string,
      ];
      this.multiviewRows.push({slug, position, label_es, body_es});
      return {changes: 1, lastInsertRowId: 0};
    }
    throw new Error(
      `FakeDictHandle.runAsync: unhandled statement: ${s.slice(0, 80)}`,
    );
  }

  async getFirstAsync<T>(
    sql: string,
    params: unknown[] = [],
  ): Promise<T | null> {
    const s = sql.trim();
    if (/FROM dictionary_entries\s+WHERE slug = \?/i.test(s)) {
      const [slug] = params as [string];
      const row = this.rows.find(r => r.slug === slug);
      return (row ?? null) as T | null;
    }
    throw new Error(
      `FakeDictHandle.getFirstAsync: unhandled query: ${s.slice(0, 80)}`,
    );
  }

  async getAllAsync<T>(sql: string, params: unknown[] = []): Promise<T[]> {
    const s = sql.trim();
    if (
      /^SELECT slug, headword_es, gloss_es\s+FROM dictionary_entries$/i.test(s)
    ) {
      return this.rows.map(r => ({
        slug: r.slug,
        headword_es: r.headword_es,
        gloss_es: r.gloss_es,
      })) as T[];
    }
    if (/FROM dictionary_multiview_sections\s+WHERE slug = \?/i.test(s)) {
      const [slug] = params as [string];
      return this.multiviewRows
        .filter(r => r.slug === slug)
        .sort((a, b) => a.position - b.position) as unknown as T[];
    }
    throw new Error(
      `FakeDictHandle.getAllAsync: unhandled query: ${s.slice(0, 80)}`,
    );
  }

  async withTransactionAsync(fn: () => Promise<void>): Promise<void> {
    await fn();
  }
}

function makeDb(): {db: BibleDatabase; fake: FakeDictHandle} {
  const fake = new FakeDictHandle();
  const db = new BibleDatabase();
  (db as unknown as {db: FakeDictHandle; initialized: boolean}).db = fake;
  (db as unknown as {initialized: boolean}).initialized = true;
  return {db, fake};
}

function privateApi(db: BibleDatabase) {
  return db as unknown as {
    seedDictionaryV1IfNeeded(): Promise<void>;
    seedDictionaryV2IfNeeded(): Promise<void>;
  };
}

describe('dictionary-v2-es.json (bundled asset, batches 1-4)', () => {
  it('has exactly the 11 approved entries: 8 annotated + 3 multi-view (Bautismo, Comunión, Milenio)', () => {
    expect(BUNDLED_V2).toHaveLength(11);
    expect(BUNDLED_V2.map(e => e.slug).sort()).toEqual([
      'bautismo',
      'comunion',
      'creacion',
      'espiritu-santo',
      'expiacion',
      'milenio',
      'predestinacion',
      'reino-de-dios',
      'sabado',
      'salvacion',
      'tabernaculo',
    ]);
    expect(ANNOTATED_V2).toHaveLength(8);
    expect(MULTIVIEW_V2.map(e => e.slug).sort()).toEqual([
      'bautismo',
      'comunion',
      'milenio',
    ]);
  });

  it('every annotated entry is fully resolved (no leftover markers)', () => {
    const markerPattern = /\[REVISAR|\[EXCISE|\[NOTA DE CONTEXTO|\[CONFIRMADO/;
    for (const e of ANNOTATED_V2) {
      expect(e.headwordEs.length).toBeGreaterThan(0);
      expect(e.glossEs.length).toBeGreaterThan(0);
      expect(e.articleEs).not.toBeNull();
      expect((e.articleEs as string).length).toBeGreaterThan(0);
      expect(e.sourceTier).toBe('v2-doctrinal');
      expect(e.treatment).toBe('annotated');
      // The whole point of build-dictionary-v2-es.js's "fail loud" check —
      // re-assert it here too, directly against the committed asset, so a
      // future hand-edit of the JSON can't silently reintroduce raw
      // editorial bracket text.
      expect(e.glossEs).not.toMatch(markerPattern);
      expect(e.articleEs).not.toMatch(markerPattern);
      // Leftover "&nbsp;" HTML entities (outline indentation in the source
      // OCR) render as literal text in plain RN Text — must be decoded to
      // a real space at ingestion time, never shipped as-is.
      expect(e.glossEs).not.toContain('&nbsp;');
      expect(e.articleEs).not.toContain('&nbsp;');
      // A stray "*" outside a valid **bold**/*italic* span pairs with the
      // NEXT unrelated "*" in parseMarkdownSegments, silently swallowing
      // everything between into one wrong italic span (and cascading, since
      // each subsequent "**heading**" then only contributes one of its two
      // asterisks to close it). Caught 2026-07-21 in reino-de-dios (a
      // bold-wrapped "**[CONFIRMADO ...]**") and creacion (5 bold-wrapped
      // inline "**[NOTA DE CONTEXTO AGREGADA — ver nota general ...]**"
      // pointers that should never have been bold in the first place).
      for (const field of [e.glossEs, e.articleEs as string]) {
        const strippedOfValidSpans = field.replace(
          /\*\*[^*]+\*\*|\*[^*]+\*/g,
          '',
        );
        expect(strippedOfValidSpans).not.toContain('*');
      }
    }
  });

  it('every multi-view entry has article_es null and a non-empty sections array, fully resolved', () => {
    const markerPattern =
      /\[REVISAR|\[EXCISE|\[NOTA DE CONTEXTO|\[CONFIRMADO|\[APROBADO/;
    for (const e of MULTIVIEW_V2) {
      expect(e.headwordEs.length).toBeGreaterThan(0);
      expect(e.glossEs.length).toBeGreaterThan(0);
      expect(e.articleEs).toBeNull();
      expect(e.sourceTier).toBe('v2-doctrinal');
      expect(e.treatment).toBe('multi-view');
      expect(Array.isArray(e.sections)).toBe(true);
      expect((e.sections as BundledSection[]).length).toBeGreaterThan(0);

      // Positions are contiguous starting at 1, matching the display order.
      const positions = (e.sections as BundledSection[])
        .map(s => s.position)
        .sort((a, b) => a - b);
      expect(positions).toEqual(
        Array.from({length: positions.length}, (_, i) => i + 1),
      );

      const fields = [
        e.glossEs,
        ...(e.sections as BundledSection[]).map(s => s.bodyEs),
      ];
      for (const field of fields) {
        expect(field.length).toBeGreaterThan(0);
        expect(field).not.toMatch(markerPattern);
        expect(field).not.toContain('&nbsp;');
        // A stray backtick would render literally — parseMarkdownSegments
        // only understands *italic*/**bold**, never backtick spans.
        expect(field).not.toContain('`');
        const strippedOfValidSpans = field.replace(
          /\*\*[^*]+\*\*|\*[^*]+\*/g,
          '',
        );
        expect(strippedOfValidSpans).not.toContain('*');
      }
      for (const s of e.sections as BundledSection[]) {
        expect(s.labelEs.length).toBeGreaterThan(0);
      }
    }
  });

  it('resolved each annotated entry’s approved contextual notes down to italic note text, not raw bracket markers', () => {
    const expiacion = ANNOTATED_V2.find(e => e.slug === 'expiacion')!;
    expect(expiacion.articleEs).toContain(
      '*Nota: la doctrina de la imputación doble',
    );
    const tabernaculo = ANNOTATED_V2.find(e => e.slug === 'tabernaculo')!;
    expect(tabernaculo.articleEs).toContain(
      'esta sección es un ensayo firmado',
    );
    // No stray triple-newline gaps left behind by a stripped standalone
    // pointer paragraph (tabernaculo had 8 of these before normalization).
    expect(tabernaculo.articleEs).not.toMatch(/\n{3,}/);

    // Batch 2.
    const reinoDeDios = ANNOTATED_V2.find(e => e.slug === 'reino-de-dios')!;
    expect(reinoDeDios.articleEs).toContain(
      'sigue siendo una pregunta genuinamente abierta',
    );
    const predestinacion = ANNOTATED_V2.find(e => e.slug === 'predestinacion')!;
    expect(predestinacion.articleEs).toContain(
      '*Nota: la doctrina reformada de la reprobación',
    );
    const espirituSanto = ANNOTATED_V2.find(e => e.slug === 'espiritu-santo')!;
    expect(espirituSanto.articleEs).toContain(
      '*Nota: el artículo descarta esta idea sin exponer el argumento católico',
    );
    const salvacion = ANNOTATED_V2.find(e => e.slug === 'salvacion')!;
    expect(salvacion.articleEs).toContain(
      '*Nota: el rechazo de que la justificación forense',
    );
  });

  it('excises the "soñador de gueto" passage from Reino de Dios entirely — no note, no trace, same precedent as Jerusalén/Herodes', () => {
    const reinoDeDios = ANNOTATED_V2.find(e => e.slug === 'reino-de-dios')!;
    expect(reinoDeDios.articleEs).not.toContain('soñador de gueto');
    expect(reinoDeDios.articleEs).not.toContain('clavándolo en un madero');
  });

  it('excises both Bautismo passages entirely — same precedent, applied inline mid-paragraph', () => {
    const bautismo = MULTIVIEW_V2.find(e => e.slug === 'bautismo')!;
    const allBodies = (bautismo.sections as BundledSection[])
      .map(s => s.bodyEs)
      .join('\n');
    expect(allBodies).not.toContain('excrecencias judías');
    expect(allBodies).not.toContain('purgar del todo lo judío de Pablo');
    expect(allBodies).not.toContain('la mente judía');
  });

  it('Bautismo preserves all 6 doctrinal views + 3 supplementary sections, each with its own label and byline', () => {
    const bautismo = MULTIVIEW_V2.find(e => e.slug === 'bautismo')!;
    const sections = bautismo.sections as BundledSection[];
    expect(sections).toHaveLength(9);
    expect(sections.map(s => s.labelEs)).toEqual([
      'Bautista',
      'No-inmersionista',
      'Luterana',
      'Regeneración bautismal — reformada',
      'Regeneración bautismal — anglicana de Alta Iglesia',
      'Regeneración bautismal — luterana',
      'Bautismo por los muertos',
      'Bautismo de fuego',
      'Bautismo del Espíritu Santo',
    ]);
    // Every section keeps its own original signed byline — nothing was
    // flattened into one unattributed "the Bible teaches..." voice.
    expect(sections[0].bodyEs).toContain('— A. T. Robertson');
    expect(sections[1].bodyEs).toContain('— T. M. Lindsay');
    expect(sections[3].bodyEs).toContain('— James Orr');
    expect(sections[4].bodyEs).toContain('— William Samuel Bishop');
    expect(sections[8].bodyEs).toContain('— E. Y. Mullins');
  });

  it('Milenio has exactly 3 postures in order: Premilenialismo, Posmilenialismo, Amilenialismo', () => {
    const milenio = MULTIVIEW_V2.find(e => e.slug === 'milenio')!;
    const sections = milenio.sections as BundledSection[];
    expect(sections.map(s => s.labelEs)).toEqual([
      'Premilenialismo',
      'Posmilenialismo',
      'Amilenialismo',
    ]);
    // The premillennial piece is the only one of the three translated from
    // the ISBE 1915 itself — its own byline should survive.
    expect(sections[0].bodyEs).toContain('— William G. Moorehead');
  });

  it('Milenio gloss drops the now-stale claim that the article "here" develops only the premillennial posture', () => {
    const milenio = MULTIVIEW_V2.find(e => e.slug === 'milenio')!;
    expect(milenio.glossEs).not.toContain('desarrolla en detalle');
    // But still neutrally names all 3 postures, per the multi-view design.
    expect(milenio.glossEs).toContain('predicación del evangelio');
    expect(milenio.glossEs).toContain('regreso visible de Jesucristo');
    expect(milenio.glossEs).toContain(
      'no lo entienden como un período literal',
    );
  });

  it('Comunión (batch 4) has exactly 6 sections in order: 5 doctrinal postures + 1 non-doctrinal practice section', () => {
    const comunion = MULTIVIEW_V2.find(e => e.slug === 'comunion')!;
    expect(comunion.headwordEs).toBe('COMUNIÓN');
    const sections = comunion.sections as BundledSection[];
    expect(sections.map(s => s.labelEs)).toEqual([
      'Conmemorativa',
      'Reformada',
      'Luterana',
      'Católica romana',
      'Ortodoxa',
      'Diferencias de práctica',
    ]);
  });

  it('Comunión gloss scopes its neutrality claim to the positions actually presented, not to "every" Christian view', () => {
    const comunion = MULTIVIEW_V2.find(e => e.slug === 'comunion')!;
    // Refinement 1 (Victor, pre-ship review): the closing sentence used to
    // read "...sin favorecer ninguna", implying exhaustive neutrality even
    // though the 6 sections don't cover every historical tradition (e.g. no
    // Anglican or Pentecostal view). Reworded to scope the claim to "varias
    // de las posturas históricas más influyentes" actually presented.
    expect(comunion.glossEs).toContain('posturas históricas más influyentes');
    expect(comunion.glossEs).toContain('sin favorecer ninguna de ellas');
  });

  it('Comunión Section 6 ("Diferencias de práctica") keeps the grape-juice/Welch history but does not read as debunking it', () => {
    const comunion = MULTIVIEW_V2.find(e => e.slug === 'comunion')!;
    const elementos = (comunion.sections as BundledSection[]).find(
      s => s.labelEs === 'Diferencias de práctica',
    )!;
    // Refinement 2 (Victor, pre-ship review): the historical facts (1869,
    // Thomas Welch, Methodist, temperance-era origin) are accurate and kept
    // — only the framing changed, from a "gotcha" arc toward Welch's own
    // principled motivation and an explicit both-sides-sincere close,
    // matching the non-adjudicative tone the doctrinal sections keep.
    expect(elementos.bodyEs).toContain('1869');
    expect(elementos.bodyEs).toContain('Thomas Welch');
    expect(elementos.bodyEs).toContain('convencido de que la Cena no debía');
    expect(elementos.bodyEs).toContain('igualmente sinceras');
  });

  it('does not collide with any v1-factual slug', () => {
    const v1Slugs = new Set(BUNDLED_V1.map(e => e.slug));
    for (const e of BUNDLED_V2) {
      expect(v1Slugs.has(e.slug)).toBe(false);
    }
  });
});

describe('seedDictionaryV2IfNeeded', () => {
  afterEach(async () => {
    await AsyncStorage.clear();
  });

  it('inserts all 11 bundled entries into dictionary_entries', async () => {
    const {db, fake} = makeDb();
    await privateApi(db).seedDictionaryV2IfNeeded();

    expect(fake.rows).toHaveLength(11);
    expect(fake.rows.map(r => r.slug).sort()).toEqual(
      BUNDLED_V2.map(e => e.slug).sort(),
    );
    for (const row of fake.rows) {
      expect(row.gloss_es.length).toBeGreaterThan(0);
      expect(row.source_tier).toBe('v2-doctrinal');
      if (row.treatment === 'multi-view') {
        expect(row.article_es).toBeNull();
      } else {
        expect(row.treatment).toBe('annotated');
        expect((row.article_es as string).length).toBeGreaterThan(0);
      }
    }
  });

  it('inserts multiview sections for bautismo, comunion, and milenio, and none for an annotated slug', async () => {
    const {db, fake} = makeDb();
    await privateApi(db).seedDictionaryV2IfNeeded();

    const bautismoSections = fake.multiviewRows.filter(
      r => r.slug === 'bautismo',
    );
    expect(bautismoSections).toHaveLength(9);
    expect(bautismoSections.map(r => r.position).sort((a, b) => a - b)).toEqual(
      [1, 2, 3, 4, 5, 6, 7, 8, 9],
    );

    const comunionSections = fake.multiviewRows.filter(
      r => r.slug === 'comunion',
    );
    expect(comunionSections).toHaveLength(6);
    expect(comunionSections.map(r => r.position).sort((a, b) => a - b)).toEqual(
      [1, 2, 3, 4, 5, 6],
    );

    const milenioSections = fake.multiviewRows.filter(
      r => r.slug === 'milenio',
    );
    expect(milenioSections).toHaveLength(3);

    const total = MULTIVIEW_V2.reduce(
      (n, e) => n + (e.sections as BundledSection[]).length,
      0,
    );
    expect(fake.multiviewRows).toHaveLength(total);

    expect(fake.multiviewRows.filter(r => r.slug === 'expiacion')).toHaveLength(
      0,
    );
  });

  it('is versioned: a second call is a no-op once the version flag is set', async () => {
    const {db, fake} = makeDb();
    await privateApi(db).seedDictionaryV2IfNeeded();
    expect(fake.rows).toHaveLength(11);

    fake.rows[0].gloss_es = 'stale-marker';
    await privateApi(db).seedDictionaryV2IfNeeded();

    expect(fake.rows).toHaveLength(11);
    expect(fake.rows[0].gloss_es).toBe('stale-marker');
  });

  it('does not throw when the underlying db operation fails (graceful, matches seedDictionaryV1IfNeeded)', async () => {
    const {db, fake} = makeDb();
    fake.withTransactionAsync = async () => {
      throw new Error('simulated failure');
    };

    await expect(
      privateApi(db).seedDictionaryV2IfNeeded(),
    ).resolves.not.toThrow();
    expect(
      await AsyncStorage.getItem('@dictionary_v2_loaded_version'),
    ).toBeNull();
  });
});

describe('cross-tier safety: seeding one tier never wipes the other', () => {
  afterEach(async () => {
    await AsyncStorage.clear();
  });

  it('v1 then v2: both tiers’ rows survive together', async () => {
    const {db, fake} = makeDb();
    await privateApi(db).seedDictionaryV1IfNeeded();
    await privateApi(db).seedDictionaryV2IfNeeded();

    expect(fake.rows).toHaveLength(BUNDLED_V1.length + BUNDLED_V2.length);
    expect(fake.rows.filter(r => r.source_tier === 'v1-factual')).toHaveLength(
      BUNDLED_V1.length,
    );
    expect(
      fake.rows.filter(r => r.source_tier === 'v2-doctrinal'),
    ).toHaveLength(BUNDLED_V2.length);
  });

  it('v2 then v1: both tiers’ rows survive together (order-independent)', async () => {
    const {db, fake} = makeDb();
    await privateApi(db).seedDictionaryV2IfNeeded();
    await privateApi(db).seedDictionaryV1IfNeeded();

    expect(fake.rows).toHaveLength(BUNDLED_V1.length + BUNDLED_V2.length);
    expect(fake.rows.filter(r => r.source_tier === 'v1-factual')).toHaveLength(
      BUNDLED_V1.length,
    );
    expect(
      fake.rows.filter(r => r.source_tier === 'v2-doctrinal'),
    ).toHaveLength(BUNDLED_V2.length);
  });

  it('re-seeding v1 (e.g. a future version bump) leaves v2’s rows untouched', async () => {
    const {db, fake} = makeDb();
    await privateApi(db).seedDictionaryV1IfNeeded();
    await privateApi(db).seedDictionaryV2IfNeeded();
    await AsyncStorage.setItem('@dictionary_v1_loaded_version', '0'); // force re-seed

    await privateApi(db).seedDictionaryV1IfNeeded();

    expect(
      fake.rows.filter(r => r.source_tier === 'v2-doctrinal'),
    ).toHaveLength(BUNDLED_V2.length);
    expect(fake.rows.filter(r => r.source_tier === 'v1-factual')).toHaveLength(
      BUNDLED_V1.length,
    );
  });
});

describe('getDictionaryEntry (v2-doctrinal rows)', () => {
  afterEach(async () => {
    await AsyncStorage.clear();
  });

  it('returns non-empty gloss_es and article_es for the longest v2 entry (espiritu-santo, a truncation stress case)', async () => {
    const {db} = makeDb();
    await privateApi(db).seedDictionaryV2IfNeeded();

    const espirituSanto = (await db.getDictionaryEntry(
      'espiritu-santo',
    )) as DictionaryEntry;
    expect(espirituSanto).not.toBeNull();
    expect(espirituSanto.headword_es).toBe('ESPÍRITU SANTO');
    expect(espirituSanto.source_tier).toBe('v2-doctrinal');
    const bundled = ANNOTATED_V2.find(e => e.slug === 'espiritu-santo')!;
    expect((espirituSanto.article_es as string).length).toBe(
      (bundled.articleEs as string).length,
    );
    expect((espirituSanto.article_es as string).length).toBeGreaterThan(90000);
  });

  it('returns treatment "multi-view" and a null article_es for bautismo/comunion/milenio', async () => {
    const {db} = makeDb();
    await privateApi(db).seedDictionaryV2IfNeeded();

    for (const slug of ['bautismo', 'comunion', 'milenio']) {
      const entry = (await db.getDictionaryEntry(slug)) as DictionaryEntry;
      expect(entry).not.toBeNull();
      expect(entry.treatment).toBe('multi-view');
      expect(entry.article_es).toBeNull();
    }
  });
});

describe('getDictionaryMultiviewSections', () => {
  afterEach(async () => {
    await AsyncStorage.clear();
  });

  it('returns the 9 Bautismo sections in position order', async () => {
    const {db} = makeDb();
    await privateApi(db).seedDictionaryV2IfNeeded();

    const sections: DictionaryMultiviewSection[] =
      await db.getDictionaryMultiviewSections('bautismo');
    expect(sections).toHaveLength(9);
    expect(sections.map(s => s.position)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    expect(sections[0].label_es).toBe('Bautista');
    expect(sections.every(s => s.body_es.length > 0)).toBe(true);
  });

  it('returns an empty array for a non-multi-view slug', async () => {
    const {db} = makeDb();
    await privateApi(db).seedDictionaryV2IfNeeded();

    const sections = await db.getDictionaryMultiviewSections('expiacion');
    expect(sections).toEqual([]);
  });
});
