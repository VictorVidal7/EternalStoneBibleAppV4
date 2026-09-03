/**
 * Jest setup — runs after the test framework is installed.
 *
 * Only mocks libraries that are actually installed. The previous version
 * mocked react-native-push-notification, react-native-vector-icons and
 * @react-navigation/native — none of which are dependencies anymore — which
 * made every test suite fail at setup time.
 */

import 'react-native-gesture-handler/jestSetup';
import mockAsyncStorage from '@react-native-async-storage/async-storage/jest/async-storage-mock';
import {configure} from '@testing-library/react-native';

// CI hardening — global async-utils + per-test timeouts.
//
// `test:ci` runs `jest --ci --coverage --maxWorkers=2`. Istanbul
// instrumentation under only two workers keeps the CI runner permanently in a
// slow-CPU state (never reproduced locally), and CI now runs on every pushed
// branch, so the exposure is broad. A cluster of RNTL suites
// (prepTableScreenVersionCompare, webStubProviders, AuthContext, OfferingSheet,
// the wordStudyScreen* family) gate every assertion on the same shape — a
// state update re-runs an effect that awaits a mocked service before the
// component re-renders; several chain ~9 such awaits. RNTL's 1000ms
// `asyncUtilTimeout` default and Jest's 5000ms per-test default
// (jest.config.js sets no `testTimeout`) are exactly what those suites overrun
// on a loaded runner, so they flake on CI only.
//
// Raise both globally so `waitFor` / `findBy*` stay patient without changing
// any assertion's meaning. The values are matched deliberately: with the
// async default at 5s, a single slow `waitFor` must not trip the per-test
// ceiling (20s) first, which would just trade one flake message for another.
// setupFilesAfterEnv runs per-suite in the same module registry as each test
// file, so this is equivalent to putting these two lines atop every suite.
configure({asyncUtilTimeout: 5000});
jest.setTimeout(20000);

// AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => mockAsyncStorage);

// expo-secure-store — simple in-memory mock (same shape as the AsyncStorage
// mock above); expo-secure-store ships no jest mock of its own.
jest.mock('expo-secure-store', () => {
  const store = new Map();
  return {
    getItemAsync: jest.fn(key => Promise.resolve(store.get(key) ?? null)),
    setItemAsync: jest.fn((key, value) => {
      store.set(key, value);
      return Promise.resolve();
    }),
    deleteItemAsync: jest.fn(key => {
      store.delete(key);
      return Promise.resolve();
    }),
    isAvailableAsync: jest.fn(() => Promise.resolve(true)),
  };
});

// Worklets (must be mocked before Reanimated's own mock, which eagerly
// requires the real react-native-worklets native module and throws
// "Native part of Worklets doesn't seem to be initialized" under Jest
// otherwise — SPIKE FINDING: needed for ANY worklets bump above the
// previously-pinned 0.5.1, including versions reanimated 4.1.x itself
// declares compatible (0.7.x). react-native-worklets ships its own Jest
// mock at src/mock.ts, but it is not exposed as a resolvable subpath
// export from the package root, so it must be required via the deep
// "react-native-worklets/src/mock" path rather than "react-native-worklets/mock".
jest.mock('react-native-worklets', () => ({
  ...require('react-native-worklets/src/mock'),
  // react-native-worklets 0.10.1's own mock doesn't provide these two —
  // reanimated 4.5.1's mock.ts imports the REAL `./index` barrel (for
  // pure-JS re-exports like Extrapolation/ReduceMotion), which eagerly
  // calls createNativeReanimatedModule() -> installTurboModule() at
  // require time, which needs these to exist. Even worklets' own "web"
  // implementation just throws ("not supported on web") rather than
  // stubbing them, so there's no upstream Jest-safe version to reuse —
  // stub them as no-ops here instead.
  getUIRuntimeHolder: () => ({}),
  getUISchedulerHolder: () => ({}),
  createShareable: value => value,
  toggleSlowAnimationsOnUIRuntime: () => {},
}));

// Reanimated
jest.mock('react-native-reanimated', () =>
  require('react-native-reanimated/mock'),
);

// @expensify/react-native-live-markdown
//
// NOT the package's own documented `.../mock` subpath
// (`jest.mock('@expensify/react-native-live-markdown', () =>
// require('@expensify/react-native-live-markdown/mock'))`) — that was tried
// first and is broken IN THIS PROJECT's Jest resolver setup specifically:
// `jest.mock()` intercepts by RESOLVED ABSOLUTE PATH, and this package has
// no "exports" map (only legacy "main"/"module"/"react-native" string
// fields), so Jest's default resolver — which only understands "main",
// not the ad hoc "react-native" field Metro honors at bundle time —
// resolves the bare specifier to `lib/commonjs/index.js`. The shipped
// mock (`lib/commonjs/mock/index.js`) internally does
// `require("../index.js")`, which resolves to that SAME absolute file.
// Since it's the same file already being mocked, that internal require
// hits Jest's circular-require short-circuit and gets back an EMPTY,
// still-in-progress exports object — so `MarkdownTextInput` silently comes
// back `undefined` (confirmed empirically against a pristine
// `node_modules` reinstall, not a leftover artifact of local debugging).
//
// Fix: build the mock shape ourselves, pulling the REAL component from a
// deep subpath (`.../lib/commonjs/MarkdownTextInput.js`) via
// `jest.requireActual`, which bypasses the mock registry entirely and sits
// outside the self-referential file the broken mock hits. Deliberately
// NOT `jest.requireActual('@expensify/react-native-live-markdown')` (the
// package root) — that would also eagerly load `parseExpensiMark.js`,
// which pulls in `expensify-common` + `html-entities` and is exactly what
// the library ships a mock to avoid (see `noteMarkdownRanges.ts`'s header
// comment on why this app's parser sidesteps that dependency entirely).
// This app's own custom parser (`noteMarkdownRanges.ts`) is NOT stubbed by
// any of this — it still runs for real in tests.
//
// Mocked by the SAME deep specifier the app itself imports
// (`@expensify/react-native-live-markdown/src/MarkdownTextInput`), not the
// package root barrel — confirmed via a live-device crash that importing
// the barrel (`@expensify/react-native-live-markdown`) eagerly evaluates
// `parseExpensiMark.ts` as a side effect of loading `index.tsx`'s re-export
// graph, which throws in `__DEV__` on native without the same html-entities
// patch-package step. `NoteEditorModal.tsx` deep-imports `MarkdownTextInput`
// directly to avoid that at runtime; this mock must intercept that same
// deep specifier (as a default export, matching `MarkdownTextInput.tsx`'s
// own export shape) or the real un-transformed TSX would hit Jest's default
// `transformIgnorePatterns` and fail to parse.
jest.mock('@expensify/react-native-live-markdown/src/MarkdownTextInput', () => {
  global.jsi_setMarkdownRuntime = jest.fn();
  global.jsi_registerMarkdownWorklet = jest.fn();
  global.jsi_unregisterMarkdownWorklet = jest.fn();
  return {
    __esModule: true,
    default: jest.requireActual(
      '@expensify/react-native-live-markdown/lib/commonjs/MarkdownTextInput.js',
    ).default,
  };
});

// Silence the useNativeDriver warning emitted by the Animated module. Must
// capture the ORIGINAL console.warn before spying — calling `console.warn`
// from inside its own mockImplementation would call the mock itself
// (infinite recursion) rather than actually printing anything.
const originalConsoleWarn = console.warn.bind(console);
jest.spyOn(console, 'warn').mockImplementation(message => {
  if (typeof message === 'string' && message.includes('useNativeDriver')) {
    return;
  }

  originalConsoleWarn(message);
});
