/**
 * R9-473 — the Mesa uses ONE useDebouncedCallback for every section, and
 * use-debounce keeps only the LAST arguments: a change in section B (its
 * format toolbar does not blur A, keyboardShouldPersistTaps="handled")
 * replaced A's pending save, and the unmount flush() pushed B alone. Path:
 * type in «Idea central», tap the bullet list of «Aplicación», back (closes
 * the keyboard without blur), back (unmounts). The harness of
 * prepTableScreenPassageKeying.test.tsx (stateful AsyncStorage mock, the real
 * PremiumProvider) and the real 700 ms debounce. From the S126 probe.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import {act, fireEvent, render} from '@testing-library/react-native';
import PrepTableScreen from '../app/features/prep/index';
import {PremiumProvider} from '../src/context/PremiumContext';
import {getPrepNotes} from '../src/features/study/prepNotesStore';
import {getPrepTemplateSections} from '../src/features/study/prepTable';
import {translations} from '../src/i18n/translations';
import {emitBackupRestored} from '../src/lib/backup/restoreSignal';

const mockRouter = {push: jest.fn(), back: jest.fn(), setParams: jest.fn()};

jest.mock('expo-router', () => {
  const ReactActual = require('react');
  return {
    useRouter: () => mockRouter,
    useLocalSearchParams: () => ({
      book: 'John',
      chapter: '3',
      startVerse: '16',
      version: 'RVR1960',
    }),
    useFocusEffect: (cb: () => void) => {
      ReactActual.useEffect(cb, [cb]);
    },
    Stack: {Screen: () => null},
  };
});
jest.mock('@expo/vector-icons', () => ({
  Ionicons: () => null,
  MaterialCommunityIcons: () => null,
}));
jest.mock('expo-linear-gradient', () => {
  const {View} = require('react-native');
  return {LinearGradient: View};
});
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({top: 0, bottom: 0, left: 0, right: 0}),
}));
jest.mock('@components/hints/ContextualHintBanner', () => ({
  ContextualHintBanner: () => null,
}));
jest.mock('@lib/haptics', () => ({
  haptics: {tap: jest.fn(), success: jest.fn()},
}));
const mockToast = {
  success: jest.fn(),
  error: jest.fn(),
  warning: jest.fn(),
  info: jest.fn(),
  show: jest.fn(),
};
jest.mock('@context/ToastContext', () => ({useToast: () => mockToast}));
jest.mock('expo-clipboard', () => ({
  setStringAsync: jest.fn(async () => true),
}));
jest.mock('expo-print', () => ({
  printToFileAsync: jest.fn(async () => ({uri: 'file://mock-prep.pdf'})),
}));
jest.mock('expo-sharing', () => ({
  isAvailableAsync: jest.fn(async () => true),
  shareAsync: jest.fn(async () => undefined),
}));
const mockColors = {
  colors: {
    background: '#000000',
    card: '#111111',
    border: '#222222',
    primary: '#6366f1',
    primaryDark: '#4338ca',
    text: '#ffffff',
    textSecondary: '#cccccc',
    textTertiary: '#999999',
  },
};
jest.mock('@hooks/useTheme', () => ({useTheme: () => mockColors}));
const mockLang = {
  language: 'es',
  t: require('../src/i18n/translations').translations.es,
};
jest.mock('@hooks/useLanguage', () => ({useLanguage: () => mockLang}));
const mockVersion = {
  selectedVersion: {id: 'RVR1960', language: 'es', abbreviation: 'RVR1960'},
};
jest.mock('@hooks/useBibleVersion', () => ({
  useBibleVersion: () => mockVersion,
}));
const mockSheet = {open: jest.fn()};
jest.mock('@context/OfferingSheetContext', () => ({
  useOfferingSheet: () => mockSheet,
}));
jest.mock('@lib/database/originals-download-service', () => ({
  downloadAndImportOriginals: jest.fn(),
  importLocalOriginalsIfPresent: jest.fn(async () => false),
  isOriginalsUpdateAvailable: jest.fn(async () => false),
}));
jest.mock('@lib/database', () => ({
  __esModule: true,
  default: {
    getVerse: jest.fn(async (_b: number, _c: number, v: number) => ({
      text: `Texto del versiculo ${v}`,
    })),
    getChapterVerseCount: jest.fn(async () => 36),
    originalsInstalled: jest.fn(async () => false),
  },
}));
jest.mock('@lib/comparison/VersionComparison', () => ({
  versionComparisonService: {
    getAvailableVersions: jest.fn(async () => []),
    compareVerseRange: jest.fn(async () => []),
  },
}));

const p = translations.es.prepTable;
const m = translations.es.markdownToolbar;
const KEY = 'John/3/16';
const SECTIONS = getPrepTemplateSections('expository');
const A = 'bigIdea' as const;
const B = 'application' as const;
const wait = (ms: number) => new Promise(r => setTimeout(r, ms));

function renderScreen() {
  return render(
    <PremiumProvider>
      <PrepTableScreen />
    </PremiumProvider>,
  );
}

async function typeAThenFormatB(opts: {
  pausaAntes: number;
  blurA: boolean;
  restoreBeforeB?: boolean;
}) {
  const screen = renderScreen();
  await screen.findByText('Juan 3:16');
  const inputA = screen.getByLabelText(p.sections[A].label);
  await act(async () => {
    fireEvent.changeText(inputA, 'Dios amó al mundo y dio a su Hijo');
  });
  if (opts.pausaAntes > 0) {
    await act(async () => {
      await wait(opts.pausaAntes);
    });
  }
  if (opts.blurA) {
    await act(async () => {
      fireEvent(inputA, 'blur');
    });
  }
  if (opts.restoreBeforeB) {
    await act(async () => {
      emitBackupRestored();
      await wait(20);
    });
  }
  // La barra de formato de B: el botón de lista de la sección B (una barra por sección, en el
  // orden de la plantilla).
  const idxB = SECTIONS.indexOf(B);
  const listButtons = screen.getAllByLabelText(m.bulletList);
  await act(async () => {
    fireEvent.press(listButtons[idxB]);
  });
  // Atrás (cierra el teclado, sin blur) y atrás (desmonta): el flush del desmontaje.
  screen.unmount();
  await act(async () => {
    await wait(50);
  });
  return getPrepNotes(KEY);
}

describe('R9-473 — one debounce for every Mesa section', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    // La barra pone el cursor con `inputRef.current.setSelection` en un requestAnimationFrame
    // (`MarkdownFormatToolbar.tsx:125-130`); el TextInput del test renderer no tiene ese método.
    // Solo mueve el cursor: no toca lo que se guarda. Se apaga el rAF para que no lance.
    jest
      .spyOn(global, 'requestAnimationFrame')
      .mockImplementation(() => 0 as unknown as number);
  });
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('typing in A, formatting B and leaving without blur keeps both', async () => {
    const saved = await typeAThenFormatB({pausaAntes: 0, blurA: false});
    expect(saved.sections[B]).toBe('- ');
    expect(saved.sections[A]).toBe('Dios amó al mundo y dio a su Hijo');
  });

  it('a restore between A and B drops A (R9-602), it is not flushed by B', async () => {
    const saved = await typeAThenFormatB({
      pausaAntes: 0,
      blurA: false,
      restoreBeforeB: true,
    });
    expect(saved.sections[A]).toBeUndefined();
  });

  it('CONTROL: con una pausa de 900 ms antes de tocar B, A queda guardada', async () => {
    const saved = await typeAThenFormatB({pausaAntes: 900, blurA: false});
    expect(saved.sections[A]).toBe('Dios amó al mundo y dio a su Hijo');
  });

  it('CONTROL: con blur de A antes de tocar B, A queda guardada', async () => {
    const saved = await typeAThenFormatB({pausaAntes: 0, blurA: true});
    expect(saved.sections[A]).toBe('Dios amó al mundo y dio a su Hijo');
  });
});
