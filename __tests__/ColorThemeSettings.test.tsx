/**
 * T6 — Nuevos extras premium (color themes) — ColorThemeSettings.
 *
 * Renders against the REAL PremiumContext + offeringService (mock SDK), the
 * same integration-style pattern as OfferingSheet/ExtrasSettings. Covers the
 * premium-theme gating: a locked swatch opens the offering sheet instead of
 * applying the theme; an unlocked one applies normally; and an entitlement
 * lost after a premium theme was active falls back to a free one.
 *
 * Settings reorg: the inline grid shows the 12 free themes, expanding to the
 * full 16 (spacer-padded to 3 rows of 6) once a premium theme is active; the
 * full 16-theme grid is also always reachable via "Ver todos los temas",
 * which opens a modal. Both views share the same gating/selection/padding
 * logic (`renderGrid` inside the component), so the premium-gating
 * assertions below run against whichever view currently has the swatch on
 * screen.
 */

import {render, waitFor, fireEvent} from '@testing-library/react-native';
import type {ReactTestInstance} from 'react-test-renderer';
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
  background: '#ffffff',
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

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({top: 0, bottom: 0, left: 0, right: 0}),
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

async function openFullGrid(
  findByLabelText: (label: string) => Promise<ReactTestInstance>,
) {
  fireEvent.press(await findByLabelText('Ver todos los temas'));
}

describe('ColorThemeSettings', () => {
  beforeEach(async () => {
    __resetForTests();
    mockSetColorTheme.mockClear();
    mockOpenOfferingSheet.mockClear();
    mockColorTheme = 'midnight';
    await SecureStore.deleteItemAsync(ENTITLEMENT_CACHE_KEY);
  });

  it('shows only the 12 free themes inline, not the 4 premium ones', async () => {
    const {findByText, queryByText, getAllByTestId} = renderSettings();
    expect(await findByText('Océano')).toBeTruthy();
    expect(queryByText('Granate')).toBeNull();
    expect(queryByText('Zafiro')).toBeNull();
    expect(queryByText('Turquesa')).toBeNull();
    expect(queryByText('Orquídea')).toBeNull();
    // Exactly the 12 free keys = 2 clean rows of 6, no spacers, no orphan.
    const cells = getAllByTestId('color-theme-grid-inline-cell');
    expect(cells).toHaveLength(12);
    expect(cells.length % 6).toBe(0);
  });

  it('opens a full-screen modal with all 16 themes via "Ver todos los temas"', async () => {
    const {findByText, findAllByText, findByLabelText} = renderSettings();
    await findByText('Océano');
    await openFullGrid(findByLabelText);
    expect(await findByText('Granate')).toBeTruthy();
    expect(await findByText('Zafiro')).toBeTruthy();
    expect(await findByText('Turquesa')).toBeTruthy();
    expect(await findByText('Orquídea')).toBeTruthy();
    // The free themes are still present (inline grid behind the modal, plus
    // the full grid inside it — both stay mounted while the modal is open).
    expect((await findAllByText('Océano')).length).toBeGreaterThanOrEqual(1);
  });

  it('applies a free theme directly on tap from the inline grid', async () => {
    const {findByLabelText} = renderSettings();
    fireEvent.press(await findByLabelText('Océano'));
    expect(mockSetColorTheme).toHaveBeenCalledWith('ocean');
    expect(mockOpenOfferingSheet).not.toHaveBeenCalled();
  });

  it('opens the offering sheet instead of applying a locked premium theme', async () => {
    const {findByText, findByLabelText} = renderSettings();
    await findByText('Océano');
    await openFullGrid(findByLabelText);
    const swatch = await findByLabelText(/^Granate/);
    fireEvent.press(swatch);
    expect(mockOpenOfferingSheet).toHaveBeenCalledTimes(1);
    expect(mockSetColorTheme).not.toHaveBeenCalled();
  });

  it('applies a premium theme directly once unlocked', async () => {
    await SecureStore.setItemAsync(ENTITLEMENT_CACHE_KEY, 'true');
    const {findByText, findByLabelText} = renderSettings();
    // Wait for PremiumContext's cache read before opening the full grid.
    await waitFor(async () => expect(await findByText('Océano')).toBeTruthy());
    await openFullGrid(findByLabelText);
    fireEvent.press(await findByText('Granate'));
    expect(mockSetColorTheme).toHaveBeenCalledWith('granate');
    expect(mockOpenOfferingSheet).not.toHaveBeenCalled();
  });

  it('expands the inline grid to all 16 themes (padded to a multiple of 6) when a premium theme is active', async () => {
    // Intent change (Victor's "se ve disparejo" report): previously only the
    // active premium theme was spliced into the free-12 inline grid, giving
    // 13 items = 2 rows of 6 + 1 orphan swatch. A user on a premium theme has
    // unlocked all 4, so the inline grid now shows the full 16 and pads its
    // trailing row with hidden spacers → 18 cells = 3 tidy rows of 6.
    await SecureStore.setItemAsync(ENTITLEMENT_CACHE_KEY, 'true');
    mockColorTheme = 'zafiro';
    const {findByText, getAllByTestId} = renderSettings();
    // All 4 premium themes are visible inline now, not just the active one,
    // and without opening "Ver todos los temas".
    expect(await findByText('Zafiro')).toBeTruthy();
    expect(await findByText('Granate')).toBeTruthy();
    expect(await findByText('Turquesa')).toBeTruthy();
    expect(await findByText('Orquídea')).toBeTruthy();
    // includeHiddenElements so the a11y-hidden padding spacers are counted.
    const cells = getAllByTestId('color-theme-grid-inline-cell', {
      includeHiddenElements: true,
    });
    expect(cells).toHaveLength(18); // 16 real swatches + 2 hidden spacers
    expect(cells.length % 6).toBe(0); // no orphan row
    // The real (visible) swatches are exactly the 16 themes.
    expect(getAllByTestId('color-theme-grid-inline-cell')).toHaveLength(16);
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
