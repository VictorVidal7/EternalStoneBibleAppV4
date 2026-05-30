/**
 * Sprint 50 — PremiumContext integration.
 *
 * Verifies the runtime wiring: the provider reads the persisted flag on mount
 * (defaulting locked), exposes it, and `setPremium` flips + persists it. The
 * AsyncStorage-backed store runs for real against the global in-memory mock.
 */

import React from 'react';
import {Text} from 'react-native';
import {act, cleanup, render, waitFor} from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  PremiumProvider,
  usePremium,
  type PremiumContextValue,
} from '../src/context/PremiumContext';
import {PREMIUM_STORAGE_KEY} from '../src/lib/premium/premiumStore';

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
    // The AsyncStorage mock persists across tests — clear so a flag set by one
    // test doesn't leak into the next.
    await AsyncStorage.clear();
  });

  afterEach(() => {
    cleanup();
  });

  it('defaults to locked when nothing is persisted', async () => {
    await mountAndSettle();
    expect(captured!.isPremium).toBe(false);
  });

  it('loads a persisted unlock and can lock again (persisting the change)', async () => {
    await AsyncStorage.setItem(PREMIUM_STORAGE_KEY, 'true');
    await mountAndSettle();
    expect(captured!.isPremium).toBe(true);

    await act(async () => {
      await captured!.setPremium(false);
    });
    await waitFor(() => expect(captured!.isPremium).toBe(false));
    await expect(AsyncStorage.getItem(PREMIUM_STORAGE_KEY)).resolves.toBe(
      'false',
    );
  });
});
