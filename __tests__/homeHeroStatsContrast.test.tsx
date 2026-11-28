/**
 * R9-456 — la fila de estadísticas del recuadro de cabecera de Home (racha,
 * nivel, progreso) era un blanco fijo (el valor `#ffffff`, la etiqueta
 * `rgba(255,255,255,0.75)` de 9 px) sobre un vidrio blanco, y el degradado
 * del tema (`gradient.headerColors`, diagonal) termina claro en seis temas de
 * mañana: las cifras caían bajo 3:1.
 *
 * Lo REAL: Home, la `StatsCard` y el `ThemeProvider`, movido con sus propios
 * setters (modo, tema de color, alto contraste) y la hora del día (la lee al
 * montar), en las 129 paletas del recuadro: 16 temas × 4 horas × claro y
 * oscuro, más alto contraste. Los colores se leen de lo dibujado: la tinta de
 * cada cifra y etiqueta, el fondo de la fila y los colores del degradado. El
 * contraste se mide sobre cada color del degradado con el fondo de la fila
 * encima (la fila cruza el recuadro de lado a lado).
 */
import {StyleSheet} from 'react-native';
import {render, screen, act} from '@testing-library/react-native';
import {
  ThemeProvider,
  useTheme,
  themePrimaryColors,
} from '../src/hooks/useTheme';
import type {ColorTheme} from '../src/hooks/useTheme';
import {contrastRatio} from '../src/lib/a11y/contrast';

const mockRouter = {push: jest.fn(), back: jest.fn()};
jest.mock('expo-router', () => {
  const React = require('react');
  return {
    useRouter: () => mockRouter,
    useFocusEffect: (effect: () => void) => {
      React.useEffect(() => {
        effect();
      }, [effect]);
    },
  };
});
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({top: 0, bottom: 0, left: 0, right: 0}),
}));
jest.mock('@expo/vector-icons', () => ({Ionicons: () => null}));
jest.mock('expo-linear-gradient', () => {
  const {View} = require('react-native');
  return {LinearGradient: View};
});
jest.mock('expo-blur', () => {
  const {View} = require('react-native');
  return {BlurView: View};
});
jest.mock('@lib/haptics', () => ({
  haptics: {tap: jest.fn(), success: jest.fn(), error: jest.fn()},
}));
jest.mock('@lib/database', () => {
  const db = {
    initialize: jest.fn(async () => {}),
    getVerse: jest.fn(async () => ({
      book: 'Juan',
      bookNumber: 43,
      chapter: 3,
      verse: 16,
      text: 'Porque de tal manera',
    })),
    getRandomVerse: jest.fn(async () => null),
    getReadingProgress: jest.fn(async () => null),
    getFavoritesCount: jest.fn(async () => 0),
    getNotesCount: jest.fn(async () => 0),
  };
  return {__esModule: true, default: db, bibleDB: db};
});
jest.mock('@lib/utils/logger', () => ({
  logger: {
    error: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));
const mockVersion = {
  selectedVersion: {
    id: 'RVR1960',
    language: 'es',
    abbreviation: 'RVR1960',
    name: 'RVR1960',
  },
  availableVersions: [],
};
jest.mock('@hooks/useBibleVersion', () => ({
  useBibleVersion: () => mockVersion,
}));
const mockServices = {
  achievementService: {
    getUserStats: jest.fn(async () => ({
      totalVersesRead: 0,
      currentStreak: 12,
      level: 3,
    })),
  },
  highlightService: {getAllHighlights: jest.fn(async () => [])},
  initialized: true,
};
jest.mock('@context/ServicesContext', () => ({
  useServices: () => mockServices,
}));
const mockLang = {
  language: 'es',
  t: require('../src/i18n/translations').translations.es,
};
jest.mock('@hooks/useLanguage', () => ({useLanguage: () => mockLang}));
jest.mock('@/services/ShareService', () => ({__esModule: true, default: {}}));
const mockProgress = {getChapterProgress: () => 0};
jest.mock('@context/ReadingProgressContext', () => ({
  useReadingProgress: () => mockProgress,
}));
const mockPlans = {
  getCompletedDays: () => [],
  getStartedAt: () => null,
  getPlanDuration: () => undefined,
};
jest.mock('@context/ReadingPlanProgressContext', () => ({
  useReadingPlanProgress: () => mockPlans,
}));
const mockTogether = {getMembership: () => null};
jest.mock('@context/TogetherContext', () => ({
  useTogether: () => mockTogether,
}));
const mockCustom = {customPlans: []};
jest.mock('@context/CustomPlansContext', () => ({
  useCustomPlans: () => mockCustom,
}));
const mockFav = {
  addFavorite: jest.fn(),
  removeFavorite: jest.fn(),
  isFavorite: () => false,
  favorites: [],
};
jest.mock('@context/FavoritesContext', () => ({useFavorites: () => mockFav}));
const mockDeck = {stats: new Proxy({}, {get: () => 0})};
jest.mock('@context/MemoryDeckContext', () => ({
  useMemoryDeck: () => mockDeck,
}));
const mockPremium = {isPremium: false};
jest.mock('@context/PremiumContext', () => ({usePremium: () => mockPremium}));
const mockToast = {show: jest.fn(), success: jest.fn(), error: jest.fn()};
jest.mock('@context/ToastContext', () => ({useToast: () => mockToast}));
const mockAudio = {
  isVisible: false,
  autoAdvanceChapter: false,
  state: {isPlaying: false, currentVerseIndex: 0},
  currentVerse: null,
  verses: [],
  play: jest.fn(),
};
jest.mock('@/features/audio', () => {
  const actual = jest.requireActual('@/features/audio');
  return {
    ...actual,
    useAudioPlayer: () => mockAudio,
    getLastPosition: jest.fn(async () => null),
  };
});
jest.mock('@/features/study/crossReferences', () => ({
  getMergedStudyConnections: jest.fn(async () => ({totalConnections: 0})),
}));
jest.mock('@components/celestial', () => {
  const R = require('react');
  const {View} = require('react-native');
  return {
    // La tarjeta real: lo que se prueba.
    StatsCard: jest.requireActual('../src/components/celestial/StatsCard')
      .default,
    VerseOfDayCard: () => null,
    ReadingPlanCard: () => null,
    ShimmerCard: ({children}: {children: unknown}) =>
      R.createElement(View, null, children),
  };
});
jest.mock('@components/SkeletonLoader', () => ({Skeleton: () => null}));
jest.mock('@components/FeelingChips', () => ({FeelingChips: () => null}));
jest.mock('@components/MoodVerseCard', () => ({MoodVerseCard: () => null}));
jest.mock('@components/DevotionStreakCard', () => ({
  DevotionStreakCard: () => null,
}));
jest.mock('@components/ConstancyRingsCard', () => ({
  ConstancyRingsCard: () => null,
}));
jest.mock('@components/NextMilestoneCard', () => ({
  NextMilestoneCard: () => null,
}));
jest.mock('@components/PrayerCard', () => ({PrayerCard: () => null}));
jest.mock('@components/home/DiscoverTile', () => ({DiscoverTile: () => null}));
jest.mock('@components/hints/ContextualHintBanner', () => ({
  ContextualHintBanner: () => null,
}));
// Sin la animación de las cifras (CountUpText la salta con movimiento reducido).
jest.mock('@hooks/useReducedMotion', () => ({useReducedMotion: () => true}));
const mockHint = {visible: false, dismiss: jest.fn(), show: jest.fn()};
jest.mock('@hooks/useContextualHint', () => ({
  useContextualHint: () => mockHint,
}));

import HomeScreen from '../app/(tabs)/index';

const t = mockLang.t;
const THEMES = Object.keys(themePrimaryColors) as ColorTheme[];
const HOURS = {morning: 8, afternoon: 14, evening: 19, night: 23} as const;
const r2 = (n: number) => Math.round(n * 100) / 100;

type RGBA = [number, number, number, number];
/** `#RRGGBB`, `#RRGGBBAA` o `rgba(r, g, b, a)`, como se dibujan. */
function parse(c: string): RGBA {
  const m = /^rgba?\(([^)]+)\)$/.exec(c.trim());
  if (m) {
    const [r, g, b, a = '1'] = m[1].split(',').map(s => s.trim());
    return [Number(r), Number(g), Number(b), Number(a)];
  }
  const h = c.replace('#', '');
  const ch = (i: number) => parseInt(h.slice(i, i + 2), 16);
  return [ch(0), ch(2), ch(4), h.length === 8 ? ch(6) / 255 : 1];
}
/** `fg` (con su alfa) encima de un color sólido. */
function over(fg: string, solid: string): string {
  const [r, g, b, a] = parse(fg);
  const [R, G, B] = parse(solid);
  const mix = (x: number, y: number) =>
    Math.round(x * a + y * (1 - a))
      .toString(16)
      .padStart(2, '0');
  return '#' + mix(r, R) + mix(g, G) + mix(b, B);
}

let theme: ReturnType<typeof useTheme> | null = null;
function Grab() {
  theme = useTheme();
  return null;
}

async function flush() {
  for (let i = 0; i < 6; i++) {
    await act(async () => {
      await new Promise(r => setTimeout(r, 0));
    });
  }
}

function styleOf(
  node: {props: {style?: unknown}} | null,
): {backgroundColor?: unknown; color?: unknown} | null {
  return node?.props?.style
    ? (StyleSheet.flatten(node.props.style as never) as {
        backgroundColor?: unknown;
        color?: unknown;
      })
    : null;
}

/** Lo dibujado de la fila: cada etiqueta, su cifra, el fondo y el degradado. */
function readRow() {
  const label = screen.getByText(t.home.streakDays);
  let node = label.parent;
  let rowFill: string | undefined;
  let stops: string[] | undefined;
  while (node && !stops) {
    const st = styleOf(node);
    if (!rowFill && st?.backgroundColor) rowFill = st.backgroundColor as string;
    if (Array.isArray(node.props.colors)) stops = node.props.colors as string[];
    node = node.parent;
  }
  const texts: {what: string; ink: string}[] = [];
  for (const [name, text] of [
    ['racha', t.home.streakDays],
    ['nivel', t.home.level],
    ['progreso', t.home.progress],
  ] as const) {
    const l = screen.getByText(text);
    texts.push({what: name + ':etiqueta', ink: styleOf(l)!.color as string});
    // La cifra: el otro texto de la misma tarjeta.
    const hostTexts = (n: typeof l) =>
      n.findAll(x => (x.type as unknown) === 'Text');
    let card = l.parent!;
    while (hostTexts(card).length < 2) card = card.parent!;
    const value = hostTexts(card).find(x => x !== l)!;
    texts.push({what: name + ':cifra', ink: styleOf(value)!.color as string});
  }
  return {rowFill: rowFill!, stops: stops!, texts};
}

/** El peor contraste de cada texto sobre los colores del degradado con la fila encima. */
function worst(row: ReturnType<typeof readRow>) {
  const out: Record<string, number> = {};
  for (const {what, ink} of row.texts) {
    out[what] = Math.min(
      ...row.stops.map(stop => {
        const bg = over(row.rowFill, stop);
        return contrastRatio(over(ink, bg), bg);
      }),
    );
  }
  return out;
}

let hourSpy: jest.SpyInstance;
afterEach(() => hourSpy?.mockRestore());

async function measureHour(hour: number, name: string) {
  hourSpy = jest.spyOn(Date.prototype, 'getHours').mockReturnValue(hour);
  const r = render(
    <ThemeProvider>
      <Grab />
      <HomeScreen />
    </ThemeProvider>,
  );
  await flush();
  const rows: Record<string, Record<string, number>> = {};
  for (const mode of ['light', 'dark'] as const) {
    for (const ct of THEMES) {
      await act(async () => {
        await theme!.setHighContrast(false);
        await theme!.setThemeMode(mode);
        await theme!.setColorTheme(ct);
      });
      // El provider compuso de verdad la paleta pedida.
      expect([theme!.isDark, theme!.colorTheme, theme!.timeOfDay]).toEqual([
        mode === 'dark',
        ct,
        name,
      ]);
      rows[`${ct}.${name}.${mode}`] = worst(readRow());
    }
  }
  await act(async () => {
    await theme!.setHighContrast(true);
  });
  rows[`altoContraste.${name}`] = worst(readRow());
  r.unmount();
  hourSpy.mockRestore();
  return rows;
}

function under(rows: Record<string, Record<string, number>>, min: number) {
  const bad: string[] = [];
  for (const [p, row] of Object.entries(rows)) {
    for (const [what, v] of Object.entries(row)) {
      if (v < min) bad.push(`${p} ${what}=${r2(v)}`);
    }
  }
  return bad;
}

describe('R9-456 — la fila de estadísticas de Home se lee en cada paleta', () => {
  it.each(Object.entries(HOURS))(
    '%s: cifras y etiquetas ≥ 4.5:1 sobre todo el degradado, en los 16 temas, claro, oscuro y alto contraste',
    async (name, hour) => {
      const rows = await measureHour(hour, name);
      expect(Object.keys(rows)).toHaveLength(THEMES.length * 2 + 1);
      expect(under(rows, 4.5)).toEqual([]);
    },
  );
});
