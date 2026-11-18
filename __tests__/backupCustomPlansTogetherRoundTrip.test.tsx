/**
 * R9-30 — the custom plans and the together groups travel: `buildBackup`
 * carries them in `payload.local`, and `importBackup` writes them on a fresh
 * device. Before, the backup brought a custom plan's PROGRESS without the
 * plan itself, and a together plan without «Leyendo con {{grupo}}».
 *
 * End to end with the providers mounted: the import's own signal makes them
 * re-read, and a save right after keeps what was restored. Why the providers
 * can take it (they re-read on the signal) is pinned in
 * `customPlansTogetherRestoreSignal.test.tsx`.
 *
 * Lo REAL: BackupService, both providers and the restore signal, over the
 * AsyncStorage mock. Lo sustituido: SQLite and the achievements.
 */
jest.mock('../src/lib/database', () => {
  const instance = {
    initialize: jest.fn().mockResolvedValue(undefined),
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

import {Text} from 'react-native';
import {act, cleanup, render} from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type {AchievementService} from '../src/lib/achievements/AchievementService';
import {setAchievementServiceInstance} from '../src/lib/achievements/instance';
import {buildBackup, importBackup} from '../src/services/BackupService';
import {
  CustomPlansProvider,
  useCustomPlans,
  type CustomPlansContextValue,
} from '../src/context/CustomPlansContext';
import {
  TogetherProvider,
  useTogether,
  type TogetherContextValue,
} from '../src/context/TogetherContext';
import {__resetBackupRestoredListenersForTests} from '../src/lib/backup/restoreSignal';
import type {ReadingPlan} from '../src/constants/reading-plans';

const plan = (id: string): ReadingPlan =>
  ({
    id,
    title: id,
    description: id,
    days: [{day: 1, readings: [{bookId: 43, chapters: [1]}]}],
  }) as unknown as ReadingPlan;

const VALUES: Record<string, string> = {
  '@custom_plans': JSON.stringify([plan('custom-juan')]),
  '@together_groups': JSON.stringify({
    'custom-juan': {
      name: 'Familia',
      startDate: '2026-10-01',
      joinedAt: '2026-10-01T00:00:00.000Z',
    },
  }),
};

const settle = async () => {
  for (let i = 0; i < 5; i++) await new Promise(r => setImmediate(r));
};

let plans: CustomPlansContextValue | null = null;
let together: TogetherContextValue | null = null;
function Capture() {
  plans = useCustomPlans();
  together = useTogether();
  return <Text>ok</Text>;
}

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
afterEach(() => cleanup());
afterAll(() => setAchievementServiceInstance(null));

describe('R9-30 — custom plans and together groups travel', () => {
  it('the file carries them, the import writes them, and a save keeps them', async () => {
    await AsyncStorage.multiSet(Object.entries(VALUES));
    const {payload} = await buildBackup();
    const file = JSON.parse(JSON.stringify(payload));
    for (const [key, value] of Object.entries(VALUES)) {
      expect(file.local[key]).toBe(value);
    }

    // The fresh device: the providers are already mounted (they live at the
    // root), with something of their own made before the restore.
    await AsyncStorage.clear();
    render(
      <CustomPlansProvider>
        <TogetherProvider>
          <Capture />
        </TogetherProvider>
      </CustomPlansProvider>,
    );
    await act(settle);
    await act(async () => {
      await plans!.saveCustomPlan(plan('PRE'));
    });

    let result: Awaited<ReturnType<typeof importBackup>> | null = null;
    await act(async () => {
      result = await importBackup(file);
      await settle();
    });
    expect(result!.failedSections).toEqual([]);

    expect(plans!.getCustomPlanById('custom-juan')).toBeDefined();
    expect(together!.getMembership('custom-juan')?.name).toBe('Familia');

    await act(async () => {
      await plans!.saveCustomPlan(plan('NUEVO'));
      await together!.joinPlan('NUEVO', {startDate: '2026-11-01'});
    });
    const ids = (
      JSON.parse(
        (await AsyncStorage.getItem('@custom_plans'))!,
      ) as ReadingPlan[]
    ).map(p => p.id);
    expect(ids.sort()).toEqual(['NUEVO', 'custom-juan']);
    expect(
      Object.keys(
        JSON.parse((await AsyncStorage.getItem('@together_groups'))!),
      ).sort(),
    ).toEqual(['NUEVO', 'custom-juan']);
  });
});
