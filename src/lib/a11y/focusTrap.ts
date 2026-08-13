/**
 * ♿ focusTrap — screen-reader focus management for modals & overlays.
 *
 * Before this sprint the app had **zero** focus traps: a React Native `<Modal>`
 * floats its content on top, but VoiceOver (iOS) will still happily focus the
 * views BEHIND it unless the modal's content view is flagged
 * `accessibilityViewIsModal`, and TalkBack (Android) can land on the decorative
 * backdrop. So a screen-reader user opening a sheet could swipe straight out of
 * it into the dimmed page underneath — a broken, disorienting experience.
 *
 * The fix is two complementary prop bundles, applied per surface:
 *   • {@link focusTrapProps} on the modal's CONTENT container → traps focus
 *     inside it (iOS `accessibilityViewIsModal`) and keeps it exposed to
 *     TalkBack (Android `importantForAccessibility:'yes'`);
 *   • {@link a11yHiddenProps} on the decorative BACKDROP / dismiss layer → the
 *     screen reader skips it entirely (iOS `accessibilityElementsHidden`,
 *     Android `importantForAccessibility:'no-hide-descendants'`) — the same
 *     decorative pattern AudioWaveform already uses (Sprint 55).
 *
 * Each prop is a no-op on the platform it doesn't target (RN ignores unknown
 * a11y props per platform), so one bundle is safe to spread on both. This
 * module is PURE (no runtime React/RN import — the RN type is erased at build)
 * so the prop shapes are a single, unit-tested source of truth.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

/** The RN `importantForAccessibility` value union (Android focus control). */
export type ImportantForAccessibility =
  'auto' | 'yes' | 'no' | 'no-hide-descendants';

/** Props for a modal/sheet CONTENT container so SR focus is trapped inside. */
export interface FocusTrapProps {
  accessibilityViewIsModal: boolean;
  importantForAccessibility: ImportantForAccessibility;
}

/** Props for a DECORATIVE backdrop/overlay so screen readers skip it. */
export interface A11yHiddenProps {
  accessibilityElementsHidden: boolean;
  importantForAccessibility: ImportantForAccessibility;
}

/**
 * Spread on the CONTENT view of a modal/bottom-sheet/dialog. Traps VoiceOver
 * focus within the view on iOS and keeps it focusable on Android.
 */
export function focusTrapProps(): FocusTrapProps {
  return {
    accessibilityViewIsModal: true,
    importantForAccessibility: 'yes',
  };
}

/**
 * Spread on a DECORATIVE / backdrop / dismiss layer so screen readers ignore it
 * (the tap-to-dismiss is redundant for SR users — they use the close button or
 * the system back gesture, both of which stay reachable).
 */
export function a11yHiddenProps(): A11yHiddenProps {
  return {
    accessibilityElementsHidden: true,
    importantForAccessibility: 'no-hide-descendants',
  };
}
