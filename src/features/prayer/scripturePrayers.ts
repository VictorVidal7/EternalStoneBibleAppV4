/**
 * 🙏 scripturePrayers — "Orar la Escritura" (praying through a passage).
 *
 * A curated set of prayers ALREADY RECORDED in Scripture — the Lord's own
 * model prayer, apostolic intercessions, and psalms the Bible itself titles
 * "a prayer" — walked one verse at a time, with room to make it your own.
 * These are examples to learn FROM, not a formula: see `t.scripturePrayer.
 * disclaimer`, always shown before a passage starts.
 *
 * Deliberately conservative: every passage here is a prayer the text itself
 * records (not merely a "prayerful-sounding" passage picked by us), and a
 * few candidates were excluded after review because they don't transfer
 * cleanly to a New-Testament believer's own voice — John 17 (much of it is
 * Christ speaking of His unique pre-incarnate glory and finished work),
 * Psalm 143 (its closing verse asks God to destroy enemies, in tension with
 * Christ's command to pray FOR enemies), and Solomon's temple-dedication
 * prayer (1 Kings 8, bound to the old-covenant temple system). A handful of
 * the passages that DID make the cut narrate a unique historical moment
 * (Gethsemane, the three NT canticles, Daniel's exilic confession) — those
 * carry a `context` note in i18n explaining how the church has understood
 * praying them, without prescribing any wording.
 *
 * PURE (no React/RN, no DB): the screen resolves each verse's text from
 * SQLite and renders the i18n prose.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

/** A canonical "EnglishBook/Chapter/Verse" reference key (same form as [[messianicProphecies]]). */
export type PrayerRefKey = string;

export type ScripturePrayerCategory =
  | 'jesus'
  | 'canticles'
  | 'paul'
  | 'psalms'
  | 'ot';

export const SCRIPTURE_PRAYER_CATEGORY_ORDER: readonly ScripturePrayerCategory[] =
  ['jesus', 'canticles', 'paul', 'psalms', 'ot'];

export interface ScripturePrayerPassage {
  /** Stable slug — also the i18n key `t.scripturePrayer.passages[id]`. */
  id: string;
  category: ScripturePrayerCategory;
  /** Every verse of the passage, in order — walked one at a time. */
  refs: readonly PrayerRefKey[];
}

/** Every verse from `start` to `end` of one book/chapter, in order. */
function range(
  book: string,
  chapter: number,
  start: number,
  end: number,
): PrayerRefKey[] {
  const out: PrayerRefKey[] = [];
  for (let verse = start; verse <= end; verse++) {
    out.push(`${book}/${chapter}/${verse}`);
  }
  return out;
}

/**
 * Every passage. Each ref was verified to resolve to a real verse in
 * `assets/bible-seed.db` before this file was written.
 */
export const SCRIPTURE_PRAYERS: readonly ScripturePrayerPassage[] = [
  // ── Oraciones de Jesús ──
  {id: 'lords-prayer', category: 'jesus', refs: range('Matthew', 6, 9, 13)},
  {id: 'gethsemane', category: 'jesus', refs: range('Matthew', 26, 39, 44)},

  // ── Cánticos del Nuevo Testamento ──
  {id: 'magnificat', category: 'canticles', refs: range('Luke', 1, 46, 55)},
  {id: 'benedictus', category: 'canticles', refs: range('Luke', 1, 67, 79)},
  {
    id: 'nunc-dimittis',
    category: 'canticles',
    refs: range('Luke', 2, 29, 32),
  },

  // ── Oraciones de Pablo por las iglesias ──
  {
    id: 'ephesians-prayer',
    category: 'paul',
    refs: range('Ephesians', 3, 14, 21),
  },
  {
    id: 'colossians-prayer',
    category: 'paul',
    refs: range('Colossians', 1, 9, 12),
  },
  {
    id: 'philippians-prayer',
    category: 'paul',
    refs: range('Philippians', 1, 9, 11),
  },
  {
    id: 'thessalonians-prayer',
    category: 'paul',
    refs: range('1 Thessalonians', 3, 11, 13),
  },

  // ── Salmos que la Escritura misma titula "oración" ──
  {id: 'psalm-51', category: 'psalms', refs: range('Psalms', 51, 1, 19)},
  {id: 'psalm-86', category: 'psalms', refs: range('Psalms', 86, 1, 17)},
  {id: 'psalm-90', category: 'psalms', refs: range('Psalms', 90, 1, 17)},
  {id: 'psalm-102', category: 'psalms', refs: range('Psalms', 102, 1, 28)},
  {id: 'psalm-142', category: 'psalms', refs: range('Psalms', 142, 1, 7)},

  // ── Otras oraciones del Antiguo Testamento ──
  {
    id: 'nehemiah-prayer',
    category: 'ot',
    refs: range('Nehemiah', 1, 5, 11),
  },
  {id: 'daniel-prayer', category: 'ot', refs: range('Daniel', 9, 4, 19)},
  {id: 'jonah-prayer', category: 'ot', refs: range('Jonah', 2, 1, 9)},
];

/** All passages in one category, in catalog order. */
export function getScripturePrayersByCategory(
  category: ScripturePrayerCategory,
): ScripturePrayerPassage[] {
  return SCRIPTURE_PRAYERS.filter(p => p.category === category);
}

/** A single passage by id, or undefined if the id is unknown. */
export function getScripturePrayerById(
  id: string,
): ScripturePrayerPassage | undefined {
  return SCRIPTURE_PRAYERS.find(p => p.id === id);
}
