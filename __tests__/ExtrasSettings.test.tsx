/**
 * Offering infrastructure tanda (T4 — UI) — ExtrasSettings.
 *
 * Renders against the REAL PremiumContext + offeringService (mock SDK) to
 * verify the section degrades quietly when there's nothing honest to offer,
 * and reflects the real entitlement/billing state otherwise.
 */

import {render, waitFor, fireEvent} from '@testing-library/react-native';
import Purchases from 'react-native-purchases';
import * as SecureStore from 'expo-secure-store';
import ExtrasSettings from '../src/components/settings/ExtrasSettings';
import {PremiumProvider} from '../src/context/PremiumContext';
import {ENTITLEMENT_CACHE_KEY} from '../src/lib/offering/entitlementCache';
import {
  initialize,
  __resetForTests,
  __setApiKeyForTests,
} from '../src/lib/offering/offeringService';

const mockColors = {
  surface: '#f8fafc',
  text: '#0f172a',
  textSecondary: '#475569',
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

jest.mock('../src/context/ToastContext', () => ({
  useToast: () => ({success: jest.fn(), error: jest.fn(), info: jest.fn()}),
}));

jest.mock('../src/lib/haptics', () => ({
  haptics: {tap: jest.fn()},
}));

const mockOpenOfferingSheet = jest.fn();
jest.mock('../src/context/OfferingSheetContext', () => ({
  useOfferingSheet: () => ({open: mockOpenOfferingSheet}),
}));

const mockPurchases = Purchases as unknown as {__reset: () => void};

function renderSettings() {
  return render(
    <PremiumProvider>
      <ExtrasSettings />
    </PremiumProvider>,
  );
}

describe('ExtrasSettings', () => {
  beforeEach(async () => {
    __resetForTests();
    mockPurchases.__reset();
    mockOpenOfferingSheet.mockClear();
    await SecureStore.deleteItemAsync(ENTITLEMENT_CACHE_KEY);
  });

  it('renders nothing in production when locked and billing is unavailable', async () => {
    const original = __DEV__;
    // @ts-expect-error — __DEV__ is declared read-only in RN's types, but is
    // a plain `var` at runtime; this test needs to flip it to exercise the
    // production branch.
    __DEV__ = false; // eslint-disable-line no-global-assign
    try {
      const {toJSON} = renderSettings();
      await waitFor(() => expect(toJSON()).toBeNull());
    } finally {
      // @ts-expect-error — see comment above.
      __DEV__ = original; // eslint-disable-line no-global-assign
    }
  });

  it('keeps the section (and its dev toggle) reachable in __DEV__ even when billing is unavailable', async () => {
    const {findByText} = renderSettings();
    expect(
      await findByText('Extras desbloqueados (solo desarrollo)'),
    ).toBeTruthy();
  });

  it('shows the unlock CTA once billing is available', async () => {
    __setApiKeyForTests('test-key');
    await initialize();
    const {findByText} = renderSettings();

    const cta = await findByText('Desbloquear con premium');
    fireEvent.press(cta);
    expect(mockOpenOfferingSheet).toHaveBeenCalledTimes(1);
  });

  it('opens the sheet by tapping the outer card itself when locked (not just the inner CTA)', async () => {
    __setApiKeyForTests('test-key');
    await initialize();
    const {findByLabelText} = renderSettings();

    fireEvent.press(await findByLabelText('Extras de la app'));
    expect(mockOpenOfferingSheet).toHaveBeenCalledTimes(1);
  });

  it('shows the unlocked status regardless of billing availability', async () => {
    await SecureStore.setItemAsync(ENTITLEMENT_CACHE_KEY, 'true');
    const {findByText, queryByText} = renderSettings();

    expect(await findByText('Extras desbloqueados')).toBeTruthy();
    expect(queryByText('Desbloquear con premium')).toBeNull();
  });

  it('opens the sheet by tapping the card once unlocked, since there is no CTA to reach it anymore', async () => {
    await SecureStore.setItemAsync(ENTITLEMENT_CACHE_KEY, 'true');
    const {findByLabelText} = renderSettings();

    fireEvent.press(await findByLabelText('Extras desbloqueados'));
    expect(mockOpenOfferingSheet).toHaveBeenCalledTimes(1);
  });

  it('shows the unlocked copy without the old em dash, hinting that the card is tappable', async () => {
    await SecureStore.setItemAsync(ENTITLEMENT_CACHE_KEY, 'true');
    const {findByText} = renderSettings();

    // Exact-match on the new string is itself the em-dash-gone assertion —
    // same style as the tierSuggested copy-fix test in OfferingSheet.test.tsx.
    expect(
      await findByText(
        'Gracias por tu ofrenda. Toca para ver todo lo que incluye.',
      ),
    ).toBeTruthy();
  });

  it('exposes a __DEV__-only manual toggle alongside the real status', async () => {
    __setApiKeyForTests('test-key');
    await initialize();
    const {findByText} = renderSettings();
    expect(
      await findByText('Extras desbloqueados (solo desarrollo)'),
    ).toBeTruthy();
  });
});
