/**
 * Sprint 42 — notes SyncAdapter.
 *
 * Notes live in SQLite (`notes` table via bibleDB.addNote/updateNote/
 * removeNote/getNotes). There is no NotesContext in the provider tree
 * — screens talk to bibleDB directly — so this adapter is registered
 * at engine start without React.
 *
 * The CRUD callsites (chapter screen `saveNote`, notes screen delete)
 * call `getSyncEngine()?.queueWrite(...)` themselves; this adapter
 * only handles the inbound side (remote → local) plus the initial
 * bulk push (`pullAllLocal`).
 *
 * Field mapping: SQLite stores createdAt/updatedAt as ISO strings;
 * the engine speaks millis. The conversion happens here.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import bibleDB, {type NotesFold} from '@lib/database';
import {logger} from '@lib/utils/logger';
import type {Note} from '@/types/bible';
import {getSyncEngine} from '../instance';
import {millisToIso, toMillis} from '../timeUtils';
import {nullifyUndefined} from '../sanitize';
import type {SyncAdapter, SyncEntity} from '../types';

interface RemoteNote {
  book: string;
  chapter: number;
  verse: number;
  text: string;
  note: string;
  createdAt: number; // millis
  // updatedAt + deleted live on SyncMetadata
}

// Sprint 78 — every Note field is required today, but the S77 lesson stands:
// one optional field emitting `undefined` silently blocks the entity from
// ever syncing, so every *ToRemote builder sanitizes by construction.
function noteToRemote(n: Note): SyncEntity<RemoteNote> {
  return nullifyUndefined({
    book: n.book,
    chapter: n.chapter,
    verse: n.verse,
    text: n.text,
    note: n.note,
    createdAt: toMillis(n.createdAt) || Date.now(),
    updatedAt: toMillis(n.updatedAt) || Date.now(),
  });
}

/**
 * R9-46 — this lookup must answer "does note `id` exist locally?" and must
 * NEVER answer "no" when the honest answer is "I could not find out".
 *
 * Two things used to make it lie. It was the ONLY one of the adapter's four
 * methods that skipped `bibleDB.initialize()` (the highlights adapter calls
 * it in all four), so on a cold start it hit `getDb()` before the database
 * was open and threw `Database not initialized`; and the `catch` then turned
 * that throw into `null`, which is indistinguishable from "the note isn't
 * here". `SyncEngine.applyRemoteChange` keeps BOTH its last-write-wins guard
 * and its conflict detection inside `if (local && data)`, so a `null` local
 * skips straight to `applyRemoteUpsert` — an OLDER remote copy silently
 * overwrites a NEWER local note. The window is widest on a reinstall, which
 * is exactly when notes are being pulled down.
 *
 * So: initialize first (idempotent, and it coalesces concurrent callers), and
 * let a genuine read failure PROPAGATE. The engine now skips a doc whose
 * local state it couldn't establish instead of blind-upserting it, and
 * withholds that doc's cursor contribution so it is redelivered later.
 */
async function findNoteById(id: string): Promise<Note | null> {
  // bibleDB doesn't expose a getNoteById, so scan getNotes(). The
  // notes table is tiny (manual user content), so the scan is fine —
  // and centralizing the lookup here avoids touching the DB layer.
  await bibleDB.initialize();
  const all = await bibleDB.getNotes();
  return all.find(n => n.id === id) ?? null;
}

export const notesSyncAdapter: SyncAdapter<RemoteNote> = {
  collection: 'notes',

  // Deliberately NOT wrapped in a try/catch that returns `null` (R9-46):
  // "I couldn't read the database" must not masquerade as "the note does not
  // exist here", because the engine treats the latter as permission to
  // overwrite local data with whatever the server has.
  async getLocal(id) {
    const note = await findNoteById(id);
    if (!note) return null;
    return noteToRemote(note);
  },

  async applyRemoteUpsert(id, data) {
    try {
      await bibleDB.initialize();
      // INSERT OR REPLACE under the remote id, so later pulls match on the
      // same primary key; an OLD id on a device already folded is folded into
      // the verse's row instead (R9-51, see `bibleDB.applyRemoteNote`).
      await bibleDB.applyRemoteNote(
        {
          id,
          book: data.book,
          chapter: data.chapter,
          verse: data.verse,
          text: data.text,
          note: data.note,
          createdAt: millisToIso(data.createdAt || Date.now()),
          updatedAt: millisToIso(data.updatedAt || Date.now()),
        },
        await notesFolded(),
      );
    } catch (err) {
      logger.error(
        'notes adapter: applyRemoteUpsert failed',
        err instanceof Error ? err : new Error(String(err)),
        {component: 'sync/notes', id},
      );
      // R9-128 — and the engine must know: swallowed, the change counted as
      // applied, the cursor moved past it, and it never came back.
      throw err;
    }
  },

  async applyRemoteDelete(id) {
    try {
      await bibleDB.initialize();
      await bibleDB.removeNote(id);
    } catch (err) {
      logger.warn('notes adapter: applyRemoteDelete failed', {
        component: 'sync/notes',
        id,
        error: err instanceof Error ? err.message : String(err),
      });
      // R9-128 — see applyRemoteUpsert.
      throw err;
    }
  },

  // R9-257 — a failed read throws: both callers log it, and the bulk push
  // retries this collection on the next start. Read as `[]`, the account was
  // marked pushed with these rows never queued.
  async pullAllLocal() {
    await bibleDB.initialize();
    const all = await bibleDB.getNotes();
    return all.map(n => ({
      id: n.id,
      data: noteToRemote(n),
    }));
  },

  // Sprint 43 — `note` is the user's commentary, `text` is the quoted
  // verse (rarely edited but possible). Material for conflict detection.
  getMaterialFields() {
    return ['note', 'text'] as const;
  },
};

/**
 * R9-51 — the one-time fold of this device's notes into one row per verse,
 * keyed on the verse (`vnote:<book>:<chapter>:<verse>`). Runs at start, after
 * `migrateCanonicalBookKeys` (which can leave a «Juan 3:16» and a «John
 * 3:16» note on the same verse). The flag is written after the transaction
 * and the queueing: a fold that fails leaves no flag and queues nothing, and
 * the next start runs it again. Once folded, a second run finds no old id.
 */
export const NOTES_VERSE_KEY_FLAG = '@notes_verse_key_v1';

let foldedSeen = false;

/** Whether this device's fold has run (`applyRemoteUpsert` asks it). */
async function notesFolded(): Promise<boolean> {
  if (foldedSeen) return true;
  foldedSeen = (await AsyncStorage.getItem(NOTES_VERSE_KEY_FLAG)) === '1';
  return foldedSeen;
}

export async function migrateNotesToVerseKeys(): Promise<void> {
  if (await notesFolded()) return;
  const fold = await bibleDB.foldVerseNotes(new Date().toISOString());
  pushNotesFold(fold);
  await AsyncStorage.setItem(NOTES_VERSE_KEY_FLAG, '1');
  foldedSeen = true;
  if (fold.written.length > 0 || fold.removedIds.length > 0) {
    logger.info('notes: folded into one note per verse', {
      component: 'sync/notes',
      written: fold.written.length,
      removed: fold.removedIds.length,
    });
  }
}

/**
 * R9-51 — a fold goes up as ONE batch (memory: sync the least, in a batch):
 * each verse's row it wrote, and a delete of each old id it replaced, so the
 * old docs do not come back to a device that has not folded yet.
 */
export function pushNotesFold(fold: NotesFold): void {
  if (fold.written.length === 0 && fold.removedIds.length === 0) return;
  getSyncEngine()?.queueWrites([
    ...fold.written.map(n => ({
      collection: 'notes',
      id: n.id,
      data: noteToRemote(n),
    })),
    ...fold.removedIds.map(id => ({
      collection: 'notes',
      id,
      data: {},
      deleted: true,
    })),
  ]);
}

/** Tests only: forget the flag read in memory. */
export function __resetNotesFoldedForTests(): void {
  foldedSeen = false;
}

/** Helper for call sites: build the remote payload for a queueWrite. */
export function buildNoteRemotePayload(note: Note): SyncEntity<RemoteNote> {
  return noteToRemote(note);
}

export type {RemoteNote};
