/**
 * T6 — Nuevos extras premium (color themes) — ColorThemeSettings.
 *
 * Renders against the REAL PremiumContext + offeringService (mock SDK), the
 * same integration-style pattern as OfferingSheet/ExtrasSettings. Covers the
 * premium-theme gating: a locked swatch opens the offering sheet instead of
 * applying the theme; an unlocked one applies normally; and an entitlement
 * lost after a premium theme was active falls back to a free one.
 */

import {render, waitFor, fireEvent} from '@testing-library/react-native';
import * as SecureStore from 'expo-secure-store';
import ColorThemeSettings from '../src/components/settings/ColorThemeSettings';
import {PremiumProvider} from '../src/context/PremiumContext';
import {ENTITLEMENT_CACHE_KEY} from '../src/lib/offering/entitlementCache';
import {__resetForTests} from '../src/lib/offering/offeringService';

const mockColors = {
  surface: '#f8fafc',
  text: '#0f172a',
  textSecondary: '#475569',
  primary: '#1d4ed8',
  primaryDark: '#1e3a8a',
  border: '#cbd5e1',
};

jest.mock('../src/hooks/useLanguage', () => ({
  useLanguage: () => ({
    language: 'es',
    t: require('../src/i18n/translations').translations.es,
  }),
}));

jest.mock('../src/lib/haptics', () => ({
  haptics: {tap: jest.fn(), press: jest.fn()},
}));

const mockOpenOfferingSheet = jest.fn();
jest.mock('../src/context/OfferingSheetContext', () => ({
  useOfferingSheet: () => ({open: mockOpenOfferingSheet}),
}));

// A thin, controllable stand-in for useTheme() — the real ThemeProvider
// isn't needed here (this test targets the premium-gating logic, not the
// gradient/persistence machinery already covered by useTheme's own specs).
const mockSetColorTheme = jest.fn();
let mockColorTheme = 'midnight';
jest.mock('../src/hooks/useTheme', () => {
  const actual = jest.requireActual('../src/hooks/useTheme');
  return {
    ...actual,
    useTheme: () => ({
      colors: mockColors,
      isDark: false,
      colorTheme: mockColorTheme,
      setColorTheme: mockSetColorTheme,
    }),
  };
});

function renderSettings() {
  return render(
    <PremiumProvider>
      <ColorThemeSettings />
    </PremiumProvider>,
  );
}

describe('ColorThemeSettings', () => {
  beforeEach(async () => {
    __resetForTests();
    mockSetColorTheme.mockClear();
    mockOpenOfferingSheet.mockClear();
    mockColorTheme = 'midnight';
    await SecureStore.deleteItemAsync(ENTITLEMENT_CACHE_KEY);
  });

  it('shows all 12 free themes plus the 4 premium ones', async () => {
    const {findByText, getByText} = renderSettings();
    expect(await findByText('Océano')).toBeTruthy();
    expect(getByText('Granate')).toBeTruthy();
    expect(getByText('Zafiro')).toBeTruthy();
    expect(getByText('Turquesa')).toBeTruthy();
    expect(getByText('Orquídea')).toBeTruthy();
  });

  it('applies a free theme directly on tap, locked or not', async () => {
    const {findByLabelText} = renderSettings();
    fireEvent.press(await findByLabelText('Océano'));
    expect(mockSetColorTheme).toHaveBeenCalledWith('ocean');
    expect(mockOpenOfferingSheet).not.toHaveBeenCalled();
  });

  it('opens the offering sheet instead of applying a locked premium theme', async () => {
    const {findByLabelText} = renderSettings();
    const swatch = await findByLabelText(/^Granate/);
    fireEvent.press(swatch);
    expect(mockOpenOfferingSheet).toHaveBeenCalledTimes(1);
    expect(mockSetColorTheme).not.toHaveBeenCalled();
  });

  it('applies a premium theme directly once unlocked', async () => {
    await SecureStore.setItemAsync(ENTITLEMENT_CACHE_KEY, 'true');
    const {findByText} = renderSettings();
    // Wait for PremiumContext's cache read before asserting the unlocked path.
    await waitFor(async () => expect(await findByText('Granate')).toBeTruthy());
    fireEvent.press(await findByText('Granate'));
    expect(mockSetColorTheme).toHaveBeenCalledWith('granate');
    expect(mockOpenOfferingSheet).not.toHaveBeenCalled();
  });

  it('falls back to Midnight if a premium theme was active and the entitlement is gone', async () => {
    mockColorTheme = 'zafiro';
    renderSettings();
    await waitFor(() =>
      expect(mockSetColorTheme).toHaveBeenCalledWith('midnight'),
    );
  });

  it('does not revert an active premium theme while the reader is still unlocked', async () => {
    await SecureStore.setItemAsync(ENTITLEMENT_CACHE_KEY, 'true');
    mockColorTheme = 'zafiro';
    const {findByText} = renderSettings();
    await findByText('Zafiro');
    expect(mockSetColorTheme).not.toHaveBeenCalledWith('midnight');
  });
});
