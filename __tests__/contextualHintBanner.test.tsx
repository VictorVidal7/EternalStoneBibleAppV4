/**
 * ContextualHintBanner — the visual half of the contextual-hints layer.
 * Mirrors Toast's own idiom (Animated spring/timing + useNativeDriver +
 * auto-dismiss timer + AccessibilityInfo.announceForAccessibility on show
 * — see toastScreenReaderAnnouncement.test.tsx, whose animation-stubbing
 * and announce-spy setup this file reuses verbatim) rather than a new
 * transient-UI test pattern.
 *
 * Pinned here: renders nothing while `visible=false`; announces + shows
 * when it flips true; tapping close calls `onDismiss`; the auto-dismiss
 * timer also calls `onDismiss` on its own after `duration`; a `duration`
 * of 0 disables the timer (never calls onDismiss on its own).
 */
import React from 'react';
import {render, fireEvent} from '@testing-library/react-native';
import {AccessibilityInfo, Animated} from 'react-native';
import {ContextualHintBanner} from '../src/components/hints/ContextualHintBanner';

// Same as toastScreenReaderAnnouncement.test.tsx: stub out the real icon
// font component so its own internal async state updates (font loading)
// don't fire unrelated "not wrapped in act()" warnings in this suite.
jest.mock('@expo/vector-icons', () => ({Ionicons: () => null}));

// Same rationale as toastScreenReaderAnnouncement.test.tsx: Animated.spring/
// timing with useNativeDriver: true throws "Unable to locate attached view
// in the native tree" under react-test-renderer — stub both to a no-op
// start() so these tests only assert behavior, not the visual motion.
function stubAnimations() {
  jest
    .spyOn(Animated, 'spring')
    .mockImplementation((() => ({start: jest.fn()})) as never);
  jest.spyOn(Animated, 'timing').mockImplementation((() => ({
    start: (cb?: (result: {finished: boolean}) => void) =>
      cb?.({finished: true}),
  })) as never);
}

function spyOnAnnounce(): jest.SpyInstance {
  const spy = jest
    .spyOn(AccessibilityInfo, 'announceForAccessibility')
    .mockImplementation(() => {});
  spy.mockClear();
  return spy;
}

describe('ContextualHintBanner', () => {
  let announceSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.useFakeTimers();
    stubAnimations();
    announceSpy = spyOnAnnounce();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('renders nothing while not visible', () => {
    const {queryByText} = render(
      <ContextualHintBanner
        visible={false}
        message="Prueba Foco"
        onDismiss={jest.fn()}
      />,
    );
    expect(queryByText('Prueba Foco')).toBeNull();
  });

  it('renders the message and announces it for screen readers once visible', () => {
    const {getByText} = render(
      <ContextualHintBanner
        visible
        message="Toca Ver todo para descubrir más"
        onDismiss={jest.fn()}
      />,
    );
    expect(getByText('Toca Ver todo para descubrir más')).toBeTruthy();
    expect(announceSpy).toHaveBeenCalledWith(
      'Toca Ver todo para descubrir más',
    );
  });

  it('tapping the close button calls onDismiss', () => {
    const onDismiss = jest.fn();
    const {getByLabelText} = render(
      <ContextualHintBanner
        visible
        message="Mensaje de prueba"
        onDismiss={onDismiss}
      />,
    );
    fireEvent.press(getByLabelText('Cerrar'));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('auto-dismisses on its own after `duration` elapses', () => {
    const onDismiss = jest.fn();
    render(
      <ContextualHintBanner
        visible
        message="Se cierra solo"
        onDismiss={onDismiss}
        duration={5000}
      />,
    );
    expect(onDismiss).not.toHaveBeenCalled();

    jest.advanceTimersByTime(5000);
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('duration={0} disables the auto-dismiss timer entirely', () => {
    const onDismiss = jest.fn();
    render(
      <ContextualHintBanner
        visible
        message="No se cierra solo"
        onDismiss={onDismiss}
        duration={0}
      />,
    );
    jest.advanceTimersByTime(60000);
    expect(onDismiss).not.toHaveBeenCalled();
  });

  it('does not announce anything while not visible', () => {
    render(
      <ContextualHintBanner
        visible={false}
        message="oculto"
        onDismiss={jest.fn()}
      />,
    );
    expect(announceSpy).not.toHaveBeenCalled();
  });
});
