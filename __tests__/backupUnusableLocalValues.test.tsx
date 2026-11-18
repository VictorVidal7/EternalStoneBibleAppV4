/**
 * R9-608, R9-611 — a `local` value this build cannot use, from a backup file
 * (a newer build that knows another language or version, or a hand-edited
 * file). The live providers ignore it; before the fix the import still wrote
 * it, so the next cold start no longer found this device's own choice: the
 * language fell to the device's, the version to the language's.
 *
 * The import now leaves such a value out, and live and cold agree. A version
 * in the catalog that this device has not downloaded is still written: it
 * falls back the same way live and cold (R9-424), and the choice is kept.
 *
 * Lo REAL: buildBackup / importBackup, LanguageProvider, BibleVersionProvider
 * and the restore signal, over the AsyncStorage mock. Lo sustituido: the DB
 * (empty tables; which versions are installed) and the device locale.
 */
import {act, create, ReactTestRenderer} from 'react-test-renderer';
import AsyncStorage from '@react-native-async-storage/async-storage';

let mockInstalled: string[] = [];
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
    getDatabaseStats: jest.fn(async () => ({
      totalVerses: 93000,
      versions: mockInstalled,
    })),
  };
  return {__esModule: true, default: instance, bibleDB: instance};
});

// The device is set to Spanish; the app was set to English by the user.
jest.mock('expo-localization', () => ({
  getLocales: () => [{languageCode: 'es'}],
}));

import type {AchievementService} from '../src/lib/achievements/AchievementService';
import {setAchievementServiceInstance} from '../src/lib/achievements/instance';
import {buildBackup, importBackup} from '../src/services/BackupService';
import {LanguageProvider, useLanguage} from '../src/hooks/useLanguage';
import {
  BibleVersionProvider,
  useBibleVersion,
} from '../src/hooks/useBibleVersion';
import {__resetBackupRestoredListenersForTests} from '../src/lib/backup/restoreSignal';
import {invalidateLanguageCache} from '../src/i18n/languageUtils';

let shown = {language: '', version: ''};
function Spy() {
  const {language} = useLanguage();
  const {selectedVersion} = useBibleVersion();
  shown = {language, version: selectedVersion.id};
  return null;
}

async function settle(turns = 30) {
  for (let i = 0; i < turns; i++) {
    await act(async () => {
      await Promise.resolve();
    });
  }
}

async function mount(): Promise<ReactTestRenderer> {
  let renderer: ReactTestRenderer | undefined;
  await act(async () => {
    renderer = create(
      <LanguageProvider>
        <BibleVersionProvider>
          <Spy />
        </BibleVersionProvider>
      </LanguageProvider>,
    );
  });
  await settle();
  return renderer as ReactTestRenderer;
}

/** A file from another device: this build's export, with `local` edited. */
async function fileWith(local: Record<string, string>) {
  const {payload} = await buildBackup();
  const file = JSON.parse(JSON.stringify(payload));
  file.local = {...file.local, ...local};
  return file;
}

/** Import on the mounted tree, then a cold start. Screen and disk each time. */
async function restoreLiveThenCold(file: unknown) {
  const renderer = await mount();
  await act(async () => {
    await importBackup(file as never);
  });
  await settle();
  const live = {...shown};
  const disk = await AsyncStorage.multiGet(['@app_language', '@bible_version']);
  act(() => renderer.unmount());
  __resetBackupRestoredListenersForTests();
  invalidateLanguageCache();

  const cold = await mount();
  const afterCold = {...shown};
  const diskAfterCold = await AsyncStorage.multiGet([
    '@app_language',
    '@bible_version',
  ]);
  act(() => cold.unmount());
  return {
    live,
    disk: Object.fromEntries(disk),
    cold: afterCold,
    diskAfterCold: Object.fromEntries(diskAfterCold),
  };
}

describe('R9-608, R9-611 — a value this build cannot use is not restored', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    __resetBackupRestoredListenersForTests();
    invalidateLanguageCache();
    mockInstalled = ['RVR1960', 'WEB', 'KJV'];
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

  it('R9-608: an unknown language keeps the chosen one, live and cold', async () => {
    const file = await fileWith({'@app_language': 'xx'});
    await AsyncStorage.multiSet([
      ['@app_language', 'en'],
      ['@bible_version', 'KJV'],
    ]);
    const out = await restoreLiveThenCold(file);
    expect(out).toEqual({
      live: {language: 'en', version: 'KJV'},
      disk: {'@app_language': 'en', '@bible_version': 'KJV'},
      cold: {language: 'en', version: 'KJV'},
      diskAfterCold: {'@app_language': 'en', '@bible_version': 'KJV'},
    });
  });

  it('R9-611: an id outside the catalog keeps the chosen version, live and cold', async () => {
    const file = await fileWith({
      '@app_language': 'es',
      '@bible_version': 'NBLA',
    });
    await AsyncStorage.multiSet([
      ['@app_language', 'en'],
      ['@bible_version', 'KJV'],
    ]);
    const out = await restoreLiveThenCold(file);
    expect(out).toEqual({
      live: {language: 'es', version: 'KJV'},
      disk: {'@app_language': 'es', '@bible_version': 'KJV'},
      cold: {language: 'es', version: 'KJV'},
      diskAfterCold: {'@app_language': 'es', '@bible_version': 'KJV'},
    });
  });

  it('CONTROL: a known version this device lacks is written, and live and cold agree', async () => {
    const file = await fileWith({
      '@app_language': 'es',
      '@bible_version': 'RV1909',
    });
    await AsyncStorage.multiSet([
      ['@app_language', 'en'],
      ['@bible_version', 'KJV'],
    ]);
    const out = await restoreLiveThenCold(file);
    // RV1909 is not installed: the same-language fallback, choice on disk.
    expect(out).toEqual({
      live: {language: 'es', version: 'RVR1960'},
      disk: {'@app_language': 'es', '@bible_version': 'RV1909'},
      cold: {language: 'es', version: 'RVR1960'},
      diskAfterCold: {'@app_language': 'es', '@bible_version': 'RV1909'},
    });
  });

  it('CONTROL: a valid language and version are written as before', async () => {
    const file = await fileWith({
      '@app_language': 'es',
      '@bible_version': 'RVR1960',
    });
    await AsyncStorage.multiSet([
      ['@app_language', 'en'],
      ['@bible_version', 'KJV'],
    ]);
    const out = await restoreLiveThenCold(file);
    expect(out.live).toEqual({language: 'es', version: 'RVR1960'});
    expect(out.cold).toEqual(out.live);
    expect(out.disk).toEqual({
      '@app_language': 'es',
      '@bible_version': 'RVR1960',
    });
  });
});
