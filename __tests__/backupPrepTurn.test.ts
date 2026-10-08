/**
 * R9-273 — el respaldo escribe la Mesa de preparacion en su turno (el de
 * `prepAccount`), con las escrituras de los stores y las uniones.
 *
 * `importBackup` real; `bibleDB` y `AchievementService` mockeados como en
 * `backupServiceImport.test.ts`. En un archivo aparte: alli una prueba hace
 * `spyOn` sobre el `multiSet` del mock (un `jest.fn`), y su `mockRestore` lo
 * deja llamandose a si mismo para las que vienen despues.
 *
 * R9-275 — la parte de SQLite del respaldo puede esperar en una puerta
 * (`mockSqlite`): la clave de la Mesa ya esta resuelta, y falta escribirla.
 */
const mockSqlite: {puerta: Promise<void> | null; retenida: number} = {
  puerta: null,
  retenida: 0,
};
jest.mock('../src/lib/database', () => {
  const instance = {
    initialize: jest.fn().mockResolvedValue(undefined),
    getDatabase: jest.fn().mockResolvedValue({
      withTransactionAsync: async (fn: () => Promise<void>) => {
        if (mockSqlite.puerta) {
          mockSqlite.retenida += 1;
          await mockSqlite.puerta;
        }
        return fn();
      },
    }),
    executeSql: jest.fn(async () => ({rows: {_array: [], length: 0}})),
  };
  return {
    __esModule: true,
    default: instance,
    bibleDB: instance,
    BibleDatabase: jest.fn(),
    __mockInstance: instance,
  };
});

jest.mock('../src/lib/achievements/AchievementService', () => {
  const instance = {
    initialize: jest.fn().mockResolvedValue(undefined),
    restoreBackup: jest.fn().mockResolvedValue(undefined),
  };
  return {
    AchievementService: jest.fn().mockImplementation(() => instance),
    __mockInstance: instance,
  };
});

import AsyncStorage from '@react-native-async-storage/async-storage';
import {setAchievementServiceInstance} from '../src/lib/achievements/instance';
import {
  importBackup,
  BACKUP_FORMAT_VERSION,
  type BackupPayload,
} from '../src/services/BackupService';
import {
  __resetPrepAccountForTests,
  adoptNoAccountPrep,
  managePrepAccount,
  releasePrepAccount,
  setPrepAccount,
} from '../src/features/study/prepAccount';
import * as prepAccount from '../src/features/study/prepAccount';
import {savePrepNote} from '../src/features/study/prepNotesStore';

/** Un respaldo v2 sin nada mas que la Mesa (las notas de `notes`). */
function respaldoConMesa(notes: unknown): BackupPayload {
  return {
    formatVersion: BACKUP_FORMAT_VERSION,
    generatedAt: '2026-01-01T00:00:00.000Z',
    app: {name: 'Eternal Stone Bible', package: 'com.eternalstonebible.app'},
    bible: {
      favorites: [],
      notes: [],
      highlights: [],
      lastReadPosition: null,
      chapterProgressMap: null,
    },
    user: {
      readingPlanProgress: undefined,
      readingPlanReadChapters: undefined,
      searchHistory: undefined,
      readerPreferences: {sideBySide: false},
      readerPreferencesFull: null,
      appTheme: {mode: null, colorTheme: null},
    },
    achievements: {
      stats: {
        totalVersesRead: 0,
        totalChaptersRead: 0,
        totalBooksCompleted: 0,
        totalReadingTime: 0,
        currentStreak: 0,
        longestStreak: 0,
        lastReadDate: null,
        totalHighlights: 0,
        totalNotes: 0,
        totalBookmarks: 0,
        totalSearches: 0,
        totalShares: 0,
        level: 1,
        totalPoints: 0,
      },
      achievements: [],
      streakLog: [],
      completedBooks: [],
      bookReadingLog: [],
      chaptersReadLog: [],
    },
    memory: {memoryDeck: null, reviewEvents: []},
    prep: {notes, series: null},
  } as unknown as BackupPayload;
}

beforeEach(async () => {
  __resetPrepAccountForTests();
  await AsyncStorage.clear();
  setAchievementServiceInstance(null);
});

afterEach(() => {
  __resetPrepAccountForTests();
});

it('R9-273: restaurado mientras corre una union, o la escritura de un store, el respaldo no se pierde', async () => {
  const T = Date.now() - 60 * 60 * 1000;
  const P = 'John/3/16-21';
  const R = 'Ps/23/1-6';
  const ms = AsyncStorage.multiSet as unknown as jest.Mock;
  const real = ms.getMockImplementation()!;
  const pasajes = async (k: string) => {
    const raw = await AsyncStorage.getItem(k);
    return raw == null ? null : Object.keys(JSON.parse(raw)).sort();
  };
  // Sin sesion, la Mesa «sin cuenta» tiene P. La escritura que `retener`
  // elige espera en una puerta; mientras, se restaura un respaldo con R.
  const caso = async (
    retener: (pairs: Array<[string, string]>) => boolean,
    empezar: () => Promise<void>,
  ) => {
    __resetPrepAccountForTests();
    await AsyncStorage.clear();
    managePrepAccount();
    await setPrepAccount(null);
    await savePrepNote(P, 'observation', 'sin cuenta', T);
    let abrir!: () => void;
    const puerta = new Promise<void>(r => (abrir = r));
    let retenida = 0;
    ms.mockImplementation(async (pairs: Array<[string, string]>) => {
      if (retener(pairs)) {
        retenida += 1;
        await puerta;
      }
      return real(pairs);
    });
    let restaurado = false;
    const turno = jest.spyOn(prepAccount, 'prepMultiSet');
    try {
      const primero = empezar();
      await new Promise(r => setImmediate(r));
      const respaldo = importBackup(
        respaldoConMesa({
          [R]: {sections: {observation: 'del respaldo'}, updatedAt: T},
        }),
      ).then(r => {
        restaurado = r.restoredSections.includes('prepNotes');
      });
      // Sin turno, el respaldo termina con la otra escritura retenida.
      for (let i = 0; i < 20 && !restaurado; i++) {
        await new Promise(r => setImmediate(r));
      }
      // Con el turno, la vuelta no sale antes: un respaldo mas lento que ella
      // no llegaba a escribir, y sin el turno pasaba igual (R9-291). Cuenta el
      // PEDIDO, no la escritura: sin turno y con la escritura 20 vueltas
      // despues, esta prueba pasa (R9-293). Eso lo ve la de R9-292.
      const turnoPedido = turno.mock.calls.length;
      turno.mockRestore();
      const antesDeAbrir = restaurado;
      abrir();
      await primero;
      await respaldo;
      return {
        retenida, // CONTROL: la otra escritura se retuvo
        turnoPedido, // CONTROL: el respaldo pidio el turno antes de abrir
        antesDeAbrir,
        restaurado,
        sinCuenta: await pasajes('@prep_notes'),
        ana: await pasajes('@prep_notes:ana'),
      };
    } finally {
      turno.mockRestore();
      abrir();
      ms.mockImplementation(real);
    }
  };
  // La union de un inicio de sesion (su escritura, en la Mesa de Ana).
  const union = await caso(
    pairs => pairs.some(([k]) => k.endsWith(':ana')),
    () => adoptNoAccountPrep('ana'),
  );
  // La escritura de un store, entre su lectura y su escritura.
  const store = await caso(
    pairs => pairs.some(([, v]) => v.includes('durante')),
    () => savePrepNote(P, 'application', 'durante', T + 1000),
  );
  // Sin R9-273, la union pisaba lo restaurado (lo borraba con su clave), y el
  // store escribia encima lo que habia leido antes: R no quedaba en ninguna
  // Mesa, y la restauracion decia que si. En su turno, el respaldo espera a la
  // otra escritura, y despues reemplaza la Mesa, que es lo que hace un
  // respaldo.
  expect({union, store}).toEqual({
    union: {
      retenida: 1,
      turnoPedido: 1,
      antesDeAbrir: false,
      restaurado: true,
      sinCuenta: [R],
      ana: [P],
    },
    store: {
      retenida: 1,
      turnoPedido: 1,
      antesDeAbrir: false,
      restaurado: true,
      sinCuenta: [R],
      ana: null,
    },
  });
});

it('R9-292: con la escritura del respaldo retenida, ninguna otra escritura de la Mesa corre', async () => {
  const T = Date.now() - 60 * 60 * 1000;
  const P = 'John/3/16-21';
  const R = 'Ps/23/1-6';
  const Q = 'Rom/8/28';
  const ms = AsyncStorage.multiSet as unknown as jest.Mock;
  const real = ms.getMockImplementation()!;
  const pasajes = async (k: string) => {
    const raw = await AsyncStorage.getItem(k);
    return raw == null ? null : Object.keys(JSON.parse(raw)).sort();
  };
  // La escritura del respaldo en la Mesa «sin cuenta» (la reconoce su clave y
  // su contenido, no el orden) espera en una puerta, y DESPUES se pide otra
  // escritura de la Mesa. Con `borrada`, Ana tiene P y su cuenta se borra con
  // el respaldo en SQLite: la escritura retenida es la devolucion (R9-275).
  // Con `pedidaAntes`, la otra se pide ANTES de empezar el respaldo, con su
  // clave sin resolver, y la clave se suelta con la del respaldo retenida: un
  // respaldo que deja correr sin turno lo pedido antes de una marca suya la
  // veia solo si la marca iba antes de soltar la clave (R9-309).
  const caso = async (
    borrada: boolean,
    otra: () => Promise<void>,
    esOtra: (pairs: Array<[string, string]>) => boolean,
    pedidaAntes = false,
  ) => {
    __resetPrepAccountForTests();
    await AsyncStorage.clear();
    managePrepAccount();
    await setPrepAccount(borrada ? 'ana' : null);
    await savePrepNote(P, 'observation', 'antes', T);
    mockSqlite.retenida = 0;
    let abrir!: () => void;
    const puerta = new Promise<void>(r => (abrir = r));
    let abrirSqlite: (() => void) | undefined;
    if (borrada) mockSqlite.puerta = new Promise<void>(r => (abrirSqlite = r));
    let retenida = 0;
    let escribio = 0;
    ms.mockImplementation(async (pairs: Array<[string, string]>) => {
      if (
        pairs.some(
          ([k, v]) => k === '@prep_notes' && v.includes('del respaldo'),
        )
      ) {
        retenida += 1;
        await puerta;
      } else if (esOtra(pairs)) {
        escribio += 1;
      }
      return real(pairs);
    });
    let restaurado = false;
    const turno = jest.spyOn(prepAccount, 'prepMultiSet');
    let soltarClave = () => {};
    try {
      let segunda: Promise<void> | undefined;
      let otraPedidaAntes = 0;
      if (pedidaAntes) {
        const clave = jest
          .spyOn(prepAccount, 'prepKey')
          .mockReturnValueOnce(
            new Promise<string>(r => (soltarClave = () => r('@prep_notes'))),
          );
        const pide = jest.spyOn(prepAccount, 'prepWrite');
        segunda = otra();
        for (let i = 0; i < 20 && pide.mock.calls.length === 0; i++) {
          await new Promise(r => setImmediate(r));
        }
        otraPedidaAntes = pide.mock.calls.length;
        clave.mockRestore();
        pide.mockRestore();
      }
      const respaldo = importBackup(
        respaldoConMesa({
          [R]: {sections: {observation: 'del respaldo'}, updatedAt: T},
        }),
      ).then(r => {
        restaurado = r.restoredSections.includes('prepNotes');
      });
      if (borrada) {
        for (let i = 0; i < 20; i++) await new Promise(r => setImmediate(r));
        await releasePrepAccount('ana');
        await setPrepAccount(null);
        mockSqlite.puerta = null;
        abrirSqlite!();
      }
      // Las 40 enteras, aunque la escritura llegue antes: un respaldo que
      // suelta el turno con la suya en vuelo lo hace en estas vueltas, y
      // saliendo en cuanto llegaba, la otra escritura se pedia antes (la
      // regla de R9-290: lo que pasa en las vueltas que sobran).
      for (let i = 0; i < 40; i++) await new Promise(r => setImmediate(r));
      const llego = retenida;
      const pedido = turno.mock.calls.length;
      turno.mockRestore();
      if (segunda) soltarClave();
      else segunda = otra();
      for (let i = 0; i < 20; i++) await new Promise(r => setImmediate(r));
      const escribioConElRespaldoRetenido = escribio;
      abrir();
      await respaldo;
      await segunda;
      return {
        // CONTROL: con `pedidaAntes`, la otra esperaba su clave en
        // `prepWrite` antes de que empezara el respaldo.
        otraPedidaAntes,
        // CONTROL: con `borrada`, el respaldo espero en SQLite con la clave de
        // Ana (como `durante` en R9-275); si no, el rojo de un respaldo mas
        // lento se leia como una perdida de P.
        retenidaSqlite: mockSqlite.retenida,
        retenida: llego, // CONTROL: la escritura del respaldo llego y se retuvo
        pedido, // CONTROL: por `prepMultiSet`
        escribioConElRespaldoRetenido,
        restaurado,
        sinCuenta: await pasajes('@prep_notes'),
        ana: await pasajes('@prep_notes:ana'),
      };
    } finally {
      turno.mockRestore();
      abrir();
      // Sin soltarla, la cola de `savePrepNote` quedaba colgada para las
      // pruebas siguientes.
      soltarClave();
      mockSqlite.puerta = null;
      abrirSqlite?.();
      ms.mockImplementation(real);
    }
  };
  const store = () => savePrepNote(Q, 'observation', 'despues', T + 2000);
  const deStore = (pairs: Array<[string, string]>) =>
    pairs.some(([, v]) => v.includes('despues'));
  const deUnion = (pairs: Array<[string, string]>) =>
    pairs.some(([k]) => k.endsWith(':ana'));
  const conStore = await caso(false, store, deStore);
  const conUnion = await caso(false, () => adoptNoAccountPrep('ana'), deUnion);
  const devolucion = await caso(true, store, deStore);
  const pedidaAntes = await caso(false, store, deStore, true);
  // R9-273 pide el turno; esta mira que lo use para TODA su escritura. Si el
  // respaldo lo suelta antes de escribir (o escribe fuera de el, o deja la
  // devolucion fuera), la otra escritura corre con la suya en vuelo, y la que
  // termina despues pisa a la otra: lo restaurado se perdia, y la
  // restauracion decia que si (R9-292, R9-293, R9-294). El conteo de
  // `prepMultiSet` no lo ve: el pedido se hace igual.
  expect({conStore, conUnion, devolucion, pedidaAntes}).toEqual({
    conStore: {
      otraPedidaAntes: 0,
      retenidaSqlite: 0,
      retenida: 1,
      pedido: 1,
      escribioConElRespaldoRetenido: 0,
      restaurado: true,
      sinCuenta: [R, Q],
      ana: null,
    },
    conUnion: {
      otraPedidaAntes: 0,
      retenidaSqlite: 0,
      retenida: 1,
      pedido: 1,
      escribioConElRespaldoRetenido: 0,
      restaurado: true,
      sinCuenta: null,
      ana: [R],
    },
    devolucion: {
      otraPedidaAntes: 0,
      retenidaSqlite: 1,
      retenida: 1,
      pedido: 1,
      escribioConElRespaldoRetenido: 0,
      restaurado: true,
      sinCuenta: [P, R, Q],
      ana: null,
    },
    pedidaAntes: {
      otraPedidaAntes: 1,
      retenidaSqlite: 0,
      retenida: 1,
      pedido: 1,
      escribioConElRespaldoRetenido: 0,
      restaurado: true,
      sinCuenta: [R, Q],
      ana: null,
    },
  });
});

it('R9-275: restaurado mientras se borra la cuenta, lo restaurado va con su Mesa a la «sin cuenta», no bajo el uid borrado', async () => {
  const T = Date.now() - 60 * 60 * 1000;
  const P = 'John/3/16-21';
  const R = 'Ps/23/1-6';
  const pasajes = async (k: string) => {
    const raw = await AsyncStorage.getItem(k);
    return raw == null ? null : Object.keys(JSON.parse(raw)).sort();
  };
  const ms = AsyncStorage.multiSet as unknown as jest.Mock;
  const real = ms.getMockImplementation()!;
  // Ana tiene P en su Mesa. El respaldo (con R) resuelve su clave, la de Ana;
  // `durante`, su parte de SQLite espera en una puerta mientras se borra la
  // cuenta (la devolucion de `deleteAccount` y el estado nulo). `muere`: como
  // `durante`, y el proceso termina en la devolucion que hace el respaldo (su
  // escritura en la Mesa «sin cuenta» no vuelve nunca).
  const caso = async (cuando: 'antes' | 'durante' | 'muere') => {
    __resetPrepAccountForTests();
    await AsyncStorage.clear();
    managePrepAccount();
    await setPrepAccount('ana');
    await savePrepNote(P, 'observation', 'de Ana', T);
    let abrir!: () => void;
    mockSqlite.retenida = 0;
    if (cuando !== 'antes') {
      mockSqlite.puerta = new Promise<void>(r => (abrir = r));
    }
    let restaurado: boolean | null = null;
    try {
      const respaldo = importBackup(
        respaldoConMesa({
          [R]: {sections: {observation: 'del respaldo'}, updatedAt: T},
        }),
      ).then(r => {
        restaurado = r.restoredSections.includes('prepNotes');
      });
      if (cuando === 'antes') await respaldo;
      for (let i = 0; i < 20; i++) await new Promise(r => setImmediate(r));
      const antesDeBorrar = restaurado;
      await releasePrepAccount('ana');
      await setPrepAccount(null);
      mockSqlite.puerta = null;
      // Los pasajes de cada escritura colgada de la Mesa «sin cuenta».
      const colgando: string[][] = [];
      let colgadas: string[][] = [];
      if (cuando === 'muere') {
        ms.mockImplementation(async (pairs: Array<[string, string]>) => {
          const sinCuenta = pairs.find(([k]) => k === '@prep_notes');
          if (!sinCuenta) return real(pairs);
          colgando.push(Object.keys(JSON.parse(sinCuenta[1])).sort());
          return new Promise(() => {});
        });
      }
      if (cuando !== 'antes') abrir();
      if (cuando === 'muere') {
        // Con 20 vueltas fijas, un respaldo mas lento no llegaba a la
        // devolucion, y la prueba caia como si se perdiera lo restaurado
        // (R9-290): `colgadas` dice si llego en estas 20, y QUE se colgo. Un
        // conteo daba 1 tambien con otra escritura de la Mesa «sin cuenta» (la
        // devolucion de `releasePrepAccount` sin esperar), y el rojo se leia
        // como una perdida con el respaldo detras, sin escribir (R9-295).
        // Despues, 20 vueltas mas con la devolucion colgada, para ver lo que
        // el proceso hace mientras tanto.
        for (let i = 0; i < 20 && colgando.length === 0; i++) {
          await new Promise(r => setImmediate(r));
        }
        colgadas = [...colgando];
        for (let i = 0; i < 20; i++) await new Promise(r => setImmediate(r));
        ms.mockImplementation(real);
      } else {
        await respaldo;
      }
      // El proceso siguiente, sin sesion.
      __resetPrepAccountForTests();
      managePrepAccount();
      await setPrepAccount(null);
      return {
        retenida: mockSqlite.retenida, // CONTROL: el respaldo espero en SQLite
        antesDeBorrar, // CONTROL: y no habia terminado al borrar la cuenta
        colgadas, // CONTROL: en `muere`, la devolucion del respaldo (con P y R)
        restaurado,
        sinCuenta: await pasajes('@prep_notes'),
        ana: await pasajes('@prep_notes:ana'),
        nota: await AsyncStorage.getItem('@prep_release_pending'),
      };
    } finally {
      mockSqlite.puerta = null;
      abrir?.();
      ms.mockImplementation(real);
    }
  };
  const antes = await caso('antes');
  const durante = await caso('durante');
  const muere = await caso('muere');
  // Sin R9-275, el respaldo escribia la Mesa de Ana despues de su devolucion:
  // R se quedaba bajo el uid borrado, que nadie vuelve a leer, y la
  // restauracion decia que si. Ahora termina como si se hubiera restaurado
  // antes de borrar la cuenta (con P tambien, que la devolucion ya movio). Y
  // si el proceso termina en esa devolucion, la nota (escrita antes) hace que
  // el arranque siguiente la termine.
  expect({antes, durante, muere}).toEqual({
    antes: {
      retenida: 0,
      antesDeBorrar: true,
      colgadas: [],
      restaurado: true,
      sinCuenta: [R],
      ana: null,
      nota: null,
    },
    durante: {
      retenida: 1,
      antesDeBorrar: null,
      colgadas: [],
      restaurado: true,
      sinCuenta: [P, R],
      ana: null,
      nota: null,
    },
    muere: {
      retenida: 1,
      antesDeBorrar: null,
      colgadas: [[P, R]],
      restaurado: null, // el proceso termino antes
      sinCuenta: [P, R],
      ana: null,
      nota: null,
    },
  });
});
