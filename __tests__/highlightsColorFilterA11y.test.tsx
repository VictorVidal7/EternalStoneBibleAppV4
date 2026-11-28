/**
 * R9-566 — the color swatches of the highlights gallery have a name and a
 * state for screen readers.
 *
 * The filter swatches were bare touchables told apart only by their color:
 * no label, no role, no selected state (the chosen one only gets a border).
 * The group header of the «by color» mode was a swatch and a number. The
 * reader's color picker already names each color
 * (`t.verse.highlightColorNames`): the gallery uses the same names.
 *
 * Lo REAL: the whole highlights screen with the real `HighlightService` over a
 * fake SQL table. Lo sustituido: theme, language, version, router, toasts,
 * the share-image modal, sync. What TalkBack really says: a live check.
 */
import {render, fireEvent} from '@testing-library/react-native';
import HighlightsScreen from '../app/(tabs)/highlights';
import {HighlightService} from '../src/lib/highlights/HighlightService';
import {translations} from '../src/i18n/translations';

type Row = Record<string, unknown>;
const table: Row[] = [];
const fakeDb = {
  async executeSql(sql: string, params: unknown[] = []) {
    const s = sql.replace(/\s+/g, ' ').trim();
    let rows: Row[] = [];
    if (s.startsWith('SELECT * FROM highlights WHERE verse_id = ?')) {
      rows = table.filter(r => r.verse_id === params[0]).slice(0, 1);
    } else if (s.startsWith('SELECT * FROM highlights ORDER BY')) {
      rows = [...table];
    }
    return {rows: {length: rows.length, _array: rows}};
  },
};
const mockService = new HighlightService(fakeDb as never);

jest.mock('expo-router', () => {
  const React = require('react');
  return {
    useRouter: () => ({push: jest.fn(), back: jest.fn()}),
    useFocusEffect: (cb: () => void) => React.useEffect(cb, [cb]),
  };
});
jest.mock('../src/hooks/useTheme', () => {
  const colors = new Proxy({}, {get: () => '#000000'});
  const gradient = new Proxy({}, {get: () => ['#000000', '#111111']});
  return {useTheme: () => ({isDark: false, colors, gradient})};
});
jest.mock('../src/hooks/useLanguage', () => ({
  useLanguage: () => ({
    language: 'es',
    t: require('../src/i18n/translations').translations.es,
  }),
}));
jest.mock('../src/hooks/useBibleVersion', () => ({
  useBibleVersion: () => ({selectedVersion: {id: 'RVR1960', language: 'es'}}),
}));
jest.mock('../src/context/ServicesContext', () => ({
  useServices: () => ({highlightService: mockService}),
}));
jest.mock('../src/context/ToastContext', () => {
  const value = {success: jest.fn(), error: jest.fn(), info: jest.fn()};
  return {useToast: () => value};
});
jest.mock('../src/lib/database', () => ({
  __esModule: true,
  default: {
    getVerse: jest.fn(() => Promise.resolve({text: 'En el principio'})),
  },
}));
jest.mock('../src/lib/sync', () => ({
  getSyncEngine: () => ({queueWrite: jest.fn(), queueDelete: jest.fn()}),
}));
jest.mock('../src/components/insights/HighlightsImageModal', () => ({
  HighlightsImageModal: () => null,
}));
jest.mock('expo-linear-gradient', () => ({
  LinearGradient: ({children}: {children: unknown}) => children,
}));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({top: 0, bottom: 0, left: 0, right: 0}),
  SafeAreaView: ({children}: {children: unknown}) => children,
}));
jest.mock('expo-blur', () => {
  const {View} = require('react-native');
  return {BlurView: View};
});

const t = translations.es;
const names = t.verse.highlightColorNames;

function row(id: string, verse: number, color: string): Row {
  return {
    id,
    verse_id: `Genesis_1_${verse}`,
    book_id: 'Genesis',
    chapter: 1,
    verse,
    color,
    category: null,
    note: null,
    created_at: verse,
    updated_at: verse,
  };
}

beforeEach(() => {
  table.length = 0;
  table.push(row('h1', 1, '#FFF59D'), row('h2', 2, '#90CAF9'));
});

describe('R9-566 — the color filter of the highlights gallery', () => {
  it('each swatch is a button named after its color, with its selected state', async () => {
    const r = render(<HighlightsScreen />);
    const yellow = await r.findByLabelText(names.yellow);
    const blue = r.getByLabelText(names.blue);
    expect(yellow.props.accessibilityRole).toBe('button');
    expect(yellow.props.accessibilityState).toEqual({selected: false});

    fireEvent.press(yellow);
    expect(r.getByLabelText(names.yellow).props.accessibilityState).toEqual({
      selected: true,
    });
    expect(blue.props.accessibilityState).toEqual({selected: false});
  });

  it('a stored color outside the palette is still named (by its value)', async () => {
    table.push(row('h3', 3, '#123456'));
    const r = render(<HighlightsScreen />);
    expect(await r.findByLabelText('#123456')).toBeTruthy();
  });

  it('the «by color» group header names the color and the count', async () => {
    const r = render(<HighlightsScreen />);
    fireEvent.press(await r.findByLabelText(t.highlights.groupByColor));
    const header = await r.findByLabelText(`${names.yellow}, 1`);
    expect(header.props.accessibilityRole).toBe('header');
    expect(r.getByLabelText(`${names.blue}, 1`)).toBeTruthy();
  });
});
