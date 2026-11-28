/**
 * R9-470 — un respaldo con la clave `__proto__` en el progreso de lectura
 * escribía en `Object.prototype` durante toda la sesión.
 *
 * `canonicalizeProgressMap` toma cada clave del mapa como un libro y hacía
 * `out[key] ??= {}`: con `"__proto__"` eso devuelve `Object.prototype`, y el
 * `target[chapter] = pct` siguiente escribe en el prototipo de TODOS los
 * objetos. No es solo esa clave: cualquier nombre heredado resuelve igual
 * (`"constructor"` da la función `Object`; `"toString"`, la de todos).
 *
 * Camino: Ajustes → importar un `.json` con
 * `bible.chapterProgressMap = {"__proto__": {...}}` (fabricado o editado).
 *
 * `importBackup` real desde el TEXTO del archivo: tras `JSON.parse`,
 * `"__proto__"` es una propiedad propia, que es como llega de un archivo.
 * Cada caso limpia lo que la versión sin arreglo deja en los prototipos: sin
 * eso, una corrida en rojo rompería a jest y no diría por qué.
 */
jest.mock('../src/lib/database', () => {
  const instance = {
    initialize: jest.fn().mockResolvedValue(undefined),
    foldVerseNotesInTransaction: jest.fn(async () => ({
      written: [],
      removedIds: [],
    })),
    getDatabase: jest.fn().mockResolvedValue({
      withTransactionAsync: async (fn: () => Promise<void>) => fn(),
    }),
    executeSql: jest.fn(async () => ({rows: {_array: [], length: 0}})),
  };
  return {
    __esModule: true,
    default: instance,
    bibleDB: instance,
    BibleDatabase: jest.fn(),
  };
});
jest.mock('../src/lib/achievements/AchievementService', () => {
  const instance = {
    initialize: jest.fn().mockResolvedValue(undefined),
    restoreBackup: jest.fn().mockResolvedValue(undefined),
  };
  return {AchievementService: jest.fn().mockImplementation(() => instance)};
});
jest.mock('../src/lib/sync', () => ({
  ...jest.requireActual('../src/lib/sync'),
  getSyncEngine: () => null,
}));

import AsyncStorage from '@react-native-async-storage/async-storage';
import {setAchievementServiceInstance} from '../src/lib/achievements/instance';
import {__resetBackupRestoredListenersForTests} from '../src/lib/backup/restoreSignal';
import {__resetPrepAccountForTests} from '../src/features/study/prepAccount';
import {canonicalizeProgressMap} from '../src/lib/progress/progressKeys';
import {
  importBackup,
  parseBackupPayload,
  BACKUP_FORMAT_VERSION,
} from '../src/services/BackupService';

/** The chapter key the fabricated files carry: nothing else uses this name. */
const MARK = 'r470capitulo';

type Bag = Record<string, unknown>;
const originalHasOwnProperty = Object.prototype.hasOwnProperty;
const originalToString = Object.prototype.toString;

/** Everything the unfixed function leaves behind, put back. */
function clean() {
  Object.defineProperty(Object.prototype, 'hasOwnProperty', {
    value: originalHasOwnProperty,
    writable: true,
    configurable: true,
    enumerable: false,
  });
  delete (Object.prototype as unknown as Bag)[MARK];
  delete (Object as unknown as Bag)[MARK];
  delete (originalToString as unknown as Bag)[MARK];
}

/** A backup file's text with this `chapterProgressMap` (raw JSON text). */
function fileWith(chapterProgressMapJson: string): string {
  return (
    `{"formatVersion":${BACKUP_FORMAT_VERSION},` +
    '"generatedAt":"2026-01-01T00:00:00.000Z",' +
    '"app":{"name":"Eternal Stone Bible","package":"com.eternalstonebible.app"},' +
    `"bible":{"chapterProgressMap":${chapterProgressMapJson}}}`
  );
}

beforeEach(async () => {
  clean();
  await AsyncStorage.clear();
  __resetBackupRestoredListenersForTests();
  __resetPrepAccountForTests();
  setAchievementServiceInstance(null);
});
afterEach(clean);

describe('R9-470 — a book key every object inherits never reaches a prototype', () => {
  it('CONTROL: an ordinary map goes through untouched', () => {
    const out = canonicalizeProgressMap(JSON.parse('{"Juan":{"3":100}}'));

    expect(out).toEqual({John: {'3': 100}});
    expect(({} as Bag)[MARK]).toBeUndefined();
  });

  it('«__proto__» as a book: no object gains its chapters, and the real books stay', () => {
    const out = canonicalizeProgressMap(
      JSON.parse(`{"__proto__":{"${MARK}":7},"John":{"3":100}}`),
    );
    // Read BEFORE any matcher runs: a polluted prototype breaks jest itself.
    const onAnyObject = ({} as Bag)[MARK];
    const onAnyArray = ([] as unknown as Bag)[MARK];
    const keysOfAFreshObject: string[] = [];
    for (const k in {a: 1}) keysOfAFreshObject.push(k);
    clean();

    expect(onAnyObject).toBeUndefined();
    expect(onAnyArray).toBeUndefined();
    expect(keysOfAFreshObject).toEqual(['a']);
    expect(out).toEqual({John: {'3': 100}});
    expect(Object.keys(out)).toEqual(['John']);
  });

  it.each(['constructor', 'toString', 'hasOwnProperty'])(
    '«%s» as a book: the shared function it names gains nothing',
    name => {
      const shared = ({} as Bag)[name];
      const out = canonicalizeProgressMap(
        JSON.parse(`{"${name}":{"${MARK}":7},"John":{"3":100}}`),
      );
      const leaked = (shared as unknown as Bag)[MARK];
      clean();

      expect(leaked).toBeUndefined();
      expect(out).toEqual({John: {'3': 100}});
      expect(Object.keys(out)).toEqual(['John']);
    },
  );

  it('inherited names as CHAPTER keys are dropped too, not merged with a function', () => {
    const out = canonicalizeProgressMap(
      JSON.parse('{"John":{"constructor":50,"__proto__":60,"3":100}}'),
    );

    expect(Object.keys(out.John)).toEqual(['3']);
    expect(out).toEqual({John: {'3': 100}});
  });
});

describe('R9-470 — importing a backup file that carries the key', () => {
  it('the real import leaves the prototype alone and restores the real books', async () => {
    const payload = parseBackupPayload(
      fileWith(`{"__proto__":{"${MARK}":42},"John":{"3":100}}`),
    );

    const result = await importBackup(payload);
    const onAnyObject = ({} as Bag)[MARK];
    clean();

    expect(onAnyObject).toBeUndefined();
    expect(result.restoredSections).toContain('chapterProgressMap');
    expect(await AsyncStorage.getItem('readingProgress')).toBe(
      '{"John":{"3":100}}',
    );
  });

  it('the damage it did: «hasOwnProperty» is still a function for every object afterwards', async () => {
    const payload = parseBackupPayload(
      fileWith('{"__proto__":{"hasOwnProperty":1},"John":{"3":100}}'),
    );

    await importBackup(payload);
    const seen = typeof ({a: 1} as Bag).hasOwnProperty;
    let error = '';
    try {
      // The call THROUGH an object is the point: it is what broke app-wide.
      // eslint-disable-next-line no-prototype-builtins
      ({a: 1}).hasOwnProperty('a');
    } catch (e) {
      error = String((e as Error).message);
    }
    // Restored BEFORE the expects: jest's own matchers call hasOwnProperty.
    clean();

    expect(seen).toBe('function');
    expect(error).toBe('');
  });
});
