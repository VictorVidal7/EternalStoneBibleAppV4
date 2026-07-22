/**
 * Tanda 5 — Bible-dictionary v2-doctrinal data layer. Batch 1 (2026-07-21):
 * Expiación, Sábado, Creación, Tabernáculo. Batch 2 (same day, continuation
 * after context compaction): Reino de Dios, Predestinación, Espíritu Santo,
 * Salvación — all 4 had open `[REVISAR]` markers as of batch 1, all resolved
 * this session (12 contextual notes + 1 excision). See
 * project_essb-premium-audit-pastors-teachers. Baptism/Milenio (multi-view,
 * needs a `dictionary_multiview_sections` schema) are deliberately NOT part
 * of either batch.
 *
 * Mirrors dictionaryV1.test.ts's "fake handle, real business logic" idiom.
 * Also covers the cross-tier safety property that motivated scoping both
 * seed functions' DELETE by `source_tier`: seeding one tier must never wipe
 * the other's already-imported rows, regardless of call order.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import {BibleDatabase, DictionaryEntry} from '../index';

type BundledEntry = {
  slug: string;
  headwordEs: string;
  glossEs: string;
  articleEs: string;
  sourceTier: string;
  treatment: string;
};
const BUNDLED_V1: BundledEntry[] = require('../../../../assets/dictionary-v1-es.json');
const BUNDLED_V2: BundledEntry[] = require('../../../../assets/dictionary-v2-es.json');

interface DictRow {
  slug: string;
  headword_es: string;
  gloss_es: string;
  article_es: string;
  source_tier: string;
  treatment: string;
  updated_at: string | null;
}

/** Same fake as dictionaryV1.test.ts, duplicated here (not imported — test
 *  files should stay independently readable) so both v1 and v2 seeds can be
 *  exercised against the SAME in-memory table, the only way to prove the
 *  cross-tier DELETE scoping actually holds. */
class FakeDictHandle {
  rows: DictRow[] = [];

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
        string,
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

  async getAllAsync<T>(sql: string): Promise<T[]> {
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

describe('dictionary-v2-es.json (bundled asset, batches 1+2)', () => {
  it('has exactly the 8 approved entries, each fully resolved (no leftover markers)', () => {
    expect(BUNDLED_V2).toHaveLength(8);
    expect(BUNDLED_V2.map(e => e.slug).sort()).toEqual([
      'creacion',
      'espiritu-santo',
      'expiacion',
      'predestinacion',
      'reino-de-dios',
      'sabado',
      'salvacion',
      'tabernaculo',
    ]);
    const markerPattern = /\[REVISAR|\[EXCISE|\[NOTA DE CONTEXTO|\[CONFIRMADO/;
    for (const e of BUNDLED_V2) {
      expect(e.headwordEs.length).toBeGreaterThan(0);
      expect(e.glossEs.length).toBeGreaterThan(0);
      expect(e.articleEs.length).toBeGreaterThan(0);
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
      const strippedOfValidSpans = e.articleEs.replace(
        /\*\*[^*]+\*\*|\*[^*]+\*/g,
        '',
      );
      expect(strippedOfValidSpans).not.toContain('*');
    }
  });

  it('resolved each entry’s approved contextual notes down to italic note text, not raw bracket markers', () => {
    const expiacion = BUNDLED_V2.find(e => e.slug === 'expiacion')!;
    expect(expiacion.articleEs).toContain(
      '*Nota: la doctrina de la imputación doble',
    );
    const tabernaculo = BUNDLED_V2.find(e => e.slug === 'tabernaculo')!;
    expect(tabernaculo.articleEs).toContain(
      'esta sección es un ensayo firmado',
    );
    // No stray triple-newline gaps left behind by a stripped standalone
    // pointer paragraph (tabernaculo had 8 of these before normalization).
    expect(tabernaculo.articleEs).not.toMatch(/\n{3,}/);

    // Batch 2.
    const reinoDeDios = BUNDLED_V2.find(e => e.slug === 'reino-de-dios')!;
    expect(reinoDeDios.articleEs).toContain(
      'sigue siendo una pregunta genuinamente abierta',
    );
    const predestinacion = BUNDLED_V2.find(e => e.slug === 'predestinacion')!;
    expect(predestinacion.articleEs).toContain(
      '*Nota: la doctrina reformada de la reprobación',
    );
    const espirituSanto = BUNDLED_V2.find(e => e.slug === 'espiritu-santo')!;
    expect(espirituSanto.articleEs).toContain(
      '*Nota: el artículo descarta esta idea sin exponer el argumento católico',
    );
    const salvacion = BUNDLED_V2.find(e => e.slug === 'salvacion')!;
    expect(salvacion.articleEs).toContain(
      '*Nota: el rechazo de que la justificación forense',
    );
  });

  it('excises the "soñador de gueto" passage from Reino de Dios entirely — no note, no trace, same precedent as Jerusalén/Herodes', () => {
    const reinoDeDios = BUNDLED_V2.find(e => e.slug === 'reino-de-dios')!;
    expect(reinoDeDios.articleEs).not.toContain('soñador de gueto');
    expect(reinoDeDios.articleEs).not.toContain('clavándolo en un madero');
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

  it('inserts all 8 bundled entries into dictionary_entries', async () => {
    const {db, fake} = makeDb();
    await privateApi(db).seedDictionaryV2IfNeeded();

    expect(fake.rows).toHaveLength(8);
    expect(fake.rows.map(r => r.slug).sort()).toEqual(
      BUNDLED_V2.map(e => e.slug).sort(),
    );
    for (const row of fake.rows) {
      expect(row.gloss_es.length).toBeGreaterThan(0);
      expect(row.article_es.length).toBeGreaterThan(0);
      expect(row.source_tier).toBe('v2-doctrinal');
      expect(row.treatment).toBe('annotated');
    }
  });

  it('is versioned: a second call is a no-op once the version flag is set', async () => {
    const {db, fake} = makeDb();
    await privateApi(db).seedDictionaryV2IfNeeded();
    expect(fake.rows).toHaveLength(8);

    fake.rows[0].gloss_es = 'stale-marker';
    await privateApi(db).seedDictionaryV2IfNeeded();

    expect(fake.rows).toHaveLength(8);
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
    const bundled = BUNDLED_V2.find(e => e.slug === 'espiritu-santo')!;
    expect((espirituSanto.article_es as string).length).toBe(
      bundled.articleEs.length,
    );
    expect((espirituSanto.article_es as string).length).toBeGreaterThan(90000);
  });
});
