/**
 * Memory practice screen — "Practicar sin calificar" (free practice) and
 * "Repetir" (repeat).
 *
 * Free practice (`?free=1`, optionally `&verseKey=...`) lets the user
 * practice ANY card at ANY time, not just what's currently due — the
 * queue seeds from the whole deck (`cards`) instead of `dueCards`, and
 * the session is entirely ungraded: no grade buttons, no `reviewCard`
 * call, just a "Siguiente" advance through local component state. This
 * is deliberately verified end-to-end (not just source-scanned) because
 * the hard constraint is "zero calls into reviewCard from this path" —
 * a real render + real presses is the strongest evidence of that.
 *
 * "Repetir" (on the done screen) replays the SAME frozen queue from the
 * start, in the SAME recall mode — but ALWAYS ungraded on the replay, even
 * if the session that just finished was graded. This is deliberate: the
 * frozen `queue` array is a snapshot, but `reviewCard` mutates the LIVE
 * deck keyed by verseKey — grading a replay would silently apply a SECOND
 * review to a card already reviewed this sitting (double box jump, a
 * near-zero-interval review event skewing retention/ease calibration for
 * future cards, double-counted daily goal/streak). Only the first pass's
 * grades (already applied before Repetir is ever pressed) are graded.
 */
import {render, fireEvent} from '@testing-library/react-native';
import MemoryPracticeScreen from '../app/features/memory/practice';
import {translations} from '../src/i18n/translations';
import {buildVerseKey, createCard} from '../src/lib/memory/srs';

let mockDueCards: ReturnType<typeof createCard>[] = [];
let mockCards: ReturnType<typeof createCard>[] = [];
let mockParams: {free?: string; verseKey?: string} = {};
const mockReviewCard = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({back: jest.fn()}),
  useLocalSearchParams: () => mockParams,
  Stack: {Screen: () => null},
}));

jest.mock('@expo/vector-icons', () => ({Ionicons: () => null}));

jest.mock('expo-linear-gradient', () => {
  const {View} = require('react-native');
  return {LinearGradient: View};
});

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({top: 0, bottom: 0, left: 0, right: 0}),
}));

jest.mock('@lib/haptics', () => ({
  haptics: {
    tap: jest.fn(),
    press: jest.fn(),
    success: jest.fn(),
    warning: jest.fn(),
  },
}));

jest.mock('@components/MemoryGuideModal', () => ({
  MemoryGuideModal: () => null,
}));

jest.mock('@hooks/useTheme', () => ({
  useTheme: () => ({
    gradient: undefined,
    colors: {
      background: '#000000',
      surface: '#111111',
      border: '#222222',
      primary: '#6366f1',
      onPrimary: '#ffffff',
      success: '#22c55e',
      error: '#ef4444',
      warning: '#f59e0b',
      text: '#ffffff',
      textSecondary: '#cccccc',
      textTertiary: '#999999',
    },
  }),
}));

jest.mock('@hooks/useLanguage', () => ({
  useLanguage: () => ({
    language: 'es',
    t: require('../src/i18n/translations').translations.es,
  }),
}));

jest.mock('@hooks/useBibleVersion', () => ({
  useBibleVersion: () => ({
    selectedVersion: {id: 'RVR1960', language: 'es', abbreviation: 'RVR1960'},
  }),
}));

jest.mock('@context/MemoryDeckContext', () => ({
  useMemoryDeck: () => ({
    dueCards: mockDueCards,
    cards: mockCards,
    reviewCard: mockReviewCard,
  }),
}));

jest.mock('@context/FavoritesContext', () => ({
  useFavorites: () => ({
    favorites: [],
    addFavorite: jest.fn().mockResolvedValue(undefined),
    removeFavorite: jest.fn().mockResolvedValue(undefined),
  }),
}));

jest.mock('@context/ToastContext', () => ({
  useToast: () => ({
    success: jest.fn(),
    info: jest.fn(),
    error: jest.fn(),
    warning: jest.fn(),
  }),
}));

const p = translations.es.memory.practice;
const top = translations.es;

// Each card gets a DISTINCT book/chapter/verse (not just a distinct
// verseKey string) so tests can assert on the rendered reference and
// actually prove which card ended up in the queue — two cards sharing the
// same displayed "Juan 3:16" would make a wrong-card bug invisible.
const JUAN_3_16 = {bookName: 'Juan', chapter: 3, verse: 16};
const MATEO_1_1 = {bookName: 'Mateo', chapter: 1, verse: 1};

const makeCard = (
  box: 1 | 2 | 3 | 4 | 5,
  ref: {bookName: string; chapter: number; verse: number} = JUAN_3_16,
  text?: string,
) => ({
  ...createCard({
    verseKey: buildVerseKey(ref.bookName, ref.chapter, ref.verse),
    bookName: ref.bookName,
    chapter: ref.chapter,
    verse: ref.verse,
    text: text ?? 'Porque de tal manera amó Dios al mundo',
    version: 'RVR1960',
    now: new Date().toISOString(),
  }),
  box,
});

beforeEach(() => {
  mockReviewCard.mockClear();
  mockParams = {};
  mockDueCards = [];
  mockCards = [];
});

describe('Memory practice — free practice (?free=1)', () => {
  it('seeds the queue from the WHOLE deck (cards), not dueCards, when no verseKey is given', () => {
    mockDueCards = []; // nothing due
    mockCards = [makeCard(1, JUAN_3_16), makeCard(1, MATEO_1_1)];
    mockParams = {free: '1'};

    const {getByText} = render(<MemoryPracticeScreen />);

    expect(
      getByText(
        p.progress.replace('{{current}}', '1').replace('{{total}}', '2'),
      ),
    ).toBeTruthy();
  });

  it('seeds the queue with the CORRECT single card when verseKey is provided, ignoring the rest of the deck', () => {
    mockCards = [makeCard(1, JUAN_3_16), makeCard(1, MATEO_1_1)];
    mockParams = {
      free: '1',
      verseKey: buildVerseKey(
        MATEO_1_1.bookName,
        MATEO_1_1.chapter,
        MATEO_1_1.verse,
      ),
    };

    const {getByText} = render(<MemoryPracticeScreen />);

    expect(
      getByText(
        p.progress.replace('{{current}}', '1').replace('{{total}}', '1'),
      ),
    ).toBeTruthy();
    // Proves it's the RIGHT card, not just that total===1 — two cards that
    // happened to share a rendered reference would make a wrong-card pick
    // invisible to a count-only assertion.
    expect(getByText('Mateo 1:1')).toBeTruthy();
  });

  it('falls back to the whole deck if verseKey matches no card (e.g. removed between navigating and mount)', () => {
    mockCards = [makeCard(1, JUAN_3_16), makeCard(1, MATEO_1_1)];
    mockParams = {free: '1', verseKey: 'Nonexistent/9/9'};

    const {getByText, queryByText} = render(<MemoryPracticeScreen />);

    // Degrades to practicing the whole deck instead of an instant
    // "session complete" (queue would otherwise be empty).
    expect(
      getByText(
        p.progress.replace('{{current}}', '1').replace('{{total}}', '2'),
      ),
    ).toBeTruthy();
    expect(queryByText(p.done)).toBeNull();
  });

  it('defaults to a non-reveal recall mode, so even a box-1 card poses a real recall step', () => {
    // In the default GRADED 'reveal' mode a box-1 card skips the reveal
    // step entirely (nothing is masked) — see memoryPracticeReveal.test.
    // Free mode must default elsewhere so this isn't trivial.
    mockCards = [makeCard(1, JUAN_3_16)];
    mockParams = {free: '1'};

    const {queryByText} = render(<MemoryPracticeScreen />);

    expect(queryByText(p.reveal)).not.toBeNull();
    expect(queryByText(p.again)).toBeNull();
  });

  it('shows the free-mode disclaimer caption', () => {
    mockCards = [makeCard(1, JUAN_3_16)];
    mockParams = {free: '1'};

    const {queryByText} = render(<MemoryPracticeScreen />);

    expect(queryByText(p.freeModeCaption)).not.toBeNull();
  });

  it('does NOT show the disclaimer caption in a normal graded session', () => {
    mockDueCards = [makeCard(1, JUAN_3_16)];
    mockParams = {};

    const {queryByText} = render(<MemoryPracticeScreen />);

    expect(queryByText(p.freeModeCaption)).toBeNull();
  });

  it('hides the grade buttons, shows "Siguiente" instead, and NEVER calls reviewCard', () => {
    mockCards = [makeCard(3, JUAN_3_16)]; // masked box, goes through reveal
    mockParams = {free: '1'};

    const {getByText, queryByText} = render(<MemoryPracticeScreen />);

    fireEvent.press(getByText(p.reveal));

    expect(queryByText(p.again)).toBeNull();
    expect(queryByText(p.hard)).toBeNull();
    expect(queryByText(p.good)).toBeNull();
    expect(queryByText(p.easy)).toBeNull();
    expect(getByText(top.next)).toBeTruthy();

    fireEvent.press(getByText(top.next));

    expect(mockReviewCard).not.toHaveBeenCalled();
  });

  it('advances to the done state after "Siguiente" on the last card, still without grading', () => {
    mockCards = [makeCard(1, JUAN_3_16)];
    mockParams = {free: '1'};

    const {getByText, queryByText} = render(<MemoryPracticeScreen />);

    // Box-1 in a non-reveal mode still requires a reveal step.
    fireEvent.press(getByText(p.reveal));
    fireEvent.press(getByText(top.next));

    expect(queryByText(p.done)).not.toBeNull();
    expect(mockReviewCard).not.toHaveBeenCalled();
  });
});

describe('Memory practice — "Repetir" (repeat)', () => {
  it('graded session: the FIRST pass grades normally, but Repetir switches the REPLAY to ungraded — no double-grading', () => {
    // Two cards so the assertion proves reviewCard is never called again
    // for ANY card in the second pass, not just coincidentally skipped for
    // the one card a narrower test might have picked.
    mockDueCards = [makeCard(1, JUAN_3_16), makeCard(1, MATEO_1_1)];
    mockParams = {};

    const {getByText, queryByText} = render(<MemoryPracticeScreen />);

    // Box-1 cards in default 'reveal' mode skip straight to grading.
    fireEvent.press(getByText(p.again)); // grades card 1
    fireEvent.press(getByText(p.easy)); // grades card 2
    expect(queryByText(p.done)).not.toBeNull();
    expect(mockReviewCard).toHaveBeenCalledTimes(2);

    fireEvent.press(getByText(p.repeat));

    // Back at the active card, but now UNGRADED: grade buttons are gone,
    // and the free-mode disclaimer appears even though this session
    // started graded — reviewCard mutates the live deck by verseKey, so
    // grading these same two cards again here would silently double-apply
    // a review already recorded this sitting.
    expect(queryByText(p.done)).toBeNull();
    expect(queryByText(p.again)).toBeNull();
    expect(queryByText(p.freeModeCaption)).not.toBeNull();

    // Advance through BOTH cards again via "Siguiente".
    fireEvent.press(getByText(top.next));
    fireEvent.press(getByText(top.next));

    expect(queryByText(p.done)).not.toBeNull();
    // Still exactly 2 — the replay never graded either card again.
    expect(mockReviewCard).toHaveBeenCalledTimes(2);
  });

  it('free session: Repetir replays the same queue and STAYS ungraded', () => {
    mockCards = [makeCard(1, JUAN_3_16)];
    mockParams = {free: '1'};

    const {getByText, queryByText} = render(<MemoryPracticeScreen />);

    fireEvent.press(getByText(p.reveal));
    fireEvent.press(getByText(top.next));
    expect(queryByText(p.done)).not.toBeNull();

    fireEvent.press(getByText(p.repeat));

    expect(queryByText(p.done)).toBeNull();
    // Still ungraded — no grade buttons, "Siguiente" still drives it.
    expect(queryByText(p.again)).toBeNull();
    fireEvent.press(getByText(p.reveal));
    expect(getByText(top.next)).toBeTruthy();

    expect(mockReviewCard).not.toHaveBeenCalled();
  });
});
