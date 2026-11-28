/**
 * R9-475 (Hilo profético) y R9-496 (lectio) — «Memorizar» con una versión en
 * español armaba la clave del mazo con el nombre del libro de la versión
 * («Génesis/3/15», «Juan/3/16»), y el resto de la app la arma con el canónico
 * en inglés («Genesis/3/15»): no reconocía la carta y la duplicaba.
 *
 * El arreglo, en `MemoryDeckContext`: la carta nueva va con el nombre
 * canónico, y `hasCard`, `addCard`, `removeCard` y `reviewCard` reconocen el
 * versículo por su identidad. Las cartas ya guardadas con el nombre en español
 * se quedan con su clave (es el id del documento en la nube): ni huérfanas ni
 * duplicadas.
 *
 * Las pantallas reales y el `MemoryDeckProvider` real sobre el AsyncStorage
 * simulado; de la sync, solo la cola (lo que se escribiría o borraría).
 */
import {Text} from 'react-native';
import {
  render,
  fireEvent,
  act,
  waitFor,
  cleanup,
} from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {getBookByName} from '@/constants/bible';
import {LECTIO_STEPS} from '@/features/study/lectio';
import type {MemoryCard} from '@lib/memory/srs';

const mockRouter = {back: jest.fn(), push: jest.fn(), replace: jest.fn()};
const mockParams: Record<string, string> = {};
jest.mock('expo-router', () => ({
  useRouter: () => mockRouter,
  useLocalSearchParams: () => mockParams,
  useFocusEffect: (cb: () => void | (() => void)) => {
    const React = require('react');
    React.useEffect(() => cb(), []);
  },
  Stack: {Screen: () => null},
}));
jest.mock('@expo/vector-icons', () => ({
  Ionicons: () => null,
  MaterialCommunityIcons: () => null,
}));
jest.mock('expo-linear-gradient', () => {
  const {View: RNView} = require('react-native');
  return {LinearGradient: RNView};
});
const mockInsets = {top: 0, bottom: 0, left: 0, right: 0};
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => mockInsets,
}));
jest.mock('@lib/haptics', () => ({
  haptics: {tap: jest.fn(), success: jest.fn(), error: jest.fn()},
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
    warning: '#f59e0b',
  },
  gradient: {
    colors: ['#000', '#000', '#000'],
    headerColors: ['#000', '#000', '#000'],
    accentGlow: '#FFD60A',
  },
  highContrast: false,
};
jest.mock('@hooks/useTheme', () => ({useTheme: () => mockTheme}));
const mockLang = {
  language: 'es',
  t: require('../src/i18n/translations').translations.es,
};
jest.mock('@hooks/useLanguage', () => ({useLanguage: () => mockLang}));
type Version = {id: string; language: string; abbreviation: string};
const RVR1960: Version = {
  id: 'RVR1960',
  language: 'es',
  abbreviation: 'RVR1960',
};
const KJV: Version = {id: 'KJV', language: 'en', abbreviation: 'KJV'};
const mockVersion: {current: {selectedVersion: Version}} = {
  current: {selectedVersion: RVR1960},
};
jest.mock('@hooks/useBibleVersion', () => ({
  useBibleVersion: () => mockVersion.current,
}));
jest.mock('@hooks/useBackHandlerStep', () => ({
  useBackHandlerStep: () => undefined,
}));
const mockWalk = {
  speaking: false,
  walkthroughActive: false,
  start: jest.fn(),
  stop: jest.fn(),
  toggle: jest.fn(),
  speakOnce: jest.fn(),
};
jest.mock('@hooks/useNarratedWalkthrough', () => ({
  useNarratedWalkthrough: () => mockWalk,
}));
jest.mock('@lib/database', () => ({
  __esModule: true,
  default: {
    initialize: jest.fn(async () => undefined),
    getVerse: jest.fn(async () => ({text: 'texto del versiculo'})),
    getNoteForVerse: jest.fn(async () => null),
    addNote: jest.fn(async () => 'n1'),
    updateNote: jest.fn(async () => undefined),
  },
}));
jest.mock('@lib/utils/logger', () => ({
  logger: {
    error: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));
/** La cola de la sync: `W <id> r<reviewCount>` y `D <id>`. */
let mockCola: string[] = [];
jest.mock('../src/lib/sync', () => ({
  ...jest.requireActual('../src/lib/sync'),
  getSyncEngine: () => ({
    queueWrite: (_: string, id: string, d: {reviewCount: number}) =>
      mockCola.push(`W ${id} r${d.reviewCount}`),
    queueDelete: (_: string, id: string) => mockCola.push(`D ${id}`),
  }),
}));
jest.mock('@/features/study/devotionLogStore', () => ({
  recordTodayDevotion: jest.fn(async () => undefined),
}));
const mockAudio = {loadChapter: jest.fn(), play: jest.fn()};
jest.mock('@/features/audio', () => ({useAudioPlayer: () => mockAudio}));
jest.mock('@components/reading/ImageShareModal', () => ({
  ImageShareModal: () => null,
}));
const mockToast = {success: jest.fn(), error: jest.fn(), info: jest.fn()};
jest.mock('@context/ToastContext', () => ({useToast: () => mockToast}));
const mockServices = {achievementService: null, notifyAchievements: jest.fn()};
jest.mock('@context/ServicesContext', () => ({
  useServices: () => mockServices,
}));
jest.mock('@components/study/ProphecyShareModal', () => ({
  ProphecyShareModal: () => null,
}));
jest.mock('@components/reading/OriginalLanguagesSheet', () => ({
  OriginalLanguagesSheet: () => null,
}));
jest.mock('../src/lib/memory/reviewEventStore', () => ({
  __esModule: true,
  getAllReviewEvents: jest.fn().mockResolvedValue([]),
  addReviewEvent: jest.fn().mockResolvedValue(undefined),
  getReviewEventById: jest.fn().mockResolvedValue(null),
  removeReviewEvent: jest.fn().mockResolvedValue(undefined),
}));

import PropheticThreadScreen from '../app/features/prophecies/index';
import LectioScreen from '../app/features/lectio';
import {
  MemoryDeckProvider,
  useMemoryDeck,
  type MemoryDeckContextValue,
} from '../src/context/MemoryDeckContext';

const es = require('../src/i18n/translations').translations.es;
const tp = es.prophecies;
const tl = es.lectio;

/** Una carta ya memorizada (con repasos), guardada con `key`. */
const saved = (key: string, chapter: number, verse: number): MemoryCard => ({
  verseKey: key,
  bookName: key.split('/')[0],
  chapter,
  verse,
  text: 'texto ' + key,
  version: 'RVR1960',
  box: 3,
  dueAt: '2026-12-01T00:00:00.000Z',
  addedAt: '2026-09-01T00:00:00.000Z',
  lastReviewedAt: '2026-11-01T00:00:00.000Z',
  reviewCount: 5,
  lapseCount: 1,
  ease: 2.4,
  updatedAt: 1_700_000_000_000,
});

async function seed(cards: MemoryCard[]) {
  await AsyncStorage.setItem(
    '@memory_deck',
    JSON.stringify(Object.fromEntries(cards.map(c => [c.verseKey, c]))),
  );
}

let deck: MemoryDeckContextValue | null = null;
function Capture() {
  deck = useMemoryDeck();
  return <Text>{deck.cards.length}</Text>;
}
const cardsOf = (chapter: number, verse: number) =>
  deck!.cards.filter(c => c.chapter === chapter && c.verse === verse);

async function mountDeck(screen: React.ReactNode = null) {
  const u = render(
    <MemoryDeckProvider>
      <Capture />
      {screen}
    </MemoryDeckProvider>,
  );
  await waitFor(() => expect(deck?.hydrated).toBe(true));
  await act(async () => {
    await new Promise(r => setTimeout(r, 0));
  });
  return u;
}

async function walkLectioToFinale(u: ReturnType<typeof render>) {
  await waitFor(() => expect(u.getByLabelText(tl.next)).toBeTruthy());
  for (let i = 0; i < LECTIO_STEPS.length - 1; i++) {
    fireEvent.press(u.getByLabelText(tl.next));
  }
  await waitFor(() => expect(u.getByLabelText(tl.finish)).toBeTruthy());
  await act(async () => {
    fireEvent.press(u.getByLabelText(tl.finish));
  });
  await waitFor(() => expect(u.getByLabelText(tl.memorize)).toBeTruthy());
}

beforeEach(async () => {
  await AsyncStorage.clear();
  mockCola = [];
  deck = null;
  for (const k of Object.keys(mockParams)) delete mockParams[k];
  mockToast.success.mockClear();
  mockToast.info.mockClear();
  mockVersion.current = {selectedVersion: RVR1960};
});
afterEach(cleanup);

describe('R9-475 — «Memorizar» del Hilo profético (Génesis 3:15)', () => {
  beforeEach(() => {
    mockParams.start = '0';
  });

  it('RVR1960: reconoce la carta guardada con el nombre canónico y no la duplica', async () => {
    await seed([saved('Genesis/3/15', 3, 15)]);
    const u = await mountDeck(<PropheticThreadScreen />);
    await waitFor(() => expect(u.getByLabelText(tp.memorized)).toBeTruthy());
    expect(u.queryByLabelText(tp.memorize)).toBeNull();
    expect(cardsOf(3, 15).map(c => c.verseKey)).toEqual(['Genesis/3/15']);
  });

  it('KJV: reconoce una carta vieja guardada con «Génesis» (ya en los teléfonos)', async () => {
    mockVersion.current = {selectedVersion: KJV};
    await seed([saved('Génesis/3/15', 3, 15)]);
    const u = await mountDeck(<PropheticThreadScreen />);
    await waitFor(() => expect(u.getByLabelText(tp.memorized)).toBeTruthy());
    expect(cardsOf(3, 15).map(c => c.verseKey)).toEqual(['Génesis/3/15']);
  });

  it.each([RVR1960, KJV])(
    '$id: la carta nueva lleva el nombre canónico y el mismo versículo (la misma en las dos)',
    async v => {
      mockVersion.current = {selectedVersion: v};
      const u = await mountDeck(<PropheticThreadScreen />);
      await waitFor(() => expect(u.getByLabelText(tp.memorize)).toBeTruthy());
      fireEvent.press(u.getByLabelText(tp.memorize));
      await waitFor(() => expect(cardsOf(3, 15)).toHaveLength(1));
      const c = cardsOf(3, 15)[0];
      expect(getBookByName(c.bookName)?.id).toBe(1);
      expect([c.verseKey, c.bookName, c.chapter, c.verse]).toEqual([
        'Genesis/3/15',
        'Genesis',
        3,
        15,
      ]);
    },
  );
});

describe('R9-496 — «Memorizar» al final de lectio (Juan 3:16)', () => {
  beforeEach(() => {
    Object.assign(mockParams, {book: 'John', chapter: '3', verse: '16'});
  });

  it('RVR1960: con la carta canónica en el mazo, avisa «ya está» y no la duplica', async () => {
    await seed([saved('John/3/16', 3, 16)]);
    const u = await mountDeck(<LectioScreen />);
    await walkLectioToFinale(u);
    fireEvent.press(u.getByLabelText(tl.memorize));
    expect(mockToast.info).toHaveBeenCalledWith(tl.memorizedAlready);
    expect(mockToast.success).not.toHaveBeenCalledWith(tl.memorized);
    expect(cardsOf(3, 16).map(c => c.verseKey)).toEqual(['John/3/16']);
  });

  it('KJV: con una carta vieja «Juan/3/16», avisa «ya está» y no la duplica', async () => {
    mockVersion.current = {selectedVersion: KJV};
    await seed([saved('Juan/3/16', 3, 16)]);
    const u = await mountDeck(<LectioScreen />);
    await walkLectioToFinale(u);
    fireEvent.press(u.getByLabelText(tl.memorize));
    expect(mockToast.info).toHaveBeenCalledWith(tl.memorizedAlready);
    expect(cardsOf(3, 16).map(c => c.verseKey)).toEqual(['Juan/3/16']);
  });
});

describe('R9-475 — las cartas viejas con el nombre en español, en el provider', () => {
  it('el resto de la app (nombre canónico) la reconoce, la repasa y la quita: ni huérfana ni duplicada', async () => {
    await seed([saved('Génesis/3/15', 3, 15)]);
    await mountDeck();
    // Daily Light, el selector del mazo o el quiz: el nombre canónico.
    act(() =>
      deck!.addCard({
        bookName: 'Genesis',
        chapter: 3,
        verse: 15,
        text: 't',
        version: 'KJV',
      }),
    );
    expect(cardsOf(3, 15)).toHaveLength(1);
    expect(cardsOf(3, 15)[0]).toMatchObject({
      verseKey: 'Génesis/3/15',
      box: 3,
      reviewCount: 5,
    });
    expect(deck!.hasCard('Genesis/3/15')).toBe(true);
    // El quiz: `hasCard(k)` y después `reviewCard(k)`.
    act(() => deck!.reviewCard('Genesis/3/15', 'good'));
    expect(cardsOf(3, 15)).toHaveLength(1);
    expect(cardsOf(3, 15)[0]).toMatchObject({
      verseKey: 'Génesis/3/15',
      reviewCount: 6,
    });
    // Favoritos: `hasCard(k)` y después `removeCard(k)`.
    act(() => deck!.removeCard('Genesis/3/15'));
    expect(cardsOf(3, 15)).toHaveLength(0);
    // La nube: el mismo documento de siempre, sin uno nuevo.
    expect(mockCola).toEqual(['W Génesis/3/15 r6', 'D Génesis/3/15']);
  });

  it('una carta agregada mientras se lee el disco no duplica la vieja', async () => {
    let release: (raw: string) => void = () => undefined;
    jest
      .spyOn(AsyncStorage, 'getItem')
      .mockImplementationOnce(() => new Promise(r => (release = r)));
    render(
      <MemoryDeckProvider>
        <Capture />
      </MemoryDeckProvider>,
    );
    await waitFor(() => expect(deck).not.toBeNull());
    act(() =>
      deck!.addCard({
        bookName: 'Genesis',
        chapter: 3,
        verse: 15,
        text: 't',
        version: 'KJV',
      }),
    );
    await act(async () => {
      release(JSON.stringify({'Génesis/3/15': saved('Génesis/3/15', 3, 15)}));
      await new Promise(r => setTimeout(r, 0));
    });
    await waitFor(() => expect(deck!.hydrated).toBe(true));
    expect(cardsOf(3, 15).map(c => [c.verseKey, c.reviewCount])).toEqual([
      ['Génesis/3/15', 5],
    ]);
    expect(mockCola).toEqual([]);
  });

  it('medición: un par ya duplicado en el disco se conserva entero (no se pierde ninguna carta)', async () => {
    await seed([saved('Génesis/3/15', 3, 15), saved('Genesis/3/15', 3, 15)]);
    await mountDeck();
    act(() =>
      deck!.addCard({
        bookName: 'Génesis',
        chapter: 3,
        verse: 15,
        text: 't',
        version: 'RVR1960',
      }),
    );
    expect(
      cardsOf(3, 15)
        .map(c => c.verseKey)
        .sort(),
    ).toEqual(['Genesis/3/15', 'Génesis/3/15']);
    expect(mockCola).toEqual([]);
  });
});
