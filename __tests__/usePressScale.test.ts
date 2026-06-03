/**
 * Tests for usePressScale — the shared, reduce-motion-aware press-depress hook
 * that Sprint 67 routed every bespoke press-scale through. We assert the one
 * contract all those surfaces now inherit: a press animates the scale toward
 * the press target when motion is allowed, but NEVER shrinks under reduced
 * motion. We spy on Animated.spring to read the committed `toValue` (the
 * animation itself is async, so reading the value back would be flaky).
 */

import {renderHook, act} from '@testing-library/react-native';
import {Animated} from 'react-native';
import {usePressScale} from '../src/hooks/usePressScale';
import {PRESS_SCALE} from '../src/lib/animation/springs';
import {useReducedMotion} from '../src/hooks/useReducedMotion';

jest.mock('../src/hooks/useReducedMotion');

const mockReduced = useReducedMotion as jest.MockedFunction<
  typeof useReducedMotion
>;

describe('usePressScale', () => {
  let springSpy: jest.SpyInstance;

  beforeEach(() => {
    springSpy = jest
      .spyOn(Animated, 'spring')
      // Capture the config without actually running the animation.
      .mockImplementation((() => ({start: jest.fn()})) as never);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  /** The `toValue` of the most recent Animated.spring call. */
  function lastToValue(): number {
    const calls = springSpy.mock.calls;
    return (calls[calls.length - 1][1] as {toValue: number}).toValue;
  }

  it('rests at scale 1 before any press', () => {
    mockReduced.mockReturnValue(false);
    const {result} = renderHook(() => usePressScale());
    const scale = result.current.scale as unknown as {
      __getValue: () => number;
    };
    expect(scale.__getValue()).toBe(1);
  });

  it('depresses to the shared PRESS_SCALE on press in (motion allowed)', () => {
    mockReduced.mockReturnValue(false);
    const {result} = renderHook(() => usePressScale());
    act(() => result.current.onPressIn());
    expect(lastToValue()).toBe(PRESS_SCALE);
  });

  it('honors a custom press target', () => {
    mockReduced.mockReturnValue(false);
    const {result} = renderHook(() => usePressScale(0.9));
    act(() => result.current.onPressIn());
    expect(lastToValue()).toBe(0.9);
  });

  it('returns to 1 on press out', () => {
    mockReduced.mockReturnValue(false);
    const {result} = renderHook(() => usePressScale(0.9));
    act(() => result.current.onPressOut());
    expect(lastToValue()).toBe(1);
  });

  it('never shrinks under reduced motion, pressed or not', () => {
    mockReduced.mockReturnValue(true);
    const {result} = renderHook(() => usePressScale(0.5));
    act(() => result.current.onPressIn());
    expect(lastToValue()).toBe(1);
    act(() => result.current.onPressOut());
    expect(lastToValue()).toBe(1);
  });
});
