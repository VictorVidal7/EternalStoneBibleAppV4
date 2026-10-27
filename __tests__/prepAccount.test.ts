/**
 * R9-59 — la Mesa de preparacion, por cuenta (decidido por Victor el
 * 2026-10-03). Los stores reales y AsyncStorage real; la cuenta la dice
 * `setPrepAccount`, como hace `AuthProvider`.
 */

import {AsyncLocalStorage} from 'async_hooks';
import {PREP_SELF_REVIEW_QUESTION_IDS} from '../src/features/study/prepSelfReview';

type PA = typeof import('../src/features/study/prepAccount');
type AS = typeof import('@react-native-async-storage/async-storage').default;
type Notas = typeof import('../src/features/study/prepNotesStore');
type Series = typeof import('../src/features/study/prepSeriesStore');
type Ilus = typeof import('../src/features/study/prepIllustrationsStore');
type Auto = typeof import('../src/features/study/prepSelfReviewStore');
type Logger = typeof import('../src/lib/utils/logger');
let AsyncStorage: AS;
let logger: Logger['logger'];
let pa: PA;
let __prepGiveBackWaitingForTests: PA['__prepGiveBackWaitingForTests'];
let __prepThisRestoreWaitingForTests: PA['__prepThisRestoreWaitingForTests'];
let __prepTurnWaitingForTests: PA['__prepTurnWaitingForTests'];
let __resetPrepAccountForTests: PA['__resetPrepAccountForTests'];
let adoptNoAccountPrep: PA['adoptNoAccountPrep'];
let managePrepAccount: PA['managePrepAccount'];
let prepKey: PA['prepKey'];
let prepMultiSet: PA['prepMultiSet'];
let prepWrite: PA['prepWrite'];
let releasePrepAccount: PA['releasePrepAccount'];
let setPrepAccount: PA['setPrepAccount'];
let getAllPrepNotes: Notas['getAllPrepNotes'];
let savePrepNote: Notas['savePrepNote'];
let createPrepSeries: Series['createPrepSeries'];
let getAllPrepSeries: Series['getAllPrepSeries'];
let createPrepIllustration: Ilus['createPrepIllustration'];
let getAllPrepIllustrations: Ilus['getAllPrepIllustrations'];
let getAllPrepSelfReview: Auto['getAllPrepSelfReview'];
let setPrepSelfReviewQuestion: Auto['setPrepSelfReviewQuestion'];

const claves = async () =>
  (await AsyncStorage.getAllKeys()).filter(k => k.startsWith('@prep')).sort();
const pasajes = async () => Object.keys(await getAllPrepNotes()).sort();
// R9-359, R9-380 — las retenciones y las fallas de una LECTURA se arman sobre
// la clave, en todo metodo que la lea: `multiGet` (en el mock, `getItem(k)`
// pasa por `multiGet([k])`) y `getAllKeys` para la marca de la migracion, la
// unica clave del trabajo que vale solo por estar (`'1'`): mirar si esta es
// leerla. Las demas hay que leerlas por su valor, y ese `multiGet` es su
// lectura; contar un `getAllKeys` como lectura de toda clave sumaba una
// llamada a cada fila de la tabla y armaba en la migracion la retencion de la
// nota (R9-344). La funcion que se le da a `lecturas().mockImplementation`
// corre en cada `multiGet` con sus claves, y en cada `getAllKeys` con la
// marca, antes de la lectura real. Armadas en `getItem`, leer la marca y el
// dueno con un solo `multiGet` (un cambio bueno) tumbaba 14 pruebas; solo en
// `multiGet`, mirar si esta la marca con `getAllKeys`, 13.
type Leer = (ks: string[], cb?: unknown) => Promise<unknown>;
const lecturas = () => {
  const mg = AsyncStorage.multiGet as unknown as jest.Mock;
  const ak = AsyncStorage.getAllKeys as unknown as jest.Mock;
  const realMg: Leer = mg.getMockImplementation()!;
  const realAk = ak.getMockImplementation()!;
  const soloPorEstar = ['@prep_by_account'];
  return {
    getMockImplementation: (): Leer | undefined => realMg,
    mockImplementation: (leer: Leer) => {
      mg.mockImplementation(leer);
      ak.mockImplementation(
        leer === realMg
          ? realAk
          : async () => {
              await leer(soloPorEstar);
              return realAk();
            },
      );
    },
  };
};

// R9-340 — cada prueba con su propia instancia de los modulos de la Mesa (y
// del logger que usan) y su propio almacen: un trabajo del primer estado que
// una prueba deja colgado sigue en la instancia vieja, y no toca los de la
// siguiente. Con `__resetPrepAccountForTests` solo, soltaba las claves de la
// siguiente y escribia en su almacen despues del `clear()`. El mock de
// AsyncStorage de `jest.setup.js` es uno solo: aqui se pide uno nuevo.
beforeEach(async () => {
  jest.resetModules();
  jest.doMock('@react-native-async-storage/async-storage', () =>
    jest.requireActual(
      '@react-native-async-storage/async-storage/jest/async-storage-mock',
    ),
  );
  AsyncStorage = jest.requireMock<AS>(
    '@react-native-async-storage/async-storage',
  );
  ({logger} = jest.requireActual<Logger>('../src/lib/utils/logger'));
  pa = jest.requireActual<PA>('../src/features/study/prepAccount');
  ({
    __prepGiveBackWaitingForTests,
    __prepThisRestoreWaitingForTests,
    __prepTurnWaitingForTests,
    __resetPrepAccountForTests,
    adoptNoAccountPrep,
    managePrepAccount,
    prepKey,
    prepMultiSet,
    prepWrite,
    releasePrepAccount,
    setPrepAccount,
  } = pa);
  ({getAllPrepNotes, savePrepNote} = jest.requireActual<Notas>(
    '../src/features/study/prepNotesStore',
  ));
  ({createPrepSeries, getAllPrepSeries} = jest.requireActual<Series>(
    '../src/features/study/prepSeriesStore',
  ));
  ({createPrepIllustration, getAllPrepIllustrations} = jest.requireActual<Ilus>(
    '../src/features/study/prepIllustrationsStore',
  ));
  ({getAllPrepSelfReview, setPrepSelfReviewQuestion} = jest.requireActual<Auto>(
    '../src/features/study/prepSelfReviewStore',
  ));
  __resetPrepAccountForTests();
  await AsyncStorage.clear();
});

// R9-317 — «la lectura esperaba al primer estado de auth» se mide dandole todo
// el tiempo: relojes falsos desde antes de pedirla (solo los temporizadores:
// las microtareas y `setImmediate` siguen reales), una hora adelantada, y
// despues 1000 vueltas reales. Tras un `setTimeout(0)`, el control `antes`
// decia solo que no habia terminado en 1 ms, y una clave que esperara ese
// estado a lo sumo 250 ms pasaba el suite. Y la hora sola casi no da vueltas:
// con la lectura una vuelta mas lenta, `antes` no veia esa clave, ni una que no
// esperara. Con las 1000, se ve con la lectura 995 vueltas mas lenta, y con
// 1005 ya no. Un plazo puesto a proposito (una salida si auth no responde)
// haria caer estas pruebas en `antes`: habria que cambiarlas con esa decision.
const relojesFalsos = () =>
  jest.useFakeTimers({
    doNotFake: ['nextTick', 'queueMicrotask', 'setImmediate'],
  });
const unaHora = async () => {
  await jest.advanceTimersByTimeAsync(60 * 60 * 1000);
  jest.useRealTimers();
  for (let i = 0; i < 1000; i++) await new Promise(r => setImmediate(r));
};
// R9-360 — un temporizador de dos horas puesto durante el trabajo: la espera
// que dice correr todo temporizador lo tiene que correr. Con el reloj falso
// puesto despues del trabajo, nace real; y con solo `unaHora()`, no vence.
const centinelaLargo = () => {
  const c = {corrio: false};
  const t = setTimeout(() => (c.corrio = true), 2 * 60 * 60 * 1000);
  (t as unknown as {unref?: () => void}).unref?.();
  return c;
};
// R9-360, R9-361 — mil vueltas con los relojes falsos puestos, y en cada una
// los temporizadores pendientes, de cualquier plazo: lo que el trabajo
// programa vence aqui, aunque lo programe unas vueltas despues o en cadena,
// con dos cortes (R9-373). Cada vuelta corre lo que estaba pendiente al
// empezarla, hasta el ultimo de esos plazos. En vueltas: en la tabla y con
// todo el disco fallando, una quita de la nota que el paso que falla pone en
// un temporizador de dos horas 1002 vueltas despues se ve, y 1003 no; de una
// hora o de 10 ms, 1004 y 1005. En cadena (cada temporizador programa el
// siguiente, y el ultimo quita la nota): con eslabones de dos o tres horas,
// 1000 se ven y 1001 no; de una hora, 1002 y 1003 (la primera vuelta corre
// dos, con el centinela de dos horas pendiente, y la hora de despues otro);
// de 10 ms, 5000 se ven (la primera vuelta corre hasta el centinela). Tras
// los estados, fijar la cuenta al final de una cadena de 10 ms que empieza en
// la devolucion del primero se ve con mil eslabones por cada estado que llega
// antes del ultimo, y con uno mas no (en la de R9-344, 1000 y 1001 con dos
// estados, 2000 y 2001 con tres; en la lectura de R9-345, con dos, 1000 y
// 1001).
// Con `unaHora()` sola, uno de mas de una hora pasaba; con una vuelta entre
// dos estados, uno de 10 ms vencia ya con el ultimo. `runAllTimersAsync`
// terminaba en cuanto no quedaba ninguno (no veia uno puesto unas vueltas
// despues), y un intervalo que no se apaga nunca la hacia lanzar («Aborting
// after running 100000 timers»: un rojo ante un cambio bueno).
const tiempoYVueltas = async () => {
  for (let i = 0; i < 1000; i++) {
    if (jest.getTimerCount() > 0) await jest.runOnlyPendingTimersAsync();
    await new Promise(r => setImmediate(r));
  }
};
// R9-374 — con el reloj falso puesto, lo que el trabajo ESPERA no se espera con
// un `await` directo ni con vueltas solas: un trabajo que cede con un
// temporizador (aunque sea de 0 ms) se trababa, porque nadie lo adelantaba. Se
// dan vueltas hasta que `listo()`, y cada mil vueltas sin listo, el temporizador
// siguiente (solo ese: con todos los pendientes en cada vuelta, una quita
// programada en el trabajo corria con el disco fallando todavia, y la de disco
// entero no la veia). Hasta cien mil vueltas. Con un corte en vueltas, no en
// tiempo (R9-387, R9-400): el temporizador siguiente se adelanta cada mil
// vueltas sea cual sea su plazo, asi que una quita de la nota que el paso que
// falla pone en un temporizador (de 0 ms o de dos horas), con el trabajo
// tardando despues 998 vueltas, la ven las dos filas de disco entero; con 999
// o mas, no (vence con el disco fallando todavia). Las dos filas de la lectura
// de la nota la ven igual.
const vueltasYReloj = async (listo: () => boolean) => {
  for (let i = 1; i <= 100000 && !listo(); i++) {
    if (i % 1000 === 0 && jest.getTimerCount() > 0) {
      await jest.advanceTimersToNextTimerAsync();
    }
    await new Promise(r => setImmediate(r));
  }
};
// El trabajo, esperado asi: si lanza, el rechazo llega a la prueba (mientras se
// dan las vueltas, no queda sin atender); si no termina, lanza.
const esperarConReloj = async <T>(trabajo: Promise<T>): Promise<T> => {
  let termino = false;
  const fin = trabajo.finally(() => {
    termino = true;
  });
  fin.catch(() => undefined);
  await vueltasYReloj(() => termino);
  if (!termino) throw new Error('el trabajo no termino en cien mil vueltas');
  return fin;
};

// Los relojes reales vuelven tambien si una prueba cae con los falsos puestos.
afterEach(() => {
  jest.useRealTimers();
});

// R9-349 — las claves que piden los llamadores (los stores, la lectura) a
// `prepKey`, espiado en la instancia de la prueba: de cada una, su base y si
// sigue pendiente. Las que pide la prueba misma (con el `prepKey` de arriba)
// no pasan por aqui. Se leen al abrir y al final: un llamador que llega tarde
// a pedirla aparece solo al final; uno que no se la pide a `prepKey`, nunca.
// R9-354 — y las que recibe `prepWrite` (espiado igual): de cada llamada, la
// clave cuando resuelve, o «pendiente». Un store que pide la suya a `prepKey`
// y escribe con otra ya tomada la tiene resuelta al abrir.
// R9-378 — `pedidas` es un conjunto: cuantas veces se pidio una base no es de
// la prueba (un store que pide la suya dos veces, o una lectura ajena en la
// ventana, tumbaban los casos con el codigo bueno).
const vigilarClaves = () => {
  const real = pa.prepKey;
  const pedidas: Array<{base: string; pendiente: boolean}> = [];
  const espia = jest.spyOn(pa, 'prepKey').mockImplementation(base => {
    const pedida = {base, pendiente: true};
    pedidas.push(pedida);
    const clave = real(base);
    void clave.then(() => (pedida.pendiente = false));
    return clave;
  });
  // R9-388, R9-394 — y de quien es cada llamada a `prepWrite`: de la base que
  // escribe su funcion (lo que pasa por `multiSet` mientras corre, tambien
  // tras un `await`). Una que no escribe nada no es de ningun store: un
  // `prepWrite` ajeno con una clave de `prepKey` ocupaba el lugar del store
  // que no lo llama. Ni la pila al pedir (un ajeno del mismo modulo del store,
  // o una pila mas corta que el marco del store, con `Error.stackTraceLimit`)
  // ni la promesa que recibe (un `async` que espera la clave es otra promesa)
  // lo decian. De quien es se sabe al final: la funcion corre en su turno.
  // Su costo, medido: lo que la funcion escribe por algo registrado antes de
  // llamarla (un `then` de afuera que ella dispara) no cuenta, y los 6 casos
  // caen con el codigo bueno; un ajeno cuya funcion escribe la misma base
  // cuenta (lo ven otras seis pruebas); y una clave que no salio del pedido
  // pero resuelve con el, al mismo valor, cuenta (la ven los de R9-369).
  type Recibida = {
    quien: string | null;
    clave: string | null;
    alAbrir?: boolean;
  };
  const corriendo = new AsyncLocalStorage<Recibida>();
  const ms = AsyncStorage.multiSet as unknown as jest.Mock;
  const msAntes = ms.getMockImplementation()!;
  ms.mockImplementation(
    (pares: Array<[string, string]>, ...resto: unknown[]) => {
      const recibida = corriendo.getStore();
      if (recibida) recibida.quien = pares[0][0].split(':')[0];
      return msAntes(pares, ...resto);
    },
  );
  const realWrite = pa.prepWrite;
  const recibidas: Recibida[] = [];
  const espiaWrite = jest
    .spyOn(pa, 'prepWrite')
    .mockImplementation((key, fn) => {
      const recibida: Recibida = {quien: null, clave: null};
      recibidas.push(recibida);
      void key.then(k => (recibida.clave = k));
      return realWrite(key, k => corriendo.run(recibida, () => fn(k)));
    });
  const deStores = () => recibidas.filter(({quien}) => quien !== null);
  const texto = ({quien, clave}: Recibida) =>
    `${quien}: ${clave ?? 'pendiente'}`;
  return {
    escrituras: () => deStores().map(texto).sort(),
    // R9-354 — las claves que ya habia resuelto cada llamada al abrir: se
    // miran al abrir (`fotoAlAbrir`), y se leen al final, con su dueno.
    fotoAlAbrir: () => {
      for (const r of recibidas) r.alAbrir = r.clave !== null;
    },
    resueltasAlAbrir: () =>
      deStores()
        .filter(({alAbrir}) => alAbrir)
        .map(texto)
        .sort(),
    pedidas: () =>
      [
        ...new Set(
          pedidas.map(
            ({base, pendiente}) =>
              `${base}: ${pendiente ? 'pendiente' : 'resuelta'}`,
          ),
        ),
      ].sort(),
    soltar: () => {
      espia.mockRestore();
      espiaWrite.mockRestore();
      ms.mockImplementation(msAntes);
    },
  };
};

describe('R9-59 — la Mesa por cuenta', () => {
  it('en un telefono compartido, la cuenta que entra no ve la Mesa de la anterior, y cerrar sesion no borra nada', async () => {
    managePrepAccount();
    await setPrepAccount('ana');
    await savePrepNote('John/3/16-21', 'observation', 'el sermon de Ana');
    const deAna = await pasajes();

    // Ana cierra sesion: la Mesa «sin cuenta».
    await setPrepAccount(null);
    const sinCuenta = await pasajes();

    // Entra Beto.
    await setPrepAccount('beto');
    const deBeto = await pasajes();

    // Vuelve Ana.
    await setPrepAccount('ana');
    const anaOtraVez = await pasajes();

    // Sin R9-59 habia una sola clave: Beto veia el sermon de Ana.
    expect({deAna, sinCuenta, deBeto, anaOtraVez}).toEqual({
      deAna: ['John/3/16-21'], // CONTROL: se guardo
      sinCuenta: [],
      deBeto: [],
      anaOtraVez: ['John/3/16-21'],
    });
  });

  it('con el estado de auth conocido, una escritura va a la cuenta de cuando se pidio, aunque se cambie de cuenta antes de que corra', async () => {
    managePrepAccount();
    await setPrepAccount('ana');
    const s = savePrepNote('Rom/8/28', 'observation', 'de Ana');
    void setPrepAccount('beto');
    await s;
    expect(await claves()).toEqual(['@prep_by_account', '@prep_notes:ana']);
  });

  // R9-324 — antes del primer estado de auth, la clave es la de la cuenta de
  // cuando termina el trabajo de ese estado (ver `prepKey`), no la de cuando
  // se pidio (ninguna); lo dicen tambien los cuatro stores. R9-338 — aqui no
  // llega otro estado, asi que es la cuenta de ese.
  it('R9-324: lo que los cuatro stores escriben antes del primer estado de auth va a la cuenta de cuando termina su trabajo, no a la de cuando se pidio', async () => {
    const P = 'John/3/16-21';
    const q = PREP_SELF_REVIEW_QUESTION_IDS[0];
    await AsyncStorage.setItem('@prep_by_account', '1');
    managePrepAccount();
    const escritas = Promise.all([
      savePrepNote(P, 'observation', 'antes del estado'),
      createPrepSeries('antes del estado'),
      createPrepIllustration(),
      setPrepSelfReviewQuestion(P, q, true),
    ]);
    await setPrepAccount('ana');
    const [, serie, ilustracion] = await escritas;
    // Con la cuenta de cuando se pidio, iban a la Mesa «sin cuenta».
    expect({
      claves: await claves(),
      notas: await pasajes(),
      series: Object.keys(await getAllPrepSeries()),
      ilustraciones: Object.keys(await getAllPrepIllustrations()),
      autoevaluacion: Object.keys(await getAllPrepSelfReview()),
    }).toEqual({
      claves: [
        '@prep_by_account',
        '@prep_illustrations:ana',
        '@prep_notes:ana',
        '@prep_self_review:ana',
        '@prep_series:ana',
      ],
      notas: [P],
      series: [serie!.id],
      ilustraciones: [ilustracion!.id],
      autoevaluacion: [P],
    });
  });

  it('las claves esperan al primer estado de auth', async () => {
    relojesFalsos();
    managePrepAccount();
    let leido: string[] | null = null;
    const p = pasajes().then(r => (leido = r));
    await unaHora();
    const antes = leido;
    await setPrepAccount('ana');
    await p;
    // `antes`: tras una hora, la lectura sigue esperando (R9-317).
    expect({antes, despues: leido}).toEqual({antes: null, despues: []});
  });

  // R9-340 — el aislamiento del `beforeEach`, vigilado: la primera deja colgado
  // el trabajo del primer estado (la migracion espera su primera lectura, con
  // un segundo estado esperandolo) y lo suelta ya en la siguiente. Sin el
  // aislamiento, ese trabajo soltaba las claves de la siguiente y escribia la
  // marca de la migracion en su almacen. Van juntas: la segunda sola cae en su
  // control.
  describe('R9-340: un trabajo que una prueba deja colgado', () => {
    let viejo = {termino: false};
    it('deja colgado el trabajo del primer estado, y lo suelta en la siguiente', async () => {
      const vuelta = () => new Promise(r => setImmediate(r));
      const mg = lecturas();
      const realMg = mg.getMockImplementation()!;
      let abrir!: () => void;
      const puerta = new Promise<void>(r => (abrir = r));
      let retenida = false;
      mg.mockImplementation(async (ks: string[], cb?: unknown) => {
        if (ks.includes('@prep_by_account') && !retenida) {
          retenida = true;
          await puerta;
        }
        return realMg(ks, cb);
      });
      managePrepAccount();
      void setPrepAccount(null);
      for (let i = 0; i < 1000 && !retenida; i++) await vuelta();
      const estado = {termino: false};
      viejo = estado;
      void setPrepAccount('zoe').then(() => (estado.termino = true));
      mg.mockImplementation(realMg);
      void (async () => {
        for (let i = 0; i < 20; i++) await vuelta();
        abrir();
      })();
      expect({retenida, termino: estado.termino}).toEqual({
        retenida: true,
        termino: false,
      });
    });

    it('la siguiente no ve nada de ese trabajo: sus claves esperan su propio estado, y su almacen sigue vacio', async () => {
      // R9-350 — leido tambien al empezar: `viejoTermino` solo decia que
      // termino, y si terminaba antes de esta (la puerta tras una vuelta, o
      // un `afterEach` que drena), la pareja no vigilaba nada.
      const viejoAlEmpezar = viejo.termino;
      relojesFalsos();
      managePrepAccount();
      let leido: string[] | null = null;
      const p = pasajes().then(r => (leido = r));
      await unaHora();
      const antes = {
        leido,
        claves: await AsyncStorage.getAllKeys(),
        viejoTermino: viejo.termino,
      };
      await setPrepAccount('ana');
      await p;
      expect({viejoAlEmpezar, ...antes}).toEqual({
        viejoAlEmpezar: false, // CONTROL: el trabajo viejo no habia terminado al empezar esta
        leido: null,
        claves: [],
        viejoTermino: true, // CONTROL: y termino durante esta
      });
    });
  });

  describe('la Mesa de antes (sin cuenta en la clave)', () => {
    const sembrar = async () => {
      await AsyncStorage.setItem(
        '@prep_notes',
        JSON.stringify({
          'John/3/16-21': {sections: {observation: 'de antes'}, updatedAt: 1},
        }),
      );
      await AsyncStorage.setItem(
        '@prep_series',
        JSON.stringify({s1: {id: 's1', name: 'Romanos', passages: []}}),
      );
    };

    it('va una vez al dueno del almacen, aunque ahora no haya sesion', async () => {
      await sembrar();
      await AsyncStorage.setItem('@local_store_owner_uid', 'ana');
      managePrepAccount();
      await setPrepAccount(null);
      const sinCuenta = await pasajes();
      await setPrepAccount('ana');
      expect({
        sinCuenta,
        deAna: await pasajes(),
        claves: await claves(),
      }).toEqual({
        sinCuenta: [],
        deAna: ['John/3/16-21'],
        claves: ['@prep_by_account', '@prep_notes:ana', '@prep_series:ana'],
      });
    });

    it('sin dueno registrado, a la cuenta con la sesion abierta', async () => {
      await sembrar();
      managePrepAccount();
      await setPrepAccount('beto');
      expect(await pasajes()).toEqual(['John/3/16-21']);
    });

    it('sin dueno ni sesion, se queda como la Mesa «sin cuenta»; y el marcador de una cuenta borrada no es un dueno', async () => {
      await sembrar();
      await AsyncStorage.setItem('@local_store_owner_uid', '(deleted)');
      managePrepAccount();
      await setPrepAccount(null);
      expect({sinCuenta: await pasajes(), claves: await claves()}).toEqual({
        sinCuenta: ['John/3/16-21'],
        claves: ['@prep_by_account', '@prep_notes', '@prep_series'],
      });
    });

    // R9-370 — sin dueno registrado, la Mesa de antes va a la cuenta del ultimo
    // estado que llego cuando la mudanza lee la cuenta (en el turno de su union,
    // leida la nota de las devoluciones y antes de la primera), como las claves
    // (R9-337), no a la del primero. Con el primer estado de una cuenta y el
    // ultimo de otra (un nulo al restaurar la sesion y la cuenta enseguida, o al
    // reves), la Mesa iba con el primero y las claves con el ultimo: una edicion
    // de un pasaje de antes, pedida mientras tanto, quedaba partida entre las dos
    // Mesas. Antes de esa lectura (en la misma tarea, mientras se lee el dueno o
    // la nota), la cuenta va con todo; tras el trabajo, con el primero nulo, todo
    // se queda en la «sin cuenta» (la cuenta la une al entrar, si conserva los
    // datos). Con una devolucion pendiente, la Mesa devuelta no se mezcla: se
    // mueve antes de devolver, y la de bob va a la «sin cuenta». El corte
    // (R9-385): un estado que llega desde esa lectura hasta el final del trabajo
    // (durante la union de la mudanza o su marca, o mientras se devuelve) se
    // lleva las claves y no la Mesa de antes, y el pasaje queda partido.
    it('R9-370: sin dueno registrado, con el primer estado de una cuenta y el ultimo de otra, la Mesa de antes y lo pedido van juntos a la del ultimo', async () => {
      const P = 'John/3/16-21';
      const B = 'Rom/8/28';
      const vuelta = () => new Promise(r => setImmediate(r));
      const secciones = async (k: string, pasaje = P) => {
        const raw = await AsyncStorage.getItem(k);
        return raw ? (JSON.parse(raw)[pasaje]?.sections ?? null) : null;
      };
      const mg = lecturas();
      const realMg = mg.getMockImplementation()!;
      const ms = AsyncStorage.multiSet as unknown as jest.Mock;
      const realMs = ms.getMockImplementation()!;
      let abrir = () => {};
      const out: Record<string, unknown> = {};
      // [primer estado, ultimo, clave cuya lectura (con `true`, cuya escritura)
      // se retiene antes del ultimo, o `turno`]
      // R9-399 — con `turno`, algo ajeno retiene el turno desde antes de todo
      // estado (en la app, una adopcion o una devolucion no esperan el trabajo
      // del primer estado), y el ultimo llega con la mudanza esperandolo: la
      // cuenta va con el ultimo, como dice la cabecera («when its move's turn
      // comes»). Con el turno libre, leerla al pedir el turno pasaba.
      const TURNO = 'turno';
      const casos: Record<
        string,
        [string | null, string | null, string?, boolean?]
      > = {
        mismaTarea: [null, 'ana'],
        anaYNulo: ['ana', null],
        leyendoDueno: [null, 'ana', '@local_store_owner_uid'],
        leyendoNota: [null, 'ana', '@prep_release_pending'],
        leyendoNotaConBob: [null, 'ana', '@prep_release_pending'],
        // R9-385 — el corte: la union de la mudanza (su lectura de la Mesa «sin
        // cuenta») y su marca, sin devoluciones
        uniendoAnaYNulo: ['ana', null, '@prep_notes'],
        marcandoNuloYAna: [null, 'ana', '@prep_by_account', true],
        marcandoAnaYNulo: ['ana', null, '@prep_by_account', true],
        turnoOcupadoNuloYAna: [null, 'ana', TURNO],
        turnoOcupadoAnaYNulo: ['ana', null, TURNO],
        trasElTrabajo: [null, 'ana'],
      };
      try {
        for (const [
          cuando,
          [primer, ultimo, retener, escritura],
        ] of Object.entries(casos)) {
          __resetPrepAccountForTests();
          await AsyncStorage.clear();
          await sembrar();
          if (cuando === 'leyendoNotaConBob') {
            await AsyncStorage.setItem(
              '@prep_notes:bob',
              JSON.stringify({
                [B]: {sections: {observation: 'de bob'}, updatedAt: 1},
              }),
            );
            await AsyncStorage.setItem(
              '@prep_release_pending',
              JSON.stringify(['bob']),
            );
          }
          const puerta = new Promise<void>(r => (abrir = r));
          let retenida = false;
          mg.mockImplementation(async (ks: string[], cb?: unknown) => {
            if (retener && !escritura && !retenida && ks.includes(retener)) {
              retenida = true;
              await puerta;
            }
            return realMg(ks, cb);
          });
          ms.mockImplementation(
            async (pares: Array<[string, string]>, cb?: unknown) => {
              if (
                escritura &&
                !retenida &&
                pares.some(([k]) => k === retener)
              ) {
                retenida = true;
                await puerta;
              }
              return realMs(pares, cb);
            },
          );
          const ajeno =
            retener === TURNO
              ? prepWrite(
                  Promise.resolve('@prep_illustrations:zz'),
                  () => puerta,
                )
              : Promise.resolve();
          // la union de la mudanza (un pedido sin etiqueta), en la cola del turno
          const mudanzaEsperando = () =>
            __prepTurnWaitingForTests(undefined as unknown as string) === 1;
          managePrepAccount();
          const edita = savePrepNote(P, 'application', 'durante', 2);
          const primero = setPrepAccount(primer);
          let segundo: Promise<void> = Promise.resolve();
          if (!retener && cuando !== 'trasElTrabajo')
            segundo = setPrepAccount(ultimo);
          if (retener) {
            for (let i = 0; i < 1000 && !retenida; i++) {
              await vuelta();
              if (retener === TURNO) retenida = mudanzaEsperando();
            }
            segundo = setPrepAccount(ultimo);
            for (let i = 0; i < 1000; i++) await vuelta();
            // y sigue esperando cuando se suelta
            if (retener === TURNO) retenida = retenida && mudanzaEsperando();
            abrir();
          }
          await Promise.all([ajeno, primero, segundo, edita]);
          if (cuando === 'trasElTrabajo') await setPrepAccount(ultimo);
          mg.mockImplementation(realMg);
          ms.mockImplementation(realMs);
          out[cuando] = {
            retenida, // CONTROL: la lectura esperaba (solo con `retener`)
            deAna: await secciones('@prep_notes:ana'),
            sinCuenta: await secciones('@prep_notes'),
            ...(cuando === 'leyendoNotaConBob'
              ? {
                  bobEnAna: await secciones('@prep_notes:ana', B),
                  bobSinCuenta: await secciones('@prep_notes', B),
                }
              : {}),
            claves: await claves(),
          };
        }
      } finally {
        abrir();
        mg.mockImplementation(realMg);
        ms.mockImplementation(realMs);
      }
      const ambas = {observation: 'de antes', application: 'durante'};
      // el corte: la Mesa de antes con la cuenta que leyo la mudanza, lo pedido
      // con la del ultimo
      const partido = (mesa: string | null) => ({
        retenida: true,
        deAna: mesa ? {observation: 'de antes'} : {application: 'durante'},
        sinCuenta: mesa ? {application: 'durante'} : {observation: 'de antes'},
        claves: [
          '@prep_by_account',
          '@prep_notes',
          '@prep_notes:ana',
          mesa ? '@prep_series:ana' : '@prep_series',
        ],
      });
      const aAna = {
        deAna: ambas,
        sinCuenta: null,
        claves: ['@prep_by_account', '@prep_notes:ana', '@prep_series:ana'],
      };
      const sinCuenta = {
        deAna: null,
        sinCuenta: ambas,
        claves: ['@prep_by_account', '@prep_notes', '@prep_series'],
      };
      expect(out).toEqual({
        mismaTarea: {retenida: false, ...aAna},
        anaYNulo: {retenida: false, ...sinCuenta},
        leyendoDueno: {retenida: true, ...aAna},
        leyendoNota: {retenida: true, ...aAna},
        leyendoNotaConBob: {
          retenida: true,
          ...aAna,
          bobEnAna: null,
          bobSinCuenta: {observation: 'de bob'},
          claves: [
            '@prep_by_account',
            '@prep_notes',
            '@prep_notes:ana',
            '@prep_series:ana',
          ],
        },
        uniendoAnaYNulo: partido('ana'),
        marcandoNuloYAna: partido(null),
        marcandoAnaYNulo: partido('ana'),
        turnoOcupadoNuloYAna: {retenida: true, ...aAna},
        turnoOcupadoAnaYNulo: {retenida: true, ...sinCuenta},
        trasElTrabajo: {retenida: false, ...sinCuenta},
      });
    });

    it('solo una vez: lo escrito despues sin cuenta no se va al dueno en el arranque siguiente', async () => {
      await AsyncStorage.setItem('@local_store_owner_uid', 'ana');
      managePrepAccount();
      await setPrepAccount(null);
      await savePrepNote('Ps/23/1-6', 'observation', 'sin cuenta');
      __resetPrepAccountForTests();
      managePrepAccount();
      await setPrepAccount(null);
      expect(await pasajes()).toEqual(['Ps/23/1-6']);
    });

    // R9-310 — la escritura espera su clave FUERA del turno: la clave espera
    // al primer estado de auth, y la union de ese estado pide un turno. Con la
    // clave esperada dentro, ninguna de las dos terminaba (la traba de R9-269).
    // Con `prepWrite` directo: la cola de `savePrepNote` no se reinicia entre
    // pruebas, y trabada colgaba las siguientes.
    it('R9-310: una escritura pedida antes del primer estado de auth no traba la union de ese estado', async () => {
      await sembrar();
      managePrepAccount();
      let escrito = false;
      let recibida = '';
      let leido: string[] = [];
      const escritura = prepWrite(prepKey('@prep_notes'), async clave => {
        recibida = clave;
        const raw = await AsyncStorage.getItem(clave);
        leido = Object.keys(raw ? JSON.parse(raw) : {});
        await AsyncStorage.setItem(
          clave,
          JSON.stringify({
            ...(raw ? JSON.parse(raw) : {}),
            'Ps/23/1-6': {
              sections: {observation: 'antes de auth'},
              updatedAt: 2,
            },
          }),
        );
      }).then(() => (escrito = true));
      let entro = false;
      const estado = setPrepAccount('ana').then(() => (entro = true));
      // Hasta que lleguen las dos, con un tope: trabadas no llegan nunca, y
      // esperarlas colgaba la prueba. Con solo 100 vueltas, una union 100
      // vueltas mas lenta daba el mismo rojo que la traba; ahora llegan, y el
      // rojo es solo `aTiempo`.
      let vueltas = 0;
      while (!(escrito && entro) && vueltas < 1000) {
        await new Promise(r => setImmediate(r));
        vueltas += 1;
      }
      expect({escrito, entro, aTiempo: vueltas <= 100}).toEqual({
        escrito: true,
        entro: true,
        aTiempo: true,
      });
      await Promise.all([escritura, estado]);
      // CONTROL: la union corrio (lo de antes, en la de `ana`); la escritura
      // recibio la clave de `ana` y leyo en ella lo de antes, o sea que leyo
      // despues de que la union escribiera. R9-312: los pasajes solos no lo
      // dicen; la union junta tambien lo escrito antes en la «sin cuenta».
      expect({recibida, leido, pasajes: await pasajes()}).toEqual({
        recibida: '@prep_notes:ana',
        leido: ['John/3/16-21'],
        pasajes: ['John/3/16-21', 'Ps/23/1-6'],
      });
    });

    // R9-314 — el primer estado de auth mueve la Mesa de antes ANTES de que
    // se resuelva ninguna clave (`setPrepAccount`). Una escritura lo ve igual,
    // en su turno (R9-310); una lectura no pide turno: con la clave resuelta
    // antes de la union, leia la de `ana` sin lo de antes, y no lo veia nadie.
    it('R9-314: una lectura pedida antes del primer estado de auth ve lo de antes, ya en la de la cuenta', async () => {
      await sembrar();
      // Lo de `ana` de antes: lo leido sale distinto si se lee la de `ana`
      // antes de la union ('Ps/23/1-6') o la «sin cuenta» despues ([]).
      await AsyncStorage.setItem(
        '@prep_notes:ana',
        JSON.stringify({
          'Ps/23/1-6': {sections: {observation: 'de Ana'}, updatedAt: 1},
        }),
      );
      relojesFalsos();
      managePrepAccount();
      let leido: string[] | null = null;
      const lectura = pasajes().then(r => (leido = r));
      await unaHora();
      const antes = leido;
      await setPrepAccount('ana');
      await lectura;
      expect({antes, leido, despues: await pasajes()}).toEqual({
        antes: null, // CONTROL: una hora despues, sigue esperando (R9-317)
        leido: ['John/3/16-21', 'Ps/23/1-6'],
        despues: ['John/3/16-21', 'Ps/23/1-6'], // CONTROL: la union corrio
      });
    });
  });

  it('al iniciar sesion la Mesa «sin cuenta» se une a la de la cuenta (gana la de la cuenta, y la otra se queda); al borrar la cuenta vuelve', async () => {
    const T = Date.now() - 60 * 60 * 1000;
    managePrepAccount();
    await setPrepAccount(null);
    await savePrepNote('John/3/16-21', 'observation', 'sin cuenta', T + 1000);
    await savePrepNote('Rom/8/28', 'observation', 'sin cuenta', T + 1000);
    await setPrepAccount('ana');
    await savePrepNote('Rom/8/28', 'observation', 'de Ana', T + 2000);
    await createPrepSeries('Romanos');
    await adoptNoAccountPrep('ana');
    const notas = await getAllPrepNotes();
    const unida = {
      pasajes: Object.keys(notas).sort(),
      rom: notas['Rom/8/28']?.sections.observation,
      claves: await claves(),
    };
    await releasePrepAccount('ana');
    await setPrepAccount(null);
    const devuelta = await getAllPrepNotes();
    // R9-269 — la Rom «sin cuenta» se queda en su clave (antes se borraba con
    // ella); al borrar la cuenta, de las dos gana la mas nueva (la de Ana).
    expect({
      unida,
      devuelta: Object.keys(devuelta).sort(),
      rom: devuelta['Rom/8/28']?.sections.observation,
      series: Object.keys(await getAllPrepSeries()).length,
      claves: await claves(),
    }).toEqual({
      unida: {
        pasajes: ['John/3/16-21', 'Rom/8/28'],
        rom: 'de Ana',
        claves: [
          '@prep_by_account',
          '@prep_notes',
          '@prep_notes:ana',
          '@prep_series:ana',
        ],
      },
      devuelta: ['John/3/16-21', 'Rom/8/28'],
      rom: 'de Ana',
      series: 1,
      claves: ['@prep_by_account', '@prep_notes', '@prep_series'],
    });
  });

  it('R9-274: si la union al borrar la cuenta no termina (falla, o el proceso termina en ella), el arranque siguiente la termina', async () => {
    const T = Date.now() - 60 * 60 * 1000;
    const P = 'John/3/16-21';
    const ms = AsyncStorage.multiSet as unknown as jest.Mock;
    const real = ms.getMockImplementation()!;
    const caso = async (como: 'falla' | 'termina' | 'cierraSesion') => {
      __resetPrepAccountForTests();
      await AsyncStorage.clear();
      managePrepAccount();
      await setPrepAccount('ana');
      await savePrepNote(P, 'observation', 'de Ana', T);
      await setPrepAccount(null);
      // La escritura de la union en la Mesa «sin cuenta»: falla, o no vuelve
      // nunca (el proceso termina ahi).
      let union: string[] | null = null;
      ms.mockImplementation(async (pairs: Array<[string, string]>) => {
        const sinCuenta = pairs.find(([k]) => k === '@prep_notes');
        if (sinCuenta) {
          union = Object.keys(JSON.parse(sinCuenta[1])).sort();
          if (como === 'falla') throw new Error('disco');
          return new Promise(() => {});
        }
        return real(pairs);
      });
      try {
        if (como === 'falla') await releasePrepAccount('ana');
        if (como === 'termina') void releasePrepAccount('ana');
        // R9-333 — hasta que la union llegue al disco, no 10 vueltas fijas: con
        // la nota 50 vueltas mas lenta (un cambio bueno), el proceso «terminaba»
        // antes de anotarla, y el rojo era el de una regresion de R9-274.
        // `union` dice que llego, y con que.
        for (let i = 0; i < 1000 && union === null; i++) {
          await new Promise(r => setImmediate(r));
        }
      } finally {
        ms.mockImplementation(real);
      }
      // El proceso siguiente, sin sesion.
      __resetPrepAccountForTests();
      managePrepAccount();
      await setPrepAccount(null);
      return {union, sinCuenta: await pasajes(), claves: await claves()};
    };
    const devuelta = {
      union: [P], // CONTROL: la union llego al disco, con la Mesa de Ana
      sinCuenta: [P],
      claves: ['@prep_by_account', '@prep_notes'],
    };
    // Sin R9-274, nada la reintentaba: la Mesa de la cuenta borrada se quedaba
    // bajo su uid, que nadie vuelve a usar.
    expect({
      falla: await caso('falla'),
      termina: await caso('termina'),
      cierraSesion: await caso('cierraSesion'), // CONTROL: no se suelta
    }).toEqual({
      falla: devuelta,
      termina: devuelta,
      cierraSesion: {
        union: null,
        sinCuenta: [],
        claves: ['@prep_by_account', '@prep_notes:ana'],
      },
    });
  });

  it('R9-276: una devolucion que no termino no la pisa otra del mismo proceso, y el arranque siguiente las termina todas', async () => {
    const T = Date.now() - 60 * 60 * 1000;
    const P = 'John/3/16-21';
    const Q = 'Rom/8/28-30';
    const ms = AsyncStorage.multiSet as unknown as jest.Mock;
    const real = ms.getMockImplementation()!;
    const mesa = (pasaje: string) =>
      JSON.stringify({
        [pasaje]: {sections: {observation: 'de la cuenta'}, updatedAt: T},
      });
    // Ana y Beto tienen su Mesa, y las dos cuentas se borran en el mismo
    // proceso; la union de las que dice `fallan` (a la Mesa «sin cuenta»)
    // falla.
    const caso = async (fallan: string[]) => {
      __resetPrepAccountForTests();
      await AsyncStorage.clear();
      await AsyncStorage.multiSet([
        ['@prep_notes:ana', mesa(P)],
        ['@prep_notes:beto', mesa(Q)],
        ['@prep_by_account', '1'],
      ]);
      managePrepAccount();
      await setPrepAccount('ana');
      let falla = false;
      ms.mockImplementation(async (pairs: Array<[string, string]>) => {
        if (falla && pairs.some(([k]) => k === '@prep_notes')) {
          throw new Error('disco');
        }
        return real(pairs);
      });
      let anaSeQuedo = false;
      try {
        for (const uid of ['ana', 'beto']) {
          falla = fallan.includes(uid);
          await releasePrepAccount(uid);
          if (uid === 'ana') {
            anaSeQuedo = (await claves()).includes('@prep_notes:ana');
          }
        }
      } finally {
        ms.mockImplementation(real);
      }
      await setPrepAccount(null);
      // El proceso siguiente, sin sesion.
      __resetPrepAccountForTests();
      managePrepAccount();
      await setPrepAccount(null);
      return {anaSeQuedo, sinCuenta: await pasajes(), claves: await claves()};
    };
    // La nota de antes de R9-276 (un uid, no una lista) se sigue terminando.
    const antigua = async () => {
      __resetPrepAccountForTests();
      await AsyncStorage.clear();
      await AsyncStorage.multiSet([
        ['@prep_notes:ana', mesa(P)],
        ['@prep_release_pending', 'ana'],
        ['@prep_by_account', '1'],
      ]);
      managePrepAccount();
      await setPrepAccount(null);
      return {sinCuenta: await pasajes(), claves: await claves()};
    };
    const devueltas = {
      anaSeQuedo: true, // CONTROL: la union de Ana fallo
      sinCuenta: [P, Q],
      claves: ['@prep_by_account', '@prep_notes'],
    };
    // Sin R9-276 la nota tenia un solo lugar: la de Beto pisaba la de Ana, y
    // la Mesa de Ana se quedaba bajo su uid.
    expect({
      primera: await caso(['ana']),
      lasDos: await caso(['ana', 'beto']),
      antigua: await antigua(),
    }).toEqual({
      primera: devueltas,
      lasDos: devueltas,
      antigua: {sinCuenta: [P], claves: ['@prep_by_account', '@prep_notes']},
    });
  });

  // R9-314 — el primer estado de auth termina la devolucion pendiente (R9-274)
  // ANTES de que se resuelva ninguna clave. Una lectura no pide turno: con la
  // clave resuelta antes de `finishRelease`, leia la «sin cuenta» sin lo de la
  // cuenta borrada, y no lo veia nadie.
  it('R9-314: una lectura pedida antes del primer estado de auth ve lo devuelto de una cuenta borrada', async () => {
    // Lo de la «sin cuenta» de antes: lo leido sale distinto si se lee antes
    // de la devolucion ('Ps/23/1-6') o despues ('Ps/23/1-6' y 'Rom/8/28').
    await AsyncStorage.setItem(
      '@prep_notes',
      JSON.stringify({
        'Ps/23/1-6': {sections: {observation: 'sin cuenta'}, updatedAt: 1},
      }),
    );
    await AsyncStorage.setItem(
      '@prep_notes:bob',
      JSON.stringify({
        'Rom/8/28': {sections: {observation: 'de Bob'}, updatedAt: 1},
      }),
    );
    await AsyncStorage.setItem(
      '@prep_release_pending',
      JSON.stringify(['bob']),
    );
    relojesFalsos();
    managePrepAccount();
    let leido: string[] | null = null;
    const lectura = pasajes().then(r => (leido = r));
    await unaHora();
    const antes = leido;
    await setPrepAccount(null);
    await lectura;
    expect({antes, leido, despues: await pasajes()}).toEqual({
      antes: null, // CONTROL: una hora despues, sigue esperando (R9-317)
      leido: ['Ps/23/1-6', 'Rom/8/28'],
      despues: ['Ps/23/1-6', 'Rom/8/28'], // CONTROL: la devolucion corrio
    });
  });

  // R9-331 — un estado de auth que llega mientras el primero todavia devuelve
  // (o mueve) una Mesa espera a que termine antes de soltar las claves.
  it('R9-331: un segundo estado de auth que llega mientras el primero devuelve una Mesa no suelta las claves antes de que termine', async () => {
    await AsyncStorage.setItem(
      '@prep_notes',
      JSON.stringify({
        'Ps/23/1-6': {sections: {observation: 'sin cuenta'}, updatedAt: 1},
      }),
    );
    await AsyncStorage.setItem(
      '@prep_notes:bob',
      JSON.stringify({
        'Rom/8/28': {sections: {observation: 'de Bob'}, updatedAt: 1},
      }),
    );
    await AsyncStorage.setItem(
      '@prep_release_pending',
      JSON.stringify(['bob']),
    );
    const vuelta = () => new Promise(r => setImmediate(r));
    const ms = AsyncStorage.multiSet as unknown as jest.Mock;
    const real = ms.getMockImplementation()!;
    // La union de la devolucion (en la Mesa «sin cuenta») espera en una puerta.
    let abrir!: () => void;
    const puerta = new Promise<void>(r => (abrir = r));
    let retenida: string[] | null = null;
    ms.mockImplementation(async (pairs: Array<[string, string]>) => {
      const sinCuenta = pairs.find(([k]) => k === '@prep_notes');
      if (sinCuenta && retenida === null) {
        retenida = Object.keys(JSON.parse(sinCuenta[1])).sort();
        await puerta;
      }
      return real(pairs);
    });
    try {
      relojesFalsos();
      managePrepAccount();
      let leido: string[] | null = null;
      const lectura = pasajes().then(r => (leido = r));
      const primero = setPrepAccount(null);
      for (let i = 0; i < 1000 && retenida === null; i++) await vuelta();
      const segundo = setPrepAccount(null);
      // Una hora y mil vueltas con la union retenida: la lectura sigue
      // esperando (con el segundo estado soltando las claves, leia la «sin
      // cuenta» sin Rom/8/28). R9-335 — con mil vueltas sin reloj, como
      // R9-317, un segundo estado que esperara a lo sumo 250 ms pasaba.
      await unaHora();
      const antesDeAbrir = leido;
      abrir();
      await Promise.all([primero, segundo, lectura]);
      expect({retenida, antesDeAbrir, leido, despues: await pasajes()}).toEqual(
        {
          retenida: ['Ps/23/1-6', 'Rom/8/28'], // CONTROL: la union de la devolucion esperaba
          antesDeAbrir: null,
          leido: ['Ps/23/1-6', 'Rom/8/28'],
          despues: ['Ps/23/1-6', 'Rom/8/28'], // CONTROL: la devolucion termino
        },
      );
    } finally {
      abrir();
      ms.mockImplementation(real);
    }
  });

  // R9-331 — lo mismo con la Mesa de antes: el primer
  // estado (nulo) la mueve a su dueno anotado, y el segundo es esa cuenta (la
  // sesion que se restaura pasando por nulo). Lo pedido antes toma la clave de
  // la cuenta de cuando termina ese trabajo, la del segundo estado: con la del
  // primero, leia la «sin cuenta» ya vacia, o partia la entrada.
  it('R9-331: con la Mesa de antes, un segundo estado (la cuenta) que llega mientras el primero la mueve no suelta las claves antes, y lo pedido va a esa cuenta', async () => {
    const P = 'John/3/16-21';
    const vuelta = () => new Promise(r => setImmediate(r));
    const sembrar = async () => {
      await AsyncStorage.setItem(
        '@prep_notes',
        JSON.stringify({
          [P]: {sections: {observation: 'de antes'}, updatedAt: 1},
        }),
      );
      await AsyncStorage.setItem('@local_store_owner_uid', 'ana');
    };
    const ms = AsyncStorage.multiSet as unknown as jest.Mock;
    const realMs = ms.getMockImplementation()!;
    const mg = lecturas();
    const realMg = mg.getMockImplementation()!;
    let abrir!: () => void;
    try {
      // Una lectura: la union de la migracion (a la Mesa de Ana) espera en
      // una puerta.
      await sembrar();
      let puerta = new Promise<void>(r => (abrir = r));
      let unionRetenida: string[] | null = null;
      ms.mockImplementation(async (pairs: Array<[string, string]>) => {
        const deAna = pairs.find(([k]) => k === '@prep_notes:ana');
        if (deAna && unionRetenida === null) {
          unionRetenida = Object.keys(JSON.parse(deAna[1]));
          await puerta;
        }
        return realMs(pairs);
      });
      relojesFalsos();
      managePrepAccount();
      let leido: string[] | null = null;
      const lectura = pasajes().then(r => (leido = r));
      let primero = setPrepAccount(null);
      for (let i = 0; i < 1000 && unionRetenida === null; i++) await vuelta();
      let segundo = setPrepAccount('ana');
      // R9-335 — una hora y mil vueltas, como en la de arriba.
      await unaHora();
      const leidoAntesDeAbrir = leido;
      abrir();
      await Promise.all([primero, segundo, lectura]);
      ms.mockImplementation(realMs);

      // Una escritura: la migracion espera en su primera lectura, antes de que
      // su union pida turno.
      __resetPrepAccountForTests();
      await AsyncStorage.clear();
      await sembrar();
      puerta = new Promise<void>(r => (abrir = r));
      let migracionRetenida: string | null = null;
      mg.mockImplementation(async (ks: string[], cb?: unknown) => {
        if (ks.includes('@prep_by_account') && migracionRetenida === null) {
          migracionRetenida = '@prep_by_account';
          await puerta;
        }
        return realMg(ks, cb);
      });
      relojesFalsos();
      managePrepAccount();
      let escrita = false;
      const edita = savePrepNote(P, 'application', 'antes del estado', 2).then(
        () => (escrita = true),
      );
      primero = setPrepAccount(null);
      for (let i = 0; i < 1000 && migracionRetenida === null; i++) {
        await vuelta();
      }
      segundo = setPrepAccount('ana');
      await unaHora();
      const escritaAntesDeAbrir = escrita;
      abrir();
      await Promise.all([primero, segundo, edita]);
      mg.mockImplementation(realMg);
      const deAna = JSON.parse(
        (await AsyncStorage.getItem('@prep_notes:ana')) ?? 'null',
      );
      expect({
        unionRetenida, // CONTROL: la union de la migracion esperaba, con P
        leidoAntesDeAbrir,
        leido,
        migracionRetenida, // CONTROL: la migracion esperaba en su lectura
        escritaAntesDeAbrir,
        p: deAna?.[P]?.sections ?? null,
        sinCuenta: await AsyncStorage.getItem('@prep_notes'),
      }).toEqual({
        unionRetenida: [P],
        leidoAntesDeAbrir: null,
        leido: [P],
        migracionRetenida: '@prep_by_account',
        escritaAntesDeAbrir: false,
        p: {observation: 'de antes', application: 'antes del estado'},
        sinCuenta: null,
      });
    } finally {
      abrir?.();
      ms.mockImplementation(realMs);
      mg.mockImplementation(realMg);
    }
  });

  // R9-337 — con DOS estados durante el trabajo del primero (se entra y se
  // sale), lo pedido antes va a la cuenta de cuando termina, la del ultimo:
  // con la del primero que llego mientras tanto, iba a la Mesa de una cuenta
  // que ya habia salido. R9-356 — los dos estados llegan de a uno, con
  // `tiempoYVueltas` entre ellos (R9-361: en vueltas y en tiempo): llamados
  // seguidos, en la misma tarea, una microtarea despues la cuenta ya era la
  // del ultimo, y fijar la del primero que llega una microtarea tarde pasaba.
  it('R9-337: con nulo, una cuenta y nulo durante el trabajo del primer estado, lo pedido antes va a la cuenta del ultimo', async () => {
    const P = 'John/3/16-21';
    const vuelta = () => new Promise(r => setImmediate(r));
    const mg = lecturas();
    const realMg = mg.getMockImplementation()!;
    let abrir!: () => void;
    const puerta = new Promise<void>(r => (abrir = r));
    // La migracion del primer estado espera en su primera lectura.
    let migracionRetenida: string | null = null;
    mg.mockImplementation(async (ks: string[], cb?: unknown) => {
      if (ks.includes('@prep_by_account') && migracionRetenida === null) {
        migracionRetenida = '@prep_by_account';
        await puerta;
      }
      return realMg(ks, cb);
    });
    try {
      relojesFalsos();
      managePrepAccount();
      let escrita = false;
      const edita = savePrepNote(P, 'observation', 'antes del estado', 2).then(
        () => (escrita = true),
      );
      const primero = setPrepAccount(null);
      for (let i = 0; i < 1000 && migracionRetenida === null; i++) {
        await vuelta();
      }
      const segundo = setPrepAccount('ana');
      await tiempoYVueltas();
      const tercero = setPrepAccount(null);
      await tiempoYVueltas();
      await unaHora();
      const escritaAntesDeAbrir = escrita;
      abrir();
      await Promise.all([primero, segundo, tercero, edita]);
      mg.mockImplementation(realMg);
      expect({
        migracionRetenida, // CONTROL: la migracion esperaba en su lectura
        escritaAntesDeAbrir, // CONTROL: y la escritura, a que terminara
        deAna: await AsyncStorage.getItem('@prep_notes:ana'),
        sinCuenta: await pasajes(),
      }).toEqual({
        migracionRetenida: '@prep_by_account',
        escritaAntesDeAbrir: false,
        deAna: null,
        sinCuenta: [P],
      });
    } finally {
      abrir();
      mg.mockImplementation(realMg);
    }
  });

  // R9-344 — «cuando termina» es el trabajo ENTERO del primer estado, hasta su
  // ultima parte: la migracion (aqui con su union, a `zoe`), la lectura de las
  // devoluciones pendientes y cada devolucion, hasta quitarla de la nota. El
  // otro estado llega durante esa ultima parte: con dos devoluciones, al
  // quitar la nota tras la segunda; sin ninguna, al leer la nota. Una clave que
  // tomara la cuenta antes (al terminar la migracion o su union, la union de
  // una devolucion, o la primera devolucion) se ve, en los dos sentidos: lo
  // pedido va con la cuenta que entra, y no con la que sale. Con estados solo
  // durante la migracion, todas esas pasaban. R9-351 — y con dos estados
  // durante esa ultima parte, distintos entre si y del primero: lo pedido va a
  // la cuenta del ultimo. Con uno solo, tomar la del primero que llega ahi
  // pasaba. R9-355 — y con el primero repetido al final (ana→beto→ana,
  // nulo→ana→nulo) y con tres (nulo→ana→beto→nulo): con dos distintos, «el
  // ultimo» era tambien «el segundo» y «el ultimo distinto del primero», y
  // tomar uno de esos, o ignorar un estado igual al primero, pasaba. R9-356 —
  // los estados llegan de a uno, con `tiempoYVueltas` entre ellos (R9-361: en
  // vueltas y en tiempo): llamados seguidos, en la misma tarea, una microtarea
  // despues la cuenta ya era la del ultimo, y fijar la del primero que llega
  // una microtarea tarde pasaba. R9-384 — y sin dueno registrado (R9-370): ahi,
  // entre la lectura de la nota y las devoluciones esta la mudanza, que lleva
  // la Mesa de antes a la cuenta de cuando la lee (aqui, la del primero: el
  // corte de R9-370), y lo pedido va con el ultimo. Con dueno en todos los
  // casos, tomar la cuenta al terminar la mudanza pasaba; y con un solo estado
  // sin dueno, pasaban las formas de R9-351 y R9-355 tras la mudanza (tomar el
  // primero o el segundo que llega, o el ultimo distinto del primero, o
  // ignorar uno igual al primero).
  it('R9-344: con un estado que llega durante la ultima parte del trabajo del primero, lo pedido antes va a la cuenta de cuando termina, entre o salga', async () => {
    const P = 'John/3/16-21';
    const mr = AsyncStorage.multiRemove as unknown as jest.Mock;
    const realMr = mr.getMockImplementation()!;
    const mg = lecturas();
    const realMg = mg.getMockImplementation()!;
    const ms = AsyncStorage.multiSet as unknown as jest.Mock;
    const realMs = ms.getMockImplementation()!;
    const mapa = async (k: string) =>
      Object.keys(JSON.parse((await AsyncStorage.getItem(k)) ?? '{}')).sort();
    const mesa = (pasaje: string) =>
      JSON.stringify({
        [pasaje]: {sections: {observation: 'de antes'}, updatedAt: 1},
      });
    let abrir: () => void = () => undefined;
    const caso = async (
      primero: string | null,
      durante: Array<string | null>,
      devoluciones: boolean,
      sinDueno = false,
    ) => {
      __resetPrepAccountForTests();
      await AsyncStorage.clear();
      // La Mesa de antes, de `zoe`: la migracion la une. Sin dueno, la mudanza.
      await AsyncStorage.setItem('@prep_notes', mesa('Ps/23/1-6'));
      if (!sinDueno) {
        await AsyncStorage.setItem('@local_store_owner_uid', 'zoe');
      }
      if (devoluciones) {
        await AsyncStorage.setItem('@prep_notes:bob', mesa('Rom/8/28'));
        await AsyncStorage.setItem('@prep_notes:carl', mesa('Eph/2/8'));
        await AsyncStorage.setItem(
          '@prep_release_pending',
          JSON.stringify(['bob', 'carl']),
        );
      }
      const puerta = new Promise<void>(r => (abrir = r));
      // La ultima parte del trabajo espera en una puerta: quitar la nota (en
      // el mock, `removeItem` pasa por `multiRemove`) o, sin devoluciones,
      // leerla. R9-393 — sin dueno y sin devoluciones, la ultima parte es la
      // mudanza: espera la escritura de su marca (en el mock, `setItem` pasa
      // por `multiSet`). `retenida` dice lo que ya estaba hecho.
      const enLaMarca = sinDueno && !devoluciones;
      let retenida: {
        parte: string;
        deZoe: string[];
        deAna: string[];
        sinCuenta: string[];
      } | null = null;
      const retener = async (parte: string) => {
        retenida = {
          parte,
          deZoe: await mapa('@prep_notes:zoe'),
          deAna: await mapa('@prep_notes:ana'),
          sinCuenta: await mapa('@prep_notes'),
        };
        await puerta;
      };
      mr.mockImplementation(async (keys: string[], cb?: unknown) => {
        if (
          devoluciones &&
          retenida === null &&
          keys.includes('@prep_release_pending')
        ) {
          await retener('quita la nota');
        }
        return realMr(keys, cb);
      });
      mg.mockImplementation(async (ks: string[], cb?: unknown) => {
        if (
          !devoluciones &&
          !enLaMarca &&
          retenida === null &&
          ks.includes('@prep_release_pending')
        ) {
          await retener('lee la nota');
        }
        return realMg(ks, cb);
      });
      ms.mockImplementation(
        async (pares: Array<[string, string]>, cb?: unknown) => {
          if (
            enLaMarca &&
            retenida === null &&
            pares.some(([k]) => k === '@prep_by_account')
          ) {
            await retener('marca');
          }
          return realMs(pares, cb);
        },
      );
      try {
        relojesFalsos();
        managePrepAccount();
        let escrita = false;
        const edita = savePrepNote(P, 'observation', 'antes', 2).then(
          () => (escrita = true),
        );
        const estado1 = setPrepAccount(primero);
        // Con el reloj (R9-374): un trabajo que cede con un temporizador llegaba
        // a las mil vueltas sin la retencion armada.
        await vueltasYReloj(() => retenida !== null);
        // Leida cuando llega el otro estado, no al final: con la devolucion
        // mas lenta que la espera, el estado llegaba antes de la union, la
        // retencion se armaba despues, y leida al final decia lo mismo.
        const alLlegar = retenida;
        const otros: Array<Promise<void>> = [];
        for (const uid of durante) {
          otros.push(setPrepAccount(uid));
          await tiempoYVueltas();
        }
        await unaHora();
        const escritaAntesDeAbrir = escrita;
        abrir();
        await Promise.all([estado1, ...otros, edita]);
        return {
          // CONTROL: al llegar los otros estados, el trabajo estaba en su
          // ultima parte, con la union de la migracion y las devoluciones ya
          // hechas
          retenida: alLlegar,
          escritaAntesDeAbrir,
          deAna: await mapa('@prep_notes:ana'),
          deBeto: await mapa('@prep_notes:beto'),
          sinCuenta: await mapa('@prep_notes'),
        };
      } finally {
        abrir();
        mr.mockImplementation(realMr);
        mg.mockImplementation(realMg);
        ms.mockImplementation(realMs);
      }
    };
    const conDevoluciones = {
      parte: 'quita la nota',
      deZoe: ['Ps/23/1-6'],
      deAna: [],
      sinCuenta: ['Eph/2/8', 'Rom/8/28'],
    };
    const sinDevoluciones = {
      parte: 'lee la nota',
      deZoe: ['Ps/23/1-6'],
      deAna: [],
      sinCuenta: [],
    };
    const sinMudar = ['Eph/2/8', 'Ps/23/1-6', 'Rom/8/28'];
    expect({
      entra: await caso(null, ['ana'], true),
      sale: await caso('ana', [null], true),
      entraSinDevoluciones: await caso(null, ['ana'], false),
      saleSinDevoluciones: await caso('ana', [null], false),
      nuloAnaBeto: await caso(null, ['ana', 'beto'], true),
      anaBetoNulo: await caso('ana', ['beto', null], true),
      nuloAnaBetoSinDevoluciones: await caso(null, ['ana', 'beto'], false),
      anaBetoNuloSinDevoluciones: await caso('ana', ['beto', null], false),
      anaBetoAna: await caso('ana', ['beto', 'ana'], true),
      nuloAnaNulo: await caso(null, ['ana', null], true),
      anaBetoAnaSinDevoluciones: await caso('ana', ['beto', 'ana'], false),
      nuloAnaNuloSinDevoluciones: await caso(null, ['ana', null], false),
      nuloAnaBetoNulo: await caso(null, ['ana', 'beto', null], true),
      nuloAnaBetoNuloSinDevoluciones: await caso(
        null,
        ['ana', 'beto', null],
        false,
      ),
      entraSinDueno: await caso(null, ['ana'], true, true),
      saleSinDueno: await caso('ana', [null], true, true),
      anaBetoNuloAnaSinDueno: await caso(
        'ana',
        ['beto', null, 'ana'],
        true,
        true,
      ),
      nuloAnaBetoNuloSinDueno: await caso(
        null,
        ['ana', 'beto', null],
        true,
        true,
      ),
      anaBetoNuloAnaSinDuenoNiDevoluciones: await caso(
        'ana',
        ['beto', null, 'ana'],
        false,
        true,
      ),
      nuloAnaBetoNuloSinDuenoNiDevoluciones: await caso(
        null,
        ['ana', 'beto', null],
        false,
        true,
      ),
    }).toEqual({
      entra: {
        retenida: conDevoluciones,
        escritaAntesDeAbrir: false,
        deAna: [P],
        deBeto: [],
        sinCuenta: ['Eph/2/8', 'Rom/8/28'],
      },
      sale: {
        retenida: conDevoluciones,
        escritaAntesDeAbrir: false,
        deAna: [],
        deBeto: [],
        sinCuenta: ['Eph/2/8', P, 'Rom/8/28'],
      },
      entraSinDevoluciones: {
        retenida: sinDevoluciones,
        escritaAntesDeAbrir: false,
        deAna: [P],
        deBeto: [],
        sinCuenta: [],
      },
      saleSinDevoluciones: {
        retenida: sinDevoluciones,
        escritaAntesDeAbrir: false,
        deAna: [],
        deBeto: [],
        sinCuenta: [P],
      },
      nuloAnaBeto: {
        retenida: conDevoluciones,
        escritaAntesDeAbrir: false,
        deAna: [],
        deBeto: [P],
        sinCuenta: ['Eph/2/8', 'Rom/8/28'],
      },
      anaBetoNulo: {
        retenida: conDevoluciones,
        escritaAntesDeAbrir: false,
        deAna: [],
        deBeto: [],
        sinCuenta: ['Eph/2/8', P, 'Rom/8/28'],
      },
      nuloAnaBetoSinDevoluciones: {
        retenida: sinDevoluciones,
        escritaAntesDeAbrir: false,
        deAna: [],
        deBeto: [P],
        sinCuenta: [],
      },
      anaBetoNuloSinDevoluciones: {
        retenida: sinDevoluciones,
        escritaAntesDeAbrir: false,
        deAna: [],
        deBeto: [],
        sinCuenta: [P],
      },
      anaBetoAna: {
        retenida: conDevoluciones,
        escritaAntesDeAbrir: false,
        deAna: [P],
        deBeto: [],
        sinCuenta: ['Eph/2/8', 'Rom/8/28'],
      },
      nuloAnaNulo: {
        retenida: conDevoluciones,
        escritaAntesDeAbrir: false,
        deAna: [],
        deBeto: [],
        sinCuenta: ['Eph/2/8', P, 'Rom/8/28'],
      },
      anaBetoAnaSinDevoluciones: {
        retenida: sinDevoluciones,
        escritaAntesDeAbrir: false,
        deAna: [P],
        deBeto: [],
        sinCuenta: [],
      },
      nuloAnaNuloSinDevoluciones: {
        retenida: sinDevoluciones,
        escritaAntesDeAbrir: false,
        deAna: [],
        deBeto: [],
        sinCuenta: [P],
      },
      nuloAnaBetoNulo: {
        retenida: conDevoluciones,
        escritaAntesDeAbrir: false,
        deAna: [],
        deBeto: [],
        sinCuenta: ['Eph/2/8', P, 'Rom/8/28'],
      },
      nuloAnaBetoNuloSinDevoluciones: {
        retenida: sinDevoluciones,
        escritaAntesDeAbrir: false,
        deAna: [],
        deBeto: [],
        sinCuenta: [P],
      },
      // Sin dueno, la Mesa de antes va con el primero (la mudanza ya leyo la
      // cuenta: el corte de R9-370), y lo pedido, con el ultimo.
      entraSinDueno: {
        retenida: {...conDevoluciones, deZoe: [], sinCuenta: sinMudar},
        escritaAntesDeAbrir: false,
        deAna: [P],
        deBeto: [],
        sinCuenta: sinMudar,
      },
      saleSinDueno: {
        retenida: {...conDevoluciones, deZoe: [], deAna: ['Ps/23/1-6']},
        escritaAntesDeAbrir: false,
        deAna: ['Ps/23/1-6'],
        deBeto: [],
        sinCuenta: ['Eph/2/8', P, 'Rom/8/28'],
      },
      anaBetoNuloAnaSinDueno: {
        retenida: {...conDevoluciones, deZoe: [], deAna: ['Ps/23/1-6']},
        escritaAntesDeAbrir: false,
        deAna: [P, 'Ps/23/1-6'],
        deBeto: [],
        sinCuenta: ['Eph/2/8', 'Rom/8/28'],
      },
      nuloAnaBetoNuloSinDueno: {
        retenida: {...conDevoluciones, deZoe: [], sinCuenta: sinMudar},
        escritaAntesDeAbrir: false,
        deAna: [],
        deBeto: [],
        sinCuenta: ['Eph/2/8', P, 'Ps/23/1-6', 'Rom/8/28'],
      },
      // R9-393 — los estados llegan con la mudanza escribiendo su marca, y su
      // union ya hecha con la cuenta que leyo (la del primero).
      anaBetoNuloAnaSinDuenoNiDevoluciones: {
        retenida: {
          parte: 'marca',
          deZoe: [],
          deAna: ['Ps/23/1-6'],
          sinCuenta: [],
        },
        escritaAntesDeAbrir: false,
        deAna: [P, 'Ps/23/1-6'],
        deBeto: [],
        sinCuenta: [],
      },
      nuloAnaBetoNuloSinDuenoNiDevoluciones: {
        retenida: {
          parte: 'marca',
          deZoe: [],
          deAna: [],
          sinCuenta: ['Ps/23/1-6'],
        },
        escritaAntesDeAbrir: false,
        deAna: [],
        deBeto: [],
        sinCuenta: [P, 'Ps/23/1-6'],
      },
    });
  });

  // R9-345 — lo pedido DURANTE el trabajo del primer estado de auth tambien
  // espera a que termine: que el estado haya llegado no hace conocida la
  // cuenta. Con la clave tomada al pedirla en cuanto llega un estado, lo
  // escrito sin cuenta mientras la migracion espera caia en la «sin cuenta»
  // de antes, y la migracion se lo llevaba a la Mesa de Ana.
  // R9-353 — y lo pedido va a la cuenta del ULTIMO estado que llega antes de
  // que termine el trabajo, no a la de cuando se pidio: con otros estados tras
  // los pedidos (de a uno, con una vuelta entre ellos), en las dos
  // direcciones. Con un estado solo, las dos son la misma, y tomar la cuenta
  // al pedirla pasaba.
  const P345 = 'John/3/16-21';
  const sinCuenta345 = {
    clave: '@prep_notes',
    deAna: ['Ps/23/1-6'],
    deBeto: [],
    sinCuenta: [P345],
    // Las cuatro que recibe `prepWrite`, de la «sin cuenta», una por store
    // (la base que pidio: la clave que recibio).
    recibidasAlFinal: [
      '@prep_illustrations: @prep_illustrations',
      '@prep_notes: @prep_notes',
      '@prep_self_review: @prep_self_review',
      '@prep_series: @prep_series',
    ],
    // Los otros tres, tambien en la «sin cuenta».
    claves: [
      '@prep_by_account',
      '@prep_illustrations',
      '@prep_notes',
      '@prep_notes:ana',
      '@prep_self_review',
      '@prep_series',
    ],
  };
  const deBeto345 = {
    clave: '@prep_notes:beto',
    deAna: ['Ps/23/1-6'],
    deBeto: [P345],
    sinCuenta: [],
    recibidasAlFinal: [
      '@prep_illustrations: @prep_illustrations:beto',
      '@prep_notes: @prep_notes:beto',
      '@prep_self_review: @prep_self_review:beto',
      '@prep_series: @prep_series:beto',
    ],
    claves: [
      '@prep_by_account',
      '@prep_illustrations:beto',
      '@prep_notes:ana',
      '@prep_notes:beto',
      '@prep_self_review:beto',
      '@prep_series:beto',
    ],
  };
  const escrituraDurante345 = async (
    primerEstado: string | null,
    despues: Array<string | null>,
    esperado: object,
    // R9-369 — la parte del trabajo que espera (ver abajo).
    parte: 'migracion' | 'devolucion' = 'migracion',
  ) => {
    const P = P345;
    const vuelta = () => new Promise(r => setImmediate(r));
    const mapa = async (k: string) =>
      Object.keys(JSON.parse((await AsyncStorage.getItem(k)) ?? '{}')).sort();
    await AsyncStorage.setItem(
      '@prep_notes',
      JSON.stringify({
        'Ps/23/1-6': {sections: {observation: 'de antes'}, updatedAt: 1},
      }),
    );
    await AsyncStorage.setItem('@local_store_owner_uid', 'ana');
    // R9-369 — o una devolucion pendiente (la Mesa de Bob, borrado), con la
    // migracion ya hecha, como en la lectura de abajo.
    if (parte === 'devolucion') {
      await AsyncStorage.clear();
      await AsyncStorage.multiSet([
        ['@prep_by_account', '1'],
        [
          '@prep_notes',
          JSON.stringify({
            'Ps/23/1-6': {sections: {observation: 'sin cuenta'}, updatedAt: 1},
          }),
        ],
        [
          '@prep_notes:bob',
          JSON.stringify({
            'Rom/8/28': {sections: {observation: 'de Bob'}, updatedAt: 1},
          }),
        ],
        ['@prep_release_pending', JSON.stringify(['bob'])],
      ]);
    }
    const mg = lecturas();
    const realMg = mg.getMockImplementation()!;
    const ms = AsyncStorage.multiSet as unknown as jest.Mock;
    const realMs = ms.getMockImplementation()!;
    let abrir!: () => void;
    const puerta = new Promise<void>(r => (abrir = r));
    // La migracion del primer estado (nulo) espera en su primera lectura.
    let migracionRetenida: string | null = null;
    mg.mockImplementation(async (ks: string[], cb?: unknown) => {
      if (
        parte === 'migracion' &&
        ks.includes('@prep_by_account') &&
        migracionRetenida === null
      ) {
        migracionRetenida = '@prep_by_account';
        await puerta;
      }
      return realMg(ks, cb);
    });
    // R9-369 — o la union de la devolucion, en la «sin cuenta».
    let devolucionRetenida: string[] | null = null;
    ms.mockImplementation(async (pairs: Array<[string, string]>) => {
      const union = pairs.find(([k]) => k === '@prep_notes');
      if (parte === 'devolucion' && union && devolucionRetenida === null) {
        devolucionRetenida = Object.keys(JSON.parse(union[1])).sort();
        await puerta;
      }
      return realMs(pairs);
    });
    try {
      relojesFalsos();
      managePrepAccount();
      const primero = setPrepAccount(primerEstado);
      for (let i = 0; i < 1000 && migracionRetenida === null; i++) {
        await vuelta();
      }
      const devolucion = parte === 'devolucion';
      for (let i = 0; devolucion && i < 1000 && !devolucionRetenida; i++) {
        await vuelta();
      }
      let escrita = false;
      // Los cuatro stores: cada uno pide su clave, y uno que la tomara por su
      // cuenta en cuanto llega el estado no lo veria la escritura de notas.
      // R9-349 — `pedidas`: cada store pidio la suya a `prepKey`, y la seguia
      // esperando al abrir. Con el store mas lento que la espera entre su
      // clave y su turno, uno que la tomara por su cuenta escribia detras de
      // la union, y pasaba: la clave pedida directo vigila solo a `prepKey`.
      const vigiladas = vigilarClaves();
      const edita = Promise.all([
        savePrepNote(P, 'observation', 'durante', 2),
        createPrepSeries('durante'),
        createPrepIllustration(),
        setPrepSelfReviewQuestion(P, PREP_SELF_REVIEW_QUESTION_IDS[0], true),
      ]).then(() => (escrita = true));
      // La clave misma, pedida tambien durante el trabajo: `escrita` sola no
      // lo decia; con el store mil vueltas mas lento entre su clave y su turno,
      // la escritura con la clave ya tomada llegaba detras de la union, y la
      // regresion pasaba.
      let clave: string | null = null;
      void prepKey('@prep_notes').then(k => (clave = k));
      await unaHora();
      // Los otros estados, con la migracion todavia retenida y los pedidos
      // hechos hace una hora. Con el reloj falso ya puesto: lo que un estado
      // deja en un temporizador vence en la hora de abajo.
      relojesFalsos();
      const otros: Array<Promise<void>> = [];
      for (const uid of despues) {
        await vuelta();
        otros.push(setPrepAccount(uid));
        // R9-361 — y tras cada uno, tiempo y vueltas: con una vuelta sola,
        // fijar la cuenta del primero tras el pedido con un temporizador de
        // 10 ms pasaba (vencia ya con el ultimo).
        await tiempoYVueltas();
      }
      // Los controles «al abrir» se leen aqui, una hora (de reloj falso) y mil
      // vueltas tras el ultimo estado, y justo antes de abrir (R9-366): leidos
      // antes de los otros estados, o en la misma tarea que el ultimo, una
      // clave tomada con uno de ellos no se veia.
      await unaHora();
      const antesDeAbrir = {clave, escrita, pedidas: vigiladas.pedidas()};
      // R9-354 — ninguna clave que recibio `prepWrite` estaba resuelta al
      // abrir. Un store que todavia no lo llamo no aparece: mas lento antes de
      // llamarlo que todas las esperas (dos horas, unas dos mil vueltas y mil
      // mas por cada estado de `despues`), aparece solo al final. Se miran
      // aqui y se leen al final (`recibidasResueltasAlAbrir`), cuando se sabe
      // de que store es cada llamada (R9-388).
      vigiladas.fotoAlAbrir();
      abrir();
      // R9-386 — en cuanto lo que pidieron los stores resolvio, llega otro
      // estado (Cata), como en el respaldo (R9-364): la clave se toma al
      // resolver, y un store que la volviera a pedir despues escribiria en la
      // Mesa de Cata (`pedidas` es un conjunto: la segunda no se contaba). Se
      // espera a que resuelva, y `resolvioAntesDeCata` lo dice; sin ningun
      // pedido contado, se espera a que los stores terminen, y el control dice
      // que no (R9-376).
      // R9-396 — mientras el trabajo del primer estado sigue, sin tope en
      // vueltas: con cien mil, una migracion que esperaba un temporizador real
      // de un segundo (un cambio bueno) recibia a Cata con lo pedido pendiente.
      // Su corte es el guarda de diez segundos de reloj real (jest corta la
      // prueba a los veinte). Terminado el trabajo, a lo sumo cien mil vueltas.
      const resuelto = () => {
        const p = vigiladas.pedidas();
        return p.length > 0 && !p.some(k => k.endsWith(': pendiente'));
      };
      let trabajoHecho = false;
      const fin = () => (trabajoHecho = true);
      void primero.then(fin, fin);
      const desde = Date.now();
      for (let tras = 0; tras < 100000 && !resuelto() && !escrita;) {
        await vuelta();
        if (trabajoHecho) tras++;
        else if (Date.now() - desde > 10000) break;
      }
      const resolvioAntesDeCata = resuelto();
      otros.push(setPrepAccount('cata'));
      await Promise.all([primero, edita, ...otros]);
      const pedidasAlFinal = vigiladas.pedidas();
      const recibidasAlFinal = vigiladas.escrituras();
      const recibidasResueltasAlAbrir = vigiladas.resueltasAlAbrir();
      vigiladas.soltar();
      mg.mockImplementation(realMg);
      expect({
        migracionRetenida, // CONTROL: la migracion esperaba en su lectura
        devolucionRetenida, // CONTROL: o la union de la devolucion (R9-369)
        resolvioAntesDeCata, // CONTROL: lo pedido resolvio antes del estado tardio
        antesDeAbrir,
        pedidasAlFinal,
        recibidasResueltasAlAbrir,
        recibidasAlFinal,
        clave,
        deAna: await mapa('@prep_notes:ana'), // CONTROL: la migracion movio lo de antes
        deBeto: await mapa('@prep_notes:beto'),
        deCata: await mapa('@prep_notes:cata'),
        sinCuenta: await mapa('@prep_notes'),
        claves: await claves(),
      }).toEqual({
        ...esperado,
        migracionRetenida: '@prep_by_account',
        devolucionRetenida: null,
        resolvioAntesDeCata: true,
        deCata: [],
        // R9-369 — en la devolucion, las retenidas y lo de Ana, del caso.
        ...(parte === 'devolucion' ? esperado : {}),
        antesDeAbrir: {
          clave: null,
          escrita: false,
          pedidas: [
            '@prep_illustrations: pendiente',
            '@prep_notes: pendiente',
            '@prep_self_review: pendiente',
            '@prep_series: pendiente',
          ],
        },
        pedidasAlFinal: [
          '@prep_illustrations: resuelta',
          '@prep_notes: resuelta',
          '@prep_self_review: resuelta',
          '@prep_series: resuelta',
        ],
        recibidasResueltasAlAbrir: [],
      });
    } finally {
      abrir();
      mg.mockImplementation(realMg);
      ms.mockImplementation(realMs);
    }
  };
  it.each([
    ['un estado', null, [], sinCuenta345],
    ['nulo, y beto tras los pedidos', null, ['beto'], deBeto345],
    ['ana, y nulo tras los pedidos', 'ana', [null], sinCuenta345],
    [
      'nulo, y beto y nulo tras los pedidos',
      null,
      ['beto', null],
      sinCuenta345,
    ],
  ] as Array<[string, string | null, Array<string | null>, object]>)(
    'R9-345: lo escrito durante el trabajo del primer estado de auth no se va con la Mesa de antes (%s)',
    (_nombre, primerEstado, despues, esperado) =>
      escrituraDurante345(primerEstado, despues, esperado),
  );
  // R9-369 — lo mismo mientras se termina una devolucion pendiente, con la
  // migracion ya hecha: no mueve nada, y lo escrito va igual a la cuenta del
  // ultimo estado, en las dos direcciones. Solo la lectura sembraba una
  // devolucion: un store que tomaba la cuenta de cuando pidio su clave si la
  // migracion no movia nada pasaba aqui (con un estado tras el pedido, lo vio
  // solo R9-292), y lo escrito iba a la cuenta contraria.
  const devolucion369 = {
    migracionRetenida: null,
    devolucionRetenida: ['Ps/23/1-6', 'Rom/8/28'],
    deBeto: [],
  };
  it.each([
    [
      'nulo, y ana tras los pedidos',
      null,
      ['ana'],
      {
        ...devolucion369,
        clave: '@prep_notes:ana',
        deAna: [P345],
        sinCuenta: ['Ps/23/1-6', 'Rom/8/28'],
        recibidasAlFinal: [
          '@prep_illustrations: @prep_illustrations:ana',
          '@prep_notes: @prep_notes:ana',
          '@prep_self_review: @prep_self_review:ana',
          '@prep_series: @prep_series:ana',
        ],
        claves: [
          '@prep_by_account',
          '@prep_illustrations:ana',
          '@prep_notes',
          '@prep_notes:ana',
          '@prep_self_review:ana',
          '@prep_series:ana',
        ],
      },
    ],
    [
      'ana, y nulo tras los pedidos',
      'ana',
      [null],
      {
        ...devolucion369,
        clave: '@prep_notes',
        deAna: [],
        sinCuenta: [P345, 'Ps/23/1-6', 'Rom/8/28'],
        recibidasAlFinal: [
          '@prep_illustrations: @prep_illustrations',
          '@prep_notes: @prep_notes',
          '@prep_self_review: @prep_self_review',
          '@prep_series: @prep_series',
        ],
        claves: [
          '@prep_by_account',
          '@prep_illustrations',
          '@prep_notes',
          '@prep_self_review',
          '@prep_series',
        ],
      },
    ],
  ] as Array<[string, string | null, Array<string | null>, object]>)(
    'R9-369: lo escrito mientras se termina una devolucion pendiente va a la cuenta del ultimo estado (%s)',
    (_nombre, primerEstado, despues, esperado) =>
      escrituraDurante345(primerEstado, despues, esperado, 'devolucion'),
  );

  // R9-345 — lo mismo para una lectura, en las dos partes del trabajo: pedida
  // mientras la migracion espera, con la clave tomada al pedirla leia la Mesa
  // de Ana antes de que la union le llevara lo de antes; pedida mientras se
  // termina una devolucion pendiente, leia la «sin cuenta» sin lo devuelto.
  // Con estados solo durante la migracion, tomar la clave en cuanto esta
  // termina pasaba. Y la clave pedida directo (`clave`): con la lectura mil
  // vueltas mas lenta entre su clave y su `getItem`, la regresion leia detras
  // de la union, y pasaba. R9-349 — eso vale para `prepKey`; para la lectura,
  // `pedidas`: la pidio a `prepKey`, y la seguia esperando al abrir. Una que
  // la tomara por su cuenta, mas lenta, pasaba igual.
  it('R9-345: una lectura pedida durante el trabajo del primer estado de auth ve lo que mueve: la migracion, o una devolucion pendiente', async () => {
    const P = 'John/3/16-21';
    const R = 'Ps/23/1-6';
    const vuelta = () => new Promise(r => setImmediate(r));
    const ms = AsyncStorage.multiSet as unknown as jest.Mock;
    const realMs = ms.getMockImplementation()!;
    let abrir: () => void = () => undefined;
    // La union del trabajo que escribe en `retener` espera en una puerta, y
    // la lectura (y la clave) se piden mientras tanto. R9-353 — y `despues`:
    // otros estados tras los pedidos, de a uno, con la union todavia retenida.
    const caso = async (
      primerEstado: string | null,
      retener: string,
      despues: Array<string | null> = [],
    ) => {
      __resetPrepAccountForTests();
      const puerta = new Promise<void>(r => (abrir = r));
      let retenida: string[] | null = null;
      ms.mockImplementation(async (pairs: Array<[string, string]>) => {
        const union = pairs.find(([k]) => k === retener);
        if (union && retenida === null) {
          retenida = Object.keys(JSON.parse(union[1])).sort();
          await puerta;
        }
        return realMs(pairs);
      });
      relojesFalsos();
      managePrepAccount();
      const primero = setPrepAccount(primerEstado);
      for (let i = 0; i < 1000 && retenida === null; i++) await vuelta();
      const vigiladas = vigilarClaves();
      let leido: string[] | null = null;
      const lectura = pasajes().then(r => (leido = r));
      let clave: string | null = null;
      void prepKey('@prep_notes').then(k => (clave = k));
      await unaHora();
      // Los otros estados, como en la escritura: de a uno, con tiempo y
      // vueltas tras cada uno (R9-361), y el control «al abrir» leido despues
      // de todos, justo antes de abrir (R9-366).
      relojesFalsos();
      const otros: Array<Promise<void>> = [];
      for (const uid of despues) {
        await vuelta();
        otros.push(setPrepAccount(uid));
        await tiempoYVueltas();
      }
      await unaHora();
      const antesDeAbrir = {clave, leido, pedidas: vigiladas.pedidas()};
      abrir();
      await Promise.all([primero, lectura, ...otros]);
      const pedidasAlFinal = vigiladas.pedidas();
      vigiladas.soltar();
      ms.mockImplementation(realMs);
      return {retenida, antesDeAbrir, pedidasAlFinal, clave, leido};
    };
    // La migracion: lo de antes (P) va a Ana, la duena de la «sin cuenta».
    const sembrarMigracion = async () => {
      await AsyncStorage.clear();
      await AsyncStorage.setItem(
        '@prep_notes',
        JSON.stringify({
          [P]: {sections: {observation: 'de antes'}, updatedAt: 1},
        }),
      );
      await AsyncStorage.setItem('@local_store_owner_uid', 'ana');
    };
    // Una devolucion pendiente (la Mesa de Bob, borrado), con la migracion
    // ya hecha.
    const sembrarDevolucion = async () => {
      await AsyncStorage.clear();
      await AsyncStorage.multiSet([
        ['@prep_by_account', '1'],
        [
          '@prep_notes',
          JSON.stringify({
            [R]: {sections: {observation: 'sin cuenta'}, updatedAt: 1},
          }),
        ],
        [
          '@prep_notes:bob',
          JSON.stringify({
            'Rom/8/28': {sections: {observation: 'de Bob'}, updatedAt: 1},
          }),
        ],
        ['@prep_release_pending', JSON.stringify(['bob'])],
      ]);
    };
    try {
      await sembrarMigracion();
      const migracion = await caso('ana', '@prep_notes:ana');
      await sembrarDevolucion();
      const devolucion = await caso(null, '@prep_notes');
      // R9-353 — en cada parte, las dos direcciones, y varios estados.
      const durante: Record<string, unknown> = {};
      for (const [nombre, sembrar, primerEstado, retener, despues] of [
        [
          'migracionNuloAna',
          sembrarMigracion,
          null,
          '@prep_notes:ana',
          ['ana'],
        ],
        [
          'migracionAnaNulo',
          sembrarMigracion,
          'ana',
          '@prep_notes:ana',
          [null],
        ],
        [
          'migracionAnaNuloAna',
          sembrarMigracion,
          'ana',
          '@prep_notes:ana',
          [null, 'ana'],
        ],
        ['devolucionNuloAna', sembrarDevolucion, null, '@prep_notes', ['ana']],
        ['devolucionAnaNulo', sembrarDevolucion, 'ana', '@prep_notes', [null]],
        [
          'devolucionNuloAnaNulo',
          sembrarDevolucion,
          null,
          '@prep_notes',
          ['ana', null],
        ],
      ] as Array<
        [
          string,
          () => Promise<void>,
          string | null,
          string,
          Array<string | null>,
        ]
      >) {
        await sembrar();
        const r = await caso(primerEstado, retener, despues);
        durante[nombre] = {
          retenida: r.retenida,
          antesDeAbrir: r.antesDeAbrir,
          pedidasAlFinal: r.pedidasAlFinal,
          clave: r.clave,
          leido: r.leido,
        };
      }
      // R9-379 — el control «al abrir» y el del final se comparan tambien en
      // los casos con estados: calculados y sin comparar, no vigilaban.
      const alAbrir = {
        clave: null,
        leido: null,
        pedidas: ['@prep_notes: pendiente'],
      };
      const alFinal = ['@prep_notes: resuelta'];
      expect({durante}).toEqual({
        durante: {
          migracionNuloAna: {
            retenida: [P],
            antesDeAbrir: alAbrir,
            pedidasAlFinal: alFinal,
            clave: '@prep_notes:ana',
            leido: [P],
          },
          migracionAnaNulo: {
            retenida: [P],
            antesDeAbrir: alAbrir,
            pedidasAlFinal: alFinal,
            clave: '@prep_notes',
            leido: [],
          },
          migracionAnaNuloAna: {
            retenida: [P],
            antesDeAbrir: alAbrir,
            pedidasAlFinal: alFinal,
            clave: '@prep_notes:ana',
            leido: [P],
          },
          devolucionNuloAna: {
            retenida: [R, 'Rom/8/28'],
            antesDeAbrir: alAbrir,
            pedidasAlFinal: alFinal,
            clave: '@prep_notes:ana',
            leido: [],
          },
          devolucionAnaNulo: {
            retenida: [R, 'Rom/8/28'],
            antesDeAbrir: alAbrir,
            pedidasAlFinal: alFinal,
            clave: '@prep_notes',
            leido: [R, 'Rom/8/28'],
          },
          devolucionNuloAnaNulo: {
            retenida: [R, 'Rom/8/28'],
            antesDeAbrir: alAbrir,
            pedidasAlFinal: alFinal,
            clave: '@prep_notes',
            leido: [R, 'Rom/8/28'],
          },
        },
      });
      expect({migracion, devolucion}).toEqual({
        migracion: {
          retenida: [P], // CONTROL: la union de la migracion esperaba, con P
          antesDeAbrir: {
            clave: null,
            leido: null,
            pedidas: ['@prep_notes: pendiente'],
          },
          pedidasAlFinal: ['@prep_notes: resuelta'],
          clave: '@prep_notes:ana',
          leido: [P],
        },
        devolucion: {
          retenida: [R, 'Rom/8/28'], // CONTROL: la union de la devolucion esperaba, con lo de Bob
          antesDeAbrir: {
            clave: null,
            leido: null,
            pedidas: ['@prep_notes: pendiente'],
          },
          pedidasAlFinal: ['@prep_notes: resuelta'],
          clave: '@prep_notes',
          leido: [R, 'Rom/8/28'],
        },
      });
    } finally {
      abrir();
      ms.mockImplementation(realMs);
    }
  });

  // R9-367 — lo que queda en disco al final: las claves de la Mesa (de cada
  // cuenta y la «sin cuenta»), la marca y la nota. Una Mesa vaciada cuenta como
  // quitada: dejarla vacia o quitarla es lo mismo para quien la lee.
  const clavesConDatos = async () =>
    (await AsyncStorage.multiGet(await claves()))
      .filter(([, v]) => v !== '{}')
      .map(([k]) => k);

  // R9-336 — todo estado espera el trabajo del primero (R9-331), asi que ese
  // trabajo no puede rechazar: cada paso se traga su falla. R9-343 — un caso
  // por cada PARTE del trabajo que puede fallar, no por paso: la migracion (sus
  // dos lecturas, las lecturas de su union, su escritura y su quita, y la
  // marca), la lectura de la nota, y cada devolucion (las lecturas de su union,
  // su escritura y su quita, y la nota: releerla, re-escribirla si queda otra
  // cuenta, o quitarla). Si la falla de una parte saliera de su `try`, los dos
  // estados lanzarian y la lectura no volveria nunca; con un caso por paso, 8
  // de esas partes podian sacarla sin que cayera nada.
  //
  // El control dice QUE fallo, por contenido: lo que escribia o quitaba la
  // primera llamada que fallo (`escribia`), y que el paso de esa parte se la
  // trago: su aviso esta entre los de la corrida con falla (`avisos`, leidos
  // al final). R9-368 — no la lista exacta: un aviso de mas en un paso que se
  // traga su falla no cambia lo que hace. Que la parte siguiente de la misma
  // clave corrio tras la falla (lo que veia un segundo aviso) lo dicen los
  // datos de un caso que falla una sola vez (`una`).
  // Y `llamadas`: cuantas llamadas tocan la clave en el trabajo SIN falla (una
  // corrida limpia, antes), asi la `n`-esima es la de esa parte. Contar las
  // que fallaron no lo decia: con otra llamada de la clave delante (aun del
  // mismo paso, con el mismo aviso), la falla caia en esa, y el caso pasaba con
  // la parte fuera del `try`; y contarlas en la corrida que falla no veia una
  // llamada delante que, al fallar, corta el paso antes de llegar a la parte.
  const primerEstadoConFalla = async (
    metodo: 'getItem' | 'multiSet' | 'multiRemove',
    clave: string,
    n: number,
    sembrar?: () => Promise<void>,
    una?: boolean,
    cuenta: string | null = null,
  ) => {
    const vuelta = () => new Promise(r => setImmediate(r));
    // R9-359 — una lectura (`getItem`) falla en `multiGet`, por donde pasa en el
    // mock: la `n`-esima lectura de `clave`, con el metodo que sea.
    const mock = (metodo === 'getItem'
      ? lecturas()
      : AsyncStorage[metodo]) as unknown as jest.Mock;
    const real = mock.getMockImplementation()!;
    let fallar = false;
    let llamadas = 0;
    let centinela = {corrio: false};
    let fallo: {escribia: unknown} | null = null;
    const avisos: string[] = [];
    const warn = jest
      .spyOn(logger, 'warn')
      .mockImplementation((mensaje, contexto) => {
        if (String(contexto?.error).includes('disco')) avisos.push(mensaje);
      });
    // Lo que escribia la llamada en `clave` (las claves de un mapa, una lista
    // tal cual, o el valor crudo), o lo que quitaba; una lectura, nada.
    const contenido = (arg: unknown): unknown => {
      if (metodo === 'getItem') return null;
      if (metodo === 'multiRemove') return [...(arg as string[])].sort();
      const valor = (arg as Array<[string, string]>).find(
        ([k]) => k === clave,
      )![1];
      let v: unknown;
      try {
        v = JSON.parse(valor);
      } catch {
        v = valor;
      }
      if (Array.isArray(v)) return v;
      if (v && typeof v === 'object') return Object.keys(v).sort();
      return valor;
    };
    // R9-348 — con `fallar`, la `n`-esima llamada que toca `clave` lanza, y
    // las siguientes tambien: una falla de disco puede repetirse (R9-212).
    // Fallando una sola vez, un reintento de la parte fuera de su `try` pasaba.
    // Con `una`, solo la `n`-esima (el caso que mira la parte siguiente).
    // `fallo`: la primera que lanzo.
    mock.mockImplementation(async (arg: unknown, cb?: unknown) => {
      const toca =
        metodo === 'multiSet'
          ? (arg as Array<[string, string]>).some(([k]) => k === clave)
          : (arg as string[]).includes(clave);
      if (toca) llamadas += 1;
      if (fallar && toca && (una ? llamadas === n : llamadas >= n)) {
        fallo ??= {escribia: contenido(arg)};
        throw new Error('disco');
      }
      return real(arg, cb);
    });
    // El primer estado (y un segundo) con lo sembrado, y una lectura pedida
    // antes. La falla, solo en el trabajo: la siembra y la lectura final de la
    // nota pasan por el mismo mock.
    const correr = async (conFalla: boolean) => {
      __resetPrepAccountForTests();
      await AsyncStorage.clear();
      await sembrar?.();
      await AsyncStorage.setItem(
        '@prep_notes',
        JSON.stringify({
          'Ps/23/1-6': {sections: {observation: 'sin cuenta'}, updatedAt: 1},
        }),
      );
      llamadas = 0;
      fallar = conFalla;
      let leido: string[] | null = null;
      const lanzo: string[] = [];
      managePrepAccount();
      if (conFalla) centinela = centinelaLargo();
      void pasajes().then(r => (leido = r));
      // Los dos terminan tambien si lanzan; la lectura, no: se la espera a lo
      // sumo cien mil vueltas (con mil, una lectura mil vueltas mas lenta daba
      // `leido: null` sin que nadie lanzara, el rojo del dano). Con la falla, el
      // reloj falso ya esta puesto (R9-374).
      const estados = Promise.all([
        setPrepAccount(cuenta).catch(() => lanzo.push('primero')),
        setPrepAccount(cuenta).catch(() => lanzo.push('segundo')),
      ]);
      await (conFalla ? esperarConReloj(estados) : estados);
      for (let i = 0; i < 100000 && leido === null; i++) await vuelta();
      fallar = false;
      return {lanzo, leido};
    };
    try {
      await correr(false);
      const limpias = llamadas;
      // R9-357, R9-360 — el reloj falso se pone ANTES del trabajo (un
      // temporizador que nace real no lo adelanta el falso), y la nota se lee
      // despues de correr todo temporizador pendiente, de cualquier plazo (con
      // solo la hora, uno de mas de una hora pasaba), y de una hora y mil
      // vueltas: una quita que el paso deja corriendo sin esperarla llegaba
      // despues de leerla (20 vueltas mas tarde, o con un temporizador).
      relojesFalsos();
      const {lanzo, leido} = await correr(true);
      await tiempoYVueltas();
      await unaHora();
      return {
        llamadas: limpias,
        fallo,
        avisos: [...avisos],
        esperaCompleta: centinela.corrio,
        lanzo,
        leido,
        // La nota de las devoluciones: la que fallo se queda, y la termina el
        // arranque siguiente.
        nota: await AsyncStorage.getItem('@prep_release_pending'),
        claves: await clavesConDatos(),
      };
    } finally {
      mock.mockImplementation(real);
      warn.mockRestore();
    }
  };

  const MIGRA = 'Failed to move the Mesa to its account';
  const MUEVE = 'Failed to move the Mesa to the account signed in';
  const NOTA = 'Failed to read the Mesa to give back';
  const DEV = 'Failed to give the Mesa back';
  const mesaDe = (pasaje: string) =>
    JSON.stringify({[pasaje]: {sections: {observation: 'de'}, updatedAt: 1}});
  // Lo que cada caso siembra ademas de la «sin cuenta» (Ps/23/1-6).
  const conDueno = () => AsyncStorage.setItem('@local_store_owner_uid', 'ana');
  const conDevoluciones = async (...uids: string[]) => {
    const pasaje: Record<string, string> = {bob: 'Rom/8/28', carl: 'Eph/2/8'};
    for (const uid of uids) {
      await AsyncStorage.setItem(`@prep_notes:${uid}`, mesaDe(pasaje[uid]));
    }
    await AsyncStorage.setItem('@prep_release_pending', JSON.stringify(uids));
  };
  // R9-392 — la Mesa de antes con las cuatro bases (las notas las siembra
  // `correr`): con solo notas, una mudanza que dejaba atras una base pasaba.
  const antesCuatro = async () => {
    for (const base of [
      '@prep_series',
      '@prep_illustrations',
      '@prep_self_review',
    ]) {
      await AsyncStorage.setItem(base, mesaDe(base));
    }
  };
  type Parte = {
    titulo: string;
    sembrar?: () => Promise<void>;
    metodo: 'getItem' | 'multiSet' | 'multiRemove';
    clave: string;
    n?: number;
    una?: boolean;
    // La cuenta de los dos estados (sin ella, nulos).
    cuenta?: string;
    llamadas: number;
    escribia: unknown;
    aviso: string;
    leido: string[];
    nota: string | null;
    claves: string[];
  };
  const Ps = 'Ps/23/1-6';
  const partes: Parte[] = [
    {
      titulo: 'R9-336: la primera lectura de la migracion',
      metodo: 'getItem',
      clave: '@prep_by_account',
      llamadas: 1,
      escribia: null,
      aviso: MIGRA,
      leido: [Ps],
      nota: null,
      claves: ['@prep_notes'],
    },
    {
      titulo: 'R9-343: la lectura del dueno, en la migracion',
      metodo: 'getItem',
      clave: '@local_store_owner_uid',
      llamadas: 1,
      escribia: null,
      aviso: MIGRA,
      leido: [Ps],
      nota: null,
      claves: ['@prep_notes'],
    },
    {
      titulo: 'R9-343: una lectura de la union de la migracion',
      sembrar: conDueno,
      metodo: 'getItem',
      clave: '@prep_notes:ana',
      llamadas: 1,
      escribia: null,
      aviso: MIGRA,
      leido: [Ps],
      nota: null,
      claves: ['@prep_notes'],
    },
    {
      titulo: 'R9-343: la escritura de la union de la migracion',
      sembrar: conDueno,
      metodo: 'multiSet',
      clave: '@prep_notes:ana',
      llamadas: 1,
      escribia: [Ps],
      aviso: MIGRA,
      leido: [Ps],
      nota: null,
      claves: ['@prep_notes'],
    },
    {
      titulo: 'R9-343: la quita de la union de la migracion',
      sembrar: conDueno,
      metodo: 'multiRemove',
      clave: '@prep_notes',
      llamadas: 1,
      escribia: ['@prep_notes'],
      aviso: MIGRA,
      leido: [Ps],
      nota: null,
      // La union ya se escribio: queda en las dos, como en la de una
      // devolucion.
      claves: ['@prep_notes', '@prep_notes:ana'],
    },
    {
      // R9-370 — sin dueno registrado, la marca la escribe `moveUnownedPrep`
      // (tras leer la nota de devoluciones), con su aviso; la de abajo, con
      // dueno, la escribe la migracion.
      titulo: 'R9-343: la marca de la migracion',
      metodo: 'multiSet',
      clave: '@prep_by_account',
      llamadas: 1,
      escribia: '1',
      aviso: MUEVE,
      leido: [Ps],
      nota: null,
      claves: ['@prep_notes'],
    },
    {
      titulo: 'R9-370: la marca de la migracion, con dueno registrado',
      sembrar: conDueno,
      metodo: 'multiSet',
      clave: '@prep_by_account',
      llamadas: 1,
      escribia: '1',
      aviso: MIGRA,
      // la union ya llevo la Mesa a la de Ana: la «sin cuenta» queda vacia.
      leido: [],
      nota: null,
      claves: ['@prep_notes:ana'],
    },
    // R9-383 — sin dueno registrado, la mudanza (`moveUnownedPrep`) une solo
    // con un estado con cuenta: con los estados nulos no une nada, y una
    // regresion de su union, de su marca o de la nota fallida pasaba la tabla.
    // R9-392 — con las cuatro bases en la Mesa de antes, y `claves` dice donde
    // quedo cada una. R9-391 — una fila por cada lectura de la union: la de la
    // «sin cuenta» y la de la Mesa de Ana (tragada, la tomaba por vacia y la
    // pisaba). La lectura pedida antes vuelve a leer la de Ana: cuenta en
    // `llamadas`.
    {
      titulo: 'R9-383: una lectura de la union de la mudanza, sin dueno',
      sembrar: antesCuatro,
      cuenta: 'ana',
      metodo: 'getItem',
      clave: '@prep_notes',
      llamadas: 1,
      escribia: null,
      aviso: MUEVE,
      leido: [],
      nota: null,
      // sin mover y sin marca: se mueve en el arranque siguiente.
      claves: [
        '@prep_illustrations',
        '@prep_notes',
        '@prep_self_review',
        '@prep_series',
      ],
    },
    {
      titulo:
        'R9-391: la lectura de la Mesa de destino de la mudanza, sin dueno',
      sembrar: antesCuatro,
      cuenta: 'ana',
      metodo: 'getItem',
      clave: '@prep_notes:ana',
      llamadas: 2,
      escribia: null,
      aviso: MUEVE,
      leido: [],
      nota: null,
      claves: [
        '@prep_illustrations',
        '@prep_notes',
        '@prep_self_review',
        '@prep_series',
      ],
    },
    {
      titulo: 'R9-383: la escritura de la union de la mudanza, sin dueno',
      sembrar: antesCuatro,
      cuenta: 'ana',
      metodo: 'multiSet',
      clave: '@prep_notes:ana',
      llamadas: 1,
      escribia: [Ps],
      aviso: MUEVE,
      leido: [],
      nota: null,
      claves: [
        '@prep_illustrations',
        '@prep_notes',
        '@prep_self_review',
        '@prep_series',
      ],
    },
    {
      titulo: 'R9-383: la quita de la union de la mudanza, sin dueno',
      sembrar: antesCuatro,
      cuenta: 'ana',
      metodo: 'multiRemove',
      clave: '@prep_notes',
      llamadas: 1,
      escribia: [
        '@prep_illustrations',
        '@prep_notes',
        '@prep_self_review',
        '@prep_series',
      ],
      aviso: MUEVE,
      leido: [Ps],
      nota: null,
      claves: [
        '@prep_illustrations',
        '@prep_illustrations:ana',
        '@prep_notes',
        '@prep_notes:ana',
        '@prep_self_review',
        '@prep_self_review:ana',
        '@prep_series',
        '@prep_series:ana',
      ],
    },
    {
      titulo: 'R9-383: la marca de la mudanza, sin dueno, con una cuenta',
      sembrar: antesCuatro,
      cuenta: 'ana',
      metodo: 'multiSet',
      clave: '@prep_by_account',
      llamadas: 1,
      escribia: '1',
      aviso: MUEVE,
      leido: [Ps],
      nota: null,
      // movida y sin marca: la mudanza del arranque siguiente no mueve nada.
      claves: [
        '@prep_illustrations:ana',
        '@prep_notes:ana',
        '@prep_self_review:ana',
        '@prep_series:ana',
      ],
    },
    {
      // R9-357 — con una devolucion anotada: la lectura que falla deja la nota
      // (y la Mesa de Bob, en `claves`: R9-367) para el arranque siguiente.
      // Sin nada anotado, una nota quitada al fallar salia igual (`null`). Sin
      // falla, la nota se lee dos veces: en `finishRelease` y al terminar la
      // devolucion.
      titulo: 'R9-336: la lectura de la nota de devoluciones',
      sembrar: () => conDevoluciones('bob'),
      metodo: 'getItem',
      clave: '@prep_release_pending',
      llamadas: 2,
      escribia: null,
      aviso: NOTA,
      leido: [Ps],
      nota: '["bob"]',
      claves: [
        '@prep_by_account',
        '@prep_notes',
        '@prep_notes:bob',
        '@prep_release_pending',
      ],
    },
    {
      // R9-383 — la misma con una cuenta: la Mesa de antes se mueve igual (sin
      // ella, la «sin cuenta» quedaba igual movida o no).
      titulo:
        'R9-383: la lectura de la nota de devoluciones, sin dueno, con una cuenta',
      sembrar: async () => {
        await conDevoluciones('bob');
        await antesCuatro();
      },
      cuenta: 'ana',
      metodo: 'getItem',
      clave: '@prep_release_pending',
      llamadas: 2,
      escribia: null,
      aviso: NOTA,
      leido: [Ps],
      nota: '["bob"]',
      claves: [
        '@prep_by_account',
        '@prep_illustrations:ana',
        '@prep_notes:ana',
        '@prep_notes:bob',
        '@prep_release_pending',
        '@prep_self_review:ana',
        '@prep_series:ana',
      ],
    },
    {
      titulo: 'R9-343: una lectura de la union de una devolucion pendiente',
      sembrar: () => conDevoluciones('bob'),
      metodo: 'getItem',
      clave: '@prep_notes:bob',
      llamadas: 1,
      escribia: null,
      aviso: DEV,
      leido: [Ps],
      nota: '["bob"]',
      claves: [
        '@prep_by_account',
        '@prep_notes',
        '@prep_notes:bob',
        '@prep_release_pending',
      ],
    },
    {
      titulo: 'R9-336: la escritura de la union de una devolucion pendiente',
      sembrar: () => conDevoluciones('bob'),
      metodo: 'multiSet',
      clave: '@prep_notes',
      llamadas: 1,
      escribia: [Ps, 'Rom/8/28'],
      aviso: DEV,
      leido: [Ps],
      nota: '["bob"]',
      claves: [
        '@prep_by_account',
        '@prep_notes',
        '@prep_notes:bob',
        '@prep_release_pending',
      ],
    },
    {
      titulo: 'R9-343: la quita de la union de una devolucion pendiente',
      sembrar: () => conDevoluciones('bob'),
      metodo: 'multiRemove',
      clave: '@prep_notes:bob',
      llamadas: 1,
      escribia: ['@prep_notes:bob'],
      aviso: DEV,
      leido: [Ps, 'Rom/8/28'],
      nota: '["bob"]',
      // La union ya se escribio: lo de Bob queda en las dos (`joinPrep`
      // escribe la union antes de quitar).
      claves: [
        '@prep_by_account',
        '@prep_notes',
        '@prep_notes:bob',
        '@prep_release_pending',
      ],
    },
    {
      // La primera lectura de la nota es la de `finishRelease`.
      titulo: 'R9-343: la relectura de la nota al terminar una devolucion',
      sembrar: () => conDevoluciones('bob'),
      metodo: 'getItem',
      clave: '@prep_release_pending',
      n: 2,
      llamadas: 2,
      escribia: null,
      aviso: DEV,
      leido: [Ps, 'Rom/8/28'],
      nota: '["bob"]',
      claves: ['@prep_by_account', '@prep_notes', '@prep_release_pending'],
    },
    {
      // La de Bob falla; la de Carl, que la re-escribe despues sin Carl,
      // tambien: la nota se queda con las dos.
      titulo:
        'R9-343: la re-escritura de la nota al terminar una devolucion, con otra pendiente',
      sembrar: () => conDevoluciones('bob', 'carl'),
      metodo: 'multiSet',
      clave: '@prep_release_pending',
      llamadas: 1,
      escribia: ['carl'],
      aviso: DEV,
      leido: ['Eph/2/8', Ps, 'Rom/8/28'],
      nota: '["bob","carl"]',
      claves: ['@prep_by_account', '@prep_notes', '@prep_release_pending'],
    },
    {
      // R9-368 — la misma, fallando una sola vez: la de Carl corre despues y
      // re-escribe la nota sin Carl. Con la falla repetida, que esa parte
      // siguiente corrio lo decia solo un segundo aviso; una nota que, tras
      // fallar, ya no se cambia en el resto del proceso pasaba con los avisos
      // leidos como conjunto.
      titulo:
        'R9-368: la re-escritura de la nota al terminar una devolucion, fallando una vez, con otra pendiente',
      sembrar: () => conDevoluciones('bob', 'carl'),
      metodo: 'multiSet',
      clave: '@prep_release_pending',
      una: true,
      llamadas: 1,
      escribia: ['carl'],
      aviso: DEV,
      leido: ['Eph/2/8', Ps, 'Rom/8/28'],
      nota: '["bob"]',
      claves: ['@prep_by_account', '@prep_notes', '@prep_release_pending'],
    },
    {
      titulo: 'R9-343: la quita de la nota al terminar la ultima devolucion',
      sembrar: () => conDevoluciones('bob'),
      metodo: 'multiRemove',
      clave: '@prep_release_pending',
      llamadas: 1,
      escribia: ['@prep_release_pending'],
      aviso: DEV,
      leido: [Ps, 'Rom/8/28'],
      nota: '["bob"]',
      claves: ['@prep_by_account', '@prep_notes', '@prep_release_pending'],
    },
  ];

  it.each(partes)(
    '$titulo: si falla en el primer estado de auth, ningun estado lanza y las claves se sueltan',
    async ({
      sembrar,
      metodo,
      clave,
      n,
      una,
      cuenta,
      llamadas,
      escribia,
      aviso,
      leido,
      nota,
      claves,
    }) => {
      expect(
        await primerEstadoConFalla(metodo, clave, n ?? 1, sembrar, una, cuenta),
      ).toEqual({
        llamadas, // CONTROL: sin falla, ninguna otra llamada toca la clave
        fallo: {escribia}, // CONTROL: fallo esa parte
        avisos: expect.arrayContaining([aviso]), // CONTROL: y se la trago su paso
        esperaCompleta: true, // CONTROL: la espera corrio un temporizador de dos horas puesto en el trabajo
        lanzo: [],
        leido,
        nota,
        claves,
      });
    },
  );

  // R9-357 — la tabla hace fallar un par (metodo, clave), y una falla de disco
  // no se queda en uno: un camino de error que toca otro par fuera de su `try`
  // (quitar la marca de la migracion, o la nota, al fallar) pasaba la tabla.
  // Aqui falla todo metodo del almacen, en toda clave, durante el trabajo del
  // primer estado y la lectura pedida antes; el disco vuelve despues, para
  // leer lo que quedo.
  it('R9-357: con todo el disco fallando en el primer estado de auth, ningun estado lanza, las claves se sueltan y la devolucion anotada se queda', async () => {
    const metodos = [
      'getItem',
      'multiGet',
      'setItem',
      'multiSet',
      'removeItem',
      'multiRemove',
      'mergeItem',
      'multiMerge',
      'getAllKeys',
      'clear',
    ] as const;
    const mocks = metodos.map(m => AsyncStorage[m] as unknown as jest.Mock);
    const reales = mocks.map(m => m.getMockImplementation()!);
    let fallar = false;
    mocks.forEach((mock, i) =>
      mock.mockImplementation(async (...args: unknown[]) => {
        if (fallar) throw new Error('disco');
        return reales[i](...args);
      }),
    );
    const avisos: string[] = [];
    const warn = jest
      .spyOn(logger, 'warn')
      .mockImplementation((mensaje, contexto) => {
        if (String(contexto?.error).includes('disco')) avisos.push(mensaje);
      });
    try {
      await conDevoluciones('bob');
      await AsyncStorage.setItem('@prep_notes', mesaDe(Ps));
      relojesFalsos();
      fallar = true;
      let leido: string[] | null = null;
      const lanzo: string[] = [];
      managePrepAccount();
      const centinela = centinelaLargo();
      void pasajes().then(r => (leido = r));
      await esperarConReloj(
        Promise.all([
          setPrepAccount(null).catch(() => lanzo.push('primero')),
          setPrepAccount(null).catch(() => lanzo.push('segundo')),
        ]),
      );
      // La lectura vuelve tambien con el disco fallando (vacia); se la espera
      // como en la tabla.
      for (let i = 0; i < 100000 && leido === null; i++) {
        await new Promise(r => setImmediate(r));
      }
      fallar = false;
      // Como en la tabla (con el reloj falso puesto antes del trabajo): lo que
      // quedo, tras correr todo temporizador pendiente y una hora y mil
      // vueltas despues de que el disco vuelve.
      await tiempoYVueltas();
      await unaHora();
      expect({
        avisos,
        esperaCompleta: centinela.corrio,
        lanzo,
        leido,
        nota: await AsyncStorage.getItem('@prep_release_pending'),
        claves: await claves(),
      }).toEqual({
        // CONTROL: fallo el disco, y cada paso se trago su falla (su aviso
        // esta; uno de mas no cambia lo que hace: R9-368)
        avisos: expect.arrayContaining([
          MIGRA,
          NOTA,
          'Failed to read prep notes',
        ]),
        esperaCompleta: true, // CONTROL: la espera corrio un temporizador de dos horas puesto en el trabajo
        lanzo: [],
        leido: [], // las claves se soltaron
        nota: '["bob"]',
        // La Mesa de Bob y su nota se quedan para el arranque siguiente, y la
        // migracion no se marco.
        claves: ['@prep_notes', '@prep_notes:bob', '@prep_release_pending'],
      });
    } finally {
      mocks.forEach((mock, i) => mock.mockImplementation(reales[i]));
      warn.mockRestore();
    }
  });

  // R9-383 — con el disco entero, la migracion falla en su primera lectura y
  // no llega a la mudanza. Aqui falla desde que leyo el dueno (no hay), con un
  // estado con cuenta: la nota y la union de la mudanza, que falla en su
  // primera lectura, asi que la marca no se intenta (R9-398). Un camino de
  // error de la mudanza fuera de su `try` (quitar la marca, o releerla, en su
  // `catch`) pasaba la tabla.
  it('R9-383: sin dueno registrado, con todo el disco fallando desde la lectura del dueno, ningun estado lanza, las claves se sueltan y la Mesa de antes se queda para el arranque siguiente', async () => {
    const todos = [
      'getItem',
      'multiGet',
      'setItem',
      'multiSet',
      'removeItem',
      'multiRemove',
      'mergeItem',
      'multiMerge',
      'getAllKeys',
      'clear',
    ] as const;
    const mocks = todos.map(m => AsyncStorage[m] as unknown as jest.Mock);
    const reales = mocks.map(m => m.getMockImplementation()!);
    let caido = false;
    mocks.forEach((mock, i) =>
      mock.mockImplementation(async (...args: unknown[]) => {
        if (caido) throw new Error('disco');
        const r = await reales[i](...args);
        // `getItem(k)` pasa por `multiGet([k])`: el dueno se lee entero.
        if (JSON.stringify(args).includes('@local_store_owner_uid')) {
          caido = true;
        }
        return r;
      }),
    );
    const avisos: string[] = [];
    const warn = jest
      .spyOn(logger, 'warn')
      .mockImplementation((mensaje, contexto) => {
        if (String(contexto?.error).includes('disco')) avisos.push(mensaje);
      });
    try {
      await conDevoluciones('bob');
      await AsyncStorage.setItem('@prep_notes', mesaDe(Ps));
      relojesFalsos();
      let leido: string[] | null = null;
      const lanzo: string[] = [];
      managePrepAccount();
      const espera = centinelaLargo();
      void pasajes().then(r => (leido = r));
      await esperarConReloj(
        Promise.all([
          setPrepAccount('ana').catch(() => lanzo.push('primero')),
          setPrepAccount('ana').catch(() => lanzo.push('segundo')),
        ]),
      );
      for (let i = 0; i < 100000 && leido === null; i++) {
        await new Promise(r => setImmediate(r));
      }
      caido = false;
      await tiempoYVueltas();
      await unaHora();
      expect({
        avisos,
        esperaCompleta: espera.corrio,
        lanzo,
        leido,
        nota: await AsyncStorage.getItem('@prep_release_pending'),
        claves: await claves(),
      }).toEqual({
        // CONTROL: fallo el disco desde la nota, y cada paso se trago su falla
        // (la mudanza tambien: llego)
        avisos: expect.arrayContaining([
          NOTA,
          MUEVE,
          'Failed to read prep notes',
        ]),
        esperaCompleta: true, // CONTROL: la espera corrio un temporizador de dos horas puesto en el trabajo
        lanzo: [],
        leido: [], // las claves se soltaron
        nota: '["bob"]',
        // La Mesa de antes, sin mover y sin marca, y la de Bob con su nota:
        // para el arranque siguiente.
        claves: ['@prep_notes', '@prep_notes:bob', '@prep_release_pending'],
      });
    } finally {
      mocks.forEach((mock, i) => mock.mockImplementation(reales[i]));
      warn.mockRestore();
    }
  });

  it('R9-275: una escritura de la Mesa pedida para la cuenta que se esta devolviendo va a la «sin cuenta», no bajo el uid borrado', async () => {
    const T = Date.now() - 60 * 60 * 1000;
    const P = 'John/3/16-21';
    const R = 'Ps/23/1-6';
    const ms = AsyncStorage.multiSet as unknown as jest.Mock;
    const real = ms.getMockImplementation()!;
    managePrepAccount();
    await setPrepAccount('ana');
    await savePrepNote(P, 'observation', 'de Ana', T);
    // La escritura de la devolucion (en la Mesa «sin cuenta») espera en una
    // puerta; mientras, con la sesion de Ana todavia, se piden dos escrituras:
    // otra seccion de P y un pasaje nuevo. Su turno va detras de la union.
    let abrir!: () => void;
    const puerta = new Promise<void>(r => (abrir = r));
    let abierta = false;
    let retenida = 0;
    ms.mockImplementation(async (pairs: Array<[string, string]>) => {
      if (!abierta && pairs.some(([k]) => k === '@prep_notes')) {
        retenida += 1;
        await puerta;
      }
      return real(pairs);
    });
    let escritas = 0;
    try {
      const devolucion = releasePrepAccount('ana');
      for (let i = 0; i < 20 && retenida === 0; i++) {
        await new Promise(r => setImmediate(r));
      }
      const tarde = Promise.all([
        savePrepNote(P, 'application', 'tarde', T + 1000),
        savePrepNote(R, 'observation', 'tarde', T + 2000),
      ]).then(() => {
        escritas = 2;
      });
      for (let i = 0; i < 20; i++) await new Promise(r => setImmediate(r));
      const antesDeAbrir = escritas;
      abierta = true;
      abrir();
      await devolucion;
      await tarde;
      await setPrepAccount(null);
      const sinCuenta = await getAllPrepNotes();
      // Sin R9-275, las dos escribian en la Mesa de Ana despues de su
      // devolucion: se quedaban bajo el uid borrado, que nadie vuelve a leer.
      // Ahora van a donde fue esa Mesa, y P conserva las dos secciones.
      expect({
        retenida, // CONTROL: la union espero en la puerta
        antesDeAbrir, // CONTROL: y las escrituras, detras de ella
        sinCuenta: Object.keys(sinCuenta).sort(),
        p: sinCuenta[P]?.sections,
        claves: await claves(),
      }).toEqual({
        retenida: 1,
        antesDeAbrir: 0,
        sinCuenta: [P, R],
        p: {observation: 'de Ana', application: 'tarde'},
        claves: ['@prep_by_account', '@prep_notes'],
      });
    } finally {
      abierta = true;
      abrir();
      ms.mockImplementation(real);
    }
  });

  // R9-323 — la Mesa cuenta como devuelta (`givenBack`) cuando la union de
  // la devolucion TERMINO, en su turno. Marcada antes (al anotarla, al pedir
  // el turno, aunque la union falle), una edicion va a la «sin cuenta» sobre
  // una entrada que ahi no esta, con el reloj mas nuevo, y la union
  // (`sourceGoes`: gana la mas nueva) pierde lo que la cuenta tenia de ella.
  it('R9-323: tras una devolucion que fallo, una edicion va a la clave de la cuenta, y el arranque siguiente devuelve las dos secciones', async () => {
    const T = Date.now() - 60 * 60 * 1000;
    const P = 'John/3/16-21';
    const ms = AsyncStorage.multiSet as unknown as jest.Mock;
    const real = ms.getMockImplementation()!;
    const leer = async (k: string) =>
      JSON.parse((await AsyncStorage.getItem(k)) ?? 'null');
    managePrepAccount();
    await setPrepAccount('ana');
    await savePrepNote(P, 'observation', 'de Ana', T);
    // La escritura de la union en la Mesa «sin cuenta» falla.
    const fallidas: string[][] = [];
    ms.mockImplementation(async (pairs: Array<[string, string]>) => {
      const sinCuenta = pairs.find(([k]) => k === '@prep_notes');
      if (sinCuenta) {
        fallidas.push(Object.keys(JSON.parse(sinCuenta[1])));
        throw new Error('disco');
      }
      return real(pairs);
    });
    try {
      await releasePrepAccount('ana');
    } finally {
      ms.mockImplementation(real);
    }
    const trasFallar = {
      fallidas, // CONTROL: fallo la union, con P
      nota: await leer('@prep_release_pending'), // CONTROL: y quedo anotada
      ana: (await leer('@prep_notes:ana'))?.[P]?.sections ?? null,
    };
    await savePrepNote(P, 'application', 'despues', T + 1000);
    const trasEditar = {
      ana: (await leer('@prep_notes:ana'))?.[P]?.sections ?? null,
      sinCuenta: await leer('@prep_notes'),
    };
    // El proceso siguiente, sin sesion.
    __resetPrepAccountForTests();
    managePrepAccount();
    await setPrepAccount(null);
    expect({
      trasFallar,
      trasEditar,
      final: (await getAllPrepNotes())[P]?.sections ?? null,
      claves: await claves(),
    }).toEqual({
      trasFallar: {
        fallidas: [[P]],
        nota: ['ana'],
        ana: {observation: 'de Ana'},
      },
      trasEditar: {
        ana: {observation: 'de Ana', application: 'despues'},
        sinCuenta: null,
      },
      final: {observation: 'de Ana', application: 'despues'},
      claves: ['@prep_by_account', '@prep_notes'],
    });
  });

  it('R9-323: una edicion en cola delante de la devolucion, cuyo turno llega despues de anotarla, va a la clave de la cuenta, y la union se la lleva entera', async () => {
    const T = Date.now() - 60 * 60 * 1000;
    const P = 'John/3/16-21';
    const ms = AsyncStorage.multiSet as unknown as jest.Mock;
    const real = ms.getMockImplementation()!;
    const vuelta = () => new Promise(r => setImmediate(r));
    managePrepAccount();
    await setPrepAccount('ana');
    await savePrepNote(P, 'observation', 'de Ana', T);
    // Otra escritura de la Mesa (de otro store) toma el turno y espera en una
    // puerta; detras pide el suyo la edicion de P, y despues la devolucion se
    // anota y pide el suyo.
    let abrir!: () => void;
    const puerta = new Promise<void>(r => (abrir = r));
    let tomada: string | null = null;
    let donde: string | null = null;
    let cuentaSinUnir: boolean | null = null;
    ms.mockImplementation(async (pairs: Array<[string, string]>) => {
      const edicion = pairs.find(([, v]) => v.includes('en cola'));
      if (edicion && donde === null) {
        donde = edicion[0];
        const deAna = await AsyncStorage.getItem('@prep_notes:ana');
        cuentaSinUnir = deAna?.includes('de Ana') ?? false;
      }
      return real(pairs);
    });
    try {
      const otra = prepWrite(prepKey('@prep_series'), async k => {
        tomada = k;
        await puerta;
      });
      for (let i = 0; i < 1000 && tomada === null; i++) await vuelta();
      const enCola = savePrepNote(P, 'application', 'en cola', T + 1000);
      for (
        let i = 0;
        i < 1000 && __prepTurnWaitingForTests('@prep_notes:ana') === 0;
        i++
      ) {
        await vuelta();
      }
      const devolucion = releasePrepAccount('ana');
      for (
        let i = 0;
        i < 1000 && __prepGiveBackWaitingForTests('ana') === 0;
        i++
      ) {
        await vuelta();
      }
      const antesDeAbrir = {
        tomada, // CONTROL: la otra tiene el turno
        nota: await AsyncStorage.getItem('@prep_release_pending'), // CONTROL: la devolucion ya se anoto
        devolucion: __prepGiveBackWaitingForTests('ana'), // CONTROL: y espera su turno
        enCola: __prepTurnWaitingForTests('@prep_notes:ana'), // CONTROL: la edicion, el suyo, delante
        donde, // CONTROL: sin escribir todavia
      };
      abrir();
      await Promise.all([otra, enCola, devolucion]);
      await setPrepAccount(null);
      // Con la devolucion marcada al anotarla, la edicion iba a la «sin
      // cuenta», donde P no estaba, y la union se quedaba con ella (mas
      // nueva): se perdia `observation`.
      expect({
        antesDeAbrir,
        cuentaSinUnir, // CONTROL: la edicion escribio antes de la union
        donde,
        p: (await getAllPrepNotes())[P]?.sections ?? null,
        claves: await claves(),
      }).toEqual({
        antesDeAbrir: {
          tomada: '@prep_series:ana',
          nota: '["ana"]',
          devolucion: 1,
          enCola: 1,
          donde: null,
        },
        cuentaSinUnir: true,
        donde: '@prep_notes:ana',
        p: {observation: 'de Ana', application: 'en cola'},
        claves: ['@prep_by_account', '@prep_notes'],
      });
    } finally {
      abrir();
      ms.mockImplementation(real);
    }
  });

  // R9-320 — el gancho de las escrituras (`__prepTurnWaitingForTests`) cuenta
  // las escrituras pedidas para la clave, no las uniones que la tocan: las
  // uniones piden su turno sin decir nada (ver `waiting`). Contada, una union de
  // la cuenta en la cola hacia salir la espera de una prueba antes de que SU
  // escritura pidiera el turno (la regla de la 88). Un caso por union que pide
  // turno sola: la de la migracion y la de la adopcion.
  it('R9-320: una union de la cuenta que espera turno no cuenta como una escritura de su clave', async () => {
    const P = 'John/3/16-21';
    const Q = 'Rom/8/28';
    const vuelta = () => new Promise(r => setImmediate(r));
    const mapa = (pasaje: string, de: string) =>
      JSON.stringify({[pasaje]: {sections: {observation: de}, updatedAt: 1}});
    const caso = async (union: 'migracion' | 'adopcion') => {
      __resetPrepAccountForTests();
      await AsyncStorage.clear();
      // Q, en la «sin cuenta»: la union la lleva a la Mesa de Ana.
      await AsyncStorage.setItem('@prep_notes', mapa(Q, 'sin cuenta'));
      if (union === 'migracion') {
        await AsyncStorage.setItem('@local_store_owner_uid', 'ana');
      } else {
        await AsyncStorage.setItem('@prep_by_account', '1');
        await AsyncStorage.setItem('@prep_notes:ana', mapa(P, 'de Ana'));
      }
      let abrir!: () => void;
      const puerta = new Promise<void>(r => (abrir = r));
      let soltarClave!: (k: string) => void;
      const clave = new Promise<string>(r => (soltarClave = r));
      try {
        relojesFalsos();
        managePrepAccount();
        if (union === 'adopcion') await esperarConReloj(setPrepAccount('ana'));
        // Otra escritura toma el turno y espera en una puerta; detras pide el
        // suyo la union; y la edicion de las notas de Ana lo pide cuando se
        // suelta su clave.
        let tomada: string | null = null;
        const otra = prepWrite(Promise.resolve('@prep_series:ana'), async k => {
          tomada = k;
          await puerta;
        });
        for (let i = 0; i < 1000 && tomada === null; i++) await vuelta();
        const unida =
          union === 'migracion'
            ? setPrepAccount(null)
            : adoptNoAccountPrep('ana');
        let leido: string[] | null = null;
        const edita = prepWrite(clave, async k => {
          const raw = await AsyncStorage.getItem(k);
          leido = Object.keys(raw ? JSON.parse(raw) : {}).sort();
        });
        // Lo ultimo antes de que la edicion pida, con la union ya en la cola:
        // una hora y mil vueltas (R9-317), y `leido` dice despues que la union
        // iba delante de la edicion.
        await unaHora();
        const sinPedir = __prepTurnWaitingForTests('@prep_notes:ana');
        soltarClave('@prep_notes:ana');
        for (
          let i = 0;
          i < 1000 && __prepTurnWaitingForTests('@prep_notes:ana') === 0;
          i++
        ) {
          await vuelta();
        }
        // Y otra hora con las dos en la cola: contando la union, la espera de
        // arriba salia con ella (la que llegaba tarde a la primera hora), y
        // aqui contaba dos.
        relojesFalsos();
        await unaHora();
        const pedida = __prepTurnWaitingForTests('@prep_notes:ana');
        abrir();
        await Promise.all([otra, unida, edita]);
        return {tomada, sinPedir, pedida, leido};
      } finally {
        abrir();
        soltarClave('@prep_notes:ana');
      }
    };
    // Con las uniones diciendo sus claves, `sinPedir` contaba la union.
    expect({
      migracion: await caso('migracion'),
      adopcion: await caso('adopcion'),
    }).toEqual({
      migracion: {
        tomada: '@prep_series:ana', // CONTROL: la otra tenia el turno
        sinPedir: 0,
        pedida: 1, // con la edicion pedida, solo ella
        leido: [Q], // CONTROL: la union iba delante: la edicion ya ve Q
      },
      adopcion: {
        tomada: '@prep_series:ana',
        sinPedir: 0,
        pedida: 1,
        leido: [P, Q],
      },
    });
  });

  // R9-325 — el desvio de R9-275 en los cuatro stores: cada uno lee y escribe
  // la clave que le da `prepWrite`, ya desviada. Solo las notas tenian prueba.
  it('R9-325: tras la devolucion, una escritura de cada store pedida con la clave de la cuenta va a la «sin cuenta», con lo devuelto', async () => {
    const T = Date.now() - 60 * 60 * 1000;
    const P = 'John/3/16-21';
    const R = 'Ps/23/1-6';
    const q = PREP_SELF_REVIEW_QUESTION_IDS[0];
    managePrepAccount();
    await setPrepAccount('ana');
    await savePrepNote(P, 'observation', 'de Ana', T);
    const s1 = await createPrepSeries('de Ana');
    const i1 = await createPrepIllustration();
    await setPrepSelfReviewQuestion(P, q, true, T);
    await releasePrepAccount('ana');
    // Con la sesion de Ana todavia (el estado nulo no llego): la clave pedida
    // es la de Ana, y la devolucion ya termino.
    const pedida = await prepKey('@prep_series');
    await savePrepNote(R, 'observation', 'tarde', T + 1000);
    const s2 = await createPrepSeries('tarde');
    const i2 = await createPrepIllustration();
    await setPrepSelfReviewQuestion(R, q, true, T + 1000);
    const trasEscribir = await claves();
    await setPrepAccount(null);
    // Un store sin el desvio dejaba su entrada bajo el uid borrado; uno que
    // leyera la clave de la cuenta y escribiera en la «sin cuenta», la
    // reemplazaba por un mapa con la entrada nueva sola.
    expect({
      pedida, // CONTROL: pedida con la clave de Ana
      trasEscribir,
      notas: Object.keys(await getAllPrepNotes()).sort(),
      series: Object.keys(await getAllPrepSeries()).sort(),
      ilustraciones: Object.keys(await getAllPrepIllustrations()).sort(),
      autoevaluacion: Object.keys(await getAllPrepSelfReview()).sort(),
    }).toEqual({
      pedida: '@prep_series:ana',
      trasEscribir: [
        '@prep_by_account',
        '@prep_illustrations',
        '@prep_notes',
        '@prep_self_review',
        '@prep_series',
      ],
      notas: [P, R],
      series: [s1!.id, s2!.id].sort(),
      ilustraciones: [i1!.id, i2!.id].sort(),
      autoevaluacion: [P, R],
    });
  });

  // R9-326 — el desvio mira la cuenta DE LA CLAVE («that account's»), no si se
  // devolvio alguna Mesa en el proceso.
  it('R9-326: tras devolver la Mesa de una cuenta, otra que entra en el mismo proceso escribe en la suya', async () => {
    const T = Date.now() - 60 * 60 * 1000;
    const P = 'John/3/16-21';
    const Q = 'Rom/8/28';
    managePrepAccount();
    await setPrepAccount('ana');
    await savePrepNote(P, 'observation', 'de Ana', T);
    await releasePrepAccount('ana');
    await setPrepAccount(null);
    const sinCuenta = await pasajes();
    await setPrepAccount('beto');
    await savePrepNote(Q, 'observation', 'de Beto', T + 1000);
    // Con «alguna devuelta», Q iba a la «sin cuenta»: Beto no veia lo que
    // acababa de escribir, y aparecia al salir, para cualquiera.
    expect({
      sinCuenta,
      deBeto: await pasajes(),
      claves: await claves(),
    }).toEqual({
      sinCuenta: [P], // CONTROL: la Mesa de Ana se devolvio
      deBeto: [Q],
      claves: ['@prep_by_account', '@prep_notes', '@prep_notes:beto'],
    });
  });

  // R9-328 — el respaldo escrito para una cuenta ya devuelta se anota ANTES de
  // escribirlo, y la nota se queda si su union falla: el arranque siguiente la
  // termina. R9-339 — lo restaurado se escribe bajo el uid borrado y se
  // devuelve en el mismo turno; si no llega a devolverse, lo devuelve el
  // arranque siguiente, salvo que haya fallado tambien la nota (R9-329: solo
  // se pierde el reintento).
  it('R9-328: si el proceso termina tras escribir el respaldo de una cuenta devuelta, el arranque siguiente lo devuelve', async () => {
    const T = Date.now() - 60 * 60 * 1000;
    const P = 'John/3/16-21';
    const R = 'Ps/23/1-6';
    const ms = AsyncStorage.multiSet as unknown as jest.Mock;
    const real = ms.getMockImplementation()!;
    managePrepAccount();
    await setPrepAccount('ana');
    await savePrepNote(P, 'observation', 'de Ana', T);
    await releasePrepAccount('ana');
    // La escritura del respaldo (con la clave de Ana, resuelta antes) llega al
    // disco, y el proceso termina ahi: no vuelve nunca.
    let escrito: string | null = null;
    ms.mockImplementation(async (pairs: Array<[string, string]>) => {
      const deAna = pairs.find(([k]) => k === '@prep_notes:ana');
      if (!deAna) return real(pairs);
      await real(pairs);
      escrito = deAna[1];
      return new Promise(() => {});
    });
    try {
      void prepMultiSet([
        [
          '@prep_notes:ana',
          JSON.stringify({
            [R]: {sections: {observation: 'del respaldo'}, updatedAt: T},
          }),
        ],
      ]);
      for (let i = 0; i < 1000 && escrito === null; i++) {
        await new Promise(r => setImmediate(r));
      }
    } finally {
      ms.mockImplementation(real);
    }
    const trasMorir = await claves();
    // El proceso siguiente, sin sesion.
    __resetPrepAccountForTests();
    managePrepAccount();
    await setPrepAccount(null);
    // Con la nota despues de escribir, no habia nota: R se quedaba bajo el uid
    // borrado.
    expect({
      escrito: Object.keys(JSON.parse(escrito ?? '{}')), // CONTROL: el respaldo llego al disco
      trasMorir,
      sinCuenta: await pasajes(),
      claves: await claves(),
    }).toEqual({
      escrito: [R],
      trasMorir: [
        '@prep_by_account',
        '@prep_notes',
        '@prep_notes:ana',
        '@prep_release_pending',
      ],
      sinCuenta: [P, R],
      claves: ['@prep_by_account', '@prep_notes'],
    });
  });

  it('R9-328: si falla la union del respaldo de una cuenta devuelta, la nota se queda y el arranque siguiente lo devuelve', async () => {
    const T = Date.now() - 60 * 60 * 1000;
    const P = 'John/3/16-21';
    const R = 'Ps/23/1-6';
    const ms = AsyncStorage.multiSet as unknown as jest.Mock;
    const real = ms.getMockImplementation()!;
    managePrepAccount();
    await setPrepAccount('ana');
    await savePrepNote(P, 'observation', 'de Ana', T);
    await releasePrepAccount('ana');
    // La union que devuelve lo restaurado (a la Mesa «sin cuenta») falla.
    const fallidas: string[][] = [];
    ms.mockImplementation(async (pairs: Array<[string, string]>) => {
      const sinCuenta = pairs.find(([k]) => k === '@prep_notes');
      if (!sinCuenta) return real(pairs);
      fallidas.push(Object.keys(JSON.parse(sinCuenta[1])).sort());
      throw new Error('disco');
    });
    try {
      await prepMultiSet([
        [
          '@prep_notes:ana',
          JSON.stringify({
            [R]: {sections: {observation: 'del respaldo'}, updatedAt: T},
          }),
        ],
      ]);
    } finally {
      ms.mockImplementation(real);
    }
    const trasFallar = await claves();
    // El proceso siguiente, sin sesion.
    __resetPrepAccountForTests();
    managePrepAccount();
    await setPrepAccount(null);
    // Con la nota quitada aunque la union fallara, R se quedaba bajo el uid
    // borrado.
    expect({
      fallidas, // CONTROL: fallo la union, con P y R
      trasFallar,
      sinCuenta: await pasajes(),
      claves: await claves(),
    }).toEqual({
      fallidas: [[P, R]],
      trasFallar: [
        '@prep_by_account',
        '@prep_notes',
        '@prep_notes:ana',
        '@prep_release_pending',
      ],
      sinCuenta: [P, R],
      claves: ['@prep_by_account', '@prep_notes'],
    });
  });

  // R9-329 — si la nota de la devolucion falla, la union se intenta igual:
  // sin nota, solo se pierde su reintento.
  it('R9-329: si falla la nota de la devolucion, la Mesa se devuelve igual', async () => {
    const P = 'John/3/16-21';
    const ms = AsyncStorage.multiSet as unknown as jest.Mock;
    const real = ms.getMockImplementation()!;
    managePrepAccount();
    await setPrepAccount('ana');
    await savePrepNote(P, 'observation', 'de Ana');
    const fallidas: string[][] = [];
    ms.mockImplementation(async (pairs: Array<[string, string]>) => {
      if (!pairs.some(([k]) => k === '@prep_release_pending')) {
        return real(pairs);
      }
      fallidas.push(pairs.map(([k, v]) => `${k}=${v}`));
      throw new Error('disco');
    });
    let lanzo = false;
    try {
      await releasePrepAccount('ana');
    } catch {
      lanzo = true;
    } finally {
      ms.mockImplementation(real);
    }
    // Con el error de la nota hacia arriba, la devolucion no corria y P se
    // quedaba bajo el uid borrado, sin nota que la terminara.
    expect({fallidas, lanzo, claves: await claves()}).toEqual({
      fallidas: [['@prep_release_pending=["ana"]']], // CONTROL: fallo la nota
      lanzo: false,
      claves: ['@prep_by_account', '@prep_notes'],
    });
  });

  // R9-298 — el respaldo mira las cuentas devueltas cuando le llega el turno,
  // no al pedirlo: una devolucion pedida antes que el respaldo corre antes.
  it('R9-298: un respaldo que pide su turno detras de la devolucion de su cuenta va con ella a la «sin cuenta»', async () => {
    const T = Date.now() - 60 * 60 * 1000;
    const P = 'John/3/16-21';
    const R = 'Ps/23/1-6';
    const vuelta = () => new Promise(r => setImmediate(r));
    managePrepAccount();
    await setPrepAccount('ana');
    await savePrepNote(P, 'observation', 'de Ana', T);
    // Otra escritura de la Mesa toma el turno y espera en una puerta; detras,
    // la devolucion de Ana; y detras, el respaldo, con la clave de Ana.
    let abrir!: () => void;
    const puerta = new Promise<void>(r => (abrir = r));
    let tomada: string | null = null;
    try {
      const otra = prepWrite(prepKey('@prep_series'), async k => {
        tomada = k;
        await puerta;
      });
      for (let i = 0; i < 1000 && tomada === null; i++) await vuelta();
      const devolucion = releasePrepAccount('ana');
      for (
        let i = 0;
        i < 1000 && __prepGiveBackWaitingForTests('ana') === 0;
        i++
      ) {
        await vuelta();
      }
      const pares: Array<[string, string]> = [
        [
          '@prep_notes:ana',
          JSON.stringify({
            [R]: {sections: {observation: 'del respaldo'}, updatedAt: T},
          }),
        ],
      ];
      const respaldo = prepMultiSet(pares);
      // R9-334 — la puerta se abre con ESTE respaldo ya en la cola: abierta en
      // la vuelta en que se lo llama, con su pedido una vuelta mas tarde la
      // devolucion ya habia terminado, y el caso no se armaba. R9-342 — el
      // gancho mira el pedido de esta llamada (sus `pares`), no los respaldos
      // de su clave: con otro respaldo de Ana ya en la cola, aun con los mismos
      // pares, la espera salia con el otro.
      const pidioEste = () => __prepThisRestoreWaitingForTests(pares);
      for (let i = 0; i < 1000 && !pidioEste(); i++) await vuelta();
      const pidio = pidioEste();
      const enCola = __prepGiveBackWaitingForTests('ana');
      abrir();
      await Promise.all([otra, devolucion, respaldo]);
      await setPrepAccount(null);
      // Mirando al pedir el turno, Ana todavia no estaba devuelta: R se
      // escribia bajo el uid borrado y no se devolvia.
      expect({
        tomada, // CONTROL: la otra tenia el turno
        pidio, // CONTROL: el respaldo esperaba el suyo
        enCola, // CONTROL: y la devolucion, delante, todavia el suyo
        sinCuenta: await pasajes(),
        claves: await claves(),
      }).toEqual({
        tomada: '@prep_series:ana',
        pidio: true,
        enCola: 1,
        sinCuenta: [P, R],
        claves: ['@prep_by_account', '@prep_notes'],
      });
    } finally {
      abrir();
    }
  });

  it('R9-269: volver a entrar no borra lo escrito sin sesion en el mismo pasaje (ni lo restaurado), y una escritura durante la union no se pierde', async () => {
    const T = Date.now() - 60 * 60 * 1000;
    const P = 'John/3/16-21';
    const secciones = async () => {
      const all = await getAllPrepNotes();
      return Object.fromEntries(
        Object.keys(all)
          .sort()
          .map(k => [k, all[k].sections]),
      );
    };
    managePrepAccount();
    await setPrepAccount('ana');
    await savePrepNote(P, 'observation', 'v1 de la cuenta', T + 1000);
    // Ana cierra sesion y sigue preparando el mismo pasaje.
    await setPrepAccount(null);
    await savePrepNote(P, 'observation', 'v2 sin cuenta', T + 2000);
    await savePrepNote(P, 'application', 'la conclusion', T + 3000);
    // Otro pasaje, solo sin cuenta: se mueve (y la union escribe).
    await savePrepNote('Eph/2/8', 'observation', 'se mueve', T + 3500);
    // Y restaura sin sesion un respaldo: va a la Mesa «sin cuenta».
    const restaurado = {
      'Rom/8/28': {sections: {observation: 'del respaldo'}, updatedAt: T},
    };
    const crudo = JSON.parse(
      (await AsyncStorage.getItem('@prep_notes')) ?? '{}',
    ) as Record<string, unknown>;
    await AsyncStorage.setItem(
      '@prep_notes',
      JSON.stringify({...crudo, ...restaurado}),
    );
    await setPrepAccount('ana');
    await savePrepNote('Rom/8/28', 'observation', 'de la cuenta', T + 4000);
    // Vuelve a entrar la misma cuenta: la union, con una escritura sin sesion
    // que cae entre sus lecturas y su escritura.
    const ms = AsyncStorage.multiSet as unknown as jest.Mock;
    const real = ms.getMockImplementation()!;
    let abrir!: () => void;
    const puerta = new Promise<void>(r => (abrir = r));
    ms.mockImplementation(async (pairs: Array<[string, string]>) => {
      if (pairs.some(([k]) => k.endsWith(':ana'))) await puerta;
      return real(pairs);
    });
    let antesDeAbrir = false;
    try {
      const union = adoptNoAccountPrep('ana');
      await new Promise(r => setImmediate(r));
      await setPrepAccount(null);
      let hecha = false;
      const durante = savePrepNote('Gal/2/20', 'observation', 'durante', T);
      void durante.then(() => (hecha = true));
      // Sin turnos, la escritura termina antes de abrir; con ellos, espera.
      for (let i = 0; i < 20 && !hecha; i++) {
        await new Promise(r => setImmediate(r));
      }
      antesDeAbrir = hecha;
      abrir();
      await union;
      await durante;
    } finally {
      abrir();
      ms.mockImplementation(real);
    }
    const sinCuenta = await secciones();
    await setPrepAccount('ana');
    // Sin R9-269, la union borraba la clave «sin cuenta» entera: el pasaje de
    // las dos Mesas perdia su version sin cuenta, y lo restaurado de Rom 8:28
    // tambien. Sin `prepWrite`, «durante» se iba con la clave.
    expect({antesDeAbrir, cuenta: await secciones(), sinCuenta}).toEqual({
      antesDeAbrir: false, // la escritura espera a la union
      cuenta: {
        'Eph/2/8': {observation: 'se mueve'},
        [P]: {observation: 'v1 de la cuenta'},
        'Rom/8/28': {observation: 'de la cuenta'},
      },
      sinCuenta: {
        'Gal/2/20': {observation: 'durante'},
        [P]: {observation: 'v2 sin cuenta', application: 'la conclusion'},
        'Rom/8/28': {observation: 'del respaldo'},
      },
    });
  });
});
