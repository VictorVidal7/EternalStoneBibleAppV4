/**
 * R9-47 — the "Mesa de preparación" screen must never file a sermon under a
 * passage the reader wasn't looking at, and must never turn an absent draft
 * into a deletion.
 *
 * `load()` is a `useCallback` keyed on `[table, params.version]`, invoked
 * from a `useEffect` with NO cleanup: every tap on the range stepper builds a
 * new `table`, starts a new load, and leaves the previous one running. Both
 * applied `setDrafts`/`setTemplate` unconditionally, so whichever SQLite read
 * finished last won. Meanwhile `handleNoteBlur` read the STATE (not the
 * TextInput) and wrote `drafts[section] ?? ''` under `table.passageKey` —
 * the key that had already moved. Three ways to lose hand-written prose from
 * two taps on a stepper: the note is deleted (`?? ''` plus
 * `setMapSectionNote`'s documented "an edit that empties the last section
 * drops the passage entry entirely"), replaced by the other range's sermon,
 * or filed under a section id the newly-arrived template never renders,
 * making it invisible forever.
 *
 * SCOPE, stated plainly: what's covered here is the DELETION consequence,
 * which is reachable without the race (another screen writes prose to the
 * same store while this one is mounted — the illustrations-bank round trip —
 * and a blur then lands before the focus effect does). The stepper race
 * itself is NOT covered: re-rendering a screen this size under
 * react-test-renderer detaches every `TouchableOpacity`'s internal `Animated`
 * opacity and tears the tree down ("Unable to locate attached view in the
 * native tree") before the new range ever applies. That half stays a
 * live-verification item on a device, which is what the review ledger
 * already says for R9-47.
 *
 * The harness (mocks, focus-callback capture) mirrors
 * `prepTableScreenNotesRefocus.test.tsx`: the REAL stateful AsyncStorage mock
 * from jest.setup.js is used deliberately, because these assertions are about
 * what actually reached the store.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import {act, fireEvent, render, waitFor} from '@testing-library/react-native';
import PrepTableScreen from '../app/features/prep/index';
import {PremiumProvider} from '../src/context/PremiumContext';
import {getPrepNotes, savePrepNote} from '../src/features/study/prepNotesStore';
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

// The contextual-hint banner animates its entrance with `Animated.timing`.
// Re-rendering this screen with new route params detaches and re-attaches
// that view mid-animation, which makes AnimatedProps throw "Unable to locate
// attached view in the native tree" — a react-test-renderer artifact of the
// passage change, nothing to do with what's under test here. Stubbed out.
jest.mock('@components/hints/ContextualHintBanner', () => ({
  ContextualHintBanner: () => null,
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
const KEY_SINGLE = 'John/3/16';

function renderScreen() {
  return render(
    <PremiumProvider>
      <PrepTableScreen />
    </PremiumProvider>,
  );
}

describe('Mesa de preparación — a blur can no longer delete a sermon (R9-47)', () => {
  beforeEach(async () => {
    focusCallbacks.length = 0;
    // The real stateful AsyncStorage mock is shared across cases here.
    await AsyncStorage.clear();
  });

  it('does NOT wipe a section whose prose exists in the store but not in the drafts', async () => {
    // The screen mounts with nothing saved, so `drafts` is empty.
    const {findByText, getByLabelText} = renderScreen();
    await findByText('Juan 3:16');
    expect(getByLabelText(p.sections.bigIdea.label).props.value).toBe('');

    // Another screen writes prose for this passage while this one stays
    // mounted underneath — exactly what the illustrations bank does (see
    // `prepTableScreenNotesRefocus.test.tsx`). The focus effect hasn't run
    // yet, so `drafts.bigIdea` is still absent.
    await savePrepNote(KEY_SINGLE, 'bigIdea', 'La idea central del pasaje');

    // Now the keyboard dismisses and `bigIdea` blurs. Pre-fix this wrote
    // `drafts.bigIdea ?? ''` — an empty write, which `setSectionNote` turns
    // into a DELETE of that section, and since it was the only one,
    // `setMapSectionNote` then "drops the passage entry entirely". The whole
    // sermon, gone, from a blur the reader never thought of as an edit.
    await act(async () => {
      fireEvent(getByLabelText(p.sections.bigIdea.label), 'blur');
    });

    const saved = await getPrepNotes(KEY_SINGLE);
    expect(saved.sections.bigIdea).toBe('La idea central del pasaje');
  });

  it('still saves an explicit clear — `` is an edit, `undefined` is not', async () => {
    await savePrepNote(KEY_SINGLE, 'bigIdea', 'Texto que voy a borrar');
    await savePrepNote(
      KEY_SINGLE,
      'application',
      'Otra sección, para que el mapa no quede vacío',
    );

    const {findByText, getByLabelText} = renderScreen();
    await findByText('Juan 3:16');

    const input = getByLabelText(p.sections.bigIdea.label);
    await waitFor(() =>
      expect(input.props.value).toBe('Texto que voy a borrar'),
    );

    // The guard added for R9-47 must only skip an ABSENT draft. A reader who
    // selects the text and deletes it goes through `handleNoteChange`, which
    // puts `''` in the drafts — that IS an edit and must still persist.
    await act(async () => {
      fireEvent.changeText(input, '');
    });
    await act(async () => {
      fireEvent(input, 'blur');
    });

    await waitFor(async () => {
      const saved = await getPrepNotes(KEY_SINGLE);
      expect(saved.sections.bigIdea).toBeUndefined();
    });
    const saved = await getPrepNotes(KEY_SINGLE);
    expect(saved.sections.application).toBe(
      'Otra sección, para que el mapa no quede vacío',
    );
  });
});
