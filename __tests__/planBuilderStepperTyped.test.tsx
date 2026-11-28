/**
 * R9-510 — a number typed in a stepper field applied only on blur/submit, and
 * the screen keeps taps from blurring (`keyboardShouldPersistTaps="handled"`;
 * iOS's number-pad has no return key): «Número de días» → 25 → «Crear y
 * empezar» saved 7 days; «Hasta el capítulo» 3 → «Añadir pasaje» added
 * Génesis 1-50. (That a real tap doesn't blur is device-only, Modo C; here
 * the button is pressed without a blur event, which is what that means.)
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

const tb = mockEs.planBuilder;
const DASH = String.fromCharCode(0x2013);

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

async function openGenesisPicker() {
  await act(async () => {
    fireEvent.press(screen.getAllByLabelText(tb.addPassage)[0]);
  });
  await act(async () => {
    fireEvent.press(screen.getByText('Génesis'));
  });
}

async function confirmPicker() {
  const confirm = screen.getAllByLabelText(tb.addThisPassage);
  await act(async () => {
    fireEvent.press(confirm[confirm.length - 1]);
  });
}

/** A named plan with Génesis 1-50, in «Número de días». */
async function genesisInTotalDays() {
  render(<Tree />);
  await flush();
  fireEvent.changeText(
    screen.getByPlaceholderText(tb.namePlaceholder),
    'Génesis',
  );
  await openGenesisPicker();
  await confirmPicker();
  await act(async () => {
    fireEvent.press(screen.getByText(tb.paceTotalDays));
  });
}

async function savedDays(): Promise<number> {
  const [plan] = JSON.parse(
    (await AsyncStorage.getItem('@custom_plans')) ?? '[]',
  );
  return plan?.days.length ?? 0;
}

const previewFor = (days: number) =>
  tb.preview.replace('{{days}}', String(days)).replace('{{chapters}}', '50');

beforeEach(async () => {
  await AsyncStorage.clear();
  jest.clearAllMocks();
});

describe('R9-510 — el número escrito en un stepper sin salir del campo', () => {
  test('«Número de días» 25 y «Crear» sin desenfocar: la vista previa y el plan, 25 días', async () => {
    await genesisInTotalDays();
    fireEvent.changeText(screen.getByLabelText(tb.paceTotalDays), '25');
    expect(screen.getByText(previewFor(25))).toBeTruthy();
    await act(async () => {
      fireEvent.press(screen.getByLabelText(tb.create));
    });
    await flush();
    expect(await savedDays()).toBe(25);
  });

  test('«Hasta el capítulo» 3 y «Añadir pasaje» sin desenfocar: Génesis 1-3', async () => {
    render(<Tree />);
    await flush();
    await openGenesisPicker();
    fireEvent.changeText(screen.getByLabelText(tb.toChapter), '3');
    await confirmPicker();
    expect(screen.getByText(`Génesis 1${DASH}3`)).toBeTruthy();
  });

  test('escribir 25 y después «+1»: el campo y el valor quedan en 26, también tras salir', async () => {
    await genesisInTotalDays();
    const field = screen.getByLabelText(tb.paceTotalDays);
    fireEvent.changeText(field, '25');
    await act(async () => {
      fireEvent.press(screen.getByLabelText('+1'));
    });
    expect(screen.getByLabelText(tb.paceTotalDays).props.value).toBe('26');
    await act(async () => {
      fireEvent(screen.getByLabelText(tb.paceTotalDays), 'blur');
    });
    expect(screen.getByText(previewFor(26))).toBeTruthy();
  });

  test('control: con blur, 25 días; y un valor bajo el mínimo espera al blur', async () => {
    await genesisInTotalDays();
    const field = screen.getByLabelText(tb.paceTotalDays);
    fireEvent.changeText(field, '0');
    expect(screen.getByText(previewFor(7))).toBeTruthy();
    fireEvent.changeText(field, '25');
    await act(async () => {
      fireEvent(field, 'blur');
    });
    await act(async () => {
      fireEvent.press(screen.getByLabelText(tb.create));
    });
    await flush();
    expect(await savedDays()).toBe(25);
  });
});
