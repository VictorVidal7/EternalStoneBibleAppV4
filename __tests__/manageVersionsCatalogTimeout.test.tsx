/**
 * R9-40 — «Buscando versiones disponibles…» must not spin forever.
 *
 * On a network that accepts the connection and never answers, React Native's
 * `fetch` never settles. `ManageVersionsSection` only shows «Reintentar» when
 * the catalog fetch REJECTS, so a hung fetch left the spinner up for good.
 *
 * Lo REAL: the section, `fetchVersionCatalog` and its deadline. Lo sustituido:
 * the network (`global.fetch`), the SQLite layer the service imports, and the
 * contexts the section reads for colors, words and the installed list.
 */
import {act, fireEvent, render} from '@testing-library/react-native';

jest.mock('expo-file-system/legacy', () => ({
  cacheDirectory: '/cache/',
  deleteAsync: jest.fn(),
}));
jest.mock('expo-file-system', () => ({File: jest.fn()}));
jest.mock('../src/lib/database', () => ({
  __esModule: true,
  default: {},
}));
jest.mock('@expo/vector-icons', () => ({Ionicons: () => null}));
jest.mock('@lib/haptics', () => ({
  haptics: {tap: jest.fn(), success: jest.fn(), selection: jest.fn()},
}));
jest.mock('@hooks/useTheme', () => {
  const actual = jest.requireActual('../src/hooks/useTheme');
  const value = {colors: actual.lightColors, isDark: false};
  return {useTheme: () => value};
});
jest.mock('@hooks/useLanguage', () => {
  const value = {
    language: 'en',
    t: require('../src/i18n/translations').translations.en,
  };
  return {useLanguage: () => value};
});
jest.mock('@hooks/useBibleVersion', () => {
  const value = {
    installedVersionIds: ['RVR1960'],
    refreshInstalledVersions: jest.fn(),
  };
  return {useBibleVersion: () => value};
});
jest.mock('@context/ToastContext', () => {
  const value = {success: jest.fn(), error: jest.fn(), info: jest.fn()};
  return {useToast: () => value};
});

import ManageVersionsSection from '../src/components/settings/ManageVersionsSection';
import {CATALOG_TIMEOUT_MS} from '../src/lib/database/version-download-service';
import {translations} from '../src/i18n/translations';

const s = translations.en.settings;
const realFetch = global.fetch;

async function flush() {
  for (let i = 0; i < 5; i++) {
    await act(async () => {
      await Promise.resolve();
    });
  }
}

beforeEach(() => jest.useFakeTimers());
afterEach(() => {
  jest.clearAllTimers();
  jest.useRealTimers();
  global.fetch = realFetch;
});

describe('R9-40 — the catalog fetch has a deadline', () => {
  it('a fetch that never settles (and ignores the abort) ends in «Retry»', async () => {
    global.fetch = jest.fn(() => new Promise(() => {})) as never;
    const screen = render(<ManageVersionsSection />);
    await flush();
    expect(screen.getByText(s.manageVersionsLoading)).toBeTruthy();

    await act(async () => {
      jest.advanceTimersByTime(CATALOG_TIMEOUT_MS);
    });
    await flush();

    expect(screen.queryByText(s.manageVersionsLoading)).toBeNull();
    expect(screen.getByText(s.manageVersionsError)).toBeTruthy();
    expect(screen.getByText(s.manageVersionsRetry)).toBeTruthy();
  });

  it('the fetch gets a signal, and the deadline aborts it', async () => {
    let signal: AbortSignal | undefined;
    global.fetch = jest.fn(
      (_url: string, init?: {signal?: AbortSignal}) =>
        new Promise((_, reject) => {
          signal = init?.signal;
          signal?.addEventListener('abort', () => reject(new Error('Aborted')));
        }),
    ) as never;
    const screen = render(<ManageVersionsSection />);
    await flush();
    expect(signal?.aborted).toBe(false);

    await act(async () => {
      jest.advanceTimersByTime(CATALOG_TIMEOUT_MS);
    });
    await flush();

    expect(signal?.aborted).toBe(true);
    expect(screen.getByText(s.manageVersionsRetry)).toBeTruthy();
  });

  it('CONTROL: «Retry» after the timeout loads the catalog when the network answers', async () => {
    global.fetch = jest.fn(() => new Promise(() => {})) as never;
    const screen = render(<ManageVersionsSection />);
    await flush();
    await act(async () => {
      jest.advanceTimersByTime(CATALOG_TIMEOUT_MS);
    });
    await flush();

    global.fetch = jest.fn(async () => ({
      ok: true,
      json: async () => ({schema: 1, versions: []}),
    })) as never;
    fireEvent.press(screen.getByText(s.manageVersionsRetry));
    await flush();

    expect(screen.queryByText(s.manageVersionsError)).toBeNull();
    expect(screen.getByText(s.manageVersionsEmpty)).toBeTruthy();
  });

  it('CONTROL: a slow answer just under the deadline still lists the catalog', async () => {
    global.fetch = jest.fn(
      () =>
        new Promise(resolve =>
          setTimeout(
            () =>
              resolve({
                ok: true,
                json: async () => ({schema: 1, versions: []}),
              }),
            CATALOG_TIMEOUT_MS - 1,
          ),
        ),
    ) as never;
    const screen = render(<ManageVersionsSection />);
    await flush();
    await act(async () => {
      jest.advanceTimersByTime(CATALOG_TIMEOUT_MS - 1);
    });
    await flush();
    await act(async () => {
      jest.advanceTimersByTime(5);
    });
    await flush();

    expect(screen.queryByText(s.manageVersionsError)).toBeNull();
    expect(screen.getByText(s.manageVersionsEmpty)).toBeTruthy();
  });
});
