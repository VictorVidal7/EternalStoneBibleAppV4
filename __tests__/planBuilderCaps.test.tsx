/**
 * R9-508 — the builder's preview counted without the bundle caps, while
 * «Crear» went through `makeCustomPlanBundle`, which cuts a plan to
 * MAX_PLAN_DAYS (400) days and MAX_DAY_READINGS (50) chapters per day: the
 * preview promised one plan and another was saved, with «¡Plan creado!».
 * («Pentateuco en 3 días»: 187 chapters promised, 150 saved, and day 2
 * started at Exodus 13.)
 *
 * The real builder screen with the real custom-plans and plan-progress
 * providers over the AsyncStorage mock of jest.setup.
 */
import {render, screen, act, fireEvent} from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const mockEs = require('../src/i18n/translations').translations.es;

const mockRouter = {
  replace: jest.fn(),
  back: jest.fn(),
  push: jest.fn(),
  dismissTo: jest.fn(),
};
jest.mock('expo-router', () => ({
  Stack: {Screen: () => null},
  useLocalSearchParams: () => ({}),
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
import {getBookById} from '@/constants/bible';

const tb = mockEs.planBuilder;
const TOO_LONG = tb.tooLong
  .replace('{{days}}', '400')
  .replace('{{perDay}}', '50')
  .replace('{{total}}', '1500');

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

/** Add a whole book through the real picker. */
async function addBook(bookId: number) {
  await act(async () => {
    fireEvent.press(screen.getAllByLabelText(tb.addPassage)[0]);
  });
  await act(async () => {
    fireEvent.press(screen.getByText(getBookById(bookId)!.name));
  });
  const confirm = screen.getAllByLabelText(tb.addThisPassage);
  await act(async () => {
    fireEvent.press(confirm[confirm.length - 1]);
  });
}

/** Choose «Número de días» and type a value into its field (with blur). */
async function setTotalDays(n: number) {
  await act(async () => {
    fireEvent.press(screen.getByText(tb.paceTotalDays));
  });
  const field = screen.getByLabelText(tb.paceTotalDays);
  fireEvent.changeText(field, String(n));
  await act(async () => {
    fireEvent(field, 'blur');
  });
}

async function savedPlans(): Promise<
  {days: {readings: unknown[]}[]; name: string}[]
> {
  return JSON.parse((await AsyncStorage.getItem('@custom_plans')) ?? '[]');
}

beforeEach(async () => {
  await AsyncStorage.clear();
  jest.clearAllMocks();
});

describe('R9-508 — la vista previa promete el plan que se guarda', () => {
  test('«Pentateuco en 3 días» (63 por día): no se guarda recortado, y se dice por qué', async () => {
    render(<Tree />);
    await flush();
    fireEvent.changeText(
      screen.getByPlaceholderText(tb.namePlaceholder),
      'Pentateuco en 3 días',
    );
    for (const id of [1, 2, 3, 4, 5]) await addBook(id);
    await setTotalDays(3);
    await act(async () => {
      fireEvent.press(screen.getByLabelText(tb.create));
    });
    await flush();
    // Without the fix: a 150-chapter plan was saved (187 promised).
    expect(await savedPlans()).toEqual([]);
    expect(screen.getByText(TOO_LONG)).toBeTruthy();
  });

  test('más de 400 días a 1 capítulo por día: no se guarda recortado', async () => {
    render(<Tree />);
    await flush();
    fireEvent.changeText(
      screen.getByPlaceholderText(tb.namePlaceholder),
      'Dos vueltas',
    );
    // The first ten books twice: 582 chapters, 582 days at 1 per day.
    for (const id of [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]) await addBook(id);
    for (const id of [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]) await addBook(id);
    const field = screen.getByLabelText(tb.pacePerDay);
    fireEvent.changeText(field, '1');
    await act(async () => {
      fireEvent(field, 'blur');
    });
    await act(async () => {
      fireEvent.press(screen.getByLabelText(tb.create));
    });
    await flush();
    expect(await savedPlans()).toEqual([]);
    expect(screen.getByText(TOO_LONG)).toBeTruthy();
  });

  test('control: el Pentateuco en 7 días se guarda entero, igual a la vista previa', async () => {
    render(<Tree />);
    await flush();
    fireEvent.changeText(
      screen.getByPlaceholderText(tb.namePlaceholder),
      'Pentateuco en 7 días',
    );
    for (const id of [1, 2, 3, 4, 5]) await addBook(id);
    await setTotalDays(7);
    expect(
      screen.getByText(
        tb.preview.replace('{{days}}', '7').replace('{{chapters}}', '187'),
      ),
    ).toBeTruthy();
    expect(screen.queryByText(TOO_LONG)).toBeNull();
    await act(async () => {
      fireEvent.press(screen.getByLabelText(tb.create));
    });
    await flush();
    const [plan] = await savedPlans();
    expect(plan.days).toHaveLength(7);
    expect(plan.days.reduce((s, d) => s + d.readings.length, 0)).toBe(187);
  });
});
