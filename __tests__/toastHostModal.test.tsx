/**
 * R9-560 — a toast fired while a native Modal is open is drawn INSIDE that
 * modal's tree (its window), not as a sibling in the main window behind it.
 *
 * Measured in the emulator (S138): every backup toast fired from the «Datos»
 * modal was drawn behind it; a malformed import showed nothing. Here with the
 * REAL ToastProvider, the REAL DataSettings and ConfirmDialog, and the REAL
 * `parseBackupPayload` (the malformed-JSON throw is the producer): only the
 * file picker, the file read and the export are stubbed.
 *
 * "Inside the modal" = reachable with `within(<that Modal>)`. The root
 * provider renders its toast as a sibling of the app, outside every Modal.
 */
import {Modal, Text, TouchableOpacity} from 'react-native';
import {
  render,
  fireEvent,
  waitFor,
  act,
  within,
} from '@testing-library/react-native';
import {ToastProvider, useToast} from '../src/context/ToastContext';
import {ToastHost} from '../src/context/ToastLayer';
import DataSettings from '../src/components/settings/DataSettings';
import {translations} from '../src/i18n/translations';

const mockColors = {
  background: '#0f172a',
  text: '#f1f5f9',
  textSecondary: '#94a3b8',
  primary: '#38bdf8',
  error: '#f87171',
  warning: '#fbbf24',
  success: '#34d399',
  info: '#38bdf8',
  surface: '#111827',
  cardSolid: '#111827',
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
jest.mock('@expo/vector-icons', () => ({Ionicons: () => null}));
jest.mock('expo-blur', () => {
  const {View} = require('react-native');
  return {BlurView: View};
});

const mockPick = jest.fn();
const mockRead = jest.fn();
const mockExport = jest.fn();
const mockImport = jest.fn();
jest.mock('../src/services/BackupService', () => ({
  ...jest.requireActual('../src/services/BackupService'),
  pickBackupFileUri: (...a: unknown[]) => mockPick(...a),
  readBackupFileFromUri: (...a: unknown[]) => mockRead(...a),
  exportBackup: (...a: unknown[]) => mockExport(...a),
  importBackup: (...a: unknown[]) => mockImport(...a),
}));
jest.mock('../src/lib/database/data-loader', () => ({
  initializeBibleData: jest.fn().mockResolvedValue(undefined),
  resetBibleData: jest.fn().mockResolvedValue(undefined),
}));

const ts = translations.es.settings;

let api: ReturnType<typeof useToast> | null = null;
function Grab() {
  api = useToast();
  return null;
}

function renderApp() {
  const utils = render(
    <ToastProvider>
      <Grab />
      <DataSettings />
    </ToastProvider>,
  );
  fireEvent.press(utils.getByText(ts.dataEntryTitle));
  return utils;
}

function visibleModals(utils: ReturnType<typeof render>) {
  return utils.UNSAFE_getAllByType(Modal).filter(m => m.props.visible);
}

/** The «Datos» modal: the visible Modal that holds the export row. */
function dataModal(utils: ReturnType<typeof render>) {
  const m = visibleModals(utils).find(
    x => within(x).queryByText(ts.exportBackup) !== null,
  );
  if (!m) throw new Error('«Datos» modal not open');
  return m;
}

beforeEach(() => {
  jest.useFakeTimers();
  jest.clearAllMocks();
  api = null;
});
afterEach(() => {
  jest.useRealTimers();
});

it('a malformed import shows its error toast inside the «Datos» modal', async () => {
  mockPick.mockResolvedValue('file://roto.json');
  mockRead.mockResolvedValue('{esto no es json');
  const utils = renderApp();

  await act(async () => {
    fireEvent.press(utils.getByText(ts.importBackup));
  });
  await act(async () => {
    fireEvent.press(utils.getByText(ts.importConfirmCta));
  });

  // The producer: the real parseBackupPayload threw, nothing was imported.
  expect(mockImport).not.toHaveBeenCalled();
  await waitFor(() =>
    expect(within(dataModal(utils)).getByText(ts.importError)).toBeTruthy(),
  );
  // Drawn exactly once (the root does not also draw it behind the modal).
  expect(utils.getAllByText(ts.importError)).toHaveLength(1);
});

it('an export error toast is drawn inside the «Datos» modal', async () => {
  mockExport.mockRejectedValue(new Error('share failed'));
  const utils = renderApp();

  await act(async () => {
    fireEvent.press(utils.getByText(ts.exportBackup));
  });

  await waitFor(() =>
    expect(within(dataModal(utils)).getByText(ts.exportError)).toBeTruthy(),
  );
  expect(utils.getAllByText(ts.exportError)).toHaveLength(1);
});

it('the partial-import warning is drawn in the restart dialog, the topmost window', async () => {
  mockPick.mockResolvedValue('file://parcial.json');
  mockRead.mockResolvedValue(
    JSON.stringify({formatVersion: 1, app: {}, data: {}}),
  );
  mockImport.mockResolvedValue({
    failedSections: ['notes'],
    asyncStorageWriteFailed: false,
  });
  const utils = renderApp();

  await act(async () => {
    fireEvent.press(utils.getByText(ts.importBackup));
  });
  await act(async () => {
    fireEvent.press(utils.getByText(ts.importConfirmCta));
  });

  await waitFor(() => expect(mockImport).toHaveBeenCalledTimes(1));
  const restart = visibleModals(utils).find(
    x => within(x).queryByText(ts.importRestartTitle) !== null,
  );
  expect(restart).toBeTruthy();
  // includeHiddenElements: the dialog's card carries accessibilityViewIsModal
  // (focusTrapProps), which RNTL — like VoiceOver — applies to its siblings,
  // the host included. The toast still reaches a screen reader through its
  // own announceForAccessibility; what this measures is the WINDOW it is in.
  const hidden = {includeHiddenElements: true};
  await waitFor(() =>
    expect(within(restart!).getByText(ts.importPartial, hidden)).toBeTruthy(),
  );
  expect(utils.getAllByText(ts.importPartial, hidden)).toHaveLength(1);
});

it('control: with no modal open the root draws the toast, outside every Modal', async () => {
  const utils = render(
    <ToastProvider>
      <Grab />
      <DataSettings />
    </ToastProvider>,
  );
  await act(async () => {
    api!.success('Copiado');
  });
  expect(utils.getByText('Copiado')).toBeTruthy();
  for (const m of utils.UNSAFE_getAllByType(Modal)) {
    expect(within(m).queryByText('Copiado')).toBeNull();
  }
});

it('control: closing the modal hands a live toast back to the root', async () => {
  mockExport.mockRejectedValue(new Error('share failed'));
  const utils = renderApp();
  await act(async () => {
    fireEvent.press(utils.getByText(ts.exportBackup));
  });
  await waitFor(() =>
    expect(within(dataModal(utils)).getByText(ts.exportError)).toBeTruthy(),
  );

  await act(async () => {
    fireEvent.press(utils.getByLabelText(translations.es.close));
  });

  expect(visibleModals(utils)).toHaveLength(0);
  expect(utils.getAllByText(ts.exportError)).toHaveLength(1);
});

it('control: the host overlay never takes touches outside the toast (box-none)', async () => {
  let pressed = 0;
  function Probe() {
    return (
      <Modal visible>
        <TouchableOpacity onPress={() => pressed++}>
          <Text>tocar</Text>
        </TouchableOpacity>
        <ToastHost />
      </Modal>
    );
  }
  const utils = render(
    <ToastProvider>
      <Grab />
      <Probe />
    </ToastProvider>,
  );
  await act(async () => {
    api!.info('Hola');
  });
  const msg = utils.getByText('Hola');
  // Walk up to the overlay the host drew: every ancestor up to the Modal
  // that is a positioned overlay must let touches through.
  let node = msg.parent;
  let overlay = null;
  while (node) {
    if (node.props?.pointerEvents === 'box-none') {
      overlay = node;
      break;
    }
    node = node.parent;
  }
  expect(overlay).toBeTruthy();
  fireEvent.press(utils.getByText('tocar'));
  expect(pressed).toBe(1);
});
