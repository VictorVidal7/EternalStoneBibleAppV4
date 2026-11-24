/**
 * R9-30, tanda 2 — the Banco de ilustraciones (`@prep_illustrations`) and the
 * autorrevisión (`@prep_self_review`) travel in the backup, in the `prep`
 * section, by account (`prepKey`) and in the Mesa's turn (`prepMultiSet`), as
 * `@prep_notes` already did. Neither has a cloud copy: before this, a new
 * phone got the notes and lost the bank.
 *
 * Lo REAL: buildBackup/importBackup, the two stores (their `prepKey` and
 * `prepWrite`), `prepAccount` with two accounts, over the AsyncStorage mock.
 * Lo sustituido: SQLite and the achievements (as in backupKeyCoverage).
 */
jest.mock('../src/lib/database', () => {
  const instance = {
    initialize: jest.fn().mockResolvedValue(undefined),
    // R9-51 — the import folds the notes it wrote (none here).
    foldVerseNotesInTransaction: jest.fn(async () => ({
      written: [],
      removedIds: [],
    })),
    getDatabase: jest.fn().mockResolvedValue({
      withTransactionAsync: async (fn: () => Promise<void>) => fn(),
      execAsync: jest.fn().mockResolvedValue(undefined),
      runAsync: jest.fn().mockResolvedValue(undefined),
      getAllAsync: jest.fn().mockResolvedValue([]),
    }),
    executeSql: jest.fn(async () => ({rows: {_array: [], length: 0}})),
    getFavorites: jest.fn().mockResolvedValue([]),
    getNotes: jest.fn().mockResolvedValue([]),
    getReadingProgress: jest.fn().mockResolvedValue(null),
  };
  return {__esModule: true, default: instance, bibleDB: instance};
});

import AsyncStorage from '@react-native-async-storage/async-storage';
import type {AchievementService} from '../src/lib/achievements/AchievementService';
import {setAchievementServiceInstance} from '../src/lib/achievements/instance';
import {buildBackup, importBackup} from '../src/services/BackupService';
import {
  __resetPrepAccountForTests,
  managePrepAccount,
  setPrepAccount,
} from '../src/features/study/prepAccount';
import {
  createPrepIllustration,
  getAllPrepIllustrations,
  savePrepIllustrationBody,
  savePrepIllustrationTitle,
} from '../src/features/study/prepIllustrationsStore';
import {
  getAllPrepSelfReview,
  setPrepSelfReviewQuestion,
} from '../src/features/study/prepSelfReviewStore';

const ILL = '@prep_illustrations';
const REV = '@prep_self_review';

/** Beto's own bank and checklist, on the same phone. */
const BETO_ILL = JSON.stringify({
  b1: {
    id: 'b1',
    title: 'de Beto',
    body: 'su cuerpo',
    category: 'testimony',
    createdAt: 1,
    updatedAt: 1,
  },
});
const BETO_REV = JSON.stringify({
  'Ps/23/1-6': {checkedIds: {oneMovement: true}, updatedAt: 1},
});

async function signIn(uid: string | null) {
  await setPrepAccount(uid);
}

/** Ana writes through the real stores; returns her illustration's id. */
async function anaWrites(): Promise<string> {
  const created = await createPrepIllustration('quote');
  if (!created) throw new Error('no illustration');
  await savePrepIllustrationTitle(created.id, 'El reloj');
  await savePrepIllustrationBody(created.id, 'de Ana');
  await setPrepSelfReviewQuestion('Rom/8/28', 'oneMovement', true, 5);
  await setPrepSelfReviewQuestion('Rom/8/28', 'bigIdeaOneSentence', true, 6);
  return created.id;
}

const titles = (map: Record<string, {title: string}>) =>
  Object.values(map)
    .map(i => i.title)
    .sort();

beforeEach(async () => {
  await AsyncStorage.clear();
  __resetPrepAccountForTests();
  managePrepAccount();
  setAchievementServiceInstance({
    initialize: jest.fn().mockResolvedValue(undefined),
    getRawUserStats: jest.fn().mockResolvedValue({}),
    getAllAchievements: jest.fn().mockResolvedValue([]),
    getReadingLog: jest.fn().mockResolvedValue([]),
    getCompletedBooks: jest.fn().mockResolvedValue([]),
    getBookReadingLog: jest.fn().mockResolvedValue([]),
    getChaptersReadLog: jest.fn().mockResolvedValue([]),
    restoreBackup: jest.fn().mockResolvedValue(undefined),
  } as unknown as AchievementService);
});

afterAll(() => {
  setAchievementServiceInstance(null);
  __resetPrepAccountForTests();
});

it('R9-30 — a round trip carries Ana’s bank and checklist, and not Beto’s', async () => {
  await AsyncStorage.multiSet([
    [`${ILL}:beto`, BETO_ILL],
    [`${REV}:beto`, BETO_REV],
  ]);
  await signIn('ana');
  const id = await anaWrites();

  const {payload} = await buildBackup();
  const file = JSON.parse(JSON.stringify(payload));

  // A fresh phone, Ana signed in: what she reads through the stores.
  await AsyncStorage.clear();
  __resetPrepAccountForTests();
  managePrepAccount();
  await signIn('ana');
  const result = await importBackup(file);
  const ill = await getAllPrepIllustrations();
  const rev = await getAllPrepSelfReview();

  expect({
    exportadas: titles(file.prep.illustrations ?? {}),
    revisadas: Object.keys(file.prep.selfReview ?? {}),
    titulo: ill[id]?.title,
    cuerpo: ill[id]?.body,
    categoria: ill[id]?.category,
    checks: Object.keys(rev['Rom/8/28']?.checkedIds ?? {}).sort(),
    deBeto: await AsyncStorage.multiGet([`${ILL}:beto`, `${REV}:beto`]),
    sinCuenta: await AsyncStorage.multiGet([ILL, REV]),
    fallidas: result.failedSections,
  }).toEqual({
    exportadas: ['El reloj'],
    revisadas: ['Rom/8/28'],
    titulo: 'El reloj',
    cuerpo: 'de Ana',
    categoria: 'quote',
    checks: ['bigIdeaOneSentence', 'oneMovement'],
    deBeto: [
      [`${ILL}:beto`, null],
      [`${REV}:beto`, null],
    ],
    sinCuenta: [
      [ILL, null],
      [REV, null],
    ],
    fallidas: [],
  });
  expect(result.restoredSections).toEqual(
    expect.arrayContaining(['prepIllustrations', 'prepSelfReview']),
  );
});

it('R9-30 — opened by Beto, it lands in Beto’s Mesa and leaves Ana’s alone', async () => {
  await signIn('ana');
  await anaWrites();
  const {payload} = await buildBackup();
  const file = JSON.parse(JSON.stringify(payload));
  const anaIll = await AsyncStorage.getItem(`${ILL}:ana`);
  const anaRev = await AsyncStorage.getItem(`${REV}:ana`);

  await signIn('beto');
  await importBackup(file);

  expect({
    beto: titles(await getAllPrepIllustrations()),
    betoRev: Object.keys(await getAllPrepSelfReview()),
    ana: await AsyncStorage.getItem(`${ILL}:ana`),
    anaRev: await AsyncStorage.getItem(`${REV}:ana`),
  }).toEqual({
    beto: ['El reloj'],
    betoRev: ['Rom/8/28'],
    ana: anaIll,
    anaRev,
  });
});

it('R9-30 — a write after the restore edits the restored bank and checklist', async () => {
  await signIn('ana');
  const id = await anaWrites();
  const {payload} = await buildBackup();
  const file = JSON.parse(JSON.stringify(payload));
  // Written after the export: the restore replaces the Mesa, so it goes.
  const pre = await createPrepIllustration();
  if (pre) await savePrepIllustrationTitle(pre.id, 'PRE');
  await setPrepSelfReviewQuestion('Ps/1/1', 'oneMovement', true, 6);

  await importBackup(file);
  // The next edits re-read the disk: they do not write a pre-import copy.
  const otra = await createPrepIllustration();
  await setPrepSelfReviewQuestion('Jn/3/16', 'oneMovement', true, 7);
  const ill = await getAllPrepIllustrations();
  const rev = await getAllPrepSelfReview();

  expect({
    restaurada: ill[id]?.title,
    nueva: otra ? Boolean(ill[otra.id]) : false,
    titulos: titles(ill),
    revisadas: Object.keys(rev).sort(),
  }).toEqual({
    restaurada: 'El reloj',
    nueva: true,
    titulos: ['', 'El reloj'],
    revisadas: ['Jn/3/16', 'Rom/8/28'],
  });
});

it('R9-30 — a file without the two fields (older build) leaves both alone', async () => {
  await signIn('ana');
  await anaWrites();
  const {payload} = await buildBackup();
  const file = JSON.parse(JSON.stringify(payload));
  delete file.prep.illustrations;
  delete file.prep.selfReview;
  const before = await AsyncStorage.multiGet([`${ILL}:ana`, `${REV}:ana`]);

  const result = await importBackup(file);

  expect(await AsyncStorage.multiGet([`${ILL}:ana`, `${REV}:ana`])).toEqual(
    before,
  );
  expect(before.every(([, v]) => v && v !== '{}')).toBe(true);
  expect(result.restoredSections).not.toContain('prepIllustrations');
  expect(result.restoredSections).not.toContain('prepSelfReview');
});

it('R9-30 — a field the export could not read is left alone, and reported', async () => {
  await signIn('ana');
  await anaWrites();
  const {payload} = await buildBackup();
  const file = JSON.parse(JSON.stringify(payload));
  file.prep.illustrations = null;
  file.prep.selfReview = null;
  file.meta.degradedSections.push('prepIllustrations', 'prepSelfReview');
  const before = await AsyncStorage.multiGet([`${ILL}:ana`, `${REV}:ana`]);

  const result = await importBackup(file);

  expect(await AsyncStorage.multiGet([`${ILL}:ana`, `${REV}:ana`])).toEqual(
    before,
  );
  expect(result.failedSections).toEqual(
    expect.arrayContaining(['prepIllustrations', 'prepSelfReview']),
  );
});
