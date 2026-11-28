/**
 * R9-139 — la protección por sección de R9-27, vigilada en TODAS las secciones.
 *
 * R9-27: una sección que el export no pudo leer sale del archivo igual que una
 * vacía; al importar, «vacía» borra lo que el dispositivo tiene. El arreglo
 * marca la sección en `payload.meta.degradedSections` y el import la trata
 * como desconocida: no la toca, y la reporta. Solo estaban vigiladas
 * `favorites`, `highlights`, `prepNotes` y la bandera de `streakLog`
 * (`backupDegradedSections.test.ts`); quitar la guarda de `notes`, de
 * `achievements.stats` (en cualquiera de sus dos lados) o de los otros tres
 * libros de lectura dejaba la suite verde.
 *
 * La tabla sale del PRODUCTOR: un `buildBackup` real con todas las lecturas
 * fallando da (a) la lista de etiquetas y (b) el archivo degradado tal como
 * sale, con sus valores de relleno. Cada etiqueta se importa después con el
 * `importBackup` real y el `AchievementService` real, sobre un dispositivo con
 * datos. Una etiqueta nueva en `buildBackup` sin fila acá hace caer la prueba.
 *
 * Por fila: con la marca, el almacén de esa sección queda intacto; y el
 * CONTROL: el mismo archivo SIN la marca sí lo destruye (si el control no
 * destruye nada, la fila no probaría la guarda). Las filas `inert` son las
 * secciones cuyo relleno ya es «ausente» (`null`, o la clave que no viaja):
 * SIN la marca nada las escribe, y el control fija eso. Las `local:<clave>`
 * son `inert` y aun así dependen de la guarda: con la marca, sin ella el
 * import escribiría `''` sobre la clave (visto con la mutación de `queuePair`).
 *
 * Mutaciones con las que cae (corridas una a una): ver el commit.
 */
jest.mock('../src/lib/database', () => {
  const instance = {
    initialize: jest.fn().mockResolvedValue(undefined),
    foldVerseNotesInTransaction: jest.fn(async () => ({
      written: [],
      removedIds: [],
    })),
    getDatabase: jest.fn().mockResolvedValue({
      withTransactionAsync: async (fn: () => Promise<void>) => fn(),
      execAsync: jest.fn().mockResolvedValue(undefined),
      runAsync: jest.fn().mockResolvedValue(undefined),
    }),
    executeSql: jest.fn(),
    getFavorites: jest.fn(),
    getNotes: jest.fn(),
    getReadingProgress: jest.fn(),
  };
  return {
    __esModule: true,
    default: instance,
    bibleDB: instance,
    BibleDatabase: jest.fn(),
    __mockInstance: instance,
  };
});
const mockGetAllReviewEvents = jest.fn();
jest.mock('../src/lib/memory/reviewEventStore', () => ({
  getAllReviewEvents: (...args: unknown[]) => mockGetAllReviewEvents(...args),
}));
jest.mock('../src/lib/sync', () => ({
  ...jest.requireActual('../src/lib/sync'),
  getSyncEngine: () => null,
}));

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as DatabaseModule from '../src/lib/database';
import {AchievementService} from '../src/lib/achievements/AchievementService';
import {setAchievementServiceInstance} from '../src/lib/achievements/instance';
import {__resetBackupRestoredListenersForTests} from '../src/lib/backup/restoreSignal';
import {__resetPrepAccountForTests} from '../src/features/study/prepAccount';
import {
  buildBackup,
  importBackup,
  LOCAL_BACKUP_KEYS,
  type BackupPayload,
} from '../src/services/BackupService';

interface MockDb {
  executeSql: jest.Mock;
  getFavorites: jest.Mock;
  getNotes: jest.Mock;
  getReadingProgress: jest.Mock;
}
const mockDb = (DatabaseModule as unknown as {__mockInstance: MockDb})
  .__mockInstance;

const AS = AsyncStorage as unknown as {
  getItem: (key: string) => Promise<string | null>;
};
const realGetItem = AS.getItem;

/** Every read answers: an empty table, a zero count, a null row. */
function healthyReads() {
  mockDb.executeSql.mockReset().mockImplementation(async (sql: string) => {
    const rows = /COUNT\(\*\)/i.test(sql) ? [{count: 0}] : [];
    return {rows: {_array: rows, length: rows.length}};
  });
  mockDb.getFavorites.mockReset().mockResolvedValue([]);
  mockDb.getNotes.mockReset().mockResolvedValue([]);
  mockDb.getReadingProgress.mockReset().mockResolvedValue(null);
  mockGetAllReviewEvents.mockReset().mockResolvedValue([]);
  AS.getItem = realGetItem;
}

/** A device whose every read throws while the backup is being built. */
function failingReads() {
  const busy = async () => {
    throw new Error('mock: SQLite busy');
  };
  mockDb.executeSql.mockReset().mockImplementation(busy);
  mockDb.getFavorites.mockReset().mockImplementation(busy);
  mockDb.getNotes.mockReset().mockImplementation(busy);
  mockDb.getReadingProgress.mockReset().mockImplementation(busy);
  mockGetAllReviewEvents.mockReset().mockImplementation(busy);
  AS.getItem = jest.fn(async () => {
    throw new Error('mock: AsyncStorage I/O error');
  });
}

/**
 * The REAL service over the mocked db: its getters (the export's reads) and
 * its `restoreBackup` (the other half of the guard) run as shipped. Only its
 * schema bootstrap is skipped: there is no SQLite under this mock.
 */
function realAchievementService(): AchievementService {
  const service = new AchievementService(
    mockDb as unknown as ConstructorParameters<typeof AchievementService>[0],
  );
  service.initialize = jest.fn().mockResolvedValue(undefined);
  return service;
}

type Row =
  | {
      /** A statement of the import that rewrites this section's table. */
      sql: RegExp;
      /** The name `failedSections` reports it under, or null: not reported. */
      reported: string | null;
      /** True when the file's filler is already «absent»: nothing writes it. */
      inert?: true;
    }
  | {
      /** The AsyncStorage keys this section is restored into. */
      keys: string[];
      reported: string | null;
      inert?: true;
    };

/**
 * One row per label `buildBackup` can put in `degradedSections` (the
 * `local:<key>` ones are generated below). The first test compares this list
 * against the labels the real export produces.
 */
const TABLE: Record<string, Row> = {
  favorites: {sql: /^DELETE FROM favorites/, reported: 'favorites'},
  notes: {sql: /^DELETE FROM notes/, reported: 'notes'},
  highlights: {sql: /^DELETE FROM highlights/, reported: 'highlights'},
  lastReadPosition: {
    sql: /^UPDATE reading_progress/,
    reported: 'lastReadPosition',
    inert: true,
  },
  chapterProgressMap: {
    keys: ['readingProgress'],
    reported: 'chapterProgressMap',
  },
  readingPlanProgress: {
    keys: ['@reading_plan_progress'],
    reported: 'readingPlanProgress',
  },
  readingPlanReadChapters: {
    keys: ['@reading_plan_read_chapters'],
    reported: 'readingPlanReadChapters',
  },
  searchHistory: {keys: ['@bible_search_history'], reported: 'searchHistory'},
  // The three below: the filler is `null`, so the import finds nothing to
  // write and never reaches the guard; it does not REPORT them either.
  readerPreferences: {
    keys: ['@reader_side_by_side'],
    reported: null,
    inert: true,
  },
  readerPreferencesFull: {
    keys: ['@reader_preferences'],
    reported: null,
    inert: true,
  },
  appTheme: {
    keys: ['@app_theme_mode', '@app_color_theme'],
    reported: null,
    inert: true,
  },
  memoryDeck: {keys: ['@memory_deck'], reported: 'memoryDeck'},
  prepNotes: {keys: ['@prep_notes'], reported: 'prepNotes'},
  prepSeries: {keys: ['@prep_series'], reported: 'prepSeries'},
  prepIllustrations: {
    keys: ['@prep_illustrations'],
    reported: 'prepIllustrations',
  },
  prepSelfReview: {keys: ['@prep_self_review'], reported: 'prepSelfReview'},
  'achievements.stats': {
    sql: /^UPDATE user_stats SET\s+total_verses_read/,
    reported: 'achievements.stats',
  },
  'achievements.list': {
    sql: /^UPDATE user_achievements SET is_unlocked/,
    reported: 'achievements.list',
    inert: true,
  },
  'achievements.streakLog': {
    sql: /^DELETE FROM reading_streak_log/,
    reported: 'achievements.streakLog',
  },
  'achievements.completedBooks': {
    sql: /^DELETE FROM completed_books/,
    reported: 'achievements.completedBooks',
  },
  'achievements.bookReadingLog': {
    sql: /^DELETE FROM book_reading_log/,
    reported: 'achievements.bookReadingLog',
  },
  'achievements.chaptersReadLog': {
    sql: /^DELETE FROM chapters_read_log/,
    reported: 'achievements.chaptersReadLog',
  },
  reviewEvents: {sql: /^DELETE FROM review_events/, reported: 'reviewEvents'},
  // A verbatim key the export could not read is absent from the file.
  // Unmarked, an absent key is never written. Marked, it is queued with `''`
  // and only `queuePair`'s guard keeps that off the device.
  ...Object.fromEntries(
    LOCAL_BACKUP_KEYS.map(key => [
      `local:${key}`,
      {keys: [key], reported: `local:${key}`, inert: true} as Row,
    ]),
  ),
};
const LABELS = Object.keys(TABLE);

/** What this device holds under a key before the import. */
const onDevice = (key: string) => JSON.stringify({deviceOwn: key});
const DEVICE_KEYS = LABELS.flatMap(label => {
  const row = TABLE[label];
  return 'keys' in row ? row.keys : [];
});

/** The degraded file, exactly as the real export writes it. */
let degradedFile: BackupPayload;
let producedLabels: string[];

beforeAll(async () => {
  await AsyncStorage.clear();
  __resetPrepAccountForTests();
  failingReads();
  setAchievementServiceInstance(realAchievementService());
  const out = await buildBackup();
  degradedFile = out.payload;
  producedLabels = out.degradedSections;
  healthyReads();
});

beforeEach(async () => {
  healthyReads();
  await AsyncStorage.clear();
  __resetBackupRestoredListenersForTests();
  __resetPrepAccountForTests();
  await AsyncStorage.multiSet(DEVICE_KEYS.map(key => [key, onDevice(key)]));
  // The REAL service: half of the guard lives in its `restoreBackup`.
  setAchievementServiceInstance(realAchievementService());
});

afterAll(() => {
  AS.getItem = realGetItem;
  setAchievementServiceInstance(null);
});

function statementsMatching(sql: RegExp): number {
  return mockDb.executeSql.mock.calls.filter(([text]: [string]) =>
    sql.test(text.trim()),
  ).length;
}

/** Was this section's store rewritten by the import? */
async function rewritten(row: Row): Promise<boolean> {
  if ('sql' in row) return statementsMatching(row.sql) > 0;
  for (const key of row.keys) {
    if ((await AsyncStorage.getItem(key)) !== onDevice(key)) return true;
  }
  return false;
}

const importWithMarks = (marks: string[]) =>
  importBackup({...degradedFile, meta: {degradedSections: marks}});

describe('R9-139 — the table is the list the real export produces', () => {
  it('an export whose every read throws marks exactly the labels of the table', () => {
    expect([...producedLabels].sort()).toEqual([...LABELS].sort());
    // …and the marks are in the file, which is what the import reads.
    expect([...(degradedFile.meta?.degradedSections ?? [])].sort()).toEqual(
      [...LABELS].sort(),
    );
  });

  it('the fully degraded file, imported as it is, rewrites nothing on the device', async () => {
    const result = await importBackup(degradedFile);

    for (const label of LABELS) {
      expect([label, await rewritten(TABLE[label])]).toEqual([label, false]);
    }
    expect(result.restoredSections).toEqual([]);
  });
});

describe.each(LABELS.map(label => [label, TABLE[label]] as const))(
  'R9-139 — a file that marks only «%s» as degraded',
  (label, row) => {
    it('leaves that section of the device alone', async () => {
      await importWithMarks([label]);

      expect(await rewritten(row)).toBe(false);
    });

    it(
      row.reported === null
        ? 'does not report it (pinned: its filler is absent, the guard is never reached)'
        : 'reports it as not restored',
      async () => {
        const result = await importWithMarks([label]);

        if (row.reported === null) {
          expect(result.failedSections).toEqual([]);
        } else {
          expect(result.failedSections).toEqual([row.reported]);
          expect(result.restoredSections).not.toContain(row.reported);
        }
      },
    );

    it(
      row.inert
        ? 'CONTROL: unmarked, the absent filler writes nothing either'
        : 'CONTROL: the same file WITHOUT the mark does rewrite it',
      async () => {
        const result = await importWithMarks([]);

        expect(await rewritten(row)).toBe(!row.inert);
        expect(result.failedSections).toEqual([]);
      },
    );
  },
);
