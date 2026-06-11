/**
 * versePlaylist (Sprint 79 — listen to your favorites / a collection).
 *
 * The TTS engine has always taken an arbitrary `AudioVerse[]` — every verse
 * carries its own book/chapter/verse — so a MIXED queue of saved verses is
 * structurally supported; what was missing is a model for building one. This
 * module turns a bag of saved verses (favorites, a collection, a plan day)
 * into a clean playlist:
 *
 *   - canonical Bible order (book id, then chapter, then verse) — a playlist
 *     reads like a devotional walk through Scripture, not insertion order;
 *   - de-duplicated per verse (a verse saved twice is heard once), with the
 *     book resolved canonically so "Salmos" and "Psalms" collapse together;
 *   - silently DROPS entries whose book can't be resolved or whose text is
 *     empty (TTS would voice nothing) — honest playlists only.
 *
 * Plus `playlistUpNext`, the queue-sheet walker for a playlist: the next N
 * entries after the one playing, with their engine indices so a tap can
 * `goToVerse` exactly.
 *
 * Kept free of React / storage / the DB, mirroring [[chapterNavigation]] /
 * [[queueMeta]].
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import {getBookByName} from '@/constants/bible';
import type {AudioVerse} from '../types/audio';

/** Minimal shape of a saved verse a playlist can be built from. */
export interface PlaylistSourceVerse {
  /** Stored book name (any supported language — resolved canonically). */
  book: string;
  chapter: number;
  verse: number;
  text: string;
}

/** An up-next row for the queue sheet: the engine index + the verse itself. */
export interface PlaylistUpNextEntry {
  index: number;
  verse: AudioVerse;
}

/**
 * Build a TTS-ready playlist from saved verses: canonical order, deduped,
 * unresolvable/empty entries dropped.
 */
export function buildVersePlaylist(
  items: readonly PlaylistSourceVerse[],
): AudioVerse[] {
  const seen = new Set<string>();
  const rows: {bookId: number; verse: AudioVerse}[] = [];

  for (const item of items) {
    if (!item.text || item.text.trim().length === 0) continue;
    if (!Number.isFinite(item.chapter) || item.chapter < 1) continue;
    if (!Number.isFinite(item.verse) || item.verse < 1) continue;
    const info = getBookByName(item.book);
    if (!info) continue;

    const key = `${info.id}:${item.chapter}:${item.verse}`;
    if (seen.has(key)) continue;
    seen.add(key);

    rows.push({
      bookId: info.id,
      verse: {
        book: item.book,
        chapter: item.chapter,
        verse: item.verse,
        text: item.text,
      },
    });
  }

  rows.sort(
    (a, b) =>
      a.bookId - b.bookId ||
      a.verse.chapter - b.verse.chapter ||
      a.verse.verse - b.verse.verse,
  );
  return rows.map(r => r.verse);
}

/**
 * The next `limit` playlist entries after `currentIndex`, with their engine
 * indices (so the queue sheet can `goToVerse` precisely). Empty at the end of
 * the list; a negative `currentIndex` peeks from the start.
 */
export function playlistUpNext(
  verses: readonly AudioVerse[],
  currentIndex: number,
  limit: number,
): PlaylistUpNextEntry[] {
  if (limit <= 0 || verses.length === 0) return [];
  const start = Math.max(0, currentIndex + 1);
  const entries: PlaylistUpNextEntry[] = [];
  for (let i = start; i < verses.length && entries.length < limit; i++) {
    entries.push({index: i, verse: verses[i]});
  }
  return entries;
}
