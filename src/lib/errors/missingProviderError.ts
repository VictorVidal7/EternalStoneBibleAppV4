/**
 * Recognizes the "you rendered a hook outside its Provider" error that every
 * context in this app throws when its Provider is absent from the tree.
 *
 * Why this exists (R9-14): `firebase.json` serves a catch-all SPA rewrite, so
 * every route under `app/` is reachable by direct URL on the deployed web
 * site — including the ~7 that the reduced web nav never links to and that
 * call `useAuth` / `useReadingProgress` / `useReadingPlanProgress` /
 * `useCustomPlans` / `useTogether` / `useDonationSheet`. `app/_layout.web.tsx`
 * deliberately does not mount those Providers: they carry native-only
 * dependencies (chiefly `@react-native-firebase/*`, which T20 found throws on
 * web) and the web build is a read-only reader shell by design.
 *
 * So those routes cannot work on web, and that is a product decision rather
 * than a defect. What WAS a defect is what the user saw: a generic "Algo
 * salió mal" screen whose only button re-rendered the same route and threw
 * again. Telling them plainly that the section is Android-only, and handing
 * them a way back to the Bible, is both honest and actionable.
 *
 * Matched on the message rather than an error subclass on purpose: those
 * contexts throw plain `Error`s with hand-written strings, and changing all
 * of them to a custom class would be a far wider edit than this fix warrants.
 * The tradeoff is that a context whose message ever stops matching silently
 * falls back to the generic screen — never to a crash — and
 * `missingProviderError.test.ts` pins every current message, read out of the
 * real hooks, so that drift fails a test instead of reaching a user.
 *
 * R9-68: matching the message is NOT the same as matching ANY message of that
 * shape, which is what this used to do (`\w*Provider`). Two families of
 * legitimate error were being swept up and presented to the user as a
 * deliberate product decision:
 *
 *   - expo-router's own internals. `useFrameSize` throws "must be used within
 *     a FrameSizeProvider", and two more end with the words "This is likely a
 *     bug in Expo Router." A library bug became "this section is not in the
 *     web version" — an affirmative, wrong explanation — with the retry
 *     button taken away.
 *   - Every provider the web tree DOES mount (ReaderPreferences, BibleVersion,
 *     Toast, Premium, Favorites, MemoryDeck, OfferingSheet, AudioPlayer). If
 *     one of those throws it is a real bug in the web tree, and the user needs
 *     the generic screen WITH its retry.
 *
 * So the provider NAME now has to be one this tree knowingly leaves out. The
 * escape hatch shrinks from "anything ending in Provider" to a list that a
 * test cross-checks against what app/_layout.web.tsx actually mounts.
 */

/**
 * The providers `app/_layout.web.tsx` deliberately does not mount, by the
 * exact name their hook puts in the message. Being on this list is what makes
 * "this section is not in the web version" a TRUE statement rather than a
 * guess.
 *
 * `ServicesProvider` is deliberately absent even though it is also unmounted:
 * `useServices`'s `createContext` default is a real object, not `undefined`,
 * so it never throws and an entry here would be unreachable.
 */
export const WEB_UNMOUNTED_PROVIDERS: ReadonlySet<string> = new Set([
  'AuthProvider',
  'CustomPlansProvider',
  'DonationSheetProvider',
  'ReadingPlanProgressProvider',
  'ReadingProgressProvider',
  'SyncEngineProvider',
  'TogetherProvider',
]);

/**
 * Deliberately loose about the article ("a", "an", or nothing) and about
 * anything trailing the Provider name: `useReadingProgress`'s message
 * continues past it with a second sentence.
 */
const MISSING_PROVIDER_PATTERN =
  /must be used within\s+(?:an?\s+)?(\w+Provider)\b/;

export function isMissingProviderError(error: unknown): boolean {
  if (!error) return false;
  const message =
    error instanceof Error
      ? error.message
      : (error as {message?: unknown})?.message;
  if (typeof message !== 'string') return false;
  const match = MISSING_PROVIDER_PATTERN.exec(message);
  return !!match && WEB_UNMOUNTED_PROVIDERS.has(match[1]);
}
