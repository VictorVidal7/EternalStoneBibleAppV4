/**
 * R9-415 — `saveEditor` on the Highlights screen had no `try`. When the row
 * was gone (a sync pull applied a delete made on another device while the
 * editor was open), the REAL `HighlightService.updateHighlight` throws
 * "Highlight not found", the rejection escaped the press handler, nothing was
 * shown, and Cancel — the only way out — dropped what was typed.
 *
 * The service here is the real one, over an in-memory table; the row is
 * removed from that table while the editor is open.
 */
import {render, fireEvent, act, waitFor} from '@testing-library/react-native';
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
    } else if (s.startsWith('UPDATE highlights')) {
      const row = table.find(r => r.verse_id === params[params.length - 1]);
      if (row) row.note = params[1];
    } else if (s.startsWith('DELETE FROM highlights')) {
      const i = table.findIndex(r => r.verse_id === params[0]);
      if (i >= 0) table.splice(i, 1);
    }
    return {rows: {length: rows.length, _array: rows}};
  },
};
const mockService = new HighlightService(fakeDb as never);

const mockToast = {
  success: jest.fn(),
  error: jest.fn(),
  info: jest.fn(),
  warning: jest.fn(),
};
const mockQueueWrite = jest.fn();

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
jest.mock('../src/context/ToastContext', () => ({useToast: () => mockToast}));
jest.mock('../src/lib/database', () => ({
  __esModule: true,
  default: {
    getVerse: jest.fn(() => Promise.resolve({text: 'En el principio'})),
  },
}));
jest.mock('../src/lib/sync', () => ({
  getSyncEngine: () => ({queueWrite: mockQueueWrite, queueDelete: jest.fn()}),
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

const t = translations.es;

const unhandled: unknown[] = [];
const onUnhandled = (r: unknown) => unhandled.push(r);
beforeAll(() => process.on('unhandledRejection', onUnhandled));
afterAll(() => process.off('unhandledRejection', onUnhandled));

beforeEach(() => {
  jest.clearAllMocks();
  unhandled.length = 0;
  table.length = 0;
  table.push({
    id: 'h1',
    verse_id: 'Genesis_1_1',
    book_id: 'Genesis',
    chapter: 1,
    verse: 1,
    color: 'yellow',
    category: null,
    note: 'nota vieja',
    created_at: 1,
    updated_at: 1,
  });
});

async function openAndType() {
  const r = render(<HighlightsScreen />);
  const edit = await r.findAllByLabelText(t.edit);
  fireEvent.press(edit[0]);
  const input = await r.findByDisplayValue('nota vieja');
  fireEvent.changeText(input, 'nota nueva importante');
  return r;
}

it('control: with the row present, Save closes the editor, toasts and queues', async () => {
  const r = await openAndType();
  fireEvent.press(r.getByText(t.highlights.save));
  await waitFor(() =>
    expect(mockToast.success).toHaveBeenCalledWith(t.highlights.saved),
  );
  expect(mockQueueWrite).toHaveBeenCalledTimes(1);
  expect(r.queryByDisplayValue('nota nueva importante')).toBeNull();
});

it('the row deleted under the editor: Save tells the reader and keeps the draft', async () => {
  const r = await openAndType();
  // A sync pull applied the delete from another device.
  table.length = 0;
  await act(async () => {
    fireEvent.press(r.getByText(t.highlights.save));
    await new Promise(res => setTimeout(res, 20));
  });
  expect(mockToast.error).toHaveBeenCalledWith(t.highlights.saveError);
  expect(mockToast.success).not.toHaveBeenCalled();
  expect(mockQueueWrite).not.toHaveBeenCalled();
  expect(r.getByDisplayValue('nota nueva importante')).toBeTruthy();
  expect(unhandled).toEqual([]);
});
