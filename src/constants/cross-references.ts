/**
 * Curated cross-references for popular Bible verses.
 *
 * Keys are canonical "EnglishBookName/Chapter/Verse" strings; values are
 * arrays of references in the same format. The English name is the
 * lookup canonical so language switches don't break the index — the
 * `getCrossReferences` helper normalises any incoming book name through
 * `getBookByName(...).nameEn` before looking it up.
 *
 * Each verse below carries 2-5 parallels, chosen for theological clarity
 * over exhaustiveness. References are accepted by `parseReference` from
 * `src/lib/references/parseReference.ts` (Sprint 17), so chip-tap can
 * deep-link straight into the reader.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import {getBookByName} from './bible';

export const CROSS_REFERENCES: Record<string, string[]> = {
  // ── Old Testament ──────────────────────────────────────────────────
  'Genesis/1/1': ['John/1/1', 'Hebrews/11/3', 'Colossians/1/16', 'Psalms/33/6'],
  'Genesis/1/27': ['Genesis/5/1', 'Matthew/19/4', 'James/3/9'],
  'Genesis/3/15': [
    'Romans/16/20',
    'Galatians/4/4',
    'Revelation/12/9',
    '1 John/3/8',
  ],
  'Genesis/12/3': ['Galatians/3/8', 'Acts/3/25', 'Romans/4/13'],
  'Genesis/50/20': ['Romans/8/28', 'Psalms/76/10'],

  'Exodus/3/14': ['John/8/58', 'Revelation/1/8', 'John/8/24'],
  'Exodus/20/3': ['Deuteronomy/6/4', 'Matthew/22/37', '1 Corinthians/8/4'],
  'Exodus/20/12': ['Ephesians/6/2', 'Matthew/15/4'],

  'Leviticus/19/18': ['Matthew/22/39', 'Romans/13/9', 'Galatians/5/14'],
  'Numbers/6/24': ['Psalms/121/7', '2 Thessalonians/3/16'],

  'Deuteronomy/6/4': ['Mark/12/29', 'Galatians/3/20'],
  'Deuteronomy/6/5': ['Matthew/22/37', 'Mark/12/30', 'Luke/10/27'],
  'Deuteronomy/31/6': ['Hebrews/13/5', 'Joshua/1/9'],

  'Joshua/1/9': ['Deuteronomy/31/6', 'Hebrews/13/5', 'Isaiah/41/10'],

  '1 Samuel/16/7': ['Luke/16/15', '1 Chronicles/28/9', 'Jeremiah/17/10'],

  '1 Kings/8/27': ['Acts/7/49', 'Isaiah/66/1'],

  'Job/19/25': ['1 Corinthians/15/20', '1 Thessalonians/4/16'],

  // ── Psalms ─────────────────────────────────────────────────────────
  'Psalms/1/1': ['Jeremiah/17/7', 'Proverbs/4/14'],
  'Psalms/19/1': ['Romans/1/20', 'Isaiah/40/26'],
  'Psalms/23/1': [
    'Isaiah/40/11',
    'John/10/11',
    'Ezekiel/34/23',
    '1 Peter/2/25',
  ],
  'Psalms/23/4': ['2 Timothy/4/7', 'Job/19/25', 'Isaiah/43/2'],
  'Psalms/27/1': ['Isaiah/12/2', 'John/8/12'],
  'Psalms/34/8': ['1 Peter/2/3', 'Hebrews/6/5'],
  'Psalms/37/4': ['Matthew/6/33', 'Isaiah/58/14'],
  'Psalms/46/1': ['Isaiah/41/10', '2 Corinthians/12/9'],
  'Psalms/46/10': ['Isaiah/30/15', 'Exodus/14/14'],
  'Psalms/51/10': ['Ezekiel/36/26', 'Acts/15/9'],
  'Psalms/91/1': ['Psalms/27/5', 'Proverbs/18/10'],
  'Psalms/119/11': ['Deuteronomy/6/6', 'Colossians/3/16'],
  'Psalms/119/105': ['Proverbs/6/23', '2 Peter/1/19'],
  'Psalms/139/14': ['Genesis/1/27', 'Ephesians/2/10'],

  // ── Proverbs ───────────────────────────────────────────────────────
  'Proverbs/3/5': ['Isaiah/55/8', 'Jeremiah/17/7', 'Psalms/37/5'],
  'Proverbs/3/6': ['Matthew/6/33', 'James/1/5'],
  'Proverbs/16/3': ['Psalms/37/5', 'Philippians/4/6'],
  'Proverbs/22/6': ['Ephesians/6/4', 'Deuteronomy/6/7'],
  'Proverbs/27/17': ['Hebrews/10/24', 'Ecclesiastes/4/9'],

  'Ecclesiastes/3/1': ['Romans/8/28', 'Galatians/4/4'],

  // ── Isaiah ─────────────────────────────────────────────────────────
  'Isaiah/9/6': ['Luke/2/11', 'Matthew/1/23', 'John/1/14'],
  'Isaiah/26/3': ['Philippians/4/7', 'John/14/27'],
  'Isaiah/40/31': ['2 Corinthians/4/16', 'Psalms/103/5'],
  'Isaiah/41/10': ['Deuteronomy/31/6', 'Hebrews/13/5', 'Joshua/1/9'],
  'Isaiah/53/5': ['1 Peter/2/24', 'Matthew/8/17', 'Romans/4/25'],
  'Isaiah/55/8': ['Romans/11/33', 'Job/38/4'],

  'Jeremiah/29/11': ['Romans/8/28', 'Proverbs/23/18', 'Psalms/40/5'],
  'Jeremiah/33/3': ['Matthew/7/7', 'James/1/5'],

  'Lamentations/3/22': ['Psalms/103/8', '2 Peter/3/9'],

  'Ezekiel/36/26': ['2 Corinthians/5/17', 'Psalms/51/10'],

  // ── Gospels ────────────────────────────────────────────────────────
  'Matthew/5/3': ['Luke/6/20', 'Isaiah/57/15'],
  'Matthew/5/14': ['John/8/12', 'Philippians/2/15'],
  'Matthew/6/9': ['Luke/11/2', 'Isaiah/64/8'],
  'Matthew/6/33': ['Luke/12/31', 'Proverbs/3/6', 'Psalms/37/4'],
  'Matthew/7/7': ['Luke/11/9', 'James/1/5', 'Jeremiah/33/3'],
  'Matthew/11/28': ['Isaiah/55/1', 'Jeremiah/31/25', 'John/7/37'],
  'Matthew/16/24': ['Luke/9/23', 'Mark/8/34', 'Romans/12/1'],
  'Matthew/22/37': ['Deuteronomy/6/5', 'Mark/12/30', 'Luke/10/27'],
  'Matthew/22/39': ['Leviticus/19/18', 'Romans/13/9', 'Galatians/5/14'],
  'Matthew/28/19': ['Acts/1/8', 'Mark/16/15', 'Luke/24/47'],
  'Matthew/28/20': ['Hebrews/13/5', 'Joshua/1/9'],

  'Mark/12/30': ['Deuteronomy/6/5', 'Matthew/22/37', 'Luke/10/27'],
  'Mark/16/15': ['Matthew/28/19', 'Acts/1/8'],

  'Luke/19/10': ['1 Timothy/1/15', 'Matthew/18/11', 'Ezekiel/34/16'],

  'John/1/1': [
    'Genesis/1/1',
    'Colossians/1/16',
    'Revelation/19/13',
    'Hebrews/1/2',
  ],
  'John/1/14': ['Philippians/2/7', '1 John/4/2', 'Hebrews/2/14'],
  'John/3/16': ['Romans/5/8', '1 John/4/9', 'Ephesians/2/4', 'John/3/36'],
  'John/3/17': ['John/12/47', 'Luke/19/10', '1 John/4/14'],
  'John/8/12': ['John/1/9', 'Isaiah/9/2', '1 John/1/5'],
  'John/10/10': ['Romans/6/23', '1 Timothy/6/12'],
  'John/10/11': ['Psalms/23/1', 'Ezekiel/34/23', 'Hebrews/13/20'],
  'John/14/1': ['Philippians/4/6', 'Isaiah/26/3'],
  'John/14/6': ['Acts/4/12', 'Hebrews/10/20', '1 John/5/12'],
  'John/14/27': ['Philippians/4/7', 'John/16/33', 'Isaiah/26/3'],
  'John/15/5': ['Philippians/4/13', '2 Corinthians/12/9'],

  // ── Acts ───────────────────────────────────────────────────────────
  'Acts/1/8': ['Matthew/28/19', 'Luke/24/49', 'Mark/16/15'],
  'Acts/2/38': ['Acts/3/19', 'Mark/16/16'],
  'Acts/4/12': ['John/14/6', '1 Timothy/2/5', 'Matthew/1/21'],
  'Acts/16/31': ['Romans/10/9', 'John/3/16'],

  // ── Paul ───────────────────────────────────────────────────────────
  'Romans/3/23': ['1 John/1/8', 'Ecclesiastes/7/20', 'Psalms/14/3'],
  'Romans/5/8': ['John/3/16', '1 John/4/10', 'Ephesians/2/4'],
  'Romans/6/23': ['Genesis/2/17', 'John/3/16', 'James/1/15'],
  'Romans/8/1': ['John/3/18', 'Romans/5/1'],
  'Romans/8/28': ['Genesis/50/20', 'Jeremiah/29/11', 'Ephesians/1/11'],
  'Romans/8/38': ['John/10/28', '2 Timothy/1/12'],
  'Romans/10/9': ['John/14/6', 'Acts/4/12', '1 John/4/2'],
  'Romans/10/17': ['Galatians/3/2', 'Hebrews/11/1'],
  'Romans/12/1': ['1 Peter/2/5', 'Hebrews/13/15'],
  'Romans/12/2': ['Ephesians/4/23', '2 Corinthians/3/18'],

  '1 Corinthians/10/13': ['2 Peter/2/9', 'James/1/12'],
  '1 Corinthians/13/4': ['Galatians/5/22', '1 John/4/7', 'Colossians/3/14'],
  '1 Corinthians/13/13': ['1 Thessalonians/1/3', 'Galatians/5/6'],
  '1 Corinthians/15/3': ['Isaiah/53/5', '1 Peter/2/24'],
  '1 Corinthians/15/55': ['Hosea/13/14', '2 Timothy/1/10'],

  '2 Corinthians/5/17': ['Galatians/6/15', 'Ezekiel/36/26', 'Romans/6/4'],
  '2 Corinthians/12/9': ['Philippians/4/13', '2 Corinthians/4/7'],

  'Galatians/2/20': ['Romans/6/6', 'Philippians/1/21'],
  'Galatians/5/22': ['Ephesians/5/9', 'John/15/5'],

  'Ephesians/2/8': ['Titus/3/5', 'Romans/3/24', 'Romans/4/16'],
  'Ephesians/2/10': ['Psalms/139/14', 'Philippians/2/13'],
  'Ephesians/6/12': ['2 Corinthians/10/4', '1 Peter/5/8'],

  'Philippians/4/6': ['1 Peter/5/7', 'Matthew/6/25', 'John/14/1'],
  'Philippians/4/7': ['John/14/27', 'Isaiah/26/3', 'Colossians/3/15'],
  'Philippians/4/13': ['John/15/5', '2 Corinthians/12/9', 'Isaiah/40/29'],
  'Philippians/4/19': ['Psalms/23/1', 'Matthew/6/33'],

  'Colossians/3/2': ['Romans/12/2', 'Philippians/3/19'],
  'Colossians/3/23': ['Ephesians/6/7', '1 Corinthians/10/31'],

  '1 Thessalonians/5/16': ['Philippians/4/4', 'Psalms/118/24'],
  '1 Thessalonians/5/17': ['Romans/12/12', 'Luke/18/1'],
  '1 Thessalonians/5/18': ['Ephesians/5/20', 'Psalms/100/4'],

  '2 Timothy/1/7': ['Romans/8/15', '1 John/4/18'],
  '2 Timothy/3/16': ['2 Peter/1/21', 'Hebrews/4/12', 'Psalms/119/105'],

  'Titus/3/5': ['Ephesians/2/8', 'John/3/5'],

  // ── General Epistles ───────────────────────────────────────────────
  'Hebrews/4/12': ['2 Timothy/3/16', '1 Peter/1/23', 'Jeremiah/23/29'],
  'Hebrews/11/1': ['2 Corinthians/5/7', 'Romans/10/17'],
  'Hebrews/11/6': ['Romans/14/23', 'James/1/6'],
  'Hebrews/12/2': ['Philippians/3/14', 'Colossians/3/2'],
  'Hebrews/13/5': ['Deuteronomy/31/6', 'Joshua/1/5', 'Philippians/4/11'],
  'Hebrews/13/8': ['Malachi/3/6', 'Revelation/1/8'],

  'James/1/2': ['Romans/5/3', '1 Peter/1/6'],
  'James/1/5': ['1 Kings/3/9', 'Proverbs/2/6', 'Matthew/7/7'],
  'James/4/7': ['1 Peter/5/9', 'Ephesians/4/27'],

  '1 Peter/5/7': ['Philippians/4/6', 'Matthew/6/25', 'Psalms/55/22'],

  '1 John/1/9': ['Psalms/32/5', 'Proverbs/28/13', 'Jeremiah/3/13'],
  '1 John/4/7': ['John/13/34', 'Galatians/5/22'],
  '1 John/4/8': ['1 John/4/16', 'John/3/16'],
  '1 John/4/18': ['Romans/8/15', '2 Timothy/1/7'],
  '1 John/5/12': ['John/3/36', 'John/14/6'],

  'Revelation/3/20': ['Luke/12/36', 'Song of Solomon/5/2'],
  'Revelation/21/4': ['Isaiah/25/8', '1 Corinthians/15/26'],

  // ── Sprint 99: parallels for well-known daily verses that had none ───
  'Psalms/34/18': [
    'Psalms/147/3',
    'Isaiah/61/1',
    'Matthew/5/4',
    'Psalms/51/17',
  ],
  'Psalms/103/1': ['Psalms/104/1', 'Psalms/146/1', 'Ephesians/1/3'],
  'Isaiah/43/2': [
    'Psalms/23/4',
    'Daniel/3/25',
    '2 Corinthians/4/8',
    'Deuteronomy/31/6',
  ],
  'Lamentations/3/23': [
    'Lamentations/3/22',
    '1 Corinthians/1/9',
    'Hebrews/13/8',
  ],
  'Micah/6/8': ['Hosea/6/6', 'Matthew/23/23', 'Deuteronomy/10/12'],
  'Zephaniah/3/17': ['Isaiah/62/5', 'Deuteronomy/30/9', 'Matthew/1/23'],
  'John/13/34': ['John/15/12', '1 John/3/23', 'Romans/13/8', 'Ephesians/5/2'],
  'John/16/33': ['John/14/27', 'Romans/8/37', '1 John/5/4', '2 Timothy/3/12'],
  'Romans/5/1': [
    'Romans/3/28',
    'Ephesians/2/8',
    'Colossians/1/20',
    'Isaiah/53/5',
  ],
  'Romans/8/31': ['Romans/8/37', 'Psalms/118/6', 'Hebrews/13/6'],
  'Romans/15/13': ['Romans/5/5', 'Romans/12/12', 'Hebrews/6/19'],
  'Ephesians/4/32': ['Colossians/3/13', 'Matthew/6/14', 'Luke/6/37'],
  'Philippians/1/6': [
    '1 Thessalonians/5/24',
    'Philippians/2/13',
    '1 Corinthians/1/8',
    'Jude/1/24',
  ],
  'James/1/17': ['Matthew/7/11', '1 Corinthians/4/7', 'Numbers/23/19'],
  '1 Peter/1/3': ['John/3/3', 'Titus/3/5', '1 Corinthians/15/20', 'Romans/6/4'],

  // ── Sprint 100: cross-references for well-known daily verses (all targets
  // DB-verified RVR1960+KJV by book_id) ──
  'Psalms/16/11': ['Acts/2/28', 'Psalms/17/15', 'John/14/6'],
  'Psalms/55/22': ['1 Peter/5/7', 'Matthew/11/28', 'Psalms/37/5'],
  'Psalms/103/2': ['Psalms/103/3', 'Isaiah/43/25', 'Deuteronomy/8/2'],
  'Psalms/121/1': ['Psalms/121/2', 'Psalms/123/1', 'Jeremiah/3/23'],
  'Psalms/121/2': ['Psalms/124/8', 'Psalms/146/6', 'Genesis/1/1'],
  'Psalms/147/3': ['Psalms/34/18', 'Isaiah/61/1', 'Luke/4/18'],
  'Proverbs/17/17': ['Proverbs/18/24', 'John/15/13', '1 Corinthians/13/7'],
  'Proverbs/18/10': ['Psalms/61/3', 'Proverbs/29/25', 'Psalms/18/2'],
  'Matthew/6/34': ['Matthew/6/25', '1 Peter/5/7', 'Philippians/4/6'],
  'Matthew/19/26': ['Mark/10/27', 'Luke/1/37', 'Jeremiah/32/17'],
  'Mark/10/27': ['Matthew/19/26', 'Luke/18/27', 'Genesis/18/14'],
  'Luke/1/37': ['Genesis/18/14', 'Jeremiah/32/17', 'Matthew/19/26'],
  'John/6/35': ['John/4/14', 'Isaiah/55/1', 'John/7/37'],
  'Romans/8/32': ['Romans/5/8', 'Isaiah/53/6', 'John/3/16'],
  '1 Corinthians/15/58': [
    'Galatians/6/9',
    '1 Corinthians/15/57',
    '2 Chronicles/15/7',
  ],
  '2 Corinthians/5/7': ['Hebrews/11/1', 'Romans/8/24', '1 Peter/1/8'],
  'Ephesians/6/10': ['Philippians/4/13', 'Isaiah/40/31', '2 Timothy/2/1'],
  'Philippians/4/8': ['Colossians/3/2', 'Romans/12/2', 'Philippians/4/9'],
  'Colossians/1/16': ['John/1/3', 'Hebrews/1/2', 'Revelation/4/11'],
  'Hebrews/12/1': ['Hebrews/12/2', '1 Corinthians/9/24', 'Hebrews/11/1'],
  'James/4/8': ['Zechariah/1/3', 'Isaiah/55/6', 'Psalms/145/18'],

  // ── Sprint 101: cross-references for 44 daily verses that had none
  // (coverage 67% → ~89%; all targets DB-verified RVR1960+KJV by book_id) ──
  'Exodus/14/14': [
    'Deuteronomy/3/22',
    '2 Chronicles/20/15',
    'Exodus/14/13',
    'Romans/8/31',
  ],
  'Exodus/15/2': ['Psalms/118/14', 'Isaiah/12/2', 'Psalms/18/1'],
  'Deuteronomy/31/8': [
    'Joshua/1/9',
    'Hebrews/13/5',
    'Deuteronomy/31/6',
    'Isaiah/41/10',
  ],
  'Joshua/24/15': ['Genesis/18/19', '1 Kings/18/21', 'Acts/16/31'],
  '1 Chronicles/16/11': ['Psalms/105/4', 'Matthew/6/33', 'Hebrews/11/6'],
  '2 Chronicles/7/14': ['James/4/10', '1 John/1/9', 'Isaiah/55/7'],
  'Nehemiah/8/10': ['Psalms/28/7', 'Philippians/4/4', 'Habakkuk/3/18'],
  'Psalms/18/2': [
    '2 Samuel/22/2',
    'Psalms/62/2',
    'Psalms/144/1',
    'Psalms/91/2',
  ],
  'Psalms/28/7': ['Psalms/18/2', 'Psalms/118/14', 'Isaiah/12/2'],
  'Psalms/30/5': [
    'Psalms/126/5',
    'Isaiah/61/3',
    'John/16/20',
    '2 Corinthians/4/17',
  ],
  'Psalms/32/8': ['Psalms/25/9', 'Proverbs/3/6', 'Isaiah/30/21'],
  'Psalms/42/11': ['Psalms/43/5', 'Lamentations/3/24', 'Romans/15/13'],
  'Psalms/56/3': ['Psalms/34/4', 'Isaiah/12/2', '2 Timothy/1/7'],
  'Psalms/62/1': ['Psalms/62/5', 'Psalms/27/14', 'Lamentations/3/26'],
  'Psalms/73/26': ['Psalms/16/5', 'Lamentations/3/24', 'Psalms/18/2'],
  'Psalms/90/12': ['Psalms/39/4', 'Ephesians/5/16', 'James/4/14'],
  'Psalms/91/2': ['Psalms/18/2', 'Psalms/46/1', 'Proverbs/18/10'],
  'Psalms/94/19': ['Psalms/55/22', '2 Corinthians/1/3', 'Isaiah/66/13'],
  'Psalms/100/4': ['Psalms/95/2', 'Philippians/4/6', 'Hebrews/13/15'],
  'Psalms/118/24': ['Psalms/16/11', 'Philippians/4/4', 'Nehemiah/8/10'],
  'Psalms/143/8': ['Psalms/90/14', 'Psalms/25/4', 'Lamentations/3/23'],
  'Psalms/145/18': [
    'Deuteronomy/4/7',
    'Psalms/34/18',
    'Romans/10/13',
    'James/4/8',
  ],
  'Proverbs/4/23': ['Matthew/15/18', 'Philippians/4/7', 'Luke/6/45'],
  'Proverbs/15/1': ['Proverbs/25/15', 'Ecclesiastes/10/4', 'Romans/12/18'],
  'Proverbs/31/25': ['Proverbs/31/30', '1 Peter/3/4', '1 Timothy/2/9'],
  'Isaiah/12/2': ['Exodus/15/2', 'Psalms/118/14', 'Habakkuk/3/18'],
  'Isaiah/64/8': ['Isaiah/29/16', 'Jeremiah/18/6', 'Romans/9/21'],
  'Nahum/1/7': ['Psalms/46/1', 'Psalms/9/9', 'Psalms/34/8'],
  'Habakkuk/3/19': ['Psalms/18/33', '2 Samuel/22/34', 'Philippians/4/13'],
  'Matthew/5/16': ['Ephesians/5/8', 'Philippians/2/15', '1 Peter/2/12'],
  'Matthew/6/21': ['Luke/12/34', 'Colossians/3/1', 'Matthew/6/19'],
  'Mark/11/24': ['Matthew/21/22', 'John/14/13', '1 John/5/14', 'James/1/6'],
  'Luke/6/31': ['Matthew/7/12', 'Romans/13/10', 'Galatians/5/14'],
  'Romans/12/12': ['1 Thessalonians/5/16', 'Colossians/4/2', 'Hebrews/10/23'],
  '1 Corinthians/16/14': [
    '1 Corinthians/13/1',
    'Colossians/3/14',
    '1 Peter/4/8',
  ],
  '2 Corinthians/4/16': ['Ephesians/3/16', 'Isaiah/40/31', 'Colossians/3/10'],
  '2 Corinthians/9/7': ['Proverbs/11/25', 'Luke/6/38', '2 Corinthians/8/12'],
  'Galatians/6/9': [
    '2 Thessalonians/3/13',
    'Hebrews/12/3',
    '1 Corinthians/15/58',
  ],
  'Ephesians/3/20': ['Jeremiah/32/17', 'Philippians/4/19', 'Jude/1/24'],
  'Colossians/3/15': ['Philippians/4/7', 'John/14/27', 'Romans/14/19'],
  '1 Timothy/4/12': ['Titus/2/7', '1 Corinthians/16/11', '1 Peter/5/3'],
  'Hebrews/10/23': ['Hebrews/4/14', 'Hebrews/11/11', '1 Thessalonians/5/24'],
  'James/1/12': ['Revelation/2/10', '1 Corinthians/9/25', '2 Timothy/4/8'],
  '1 Peter/3/15': ['Colossians/4/6', '2 Timothy/2/25', 'Psalms/119/46'],
};

/**
 * Resolve cross-references for a given verse, accepting the book name in
 * any of the canonical forms (Spanish or English) since the reader uses
 * the active Bible-version name. Returns [] when no curated parallels.
 */
export function getCrossReferences(
  book: string,
  chapter: number,
  verse: number,
): string[] {
  const info = getBookByName(book);
  const englishName = info?.nameEn ?? book;
  return CROSS_REFERENCES[`${englishName}/${chapter}/${verse}`] ?? [];
}

/** Number of curated source verses — for telemetry / about screen. */
export function getCrossReferencesCount(): number {
  return Object.keys(CROSS_REFERENCES).length;
}
