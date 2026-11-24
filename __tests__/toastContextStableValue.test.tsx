/**
 * R9-465 / R9-623 — `useToast()` keeps its identity across toasts.
 *
 * The provider re-renders on every show and every dismiss. It used to hand
 * out a fresh `{show, success, …}` object each time, so any consumer effect
 * with `toast` in its deps re-ran on every toast anywhere in the app — the
 * reader's 5 s reading timer re-armed and counted the chapter again, and
 * re-ticked an unticked plan day. Measured with the REAL provider and a
 * consumer that counts its effect runs.
 */
import {useEffect} from 'react';
import {render, act} from '@testing-library/react-native';
import {ToastProvider, useToast} from '../src/context/ToastContext';

const seen = new Set<unknown>();
let effectRuns = 0;
let latest: ReturnType<typeof useToast> | null = null;

function Consumer() {
  const toast = useToast();
  latest = toast;
  seen.add(toast);
  useEffect(() => {
    effectRuns++;
  }, [toast]);
  return null;
}

beforeEach(() => {
  jest.useFakeTimers();
  seen.clear();
  effectRuns = 0;
  latest = null;
});
afterEach(() => {
  jest.useRealTimers();
});

it('a toast shown and dismissed does not hand out a new value', async () => {
  const r = render(
    <ToastProvider>
      <Consumer />
    </ToastProvider>,
  );
  expect(effectRuns).toBe(1);

  for (const message of ['Copiado', 'Agregado a favoritos']) {
    await act(async () => {
      latest!.success(message, 1000);
    });
    // Past the auto-dismiss and its exit animation.
    await act(async () => {
      jest.advanceTimersByTime(3000);
    });
  }

  expect(seen.size).toBe(1);
  expect(effectRuns).toBe(1);
  r.unmount();
});

it('CONTROL: the provider does re-render on a toast (the toast is drawn)', async () => {
  // Without this, "one value" could just mean the provider never re-rendered.
  const r = render(
    <ToastProvider>
      <Consumer />
    </ToastProvider>,
  );
  expect(r.queryByText('Agregado a favoritos')).toBeNull();
  await act(async () => {
    latest!.success('Agregado a favoritos', 1000);
  });
  expect(r.getByText('Agregado a favoritos')).toBeTruthy();
  r.unmount();
});
