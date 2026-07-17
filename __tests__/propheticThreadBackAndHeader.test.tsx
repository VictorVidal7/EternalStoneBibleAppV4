/**
 * Tanda G — two related fixes to the Hilo profético (Prophetic Thread)
 * screen, done together per Victor's explicit deferral: this screen was
 * excluded from Tanda L's high-contrast header sweep (`hcHeaderGradients.
 * test.tsx`, commit e342471) specifically so it could ship alongside the
 * back-button fix below, in the same file.
 *
 * 1. Hardware back used to step back ONE prophecy at a time
 *    (`if (phase > -1) { go(-1); return true; }`), while the on-screen
 *    header arrow always exits immediately via `router.back()`. On this
 *    79-item list that meant ~79 hardware-back presses to actually leave
 *    the screen — this reads as broken (contrast prayer/acts.tsx,
 *    lectio.tsx, guided.tsx, short wizards where "back = previous step" is
 *    deliberate). Fixed by dropping that branch so hardware back falls
 *    through to `return false` (the default route-pop) once no sheet is
 *    open, matching the header arrow.
 * 2. The header gradient was hardcoded to
 *    `[colors.primary, colors.primaryDark]` with no `highContrast` check,
 *    so under "High contrast (whole app)" it washed out to amber->white
 *    instead of the flat dark `gradient.headerColors` every other screen
 *    swaps to (Tanda L precedent, e.g. daily-light/index.tsx).
 *
 * UPDATE (2026-07-15, branch fix/prophecies-back-navigation) — OVERRIDES
 * fix #1 above: Tanda G's "always exit immediately, matching the header
 * arrow" was itself a bug. A live test (screenshot-confirmed by the app
 * owner) showed tapping the header back arrow mid-thread (e.g. "Profecía 38
 * de 79") dropped straight to Home instead of back to this feature's own
 * intro/hub card. Both the header arrow and hardware-back's fallthrough now
 * jump straight to the hub (`setPhase(-1)`) when `phase > -1`, and only
 * exit (`router.back()` / default route-pop) once already at the hub. This
 * is still a single jump, not one-prophecy-at-a-time, so Tanda G's original
 * "~79 presses to leave" concern is NOT reintroduced. The first `describe`
 * block below is rewritten to assert this new behavior; the high-contrast
 * `describe` block (fix #2) is untouched and still passing.
 *
 * Reuses two established techniques from this suite rather than inventing a
 * third:
 *  - quizExitConfirm.test.tsx (Tanda I): `jest.spyOn` on
 *    `BackHandler.addEventListener` to capture and directly invoke the
 *    hardware-back handler — react-native resolves to the iOS build under
 *    Jest, which never stores the registered handler on its own.
 *  - hcHeaderGradients.test.tsx (Tanda L): `UNSAFE_getAllByType(View)`
 *    filtered by a `colors` array prop to find the header LinearGradient
 *    (mocked to a plain `View`), and a distinct 3-stop dummy
 *    `gradient.headerColors` that can't coincidentally match the
 *    2-stop primary/primaryDark pair.
 */
import React from 'react';
import {render, fireEvent, act, waitFor} from '@testing-library/react-native';
import {View, BackHandler} from 'react-native';
import PropheticThreadScreen from '../app/features/prophecies/index';

const mockBack = jest.fn();
const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({back: mockBack, push: mockPush}),
  useLocalSearchParams: () => ({}),
  useFocusEffect: (cb: () => void | (() => void)) => {
    const React = require('react');
    React.useEffect(() => cb(), []);
  },
  Stack: {Screen: () => null},
}));

jest.mock('@expo/vector-icons', () => ({
  Ionicons: () => null,
  MaterialCommunityIcons: () => null,
}));

jest.mock('expo-linear-gradient', () => {
  const {View: RNView} = require('react-native');
  return {LinearGradient: RNView};
});

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({top: 0, bottom: 0, left: 0, right: 0}),
}));

jest.mock('@lib/haptics', () => ({
  haptics: {tap: jest.fn(), success: jest.fn(), error: jest.fn()},
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
  warning: '#f59e0b',
};

// A flat, clearly-not-primary/primaryDark 3-stop — proves a real swap
// happened rather than a coincidental match (same technique as
// hcHeaderGradients.test.tsx, Tanda L).
const mockHeaderColors = ['#000000', '#000000', '#000000'] as const;
// Mutable per-test, same pattern hcHeaderGradients.test.tsx uses.
let mockHighContrast = false;

jest.mock('@hooks/useTheme', () => ({
  useTheme: () => ({
    colors: mockColors,
    gradient: {
      colors: mockHeaderColors,
      headerColors: mockHeaderColors,
      accentGlow: '#FFD60A',
    },
    highContrast: mockHighContrast,
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

// Narration/TTS is irrelevant to either fix under test — stubbed away like
// quizExitConfirm.test.tsx stubs QuizPanel, so the test stays focused on
// the screen's own back-navigation + header wiring.
jest.mock('@hooks/useNarratedWalkthrough', () => ({
  useNarratedWalkthrough: () => ({
    speaking: false,
    walkthroughActive: false,
    start: jest.fn(),
    stop: jest.fn(),
    toggle: jest.fn(),
    speakOnce: jest.fn(),
  }),
}));

jest.mock('@lib/database', () => ({
  __esModule: true,
  default: {
    initialize: jest.fn(async () => undefined),
    getVerse: jest.fn(async () => ({text: 'mock verse text'})),
  },
}));

jest.mock('@lib/utils/logger', () => ({
  logger: {error: jest.fn(), info: jest.fn(), warn: jest.fn()},
}));

jest.mock('@context/MemoryDeckContext', () => ({
  useMemoryDeck: () => ({
    hasCard: () => false,
    addCard: jest.fn(),
    reviewCard: jest.fn(),
  }),
}));

jest.mock('@context/ToastContext', () => ({
  useToast: () => ({success: jest.fn(), error: jest.fn()}),
}));

jest.mock('@context/ServicesContext', () => ({
  useServices: () => ({
    achievementService: null,
    notifyAchievements: jest.fn(),
  }),
}));

jest.mock('@components/study/ProphecyShareModal', () => ({
  ProphecyShareModal: () => null,
}));

jest.mock('@components/reading/OriginalLanguagesSheet', () => ({
  OriginalLanguagesSheet: () => null,
}));

const es = require('../src/i18n/translations').translations.es;
const tp = es.prophecies;
const backLabel = es.bible.back;

function renderScreen() {
  return render(<PropheticThreadScreen />);
}

/** From the intro (phase -1), tap "Comenzar" to land on the first prophecy (phase 0). */
async function begin(utils: ReturnType<typeof renderScreen>) {
  fireEvent.press(utils.getByLabelText(tp.begin));
  await waitFor(() => {
    expect(utils.queryByText(tp.intro)).toBeNull();
  });
}

describe('Prophetic Thread screen — back navigation returns to the hub before exiting (overrides Tanda G)', () => {
  // A fresh spy per test, and restored via `afterEach` (not a manual
  // `mockRestore()` call at the end of each test body) so a MID-TEST
  // assertion failure — e.g. exactly what happens when this suite is run
  // against the pre-fix code — can never skip cleanup and leak a stale spy
  // (bound to a previous test's already-unmounted screen instance) into the
  // next test's `mock.calls[0]` lookup.
  let addEventListenerSpy: jest.SpyInstance;

  beforeEach(() => {
    mockBack.mockClear();
    mockPush.mockClear();
    mockHighContrast = false;
    addEventListenerSpy = jest.spyOn(BackHandler, 'addEventListener');
  });

  afterEach(() => {
    addEventListenerSpy.mockRestore();
  });

  it('at the intro (phase -1), hardware back returns false (default route-pop) — unchanged baseline', () => {
    renderScreen();

    const handler = addEventListenerSpy.mock.calls[0][1] as () => boolean;
    let consumed: boolean | undefined;
    act(() => {
      consumed = handler();
    });

    expect(consumed).toBe(false);
    expect(mockBack).not.toHaveBeenCalled();
  });

  it('after stepping into the list (phase > -1), hardware back jumps straight to the hub card — not one prophecy at a time, and not straight out to Home', async () => {
    const utils = renderScreen();
    await begin(utils);

    const handler = addEventListenerSpy.mock.calls[0][1] as () => boolean;
    let consumed: boolean | undefined;
    act(() => {
      consumed = handler();
    });

    // `true`: the screen itself handles the event — phase jumps straight to
    // -1 (the hub), re-showing the intro card. This is neither Tanda G's
    // original bug (stepping back one prophecy per press) nor the
    // regression this fix addresses (falling through and exiting the
    // screen immediately).
    expect(consumed).toBe(true);
    expect(utils.queryByText(tp.intro)).not.toBeNull();
    expect(mockBack).not.toHaveBeenCalled();
  });

  it('a second hardware back from the hub (now genuinely phase -1) falls through to the default route-pop', async () => {
    const utils = renderScreen();
    await begin(utils);

    const handler = addEventListenerSpy.mock.calls[0][1] as () => boolean;
    act(() => {
      handler(); // first press: mid-thread -> jumps to the hub
    });
    let consumed: boolean | undefined;
    act(() => {
      consumed = handler(); // second press: already at the hub
    });

    expect(consumed).toBe(false);
    expect(mockBack).not.toHaveBeenCalled();
  });

  it('the header back arrow jumps to the hub card first when mid-thread, instead of exiting immediately', async () => {
    const utils = renderScreen();
    await begin(utils);

    fireEvent.press(utils.getByLabelText(backLabel));

    expect(utils.queryByText(tp.intro)).not.toBeNull();
    expect(mockBack).not.toHaveBeenCalled();
  });

  it('the header back arrow exits (router.back()) once already at the hub (phase -1)', () => {
    const utils = renderScreen();

    fireEvent.press(utils.getByLabelText(backLabel));

    expect(mockBack).toHaveBeenCalledTimes(1);
  });

  it('while the index sheet is open, hardware back still closes it first — the sheet-closing branches are untouched', () => {
    const utils = renderScreen();

    // Two elements share this label at the intro: the header's list-toggle
    // button (renders first, in the header) and the intro's own "Ver
    // índice" link — the header toggle is the one with `accessibilityState.
    // expanded`, so filter down to it rather than assume tree order.
    const findToggle = () =>
      utils
        .getAllByLabelText(tp.indexTitle)
        .find(el => el.props.accessibilityState?.expanded !== undefined);

    fireEvent.press(findToggle()!);
    expect(findToggle()!.props.accessibilityState.expanded).toBe(true);

    const handler = addEventListenerSpy.mock.calls[0][1] as () => boolean;
    let consumed: boolean | undefined;
    act(() => {
      consumed = handler();
    });

    // `true` consumes the event — the sheet closes, the screen doesn't exit.
    expect(consumed).toBe(true);
    expect(findToggle()!.props.accessibilityState.expanded).toBe(false);
    expect(mockBack).not.toHaveBeenCalled();
  });

  it('while the index sheet is open and mid-thread, the header back arrow also closes the sheet first — same priority as hardware back, not a separate exit-immediately path', async () => {
    const utils = renderScreen();
    await begin(utils); // phase > -1, so this also proves the sheet check
    // runs before the phase->hub jump, not just before router.back().

    const findToggle = () =>
      utils
        .getAllByLabelText(tp.indexTitle)
        .find(el => el.props.accessibilityState?.expanded !== undefined);

    fireEvent.press(findToggle()!);
    expect(findToggle()!.props.accessibilityState.expanded).toBe(true);

    fireEvent.press(utils.getByLabelText(backLabel));

    // First header-arrow tap only closes the sheet — it neither jumps to
    // the hub nor exits yet, matching hardware back's own priority.
    expect(findToggle()!.props.accessibilityState.expanded).toBe(false);
    expect(utils.queryByText(tp.intro)).toBeNull();
    expect(mockBack).not.toHaveBeenCalled();
  });
});

describe('Prophetic Thread screen — header gradient under high contrast (Tanda G, mirrors Tanda L)', () => {
  beforeEach(() => {
    mockHighContrast = false;
  });

  // Same lookup technique as hcHeaderGradients.test.tsx: the header
  // LinearGradient (mocked to plain `View`) is the only element carrying a
  // `colors` array prop.
  function findHeaderGradient(
    views: ReturnType<ReturnType<typeof render>['UNSAFE_getAllByType']>,
  ) {
    const matches = views.filter(v => Array.isArray(v.props.colors));
    if (matches.length !== 1) {
      throw new Error(
        `Expected exactly one header gradient View, found ${matches.length}`,
      );
    }
    return matches[0];
  }

  it('normal mode: header stays [colors.primary, colors.primaryDark], unchanged', () => {
    mockHighContrast = false;
    const {UNSAFE_getAllByType} = renderScreen();
    const header = findHeaderGradient(UNSAFE_getAllByType(View));
    expect(header.props.colors).toEqual([
      mockColors.primary,
      mockColors.primaryDark,
    ]);
  });

  it('high contrast: header switches to gradient.headerColors', () => {
    mockHighContrast = true;
    const {UNSAFE_getAllByType} = renderScreen();
    const header = findHeaderGradient(UNSAFE_getAllByType(View));
    expect(header.props.colors).toEqual(mockHeaderColors);
    // Proves it did NOT fall back to the illegible amber/white pair.
    expect(header.props.colors).not.toEqual([
      mockColors.primary,
      mockColors.primaryDark,
    ]);
  });
});
