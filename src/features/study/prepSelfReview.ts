/**
 * ✅ prepSelfReview — the PURE model for the preacher's own silent "Mesa de
 * preparación" self-review checklist (Tanda "autorrevisión antes de
 * predicar").
 *
 * A preacher who just finished writing an outline can run it against a fixed
 * set of STRUCTURAL questions before stepping into the pulpit — is there real
 * tension before the resolution, does every section serve the one Big Idea,
 * is the Christ connection specific to THIS passage, etc. Same guardrail as
 * [[prepTable]]/[[prepNotes]]: the app NEVER writes the sermon, never
 * generates passage-specific content, never puts words in the preacher's
 * mouth (cf. Jeremías 23:30-32). This checklist is deliberately CHECKBOX-ONLY
 * — no free-text field anywhere, not even optionally — so there is no surface
 * for the app to ever suggest an answer; the preacher answers each question
 * silently to himself, and only the fact that he looked at it is recorded.
 *
 * One `PrepSelfReview` per passage key ("John/3/16-21"), same key format as
 * [[prepNotes]]'s `PrepNotesMap`. Kept React-/storage-free (the
 * [[prepSelfReviewStore]] does the AsyncStorage I/O), mirroring
 * [[prepNotes]]/[[prepNotesStore]]. DEVICE-LOCAL and never leaves the phone —
 * never synced, never exported, never shared (see prepSelfReviewStore.ts's
 * own docstring for why this is stricter than prepNotes, which IS included
 * in the manual backup/export file).
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

/** The 14 questions, in display order (also doubles as the i18n key list —
 *  see `prepSelfReview` in `src/i18n/translations.ts`). */
export const PREP_SELF_REVIEW_QUESTION_IDS = [
  'tensionBeforeResolution',
  'oneMovement',
  'pointsTraceToText',
  'outsideIdeaDependency',
  'contextBeforeBigIdea',
  'bigIdeaOneSentence',
  'everySectionServesBigIdea',
  'christConnectionSpecific',
  'applicationConcrete',
  'applicationTiedToText',
  'applyToSelfFirst',
  'discussionQuestionsOpen',
  'rehearsedAloud',
  'sectionTiming',
] as const;

export type PrepSelfReviewQuestionId =
  (typeof PREP_SELF_REVIEW_QUESTION_IDS)[number];

/**
 * The 7 categories the 14 questions group under, in display order. `id`
 * doubles as an i18n key (`prepSelfReview.categories[id].label`) the same
 * way each question id does.
 */
export const PREP_SELF_REVIEW_CATEGORIES: ReadonlyArray<{
  id: string;
  questionIds: readonly PrepSelfReviewQuestionId[];
}> = [
  {
    id: 'narrativeStructure',
    questionIds: ['tensionBeforeResolution', 'oneMovement'],
  },
  {
    id: 'textFidelity',
    questionIds: [
      'pointsTraceToText',
      'outsideIdeaDependency',
      'contextBeforeBigIdea',
    ],
  },
  {
    id: 'bigIdeaUnity',
    questionIds: ['bigIdeaOneSentence', 'everySectionServesBigIdea'],
  },
  {id: 'christCentered', questionIds: ['christConnectionSpecific']},
  {
    id: 'application',
    questionIds: [
      'applicationConcrete',
      'applicationTiedToText',
      'applyToSelfFirst',
    ],
  },
  {id: 'discussionQuestions', questionIds: ['discussionQuestionsOpen']},
  {id: 'delivery', questionIds: ['rehearsedAloud', 'sectionTiming']},
];

/** What the preacher checked off for one passage. No free text — presence in
 *  `checkedIds` is the only signal this model ever stores. */
export interface PrepSelfReview {
  /** Which questions are checked, keyed by id. Unchecked ids are ABSENT
   *  (never stored as `false`) so an empty review serializes to `{}`. */
  checkedIds: Partial<Record<PrepSelfReviewQuestionId, true>>;
  /** Last-toggled epoch ms. */
  updatedAt: number;
}

/** The whole device-local store: passage key → the preacher's self-review. */
export type PrepSelfReviewMap = Record<string, PrepSelfReview>;

/** A fresh, empty self-review object. */
export function emptyPrepSelfReview(): PrepSelfReview {
  return {checkedIds: {}, updatedAt: 0};
}

/** True when nothing has been checked yet. */
export function isPrepSelfReviewEmpty(
  review: PrepSelfReview | null | undefined,
): boolean {
  if (!review) return true;
  return Object.keys(review.checkedIds).length === 0;
}

/**
 * Set one question's checked state, returning a NEW review object (immutable
 * update). Unchecking removes the key from `checkedIds` entirely — it's
 * never stored as `false` — so `isPrepSelfReviewEmpty` stays honest.
 * `updatedAt` advances to `now`.
 */
export function setQuestionChecked(
  review: PrepSelfReview,
  id: PrepSelfReviewQuestionId,
  checked: boolean,
  now: number = Date.now(),
): PrepSelfReview {
  const checkedIds = {...review.checkedIds};
  if (checked) {
    checkedIds[id] = true;
  } else {
    delete checkedIds[id];
  }
  return {checkedIds, updatedAt: now};
}

/**
 * Coerce an unknown value into a clean `PrepSelfReview` (drops bad fields).
 * Any id not in `PREP_SELF_REVIEW_QUESTION_IDS` is dropped — corruption or a
 * future app version's new question this build doesn't know about never
 * survives the round trip.
 */
function coercePrepSelfReview(value: unknown): PrepSelfReview | null {
  if (!value || typeof value !== 'object') return null;
  const raw = value as {checkedIds?: unknown; updatedAt?: unknown};
  const checkedIds: Partial<Record<PrepSelfReviewQuestionId, true>> = {};
  if (raw.checkedIds && typeof raw.checkedIds === 'object') {
    for (const key of Object.keys(raw.checkedIds as Record<string, unknown>)) {
      if (
        (PREP_SELF_REVIEW_QUESTION_IDS as readonly string[]).includes(key) &&
        (raw.checkedIds as Record<string, unknown>)[key] === true
      ) {
        checkedIds[key as PrepSelfReviewQuestionId] = true;
      }
    }
  }
  const updatedAt =
    typeof raw.updatedAt === 'number' && Number.isFinite(raw.updatedAt)
      ? raw.updatedAt
      : 0;
  return {checkedIds, updatedAt};
}

/**
 * Parse the persisted JSON map, tolerating corruption: a bad blob, a
 * non-object root, or any malformed entry yields an empty (or partial) map
 * rather than a throw — the preacher should never lose the whole store to
 * one bad row.
 */
export function parsePrepSelfReviewMap(
  raw: string | null | undefined,
): PrepSelfReviewMap {
  if (!raw) return {};
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return {};
  }
  if (!parsed || typeof parsed !== 'object') return {};
  const map: PrepSelfReviewMap = {};
  for (const [key, value] of Object.entries(
    parsed as Record<string, unknown>,
  )) {
    const review = coercePrepSelfReview(value);
    if (review && !isPrepSelfReviewEmpty(review)) map[key] = review;
  }
  return map;
}

/** Serialize the map for storage. */
export function serializePrepSelfReviewMap(map: PrepSelfReviewMap): string {
  return JSON.stringify(map);
}

/**
 * Apply a checkbox toggle to the map under `passageKey`, returning a NEW
 * map. A toggle that unchecks the last-checked question drops the passage
 * entry entirely, so the store doesn't accumulate hollow rows.
 */
export function setMapQuestionChecked(
  map: PrepSelfReviewMap,
  passageKey: string,
  id: PrepSelfReviewQuestionId,
  checked: boolean,
  now: number = Date.now(),
): PrepSelfReviewMap {
  const current = map[passageKey] ?? emptyPrepSelfReview();
  const next = setQuestionChecked(current, id, checked, now);
  const out = {...map};
  if (isPrepSelfReviewEmpty(next)) {
    delete out[passageKey];
  } else {
    out[passageKey] = next;
  }
  return out;
}
