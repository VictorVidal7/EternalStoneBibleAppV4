/**
 * Tests for useReducedMotion — the OS "reduce motion" listener hook.
 */

import React from 'react';
import {renderHook, act, waitFor} from '@testing-library/react-native';
import {AccessibilityInfo} from 'react-native';
import {useReducedMotion} from '../src/hooks/useReducedMotion';
import {
  AccessibilityPreferencesProvider,
  useAccessibilityPreferences,
} from '../src/context/AccessibilityPreferencesContext';

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

  it('returns true when the app override is on, even though the OS setting is off', async () => {
    const wrapper = ({children}: {children: React.ReactNode}) =>
      React.createElement(AccessibilityPreferencesProvider, null, children);

    const combined = renderHook(
      () => ({
        reduced: useReducedMotion(),
        prefs: useAccessibilityPreferences(),
      }),
      {wrapper},
    );
    await waitFor(() =>
      expect(AccessibilityInfo.isReduceMotionEnabled).toHaveBeenCalled(),
    );
    expect(combined.result.current.reduced).toBe(false);

    await act(async () => {
      await combined.result.current.prefs.setReduceMotionOverride(true);
    });
    expect(combined.result.current.reduced).toBe(true);

    await act(async () => {
      await combined.result.current.prefs.setReduceMotionOverride(false);
    });
    expect(combined.result.current.reduced).toBe(false);
  });
});
