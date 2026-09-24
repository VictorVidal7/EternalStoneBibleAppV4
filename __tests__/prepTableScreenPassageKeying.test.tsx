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
 * itself is NOT covered here. It was left out because pressing the stepper
 * threw "Unable to locate attached view in the native tree" — and that
 * error depends on NODE_ENV, not on react-test-renderer, the OS or the Node
 * version (measured in the R9-143 work):
 *
 *  - Moving the range flips two StepButtons' `disabled`; TouchableOpacity
 *    answers with an opacity animation on the NATIVE driver, and
 *    `AnimatedProps` `#connectAnimatedView` finds no native view under the
 *    test renderer. RN lets that pass only when NODE_ENV === 'test' (it
 *    uses a dummy tag); any other value throws. It's a plain JS check, so
 *    the OS doesn't enter into it.
 *  - Jest sets NODE_ENV to 'test' only when it is UNSET. A clean shell (and
 *    CI) gets 'test' and the stepper works; a shell that exports NODE_ENV
 *    (e.g. 'development') keeps it, and the stepper throws. Same result on
 *    Node 22.22.2, 24.11.1 and 24.21.0.
 *
 * The R9-143 re-keying cases below take the native driver out (JS driver,
 * for those two cases only) and pass under either NODE_ENV. The same step
 * would make the blur/`load()` halves of the R9-47 race testable here too:
 * they are untested, not untestable. On a device they stay a
 * live-verification item, which is what the review ledger says for R9-47.
 *
 * R9-143 — "Banco de ilustraciones" and "Modo púlpito" flush every template
 * section before navigating, and that flush kept both hazards the R9-47 fix
 * removed from the blur: it wrote `drafts[section] ?? ''` under
 * `table.passageKey`. Covered per button: the deletion (same setup as the
 * blur case below), the re-keying (the stepper moves the range while the new
 * passage's notes read is HELD — the window a fast tap lands in), and that
 * the flush still persists what was just typed.
 *
 * The harness (mocks, focus-callback capture) mirrors
 * `prepTableScreenNotesRefocus.test.tsx`: the REAL stateful AsyncStorage mock
 * from jest.setup.js is used deliberately, because these assertions are about
 * what actually reached the store.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import {act, fireEvent, render, waitFor} from '@testing-library/react-native';
import PrepTableScreen from '../app/features/prep/index';
import {PremiumProvider} from '../src/context/PremiumContext';
import * as prepNotesStore from '../src/features/study/prepNotesStore';
import {getPrepNotes, savePrepNote} from '../src/features/study/prepNotesStore';
import {ENTITLEMENT_CACHE_KEY} from '../src/lib/offering/entitlementCache';
import {translations} from '../src/i18n/translations';

// Animated's own switch between the native and the JS driver — see the
// re-keying cases below for why they turn the native one off.
// (`jest.requireActual`, not `require`: same module instance, without the
// deep-import deprecation warning babel-preset-expo injects for `require`.)
const NativeAnimatedHelper: {
  shouldUseNativeDriver: (config: unknown) => boolean;
} = jest.requireActual(
  'react-native/src/private/animated/NativeAnimatedHelper',
).default;

// TouchableOpacity's opacity animation lasts 250 ms (`_opacityInactive`). On
// the JS driver its frames are React updates, so they have to run out inside
// the act() that started them.
const letJsAnimationsFinish = () =>
  new Promise(resolve => setTimeout(resolve, 400));

// Captures every useFocusEffect callback the screen registers, in
// registration order, so a test can manually re-invoke the LATEST one to
// simulate "the reader navigated back to this screen" without a real
// navigation/focus event system (expo-router itself is mocked away).
const focusCallbacks: Array<() => void> = [];
const mockRouterPush = jest.fn();
// ONE object, like the real `useRouter()` (it returns expo-router's `router`
// singleton). A fresh object per render would rebuild every `useCallback`
// that lists `router` on every render, and a handler missing a dependency
// could never go stale here — the harness would answer that question.
const mockRouter = {push: mockRouterPush, back: jest.fn()};

jest.mock('expo-router', () => {
  const ReactActual = require('react');
  return {
    useRouter: () => mockRouter,
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

// R9-143 — the typing autosave is a 700 ms debounce. Stretched here so the
// buttons' own flush is the ONLY thing that can put just-typed prose in the
// store before navigating: on a slow run the debounce would otherwise answer
// the question the "still persists" cases ask. Only the wait changes.
jest.mock('use-debounce', () => {
  const actual = jest.requireActual('use-debounce');
  return {
    ...actual,
    useDebouncedCallback: (fn: unknown, _wait: number, options?: unknown) =>
      actual.useDebouncedCallback(fn, 60_000, options),
  };
});

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
    // Only the premium render (the pulpit button, R9-143) asks for this.
    originalsInstalled: jest.fn(async () => false),
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

describe('Mesa de preparación — the buttons that flush the drafts keep R9-47’s guards (R9-143)', () => {
  const KEY_RANGE = 'John/3/16-17';

  const BUTTONS = [
    {
      name: 'Banco de ilustraciones',
      premium: false,
      label: `${translations.es.prepIllustrations.entryLabel} — ${translations.es.offering.badgeA11y}`,
      pathname: '/features/prep/illustrations',
    },
    {
      name: 'Modo púlpito',
      premium: true,
      label: p.pulpitEnterButton,
      pathname: '/features/prep/pulpit',
    },
  ];

  beforeEach(async () => {
    focusCallbacks.length = 0;
    mockRouterPush.mockClear();
    await AsyncStorage.clear();
    await SecureStore.deleteItemAsync(ENTITLEMENT_CACHE_KEY);
  });

  afterEach(async () => {
    jest.restoreAllMocks();
    await SecureStore.deleteItemAsync(ENTITLEMENT_CACHE_KEY);
  });

  describe.each(BUTTONS)('$name', ({premium, label, pathname}) => {
    async function renderAndFindButton() {
      // The pulpit's enter button only renders for a premium reader.
      if (premium)
        await SecureStore.setItemAsync(ENTITLEMENT_CACHE_KEY, 'true');
      const screen = renderScreen();
      await screen.findByText('Juan 3:16');
      const button = await screen.findByLabelText(label);
      return {screen, button};
    }

    it('does NOT wipe a section whose prose exists in the store but not in the drafts', async () => {
      const {screen, button} = await renderAndFindButton();
      expect(screen.getByLabelText(p.sections.bigIdea.label).props.value).toBe(
        '',
      );

      // The same round trip as the blur case above: another screen writes
      // prose for this passage while this one stays mounted and the focus
      // effect hasn't re-read it yet. Pre-fix, the button's flush wrote
      // `drafts.bigIdea ?? ''` — a DELETE — and, being the only section,
      // dropped the whole passage entry.
      await savePrepNote(KEY_SINGLE, 'bigIdea', 'La idea central del pasaje');

      await act(async () => {
        fireEvent.press(button);
      });
      await waitFor(() => expect(mockRouterPush).toHaveBeenCalledTimes(1));

      const saved = await getPrepNotes(KEY_SINGLE);
      expect(saved.sections.bigIdea).toBe('La idea central del pasaje');
      expect(mockRouterPush).toHaveBeenCalledWith(
        expect.objectContaining({pathname}),
      );
    });

    it('still persists a just-typed section before navigating', async () => {
      // The positive half: the guards must skip ABSENT drafts, not the flush.
      // A flush that wrote nothing at all would pass both cases around it.
      const {screen, button} = await renderAndFindButton();
      await act(async () => {
        fireEvent.changeText(
          screen.getByLabelText(p.sections.bigIdea.label),
          'Recién escrito',
        );
      });
      // Control: the (stretched) autosave hasn't written it.
      expect((await getPrepNotes(KEY_SINGLE)).sections.bigIdea).toBeUndefined();

      await act(async () => {
        fireEvent.press(button);
      });
      await waitFor(() => expect(mockRouterPush).toHaveBeenCalledTimes(1));

      expect((await getPrepNotes(KEY_SINGLE)).sections.bigIdea).toBe(
        'Recién escrito',
      );
    });

    it('files the drafts under the passage they were loaded for, not the one the stepper just moved to', async () => {
      await savePrepNote(KEY_SINGLE, 'bigIdea', 'Sermón de 3:16');
      await savePrepNote(KEY_RANGE, 'bigIdea', 'Sermón de 3:16-17');

      // Hold the new range's notes read — both `load()` and the focus effect
      // go through it — so `drafts` still holds 3:16's sermon while `table`
      // has already moved to 3:16-17. This is the window a fast tap lands in.
      const realGetPrepNotes = prepNotesStore.getPrepNotes;
      let releaseRange!: () => void;
      const rangeHeld = new Promise<void>(resolve => {
        releaseRange = resolve;
      });
      const getSpy = jest
        .spyOn(prepNotesStore, 'getPrepNotes')
        .mockImplementation(async key => {
          if (key === KEY_RANGE) await rangeHeld;
          return realGetPrepNotes(key);
        });

      const {screen, button} = await renderAndFindButton();
      await waitFor(() =>
        expect(
          screen.getByLabelText(p.sections.bigIdea.label).props.value,
        ).toBe('Sermón de 3:16'),
      );

      // Moving the range starts TouchableOpacity opacity animations on the
      // NATIVE driver, which throw under any NODE_ENV but 'test' (see the
      // header's SCOPE paragraph). On the JS driver nothing is attached to a
      // native view, so this case holds under either.
      jest
        .spyOn(NativeAnimatedHelper, 'shouldUseNativeDriver')
        .mockReturnValue(false);
      await act(async () => {
        fireEvent.press(
          screen.getByLabelText(`${p.increase} ${p.rangeEndLabel}`),
        );
        await letJsAnimationsFinish();
      });
      // Control: the table really moved and the read really is held.
      await waitFor(() =>
        expect(getSpy.mock.calls.map(c => c[0])).toContain(KEY_RANGE),
      );
      expect(screen.getByLabelText(p.sections.bigIdea.label).props.value).toBe(
        'Sermón de 3:16',
      );

      await act(async () => {
        fireEvent.press(button);
      });
      await waitFor(() => expect(mockRouterPush).toHaveBeenCalledTimes(1));

      // Pre-fix this wrote 3:16's sermon over 3:16-17's.
      expect((await realGetPrepNotes(KEY_RANGE)).sections.bigIdea).toBe(
        'Sermón de 3:16-17',
      );
      expect((await realGetPrepNotes(KEY_SINGLE)).sections.bigIdea).toBe(
        'Sermón de 3:16',
      );

      // Let 3:16-17's read land: the screen adopts it and survives the
      // re-render (what the header's SCOPE paragraph relies on). That
      // re-render starts more opacity animations.
      await act(async () => {
        releaseRange();
        await letJsAnimationsFinish();
      });
      await waitFor(() =>
        expect(
          screen.getByLabelText(p.sections.bigIdea.label).props.value,
        ).toBe('Sermón de 3:16-17'),
      );
      expect(screen.getByText('Juan 3:16-17')).toBeTruthy();
    });
  });
});
