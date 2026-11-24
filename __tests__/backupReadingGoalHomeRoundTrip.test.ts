/**
 * R9-30 — the daily reading goal and the Home "Ver también en…" toggle
 * travel: `buildBackup` carries them in `payload.local`, and `importBackup`
 * writes them on a fresh device. Before, both stayed behind.
 *
 * End to end with the Home hook mounted: the import's own signal makes it
 * re-read, and a toggle right after starts from the restored value. Why the
 * readers can take it is pinned in `homeAlsoVersionsRestoreSignal.test.ts`
 * and `goalsSettingsRestoreSignal.test.tsx`.
 *
 * Lo REAL: BackupService, readingGoalStore, useHomeAlsoVersions and the
 * restore signal, over the AsyncStorage mock. Lo sustituido: SQLite, the
 * achievements and haptics.
 */
jest.mock('../src/lib/database', () => {
  const instance = {
    initialize: jest.fn().mockResolvedValue(undefined),
    // R9-51 — the import folds the notes it wrote (none here).
    foldVerseNotesInTransaction: jest.fn(async () => ({
      written: [],
      removedIds: [],
    })),
    getDatabase: jest.fn().mockResolvedValue({
      withTransactionAsync: async (fn: () => Promise<void>) => fn(),
      execAsync: jest.fn().mockResolvedValue(undefined),
      runAsync: jest.fn().mockResolvedValue(undefined),
      getAllAsync: jest.fn().mockResolvedValue([]),
    }),
    executeSql: jest.fn(async () => ({rows: {_array: [], length: 0}})),
    getFavorites: jest.fn().mockResolvedValue([]),
    getNotes: jest.fn().mockResolvedValue([]),
    getReadingProgress: jest.fn().mockResolvedValue(null),
  };
  return {__esModule: true, default: instance, bibleDB: instance};
});
jest.mock('@lib/haptics', () => ({haptics: {tap: jest.fn()}}));

import {act, renderHook, waitFor} from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type {AchievementService} from '../src/lib/achievements/AchievementService';
import {setAchievementServiceInstance} from '../src/lib/achievements/instance';
import {buildBackup, importBackup} from '../src/services/BackupService';
import {getReadingGoal} from '../src/lib/reading/readingGoalStore';
import {useHomeAlsoVersions} from '../src/hooks/useHomeAlsoVersions';
import {__resetBackupRestoredListenersForTests} from '../src/lib/backup/restoreSignal';

describe('R9-30 — @reading_daily_goal and @home_also_versions travel', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    __resetBackupRestoredListenersForTests();
    setAchievementServiceInstance({
      initialize: jest.fn().mockResolvedValue(undefined),
      getRawUserStats: jest.fn().mockResolvedValue({}),
      getAllAchievements: jest.fn().mockResolvedValue([]),
      getReadingLog: jest.fn().mockResolvedValue([]),
      getCompletedBooks: jest.fn().mockResolvedValue([]),
      getBookReadingLog: jest.fn().mockResolvedValue([]),
      getChaptersReadLog: jest.fn().mockResolvedValue([]),
      restoreBackup: jest.fn().mockResolvedValue(undefined),
    } as unknown as AchievementService);
  });

  afterAll(() => setAchievementServiceInstance(null));

  it('a round trip carries both to a fresh device, and Home re-reads', async () => {
    await AsyncStorage.multiSet([
      ['@reading_daily_goal', '30'],
      ['@home_also_versions', '1'],
    ]);
    const {payload} = await buildBackup();
    const file = JSON.parse(JSON.stringify(payload));

    // The fresh device: defaults, with Home already mounted.
    await AsyncStorage.clear();
    const {result} = renderHook(() => useHomeAlsoVersions());
    await act(async () => {});
    expect(result.current.alsoVersionsVisible).toBe(false);

    let importResult: Awaited<ReturnType<typeof importBackup>> | undefined;
    await act(async () => {
      importResult = await importBackup(file);
    });
    expect(importResult?.failedSections).toEqual([]);
    expect(await getReadingGoal()).toBe(30);
    await waitFor(() => expect(result.current.alsoVersionsVisible).toBe(true));

    // A toggle right after starts from the restored ON.
    act(() => result.current.toggleAlsoVersions());
    await waitFor(async () =>
      expect(await AsyncStorage.getItem('@home_also_versions')).toBe('0'),
    );
  });

  it('CONTROL: a file without `local` (older build) leaves both alone', async () => {
    const {payload} = await buildBackup();
    const file = JSON.parse(JSON.stringify(payload));
    delete file.local;
    await AsyncStorage.multiSet([
      ['@reading_daily_goal', '50'],
      ['@home_also_versions', '1'],
    ]);
    await importBackup(file);
    expect(await AsyncStorage.getItem('@reading_daily_goal')).toBe('50');
    expect(await AsyncStorage.getItem('@home_also_versions')).toBe('1');
  });
});
