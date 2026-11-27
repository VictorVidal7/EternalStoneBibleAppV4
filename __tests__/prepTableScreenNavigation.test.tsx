/**
 * The Mesa's two buttons that leave it — «Banco de ilustraciones» (insert
 * mode) and «Modo púlpito» — measured with `renderRouter`: the real Mesa, the
 * real expo-router stack, the real prep notes store over the stateful
 * AsyncStorage mock from jest.setup.js. The two destinations are stubs; the
 * bank's stub inserts the way the real one does (strict read of the notes,
 * append to `application`, save, `router.back()`).
 *
 * - R9-167 — back from the bank, the drafts still hold `application` from
 *   BEFORE the insertion until the focus re-read lands; a flush in that window
 *   wrote the old text over the illustration.
 */
import {Text, TouchableOpacity} from 'react-native';
import {Stack, useLocalSearchParams, useRouter} from 'expo-router';
import {
  renderRouter,
  act,
  fireEvent,
  screen,
  waitFor,
} from 'expo-router/testing-library';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import PrepTableScreen from '../app/features/prep/index';
import {PremiumProvider} from '../src/context/PremiumContext';
import * as prepNotesStore from '../src/features/study/prepNotesStore';
import {getPrepNotes, savePrepNote} from '../src/features/study/prepNotesStore';
import {ENTITLEMENT_CACHE_KEY} from '../src/lib/offering/entitlementCache';
import {translations} from '../src/i18n/translations';

jest.mock('react-native-safe-area-context', () => {
  const actual = jest.requireActual('react-native-safe-area-context');
  return {
    ...actual,
    useSafeAreaInsets: () => ({top: 0, bottom: 0, left: 0, right: 0}),
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
const BANK_LABEL = translations.es.prepIllustrations.entryLabel;
const PULPIT_LABEL = p.pulpitEnterButton;
const ILLUSTRATION = 'El faro en la tormenta';
const HANDWRITTEN = 'Mi aplicación escrita a mano';

// The bank in insert mode, reduced to what `handleInsert` does with the notes.
function BankStub() {
  const router = useRouter();
  const {insertPassageKey} = useLocalSearchParams<{
    insertPassageKey: string;
  }>();
  return (
    <TouchableOpacity
      accessibilityLabel="insertar-ilustracion"
      onPress={async () => {
        const existing = await getPrepNotes(insertPassageKey, {strict: true});
        const current = existing.sections.application ?? '';
        const next = current ? `${current}\n\n${ILLUSTRATION}` : ILLUSTRATION;
        await savePrepNote(insertPassageKey, 'application', next);
        router.back();
      }}>
      <Text>banco</Text>
    </TouchableOpacity>
  );
}

function routes() {
  return {
    _layout: () => (
      <PremiumProvider>
        <Stack screenOptions={{headerShown: false}} />
      </PremiumProvider>
    ),
    index: () => <Text>inicio</Text>,
    'features/prep/index': PrepTableScreen,
    'features/prep/illustrations/index': BankStub,
    'features/prep/pulpit': () => <Text>pulpito</Text>,
  };
}

const MESA_URL = '/features/prep?book=John&chapter=3&startVerse=16';

async function drain() {
  await act(async () => {
    for (let i = 0; i < 30; i++) await Promise.resolve();
  });
}

async function pressLast(label: string) {
  const els = await screen.findAllByLabelText(label);
  await act(async () => {
    fireEvent.press(els[els.length - 1]);
  });
}

async function mountMesa() {
  renderRouter(routes(), {initialUrl: MESA_URL});
  await screen.findByText('Juan 3:16');
  await screen.findByLabelText(PULPIT_LABEL);
}

beforeEach(async () => {
  await AsyncStorage.clear();
  await SecureStore.setItemAsync(ENTITLEMENT_CACHE_KEY, 'true');
});

afterEach(async () => {
  jest.restoreAllMocks();
  await SecureStore.deleteItemAsync(ENTITLEMENT_CACHE_KEY);
});

describe('R9-167 — a flush right after the bank does not erase the illustration', () => {
  /**
   * Type in `application`, open the bank (its flush saves the text), insert,
   * come back, and tap «Modo púlpito» while the focus re-read of the notes is
   * HELD: the window where the drafts still hold the text from before.
   */
  async function insertThenTapPulpitBeforeReread() {
    await mountMesa();
    await act(async () => {
      fireEvent.changeText(
        screen.getByLabelText(p.sections.application.label),
        HANDWRITTEN,
      );
    });
    await pressLast(BANK_LABEL);
    await screen.findByText('banco');
    expect((await getPrepNotes(KEY)).sections.application).toBe(HANDWRITTEN);

    // From here on, the Mesa's re-read of this passage waits.
    const realGet = prepNotesStore.getPrepNotes;
    let release!: () => void;
    const held = new Promise<void>(r => {
      release = r;
    });
    const getSpy = jest
      .spyOn(prepNotesStore, 'getPrepNotes')
      .mockImplementation(async (key, options) => {
        const result = await realGet(key, options);
        // The bank's own read goes through: only the Mesa's is held.
        if (getSpy.mock.calls.length > 1) await held;
        return result;
      });

    await pressLast('insertar-ilustracion');
    await screen.findByText('Juan 3:16');
    await drain();
    // Control: the re-read was asked for and is held; the field still shows
    // the text from before the insertion.
    expect(getSpy.mock.calls.length).toBeGreaterThan(1);
    expect(
      screen.getByLabelText(p.sections.application.label).props.value,
    ).toBe(HANDWRITTEN);
    expect((await realGet(KEY)).sections.application).toBe(
      `${HANDWRITTEN}\n\n${ILLUSTRATION}`,
    );

    await pressLast(PULPIT_LABEL);
    await screen.findByText('pulpito');
    return {release, realGet};
  }

  it('the illustration survives the pulpit flush', async () => {
    const {release, realGet} = await insertThenTapPulpitBeforeReread();
    // Pre-fix: the flush wrote HANDWRITTEN alone over it.
    expect((await realGet(KEY)).sections.application).toBe(
      `${HANDWRITTEN}\n\n${ILLUSTRATION}`,
    );
    await act(async () => {
      release();
    });
  });

  it('control: a section edited AFTER coming back is still flushed', async () => {
    await mountMesa();
    await pressLast(BANK_LABEL);
    await screen.findByText('banco');
    await pressLast('insertar-ilustracion');
    await screen.findByText('Juan 3:16');
    await waitFor(() =>
      expect(
        screen.getByLabelText(p.sections.application.label).props.value,
      ).toBe(ILLUSTRATION),
    );
    await act(async () => {
      fireEvent.changeText(
        screen.getByLabelText(p.sections.bigIdea.label),
        'Idea escrita al volver',
      );
    });
    await pressLast(PULPIT_LABEL);
    await screen.findByText('pulpito');
    const saved = await getPrepNotes(KEY);
    expect(saved.sections.bigIdea).toBe('Idea escrita al volver');
    expect(saved.sections.application).toBe(ILLUSTRATION);
  });
});
