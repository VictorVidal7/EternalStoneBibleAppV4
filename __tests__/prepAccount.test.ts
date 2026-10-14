/**
 * R9-59 — la Mesa de preparacion, por cuenta (decidido por Victor el
 * 2026-10-03). Los stores reales y AsyncStorage real; la cuenta la dice
 * `setPrepAccount`, como hace `AuthProvider`.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  __prepGiveBackWaitingForTests,
  __prepRestoreWaitingForTests,
  __prepTurnWaitingForTests,
  __resetPrepAccountForTests,
  adoptNoAccountPrep,
  managePrepAccount,
  prepKey,
  prepMultiSet,
  prepWrite,
  releasePrepAccount,
  setPrepAccount,
} from '../src/features/study/prepAccount';
import {
  getAllPrepNotes,
  savePrepNote,
} from '../src/features/study/prepNotesStore';
import {
  createPrepSeries,
  getAllPrepSeries,
} from '../src/features/study/prepSeriesStore';
import {
  createPrepIllustration,
  getAllPrepIllustrations,
} from '../src/features/study/prepIllustrationsStore';
import {
  getAllPrepSelfReview,
  setPrepSelfReviewQuestion,
} from '../src/features/study/prepSelfReviewStore';
import {PREP_SELF_REVIEW_QUESTION_IDS} from '../src/features/study/prepSelfReview';

const claves = async () =>
  (await AsyncStorage.getAllKeys()).filter(k => k.startsWith('@prep')).sort();
const pasajes = async () => Object.keys(await getAllPrepNotes()).sort();

beforeEach(async () => {
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

// Los relojes reales vuelven tambien si una prueba cae con los falsos puestos.
afterEach(() => {
  jest.useRealTimers();
});

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
      ms.mockImplementation(async (pairs: Array<[string, string]>) => {
        if (pairs.some(([k]) => k === '@prep_notes')) {
          if (como === 'falla') throw new Error('disco');
          return new Promise(() => {});
        }
        return real(pairs);
      });
      try {
        if (como === 'falla') await releasePrepAccount('ana');
        if (como === 'termina') void releasePrepAccount('ana');
        for (let i = 0; i < 10; i++) await new Promise(r => setImmediate(r));
      } finally {
        ms.mockImplementation(real);
      }
      // El proceso siguiente, sin sesion.
      __resetPrepAccountForTests();
      managePrepAccount();
      await setPrepAccount(null);
      return {sinCuenta: await pasajes(), claves: await claves()};
    };
    const devuelta = {
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
    const gi = AsyncStorage.getItem as unknown as jest.Mock;
    const realGi = gi.getMockImplementation()!;
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
      gi.mockImplementation(async (k: string, cb?: unknown) => {
        if (k === '@prep_by_account' && migracionRetenida === null) {
          migracionRetenida = k;
          await puerta;
        }
        return realGi(k, cb);
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
      gi.mockImplementation(realGi);
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
      gi.mockImplementation(realGi);
    }
  });

  // R9-337 — con DOS estados durante el trabajo del primero (se entra y se
  // sale), lo pedido antes va a la cuenta de cuando termina, la del ultimo:
  // con la del primero que llego mientras tanto, iba a la Mesa de una cuenta
  // que ya habia salido.
  it('R9-337: con nulo, una cuenta y nulo durante el trabajo del primer estado, lo pedido antes va a la cuenta del ultimo', async () => {
    const P = 'John/3/16-21';
    const vuelta = () => new Promise(r => setImmediate(r));
    const gi = AsyncStorage.getItem as unknown as jest.Mock;
    const realGi = gi.getMockImplementation()!;
    let abrir!: () => void;
    const puerta = new Promise<void>(r => (abrir = r));
    // La migracion del primer estado espera en su primera lectura.
    let migracionRetenida: string | null = null;
    gi.mockImplementation(async (k: string, cb?: unknown) => {
      if (k === '@prep_by_account' && migracionRetenida === null) {
        migracionRetenida = k;
        await puerta;
      }
      return realGi(k, cb);
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
      const tercero = setPrepAccount(null);
      await unaHora();
      const escritaAntesDeAbrir = escrita;
      abrir();
      await Promise.all([primero, segundo, tercero, edita]);
      gi.mockImplementation(realGi);
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
      gi.mockImplementation(realGi);
    }
  });

  // R9-336 — todo estado espera el trabajo del primero (R9-331), asi que ese
  // trabajo no puede rechazar: cada paso se traga su falla. Un caso por paso
  // (la migracion, la lectura de la nota, la devolucion pendiente): si su falla
  // saliera, los dos estados lanzarian y la lectura no volveria nunca.
  const primerEstadoConFalla = async (
    metodo: 'getItem' | 'multiSet',
    clave: string,
  ) => {
    await AsyncStorage.setItem(
      '@prep_notes',
      JSON.stringify({
        'Ps/23/1-6': {sections: {observation: 'sin cuenta'}, updatedAt: 1},
      }),
    );
    const vuelta = () => new Promise(r => setImmediate(r));
    const mock = AsyncStorage[metodo] as unknown as jest.Mock;
    const real = mock.getMockImplementation()!;
    let fallo = 0;
    // La primera llamada que toca `clave` lanza.
    mock.mockImplementation(async (arg: unknown, cb?: unknown) => {
      const toca =
        metodo === 'getItem'
          ? arg === clave
          : (arg as Array<[string, string]>).some(([k]) => k === clave);
      if (toca && fallo === 0) {
        fallo += 1;
        throw new Error('disco');
      }
      return real(arg, cb);
    });
    try {
      managePrepAccount();
      let leido: string[] | null = null;
      void pasajes().then(r => (leido = r));
      const lanzo: string[] = [];
      // Los dos terminan tambien si lanzan; la lectura, no: se la espera a lo
      // sumo cien mil vueltas (con mil, una lectura mil vueltas mas lenta daba
      // `leido: null` sin que nadie lanzara, el rojo del dano).
      await Promise.all([
        setPrepAccount(null).catch(() => lanzo.push('primero')),
        setPrepAccount(null).catch(() => lanzo.push('segundo')),
      ]);
      for (let i = 0; i < 100000 && leido === null; i++) await vuelta();
      return {fallo, lanzo, leido};
    } finally {
      mock.mockImplementation(real);
    }
  };

  it('R9-336: si falla la migracion en el primer estado de auth, ningun estado lanza y las claves se sueltan', async () => {
    expect(await primerEstadoConFalla('getItem', '@prep_by_account')).toEqual({
      fallo: 1, // CONTROL: fallo la primera lectura de la migracion
      lanzo: [],
      leido: ['Ps/23/1-6'],
    });
  });

  it('R9-336: si falla la lectura de la nota de devoluciones en el primer estado de auth, ningun estado lanza y las claves se sueltan', async () => {
    expect(
      await primerEstadoConFalla('getItem', '@prep_release_pending'),
    ).toEqual({
      fallo: 1, // CONTROL: fallo la lectura de la nota
      lanzo: [],
      leido: ['Ps/23/1-6'],
    });
  });

  it('R9-336: si falla la devolucion pendiente en el primer estado de auth, ningun estado lanza, las claves se sueltan y la nota se queda', async () => {
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
    expect({
      ...(await primerEstadoConFalla('multiSet', '@prep_notes')),
      nota: await AsyncStorage.getItem('@prep_release_pending'),
    }).toEqual({
      fallo: 1, // CONTROL: fallo la union de la devolucion
      lanzo: [],
      leido: ['Ps/23/1-6'],
      nota: '["bob"]', // CONTROL: y la termina el arranque siguiente
    });
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
      const respaldo = prepMultiSet([
        [
          '@prep_notes:ana',
          JSON.stringify({
            [R]: {sections: {observation: 'del respaldo'}, updatedAt: T},
          }),
        ],
      ]);
      // R9-334 — la puerta se abre con ESTE respaldo ya en la cola (el gancho
      // mira sus claves: otro respaldo no cuenta): abierta en la vuelta en que
      // se lo llama, con su pedido una vuelta mas tarde la devolucion ya habia
      // terminado, y el caso no se armaba.
      const pidioElDeAna = () =>
        __prepRestoreWaitingForTests('@prep_notes:ana');
      for (let i = 0; i < 1000 && pidioElDeAna() === 0; i++) await vuelta();
      const pidio = pidioElDeAna();
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
        pidio: 1,
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
