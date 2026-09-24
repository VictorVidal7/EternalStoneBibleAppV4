// Pin NODE_ENV for every jest run, whatever the shell exports. Jest's CLI
// only sets NODE_ENV=test when the variable is UNSET (jest-cli/bin/jest.js),
// so a shell that exports NODE_ENV=development (Victor's Windows user
// environment does) ran the suite under 'development' while CI ran it under
// 'test' — green in CI, red locally:
//  - React Native's Animated only tolerates a missing native view when
//    NODE_ENV === 'test' (AnimatedProps#connectAnimatedView uses a dummy tag);
//    under any other value a native-driven animation (e.g. TouchableOpacity's
//    opacity fade when a re-render flips `disabled`) throws "Unable to locate
//    attached view in the native tree".
//  - The transforms change too: under 'development' babel-preset-expo injects
//    a console.warn after every deep `require('react-native/...')`; under
//    'production' it inlines Platform.OS and babel.config.js strips
//    console.log. babel-jest keys its transform cache on NODE_ENV.
// This file is loaded by jest's parent process before it forks any worker,
// and workers inherit the parent's environment, so setting it here reaches
// every test file (in-band or not).
process.env.NODE_ENV = 'test';

module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  // Never scan Claude Code's internal worktree storage — orphaned agent
  // worktrees under .claude/ carry stale copies of these very test files and
  // duplicate manual mocks, which otherwise break the suite with haste-map
  // collisions. This keeps the gate robust even if a worktree is left behind.
  testPathIgnorePatterns: ['/node_modules/', '<rootDir>/.claude/'],
  modulePathIgnorePatterns: ['<rootDir>/.claude/'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|@sentry/.*|@shopify/flash-list|standard-navigation)',
    // jest-expo's own preset ships these two extra entries to guard against
    // "Reentrant plugin detected" Babel errors when the worklets/reanimated
    // plugin gets loaded twice in one transform pass — our custom regex
    // above fully replaces (not merges with) the preset's array, so they
    // have to be restored explicitly here.
    '/node_modules/react-native-worklets/plugin/',
    '/node_modules/react-native-reanimated/plugin/',
  ],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx,js,jsx}',
    'app/**/*.{ts,tsx,js,jsx}',
    '!src/**/*.test.{ts,tsx,js,jsx}',
    '!src/**/__tests__/**',
    '!src/**/__mocks__/**',
    '!src/types/**',
    '!src/data/**',
    '!app/_layout.tsx',
  ],
  // No global coverage threshold yet — the test suite is still being built
  // out. Re-introduce a realistic threshold as coverage grows so `test:ci`
  // does not fail purely on coverage.
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@app/(.*)$': '<rootDir>/app/$1',
    '\\.(jpg|jpeg|png|gif|svg)$': '<rootDir>/__mocks__/fileMock.js',
  },
  testMatch: [
    '**/__tests__/**/*.(test|spec).[jt]s?(x)',
    '**/?(*.)+(spec|test).[jt]s?(x)',
  ],
  globals: {
    'ts-jest': {
      tsconfig: {
        jsx: 'react',
      },
    },
  },
};
