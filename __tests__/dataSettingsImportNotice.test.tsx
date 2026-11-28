/**
 * R9-141 — el aviso de «cerrá y volvé a abrir» tras importar una copia.
 *
 * Es la mitad de R9-28 que cubre lo que la señal de restauración no alcanza:
 * `importBackup` avisa a los providers que pisarían lo restaurado, pero no
 * puede refrescar cada pantalla ya montada (no hay recarga programática), así
 * que Ajustes muestra un diálogo BLOQUEANTE que pide reiniciar. Ninguna prueba
 * lo vigilaba: sin `setRestartNoticeVisible(true)` todo seguía verde.
 *
 * Qué cubre hoy ese aviso (medido por lectura en la sesión 191, con R9-117 ya
 * arreglado): las pantallas montadas que ni escuchan la señal ni releen al
 * volver el foco. El lector abierto (los subrayados del capítulo se cargan por
 * capítulo), `reading-insights` (lee al montar) y el historial de Buscar
 * (R9-529). Notas, Subrayados e Inicio releen con el foco; favoritos, mazo,
 * progreso, preferencias, tema, idioma y versión escuchan la señal.
 *
 * La pantalla real (`DataSettings`) con `parseBackupPayload` e `importBackup`
 * REALES: el resultado que decide el aviso es el del servicio, no un mock con
 * otra forma. Solo se sustituyen el selector de archivos y la lectura del
 * archivo (no hay sistema de archivos), y debajo, SQLite y el motor de sync.
 */
import {act, fireEvent, render, waitFor} from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

jest.mock('../src/lib/database', () => {
  const instance = {
    initialize: jest.fn().mockResolvedValue(undefined),
    foldVerseNotesInTransaction: jest.fn(async () => ({
      written: [],
      removedIds: [],
    })),
    getDatabase: jest.fn().mockResolvedValue({
      withTransactionAsync: async (fn: () => Promise<void>) => fn(),
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

const mockPickBackupFileUri = jest.fn();
const mockReadBackupFileFromUri = jest.fn();
jest.mock('../src/services/BackupService', () => ({
  ...jest.requireActual('../src/services/BackupService'),
  pickBackupFileUri: (...args: unknown[]) => mockPickBackupFileUri(...args),
  readBackupFileFromUri: (...args: unknown[]) =>
    mockReadBackupFileFromUri(...args),
}));

jest.mock('../src/lib/database/data-loader', () => ({
  initializeBibleData: jest.fn(),
  resetBibleData: jest.fn(),
}));

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
    language: 'es',
    t: require('../src/i18n/translations').translations.es,
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
const mockToastWarning = jest.fn();
jest.mock('../src/context/ToastContext', () => ({
  useToast: () => ({
    success: mockToastSuccess,
    error: mockToastError,
    warning: mockToastWarning,
    info: jest.fn(),
  }),
}));

import DataSettings from '../src/components/settings/DataSettings';
import {setAchievementServiceInstance} from '../src/lib/achievements/instance';
import {__resetBackupRestoredListenersForTests} from '../src/lib/backup/restoreSignal';
import {__resetPrepAccountForTests} from '../src/features/study/prepAccount';
import {translations} from '../src/i18n/translations';

const ts = translations.es.settings;

const note = (id: string) => ({
  id,
  book: 'John',
  chapter: 3,
  verse: 16,
  text: 'Porque de tal manera amó Dios al mundo',
  note: 'una nota',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
});

/** The text of a backup file of this app, as the picker hands it over. */
function backupFile(notes: unknown[]): string {
  return JSON.stringify({
    formatVersion: 2,
    generatedAt: '2026-11-10T22:40:00.000Z',
    app: {name: 'Eternal Stone Bible', package: 'com.eternalstonebible.app'},
    bible: {
      favorites: [],
      notes,
      highlights: [],
      lastReadPosition: null,
      chapterProgressMap: {John: {'3': 100}},
    },
    user: {searchHistory: ['gracia']},
  });
}
/** A whole, healthy file. */
const FILE_OK = backupFile([note('n1')]);
/** The S137 partial file: every row of `notes` fails validation. */
const FILE_PARTIAL = backupFile([{foo: 'roto-1'}, {foo: 'roto-2'}]);
const FILE_MALFORMED =
  '{"formatVersion": 2, "bible": {"notes": [ {"note": "mal"';

beforeEach(async () => {
  jest.clearAllMocks();
  await AsyncStorage.clear();
  __resetBackupRestoredListenersForTests();
  __resetPrepAccountForTests();
  setAchievementServiceInstance(null);
  mockPickBackupFileUri.mockResolvedValue('file://copia.json');
});

/** Ajustes → Datos → Importar → the file → «Importar y reemplazar». */
async function importFile(fileText: string) {
  mockReadBackupFileFromUri.mockResolvedValue(fileText);
  const utils = render(<DataSettings />);
  fireEvent.press(utils.getByText(ts.dataEntryTitle));
  await act(async () => {
    fireEvent.press(utils.getByText(ts.importBackup));
  });
  await waitFor(() => utils.getByText(ts.importConfirmCta));
  await act(async () => {
    fireEvent.press(utils.getByText(ts.importConfirmCta));
  });
  // The import ran to its end: one of the three toasts was asked for.
  await waitFor(() =>
    expect(
      mockToastSuccess.mock.calls.length +
        mockToastWarning.mock.calls.length +
        mockToastError.mock.calls.length,
    ).toBe(1),
  );
  return utils;
}

describe('R9-141 — the blocking «close and reopen» notice after an import', () => {
  it('a whole backup: the notice is up, asks for the restart, and stays until its button', async () => {
    const {getByText, queryByText} = await importFile(FILE_OK);

    expect(mockToastSuccess).toHaveBeenCalledWith(ts.importSuccess);
    // The file really landed: this is the import the notice follows.
    expect(await AsyncStorage.getItem('readingProgress')).toBe(
      JSON.stringify({John: {'3': 100}}),
    );
    expect(getByText(ts.importRestartTitle)).toBeTruthy();
    expect(getByText(ts.importRestartMessage)).toBeTruthy();

    // It does not go away on its own, as the toast does.
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 50));
    });
    expect(getByText(ts.importRestartTitle)).toBeTruthy();

    fireEvent.press(getByText(ts.importRestartCta));
    expect(queryByText(ts.importRestartTitle)).toBeNull();
  });

  it('a partial import: what did land is just as stale, so the notice is up too', async () => {
    const {getByText} = await importFile(FILE_PARTIAL);

    expect(mockToastWarning).toHaveBeenCalledWith(ts.importPartial);
    expect(await AsyncStorage.getItem('readingProgress')).toBe(
      JSON.stringify({John: {'3': 100}}),
    );
    expect(getByText(ts.importRestartCta)).toBeTruthy();
  });

  it('CONTROL: an import that fails restored nothing, and asks for no restart', async () => {
    const {queryByText} = await importFile(FILE_MALFORMED);

    expect(mockToastError).toHaveBeenCalledWith(ts.importError);
    expect(queryByText(ts.importRestartTitle)).toBeNull();
    expect(queryByText(ts.importRestartCta)).toBeNull();
  });

  it('CONTROL: before any import there is no notice', () => {
    const {getByText, queryByText} = render(<DataSettings />);
    fireEvent.press(getByText(ts.dataEntryTitle));

    expect(queryByText(ts.importRestartTitle)).toBeNull();
    expect(queryByText(ts.importRestartCta)).toBeNull();
  });
});
