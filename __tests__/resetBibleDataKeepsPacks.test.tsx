/**
 * Regression — R9-558: «Resetear datos de la Biblia» borraba en silencio las
 * versiones descargadas y dejaba la app apuntando a una versión sin texto.
 *
 * `resetBibleData` borraba TODAS las filas de `verses` y la bandera de TODAS
 * las versiones del catálogo; `initializeBibleData` solo vuelve a cargar las
 * dos que vienen con la app. Con KJV descargada y elegida quedaba: KJV sin
 * filas, `@bible_version` = KJV, el lector en blanco y la búsqueda vacía; sin
 * red, sin forma de recuperarla.
 *
 * Arreglo: el reset solo toca las versiones que vienen con la app. Un pack
 * descargado conserva sus filas, su índice de búsqueda y su bandera.
 *
 * Qué corre de verdad: la pantalla (`DataSettings`), `resetBibleData`, el
 * provider de versiones, y `bibleDB` sobre un SQLite REAL con FTS5
 * (`node:sqlite`, el esquema nativo de `createSchema` y `recursive_triggers`
 * como en `_performInitialization`). sql.js no sirve acá: no trae FTS5, y la
 * mitad del arreglo es el índice (un `DELETE FROM verses_fts` tras el borrado
 * parcial desindexa los packs que quedaron). Lo único sustituido es la
 * recarga, `initializeBibleData` (ver su doble, abajo).
 */
import {act, fireEvent, render, waitFor} from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// `initializeBibleData` cannot run under jest: it loads the two bundled
// arrays with a dynamic `import()`, which this babel setup leaves as is (Metro
// resolves it) and node's vm then refuses. Its stand-in does the same three
// steps per bundled version (flag read, the real `insertVerses`, flag write)
// with three rows instead of 31 000. `resetBibleData` is the real one.
const mockBundled: Record<string, [number, string, number, number, string][]> =
  {
    RVR1960: [
      [43, 'Juan', 3, 16, 'Porque de tal manera amó Dios al mundo'],
      [43, 'Juan', 3, 17, 'Porque no envió Dios a su Hijo'],
      [1, 'Génesis', 1, 1, 'En el principio creó Dios'],
    ],
    WEB: [
      [43, 'John', 3, 16, 'For God so loved the world'],
      [43, 'John', 3, 17, 'For God did not send his Son'],
      [1, 'Genesis', 1, 1, 'In the beginning God created'],
    ],
  };
jest.mock('../src/lib/database/data-loader', () => {
  const actual = jest.requireActual('../src/lib/database/data-loader');
  return {
    ...actual,
    initializeBibleData: async () => {
      const storageModule = require('@react-native-async-storage/async-storage');
      const storage = storageModule.default ?? storageModule;
      const db = require('../src/lib/database').default;
      const {packLoadedKey: key} = require('../src/lib/database/pack-import');
      await db.initialize();
      for (const version of Object.keys(mockBundled)) {
        if ((await storage.getItem(key(version))) === 'true') continue;
        await db.insertVerses(
          mockBundled[version].map(
            ([bookNumber, book, chapter, verse, text]) => ({
              bookNumber,
              book,
              chapter,
              verse,
              text,
              version,
            }),
          ),
        );
        await storage.setItem(key(version), 'true');
      }
    },
  };
});

const mockColors = {
  background: '#0f172a',
  text: '#f1f5f9',
  textSecondary: '#94a3b8',
  primary: '#38bdf8',
  error: '#f87171',
  surface: '#111827',
  border: '#374151',
  overlay: '#00000099',
  onPrimary: '#0f172a',
};
jest.mock('../src/hooks/useTheme', () => ({
  useTheme: () => ({isDark: true, colors: mockColors}),
}));
jest.mock('../src/hooks/useLanguage', () => ({
  useLanguage: () => ({
    language: 'en',
    t: require('../src/i18n/translations').translations.en,
  }),
}));
jest.mock('../src/lib/haptics', () => ({
  haptics: {press: jest.fn(), tap: jest.fn()},
}));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({top: 0, bottom: 0, left: 0, right: 0}),
}));
const mockToastSuccess = jest.fn();
const mockToastError = jest.fn();
jest.mock('../src/context/ToastContext', () => ({
  useToast: () => ({
    success: mockToastSuccess,
    error: mockToastError,
    warning: jest.fn(),
    info: jest.fn(),
  }),
}));
// The backup half of the screen is not in this path.
jest.mock('../src/services/BackupService', () => ({
  exportBackup: jest.fn(),
  pickBackupFileUri: jest.fn(),
  readBackupFileFromUri: jest.fn(),
  parseBackupPayload: jest.fn(),
  importBackup: jest.fn(),
}));

import DataSettings from '../src/components/settings/DataSettings';
import {
  BibleVersionProvider,
  useBibleVersion,
} from '../src/hooks/useBibleVersion';
import bibleDB from '../src/lib/database';
import {packLoadedKey} from '../src/lib/database/pack-import';
import {translations} from '../src/i18n/translations';

const ts = translations.en.settings;
const VERSION_KEY = '@bible_version';

type Param = string | number | null;
interface RawStatement {
  run(...params: Param[]): {changes: number | bigint};
  all(...params: Param[]): unknown[];
  get(...params: Param[]): unknown;
}
interface RawDb {
  exec(sql: string): void;
  prepare(sql: string): RawStatement;
  close(): void;
}

/** The slice of expo-sqlite's `SQLiteDatabase` that `BibleDatabase` uses,
 *  over a real SQLite: every statement is parsed and run by the engine. */
class NodeSqliteAdapter {
  constructor(readonly raw: RawDb) {}

  async runAsync(sql: string, params: Param[] = []) {
    const result = this.raw.prepare(sql).run(...params);
    return {changes: Number(result.changes), lastInsertRowId: 0};
  }
  async getAllAsync<T>(sql: string, params: Param[] = []): Promise<T[]> {
    return this.raw.prepare(sql).all(...params) as T[];
  }
  async getFirstAsync<T>(sql: string, params: Param[] = []): Promise<T | null> {
    return (this.raw.prepare(sql).get(...params) as T | undefined) ?? null;
  }
  async execAsync(sql: string): Promise<void> {
    this.raw.exec(sql);
  }
  async withTransactionAsync(fn: () => Promise<void>): Promise<void> {
    this.raw.exec('BEGIN');
    try {
      await fn();
      this.raw.exec('COMMIT');
    } catch (error) {
      this.raw.exec('ROLLBACK');
      throw error;
    }
  }
}

type Internals = {
  db: NodeSqliteAdapter | null;
  initialized: boolean;
  configureRecursiveTriggers: () => Promise<void>;
  createSchema: () => Promise<void>;
};
const internals = bibleDB as unknown as Internals;

let raw: RawDb;

const KJV = [
  {
    book: 'John',
    bookNumber: 43,
    chapter: 3,
    verse: 16,
    text: 'For God so loved the world, that he gave his only begotten Son',
    version: 'KJV',
  },
  {
    book: 'John',
    bookNumber: 43,
    chapter: 3,
    verse: 17,
    text: 'For God sent not his Son into the world to condemn the world',
    version: 'KJV',
  },
  {
    book: 'Genesis',
    bookNumber: 1,
    chapter: 1,
    verse: 1,
    text: 'In the beginning God created the heaven and the earth',
    version: 'KJV',
  },
];
// What the device held for the two bundled versions before the reset: other
// text than the reload brings, so the test sees the reload really happened.
const stale = (version: string) => [
  {
    book: 'John',
    bookNumber: 43,
    chapter: 3,
    verse: 16,
    text: `damagedtext ${version}`,
    version,
  },
  {
    book: 'John',
    bookNumber: 43,
    chapter: 3,
    verse: 18,
    text: `damagedtext extra ${version}`,
    version,
  },
];

function rowsOf(version: string): number {
  const row = raw
    .prepare('SELECT COUNT(*) AS n FROM verses WHERE version = ?')
    .get(version) as {n: number};
  return Number(row.n);
}

/** Throws when the index and `verses` disagree (SQLite's own check). */
function checkIndex(): void {
  raw.exec(
    "INSERT INTO verses_fts(verses_fts, rank) VALUES('integrity-check', 1);",
  );
}

const seen: string[] = [];
function Spy() {
  const {selectedVersion} = useBibleVersion();
  seen.push(selectedVersion.id);
  return null;
}
const last = () => seen[seen.length - 1];

beforeEach(async () => {
  jest.clearAllMocks();
  seen.length = 0;
  await AsyncStorage.clear();

  const {DatabaseSync} = require('node:sqlite');
  raw = new DatabaseSync(':memory:') as RawDb;
  internals.db = new NodeSqliteAdapter(raw);
  internals.initialized = true;
  await internals.configureRecursiveTriggers();
  await internals.createSchema();

  // A device with KJV downloaded AND chosen, as in the measured case.
  await bibleDB.insertVerses([...stale('RVR1960'), ...stale('WEB'), ...KJV]);
  await AsyncStorage.multiSet([
    [packLoadedKey('RVR1960'), 'true'],
    [packLoadedKey('WEB'), 'true'],
    [packLoadedKey('KJV'), 'true'],
    [VERSION_KEY, 'KJV'],
  ]);
});

afterEach(() => {
  raw.close();
  internals.db = null;
  internals.initialized = false;
});

async function resetFromTheScreen() {
  const utils = render(
    <BibleVersionProvider>
      <Spy />
      <DataSettings />
    </BibleVersionProvider>,
  );
  await waitFor(() => expect(last()).toBe('KJV'));

  fireEvent.press(utils.getByText(ts.dataEntryTitle));
  fireEvent.press(utils.getByText(ts.resetData));
  await waitFor(() => utils.getByText(ts.resetTitle));
  await act(async () => {
    fireEvent.press(utils.getByText(ts.resetConfirm));
  });
  await waitFor(() =>
    expect(mockToastSuccess).toHaveBeenCalledWith(ts.resetSuccessMessage),
  );
  expect(mockToastError).not.toHaveBeenCalled();
  return utils;
}

describe('R9-558 — the Bible data reset keeps the downloaded versions', () => {
  it('sanity: the harness has a real FTS5 index over the three versions', async () => {
    expect(rowsOf('KJV')).toBe(3);
    expect(await bibleDB.searchVerses('begotten', 'KJV')).toHaveLength(1);
    expect(await bibleDB.searchVerses('damagedtext', 'WEB')).toHaveLength(2);
    expect(checkIndex).not.toThrow();
  });

  it('the downloaded and chosen version keeps its text, its flag and its place as the chosen one', async () => {
    await resetFromTheScreen();

    // The rows, as the reader reads them.
    expect(rowsOf('KJV')).toBe(3);
    const chapter = await bibleDB.getChapter(43, 3, 'KJV');
    expect(chapter.map(v => v.text)).toEqual([KJV[0].text, KJV[1].text]);
    // The flag.
    expect(await AsyncStorage.getItem(packLoadedKey('KJV'))).toBe('true');
    // The choice still names a version WITH text.
    expect(await AsyncStorage.getItem(VERSION_KEY)).toBe('KJV');
    expect(last()).toBe('KJV');
    expect((await bibleDB.getDatabaseStats()).versions).toEqual(
      expect.arrayContaining(['KJV', 'RVR1960', 'WEB']),
    );
  });

  it('the kept version is still searchable: the reset does not unindex it', async () => {
    await resetFromTheScreen();

    const hits = await bibleDB.searchVerses('begotten', 'KJV');
    expect(hits.map(v => `${v.book} ${v.chapter}:${v.verse}`)).toEqual([
      'John 3:16',
    ]);
    expect(await bibleDB.searchVerses('world', 'KJV')).toHaveLength(2);
    expect(checkIndex).not.toThrow();
  });

  it('CONTROL: the two bundled versions are really wiped and reloaded', async () => {
    await resetFromTheScreen();

    for (const version of ['RVR1960', 'WEB']) {
      expect(rowsOf(version)).toBe(3);
      expect(await AsyncStorage.getItem(packLoadedKey(version))).toBe('true');
      // The pre-reset rows are gone, from the table and from the index.
      expect(await bibleDB.searchVerses('damagedtext', version)).toEqual([]);
    }
    expect(
      (await bibleDB.getChapter(43, 3, 'RVR1960')).map(v => v.verse),
    ).toEqual([16, 17]);
    expect(await bibleDB.searchVerses('principio', 'RVR1960')).toHaveLength(1);
    expect(await bibleDB.searchVerses('beginning', 'WEB')).toHaveLength(1);
  });
});
