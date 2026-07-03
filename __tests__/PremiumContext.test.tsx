/**
 * Sprint 50 — PremiumContext integration.
 *
 * Rewired for the offering infrastructure tanda: verifies the provider (1)
 * reads the cached entitlement on mount (defaulting locked), (2) reacts to
 * offeringService's real entitlement changes, and (3) gates the manual
 * __DEV__-only override so it no-ops in production builds.
 */

import React from 'react';
import {Text} from 'react-native';
import {act, cleanup, render, waitFor} from '@testing-library/react-native';
import * as SecureStore from 'expo-secure-store';
import {
  PremiumProvider,
  usePremium,
  type PremiumContextValue,
} from '../src/context/PremiumContext';
import {ENTITLEMENT_CACHE_KEY} from '../src/lib/offering/entitlementCache';
import Purchases from 'react-native-purchases';
import {
  initialize,
  __resetForTests,
  __setApiKeyForTests,
} from '../src/lib/offering/offeringService';

const mockPurchases = Purchases as unknown as {
  __setCustomerInfo: (info: unknown) => void;
  __reset: () => void;
};

let captured: PremiumContextValue | null = null;
function Capture() {
  captured = usePremium();
  return <Text>{captured.isPremium ? 'premium' : 'free'}</Text>;
}

async function mountAndSettle() {
  render(
    <PremiumProvider>
      <Capture />
    </PremiumProvider>,
  );
  await waitFor(() => expect(captured?.isLoading).toBe(false));
}

describe('PremiumContext', () => {
  beforeEach(async () => {
    captured = null;
    __resetForTests();
    mockPurchases.__reset();
    await SecureStore.deleteItemAsync(ENTITLEMENT_CACHE_KEY);
  });

  afterEach(() => {
    cleanup();
  });

  it('defaults to locked when nothing is persisted', async () => {
    await mountAndSettle();
    expect(captured!.isPremium).toBe(false);
  });

  it('loads a persisted unlock from the cache', async () => {
    await SecureStore.setItemAsync(ENTITLEMENT_CACHE_KEY, 'true');
    await mountAndSettle();
    expect(captured!.isPremium).toBe(true);
  });

  it('reacts live to a RevenueCat entitlement change with no remount', async () => {
    __setApiKeyForTests('test-key');
    await initialize();
    await mountAndSettle();
    expect(captured!.isPremium).toBe(false);

    act(() => {
      // Simulates RevenueCat reporting a newly-active entitlement (e.g.
      // right after a successful purchase) — PremiumContext must pick it up
      // via offeringService's listener without a remount.
      mockPurchases.__setCustomerInfo({
        entitlements: {active: {extras: {identifier: 'extras'}}, all: {}},
      });
    });

    await waitFor(() => expect(captured!.isPremium).toBe(true));
    await expect(SecureStore.getItemAsync(ENTITLEMENT_CACHE_KEY)).resolves.toBe(
      'true',
    );
  });

  it('setPremium in __DEV__ flips and persists the flag', async () => {
    await mountAndSettle();

    await act(async () => {
      await captured!.setPremium(true);
    });
    await waitFor(() => expect(captured!.isPremium).toBe(true));
    await expect(SecureStore.getItemAsync(ENTITLEMENT_CACHE_KEY)).resolves.toBe(
      'true',
    );

    await act(async () => {
      await captured!.setPremium(false);
    });
    await waitFor(() => expect(captured!.isPremium).toBe(false));
  });

  it('setPremium is a no-op outside __DEV__', async () => {
    const original = __DEV__;
    // __DEV__ is declared as a read-only constant in RN's types/eslint
    // config, but is a plain `var` at runtime; this test needs to flip it to
    // exercise the production branch.
    // @ts-expect-error — see comment above.
    __DEV__ = false; // eslint-disable-line no-global-assign
    try {
      await mountAndSettle();
      await act(async () => {
        await captured!.setPremium(true);
      });
      expect(captured!.isPremium).toBe(false);
      await expect(
        SecureStore.getItemAsync(ENTITLEMENT_CACHE_KEY),
      ).resolves.toBeNull();
    } finally {
      // @ts-expect-error — see comment above.
      __DEV__ = original; // eslint-disable-line no-global-assign
    }
  });
});
