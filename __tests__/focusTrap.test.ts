import {
  focusTrapProps,
  a11yHiddenProps,
  FocusTrapProps,
  A11yHiddenProps,
} from '../src/lib/a11y/focusTrap';

describe('focusTrap — screen-reader focus management', () => {
  describe('focusTrapProps (modal content container)', () => {
    it('traps VoiceOver focus on iOS via accessibilityViewIsModal', () => {
      expect(focusTrapProps().accessibilityViewIsModal).toBe(true);
    });

    it('keeps the content exposed to TalkBack on Android', () => {
      expect(focusTrapProps().importantForAccessibility).toBe('yes');
    });

    it('returns exactly the two trap props (no stray keys)', () => {
      const props: FocusTrapProps = focusTrapProps();
      expect(Object.keys(props).sort()).toEqual([
        'accessibilityViewIsModal',
        'importantForAccessibility',
      ]);
    });

    it('returns a fresh object each call (safe to spread)', () => {
      expect(focusTrapProps()).not.toBe(focusTrapProps());
      expect(focusTrapProps()).toEqual(focusTrapProps());
    });
  });

  describe('a11yHiddenProps (decorative backdrop)', () => {
    it('hides the layer from VoiceOver on iOS', () => {
      expect(a11yHiddenProps().accessibilityElementsHidden).toBe(true);
    });

    it('hides the layer and its descendants from TalkBack on Android', () => {
      expect(a11yHiddenProps().importantForAccessibility).toBe(
        'no-hide-descendants',
      );
    });

    it('returns exactly the two hide props (no stray keys)', () => {
      const props: A11yHiddenProps = a11yHiddenProps();
      expect(Object.keys(props).sort()).toEqual([
        'accessibilityElementsHidden',
        'importantForAccessibility',
      ]);
    });

    it('returns a fresh object each call (safe to spread)', () => {
      expect(a11yHiddenProps()).not.toBe(a11yHiddenProps());
      expect(a11yHiddenProps()).toEqual(a11yHiddenProps());
    });
  });

  it('content and backdrop bundles never collide on a shared key', () => {
    // The only key both touch is importantForAccessibility, and they set it to
    // opposite intents — content is exposed, backdrop is hidden.
    expect(focusTrapProps().importantForAccessibility).not.toBe(
      a11yHiddenProps().importantForAccessibility,
    );
  });
});
