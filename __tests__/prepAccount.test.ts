/**
 * R9-59 — la Mesa de preparacion, por cuenta (decidido por Victor el
 * 2026-10-03). Los stores reales y AsyncStorage real; la cuenta la dice
 * `setPrepAccount`, como hace `AuthProvider`.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  __resetPrepAccountForTests,
  adoptNoAccountPrep,
  managePrepAccount,
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

const claves = async () =>
  (await AsyncStorage.getAllKeys()).filter(k => k.startsWith('@prep')).sort();
const pasajes = async () => Object.keys(await getAllPrepNotes()).sort();

beforeEach(async () => {
  __resetPrepAccountForTests();
  await AsyncStorage.clear();
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

  it('una escritura va a la cuenta de cuando se pidio, aunque se cambie de cuenta antes de que corra', async () => {
    managePrepAccount();
    await setPrepAccount('ana');
    const s = savePrepNote('Rom/8/28', 'observation', 'de Ana');
    void setPrepAccount('beto');
    await s;
    expect(await claves()).toEqual(['@prep_by_account', '@prep_notes:ana']);
  });

  it('las claves esperan al primer estado de auth', async () => {
    managePrepAccount();
    let leido: string[] | null = null;
    const p = pasajes().then(r => (leido = r));
    await new Promise(r => setTimeout(r, 0));
    const antes = leido;
    await setPrepAccount('ana');
    await p;
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
