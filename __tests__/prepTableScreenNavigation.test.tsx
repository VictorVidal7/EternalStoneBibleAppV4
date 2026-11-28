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
 * - R9-169 — both buttons WAIT for that flush before navigating: the
 *   destinations read the notes from storage, so a navigation that ran
 *   ahead of the write opened them without what was just typed. No test
 *   watched it (with `void flushDrafts()` in both buttons, every Mesa test
 *   stayed green).
 * - R9-474 — a second tap during that wait pushed a second destination: two
 *   pulpits (back led to the first one), or two banks.
 * - R9-647 — with the Mesa opened without `version` and the reading version
 *   changed since (in the reader), «Modo púlpito» read the version again at
 *   the tap and opened the pulpit in the new one, under a Mesa in the old.
 */
import {Text, TouchableOpacity} from 'react-native';
import {router, Stack, useLocalSearchParams, useRouter} from 'expo-router';
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

// The pulpit stub shows the version it was opened with (R9-647).
function PulpitStub() {
  const {version} = useLocalSearchParams<{version?: string}>();
  return (
    <>
      <Text>pulpito</Text>
      <Text>{`version:${version ?? ''}`}</Text>
    </>
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
    'features/prep/pulpit': PulpitStub,
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

// What `renderRouter` returns: the router's own queries (pathname, state).
let routed: ReturnType<typeof renderRouter>;

async function mountMesa() {
  routed = renderRouter(routes(), {initialUrl: MESA_URL});
  await screen.findByText('Juan 3:16');
  await screen.findByLabelText(PULPIT_LABEL);
}

beforeEach(async () => {
  Object.values(mockToast).forEach(fn => fn.mockClear());
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

describe('R9-169 — the buttons wait for the flush before navigating', () => {
  const BUTTONS = [
    {name: 'Banco de ilustraciones', label: BANK_LABEL, landing: 'banco'},
    {name: 'Modo púlpito', label: PULPIT_LABEL, landing: 'pulpito'},
  ];

  it.each(BUTTONS)('$name', async ({label, landing}) => {
    await mountMesa();
    await act(async () => {
      fireEvent.changeText(
        screen.getByLabelText(p.sections.bigIdea.label),
        'Recién escrito',
      );
    });

    // Hold the flush's write.
    const realSave = prepNotesStore.savePrepNote;
    let release!: () => void;
    const held = new Promise<void>(r => {
      release = r;
    });
    const saveSpy = jest
      .spyOn(prepNotesStore, 'savePrepNote')
      .mockImplementation(async (...args) => {
        await held;
        return realSave(...args);
      });

    await pressLast(label);
    await drain();
    // Control: the flush really is in flight.
    expect(saveSpy).toHaveBeenCalledWith(
      KEY,
      'bigIdea',
      'Recién escrito',
      undefined,
      'expository',
    );
    // While the write is held, the Mesa does not move.
    expect(routed.getPathname()).toBe('/features/prep');
    expect(screen.queryByText(landing)).toBeNull();

    await act(async () => {
      release();
    });
    await screen.findByText(landing);
    expect((await getPrepNotes(KEY)).sections.bigIdea).toBe('Recién escrito');
  });
});

describe('R9-474 — two taps open ONE destination, and back returns to the Mesa', () => {
  const BUTTONS = [
    {
      name: 'Banco de ilustraciones',
      label: BANK_LABEL,
      route: 'features/prep/illustrations/index',
      landing: 'banco',
    },
    {
      name: 'Modo púlpito',
      label: PULPIT_LABEL,
      route: 'features/prep/pulpit',
      landing: 'pulpito',
    },
  ];

  // How many times `route` sits in the app's stack (under expo-router's
  // own `__root`).
  function stackCount(route: string) {
    type Node = {name: string; state?: {routes: Node[]}};
    const root = routed.getRouterState() as {routes: Node[]} | undefined;
    const app = root?.routes.find(r => r.name === '__root')?.state;
    return (app?.routes ?? []).filter(r => r.name === route).length;
  }

  async function tapWhileFlushHeld(label: string, taps: number) {
    await mountMesa();
    await act(async () => {
      fireEvent.changeText(
        screen.getByLabelText(p.sections.bigIdea.label),
        'Recién escrito',
      );
    });
    // Hold the flush's write: the gap where the screen has not moved yet.
    const realSave = prepNotesStore.savePrepNote;
    let release!: () => void;
    const held = new Promise<void>(r => {
      release = r;
    });
    jest
      .spyOn(prepNotesStore, 'savePrepNote')
      .mockImplementation(async (...args) => {
        await held;
        return realSave(...args);
      });
    for (let i = 0; i < taps; i++) {
      await pressLast(label);
      await drain();
    }
    // Control: still on the Mesa while held.
    expect(routed.getPathname()).toBe('/features/prep');
    await act(async () => {
      release();
    });
    await drain();
  }

  it.each(BUTTONS)('$name: double tap', async ({label, route, landing}) => {
    await tapWhileFlushHeld(label, 2);
    await screen.findByText(landing);
    // Pre-fix: 2.
    expect(stackCount(route)).toBe(1);

    await act(async () => {
      router.back();
    });
    await drain();
    expect(routed.getPathname()).toBe('/features/prep');
  });

  it.each(BUTTONS)(
    '$name: control, a single tap',
    async ({label, route, landing}) => {
      await tapWhileFlushHeld(label, 1);
      await screen.findByText(landing);
      expect(stackCount(route)).toBe(1);
      await act(async () => {
        router.back();
      });
      await drain();
      expect(routed.getPathname()).toBe('/features/prep');
    },
  );

  it('a failed flush keeps the Mesa, and the next tap navigates', async () => {
    await mountMesa();
    await act(async () => {
      fireEvent.changeText(
        screen.getByLabelText(p.sections.bigIdea.label),
        'Recién escrito',
      );
    });
    const realSave = prepNotesStore.savePrepNote;
    const saveSpy = jest
      .spyOn(prepNotesStore, 'savePrepNote')
      .mockRejectedValueOnce(new Error('disco lleno'));
    await pressLast(PULPIT_LABEL);
    await drain();
    expect(routed.getPathname()).toBe('/features/prep');
    expect(mockToast.error).toHaveBeenCalled();

    saveSpy.mockImplementation(realSave);
    await pressLast(PULPIT_LABEL);
    await screen.findByText('pulpito');
    expect(stackCount('features/prep/pulpit')).toBe(1);
  });

  // 08117d6c measured here that a failed read of the version AT THE TAP
  // kept the Mesa and let the next tap retry. Since R9-647 the tap reads no
  // version (it forwards the one `load()` resolved; the button shows only
  // after a load landed), so the same failing read can no longer block it.
  it('a failing version read at the tap does not keep the Mesa (R9-647: no read at the tap)', async () => {
    await mountMesa();
    // The Mesa was opened without `version`. A read of the stored reading
    // version would fail, once.
    const getItem = AsyncStorage.getItem as jest.Mock;
    const realGetItem = getItem.getMockImplementation()!;
    let armed = true;
    getItem.mockImplementation((key: string, ...rest: unknown[]) => {
      if (key === '@bible_version' && armed) {
        armed = false;
        return Promise.reject(new Error('lectura fallida'));
      }
      return realGetItem(key, ...rest);
    });
    try {
      await pressLast(PULPIT_LABEL);
      await screen.findByText('pulpito');
      expect(stackCount('features/prep/pulpit')).toBe(1);
      // No read of the version happened at the tap.
      expect(armed).toBe(true);
    } finally {
      getItem.mockImplementation(realGetItem);
    }
  });

  it('the button works again once the Mesa is back in focus', async () => {
    await tapWhileFlushHeld(PULPIT_LABEL, 1);
    await screen.findByText('pulpito');
    await act(async () => {
      router.back();
    });
    await screen.findByText('Juan 3:16');
    await pressLast(PULPIT_LABEL);
    await screen.findByText('pulpito');
    expect(stackCount('features/prep/pulpit')).toBe(1);
  });
});

describe('R9-647 — «Modo púlpito» opens in the version the Mesa loaded', () => {
  it("the reader changed the version after a Mesa opened without one: the pulpit keeps the Mesa's", async () => {
    // Opened without `version`: the Mesa resolves the stored one (none
    // stored: RVR1960) and shows its text under «Juan 3:16».
    await mountMesa();
    // The reader changed the reading version since (it writes the disk).
    await AsyncStorage.setItem('@bible_version', 'KJV');
    await pressLast(PULPIT_LABEL);
    await screen.findByText('pulpito');
    // Pre-fix: version:KJV (read again at the tap).
    expect(screen.getByText('version:RVR1960')).toBeTruthy();
  });

  it('control: an explicit version is forwarded as it is', async () => {
    routed = renderRouter(routes(), {initialUrl: `${MESA_URL}&version=KJV`});
    await screen.findByText('John 3:16');
    await AsyncStorage.setItem('@bible_version', 'RVR1960');
    await pressLast(PULPIT_LABEL);
    await screen.findByText('pulpito');
    expect(screen.getByText('version:KJV')).toBeTruthy();
  });
});

describe('R9-648 — after the bank, a blur or the pending debounce does not erase the illustration', () => {
  /**
   * Type in `application` and open the bank (its flush saves the text);
   * insert there and come back with the Mesa's focus re-read of the notes
   * HELD: the window where the drafts still hold the text from before.
   * `typedAt` is the fake clock when the text was typed.
   */
  async function insertAndComeBackWithRereadHeld() {
    await mountMesa();
    await act(async () => {
      fireEvent.changeText(
        screen.getByLabelText(p.sections.application.label),
        HANDWRITTEN,
      );
    });
    const typedAt = Date.now();
    await pressLast(BANK_LABEL);
    await screen.findByText('banco');
    const realGet = prepNotesStore.getPrepNotes;
    let release!: () => void;
    const held = new Promise<void>(r => {
      release = r;
    });
    const getSpy = jest
      .spyOn(prepNotesStore, 'getPrepNotes')
      .mockImplementation(async (key, options) => {
        const result = await realGet(key, options);
        if (getSpy.mock.calls.length > 1) await held;
        return result;
      });
    await pressLast('insertar-ilustracion');
    await screen.findByText('Juan 3:16');
    await drain();
    // Control: the re-read is held, the field still shows the old text, and
    // storage has the illustration.
    expect(getSpy.mock.calls.length).toBeGreaterThan(1);
    expect(
      screen.getByLabelText(p.sections.application.label).props.value,
    ).toBe(HANDWRITTEN);
    expect((await realGet(KEY)).sections.application).toBe(
      `${HANDWRITTEN}\n\n${ILLUSTRATION}`,
    );
    return {release, realGet, typedAt};
  }

  it('a blur of the field in the window does not erase it', async () => {
    const {release, realGet} = await insertAndComeBackWithRereadHeld();
    await act(async () => {
      fireEvent(screen.getByLabelText(p.sections.application.label), 'blur');
    });
    await drain();
    // Pre-fix: the blur wrote HANDWRITTEN alone over it.
    expect((await realGet(KEY)).sections.application).toBe(
      `${HANDWRITTEN}\n\n${ILLUSTRATION}`,
    );
    await act(async () => {
      release();
    });
  });

  it('the save the debounce held before the bank does not fire after the insertion', async () => {
    const {release, realGet, typedAt} = await insertAndComeBackWithRereadHeld();
    // Control: the insertion came within the debounce's 700 ms.
    expect(Date.now() - typedAt).toBeLessThan(700);
    await act(async () => {
      jest.advanceTimersByTime(1000);
    });
    await drain();
    // Pre-fix: the pending save wrote HANDWRITTEN alone over it.
    expect((await realGet(KEY)).sections.application).toBe(
      `${HANDWRITTEN}\n\n${ILLUSTRATION}`,
    );
    await act(async () => {
      release();
    });
  });

  it('control: a blur after a real edit still saves it', async () => {
    await mountMesa();
    await act(async () => {
      fireEvent.changeText(
        screen.getByLabelText(p.sections.bigIdea.label),
        'Idea editada',
      );
    });
    await act(async () => {
      fireEvent(screen.getByLabelText(p.sections.bigIdea.label), 'blur');
    });
    await drain();
    // No timer advanced: the debounce has not fired; the blur saved it.
    expect((await getPrepNotes(KEY)).sections.bigIdea).toBe('Idea editada');
  });
});
