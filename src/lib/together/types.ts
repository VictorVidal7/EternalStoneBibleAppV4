/**
 * 🤝 "Juntos sin servidor" — shared bundle types (Sprint 107).
 *
 * The whole community layer is **peer-to-peer**: a bundle is encoded into a
 * deep link / short code that the creator sends through their OWN channels
 * (WhatsApp, email). We never store it nor show one user's content to another,
 * so there is **no backend, no cost, and no moderation surface** (see
 * DOCS/COMMUNITY_DESIGN.md §9.1). The receiving app decodes the bundle and
 * follows the plan **locally**, each member with private progress.
 *
 * This file declares the bundle shape. `bundle.ts` implements the codec.
 * Future payload types (custom plan, shared study, baked calendar) extend the
 * `TogetherBundle` union here, sprint by sprint.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

/** Bundle format version. Bump only on a breaking change. */
export const TOGETHER_BUNDLE_VERSION = 1;

/** Max length of a creator-typed group label (sanitized, plain text). */
export const GROUP_NAME_MAX = 40;

/** Max length of a creator-typed custom-plan name (sanitized, plain text). */
export const PLAN_NAME_MAX = 60;

/** Caps that bound a decoded custom plan (untrusted input — Sprint 108). */
export const MAX_PLAN_DAYS = 400;
export const MAX_DAY_READINGS = 50;
export const MAX_PLAN_READINGS = 1500;
/** A reading's book id is the canonical 1..66 Bible book number. */
export const BOOK_ID_MAX = 66;
/** A reading's chapter, bounded above the largest real book (Psalms = 150). */
export const CHAPTER_MAX = 150;
/** A verse number, bounded above the longest chapter (Psalm 119 = 176). */
export const VERSE_MAX = 200;

/** Caps that bound a decoded baked devotional calendar (untrusted — Sprint 110). */
export const CAL_TITLE_MAX = 60;
/** Max characters of one day's short note. */
export const CAL_NOTE_MAX = 280;
/** Max total characters across every day's note (bounds the whole link). */
export const CAL_NOTES_TOTAL_MAX = 12000;
/** Max number of days a baked calendar can carry (~6 months of devotionals). */
export const MAX_CAL_DAYS = 184;

/** Caps that bound a decoded shared study (untrusted input — Sprint 109). */
export const STUDY_TITLE_MAX = 80;
/** Max characters of one section's note (the teacher's prose). */
export const STUDY_NOTE_MAX = 4000;
/** Max total characters across all notes (bounds the whole payload). */
export const STUDY_NOTES_TOTAL_MAX = 20000;
/** Max number of note entries (the prep outline has 7; allow head-room). */
export const STUDY_NOTE_KEYS_MAX = 20;
/** Max length of a note's section-key. */
export const STUDY_KEY_MAX = 24;

/**
 * A shared **curated** reading plan (Sprint 107). The members all follow the
 * SAME curated plan (one of the bundled, reviewed plans) starting on the SAME
 * calendar date, so everyone's "Day N" lines up — "leer juntos" with zero
 * runtime data flow.
 */
export interface SharedPlanBundle {
  /** Format version. */
  v: number;
  /** Discriminant. */
  t: 'plan';
  /** Curated plan id, e.g. `'nt-30'`. */
  p: string;
  /** Agreed start date, ISO calendar date `YYYY-MM-DD`. */
  s: string;
  /** Optional group label (creator's free text, already sanitized). */
  g?: string;
}

/**
 * A single chapter reading inside a custom plan: the tuple `[bookId, chapter]`,
 * whole chapters only (Sprint 108). Stored as a numeric book id (not a name) so
 * it resolves identically in any UI/version language, and stays compact in the
 * link.
 */
export type CustomReading = [bookId: number, chapter: number];

/**
 * A user-built **custom** reading plan (Sprint 108). Unlike {@link
 * SharedPlanBundle} (which only names one of the curated plans), this carries
 * the WHOLE plan — its name and the chapters of every day — self-contained in
 * the link, so the catalogue can be extended peer-to-peer with zero backend.
 * Bounded by the `MAX_*` caps above since it arrives as untrusted input.
 */
export interface CustomPlanBundle {
  /** Format version. */
  v: number;
  /** Discriminant. */
  t: 'cplan';
  /** Plan name (creator's free text, already sanitized). */
  n: string;
  /** Days, each an ordered list of chapter readings. */
  d: CustomReading[][];
}

/**
 * A shared **study** — a teacher's "Mesa de preparación" outline (Sprint 109),
 * carried READ-ONLY peer-to-peer. The bundle holds only the passage + the
 * teacher's own prose per outline section; the curated helps (cross-refs, Christ
 * notes, themes, book intro) are NOT shipped — the recipient's app re-assembles
 * them from the same passage, in the recipient's own language. `n` is kept a
 * generic `{sectionKey: note}` map so the codec stays domain-free; the viewer
 * renders only the keys it knows.
 */
export interface StudyBundle {
  /** Format version. */
  v: number;
  /** Discriminant. */
  t: 'study';
  /** Book id (1..66). */
  b: number;
  /** Chapter. */
  c: number;
  /** Start verse. */
  sv: number;
  /** End verse (>= start). */
  ev: number;
  /** Optional title / attribution the teacher typed (sanitized). */
  ti?: string;
  /** The teacher's prose per outline section (already sanitized). */
  n: Record<string, string>;
}

/**
 * One day of a baked devotional calendar (Sprint 110): a single verse reference
 * `[bookId, chapter, verse]` and an optional short note from the creator. Stored
 * as a numeric tuple (not a name) so it resolves identically in any UI/version
 * language and stays compact in the link.
 */
export interface CalReading {
  /** `[bookId(1..66), chapter, verse]`. */
  r: [bookId: number, chapter: number, verse: number];
  /** Optional short note for the day (already sanitized). */
  n?: string;
}

/**
 * A baked **devotional calendar** (Sprint 110) — the LAST of the four
 * "juntos sin servidor" community capabilities. A creator hand-picks a verse
 * (plus an optional short reflection) for each of N consecutive days and bakes
 * the whole sequence into ONE shareable link, with an agreed start date. Anyone
 * who opens it sees the SAME verse for the SAME calendar day (today = start +
 * elapsed days), 100% offline, zero backend/cost. The verse text itself is NOT
 * shipped — only the reference — so each recipient reads it in their OWN Bible
 * version; only the creator's notes travel. Bounded by the `CAL_*` / `MAX_CAL_*`
 * caps above since it arrives as untrusted input.
 */
export interface CalBundle {
  /** Format version. */
  v: number;
  /** Discriminant. */
  t: 'cal';
  /** Agreed start date, ISO calendar date `YYYY-MM-DD` (day 1). */
  s: string;
  /** Optional title / attribution the creator typed (sanitized). */
  ti?: string;
  /** Days in order; day index `i` falls on `s + i` days. */
  d: CalReading[];
}

/**
 * The decoded bundle. A discriminated union (by `t`) covering every community
 * capability: shared curated plan, custom plan, shared study, baked calendar.
 */
export type TogetherBundle =
  SharedPlanBundle | CustomPlanBundle | StudyBundle | CalBundle;

/** Why a decode failed — drives a friendly, localized message in the UI. */
export type DecodeFailure =
  /** Not a well-formed bundle (bad base64/JSON/shape). */
  | 'format'
  /** Encoded by a NEWER app version we can't read — ask the user to update. */
  | 'version'
  /** A known bundle type we don't support on this build yet. */
  | 'unsupported'
  /** A plan id / token that doesn't match any plan this build ships. */
  | 'unknown-plan';

export type DecodeResult =
  {ok: true; bundle: TogetherBundle} | {ok: false; reason: DecodeFailure};
