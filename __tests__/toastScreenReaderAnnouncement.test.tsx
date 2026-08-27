/**
 * Toast / ToastContext — screen-reader announcement wiring.
 *
 * Before this fix, `Toast` (used by `useToast()` in 53 files for
 * confirmation/error/success messages) had ZERO screen-reader wiring: the
 * message appeared and auto-dismissed on screen with nothing read aloud to
 * TalkBack/VoiceOver. The fix reuses the codebase's existing mechanism for
 * ephemeral, auto-dismissing messages — `AccessibilityInfo
 * .announceForAccessibility` (already used by ImmersiveReader's
 * chapter-transition banner, MiniAudioPlayer and AudioQueueSheet) — fired
 * whenever a toast becomes visible, for every variant.
 */
import React from 'react';
import {act, render} from '@testing-library/react-native';
import {AccessibilityInfo, Animated} from 'react-native';
import {Toast} from '../src/components/Toast';
import {ToastProvider, useToast} from '../src/context/ToastContext';

const mockColors = {
  success: '#16a34a',
  error: '#dc2626',
  warning: '#d97706',
  info: '#2563eb',
  card: '#ffffff',
  text: '#0f172a',
};

jest.mock('../src/hooks/useTheme', () => ({
  useTheme: () => ({colors: mockColors, isDark: false}),
}));

jest.mock('@expo/vector-icons', () => ({Ionicons: () => null}));

jest.mock('expo-blur', () => {
  const {View} = require('react-native');
  return {BlurView: View};
});

// Toast's own show()/hide() drive Animated.spring/Animated.timing with
// useNativeDriver: true, which tries to attach to a real native view tag —
// react-test-renderer has none, so it throws "Unable to locate attached view
// in the native tree" (same pre-existing environment limitation documented in
// usePressScale.test.ts and searchGoToReference.test.tsx). Stubbing both to a
// no-op `start` sidesteps the animation entirely; these tests only assert the
// accessibility-announcement side effect, not the visual motion.
function stubAnimations() {
  jest
    .spyOn(Animated, 'spring')
    .mockImplementation((() => ({start: jest.fn()})) as never);
  jest
    .spyOn(Animated, 'timing')
    .mockImplementation((() => ({start: jest.fn()})) as never);
}

// For the sequential-toast tests below, Toast's exit animation needs to
// actually invoke its completion callback (which calls onDismiss) after a
// controllable delay — stubbing `Animated.parallel` directly (rather than
// spring/timing) is the one call whose *callback* Toast's own hide() cares
// about, and unlike stubAnimations() above this one fires it, so timer
// advances can reproduce a stale toast's dismiss racing a newer one.
function mockParallelWithExitDelay(exitDelayMs: number): void {
  jest.spyOn(Animated, 'parallel').mockImplementation((() => ({
    start: (callback?: () => void) => {
      if (callback) {
        setTimeout(callback, exitDelayMs);
      }
    },
  })) as never);
}

// AccessibilityInfo is backed by a native-module mock whose spied method
// doesn't get cleanly restored by `jest.restoreAllMocks()` between tests in
// this environment (spyOn keeps returning the same underlying mock, so calls
// silently accumulate across `it` blocks) — an explicit `mockClear()` right
// after (re-)spying keeps each test's call count isolated regardless.
function spyOnAnnounce(): jest.SpyInstance {
  const spy = jest
    .spyOn(AccessibilityInfo, 'announceForAccessibility')
    .mockImplementation(() => {});
  spy.mockClear();
  return spy;
}

describe('Toast — screen-reader announcement', () => {
  let announceSpy: jest.SpyInstance;

  beforeEach(() => {
    stubAnimations();
    announceSpy = spyOnAnnounce();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('announces the message when a toast becomes visible', () => {
    render(<Toast visible message="Nota guardada" variant="success" />);
    expect(announceSpy).toHaveBeenCalledWith('Nota guardada');
  });

  it.each(['success', 'error', 'warning', 'info', 'default'] as const)(
    'announces the %s variant using the same mechanism (no variant is silently skipped)',
    variant => {
      render(
        <Toast visible message={`mensaje ${variant}`} variant={variant} />,
      );
      expect(announceSpy).toHaveBeenCalledWith(`mensaje ${variant}`);
    },
  );

  it('does not announce when the toast is not visible', () => {
    render(<Toast visible={false} message="oculto" variant="info" />);
    expect(announceSpy).not.toHaveBeenCalled();
  });

  it('re-announces a new message when the text changes while still visible', () => {
    const {rerender} = render(
      <Toast visible message="Primero" variant="info" />,
    );
    expect(announceSpy).toHaveBeenCalledWith('Primero');

    rerender(<Toast visible message="Segundo" variant="info" />);
    expect(announceSpy).toHaveBeenCalledWith('Segundo');
    expect(announceSpy).toHaveBeenCalledTimes(2);
  });
});

describe('ToastContext — end-to-end announcement plumbing', () => {
  let announceSpy: jest.SpyInstance;

  beforeEach(() => {
    stubAnimations();
    announceSpy = spyOnAnnounce();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  function Harness({run}: {run: (toast: ReturnType<typeof useToast>) => void}) {
    const toast = useToast();
    // Fire once on mount only — this eslint config has no
    // react-hooks/exhaustive-deps rule, so no suppression comment is needed
    // (same pattern as ImmersiveReader.tsx / QuizPanel.tsx).
    React.useEffect(() => {
      run(toast);
    }, []);
    return null;
  }

  it('announces via the real ToastProvider for the success() helper', () => {
    render(
      <ToastProvider>
        <Harness run={toast => toast.success('Se guardó tu nota')} />
      </ToastProvider>,
    );
    expect(announceSpy).toHaveBeenCalledWith('Se guardó tu nota');
  });

  it('announces via the real ToastProvider for the error() helper', () => {
    render(
      <ToastProvider>
        <Harness run={toast => toast.error('No se pudo guardar')} />
      </ToastProvider>,
    );
    expect(announceSpy).toHaveBeenCalledWith('No se pudo guardar');
  });
});

describe("ToastContext — a superseded toast must not steal a newer one's lifetime", () => {
  // Regression coverage for the bug `advisor` caught in the global
  // Modal-removal fix (src/context/ToastContext.tsx): `Toast`'s own
  // show()/hide() effect depends only on `visible`. Firing a second toast
  // while the first is still visible is a no-op for that boolean, so
  // without `key={toastKey}` forcing a fresh `<Toast>` instance per show(),
  // the newer toast silently inherits whatever's left of the OLDER toast's
  // already-ticking dismiss timer instead of getting its own full
  // `duration` — exactly what BadgeCollectionScreen's staggered 600ms-apart
  // achievement toasts hit in practice.
  let capturedToast: ReturnType<typeof useToast> | null = null;

  function CaptureHarness() {
    capturedToast = useToast();
    return null;
  }

  beforeEach(() => {
    jest.useFakeTimers();
    capturedToast = null;
    spyOnAnnounce();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it("gives the newer toast its own full duration instead of dying on the older one's timer", () => {
    mockParallelWithExitDelay(250);
    const {getByText, queryByText} = render(
      <ToastProvider>
        <CaptureHarness />
      </ToastProvider>,
    );

    act(() => {
      capturedToast!.success('Toast A', 3000);
    });
    expect(getByText('Toast A')).toBeTruthy();

    // A has 100ms left on its ORIGINAL timer when B replaces it.
    act(() => {
      jest.advanceTimersByTime(2900);
    });
    act(() => {
      capturedToast!.success('Toast B', 3000);
    });
    expect(getByText('Toast B')).toBeTruthy();

    // Past the point A's original timer AND its exit animation would have
    // fully completed (t=3000 + the 250ms exit delay) — a fresh `key` per
    // show() means B has its OWN timer, unaffected by A's, and is still
    // showing here; without it, B would have been dismissed by A's
    // inherited, already-ticking timer instead of its own full duration.
    act(() => {
      jest.advanceTimersByTime(500);
    });
    expect(queryByText('Toast B')).toBeTruthy();
  });

  it('ignores a stale exit-animation dismiss from a toast already superseded', () => {
    mockParallelWithExitDelay(250);
    const {getByText, queryByText} = render(
      <ToastProvider>
        <CaptureHarness />
      </ToastProvider>,
    );

    act(() => {
      capturedToast!.success('Toast A', 500);
    });
    // A's own timer fires -> hide() starts its exit animation, which won't
    // resolve (and call onDismiss) for another 250ms.
    act(() => {
      jest.advanceTimersByTime(500);
    });
    // B fires WHILE A's exit animation is still in flight.
    act(() => {
      capturedToast!.success('Toast B', 3000);
    });
    expect(getByText('Toast B')).toBeTruthy();

    // A's stale exit-animation callback fires now — without the
    // key-matching guard in ToastContext's handleDismiss, this would hide
    // B (which never asked to be dismissed) out from under it.
    act(() => {
      jest.advanceTimersByTime(250);
    });
    expect(queryByText('Toast B')).toBeTruthy();
  });
});
