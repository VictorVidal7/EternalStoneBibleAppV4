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
 * Today's ACTS session: the four steps in order, each with the anchor chosen
 * deterministically for `date`. Pure — the screen resolves each anchor's text
 * from SQLite and renders the i18n prompt.
 */
export function buildActsSession(date: Date): ActsSessionStep[] {
  return ACTS_STEP_ORDER.map(step => {
    const meta = ACTS_STEPS[step];
    const idx = dailyIndex(meta.anchors.length, date, STEP_SALT[step]);
    return {step, meta, anchor: meta.anchors[idx]};
  });
}
