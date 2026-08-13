/**
 * 🏠 homeGreeting — PURE personalization for the Home hero (Sprint 71).
 *
 * The Home hero greeted everyone with a static "Welcome / your journey
 * continues". This turns the top of the screen into something that speaks to
 * the reader's CURRENT moment: a greeting by time of day + a single contextual
 * nudge derived from their state (an active reading streak → continue where
 * they left off → otherwise point at the verse of the day). Kept pure (no
 * React / clock / i18n) so the buckets + the priority are unit-tested in
 * isolation; the screen maps the result to localized copy.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

/** Part of the day, for the hero greeting. */
export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night';

/**
 * Bucket a 0–23 hour into a part of the day:
 *   morning 5–11 · afternoon 12–17 · evening 18–21 · night 22–4.
 * Out-of-range/NaN hours fall to 'night' (the safe late-hour default).
 */
export function timeOfDay(hour: number): TimeOfDay {
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 18) return 'afternoon';
  if (hour >= 18 && hour < 22) return 'evening';
  return 'night';
}

/** The contextual hero nudge. */
export type HomeNudge =
  {kind: 'streak'; days: number} | {kind: 'continue'} | {kind: 'daily'};

/**
 * Choose the single most motivating nudge for the hero subtitle, in priority
 * order: an active reading streak (celebrate momentum) → a place to continue
 * reading → otherwise nudge toward today's verse. Pure: the screen turns the
 * result into localized copy (interpolating the streak count / book name).
 */
export function homeNudge(input: {
  streak: number;
  hasLastRead: boolean;
}): HomeNudge {
  if (input.streak >= 1) return {kind: 'streak', days: input.streak};
  if (input.hasLastRead) return {kind: 'continue'};
  return {kind: 'daily'};
}
