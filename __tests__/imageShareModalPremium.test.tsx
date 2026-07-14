/**
 * T8.2 — Módulo de compartir premium: cierre de la fuga de tipografías
 * (T6.2), texturas exclusivas nuevas, y estilos guardados. Scoped to these
 * NEW/fixed premium behaviors on `ImageShareModal` — its pre-existing free
 * behavior (template picker, format, font size, alignment, capture/share)
 * is untouched by this tanda.
 */

import React from 'react';
import {render, waitFor, fireEvent} from '@testing-library/react-native';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
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

jest.mock('../src/context/ToastContext', () => ({
  useToast: () => ({
    show: jest.fn(),
    success: jest.fn(),
    error: jest.fn(),
    warning: jest.fn(),
    info: jest.fn(),
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

describe('ImageShareModal — T8.2 premium fonts (closing the T6.2 gap)', () => {
  beforeEach(async () => {
    __resetForTests();
    mockPurchases.__reset();
    mockOpenOfferingSheet.mockClear();
    await SecureStore.deleteItemAsync(ENTITLEMENT_CACHE_KEY);
  });

  it('marks the 3 exclusive fonts as locked for a free user', async () => {
    const {findByLabelText} = renderModal();
    expect(await findByLabelText(/Sólida · /)).toBeTruthy();
    expect(await findByLabelText(/Elegante · /)).toBeTruthy();
    expect(await findByLabelText(/Suave · /)).toBeTruthy();
  });

  it('opens the offering sheet instead of applying a locked font', async () => {
    const {findByLabelText} = renderModal();
    fireEvent.press(await findByLabelText(/Sólida · /));
    expect(mockOpenOfferingSheet).toHaveBeenCalledTimes(1);
  });

  it('applies an exclusive font directly once unlocked (no offering suffix)', async () => {
    await SecureStore.setItemAsync(ENTITLEMENT_CACHE_KEY, 'true');
    const {findByLabelText} = renderModal();
    const card = await findByLabelText('Sólida');
    fireEvent.press(card);
    expect(mockOpenOfferingSheet).not.toHaveBeenCalled();
  });
});

describe('ImageShareModal — T8.2 exclusive textures', () => {
  beforeEach(async () => {
    __resetForTests();
    mockPurchases.__reset();
    mockOpenOfferingSheet.mockClear();
    await SecureStore.deleteItemAsync(ENTITLEMENT_CACHE_KEY);
  });

  it('marks dots/lines/grain as locked for a free user, "None" stays free', async () => {
    const {findByLabelText} = renderModal();
    expect(await findByLabelText('Ninguna')).toBeTruthy();
    expect(await findByLabelText(/Puntos · /)).toBeTruthy();
    expect(await findByLabelText(/Líneas · /)).toBeTruthy();
    expect(await findByLabelText(/Grano · /)).toBeTruthy();
  });

  it('opens the offering sheet instead of applying a locked texture', async () => {
    const {findByLabelText} = renderModal();
    fireEvent.press(await findByLabelText(/Puntos · /));
    expect(mockOpenOfferingSheet).toHaveBeenCalledTimes(1);
  });

  it('applies a texture directly once unlocked', async () => {
    await SecureStore.setItemAsync(ENTITLEMENT_CACHE_KEY, 'true');
    const {findByLabelText} = renderModal();
    fireEvent.press(await findByLabelText('Puntos'));
    expect(mockOpenOfferingSheet).not.toHaveBeenCalled();
  });

  it('reverts to "none" if the entitlement is revoked while a texture is active', async () => {
    __setApiKeyForTests('test-key');
    await initialize();
    mockPurchases.__setCustomerInfo(activeEntitlementInfo);

    const {findByLabelText} = renderModal();
    fireEvent.press(await findByLabelText('Puntos'));

    mockPurchases.__setCustomerInfo(noEntitlementInfo);

    await waitFor(async () =>
      expect(await findByLabelText(/Puntos · /)).toBeTruthy(),
    );
  });
});

describe('ImageShareModal — T8.2 saved style presets', () => {
  beforeEach(async () => {
    __resetForTests();
    mockPurchases.__reset();
    mockOpenOfferingSheet.mockClear();
    await SecureStore.deleteItemAsync(ENTITLEMENT_CACHE_KEY);
  });

  it('opens the offering sheet when a free user taps "Guardar estilo"', async () => {
    const {findByLabelText} = renderModal();
    fireEvent.press(await findByLabelText(/Guardar estilo · /));
    expect(mockOpenOfferingSheet).toHaveBeenCalledTimes(1);
  });

  it('saves and lists a preset once unlocked, then can delete it', async () => {
    await SecureStore.setItemAsync(ENTITLEMENT_CACHE_KEY, 'true');
    const {findByLabelText, findByText, queryByText} = renderModal();

    fireEvent.press(await findByLabelText('Guardar estilo'));
    expect(await findByText('Estilo 1')).toBeTruthy();

    fireEvent.press(await findByLabelText('Eliminar estilo'));
    await waitFor(() => expect(queryByText('Estilo 1')).toBeNull());
  });

  it('BUG-7 follow-up: renders a legacy pre-fix preset name as-is, not double-wrapped', async () => {
    // Presets saved before BUG-7's fix have the old hardcoded "Estilo N"
    // baked into `.name` (not a plain ordinal). The localized template must
    // only apply to NEW ordinal-named presets — applying it to a legacy
    // name would produce "Estilo Estilo 1" instead of the original,
    // acceptable-until-it-ages-out "Estilo 1".
    await SecureStore.setItemAsync(ENTITLEMENT_CACHE_KEY, 'true');
    await AsyncStorage.setItem(
      '@share_style_presets',
      JSON.stringify([
        {
          id: 'preset_legacy',
          name: 'Estilo 1',
          templateId: 'classic',
          texture: 'none',
          fontSize: 20,
          textAlign: 'center',
          fontFamilyId: 'serif',
          aspect: 'square',
        },
      ]),
    );

    const {findByText, queryByText} = renderModal();
    expect(await findByText('Estilo 1')).toBeTruthy();
    expect(queryByText('Estilo Estilo 1')).toBeNull();
  });
});
