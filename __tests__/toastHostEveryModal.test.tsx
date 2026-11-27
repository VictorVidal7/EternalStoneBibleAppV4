/**
 * R9-637 — every react-native `Modal` in a file that fires toasts mounts a
 * `<ToastHost />` inside it.
 *
 * The toast is a plain View of the window that draws it; a native Modal is
 * another window on top. Without a host inside the modal, a toast fired with
 * it open is drawn behind it (R9-560, `ToastLayer.tsx`). 22 files had a
 * `<Modal` and `useToast` but no host (S183's search: `src/` and `app/`).
 *
 * Part 1, the guard: it reads the source of `src/` and `app/` and checks
 * EACH `<Modal ...>` up to its `</Modal>`, not just the file, so a screen with
 * three modals cannot pass with one host. It cannot see a Modal that lives in
 * a child component (e.g. a sheet that only renders a Modal): those are the
 * child's own business, and are reported, not guarded here.
 *
 * Part 2: the flagship case with the REAL ToastProvider — the highlight
 * editor's save error (R9-415) is drawn inside the editor's Modal.
 */
import * as fs from 'fs';
import * as path from 'path';
import {Modal} from 'react-native';
import {render, fireEvent, act, within} from '@testing-library/react-native';
import {ToastProvider} from '../src/context/ToastContext';
import HighlightsScreen from '../app/(tabs)/highlights';
import {HighlightService} from '../src/lib/highlights/HighlightService';
import {translations} from '../src/i18n/translations';

const ROOT = path.join(__dirname, '..');

/**
 * Files the search matches that need no host, each with the reason. The
 * reason is checked below: an exception that stops being true fails.
 */
const EXCEPTIONS: Record<string, string> = {
  'app/features/journey/index.tsx':
    'its only "<Modal" is in the header comment ("This is a ROUTE, not a ' +
    'react-native <Modal>"); it renders no Modal of its own',
};

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, {withFileTypes: true})) {
    if (entry.name === 'node_modules') continue;
    if (entry.name === '__tests__' || entry.name === '__mocks__') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (/\.tsx?$/.test(entry.name) && !/\.test\.tsx?$/.test(entry.name))
      out.push(full);
  }
  return out;
}

const MODAL_OPEN = /<Modal[\s>]/g;

function rel(file: string): string {
  return path.relative(ROOT, file).split(path.sep).join('/');
}

function stripComments(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
}

/** S183's search: a `<Modal` and `useToast` in the same file. */
function candidates(): {file: string; src: string}[] {
  const files = [
    ...walk(path.join(ROOT, 'src')),
    ...walk(path.join(ROOT, 'app')),
  ];
  return files
    .map(file => ({file: rel(file), src: fs.readFileSync(file, 'utf8')}))
    .filter(
      ({src}) =>
        new RegExp(MODAL_OPEN.source).test(src) && /useToast/.test(src),
    );
}

describe('R9-637 — the guard', () => {
  it('every <Modal> in a file that uses useToast holds a <ToastHost /> before its </Modal>', () => {
    const missing: string[] = [];
    for (const {file, src} of candidates()) {
      if (file in EXCEPTIONS) continue;
      for (const m of src.matchAll(MODAL_OPEN)) {
        const start = m.index ?? 0;
        const line = src.slice(0, start).split('\n').length;
        const end = src.indexOf('</Modal>', start);
        if (end < 0) {
          missing.push(`${file}:${line} (no </Modal>)`);
          continue;
        }
        if (!src.slice(start, end).includes('<ToastHost')) {
          missing.push(`${file}:${line}`);
        }
      }
    }
    expect(missing).toEqual([]);
  });

  it('every exception is still matched by the search and its reason still holds', () => {
    const matched = new Set(candidates().map(c => c.file));
    for (const file of Object.keys(EXCEPTIONS)) {
      expect({file, matched: matched.has(file)}).toEqual({
        file,
        matched: true,
      });
      const src = fs.readFileSync(path.join(ROOT, file), 'utf8');
      // The reason above: no Modal once the comments are gone.
      expect({
        file,
        modal: new RegExp(MODAL_OPEN.source).test(stripComments(src)),
      }).toEqual({file, modal: false});
    }
  });
});

// ---- Part 2: the highlight editor, with the REAL ToastProvider -----------

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

describe('R9-637 — the highlight editor', () => {
  beforeEach(() => {
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

  it('the save error, fired with the editor open, is drawn inside the editor Modal, once', async () => {
    const r = render(
      <ToastProvider>
        <HighlightsScreen />
      </ToastProvider>,
    );
    const edit = await r.findAllByLabelText(t.edit);
    fireEvent.press(edit[0]);
    await r.findByDisplayValue('nota vieja');
    // A sync pull applied a delete made on another device.
    table.length = 0;
    await act(async () => {
      fireEvent.press(r.getByText(t.highlights.save));
      await new Promise(res => setTimeout(res, 20));
    });
    const open = r.UNSAFE_getAllByType(Modal).filter(m => m.props.visible);
    expect(open).toHaveLength(1);
    // The editor is still open (R9-415) and the toast is in its window.
    expect(within(open[0]).getByText(t.highlights.saveError)).toBeTruthy();
    expect(r.getAllByText(t.highlights.saveError)).toHaveLength(1);
  });
});
