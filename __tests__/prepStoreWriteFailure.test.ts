/**
 * R9-52 — a failed write of the Mesa's notes (and of its self-review) used to
 * be swallowed by the store's queue: the promise the caller got resolved, and
 * the screen reported success. The real stores, with `setItem` rejecting for
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
