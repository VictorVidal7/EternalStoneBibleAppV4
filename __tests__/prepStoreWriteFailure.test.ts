/**
 * R9-52 — a failed write of the Mesa's notes (and of its self-review, and of
 * the banks: illustrations, series and sermon notes) used to be swallowed by
 * the store: the promise the caller got resolved, and the screen reported
 * success. The real stores, with `setItem` rejecting for
 * their key only: the caller's promise rejects, and the write queued after it
 * does not inherit the failure (it saves).
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getAllPrepNotes,
  savePrepNote,
} from '../src/features/study/prepNotesStore';
import {
  getAllPrepSelfReview,
  setPrepSelfReviewQuestion,
} from '../src/features/study/prepSelfReviewStore';
import {PREP_SELF_REVIEW_QUESTION_IDS} from '../src/features/study/prepSelfReview';
import * as I from '../src/features/study/prepIllustrationsStore';
import * as S from '../src/features/study/prepSeriesStore';
import * as N from '../src/features/study/sermonNotesStore';

const setItem = AsyncStorage.setItem as jest.Mock;
const real = setItem.getMockImplementation()!;

/** `setItem` rejects for `key` the next `times` calls; the rest, the real one. */
function failWritesOf(key: string, times: number) {
  let left = times;
  setItem.mockImplementation((k: string, v: string) => {
    if (k === key && left > 0) {
      left -= 1;
      return Promise.reject(new Error('disco lleno'));
    }
    return real(k, v);
  });
  return () => times - left;
}

beforeEach(async () => {
  setItem.mockImplementation(real);
  await AsyncStorage.clear();
});

afterAll(() => {
  setItem.mockImplementation(real);
});

describe('savePrepNote', () => {
  it('rejects when the write fails', async () => {
    const failed = failWritesOf('@prep_notes', 1);
    await expect(
      savePrepNote('John/3/16', 'observation', 'se pierde'),
    ).rejects.toThrow('disco lleno');
    expect(failed()).toBe(1);
    expect(await getAllPrepNotes()).toEqual({});
  });

  it('the write queued right after a failed one still saves', async () => {
    const failed = failWritesOf('@prep_notes', 1);
    // Both asked before either runs: the second waits behind the first.
    const first = savePrepNote('John/3/16', 'observation', 'se pierde');
    const second = savePrepNote('John/3/16', 'application', 'se guarda');
    await expect(first).rejects.toThrow('disco lleno');
    await expect(second).resolves.toBeUndefined();
    expect(failed()).toBe(1);
    const notes = await getAllPrepNotes();
    expect(notes['John/3/16']?.sections).toEqual({application: 'se guarda'});
  });
});

describe('setPrepSelfReviewQuestion', () => {
  const q = PREP_SELF_REVIEW_QUESTION_IDS[0];
  const q2 = PREP_SELF_REVIEW_QUESTION_IDS[1];

  it('rejects when the write fails', async () => {
    const failed = failWritesOf('@prep_self_review', 1);
    await expect(
      setPrepSelfReviewQuestion('John/3/16', q, true),
    ).rejects.toThrow('disco lleno');
    expect(failed()).toBe(1);
    expect(await getAllPrepSelfReview()).toEqual({});
  });

  it('the write queued right after a failed one still saves', async () => {
    const failed = failWritesOf('@prep_self_review', 1);
    const first = setPrepSelfReviewQuestion('John/3/16', q, true);
    const second = setPrepSelfReviewQuestion('John/3/16', q2, true);
    await expect(first).rejects.toThrow('disco lleno');
    await expect(second).resolves.toBeUndefined();
    expect(failed()).toBe(1);
    const all = await getAllPrepSelfReview();
    expect(all['John/3/16']?.checkedIds).toEqual({[q2]: true});
  });
});

// R9-52, the banks (S162). Their `mutate` already had this shape, but every
// write on top of it swallowed with `.catch(() => undefined)`, and the
// `create*` (and `addPrepSeriesPassage`) turned a failed write into `null`
// (`false`): the same answer as "full" or "already there". Now every one of
// them rejects; `null`/`false` keep meaning what they did.
describe('the banks (illustrations, series, sermon notes)', () => {
  type Case = [name: string, key: string, call: () => Promise<unknown>];

  async function seed() {
    const ilu = await I.createPrepIllustration();
    const ser = await S.createPrepSeries('Efesios', ['John/3/16']);
    const ses = await N.createSermonNoteSession('Domingo');
    return {ilu: ilu!.id, ser: ser!.id, ses: ses!.id};
  }

  function cases(ids: {ilu: string; ser: string; ses: string}): Case[] {
    const IL = '@prep_illustrations';
    const SE = '@prep_series';
    const SN = '@sermon_notes';
    return [
      ['createPrepIllustration', IL, () => I.createPrepIllustration()],
      [
        'savePrepIllustrationTitle',
        IL,
        () => I.savePrepIllustrationTitle(ids.ilu, 't'),
      ],
      [
        'savePrepIllustrationBody',
        IL,
        () => I.savePrepIllustrationBody(ids.ilu, 'b'),
      ],
      [
        'savePrepIllustrationCategory',
        IL,
        () => I.savePrepIllustrationCategory(ids.ilu, 'humor'),
      ],
      ['deletePrepIllustration', IL, () => I.deletePrepIllustration(ids.ilu)],
      ['createPrepSeries', SE, () => S.createPrepSeries('Romanos')],
      ['renamePrepSeries', SE, () => S.renamePrepSeries(ids.ser, 'X')],
      [
        'setPrepSeriesSermonType',
        SE,
        () => S.setPrepSeriesSermonType(ids.ser, 'tematica'),
      ],
      [
        'addPrepSeriesPassage',
        SE,
        () => S.addPrepSeriesPassage(ids.ser, 'Romans/8/28'),
      ],
      [
        'removePrepSeriesPassage',
        SE,
        () => S.removePrepSeriesPassage(ids.ser, 'John/3/16'),
      ],
      [
        'movePrepSeriesPassage',
        SE,
        () => S.movePrepSeriesPassage(ids.ser, 'John/3/16', 'down'),
      ],
      [
        'setPrepSeriesPassageDate',
        SE,
        () => S.setPrepSeriesPassageDate(ids.ser, 'John/3/16', '2026-12-06'),
      ],
      [
        'setPrepSeriesPassageNote',
        SE,
        () => S.setPrepSeriesPassageNote(ids.ser, 'John/3/16', 'nota'),
      ],
      ['deletePrepSeries', SE, () => S.deletePrepSeries(ids.ser)],
      ['createSermonNoteSession', SN, () => N.createSermonNoteSession('Otra')],
      [
        'saveSermonNoteSession',
        SN,
        () => N.saveSermonNoteSession(ids.ses, {bodyText: 'x'}),
      ],
      ['deleteSermonNoteSession', SN, () => N.deleteSermonNoteSession(ids.ses)],
    ];
  }

  const NAMES = cases({ilu: '', ser: '', ses: ''}).map(([name]) => name);

  it.each(NAMES)('%s rejects when the write fails', async name => {
    const ids = await seed();
    const [, key, call] = cases(ids).find(([n]) => n === name)!;
    const before = await AsyncStorage.getItem(key);
    const failed = failWritesOf(key, 1);
    await expect(call()).rejects.toThrow('disco lleno');
    // CONTROL: the write was attempted, and nothing changed.
    expect(failed()).toBe(1);
    expect(await AsyncStorage.getItem(key)).toBe(before);
  });

  it('the write queued right after a failed one still saves, in each bank', async () => {
    const ids = await seed();
    const failedI = failWritesOf('@prep_illustrations', 1);
    const i1 = I.savePrepIllustrationTitle(ids.ilu, 'se pierde');
    const i2 = I.savePrepIllustrationBody(ids.ilu, 'se guarda');
    await expect(i1).rejects.toThrow('disco lleno');
    await expect(i2).resolves.toBeUndefined();
    expect(failedI()).toBe(1);
    expect(await I.getPrepIllustration(ids.ilu)).toMatchObject({
      title: '',
      body: 'se guarda',
    });

    const failedS = failWritesOf('@prep_series', 1);
    const s1 = S.renamePrepSeries(ids.ser, 'se pierde');
    const s2 = S.addPrepSeriesPassage(ids.ser, 'Romans/8/28');
    await expect(s1).rejects.toThrow('disco lleno');
    await expect(s2).resolves.toBe(true);
    expect(failedS()).toBe(1);
    expect(await S.getPrepSeries(ids.ser)).toMatchObject({
      name: 'Efesios',
      passageKeys: ['John/3/16', 'Romans/8/28'],
    });

    const failedN = failWritesOf('@sermon_notes', 1);
    const n1 = N.saveSermonNoteSession(ids.ses, {title: 'se pierde'});
    const n2 = N.saveSermonNoteSession(ids.ses, {bodyText: 'se guarda'});
    await expect(n1).rejects.toThrow('disco lleno');
    await expect(n2).resolves.toBeUndefined();
    expect(failedN()).toBe(1);
    expect(await N.getSermonNote(ids.ses)).toMatchObject({
      title: 'Domingo',
      bodyText: 'se guarda',
    });
  });

  it('`null` and `false` still mean "blank/full" and "already there", not "not saved"', async () => {
    const ids = await seed();
    await expect(S.createPrepSeries('   ')).resolves.toBeNull();
    await expect(N.createSermonNoteSession('   ')).resolves.toBeNull();
    await expect(S.addPrepSeriesPassage(ids.ser, 'John/3/16')).resolves.toBe(
      false,
    );
  });
});
