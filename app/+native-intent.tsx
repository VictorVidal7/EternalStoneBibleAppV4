/**
 * 🔗 Expo Router native-intent hook — Android App Links (autoVerify).
 *
 * Once the `eternalstonebible.github.io` domain is verified (Digital Asset
 * Links + the autoVerify intent-filter), tapping a share link opens it DIRECTLY
 * in the app, with no browser flash. But the share payload rides in the URL
 * **#fragment** (`…/o/#d=<payload>`), which Expo Router does not parse into
 * route params.
 *
 * `redirectSystemPath` runs on the RAW incoming URL — for both the cold-start
 * deep link (`initial: true`) and runtime `'url'` events (`initial: false`) —
 * BEFORE Expo Router matches a route. So here we recover the payload and
 * rewrite the URL to the join screen, exactly as the in-browser redirector
 * would (the join screen already forwards `study` bundles to their viewer, so
 * one route covers every bundle type). Every other URL — notably the
 * `eternalbible://` scheme links Expo Router already routes natively — passes
 * through untouched.
 *
 * Per the Expo Router docs a throw here can crash the app, so the logic is
 * wrapped defensively (it also never throws by construction).
 *
 * Para la gloria de Dios Todopoderoso ✨
 */
import type {NativeIntent} from 'expo-router';
import {extractSharedLinkPayload} from '@lib/together';

export const redirectSystemPath: NonNullable<
  NativeIntent['redirectSystemPath']
> = ({path}) => {
  try {
    const payload = extractSharedLinkPayload(path);
    if (payload) return `/features/together?d=${payload}`;
  } catch {
    // Never let URL handling crash the launch — fall through to the raw path.
  }
  return path;
};
