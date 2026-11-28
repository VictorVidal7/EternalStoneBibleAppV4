/**
 * R9-506 — the share messages end, after the link, with «¿No te abre el
 * enlace? Copia este mensaje y pégalo en Ajustes → Unirme a un grupo». Pasting
 * that whole message on the real Together screen gave «Ese código no es
 * válido»: `decodeJoinInput` took everything after `#d=` (the trailing text
 * included) as the payload, and with the marker found never tried the
 * `EB1-…` code quoted in the same text. The clipboard hint used the same
 * function and never showed up.
 *
 * The real screen, with the real Together / custom plans / plan progress
 * providers over the AsyncStorage mock of jest.setup.
 */
import {render, screen, act, fireEvent} from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const mockEs: any = require('../src/i18n/translations').translations.es;
const mockEn: any = require('../src/i18n/translations').translations.en;

const mockParams: {current: any} = {current: {}};
const mockRouter = {replace: jest.fn(), back: jest.fn(), push: jest.fn()};
jest.mock('expo-router', () => ({
  Stack: {Screen: () => null},
  useLocalSearchParams: () => mockParams.current,
  useRouter: () => mockRouter,
  useNavigation: () => mockNavigation,
}));
const mockNavigation = {getState: () => undefined};
jest.mock('@expo/vector-icons', () => ({Ionicons: () => null}));
const mockInsets = {top: 0, bottom: 0, left: 0, right: 0};
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => mockInsets,
}));
const mockClip: {value: string} = {value: ''};
jest.mock('expo-clipboard', () => ({
  getStringAsync: jest.fn(async () => mockClip.value),
  setStringAsync: jest.fn(async () => true),
}));
jest.mock('@lib/haptics', () => ({
  haptics: {tap: jest.fn(), press: jest.fn(), success: jest.fn()},
}));
jest.mock('@components/FeatureGuideModal', () => ({
  FeatureGuideModal: () => null,
}));
const mockColors = new Proxy({}, {get: () => '#123456'});
const mockTheme = {isDark: false, colors: mockColors};
jest.mock('@hooks/useTheme', () => ({useTheme: () => mockTheme}));
const mockLang: any = {language: 'es', setLanguage: jest.fn(), t: mockEs};
jest.mock('@hooks/useLanguage', () => ({useLanguage: () => mockLang}));
const mockToast = {
  show: jest.fn(),
  success: jest.fn(),
  error: jest.fn(),
  warning: jest.fn(),
  info: jest.fn(),
};
jest.mock('@context/ToastContext', () => ({useToast: () => mockToast}));

import TogetherJoinScreen from '../app/features/together/index';
import {TogetherProvider} from '@context/TogetherContext';
import {CustomPlansProvider} from '@context/CustomPlansContext';
import {ReadingPlanProgressProvider} from '@context/ReadingPlanProgressContext';
import {customPlanFromBundle} from '@/lib/reading/customPlans';
import {
  encodeHttpsLink,
  encodePlanCode,
  makeCustomPlanBundle,
  makePlanBundle,
  makeStudyBundle,
} from '@lib/together';
import {READING_PLANS} from '@/constants/reading-plans';

const CUSTOM_BUNDLE = makeCustomPlanBundle('Mateo en tres días', [
  [[40, 1]],
  [[40, 2]],
  [[40, 3]],
]);
const CUSTOM = customPlanFromBundle(CUSTOM_BUNDLE)!;

function Tree() {
  return (
    <TogetherProvider>
      <CustomPlansProvider>
        <ReadingPlanProgressProvider>
          <TogetherJoinScreen />
        </ReadingPlanProgressProvider>
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

async function pasteAndContinue(T: any, text: string) {
  render(<Tree />);
  await flush();
  fireEvent.changeText(
    screen.getByPlaceholderText(T.together.pasteOrCodePlaceholder),
    text,
  );
  fireEvent.press(screen.getByLabelText(T.together.continueLabel));
  await flush();
}

function customMessage(T: any): string {
  return T.together.shareCustomMessage
    .replace('{{plan}}', CUSTOM.name)
    .replace('{{link}}', encodeHttpsLink(CUSTOM_BUNDLE));
}

beforeEach(async () => {
  await AsyncStorage.clear();
  mockParams.current = {};
  mockClip.value = '';
  mockLang.t = mockEs;
  mockLang.language = 'es';
  jest.clearAllMocks();
});

describe('R9-506 — pegar el mensaje compartido entero', () => {
  test.each([
    ['es', mockEs],
    ['en', mockEn],
  ])(
    'el mensaje del plan propio (%s) abre la confirmación',
    async (lang, T) => {
      mockLang.t = T;
      mockLang.language = lang;
      const msg = customMessage(T);
      // Precondition: the message carries text AFTER the link.
      const link = encodeHttpsLink(CUSTOM_BUNDLE);
      expect(msg.slice(msg.indexOf(link) + link.length).trim()).not.toBe('');
      await pasteAndContinue(T, msg);
      expect(screen.queryByText(T.together.codeInvalid)).toBeNull();
      expect(screen.getByText(CUSTOM.name)).toBeTruthy();
      expect(screen.getAllByText(T.together.importPlan).length).toBeGreaterThan(
        0,
      );
    },
  );

  test.each([
    ['es', mockEs],
    ['en', mockEn],
  ])(
    'la invitación curada entera (%s) se une con el grupo del enlace',
    async (lang, T) => {
      mockLang.t = T;
      mockLang.language = lang;
      const planId = READING_PLANS[0].id;
      const bundle = makePlanBundle(planId, '2026-11-09', 'Familia Pérez');
      const msg = T.together.inviteMessage
        .replace('{{plan}}', 'X')
        .replace('{{date}}', 'lunes')
        .replace('{{link}}', encodeHttpsLink(bundle))
        .replace('{{code}}', encodePlanCode(planId, '2026-11-09') ?? '');
      await pasteAndContinue(T, msg);
      expect(screen.queryByText(T.together.codeInvalid)).toBeNull();
      expect(screen.getAllByText(T.together.join).length).toBeGreaterThan(0);
      // The group name only travels in the link: the link was decoded, not
      // the code.
      expect(
        screen.getByText(
          T.together.withGroup.replace('{{group}}', 'Familia Pérez'),
        ),
      ).toBeTruthy();
    },
  );

  test('un enlace que no decodifica cae al código EB1 del mismo mensaje', async () => {
    const planId = READING_PLANS[0].id;
    const msg = mockEs.together.inviteMessage
      .replace('{{plan}}', 'X')
      .replace('{{date}}', 'lunes')
      .replace('{{link}}', 'https://eternalstonebible.github.io/o/#d=roto')
      .replace('{{code}}', encodePlanCode(planId, '2026-11-09') ?? '');
    await pasteAndContinue(mockEs, msg);
    expect(screen.queryByText(mockEs.together.codeInvalid)).toBeNull();
    expect(screen.getAllByText(mockEs.together.join).length).toBeGreaterThan(0);
  });

  test('el mensaje del estudio entero abre su landing', async () => {
    const study = makeStudyBundle(
      {bookId: 19, chapter: 23, startVerse: 1, endVerse: 2},
      'Salmo 23',
      {observation: 'obs'},
    );
    const msg = mockEs.together.shareStudyMessage
      .replace('{{passage}}', 'Salmos 23')
      .replace('{{link}}', encodeHttpsLink(study));
    await pasteAndContinue(mockEs, msg);
    expect(screen.queryByText(mockEs.together.codeInvalid)).toBeNull();
    expect(mockRouter.replace).toHaveBeenCalledWith(
      expect.stringContaining('/features/study-shared?d='),
    );
  });

  test('el aviso del portapapeles aparece con el mensaje entero', async () => {
    mockClip.value = customMessage(mockEs);
    render(<Tree />);
    await flush();
    const hint = screen.getByLabelText(mockEs.together.pasteDetected);
    fireEvent.press(hint);
    await flush();
    expect(screen.getByText(CUSTOM.name)).toBeTruthy();
  });

  test('control: solo el enlace y solo el código siguen funcionando', async () => {
    await pasteAndContinue(mockEs, encodeHttpsLink(CUSTOM_BUNDLE));
    expect(screen.getByText(CUSTOM.name)).toBeTruthy();
    screen.unmount();
    const code = encodePlanCode(READING_PLANS[0].id, '2026-11-09') ?? '';
    await pasteAndContinue(mockEs, code.toLowerCase());
    expect(screen.getAllByText(mockEs.together.join).length).toBeGreaterThan(0);
  });
});
