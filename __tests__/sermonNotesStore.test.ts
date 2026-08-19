/**
 * "Notas de sermón" (free tier) — the device-local AsyncStorage persistence
 * layer. Pins the read/create/patch/delete round trip and the serialized
 * read-modify-write queue over the mocked AsyncStorage, mirroring
 * prayerStore.test.ts's coverage shape.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createSermonNoteSession,
  deleteSermonNoteSession,
  getAllSermonNotes,
  getSermonNote,
  saveSermonNoteSession,
} from '../src/features/study/sermonNotesStore';

const KEY = '@sermon_notes';

beforeEach(async () => {
  await AsyncStorage.clear();
});

describe('getAllSermonNotes / getSermonNote', () => {
  it('returns an empty map when nothing is stored', async () => {
    expect(await getAllSermonNotes()).toEqual({});
  });

  it('returns null for an unknown session id', async () => {
    expect(await getSermonNote('nope')).toBeNull();
  });

  it('tolerates a corrupt blob instead of throwing', async () => {
    await AsyncStorage.setItem(KEY, '{not json');
    expect(await getAllSermonNotes()).toEqual({});
  });
});

describe('createSermonNoteSession', () => {
  it('creates and persists a session', async () => {
    const created = await createSermonNoteSession('Prédica de hoy');
    expect(created).not.toBeNull();
    expect(created?.title).toBe('Prédica de hoy');
    expect(created?.bodyText).toBe('');

    const all = await getAllSermonNotes();
    expect(Object.keys(all)).toEqual([created!.id]);
  });

  it('stores an optional source', async () => {
    const created = await createSermonNoteSession(
      'Título',
      'Iglesia Central — Pr. Juan',
    );
    expect(created?.source).toBe('Iglesia Central — Pr. Juan');
  });

  it('returns null for a blank title and persists nothing', async () => {
    const created = await createSermonNoteSession('   ');
    expect(created).toBeNull();
    expect(await getAllSermonNotes()).toEqual({});
  });
});

describe('saveSermonNoteSession', () => {
  it('patches the title/source/body of an existing session', async () => {
    const created = await createSermonNoteSession('Original');
    await saveSermonNoteSession(created!.id, {
      title: 'Editado',
      source: 'Iglesia X',
      bodyText: 'Juan 3:16 fue el texto central.',
    });
    const found = await getSermonNote(created!.id);
    expect(found).toMatchObject({
      title: 'Editado',
      source: 'Iglesia X',
      bodyText: 'Juan 3:16 fue el texto central.',
    });
  });

  it('is a no-op for an unknown session id (never throws, never creates)', async () => {
    await saveSermonNoteSession('nope', {title: 'X'});
    expect(await getAllSermonNotes()).toEqual({});
  });
});

describe('deleteSermonNoteSession', () => {
  it('removes a session', async () => {
    const created = await createSermonNoteSession('Para borrar');
    await deleteSermonNoteSession(created!.id);
    expect(await getSermonNote(created!.id)).toBeNull();
  });
});

describe('a failed underlying write is not reported as success', () => {
  it('createSermonNoteSession returns null (not a phantom session) when the write rejects, and does not wedge the queue', async () => {
    jest
      .spyOn(AsyncStorage, 'setItem')
      .mockImplementationOnce(() => Promise.reject(new Error('disk full')));

    const failed = await createSermonNoteSession('Se pierde');
    expect(failed).toBeNull();

    // The queue must still be usable afterwards — one bad write shouldn't
    // block every write that comes after it.
    const created = await createSermonNoteSession('Sí se guarda');
    expect(created).not.toBeNull();
    const all = await getAllSermonNotes();
    expect(Object.keys(all)).toEqual([created!.id]);
  });
});

describe('serialized read-modify-write queue', () => {
  it('creating two sessions concurrently keeps both (no lost update)', async () => {
    const [a, b] = await Promise.all([
      createSermonNoteSession('Nota A'),
      createSermonNoteSession('Nota B'),
    ]);
    const all = await getAllSermonNotes();
    expect(Object.keys(all).sort()).toEqual([a!.id, b!.id].sort());
  });

  it('a save fired right after create is not lost to the create write', async () => {
    const created = await createSermonNoteSession('Original');
    // Fire the patch without awaiting the create's own AsyncStorage settle —
    // the shared write queue must still serialize these correctly.
    await Promise.all([
      saveSermonNoteSession(created!.id, {bodyText: 'primera línea'}),
      saveSermonNoteSession(created!.id, {source: 'Iglesia Y'}),
    ]);
    const found = await getSermonNote(created!.id);
    expect(found).toMatchObject({
      bodyText: 'primera línea',
      source: 'Iglesia Y',
    });
  });
});
