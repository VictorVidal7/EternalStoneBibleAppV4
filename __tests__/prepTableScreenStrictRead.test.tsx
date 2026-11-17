/**
 * R9-600 — the Mesa (`app/features/prep/index.tsx`) edits the sections it
 * READ: each field starts from the loaded text, and a save writes the whole
 * section. A failed read used to come back as "no notes": the field showed
 * empty, and what the preparer typed there was saved alone over the prose.
 * The two reads that feed the fields are now strict:
 *
 *  - the load: a failed read leaves the screen in its error state (nothing to
 *    edit) instead of opening empty fields;
 *  - the refocus re-read: a failed one keeps the fields as they were.
 *
 * Same harness as `prepTableScreenNotesRefocus.test.tsx` (the REAL store over
 * the global AsyncStorage mock, the focus callbacks captured), with `getItem`
 * rejecting only for `@prep_notes`.
 */
import {act, fireEvent, render, waitFor} from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import PrepTableScreen from '../app/features/prep/index';
import {PremiumProvider} from '../src/context/PremiumContext';
import {getPrepNotes, savePrepNote} from '../src/features/study/prepNotesStore';
import {translations} from '../src/i18n/translations';

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
const PROSE = 'Prosa previa a mano.';

const getItem = AsyncStorage.getItem as jest.Mock;
const realGetItem = getItem.getMockImplementation()!;

/** `getItem` rejects for `@prep_notes` until `stop()`; counts the failures. */
function failNotesReads() {
  let failed = 0;
  getItem.mockImplementation((k: string) => {
    if (k === '@prep_notes') {
      failed += 1;
      return Promise.reject(new Error('lectura rota'));
    }
    return realGetItem(k);
  });
  return {
    failed: () => failed,
    stop: () => getItem.mockImplementation(realGetItem),
  };
}

function renderScreen() {
  return render(
    <PremiumProvider>
      <PrepTableScreen />
    </PremiumProvider>,
  );
}

describe('Mesa de preparación — a failed read of the notes (R9-600)', () => {
  beforeEach(async () => {
    focusCallbacks.length = 0;
    getItem.mockImplementation(realGetItem);
    await AsyncStorage.clear();
    await savePrepNote(PASSAGE_KEY, 'application', PROSE);
  });

  afterEach(() => {
    getItem.mockImplementation(realGetItem);
  });

  it('a failed load opens no fields to type over the prose', async () => {
    const reads = failNotesReads();
    const {queryByText, queryByLabelText} = renderScreen();
    // Settled: either the error state, or (the old behavior) empty fields.
    await waitFor(() =>
      expect(
        queryByText(p.error) ?? queryByLabelText(p.sections.application.label),
      ).toBeTruthy(),
    );
    // CONTROL: the load's read was attempted and failed.
    expect(reads.failed()).toBeGreaterThanOrEqual(1);
    reads.stop();

    // What a preparer would do with an empty field: type, and leave it.
    const field = queryByLabelText(p.sections.application.label);
    if (field) {
      fireEvent.changeText(field, 'Lo tecleado');
      fireEvent(field, 'blur');
      await waitFor(async () =>
        expect((await getPrepNotes(PASSAGE_KEY)).sections.application).not.toBe(
          PROSE,
        ),
      );
    }

    expect((await getPrepNotes(PASSAGE_KEY)).sections.application).toBe(PROSE);
    expect(queryByText(p.error)).toBeTruthy();
  });

  it('a failed refocus re-read keeps the fields as they were', async () => {
    const {findByText, getByLabelText} = renderScreen();
    await findByText('Juan 3:16');
    await waitFor(() =>
      expect(getByLabelText(p.sections.application.label).props.value).toBe(
        PROSE,
      ),
    );

    const reads = failNotesReads();
    await act(async () => {
      focusCallbacks[focusCallbacks.length - 1]();
    });
    // CONTROL: the refocus read was attempted and failed.
    await waitFor(() => expect(reads.failed()).toBe(1));
    reads.stop();

    // The preparer appends to what the field shows, and leaves it.
    const field = getByLabelText(p.sections.application.label);
    fireEvent.changeText(field, `${field.props.value} Y más.`);
    fireEvent(getByLabelText(p.sections.application.label), 'blur');
    await waitFor(async () =>
      expect((await getPrepNotes(PASSAGE_KEY)).sections.application).not.toBe(
        PROSE,
      ),
    );

    expect((await getPrepNotes(PASSAGE_KEY)).sections.application).toBe(
      `${PROSE} Y más.`,
    );
  });
});
