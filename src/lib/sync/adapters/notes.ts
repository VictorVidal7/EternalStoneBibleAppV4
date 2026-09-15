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

import bibleDB from '@lib/database';
import {logger} from '@lib/utils/logger';
import type {Note} from '@/types/bible';
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
      const isoCreated = millisToIso(data.createdAt || Date.now());
      const isoUpdated = millisToIso(data.updatedAt || Date.now());
      // INSERT OR REPLACE preserves the remote id so subsequent pulls
      // match on the same primary key — avoids the dedup-by-fields
      // gymnastics that would otherwise be needed.
      await bibleDB.executeSql(
        `INSERT OR REPLACE INTO notes
         (id, book_name, chapter, verse, verse_text, note, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          data.book,
          data.chapter,
          data.verse,
          data.text,
          data.note,
          isoCreated,
          isoUpdated,
        ],
      );
    } catch (err) {
      logger.error(
        'notes adapter: applyRemoteUpsert failed',
        err instanceof Error ? err : new Error(String(err)),
        {component: 'sync/notes', id},
      );
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
    }
  },

  async pullAllLocal() {
    try {
      await bibleDB.initialize();
      const all = await bibleDB.getNotes();
      return all.map(n => ({
        id: n.id,
        data: noteToRemote(n),
      }));
    } catch (err) {
      logger.warn('notes adapter: pullAllLocal failed', {
        component: 'sync/notes',
        error: err instanceof Error ? err.message : String(err),
      });
      return [];
    }
  },

  // Sprint 43 — `note` is the user's commentary, `text` is the quoted
  // verse (rarely edited but possible). Material for conflict detection.
  getMaterialFields() {
    return ['note', 'text'] as const;
  },
};

/** Helper for call sites: build the remote payload for a queueWrite. */
export function buildNoteRemotePayload(note: Note): SyncEntity<RemoteNote> {
  return noteToRemote(note);
}

export type {RemoteNote};
