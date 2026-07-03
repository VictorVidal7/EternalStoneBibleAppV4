/**
 * 🕘 prepHistory — PURE logic behind the "Historial de preparaciones" screen
 * (T8.4.1), the first slice of the premium "Mesa de preparación" tanda (T8.4).
 *
 * The preparer's notes ([[prepNotes]]) already persist per-passage in
 * `PrepNotesMap`, keyed by the canonical `passageKey` ([[prepTable]]'s
 * `formatPassageKey`, e.g. "John/3/16-21"). This module turns that raw map
 * into a sorted, searchable, DISPLAYABLE list — parsing the key back into a
 * passage, picking a short preview from the preparer's own words, and
 * building the search haystack — without touching React, AsyncStorage, or
 * Date.now (the screen supplies `now` so this stays unit-testable), mirroring
 * [[noteFilter]] for the Notes tab.
 *
 * This tanda is pure NAVIGATION/SEARCH over notes the preparer already wrote
 * — it never generates or suggests text, so the app's "never write the
 * sermon" guardrail (Jeremías 23:30-32) simply doesn't apply here; there is
 * nothing here that puts words in anyone's mouth.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import {getBookByName} from '@/constants/bible';
import {PREP_SECTIONS, type PrepSection} from './prepTable';
import type {PrepNotes, PrepNotesMap} from './prepNotes';

/** A `passageKey` resolved back into its passage parts. */
export interface ParsedPassageKey {
  bookId: number;
  bookNameEn: string;
  chapter: number;
  startVerse: number;
  endVerse: number;
}

/** One row for the history list: a parsed passage plus its notes metadata. */
export interface PrepHistoryEntry extends ParsedPassageKey {
  passageKey: string;
  updatedAt: number;
  /** A short snippet of the first non-empty section, for the row preview. */
  preview: string;
  /** Lowercased concatenation of every section's text, for search. */
  searchableText: string;
}

const PREVIEW_MAX_LENGTH = 140;
const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Parse a canonical `formatPassageKey` string ("John/3/16" or "John/3/16-21")
 * back into its passage parts. Returns null for anything malformed or an
 * unrecognized book — defensive, since a future app version or a hand-edited
 * store could in principle carry a stale/corrupt key.
 */
export function parsePassageKey(key: string): ParsedPassageKey | null {
  const parts = key.split('/');
  if (parts.length !== 3) return null;
  const [bookName, chapterStr, rangeStr] = parts;

  const book = getBookByName(bookName);
  if (!book) return null;

  const chapter = Number(chapterStr);
  if (!Number.isInteger(chapter) || chapter < 1) return null;

  const [startStr, endStr] = rangeStr.split('-');
  const startVerse = Number(startStr);
  const endVerse = endStr !== undefined ? Number(endStr) : startVerse;
  if (!Number.isInteger(startVerse) || startVerse < 1) return null;
  if (!Number.isInteger(endVerse) || endVerse < startVerse) return null;

  return {
    bookId: book.id,
    bookNameEn: book.nameEn,
    chapter,
    startVerse,
    endVerse,
  };
}

/**
 * The first non-empty outline section's prose (outline order), trimmed to a
 * single line and capped so a long paragraph doesn't blow out a list row.
 */
export function firstNonEmptyPreview(notes: PrepNotes): string {
  for (const section of PREP_SECTIONS as readonly PrepSection[]) {
    const text = notes.sections[section];
    if (text && text.trim().length > 0) {
      const flat = text.trim().replace(/\s+/g, ' ');
      return flat.length > PREVIEW_MAX_LENGTH
        ? `${flat.slice(0, PREVIEW_MAX_LENGTH).trimEnd()}…`
        : flat;
    }
  }
  return '';
}

/**
 * Build the displayable, sorted history from the raw persisted map. Entries
 * whose `passageKey` no longer parses are skipped rather than crashing the
 * list (defensive — `parsePrepNotesMap` already drops empty entries, so in
 * practice every remaining row should parse, but a corrupt/legacy key should
 * never take down the whole screen).
 *
 * Sorted most-recently-edited first (`updatedAt` descending).
 */
export function buildPrepHistoryEntries(map: PrepNotesMap): PrepHistoryEntry[] {
  const entries: PrepHistoryEntry[] = [];
  for (const [passageKey, notes] of Object.entries(map)) {
    const parsed = parsePassageKey(passageKey);
    if (!parsed) continue;
    const searchableText = Object.values(notes.sections)
      .filter((text): text is string => typeof text === 'string')
      .join(' ')
      .toLowerCase();
    entries.push({
      ...parsed,
      passageKey,
      updatedAt: notes.updatedAt,
      preview: firstNonEmptyPreview(notes),
      searchableText,
    });
  }
  entries.sort((a, b) => b.updatedAt - a.updatedAt);
  return entries;
}

/** The localized strings `formatRelativeUpdatedAt` needs — see `t.prepHistory`. */
export interface RelativeTimeStrings {
  today: string;
  yesterday: string;
  /** Contains `{{n}}`. */
  daysAgo: string;
  weeksAgoSingular: string;
  /** Contains `{{n}}`. */
  weeksAgo: string;
  monthsAgoSingular: string;
  /** Contains `{{n}}`. */
  monthsAgo: string;
  yearsAgoSingular: string;
  /** Contains `{{n}}`. */
  yearsAgo: string;
}

/**
 * A short "hace 2 días" / "2 days ago" style label for a note's last edit.
 * `now` is injected (never `Date.now()` internally) so this stays a pure,
 * deterministically-testable function — the screen supplies the real clock.
 */
export function formatRelativeUpdatedAt(
  updatedAt: number,
  now: number,
  strings: RelativeTimeStrings,
): string {
  const diffDays = Math.floor(Math.max(0, now - updatedAt) / DAY_MS);

  if (diffDays <= 0) return strings.today;
  if (diffDays === 1) return strings.yesterday;
  if (diffDays < 7) return strings.daysAgo.replace('{{n}}', String(diffDays));

  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return weeks === 1
      ? strings.weeksAgoSingular
      : strings.weeksAgo.replace('{{n}}', String(weeks));
  }

  if (diffDays < 365) {
    const months = Math.floor(diffDays / 30);
    return months === 1
      ? strings.monthsAgoSingular
      : strings.monthsAgo.replace('{{n}}', String(months));
  }

  const years = Math.floor(diffDays / 365);
  return years === 1
    ? strings.yearsAgoSingular
    : strings.yearsAgo.replace('{{n}}', String(years));
}
