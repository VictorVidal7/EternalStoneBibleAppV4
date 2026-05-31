/**
 * Tests for useReducedMotion — the OS "reduce motion" listener hook.
 */

import {renderHook, act, waitFor} from '@testing-library/react-native';
import {AccessibilityInfo} from 'react-native';
import {useReducedMotion} from '../src/hooks/useReducedMotion';

describe('useReducedMotion', () => {
  let changeListener: ((enabled: boolean) => void) | undefined;
  const remove = jest.fn();

  beforeEach(() => {
    changeListener = undefined;
    remove.mockClear();
    jest
      .spyOn(AccessibilityInfo, 'isReduceMotionEnabled')
      .mockResolvedValue(false);
    jest.spyOn(AccessibilityInfo, 'addEventListener').mockImplementation(((
      name: string,
      cb: (e: boolean) => void,
    ) => {
      if (name === 'reduceMotionChanged') {
        changeListener = cb;
      }
      return {remove};
    }) as never);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('starts false and reads the OS value on mount', async () => {
    const {result} = renderHook(() => useReducedMotion());
    expect(result.current).toBe(false);
    await waitFor(() =>
      expect(AccessibilityInfo.isReduceMotionEnabled).toHaveBeenCalled(),
    );
    expect(result.current).toBe(false);
  });

  it('reflects an initially-enabled setting', async () => {
    (AccessibilityInfo.isReduceMotionEnabled as jest.Mock).mockResolvedValue(
      true,
    );
    const {result} = renderHook(() => useReducedMotion());
    await waitFor(() => expect(result.current).toBe(true));
  });

  it('updates live when the OS setting changes', async () => {
    const {result} = renderHook(() => useReducedMotion());
    await waitFor(() =>
      expect(AccessibilityInfo.isReduceMotionEnabled).toHaveBeenCalled(),
    );

    act(() => changeListener?.(true));
    expect(result.current).toBe(true);

    act(() => changeListener?.(false));
    expect(result.current).toBe(false);
  });

  it('removes the subscription on unmount', async () => {
    const {unmount} = renderHook(() => useReducedMotion());
    await waitFor(() =>
      expect(AccessibilityInfo.addEventListener).toHaveBeenCalledWith(
        'reduceMotionChanged',
        expect.any(Function),
      ),
    );
    unmount();
    expect(remove).toHaveBeenCalled();
  });
});
