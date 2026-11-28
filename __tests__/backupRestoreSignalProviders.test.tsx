/**
 * R9-116 — la prueba de R9-28 cubría 1 de los 4 providers de su arreglo.
 *
 * R9-28: `importBackup` escribe AsyncStorage por detrás de los providers que
 * hidrataron al montar; los que persisten su objeto o su mapa ENTERO desde la
 * memoria escribían la copia de antes del import encima de lo restaurado, en
 * la primera interacción. El arreglo los suscribe a `subscribeBackupRestored`:
 * el mazo de memoria, las preferencias del lector, el progreso de los planes y
 * el progreso por capítulo. Solo el mazo tenía prueba
 * (`MemoryDeckContext.test.tsx`): quitar la suscripción de los otros tres
 * dejaba la suite entera verde.
 *
 * Una fila por provider, con el provider REAL y el `importBackup` REAL (no un
 * `emitBackupRestored` a mano: el aviso lo emite quien escribe). Dos casos por
 * fila, separados a propósito: (1) la memoria se re-hidrata; (2) la siguiente
 * interacción no pisa lo restaurado, que es la pérdida de datos.
 *
 * Mutación con la que cae cada fila: quitar el `subscribeBackupRestored` de
 * ese provider (y solo esa fila cae).
 */
import React from 'react';
import {act, renderHook, waitFor} from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

jest.mock('../src/lib/database', () => {
  const instance = {
    initialize: jest.fn().mockResolvedValue(undefined),
    foldVerseNotesInTransaction: jest.fn(async () => ({
      written: [],
      removedIds: [],
    })),
    getDatabase: jest.fn().mockResolvedValue({
      withTransactionAsync: async (fn: () => Promise<void>) => {
        await fn();
      },
    }),
    executeSql: jest.fn(async () => ({rows: {_array: [], length: 0}})),
  };
  return {
    __esModule: true,
    default: instance,
    bibleDB: instance,
    BibleDatabase: jest.fn(),
  };
});
jest.mock('../src/lib/achievements/AchievementService', () => {
  const instance = {
    initialize: jest.fn().mockResolvedValue(undefined),
    restoreBackup: jest.fn().mockResolvedValue(undefined),
  };
  return {AchievementService: jest.fn().mockImplementation(() => instance)};
});
jest.mock('../src/lib/sync', () => ({
  ...jest.requireActual('../src/lib/sync'),
  getSyncEngine: () => null,
}));
// The memory deck calibrates its ease prior from the review log (SQLite).
jest.mock('../src/lib/memory/reviewEventStore', () => ({
  __esModule: true,
  getAllReviewEvents: jest.fn().mockResolvedValue([]),
  addReviewEvent: jest.fn().mockResolvedValue(undefined),
  getReviewEventById: jest.fn().mockResolvedValue(null),
  removeReviewEvent: jest.fn().mockResolvedValue(undefined),
}));

import {
  MemoryDeckProvider,
  useMemoryDeck,
} from '../src/context/MemoryDeckContext';
import {
  ReaderPreferencesProvider,
  useReaderPreferences,
} from '../src/context/ReaderPreferencesContext';
import {
  ReadingPlanProgressProvider,
  useReadingPlanProgress,
} from '../src/context/ReadingPlanProgressContext';
import {
  ReadingProgressProvider,
  useReadingProgress,
} from '../src/context/ReadingProgressContext';
import {setAchievementServiceInstance} from '../src/lib/achievements/instance';
import {__resetBackupRestoredListenersForTests} from '../src/lib/backup/restoreSignal';
import {__resetPrepAccountForTests} from '../src/features/study/prepAccount';
import {
  importBackup,
  BACKUP_FORMAT_VERSION,
  type BackupPayload,
} from '../src/services/BackupService';

const settle = () =>
  act(async () => {
    await new Promise(resolve => setTimeout(resolve, 30));
  });

function card(verseKey: string, bookName: string, chapter: number) {
  return {
    [verseKey]: {
      verseKey,
      bookName,
      chapter,
      verse: 1,
      text: 'texto',
      version: 'KJV',
      box: 1,
      dueAt: '2026-01-01T00:00:00.000Z',
      addedAt: '2026-01-01T00:00:00.000Z',
      lastReviewedAt: null,
      reviewCount: 0,
      lapseCount: 0,
      updatedAt: 1,
    },
  };
}
const plan = (days: number[]) => ({
  startedAt: '2026-01-01T00:00:00.000Z',
  completedDays: days,
});

interface Row<T> {
  /** The provider, by the name the entry gives it. */
  name: string;
  key: string;
  /** What the device holds, and the provider hydrates, before the import. */
  before: unknown;
  /** The slice of the backup file that carries this provider's store. */
  file: Partial<BackupPayload>;
  section: string;
  Provider: React.ComponentType<{children: React.ReactNode}>;
  useStore: () => T;
  ready: (store: T) => boolean;
  /** What the mounted provider holds, in a comparable form. */
  inMemory: (store: T) => unknown;
  memoryBefore: unknown;
  memoryRestored: unknown;
  /** The first write a user makes after the import. */
  interact: (store: T) => void | Promise<void>;
  /** The disk after it: what the file brought plus that write, nothing older. */
  diskAfter: (disk: Record<string, unknown>) => unknown;
  expectedDiskAfter: unknown;
}
const row = <T,>(r: Row<T>) => r as unknown as Row<unknown>;

const ROWS: Row<unknown>[] = [
  row({
    name: 'MemoryDeck',
    key: '@memory_deck',
    before: card('Psalms/23/1', 'Psalms', 23),
    file: {
      memory: {memoryDeck: card('John/3/16', 'John', 3), reviewEvents: []},
    } as unknown as Partial<BackupPayload>,
    section: 'memoryDeck',
    Provider: MemoryDeckProvider,
    useStore: useMemoryDeck,
    ready: s => s.hydrated,
    inMemory: s => s.cards.map(c => c.verseKey),
    memoryBefore: ['Psalms/23/1'],
    memoryRestored: ['John/3/16'],
    interact: s => {
      s.addCard({
        bookName: 'Mark',
        chapter: 1,
        verse: 1,
        text: 'El principio del evangelio',
        version: 'KJV',
      });
    },
    diskAfter: disk => Object.keys(disk).sort(),
    expectedDiskAfter: ['John/3/16', 'Mark/1/1'],
  }),
  row({
    name: 'ReaderPreferences',
    key: '@reader_preferences',
    before: {fontSize: 24, margin: 'small', sepiaGrandfathered: false},
    file: {
      user: {
        readerPreferencesFull: {
          fontSize: 18,
          margin: 'small',
          sepiaGrandfathered: false,
        },
      },
    } as unknown as Partial<BackupPayload>,
    section: 'readerPreferences',
    Provider: ReaderPreferencesProvider,
    useStore: useReaderPreferences,
    ready: s => s.hydrated,
    inMemory: s => s.preferences.fontSize,
    memoryBefore: 24,
    memoryRestored: 18,
    interact: s => s.setMargin('large'),
    diskAfter: disk => ({fontSize: disk.fontSize, margin: disk.margin}),
    expectedDiskAfter: {fontSize: 18, margin: 'large'},
  }),
  row({
    name: 'ReadingPlanProgress',
    key: '@reading_plan_progress',
    before: {planA: plan([1, 2, 3])},
    file: {
      user: {readingPlanProgress: {planB: plan([7])}},
    } as unknown as Partial<BackupPayload>,
    section: 'readingPlanProgress',
    Provider: ReadingPlanProgressProvider,
    useStore: useReadingPlanProgress,
    ready: () => true,
    inMemory: s => [s.getCompletedDays('planA'), s.getCompletedDays('planB')],
    memoryBefore: [[1, 2, 3], []],
    memoryRestored: [[], [7]],
    interact: s => s.toggleDay('planC', 1),
    diskAfter: disk =>
      Object.fromEntries(
        Object.entries(disk as Record<string, {completedDays: number[]}>).map(
          ([id, p]) => [id, p.completedDays],
        ),
      ),
    expectedDiskAfter: {planB: [7], planC: [1]},
  }),
  row({
    name: 'ReadingProgress',
    key: 'readingProgress',
    before: {John: {'3': 100}},
    file: {
      bible: {chapterProgressMap: {Luke: {'2': 50}}},
    } as unknown as Partial<BackupPayload>,
    section: 'chapterProgressMap',
    Provider: ReadingProgressProvider,
    useStore: useReadingProgress,
    ready: () => true,
    inMemory: s => [
      s.getChapterProgress('John', '3'),
      s.getChapterProgress('Luke', '2'),
    ],
    memoryBefore: [100, 0],
    memoryRestored: [0, 50],
    interact: s => s.updateChapterProgress('Mark', '1', 30),
    diskAfter: disk => disk,
    expectedDiskAfter: {Luke: {'2': 50}, Mark: {'1': 30}},
  }),
];

beforeEach(async () => {
  await AsyncStorage.clear();
  __resetBackupRestoredListenersForTests();
  __resetPrepAccountForTests();
  setAchievementServiceInstance(null);
});

/** Mount over the pre-import disk, then import the file behind the provider. */
async function mountAndImport(r: Row<unknown>) {
  await AsyncStorage.setItem(r.key, JSON.stringify(r.before));
  const wrapper = ({children}: {children: React.ReactNode}) => (
    <r.Provider>{children}</r.Provider>
  );
  const hook = renderHook(() => r.useStore(), {wrapper});
  await waitFor(() => expect(r.ready(hook.result.current)).toBe(true));
  await settle();
  // The provider really holds the pre-import copy: without this the case
  // below could pass over a provider that never hydrated.
  expect(r.inMemory(hook.result.current)).toEqual(r.memoryBefore);

  let restored: string[] = [];
  await act(async () => {
    const result = await importBackup({
      formatVersion: BACKUP_FORMAT_VERSION,
      generatedAt: '2026-11-01T00:00:00.000Z',
      app: {name: 'Eternal Stone Bible', package: 'com.eternalstonebible.app'},
      ...r.file,
    } as BackupPayload);
    restored = result.restoredSections;
  });
  await settle();
  expect(restored).toContain(r.section);
  return hook;
}

describe.each(ROWS.map(r => [r.name, r] as const))(
  'R9-116 — %s after a backup import',
  (_name, r) => {
    it('holds what the file brought, not its pre-import copy', async () => {
      const hook = await mountAndImport(r);
      expect(r.inMemory(hook.result.current)).toEqual(r.memoryRestored);
    });

    it('its next write does not put the pre-import copy back over the restore', async () => {
      const hook = await mountAndImport(r);
      await act(async () => {
        await r.interact(hook.result.current);
      });
      await settle();
      const disk = JSON.parse((await AsyncStorage.getItem(r.key)) ?? 'null');
      expect(r.diskAfter(disk)).toEqual(r.expectedDiskAfter);
    });
  },
);

it('the table names the four providers of the R9-28 fix', () => {
  expect(ROWS.map(r => r.name).sort()).toEqual([
    'MemoryDeck',
    'ReaderPreferences',
    'ReadingPlanProgress',
    'ReadingProgress',
  ]);
});
