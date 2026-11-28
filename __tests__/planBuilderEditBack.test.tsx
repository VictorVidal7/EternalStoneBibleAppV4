/**
 * R9-507 — after editing a custom plan and «Guardar cambios», the back led to
 * the OLD plan (an id that no longer exists): `router.replace('/plan/<new>')`
 * from the root Stack stacked a second `(tabs)` and left the first one on
 * `plan/<old>` underneath, still resolving the deleted plan at 0 %; a tap
 * there wrote orphan progress.
 *
 * The real plan screen and the real builder over `renderRouter` with the shape
 * of the app's layouts (root Stack with `(tabs)` + features; Tabs with
 * `backBehavior="history"` and `plan/[id]` hidden), the real custom-plans and
 * plan-progress providers over the AsyncStorage mock of jest.setup.
 */
import {Text} from 'react-native';
import {Stack, Tabs, router} from 'expo-router';
import {
  renderRouter,
  act,
  fireEvent,
  screen,
  waitFor,
} from 'expo-router/testing-library';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {translations} from '@/i18n/translations';
import {makeCustomPlanBundle} from '@lib/together';
import {customPlanFromBundle} from '@lib/reading/customPlans';

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
jest.mock('@lib/haptics', () => ({
  haptics: {
    tap: jest.fn(),
    success: jest.fn(),
    error: jest.fn(),
    press: jest.fn(),
    selection: jest.fn(),
  },
}));
jest.mock('@lib/database', () => {
  const db = new Proxy(
    {},
    {
      get: (_t, k) =>
        k === '__esModule' ? undefined : jest.fn(async () => null),
    },
  );
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
}));
const mockLang = {
  language: 'es',
  t: require('@/i18n/translations').translations.es,
  setLanguage: jest.fn(),
};
jest.mock('@hooks/useLanguage', () => ({useLanguage: () => mockLang}));
const mockToast = {
  success: jest.fn(),
  info: jest.fn(),
  error: jest.fn(),
  show: jest.fn(),
  warning: jest.fn(),
};
jest.mock('@context/ToastContext', () => ({useToast: () => mockToast}));
const mockTogether = {getMembership: () => undefined, leavePlan: jest.fn()};
jest.mock('@context/TogetherContext', () => ({
  useTogether: () => mockTogether,
}));
const mockAudio = {loadChapter: jest.fn(), play: jest.fn()};
jest.mock('@/features/audio', () => ({
  useAudioPlayer: () => mockAudio,
  toAudioVerses: () => [],
}));
jest.mock('@components/together/ShareTogetherModal', () => ({
  ShareTogetherModal: () => null,
}));
jest.mock('@components/together/ShareCustomPlanModal', () => ({
  ShareCustomPlanModal: () => null,
}));

const {
  CustomPlansProvider,
  useCustomPlans,
} = require('@context/CustomPlansContext');
const {
  ReadingPlanProgressProvider,
} = require('@context/ReadingPlanProgressContext');
const PlanScreen = require('../app/(tabs)/plan/[id]').default;
const BuilderScreen = require('../app/features/plan-builder/index').default;

const es = translations.es;
const S = (name: string) => () => <Text>{name}</Text>;
let ctxRef: {
  customPlans: {id: string; name: string}[];
} | null = null;
function Spy() {
  ctxRef = useCustomPlans();
  return null;
}
function routes() {
  return {
    _layout: () => (
      <CustomPlansProvider>
        <ReadingPlanProgressProvider>
          <Spy />
          <Stack screenOptions={{headerShown: false}}>
            <Stack.Screen name="(tabs)" />
          </Stack>
        </ReadingPlanProgressProvider>
      </CustomPlansProvider>
    ),
    '(tabs)/_layout': () => (
      <Tabs backBehavior="history" screenOptions={{headerShown: false}}>
        <Tabs.Screen name="index" />
        <Tabs.Screen name="plan/[id]" options={{href: null}} />
      </Tabs>
    ),
    '(tabs)/index': S('HOME'),
    '(tabs)/plan/[id]': PlanScreen,
    'features/plan-builder/index': BuilderScreen,
  };
}

const PLAN = customPlanFromBundle(
  makeCustomPlanBundle('Romanos corto', [[[45, 1]], [[45, 2]], [[45, 3]]]),
)!;

beforeEach(async () => {
  ctxRef = null;
  await AsyncStorage.clear();
  await AsyncStorage.setItem('@custom_plans', JSON.stringify([PLAN]));
  await AsyncStorage.setItem(
    '@reading_plan_progress',
    JSON.stringify({
      [PLAN.id]: {completedDays: [1], startedAt: '2026-10-01T12:00:00.000Z'},
    }),
  );
});

async function openPlanAndEditor() {
  const r = renderRouter(routes(), {initialUrl: '/'});
  await screen.findByText('HOME');
  await waitFor(() => expect(ctxRef?.customPlans?.length).toBe(1));
  act(() => router.push(`/plan/${PLAN.id}` as never));
  await screen.findAllByText('Romanos corto');
  const edit = await screen.findAllByLabelText(es.planBuilder.editTitle);
  await act(async () => {
    fireEvent.press(edit[0]);
  });
  expect(r.getPathname()).toBe('/features/plan-builder');
  await screen.findByDisplayValue('Romanos corto');
  return r;
}

describe('R9-507 — el atrás tras «Guardar cambios» de un plan propio', () => {
  test('se ve el plan editado y el atrás vuelve al Home, nunca al plan viejo', async () => {
    const r = await openPlanAndEditor();
    fireEvent.changeText(
      screen.getByDisplayValue('Romanos corto'),
      'Romanos corto II',
    );
    await act(async () => {
      fireEvent.press(screen.getAllByLabelText(es.planBuilder.save)[0]);
    });
    await waitFor(() =>
      expect(r.getPathname()).not.toBe('/features/plan-builder'),
    );
    const newId = ctxRef!.customPlans[0].id;
    expect(newId).not.toBe(PLAN.id);
    expect(r.getPathname()).toBe(`/plan/${newId}`);
    await screen.findAllByText('Romanos corto II');

    await act(async () => {
      router.back();
    });
    expect(r.getPathname()).toBe('/');
    expect(screen.queryAllByText('Romanos corto')).toHaveLength(0);
    expect(screen.queryAllByText(es.bible.bookNotFound)).toHaveLength(0);
    expect(router.canGoBack()).toBe(false);
  });

  test('control: crear desde el Home abre el plan y el atrás vuelve al Home', async () => {
    const r = renderRouter(routes(), {initialUrl: '/'});
    await screen.findByText('HOME');
    await waitFor(() => expect(ctxRef?.customPlans?.length).toBe(1));
    act(() => router.push('/features/plan-builder' as never));
    await screen.findByText(es.planBuilder.title);
    fireEvent.changeText(
      screen.getByPlaceholderText(es.planBuilder.namePlaceholder),
      'Génesis entero',
    );
    await act(async () => {
      fireEvent.press(screen.getAllByLabelText(es.planBuilder.addPassage)[0]);
    });
    await act(async () => {
      fireEvent.press(screen.getByText('Génesis'));
    });
    // The picker's confirm button is the last one with this label.
    const confirm = screen.getAllByLabelText(es.planBuilder.addThisPassage);
    await act(async () => {
      fireEvent.press(confirm[confirm.length - 1]);
    });
    await act(async () => {
      fireEvent.press(screen.getByLabelText(es.planBuilder.create));
    });
    await waitFor(() => expect(r.getPathname()).toMatch(/^\/plan\/custom-/));
    await act(async () => {
      router.back();
    });
    expect(r.getPathname()).toBe('/');
    expect(router.canGoBack()).toBe(false);
  });

  test('control: abrir el editor y volver sin guardar deja el mismo plan', async () => {
    const r = await openPlanAndEditor();
    await act(async () => {
      router.back();
    });
    expect(r.getPathname()).toBe(`/plan/${PLAN.id}`);
    await screen.findAllByText('Romanos corto');
  });
});
