/**
 * "Own photo" background — a device-gallery photo used instead of one of
 * the built-in SHARE_TEMPLATES gradients (see `src/features/share/
 * ownPhotoPicker.ts`). Offering-unlocked, mirroring every other "extra"
 * ImageShareModal already gates this way (premium templates, textures,
 * exclusive fonts, saved presets) — see `imageShareModalPremium.test.tsx`
 * for that existing coverage, left untouched by this file.
 *
 * `expo-image-picker` is mocked here (not globally) since this is the only
 * suite that exercises it.
 */

import React from 'react';
import {render, waitFor, fireEvent} from '@testing-library/react-native';
import * as SecureStore from 'expo-secure-store';
import Purchases from 'react-native-purchases';
import {ImageShareModal} from '../src/components/reading/ImageShareModal';
import {PremiumProvider} from '../src/context/PremiumContext';
import {ENTITLEMENT_CACHE_KEY} from '../src/lib/offering/entitlementCache';
import {
  ENTITLEMENT_ID,
  initialize,
  __resetForTests,
  __setApiKeyForTests,
} from '../src/lib/offering/offeringService';

const mockPurchases = Purchases as unknown as {
  __setCustomerInfo: (info: unknown) => void;
  __reset: () => void;
};

const activeEntitlementInfo = {
  entitlements: {
    active: {[ENTITLEMENT_ID]: {identifier: ENTITLEMENT_ID}},
    all: {},
  },
};
const noEntitlementInfo = {entitlements: {active: {}, all: {}}};

const mockRequestMediaLibraryPermissionsAsync = jest.fn();
const mockLaunchImageLibraryAsync = jest.fn();

jest.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: (...args: unknown[]) =>
    mockRequestMediaLibraryPermissionsAsync(...args),
  launchImageLibraryAsync: (...args: unknown[]) =>
    mockLaunchImageLibraryAsync(...args),
}));

jest.mock('@expo/vector-icons', () => ({Ionicons: () => null}));

jest.mock('expo-linear-gradient', () => {
  const {View} = require('react-native');
  return {LinearGradient: View};
});

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({top: 0, bottom: 0, left: 0, right: 0}),
}));

jest.mock('react-native-view-shot', () => ({
  captureRef: jest.fn(async () => 'file://mock.png'),
}));

jest.mock('expo-sharing', () => ({
  isAvailableAsync: jest.fn(async () => true),
  shareAsync: jest.fn(async () => undefined),
}));

jest.mock('../src/lib/haptics', () => ({
  haptics: {tap: jest.fn(), press: jest.fn()},
}));

const mockColors = {
  background: '#ffffff',
  text: '#0f172a',
  textSecondary: '#475569',
  textTertiary: '#94a3b8',
  primary: '#1d4ed8',
  primaryLight: '#dbeafe',
  primaryDark: '#1e3a8a',
  border: '#cbd5e1',
  surfaceVariant: '#e2e8f0',
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

const mockToastError = jest.fn();
const mockToastInfo = jest.fn();
jest.mock('../src/context/ToastContext', () => ({
  useToast: () => ({
    show: jest.fn(),
    success: jest.fn(),
    error: (...args: unknown[]) => mockToastError(...args),
    warning: jest.fn(),
    info: (...args: unknown[]) => mockToastInfo(...args),
  }),
}));

jest.mock('../src/context/ReaderPreferencesContext', () => ({
  useReaderPreferences: () => ({
    preferences: {fontFamily: 'serif', fontSize: 20},
  }),
}));

const mockOpenOfferingSheet = jest.fn();
jest.mock('../src/context/OfferingSheetContext', () => ({
  useOfferingSheet: () => ({open: mockOpenOfferingSheet}),
}));

function renderModal(onClose = jest.fn()) {
  return render(
    <PremiumProvider>
      <ImageShareModal
        visible
        verseText="Porque de tal manera amó Dios al mundo..."
        verseReference="Juan 3:16"
        versionAbbr="RVR1960"
        verseCount={1}
        hasSelection
        cardSize={360}
        onClose={onClose}
      />
    </PremiumProvider>,
  );
}

async function unlockPremium() {
  await SecureStore.setItemAsync(ENTITLEMENT_CACHE_KEY, 'true');
}

describe('ImageShareModal — "own photo" background', () => {
  beforeEach(async () => {
    __resetForTests();
    mockPurchases.__reset();
    mockOpenOfferingSheet.mockClear();
    mockToastError.mockClear();
    mockToastInfo.mockClear();
    mockRequestMediaLibraryPermissionsAsync.mockReset();
    mockLaunchImageLibraryAsync.mockReset();
    await SecureStore.deleteItemAsync(ENTITLEMENT_CACHE_KEY);
  });

  it('is locked for a free user and opens the offering sheet instead of the picker', async () => {
    const {findByLabelText} = renderModal();
    const swatch = await findByLabelText(/Tu propia foto · /);
    fireEvent.press(swatch);

    expect(mockOpenOfferingSheet).toHaveBeenCalledTimes(1);
    expect(mockRequestMediaLibraryPermissionsAsync).not.toHaveBeenCalled();
  });

  it('picks a photo and applies it as the card background for a premium user', async () => {
    await unlockPremium();
    mockRequestMediaLibraryPermissionsAsync.mockResolvedValue({
      granted: true,
    });
    mockLaunchImageLibraryAsync.mockResolvedValue({
      canceled: false,
      assets: [{uri: 'file://selected-photo.jpg'}],
    });

    const {findByLabelText, findByTestId} = renderModal();
    fireEvent.press(await findByLabelText('Tu propia foto'));

    const bg = await findByTestId('share-own-photo-background');
    expect(bg.props.source).toEqual({uri: 'file://selected-photo.jpg'});
    expect(mockOpenOfferingSheet).not.toHaveBeenCalled();
  });

  it('shows a clear, non-blocking message when photo-library permission is denied, without crashing', async () => {
    await unlockPremium();
    mockRequestMediaLibraryPermissionsAsync.mockResolvedValue({
      granted: false,
    });

    const {findByLabelText, queryByTestId} = renderModal();
    fireEvent.press(await findByLabelText('Tu propia foto'));

    await waitFor(() => expect(mockToastError).toHaveBeenCalledTimes(1));
    expect(mockLaunchImageLibraryAsync).not.toHaveBeenCalled();
    expect(queryByTestId('share-own-photo-background')).toBeNull();
  });

  it('is a no-op when the user cancels the picker, keeping the previously-selected photo', async () => {
    await unlockPremium();
    mockRequestMediaLibraryPermissionsAsync.mockResolvedValue({
      granted: true,
    });
    mockLaunchImageLibraryAsync.mockResolvedValueOnce({
      canceled: false,
      assets: [{uri: 'file://first-photo.jpg'}],
    });

    const {findByLabelText, findByTestId} = renderModal();
    fireEvent.press(await findByLabelText('Tu propia foto'));
    const bg = await findByTestId('share-own-photo-background');
    expect(bg.props.source).toEqual({uri: 'file://first-photo.jpg'});

    // Second tap opens the picker again, but this time the user cancels.
    // Re-query the swatch by its (unchanged) label — testID lives on the
    // background Image, which has no onPress of its own to fire.
    mockLaunchImageLibraryAsync.mockResolvedValueOnce({
      canceled: true,
      assets: null,
    });
    fireEvent.press(await findByLabelText('Tu propia foto'));

    await waitFor(() =>
      expect(mockLaunchImageLibraryAsync).toHaveBeenCalledTimes(2),
    );
    // Nothing was cleared — the first photo is still the active background.
    const stillBg = await findByTestId('share-own-photo-background');
    expect(stillBg.props.source).toEqual({uri: 'file://first-photo.jpg'});
    expect(mockToastError).not.toHaveBeenCalled();
  });

  it('cleanly switches back to a template, leaving no stale photo behind', async () => {
    await unlockPremium();
    mockRequestMediaLibraryPermissionsAsync.mockResolvedValue({
      granted: true,
    });
    mockLaunchImageLibraryAsync.mockResolvedValue({
      canceled: false,
      assets: [{uri: 'file://selected-photo.jpg'}],
    });

    const {findByLabelText, findByTestId, queryByTestId} = renderModal();
    fireEvent.press(await findByLabelText('Tu propia foto'));
    await findByTestId('share-own-photo-background');

    fireEvent.press(await findByLabelText('Estilo 1'));

    await waitFor(() =>
      expect(queryByTestId('share-own-photo-background')).toBeNull(),
    );
  });

  it('reverts to a template if the entitlement is revoked while a photo is active', async () => {
    // Mirrors imageShareModalPremium.test.tsx's own texture-revert test: a
    // LIVE entitlement change (via the RevenueCat mock + offeringService's
    // subscription) rather than just the cold-start SecureStore cache, since
    // this needs `isPremium` to flip on an already-mounted component.
    __setApiKeyForTests('test-key');
    await initialize();
    mockPurchases.__setCustomerInfo(activeEntitlementInfo);

    mockRequestMediaLibraryPermissionsAsync.mockResolvedValue({
      granted: true,
    });
    mockLaunchImageLibraryAsync.mockResolvedValue({
      canceled: false,
      assets: [{uri: 'file://selected-photo.jpg'}],
    });

    const {findByLabelText, findByTestId, queryByTestId} = renderModal();
    fireEvent.press(await findByLabelText('Tu propia foto'));
    await findByTestId('share-own-photo-background');

    mockPurchases.__setCustomerInfo(noEntitlementInfo);

    // A generous timeout: under full-suite load the entitlement-change
    // subscription → context update → effect → re-render chain can take
    // longer than RNTL's 1000ms default to settle.
    await waitFor(
      () => expect(queryByTestId('share-own-photo-background')).toBeNull(),
      {timeout: 5000},
    );
  });
});
