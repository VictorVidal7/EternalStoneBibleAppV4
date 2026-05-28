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

function noteToRemote(n: Note): SyncEntity<RemoteNote> {
  return {
    book: n.book,
    chapter: n.chapter,
    verse: n.verse,
    text: n.text,
    note: n.note,
    createdAt: toMillis(n.createdAt) || Date.now(),
    updatedAt: toMillis(n.updatedAt) || Date.now(),
  };
}

async function findNoteById(id: string): Promise<Note | null> {
  // bibleDB doesn't expose a getNoteById, so scan getNotes(). The
  // notes table is tiny (manual user content), so the scan is fine —
  // and centralizing the lookup here avoids touching the DB layer.
  try {
    const all = await bibleDB.getNotes();
    return all.find(n => n.id === id) ?? null;
  } catch (err) {
    logger.warn('notes adapter: getNotes failed', {
      component: 'sync/notes',
      error: err instanceof Error ? err.message : String(err),
    });
    return null;
  }
}

export const notesSyncAdapter: SyncAdapter<RemoteNote> = {
  collection: 'notes',

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
};

/** Helper for call sites: build the remote payload for a queueWrite. */
export function buildNoteRemotePayload(note: Note): SyncEntity<RemoteNote> {
  return noteToRemote(note);
}

export type {RemoteNote};
