/**
 * Tanda "autorrevisión antes de predicar" — the new self-review checklist
 * card on the "Mesa de preparación" screen (`app/features/prep/index.tsx`).
 *
 * Deliberately does NOT locally mock `@react-native-async-storage/async-
 * storage` — like `prepTableScreenNotesRefocus.test.tsx`, this needs the REAL
 * stateful in-memory mock registered globally in jest.setup.js, since it
 * seeds prep notes (via `savePrepNote`) and self-review state (via
 * `setPrepSelfReviewQuestion`) through the real stores the component reads.
 * `version: 'RVR1960'` is passed explicitly in the route params so
 * `resolveVersion` short-circuits and never touches AsyncStorage for the
 * reading-version key.
 */
import {render, waitFor, fireEvent} from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import PrepTableScreen from '../app/features/prep/index';
import {PremiumProvider} from '../src/context/PremiumContext';
import {savePrepNote} from '../src/features/study/prepNotesStore';
import {getPrepSelfReview} from '../src/features/study/prepSelfReviewStore';
import {translations} from '../src/i18n/translations';

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

const mockHapticTap = jest.fn();
jest.mock('@lib/haptics', () => ({
  haptics: {
    tap: (...args: unknown[]) => mockHapticTap(...args),
    success: jest.fn(),
  },
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

const sr = translations.es.prepSelfReview;
const PASSAGE_KEY = 'John/3/16';
const TOTAL = 14;

function renderScreen() {
  return render(
    <PremiumProvider>
      <PrepTableScreen />
    </PremiumProvider>,
  );
}

/** Mirrors the screen's own progressLabel interpolation. */
function progressText(checked: number): string {
  return sr.progressLabel
    .replace('{{checked}}', String(checked))
    .replace('{{total}}', String(TOTAL));
}

/** Mirrors the toggle row's composite accessibilityLabel (toggle text + the
 *  live progress count, so a screen reader announces both in one go). */
function toggleLabel(showing: boolean, checked: number): string {
  return `${showing ? sr.showToggle : sr.hideToggle} · ${progressText(checked)}`;
}

describe('Mesa de preparación — self-review checklist card', () => {
  beforeEach(async () => {
    mockHapticTap.mockClear();
    // Each test seeds its own passage state via the real store — clearing
    // first removes any ordering dependency between tests sharing the same
    // PASSAGE_KEY.
    await AsyncStorage.clear();
  });

  it('stays hidden while the passage has no prep notes yet', async () => {
    const {findByText, queryByText} = renderScreen();

    await findByText('Juan 3:16');

    expect(queryByText(sr.cardTitle)).toBeNull();
  });

  it('renders, with a 0/14 progress readout, once the passage has a saved note', async () => {
    await savePrepNote(PASSAGE_KEY, 'bigIdea', 'Dios ama al mundo');

    const {findByText, getByText} = renderScreen();

    await findByText('Juan 3:16');

    await waitFor(() => expect(getByText(sr.cardTitle)).toBeTruthy());
    expect(getByText(sr.cardSubtitle)).toBeTruthy();
    expect(getByText(progressText(0))).toBeTruthy();
  });

  it('expands to show every category + question, and toggling one checkbox persists it and updates the progress count', async () => {
    await savePrepNote(PASSAGE_KEY, 'bigIdea', 'Dios ama al mundo');

    const {findByText, getByText, getByLabelText} = renderScreen();

    await findByText('Juan 3:16');
    await waitFor(() => expect(getByText(sr.cardTitle)).toBeTruthy());

    // Expand the checklist. The toggle's accessibilityLabel carries the
    // live progress count too (0 checked so far), so a screen reader
    // announces both the action and the count in one go.
    fireEvent.press(getByLabelText(toggleLabel(true, 0)));
    expect(mockHapticTap).toHaveBeenCalled();

    // Every category label + the first question's prompt are laid out.
    await waitFor(() =>
      expect(getByText(sr.categories.narrativeStructure.label)).toBeTruthy(),
    );
    expect(getByText(sr.questions.tensionBeforeResolution.label)).toBeTruthy();
    expect(getByText(sr.questions.sectionTiming.label)).toBeTruthy();

    // Toggle the first question on.
    fireEvent.press(getByLabelText(sr.questions.tensionBeforeResolution.label));

    await waitFor(() => expect(getByText(progressText(1))).toBeTruthy());
    // The toggle row's own label picks up the new count too.
    expect(getByLabelText(toggleLabel(false, 1))).toBeTruthy();

    // The real store persisted the toggle.
    await waitFor(async () => {
      const saved = await getPrepSelfReview(PASSAGE_KEY);
      expect(saved.checkedIds.tensionBeforeResolution).toBe(true);
    });

    // Toggling it back off removes it again (both in the UI and storage).
    fireEvent.press(getByLabelText(sr.questions.tensionBeforeResolution.label));
    await waitFor(async () => {
      const saved = await getPrepSelfReview(PASSAGE_KEY);
      expect(saved.checkedIds.tensionBeforeResolution).toBeUndefined();
    });
    await waitFor(() => expect(getByText(progressText(0))).toBeTruthy());
  });
});
