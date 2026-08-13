/**
 * Sprint 107 — TogetherContext: local "group" membership persistence.
 * No backend; the membership is a device-local label on a plan.
 */

import {Text} from 'react-native';
import {act, cleanup, render, waitFor} from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  TogetherProvider,
  useTogether,
  type TogetherContextValue,
} from '../src/context/TogetherContext';

const STORAGE_KEY = '@together_groups';

let captured: TogetherContextValue | null = null;
function Capture() {
  captured = useTogether();
  return <Text>ok</Text>;
}

async function mountAndSettle() {
  render(
    <TogetherProvider>
      <Capture />
    </TogetherProvider>,
  );
  // Flush the async hydrate effect.
  await act(async () => {
    await new Promise(resolve => setTimeout(resolve, 0));
  });
}

describe('TogetherContext', () => {
  beforeEach(async () => {
    captured = null;
    await AsyncStorage.clear();
  });
  afterEach(() => cleanup());

  it('returns null membership before joining', async () => {
    await mountAndSettle();
    expect(captured!.getMembership('nt-30')).toBeNull();
  });

  it('joins a plan with name + start date and persists it', async () => {
    await mountAndSettle();
    await act(async () => {
      await captured!.joinPlan('nt-30', {
        name: 'Familia',
        startDate: '2026-06-22',
      });
    });

    const m = captured!.getMembership('nt-30');
    expect(m).toMatchObject({name: 'Familia', startDate: '2026-06-22'});
    expect(typeof m!.joinedAt).toBe('string');

    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    expect(JSON.parse(raw!)['nt-30'].name).toBe('Familia');
  });

  it('omits the name when joining without one', async () => {
    await mountAndSettle();
    await act(async () => {
      await captured!.joinPlan('proverbs', {startDate: '2026-06-22'});
    });
    expect(captured!.getMembership('proverbs')!.name).toBeUndefined();
  });

  it('leaves a plan, clearing only that membership', async () => {
    await mountAndSettle();
    await act(async () => {
      await captured!.joinPlan('nt-30', {startDate: '2026-06-22'});
      await captured!.joinPlan('proverbs', {startDate: '2026-06-22'});
    });
    await act(async () => {
      await captured!.leavePlan('nt-30');
    });
    expect(captured!.getMembership('nt-30')).toBeNull();
    expect(captured!.getMembership('proverbs')).not.toBeNull();
  });

  it('rehydrates memberships from storage on mount', async () => {
    await AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        'nt-30': {
          name: 'Clase',
          startDate: '2026-01-01',
          joinedAt: '2026-01-01T00:00:00.000Z',
        },
      }),
    );
    await mountAndSettle();
    await waitFor(() =>
      expect(captured!.getMembership('nt-30')?.name).toBe('Clase'),
    );
  });
});
