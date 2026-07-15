/**
 * Tanda 4 — "Banco de ilustraciones" editor screen ([id].tsx).
 *
 * Covers the premium gate (defense in depth, same locked teaser as the list
 * screen), the not-found state, loading an existing illustration's fields,
 * title/body autosave-on-blur, category-chip immediate save, explicit
 * delete-with-confirm, and the "abandoned blank creation" cleanup-on-unmount
 * (a freshly created, never-typed-into illustration quietly disappears from
 * storage once the screen unmounts; one that has real content survives).
 *
 * Mirrors prepSeriesListScreen.test.tsx's harness: the REAL PremiumProvider
 * and the REAL prepIllustrations store (AsyncStorage's global jest mock) —
 * only offering sheet, navigation/theme plumbing are mocked.
 */
import React from 'react';
import {render, fireEvent, waitFor} from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import PrepIllustrationEditorScreen from '../app/features/prep/illustrations/[id]';
import {PremiumProvider} from '../src/context/PremiumContext';
import {ENTITLEMENT_CACHE_KEY} from '../src/lib/offering/entitlementCache';
import {
  createPrepIllustration,
  getPrepIllustration,
} from '../src/features/study/prepIllustrationsStore';
import {
  serializePrepIllustrationsMap,
  type PrepIllustrationsMap,
} from '../src/features/study/prepIllustrations';
import {translations} from '../src/i18n/translations';

const PREP_ILLUSTRATIONS_KEY = '@prep_illustrations';

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
let mockParams: {id?: string} = {};

jest.mock('expo-router', () => {
  const ReactActual = require('react');
  return {
    useRouter: () => ({push: mockPush, back: mockBack}),
    useLocalSearchParams: () => mockParams,
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

const h = translations.es.prepIllustrations;
const offering = translations.es.offering;

function renderScreen() {
  return render(
    <PremiumProvider>
      <PrepIllustrationEditorScreen />
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

describe('PrepIllustrationEditorScreen — Tanda 4', () => {
  beforeEach(async () => {
    mockPush.mockClear();
    mockBack.mockClear();
    mockOpenOfferingSheet.mockClear();
    mockParams = {};
    await AsyncStorage.removeItem(PREP_ILLUSTRATIONS_KEY);
    await SecureStore.deleteItemAsync(ENTITLEMENT_CACHE_KEY);
  });

  it('shows a locked teaser for a free reader (defense in depth)', async () => {
    mockParams = {id: 'i1'};
    const {findByText} = renderScreen();
    expect(await findByText(h.lockedTitle)).toBeTruthy();
  });

  it('opens the offering sheet when a free reader taps the unlock button', async () => {
    mockParams = {id: 'i1'};
    const {findByLabelText} = renderScreen();
    fireEvent.press(
      await findByLabelText(`${h.title} — ${offering.badgeA11y}`),
    );
    expect(mockOpenOfferingSheet).toHaveBeenCalledTimes(1);
  });

  it('shows the not-found state for an unknown id', async () => {
    await unlockPremium();
    mockParams = {id: 'does-not-exist'};
    const {findByText} = renderScreen();
    expect(await findByText(h.notFound)).toBeTruthy();
  });

  it('loads an existing illustration into its fields', async () => {
    await unlockPremium();
    await seedIllustrations({
      i1: {
        id: 'i1',
        title: 'El reloj y el relojero',
        body: 'Un argumento clásico',
        category: 'analogy',
        createdAt: 1,
        updatedAt: 1,
      },
    });
    mockParams = {id: 'i1'};
    const {findByDisplayValue} = renderScreen();
    expect(await findByDisplayValue('El reloj y el relojero')).toBeTruthy();
    expect(await findByDisplayValue('Un argumento clásico')).toBeTruthy();
  });

  it('autosaves the title on blur', async () => {
    await unlockPremium();
    await seedIllustrations({
      i1: {
        id: 'i1',
        title: '',
        body: '',
        category: 'analogy',
        createdAt: 1,
        updatedAt: 1,
      },
    });
    mockParams = {id: 'i1'};
    const {findByPlaceholderText} = renderScreen();
    const titleInput = await findByPlaceholderText(h.titlePlaceholder);
    fireEvent.changeText(titleInput, 'Nuevo título');
    fireEvent(titleInput, 'blur');

    await waitFor(async () => {
      const saved = await getPrepIllustration('i1');
      expect(saved?.title).toBe('Nuevo título');
    });
  });

  it('saves a category pick immediately (no blur needed)', async () => {
    await unlockPremium();
    await seedIllustrations({
      i1: {
        id: 'i1',
        title: 'Con contenido',
        body: 'Cuerpo',
        category: 'analogy',
        createdAt: 1,
        updatedAt: 1,
      },
    });
    mockParams = {id: 'i1'};
    const {findByLabelText} = renderScreen();
    fireEvent.press(await findByLabelText(h.categories.humor));

    await waitFor(async () => {
      const saved = await getPrepIllustration('i1');
      expect(saved?.category).toBe('humor');
    });
  });

  it('deletes the illustration via the header trash button and goes back', async () => {
    await unlockPremium();
    await seedIllustrations({
      i1: {
        id: 'i1',
        title: 'Para borrar',
        body: 'Cuerpo',
        category: 'analogy',
        createdAt: 1,
        updatedAt: 1,
      },
    });
    mockParams = {id: 'i1'};
    const {findByLabelText, findByText} = renderScreen();
    await findByText('Para borrar');
    fireEvent.press(await findByLabelText(h.deleteLabel));
    fireEvent.press(await findByText(translations.es.delete));

    await waitFor(() => expect(mockBack).toHaveBeenCalledTimes(1));
    expect(await getPrepIllustration('i1')).toBeNull();
  });

  it('quietly deletes an abandoned BLANK illustration on unmount', async () => {
    await unlockPremium();
    const created = await createPrepIllustration();
    expect(created).not.toBeNull();
    mockParams = {id: created!.id};
    const {unmount, findByPlaceholderText} = renderScreen();
    await findByPlaceholderText(h.titlePlaceholder); // wait for load to settle
    unmount();

    await waitFor(async () => {
      expect(await getPrepIllustration(created!.id)).toBeNull();
    });
  });

  it('keeps a real illustration on unmount even after only viewing it', async () => {
    await unlockPremium();
    await seedIllustrations({
      i1: {
        id: 'i1',
        title: 'Se queda',
        body: 'Cuerpo real',
        category: 'analogy',
        createdAt: 1,
        updatedAt: 1,
      },
    });
    mockParams = {id: 'i1'};
    const {unmount, findByText} = renderScreen();
    await findByText('Se queda');
    unmount();

    const stillThere = await getPrepIllustration('i1');
    expect(stillThere).not.toBeNull();
    expect(stillThere?.title).toBe('Se queda');
  });
});
