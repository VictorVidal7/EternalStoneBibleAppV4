/**
 * DataSettings — consolidated into a single Ajustes row that opens a
 * full-screen modal containing export / import / reset actions (same
 * pattern as NotificationsSettings/GoalsSettings), instead of three
 * separate cards permanently inline. Locks: (a) the actions aren't present
 * until the entry row is tapped, (b) reset and import still go through their
 * own ConfirmDialog before doing anything destructive, (c) the honest
 * partial-failure toasts (degradedSections / failedSections) still fire
 * instead of a false "success", unchanged from the inline version this
 * replaced.
 */
import {render, fireEvent, waitFor, act} from '@testing-library/react-native';
import DataSettings from '../src/components/settings/DataSettings';
import {translations} from '../src/i18n/translations';

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

const mockExportBackup = jest.fn();
const mockPickBackupFileUri = jest.fn();
const mockReadBackupFileFromUri = jest.fn();
const mockParseBackupPayload = jest.fn();
const mockImportBackup = jest.fn();
jest.mock('../src/services/BackupService', () => ({
  exportBackup: (...args: unknown[]) => mockExportBackup(...args),
  pickBackupFileUri: (...args: unknown[]) => mockPickBackupFileUri(...args),
  readBackupFileFromUri: (...args: unknown[]) =>
    mockReadBackupFileFromUri(...args),
  parseBackupPayload: (...args: unknown[]) => mockParseBackupPayload(...args),
  importBackup: (...args: unknown[]) => mockImportBackup(...args),
}));

const mockInitializeBibleData = jest.fn();
const mockResetBibleData = jest.fn();
jest.mock('../src/lib/database/data-loader', () => ({
  initializeBibleData: (...args: unknown[]) => mockInitializeBibleData(...args),
  resetBibleData: (...args: unknown[]) => mockResetBibleData(...args),
}));

const ts = translations.es.settings;

function openModal() {
  const utils = render(<DataSettings />);
  fireEvent.press(utils.getByText(ts.dataEntryTitle));
  return utils;
}

describe('DataSettings', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockResetBibleData.mockResolvedValue(undefined);
    mockInitializeBibleData.mockResolvedValue(undefined);
  });

  it('shows the entry row but not the actions until tapped', () => {
    const {getByText, queryByText} = render(<DataSettings />);

    expect(getByText(ts.dataEntryTitle)).toBeTruthy();
    expect(getByText(ts.dataEntryDesc)).toBeTruthy();
    expect(queryByText(ts.exportBackup)).toBeNull();
    expect(queryByText(ts.importBackup)).toBeNull();
    expect(queryByText(ts.resetData)).toBeNull();
  });

  it('reveals export/import/reset after tapping the entry row', () => {
    const {getByText} = openModal();

    expect(getByText(ts.exportBackup)).toBeTruthy();
    expect(getByText(ts.importBackup)).toBeTruthy();
    expect(getByText(ts.resetData)).toBeTruthy();
  });

  it('exports cleanly without a partial-failure toast when nothing degraded', async () => {
    mockExportBackup.mockResolvedValue({degradedSections: []});
    const {getByText} = openModal();

    await act(async () => {
      fireEvent.press(getByText(ts.exportBackup));
    });

    await waitFor(() => expect(mockExportBackup).toHaveBeenCalledTimes(1));
    expect(mockToastWarning).not.toHaveBeenCalled();
    expect(mockToastError).not.toHaveBeenCalled();
  });

  it('surfaces an honest partial toast when export degrades a section', async () => {
    mockExportBackup.mockResolvedValue({degradedSections: ['favorites']});
    const {getByText} = openModal();

    await act(async () => {
      fireEvent.press(getByText(ts.exportBackup));
    });

    await waitFor(() =>
      expect(mockToastWarning).toHaveBeenCalledWith(ts.exportPartial),
    );
  });

  it('asks for confirmation before importing, then imports on confirm', async () => {
    mockPickBackupFileUri.mockResolvedValue('file://backup.json');
    mockReadBackupFileFromUri.mockResolvedValue('{"raw":"data"}');
    mockParseBackupPayload.mockReturnValue({sections: {}});
    mockImportBackup.mockResolvedValue({
      failedSections: [],
      asyncStorageWriteFailed: false,
    });
    const {getByText} = openModal();

    await act(async () => {
      fireEvent.press(getByText(ts.importBackup));
    });

    // The destructive confirm dialog shows before anything is imported —
    // its CTA copy ("Importar y reemplazar") is distinct from the action
    // row's own label ("Importar copia de seguridad"), which stays mounted
    // behind the dialog.
    expect(await waitFor(() => getByText(ts.importConfirmCta))).toBeTruthy();
    expect(mockImportBackup).not.toHaveBeenCalled();

    await act(async () => {
      fireEvent.press(getByText(ts.importConfirmCta));
    });

    await waitFor(() =>
      expect(mockToastSuccess).toHaveBeenCalledWith(ts.importSuccess),
    );
  });

  it('surfaces an honest partial toast when import partially fails', async () => {
    mockPickBackupFileUri.mockResolvedValue('file://backup.json');
    mockReadBackupFileFromUri.mockResolvedValue('{"raw":"data"}');
    mockParseBackupPayload.mockReturnValue({sections: {}});
    mockImportBackup.mockResolvedValue({
      failedSections: ['notes'],
      asyncStorageWriteFailed: false,
    });
    const {getByText} = openModal();

    await act(async () => {
      fireEvent.press(getByText(ts.importBackup));
    });
    await waitFor(() => getByText(ts.importConfirmCta));
    await act(async () => {
      fireEvent.press(getByText(ts.importConfirmCta));
    });

    await waitFor(() =>
      expect(mockToastWarning).toHaveBeenCalledWith(ts.importPartial),
    );
  });

  it('asks for confirmation before resetting, then resets on confirm', async () => {
    const {getByText} = openModal();

    fireEvent.press(getByText(ts.resetData));

    expect(await waitFor(() => getByText(ts.resetTitle))).toBeTruthy();
    expect(mockResetBibleData).not.toHaveBeenCalled();

    await act(async () => {
      fireEvent.press(getByText(ts.resetConfirm));
    });

    await waitFor(() => expect(mockResetBibleData).toHaveBeenCalledTimes(1));
    expect(mockInitializeBibleData).toHaveBeenCalledTimes(1);
    expect(mockToastSuccess).toHaveBeenCalledWith(ts.resetSuccessMessage);
  });

  it('does not reset when the confirm dialog is cancelled', async () => {
    const {getByText, queryByText} = openModal();

    fireEvent.press(getByText(ts.resetData));
    await waitFor(() => getByText(ts.resetTitle));

    fireEvent.press(getByText(translations.es.cancel));

    expect(mockResetBibleData).not.toHaveBeenCalled();
    expect(queryByText(ts.resetTitle)).toBeNull();
  });
});
