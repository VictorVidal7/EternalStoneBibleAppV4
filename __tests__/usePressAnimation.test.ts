/**
 * Tests for usePressAnimation — the Reanimated half of the Sprint 67 press
 * unification. It shares the PRESS_SCALE default + the pure `pressTargetScale`
 * reduce-motion policy with the RN-Animated `usePressScale`, so the 6 ui/*
 * press-scales routed through it now suppress the depress under reduced motion.
 * The Reanimated jest mock applies withSpring synchronously, so we can read
 * `scale.value` straight after the handler fires.
 */

import {renderHook, act} from '@testing-library/react-native';
import {usePressAnimation, useCardPress} from '../src/hooks/useAnimations';
import {PRESS_SCALE} from '../src/lib/animation/springs';
import {useReducedMotion} from '../src/hooks/useReducedMotion';

jest.mock('../src/hooks/useReducedMotion');

const mockReduced = useReducedMotion as jest.MockedFunction<
  typeof useReducedMotion
>;

describe('usePressAnimation', () => {
  it('rests at scale 1', () => {
    mockReduced.mockReturnValue(false);
    const {result} = renderHook(() => usePressAnimation());
    expect(result.current.scale.value).toBe(1);
  });

  it('depresses to the shared PRESS_SCALE by default (motion allowed)', () => {
    mockReduced.mockReturnValue(false);
    const {result} = renderHook(() => usePressAnimation());
    act(() => result.current.onPressIn());
    expect(result.current.scale.value).toBe(PRESS_SCALE);
    act(() => result.current.onPressOut());
    expect(result.current.scale.value).toBe(1);
  });

  it('honors a custom (deeper) press target', () => {
    mockReduced.mockReturnValue(false);
    const {result} = renderHook(() => usePressAnimation(0.9));
    act(() => result.current.onPressIn());
    expect(result.current.scale.value).toBe(0.9);
  });

  it('never shrinks under reduced motion, pressed or not', () => {
    mockReduced.mockReturnValue(true);
    const {result} = renderHook(() => usePressAnimation(0.9));
    act(() => result.current.onPressIn());
    expect(result.current.scale.value).toBe(1);
    act(() => result.current.onPressOut());
    expect(result.current.scale.value).toBe(1);
  });

  it('useCardPress is a subtler 0.98 press, also reduce-motion-aware', () => {
    mockReduced.mockReturnValue(false);
    const {result} = renderHook(() => useCardPress());
    act(() => result.current.onPressIn());
    expect(result.current.scale.value).toBe(0.98);

    mockReduced.mockReturnValue(true);
    const {result: reducedResult} = renderHook(() => useCardPress());
    act(() => reducedResult.current.onPressIn());
    expect(reducedResult.current.scale.value).toBe(1);
  });
});
