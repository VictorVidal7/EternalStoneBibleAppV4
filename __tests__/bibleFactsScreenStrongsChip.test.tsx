/**
 * Tanda 8 — "sabías qué" Strong's tap-through. The fact card's existing
 * bottom action row grows an optional second chip (reusing verseChip's
 * exact style, per the ticket) that jumps to the visual concordance,
 * `/features/word-study?strongs=<value>`, mirroring the deep-link shape
 * `OriginalLanguagesSheet.handleOpenWordStudy` already uses.
 *
 * Two things to get right per the spec:
 *  - The chip only exists once a card is expanded (factBottomRow lives
 *    inside the `isOpen &&` block), so every assertion here expands the
 *    card first via its header (labelled by the fact's `item.label`).
 *  - `getDailyFact()` rotates by day-of-year, so the hero card (untouched by
 *    this ticket) would render a different fact on different days — every
 *    assertion below is scoped to a specific fact's OWN card in the
 *    browsable index, never a global "how many chips" count, so the suite
 *    can't flake as the calendar moves.
 */
import {render, fireEvent} from '@testing-library/react-native';
import BibleFactsScreen from '../app/features/facts/index';

const mockPush = jest.fn();
const mockBack = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({push: mockPush, back: mockBack}),
  Stack: {Screen: () => null},
}));

jest.mock('@expo/vector-icons', () => ({
  Ionicons: () => null,
}));

jest.mock('expo-linear-gradient', () => {
  const {View: RNView} = require('react-native');
  return {LinearGradient: RNView};
});

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({top: 0, bottom: 0, left: 0, right: 0}),
}));

jest.mock('@lib/haptics', () => ({
  haptics: {tap: jest.fn(), success: jest.fn(), error: jest.fn()},
}));

const mockColors = {
  background: '#000000',
  card: '#111111',
  border: '#222222',
  primary: '#6366f1',
  primaryDark: '#4338ca',
  onPrimary: '#ffffff',
  text: '#ffffff',
  textSecondary: '#cccccc',
  textTertiary: '#999999',
};

jest.mock('@hooks/useTheme', () => ({
  useTheme: () => ({
    colors: mockColors,
    gradient: {headerColors: ['#000000', '#000000']},
    highContrast: false,
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

jest.mock('@lib/database', () => ({
  __esModule: true,
  default: {
    initialize: jest.fn(async () => undefined),
    getVerse: jest.fn(async () => ({text: 'mock verse text'})),
  },
}));

const es = require('../src/i18n/translations').translations.es;
const tf = es.bibleFacts;
const o = es.originals;

function renderScreen() {
  return render(<BibleFactsScreen />);
}

/** Expand a fact card by tapping its header (accessibilityLabel = item.label). */
function expandFact(utils: ReturnType<typeof renderScreen>, factId: string) {
  const label = tf.items[factId].label;
  fireEvent.press(utils.getByLabelText(label));
}

beforeEach(() => {
  mockPush.mockClear();
  mockBack.mockClear();
});

describe("Bible facts screen — Strong's tap-through chip (Tanda 8)", () => {
  it("renders a Strong's chip on a fact that has one (hesed → H2617) and navigates on tap", () => {
    const utils = renderScreen();
    expandFact(utils, 'hesed');

    const chipLabel = `${o.openWordStudy}: H2617`;
    const chip = utils.getByLabelText(chipLabel);
    expect(utils.getByText('H2617')).toBeTruthy();

    fireEvent.press(chip);
    expect(mockPush).toHaveBeenCalledWith('/features/word-study?strongs=H2617');
  });

  it('navigates with the exact deep-link format for a different fact (amen → H543)', () => {
    const utils = renderScreen();
    expandFact(utils, 'amen');

    fireEvent.press(utils.getByLabelText(`${o.openWordStudy}: H543`));
    expect(mockPush).toHaveBeenCalledWith('/features/word-study?strongs=H543');
  });

  it('is absent on a fact with no strongs field (selah), even though it is the same "language" category', () => {
    const utils = renderScreen();
    expandFact(utils, 'selah');

    expect(
      utils.queryByLabelText(new RegExp(`^${o.openWordStudy}:`)),
    ).toBeNull();
  });

  it('is absent on a fact outside language/commentary categories (dead-sea, geography)', () => {
    const utils = renderScreen();
    expandFact(utils, 'dead-sea');

    expect(
      utils.queryByLabelText(new RegExp(`^${o.openWordStudy}:`)),
    ).toBeNull();
  });

  it("does not render any Strong's chip before the card is expanded", () => {
    const utils = renderScreen();
    // 'hesed' card exists (collapsed) but its bottom action row — where the
    // chip lives — isn't mounted until expanded.
    expect(utils.getByLabelText(tf.items.hesed.label)).toBeTruthy();
    expect(utils.queryByLabelText(`${o.openWordStudy}: H2617`)).toBeNull();
  });
});
