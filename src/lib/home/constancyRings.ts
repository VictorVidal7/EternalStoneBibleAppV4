/**
 * 🔵 CONSTANCY RINGS — pure derivation for the Apple-Watch-style "Tu
 * constancia hoy" rings on Home (Sprint 85).
 *
 * COMPOSES the four daily-habit signals the app ALREADY tracks — reading,
 * memorization practice, devotion, and the emotional check-in — into four
 * concentric rings that "close" as today's goal for each is met. Each habit's
 * own store decides whether today is done (and, for the graded habits, how far
 * along), so this module never reaches for a clock or storage: the caller
 * injects already-computed per-habit progress and this turns it into ring
 * geometry + a summary ("3 of 4 closed today").
 *
 * Pure and React-free, like [[homeGreeting]] / [[dailyVerseHistory]], so it
 * unit-tests deterministically and the view only renders what it returns. The
 * ring colors live here (not the component) so the share image (Sprint 85 T4)
 * paints the exact same hues.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

/** The four daily habits, in fixed render order (outermost ring first). */
export type HabitKey = 'reading' | 'memory' | 'devotion' | 'mood';

/** Render order — outermost ring is `reading`, innermost is `mood`. */
export const HABIT_ORDER: readonly HabitKey[] = [
  'reading',
  'memory',
  'devotion',
  'mood',
];

/**
 * Semantic, theme-independent ring colors — one vivid hue per habit so four
 * nested rings stay legible in both light and dark (Apple-Watch rings keep
 * their color across appearances). Distinct from the themed `colors.primary`
 * on purpose: the rings encode WHICH habit, not the active theme.
 */
export const HABIT_RING_COLORS: Record<HabitKey, string> = {
  reading: '#6366f1', // indigo
  memory: '#10b981', // emerald
  devotion: '#f59e0b', // amber (the devotion flame)
  mood: '#f472b6', // rose (matches the S84 "Tu corazón" gradient)
};

/** One habit's progress toward today's goal — injected by the caller. */
export interface HabitProgress {
  key: HabitKey;
  /** Today's target reached (the ring fully closes). */
  done: boolean;
  /** Progress toward today's target, 0..1. Binary habits pass `done ? 1 : 0`. */
  fraction: number;
  /** Current streak in days for the legend sub-line; 0 when none. */
  streak: number;
}

/** A habit's progress after clamping — what the view renders. */
export interface RingState extends HabitProgress {
  /** `fraction` clamped to [0, 1]. */
  fraction: number;
}

/** The whole rings state, computed in one pass. */
export interface ConstancySummary {
  /** Ring states in {@link HABIT_ORDER}. */
  rings: RingState[];
  /** How many habits are done today (closed rings). */
  closedCount: number;
  /** Total rings (always {@link HABIT_ORDER}.length once built). */
  total: number;
  /** Every habit done today — the "all rings closed" celebration. */
  allClosed: boolean;
  /** Any progress at all today (used for an honest "started" gate). */
  anyActivity: boolean;
}

/** Clamp a possibly-NaN/out-of-range fraction into [0, 1]. */
export function clampFraction(n: number): number {
  if (!Number.isFinite(n) || n <= 0) return 0;
  if (n >= 1) return 1;
  return n;
}

/** Coerce a possibly-missing streak into a finite, non-negative integer. */
function safeStreak(n: number): number {
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.floor(n);
}

/**
 * Build the rings summary from the four injected habit signals. Always returns
 * exactly the habits in {@link HABIT_ORDER} (missing inputs degrade to an open
 * ring) so the view never has to guard for a gap, and the order is stable for
 * the concentric layout. A habit counts as "closed" when its caller says it is
 * `done` — a graded ring can read `fraction === 1` without being `done` only
 * if the caller intends that, but in practice `done` and `fraction >= 1` agree.
 */
export function buildConstancySummary(
  inputs: readonly HabitProgress[],
): ConstancySummary {
  const byKey = new Map<HabitKey, HabitProgress>();
  for (const input of inputs) {
    if (input && HABIT_RING_COLORS[input.key]) byKey.set(input.key, input);
  }

  const rings: RingState[] = HABIT_ORDER.map(key => {
    const input = byKey.get(key);
    return {
      key,
      done: input?.done === true,
      fraction: input ? clampFraction(input.fraction) : 0,
      streak: input ? safeStreak(input.streak) : 0,
    };
  });

  const closedCount = rings.filter(r => r.done).length;
  const anyActivity = rings.some(r => r.fraction > 0 || r.streak > 0 || r.done);

  return {
    rings,
    closedCount,
    total: rings.length,
    allClosed: closedCount === rings.length,
    anyActivity,
  };
}

/**
 * The dp radius of the ring at `index` (0 = outermost) for a square SVG of
 * `size`, where each ring is `strokeWidth` thick with `gap` dp of clear space
 * between consecutive rings. Pure geometry so the view stays declarative and
 * the spacing is unit-tested.
 */
export function ringRadius(
  index: number,
  size: number,
  strokeWidth: number,
  gap: number,
): number {
  const outer = (size - strokeWidth) / 2;
  return outer - index * (strokeWidth + gap);
}

/** Circumference of a ring of the given radius. */
export function ringCircumference(radius: number): number {
  return 2 * Math.PI * radius;
}

/**
 * The `strokeDashoffset` that paints `fraction` of a ring of the given
 * circumference, measured from the 12-o'clock start (the view rotates the arc
 * -90°). fraction 0 → full offset (empty), fraction 1 → 0 (closed).
 */
export function ringDashoffset(
  circumference: number,
  fraction: number,
): number {
  return circumference * (1 - clampFraction(fraction));
}
