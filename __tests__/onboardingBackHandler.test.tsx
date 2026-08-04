/**
 * fix/onboarding-back-handler — hardware back now steps backward through the
 * first-run onboarding wizard instead of doing nothing useful (or, in the
 * worst case, exiting the app).
 *
 * Prior behavior (verified by reading the code, not assumed): OnboardingScreen
 * registered no `hardwareBackPress` listener at all. It's mounted by
 * `app/_layout.tsx` IN PLACE OF the whole route tree (`<RootStack />`) while
 * `@onboarding_completed` is unset, so during onboarding it is the sole
 * screen in Expo Router's internal root stack (`ExpoRoot`'s `Content()`
 * builds a single-entry `StackRouter` around the root layout, see
 * `node_modules/expo-router/build/ExpoRoot.js`). With no listener of its own,
 * a hardware/gesture back press fell straight through to
 * `@react-navigation/native`'s own `useBackButton` listener
 * (`node_modules/@react-navigation/native/src/useBackButton.native.tsx`),
 * which checks `navigation.canGoBack()`. Since nothing was mounted below the
 * root screen (no nested Tabs/Stack — those only exist inside `<RootStack />`,
 * which isn't rendered during onboarding), `canGoBack()` is false, so that
 * listener also declines the event (`return false`) — and an unconsumed
 * hardwareBackPress falls through to Android's OS-level default, which exits
 * the current activity. So the prior real-world behavior was "hardware/
 * gesture back exits the app mid first-run setup", not merely "does
 * nothing".
 *
 * Fix: wire the same `useBackHandlerStep` hook every other multi-step screen
 * uses, but — unlike every other call site — it NEVER returns `false`, even
 * at step 0. Onboarding has no legitimate previous screen to fall through to
 * (see above), so step 0 must be an absorbed no-op instead of a route-pop,
 * exactly matching what the on-screen "Atrás" button already does there
 * (`goBack` returns early at `isFirst`, doing nothing).
 *
 * Test technique: same as `propheticThreadBackAndHeader.test.tsx` /
 * `quizExitConfirm.test.tsx` — `jest.spyOn(BackHandler, 'addEventListener')`
 * to capture and directly invoke the registered handler (react-native
 * resolves to the iOS build under Jest, which never stores it on its own).
 */
import React from 'react';
import {render, fireEvent, act} from '@testing-library/react-native';
import {BackHandler} from 'react-native';
import {OnboardingScreen} from '../src/components/onboarding/OnboardingScreen';
import {translations} from '../src/i18n/translations';

// useBackHandlerStep subscribes via expo-router's useFocusEffect — run the
// focus callback synchronously, like on a real screen mount (same technique
// as guidedDevotionNav.test.tsx).
jest.mock('expo-router', () => ({
  useFocusEffect: (cb: () => void) => cb(),
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

const mockColors = {
  primary: '#6366f1',
  primaryDark: '#4338ca',
  text: '#ffffff',
  textSecondary: '#cccccc',
  border: '#222222',
  surface: '#111111',
  background: '#000000',
  onPrimary: '#ffffff',
};

const mockSetColorTheme = jest.fn(async () => undefined);

// ColorThemeStep (step 3) does `Object.keys(colorThemes)` at module scope
// inside its own render — a naive mock (without these two real exports)
// would only crash if the wizard is advanced that far. Spreading the actual
// exports keeps this test resilient even if a future test extends coverage
// to the theme step, at zero cost today (same caution as
// themeHeaderContrast.test.ts, which imports `colorThemes` unmocked).
jest.mock('@hooks/useTheme', () => {
  const actual = jest.requireActual('@hooks/useTheme');
  return {
    colorThemes: actual.colorThemes,
    PREMIUM_COLOR_THEMES: actual.PREMIUM_COLOR_THEMES,
    useTheme: () => ({
      colors: mockColors,
      gradient: {headerColors: ['#000000', '#000000'], accentGlow: '#FFD60A'},
      colorTheme: 'indigo',
      setColorTheme: mockSetColorTheme,
    }),
  };
});

const mockSetLanguage = jest.fn(async () => undefined);
jest.mock('@hooks/useLanguage', () => ({
  useLanguage: () => ({
    language: 'es',
    setLanguage: mockSetLanguage,
    t: require('../src/i18n/translations').translations.es,
  }),
}));

const mockSetVersion = jest.fn(async () => undefined);
const mockAvailableVersions = [
  {
    id: 'RVR1960',
    name: 'Reina Valera',
    abbreviation: 'RVR1960',
    language: 'es',
    year: '1960',
  },
];
jest.mock('@hooks/useBibleVersion', () => ({
  useBibleVersion: () => ({
    selectedVersion: mockAvailableVersions[0],
    setVersion: mockSetVersion,
    availableVersions: mockAvailableVersions,
  }),
}));

const t = translations.es.onboarding;

function renderOnboarding(onDone = jest.fn()) {
  return {onDone, ...render(<OnboardingScreen onDone={onDone} />)};
}

describe('OnboardingScreen — hardware back steps backward through the wizard', () => {
  let addEventListenerSpy: jest.SpyInstance;

  beforeEach(() => {
    mockSetLanguage.mockClear();
    mockSetVersion.mockClear();
    mockSetColorTheme.mockClear();
    addEventListenerSpy = jest.spyOn(BackHandler, 'addEventListener');
  });

  afterEach(() => {
    addEventListenerSpy.mockRestore();
  });

  it('at step 0 (welcome), hardware back is absorbed — consumes the event but does nothing, never exiting the app', () => {
    const {getByText, onDone} = renderOnboarding();

    expect(
      getByText(t.step.replace('{{current}}', '1').replace('{{total}}', '5')),
    ).toBeTruthy();

    const handler = addEventListenerSpy.mock.calls[0][1] as () => boolean;
    let consumed: boolean | undefined;
    act(() => {
      consumed = handler();
    });

    // The load-bearing claim: unlike every other useBackHandlerStep call
    // site, step 0 here still returns `true` — it must never fall through
    // to react-navigation's default (which would exit the app, see the
    // file-header comment).
    expect(consumed).toBe(true);
    // Still on step 1 of 5 — nothing moved, nothing was submitted.
    expect(
      getByText(t.step.replace('{{current}}', '1').replace('{{total}}', '5')),
    ).toBeTruthy();
    expect(onDone).not.toHaveBeenCalled();
    expect(mockSetLanguage).not.toHaveBeenCalled();
  });

  it('after advancing to step 2 (language), hardware back retreats one step, exactly like the on-screen "Atrás" button', () => {
    const {getByText, getByLabelText} = renderOnboarding();

    fireEvent.press(getByLabelText(t.next));
    expect(
      getByText(t.step.replace('{{current}}', '2').replace('{{total}}', '5')),
    ).toBeTruthy();

    const handler = addEventListenerSpy.mock.calls[0][1] as () => boolean;
    let consumed: boolean | undefined;
    act(() => {
      consumed = handler();
    });

    expect(consumed).toBe(true);
    expect(
      getByText(t.step.replace('{{current}}', '1').replace('{{total}}', '5')),
    ).toBeTruthy();
  });

  it('two hardware-back presses from step 3 (Bible version) land back on step 1, same as tapping "Atrás" twice', () => {
    const {getByText, getByLabelText} = renderOnboarding();

    fireEvent.press(getByLabelText(t.next)); // step 1 -> 2
    fireEvent.press(getByLabelText(t.next)); // step 2 -> 3
    expect(
      getByText(t.step.replace('{{current}}', '3').replace('{{total}}', '5')),
    ).toBeTruthy();

    const handler = addEventListenerSpy.mock.calls[0][1] as () => boolean;
    act(() => {
      handler();
    });
    act(() => {
      handler();
    });

    expect(
      getByText(t.step.replace('{{current}}', '1').replace('{{total}}', '5')),
    ).toBeTruthy();
  });
});
