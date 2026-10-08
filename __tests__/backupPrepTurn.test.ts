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

/**
 * `releasePrepAccount(uid)` con el respaldo esperando en SQLite, con tope. Si
 * la devolucion esperara algo que la prueba suelta despues, esperarla sin tope
 * colgaba la prueba 20 s y tumbaba la siguiente (R9-313, R9-316): pasado el
 * tope (1000 vueltas), `salida` suelta todo lo retenido, y el rojo lo dice
 * (`'trabada'`). Si tarda mas de 100, da `'tarde'`: una devolucion lenta no da
 * el rojo de la traba.
 */
async function devolverConTope(
  uid: string,
  salida: () => void,
): Promise<'a tiempo' | 'tarde' | 'trabada'> {
  let volvio = false;
  const devolver = releasePrepAccount(uid).then(() => {
    volvio = true;
  });
  let vueltas = 0;
  while (!volvio && vueltas < 1000) {
    await new Promise(r => setImmediate(r));
    vueltas += 1;
  }
  const devuelta = !volvio ? 'trabada' : vueltas <= 100 ? 'a tiempo' : 'tarde';
  if (!volvio) salida();
  await devolver;
  return devuelta;
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
  // clave retenida (un `spyOn` de `prepKey`), y la clave se suelta con la del
  // respaldo retenida. Un respaldo que deja correr sin turno lo pedido antes
  // de una marca suya: con la marca al empezar, en SQLite o al salir de SQLite
  // (antes de avisar que restaura), este caso cae; el caso `pedido antes` de
  // R9-287, solo con las dos primeras (R9-309). Con los dos, la clave de la
  // otra es la de Ana, y se suelta con la DEVOLUCION retenida: el turno del
  // respaldo sigue despues de su `multiSet`, y una marca entre los dos no la
  // veia ningun otro caso (R9-313).
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
      } else if (esOtra(pairs) && retenida > 0) {
        // Desde que la del respaldo llego a la puerta: lo de la otra que va
        // antes, el respaldo lo reemplaza (se ve en `sinCuenta`), y contado
        // desde el principio el rojo decia `escribioConElRespaldoRetenido: 1`
        // con la clave sin retener o con `retenida: 0` (R9-311).
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
      let devuelta: 'a tiempo' | 'tarde' | 'trabada' | null = null;
      if (pedidaAntes) {
        const claveRetenida = new Promise<string>(
          r =>
            (soltarClave = () =>
              r(borrada ? '@prep_notes:ana' : '@prep_notes')),
        );
        const clave = jest
          .spyOn(prepAccount, 'prepKey')
          .mockReturnValueOnce(claveRetenida);
        const pide = jest.spyOn(prepAccount, 'prepWrite');
        // Las claves que `prepWrite` recibio y siguen pendientes tras una
        // vuelta: con el primer estado de auth ya dado, solo la retenida, o
        // algo que espera por ella. Comparar la promesa daba 0 con el caso
        // armado si el store la envolvia (`.then`, un helper `async`: R9-315).
        // Espera hasta 40 vueltas: un store mas lento da solo `0`, sin perder
        // nada (con la clave de otro lado, la otra se pierde tambien).
        const resueltas = new Set<Promise<string>>();
        const conLaRetenida = async () => {
          for (const [k] of pide.mock.calls) {
            void k.then(() => resueltas.add(k));
          }
          await new Promise(r => setImmediate(r));
          return pide.mock.calls.filter(([k]) => !resueltas.has(k)).length;
        };
        segunda = otra();
        for (let i = 0; i < 20 && (await conLaRetenida()) === 0; i++) {
          await new Promise(r => setImmediate(r));
        }
        otraPedidaAntes = await conLaRetenida();
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
        // Con `pedidaAntes`, la devolucion de `releasePrepAccount` pide el
        // turno con la otra esperando su clave. Si la otra tomara el turno
        // ANTES de su clave (R9-310), se trabarian: la devolucion espera a la
        // otra, y la otra a su clave, que se suelta despues (R9-313). Y si el
        // respaldo tomara el turno antes de SQLite, la devolucion lo esperaria
        // a el, y el a la puerta de SQLite, que se abre despues (R9-316).
        // Pasado el tope se suelta todo: la clave, SQLite y la puerta del
        // respaldo (soltando solo la clave, esa seguia colgada).
        devuelta = await devolverConTope('ana', () => {
          soltarClave();
          mockSqlite.puerta = null;
          abrirSqlite!();
          abrir();
        });
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
        // CONTROL: con `pedidaAntes`, `prepWrite` recibio una clave que seguia
        // pendiente (la retenida) antes de que empezara el respaldo. Con la
        // clave de otro lado (el store con `prepKey` guardado, o una clave de
        // mas pedida antes), la otra escribe antes del respaldo, y el respaldo
        // la reemplaza: contando cualquier `prepWrite`, el rojo era el de un
        // turno roto (R9-311). Mira `prepWrite` por el modulo: guardado al
        // cargar, da 0 con el caso armado.
        otraPedidaAntes,
        // CONTROL: con `borrada`, la devolucion de `releasePrepAccount` volvio
        // a tiempo, y sin soltar antes la clave de la otra.
        devuelta,
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
  const devolucionPedidaAntes = await caso(true, store, deStore, true);
  // R9-273 pide el turno; esta mira que lo use para TODA su escritura. Si el
  // respaldo lo suelta antes de escribir (o escribe fuera de el, o deja la
  // devolucion fuera), la otra escritura corre con la suya en vuelo, y la que
  // termina despues pisa a la otra: lo restaurado se perdia, y la
  // restauracion decia que si (R9-292, R9-293, R9-294). El conteo de
  // `prepMultiSet` no lo ve: el pedido se hace igual.
  expect({
    conStore,
    conUnion,
    devolucion,
    pedidaAntes,
    devolucionPedidaAntes,
  }).toEqual({
    conStore: {
      otraPedidaAntes: 0,
      devuelta: null,
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
      devuelta: null,
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
      devuelta: 'a tiempo',
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
      devuelta: null,
      retenidaSqlite: 0,
      retenida: 1,
      pedido: 1,
      escribioConElRespaldoRetenido: 0,
      restaurado: true,
      sinCuenta: [R, Q],
      ana: null,
    },
    devolucionPedidaAntes: {
      otraPedidaAntes: 1,
      devuelta: 'a tiempo',
      retenidaSqlite: 1,
      retenida: 1,
      pedido: 1,
      escribioConElRespaldoRetenido: 0,
      restaurado: true,
      sinCuenta: [P, R, Q],
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
      // Si la devolucion esperara al respaldo (con el turno de la Mesa desde
      // antes de SQLite), el respaldo esperaria la puerta, que se abre
      // despues: pasado el tope se abre (R9-316).
      const devuelta = await devolverConTope('ana', () => {
        mockSqlite.puerta = null;
        abrir?.();
      });
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
        devuelta, // CONTROL: la devolucion volvio a tiempo, sin la salida
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
      devuelta: 'a tiempo',
      colgadas: [],
      restaurado: true,
      sinCuenta: [R],
      ana: null,
      nota: null,
    },
    durante: {
      retenida: 1,
      antesDeBorrar: null,
      devuelta: 'a tiempo',
      colgadas: [],
      restaurado: true,
      sinCuenta: [P, R],
      ana: null,
      nota: null,
    },
    muere: {
      retenida: 1,
      antesDeBorrar: null,
      devuelta: 'a tiempo',
      colgadas: [[P, R]],
      restaurado: null, // el proceso termino antes
      sinCuenta: [P, R],
      ana: null,
      nota: null,
    },
  });
});
