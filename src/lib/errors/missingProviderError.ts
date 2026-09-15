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
 * Matched on the message rather than an error subclass on purpose: the six
 * contexts throw plain `Error`s with hand-written strings, and changing all
 * of them to a custom class would be a far wider edit than this fix warrants.
 * The tradeoff is that a context whose message ever stops matching silently
 * falls back to the generic screen — never to a crash — and
 * `missingProviderError.test.ts` pins every current message so that drift
 * fails a test instead of reaching a user.
 */

/**
 * Deliberately loose about the article ("a", "an", or nothing) and about
 * anything trailing the Provider name: `useReadingProgress`'s message
 * continues past it with a second sentence.
 */
const MISSING_PROVIDER_PATTERN = /must be used within\s+(?:an?\s+)?\w*Provider/;

export function isMissingProviderError(error: unknown): boolean {
  if (!error) return false;
  const message =
    error instanceof Error
      ? error.message
      : (error as {message?: unknown})?.message;
  return typeof message === 'string' && MISSING_PROVIDER_PATTERN.test(message);
}
