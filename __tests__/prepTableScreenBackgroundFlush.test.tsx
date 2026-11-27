/**
 * R9-58 — the Mesa's typing autosave is a 700 ms debounce. When the app went
 * to the background, the timer stopped (measured on the emulator, S137), and
 * an OS that killed the process there (swipe-away, low memory) never ran the
 * unmount flush either: what was typed since the last pause was lost. The
 * screen now pushes the pending save as soon as the app leaves the
 * foreground.
 *
 * The real Mesa and the real stateful AsyncStorage mock from jest.setup.js;
 * the debounce is stretched to 60 s so only the AppState flush can explain a
 * write. The process dying itself is not reproducible in jest: what is
 * measured is that the save reaches storage on the 'background' event, before
 * the timer would have fired.
 */
import {AppState} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {act, fireEvent, render, waitFor} from '@testing-library/react-native';
import PrepTableScreen from '../app/features/prep/index';
import {PremiumProvider} from '../src/context/PremiumContext';
import {getPrepNotes} from '../src/features/study/prepNotesStore';
import {translations} from '../src/i18n/translations';

const mockRouter = {push: jest.fn(), back: jest.fn()};
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
    useFocusEffect: (cb: () => void) => ReactActual.useEffect(cb, [cb]),
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
// Only the wait changes: the AppState flush is the one thing that can put the
// typed text in storage within the test.
jest.mock('use-debounce', () => {
  const actual = jest.requireActual('use-debounce');
  return {
    ...actual,
    useDebouncedCallback: (fn: unknown, _wait: number, options?: unknown) =>
      actual.useDebouncedCallback(fn, 60_000, options),
  };
});
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
const mockTheme = {
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
jest.mock('@hooks/useTheme', () => ({useTheme: () => mockTheme}));
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
const KEY = 'John/3/16';

type ChangeHandler = (state: string) => void;
let changeHandlers: ChangeHandler[] = [];

function renderScreen() {
  return render(
    <PremiumProvider>
      <PrepTableScreen />
    </PremiumProvider>,
  );
}

describe('Mesa — the pending autosave reaches storage when the app leaves the foreground (R9-58)', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    changeHandlers = [];
    // Capture every 'change' listener; `remove` drops it, like the real one.
    jest
      .spyOn(AppState, 'addEventListener')
      .mockImplementation((type: string, handler: unknown) => {
        const h = handler as ChangeHandler;
        if (type === 'change') changeHandlers.push(h);
        return {
          remove: () => {
            changeHandlers = changeHandlers.filter(x => x !== h);
          },
        } as ReturnType<typeof AppState.addEventListener>;
      });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it.each(['background', 'inactive'])(
    'flushes what was just typed on %s',
    async state => {
      const screen = renderScreen();
      await screen.findByText('Juan 3:16');
      await act(async () => {
        fireEvent.changeText(
          screen.getByLabelText(p.sections.bigIdea.label),
          'Recién escrito',
        );
      });
      // Control: the (stretched) debounce has not written it.
      expect((await getPrepNotes(KEY)).sections.bigIdea).toBeUndefined();
      expect(changeHandlers.length).toBeGreaterThan(0);

      await act(async () => {
        changeHandlers.forEach(h => h(state));
      });

      await waitFor(async () =>
        expect((await getPrepNotes(KEY)).sections.bigIdea).toBe(
          'Recién escrito',
        ),
      );
    },
  );

  it('does not flush on the way back to the foreground (control)', async () => {
    const screen = renderScreen();
    await screen.findByText('Juan 3:16');
    await act(async () => {
      fireEvent.changeText(
        screen.getByLabelText(p.sections.bigIdea.label),
        'Recién escrito',
      );
    });
    await act(async () => {
      changeHandlers.forEach(h => h('active'));
    });
    await act(async () => {
      for (let i = 0; i < 20; i++) await Promise.resolve();
    });
    expect((await getPrepNotes(KEY)).sections.bigIdea).toBeUndefined();
  });

  it('removes its listener on unmount', async () => {
    const screen = renderScreen();
    await screen.findByText('Juan 3:16');
    const before = changeHandlers.length;
    expect(before).toBeGreaterThan(0);
    screen.unmount();
    expect(changeHandlers.length).toBeLessThan(before);
  });
});
