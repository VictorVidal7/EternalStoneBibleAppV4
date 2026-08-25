/**
 * Tanda 4 — the "Mesa de preparación" screen's narrow notes-only refocus
 * effect (`app/features/prep/index.tsx`'s `useFocusEffect` added alongside
 * the illustration-bank insert flow).
 *
 * A plain `useEffect(() => load(), [load])` only re-runs when `load`'s own
 * deps (`table`, `params.version`) change — NOT just because the reader
 * navigated away (e.g. to the illustrations bank at
 * `/features/prep/illustrations` to insert a saved illustration into these
 * notes) and came back. Without a focus-triggered re-read, a note appended
 * by that OTHER screen (a real write to the SAME `@prep_notes` AsyncStorage
 * key, via `savePrepNote`) would sit unseen in storage until some unrelated
 * reload. This file proves the fix: re-reading ONLY the notes on refocus
 * picks up a change written while this screen stayed mounted underneath.
 *
 * Deliberately does NOT locally mock `@react-native-async-storage/async-
 * storage` — unlike the sibling prepTableScreen*.test.tsx files, this test
 * needs the REAL stateful in-memory mock registered globally in
 * jest.setup.js, since it seeds a note through the real prepNotesStore and
 * must see the SAME store the component reads. `version: 'RVR1960'` is
 * passed explicitly in the route params so `resolveVersion` short-circuits
 * and never touches AsyncStorage for the reading-version key, keeping that
 * lookup out of the way of the notes assertions.
 */
import {act, render, waitFor} from '@testing-library/react-native';
import PrepTableScreen from '../app/features/prep/index';
import {PremiumProvider} from '../src/context/PremiumContext';
import {savePrepNote} from '../src/features/study/prepNotesStore';
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

function renderScreen() {
  return render(
    <PremiumProvider>
      <PrepTableScreen />
    </PremiumProvider>,
  );
}

describe('Mesa de preparación — notes refresh on refocus (Tanda 4)', () => {
  beforeEach(() => {
    focusCallbacks.length = 0;
  });

  it('picks up a note saved by another screen (e.g. an inserted illustration) once refocused, without a full reload', async () => {
    const {findByText, getByLabelText} = renderScreen();

    // Initial load completes; the application note starts blank.
    await findByText('Juan 3:16');
    expect(getByLabelText(p.sections.application.label).props.value).toBe('');

    // Simulate the illustrations screen's own insert flow: a REAL write to
    // the same @prep_notes store, made while this screen stays mounted
    // underneath (the exact scenario the focus effect exists for).
    await savePrepNote(
      PASSAGE_KEY,
      'application',
      'El reloj y el relojero\nUn argumento clásico de diseño',
    );

    // Simulate "the reader navigated back to this screen" by re-firing the
    // LATEST registered focus callback — the narrow notes-only effect, not
    // the heavy `load()` (which would additionally touch cross-refs/book
    // intro/comparison versions, none of which are exercised here).
    expect(focusCallbacks.length).toBeGreaterThan(0);
    await act(async () => {
      focusCallbacks[focusCallbacks.length - 1]();
    });

    await waitFor(() =>
      expect(getByLabelText(p.sections.application.label).props.value).toBe(
        'El reloj y el relojero\nUn argumento clásico de diseño',
      ),
    );
  });
});
