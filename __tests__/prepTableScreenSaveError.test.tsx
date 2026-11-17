/**
 * R9-52 — a failed write of the Mesa (`app/features/prep/index.tsx`) used to
 * be swallowed by the stores, and the screen said nothing. The stores now
 * reject; the screen shows ONE error toast per burst of failures, and the
 * buttons that flush the drafts before opening another screen stay here when
 * the flush fails.
 *
 * Same harness as `prepTableScreenSelfReview.test.tsx`: the REAL stores over
 * the global AsyncStorage mock, with `setItem` rejecting only for the key
 * under test.
 */
import {render, waitFor, fireEvent} from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import PrepTableScreen from '../app/features/prep/index';
import {PremiumProvider} from '../src/context/PremiumContext';
import {savePrepNote} from '../src/features/study/prepNotesStore';
import {translations} from '../src/i18n/translations';

const mockPush = jest.fn();
jest.mock('expo-router', () => {
  const ReactActual = require('react');
  return {
    useRouter: () => ({push: mockPush, back: jest.fn()}),
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

jest.mock('@lib/haptics', () => ({
  haptics: {tap: jest.fn(), success: jest.fn()},
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

const t = translations.es;
const p = t.prepTable;
const sr = t.prepSelfReview;
const PASSAGE_KEY = 'John/3/16';

const setItem = AsyncStorage.setItem as jest.Mock;
const realSetItem = setItem.getMockImplementation()!;

/** `setItem` rejects for `key` (the rest, the real one); counts the failures. */
function failWritesOf(key: string) {
  let failed = 0;
  setItem.mockImplementation((k: string, v: string) => {
    if (k === key) {
      failed += 1;
      return Promise.reject(new Error('disco lleno'));
    }
    return realSetItem(k, v);
  });
  return () => failed;
}

function renderScreen() {
  return render(
    <PremiumProvider>
      <PrepTableScreen />
    </PremiumProvider>,
  );
}

let clock = 1_000_000;
let dateNow: jest.SpyInstance;

describe('Mesa de preparación — a failed write (R9-52)', () => {
  beforeEach(async () => {
    setItem.mockImplementation(realSetItem);
    mockPush.mockClear();
    Object.values(mockToast).forEach(fn => fn.mockClear());
    await AsyncStorage.clear();
    clock = 1_000_000;
    dateNow = jest.spyOn(Date, 'now').mockImplementation(() => clock);
  });

  afterEach(() => {
    setItem.mockImplementation(realSetItem);
    dateNow.mockRestore();
  });

  it('shows one error toast for a burst of failed writes, and another for the next burst', async () => {
    await savePrepNote(PASSAGE_KEY, 'bigIdea', 'Dios ama al mundo');
    const {findByText, getByText, getByLabelText} = renderScreen();
    await findByText('Juan 3:16');
    await waitFor(() => expect(getByText(sr.cardTitle)).toBeTruthy());
    fireEvent.press(
      getByLabelText(
        `${sr.showToggle} · ${sr.progressLabel
          .replace('{{checked}}', '0')
          .replace('{{total}}', '14')}`,
      ),
    );
    await waitFor(() =>
      expect(getByText(sr.questions.sectionTiming.label)).toBeTruthy(),
    );

    const failed = failWritesOf('@prep_self_review');
    fireEvent.press(getByLabelText(sr.questions.tensionBeforeResolution.label));
    fireEvent.press(getByLabelText(sr.questions.sectionTiming.label));
    clock += 3_000;
    fireEvent.press(getByLabelText(sr.questions.tensionBeforeResolution.label));

    // CONTROL: the three writes were attempted, and each one failed.
    await waitFor(() => expect(failed()).toBe(3));
    await waitFor(() => expect(mockToast.error).toHaveBeenCalledTimes(1));
    expect(mockToast.error).toHaveBeenCalledWith(p.saveError);

    // A failure well after the last toast is a new burst: it is reported.
    clock += 11_000;
    fireEvent.press(getByLabelText(sr.questions.sectionTiming.label));
    await waitFor(() => expect(failed()).toBe(4));
    await waitFor(() => expect(mockToast.error).toHaveBeenCalledTimes(2));
    expect(mockToast.success).not.toHaveBeenCalled();
  });

  it('a failed flush before opening the illustrations bank reports it and stays on the Mesa', async () => {
    // The real clock: `use-debounce` reads `Date.now`, and a frozen one never
    // lets the autosave fire. The whole case runs in well under 10 s.
    dateNow.mockRestore();
    const {findByText, getByLabelText} = renderScreen();
    await findByText('Juan 3:16');

    const failed = failWritesOf('@prep_notes');
    fireEvent.changeText(
      getByLabelText(p.sections.bigIdea.label),
      'La idea que no se guardó',
    );
    fireEvent.press(
      getByLabelText(
        `${t.prepIllustrations.entryLabel} — ${t.offering.badgeA11y}`,
      ),
    );

    // CONTROL: the flush's write was attempted and failed.
    await waitFor(() => expect(failed()).toBeGreaterThanOrEqual(1));
    await waitFor(() => expect(mockToast.error).toHaveBeenCalledTimes(1));
    expect(mockToast.error).toHaveBeenCalledWith(p.saveError);
    expect(mockPush).not.toHaveBeenCalled();
    // The draft is still on screen, for the preparer to try again.
    expect(getByLabelText(p.sections.bigIdea.label).props.value).toBe(
      'La idea que no se guardó',
    );

    // The autosave of the same typing fails too, inside the same burst: no
    // second toast.
    await waitFor(() => expect(failed()).toBe(2), {timeout: 3000});
    expect(mockToast.error).toHaveBeenCalledTimes(1);
  });
});
