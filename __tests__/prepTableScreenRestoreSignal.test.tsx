/**
 * R9-602 (R9-30 vecino) — the Mesa re-reads its notes when a backup is restored.
 *
 * The screen holds the notes of the passage on screen in `drafts`, and each
 * keystroke and each blur writes a WHOLE section from that copy. Its focus
 * re-read covers a restore made while the user was in Settings, but not one
 * that lands after the user came back (an import still running): the next
 * keystroke or blur wrote the pre-import section over the restored one, and
 * a save still pending when the restore landed did the same.
 *
 * Lo REAL: the screen, `prepNotesStore` and the restore signal, over the
 * stateful AsyncStorage mock of jest.setup.js. Lo sustituido: the harness of
 * `prepTableScreenNotesRefocus.test.tsx` (router, theme, database, toast).
 * The restore itself is played as what `importBackup` leaves behind: the
 * file's sections on disk (written here with `savePrepNote`), then the
 * signal.
 */
import {act, fireEvent, render, waitFor} from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import PrepTableScreen from '../app/features/prep/index';
import {PremiumProvider} from '../src/context/PremiumContext';
import * as prepNotesStore from '../src/features/study/prepNotesStore';
import {getPrepNotes, savePrepNote} from '../src/features/study/prepNotesStore';
import {
  __resetBackupRestoredListenersForTests,
  emitBackupRestored,
} from '../src/lib/backup/restoreSignal';
import {translations} from '../src/i18n/translations';

// Captures every useFocusEffect callback the screen registers, in
// registration order, so a test can manually re-invoke the LATEST one to
// simulate "the reader navigated back to this screen" without a real
// navigation/focus event system (expo-router itself is mocked away).
const focusCallbacks: Array<() => void> = [];

jest.mock('expo-router', () => {
  const ReactActual = require('react');
  return {
    useRouter: () => ({push: jest.fn(), back: jest.fn()}),
    useLocalSearchParams: () => ({
      book: 'John',
      chapter: '3',
      startVerse: '16',
      version: 'RVR1960',
    }),
    useFocusEffect: (cb: () => void) => {
      focusCallbacks.push(cb);
      ReactActual.useEffect(cb, [cb]);
    },
    Stack: {Screen: () => null},
  };
});

jest.mock('@expo/vector-icons', () => ({
  Ionicons: () => null,
  // The Markdown format toolbar next to each section's note input renders
  // MaterialCommunityIcons — stub it the same no-op way as Ionicons above.
  MaterialCommunityIcons: () => null,
}));

jest.mock('expo-linear-gradient', () => {
  const {View} = require('react-native');
  return {LinearGradient: View};
});

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({top: 0, bottom: 0, left: 0, right: 0}),
}));

jest.mock('@lib/haptics', () => ({
  haptics: {tap: jest.fn(), success: jest.fn()},
}));

jest.mock('@context/ToastContext', () => ({
  useToast: () => ({
    success: jest.fn(),
    error: jest.fn(),
    warning: jest.fn(),
    info: jest.fn(),
    show: jest.fn(),
  }),
}));

jest.mock('expo-clipboard', () => ({
  setStringAsync: jest.fn(async () => true),
}));

jest.mock('expo-print', () => ({
  printToFileAsync: jest.fn(async () => ({uri: 'file://mock-prep.pdf'})),
}));

jest.mock('expo-sharing', () => ({
  isAvailableAsync: jest.fn(async () => true),
  shareAsync: jest.fn(async () => undefined),
}));

jest.mock('@hooks/useTheme', () => ({
  useTheme: () => ({
    colors: {
      background: '#000000',
      card: '#111111',
      border: '#222222',
      primary: '#6366f1',
      primaryDark: '#4338ca',
      text: '#ffffff',
      textSecondary: '#cccccc',
      textTertiary: '#999999',
    },
  }),
}));

jest.mock('@hooks/useLanguage', () => ({
  useLanguage: () => ({
    language: 'es',
    t: require('../src/i18n/translations').translations.es,
  }),
}));

jest.mock('@hooks/useBibleVersion', () => ({
  useBibleVersion: () => ({
    selectedVersion: {id: 'RVR1960', language: 'es', abbreviation: 'RVR1960'},
  }),
}));

jest.mock('@context/OfferingSheetContext', () => ({
  useOfferingSheet: () => ({open: jest.fn()}),
}));

jest.mock('@lib/database/originals-download-service', () => ({
  downloadAndImportOriginals: jest.fn(),
  importLocalOriginalsIfPresent: jest.fn(async () => false),
  isOriginalsUpdateAvailable: jest.fn(async () => false),
}));

jest.mock('@lib/database', () => ({
  __esModule: true,
  default: {
    getVerse: jest.fn(async (_b: number, _c: number, v: number) => ({
      text: `Texto del versículo ${v}`,
    })),
    getChapterVerseCount: jest.fn(async () => 36),
  },
}));

jest.mock('@lib/comparison/VersionComparison', () => ({
  versionComparisonService: {
    getAvailableVersions: jest.fn(async () => []),
    compareVerseRange: jest.fn(async () => []),
  },
}));

const p = translations.es.prepTable;
const PASSAGE_KEY = 'John/3/16';
const KEY_RANGE = 'John/3/16-17';

// Animated's switch between the native and the JS driver, as in
// `prepTableScreenPassageKeying.test.tsx`.
const NativeAnimatedHelper: {
  shouldUseNativeDriver: (config: unknown) => boolean;
} = jest.requireActual(
  'react-native/src/private/animated/NativeAnimatedHelper',
).default;

function renderScreen() {
  return render(
    <PremiumProvider>
      <PrepTableScreen />
    </PremiumProvider>,
  );
}

const settle = async (ms = 0) => {
  await act(async () => {
    await new Promise(r => setTimeout(r, ms));
    for (let i = 0; i < 5; i++) await new Promise(r => setImmediate(r));
  });
};

/** What `importBackup` leaves behind: the file's sections, then the signal. */
async function restore() {
  await savePrepNote(PASSAGE_KEY, 'context', 'contexto RESTAURADO');
  await savePrepNote(PASSAGE_KEY, 'application', 'aplicacion RESTAURADA');
  await act(async () => {
    emitBackupRestored();
  });
  await settle();
}

async function mountWithPre() {
  await savePrepNote(PASSAGE_KEY, 'context', 'contexto PRE');
  await savePrepNote(PASSAGE_KEY, 'application', 'aplicacion PRE');
  const screen = renderScreen();
  await screen.findByText('Juan 3:16');
  await waitFor(() =>
    expect(
      screen.getByLabelText(p.sections.application.label).props.value,
    ).toBe('aplicacion PRE'),
  );
  return screen;
}

const onDisk = async () => (await getPrepNotes(PASSAGE_KEY)).sections;

describe('R9-602 — the Mesa after a restore that lands while it is focused', () => {
  beforeEach(async () => {
    focusCallbacks.length = 0;
    __resetBackupRestoredListenersForTests();
    await AsyncStorage.clear();
  });
  afterEach(() => jest.restoreAllMocks());

  it('a re-read that lands after the passage moved does not take the screen', async () => {
    await savePrepNote(PASSAGE_KEY, 'context', 'contexto 3:16');
    await savePrepNote(KEY_RANGE, 'context', 'contexto 3:16-17');
    const screen = renderScreen();
    await screen.findByText('Juan 3:16');
    const contextValue = () =>
      screen.getByLabelText(p.sections.context.label).props.value;
    await waitFor(() => expect(contextValue()).toBe('contexto 3:16'));

    // Hold the restore's re-read of 3:16 while the stepper moves to 3:16-17.
    const realGetPrepNotes = prepNotesStore.getPrepNotes;
    let release!: () => void;
    const held = new Promise<void>(resolve => {
      release = resolve;
    });
    const getSpy = jest
      .spyOn(prepNotesStore, 'getPrepNotes')
      .mockImplementation(async (key, options) => {
        if (key === PASSAGE_KEY) await held;
        return realGetPrepNotes(key, options);
      });
    await act(async () => {
      emitBackupRestored();
    });
    // As in `prepTableScreenPassageKeying`: the JS driver, so the stepper's
    // opacity animation needs no native view.
    jest
      .spyOn(NativeAnimatedHelper, 'shouldUseNativeDriver')
      .mockReturnValue(false);
    await act(async () => {
      fireEvent.press(
        screen.getByLabelText(`${p.increase} ${p.rangeEndLabel}`),
      );
      await new Promise(resolve => setTimeout(resolve, 400));
    });
    await waitFor(() => expect(contextValue()).toBe('contexto 3:16-17'));
    // Control: the restore's re-read of 3:16 really is in flight.
    expect(getSpy.mock.calls.map(c => c[0])).toContain(PASSAGE_KEY);

    await act(async () => {
      release();
    });
    await settle();
    expect(contextValue()).toBe('contexto 3:16-17');
  });

  it('a keystroke and a blur keep the restored sections', async () => {
    const screen = await mountWithPre();
    await restore();

    const context = screen.getByLabelText(p.sections.context.label);
    const application = screen.getByLabelText(p.sections.application.label);
    fireEvent(context, 'blur');
    fireEvent.changeText(application, application.props.value + ' y mas');
    await settle(900);
    screen.unmount();
    await settle();

    const sections = await onDisk();
    expect(sections.context).toBe('contexto RESTAURADO');
    expect(sections.application).toBe('aplicacion RESTAURADA y mas');
  });

  it('a save still pending when the restore lands does not land over it', async () => {
    const screen = await mountWithPre();
    fireEvent.changeText(
      screen.getByLabelText(p.sections.application.label),
      'aplicacion PRE tecleada',
    );
    await restore();
    await settle(900);
    screen.unmount();
    await settle();

    expect((await onDisk()).application).toBe('aplicacion RESTAURADA');
  });

  it('the fields show the restored sections', async () => {
    const screen = await mountWithPre();
    await restore();
    await waitFor(() =>
      expect(screen.getByLabelText(p.sections.context.label).props.value).toBe(
        'contexto RESTAURADO',
      ),
    );
    expect(
      screen.getByLabelText(p.sections.application.label).props.value,
    ).toBe('aplicacion RESTAURADA');
  });

  // CONTROL — green with and without the fix: the restore made while the user
  // was in Settings is the focus re-read's case, which already held.
  it('control: a restore before coming back is picked up by the focus re-read', async () => {
    const screen = await mountWithPre();
    await savePrepNote(PASSAGE_KEY, 'context', 'contexto RESTAURADO');
    await act(async () => {
      focusCallbacks[focusCallbacks.length - 1]();
    });
    await settle();
    fireEvent(screen.getByLabelText(p.sections.context.label), 'blur');
    await settle();
    screen.unmount();
    await settle();
    expect((await onDisk()).context).toBe('contexto RESTAURADO');
  });
});
