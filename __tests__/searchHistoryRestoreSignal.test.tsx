/**
 * R9-529 — el historial de búsqueda que el respaldo restaura lo pisaba la
 * primera búsqueda, si la pestaña Buscar ya estaba montada.
 *
 * `app/(tabs)/search.tsx` hidrataba `searchHistory` solo al montar, y
 * `recordSearch` escribe `[nueva, ...lo que tiene en memoria]` ENTERO sobre
 * `@bible_search_history`, que `importBackup` acababa de escribir. La pestaña
 * sigue montada mientras el usuario importa en Ajustes: la lista de antes del
 * import volvía al disco con la primera búsqueda. Arreglo: la pantalla escucha
 * `subscribeBackupRestored` y relee la clave, como los providers de R9-28.
 *
 * `importBackup` REAL y la pantalla REAL (la sonda de la sesión 132, hecha
 * prueba). Debajo se sustituyen SQLite, el servicio de logros y el motor de
 * sync; la búsqueda de «amor» devuelve filas para que se registre.
 */
import {act, fireEvent, render} from '@testing-library/react-native';

jest.mock('../src/lib/database', () => {
  const rows = (count: number, query: string) =>
    Array.from({length: count}, (_, i) => ({
      id: i + 1,
      bookNumber: 43,
      book: 'Juan',
      chapter: 1,
      verse: i + 1,
      text: `el ${query} ${i}`,
      version: 'RVR1960',
    }));
  const instance = {
    initialize: jest.fn(async () => undefined),
    searchVerses: jest.fn(async (query: string) =>
      query.trim() === 'amor' ? rows(5, 'amor') : [],
    ),
    searchByBook: jest.fn(async () => []),
    foldVerseNotesInTransaction: jest.fn(async () => ({
      written: [],
      removedIds: [],
    })),
    getDatabase: jest.fn(async () => ({
      withTransactionAsync: async (fn: () => Promise<void>) => {
        await fn();
      },
    })),
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

jest.mock('@hooks/useBibleVersion', () => {
  const value = {
    selectedVersion: {
      id: 'RVR1960',
      abbreviation: 'RVR1960',
      language: 'es',
      name: 'RVR1960',
    },
  };
  return {useBibleVersion: () => value};
});
jest.mock('@hooks/useLanguage', () => {
  const value = {
    language: 'es',
    t: require('../src/i18n/translations').translations.es,
  };
  return {useLanguage: () => value};
});
jest.mock('@hooks/useTheme', () => {
  const colors = new Proxy({}, {get: () => '#123456'});
  const value = {colors, isDark: false, gradient: null};
  return {useTheme: () => value};
});
jest.mock('@context/ServicesContext', () => {
  const value = {achievementService: null, notifyAchievements: () => {}};
  return {useServices: () => value};
});
jest.mock('expo-router', () => {
  const router = {push: jest.fn(), back: jest.fn()};
  return {useRouter: () => router};
});
jest.mock('@expo/vector-icons', () => ({Ionicons: () => null}));
jest.mock('expo-linear-gradient', () => {
  const {View} = require('react-native');
  return {LinearGradient: View};
});
jest.mock('@components/SkeletonLoader', () => ({VerseSkeleton: () => null}));
jest.mock('@components/IllustratedEmptyState', () => ({
  IllustratedEmptyState: () => null,
}));

import AsyncStorage from '@react-native-async-storage/async-storage';
import SearchScreen from '../app/(tabs)/search';
import {setAchievementServiceInstance} from '../src/lib/achievements/instance';
import {__resetBackupRestoredListenersForTests} from '../src/lib/backup/restoreSignal';
import {__resetPrepAccountForTests} from '../src/features/study/prepAccount';
import {translations} from '../src/i18n/translations';
import {importBackup, type BackupPayload} from '../src/services/BackupService';

const t = translations.es;
const KEY = '@bible_search_history';
const BEFORE = ['viejo uno', 'viejo dos'];
const RESTORED = ['gracia', 'fe viva', 'pacto'];
const backup = {
  formatVersion: 2,
  generatedAt: '2026-11-01T00:00:00.000Z',
  app: {name: 'Eternal Stone Bible', package: 'com.eternalstonebible.app'},
  user: {searchHistory: RESTORED},
} as unknown as BackupPayload;

const wait = (ms: number) =>
  act(() => new Promise<void>(resolve => setTimeout(resolve, ms)));
const onDisk = async () =>
  JSON.parse((await AsyncStorage.getItem(KEY)) ?? 'null');

async function importTheBackup() {
  let restored: string[] = [];
  await act(async () => {
    restored = (await importBackup(backup)).restoredSections;
  });
  expect(restored).toContain('searchHistory');
  expect(await onDisk()).toEqual(RESTORED);
}

beforeEach(async () => {
  await AsyncStorage.clear();
  __resetBackupRestoredListenersForTests();
  __resetPrepAccountForTests();
  setAchievementServiceInstance(null);
  await AsyncStorage.setItem(KEY, JSON.stringify(BEFORE));
});

describe('R9-529 — the search history after a backup is restored', () => {
  it('the mounted tab shows the restored searches, not the ones from before', async () => {
    const screen = render(<SearchScreen />);
    await wait(50);
    // The tab really held the pre-import list.
    for (const query of BEFORE) expect(screen.getByText(query)).toBeTruthy();

    await importTheBackup();
    await wait(50);

    for (const query of RESTORED) expect(screen.getByText(query)).toBeTruthy();
    for (const query of BEFORE) expect(screen.queryByText(query)).toBeNull();
    screen.unmount();
  });

  it('the first search after the import keeps what was restored', async () => {
    const screen = render(<SearchScreen />);
    await wait(50);
    for (const query of BEFORE) expect(screen.getByText(query)).toBeTruthy();

    await importTheBackup();
    await wait(50);
    fireEvent.changeText(
      screen.getByPlaceholderText(t.search.placeholder),
      'amor',
    );
    await wait(700);

    expect(await onDisk()).toEqual(['amor', ...RESTORED]);
    screen.unmount();
  });

  it('CONTROL: a tab mounted after the import (a restart) always kept it', async () => {
    await importTheBackup();
    const screen = render(<SearchScreen />);
    await wait(50);
    fireEvent.changeText(
      screen.getByPlaceholderText(t.search.placeholder),
      'amor',
    );
    await wait(700);

    expect(await onDisk()).toEqual(['amor', ...RESTORED]);
    screen.unmount();
  });
});
