/**
 * useSleepTimer Hook
 *
 * Hook independiente para manejar el timer de sueno
 * Puede usarse fuera del AudioPlayerContext
 *
 * Para la gloria de Dios - Eternal Stone Bible App
 */

import {useState, useCallback, useRef, useEffect} from 'react';
import * as Haptics from 'expo-haptics';

export type SleepTimerMode = 'time' | 'end-of-chapter' | null;

interface SleepTimerState {
  isActive: boolean;
  remainingSeconds: number;
  endTime: Date | null;
  mode: SleepTimerMode;
}

interface UseSleepTimerOptions {
  onTimerEnd?: () => void;
  updateIntervalMs?: number;
}

interface UseSleepTimerReturn {
  state: SleepTimerState;
  setTimer: (minutes: number) => void;
  setEndOfChapterTimer: () => void;
  cancelTimer: () => void;
  isActive: boolean;
  remainingMinutes: number;
  remainingSeconds: number;
  formattedTime: string;
}

const initialState: SleepTimerState = {
  isActive: false,
  remainingSeconds: 0,
  endTime: null,
  mode: null,
};

export const useSleepTimer = (
  options: UseSleepTimerOptions = {},
): UseSleepTimerReturn => {
  const {onTimerEnd, updateIntervalMs = 1000} = options;

  const [state, setState] = useState<SleepTimerState>(initialState);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  // Clear all timers
  const clearTimers = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
  }, []);

  // Set timer for X minutes
  const setTimer = useCallback(
    (minutes: number) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      clearTimers();

      const totalSeconds = minutes * 60;
      const endTime = new Date(Date.now() + totalSeconds * 1000);

      setState({
        isActive: true,
        remainingSeconds: totalSeconds,
        endTime,
        mode: 'time',
      });

      // Main timer
      timerRef.current = setTimeout(() => {
        setState(initialState);
        onTimerEnd?.();
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      }, totalSeconds * 1000);

      // Countdown interval
      countdownRef.current = setInterval(() => {
        setState(prev => {
          if (prev.remainingSeconds <= 1) {
            clearTimers();
            return initialState;
          }
          return {
            ...prev,
            remainingSeconds: prev.remainingSeconds - 1,
          };
        });
      }, updateIntervalMs);
    },
    [clearTimers, onTimerEnd, updateIntervalMs],
  );

  // Set timer to end at chapter completion
  const setEndOfChapterTimer = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    clearTimers();

    setState({
      isActive: true,
      remainingSeconds: 0,
      endTime: null,
      mode: 'end-of-chapter',
    });
  }, [clearTimers]);

  // Cancel timer
  const cancelTimer = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    clearTimers();
    setState(initialState);
  }, [clearTimers]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearTimers();
    };
  }, [clearTimers]);

  // Format time as MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return {
    state,
    setTimer,
    setEndOfChapterTimer,
    cancelTimer,
    isActive: state.isActive,
    remainingMinutes: Math.ceil(state.remainingSeconds / 60),
    remainingSeconds: state.remainingSeconds,
    formattedTime: formatTime(state.remainingSeconds),
  };
};

export default useSleepTimer;
