/**
 * R9-413 and R9-414 — three providers that persist their WHOLE object or map
 * from memory: a read that REJECTS at mount left the defaults (`{}`) in
 * memory, and the next write (or, for the reader preferences, no write at
 * all: the persist effect itself) put them over the disk. Same shape as
 * R9-267 (the memory deck), fixed the same way: nothing is written until a
 * read has read the disk; the first write after a failed read re-reads and
 * builds on what it read; if the re-read fails too, it writes from memory
 * (the way out of R9-212).
 *
 * Real providers over the AsyncStorage mock; only `getItem` is wrapped, to
 * reject a given key a given number of times, or to hold it at a gate.
 */
import React from 'react';
import {renderHook, act, waitFor} from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  ReaderPreferencesProvider,
  useReaderPreferences,
} from '../src/context/ReaderPreferencesContext';
import {
  ReadingProgressProvider,
  useReadingProgress,
} from '../src/context/ReadingProgressContext';
import {
  ReadingPlanProgressProvider,
  useReadingPlanProgress,
} from '../src/context/ReadingPlanProgressContext';

const AS = AsyncStorage as unknown as {
  getItem: (k: string, ...r: unknown[]) => Promise<string | null>;
  setItem: (k: string, v: string, ...r: unknown[]) => Promise<void>;
};
const realGetItem = AS.getItem;
const realSetItem = AS.setItem;
/** key → how many more reads of it reject. */
let failures = new Map<string, number>();
/** key → a gate the next read of it waits on before it RUNS. */
let gates = new Map<string, Promise<void>>();

// A model of AsyncStorage's serial executor on Android (as in
// memoryDeckDisk.test.tsx): each operation runs when the one asked before it
// has finished, and answers after it. A gate holds an operation when it would
// RUN, and everything asked behind it waits with it — so a read sees the disk
// as it was at its turn, never a write asked after it.
let queue: Promise<unknown> = Promise.resolve();
let answers: Promise<unknown> = Promise.resolve();
const serial = <T,>(fn: () => Promise<T>, held?: Promise<void>) => {
  const runs = queue.then(async () => {
    await held;
    return fn();
  });
  queue = runs.catch(() => undefined);
  const answer = answers.then(() => runs);
  answers = answer.catch(() => undefined);
  return answer;
};

beforeEach(async () => {
  await AsyncStorage.clear();
  failures = new Map();
  gates = new Map();
  AS.getItem = jest.fn((k: string, ...r: unknown[]) => {
    const held = gates.get(k);
    gates.delete(k);
    return serial(() => {
      const left = failures.get(k) ?? 0;
      if (left > 0) {
        failures.set(k, left - 1);
        return Promise.reject(new Error('simulated AsyncStorage I/O error'));
      }
      return realGetItem(k, ...r);
    }, held);
  });
  AS.setItem = jest.fn((k: string, v: string, ...r: unknown[]) =>
    serial(() => realSetItem(k, v, ...r)),
  );
});
afterEach(() => {
  AS.getItem = realGetItem;
  AS.setItem = realSetItem;
});

const settle = async () => {
  await act(async () => {
    await new Promise(r => setTimeout(r, 30));
  });
};
const disk = async (k: string) => JSON.parse((await realGetItem(k)) ?? 'null');
const gate = (k: string) => {
  let open!: () => void;
  gates.set(
    k,
    new Promise<void>(r => {
      open = r;
    }),
  );
  return () => act(async () => open());
};

describe('R9-413 — reader preferences after a read that rejects', () => {
  const KEY = '@reader_preferences';
  const STORED = {
    theme: 'sepia',
    fontSize: 24,
    fontFamily: 'serif',
    sepiaGrandfathered: true,
  };
  const wrapper = ({children}: {children: React.ReactNode}) => (
    <ReaderPreferencesProvider>{children}</ReaderPreferencesProvider>
  );

  it('writes nothing while nothing changes', async () => {
    await AsyncStorage.setItem(KEY, JSON.stringify(STORED));
    failures.set(KEY, 1);
    const {result} = renderHook(() => useReaderPreferences(), {wrapper});
    await waitFor(() => expect(result.current.hydrated).toBe(true));
    await settle();
    expect(await disk(KEY)).toEqual(STORED);
  });

  it('the first change re-reads and lays itself over the disk', async () => {
    await AsyncStorage.setItem(KEY, JSON.stringify(STORED));
    failures.set(KEY, 1);
    const {result} = renderHook(() => useReaderPreferences(), {wrapper});
    await waitFor(() => expect(result.current.hydrated).toBe(true));
    act(() => result.current.setFontSize(18));
    await settle();
    expect(await disk(KEY)).toMatchObject({
      theme: 'sepia',
      fontFamily: 'serif',
      sepiaGrandfathered: true,
      fontSize: 18,
    });
    expect(result.current.preferences).toMatchObject({
      theme: 'sepia',
      fontSize: 18,
      sepiaGrandfathered: true,
    });
  });

  it('a change made while the re-read is out joins the merge', async () => {
    await AsyncStorage.setItem(KEY, JSON.stringify(STORED));
    failures.set(KEY, 1);
    const {result} = renderHook(() => useReaderPreferences(), {wrapper});
    await waitFor(() => expect(result.current.hydrated).toBe(true));
    const open = gate(KEY);
    act(() => result.current.setFontSize(18));
    act(() => result.current.setMargin('large'));
    await open();
    await settle();
    expect(await disk(KEY)).toMatchObject({
      theme: 'sepia',
      fontSize: 18,
      margin: 'large',
      sepiaGrandfathered: true,
    });
  });

  it('with no blob on disk, the change is still written', async () => {
    failures.set(KEY, 1);
    const {result} = renderHook(() => useReaderPreferences(), {wrapper});
    await waitFor(() => expect(result.current.hydrated).toBe(true));
    act(() => result.current.setFontSize(20));
    await settle();
    expect(await disk(KEY)).toMatchObject({fontSize: 20, theme: 'system'});
  });

  it('way out: if the re-read fails too, it writes from memory', async () => {
    await AsyncStorage.setItem(KEY, JSON.stringify(STORED));
    failures.set(KEY, 2);
    const {result} = renderHook(() => useReaderPreferences(), {wrapper});
    await waitFor(() => expect(result.current.hydrated).toBe(true));
    act(() => result.current.setFontSize(18));
    await settle();
    expect(await disk(KEY)).toMatchObject({fontSize: 18, theme: 'system'});
  });

  it('CONTROL: a read that works keeps writing every change', async () => {
    await AsyncStorage.setItem(KEY, JSON.stringify(STORED));
    const {result} = renderHook(() => useReaderPreferences(), {wrapper});
    await waitFor(() => expect(result.current.preferences.theme).toBe('sepia'));
    act(() => result.current.setFontSize(18));
    await settle();
    expect(await disk(KEY)).toMatchObject({...STORED, fontSize: 18});
  });
});

describe('R9-414 — chapter progress after a read that rejects', () => {
  const KEY = 'readingProgress';
  const STORED = {John: {'3': 100}, Luke: {'2': 50}, Mark: {'2': 100}};
  const wrapper = ({children}: {children: React.ReactNode}) => (
    <ReadingProgressProvider>{children}</ReadingProgressProvider>
  );

  it('the next chapter re-reads and is added to what the disk had', async () => {
    await AsyncStorage.setItem(KEY, JSON.stringify(STORED));
    failures.set(KEY, 1);
    const {result} = renderHook(() => useReadingProgress(), {wrapper});
    await settle();
    act(() => result.current.updateChapterProgress('Mark', '1', 30));
    await settle();
    expect(await disk(KEY)).toEqual({...STORED, Mark: {'1': 30, '2': 100}});
    expect(result.current.getChapterProgress('John', '3')).toBe(100);
  });

  it('two chapters read while the re-read is out both land', async () => {
    await AsyncStorage.setItem(KEY, JSON.stringify(STORED));
    failures.set(KEY, 1);
    const {result} = renderHook(() => useReadingProgress(), {wrapper});
    await settle();
    const open = gate(KEY);
    act(() => result.current.updateChapterProgress('Mark', '1', 30));
    act(() => result.current.updateChapterProgress('Acts', '1', 60));
    await open();
    await settle();
    expect(await disk(KEY)).toEqual({
      ...STORED,
      Mark: {'1': 30, '2': 100},
      Acts: {'1': 60},
    });
  });

  it('way out: if the re-read fails too, it writes from memory', async () => {
    await AsyncStorage.setItem(KEY, JSON.stringify(STORED));
    failures.set(KEY, 2);
    const {result} = renderHook(() => useReadingProgress(), {wrapper});
    await settle();
    act(() => result.current.updateChapterProgress('Mark', '1', 30));
    await settle();
    expect(await disk(KEY)).toEqual({Mark: {'1': 30}});
  });

  it('CONTROL: a read that works adds to the map', async () => {
    await AsyncStorage.setItem(KEY, JSON.stringify(STORED));
    const {result} = renderHook(() => useReadingProgress(), {wrapper});
    await settle();
    act(() => result.current.updateChapterProgress('Mark', '1', 30));
    await settle();
    expect(await disk(KEY)).toEqual({...STORED, Mark: {'1': 30, '2': 100}});
  });
});

describe('R9-414 — reading-plan progress after a read that rejects', () => {
  const KEY = '@reading_plan_progress';
  const READ_KEY = '@reading_plan_read_chapters';
  const PLAN_A = {
    startedAt: '2026-01-01T00:00:00.000Z',
    completedDays: [1, 2, 3],
  };
  const wrapper = ({children}: {children: React.ReactNode}) => (
    <ReadingPlanProgressProvider>{children}</ReadingPlanProgressProvider>
  );

  it('ticking a day of the SAME plan re-reads and keeps its days', async () => {
    await AsyncStorage.setItem(KEY, JSON.stringify({planA: PLAN_A}));
    failures.set(KEY, 1);
    const {result} = renderHook(() => useReadingPlanProgress(), {wrapper});
    await settle();
    await act(async () => {
      await result.current.toggleDay('planA', 4);
    });
    expect((await disk(KEY)).planA).toEqual({
      ...PLAN_A,
      completedDays: [1, 2, 3, 4],
    });
  });

  it('ticking a day of another plan keeps the first one', async () => {
    await AsyncStorage.setItem(KEY, JSON.stringify({planA: PLAN_A}));
    failures.set(KEY, 1);
    const {result} = renderHook(() => useReadingPlanProgress(), {wrapper});
    await settle();
    await act(async () => {
      await result.current.toggleDay('planB', 1);
    });
    const after = await disk(KEY);
    expect(after.planA).toEqual(PLAN_A);
    expect(after.planB.completedDays).toEqual([1]);
  });

  it('a chapter read re-reads before writing the read-chapter map', async () => {
    await AsyncStorage.setItem(READ_KEY, JSON.stringify({'43:3': true}));
    failures.set(READ_KEY, 1);
    const {result} = renderHook(() => useReadingPlanProgress(), {wrapper});
    await settle();
    await act(async () => {
      await result.current.markChapterRead('John', 4);
    });
    expect(await disk(READ_KEY)).toEqual({'43:3': true, '43:4': true});
  });

  it('two writers while the re-read is out both land', async () => {
    await AsyncStorage.setItem(KEY, JSON.stringify({planA: PLAN_A}));
    failures.set(KEY, 1);
    const {result} = renderHook(() => useReadingPlanProgress(), {wrapper});
    await settle();
    const open = gate(KEY);
    let a!: Promise<void>;
    let b!: Promise<void>;
    act(() => {
      a = result.current.toggleDay('planA', 4);
      b = result.current.setPlanDuration('planC', 30);
    });
    await open();
    await act(async () => {
      await Promise.all([a, b]);
    });
    const after = await disk(KEY);
    expect(after.planA.completedDays).toEqual([1, 2, 3, 4]);
    expect(after.planC.customDuration).toBe(30);
  });

  it('way out: if the re-read fails too, it writes from memory', async () => {
    await AsyncStorage.setItem(KEY, JSON.stringify({planA: PLAN_A}));
    failures.set(KEY, 2);
    const {result} = renderHook(() => useReadingPlanProgress(), {wrapper});
    await settle();
    await act(async () => {
      await result.current.toggleDay('planB', 1);
    });
    expect(Object.keys(await disk(KEY))).toEqual(['planB']);
  });

  it('CONTROL: a read that works keeps the other plans', async () => {
    await AsyncStorage.setItem(KEY, JSON.stringify({planA: PLAN_A}));
    const {result} = renderHook(() => useReadingPlanProgress(), {wrapper});
    await settle();
    await act(async () => {
      await result.current.toggleDay('planB', 1);
    });
    expect((await disk(KEY)).planA).toEqual(PLAN_A);
  });
});
