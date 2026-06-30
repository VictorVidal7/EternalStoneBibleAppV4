/**
 * ✝️ messianicProphecies — the "Hilo profético" catalog (the prophetic thread).
 *
 * "Y comenzando desde Moisés, y siguiendo por todos los profetas, les declaraba
 * en todas las Escrituras lo que de él decían" (Lucas 24:27). This is a curated,
 * ORDERED thread of Old-Testament messianic prophecies and the New-Testament
 * passage in which each is fulfilled in the Lord Jesus — walked through the
 * unfolding of His life: His coming, His ministry, His passion, and His
 * resurrection and exaltation.
 *
 * Inclusion is deliberately CONSERVATIVE: only prophecies the New Testament
 * itself cites as fulfilled in Christ, or that the historic Christian church has
 * broadly held — never speculation. Both `prophecy` and `fulfillment` are
 * canonical "EnglishBook/Chapter/Verse" keys (the same form [[christConnections]]
 * / [[studyConnections]] use), validated against the book table + chapter range
 * by the accompanying test, and every verse was checked to exist in the bundled
 * text. Where a prophecy spans several verses, a single representative verse is
 * keyed (the reader can read its context). The theme label + a short, faithful
 * note live in i18n (`t.prophecies.items[id]`), es/en parity enforced.
 *
 * PURE (no React/RN, no DB): the screen resolves each verse's text from SQLite
 * and renders the i18n prose.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

/** A canonical "EnglishBook/Chapter/Verse" reference key. */
export type ProphecyRefKey = string;

/**
 * The movements the thread walks through, in order: the four stages of Christ's
 * life, then the "shadows" — OT types that prefigure Him (the bronze serpent,
 * the Passover lamb…), each affirmed as fulfilled in Him by the New Testament.
 */
export type ProphecyGroup =
  | 'coming'
  | 'ministry'
  | 'passion'
  | 'resurrection'
  | 'shadows';

export const PROPHECY_GROUP_ORDER: readonly ProphecyGroup[] = [
  'coming',
  'ministry',
  'passion',
  'resurrection',
  'shadows',
];

export interface MessianicProphecy {
  /** Stable slug — also the i18n key `t.prophecies.items[id]`. */
  id: string;
  /** Which movement of Christ's life (or 'shadows') this entry belongs to. */
  group: ProphecyGroup;
  /**
   * 'prophecy' (a spoken word foretelling Him, the default) or 'shadow' (an OT
   * type/figure that prefigures Him). Changes only the OT-side label.
   */
  kind?: 'prophecy' | 'shadow';
  /** The Old-Testament prophecy or type (canonical "EnglishBook/Chapter/Verse"). */
  prophecy: ProphecyRefKey;
  /** The New-Testament passage where it is fulfilled in Christ. */
  fulfillment: ProphecyRefKey;
}

/**
 * The curated thread, in the order of Christ's life. Each entry was verified to
 * resolve to a real verse in both Testaments; the NT reference is one that names
 * or plainly records the fulfillment.
 */
export const MESSIANIC_PROPHECIES: readonly MessianicProphecy[] = [
  // ── His coming: lineage and birth ──
  {
    id: 'gen-3-15',
    group: 'coming',
    prophecy: 'Genesis/3/15',
    fulfillment: 'Galatians/4/4',
  },
  {
    id: 'gen-22-18',
    group: 'coming',
    prophecy: 'Genesis/22/18',
    fulfillment: 'Galatians/3/16',
  },
  {
    id: 'gen-49-10',
    group: 'coming',
    prophecy: 'Genesis/49/10',
    fulfillment: 'Hebrews/7/14',
  },
  {
    id: 'num-24-17',
    group: 'coming',
    prophecy: 'Numbers/24/17',
    fulfillment: 'Matthew/2/2',
  },
  {
    id: '2sam-7-12',
    group: 'coming',
    prophecy: '2 Samuel/7/12',
    fulfillment: 'Luke/1/32',
  },
  {
    id: 'isa-7-14',
    group: 'coming',
    prophecy: 'Isaiah/7/14',
    fulfillment: 'Matthew/1/23',
  },
  {
    id: 'mic-5-2',
    group: 'coming',
    prophecy: 'Micah/5/2',
    fulfillment: 'Matthew/2/1',
  },
  {
    id: 'isa-9-6',
    group: 'coming',
    prophecy: 'Isaiah/9/6',
    fulfillment: 'Luke/2/11',
  },
  {
    id: 'hos-11-1',
    group: 'coming',
    prophecy: 'Hosea/11/1',
    fulfillment: 'Matthew/2/15',
  },
  {
    id: 'jer-31-15',
    group: 'coming',
    prophecy: 'Jeremiah/31/15',
    fulfillment: 'Matthew/2/17',
  },
  {
    id: 'isa-11-1',
    group: 'coming',
    prophecy: 'Isaiah/11/1',
    fulfillment: 'Romans/15/12',
  },

  // ── His ministry ──
  {
    id: 'mal-3-1',
    group: 'ministry',
    prophecy: 'Malachi/3/1',
    fulfillment: 'Mark/1/2',
  },
  {
    id: 'isa-40-3',
    group: 'ministry',
    prophecy: 'Isaiah/40/3',
    fulfillment: 'Matthew/3/3',
  },
  {
    id: 'deut-18-15',
    group: 'ministry',
    prophecy: 'Deuteronomy/18/15',
    fulfillment: 'Acts/3/22',
  },
  {
    id: 'isa-61-1',
    group: 'ministry',
    prophecy: 'Isaiah/61/1',
    fulfillment: 'Luke/4/18',
  },
  {
    id: 'isa-9-2',
    group: 'ministry',
    prophecy: 'Isaiah/9/2',
    fulfillment: 'Matthew/4/16',
  },
  {
    id: 'isa-35-5',
    group: 'ministry',
    prophecy: 'Isaiah/35/5',
    fulfillment: 'Matthew/11/5',
  },
  {
    id: 'ps-78-2',
    group: 'ministry',
    prophecy: 'Psalms/78/2',
    fulfillment: 'Matthew/13/35',
  },
  {
    id: 'zech-9-9',
    group: 'ministry',
    prophecy: 'Zechariah/9/9',
    fulfillment: 'Matthew/21/5',
  },
  {
    id: 'isa-42-1',
    group: 'ministry',
    prophecy: 'Isaiah/42/1',
    fulfillment: 'Matthew/12/18',
  },
  {
    id: 'isa-53-4',
    group: 'ministry',
    prophecy: 'Isaiah/53/4',
    fulfillment: 'Matthew/8/17',
  },
  {
    id: 'ps-118-22',
    group: 'ministry',
    prophecy: 'Psalms/118/22',
    fulfillment: 'Matthew/21/42',
  },
  {
    id: 'ps-118-26',
    group: 'ministry',
    prophecy: 'Psalms/118/26',
    fulfillment: 'Matthew/21/9',
  },
  {
    id: 'ps-8-2',
    group: 'ministry',
    prophecy: 'Psalms/8/2',
    fulfillment: 'Matthew/21/16',
  },
  {
    id: 'isa-28-16',
    group: 'ministry',
    prophecy: 'Isaiah/28/16',
    fulfillment: '1 Peter/2/6',
  },
  {
    id: 'ps-69-9',
    group: 'ministry',
    prophecy: 'Psalms/69/9',
    fulfillment: 'John/2/17',
  },
  {
    id: 'isa-49-6',
    group: 'ministry',
    prophecy: 'Isaiah/49/6',
    fulfillment: 'Acts/13/47',
  },

  // ── His passion: betrayal, suffering and death ──
  {
    id: 'isa-53-3',
    group: 'passion',
    prophecy: 'Isaiah/53/3',
    fulfillment: 'John/1/11',
  },
  {
    id: 'isa-53-1',
    group: 'passion',
    prophecy: 'Isaiah/53/1',
    fulfillment: 'John/12/38',
  },
  {
    id: 'ps-41-9',
    group: 'passion',
    prophecy: 'Psalms/41/9',
    fulfillment: 'John/13/18',
  },
  {
    id: 'zech-11-12',
    group: 'passion',
    prophecy: 'Zechariah/11/12',
    fulfillment: 'Matthew/26/15',
  },
  {
    id: 'zech-13-7',
    group: 'passion',
    prophecy: 'Zechariah/13/7',
    fulfillment: 'Matthew/26/31',
  },
  {
    id: 'isa-53-7',
    group: 'passion',
    prophecy: 'Isaiah/53/7',
    fulfillment: 'Matthew/27/12',
  },
  {
    id: 'isa-50-6',
    group: 'passion',
    prophecy: 'Isaiah/50/6',
    fulfillment: 'Matthew/26/67',
  },
  {
    id: 'isa-53-5',
    group: 'passion',
    prophecy: 'Isaiah/53/5',
    fulfillment: '1 Peter/2/24',
  },
  {
    id: 'ps-22-16',
    group: 'passion',
    prophecy: 'Psalms/22/16',
    fulfillment: 'John/20/25',
  },
  {
    id: 'ps-22-18',
    group: 'passion',
    prophecy: 'Psalms/22/18',
    fulfillment: 'John/19/24',
  },
  {
    id: 'ps-69-21',
    group: 'passion',
    prophecy: 'Psalms/69/21',
    fulfillment: 'John/19/29',
  },
  {
    id: 'ps-22-1',
    group: 'passion',
    prophecy: 'Psalms/22/1',
    fulfillment: 'Matthew/27/46',
  },
  {
    id: 'ps-34-20',
    group: 'passion',
    prophecy: 'Psalms/34/20',
    fulfillment: 'John/19/36',
  },
  {
    id: 'zech-12-10',
    group: 'passion',
    prophecy: 'Zechariah/12/10',
    fulfillment: 'John/19/37',
  },
  {
    id: 'isa-53-9',
    group: 'passion',
    prophecy: 'Isaiah/53/9',
    fulfillment: 'Matthew/27/57',
  },
  {
    id: 'isa-53-12',
    group: 'passion',
    prophecy: 'Isaiah/53/12',
    fulfillment: 'Luke/22/37',
  },
  {
    id: 'deut-21-23',
    group: 'passion',
    prophecy: 'Deuteronomy/21/23',
    fulfillment: 'Galatians/3/13',
  },

  // ── His resurrection and exaltation ──
  {
    id: 'ps-16-10',
    group: 'resurrection',
    prophecy: 'Psalms/16/10',
    fulfillment: 'Acts/2/31',
  },
  {
    id: 'ps-16-11',
    group: 'resurrection',
    prophecy: 'Psalms/16/11',
    fulfillment: 'Acts/2/28',
  },
  {
    id: 'ps-2-7',
    group: 'resurrection',
    prophecy: 'Psalms/2/7',
    fulfillment: 'Acts/13/33',
  },
  {
    id: 'ps-110-1',
    group: 'resurrection',
    prophecy: 'Psalms/110/1',
    fulfillment: 'Acts/2/34',
  },
  {
    id: 'ps-68-18',
    group: 'resurrection',
    prophecy: 'Psalms/68/18',
    fulfillment: 'Ephesians/4/8',
  },
  {
    id: 'ps-45-6',
    group: 'resurrection',
    prophecy: 'Psalms/45/6',
    fulfillment: 'Hebrews/1/8',
  },
  {
    id: 'ps-110-4',
    group: 'resurrection',
    prophecy: 'Psalms/110/4',
    fulfillment: 'Hebrews/5/6',
  },
  {
    id: 'dan-7-13',
    group: 'resurrection',
    prophecy: 'Daniel/7/13',
    fulfillment: 'Matthew/26/64',
  },
  {
    id: 'joel-2-32',
    group: 'resurrection',
    prophecy: 'Joel/2/32',
    fulfillment: 'Romans/10/13',
  },
  {
    id: 'amos-9-11',
    group: 'resurrection',
    prophecy: 'Amos/9/11',
    fulfillment: 'Acts/15/16',
  },
  {
    id: 'ps-102-25',
    group: 'resurrection',
    prophecy: 'Psalms/102/25',
    fulfillment: 'Hebrews/1/10',
  },
  {
    id: 'ps-8-6',
    group: 'resurrection',
    prophecy: 'Psalms/8/6',
    fulfillment: 'Hebrews/2/8',
  },

  // ── Shadows of Christ: OT types the NT affirms are fulfilled in Him ──
  {
    id: 'paschal-lamb',
    group: 'shadows',
    kind: 'shadow',
    prophecy: 'Exodus/12/13',
    fulfillment: '1 Corinthians/5/7',
  },
  {
    id: 'bronze-serpent',
    group: 'shadows',
    kind: 'shadow',
    prophecy: 'Numbers/21/9',
    fulfillment: 'John/3/14',
  },
  {
    id: 'isaac',
    group: 'shadows',
    kind: 'shadow',
    prophecy: 'Genesis/22/8',
    fulfillment: 'John/1/29',
  },
  {
    id: 'manna',
    group: 'shadows',
    kind: 'shadow',
    prophecy: 'Exodus/16/15',
    fulfillment: 'John/6/35',
  },
  {
    id: 'rock',
    group: 'shadows',
    kind: 'shadow',
    prophecy: 'Exodus/17/6',
    fulfillment: '1 Corinthians/10/4',
  },
  {
    id: 'tabernacle',
    group: 'shadows',
    kind: 'shadow',
    prophecy: 'Exodus/25/8',
    fulfillment: 'John/1/14',
  },
  {
    id: 'atonement',
    group: 'shadows',
    kind: 'shadow',
    prophecy: 'Leviticus/16/15',
    fulfillment: 'Hebrews/9/12',
  },
  {
    id: 'melchizedek',
    group: 'shadows',
    kind: 'shadow',
    prophecy: 'Genesis/14/18',
    fulfillment: 'Hebrews/7/17',
  },
  {
    id: 'firstfruits',
    group: 'shadows',
    kind: 'shadow',
    prophecy: 'Leviticus/23/10',
    fulfillment: '1 Corinthians/15/20',
  },
  {
    id: 'jonah',
    group: 'shadows',
    kind: 'shadow',
    prophecy: 'Jonah/1/17',
    fulfillment: 'Matthew/12/40',
  },
  {
    id: 'adam',
    group: 'shadows',
    kind: 'shadow',
    prophecy: 'Genesis/2/7',
    fulfillment: '1 Corinthians/15/45',
  },
  {
    id: 'veil',
    group: 'shadows',
    kind: 'shadow',
    prophecy: 'Exodus/26/31',
    fulfillment: 'Hebrews/10/20',
  },
  {
    id: 'scapegoat',
    group: 'shadows',
    kind: 'shadow',
    prophecy: 'Leviticus/16/22',
    fulfillment: 'Hebrews/9/28',
  },
  {
    id: 'joshua-rest',
    group: 'shadows',
    kind: 'shadow',
    prophecy: 'Joshua/21/44',
    fulfillment: 'Hebrews/4/8',
  },
];

/** Accent hue per movement (aligned with the app's palette families). */
export const PROPHECY_GROUP_ACCENT: Record<ProphecyGroup, string> = {
  coming: '#f59e0b', // dawn / advent
  ministry: '#10b981', // life / light
  passion: '#8b5cf6', // suffering
  resurrection: '#6366f1', // glory
  shadows: '#0ea5e9', // types / figures
};

/** Ionicons glyph per movement, for the step header. */
export const PROPHECY_GROUP_ICON: Record<ProphecyGroup, string> = {
  coming: 'star',
  ministry: 'sunny',
  passion: 'water',
  resurrection: 'sparkles',
  shadows: 'contrast',
};

/** Total prophecies in the thread. */
export const PROPHECY_COUNT = MESSIANIC_PROPHECIES.length;

/**
 * The prophecies the New Testament EXPLICITLY quotes/cites as fulfilled in
 * Christ — the "para que se cumpliese" formula quotations and apostolic
 * citations (Matthew's fulfilment formulas, Jesus' own quotations, Peter and
 * Paul citing the Psalms/Prophets). The rest of the catalog is no less true,
 * but the NT records or fulfils them rather than quoting the OT verse; the
 * screen shows a "cited in the NT" badge only for these, so the distinction is
 * honest and visible. (See the "Sources & method" note in the UI.)
 */
export const NT_QUOTED_PROPHECIES: ReadonlySet<string> = new Set([
  'gen-22-18',
  'isa-7-14',
  'mic-5-2',
  'hos-11-1',
  'jer-31-15',
  'isa-11-1',
  'mal-3-1',
  'isa-40-3',
  'deut-18-15',
  'isa-61-1',
  'isa-9-2',
  'isa-42-1',
  'isa-53-4',
  'ps-78-2',
  'zech-9-9',
  'ps-118-22',
  'ps-118-26',
  'ps-8-2',
  'ps-41-9',
  'zech-13-7',
  'isa-53-5',
  'ps-22-18',
  'ps-69-21',
  'ps-22-1',
  'ps-34-20',
  'zech-12-10',
  'isa-53-12',
  'deut-21-23',
  'ps-16-10',
  'ps-16-11',
  'ps-2-7',
  'ps-110-1',
  'ps-110-4',
  'ps-68-18',
  'ps-45-6',
  'dan-7-13',
  'isa-28-16',
  'ps-69-9',
  'isa-49-6',
  'isa-53-1',
  'joel-2-32',
  'amos-9-11',
  'ps-102-25',
  'ps-8-6',
  'adam',
]);

/** Whether the NT explicitly quotes/cites this prophecy as fulfilled. */
export function isNtQuoted(id: string): boolean {
  return NT_QUOTED_PROPHECIES.has(id);
}

/** Where a verse sits in the thread: which step, and as prophecy or fulfillment. */
export interface ProphecyVerseMatch {
  index: number;
  id: string;
  role: 'prophecy' | 'fulfillment';
}

// Reverse index "EnglishBook/Chapter/Verse" → its place in the thread, built
// once. The OT prophecy ref wins if a verse happens to be both.
let verseMatchIndex: Map<string, ProphecyVerseMatch> | null = null;
function getVerseMatchIndex(): Map<string, ProphecyVerseMatch> {
  if (verseMatchIndex === null) {
    const map = new Map<string, ProphecyVerseMatch>();
    MESSIANIC_PROPHECIES.forEach((p, index) => {
      if (!map.has(p.prophecy)) {
        map.set(p.prophecy, {index, id: p.id, role: 'prophecy'});
      }
      if (!map.has(p.fulfillment)) {
        map.set(p.fulfillment, {index, id: p.id, role: 'fulfillment'});
      }
    });
    verseMatchIndex = map;
  }
  return verseMatchIndex;
}

/**
 * Whether a verse (by canonical "EnglishBook/Chapter/Verse") is part of the
 * thread — so the reader can offer a jump to it. Pure; null when not in the
 * thread.
 */
export function findProphecyForVerseKey(
  key: string,
): ProphecyVerseMatch | null {
  return getVerseMatchIndex().get(key) ?? null;
}

/** A movement with its prophecies and their global thread index (for an index). */
export interface ProphecyGroupSection {
  group: ProphecyGroup;
  entries: {prophecy: MessianicProphecy; index: number}[];
}

/**
 * The thread grouped by movement, in {@link PROPHECY_GROUP_ORDER}, each entry
 * carrying its GLOBAL index in {@link MESSIANIC_PROPHECIES} so an index screen
 * can jump straight to that step. Pure.
 */
export function getPropheciesByGroup(): ProphecyGroupSection[] {
  return PROPHECY_GROUP_ORDER.map(group => ({
    group,
    entries: MESSIANIC_PROPHECIES.map((prophecy, index) => ({
      prophecy,
      index,
    })).filter(e => e.prophecy.group === group),
  })).filter(section => section.entries.length > 0);
}
