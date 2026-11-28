/**
 * R9-509 — renaming a plan made with «Número de días» rebuilt it with other
 * days: the editor pre-filled «Capítulos por día» = the longest day
 * (`inferPerDay`), and since the id comes from the content,
 * `migratePlanProgress` carried `completedDays` verbatim — «Juan en 10 días»
 * with days 1-5 done (John 1-10) became 7 days, and days 1-5 now covered
 * John 1-15: John 11-15 showed as read.
 *
 * The real builder screen in edit mode with the real custom-plans and
 * plan-progress providers over the AsyncStorage mock of jest.setup.
 */
import {render, screen, act, fireEvent} from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const mockEs = require('../src/i18n/translations').translations.es;

const mockParams: {editId?: string} = {};
const mockRouter = {
  replace: jest.fn(),
  back: jest.fn(),
  push: jest.fn(),
  dismissTo: jest.fn(),
};
jest.mock('expo-router', () => ({
  Stack: {Screen: () => null},
  useLocalSearchParams: () => mockParams,
  useRouter: () => mockRouter,
}));
jest.mock('@expo/vector-icons', () => ({Ionicons: () => null}));
const mockInsets = {top: 0, bottom: 0, left: 0, right: 0};
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => mockInsets,
}));
jest.mock('@lib/haptics', () => ({
  haptics: {tap: jest.fn(), press: jest.fn(), success: jest.fn()},
}));
const mockColors = new Proxy({}, {get: () => '#123456'});
const mockTheme = {isDark: false, colors: mockColors};
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

import PlanBuilderScreen from '../app/features/plan-builder/index';
import {CustomPlansProvider} from '@context/CustomPlansContext';
import {ReadingPlanProgressProvider} from '@context/ReadingPlanProgressContext';
import {makeCustomPlanBundle, type CustomReading} from '@lib/together';
import {buildCustomPlan} from '@/lib/reading/customPlanBuild';
import {customPlanFromBundle} from '@/lib/reading/customPlans';
import type {ReadingPlan} from '@/constants/reading-plans';

const tb = mockEs.planBuilder;

function Tree() {
  return (
    <CustomPlansProvider>
      <ReadingPlanProgressProvider>
        <PlanBuilderScreen />
      </ReadingPlanProgressProvider>
    </CustomPlansProvider>
  );
}

async function flush() {
  await act(async () => {
    await new Promise(r => setTimeout(r, 0));
    await new Promise(r => setTimeout(r, 0));
  });
}

const refs = (plan: ReadingPlan) =>
  plan.days.map(d => d.readings.map(r => `${r.book} ${r.chapter}`).join(','));

async function seed(plan: ReadingPlan) {
  await AsyncStorage.setItem('@custom_plans', JSON.stringify([plan]));
  await AsyncStorage.setItem(
    '@reading_plan_progress',
    JSON.stringify({
      [plan.id]: {
        completedDays: [1, 2, 3, 4, 5],
        startedAt: '2026-10-01T12:00:00.000Z',
      },
    }),
  );
  mockParams.editId = plan.id;
}

/** Open the editor, change only the name, save; return the saved plan. */
async function renameOnly(from: string, to: string): Promise<ReadingPlan> {
  render(<Tree />);
  await flush();
  fireEvent.changeText(await screen.findByDisplayValue(from), to);
  await act(async () => {
    fireEvent.press(screen.getByLabelText(tb.save));
  });
  await flush();
  const saved: ReadingPlan[] = JSON.parse(
    (await AsyncStorage.getItem('@custom_plans')) ?? '[]',
  );
  expect(saved).toHaveLength(1);
  return saved[0];
}

beforeEach(async () => {
  await AsyncStorage.clear();
  delete mockParams.editId;
  jest.clearAllMocks();
});

describe('R9-509 — cambiar solo el nombre conserva los días', () => {
  test('«Juan en 10 días» (Número de días): los mismos 10 días, el progreso en los mismos capítulos', async () => {
    const plan = customPlanFromBundle(
      buildCustomPlan(
        'Juan en 10 días',
        [{bookId: 43, fromChapter: 1, toChapter: 21}],
        {mode: 'totalDays', days: 10},
      ),
    )!;
    expect(plan.days).toHaveLength(10);
    await seed(plan);
    // The preview tells the days that will be saved.
    render(<Tree />);
    await flush();
    await screen.findByDisplayValue('Juan en 10 días');
    expect(
      screen.getByText(
        tb.preview.replace('{{days}}', '10').replace('{{chapters}}', '21'),
      ),
    ).toBeTruthy();
    screen.unmount();

    const saved = await renameOnly('Juan en 10 días', 'Juan con calma');
    expect(saved.name).toBe('Juan con calma');
    expect(refs(saved)).toEqual(refs(plan));
    const progress = JSON.parse(
      (await AsyncStorage.getItem('@reading_plan_progress')) ?? '{}',
    );
    expect(progress[saved.id].completedDays).toEqual([1, 2, 3, 4, 5]);
  });

  test('un reparto irregular (un plan importado) también se conserva', async () => {
    const days: CustomReading[][] = [
      [
        [43, 1],
        [43, 2],
        [43, 3],
      ],
      [[43, 4]],
      [
        [43, 5],
        [43, 6],
      ],
      [[43, 7]],
      [[43, 8]],
      [
        [43, 9],
        [43, 10],
        [43, 11],
      ],
    ];
    const plan = customPlanFromBundle(makeCustomPlanBundle('Importado', days))!;
    await seed(plan);
    const saved = await renameOnly('Importado', 'Importado II');
    expect(refs(saved)).toEqual(refs(plan));
  });

  test('control: un plan hecho «por día» conserva días y reparto', async () => {
    const plan = customPlanFromBundle(
      buildCustomPlan(
        'Juan a 2',
        [{bookId: 43, fromChapter: 1, toChapter: 21}],
        {mode: 'perDay', chaptersPerDay: 2},
      ),
    )!;
    await seed(plan);
    const saved = await renameOnly('Juan a 2', 'Juan a dos');
    expect(refs(saved)).toEqual(refs(plan));
  });

  test('control: cambiar el ritmo sí rearma el plan', async () => {
    const plan = customPlanFromBundle(
      buildCustomPlan(
        'Juan en 10 días',
        [{bookId: 43, fromChapter: 1, toChapter: 21}],
        {mode: 'totalDays', days: 10},
      ),
    )!;
    await seed(plan);
    render(<Tree />);
    await flush();
    await screen.findByDisplayValue('Juan en 10 días');
    const field = screen.getByLabelText(tb.paceTotalDays);
    fireEvent.changeText(field, '3');
    await act(async () => {
      fireEvent(field, 'blur');
    });
    await act(async () => {
      fireEvent.press(screen.getByLabelText(tb.save));
    });
    await flush();
    const [saved]: ReadingPlan[] = JSON.parse(
      (await AsyncStorage.getItem('@custom_plans')) ?? '[]',
    );
    expect(saved.days).toHaveLength(3);
  });
});
