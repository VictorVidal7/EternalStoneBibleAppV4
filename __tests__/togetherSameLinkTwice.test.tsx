/**
 * R9-541 (merged into R9-507) — every shared link is https and enters through
 * `together`, which `replace`s itself with the landing. Tapping the SAME link
 * again (back in the messenger) pushed another `together` on top of the
 * landing, which was replaced by a second, identical landing: the first back
 * changed nothing visible.
 *
 * The real Together screen and the real landings over the real navigation
 * (`renderRouter`), with the real `redirectSystemPath` (app/+native-intent)
 * and the expo-linking `url` event fired the way Android fires it.
 */
import {Text} from 'react-native';
import {Stack, Tabs, router} from 'expo-router';
import {renderRouter, screen} from 'expo-router/testing-library';
import {act, waitFor} from '@testing-library/react-native';
import {makeCalBundle, makeStudyBundle, encodeBundleParam} from '@lib/together';

let mockUrlListener: ((e: {url: string}) => unknown) | null = null;
jest.mock('expo-linking', () => ({
  ...jest.requireActual('expo-linking'),
  createURL: (p: string) => 'eternalbible://' + p,
  resolveScheme: () => 'eternalbible',
  addEventListener: (_ev: string, cb: (e: {url: string}) => unknown) => {
    mockUrlListener = cb;
    return {remove() {}};
  },
}));
jest.mock('react-native-safe-area-context', () => {
  const actual = jest.requireActual('react-native-safe-area-context');
  return {
    ...actual,
    useSafeAreaInsets: () => ({top: 0, bottom: 0, left: 0, right: 0}),
  };
});
jest.mock('@expo/vector-icons', () => ({Ionicons: () => null}));
jest.mock('expo-linear-gradient', () => {
  const {View} = require('react-native');
  return {LinearGradient: View};
});
jest.mock('expo-clipboard', () => ({
  getStringAsync: jest.fn(async () => ''),
  setStringAsync: jest.fn(),
}));
jest.mock('@lib/haptics', () => ({
  haptics: {
    tap: jest.fn(),
    success: jest.fn(),
    error: jest.fn(),
    press: jest.fn(),
    warning: jest.fn(),
  },
}));
jest.mock('@lib/database', () => {
  const db = {
    initialize: jest.fn(async () => undefined),
    getVerse: jest.fn(async (b: number, c: number, v: number) => ({
      text: `TEXTO-${b}-${c}-${v}`,
    })),
  };
  return {__esModule: true, default: db, bibleDB: db};
});
const mockColors = new Proxy({}, {get: () => '#123456'});
const mockTheme = {
  isDark: false,
  colors: mockColors,
  gradient: {headerColors: ['#000', '#111']},
  highContrast: false,
};
jest.mock('@hooks/useTheme', () => ({useTheme: () => mockTheme}));
const mockVersion = {
  selectedVersion: {
    id: 'RVR1960',
    language: 'es',
    abbreviation: 'RVR1960',
    name: 'RVR1960',
  },
  availableVersions: [],
};
jest.mock('@hooks/useBibleVersion', () => ({
  useBibleVersion: () => mockVersion,
  useBibleVersionOptional: () => mockVersion,
}));
const mockLang = {
  language: 'es',
  t: require('@/i18n/translations').translations.es,
  setLanguage: jest.fn(),
};
jest.mock('@hooks/useLanguage', () => ({useLanguage: () => mockLang}));
const mockToast = {showToast: jest.fn(), show: jest.fn()};
jest.mock('@context/ToastContext', () => ({useToast: () => mockToast}));
const mockTogether = {joinPlan: jest.fn()};
jest.mock('@context/TogetherContext', () => ({
  useTogether: () => mockTogether,
}));
const mockCustom = {saveCustomPlan: jest.fn()};
jest.mock('@context/CustomPlansContext', () => ({
  useCustomPlans: () => mockCustom,
}));
const mockProgress = {setPlanStart: jest.fn()};
jest.mock('@context/ReadingPlanProgressContext', () => ({
  useReadingPlanProgress: () => mockProgress,
}));
jest.mock('@components/FeatureGuideModal', () => ({
  FeatureGuideModal: () => null,
}));

const {redirectSystemPath} = require('../app/+native-intent');
const Together = require('../app/features/together/index').default;
const DevShared = require('../app/features/devotional-shared/index').default;
const StudyShared = require('../app/features/study-shared/index').default;
const {store} = require('expo-router/build/global-state/store');

const S = (name: string) => () => <Text>{name}</Text>;
function routes() {
  return {
    _layout: () => (
      <Stack screenOptions={{headerShown: false}}>
        <Stack.Screen name="(tabs)" />
      </Stack>
    ),
    '(tabs)/_layout': () => (
      <Tabs backBehavior="history" screenOptions={{headerShown: false}}>
        <Tabs.Screen name="index" />
      </Tabs>
    ),
    '(tabs)/index': S('home'),
    '+native-intent': {redirectSystemPath},
    'features/together/index': Together,
    'features/devotional-shared/index': DevShared,
    'features/study-shared/index': StudyShared,
  };
}
const calA = encodeBundleParam(
  makeCalBundle('2026-11-10', 'DEVO A', [
    {bookId: 43, chapter: 3, verse: 16},
    {bookId: 43, chapter: 3, verse: 17},
  ])!,
);
const calB = encodeBundleParam(
  makeCalBundle('2026-11-10', 'DEVO B', [
    {bookId: 45, chapter: 8, verse: 28},
    {bookId: 45, chapter: 8, verse: 29},
  ])!,
);
const studyS = encodeBundleParam(
  makeStudyBundle(
    {bookId: 19, chapter: 23, startVerse: 1, endVerse: 2},
    'ESTUDIO S',
    {observation: 'obs'},
  ),
);
const https = (d: string) => `https://eternalstonebible.github.io/o/#d=${d}`;
// redirectSystemPath already returns a path; a full URL is cut to its path.
const asExpo = (u: string) => {
  try {
    const {origin, href} = new URL(u);
    return href.replace(origin, '');
  } catch {
    return u;
  }
};
const coldStart = () =>
  renderRouter(routes(), {
    initialUrl: asExpo(
      String(redirectSystemPath({path: https(calA), initial: true})),
    ),
  });
// The root state wraps the stack in `__root` (one route): the stack is its state.
type R = {name: string; key: string; params?: {d?: string}};
const stack = (): R[] => {
  const root = store.navigationRef.getRootState();
  const st =
    root.routes.length === 1 && root.routes[0].state
      ? root.routes[0].state
      : root;
  return st.routes;
};
const label = (d?: string) =>
  d === calA ? 'A' : d === calB ? 'B' : d === studyS ? 'S' : d ? '?' : '-';
const landings = () =>
  stack()
    .filter(r => r.name !== 'features/together/index')
    .map(r => label(r.params?.d));
const emit = async (url: string) => {
  expect(mockUrlListener).not.toBeNull();
  await act(async () => {
    await mockUrlListener!({url});
  });
  await act(async () => {
    jest.advanceTimersByTime(50);
  });
};

describe('R9-541 — el mismo enlace tocado dos veces', () => {
  test('el mismo enlace A otra vez deja un solo landing A, sin together', async () => {
    coldStart();
    await waitFor(() => expect(screen.queryByText('DEVO A')).not.toBeNull());
    await emit(https(calA));
    expect(landings()).toEqual(['A']);
    expect(stack().map(r => r.name)).not.toContain('features/together/index');
    expect(screen.queryByText('DEVO A')).not.toBeNull();
  });

  test('control: B sobre A da [A, B] y el atrás vuelve a A', async () => {
    coldStart();
    await waitFor(() => expect(screen.queryByText('DEVO A')).not.toBeNull());
    await emit(https(calB));
    await waitFor(() => expect(screen.queryByText('DEVO B')).not.toBeNull());
    expect(landings()).toEqual(['A', 'B']);
    await act(async () => {
      router.back();
    });
    expect(landings()).toEqual(['A']);
  });

  test('control: del devocional al estudio da [A, S]', async () => {
    coldStart();
    await waitFor(() => expect(screen.queryByText('DEVO A')).not.toBeNull());
    await emit(https(studyS));
    await waitFor(() =>
      expect(stack().slice(-1)[0].name).toBe('features/study-shared/index'),
    );
    expect(landings()).toEqual(['A', 'S']);
  });
});
