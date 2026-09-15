/**
 * R9-46 — `notesSyncAdapter.getLocal` must never answer "this note does not
 * exist here" when the truth is "I could not read the database".
 *
 * It was the ONLY one of the adapter's four methods that skipped
 * `bibleDB.initialize()` (the highlights adapter calls it in all four), so on
 * a cold start it reached `getDb()` before the database was open and threw
 * `Database not initialized`. The adapter's own catch then converted that
 * throw into `null` — the same value that means "absent".
 *
 * That distinction is load-bearing: `SyncEngine.applyRemoteChange` keeps both
 * its last-write-wins guard and its conflict detection inside
 * `if (local && data)`, so a `null` local skips straight to
 * `applyRemoteUpsert` and an OLDER remote copy silently overwrites a NEWER
 * local note. The window is widest on a reinstall — exactly when notes are
 * being pulled down.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

const mockInitialize = jest.fn().mockResolvedValue(undefined);
const mockGetNotes = jest.fn();

jest.mock('@lib/database', () => ({
  __esModule: true,
  default: {
    initialize: (...args: unknown[]) => mockInitialize(...args),
    getNotes: (...args: unknown[]) => mockGetNotes(...args),
  },
}));

import {notesSyncAdapter} from '../src/lib/sync/adapters/notes';

const NOTE = {
  id: 'note_1',
  book: 'Juan',
  chapter: 3,
  verse: 16,
  text: 'Porque de tal manera amó Dios al mundo…',
  note: 'mi nota',
  createdAt: '2026-09-01T00:00:00.000Z',
  updatedAt: '2026-09-02T00:00:00.000Z',
};

beforeEach(() => {
  mockInitialize.mockClear().mockResolvedValue(undefined);
  mockGetNotes.mockReset();
});

describe('R9-46 — notesSyncAdapter.getLocal fails CLOSED', () => {
  it('opens the database before reading, like the adapter’s other three methods', async () => {
    mockGetNotes.mockResolvedValue([NOTE]);
    await notesSyncAdapter.getLocal('note_1');
    expect(mockInitialize).toHaveBeenCalled();
  });

  it('propagates a read failure instead of reporting the note as absent', async () => {
    mockGetNotes.mockRejectedValue(
      new Error('Database not initialized. Call initialize() first.'),
    );
    // Pre-fix this resolved to `null`, which the engine reads as "no local
    // copy — apply the remote one unconditionally".
    await expect(notesSyncAdapter.getLocal('note_1')).rejects.toThrow(
      /Database not initialized/,
    );
  });

  it('still returns null for a note that genuinely is not here', async () => {
    mockGetNotes.mockResolvedValue([]);
    await expect(notesSyncAdapter.getLocal('note_1')).resolves.toBeNull();
  });

  it('returns the mapped remote payload for a note that exists', async () => {
    mockGetNotes.mockResolvedValue([NOTE]);
    const out = await notesSyncAdapter.getLocal('note_1');
    expect(out).toMatchObject({book: 'Juan', chapter: 3, verse: 16});
  });
});
