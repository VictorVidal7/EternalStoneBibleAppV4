/**
 * Tanda 4 — "Banco de ilustraciones" list screen.
 *
 * Covers the premium gate (locked teaser for a free reader, opens the
 * offering sheet on tap; the real list once unlocked), creating a BLANK
 * illustration (navigates straight to its editor — no name-required modal,
 * unlike the sibling "Series de predicación" list), listing with category
 * badges, search, category-chip filtering, the MAX_ILLUSTRATIONS limit
 * warning, and delete-with-confirm.
 *
 * Mirrors prepSeriesListScreen.test.tsx's harness: the REAL PremiumProvider
 * (toggled via the SecureStore-backed entitlement cache) and the REAL
 * prepIllustrations store (seeded through AsyncStorage's global jest mock)
 * rather than hand-mocking either — only the offering sheet, toast, and
 * navigation/theme plumbing are mocked.
 */
import React from 'react';
import {render, fireEvent, waitFor} from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import PrepIllustrationsListScreen from '../app/features/prep/illustrations/index';
import {PremiumProvider} from '../src/context/PremiumContext';
import {ENTITLEMENT_CACHE_KEY} from '../src/lib/offering/entitlementCache';
import {
  MAX_ILLUSTRATIONS,
  serializePrepIllustrationsMap,
  type PrepIllustrationsMap,
} from '../src/features/study/prepIllustrations';
import {translations} from '../src/i18n/translations';

const PREP_ILLUSTRATIONS_KEY = '@prep_illustrations';

// Same TouchableOpacity → Pressable swap prepSeriesListScreen.test.tsx uses:
// react-test-renderer occasionally throws "Unable to locate attached view in
// the native tree" once a modal opens a fresh TextInput/button and a
// subsequent state update touches that Animated node before it's attached.
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

jest.mock('expo-router', () => {
  const ReactActual = require('react');
  return {
    useRouter: () => ({push: mockPush, back: mockBack}),
    useLocalSearchParams: () => ({}),
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

const h = translations.es.prepIllustrations;
const offering = translations.es.offering;

function renderScreen() {
  return render(
    <PremiumProvider>
      <PrepIllustrationsListScreen />
    </PremiumProvider>,
  );
}

async function seedIllustrations(map: PrepIllustrationsMap) {
  await AsyncStorage.setItem(
    PREP_ILLUSTRATIONS_KEY,
    serializePrepIllustrationsMap(map),
  );
}

async function unlockPremium() {
  await SecureStore.setItemAsync(ENTITLEMENT_CACHE_KEY, 'true');
}

describe('PrepIllustrationsListScreen — Tanda 4', () => {
  beforeEach(async () => {
    mockPush.mockClear();
    mockBack.mockClear();
    mockOpenOfferingSheet.mockClear();
    mockToast.success.mockClear();
    mockToast.warning.mockClear();
    await AsyncStorage.removeItem(PREP_ILLUSTRATIONS_KEY);
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

  it('shows the empty state for a premium reader with no illustrations', async () => {
    await unlockPremium();
    const {findByText} = renderScreen();
    expect(await findByText(h.emptyTitle)).toBeTruthy();
  });

  it('creates a BLANK illustration and navigates straight to its editor', async () => {
    await unlockPremium();
    const {findByLabelText, findByText} = renderScreen();
    await findByText(h.emptyTitle);
    fireEvent.press(await findByLabelText(h.newIllustration));

    await waitFor(() => expect(mockPush).toHaveBeenCalledTimes(1));
    const [path] = mockPush.mock.calls[0];
    expect(path).toMatch(/^\/features\/prep\/illustrations\/illustration_/);
  });

  it('lists an existing illustration with its category badge and body preview', async () => {
    await unlockPremium();
    await seedIllustrations({
      i1: {
        id: 'i1',
        title: 'El reloj y el relojero',
        body: 'Un argumento clásico de diseño',
        category: 'analogy',
        createdAt: 1,
        updatedAt: 100,
      },
    });
    const {findByText, findAllByText} = renderScreen();
    expect(await findByText('El reloj y el relojero')).toBeTruthy();
    // Appears twice: the filter chip AND the row's own category badge.
    expect(
      (await findAllByText(h.categories.analogy)).length,
    ).toBeGreaterThanOrEqual(2);
    expect(await findByText('Un argumento clásico de diseño')).toBeTruthy();
  });

  it('shows the untitled placeholder for a blank illustration', async () => {
    await unlockPremium();
    await seedIllustrations({
      i1: {
        id: 'i1',
        title: '',
        body: '',
        category: 'humor',
        createdAt: 1,
        updatedAt: 1,
      },
    });
    const {findByText} = renderScreen();
    expect(await findByText(h.untitled)).toBeTruthy();
  });

  it('opens an existing illustration on tap', async () => {
    await unlockPremium();
    await seedIllustrations({
      i1: {
        id: 'i1',
        title: 'Cita de Spurgeon',
        body: 'Sobre la oración',
        category: 'quote',
        createdAt: 1,
        updatedAt: 1,
      },
    });
    const {findByText} = renderScreen();
    fireEvent.press(await findByText('Cita de Spurgeon'));
    expect(mockPush).toHaveBeenCalledWith('/features/prep/illustrations/i1');
  });

  it('filters the search results by title/body substring', async () => {
    await unlockPremium();
    await seedIllustrations({
      i1: {
        id: 'i1',
        title: 'El reloj y el relojero',
        body: 'Diseño',
        category: 'analogy',
        createdAt: 1,
        updatedAt: 2,
      },
      i2: {
        id: 'i2',
        title: 'La semilla de mostaza',
        body: 'Crece en fe',
        category: 'analogy',
        createdAt: 1,
        updatedAt: 1,
      },
    });
    const {findByPlaceholderText, findByText, queryByText} = renderScreen();
    await findByText('El reloj y el relojero');
    fireEvent.changeText(
      await findByPlaceholderText(h.searchPlaceholder),
      'mostaza',
    );
    expect(await findByText('La semilla de mostaza')).toBeTruthy();
    await waitFor(() =>
      expect(queryByText('El reloj y el relojero')).toBeNull(),
    );
  });

  it('filters by category chip', async () => {
    await unlockPremium();
    await seedIllustrations({
      i1: {
        id: 'i1',
        title: 'Anécdota histórica',
        body: '',
        category: 'historical',
        createdAt: 1,
        updatedAt: 2,
      },
      i2: {
        id: 'i2',
        title: 'Un chiste',
        body: '',
        category: 'humor',
        createdAt: 1,
        updatedAt: 1,
      },
    });
    const {findAllByText, findByText, queryByText} = renderScreen();
    await findByText('Anécdota histórica');
    // Two matches expected: the filter chip AND the row's own category
    // badge — press the chip (first match).
    const humorMatches = await findAllByText(h.categories.humor);
    fireEvent.press(humorMatches[0]);
    expect(await findByText('Un chiste')).toBeTruthy();
    await waitFor(() => expect(queryByText('Anécdota histórica')).toBeNull());
  });

  it('shows a limit warning instead of creating past MAX_ILLUSTRATIONS', async () => {
    await unlockPremium();
    const map: PrepIllustrationsMap = {};
    for (let i = 0; i < MAX_ILLUSTRATIONS; i++) {
      map[`i${i}`] = {
        id: `i${i}`,
        title: `Ilustración ${i}`,
        body: '',
        category: 'humor',
        createdAt: i,
        updatedAt: i,
      };
    }
    await seedIllustrations(map);
    const {findByLabelText} = renderScreen();
    fireEvent.press(await findByLabelText(h.newIllustration));
    await waitFor(() => expect(mockToast.warning).toHaveBeenCalledTimes(1));
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('deletes an illustration after confirming', async () => {
    await unlockPremium();
    await seedIllustrations({
      i1: {
        id: 'i1',
        title: 'Para borrar',
        body: '',
        category: 'humor',
        createdAt: 1,
        updatedAt: 1,
      },
    });
    const {findByText, findByLabelText, queryByText} = renderScreen();
    await findByText('Para borrar');
    fireEvent.press(await findByLabelText(h.deleteLabel));
    expect(await findByText(h.deleteConfirmTitle)).toBeTruthy();
    fireEvent.press(await findByText(translations.es.delete));

    // Generous timeout: under the full parallel test run this reload
    // (confirm → delete → reload the list) can occasionally take longer
    // than RTL's default 1000ms wait.
    expect(await findByText(h.emptyTitle, {}, {timeout: 5000})).toBeTruthy();
    expect(queryByText('Para borrar')).toBeNull();
  });
});
