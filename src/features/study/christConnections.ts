/**
 * ✝️ christConnections — "Cristo en este pasaje" insight catalog (Sprint 97).
 *
 * The whole of Scripture testifies of the Lord Jesus: "comenzando desde Moisés,
 * y siguiendo por todos los profetas, les declaraba en todas las Escrituras lo
 * que de él decían" (Lucas 24:27; cf. 24:44, Juan 5:39). This catalog adds a
 * brief, faithful note to key passages showing how each one points to, reveals
 * or is fulfilled in Christ — so the reader grows "en la gracia y el
 * conocimiento de nuestro Señor y Salvador Jesucristo" (2 Pedro 3:18).
 *
 * PURE (no React/RN, no DB): each entry carries a stable `id` (also the i18n
 * key under `t.christConnections.notes[id]`), a canonical
 * "EnglishBook/Chapter/Verse" `ref` for the focus verse, and an OPTIONAL
 * `fulfillment` ref (a New-Testament passage that names the connection) which
 * the screen renders as a localized "→ Book C:V" pointer. The note prose lives
 * in i18n (es/en parity enforced by i18nParity.test), so a language switch never
 * breaks it and the data file stays a clean index.
 *
 * Both `ref` and `fulfillment` are validated against the canonical book table
 * (nameEn) + chapter range by the accompanying test, so a typo fails CI rather
 * than shipping a dead row — the same guard themes.ts / studyConnections use.
 * Notes are kept deliberately conservative: only broadly-held prophetic,
 * typological or plainly christological readings, never speculation.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import {getBookById, getBookByName, BIBLE_VERSIONS} from '@/constants/bible';

/** A canonical "EnglishBook/Chapter/Verse" reference key. */
export type ChristRefKey = string;

export interface ChristConnection {
  /** Stable slug — also the i18n key `t.christConnections.notes[id]`. */
  id: string;
  /** Canonical "EnglishBook/Chapter/Verse" reference of the focus verse. */
  ref: ChristRefKey;
  /** Optional NT passage that names the connection, shown as "→ Book C:V". */
  fulfillment?: ChristRefKey;
}

/**
 * The curated catalog. Refs use canonical English book names so the lookup is
 * language-independent (the reader's verse arrives as a numeric book id, which
 * we resolve to its English name before looking up here).
 */
export const CHRIST_CONNECTIONS: readonly ChristConnection[] = [
  // ── Old Testament: shadows that point forward to Christ ──
  {id: 'genesis-1-1', ref: 'Genesis/1/1', fulfillment: 'John/1/3'},
  {id: 'exodus-15-2', ref: 'Exodus/15/2', fulfillment: 'Matthew/1/21'},
  {id: 'numbers-6-24', ref: 'Numbers/6/24', fulfillment: 'John/1/16'},
  {id: 'psalms-23-1', ref: 'Psalms/23/1', fulfillment: 'John/10/11'},
  {id: 'psalms-34-18', ref: 'Psalms/34/18', fulfillment: 'Matthew/11/28'},
  {id: 'isaiah-9-6', ref: 'Isaiah/9/6', fulfillment: 'Luke/2/11'},
  {id: 'isaiah-12-2', ref: 'Isaiah/12/2', fulfillment: 'Matthew/1/21'},
  {id: 'isaiah-40-31', ref: 'Isaiah/40/31', fulfillment: 'Matthew/11/28'},
  {id: 'isaiah-53-5', ref: 'Isaiah/53/5', fulfillment: '1 Peter/2/24'},
  {id: 'lamentations-3-22', ref: 'Lamentations/3/22', fulfillment: 'John/1/17'},
  {
    id: 'lamentations-3-23',
    ref: 'Lamentations/3/23',
    fulfillment: 'Hebrews/13/8',
  },
  {id: 'micah-6-8', ref: 'Micah/6/8', fulfillment: 'Matthew/9/13'},
  {id: 'isaiah-41-10', ref: 'Isaiah/41/10', fulfillment: 'Matthew/28/20'},
  {id: 'jeremiah-29-11', ref: 'Jeremiah/29/11', fulfillment: '1 Peter/1/3'},
  {id: 'psalms-51-10', ref: 'Psalms/51/10', fulfillment: 'Hebrews/10/22'},
  {id: 'job-19-25', ref: 'Job/19/25', fulfillment: 'John/11/25'},
  {id: 'psalms-16-11', ref: 'Psalms/16/11', fulfillment: 'Acts/2/28'},
  {id: 'psalms-27-1', ref: 'Psalms/27/1', fulfillment: 'John/8/12'},
  {id: 'psalms-34-8', ref: 'Psalms/34/8', fulfillment: '1 Peter/2/3'},
  {id: 'proverbs-18-10', ref: 'Proverbs/18/10', fulfillment: 'Acts/4/12'},
  {id: 'isaiah-26-3', ref: 'Isaiah/26/3', fulfillment: 'John/14/27'},
  {id: 'isaiah-43-2', ref: 'Isaiah/43/2', fulfillment: 'Matthew/28/20'},
  {id: 'zephaniah-3-17', ref: 'Zephaniah/3/17', fulfillment: 'Matthew/1/23'},

  // ── New Testament: passages that reveal who Christ is and what He did ──
  {id: 'matthew-11-28', ref: 'Matthew/11/28'},
  {id: 'matthew-28-6', ref: 'Matthew/28/6'},
  {id: 'matthew-28-19', ref: 'Matthew/28/19'},
  {id: 'matthew-28-20', ref: 'Matthew/28/20'},
  {id: 'luke-1-37', ref: 'Luke/1/37'},
  {id: 'luke-19-10', ref: 'Luke/19/10'},
  {id: 'john-1-1', ref: 'John/1/1'},
  {id: 'john-1-14', ref: 'John/1/14'},
  {id: 'john-3-16', ref: 'John/3/16'},
  {id: 'john-6-35', ref: 'John/6/35'},
  {id: 'john-8-12', ref: 'John/8/12'},
  {id: 'john-10-10', ref: 'John/10/10'},
  {id: 'john-10-11', ref: 'John/10/11'},
  {id: 'john-11-25', ref: 'John/11/25'},
  {id: 'john-13-34', ref: 'John/13/34'},
  {id: 'john-14-1', ref: 'John/14/1'},
  {id: 'john-14-6', ref: 'John/14/6'},
  {id: 'john-14-27', ref: 'John/14/27'},
  {id: 'john-15-5', ref: 'John/15/5'},
  {id: 'john-16-33', ref: 'John/16/33'},
  {id: 'acts-4-12', ref: 'Acts/4/12'},
  {id: 'acts-16-31', ref: 'Acts/16/31'},
  {id: 'romans-5-1', ref: 'Romans/5/1'},
  {id: 'romans-5-8', ref: 'Romans/5/8'},
  {id: 'romans-6-23', ref: 'Romans/6/23'},
  {id: 'romans-8-1', ref: 'Romans/8/1'},
  {id: 'romans-8-28', ref: 'Romans/8/28'},
  {id: 'romans-8-32', ref: 'Romans/8/32'},
  {id: 'romans-10-9', ref: 'Romans/10/9'},
  {id: '2corinthians-5-17', ref: '2 Corinthians/5/17'},
  {id: '2corinthians-5-21', ref: '2 Corinthians/5/21'},
  {id: 'galatians-2-20', ref: 'Galatians/2/20'},
  {id: 'galatians-6-14', ref: 'Galatians/6/14'},
  {id: 'ephesians-1-7', ref: 'Ephesians/1/7'},
  {id: 'ephesians-2-8', ref: 'Ephesians/2/8'},
  {id: 'philippians-2-9', ref: 'Philippians/2/9'},
  {id: 'philippians-4-13', ref: 'Philippians/4/13'},
  {id: 'philippians-4-19', ref: 'Philippians/4/19'},
  {id: 'colossians-1-16', ref: 'Colossians/1/16'},
  {id: '1timothy-1-15', ref: '1 Timothy/1/15'},
  {id: 'titus-2-11', ref: 'Titus/2/11'},
  {id: 'hebrews-7-25', ref: 'Hebrews/7/25'},
  {id: 'hebrews-12-2', ref: 'Hebrews/12/2'},
  {id: 'hebrews-13-8', ref: 'Hebrews/13/8'},
  {id: '1peter-1-3', ref: '1 Peter/1/3'},
  {id: '1peter-2-24', ref: '1 Peter/2/24'},
  {id: '2peter-3-9', ref: '2 Peter/3/9'},
  {id: '2peter-3-18', ref: '2 Peter/3/18'},
  {id: '1john-1-9', ref: '1 John/1/9'},
  {id: '1john-4-7', ref: '1 John/4/7', fulfillment: '1 John/4/9'},
  {id: '1john-4-10', ref: '1 John/4/10'},
  {id: '1john-4-19', ref: '1 John/4/19'},
  {id: 'jude-1-24', ref: 'Jude/1/24'},
  {id: 'revelation-1-8', ref: 'Revelation/1/8'},
  {id: 'revelation-3-20', ref: 'Revelation/3/20'},
  {id: 'revelation-21-4', ref: 'Revelation/21/4'},
  {id: 'revelation-21-5', ref: 'Revelation/21/5'},

  // ── Sprint 100: broader coverage so the card surfaces on ~3 of 5 days ──
  // OT promises and shadows fulfilled in Christ (refs DB-verified RVR1960+KJV).
  {id: 'exodus-14-14', ref: 'Exodus/14/14', fulfillment: 'Colossians/2/15'},
  {
    id: 'deuteronomy-31-6',
    ref: 'Deuteronomy/31/6',
    fulfillment: 'Hebrews/13/5',
  },
  {id: 'joshua-1-9', ref: 'Joshua/1/9', fulfillment: 'Matthew/28/20'},
  {id: '1samuel-16-7', ref: '1 Samuel/16/7', fulfillment: 'John/2/25'},
  {id: 'psalms-18-2', ref: 'Psalms/18/2', fulfillment: '1 Corinthians/10/4'},
  {id: 'psalms-19-1', ref: 'Psalms/19/1', fulfillment: 'Colossians/1/16'},
  {id: 'psalms-28-7', ref: 'Psalms/28/7', fulfillment: 'Philippians/4/13'},
  {id: 'psalms-46-1', ref: 'Psalms/46/1', fulfillment: 'Matthew/11/28'},
  {id: 'psalms-46-10', ref: 'Psalms/46/10', fulfillment: 'Mark/4/39'},
  {id: 'psalms-55-22', ref: 'Psalms/55/22', fulfillment: '1 Peter/5/7'},
  {id: 'psalms-103-2', ref: 'Psalms/103/2', fulfillment: 'Ephesians/1/7'},
  {id: 'psalms-118-24', ref: 'Psalms/118/24', fulfillment: 'Matthew/21/42'},
  {id: 'psalms-119-105', ref: 'Psalms/119/105', fulfillment: 'John/1/1'},
  {id: 'psalms-147-3', ref: 'Psalms/147/3', fulfillment: 'Luke/4/18'},
  {id: 'proverbs-3-5', ref: 'Proverbs/3/5', fulfillment: 'John/14/6'},
  {id: 'isaiah-64-8', ref: 'Isaiah/64/8', fulfillment: '2 Corinthians/5/17'},
  {id: 'jeremiah-33-3', ref: 'Jeremiah/33/3', fulfillment: 'John/14/13'},
  {id: 'nahum-1-7', ref: 'Nahum/1/7', fulfillment: 'John/16/33'},

  // NT passages that reveal who Christ is and what He has done.
  {id: 'matthew-5-14', ref: 'Matthew/5/14', fulfillment: 'John/8/12'},
  {id: 'matthew-6-33', ref: 'Matthew/6/33'},
  {id: 'matthew-19-26', ref: 'Matthew/19/26'},
  {id: 'matthew-22-37', ref: 'Matthew/22/37'},
  {id: 'mark-10-27', ref: 'Mark/10/27'},
  {id: 'luke-6-31', ref: 'Luke/6/31'},
  {id: 'acts-1-8', ref: 'Acts/1/8'},
  {id: 'romans-8-31', ref: 'Romans/8/31'},
  {id: 'romans-8-38', ref: 'Romans/8/38'},
  {id: 'romans-12-2', ref: 'Romans/12/2'},
  {id: 'romans-15-13', ref: 'Romans/15/13'},
  {id: '1corinthians-10-13', ref: '1 Corinthians/10/13'},
  {id: '1corinthians-13-13', ref: '1 Corinthians/13/13'},
  {id: '2corinthians-4-16', ref: '2 Corinthians/4/16'},
  {id: '2corinthians-12-9', ref: '2 Corinthians/12/9'},
  {id: 'galatians-5-22', ref: 'Galatians/5/22'},
  {id: 'ephesians-3-20', ref: 'Ephesians/3/20'},
  {id: 'ephesians-4-32', ref: 'Ephesians/4/32'},
  {id: 'ephesians-6-10', ref: 'Ephesians/6/10'},
  {id: 'philippians-1-6', ref: 'Philippians/1/6', fulfillment: 'Hebrews/12/2'},
  {id: 'hebrews-4-12', ref: 'Hebrews/4/12'},
  {id: 'james-1-5', ref: 'James/1/5', fulfillment: '1 Corinthians/1/30'},
  {id: '1john-3-1', ref: '1 John/3/1', fulfillment: '1 John/4/9'},
  {id: '1john-4-8', ref: '1 John/4/8', fulfillment: '1 John/4/9'},

  // ── Sprint 101: +36 daily-verse connections (coverage 62% → ~80%) ──────
  {
    id: 'deuteronomy-31-8',
    ref: 'Deuteronomy/31/8',
    fulfillment: 'Hebrews/13/5',
  },
  {id: 'nehemiah-8-10', ref: 'Nehemiah/8/10', fulfillment: 'John/15/11'},
  {id: 'psalms-30-5', ref: 'Psalms/30/5', fulfillment: 'John/16/22'},
  {id: 'psalms-94-19', ref: 'Psalms/94/19', fulfillment: 'Luke/2/25'},
  {id: 'psalms-139-14', ref: 'Psalms/139/14', fulfillment: 'Colossians/1/16'},
  {id: 'psalms-145-18', ref: 'Psalms/145/18', fulfillment: 'Romans/10/13'},
  {id: 'proverbs-3-6', ref: 'Proverbs/3/6', fulfillment: '1 Corinthians/1/30'},
  {
    id: 'ecclesiastes-3-1',
    ref: 'Ecclesiastes/3/1',
    fulfillment: 'Galatians/4/4',
  },
  {id: 'isaiah-55-8', ref: 'Isaiah/55/8', fulfillment: '1 Corinthians/1/24'},
  {id: 'habakkuk-3-19', ref: 'Habakkuk/3/19', fulfillment: 'Philippians/4/13'},
  {id: 'matthew-5-16', ref: 'Matthew/5/16', fulfillment: 'John/8/12'},
  {id: 'matthew-7-7', ref: 'Matthew/7/7', fulfillment: 'John/16/24'},
  {id: 'romans-12-12', ref: 'Romans/12/12', fulfillment: 'Colossians/1/27'},
  {
    id: '1corinthians-13-4',
    ref: '1 Corinthians/13/4',
    fulfillment: '1 John/3/16',
  },
  {
    id: '1corinthians-15-58',
    ref: '1 Corinthians/15/58',
    fulfillment: '1 Corinthians/15/20',
  },
  {
    id: '2corinthians-5-7',
    ref: '2 Corinthians/5/7',
    fulfillment: 'Hebrews/12/2',
  },
  {
    id: '2corinthians-9-7',
    ref: '2 Corinthians/9/7',
    fulfillment: '2 Corinthians/9/15',
  },
  {id: 'galatians-6-9', ref: 'Galatians/6/9', fulfillment: 'Hebrews/12/2'},
  {
    id: 'philippians-4-6',
    ref: 'Philippians/4/6',
    fulfillment: 'Philippians/4/7',
  },
  {
    id: 'philippians-4-7',
    ref: 'Philippians/4/7',
    fulfillment: 'Ephesians/2/14',
  },
  {id: 'colossians-3-2', ref: 'Colossians/3/2', fulfillment: 'Colossians/3/1'},
  {id: 'colossians-3-15', ref: 'Colossians/3/15'},
  {
    id: 'colossians-3-23',
    ref: 'Colossians/3/23',
    fulfillment: 'Colossians/3/24',
  },
  {id: '2timothy-3-16', ref: '2 Timothy/3/16', fulfillment: 'John/5/39'},
  {id: 'hebrews-11-1', ref: 'Hebrews/11/1', fulfillment: 'Hebrews/12/2'},
  {id: 'hebrews-11-6', ref: 'Hebrews/11/6', fulfillment: 'John/14/6'},
  {id: 'hebrews-12-1', ref: 'Hebrews/12/1', fulfillment: 'Hebrews/12/2'},
  {id: 'hebrews-13-5', ref: 'Hebrews/13/5', fulfillment: 'Matthew/28/20'},
  {id: 'james-1-12', ref: 'James/1/12', fulfillment: 'Revelation/2/10'},
  {id: 'james-1-17', ref: 'James/1/17', fulfillment: 'John/3/16'},
  {id: 'james-4-8', ref: 'James/4/8', fulfillment: 'Hebrews/10/22'},
  {id: '1peter-4-8', ref: '1 Peter/4/8', fulfillment: '1 Peter/2/24'},
  {id: '1peter-5-6', ref: '1 Peter/5/6', fulfillment: 'Philippians/2/8'},
  {id: '1peter-5-7', ref: '1 Peter/5/7', fulfillment: 'Matthew/11/28'},
  {id: '1john-4-18', ref: '1 John/4/18', fulfillment: '1 John/4/10'},
  {id: '1john-5-14', ref: '1 John/5/14', fulfillment: 'Hebrews/7/25'},

  // ── Sprint 103: +24 daily-verse connections (coverage ~80% → ~92%) ──────
  {id: 'joshua-24-15', ref: 'Joshua/24/15', fulfillment: 'Colossians/3/24'},
  {
    id: '1chronicles-16-11',
    ref: '1 Chronicles/16/11',
    fulfillment: '2 Corinthians/4/6',
  },
  {id: '2chronicles-7-14', ref: '2 Chronicles/7/14', fulfillment: '1 John/1/9'},
  {id: 'psalms-1-1', ref: 'Psalms/1/1', fulfillment: '2 Corinthians/5/21'},
  {id: 'psalms-32-8', ref: 'Psalms/32/8', fulfillment: 'John/14/6'},
  {id: 'psalms-37-4', ref: 'Psalms/37/4', fulfillment: 'Philippians/3/8'},
  {id: 'psalms-42-11', ref: 'Psalms/42/11', fulfillment: 'Matthew/11/28'},
  {id: 'psalms-56-3', ref: 'Psalms/56/3', fulfillment: 'John/14/27'},
  {id: 'psalms-62-1', ref: 'Psalms/62/1', fulfillment: 'Acts/4/12'},
  {id: 'psalms-73-26', ref: 'Psalms/73/26', fulfillment: 'John/11/25'},
  {id: 'psalms-90-12', ref: 'Psalms/90/12', fulfillment: '1 Corinthians/1/30'},
  {id: 'psalms-91-1', ref: 'Psalms/91/1', fulfillment: 'Colossians/3/3'},
  {id: 'psalms-100-4', ref: 'Psalms/100/4', fulfillment: 'Ephesians/2/18'},
  {id: 'psalms-121-2', ref: 'Psalms/121/2', fulfillment: 'Colossians/1/16'},
  {id: 'proverbs-15-1', ref: 'Proverbs/15/1', fulfillment: 'Matthew/11/29'},
  {id: 'proverbs-17-17', ref: 'Proverbs/17/17', fulfillment: 'John/15/13'},
  {id: 'matthew-6-34', ref: 'Matthew/6/34', fulfillment: '1 Peter/5/7'},
  {id: 'mark-11-24', ref: 'Mark/11/24', fulfillment: 'John/14/13'},
  {id: 'mark-12-30', ref: 'Mark/12/30', fulfillment: '1 John/4/19'},
  {id: 'philippians-4-8', ref: 'Philippians/4/8', fulfillment: 'Hebrews/12/2'},
  {
    id: '1thessalonians-5-17',
    ref: '1 Thessalonians/5/17',
    fulfillment: 'Hebrews/7/25',
  },
  {id: '2timothy-1-7', ref: '2 Timothy/1/7', fulfillment: 'Romans/8/15'},
  {id: 'james-4-7', ref: 'James/4/7', fulfillment: '1 John/3/8'},
  {id: '1peter-3-15', ref: '1 Peter/3/15', fulfillment: 'Colossians/1/27'},

  // ── Sprint 104: +16 final daily-verse connections (coverage ~92% → 99%) ──
  {id: 'psalms-91-2', ref: 'Psalms/91/2', fulfillment: 'Hebrews/6/18'},
  {id: 'psalms-103-1', ref: 'Psalms/103/1', fulfillment: 'Philippians/2/9'},
  {id: 'psalms-121-1', ref: 'Psalms/121/1', fulfillment: 'Hebrews/13/6'},
  {id: 'psalms-143-8', ref: 'Psalms/143/8', fulfillment: 'Romans/5/8'},
  {id: 'proverbs-4-23', ref: 'Proverbs/4/23', fulfillment: 'John/7/38'},
  {id: 'proverbs-16-3', ref: 'Proverbs/16/3', fulfillment: 'Philippians/1/6'},
  {id: 'proverbs-22-6', ref: 'Proverbs/22/6', fulfillment: 'Ephesians/6/4'},
  {id: 'proverbs-27-17', ref: 'Proverbs/27/17', fulfillment: 'Ephesians/4/15'},
  {
    id: 'proverbs-31-25',
    ref: 'Proverbs/31/25',
    fulfillment: 'Philippians/4/13',
  },
  {id: 'matthew-6-21', ref: 'Matthew/6/21', fulfillment: 'Colossians/3/1'},
  {
    id: '1corinthians-16-14',
    ref: '1 Corinthians/16/14',
    fulfillment: 'John/13/34',
  },
  {
    id: '1thessalonians-5-16',
    ref: '1 Thessalonians/5/16',
    fulfillment: 'John/15/11',
  },
  {
    id: '1thessalonians-5-18',
    ref: '1 Thessalonians/5/18',
    fulfillment: 'Colossians/3/17',
  },
  {id: '1timothy-4-12', ref: '1 Timothy/4/12', fulfillment: '1 Peter/2/21'},
  {
    id: 'hebrews-10-23',
    ref: 'Hebrews/10/23',
    fulfillment: '2 Corinthians/1/20',
  },
  {id: 'james-1-2', ref: 'James/1/2', fulfillment: '1 Peter/1/6'},
];

/**
 * The language the "Christ in this passage" card should speak (Sprint 98). The
 * card sits right beside Scripture shown in the SELECTED Bible version, so its
 * note + labels follow that version's language (RVR1960 → 'es', KJV/WEB →
 * 'en') — keeping the whole card coherent even when the app's interface
 * language differs from the Bible version. Falls back to 'en' for an unknown id.
 */
export function christLangForVersion(
  versionId: string | null | undefined,
): 'es' | 'en' {
  const v = BIBLE_VERSIONS.find(x => x.id === versionId);
  return v?.language === 'es' ? 'es' : 'en';
}

/**
 * Like {@link christLangForVersion}, but for callers where a missing/
 * unrecognized version id must NOT silently default to English. That default
 * is fine for the "Christ in this passage" card (English is a safe neutral
 * fallback when we truly don't know the version), but it's the wrong choice
 * for book-name localization in a Spanish-first app: an unmatched `versionId`
 * (empty param, stale deep link) would otherwise render English book names
 * even for a Spanish-reading user. Falls back to `uiLanguage` — the app's own
 * interface language — instead of a hard 'en' when the version id isn't a
 * known {@link BIBLE_VERSIONS} entry. This is what the word-study screen's
 * "Última aparición" field should use (it was found showing an English book
 * name, e.g. "Isaiah" instead of "Isaías", when reached with no/unknown
 * version id — not an isolated bug in that one field, but this shared
 * fallback silently resolving to English for the WHOLE screen).
 */
export function bookLangForVersion(
  versionId: string | null | undefined,
  uiLanguage: 'es' | 'en',
): 'es' | 'en' {
  const known = BIBLE_VERSIONS.some(v => v.id === versionId);
  return known ? christLangForVersion(versionId) : uiLanguage;
}

/** The display abbreviation for a Bible version id, or '' if unknown. */
export function versionAbbrev(versionId: string | null | undefined): string {
  return BIBLE_VERSIONS.find(x => x.id === versionId)?.abbreviation ?? '';
}

/** Parse a "Book/Chapter/Verse" key into its parts, or null if malformed. */
export function parseChristRef(key: ChristRefKey): {
  book: string;
  chapter: number;
  verse: number;
} | null {
  if (typeof key !== 'string') return null;
  const firstSlash = key.indexOf('/');
  const lastSlash = key.lastIndexOf('/');
  if (firstSlash < 0 || lastSlash === firstSlash) return null;
  const book = key.slice(0, firstSlash).trim();
  const chapter = Number(key.slice(firstSlash + 1, lastSlash));
  const verse = Number(key.slice(lastSlash + 1));
  if (!book || !Number.isInteger(chapter) || !Number.isInteger(verse)) {
    return null;
  }
  if (chapter < 1 || verse < 1) return null;
  return {book, chapter, verse};
}

// Lookup map built once, keyed by the canonical English ref.
const BY_REF: ReadonlyMap<ChristRefKey, ChristConnection> = new Map(
  CHRIST_CONNECTIONS.map(c => [c.ref, c]),
);

/**
 * The Christ-connection for a verse identified by its numeric book id (1-66) +
 * chapter + verse, or null if none is curated. The book id is resolved to its
 * canonical English name so the lookup matches the stored refs.
 */
export function getChristConnectionById(
  bookId: number,
  chapter: number,
  verse: number,
): ChristConnection | null {
  const book = getBookById(bookId);
  if (!book) return null;
  return BY_REF.get(`${book.nameEn}/${chapter}/${verse}`) ?? null;
}

/**
 * Format a canonical ref key into a display label in the given language,
 * e.g. "Génesis 3:15" (es) / "Genesis 3:15" (en). Falls back to the raw key.
 */
export function formatChristRefLabel(
  key: ChristRefKey,
  language: 'es' | 'en',
): string {
  const parsed = parseChristRef(key);
  if (!parsed) return key;
  const book = getBookByName(parsed.book);
  if (!book) return key;
  const name = language === 'es' ? book.name : book.nameEn;
  return `${name} ${parsed.chapter}:${parsed.verse}`;
}
