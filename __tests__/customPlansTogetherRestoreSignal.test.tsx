/**
 * R9-30 — the custom plans and the together groups re-read the disk when a
 * backup is restored.
 *
 * Both providers hold their whole list in `useState` (read once, on mount)
 * and every edit writes a list built from that copy. They are mounted at the
 * root, so they outlive a restore from Settings: the restore wrote the file's
 * list to disk, and the next save, edit or join wrote the pre-import list
 * back over it. The restored plans and groups were gone.
 *
 * Lo REAL: both providers, the custom plan registry and the restore signal,
 * over the AsyncStorage mock. Nothing is substituted.
 */
import {Text} from 'react-native';
import {act, cleanup, render, waitFor} from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  CustomPlansProvider,
  useCustomPlans,
  type CustomPlansContextValue,
} from '../src/context/CustomPlansContext';
import {
  TogetherProvider,
  useTogether,
  type TogetherContextValue,
} from '../src/context/TogetherContext';
import {getRegisteredCustomPlans} from '../src/lib/reading/customPlans';
import {
  __resetBackupRestoredListenersForTests,
  emitBackupRestored,
} from '../src/lib/backup/restoreSignal';
import type {ReadingPlan} from '../src/constants/reading-plans';

const PLANS_KEY = '@custom_plans';
const GROUPS_KEY = '@together_groups';

const plan = (id: string): ReadingPlan =>
  ({
    id,
    title: id,
    description: id,
    days: [{day: 1, readings: [{bookId: 43, chapters: [1]}]}],
  }) as unknown as ReadingPlan;

const settle = async () => {
  for (let i = 0; i < 5; i++) await new Promise(r => setImmediate(r));
};

/** What `importBackup` does: the file's raw value, then the signal. */
async function restore(key: string, raw: string) {
  await AsyncStorage.setItem(key, raw);
  await act(async () => {
    emitBackupRestored();
    await settle();
  });
}

beforeEach(async () => {
  await AsyncStorage.clear();
  __resetBackupRestoredListenersForTests();
});
afterEach(() => cleanup());

describe('R9-30 — custom plans after a restore', () => {
  let plans: CustomPlansContextValue | null = null;
  function Capture() {
    plans = useCustomPlans();
    return <Text>{plans.customPlans.map(p => p.id).join(',')}</Text>;
  }

  async function mount() {
    await AsyncStorage.setItem(PLANS_KEY, JSON.stringify([plan('PRE')]));
    const screen = render(
      <CustomPlansProvider>
        <Capture />
      </CustomPlansProvider>,
    );
    await waitFor(() => expect(screen.getByText('PRE')).toBeTruthy());
    await restore(
      PLANS_KEY,
      JSON.stringify([plan('RESTAURADO-1'), plan('RESTAURADO-2')]),
    );
    return screen;
  }

  const onDisk = async () =>
    (
      JSON.parse(
        (await AsyncStorage.getItem(PLANS_KEY)) ?? '[]',
      ) as ReadingPlan[]
    )
      .map(p => p.id)
      .sort();

  it('a save keeps the restored plans', async () => {
    await mount();
    await act(async () => {
      await plans!.saveCustomPlan(plan('NUEVO'));
    });
    expect(await onDisk()).toEqual(['NUEVO', 'RESTAURADO-1', 'RESTAURADO-2']);
  });

  it('an edit and a delete keep the restored plans', async () => {
    await mount();
    await act(async () => {
      await plans!.replaceCustomPlan('RESTAURADO-1', plan('EDITADO'));
    });
    await act(async () => {
      await plans!.deleteCustomPlan('RESTAURADO-2');
    });
    expect(await onDisk()).toEqual(['EDITADO']);
  });

  it('the screen and the registry show the restored plans', async () => {
    const screen = await mount();
    expect(screen.getByText('RESTAURADO-1,RESTAURADO-2')).toBeTruthy();
    expect(getRegisteredCustomPlans().map(p => p.id)).toEqual([
      'RESTAURADO-1',
      'RESTAURADO-2',
    ]);
  });
});

describe('R9-30 — together groups after a restore', () => {
  let together: TogetherContextValue | null = null;
  function Capture() {
    together = useTogether();
    return <Text>ok</Text>;
  }

  const member = (name: string) => ({
    name,
    startDate: '2026-10-01',
    joinedAt: '2026-10-01T00:00:00.000Z',
  });

  async function mount() {
    await AsyncStorage.setItem(
      GROUPS_KEY,
      JSON.stringify({'plan-pre': member('PRE')}),
    );
    render(
      <TogetherProvider>
        <Capture />
      </TogetherProvider>,
    );
    await act(settle);
    expect(together!.getMembership('plan-pre')).not.toBeNull();
    await restore(
      GROUPS_KEY,
      JSON.stringify({
        'plan-a': member('RESTAURADO-A'),
        'plan-b': member('RESTAURADO-B'),
      }),
    );
  }

  const onDisk = async () =>
    Object.keys(
      JSON.parse((await AsyncStorage.getItem(GROUPS_KEY)) ?? '{}'),
    ).sort();

  it('a join keeps the restored groups', async () => {
    await mount();
    await act(async () => {
      await together!.joinPlan('plan-new', {startDate: '2026-11-01'});
    });
    expect(await onDisk()).toEqual(['plan-a', 'plan-b', 'plan-new']);
  });

  it('leaving a restored group writes, and keeps the other one', async () => {
    await mount();
    expect(together!.getMembership('plan-a')?.name).toBe('RESTAURADO-A');
    expect(together!.getMembership('plan-pre')).toBeNull();
    await act(async () => {
      await together!.leavePlan('plan-a');
    });
    expect(await onDisk()).toEqual(['plan-b']);
  });
});
