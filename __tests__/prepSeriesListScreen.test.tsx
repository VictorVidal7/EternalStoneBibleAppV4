/**
 * T8.4.4 — "Series de predicación" list screen.
 *
 * Covers the premium gate (locked teaser for a free reader, opens the
 * offering sheet on tap; the real list once unlocked), creating a new
 * series (and navigating to its detail screen), progress display, the
 * MAX_SERIES limit warning, and the "attach mode" that lets the prep table
 * add its CURRENT passage to a series (or a brand-new one) via a
 * `passageKey` route param.
 *
 * Uses the REAL PremiumProvider (toggled via the SecureStore-backed
 * entitlement cache, like prepHistoryScreen.test.tsx) and the REAL
 * prepSeries/prepNotes stores (seeded through AsyncStorage's global jest
 * mock) rather than hand-mocking either — only the offering sheet, toast,
 * and navigation/theme plumbing are mocked.
 */
import {render, fireEvent, waitFor} from '@testing-library/react-native';
import {StyleSheet} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import PrepSeriesListScreen from '../app/features/prep/series/index';
import {PremiumProvider} from '../src/context/PremiumContext';
import {ENTITLEMENT_CACHE_KEY} from '../src/lib/offering/entitlementCache';
import {
  MAX_SERIES,
  serializePrepSeriesMap,
  type PrepSeriesMap,
} from '../src/features/study/prepSeries';
import {serializePrepNotesMap} from '../src/features/study/prepNotes';
import type {PrepNotesMap} from '../src/features/study/prepNotes';
import {translations} from '../src/i18n/translations';

const PREP_SERIES_KEY = '@prep_series';
const PREP_NOTES_KEY = '@prep_notes';

// RN's own TouchableOpacity drives its press/disabled feedback through an
// internal Animated.Value; under react-test-renderer that occasionally
// throws "Unable to locate attached view in the native tree" once a modal
// opens a fresh TextInput/button and a subsequent state update (typing,
// re-render) touches that Animated node before it's ever attached to a real
// native view. Swapping it for Pressable (no internal Animated opacity) for
// this suite keeps press/style/accessibility behavior but sidesteps that
// test-renderer-only failure mode entirely.
jest.mock(
  'react-native/Libraries/Components/Touchable/TouchableOpacity',
  () => {
    const ReactActual = require('react');
    const {Pressable} = jest.requireActual('react-native');
    const MockTouchableOpacity = ReactActual.forwardRef(
      ({children, ...props}: Record<string, unknown>, ref: unknown) =>
        ReactActual.createElement(Pressable, {...props, ref}, children),
    );
    return {__esModule: true, default: MockTouchableOpacity};
  },
);

const mockPush = jest.fn();
const mockBack = jest.fn();
let mockParams: {passageKey?: string} = {};

jest.mock('expo-router', () => {
  const ReactActual = require('react');
  return {
    useRouter: () => ({push: mockPush, back: mockBack}),
    useLocalSearchParams: () => mockParams,
    // A dependency-aware stand-in for the real useFocusEffect: reruns only
    // when the callback identity changes (mirrors real focus/dep behavior)
    // rather than on every render — a naive `cb()`-per-render mock would
    // re-fire `load()` on every keystroke in this screen's inputs and race
    // itself.
    useFocusEffect: (cb: () => void) => ReactActual.useEffect(cb, [cb]),
    Stack: {Screen: () => null},
  };
});

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
  surface: '#111111',
  overlay: 'rgba(0,0,0,0.5)',
  error: '#ff0000',
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

const mockToast = {
  success: jest.fn(),
  error: jest.fn(),
  warning: jest.fn(),
  info: jest.fn(),
  show: jest.fn(),
};
jest.mock('@context/ToastContext', () => ({
  useToast: () => mockToast,
}));

const h = translations.es.prepSeries;
const offering = translations.es.offering;

function renderScreen() {
  return render(
    <PremiumProvider>
      <PrepSeriesListScreen />
    </PremiumProvider>,
  );
}

async function seedSeries(map: PrepSeriesMap) {
  await AsyncStorage.setItem(PREP_SERIES_KEY, serializePrepSeriesMap(map));
}

async function seedNotes(map: PrepNotesMap) {
  await AsyncStorage.setItem(PREP_NOTES_KEY, serializePrepNotesMap(map));
}

async function unlockPremium() {
  await SecureStore.setItemAsync(ENTITLEMENT_CACHE_KEY, 'true');
}

describe('PrepSeriesListScreen — T8.4.4', () => {
  beforeEach(async () => {
    mockPush.mockClear();
    mockBack.mockClear();
    mockOpenOfferingSheet.mockClear();
    mockToast.success.mockClear();
    mockToast.warning.mockClear();
    mockParams = {};
    await AsyncStorage.removeItem(PREP_SERIES_KEY);
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

  it('shows the empty state for a premium reader with no series', async () => {
    await unlockPremium();
    const {findByText} = renderScreen();
    expect(await findByText(h.emptyTitle)).toBeTruthy();
  });

  it('creates a new series and navigates to its detail screen', async () => {
    await unlockPremium();
    const {findByLabelText, findByPlaceholderText, findByText} = renderScreen();
    // Settle on the premium empty state first — interacting before the
    // premium-flip + initial load fully settle can hit a transitional
    // render.
    await findByText(h.emptyTitle);
    fireEvent.press(await findByLabelText(h.newSeries));
    const input = await findByPlaceholderText(h.namePlaceholder);
    fireEvent.changeText(input, 'Efesios en 8 semanas');
    fireEvent.press(await findByText(h.create));

    await waitFor(() => expect(mockPush).toHaveBeenCalledTimes(1));
    const [path] = mockPush.mock.calls[0];
    expect(path).toMatch(/^\/features\/prep\/series\/series_/);
  });

  it('lists an existing series with its progress', async () => {
    await unlockPremium();
    await seedSeries({
      s1: {
        id: 's1',
        name: 'Efesios',
        passageKeys: ['John/3/16', 'Romans/8/28'],
        createdAt: 1,
        updatedAt: 100,
      },
    });
    await seedNotes({
      'John/3/16': {sections: {context: 'Notas'}, updatedAt: 1},
    });

    const {findByText} = renderScreen();
    expect(await findByText('Efesios')).toBeTruthy();
    expect(
      await findByText(
        h.progress.replace('{{started}}', '1').replace('{{total}}', '2'),
      ),
    ).toBeTruthy();
  });

  it('shows progressEmpty for a series with no passages', async () => {
    await unlockPremium();
    await seedSeries({
      s1: {
        id: 's1',
        name: 'Vacía',
        passageKeys: [],
        createdAt: 1,
        updatedAt: 1,
      },
    });
    const {findByText} = renderScreen();
    expect(await findByText(h.progressEmpty)).toBeTruthy();
  });

  it('opens an existing series on tap (normal, non-attach mode)', async () => {
    await unlockPremium();
    await seedSeries({
      s1: {
        id: 's1',
        name: 'Efesios',
        passageKeys: [],
        createdAt: 1,
        updatedAt: 1,
      },
    });
    const {findByText} = renderScreen();
    fireEvent.press(await findByText('Efesios'));
    expect(mockPush).toHaveBeenCalledWith('/features/prep/series/s1');
  });

  it('shows a limit warning instead of the create modal at MAX_SERIES', async () => {
    await unlockPremium();
    const map: PrepSeriesMap = {};
    for (let i = 0; i < MAX_SERIES; i++) {
      map[`s${i}`] = {
        id: `s${i}`,
        name: `Serie ${i}`,
        passageKeys: [],
        createdAt: i,
        updatedAt: i,
      };
    }
    await seedSeries(map);
    const {findByLabelText, queryByPlaceholderText} = renderScreen();
    fireEvent.press(await findByLabelText(h.newSeries));
    await waitFor(() => expect(mockToast.warning).toHaveBeenCalledTimes(1));
    expect(queryByPlaceholderText(h.namePlaceholder)).toBeNull();
  });

  describe('attach mode (adding the current passage to a series)', () => {
    beforeEach(() => {
      mockParams = {passageKey: 'John/3/16'};
    });

    it('shows the attach banner with the passage label', async () => {
      await unlockPremium();
      const {findByText} = renderScreen();
      expect(
        await findByText(h.attachTitle.replace('{{passage}}', 'Juan 3:16')),
      ).toBeTruthy();
    });

    it('opens the create modal when tapping the banner to make a new series', async () => {
      await unlockPremium();
      const {findByText} = renderScreen();
      // The banner (icon + text) is a tappable "create a new series" action —
      // not just decorative — so a user isn't forced to hunt for the header +.
      fireEvent.press(await findByText(h.attachBody));
      expect(await findByText(h.newSeriesModalTitle)).toBeTruthy();
    });

    it('adds the pending passage to a tapped series and goes back', async () => {
      await unlockPremium();
      await seedSeries({
        s1: {
          id: 's1',
          name: 'Efesios',
          passageKeys: [],
          createdAt: 1,
          updatedAt: 1,
        },
      });
      const {findByText} = renderScreen();
      fireEvent.press(await findByText('Efesios'));

      await waitFor(() => expect(mockBack).toHaveBeenCalledTimes(1));
      expect(mockToast.success).toHaveBeenCalledWith(
        h.addedToast.replace('{{name}}', 'Efesios'),
      );
    });

    it('dismisses the attach banner and browses normally afterward', async () => {
      await unlockPremium();
      await seedSeries({
        s1: {
          id: 's1',
          name: 'Efesios',
          passageKeys: [],
          createdAt: 1,
          updatedAt: 1,
        },
      });
      const {findByText, queryByText} = renderScreen();
      fireEvent.press(await findByText(h.attachDismiss));

      await waitFor(() =>
        expect(
          queryByText(h.attachTitle.replace('{{passage}}', 'Juan 3:16')),
        ).toBeNull(),
      );

      fireEvent.press(await findByText('Efesios'));
      expect(mockPush).toHaveBeenCalledWith('/features/prep/series/s1');
      expect(mockBack).not.toHaveBeenCalled();
    });
  });
});
