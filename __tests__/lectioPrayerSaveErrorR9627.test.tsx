/**
 * R9-627 — when saving the lectio prayer failed, the screen said nothing and
 * closed the journey: the finale does not show the prayer, and the step where
 * it was written was gone. `handleFinish` now shows `t.notes.saveError` (the
 * reader's message for the same failure) and stays on the step, with the
 * prayer still in its field; «Finish» tries again.
 *
 * The failure is the one R9-51 added: `updateNote` rejects when no row has
 * the id the screen read (the start-up fold re-keyed it a moment before).
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import {render, fireEvent, waitFor} from '@testing-library/react-native';
import LectioScreen from '../app/features/lectio';
import {translations} from '../src/i18n/translations';

// Same Pressable swap as guidedDevotionNav.test.tsx.
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

jest.mock('expo-router', () => ({
  useRouter: () => ({push: jest.fn(), replace: jest.fn(), back: jest.fn()}),
  useLocalSearchParams: () => ({book: 'Juan', chapter: '3', verse: '16'}),
  useFocusEffect: (cb: () => void) => cb(),
  Stack: {Screen: () => null},
}));
jest.mock('@expo/vector-icons', () => ({Ionicons: () => null}));
jest.mock('expo-linear-gradient', () => {
  const {View} = require('react-native');
  return {LinearGradient: View};
});
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({top: 0, bottom: 0, left: 0, right: 0}),
}));
jest.mock('@lib/haptics', () => ({
  haptics: {tap: jest.fn(), press: jest.fn(), success: jest.fn()},
}));
jest.mock('@hooks/useTheme', () => ({
  useTheme: () => ({
    colors: {
      background: '#000000',
      card: '#111111',
      border: '#222222',
      primary: '#6366f1',
      primaryDark: '#4338ca',
      onPrimary: '#ffffff',
      text: '#ffffff',
      textSecondary: '#cccccc',
      textTertiary: '#999999',
    },
    gradient: {colors: ['#000', '#000'], headerColors: ['#000', '#000']},
    highContrast: false,
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
const mockToast = {
  show: jest.fn(),
  success: jest.fn(),
  error: jest.fn(),
  warning: jest.fn(),
  info: jest.fn(),
};
jest.mock('@context/ToastContext', () => ({useToast: () => mockToast}));
jest.mock('@context/ServicesContext', () => ({
  useServices: () => ({
    achievementService: null,
    notifyAchievements: jest.fn(),
  }),
}));
jest.mock('@context/MemoryDeckContext', () => ({
  useMemoryDeck: () => ({addCard: jest.fn(), hasCard: () => false}),
}));
jest.mock('@/features/audio', () => ({
  useAudioPlayer: () => ({loadChapter: jest.fn(), play: jest.fn()}),
}));
jest.mock('@components/reading/ImageShareModal', () => ({
  ImageShareModal: () => null,
}));
const mockRecordDevotion = jest.fn(async () => undefined);
jest.mock('@/features/study/devotionLogStore', () => ({
  recordTodayDevotion: () => mockRecordDevotion(),
}));
const mockQueueWrite = jest.fn();
jest.mock('@lib/sync', () => ({
  getSyncEngine: () => ({queueWrite: mockQueueWrite}),
}));
jest.mock('@lib/sync/adapters/notes', () => ({
  buildNoteRemotePayload: (n: unknown) => n,
}));

const VERSE =
  'Porque de tal manera amó Dios al mundo, que ha dado a su Hijo unigénito, para que todo aquel que en él cree, no se pierda, mas tenga vida eterna.';
const mockUpdateNote = jest.fn();
jest.mock('@lib/database', () => ({
  __esModule: true,
  default: {
    initialize: jest.fn(async () => undefined),
    getVerse: jest.fn(async () => ({text: VERSE})),
    getNoteForVerse: jest.fn(async () => ({
      id: 'note_1700000000000_abc',
      book: 'John',
      chapter: 3,
      verse: 16,
      text: VERSE,
      note: 'El amor de Dios no espera a que yo lo merezca.',
      createdAt: '2026-03-01T08:00:00.000Z',
      updatedAt: '2026-03-01T08:00:00.000Z',
    })),
    updateNote: (...args: unknown[]) => mockUpdateNote(...args),
  },
}));
jest.mock('@lib/utils/logger', () => ({
  logger: {error: jest.fn(), info: jest.fn(), warn: jest.fn()},
}));

const tl = translations.es.lectio;
const PRAYER = 'Señor, gracias porque tu amor me alcanzó primero.';

async function walkToFinish() {
  const screen = render(<LectioScreen />);
  const {findByLabelText, getByLabelText} = screen;
  fireEvent.press(await findByLabelText(tl.next)); // lectio → meditatio
  fireEvent.press(getByLabelText(tl.next)); // → oratio
  fireEvent.changeText(getByLabelText(tl.prayerPlaceholder), PRAYER);
  fireEvent.press(getByLabelText(tl.next)); // → contemplatio
  return screen;
}

describe('R9-627 — a lectio prayer that fails to save', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('says so, stays on the step with the prayer kept, and «Finish» tries again', async () => {
    mockUpdateNote.mockRejectedValueOnce(
      new Error('updateNote: no note with id note_1700000000000_abc'),
    );
    const {getByLabelText, queryByLabelText, getByDisplayValue} =
      await walkToFinish();

    fireEvent.press(getByLabelText(tl.finish));
    await waitFor(() =>
      expect(mockToast.error).toHaveBeenCalledWith(
        translations.es.notes.saveError,
      ),
    );
    // Not closed: no finale, nothing recorded, nothing queued.
    expect(queryByLabelText(tl.done)).toBeNull();
    expect(getByLabelText(tl.finish)).toBeTruthy();
    expect(mockRecordDevotion).not.toHaveBeenCalled();
    expect(mockQueueWrite).not.toHaveBeenCalled();
    expect(mockToast.success).not.toHaveBeenCalled();
    // The prayer is still in its field, one step back.
    fireEvent.press(getByLabelText(tl.back));
    expect(getByDisplayValue(PRAYER)).toBeTruthy();
    fireEvent.press(getByLabelText(tl.next));

    // The retry saves it and closes the journey.
    mockUpdateNote.mockResolvedValueOnce(undefined);
    fireEvent.press(getByLabelText(tl.finish));
    await waitFor(() => expect(getByLabelText(tl.done)).toBeTruthy());
    expect(mockToast.success).toHaveBeenCalledWith(tl.prayerSaved);
    expect(mockUpdateNote).toHaveBeenCalledTimes(2);
    expect(mockUpdateNote.mock.calls[1][1]).toContain(PRAYER);
    expect(mockQueueWrite).toHaveBeenCalledTimes(1);
    expect(mockRecordDevotion).toHaveBeenCalledTimes(1);
  });
});
