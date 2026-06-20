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
 * The decoded bundle. A discriminated union (by `t`) that grows as later
 * sprints add shared studies / baked calendars.
 */
export type TogetherBundle = SharedPlanBundle | CustomPlanBundle;

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
  | {ok: true; bundle: TogetherBundle}
  | {ok: false; reason: DecodeFailure};
