/**
 * 📝 sermonNotes — the PURE model for "Notas de sermón" (free tier).
 *
 * Any believer sitting in a service needs one place to write free-flowing
 * prose WHILE the pastor preaches and easily keep the verses that get shared
 * along the way — something the reader's existing per-verse Notes feature
 * cannot do (that one holds exactly one note PER VERSE, never a single
 * session of prose spanning many verses). This module is that session: a
 * title, an optional church/preacher note, and a free-text body.
 *
 * SHAPE-mirrors [[prepSeries]] (a named record with `id`/`createdAt`/
 * `updatedAt`, kept in a device-local map, most-recently-updated first) —
 * that premium pastor-side planner is never imported here, this is its own
 * independent, ungated model built the same way.
 *
 * A session's "referenced verses" are NEVER persisted — they are always
 * derived on read from `bodyText` via [[parseReference]]'s
 * `linkifyReferences`, the SAME inline-reference recognizer the reader
 * screen already uses (zero extra storage, one source of truth).
 *
 * 100% DEVICE-LOCAL (AsyncStorage only, see [[sermonNotesStore]]) — this
 * app's standing rule is to minimize Firestore sync, and a listener's own
 * sermon notes are low-stakes personal content that never needs to leave
 * the device.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import {
  linkifyReferences,
  parseReference,
} from '@lib/references/parseReference';
import {getBookByName} from '@/constants/bible';

/** One free-flowing sermon note-taking session. */
export interface SermonNoteSession {
  id: string;
  /** Short title — defaults to the creation date (`defaultSessionTitle`). */
  title: string;
  /** Optional free-text church/preacher note, e.g. "Iglesia Central — Pr. Juan". */
  source?: string;
  /** The listener's own free-flowing prose, typed during (or after) the sermon. */
  bodyText: string;
  createdAt: number;
  updatedAt: number;
}

/** Partial edits applied by the autosaving editor — any subset of fields. */
export interface SermonNoteDraft {
  title?: string;
  source?: string;
  bodyText?: string;
}

/** The whole device-local store: session id → the session. */
export type SermonNotesMap = Record<string, SermonNoteSession>;

/**
 * Caps — generous for a lifetime of weekly sermon notes (500 sessions is
 * roughly a decade of weekly services) while keeping the device-local JSON
 * blob bounded. Not a hard product requirement — a deliberate, adjustable
 * backstop, same spirit as [[prepSeries]]'s MAX_SERIES.
 */
export const MAX_SESSIONS = 500;
/** Defensive cap on a session's own title length. */
export const MAX_TITLE_LENGTH = 100;
/** Defensive cap on the optional church/preacher note. */
export const MAX_SOURCE_LENGTH = 100;
/**
 * Defensive cap on the free-flowing body — generous enough for a full set of
 * handwritten-style sermon notes (roughly 3,000-4,000 words).
 */
export const MAX_BODY_LENGTH = 20000;

/** A fresh, empty map. */
export function emptySermonNotesMap(): SermonNotesMap {
  return {};
}

/** A reasonably-unique id, same shape as other device-local records in this app. */
export function generateSermonNoteId(): string {
  return `sermon_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function clampTitle(title: string): string {
  return typeof title === 'string'
    ? title.trim().slice(0, MAX_TITLE_LENGTH)
    : '';
}

function clampSource(source: string): string {
  return typeof source === 'string'
    ? source.trim().slice(0, MAX_SOURCE_LENGTH)
    : '';
}

function clampBody(body: string): string {
  return typeof body === 'string' ? body.slice(0, MAX_BODY_LENGTH) : '';
}

/** True while the map has room for one more session. */
export function canCreateSession(map: SermonNotesMap): boolean {
  return Object.keys(map).length < MAX_SESSIONS;
}

const MONTH_ABBR: Record<'es' | 'en', readonly string[]> = {
  es: [
    'ene',
    'feb',
    'mar',
    'abr',
    'may',
    'jun',
    'jul',
    'ago',
    'sep',
    'oct',
    'nov',
    'dic',
  ],
  en: [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ],
};

/**
 * Format a timestamp as a short human date label ("22 jul 2026" / "Jul 22,
 * 2026"), device-local (never UTC) so it matches the calendar day the
 * listener actually experienced.
 */
export function formatSessionDateLabel(
  timestamp: number,
  lang: 'es' | 'en' = 'es',
): string {
  const d = new Date(timestamp);
  const day = d.getDate();
  const month = MONTH_ABBR[lang][d.getMonth()];
  const year = d.getFullYear();
  return lang === 'en' ? `${month} ${day}, ${year}` : `${day} ${month} ${year}`;
}

/** A new session's default title — today's date, editable immediately. */
export function defaultSessionTitle(
  now: number = Date.now(),
  lang: 'es' | 'en' = 'es',
): string {
  return formatSessionDateLabel(now, lang);
}

/**
 * Create a new session and add it to the map. A no-op (returns `map`
 * unchanged) for a blank title or once `MAX_SESSIONS` is reached — screens
 * should check `canCreateSession` first for a real "llegaste al máximo"
 * message; this is just the defensive backstop.
 */
export function createSession(
  map: SermonNotesMap,
  title: string,
  source: string = '',
  now: number = Date.now(),
  id: string = generateSermonNoteId(),
): SermonNotesMap {
  const trimmedTitle = clampTitle(title);
  if (!trimmedTitle || !canCreateSession(map)) return map;
  const trimmedSource = clampSource(source);
  const session: SermonNoteSession = {
    id,
    title: trimmedTitle,
    ...(trimmedSource ? {source: trimmedSource} : {}),
    bodyText: '',
    createdAt: now,
    updatedAt: now,
  };
  return {...map, [id]: session};
}

/**
 * Apply a partial edit to an existing session. A no-op for an unknown id.
 * `title`, when provided blank/whitespace-only, is IGNORED (keeps the
 * previous title — a session always keeps some title, mirroring
 * [[prepSeries]]'s `renameSeries`). `source`, when provided as an empty
 * string, CLEARS the field (there's no meaningful "blank source" otherwise).
 * `bodyText`, when provided, always replaces the previous body (clamped).
 */
export function updateSession(
  map: SermonNotesMap,
  id: string,
  patch: SermonNoteDraft,
  now: number = Date.now(),
): SermonNotesMap {
  const session = map[id];
  if (!session) return map;
  const next: SermonNoteSession = {...session, updatedAt: now};

  if (patch.title !== undefined) {
    const trimmed = clampTitle(patch.title);
    if (trimmed) next.title = trimmed;
  }
  if (patch.source !== undefined) {
    const trimmed = clampSource(patch.source);
    if (trimmed) {
      next.source = trimmed;
    } else {
      delete next.source;
    }
  }
  if (patch.bodyText !== undefined) {
    next.bodyText = clampBody(patch.bodyText);
  }

  return {...map, [id]: next};
}

/** Delete a whole session. A no-op for an unknown id. */
export function deleteSession(map: SermonNotesMap, id: string): SermonNotesMap {
  if (!map[id]) return map;
  const next = {...map};
  delete next[id];
  return next;
}

/** All sessions, most-recently-updated first (same convention as [[prepSeries]]). */
export function listSessions(map: SermonNotesMap): SermonNoteSession[] {
  return Object.values(map).sort((a, b) => b.updatedAt - a.updatedAt);
}

/** One Bible reference recognized inside a session's free-flowing prose. */
export interface ReferencedVerse {
  /** Canonical de-dupe key, e.g. "John/3/16", "John/3/16-21", or "John/3" (chapter-only). */
  key: string;
  bookNameEn: string;
  chapter: number;
  verse?: number;
  verseEnd?: number;
}

/**
 * Scan a session's prose for Bible references the listener typed inline
 * (e.g. "como dice Juan 3:16") via [[parseReference]]'s `linkifyReferences`
 * — the exact same recognizer already used to linkify verse text elsewhere
 * in the app. Purely derived: nothing here is ever persisted alongside the
 * session. Returns matches in first-seen order, deduped by canonical key.
 */
export function getReferencedVerses(bodyText: string): ReferencedVerse[] {
  if (!bodyText) return [];
  const segments = linkifyReferences(bodyText);
  const seen = new Set<string>();
  const out: ReferencedVerse[] = [];
  for (const segment of segments) {
    if (!segment.ref) continue;
    const {book, chapter, verse, verseEnd} = segment.ref;
    const key =
      verse === undefined
        ? `${book.nameEn}/${chapter}`
        : `${book.nameEn}/${chapter}/${verse}${
            verseEnd !== undefined ? `-${verseEnd}` : ''
          }`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({key, bookNameEn: book.nameEn, chapter, verse, verseEnd});
  }
  return out;
}

/** Render a `ReferencedVerse` as a localized display label, e.g. "Juan 3:16-21". */
export function formatReferencedVerseLabel(
  rv: ReferencedVerse,
  language: 'es' | 'en',
): string {
  const book = getBookByName(rv.bookNameEn);
  const name = book
    ? language === 'es'
      ? book.name
      : book.nameEn
    : rv.bookNameEn;
  if (rv.verse === undefined) return `${name} ${rv.chapter}`.trim();
  const range =
    rv.verseEnd !== undefined ? `${rv.verse}-${rv.verseEnd}` : `${rv.verse}`;
  return `${name} ${rv.chapter}:${range}`.trim();
}

/**
 * Parse a free-typed reference ("Juan 3:16", "Romans 8:28-30") into a
 * canonical, localized label ready to insert into the prose — used by the
 * editor's "insert a reference" quick action. Returns null for anything that
 * doesn't resolve (an out-of-range chapter/verse, or unrecognized text).
 */
export function formatReferenceForInsert(
  input: string,
  bookLang: 'es' | 'en' = 'es',
): string | null {
  const ref = parseReference(input);
  if (!ref) return null;
  const name = bookLang === 'es' ? ref.book.name : ref.book.nameEn;
  const verseLabel =
    ref.verse === undefined
      ? ''
      : `:${ref.verse}${ref.verseEnd !== undefined ? `-${ref.verseEnd}` : ''}`;
  return `${name} ${ref.chapter}${verseLabel}`.trim();
}

/**
 * Append a formatted reference to the body prose, starting a new line when
 * the body isn't already empty/newline-terminated. Pure so the "insert a
 * reference" quick action is testable without a live TextInput.
 */
export function insertReferenceText(
  bodyText: string,
  formattedRef: string,
): string {
  if (!bodyText) return `${formattedRef} `;
  const needsNewline = !bodyText.endsWith('\n');
  return `${bodyText}${needsNewline ? '\n' : ''}${formattedRef} `;
}

/**
 * Group verse numbers (unsorted, possibly with duplicates) into contiguous
 * runs, e.g. `[16, 17, 18, 20]` → `[{start:16,end:18}, {start:20,end:20}]`.
 * Pure — used by the verse-picker sheet to decide when a selection collapses
 * into a single "16-18" range vs. staying as separate references.
 */
export function groupContiguousVerses(
  verseNumbers: number[],
): Array<{start: number; end: number}> {
  const sorted = Array.from(new Set(verseNumbers)).sort((a, b) => a - b);
  const runs: Array<{start: number; end: number}> = [];
  for (const n of sorted) {
    const last = runs[runs.length - 1];
    if (last && n === last.end + 1) {
      last.end = n;
    } else {
      runs.push({start: n, end: n});
    }
  }
  return runs;
}

/**
 * Format a verse-picker selection (all from ONE book/chapter) into one or
 * more insertable reference labels, ready for [[insertReferenceText]].
 * Contiguous runs collapse into a single "Book chapter:start-end" label; a
 * gap in the selection (e.g. verses 16 and 18 but not 17) produces SEPARATE
 * labels rather than a comma list — `parseReference`/`linkifyReferences`
 * never round-trip a comma-separated verse list, so emitting one here would
 * silently break the "tap the chip to open the verse" flow later.
 */
export function formatVerseSelectionForInsert(
  bookNameEn: string,
  chapter: number,
  verseNumbers: number[],
  bookLang: 'es' | 'en' = 'es',
): string[] {
  if (verseNumbers.length === 0) return [];
  const book = getBookByName(bookNameEn);
  const name = book
    ? bookLang === 'es'
      ? book.name
      : book.nameEn
    : bookNameEn;
  return groupContiguousVerses(verseNumbers).map(({start, end}) =>
    start === end
      ? `${name} ${chapter}:${start}`
      : `${name} ${chapter}:${start}-${end}`,
  );
}

// ── Defensive parse/serialize, mirroring prepSeries' parsePrepSeriesMap. ────

function coerceSession(value: unknown): SermonNoteSession | null {
  if (!value || typeof value !== 'object') return null;
  const raw = value as {
    id?: unknown;
    title?: unknown;
    source?: unknown;
    bodyText?: unknown;
    createdAt?: unknown;
    updatedAt?: unknown;
  };
  if (typeof raw.id !== 'string' || raw.id.length === 0) return null;
  const title = clampTitle(typeof raw.title === 'string' ? raw.title : '');
  if (!title) return null;
  const source = clampSource(typeof raw.source === 'string' ? raw.source : '');
  const bodyText = clampBody(
    typeof raw.bodyText === 'string' ? raw.bodyText : '',
  );
  const createdAt =
    typeof raw.createdAt === 'number' && Number.isFinite(raw.createdAt)
      ? raw.createdAt
      : 0;
  const updatedAt =
    typeof raw.updatedAt === 'number' && Number.isFinite(raw.updatedAt)
      ? raw.updatedAt
      : createdAt;
  return {
    id: raw.id,
    title,
    ...(source ? {source} : {}),
    bodyText,
    createdAt,
    updatedAt,
  };
}

/**
 * Parse the persisted JSON map, tolerating corruption exactly like
 * `parsePrepSeriesMap`: a bad blob, a non-object root, or a malformed entry
 * yields an empty (or partial) map rather than a throw. Keyed by each
 * session's OWN `id` field (not the raw JSON key); anything beyond
 * `MAX_SESSIONS` is dropped.
 */
export function parseSermonNotesMap(
  raw: string | null | undefined,
): SermonNotesMap {
  if (!raw) return {};
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return {};
  }
  if (!parsed || typeof parsed !== 'object') return {};
  const map: SermonNotesMap = {};
  for (const value of Object.values(parsed as Record<string, unknown>)) {
    if (Object.keys(map).length >= MAX_SESSIONS) break;
    const session = coerceSession(value);
    if (session) map[session.id] = session;
  }
  return map;
}

/** Serialize the map for storage. */
export function serializeSermonNotesMap(map: SermonNotesMap): string {
  return JSON.stringify(map);
}
