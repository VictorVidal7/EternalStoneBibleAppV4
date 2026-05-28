/**
 * Sprint 42 — highlights SyncAdapter.
 *
 * Highlights live in SQLite (`highlights` table via HighlightService).
 * There's no HighlightsContext in the provider tree either — screens
 * call `useHighlights(database)` which creates its own per-component
 * service instance.
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

function highlightToRemote(h: Highlight): SyncEntity<RemoteHighlight> {
  return {
    verseId: h.verseId,
    bookId: h.bookId,
    chapter: h.chapter,
    verse: h.verse,
    color: h.color,
    category: h.category,
    note: h.note,
    createdAt: h.createdAt,
    updatedAt: h.updatedAt,
  };
}

export const highlightsSyncAdapter: SyncAdapter<RemoteHighlight> = {
  collection: 'highlights',

  async getLocal(verseId) {
    try {
      await bibleDB.initialize();
      const service = getService();
      await service.initialize();
      const h = await service.getHighlightByVerse(verseId);
      if (!h) return null;
      return highlightToRemote(h);
    } catch (err) {
      logger.warn('highlights adapter: getLocal failed', {
        component: 'sync/highlights',
        verseId,
        error: err instanceof Error ? err.message : String(err),
      });
      return null;
    }
  },

  async applyRemoteUpsert(verseId, data) {
    try {
      await bibleDB.initialize();
      const service = getService();
      await service.initialize();
      // addHighlight does INSERT OR REPLACE keyed on verse_id, so
      // calling it for an existing verseId updates in place. We just
      // need to overwrite the created_at/updated_at afterwards so the
      // remote timestamps survive (addHighlight overwrites them with
      // Date.now()).
      await service.addHighlight(
        data.verseId,
        data.bookId,
        data.chapter,
        data.verse,
        data.color,
        data.category,
        data.note,
      );
      await bibleDB.executeSql(
        'UPDATE highlights SET created_at = ?, updated_at = ? WHERE verse_id = ?',
        [data.createdAt, data.updatedAt, verseId],
      );
    } catch (err) {
      logger.error(
        'highlights adapter: applyRemoteUpsert failed',
        err instanceof Error ? err : new Error(String(err)),
        {component: 'sync/highlights', verseId},
      );
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
    }
  },

  async pullAllLocal() {
    try {
      await bibleDB.initialize();
      const service = getService();
      await service.initialize();
      const all = await service.getAllHighlights();
      return all.map(h => ({
        id: h.verseId, // verseId is the sync primary key
        data: highlightToRemote(h),
      }));
    } catch (err) {
      logger.warn('highlights adapter: pullAllLocal failed', {
        component: 'sync/highlights',
        error: err instanceof Error ? err.message : String(err),
      });
      return [];
    }
  },
};

/** Helper for call sites: build the remote payload for a queueWrite. */
export function buildHighlightRemotePayload(
  h: Highlight,
): SyncEntity<RemoteHighlight> {
  return highlightToRemote(h);
}

export type {RemoteHighlight};
