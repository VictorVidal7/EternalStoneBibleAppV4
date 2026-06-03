/**
 * 🪈 haptics — one semantic place to fire tactile feedback (Sprint 63).
 *
 * `expo-haptics` was imported and called directly across a dozen-plus
 * components, each hand-picking its own `ImpactFeedbackStyle` /
 * `NotificationFeedbackType`. This wraps it in a small INTENT-named API so call
 * sites read what they MEAN ("tap", "success") rather than the mechanics, every
 * call is swallowed if the platform can't vibrate (the native call rejects on
 * unsupported devices / the web), and there is a single seam to gate or tune
 * feedback in the future.
 *
 * Pure pass-through today (byte-identical vibrations to the prior hand-rolled
 * calls) — `tap` = Light impact, the style every adopted call site already used.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import * as Haptics from 'expo-haptics';

/** Run a best-effort haptic; never let a rejection/throw bubble to the UI. */
function safe(run: () => Promise<unknown>): void {
  try {
    run().catch(() => {
      /* haptics are best-effort: ignore unsupported-device rejections */
    });
  } catch {
    /* synchronous throw (e.g. module unavailable) — ignore */
  }
}

export const haptics = {
  /** A light tap — the default for buttons, rows and navigations. */
  tap: () => safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)),
  /** A firmer press — for primary/confirming actions. */
  press: () =>
    safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)),
  /** A heavy thud — for significant or destructive moments. */
  heavy: () =>
    safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)),
  /** A discrete selection tick — for pickers/steppers. */
  selection: () => safe(() => Haptics.selectionAsync()),
  /** Success notification pattern. */
  success: () =>
    safe(() =>
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
    ),
  /** Warning notification pattern. */
  warning: () =>
    safe(() =>
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning),
    ),
  /** Error notification pattern. */
  error: () =>
    safe(() =>
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error),
    ),
};

export default haptics;
