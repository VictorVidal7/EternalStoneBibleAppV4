/**
 * R9-36 — the conflicts screen shows, merges from, and merges ON TOP OF the
 * local copy as it is NOW, not `ConflictRecord.localVersion`.
 *
 * That record is a snapshot taken when the conflict was detected, and a
 * conflict waits for the user: in the meantime they can keep editing the same
 * doc. The screen used to paint "mine" from the snapshot, seed the merge draft
 * from it, and spread it under the merged value, so saving a merge put back
 * whatever the doc held at detection time in every field the user did not
 * touch in the modal.
 *
 * The engine here is a REAL `SyncEngine` with an in-memory adapter: only the
 * Firestore/NetInfo modules and the two context hooks the screen reads are
 * stood in for, so the answer to "what is the local copy now?" comes from the
 * engine's own read, not from a stub.
 */
import {act, fireEvent, render} from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ConflictsScreen from '../app/(tabs)/conflicts';
import {SyncEngine} from '../src/lib/sync/SyncEngine';
import type {SyncAdapter, SyncEntity} from '../src/lib/sync/types';
import {logger} from '../src/lib/utils/logger';

jest.spyOn(logger, 'info').mockImplementation(() => {});
jest.spyOn(logger, 'error').mockImplementation(() => {});

// ---- Firestore: onSnapshot callbacks and every `set`, keyed by path ----
const mockSnapshotCbs = new Map<string, (snapshot: unknown) => void>();
const mockSets: Array<{path: string; id: string; data: unknown}> = [];
jest.mock('../src/lib/sync/firestore', () => {
  const collection = (path: string) => {
    const query = {
      where: () => query,
      orderBy: () => query,
      limit: () => query,
      get: async () => ({docs: [], docChanges: () => [], size: 0}),
      onSnapshot: (cb: (snapshot: unknown) => void) => {
        mockSnapshotCbs.set(path, cb);
        return () => mockSnapshotCbs.delete(path);
      },
      doc: (id: string) => ({
        set: async (data: unknown) => {
          mockSets.push({path, id, data});
        },
      }),
    };
    return query;
  };
  const firestoreFn = () => ({collection});
  return {
    __esModule: true,
    getFirestore: () => firestoreFn,
    serverTimestamp: () => 'SERVER_TS',
    __resetFirestoreCacheForTests: () => {},
  };
});

jest.mock('@react-native-community/netinfo', () => ({
  __esModule: true,
  default: {
    addEventListener: () => () => {},
    fetch: () =>
      Promise.resolve({isConnected: true, isInternetReachable: true}),
  },
}));

// ---- the context: the two hooks the screen reads, backed by the real engine
let mockEngine: SyncEngine | null = null;
jest.mock('@context/SyncEngineContext', () => {
  const ReactActual = require('react');
  return {
    useSyncEngineOptional: () =>
      mockEngine
        ? {engine: mockEngine, state: mockEngine.getState()}
        : undefined,
    useConflicts: () => {
      const [conflicts, setConflicts] = ReactActual.useState(
        mockEngine!.getState().conflicts,
      );
      ReactActual.useEffect(
        () =>
          mockEngine!.subscribe((s: {conflicts: unknown}) =>
            setConflicts(s.conflicts),
          ),
        [],
      );
      return conflicts;
    },
  };
});

// Every focus callback the screen registers, so a test can re-invoke the
// latest one: "the user came back to this (hidden, still mounted) tab".
const focusCallbacks: Array<() => void> = [];
jest.mock('expo-router', () => {
  const ReactActual = require('react');
  return {
    useRouter: () => ({back: jest.fn(), push: jest.fn()}),
    useFocusEffect: (cb: () => void) => {
      focusCallbacks.push(cb);
      ReactActual.useEffect(cb, [cb]);
    },
  };
});

jest.mock('@expo/vector-icons', () => ({Ionicons: () => null}));

jest.mock('expo-linear-gradient', () => {
  const {View} = require('react-native');
  return {LinearGradient: View};
});

jest.mock('@lib/a11y/focusTrap', () => ({
  focusTrapProps: () => ({}),
}));

const mockToast = {success: jest.fn(), error: jest.fn()};
jest.mock('@context/ToastContext', () => ({
  useToast: () => mockToast,
}));

jest.mock('@hooks/useTheme', () => ({
  useTheme: () => ({
    colors: {
      background: '#000000',
      surface: '#111111',
      border: '#222222',
      primary: '#6366f1',
      text: '#ffffff',
      textSecondary: '#cccccc',
      textTertiary: '#999999',
      warning: '#f59e0b',
      error: '#ef4444',
      overlay: '#00000080',
    },
    gradient: undefined,
  }),
}));

jest.mock('@hooks/useLanguage', () => ({
  useLanguage: () => ({
    language: 'es',
    t: require('../src/i18n/translations').translations.es,
  }),
}));

const t = require('../src/i18n/translations').translations.es;

interface Highlight {
  color: string;
  note: string;
}

const UID = 'uid-pantalla';
const ORIGINAL = 'parrafo original';
const EDITADO = 'parrafo original + PARRAFO NUEVO QUE ACABO DE ESCRIBIR';
const COLOR_ORIGINAL = '#FFF59D';
const COLOR_NUEVO = '#A5D6A7';

async function settle(): Promise<void> {
  for (let i = 0; i < 5; i++) {
    await act(async () => {
      await new Promise(r => setImmediate(r));
    });
  }
}

/** A real conflict on `h1` from two minutes ago, only on `note`; then the
 *  user kept working on that same highlight: new paragraph AND new colour. */
async function conflictThenUserKeptEditing() {
  await AsyncStorage.setItem(`@sync_first_push_done:${UID}`, '2');
  const localStore = new Map<string, SyncEntity<Highlight>>();
  const adapter: SyncAdapter<Highlight> = {
    collection: 'highlights',
    async getLocal(id) {
      return localStore.get(id) ?? null;
    },
    async applyRemoteUpsert(id, data) {
      localStore.set(id, data);
    },
    async applyRemoteDelete(id) {
      localStore.delete(id);
    },
    async pullAllLocal() {
      return [];
    },
    getMaterialFields: () => ['color', 'note'],
  };
  const detectedAt = Date.now() - 120_000;
  localStore.set('h1', {
    color: COLOR_ORIGINAL,
    note: ORIGINAL,
    updatedAt: detectedAt,
  });
  const engine = new SyncEngine();
  mockEngine = engine;
  engine.register(adapter as SyncAdapter<unknown>);
  await engine.start(UID);
  mockSnapshotCbs.get(`users/${UID}/highlights`)!({
    docChanges: () => [
      {
        type: 'modified',
        doc: {
          id: 'h1',
          exists: true,
          data: () => ({
            color: COLOR_ORIGINAL,
            note: 'parrafo remoto',
            updatedAt: detectedAt + 5_000,
          }),
        },
      },
    ],
  });
  await settle();
  // Control: a real conflict, on `note` only, with the snapshot we expect.
  const [conflict] = engine.getConflicts();
  expect(conflict.differingFields).toEqual(['note']);
  expect(conflict.localVersion.note).toBe(ORIGINAL);

  localStore.set('h1', {
    color: COLOR_NUEVO,
    note: EDITADO,
    updatedAt: detectedAt + 60_000,
  });
  return {engine, localStore, conflict};
}

beforeEach(async () => {
  await AsyncStorage.clear();
  mockSnapshotCbs.clear();
  mockSets.length = 0;
  focusCallbacks.length = 0;
  mockToast.success.mockClear();
  mockToast.error.mockClear();
});

afterEach(() => {
  mockEngine?.stop();
  mockEngine = null;
});

describe('R9-36 — la pantalla de conflictos usa lo local de AHORA', () => {
  it('«Tu versión» muestra lo que el usuario escribió después de la detección, no la foto', async () => {
    await conflictThenUserKeptEditing();
    const screen = render(<ConflictsScreen />);
    await settle();

    expect(screen.queryByText(EDITADO)).toBeTruthy();
    // Control: la columna remota sí está, así que la tarjeta se pintó.
    expect(screen.queryByText('parrafo remoto')).toBeTruthy();
    expect(screen.queryByText(ORIGINAL)).toBeNull();
  });

  it('al volver a la pantalla (sigue montada: es una pestaña oculta) relee lo local', async () => {
    const {localStore} = await conflictThenUserKeptEditing();
    const screen = render(<ConflictsScreen />);
    await settle();
    expect(screen.queryByText(EDITADO)).toBeTruthy();

    // Se fue a seguir escribiendo y vuelve, sin que la pantalla se desmonte.
    const otraVez = `${EDITADO} + OTRA FRASE`;
    localStore.set('h1', {...localStore.get('h1')!, note: otraVez});
    // Lo que hace la navegación al volver a una pestaña montada: avisar del
    // foco. Nada más se vuelve a ejecutar.
    await act(async () => {
      focusCallbacks.at(-1)?.();
    });
    await settle();

    expect(screen.queryByText(otraVez)).toBeTruthy();
  });

  it('«Combinar» siembra el borrador y la pista «Tuya» con lo de AHORA', async () => {
    await conflictThenUserKeptEditing();
    const screen = render(<ConflictsScreen />);
    await settle();

    fireEvent.press(screen.getByLabelText(t.conflicts.merge));
    await settle();

    expect(
      screen.getByPlaceholderText(t.conflicts.mergePlaceholder).props.value,
    ).toBe(EDITADO);
    expect(
      screen.queryByText(
        new RegExp(`${t.conflicts.mineHint}: .*PARRAFO NUEVO`),
      ),
    ).toBeTruthy();
  });

  it('guardar la combinación no le devuelve la foto a los campos que no se tocaron en el modal', async () => {
    const {localStore} = await conflictThenUserKeptEditing();
    const screen = render(<ConflictsScreen />);
    await settle();

    fireEvent.press(screen.getByLabelText(t.conflicts.merge));
    await settle();
    fireEvent.changeText(
      screen.getByPlaceholderText(t.conflicts.mergePlaceholder),
      'nota combinada',
    );
    fireEvent.press(screen.getByText(t.conflicts.saveMerge));
    await settle();

    // Control: la combinación se guardó de verdad.
    expect(mockToast.success).toHaveBeenCalledWith(t.conflicts.resolvedToast);
    // El color lo cambió el usuario DESPUÉS de la detección, y no era un
    // campo en conflicto: el modal no lo muestra. Con la foto debajo, volvía
    // a COLOR_ORIGINAL en local y en la nube.
    const pushed = mockSets.filter(
      s => s.path === `users/${UID}/highlights` && s.id === 'h1',
    );
    expect({
      local: localStore.get('h1')
        ? {color: localStore.get('h1')!.color, note: localStore.get('h1')!.note}
        : null,
      pushed: pushed.map(s => {
        const d = s.data as Highlight;
        return {color: d.color, note: d.note};
      }),
    }).toEqual({
      local: {color: COLOR_NUEVO, note: 'nota combinada'},
      pushed: [{color: COLOR_NUEVO, note: 'nota combinada'}],
    });
  });

  it('si lo local ya no existe, «Combinar» no abre el modal con la foto: avisa', async () => {
    const {localStore} = await conflictThenUserKeptEditing();
    const screen = render(<ConflictsScreen />);
    await settle();
    localStore.delete('h1');

    fireEvent.press(screen.getByLabelText(t.conflicts.merge));
    await settle();

    expect(
      screen.queryByPlaceholderText(t.conflicts.mergePlaceholder),
    ).toBeNull();
    expect(mockToast.error).toHaveBeenCalledWith(t.conflicts.resolveError);
  });

  it('si lo local desaparece con el modal abierto, guardar no sube la foto: avisa y no resuelve', async () => {
    const {localStore, engine} = await conflictThenUserKeptEditing();
    const screen = render(<ConflictsScreen />);
    await settle();
    fireEvent.press(screen.getByLabelText(t.conflicts.merge));
    await settle();
    // Control: el modal está abierto.
    expect(
      screen.queryByPlaceholderText(t.conflicts.mergePlaceholder),
    ).toBeTruthy();

    localStore.delete('h1');
    fireEvent.press(screen.getByText(t.conflicts.saveMerge));
    await settle();
    await act(async () => {
      await engine.__flushForTests();
    });
    await settle();

    expect(mockToast.error).toHaveBeenCalledWith(t.conflicts.resolveError);
    expect(mockSets.filter(s => s.id === 'h1')).toEqual([]);
    expect(engine.getConflicts().map(c => c.id)).toEqual(['highlights__h1']);
  });

  it('«Mantener mía» desde la pantalla sube lo de AHORA', async () => {
    await conflictThenUserKeptEditing();
    const screen = render(<ConflictsScreen />);
    await settle();

    fireEvent.press(screen.getByLabelText(t.conflicts.keepMine));
    await settle();
    await act(async () => {
      await mockEngine!.__flushForTests();
    });
    await settle();

    expect(mockToast.success).toHaveBeenCalledWith(t.conflicts.resolvedToast);
    const pushed = mockSets
      .filter(s => s.path === `users/${UID}/highlights` && s.id === 'h1')
      .map(s => (s.data as Highlight).note);
    expect(pushed).toEqual([EDITADO]);
  });
});
