/**
 * R9-52, the sermon notes (S162). `createSermonNoteSession` resolved `null` on
 * a failed write (the "+" did nothing), and `saveSermonNoteSession` and
 * `deleteSermonNoteSession` swallowed it (the editor said nothing, and
 * deleting went back as if done). Now the store rejects, and the screens say
 * so and stay.
 *
 * The REAL store (AsyncStorage's global jest mock), with `setItem` rejecting
 * only for `@sermon_notes`; only navigation, theme and toast are mocked.
 */
import {render, fireEvent, waitFor} from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SermonNotesListScreen from '../app/features/sermon-notes/index';
import SermonNoteEditorScreen from '../app/features/sermon-notes/[id]';
import {getSermonNote} from '../src/features/study/sermonNotesStore';
import {
  serializeSermonNotesMap,
  type SermonNotesMap,
} from '../src/features/study/sermonNotes';
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

const mockPush = jest.fn();
const mockBack = jest.fn();
let mockParams: {id?: string} = {};

jest.mock('expo-router', () => {
  const ReactActual = require('react');
  return {
    useRouter: () => ({push: mockPush, back: mockBack}),
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

// The verse picker sheet reads the Bible database; it stays closed here.
jest.mock('@/features/study/SermonVersePickerSheet', () => ({
  SermonVersePickerSheet: () => null,
}));

const mockColors = {
  background: '#000000',
  card: '#111111',
  border: '#222222',
  primary: '#6366f1',
  primaryDark: '#4338ca',
  text: '#ffffff',
  textSecondary: '#cccccc',
  textTertiary: '#999999',
  surface: '#111111',
  overlay: 'rgba(0,0,0,0.5)',
  error: '#ff0000',
};

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

const mockToast = {
  success: jest.fn(),
  error: jest.fn(),
  warning: jest.fn(),
  info: jest.fn(),
  show: jest.fn(),
};
jest.mock('@context/ToastContext', () => ({
  useToast: () => mockToast,
}));

const h = translations.es.sermonNotes;
const setItem = AsyncStorage.setItem as jest.Mock;
const real = setItem.getMockImplementation()!;
let failed = 0;

function failSermonWrites() {
  setItem.mockImplementation((key: string, value: string) => {
    if (key === SERMON_NOTES_KEY) {
      failed += 1;
      return Promise.reject(new Error('disco lleno'));
    }
    return real(key, value);
  });
}

async function seed(map: SermonNotesMap) {
  await AsyncStorage.setItem(SERMON_NOTES_KEY, serializeSermonNotesMap(map));
}

const seeded: SermonNotesMap = {
  n1: {
    id: 'n1',
    title: 'Domingo',
    source: '',
    bodyText: 'Primera línea',
    createdAt: 1,
    updatedAt: 1,
  },
};

beforeEach(async () => {
  mockPush.mockClear();
  mockBack.mockClear();
  mockToast.error.mockClear();
  mockToast.success.mockClear();
  mockParams = {};
  failed = 0;
  setItem.mockImplementation(real);
  await AsyncStorage.removeItem(SERMON_NOTES_KEY);
});

afterEach(() => {
  setItem.mockImplementation(real);
});

describe('SermonNotesListScreen — a failed create', () => {
  it('shows an error and opens nothing', async () => {
    const {findByLabelText, findByText} = render(<SermonNotesListScreen />);
    await findByText(h.emptyTitle);
    failSermonWrites();
    fireEvent.press(await findByLabelText(h.newSession));

    await waitFor(() => expect(mockToast.error).toHaveBeenCalledTimes(1));
    expect(mockToast.error).toHaveBeenCalledWith(h.saveError);
    expect(failed).toBe(1);
    expect(mockPush).not.toHaveBeenCalled();
  });
});

describe('SermonNoteEditorScreen — a failed write', () => {
  // One field each, so each autosave is seen on its own (a burst shows one
  // toast, and would hide one that stopped reporting).
  it.each([
    ['title', h.titlePlaceholder],
    ['source', h.sourcePlaceholder],
    ['body', h.bodyPlaceholder],
  ])('the %s autosave reports it', async (_field, placeholder) => {
    await seed(seeded);
    mockParams = {id: 'n1'};
    const {findByPlaceholderText} = render(<SermonNoteEditorScreen />);
    const input = await findByPlaceholderText(placeholder);
    failSermonWrites();
    fireEvent.changeText(input, 'Otro texto');

    await waitFor(() => expect(failed).toBe(1), {timeout: 3000});
    await waitFor(() => expect(mockToast.error).toHaveBeenCalledTimes(1));
    expect(mockToast.error).toHaveBeenCalledWith(h.saveError);
  });

  it('the autosaves report it, one toast per burst', async () => {
    await seed(seeded);
    mockParams = {id: 'n1'};
    const {findByPlaceholderText} = render(<SermonNoteEditorScreen />);
    const title = await findByPlaceholderText(h.titlePlaceholder);
    const source = await findByPlaceholderText(h.sourcePlaceholder);
    const body = await findByPlaceholderText(h.bodyPlaceholder);
    failSermonWrites();
    fireEvent.changeText(title, 'Otro título');
    fireEvent.changeText(source, 'Iglesia Y');
    fireEvent.changeText(body, 'Otra línea');

    // CONTROL: the three debounced writes were attempted and failed.
    await waitFor(() => expect(failed).toBe(3), {timeout: 3000});
    await waitFor(() => expect(mockToast.error).toHaveBeenCalledTimes(1));
    expect(mockToast.error).toHaveBeenCalledWith(h.saveError);
    expect(await getSermonNote('n1')).toMatchObject({
      title: 'Domingo',
      bodyText: 'Primera línea',
    });
  });

  it('deleting shows an error and does not go back', async () => {
    await seed(seeded);
    mockParams = {id: 'n1'};
    const {findByLabelText, findByText} = render(<SermonNoteEditorScreen />);
    await findByLabelText(h.titlePlaceholder);
    fireEvent.press(await findByLabelText(h.deleteLabel));
    failSermonWrites();
    fireEvent.press(await findByText(translations.es.delete));

    await waitFor(() => expect(mockToast.error).toHaveBeenCalledTimes(1));
    expect(mockToast.error).toHaveBeenCalledWith(h.saveError);
    expect(failed).toBe(1);
    expect(mockBack).not.toHaveBeenCalled();
    expect(await getSermonNote('n1')).not.toBeNull();
  });
});
