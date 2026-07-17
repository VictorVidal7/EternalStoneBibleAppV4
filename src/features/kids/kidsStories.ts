/**
 * 🧒 kidsStories — curated Bible stories for "Biblia para niños" (Item 4,
 * Tanda 1 of the kids/family mode).
 *
 * Ten narrative stories with a clear arc, chosen to be readable by an 8+
 * year old alone or read aloud by an adult to a younger child (single text
 * level ~6-12, per the user's call). Each story is a sequence of SCENES —
 * 1-3 anchor verses + a declarative illustration spec ([[KidsSceneArt]],
 * rendered by `kidsSceneArt.ts` + `KidsSceneCanvas`) — followed by a
 * 3-question multiple-choice quiz over facts from the text (not
 * interpretation). Every ref was verified against `assets/bible-seed.db`
 * before this file was written.
 *
 * PURE (no React/RN, no DB): only ids, refs and visual specs. ALL prose
 * (titles, scene text, quiz questions/options, "Para enseñar" context and
 * discussion questions) lives in i18n (`t.kids.stories[id]`), es/en parity
 * enforced by `__tests__/kidsStories.test.ts` — same shape as
 * [[scripturePrayers]] and [[journeyMaps]].
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

/** A canonical "EnglishBook/Chapter/Verse" reference key (same form as [[journeyMaps]]). */
export type KidsRefKey = string;

export type KidsStoryId =
  | 'creation'
  | 'noah'
  | 'joseph'
  | 'moses'
  | 'david-goliath'
  | 'daniel-lions'
  | 'jonah'
  | 'jesus-birth'
  | 'good-samaritan'
  | 'resurrection';

/** Cuenta bíblica, en orden canónico: AT cronológico, luego NT cronológico. */
export const KIDS_STORY_ORDER: readonly KidsStoryId[] = [
  'creation',
  'noah',
  'joseph',
  'moses',
  'david-goliath',
  'daniel-lions',
  'jonah',
  'jesus-birth',
  'good-samaritan',
  'resurrection',
];

/** Ionicons names, except 'jesus-birth' which is MaterialCommunityIcons'
 * 'star-shooting-outline' — the moving star that guided the magi. */
export const KIDS_STORY_ICON: Record<KidsStoryId, string> = {
  creation: 'planet-outline',
  noah: 'boat-outline',
  joseph: 'shirt-outline',
  moses: 'flame-outline',
  'david-goliath': 'flash-outline',
  'daniel-lions': 'paw-outline',
  jonah: 'fish-outline',
  'jesus-birth': 'star-shooting-outline',
  'good-samaritan': 'heart-outline',
  resurrection: 'sunny-outline',
};

/** Accent + a two-stop gradient for the story's card in the hub. */
export const KIDS_STORY_PALETTE: Record<
  KidsStoryId,
  {accent: string; gradient: readonly [string, string]}
> = {
  creation: {accent: '#7C3AED', gradient: ['#4C1D95', '#7C3AED']},
  noah: {accent: '#0891B2', gradient: ['#0E7490', '#22D3EE']},
  joseph: {accent: '#CA8A04', gradient: ['#92400E', '#F59E0B']},
  moses: {accent: '#DC2626', gradient: ['#B45309', '#F97316']},
  'david-goliath': {accent: '#059669', gradient: ['#065F46', '#10B981']},
  'daniel-lions': {accent: '#B45309', gradient: ['#78350F', '#D97706']},
  jonah: {accent: '#0369A1', gradient: ['#0C4A6E', '#0EA5E9']},
  'jesus-birth': {accent: '#7C3AED', gradient: ['#1E3A8A', '#818CF8']},
  'good-samaritan': {accent: '#DC2626', gradient: ['#9A3412', '#FB923C']},
  resurrection: {accent: '#EAB308', gradient: ['#78350F', '#FBBF24']},
};

// ── Reusable sky gradients (top→bottom), shared across scenes ──
const SKY_NIGHT: readonly [string, string] = ['#1E1B4B', '#312E81'];
const SKY_DAWN: readonly [string, string] = ['#FCD34D', '#F97316'];
const SKY_DAWN_SOFT: readonly [string, string] = ['#FDE68A', '#FCA5A5'];
const SKY_DAY: readonly [string, string] = ['#60A5FA', '#BFDBFE'];
const SKY_STORM: readonly [string, string] = ['#475569', '#94A3B8'];
const SKY_DUSK: readonly [string, string] = ['#7C2D12', '#EA580C'];
const SKY_GOLD: readonly [string, string] = ['#FBBF24', '#FDE68A'];
const SKY_DEEP: readonly [string, string] = ['#0C4A6E', '#38BDF8'];
const SKY_SAND: readonly [string, string] = ['#93C5FD', '#FDE68A'];

export type KidsSceneGround =
  | 'water'
  | 'sand'
  | 'grass'
  | 'stone'
  | 'night'
  | 'none';

export type KidsSceneDecor =
  | 'sun'
  | 'moon'
  | 'stars'
  | 'clouds'
  | 'rain'
  | 'rainbow'
  | 'waves'
  | 'hills'
  | 'rays';

export interface KidsSceneActor {
  /** A single emoji glyph, rendered as an RN `<Text>` above the SVG. */
  emoji: string;
  /** Position on a normalized 100×100 canvas. */
  x: number;
  y: number;
  /** Relative size (percent of canvas width used as font size). */
  size: number;
}

/** Declarative, $0 illustration spec — no binary assets. */
export interface KidsSceneArt {
  sky: readonly [string, string];
  ground: KidsSceneGround;
  decor: readonly KidsSceneDecor[];
  actors: readonly KidsSceneActor[];
}

export interface KidsScene {
  /** Stable slug `${storyId}-N` — also the i18n key `t.kids.stories[id].scenes[sceneId]`. */
  id: string;
  /** 1-3 verses anchoring this scene, in reading order. Verified against bible-seed.db. */
  refs: readonly KidsRefKey[];
  art: KidsSceneArt;
}

export interface KidsQuizQuestionSpec {
  /** Stable slug `${storyId}-qN` — also the i18n key `t.kids.stories[id].quiz[qId]`. */
  id: string;
  /** 0-based index of the correct option within the i18n `options` array (both languages). */
  correctIndex: number;
  /** The verse that proves the answer — a fact from the text, not an interpretation. */
  ref: KidsRefKey;
}

export interface KidsStory {
  id: KidsStoryId;
  testament: 'ot' | 'nt';
  /** Full canonical range for "Para enseñar" (the readable label lives in i18n `refLabel`). */
  passage: {book: string; chapterStart: number; chapterEnd: number};
  scenes: readonly KidsScene[];
  /** Exactly 3 per story. */
  quiz: readonly KidsQuizQuestionSpec[];
}

export const KIDS_STORIES: readonly KidsStory[] = [
  // ═══════════════════════ 1. La Creación ═══════════════════════
  {
    id: 'creation',
    testament: 'ot',
    passage: {book: 'Genesis', chapterStart: 1, chapterEnd: 2},
    scenes: [
      {
        id: 'creation-1',
        refs: ['Genesis/1/3'],
        art: {
          sky: SKY_NIGHT,
          ground: 'none',
          decor: ['stars', 'rays'],
          actors: [{emoji: '✨', x: 50, y: 45, size: 26}],
        },
      },
      {
        id: 'creation-2',
        refs: ['Genesis/1/6'],
        art: {
          sky: SKY_DAY,
          ground: 'water',
          decor: ['clouds', 'waves'],
          actors: [{emoji: '☁️', x: 30, y: 20, size: 16}],
        },
      },
      {
        id: 'creation-3',
        refs: ['Genesis/1/11'],
        art: {
          sky: SKY_DAY,
          ground: 'grass',
          decor: ['hills', 'sun'],
          actors: [
            {emoji: '🌳', x: 28, y: 62, size: 20},
            {emoji: '🌿', x: 65, y: 72, size: 16},
            {emoji: '🌾', x: 48, y: 76, size: 14},
          ],
        },
      },
      {
        id: 'creation-4',
        refs: ['Genesis/1/16'],
        art: {
          sky: SKY_NIGHT,
          ground: 'night',
          decor: ['sun', 'moon', 'stars'],
          actors: [
            {emoji: '☀️', x: 25, y: 25, size: 20},
            {emoji: '🌙', x: 70, y: 30, size: 18},
          ],
        },
      },
      {
        id: 'creation-5',
        refs: ['Genesis/1/20'],
        art: {
          sky: SKY_DAY,
          ground: 'water',
          decor: ['waves', 'clouds'],
          actors: [
            {emoji: '🐟', x: 60, y: 76, size: 16},
            {emoji: '🐠', x: 75, y: 80, size: 14},
            {emoji: '🕊️', x: 28, y: 30, size: 18},
          ],
        },
      },
      {
        id: 'creation-6',
        refs: ['Genesis/1/27'],
        art: {
          sky: SKY_GOLD,
          ground: 'grass',
          decor: ['hills', 'sun'],
          actors: [
            {emoji: '🦁', x: 20, y: 70, size: 18},
            {emoji: '🐑', x: 40, y: 76, size: 14},
            {emoji: '🧑', x: 65, y: 64, size: 20},
            {emoji: '👩', x: 76, y: 64, size: 20},
          ],
        },
      },
      {
        id: 'creation-7',
        refs: ['Genesis/2/2', 'Genesis/2/3'],
        art: {
          sky: SKY_DAWN_SOFT,
          ground: 'grass',
          decor: ['sun', 'hills'],
          actors: [{emoji: '🕊️', x: 50, y: 42, size: 18}],
        },
      },
    ],
    quiz: [
      {id: 'creation-q1', correctIndex: 0, ref: 'Genesis/1/3'},
      {id: 'creation-q2', correctIndex: 1, ref: 'Genesis/2/2'},
      {id: 'creation-q3', correctIndex: 2, ref: 'Genesis/1/27'},
    ],
  },

  // ═══════════════════════ 2. Noé y el arca ═══════════════════════
  {
    id: 'noah',
    testament: 'ot',
    passage: {book: 'Genesis', chapterStart: 6, chapterEnd: 9},
    scenes: [
      {
        id: 'noah-1',
        refs: ['Genesis/6/13', 'Genesis/6/14'],
        art: {
          sky: SKY_STORM,
          ground: 'grass',
          decor: ['clouds'],
          actors: [
            {emoji: '👴', x: 35, y: 64, size: 20},
            {emoji: '🛠️', x: 60, y: 64, size: 16},
          ],
        },
      },
      {
        id: 'noah-2',
        refs: ['Genesis/7/8', 'Genesis/7/9'],
        art: {
          sky: SKY_STORM,
          ground: 'grass',
          decor: ['clouds'],
          actors: [
            {emoji: '🚢', x: 50, y: 58, size: 30},
            {emoji: '🐘', x: 22, y: 76, size: 14},
            {emoji: '🦒', x: 78, y: 72, size: 14},
          ],
        },
      },
      {
        id: 'noah-3',
        refs: ['Genesis/7/12'],
        art: {
          sky: SKY_STORM,
          ground: 'water',
          decor: ['rain', 'clouds'],
          actors: [{emoji: '🚢', x: 50, y: 55, size: 26}],
        },
      },
      {
        id: 'noah-4',
        refs: ['Genesis/8/4'],
        art: {
          sky: SKY_DAY,
          ground: 'stone',
          decor: ['clouds'],
          actors: [
            {emoji: '⛰️', x: 50, y: 66, size: 28},
            {emoji: '🚢', x: 50, y: 48, size: 18},
          ],
        },
      },
      {
        id: 'noah-5',
        refs: ['Genesis/8/11'],
        art: {
          sky: SKY_DAY,
          ground: 'water',
          decor: ['clouds'],
          actors: [
            {emoji: '🕊️', x: 55, y: 40, size: 20},
            {emoji: '🌿', x: 60, y: 38, size: 10},
          ],
        },
      },
      {
        id: 'noah-6',
        refs: ['Genesis/9/13'],
        art: {
          sky: SKY_DAY,
          ground: 'grass',
          decor: ['rainbow', 'clouds'],
          actors: [
            {emoji: '🕊️', x: 30, y: 45, size: 16},
            {emoji: '👨‍👩‍👧', x: 62, y: 74, size: 18},
          ],
        },
      },
    ],
    quiz: [
      {id: 'noah-q1', correctIndex: 0, ref: 'Genesis/6/14'},
      {id: 'noah-q2', correctIndex: 1, ref: 'Genesis/8/11'},
      {id: 'noah-q3', correctIndex: 1, ref: 'Genesis/9/13'},
    ],
  },

  // ═══════════════════════ 3. José y sus hermanos ═══════════════════════
  {
    id: 'joseph',
    testament: 'ot',
    passage: {book: 'Genesis', chapterStart: 37, chapterEnd: 45},
    scenes: [
      {
        id: 'joseph-1',
        refs: ['Genesis/37/3'],
        art: {
          sky: SKY_SAND,
          ground: 'sand',
          decor: ['sun'],
          actors: [
            {emoji: '🧑', x: 45, y: 64, size: 22},
            {emoji: '✨', x: 56, y: 54, size: 14},
          ],
        },
      },
      {
        id: 'joseph-2',
        refs: ['Genesis/37/28'],
        art: {
          sky: SKY_DUSK,
          ground: 'sand',
          decor: ['sun'],
          actors: [
            {emoji: '🐫', x: 28, y: 68, size: 18},
            {emoji: '🧑', x: 62, y: 66, size: 18},
          ],
        },
      },
      {
        id: 'joseph-3',
        refs: ['Genesis/39/21'],
        art: {
          sky: SKY_SAND,
          ground: 'stone',
          decor: [],
          actors: [
            {emoji: '🧑', x: 50, y: 64, size: 20},
            {emoji: '✨', x: 62, y: 54, size: 14},
          ],
        },
      },
      {
        id: 'joseph-4',
        refs: ['Genesis/41/39', 'Genesis/41/40'],
        art: {
          sky: SKY_GOLD,
          ground: 'sand',
          decor: ['sun'],
          actors: [
            {emoji: '👑', x: 62, y: 54, size: 18},
            {emoji: '🧑', x: 40, y: 64, size: 20},
          ],
        },
      },
      {
        id: 'joseph-5',
        refs: ['Genesis/42/6'],
        art: {
          sky: SKY_SAND,
          ground: 'sand',
          decor: ['sun'],
          actors: [
            {emoji: '🧑', x: 62, y: 58, size: 20},
            {emoji: '👨‍👨‍👦', x: 34, y: 70, size: 18},
          ],
        },
      },
      {
        id: 'joseph-6',
        refs: ['Genesis/45/4', 'Genesis/45/5'],
        art: {
          sky: SKY_DAWN,
          ground: 'sand',
          decor: ['sun'],
          actors: [{emoji: '🤗', x: 50, y: 64, size: 24}],
        },
      },
    ],
    quiz: [
      {id: 'joseph-q1', correctIndex: 0, ref: 'Genesis/37/28'},
      {id: 'joseph-q2', correctIndex: 1, ref: 'Genesis/39/21'},
      {id: 'joseph-q3', correctIndex: 1, ref: 'Genesis/45/5'},
    ],
  },

  // ═══════════════════════ 4. Moisés y la salida de Egipto ═══════════════════════
  {
    id: 'moses',
    testament: 'ot',
    passage: {book: 'Exodus', chapterStart: 2, chapterEnd: 14},
    scenes: [
      {
        id: 'moses-1',
        refs: ['Exodus/2/3'],
        art: {
          sky: SKY_DAY,
          ground: 'water',
          decor: ['waves'],
          actors: [
            {emoji: '🧺', x: 50, y: 64, size: 16},
            {emoji: '👶', x: 50, y: 60, size: 10},
          ],
        },
      },
      {
        id: 'moses-2',
        refs: ['Exodus/3/2', 'Exodus/3/3', 'Exodus/3/4'],
        art: {
          sky: SKY_DUSK,
          ground: 'sand',
          decor: [],
          actors: [
            {emoji: '🔥', x: 52, y: 58, size: 22},
            {emoji: '🧑', x: 34, y: 68, size: 18},
          ],
        },
      },
      {
        id: 'moses-3',
        refs: ['Exodus/5/1'],
        art: {
          sky: SKY_SAND,
          ground: 'sand',
          decor: ['sun'],
          actors: [
            {emoji: '🧑', x: 38, y: 64, size: 20},
            {emoji: '👑', x: 66, y: 58, size: 18},
          ],
        },
      },
      {
        id: 'moses-4',
        refs: ['Exodus/12/13'],
        art: {
          sky: SKY_NIGHT,
          ground: 'sand',
          decor: ['moon', 'stars'],
          actors: [
            {emoji: '🏠', x: 50, y: 64, size: 20},
            {emoji: '🩸', x: 50, y: 50, size: 10},
          ],
        },
      },
      {
        id: 'moses-5',
        refs: ['Exodus/14/21', 'Exodus/14/22'],
        art: {
          sky: SKY_DEEP,
          ground: 'water',
          decor: ['waves'],
          actors: [
            {emoji: '🧑', x: 50, y: 58, size: 20},
            {emoji: '🌊', x: 18, y: 38, size: 22},
            {emoji: '🌊', x: 82, y: 38, size: 22},
          ],
        },
      },
      {
        id: 'moses-6',
        refs: ['Exodus/14/29', 'Exodus/14/30', 'Exodus/14/31'],
        art: {
          sky: SKY_GOLD,
          ground: 'sand',
          decor: ['sun'],
          actors: [{emoji: '🙌', x: 50, y: 64, size: 22}],
        },
      },
    ],
    quiz: [
      {id: 'moses-q1', correctIndex: 0, ref: 'Exodus/2/3'},
      {id: 'moses-q2', correctIndex: 1, ref: 'Exodus/3/2'},
      {id: 'moses-q3', correctIndex: 0, ref: 'Exodus/14/21'},
    ],
  },

  // ═══════════════════════ 5. David y Goliat ═══════════════════════
  {
    id: 'david-goliath',
    testament: 'ot',
    passage: {book: '1 Samuel', chapterStart: 17, chapterEnd: 17},
    scenes: [
      {
        id: 'david-goliath-1',
        refs: ['1 Samuel/17/4', '1 Samuel/17/10'],
        art: {
          sky: SKY_SAND,
          ground: 'grass',
          decor: ['hills'],
          actors: [
            {emoji: '🧔', x: 60, y: 54, size: 26},
            {emoji: '⚔️', x: 72, y: 60, size: 14},
          ],
        },
      },
      {
        id: 'david-goliath-2',
        refs: ['1 Samuel/17/34', '1 Samuel/17/35'],
        art: {
          sky: SKY_DAY,
          ground: 'grass',
          decor: ['hills', 'sun'],
          actors: [
            {emoji: '🧑', x: 38, y: 64, size: 18},
            {emoji: '🐑', x: 56, y: 72, size: 14},
          ],
        },
      },
      {
        id: 'david-goliath-3',
        refs: ['1 Samuel/17/40'],
        art: {
          sky: SKY_DAY,
          ground: 'water',
          decor: [],
          actors: [
            {emoji: '🧑', x: 44, y: 64, size: 18},
            {emoji: '🪨', x: 60, y: 70, size: 10},
          ],
        },
      },
      {
        id: 'david-goliath-4',
        refs: ['1 Samuel/17/45'],
        art: {
          sky: SKY_GOLD,
          ground: 'grass',
          decor: ['sun'],
          actors: [
            {emoji: '🧑', x: 34, y: 58, size: 18},
            {emoji: '🧔', x: 66, y: 54, size: 26},
          ],
        },
      },
      {
        id: 'david-goliath-5',
        refs: ['1 Samuel/17/49', '1 Samuel/17/50'],
        art: {
          sky: SKY_GOLD,
          ground: 'grass',
          decor: ['sun', 'hills'],
          actors: [{emoji: '🙌', x: 50, y: 60, size: 22}],
        },
      },
    ],
    quiz: [
      {id: 'david-goliath-q1', correctIndex: 1, ref: '1 Samuel/17/40'},
      {id: 'david-goliath-q2', correctIndex: 1, ref: '1 Samuel/17/45'},
      {id: 'david-goliath-q3', correctIndex: 1, ref: '1 Samuel/17/50'},
    ],
  },

  // ═══════════════════════ 6. Daniel en el foso de los leones ═══════════════════════
  {
    id: 'daniel-lions',
    testament: 'ot',
    passage: {book: 'Daniel', chapterStart: 6, chapterEnd: 6},
    scenes: [
      {
        id: 'daniel-lions-1',
        refs: ['Daniel/6/3'],
        art: {
          sky: SKY_SAND,
          ground: 'stone',
          decor: [],
          actors: [{emoji: '🧑', x: 50, y: 60, size: 20}],
        },
      },
      {
        id: 'daniel-lions-2',
        refs: ['Daniel/6/7'],
        art: {
          sky: SKY_SAND,
          ground: 'stone',
          decor: [],
          actors: [
            {emoji: '📜', x: 48, y: 54, size: 16},
            {emoji: '👑', x: 66, y: 58, size: 16},
          ],
        },
      },
      {
        id: 'daniel-lions-3',
        refs: ['Daniel/6/10'],
        art: {
          sky: SKY_GOLD,
          ground: 'stone',
          decor: ['sun'],
          actors: [{emoji: '🙏', x: 50, y: 58, size: 22}],
        },
      },
      {
        id: 'daniel-lions-4',
        refs: ['Daniel/6/16'],
        art: {
          sky: SKY_NIGHT,
          ground: 'stone',
          decor: ['moon'],
          actors: [
            {emoji: '🧑', x: 42, y: 54, size: 18},
            {emoji: '🦁', x: 60, y: 70, size: 20},
          ],
        },
      },
      {
        id: 'daniel-lions-5',
        refs: ['Daniel/6/21', 'Daniel/6/22'],
        art: {
          sky: SKY_DAWN,
          ground: 'stone',
          decor: ['sun'],
          actors: [
            {emoji: '🦁', x: 32, y: 66, size: 18},
            {emoji: '🦁', x: 62, y: 68, size: 18},
            {emoji: '🧑', x: 50, y: 52, size: 18},
          ],
        },
      },
    ],
    quiz: [
      {id: 'daniel-lions-q1', correctIndex: 1, ref: 'Daniel/6/10'},
      {id: 'daniel-lions-q2', correctIndex: 0, ref: 'Daniel/6/16'},
      {id: 'daniel-lions-q3', correctIndex: 1, ref: 'Daniel/6/22'},
    ],
  },

  // ═══════════════════════ 7. Jonás y el gran pez ═══════════════════════
  {
    id: 'jonah',
    testament: 'ot',
    passage: {book: 'Jonah', chapterStart: 1, chapterEnd: 3},
    scenes: [
      {
        id: 'jonah-1',
        refs: ['Jonah/1/3'],
        art: {
          sky: SKY_DAY,
          ground: 'water',
          decor: ['waves'],
          actors: [
            {emoji: '⛵', x: 55, y: 54, size: 24},
            {emoji: '🧑', x: 50, y: 48, size: 12},
          ],
        },
      },
      {
        id: 'jonah-2',
        refs: ['Jonah/1/4', 'Jonah/1/12'],
        art: {
          sky: SKY_STORM,
          ground: 'water',
          decor: ['rain', 'waves', 'clouds'],
          actors: [{emoji: '⛵', x: 50, y: 54, size: 22}],
        },
      },
      {
        id: 'jonah-3',
        refs: ['Jonah/1/17'],
        art: {
          sky: SKY_DEEP,
          ground: 'water',
          decor: ['waves'],
          actors: [{emoji: '🐋', x: 50, y: 58, size: 30}],
        },
      },
      {
        id: 'jonah-4',
        refs: ['Jonah/2/1', 'Jonah/3/1', 'Jonah/3/2'],
        art: {
          sky: SKY_SAND,
          ground: 'sand',
          decor: ['sun'],
          actors: [{emoji: '🙏', x: 50, y: 60, size: 20}],
        },
      },
      {
        id: 'jonah-5',
        refs: ['Jonah/3/5', 'Jonah/3/10'],
        art: {
          sky: SKY_GOLD,
          ground: 'sand',
          decor: ['sun'],
          actors: [
            {emoji: '🏙️', x: 50, y: 58, size: 22},
            {emoji: '🙌', x: 32, y: 70, size: 14},
          ],
        },
      },
    ],
    quiz: [
      {id: 'jonah-q1', correctIndex: 1, ref: 'Jonah/1/3'},
      {id: 'jonah-q2', correctIndex: 0, ref: 'Jonah/1/17'},
      {id: 'jonah-q3', correctIndex: 1, ref: 'Jonah/3/5'},
    ],
  },

  // ═══════════════════════ 8. El nacimiento de Jesús ═══════════════════════
  {
    id: 'jesus-birth',
    testament: 'nt',
    passage: {book: 'Luke', chapterStart: 2, chapterEnd: 2},
    scenes: [
      {
        id: 'jesus-birth-1',
        refs: ['Luke/2/4', 'Luke/2/5'],
        art: {
          sky: SKY_DUSK,
          ground: 'sand',
          decor: ['stars'],
          actors: [
            {emoji: '🧑', x: 32, y: 64, size: 18},
            {emoji: '🤰', x: 48, y: 64, size: 18},
            {emoji: '🫏', x: 62, y: 70, size: 16},
          ],
        },
      },
      {
        id: 'jesus-birth-2',
        refs: ['Luke/2/7'],
        art: {
          sky: SKY_NIGHT,
          ground: 'stone',
          decor: ['stars', 'moon'],
          actors: [
            {emoji: '👶', x: 50, y: 66, size: 16},
            {emoji: '🌟', x: 50, y: 28, size: 20},
          ],
        },
      },
      {
        id: 'jesus-birth-3',
        refs: ['Luke/2/10', 'Luke/2/11'],
        art: {
          sky: SKY_NIGHT,
          ground: 'grass',
          decor: ['stars'],
          actors: [
            {emoji: '👼', x: 50, y: 34, size: 22},
            {emoji: '🧑‍🌾', x: 32, y: 70, size: 18},
            {emoji: '🐑', x: 62, y: 76, size: 14},
          ],
        },
      },
      {
        id: 'jesus-birth-4',
        refs: ['Luke/2/16'],
        art: {
          sky: SKY_NIGHT,
          ground: 'stone',
          decor: ['stars'],
          actors: [
            {emoji: '🧑‍🌾', x: 32, y: 64, size: 16},
            {emoji: '👶', x: 56, y: 68, size: 14},
          ],
        },
      },
      {
        id: 'jesus-birth-5',
        refs: ['Luke/2/20'],
        art: {
          sky: SKY_DAWN,
          ground: 'grass',
          decor: ['sun'],
          actors: [{emoji: '🙌', x: 50, y: 60, size: 22}],
        },
      },
    ],
    quiz: [
      {id: 'jesus-birth-q1', correctIndex: 1, ref: 'Luke/2/7'},
      {id: 'jesus-birth-q2', correctIndex: 0, ref: 'Luke/2/10'},
      {id: 'jesus-birth-q3', correctIndex: 1, ref: 'Luke/2/20'},
    ],
  },

  // ═══════════════════════ 9. El buen samaritano ═══════════════════════
  {
    id: 'good-samaritan',
    testament: 'nt',
    passage: {book: 'Luke', chapterStart: 10, chapterEnd: 10},
    scenes: [
      {
        id: 'good-samaritan-1',
        refs: ['Luke/10/29'],
        art: {
          sky: SKY_SAND,
          ground: 'sand',
          decor: ['sun'],
          actors: [{emoji: '🧑', x: 50, y: 60, size: 20}],
        },
      },
      {
        id: 'good-samaritan-2',
        refs: ['Luke/10/30'],
        art: {
          sky: SKY_DUSK,
          ground: 'stone',
          decor: [],
          actors: [{emoji: '🧑', x: 50, y: 68, size: 16}],
        },
      },
      {
        id: 'good-samaritan-3',
        refs: ['Luke/10/31', 'Luke/10/32'],
        art: {
          sky: SKY_SAND,
          ground: 'stone',
          decor: [],
          actors: [
            {emoji: '🧑', x: 50, y: 70, size: 14},
            {emoji: '🚶', x: 28, y: 54, size: 16},
            {emoji: '🚶', x: 72, y: 54, size: 16},
          ],
        },
      },
      {
        id: 'good-samaritan-4',
        refs: ['Luke/10/33', 'Luke/10/34'],
        art: {
          sky: SKY_SAND,
          ground: 'stone',
          decor: ['sun'],
          actors: [
            {emoji: '🧑', x: 50, y: 70, size: 14},
            {emoji: '🧎', x: 44, y: 60, size: 18},
          ],
        },
      },
      {
        id: 'good-samaritan-5',
        refs: ['Luke/10/36', 'Luke/10/37'],
        art: {
          sky: SKY_GOLD,
          ground: 'grass',
          decor: ['sun'],
          actors: [{emoji: '🤝', x: 50, y: 60, size: 22}],
        },
      },
    ],
    quiz: [
      {id: 'good-samaritan-q1', correctIndex: 0, ref: 'Luke/10/31'},
      {id: 'good-samaritan-q2', correctIndex: 1, ref: 'Luke/10/33'},
      {id: 'good-samaritan-q3', correctIndex: 0, ref: 'Luke/10/37'},
    ],
  },

  // ═══════════════════════ 10. ¡Jesús vive! ═══════════════════════
  {
    id: 'resurrection',
    testament: 'nt',
    passage: {book: 'Matthew', chapterStart: 27, chapterEnd: 28},
    scenes: [
      {
        id: 'resurrection-1',
        refs: ['Matthew/27/59', 'Matthew/27/60'],
        art: {
          sky: SKY_DUSK,
          ground: 'stone',
          decor: [],
          actors: [{emoji: '🪨', x: 50, y: 58, size: 24}],
        },
      },
      {
        id: 'resurrection-2',
        refs: ['Matthew/28/1'],
        art: {
          sky: SKY_DAWN,
          ground: 'stone',
          decor: ['sun'],
          actors: [
            {emoji: '👩', x: 40, y: 64, size: 18},
            {emoji: '👩', x: 56, y: 64, size: 18},
          ],
        },
      },
      {
        id: 'resurrection-3',
        refs: ['Matthew/28/5', 'Matthew/28/6'],
        art: {
          sky: SKY_GOLD,
          ground: 'stone',
          decor: ['rays', 'sun'],
          actors: [{emoji: '👼', x: 50, y: 48, size: 22}],
        },
      },
      {
        id: 'resurrection-4',
        refs: ['Matthew/28/8', 'Matthew/28/9'],
        art: {
          sky: SKY_GOLD,
          ground: 'grass',
          decor: ['sun', 'rays'],
          actors: [{emoji: '🙌', x: 50, y: 58, size: 22}],
        },
      },
      {
        id: 'resurrection-5',
        refs: ['Matthew/28/10'],
        art: {
          sky: SKY_GOLD,
          ground: 'grass',
          decor: ['sun'],
          actors: [{emoji: '📣', x: 50, y: 60, size: 20}],
        },
      },
    ],
    quiz: [
      {id: 'resurrection-q1', correctIndex: 0, ref: 'Matthew/28/6'},
      {id: 'resurrection-q2', correctIndex: 0, ref: 'Matthew/28/8'},
      {id: 'resurrection-q3', correctIndex: 1, ref: 'Matthew/28/10'},
    ],
  },
];

const BY_ID: ReadonlyMap<string, KidsStory> = new Map(
  KIDS_STORIES.map(s => [s.id, s]),
);

export function getKidsStory(id: string): KidsStory | undefined {
  return BY_ID.get(id);
}
