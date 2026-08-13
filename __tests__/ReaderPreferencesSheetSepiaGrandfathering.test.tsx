/**
 * T6.3b — Sepia joins PREMIUM_READER_THEMES, gated behind the same offering
 * as Musgo/Crepúsculo/Niebla (T6.3), UNLESS the device is grandfathered
 * because it already had Sepia selected before the gate existed. Mirrors
 * ReaderPreferencesSheetPremiumThemes.test.tsx's pattern exactly, scoped to
 * the grandfathering exception.
 */

import {
  render,
  waitFor,
  fireEvent,
  within,
} from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import Purchases from 'react-native-purchases';
import {ReaderPreferencesSheet} from '../src/components/reading/ReaderPreferencesSheet';
import {ReaderPreferencesProvider} from '../src/context/ReaderPreferencesContext';
import {PremiumProvider} from '../src/context/PremiumContext';
import {ENTITLEMENT_CACHE_KEY} from '../src/lib/offering/entitlementCache';
import {__resetForTests} from '../src/lib/offering/offeringService';

const STORAGE_KEY = '@reader_preferences';

const mockPurchases = Purchases as unknown as {
  __setCustomerInfo: (info: unknown) => void;
  __reset: () => void;
};

const mockColors = {
  background: '#ffffff',
  surface: '#f8fafc',
  surfaceVariant: '#f1f5f9',
  card: '#ffffff',
  text: '#0f172a',
  textSecondary: '#475569',
  textTertiary: '#94a3b8',
  primary: '#1d4ed8',
  border: '#cbd5e1',
};

jest.mock('../src/hooks/useTheme', () => ({
  useTheme: () => ({colors: mockColors, isDark: false}),
}));

jest.mock('../src/hooks/useLanguage', () => ({
  useLanguage: () => ({
    language: 'es',
    t: require('../src/i18n/translations').translations.es,
  }),
}));

jest.mock('../src/lib/haptics', () => ({
  haptics: {tap: jest.fn()},
}));

const mockOpenOfferingSheet = jest.fn();
jest.mock('../src/context/OfferingSheetContext', () => ({
  useOfferingSheet: () => ({open: mockOpenOfferingSheet}),
}));

function renderSheet(onClose = jest.fn()) {
  return render(
    <PremiumProvider>
      <ReaderPreferencesProvider>
        <ReaderPreferencesSheet visible onClose={onClose} />
      </ReaderPreferencesProvider>
    </PremiumProvider>,
  );
}

describe('ReaderPreferencesSheet — sepia grandfathering (T6.3b)', () => {
  beforeEach(async () => {
    __resetForTests();
    mockPurchases.__reset();
    mockOpenOfferingSheet.mockClear();
    await AsyncStorage.clear();
    await SecureStore.deleteItemAsync(ENTITLEMENT_CACHE_KEY);
  });

  it('a grandfathered, non-premium device sees Sepia unlocked (not locked, no offering-sheet interception)', async () => {
    // Simulates a device that had `theme: 'sepia'` persisted from before the
    // gate existed — ReaderPreferencesContext derives sepiaGrandfathered:
    // true at hydration.
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({theme: 'sepia'}));

    const {findByLabelText} = renderSheet();
    const card = await findByLabelText('Sepia');
    // The a11y label has no offering-sheet suffix when unlocked.
    expect(card.props.accessibilityLabel).toBe('Sepia');

    fireEvent.press(card);
    expect(mockOpenOfferingSheet).not.toHaveBeenCalled();
    await waitFor(() =>
      expect(card.props.accessibilityState).toEqual({selected: true}),
    );
  });

  it('a grandfathered device is never reverted to System by the loss-of-entitlement effect', async () => {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({theme: 'sepia'}));

    const {findByLabelText} = renderSheet();
    // Give the revert effect a chance to run (it runs on mount once
    // premium/hydration settle) and confirm Sepia is still selected.
    await waitFor(async () =>
      expect((await findByLabelText('Sepia')).props.accessibilityState).toEqual(
        {selected: true},
      ),
    );
  });

  it('a NON-grandfathered, non-premium device sees Sepia locked and routes to the offering sheet on tap', async () => {
    // No persisted blob at all — a fresh install, never had Sepia selected.
    const {findByLabelText} = renderSheet();
    const card = await findByLabelText(/^Sepia/);
    expect(card.props.accessibilityLabel).toMatch(/Sepia/);

    fireEvent.press(card);
    expect(mockOpenOfferingSheet).toHaveBeenCalledTimes(1);
  });

  it('a device that had a different theme selected (not sepia) is correctly gated, not grandfathered', async () => {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({theme: 'paper'}));

    const {findByLabelText} = renderSheet();
    const card = await findByLabelText(/^Sepia/);
    fireEvent.press(card);
    expect(mockOpenOfferingSheet).toHaveBeenCalledTimes(1);
  });

  it('the "Exclusivo" pill shows on the Sepia card whether or not the device is grandfathered', async () => {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({theme: 'sepia'}));
    const {findByLabelText} = renderSheet();
    // The badge is purely informational — it must render on the Sepia card
    // even though this device is unlocked via grandfathering, not premium.
    const card = await findByLabelText('Sepia');
    expect(within(card).getByText('Exclusivo')).toBeTruthy();
  });

  it('the "Exclusivo" pill also shows on a locked, non-grandfathered Sepia card', async () => {
    const {findByLabelText} = renderSheet();
    const card = await findByLabelText(/^Sepia/);
    expect(within(card).getByText('Exclusivo')).toBeTruthy();
  });

  it('premium unlocks Sepia for a NON-grandfathered device', async () => {
    await SecureStore.setItemAsync(ENTITLEMENT_CACHE_KEY, 'true');
    const {findByLabelText} = renderSheet();

    await waitFor(async () =>
      expect((await findByLabelText('Sepia')).props.accessibilityLabel).toBe(
        'Sepia',
      ),
    );
    fireEvent.press(await findByLabelText('Sepia'));
    expect(mockOpenOfferingSheet).not.toHaveBeenCalled();
  });

  it('premium unlocks Sepia for a grandfathered device too (belt and suspenders)', async () => {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({theme: 'sepia'}));
    await SecureStore.setItemAsync(ENTITLEMENT_CACHE_KEY, 'true');

    const {findByLabelText} = renderSheet();
    await waitFor(async () =>
      expect((await findByLabelText('Sepia')).props.accessibilityState).toEqual(
        {selected: true},
      ),
    );
    fireEvent.press(await findByLabelText('Sepia'));
    expect(mockOpenOfferingSheet).not.toHaveBeenCalled();
  });
});
