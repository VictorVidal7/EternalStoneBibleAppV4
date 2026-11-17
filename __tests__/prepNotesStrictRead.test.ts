/**
 * R9-600 — a failed read of the Mesa's notes came back as "no notes", and a
 * caller that wrote on top of what it read saved its text alone over the
 * section. `strict: true` rethrows; the default (screens that only show the
 * notes) stays tolerant. And the read `savePrepNote` does INSIDE its turn:
 * when it fails, the write rejects without saving an empty map over the disk.
 * The real store, with `getItem` rejecting for `@prep_notes` only.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getAllPrepNotes,
  getPrepNotes,
  savePrepNote,
} from '../src/features/study/prepNotesStore';

const getItem = AsyncStorage.getItem as jest.Mock;
const real = getItem.getMockImplementation()!;

/** `getItem` rejects for `key` the next `times` calls; the rest, the real one. */
function failReadsOf(key: string, times: number) {
  let left = times;
  getItem.mockImplementation((k: string) => {
    if (k === key && left > 0) {
      left -= 1;
      return Promise.reject(new Error('lectura rota'));
    }
    return real(k);
  });
  return () => times - left;
}

beforeEach(async () => {
  getItem.mockImplementation(real);
  await AsyncStorage.clear();
  await savePrepNote('John/3/16', 'application', 'Prosa previa a mano.');
});

afterAll(() => {
  getItem.mockImplementation(real);
});

describe('the strict read', () => {
  it('getAllPrepNotes rethrows a failed read', async () => {
    const failed = failReadsOf('@prep_notes', 1);
    await expect(getAllPrepNotes({strict: true})).rejects.toThrow(
      'lectura rota',
    );
    expect(failed()).toBe(1);
  });

  it('getPrepNotes passes the option through', async () => {
    const failed = failReadsOf('@prep_notes', 1);
    await expect(getPrepNotes('John/3/16', {strict: true})).rejects.toThrow(
      'lectura rota',
    );
    expect(failed()).toBe(1);
  });

  it('a strict read that works returns the notes', async () => {
    const notes = await getPrepNotes('John/3/16', {strict: true});
    expect(notes.sections.application).toBe('Prosa previa a mano.');
  });

  it('the default read stays tolerant (screens that only show)', async () => {
    const failed = failReadsOf('@prep_notes', 2);
    await expect(getAllPrepNotes()).resolves.toEqual({});
    const notes = await getPrepNotes('John/3/16');
    expect(notes.sections).toEqual({});
    expect(failed()).toBe(2);
  });
});

describe("savePrepNote's read inside its turn", () => {
  it('a failed read rejects and leaves the disk as it was', async () => {
    const before = await AsyncStorage.getItem('@prep_notes');
    const failed = failReadsOf('@prep_notes', 1);
    await expect(
      savePrepNote('John/3/16', 'observation', 'se pierde'),
    ).rejects.toThrow('lectura rota');
    expect(failed()).toBe(1);
    expect(await AsyncStorage.getItem('@prep_notes')).toBe(before);
  });
});
