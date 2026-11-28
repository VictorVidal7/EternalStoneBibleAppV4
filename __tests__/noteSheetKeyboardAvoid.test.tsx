/**
 * R9-561 — the note sheets move above the keyboard.
 *
 * The reader's note sheet (`NoteEditorModal`) is a transparent Modal pinned to
 * the bottom, and its input autofocuses: the keyboard opens with the sheet and
 * covered the field and SAVE (measured on Android 16). The gallery's highlight
 * editor (`highlights.tsx`) has the same root: the keyboard covered the note
 * field and Cancel/Save. The sibling sheets (`AddToCollectionSheet`,
 * `RedeemCodeSheet`) wrap their backdrop in a `KeyboardAvoidingView`.
 *
 * What jest can see is the STRUCTURE: the field and the save action live
 * inside a `KeyboardAvoidingView` with a behavior, inside the Modal. That the
 * sheet really rises on a device is a live check (PENDIENTES-EN-VIVO).
 *
 * Lo REAL: `NoteEditorModal` and the whole highlights screen with the real
 * `HighlightService` over a fake SQL table. Lo sustituido: theme, language,
 * version, router, the share-image modals, sync.
 */
import {KeyboardAvoidingView, Modal} from 'react-native';
import {render, fireEvent, within} from '@testing-library/react-native';
import {NoteEditorModal} from '../src/components/reading/NoteEditorModal';
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
jest.mock('../src/components/reading/NoteImageModal', () => ({
  NoteImageModal: () => null,
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

/** The open Modal holds a KeyboardAvoidingView with a behavior, holding `node`. */
function expectKeyboardAvoiding(
  r: ReturnType<typeof render>,
  findInside: (scope: ReturnType<typeof within>) => unknown,
) {
  const open = r.UNSAFE_getAllByType(Modal).filter(m => m.props.visible);
  expect(open).toHaveLength(1);
  const avoiding = open[0].findAllByType(KeyboardAvoidingView);
  expect(avoiding).toHaveLength(1);
  expect(['padding', 'height']).toContain(avoiding[0].props.behavior);
  expect(findInside(within(avoiding[0]))).toBeTruthy();
}

describe('R9-561 — the note sheet of the reader', () => {
  it('the input and SAVE NOTE sit inside a KeyboardAvoidingView', () => {
    const r = render(
      <NoteEditorModal
        visible
        verseReference="Juan 3:16"
        verseText="Porque de tal manera amó Dios al mundo"
        value="una nota"
        onChangeText={jest.fn()}
        onSave={jest.fn()}
        onClose={jest.fn()}
      />,
    );
    expectKeyboardAvoiding(r, s => s.getByPlaceholderText(t.notes.placeholder));
    expectKeyboardAvoiding(r, s => s.getByText(t.notes.saveNote));
  });
});

describe('R9-561 — the highlight editor of the gallery (same root)', () => {
  beforeEach(() => {
    table.length = 0;
    table.push({
      id: 'h1',
      verse_id: 'Genesis_1_1',
      book_id: 'Genesis',
      chapter: 1,
      verse: 1,
      color: '#FFF59D',
      category: null,
      note: 'nota vieja',
      created_at: 1,
      updated_at: 1,
    });
  });

  it('the note field and Cancel/Save sit inside a KeyboardAvoidingView', async () => {
    const r = render(<HighlightsScreen />);
    const edit = await r.findAllByLabelText(t.edit);
    fireEvent.press(edit[0]);
    await r.findByDisplayValue('nota vieja');
    expectKeyboardAvoiding(r, s => s.getByDisplayValue('nota vieja'));
    expectKeyboardAvoiding(r, s => s.getByText(t.highlights.save));
    expectKeyboardAvoiding(r, s => s.getByText(t.cancel));
  });
});
