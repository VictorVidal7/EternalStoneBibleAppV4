/**
 * R9-14 — the detector behind the web "this section is not in the web
 * version" screen.
 *
 * The load-bearing test here is the LAST one: it pulls the real message out
 * of every context whose Provider `app/_layout.web.tsx` deliberately does not
 * mount, by actually calling each hook outside a Provider and catching what
 * comes out. A hand-written list of message strings would rot the day someone
 * rewords one, and the rot would be silent — the route would quietly fall
 * back to the generic "Algo salió mal" screen with the retry button that
 * cannot work. This way, rewording a message fails a test instead.
 */
import {renderHook} from '@testing-library/react-native';
import {isMissingProviderError} from '../src/lib/errors/missingProviderError';

describe('isMissingProviderError', () => {
  it('matches the three article shapes the app actually uses', () => {
    // "an AuthProvider", "a CustomPlansProvider", and no article at all
    // (ReadingPlanProgressProvider) — all three exist in the codebase.
    expect(
      isMissingProviderError(
        new Error('useAuth must be used within an AuthProvider'),
      ),
    ).toBe(true);
    expect(
      isMissingProviderError(
        new Error('useCustomPlans must be used within a CustomPlansProvider'),
      ),
    ).toBe(true);
    expect(
      isMissingProviderError(
        new Error(
          'useReadingPlanProgress must be used within ReadingPlanProgressProvider',
        ),
      ),
    ).toBe(true);
  });

  it('matches when the message continues past the Provider name', () => {
    // ReadingProgressContext's message has a second sentence after it; an
    // anchored/exact match would miss it.
    expect(
      isMissingProviderError(
        new Error(
          'useReadingProgress must be used within a ReadingProgressProvider. ' +
            'Wrap the tree in one.',
        ),
      ),
    ).toBe(true);
  });

  it('does not match unrelated errors', () => {
    // The control. Without it, an always-true implementation would pass
    // everything above — and would turn every genuine crash on web into a
    // reassuring "not available here" message.
    expect(isMissingProviderError(new Error('Network request failed'))).toBe(
      false,
    );
    expect(
      isMissingProviderError(new Error('hasRedLetterData is not a function')),
    ).toBe(false);
    expect(
      isMissingProviderError(new Error('Provider must be used within a tree')),
    ).toBe(false);
  });

  it('survives non-Error throwables without blowing up', () => {
    expect(isMissingProviderError(null)).toBe(false);
    expect(isMissingProviderError(undefined)).toBe(false);
    expect(isMissingProviderError('a string')).toBe(false);
    expect(isMissingProviderError({})).toBe(false);
    expect(isMissingProviderError({message: 42})).toBe(false);
    expect(isMissingProviderError({message: 'Network request failed'})).toBe(
      false,
    );
  });

  it('matches on the message even when the value is not an Error instance', () => {
    // Deliberate, not an accident of the implementation: a bundled/minified
    // build or a cross-realm throw can produce something that carries the
    // right message and still fails `instanceof Error`. Keying off the
    // message keeps the honest "not in the web version" screen from silently
    // degrading to the generic one in exactly the environment it serves.
    expect(
      isMissingProviderError({
        message: 'useTogether must be used within a TogetherProvider',
      }),
    ).toBe(true);
  });

  it('recognizes what the six real unmounted-on-web contexts actually throw', () => {
    // Not a list of strings — the hooks themselves, called with no Provider.
    const hooks: ReadonlyArray<[string, () => unknown]> = [
      ['useAuth', () => require('../src/context/AuthContext').useAuth()],
      [
        'useReadingProgress',
        () =>
          require('../src/context/ReadingProgressContext').useReadingProgress(),
      ],
      [
        'useReadingPlanProgress',
        () =>
          require('../src/context/ReadingPlanProgressContext').useReadingPlanProgress(),
      ],
      [
        'useCustomPlans',
        () => require('../src/context/CustomPlansContext').useCustomPlans(),
      ],
      [
        'useTogether',
        () => require('../src/context/TogetherContext').useTogether(),
      ],
      [
        'useDonationSheet',
        () => require('../src/context/DonationSheetContext').useDonationSheet(),
      ],
    ];

    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    try {
      for (const [name, useHook] of hooks) {
        let thrown: unknown = null;
        try {
          renderHook(() => useHook());
        } catch (error) {
          thrown = error;
        }
        // Reported as [name, boolean] so a failure names the hook that drifted
        // instead of just saying `false !== true`.
        expect([name, thrown !== null]).toEqual([name, true]);
        expect([name, isMissingProviderError(thrown)]).toEqual([name, true]);
      }
    } finally {
      errorSpy.mockRestore();
    }
  });
});
