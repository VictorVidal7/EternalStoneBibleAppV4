/**
 * 🙏 acts — the guided ACTS prayer session content (Sprint 93).
 *
 * ACTS is the historic teaching shape for a balanced prayer life — Adoration,
 * Confession, Thanksgiving, Supplication — and this is the curated, PURE
 * content for walking it one calm step at a time: each step carries a small set
 * of scripture ANCHORS (canonical "Book/Chapter/Verse" keys, the SAME form as
 * [[themes]] / [[feelings]]) so the reader prays in the light of the Word, not
 * a bare prompt. The gentle prompt text lives in i18n (`t.prayer.acts[step]`),
 * keyed by step id, exactly like the feelings prompts.
 *
 * The anchor for each step is chosen DETERMINISTICALLY by day-of-year (pure
 * [[dailyLight]] rotation), with a distinct salt per step so the four don't all
 * advance in lockstep — every reader prays the same anchors on the same day,
 * and they refresh tomorrow. Verse text is resolved from SQLite by the screen.
 *
 * Each step maps to a {@link PrayerCategory} so a supplication prayed here can
 * be offered straight into the journal in the right category. NOT synced.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import {dailyIndex} from '@/features/daily-light/dailyLight';
import type {ThemeRefKey} from '@/features/study/themes';
import type {PrayerCategory} from './prayer';

/** The four movements of ACTS, in fixed walking order. */
export type ActsStep =
  | 'adoration'
  | 'confession'
  | 'thanksgiving'
  | 'supplication';

export const ACTS_STEP_ORDER: readonly ActsStep[] = [
  'adoration',
  'confession',
  'thanksgiving',
  'supplication',
];

/**
 * Which movement the reader opens with. The default ACTS shape leads with
 * ADORATION — the model of the Lord's Prayer ("hallowed be your name" first)
 * and of Isaiah 6, where beholding God's holiness is what awakens confession.
 * But a burdened heart may rightly draw near by CONFESSING first — the tax
 * collector's "God, be merciful to me, a sinner" (Luke 18:13), whom the Lord
 * declared justified, and the penitential psalms (Psalm 51). So the reader
 * chooses the entry each session; only the first two movements swap, while
 * Thanksgiving and Supplication always follow. Both orders are faithful.
 */
export type ActsStartChoice = 'adoration' | 'confession';

/** The four movements ordered for the reader's chosen entry point. */
export function actsStepOrder(
  startWith: ActsStartChoice = 'adoration',
): readonly ActsStep[] {
  return startWith === 'confession'
    ? ['confession', 'adoration', 'thanksgiving', 'supplication']
    : ACTS_STEP_ORDER;
}

export interface ActsStepMeta {
  id: ActsStep;
  /** Ionicons glyph for the step header. */
  icon: string;
  /** Accent hue (hex), aligned with the matching journal category. */
  accent: string;
  /** The journal category this step's prayer maps to. */
  category: PrayerCategory;
  /** Curated scripture anchors for this movement (canonical refs, no ranges). */
  anchors: readonly ThemeRefKey[];
}

/**
 * The ACTS content. Anchors are well-known passages that frame each movement:
 * Adoration on who God is, Confession on His cleansing, Thanksgiving on His
 * goodness, Supplication on His invitation to ask. Each list is validated
 * against the canonical book table in the test.
 */
export const ACTS_STEPS: Record<ActsStep, ActsStepMeta> = {
  adoration: {
    id: 'adoration',
    icon: 'sparkles',
    accent: '#f59e0b',
    category: 'praise',
    anchors: [
      'Psalms/95/6',
      'Psalms/145/3',
      'Psalms/8/1',
      'Revelation/4/11',
      'Psalms/103/1',
      '1 Chronicles/29/11',
      'Psalms/96/4',
      'Isaiah/6/3',
      'Psalms/100/3',
      'Psalms/29/2',
      'Psalms/34/3',
      'Psalms/48/1',
      'Psalms/86/10',
      'Psalms/93/1',
      'Psalms/99/5',
      'Psalms/113/3',
      'Psalms/145/8',
      'Psalms/146/2',
      'Psalms/150/6',
      'Isaiah/40/28',
      'Isaiah/57/15',
      'Revelation/5/13',
      'Nehemiah/9/6',
      'Deuteronomy/6/4',
      '1 Timothy/1/17',
      'Psalms/63/3',
    ],
  },
  confession: {
    id: 'confession',
    icon: 'water',
    accent: '#8b5cf6',
    category: 'confession',
    anchors: [
      '1 John/1/9',
      'Psalms/51/10',
      'Psalms/139/23',
      'Proverbs/28/13',
      'Psalms/32/5',
      'James/5/16',
      'Psalms/51/1',
      'Isaiah/55/7',
      'Psalms/51/2',
      'Psalms/51/3',
      'Psalms/51/17',
      'Psalms/38/18',
      'Psalms/103/12',
      'Psalms/130/3',
      'Psalms/130/4',
      'Isaiah/1/18',
      'Isaiah/43/25',
      '1 John/1/8',
      'Micah/7/19',
      'Joel/2/13',
      'Luke/18/13',
      'Romans/3/23',
      '2 Chronicles/7/14',
      'Psalms/34/18',
    ],
  },
  thanksgiving: {
    id: 'thanksgiving',
    icon: 'gift',
    accent: '#10b981',
    category: 'thanksgiving',
    anchors: [
      '1 Thessalonians/5/18',
      'Psalms/100/4',
      'Psalms/107/1',
      'Colossians/3/17',
      'Psalms/136/1',
      'Ephesians/5/20',
      'Psalms/103/2',
      'Psalms/118/1',
      'Psalms/9/1',
      'Psalms/30/12',
      'Psalms/34/1',
      'Psalms/95/2',
      'Psalms/105/1',
      'Psalms/107/8',
      'Psalms/116/12',
      'Psalms/138/1',
      'Psalms/139/14',
      'Lamentations/3/22',
      'Lamentations/3/23',
      'James/1/17',
      '2 Corinthians/9/15',
      '1 Chronicles/16/34',
      'Colossians/2/7',
      'Psalms/100/5',
    ],
  },
  supplication: {
    id: 'supplication',
    icon: 'hand-left',
    accent: '#6366f1',
    category: 'supplication',
    anchors: [
      'Philippians/4/6',
      'Matthew/7/7',
      'Hebrews/4/16',
      'John/15/7',
      'James/1/5',
      '1 John/5/14',
      'Matthew/6/8',
      '1 Thessalonians/5/17',
      'Psalms/55/22',
      'Psalms/62/8',
      'Psalms/121/1',
      'Psalms/145/18',
      'Matthew/7/8',
      'Mark/11/24',
      'Luke/11/9',
      'John/14/13',
      'John/16/24',
      'Romans/8/26',
      'Ephesians/3/20',
      'Philippians/4/19',
      'Hebrews/10/22',
      '1 Peter/5/7',
      'Jeremiah/33/3',
      'Psalms/50/15',
    ],
  },
};

/** Distinct day-rotation salts so the four anchors don't move in lockstep. */
const STEP_SALT: Record<ActsStep, number> = {
  adoration: 0,
  confession: 5,
  thanksgiving: 11,
  supplication: 17,
};

/** One step of today's session: its meta + the day's chosen anchor. */
export interface ActsSessionStep {
  step: ActsStep;
  meta: ActsStepMeta;
  /** The anchor ref chosen for `date` (canonical "Book/Chapter/Verse"). */
  anchor: ThemeRefKey;
}

/**
 * Today's ACTS session: the four movements in the reader's chosen order
 * ({@link actsStepOrder}; ADORATION-first by default), each with the anchor
 * chosen deterministically for `date`. The chosen entry only reorders the
 * walk — every movement keeps its OWN day-deterministic anchor, so the verses
 * a reader sees don't change with the start choice. Pure — the screen resolves
 * each anchor's text from SQLite and renders the i18n prompt.
 */
export function buildActsSession(
  date: Date,
  startWith: ActsStartChoice = 'adoration',
): ActsSessionStep[] {
  return actsStepOrder(startWith).map(step => {
    const meta = ACTS_STEPS[step];
    const idx = dailyIndex(meta.anchors.length, date, STEP_SALT[step]);
    return {step, meta, anchor: meta.anchors[idx]};
  });
}
