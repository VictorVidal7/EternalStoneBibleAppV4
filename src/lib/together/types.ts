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
 * The decoded bundle. A discriminated union (by `t`) that grows as later
 * sprints add custom plans / shared studies / baked calendars.
 */
export type TogetherBundle = SharedPlanBundle;

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
