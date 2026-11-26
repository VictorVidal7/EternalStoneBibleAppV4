/**
 * R9-511 — a devotional whose notes pass CAL_NOTES_TOTAL_MAX (12 000) used to
 * be shared cut (makeCalBundle trims silently), saved cut in "Tus devocionales",
 * and its draft removed: the text that didn't fit was gone from the phone.
 * Now «Compartir» refuses with a toast that says how much is over, and the
 * draft stays. The real screen, the real bundle and the real draft parser
 * (from the S129 probe, agent 5).
 */
import {Share} from 'react-native';
import {
  render,
  screen,
  fireEvent,
  act,
  waitFor,
} from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

jest.mock('react-native-safe-area-context', () => {
  const actual = jest.requireActual('react-native-safe-area-context');
  return {
    ...actual,
    useSafeAreaInsets: () => ({top: 0, bottom: 0, left: 0, right: 0}),
  };
});
jest.mock('@expo/vector-icons', () => ({Ionicons: () => null}));
jest.mock('expo-linear-gradient', () => {
  const {View} = require('react-native');
  return {LinearGradient: View};
});
jest.mock('@lib/haptics', () => ({
  haptics: {
    tap: jest.fn(),
    success: jest.fn(),
    error: jest.fn(),
    press: jest.fn(),
    selection: jest.fn(),
  },
}));
jest.mock('@lib/database', () => {
  const db: any = new Proxy(
    {},
    {
      get: (_t, k) =>
        k === '__esModule' ? undefined : jest.fn(async () => null),
    },
  );
  return {__esModule: true, default: db, bibleDB: db};
});
const mockColors = new Proxy({}, {get: () => '#123456'});
const mockTheme = {
  isDark: false,
  colors: mockColors,
  gradient: {headerColors: ['#000', '#111']},
  highContrast: false,
};
jest.mock('@hooks/useTheme', () => ({useTheme: () => mockTheme}));
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
const mockTr = require('@/i18n/translations').translations;
const mockLang: any = {language: 'es', t: mockTr.es, setLanguage: jest.fn()};
jest.mock('@hooks/useLanguage', () => ({useLanguage: () => mockLang}));
const mockToast = {
  success: jest.fn(),
  info: jest.fn(),
  error: jest.fn(),
  show: jest.fn(),
  warning: jest.fn(),
};
jest.mock('@context/ToastContext', () => ({useToast: () => mockToast}));
jest.mock('expo-router', () => ({
  Stack: {Screen: () => null},
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    canGoBack: () => true,
  }),
  useLocalSearchParams: () => ({}),
}));
jest.mock('@components/FeatureGuideModal', () => ({
  FeatureGuideModal: () => null,
}));

const {
  decodeTogetherParam,
  todayDateISO,
  DEVOTIONAL_DRAFT_KEY,
  DEVOTIONAL_SAVED_KEY,
  parseSavedDevotionals,
} = require('@lib/together');
const Devotional = require('../app/features/devotional/index').default;

const db = mockTr.es.devotionalBuilder;

const tick = () =>
  act(async () => {
    await new Promise(r => setTimeout(r, 0));
  });

/** A note of exactly `len` characters that trim() leaves whole. */
const note = (i: number, len = 280) =>
  ('Día ' + i + ': ' + 'palabra '.repeat(60)).slice(0, len - 1) + '.';

let shareSpy: jest.SpyInstance;
beforeEach(async () => {
  mockToast.error.mockClear();
  mockToast.info.mockClear();
  shareSpy = jest
    .spyOn(Share, 'share')
    .mockResolvedValue({action: 'sharedAction'} as any);
  await AsyncStorage.clear();
});
afterEach(() => shareSpy.mockRestore());

async function openWith(notes: string[]) {
  const title = 'Cuaresma ' + notes.length;
  const draft = {
    title,
    startDate: todayDateISO(),
    days: notes.map((n, i) => ({
      bookId: 43,
      chapter: 1 + (i % 21),
      verse: 1,
      note: n,
    })),
  };
  await AsyncStorage.setItem(DEVOTIONAL_DRAFT_KEY, JSON.stringify(draft));
  const r = render(<Devotional />);
  await waitFor(() => expect(screen.getByDisplayValue(title)).toBeTruthy());
  return r;
}

async function share(notes: string[]) {
  const r = await openWith(notes);
  fireEvent.press(screen.getByLabelText(db.share));
  await tick();
  r.unmount();
  await tick();
  const call = shareSpy.mock.calls[shareSpy.mock.calls.length - 1];
  const link = call
    ? ((call[0].message as string).match(/https:\/\/\S+/) || [''])[0]
    : '';
  const res = link ? decodeTogetherParam(link.split('#d=')[1]) : null;
  return {
    shared: shareSpy.mock.calls.length,
    sharedChars:
      res && res.ok
        ? res.bundle.d.reduce(
            (s: number, x: any) => s + (x.n ? x.n.length : 0),
            0,
          )
        : null,
    saved: parseSavedDevotionals(
      await AsyncStorage.getItem(DEVOTIONAL_SAVED_KEY),
    ).length,
    draftAfter: await AsyncStorage.getItem(DEVOTIONAL_DRAFT_KEY),
    errors: mockToast.error.mock.calls.map(c => c[0]),
  };
}

describe('R9-511 — devotional notes over the 12 000 budget', () => {
  it('50 × 280 (14 000): no share, no saved entry, the draft stays, the toast says 2 000', async () => {
    const out = await share(Array.from({length: 50}, (_, i) => note(i + 1)));
    expect(out.shared).toBe(0);
    expect(out.saved).toBe(0);
    expect(out.draftAfter).not.toBeNull();
    expect(out.errors).toEqual([db.notesOverLimit.replace('{{n}}', '2000')]);
  });

  it('control: 30 × 280 (8 400) travel whole, and the draft is cleared', async () => {
    const out = await share(Array.from({length: 30}, (_, i) => note(i + 1)));
    expect(out.errors).toEqual([]);
    expect(out.shared).toBe(1);
    expect(out.sharedChars).toBe(8400);
    expect(out.saved).toBe(1);
    expect(out.draftAfter).toBeNull();
  });

  it('edge: 42 × 280 + 240 = exactly 12 000 is shared without a warning', async () => {
    const notes = Array.from({length: 42}, (_, i) => note(i + 1));
    notes.push(note(43, 240));
    const out = await share(notes);
    expect(out.errors).toEqual([]);
    expect(out.shared).toBe(1);
    expect(out.sharedChars).toBe(12000);
    expect(out.draftAfter).toBeNull();
  });

  it('each note box stops where the budget ends, never below its own text', async () => {
    const notes = Array.from({length: 42}, (_, i) => note(i + 1));
    notes.push('');
    notes.push('');
    const r = await openWith(notes);
    const boxes = screen.getAllByPlaceholderText(db.notePlaceholder);
    expect(boxes[0].props.maxLength).toBe(280);
    expect(boxes[42].props.maxLength).toBe(240);
    fireEvent.changeText(boxes[42], note(43, 240));
    const after = screen.getAllByPlaceholderText(db.notePlaceholder);
    expect(after[43].props.maxLength).toBe(0);
    expect(after[42].props.maxLength).toBe(240);
    expect(after[0].props.maxLength).toBe(280);
    r.unmount();
  });

  it('a draft already over the budget keeps each box at its own length', async () => {
    const r = await openWith(Array.from({length: 50}, (_, i) => note(i + 1)));
    const boxes = screen.getAllByPlaceholderText(db.notePlaceholder);
    expect(boxes.map(b => b.props.maxLength)).toEqual(Array(50).fill(280));
    r.unmount();
  });
});
