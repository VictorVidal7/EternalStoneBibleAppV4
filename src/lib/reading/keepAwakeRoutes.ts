/**
 * 🔆 keepAwakeRoutes — which screens honor the "keep screen on" setting.
 *
 * The reader, the study tools, the memorization drills and the guided prayer
 * are the LONG-DWELL screens where a reader holds the phone still — exactly
 * where the OS screen-timeout interrupts them (UX review: "keep the screen
 * from locking"). When the user enables the setting, the screen is held awake
 * only on these routes, so the rest of the app keeps the OS battery behavior.
 *
 * This is the audio wake-lock's read-only sibling: audio already holds the
 * screen awake WHILE narrating ([[keepAwake]]); this covers silent reading and
 * uses its OWN tag so the two locks are independent.
 *
 * Pure (no React/RN) so the route policy is unit-tested in isolation.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

/** expo-keep-awake tag for the reading/study/memory/prayer wake-lock. */
export const READING_KEEP_AWAKE_TAG = 'essb-reading-keep-awake';

/**
 * Route prefixes (expo-router pathnames) on which the setting holds the screen
 * awake: the chapter reader plus the study, memorization and prayer families.
 */
const KEEP_AWAKE_ROUTE_PREFIXES: readonly string[] = [
  '/verse/', // the chapter reader
  '/features/study', // study mode + study-shared
  '/features/word-study',
  '/features/constellation',
  '/features/reference-chain',
  '/features/memory', // memorize & write practice
  '/features/prayer', // guided prayer + journal
  '/features/lectio',
  '/features/prep', // prep table
  '/features/devotional',
];

/**
 * Whether the keep-awake setting should hold the screen on for this route.
 * Defensive: a null/undefined/empty pathname never keeps the screen awake.
 */
export function shouldKeepAwakeOnRoute(
  pathname: string | null | undefined,
): boolean {
  if (!pathname) return false;
  return KEEP_AWAKE_ROUTE_PREFIXES.some(prefix => pathname.startsWith(prefix));
}
