/**
 * Tanda 10 — Hebrew Spanish-gloss overlay, Fase 1 (infrastructure only; see
 * project_essb-... in memory for the review-sheet handoff to Victor).
 *
 * TAHOT (the Hebrew source `original_words` is built from) carries no
 * Spanish gloss column at all, unlike TAGNT (Greek) —
 * `scripts/build-originals-pack.js` writes an empty Hebrew `gloss_es` for
 * every Hebrew row. This suite exercises the three pieces that make the new
 * `hebrew_gloss_es` overlay actually work:
 *
 *  1. The REAL bundled `assets/hebrew-gloss-es-v1.json` — shape/coverage
 *     only, plus a non-empty check. Filled in by Claude at Victor's direct
 *     request as a first-pass translation of each row's already-verified
 *     `gloss_en` (see the review-sheet report) — worth Victor's own skim
 *     before this ships live, but no longer an intentionally-empty
 *     placeholder, so these assertions check structure/keys and presence,
 *     never the exact wording (that's Victor's call, not this suite's).
 *  2. `seedHebrewGlossEsIfNeeded` — against a SYNTHETIC fixture (swapped in
 *     via jest.mock, not the real asset) so we can prove the seeder inserts
 *     real values and skips empty/whitespace ones, independent of whatever
 *     Fase 1 actually ships.
 *  3. `getOriginalWords`'s LEFT JOIN + `COALESCE(NULLIF(TRIM(...), ''), ...)`
 *     — the one trap that matters: `build-originals-pack.js` writes NULL for
 *     every Hebrew row's gloss_es today (`w.glossEs || null`, confirmed by
 *     reading the source), but a plain `COALESCE(ow.gloss_es, hg.gloss_es)`
 *     is still wrong to rely on — it silently never falls through the
 *     moment gloss_es is `''` instead of NULL, which is exactly the shape
 *     an already-deployed pack (built before that normalization existed) or
 *     a future refactor could produce. NULLIF/TRIM covers both NULL and ''
 *     (and whitespace) unconditionally, so both are tested here. Exercised
 *     against a fake handle that actually EVALUATES the trim/coalesce
 *     semantics per row (not a canned-response stub), plus `pickGloss` on
 *     the resulting shape to confirm the overlay value wins end-to-end once
 *     it's flowed through the query.
 *
 * `node:sqlite` was considered for a REAL in-memory SQLite test (like
 * scripts/*.js use), but this repo's CI pins Node 20 and `node:sqlite`
 * requires Node >= 22.5 (see __tests__/databaseMigrations.test.ts's header
 * for the same reasoning) — so this follows that file's established
 * "fake handle, real business logic" idiom instead.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import {pickGloss} from '../src/features/study/originals';
import type {OriginalWord} from '../src/lib/database';

// Synthetic fixture — NOT the real bundled asset (which ships every glossEs
// empty pending Victor's review). Swapped in so seedHebrewGlossEsIfNeeded can
// be exercised end-to-end (insert real values, skip empty/whitespace ones)
// without ever depending on — or fabricating — real Hebrew content.
const SYNTHETIC_ENTRIES = [
  {
    bookId: 19,
    chapter: 136,
    verse: 1,
    position: 7,
    glossEs: 'fidelidad amorosa',
  },
  {bookId: 5, chapter: 27, verse: 15, position: 18, glossEs: 'amén'},
  {bookId: 19, chapter: 3, verse: 2, position: 8, glossEs: ''}, // pending — must be skipped
  {bookId: 19, chapter: 23, verse: 1, position: 4, glossEs: '   '}, // whitespace-only — must be skipped
];
jest.mock('../assets/hebrew-gloss-es-v1.json', () => SYNTHETIC_ENTRIES);

// Synthetic fixture for the A3 per-lemma overlay — flat { strongs: gloss },
// NOT the real bundled asset (which the content-sweep test below reads via
// jest.requireActual). Includes empty/whitespace values the seeder must skip.
const SYNTHETIC_LEMMA_ENTRIES: Record<string, string> = {
  H3034: 'alabar / dar gracias',
  H2617: 'misericordia / amor leal', // must LOSE to the per-occurrence overlay
  H7225: 'principio',
  H0001: '', // empty — must be skipped
  H0002: '   ', // whitespace-only — must be skipped
};
jest.mock(
  '../assets/hebrew-lemma-gloss-es.json',
  () => SYNTHETIC_LEMMA_ENTRIES,
);

import {BibleDatabase} from '../src/lib/database';

interface OriginalWordRow {
  book_id: number;
  chapter: number;
  verse: number;
  position: number;
  lang: string;
  word: string;
  translit: string | null;
  gloss_en: string | null;
  gloss_es: string | null;
  strongs: string | null;
  grammar: string | null;
}
interface HebrewGlossEsRow {
  book_id: number;
  chapter: number;
  verse: number;
  position: number;
  gloss_es: string;
}
interface HebrewLemmaGlossEsRow {
  strongs: string;
  gloss_es: string;
}

/** In-memory stand-in for the SQLite handle. Unlike a canned-response stub,
 *  `getAllAsync` genuinely EVALUATES the join + `COALESCE(NULLIF(TRIM(...),
 *  ''), ...)` expression over its row store, so this is a real regression
 *  test for that exact fallback behavior, not a tautology. */
class FakeOriginalsHandle {
  originalWords: OriginalWordRow[] = [];
  hebrewGlossEs: HebrewGlossEsRow[] = [];
  hebrewLemmaGlossEs: HebrewLemmaGlossEsRow[] = [];

  async runAsync(
    sql: string,
    params: unknown[] = [],
  ): Promise<{changes: number; lastInsertRowId: number}> {
    const s = sql.trim();
    if (/^DELETE FROM hebrew_gloss_es/i.test(s)) {
      this.hebrewGlossEs = [];
      return {changes: 0, lastInsertRowId: 0};
    }
    if (/^INSERT INTO hebrew_gloss_es/i.test(s)) {
      const [book_id, chapter, verse, position, gloss_es] = params as [
        number,
        number,
        number,
        number,
        string,
      ];
      this.hebrewGlossEs.push({book_id, chapter, verse, position, gloss_es});
      return {changes: 1, lastInsertRowId: 0};
    }
    if (/^DELETE FROM hebrew_lemma_gloss_es/i.test(s)) {
      this.hebrewLemmaGlossEs = [];
      return {changes: 0, lastInsertRowId: 0};
    }
    if (/^INSERT (?:OR REPLACE )?INTO hebrew_lemma_gloss_es/i.test(s)) {
      // The seeder batches N (strongs, gloss) pairs into one multi-row VALUES
      // statement — params is a flat [s1, g1, s2, g2, …].
      const p = params as string[];
      for (let k = 0; k + 1 < p.length; k += 2) {
        const strongs = p[k];
        const gloss_es = p[k + 1];
        const i = this.hebrewLemmaGlossEs.findIndex(r => r.strongs === strongs);
        if (i >= 0) this.hebrewLemmaGlossEs[i] = {strongs, gloss_es};
        else this.hebrewLemmaGlossEs.push({strongs, gloss_es});
      }
      return {changes: p.length / 2, lastInsertRowId: 0};
    }
    throw new Error(
      `FakeOriginalsHandle.runAsync: unhandled statement: ${s.slice(0, 80)}`,
    );
  }

  async getAllAsync<T>(sql: string, params: unknown[] = []): Promise<T[]> {
    const s = sql.trim();
    if (/FROM original_words ow\s+LEFT JOIN hebrew_gloss_es/i.test(s)) {
      const [bookId, chapter, verse] = params as [number, number, number];
      const rows = this.originalWords
        .filter(
          w =>
            w.book_id === bookId && w.chapter === chapter && w.verse === verse,
        )
        .sort((a, b) => a.position - b.position);
      return rows.map(w => {
        const hg = this.hebrewGlossEs.find(
          h =>
            h.book_id === w.book_id &&
            h.chapter === w.chapter &&
            h.verse === w.verse &&
            h.position === w.position,
        );
        // `LEFT JOIN hebrew_lemma_gloss_es hl ON hl.strongs = ow.strongs
        //  AND ow.lang = 'H'` — the lang guard is part of the ON clause, so a
        // Greek row never joins even if a same-numbered Strong's exists.
        const hl =
          w.lang === 'H' && w.strongs
            ? this.hebrewLemmaGlossEs.find(r => r.strongs === w.strongs)
            : undefined;
        // Mirror COALESCE(NULLIF(TRIM(ow.gloss_es), ''), hg.gloss_es,
        // hl.gloss_es) exactly: NULLIF(TRIM(x), '') is NULL for NULL, '', or
        // whitespace-only x; then the two overlays in priority order.
        const trimmed = w.gloss_es === null ? null : w.gloss_es.trim();
        const gloss_es = trimmed
          ? trimmed
          : hg
            ? hg.gloss_es
            : hl
              ? hl.gloss_es
              : null;
        return {
          position: w.position,
          lang: w.lang,
          word: w.word,
          translit: w.translit,
          gloss_en: w.gloss_en,
          gloss_es,
          strongs: w.strongs,
          grammar: w.grammar,
        } as unknown as T;
      });
    }
    throw new Error(
      `FakeOriginalsHandle.getAllAsync: unhandled query: ${s.slice(0, 80)}`,
    );
  }

  async withTransactionAsync(fn: () => Promise<void>): Promise<void> {
    await fn();
  }
}

function makeDb(): {db: BibleDatabase; fake: FakeOriginalsHandle} {
  const fake = new FakeOriginalsHandle();
  const db = new BibleDatabase();
  (db as unknown as {db: FakeOriginalsHandle; initialized: boolean}).db = fake;
  (db as unknown as {initialized: boolean}).initialized = true;
  return {db, fake};
}

function privateApi(db: BibleDatabase) {
  return db as unknown as {
    seedHebrewGlossEsIfNeeded(): Promise<void>;
    seedHebrewLemmaGlossEsIfNeeded(): Promise<void>;
  };
}

const ow = (overrides: Partial<OriginalWordRow>): OriginalWordRow => ({
  book_id: 19,
  chapter: 136,
  verse: 1,
  position: 1,
  lang: 'H',
  word: 'הוֹד֣וּ',
  translit: 'ho.Du',
  gloss_en: 'give thanks',
  gloss_es: null,
  strongs: 'H3034',
  grammar: null,
  ...overrides,
});

describe('hebrew-gloss-es-v1.json (bundled asset) — Fase 1 shape', () => {
  // Bypasses the jest.mock above to read the REAL bundled asset.
  const REAL_ASSET: Array<{
    bookId: number;
    chapter: number;
    verse: number;
    position: number;
    glossEs: string;
  }> = jest.requireActual('../assets/hebrew-gloss-es-v1.json');

  it('has the Fase 1 + A4-chico positional-overlay scope (610 rows), each with a non-empty draft glossEs', () => {
    // v1/v2: filled in by Claude at Victor's direct request ("agrega el
    // español") after the review sheet was handed off — a first-pass
    // translation of each row's already-verified gloss_en, not independently
    // re-sourced. v3 (60th session): 573 more rows for the non-dominant
    // TBESH senses of 27 polysemous Hebrew lemmas, built by
    // scripts/build-hebrew-gloss-es-v2.js from 2 independently-verified
    // research agents (mechanical TAHOT position keys + hand-cited Spanish
    // translations verified against bible-seed.db). Still worth Victor's own
    // skim before this ships live, same spirit as the commentary entries'
    // explicit "Victor reviewed and approved" mark.
    expect(REAL_ASSET).toHaveLength(610);
    for (const row of REAL_ASSET) {
      expect(Number.isInteger(row.bookId)).toBe(true);
      expect(Number.isInteger(row.chapter)).toBe(true);
      expect(Number.isInteger(row.verse)).toBe(true);
      expect(Number.isInteger(row.position)).toBe(true);
      expect(row.glossEs.trim().length).toBeGreaterThan(0);
    }
  });

  it('still carries the original Fase 1 scope (4 target verses) unchanged, plus the v3 positional-overlay batch', () => {
    const key = (r: {bookId: number; chapter: number; verse: number}) =>
      `${r.bookId}.${r.chapter}.${r.verse}`;
    const counts: Record<string, number> = {};
    for (const r of REAL_ASSET) counts[key(r)] = (counts[key(r)] ?? 0) + 1;
    // Fase 1's 4 verses are untouched by the v3 batch.
    expect(counts['5.27.15']).toBe(18); // Deuteronomy 27:15 (amen)
    expect(counts['19.136.1']).toBe(7); // Psalms 136:1 (hesed)
    expect(counts['19.3.2']).toBe(8); // Psalms 3:2 (selah)
    expect(counts['19.23.1']).toBe(4); // Psalms 23:1 (my-shepherd)
    // v3 adds many more verses across the 27 Tier-A1 lemmas (573 rows).
    const totalOtherRows =
      REAL_ASSET.length -
      (counts['5.27.15'] +
        counts['19.136.1'] +
        counts['19.3.2'] +
        counts['19.23.1']);
    expect(totalOtherRows).toBe(573);
  });

  it('has no duplicate (bookId, chapter, verse, position) keys — per-occurrence, not per-Strong’s', () => {
    const keys = REAL_ASSET.map(
      r => `${r.bookId}.${r.chapter}.${r.verse}.${r.position}`,
    );
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('has the exact extracted positions per verse, including the Psalms 23:1 / 3:2 versification gap documented in the report', () => {
    const positionsFor = (bookId: number, chapter: number, verse: number) =>
      REAL_ASSET.filter(
        r => r.bookId === bookId && r.chapter === chapter && r.verse === verse,
      )
        .map(r => r.position)
        .sort((a, b) => a - b);

    expect(positionsFor(5, 27, 15)).toEqual(
      Array.from({length: 18}, (_, i) => i + 1),
    );
    expect(positionsFor(19, 136, 1)).toEqual([1, 2, 3, 4, 5, 6, 7]);
    expect(positionsFor(19, 3, 2)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    // Positions 1-2 ("A Psalm of David") belong to the Hebrew superscription,
    // which maps to our "verse 0" (no such verse exists) — correctly absent.
    expect(positionsFor(19, 23, 1)).toEqual([3, 4, 5, 6]);
  });
});

describe('seedHebrewGlossEsIfNeeded (synthetic fixture)', () => {
  afterEach(async () => {
    await AsyncStorage.clear();
  });

  it('inserts only rows whose glossEs is non-empty after trim, skipping empty/whitespace-only rows', async () => {
    const {db, fake} = makeDb();
    await privateApi(db).seedHebrewGlossEsIfNeeded();

    expect(fake.hebrewGlossEs).toHaveLength(2);
    expect(fake.hebrewGlossEs).toEqual(
      expect.arrayContaining([
        {
          book_id: 19,
          chapter: 136,
          verse: 1,
          position: 7,
          gloss_es: 'fidelidad amorosa',
        },
        {book_id: 5, chapter: 27, verse: 15, position: 18, gloss_es: 'amén'},
      ]),
    );
    // The '' and whitespace-only rows never made it in.
    expect(fake.hebrewGlossEs.some(r => r.chapter === 3 && r.verse === 2)).toBe(
      false,
    );
    expect(
      fake.hebrewGlossEs.some(r => r.chapter === 23 && r.verse === 1),
    ).toBe(false);
  });

  it('marks the version flag done after seeding', async () => {
    const {db} = makeDb();
    await privateApi(db).seedHebrewGlossEsIfNeeded();

    expect(await AsyncStorage.getItem('@hebrew_gloss_es_loaded_version')).toBe(
      '3',
    );
  });

  it('is versioned: a second call is a no-op once the flag is set (does not duplicate or re-touch rows)', async () => {
    const {db, fake} = makeDb();
    await privateApi(db).seedHebrewGlossEsIfNeeded();
    expect(fake.hebrewGlossEs).toHaveLength(2);

    fake.hebrewGlossEs[0].gloss_es = 'stale-marker';
    await privateApi(db).seedHebrewGlossEsIfNeeded();

    expect(fake.hebrewGlossEs).toHaveLength(2); // not doubled
    expect(fake.hebrewGlossEs[0].gloss_es).toBe('stale-marker'); // untouched
  });

  it('re-seeds from scratch when the stored version differs (a future version bump)', async () => {
    await AsyncStorage.setItem('@hebrew_gloss_es_loaded_version', '0');
    const {db, fake} = makeDb();

    await privateApi(db).seedHebrewGlossEsIfNeeded();

    expect(fake.hebrewGlossEs).toHaveLength(2);
    expect(await AsyncStorage.getItem('@hebrew_gloss_es_loaded_version')).toBe(
      '3',
    );
  });

  it('does not throw when the underlying db operation fails (graceful, matches seedStrongsDefsIfNeeded)', async () => {
    const {db, fake} = makeDb();
    fake.withTransactionAsync = async () => {
      throw new Error('simulated failure');
    };

    await expect(
      privateApi(db).seedHebrewGlossEsIfNeeded(),
    ).resolves.not.toThrow();
    expect(
      await AsyncStorage.getItem('@hebrew_gloss_es_loaded_version'),
    ).toBeNull(); // never marked "done" — a future launch can retry
  });
});

describe('getOriginalWords — Hebrew Spanish-gloss overlay fallback (the NULLIF/TRIM trap)', () => {
  it('falls back to the overlay when the pack’s gloss_es is an empty string (the actual production shape for Hebrew rows)', async () => {
    const {db, fake} = makeDb();
    fake.originalWords = [ow({gloss_es: ''})];
    fake.hebrewGlossEs = [
      {book_id: 19, chapter: 136, verse: 1, position: 1, gloss_es: 'gracias'},
    ];

    const words = await db.getOriginalWords(19, 136, 1);
    expect(words).toHaveLength(1);
    expect(words[0].gloss_es).toBe('gracias');
  });

  it('falls back to the overlay when the pack’s gloss_es is NULL', async () => {
    const {db, fake} = makeDb();
    fake.originalWords = [ow({gloss_es: null})];
    fake.hebrewGlossEs = [
      {book_id: 19, chapter: 136, verse: 1, position: 1, gloss_es: 'gracias'},
    ];

    const words = await db.getOriginalWords(19, 136, 1);
    expect(words[0].gloss_es).toBe('gracias');
  });

  it('falls back to the overlay when the pack’s gloss_es is whitespace-only', async () => {
    const {db, fake} = makeDb();
    fake.originalWords = [ow({gloss_es: '   '})];
    fake.hebrewGlossEs = [
      {book_id: 19, chapter: 136, verse: 1, position: 1, gloss_es: 'gracias'},
    ];

    const words = await db.getOriginalWords(19, 136, 1);
    expect(words[0].gloss_es).toBe('gracias');
  });

  it('prefers the pack’s own real gloss_es over the overlay (Greek rows already carry one)', async () => {
    const {db, fake} = makeDb();
    fake.originalWords = [ow({lang: 'G', gloss_es: 'amó', word: 'ἠγάπησεν'})];
    fake.hebrewGlossEs = [
      {
        book_id: 19,
        chapter: 136,
        verse: 1,
        position: 1,
        gloss_es: 'should-never-win',
      },
    ];

    const words = await db.getOriginalWords(19, 136, 1);
    expect(words[0].gloss_es).toBe('amó');
  });

  it('stays null when neither the pack nor the overlay has a value', async () => {
    const {db, fake} = makeDb();
    fake.originalWords = [ow({gloss_es: ''})];
    fake.hebrewGlossEs = []; // no overlay row for this occurrence

    const words = await db.getOriginalWords(19, 136, 1);
    expect(words[0].gloss_es).toBeNull();
  });

  it('keys per-occurrence: an overlay row for one position does not leak onto a different position with the same word/Strong’s', async () => {
    const {db, fake} = makeDb();
    // Two occurrences of the same Strong's (H2617, chesed) in the same verse
    // at different positions — a Strong's-keyed overlay would wrongly apply
    // to both; per-occurrence keying must only affect position 7.
    fake.originalWords = [
      ow({position: 4, gloss_es: '', strongs: 'H2617', word: 'חֶ֫סֶד'}),
      ow({position: 7, gloss_es: '', strongs: 'H2617', word: 'חַסְדּֽוֹ'}),
    ];
    fake.hebrewGlossEs = [
      {
        book_id: 19,
        chapter: 136,
        verse: 1,
        position: 7,
        gloss_es: 'misericordia',
      },
    ];

    const words = await db.getOriginalWords(19, 136, 1);
    const byPos = Object.fromEntries(words.map(w => [w.position, w.gloss_es]));
    expect(byPos[7]).toBe('misericordia');
    expect(byPos[4]).toBeNull(); // NOT "misericordia" — no per-occurrence match
  });

  it('pickGloss prefers the overlay value once it has flowed through the join, still falling back to gloss_en for a Spanish UI when absent', async () => {
    const {db, fake} = makeDb();
    fake.originalWords = [ow({gloss_es: '', gloss_en: 'give thanks'})];
    fake.hebrewGlossEs = [
      {book_id: 19, chapter: 136, verse: 1, position: 1, gloss_es: 'alabad'},
    ];

    const [word]: OriginalWord[] = await db.getOriginalWords(19, 136, 1);
    expect(pickGloss(word, 'es')).toBe('alabad');
    // gloss_en wins for an English UI here only because it happens to be
    // present — pickGloss('en') is `en || es`, so it never reaches the
    // overlay while gloss_en exists. See the next test for the case where
    // it's absent.
    expect(pickGloss(word, 'en')).toBe('give thanks');
  });

  it('a curated overlay gloss now also surfaces to an ENGLISH UI when gloss_en is absent — a real, intended behavior change from this tanda (some gloss beats none)', async () => {
    const {db, fake} = makeDb();
    fake.originalWords = [ow({gloss_es: '', gloss_en: null})];
    fake.hebrewGlossEs = [
      {book_id: 19, chapter: 136, verse: 1, position: 1, gloss_es: 'alabad'},
    ];

    const [word]: OriginalWord[] = await db.getOriginalWords(19, 136, 1);
    // Before this tanda, an English-UI reader saw null here (Hebrew rows had
    // no gloss at all). Now the curated Spanish gloss leaks through via
    // pickGloss's `en || es` fallback. Documented, not fixed — flagged in
    // the tanda report for Victor's awareness, not changed in pickGloss.
    expect(pickGloss(word, 'en')).toBe('alabad');
  });
});

// ── A3 — the per-lemma overlay (hebrew_lemma_gloss_es), 3rd COALESCE tier ────

describe('seedHebrewLemmaGlossEsIfNeeded (synthetic fixture)', () => {
  afterEach(async () => {
    await AsyncStorage.clear();
  });

  it('inserts every strongs→gloss pair with a non-empty value, skipping empty/whitespace ones', async () => {
    const {db, fake} = makeDb();
    await privateApi(db).seedHebrewLemmaGlossEsIfNeeded();

    expect(fake.hebrewLemmaGlossEs).toEqual(
      expect.arrayContaining([
        {strongs: 'H3034', gloss_es: 'alabar / dar gracias'},
        {strongs: 'H2617', gloss_es: 'misericordia / amor leal'},
        {strongs: 'H7225', gloss_es: 'principio'},
      ]),
    );
    expect(fake.hebrewLemmaGlossEs).toHaveLength(3); // H0001 '' + H0002 '   ' skipped
    expect(fake.hebrewLemmaGlossEs.some(r => r.strongs === 'H0001')).toBe(
      false,
    );
    expect(fake.hebrewLemmaGlossEs.some(r => r.strongs === 'H0002')).toBe(
      false,
    );
  });

  it('marks its own version flag done after seeding', async () => {
    const {db} = makeDb();
    await privateApi(db).seedHebrewLemmaGlossEsIfNeeded();
    expect(
      await AsyncStorage.getItem('@hebrew_lemma_gloss_es_loaded_version'),
    ).toBe('3');
  });

  it('is versioned: a second call is a no-op once the flag is set', async () => {
    const {db, fake} = makeDb();
    await privateApi(db).seedHebrewLemmaGlossEsIfNeeded();
    fake.hebrewLemmaGlossEs[0].gloss_es = 'stale-marker';
    await privateApi(db).seedHebrewLemmaGlossEsIfNeeded();
    expect(fake.hebrewLemmaGlossEs).toHaveLength(3); // not doubled
    expect(fake.hebrewLemmaGlossEs[0].gloss_es).toBe('stale-marker'); // untouched
  });

  it('re-seeds from scratch when the stored version differs (a future bump)', async () => {
    await AsyncStorage.setItem('@hebrew_lemma_gloss_es_loaded_version', '0');
    const {db, fake} = makeDb();
    await privateApi(db).seedHebrewLemmaGlossEsIfNeeded();
    expect(fake.hebrewLemmaGlossEs).toHaveLength(3);
    expect(
      await AsyncStorage.getItem('@hebrew_lemma_gloss_es_loaded_version'),
    ).toBe('3');
  });

  it('does not throw when the db op fails, and never marks itself done', async () => {
    const {db, fake} = makeDb();
    fake.withTransactionAsync = async () => {
      throw new Error('simulated failure');
    };
    await expect(
      privateApi(db).seedHebrewLemmaGlossEsIfNeeded(),
    ).resolves.not.toThrow();
    expect(
      await AsyncStorage.getItem('@hebrew_lemma_gloss_es_loaded_version'),
    ).toBeNull();
  });
});

describe('getOriginalWords — 3-tier gloss_es COALESCE (pack › per-occurrence › per-lemma)', () => {
  it('tier 3: a Hebrew word with no pack gloss and no per-occurrence row gets its per-lemma default', async () => {
    const {db, fake} = makeDb();
    fake.originalWords = [ow({gloss_es: '', strongs: 'H7225'})];
    fake.hebrewGlossEs = [];
    fake.hebrewLemmaGlossEs = [{strongs: 'H7225', gloss_es: 'principio'}];

    const [word] = await db.getOriginalWords(19, 136, 1);
    expect(word.gloss_es).toBe('principio');
    expect(pickGloss(word, 'es')).toBe('principio');
  });

  it('tier 2 beats tier 3: the 37 curated per-occurrence rows outrank the per-lemma default — Sal 136:1 pos 7 stays "misericordia suya", NOT H2617’s lemma gloss', async () => {
    const {db, fake} = makeDb();
    fake.originalWords = [
      ow({position: 4, gloss_es: '', strongs: 'H2617', word: 'חֶ֫סֶד'}),
      ow({position: 7, gloss_es: '', strongs: 'H2617', word: 'חַסְדּֽוֹ'}),
    ];
    fake.hebrewGlossEs = [
      {
        book_id: 19,
        chapter: 136,
        verse: 1,
        position: 7,
        gloss_es: 'misericordia suya',
      },
    ];
    fake.hebrewLemmaGlossEs = [
      {strongs: 'H2617', gloss_es: 'misericordia / amor leal'},
    ];

    const words = await db.getOriginalWords(19, 136, 1);
    const byPos = Object.fromEntries(words.map(w => [w.position, w.gloss_es]));
    expect(byPos[7]).toBe('misericordia suya'); // curated occurrence wins
    expect(byPos[4]).toBe('misericordia / amor leal'); // no curated row → lemma default
  });

  it('tier 1 beats tier 3: a Greek row keeps its own pack gloss_es — the lemma overlay never touches Greek (the lang guard is in the ON clause)', async () => {
    const {db, fake} = makeDb();
    fake.originalWords = [
      ow({lang: 'G', gloss_es: 'amó', strongs: 'H2617', word: 'ἠγάπησεν'}),
    ];
    fake.hebrewLemmaGlossEs = [
      {strongs: 'H2617', gloss_es: 'should-never-win'},
    ];

    const [word] = await db.getOriginalWords(19, 136, 1);
    expect(word.gloss_es).toBe('amó');
  });

  it('stays null when the Hebrew word has no lemma-overlay row (rare — a strongs outside the ~8,503 used set)', async () => {
    const {db, fake} = makeDb();
    fake.originalWords = [ow({gloss_es: '', strongs: 'H99999'})];
    fake.hebrewGlossEs = [];
    fake.hebrewLemmaGlossEs = [{strongs: 'H7225', gloss_es: 'principio'}];

    const [word] = await db.getOriginalWords(19, 136, 1);
    expect(word.gloss_es).toBeNull();
  });

  it('a NULL strongs Hebrew row (prefix / particle) never joins the lemma overlay', async () => {
    const {db, fake} = makeDb();
    fake.originalWords = [ow({gloss_es: '', strongs: null})];
    fake.hebrewLemmaGlossEs = [{strongs: 'H7225', gloss_es: 'principio'}];

    const [word] = await db.getOriginalWords(19, 136, 1);
    expect(word.gloss_es).toBeNull();
  });
});

describe('assets/hebrew-lemma-gloss-es.json — bundled A3 dataset (content sweep)', () => {
  // Bypasses the jest.mock above to read the REAL bundled asset.
  const REAL: Record<string, string> = jest.requireActual(
    '../assets/hebrew-lemma-gloss-es.json',
  );
  const keys = Object.keys(REAL);

  it('is a flat object of ~8,503 base-Strong’s entries, numerically sorted, no metadata keys', () => {
    expect(keys.length).toBeGreaterThanOrEqual(8000);
    expect(keys.length).toBeLessThanOrEqual(9000);
    for (const k of keys) expect(k).toMatch(/^H\d+$/);
    const nums = keys.map(k => Number(k.slice(1)));
    for (let i = 1; i < nums.length; i++)
      expect(nums[i]).toBeGreaterThan(nums[i - 1]);
  });

  it('every value is a non-empty, ≤40-char, markup-free Spanish gloss', () => {
    for (const v of Object.values(REAL)) {
      expect(typeof v).toBe('string');
      expect(v.trim().length).toBeGreaterThan(0);
      expect(v.length).toBeLessThanOrEqual(40);
      expect(v).not.toMatch(/[<>[\]{}*`_#|~]/); // no HTML / markdown residue
      expect(v).not.toMatch(/\bH\d{2,}\b/); // no leaked Strong's cross-ref
    }
  });

  it('covers the divine names as their RVR1960 forms (decision 2)', () => {
    expect(REAL.H3068).toBe('Jehová'); // YHWH — not "Yahvé"
    expect(REAL.H3069).toBe('Jehová');
    expect(REAL.H430).toBe('Dios'); // elohim
    expect(REAL.H136).toBe('Señor'); // adonai
  });

  it('the 8 named particles all have a gloss', () => {
    for (const s of [
      'H853',
      'H5921',
      'H413',
      'H834',
      'H3605',
      'H3588',
      'H1961',
      'H559',
    ]) {
      expect(REAL[s]?.trim().length).toBeGreaterThan(0);
    }
  });
});
