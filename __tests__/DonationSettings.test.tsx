/**
 * Offering infrastructure tanda (T5 — Donación) — DonationSettings.
 *
 * Simpler than ExtrasSettings: there's no entitlement to reflect (giving
 * unlocks nothing and is repeatable), so this card only ever has one
 * message + one CTA, and no dev toggle.
 */

import React from 'react';
import {render, waitFor, fireEvent} from '@testing-library/react-native';
import Purchases from 'react-native-purchases';
import DonationSettings from '../src/components/settings/DonationSettings';
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

const mockOpenDonationSheet = jest.fn();
jest.mock('../src/context/DonationSheetContext', () => ({
  useDonationSheet: () => ({open: mockOpenDonationSheet}),
}));

const mockPurchases = Purchases as unknown as {__reset: () => void};

describe('DonationSettings', () => {
  beforeEach(() => {
    __resetForTests();
    mockPurchases.__reset();
    mockOpenDonationSheet.mockClear();
  });

  it('renders nothing in production when billing is unavailable', async () => {
    const original = __DEV__;
    // @ts-expect-error — __DEV__ is declared read-only in RN's types, but is
    // a plain `var` at runtime; this test needs to flip it to exercise the
    // production branch.
    __DEV__ = false; // eslint-disable-line no-global-assign
    try {
      const {toJSON} = render(<DonationSettings />);
      await waitFor(() => expect(toJSON()).toBeNull());
    } finally {
      // @ts-expect-error — see comment above.
      __DEV__ = original; // eslint-disable-line no-global-assign
    }
  });

  it('stays reachable in __DEV__ even when billing is unavailable', async () => {
    const {findByText} = render(<DonationSettings />);
    expect(await findByText('Donación')).toBeTruthy();
  });

  it('shows the CTA and opens the donation sheet once billing is available', async () => {
    __setApiKeyForTests('test-key');
    await initialize();
    const {findByText} = render(<DonationSettings />);

    const cta = await findByText('Apoyar con una donación');
    fireEvent.press(cta);
    expect(mockOpenDonationSheet).toHaveBeenCalledTimes(1);
  });
});
