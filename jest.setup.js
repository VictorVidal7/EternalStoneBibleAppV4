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
jest.mock('react-native-worklets', () =>
  require('react-native-worklets/src/mock'),
);

// Reanimated
jest.mock('react-native-reanimated', () =>
  require('react-native-reanimated/mock'),
);

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
