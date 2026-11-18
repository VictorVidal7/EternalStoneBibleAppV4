/**
 * R9-30 — `BibleVersionProvider` re-reads `@bible_version` when a backup is
 * restored.
 *
 * The key travels in the backup. The provider sits at the root and read the
 * key once on mount: after an import from Ajustes the whole app kept reading
 * the pre-import version until a cold start.
 *
 * Lo REAL: the provider and the restore signal, over the AsyncStorage mock.
 * Lo sustituido: the DB (which versions are installed) and the UI language.
 */
import {act, create, ReactTestRenderer} from 'react-test-renderer';
import AsyncStorage from '@react-native-async-storage/async-storage';

let mockInstalled: string[] = [];
jest.mock('../src/lib/database', () => {
  const db = {
    initialize: jest.fn(async () => {}),
    getDatabaseStats: jest.fn(async () => ({
      totalVerses: 93000,
      versions: mockInstalled,
    })),
  };
  return {__esModule: true, default: db, bibleDB: db};
});

let mockLanguage: 'en' | 'es' = 'en';
jest.mock('../src/hooks/useLanguage', () => ({
  useLanguage: () => ({language: mockLanguage}),
}));

import {
  BibleVersionProvider,
  useBibleVersion,
} from '../src/hooks/useBibleVersion';
import {
  __resetBackupRestoredListenersForTests,
  emitBackupRestored,
} from '../src/lib/backup/restoreSignal';

const KEY = '@bible_version';

// Every version the tree rendered with, in order, and the live context.
const seen: string[] = [];
let ctx: ReturnType<typeof useBibleVersion> | null = null;
function Spy() {
  ctx = useBibleVersion();
  seen.push(ctx.selectedVersion.id);
  return null;
}
const last = () => seen[seen.length - 1];

async function settle(turns = 20) {
  for (let i = 0; i < turns; i++) {
    await act(async () => {
      await Promise.resolve();
    });
  }
}

async function mount(): Promise<ReactTestRenderer> {
  let renderer: ReactTestRenderer | undefined;
  await act(async () => {
    renderer = create(
      <BibleVersionProvider>
        <Spy />
      </BibleVersionProvider>,
    );
  });
  await settle();
  return renderer as ReactTestRenderer;
}

/** The import's write, then its signal. Clears the setItem calls in between. */
async function restore(savedId: string) {
  await AsyncStorage.setItem(KEY, savedId);
  (AsyncStorage.setItem as jest.Mock).mockClear();
  seen.length = 0;
  await act(async () => {
    emitBackupRestored();
  });
  await settle();
}

describe('R9-30 — the version provider re-reads on a restore', () => {
  beforeEach(async () => {
    seen.length = 0;
    ctx = null;
    mockLanguage = 'en';
    mockInstalled = ['RVR1960', 'WEB', 'KJV', 'RV1909'];
    await AsyncStorage.clear();
    __resetBackupRestoredListenersForTests();
  });

  it('a restored installed version shows without a cold start, and the disk is not rewritten', async () => {
    await AsyncStorage.setItem(KEY, 'WEB');
    const renderer = await mount();
    expect(last()).toBe('WEB');

    await restore('RV1909');

    expect(last()).toBe('RV1909');
    expect(AsyncStorage.setItem as jest.Mock).not.toHaveBeenCalledWith(
      KEY,
      expect.anything(),
    );
    act(() => renderer.unmount());
  });

  it('a restored version this device lacks: its fallback shows at once, never the missing one, and the disk keeps the choice', async () => {
    mockLanguage = 'es';
    mockInstalled = ['RVR1960', 'WEB'];
    await AsyncStorage.setItem(KEY, 'RVR1960');
    const renderer = await mount();
    expect(last()).toBe('RVR1960');

    await restore('KJV');

    // Same-language bundled fallback, as on a cold start (R9-424).
    expect(last()).toBe('WEB');
    expect(seen).not.toContain('KJV');
    expect(await AsyncStorage.getItem(KEY)).toBe('KJV');
    act(() => renderer.unmount());
  });

  it('a pick made while the re-read is in flight is not overwritten by it', async () => {
    await AsyncStorage.setItem(KEY, 'WEB');
    const renderer = await mount();
    expect(last()).toBe('WEB');

    // The mock's getItem is a jest.fn: keep its implementation.
    await AsyncStorage.setItem(KEY, 'RV1909');
    const getItemMock = AsyncStorage.getItem as jest.Mock;
    const realImpl = getItemMock.getMockImplementation()!;
    let release: (() => void) | undefined;
    const gate = new Promise<void>(r => (release = r));
    getItemMock.mockImplementation(async (k: string) => {
      const value = await realImpl(k);
      await gate;
      return value; // 'RV1909': what the disk held when the read started
    });
    try {
      await act(async () => {
        emitBackupRestored();
      });
      await act(async () => {
        await ctx?.setVersion('KJV');
      });
      expect(last()).toBe('KJV');

      await act(async () => {
        release?.();
      });
      await settle();
    } finally {
      getItemMock.mockImplementation(realImpl);
    }

    expect(last()).toBe('KJV');
    expect(await AsyncStorage.getItem(KEY)).toBe('KJV');
    act(() => renderer.unmount());
  });
});
