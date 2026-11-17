/**
 * Sprint 42 — highlights SyncAdapter.
 *
 * Highlights live in SQLite (`highlights` table via HighlightService).
 * There's no HighlightsContext in the provider tree either — screens read
 * highlights straight from the shared bibleDB / ServicesContext on focus.
 *
 * Strategy: this adapter owns its own HighlightService instance bound
 * to the singleton bibleDB. The screen-local services stay
 * untouched; their `setState` paths refresh from the DB on every
 * mount/focus, so remote-applied changes show up the next time the
 * screen is opened. The chapter screen's add/update/remove
 * callsites are wired to call `getSyncEngine()?.queueWrite(...)`
 * explicitly for the outbound side.
 *
 * Primary key uses `verseId` (e.g. "Genesis:1:1") rather than the
 * service's auto-generated `id`. There's a UNIQUE constraint on
 * `verse_id` in the schema, so each verse has at most one highlight,
 * which makes the verseId a stable cross-device identifier (the
 * service's generated id includes a timestamp and changes between
 * devices).
 */

import bibleDB from '@lib/database';
import {HighlightService} from '@lib/highlights/HighlightService';
import {
  HighlightCategory,
  HighlightColor,
  type Highlight,
} from '@lib/highlights';
import {logger} from '@lib/utils/logger';
import {nullifyUndefined} from '../sanitize';
import type {SyncAdapter, SyncEntity} from '../types';

interface RemoteHighlight {
  verseId: string;
  bookId: string;
  chapter: number;
  verse: number;
  color: HighlightColor;
  category?: HighlightCategory;
  note?: string;
  createdAt: number;
}

let _service: HighlightService | null = null;
function getService(): HighlightService {
  if (!_service) _service = new HighlightService(bibleDB);
  return _service;
}

// Sprint 78 — a highlight without a category/note carried `undefined` here,
// Firestore rejected the doc and the SyncEngine dropped it after its retries,
// so such highlights NEVER synced (the same S77 pattern that hit note-less
// favorites). `nullifyUndefined` sends those absent optionals as an explicit
// `null` instead of omitting the key, because `pushOne` writes with
// `{merge: true}`: an omitted key means "keep the server's value", which made
// clearing a note impossible to propagate (R9-50). Both material fields
// (`category`, `note`) depend on this — see sync/sanitize.ts.
function highlightToRemote(h: Highlight): SyncEntity<RemoteHighlight> {
  return nullifyUndefined({
    verseId: h.verseId,
    bookId: h.bookId,
    chapter: h.chapter,
    verse: h.verse,
    color: h.color,
    category: h.category,
    note: h.note,
    createdAt: h.createdAt,
    updatedAt: h.updatedAt,
  });
}

export const highlightsSyncAdapter: SyncAdapter<RemoteHighlight> = {
  collection: 'highlights',

  // R9-132 — deliberately NOT wrapped in a try/catch that returns `null`, as
  // in the notes adapter (R9-46): "I could not read the database" must not
  // masquerade as "this verse has no highlight here". The engine treats a
  // `null` as permission to apply the remote copy without last-write-wins or
  // conflict detection, so an OLDER copy of the other device overwrote the
  // color, category and note of a newer local one. A read that throws makes
  // the engine skip the doc and keep it below the cursor instead.
  async getLocal(verseId) {
    await bibleDB.initialize();
    const service = getService();
    await service.initialize();
    const h = await service.getHighlightByVerse(verseId);
    if (!h) return null;
    return highlightToRemote(h);
  },

  // R9-128 — a write that did not land REJECTS. Swallowed, the engine counted
  // the doc as applied and moved its cursor past it, so the change never came
  // back, and the next local edit pushed over the other device's copy.
  async applyRemoteUpsert(verseId, data) {
    try {
      await bibleDB.initialize();
      const service = getService();
      await service.initialize();
      // One INSERT OR REPLACE keyed on the UNIQUE verse_id, with the remote
      // timestamps in it. `addHighlight` stamps the row with Date.now(), and
      // the UPDATE that put the remote ones back was a second statement: when
      // only that one failed, the row kept the remote content under a stamp
      // newer than any copy, and LWW then ignored the redelivery as older.
      await bibleDB.executeSql(
        `INSERT OR REPLACE INTO highlights
         (id, verse_id, book_id, chapter, verse, color, category, note, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          `highlight_${data.verseId}_${Date.now()}`,
          data.verseId,
          data.bookId,
          data.chapter,
          data.verse,
          data.color,
          data.category || null,
          data.note || null,
          data.createdAt,
          data.updatedAt,
        ],
      );
    } catch (err) {
      logger.error(
        'highlights adapter: applyRemoteUpsert failed',
        err instanceof Error ? err : new Error(String(err)),
        {component: 'sync/highlights', verseId},
      );
      throw err;
    }
  },

  async applyRemoteDelete(verseId) {
    try {
      await bibleDB.initialize();
      const service = getService();
      await service.initialize();
      await service.removeHighlight(verseId);
    } catch (err) {
      logger.warn('highlights adapter: applyRemoteDelete failed', {
        component: 'sync/highlights',
        verseId,
        error: err instanceof Error ? err.message : String(err),
      });
      // R9-128 — as in applyRemoteUpsert.
      throw err;
    }
  },

  // R9-257 — a failed read throws: both callers log it, and the bulk push
  // retries this collection on the next start. Read as `[]`, the account was
  // marked pushed with these rows never queued.
  async pullAllLocal() {
    await bibleDB.initialize();
    const service = getService();
    await service.initialize();
    const all = await service.getAllHighlights();
    return all.map(h => ({
      id: h.verseId, // verseId is the sync primary key
      data: highlightToRemote(h),
    }));
  },

  // Sprint 43 — color/category/note are the user-editable bits of a
  // highlight. verseId/bookId/chapter/verse are immutable identity.
  getMaterialFields() {
    return ['color', 'category', 'note'] as const;
  },
};

/** Helper for call sites: build the remote payload for a queueWrite. */
export function buildHighlightRemotePayload(
  h: Highlight,
): SyncEntity<RemoteHighlight> {
  return highlightToRemote(h);
}

export type {RemoteHighlight};
