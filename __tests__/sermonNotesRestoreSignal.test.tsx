/**
 * R9-30 (S164) — the sermon notes re-read when a backup is restored.
 *
 * `@sermon_notes` travels in `payload.local` now. The editor loads a session
 * ONCE per id, and each keystroke writes a WHOLE field from its copy: with
 * the editor mounted when a restore landed (an import still running when the
 * user came back), the next keystroke wrote the pre-import text over the
 * restored one, and so did a pending autosave. The list showed the
 * pre-import sessions until it was focused again.
 *
 * Lo REAL: both screens, `sermonNotesStore` and the restore signal, over the
 * stateful AsyncStorage mock of jest.setup.js. Lo sustituido: navigation,
 * theme, language, toast and the verse picker (the harness of
 * `sermonNotesScreensSaveError.test.tsx`). The restore itself is played as
 * what `importBackup` leaves behind: the file's map on disk, then the signal.
 */
import {act, fireEvent, render, waitFor} from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SermonNotesListScreen from '../app/features/sermon-notes/index';
import SermonNoteEditorScreen from '../app/features/sermon-notes/[id]';
import {getSermonNote} from '../src/features/study/sermonNotesStore';
import {
  serializeSermonNotesMap,
  type SermonNotesMap,
} from '../src/features/study/sermonNotes';
import {
  __resetBackupRestoredListenersForTests,
  emitBackupRestored,
} from '../src/lib/backup/restoreSignal';
import {translations} from '../src/i18n/translations';

const SERMON_NOTES_KEY = '@sermon_notes';

jest.mock(
  'react-native/Libraries/Components/Touchable/TouchableOpacity',
  () => {
    const ReactActual = require('react');
    const {Pressable} = jest.requireActual('react-native');
    const MockTouchableOpacity = ReactActual.forwardRef(
      ({children, ...props}: Record<string, unknown>, ref: unknown) =>
        ReactActual.createElement(Pressable, {...props, ref}, children),
    );
    return {__esModule: true, default: MockTouchableOpacity};
  },
);

let mockParams: {id?: string} = {};

jest.mock('expo-router', () => {
  const ReactActual = require('react');
  return {
    useRouter: () => ({push: jest.fn(), back: jest.fn()}),
    useLocalSearchParams: () => mockParams,
    useFocusEffect: (cb: () => void) => ReactActual.useEffect(cb, [cb]),
    Stack: {Screen: () => null},
  };
});

jest.mock('@expo/vector-icons', () => ({
  Ionicons: () => null,
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

jest.mock('@/features/study/SermonVersePickerSheet', () => ({
  SermonVersePickerSheet: () => null,
}));

const mockColors = new Proxy({}, {get: () => '#888888'});
jest.mock('@hooks/useTheme', () => ({
  useTheme: () => ({colors: mockColors}),
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

jest.mock('@context/ToastContext', () => ({
  useToast: () => ({
    success: jest.fn(),
    error: jest.fn(),
    warning: jest.fn(),
    info: jest.fn(),
    show: jest.fn(),
  }),
}));

const h = translations.es.sermonNotes;

function session(title: string, bodyText: string, source = '') {
  return {id: 'n1', title, source, bodyText, createdAt: 1, updatedAt: 1};
}

async function seed(map: SermonNotesMap) {
  await AsyncStorage.setItem(SERMON_NOTES_KEY, serializeSermonNotesMap(map));
}

/** What `importBackup` leaves behind: the file's map on disk, then the signal. */
async function restore(map: SermonNotesMap) {
  await seed(map);
  await act(async () => {
    emitBackupRestored();
  });
}

beforeEach(async () => {
  __resetBackupRestoredListenersForTests();
  mockParams = {};
  await AsyncStorage.removeItem(SERMON_NOTES_KEY);
});

describe('SermonNoteEditorScreen — a restore lands while it is open', () => {
  it('shows the restored session', async () => {
    await seed({n1: session('Domingo PRE', 'cuerpo PRE', 'Iglesia PRE')});
    mockParams = {id: 'n1'};
    const {findByDisplayValue} = render(<SermonNoteEditorScreen />);
    await findByDisplayValue('cuerpo PRE');

    await restore({
      n1: session('Domingo RESTAURADO', 'cuerpo RESTAURADO', 'Iglesia R'),
    });

    expect(await findByDisplayValue('cuerpo RESTAURADO')).toBeTruthy();
    expect(await findByDisplayValue('Domingo RESTAURADO')).toBeTruthy();
    expect(await findByDisplayValue('Iglesia R')).toBeTruthy();
  });

  it('the next keystroke edits the restored text, not the old one', async () => {
    await seed({n1: session('Domingo PRE', 'cuerpo PRE')});
    mockParams = {id: 'n1'};
    const {findByDisplayValue, findByPlaceholderText} = render(
      <SermonNoteEditorScreen />,
    );
    await findByDisplayValue('cuerpo PRE');

    await restore({n1: session('Domingo RESTAURADO', 'cuerpo RESTAURADO')});
    await act(async () => {
      await new Promise(r => setTimeout(r, 50));
    });
    // The user appends to whatever the body shows: the autosave writes the
    // WHOLE body from the screen's copy.
    const body = await findByPlaceholderText(h.bodyPlaceholder);
    fireEvent.changeText(body, `${body.props.value} y`);

    await waitFor(
      async () => expect((await getSermonNote('n1'))?.bodyText).toMatch(/ y$/),
      {timeout: 3000},
    );
    expect((await getSermonNote('n1'))?.bodyText).toBe('cuerpo RESTAURADO y');
  });

  it('drops an autosave still pending when the restore lands', async () => {
    await seed({n1: session('Domingo PRE', 'cuerpo PRE')});
    mockParams = {id: 'n1'};
    const {findByDisplayValue, findByPlaceholderText} = render(
      <SermonNoteEditorScreen />,
    );
    await findByDisplayValue('cuerpo PRE');
    fireEvent.changeText(
      await findByPlaceholderText(h.bodyPlaceholder),
      'cuerpo PRE tecleado',
    );

    await restore({n1: session('Domingo RESTAURADO', 'cuerpo RESTAURADO')});
    await findByDisplayValue('cuerpo RESTAURADO');
    // Past the 700 ms debounce: nothing pending may land.
    await act(async () => {
      await new Promise(r => setTimeout(r, 900));
    });

    expect((await getSermonNote('n1'))?.bodyText).toBe('cuerpo RESTAURADO');
  });

  it('a session the file does not have reads as not found', async () => {
    await seed({n1: session('Domingo PRE', 'cuerpo PRE')});
    mockParams = {id: 'n1'};
    const {findByDisplayValue, findByText} = render(<SermonNoteEditorScreen />);
    await findByDisplayValue('cuerpo PRE');

    await restore({});

    expect(await findByText(h.notFound)).toBeTruthy();
  });

  it('a failed re-read keeps what the fields show', async () => {
    await seed({n1: session('Domingo PRE', 'cuerpo PRE')});
    mockParams = {id: 'n1'};
    const {findByDisplayValue, queryByText} = render(
      <SermonNoteEditorScreen />,
    );
    await findByDisplayValue('cuerpo PRE');

    const getItem = AsyncStorage.getItem as jest.Mock;
    const realGet = getItem.getMockImplementation()!;
    getItem.mockImplementation((key: string) =>
      key === SERMON_NOTES_KEY
        ? Promise.reject(new Error('lectura fallida'))
        : realGet(key),
    );
    try {
      await act(async () => {
        emitBackupRestored();
      });
      await act(async () => {
        await new Promise(r => setTimeout(r, 50));
      });
      expect(queryByText(h.notFound)).toBeNull();
      expect(await findByDisplayValue('cuerpo PRE')).toBeTruthy();
    } finally {
      getItem.mockImplementation(realGet);
    }
  });
});

describe('SermonNotesListScreen — a restore lands while it is open', () => {
  it('shows the restored sessions', async () => {
    await seed({n1: session('Domingo PRE', 'cuerpo PRE')});
    const {findByText, queryByText} = render(<SermonNotesListScreen />);
    await findByText('Domingo PRE');

    await restore({n1: session('Domingo RESTAURADO', 'cuerpo RESTAURADO')});

    expect(await findByText('Domingo RESTAURADO')).toBeTruthy();
    expect(queryByText('Domingo PRE')).toBeNull();
  });
});
