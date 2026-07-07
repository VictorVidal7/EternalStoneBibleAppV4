/**
 * T11 — hotfix #16: a chapter's stored reading-progress percentage must
 * never go DOWN. Root cause: the reader's session-scoped guard
 * (`lastPersistedPctRef` in `[chapter].tsx`) resets to 0 on every mount, so
 * reopening an already-100% chapter and scrolling less than before produced
 * a lower session-max that got persisted straight over the earlier 100% —
 * the chapter grid then showed a finished chapter as "in progress" again.
 * `updateChapterProgress` now max-merges against the currently stored value.
 *
 * `saveProgress` writes to AsyncStorage before committing the React state
 * update, so every assertion below waits (`waitFor`) rather than reading
 * `result.current` synchronously right after an `act`.
 */
import React from 'react';
import {renderHook, act, waitFor} from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  ReadingProgressProvider,
  useReadingProgress,
} from '../src/context/ReadingProgressContext';

const wrapper = ({children}: {children: React.ReactNode}) => (
  <ReadingProgressProvider>{children}</ReadingProgressProvider>
);

async function storedPct(book: string, chapter: string): Promise<number> {
  const raw = await AsyncStorage.getItem('readingProgress');
  const parsed = raw ? JSON.parse(raw) : {};
  return parsed[book]?.[chapter] ?? 0;
}

describe('updateChapterProgress — max-merge (#16)', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('reopening a finished chapter and scrolling less keeps it at 100%', async () => {
    const {result} = renderHook(() => useReadingProgress(), {wrapper});

    // First session: reads the whole chapter.
    act(() => {
      result.current.updateChapterProgress('John', '3', 100);
    });
    await waitFor(() => {
      expect(result.current.getChapterProgress('John', '3')).toBe(100);
    });
    expect(await storedPct('John', '3')).toBe(100);

    // Second session (fresh mount elsewhere resets the session tracker to
    // 0): the reader scrolls only a little this time. This is a no-op under
    // the max-merge guard — no state/storage write happens at all — so it's
    // safe to assert synchronously right after the act.
    act(() => {
      result.current.updateChapterProgress('John', '3', 40);
    });
    expect(result.current.getChapterProgress('John', '3')).toBe(100);
    expect(await storedPct('John', '3')).toBe(100);
  });

  it('still records genuine forward progress', async () => {
    const {result} = renderHook(() => useReadingProgress(), {wrapper});

    act(() => {
      result.current.updateChapterProgress('John', '3', 40);
    });
    await waitFor(() => {
      expect(result.current.getChapterProgress('John', '3')).toBe(40);
    });

    act(() => {
      result.current.updateChapterProgress('John', '3', 75);
    });
    await waitFor(() => {
      expect(result.current.getChapterProgress('John', '3')).toBe(75);
    });
    expect(await storedPct('John', '3')).toBe(75);
  });

  it('does not touch other chapters or books', async () => {
    // One call per act, awaited to commit before the next — matching how the
    // real reader screen calls this (one chapter at a time, sequentially on
    // scroll-settle/unmount), not batched in the same tick.
    const {result} = renderHook(() => useReadingProgress(), {wrapper});

    act(() => {
      result.current.updateChapterProgress('John', '3', 100);
    });
    await waitFor(() => {
      expect(result.current.getChapterProgress('John', '3')).toBe(100);
    });

    act(() => {
      result.current.updateChapterProgress('John', '4', 20);
    });
    await waitFor(() => {
      expect(result.current.getChapterProgress('John', '4')).toBe(20);
    });

    act(() => {
      result.current.updateChapterProgress('Genesis', '1', 60);
    });
    await waitFor(() => {
      expect(result.current.getChapterProgress('Genesis', '1')).toBe(60);
    });

    act(() => {
      result.current.updateChapterProgress('John', '3', 10);
    });

    expect(result.current.getChapterProgress('John', '3')).toBe(100);
    expect(result.current.getChapterProgress('John', '4')).toBe(20);
    expect(result.current.getChapterProgress('Genesis', '1')).toBe(60);
  });

  it('a fresh chapter with no prior value stores the first percentage as-is', async () => {
    const {result} = renderHook(() => useReadingProgress(), {wrapper});

    act(() => {
      result.current.updateChapterProgress('Genesis', '1', 55);
    });

    await waitFor(() => {
      expect(result.current.getChapterProgress('Genesis', '1')).toBe(55);
    });
  });
});
