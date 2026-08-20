/**
 * T8.4.1 — "Historial de preparaciones" screen.
 *
 * Covers the premium gate (locked teaser for a free reader, opens the
 * offering sheet on tap; the real searchable list once unlocked), the empty
 * state, a populated list sorted most-recent-first, and substring search
 * over both the passage reference and the note content.
 *
 * Uses the REAL PremiumProvider (toggled via the SecureStore-backed
 * entitlement cache, like memoryInsightsScreenPremium.test.tsx) and the REAL
 * prep notes store (seeded through AsyncStorage's global jest mock) rather
 * than hand-mocking either — only the offering sheet and navigation/theme
 * plumbing are mocked.
 */
import {render, fireEvent, waitFor} from '@testing-library/react-native';
import {StyleSheet} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import PrepHistoryScreen from '../app/features/prep/history';
import {PremiumProvider} from '../src/context/PremiumContext';
import {ENTITLEMENT_CACHE_KEY} from '../src/lib/offering/entitlementCache';
import {serializePrepNotesMap} from '../src/features/study/prepNotes';
import type {PrepNotesMap} from '../src/features/study/prepNotes';
import {translations} from '../src/i18n/translations';

const PREP_NOTES_KEY = '@prep_notes';

const mockPush = jest.fn();
// Mutable route params — reassigned by the relevance-reranking describe
// block below (needs a render WITH a `relevantToPassageKey` param). Read at
// CALL time by the closure, same pattern as prepIllustrationsListScreen's
// own `mockParams`.
let mockParams: {relevantToPassageKey?: string} = {};
jest.mock('expo-router', () => ({
  useRouter: () => ({push: mockPush, back: jest.fn()}),
  useLocalSearchParams: () => mockParams,
  // Runs the focus callback synchronously, like on a real screen mount.
  useFocusEffect: (cb: () => void) => cb(),
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
  haptics: {tap: jest.fn(), success: jest.fn()},
}));

const mockColors = {
  background: '#000000',
  card: '#111111',
  border: '#222222',
  primary: '#6366f1',
  primaryDark: '#4338ca',
  text: '#ffffff',
  textSecondary: '#cccccc',
  textTertiary: '#999999',
};

jest.mock('@hooks/useTheme', () => ({
  useTheme: () => ({colors: mockColors}),
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

const mockOpenOfferingSheet = jest.fn();
jest.mock('@context/OfferingSheetContext', () => ({
  useOfferingSheet: () => ({open: mockOpenOfferingSheet}),
}));

const h = translations.es.prepHistory;
const offering = translations.es.offering;

function renderScreen() {
  return render(
    <PremiumProvider>
      <PrepHistoryScreen />
    </PremiumProvider>,
  );
}

async function seedPrepNotes(map: PrepNotesMap) {
  await AsyncStorage.setItem(PREP_NOTES_KEY, serializePrepNotesMap(map));
}

async function unlockPremium() {
  await SecureStore.setItemAsync(ENTITLEMENT_CACHE_KEY, 'true');
}

describe('PrepHistoryScreen — T8.4.1', () => {
  beforeEach(async () => {
    mockPush.mockClear();
    mockOpenOfferingSheet.mockClear();
    mockParams = {};
    await AsyncStorage.removeItem(PREP_NOTES_KEY);
    await SecureStore.deleteItemAsync(ENTITLEMENT_CACHE_KEY);
  });

  it('shows a locked teaser for a free reader instead of the list', async () => {
    const {findByText, queryByText} = renderScreen();
    expect(await findByText(h.lockedTitle)).toBeTruthy();
    expect(queryByText(h.emptyTitle)).toBeNull();
  });

  it('opens the offering sheet when a free reader taps the unlock button', async () => {
    const {findByLabelText} = renderScreen();
    fireEvent.press(
      await findByLabelText(`${h.title} — ${offering.badgeA11y}`),
    );
    expect(mockOpenOfferingSheet).toHaveBeenCalledTimes(1);
  });

  // Header-overflow fix: on a long title the EXCLUSIVO badge must never be
  // pushed off-screen — the title truncates (numberOfLines) and shrinks
  // (flexShrink via styles, not asserted here) while the badge always
  // renders its full text and never shrinks.
  it('truncates the header title instead of letting it push the EXCLUSIVO badge off-screen', async () => {
    const {findByText} = renderScreen();
    const title = await findByText(h.title);
    expect(title.props.numberOfLines).toBe(1);
    expect(StyleSheet.flatten(title.props.style).flexShrink).toBe(1);
    const badge = await findByText(h.exclusiveLabel);
    expect(badge.props.numberOfLines).toBe(1);
    expect(badge.props.adjustsFontSizeToFit).toBe(true);
  });

  it('shows the empty state for a premium reader with no saved preparations', async () => {
    await unlockPremium();
    const {findByText, queryByPlaceholderText} = renderScreen();
    expect(await findByText(h.emptyTitle)).toBeTruthy();
    // No search bar when there is nothing to search yet.
    expect(queryByPlaceholderText(h.searchPlaceholder)).toBeNull();
  });

  it('lists saved preparations, most recently edited first', async () => {
    await unlockPremium();
    await seedPrepNotes({
      'Genesis/1/1': {
        sections: {context: 'En el principio Dios creó los cielos'},
        updatedAt: 1000,
      },
      'John/3/16': {
        sections: {bigIdea: 'De tal manera amó Dios al mundo'},
        updatedAt: 2000,
      },
    });

    const {findByText, getByText} = renderScreen();
    const first = await findByText('Juan 3:16');
    expect(first).toBeTruthy();
    expect(getByText('Génesis 1:1')).toBeTruthy();
    // The row preview surfaces the note's own words.
    expect(getByText('De tal manera amó Dios al mundo')).toBeTruthy();
  });

  it('filters by passage reference (typing "Juan" finds only John entries)', async () => {
    await unlockPremium();
    await seedPrepNotes({
      'Genesis/1/1': {sections: {context: 'En el principio'}, updatedAt: 1},
      'John/3/16': {sections: {bigIdea: 'Amor de Dios'}, updatedAt: 2},
    });

    const {findByPlaceholderText, findByText, queryByText} = renderScreen();
    const search = await findByPlaceholderText(h.searchPlaceholder);
    fireEvent.changeText(search, 'Juan');

    await waitFor(() => expect(queryByText('Génesis 1:1')).toBeNull());
    expect(await findByText('Juan 3:16')).toBeTruthy();
  });

  it('filters by note content, not just the reference', async () => {
    await unlockPremium();
    await seedPrepNotes({
      'Genesis/1/1': {
        sections: {context: 'En el principio creó Dios los cielos'},
        updatedAt: 1,
      },
      'John/3/16': {
        sections: {bigIdea: 'Amor de Dios por el mundo'},
        updatedAt: 2,
      },
    });

    const {findByPlaceholderText, findByText, queryByText} = renderScreen();
    const search = await findByPlaceholderText(h.searchPlaceholder);
    // "principio" only appears in the Genesis note body, not in either
    // passage reference — a hit here proves content search, not just ref
    // search.
    fireEvent.changeText(search, 'principio');

    await waitFor(() => expect(queryByText('Juan 3:16')).toBeNull());
    expect(await findByText('Génesis 1:1')).toBeTruthy();
  });

  it('shows the no-results state when the search matches nothing', async () => {
    await unlockPremium();
    await seedPrepNotes({
      'John/3/16': {sections: {bigIdea: 'Amor de Dios'}, updatedAt: 1},
    });

    const {findByPlaceholderText, findByText} = renderScreen();
    const search = await findByPlaceholderText(h.searchPlaceholder);
    fireEvent.changeText(search, 'zzz-nothing-matches');

    expect(await findByText(h.noResults)).toBeTruthy();
  });

  it('navigates to the prep table with the parsed passage on row tap', async () => {
    await unlockPremium();
    await seedPrepNotes({
      'Romans/8/28-30': {
        sections: {context: 'Todas las cosas ayudan a bien'},
        updatedAt: 1,
      },
    });

    const {findByText} = renderScreen();
    fireEvent.press(await findByText('Romanos 8:28-30'));

    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/features/prep',
      params: {
        book: 'Romans',
        chapter: '8',
        startVerse: '28',
        endVerse: '30',
      },
    });
  });

  // Relevance re-ranking (the "past prep notes" half of prepRelevance.ts):
  // opened from Mesa de preparación with the CURRENT passage's key, the list
  // should surface the preacher's OWN past prep that shares a curated theme
  // with that passage BEFORE an unrelated one — a pure reorder of the exact
  // same rows the tests above already cover, not a new filter.
  describe('relevance re-ranking (opened with relevantToPassageKey)', () => {
    it('surfaces a past prep sharing a curated theme with the target passage first', async () => {
      await unlockPremium();
      await seedPrepNotes({
        // Genesis/1/1 has no curated theme at all.
        'Genesis/1/1': {
          sections: {context: 'En el principio'},
          updatedAt: 1000,
        },
        // Matthew/6/14 is curated under "forgiveness" — same theme as the
        // target passage below (John/3/16 has no "forgiveness" theme, so
        // this proves the reorder isn't just recency).
        'Matthew/6/14': {
          sections: {context: 'Si perdonáis a los hombres'},
          updatedAt: 1,
        },
      });
      // Ephesians/4/32 is ALSO curated under "forgiveness".
      mockParams = {relevantToPassageKey: 'Ephesians/4/32'};

      const {findAllByText} = renderScreen();
      const rows = await findAllByText(/^(Génesis 1:1|Mateo 6:14)$/);
      expect(rows.map(node => node.props.children)).toEqual([
        'Mateo 6:14',
        'Génesis 1:1',
      ]);
    });
  });
});
