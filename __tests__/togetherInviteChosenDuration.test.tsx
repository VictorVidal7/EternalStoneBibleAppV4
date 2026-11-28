/**
 * R9-512 — inviting to a curated plan read over a chosen duration sent the
 * plan with its DEFAULT duration: the bundle carried only `p`, `s`, `g`, the
 * message said «en 80 días», and whoever joined read 40 («Mateo 6, Mateo 7»
 * on day 3 against «Mateo 3»). Once a member, the picker is hidden.
 *
 * End to end with the real producers: the real plan screen (which hands the
 * reader's duration to the real ShareTogetherModal) → the shared message →
 * the real Together screen on a fresh device → the joiner's plan days, all
 * over the real Together / custom plans / plan progress providers and the
 * AsyncStorage mock of jest.setup.
 */
import {Share} from 'react-native';
import {render, screen, act, fireEvent} from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const mockEs = require('../src/i18n/translations').translations.es;

const mockParams: {current: Record<string, string>} = {current: {}};
const mockRouter = {
  replace: jest.fn(),
  back: jest.fn(),
  push: jest.fn(),
  dismissTo: jest.fn(),
};
const mockNavigation = {getState: () => undefined};
jest.mock('expo-router', () => ({
  Stack: {Screen: () => null},
  useLocalSearchParams: () => mockParams.current,
  useRouter: () => mockRouter,
  useNavigation: () => mockNavigation,
}));
jest.mock('@expo/vector-icons', () => ({Ionicons: () => null}));
jest.mock('expo-linear-gradient', () => {
  const {View} = require('react-native');
  return {LinearGradient: View};
});
const mockInsets = {top: 0, bottom: 0, left: 0, right: 0};
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => mockInsets,
}));
jest.mock('expo-clipboard', () => ({
  getStringAsync: jest.fn(async () => ''),
  setStringAsync: jest.fn(async () => true),
}));
jest.mock('@lib/haptics', () => ({
  haptics: {tap: jest.fn(), press: jest.fn(), success: jest.fn()},
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
jest.mock('@/features/audio', () => ({
  useAudioPlayer: () => ({loadChapter: jest.fn(), play: jest.fn()}),
  toAudioVerses: () => [],
}));
jest.mock('@components/FeatureGuideModal', () => ({
  FeatureGuideModal: () => null,
}));
const mockColors = new Proxy({}, {get: () => '#123456'});
const mockTheme = {
  isDark: false,
  colors: mockColors,
  gradient: {headerColors: ['#000', '#111']},
  highContrast: false,
};
jest.mock('@hooks/useTheme', () => ({useTheme: () => mockTheme}));
const mockLang = {language: 'es', setLanguage: jest.fn(), t: mockEs};
jest.mock('@hooks/useLanguage', () => ({useLanguage: () => mockLang}));
const mockVersion = {
  selectedVersion: {id: 'RVR1960', language: 'es', abbreviation: 'RVR1960'},
};
jest.mock('@hooks/useBibleVersion', () => ({
  useBibleVersion: () => mockVersion,
}));
const mockToast = {
  show: jest.fn(),
  success: jest.fn(),
  error: jest.fn(),
  warning: jest.fn(),
  info: jest.fn(),
};
jest.mock('@context/ToastContext', () => ({useToast: () => mockToast}));

import PlanScreen from '../app/(tabs)/plan/[id]';
import TogetherJoinScreen from '../app/features/together/index';
import {TogetherProvider} from '@context/TogetherContext';
import {CustomPlansProvider} from '@context/CustomPlansContext';
import {ReadingPlanProgressProvider} from '@context/ReadingPlanProgressContext';
import {READING_PLANS, type ReadingPlanDay} from '@/constants/reading-plans';
import {
  effectivePlanDays,
  isReflowable,
  maxReflowDays,
} from '@/lib/reading/planReflow';

const tt = mockEs.together;
const PROGRESS_KEY = '@reading_plan_progress';
const PLAN = READING_PLANS.find(
  p => isReflowable(p) && maxReflowDays(p) >= p.duration * 2,
)!;
const CHOSEN = PLAN.duration * 2;

function Providers({children}: {children: React.ReactNode}) {
  return (
    <TogetherProvider>
      <CustomPlansProvider>
        <ReadingPlanProgressProvider>{children}</ReadingPlanProgressProvider>
      </CustomPlansProvider>
    </TogetherProvider>
  );
}

async function flush() {
  await act(async () => {
    await new Promise(r => setTimeout(r, 0));
    await new Promise(r => setTimeout(r, 0));
  });
}

const fmt = (days: ReadingPlanDay[]) =>
  days.map(d => d.readings.map(r => `${r.book} ${r.chapter}`).join(','));

/** The inviter: their plan screen → «Invitar» → «Compartir». */
async function inviteMessage(customDuration: number | null): Promise<string> {
  await AsyncStorage.clear();
  if (customDuration !== null) {
    await AsyncStorage.setItem(
      PROGRESS_KEY,
      JSON.stringify({
        [PLAN.id]: {completedDays: [], startedAt: '', customDuration},
      }),
    );
  }
  const shareSpy = jest
    .spyOn(Share, 'share')
    .mockResolvedValue({action: 'sharedAction'});
  mockParams.current = {id: PLAN.id};
  const r = render(
    <Providers>
      <PlanScreen />
    </Providers>,
  );
  await flush();
  await act(async () => {
    fireEvent.press(screen.getByLabelText(tt.shareTitle));
  });
  await act(async () => {
    fireEvent.press(screen.getByLabelText(tt.share));
  });
  const message: string = shareSpy.mock.calls[0][0].message ?? '';
  shareSpy.mockRestore();
  r.unmount();
  return message;
}

/** The joiner on a fresh device: paste → Continuar → Unirme; their days. */
async function joinWith(
  pasted: string,
  ownDuration: number | null = null,
): Promise<ReadingPlanDay[]> {
  await AsyncStorage.clear();
  if (ownDuration !== null) {
    await AsyncStorage.setItem(
      PROGRESS_KEY,
      JSON.stringify({
        [PLAN.id]: {
          completedDays: [],
          startedAt: '',
          customDuration: ownDuration,
        },
      }),
    );
  }
  mockParams.current = {};
  const r = render(
    <Providers>
      <TogetherJoinScreen />
    </Providers>,
  );
  await flush();
  fireEvent.changeText(
    screen.getByPlaceholderText(tt.pasteOrCodePlaceholder),
    pasted,
  );
  fireEvent.press(screen.getByLabelText(tt.continueLabel));
  await flush();
  await act(async () => {
    fireEvent.press(screen.getByLabelText(tt.join));
  });
  await flush();
  r.unmount();
  const progress = JSON.parse(
    (await AsyncStorage.getItem(PROGRESS_KEY)) ?? '{}',
  );
  expect(progress[PLAN.id]?.startedAt).toBeTruthy();
  return effectivePlanDays(PLAN, progress[PLAN.id]?.customDuration ?? null);
}

const codeOf = (msg: string) =>
  (msg.match(/EB1-[0-9A-Z]+-[0-9A-Z]+(?:-[0-9A-Z]+)?/) ?? [''])[0];

beforeEach(() => {
  jest.clearAllMocks();
});

describe('R9-512 — invitar a un plan curado con la duración elegida', () => {
  test('quien se une por el mensaje lee los mismos días que quien invita', async () => {
    const sender = effectivePlanDays(PLAN, CHOSEN);
    expect(sender).toHaveLength(CHOSEN);
    const msg = await inviteMessage(CHOSEN);
    const joiner = await joinWith(msg);
    expect(joiner).toHaveLength(CHOSEN);
    expect(fmt(joiner)).toEqual(fmt(sender));
  });

  test('y por el código solo, también', async () => {
    const msg = await inviteMessage(CHOSEN);
    const joiner = await joinWith(codeOf(msg));
    expect(fmt(joiner)).toEqual(fmt(effectivePlanDays(PLAN, CHOSEN)));
  });

  test('con la duración por defecto, quien tenía la suya pasa a la del grupo', async () => {
    const msg = await inviteMessage(null);
    expect(codeOf(msg).split('-')).toHaveLength(3);
    const joiner = await joinWith(msg, CHOSEN);
    expect(fmt(joiner)).toEqual(fmt(PLAN.days));
  });
});
