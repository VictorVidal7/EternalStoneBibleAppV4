/**
 * R9-30 (S164) — the sermon notes and the devotional draft travel:
 * `buildBackup` carries them verbatim in `payload.local`, and `importBackup`
 * writes them on a fresh device. Before, neither had any way back: they are
 * device-local, with no copy in the cloud.
 *
 * `@sermon_notes` is one key per device for every account (free tier, no
 * `prepKey`), like the other `payload.local` keys: the file replaces the
 * device's value, and a file without the key leaves it alone. Why the
 * screens can take a restore (they re-read on the signal) is pinned in
 * `sermonNotesRestoreSignal.test.tsx` and
 * `devotionalDraftRestoreSignal.test.tsx`.
 *
 * Lo REAL: BackupService and the stores' codecs, over the AsyncStorage mock.
 * Lo sustituido: SQLite and the achievements.
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

import AsyncStorage from '@react-native-async-storage/async-storage';
import type {AchievementService} from '../src/lib/achievements/AchievementService';
import {setAchievementServiceInstance} from '../src/lib/achievements/instance';
import {buildBackup, importBackup} from '../src/services/BackupService';
import {
  getSermonNote,
  saveSermonNoteSession,
} from '../src/features/study/sermonNotesStore';
import {serializeSermonNotesMap} from '../src/features/study/sermonNotes';
import {
  parseDevotionalDraft,
  serializeDevotionalDraft,
} from '../src/lib/together/devotionalDraft';
import {todayDateISO} from '../src/lib/together/bundle';

const VALUES: Record<string, string> = {
  '@sermon_notes': serializeSermonNotesMap({
    n1: {
      id: 'n1',
      title: 'Domingo',
      source: 'Iglesia X',
      bodyText: 'Juan 3:16 — el amor de Dios',
      createdAt: 1,
      updatedAt: 1,
    },
  }),
  '@devotional_draft': serializeDevotionalDraft({
    title: 'Treinta días',
    startDate: todayDateISO(),
    days: [{bookId: 19, chapter: 23, verse: 1, note: 'El Señor es mi pastor'}],
  }),
};

beforeEach(async () => {
  await AsyncStorage.clear();
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

describe('R9-30 — sermon notes and the devotional draft travel', () => {
  it('the file carries them, and the import writes them on a fresh device', async () => {
    await AsyncStorage.multiSet(Object.entries(VALUES));
    const {payload} = await buildBackup();
    const file = JSON.parse(JSON.stringify(payload));
    for (const [key, value] of Object.entries(VALUES)) {
      expect(file.local[key]).toBe(value);
    }

    await AsyncStorage.clear();
    const result = await importBackup(file);
    expect(result.failedSections).toEqual([]);

    expect(await getSermonNote('n1')).toMatchObject({
      title: 'Domingo',
      bodyText: 'Juan 3:16 — el amor de Dios',
    });
    expect(
      parseDevotionalDraft(await AsyncStorage.getItem('@devotional_draft'))
        ?.title,
    ).toBe('Treinta días');

    // The store's next write builds on the restored map.
    await saveSermonNoteSession('n1', {title: 'Domingo editado'});
    expect(await getSermonNote('n1')).toMatchObject({
      title: 'Domingo editado',
      source: 'Iglesia X',
    });
  });

  it('CONTROL: a file without them leaves the device values alone', async () => {
    const {payload} = await buildBackup();
    const file = JSON.parse(JSON.stringify(payload));
    expect(file.local['@sermon_notes']).toBeUndefined();
    await AsyncStorage.multiSet(Object.entries(VALUES));
    await importBackup(file);
    expect(await AsyncStorage.getItem('@sermon_notes')).toBe(
      VALUES['@sermon_notes'],
    );
    expect(await AsyncStorage.getItem('@devotional_draft')).toBe(
      VALUES['@devotional_draft'],
    );
  });
});
