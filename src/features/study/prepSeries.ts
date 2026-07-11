/**
 * 📚 prepSeries — the PURE model for the "Series de predicación" planner
 * (T8.4.4), the fourth slice of the premium "Mesa de preparación" tanda
 * (T8.4).
 *
 * A pastor/teacher planning a multi-week series (e.g. "Efesios en 8
 * semanas") needs to group several passages together, in order, and see at
 * a glance which ones already have preparation started. This module is
 * exactly that grouping — a named, ordered list of `passageKey`s
 * ([[prepTable]]'s `formatPassageKey`, e.g. "John/3/16-21") — kept
 * React-/storage-free (the [[prepSeriesStore]] does the AsyncStorage I/O),
 * mirroring [[prepNotes]] / [[prepNotesStore]].
 *
 * "Progress" is NOT a new tracking mechanism: a passage counts as "started"
 * when its OWN prep notes ([[prepNotes]]'s `isPrepNotesEmpty`) are
 * non-empty — `computeSeriesProgress` only reads that existing per-passage
 * state, the exact same reuse principle T8.4.1's history screen already
 * established (lean on data already saved, never invent new tracking).
 *
 * 100% DEVICE-LOCAL, same as every other prep artifact — a series plan is
 * only the preparer's own, never synced (see [[prepSeriesStore]]). Pure
 * organization/ordering of passages the preparer picks; nothing here
 * generates or suggests content, so the app's "never write the sermon"
 * guardrail (Jeremías 23:30-32) doesn't apply to this module.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import {parseReference} from '@lib/references/parseReference';
import {normalizePassage, formatPassageKey} from './prepTable';
import {isPrepNotesEmpty} from './prepNotes';
import type {PrepNotesMap} from './prepNotes';

/** Optional per-passage scheduling metadata, keyed by canonical passageKey. */
export interface SeriesPassageSchedule {
  /** Target preaching date, calendar-only "YYYY-MM-DD" (no time, no timezone). */
  date?: string;
  /** Short scheduling annotation — NOT the sermon prose (that's [[prepNotes]]). */
  note?: string;
}

/** One named, ordered group of passages the preparer is planning through. */
export interface PrepSeries {
  id: string;
  name: string;
  /** Canonical `passageKey`s, in the order the preparer plans to teach them. */
  passageKeys: string[];
  /**
   * Optional per-passage scheduling, keyed by `passageKey`. Kept as a side-map
   * (not folded into `passageKeys`) precisely so it can never desync from a
   * reorder: order lives in `passageKeys`, this is pure per-key metadata.
   * Absent on legacy/unscheduled series — a new app reads an old blob as
   * "no schedule", and an old app reads a new blob by simply ignoring this
   * field, so both directions degrade gracefully.
   */
  schedule?: Record<string, SeriesPassageSchedule>;
  createdAt: number;
  updatedAt: number;
}

/** A passage plus its resolved (optional) schedule — a read-only projection. */
export interface ScheduledPassage {
  key: string;
  date?: string;
  note?: string;
}

/** The whole device-local store: series id → the series. */
export type PrepSeriesMap = Record<string, PrepSeries>;

/**
 * Caps — generous for genuine sermon-series planning (a year-long series
 * through a Gospel is well under 30 passages; keeping 20 active series at
 * once is already an unusual amount of forward planning) while keeping the
 * device-local JSON blob small and every list screen boundable. Not a hard
 * requirement from product — just a sane, adjustable backstop so the store
 * never grows without limit.
 */
export const MAX_SERIES = 20;
export const MAX_PASSAGES_PER_SERIES = 30;
/** Defensive cap on a series' own name length. */
export const MAX_SERIES_NAME_LENGTH = 80;
/** Defensive cap on a per-passage schedule note (a short annotation, not prose). */
export const MAX_SERIES_PASSAGE_NOTE_LENGTH = 140;

/** A fresh, empty map. */
export function emptySeriesMap(): PrepSeriesMap {
  return {};
}

/** A reasonably-unique id, same shape as other device-local records in this app. */
export function generateSeriesId(): string {
  return `series_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function clampName(name: string): string {
  return typeof name === 'string'
    ? name.trim().slice(0, MAX_SERIES_NAME_LENGTH)
    : '';
}

function dedupeKeys(keys: readonly string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const key of keys) {
    if (typeof key !== 'string' || key.length === 0) continue;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(key);
  }
  return out;
}

/**
 * Validates a "YYYY-MM-DD" string is a REAL calendar date (rejects e.g.
 * "2026-13-40"). Calendar-only by design — no time, no timezone — so a stored
 * date never shifts a day when round-tripped through a device-local clock.
 * Mirrors the day-string convention used elsewhere (achievements/streak).
 */
export function isValidDateKey(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!m) return false;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  const dt = new Date(y, mo - 1, d);
  return (
    dt.getFullYear() === y && dt.getMonth() === mo - 1 && dt.getDate() === d
  );
}

function clampScheduleNote(note: string): string {
  return typeof note === 'string'
    ? note.trim().slice(0, MAX_SERIES_PASSAGE_NOTE_LENGTH)
    : '';
}

/** True while the map has room for one more series. */
export function canCreateSeries(map: PrepSeriesMap): boolean {
  return Object.keys(map).length < MAX_SERIES;
}

/** True while a series has room for one more passage. */
export function canAddPassage(series: PrepSeries): boolean {
  return series.passageKeys.length < MAX_PASSAGES_PER_SERIES;
}

/**
 * Create a new series and add it to the map. A no-op (returns `map`
 * unchanged) for a blank name or once `MAX_SERIES` is reached — screens
 * should check `canCreateSeries` first to give the preparer real feedback;
 * this is just the defensive backstop.
 */
export function createSeries(
  map: PrepSeriesMap,
  name: string,
  passageKeys: readonly string[] = [],
  now: number = Date.now(),
  id: string = generateSeriesId(),
): PrepSeriesMap {
  const trimmed = clampName(name);
  if (!trimmed || !canCreateSeries(map)) return map;
  const series: PrepSeries = {
    id,
    name: trimmed,
    passageKeys: dedupeKeys(passageKeys).slice(0, MAX_PASSAGES_PER_SERIES),
    createdAt: now,
    updatedAt: now,
  };
  return {...map, [id]: series};
}

/** Rename a series. A no-op for an unknown id or a blank name. */
export function renameSeries(
  map: PrepSeriesMap,
  id: string,
  name: string,
  now: number = Date.now(),
): PrepSeriesMap {
  const series = map[id];
  const trimmed = clampName(name);
  if (!series || !trimmed) return map;
  return {...map, [id]: {...series, name: trimmed, updatedAt: now}};
}

/**
 * Append a passage to a series (no duplicates). A no-op for an unknown id,
 * a passage already in the series, or a series already at
 * `MAX_PASSAGES_PER_SERIES`.
 */
export function addPassageToSeries(
  map: PrepSeriesMap,
  id: string,
  passageKey: string,
  now: number = Date.now(),
): PrepSeriesMap {
  const series = map[id];
  if (!series || !passageKey) return map;
  if (series.passageKeys.includes(passageKey)) return map;
  if (!canAddPassage(series)) return map;
  return {
    ...map,
    [id]: {
      ...series,
      passageKeys: [...series.passageKeys, passageKey],
      updatedAt: now,
    },
  };
}

/**
 * Remove a passage from a series. A no-op if it isn't there. Also drops any
 * schedule entry for that passage so the side-map never keeps orphans.
 */
export function removePassageFromSeries(
  map: PrepSeriesMap,
  id: string,
  passageKey: string,
  now: number = Date.now(),
): PrepSeriesMap {
  const series = map[id];
  if (!series || !series.passageKeys.includes(passageKey)) return map;
  let nextSchedule = series.schedule;
  if (nextSchedule && passageKey in nextSchedule) {
    nextSchedule = {...nextSchedule};
    delete nextSchedule[passageKey];
  }
  return {
    ...map,
    [id]: {
      ...series,
      passageKeys: series.passageKeys.filter(key => key !== passageKey),
      ...(nextSchedule ? {schedule: nextSchedule} : {}),
      updatedAt: now,
    },
  };
}

/**
 * Move a passage one slot toward the start ('up') or end ('down') of the
 * series — how the preparer reorders "week 1, week 2, …" without a drag
 * gesture. A no-op at either edge or for an unknown passage/series.
 */
export function moveSeriesPassage(
  map: PrepSeriesMap,
  id: string,
  passageKey: string,
  direction: 'up' | 'down',
  now: number = Date.now(),
): PrepSeriesMap {
  const series = map[id];
  if (!series) return map;
  const index = series.passageKeys.indexOf(passageKey);
  if (index < 0) return map;
  const swapWith = direction === 'up' ? index - 1 : index + 1;
  if (swapWith < 0 || swapWith >= series.passageKeys.length) return map;
  const next = [...series.passageKeys];
  [next[index], next[swapWith]] = [next[swapWith], next[index]];
  return {...map, [id]: {...series, passageKeys: next, updatedAt: now}};
}

/**
 * Set (or clear, with `date === null`) the target preaching date for a
 * passage. A no-op for an unknown series, a passage not in the series, or an
 * invalid date string. Clearing a date that leaves an empty schedule entry
 * drops the entry entirely.
 */
export function setSeriesPassageDate(
  map: PrepSeriesMap,
  id: string,
  passageKey: string,
  date: string | null,
  now: number = Date.now(),
): PrepSeriesMap {
  const series = map[id];
  if (!series || !series.passageKeys.includes(passageKey)) return map;
  if (date !== null && !isValidDateKey(date)) return map;
  const nextSchedule = {...(series.schedule ?? {})};
  const entry: SeriesPassageSchedule = {...nextSchedule[passageKey]};
  if (date === null) {
    delete entry.date;
  } else {
    entry.date = date;
  }
  if (entry.date === undefined && entry.note === undefined) {
    delete nextSchedule[passageKey];
  } else {
    nextSchedule[passageKey] = entry;
  }
  return {...map, [id]: {...series, schedule: nextSchedule, updatedAt: now}};
}

/**
 * Set (or clear, with an empty string) a passage's short schedule note. A
 * no-op for an unknown series or a passage not in the series.
 */
export function setSeriesPassageNote(
  map: PrepSeriesMap,
  id: string,
  passageKey: string,
  note: string,
  now: number = Date.now(),
): PrepSeriesMap {
  const series = map[id];
  if (!series || !series.passageKeys.includes(passageKey)) return map;
  const trimmed = clampScheduleNote(note);
  const nextSchedule = {...(series.schedule ?? {})};
  const entry: SeriesPassageSchedule = {...nextSchedule[passageKey]};
  if (trimmed) {
    entry.note = trimmed;
  } else {
    delete entry.note;
  }
  if (entry.date === undefined && entry.note === undefined) {
    delete nextSchedule[passageKey];
  } else {
    nextSchedule[passageKey] = entry;
  }
  return {...map, [id]: {...series, schedule: nextSchedule, updatedAt: now}};
}

/** The series' passages in the preparer's manual order, each with its schedule. */
export function seriesPassages(series: PrepSeries): ScheduledPassage[] {
  const schedule = series.schedule ?? {};
  return series.passageKeys.map(key => ({key, ...schedule[key]}));
}

/**
 * A read-only projection sorted for a "preaching calendar": dated passages
 * first, ascending by date (a "YYYY-MM-DD" string sorts chronologically as
 * plain text, so no `Date` round-trip and no timezone drift), then undated
 * passages in their existing manual order. NEVER mutates the series — the
 * manual `passageKeys` order the preparer set stays authoritative.
 */
export function passagesSortedByDate(series: PrepSeries): ScheduledPassage[] {
  const passages = seriesPassages(series);
  const dated = passages
    .filter(p => p.date !== undefined)
    .sort((a, b) =>
      a.date === b.date ? 0 : (a.date as string) < (b.date as string) ? -1 : 1,
    );
  const undated = passages.filter(p => p.date === undefined);
  return [...dated, ...undated];
}

/** Delete a whole series. A no-op for an unknown id. Never touches prep notes. */
export function deleteSeries(map: PrepSeriesMap, id: string): PrepSeriesMap {
  if (!map[id]) return map;
  const next = {...map};
  delete next[id];
  return next;
}

/** All series, most-recently-updated first (same convention as [[prepHistory]]). */
export function listSeries(map: PrepSeriesMap): PrepSeries[] {
  return Object.values(map).sort((a, b) => b.updatedAt - a.updatedAt);
}

/** How much of a series' preparation is under way. */
export interface SeriesProgress {
  total: number;
  /** Passages whose own prep notes are non-empty. */
  started: number;
}

/**
 * Reads whether each of the series' passages already has non-empty prep
 * notes — NOT a new tracking mechanism, just a lookup into the notes the
 * preparer already saved via the single-passage Mesa de preparación.
 */
export function computeSeriesProgress(
  series: PrepSeries,
  notesMap: PrepNotesMap,
): SeriesProgress {
  const total = series.passageKeys.length;
  const started = series.passageKeys.filter(
    key => !isPrepNotesEmpty(notesMap[key]),
  ).length;
  return {total, started};
}

// ── Defensive parse/serialize, mirroring prepNotes' parsePrepNotesMap. ──────

/**
 * Coerce a persisted schedule blob: keep only entries whose key is still a
 * passage in the series, validate each date, clamp each note, and drop empty
 * entries. Returns undefined when nothing survives, so the field stays absent
 * on unscheduled series.
 */
function coerceSchedule(
  value: unknown,
  passageKeys: readonly string[],
): Record<string, SeriesPassageSchedule> | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const allowed = new Set(passageKeys);
  const out: Record<string, SeriesPassageSchedule> = {};
  for (const [key, entryValue] of Object.entries(
    value as Record<string, unknown>,
  )) {
    if (!allowed.has(key)) continue;
    if (!entryValue || typeof entryValue !== 'object') continue;
    const e = entryValue as {date?: unknown; note?: unknown};
    const entry: SeriesPassageSchedule = {};
    if (isValidDateKey(e.date)) entry.date = e.date;
    if (typeof e.note === 'string') {
      const n = clampScheduleNote(e.note);
      if (n) entry.note = n;
    }
    if (entry.date !== undefined || entry.note !== undefined) out[key] = entry;
  }
  return Object.keys(out).length > 0 ? out : undefined;
}

function coerceSeries(value: unknown): PrepSeries | null {
  if (!value || typeof value !== 'object') return null;
  const raw = value as {
    id?: unknown;
    name?: unknown;
    passageKeys?: unknown;
    schedule?: unknown;
    createdAt?: unknown;
    updatedAt?: unknown;
  };
  if (typeof raw.id !== 'string' || raw.id.length === 0) return null;
  const name = clampName(typeof raw.name === 'string' ? raw.name : '');
  if (!name) return null;
  const passageKeys = Array.isArray(raw.passageKeys)
    ? dedupeKeys(
        raw.passageKeys.filter((k): k is string => typeof k === 'string'),
      ).slice(0, MAX_PASSAGES_PER_SERIES)
    : [];
  const schedule = coerceSchedule(raw.schedule, passageKeys);
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
    name,
    passageKeys,
    ...(schedule ? {schedule} : {}),
    createdAt,
    updatedAt,
  };
}

/**
 * Parse the persisted JSON map, tolerating corruption exactly like
 * `parsePrepNotesMap`: a bad blob, a non-object root, or a malformed entry
 * yields an empty (or partial) map rather than a throw. Keyed by each
 * series' OWN `id` field (not the raw JSON key) so a hand-edited or
 * corrupted key never desyncs the map from its entries; anything beyond
 * `MAX_SERIES` is dropped.
 */
export function parsePrepSeriesMap(
  raw: string | null | undefined,
): PrepSeriesMap {
  if (!raw) return {};
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return {};
  }
  if (!parsed || typeof parsed !== 'object') return {};
  const map: PrepSeriesMap = {};
  for (const value of Object.values(parsed as Record<string, unknown>)) {
    if (Object.keys(map).length >= MAX_SERIES) break;
    const series = coerceSeries(value);
    if (series) map[series.id] = series;
  }
  return map;
}

/** Serialize the map for storage. */
export function serializePrepSeriesMap(map: PrepSeriesMap): string {
  return JSON.stringify(map);
}

/**
 * Parse a free-typed reference ("Juan 3:16-21", "Romans 8:28") into the
 * SAME canonical `passageKey` format the rest of "Mesa de preparación" uses
 * ([[prepTable]]'s `formatPassageKey`) — never a new format. Requires an
 * explicit verse: a chapter-only reference ("Juan 3") has no defined start
 * verse without a per-chapter verse-count DB lookup, which this pure module
 * intentionally doesn't have. Returns null for anything that doesn't
 * resolve.
 */
export function passageKeyFromReference(input: string): string | null {
  const ref = parseReference(input);
  if (!ref || ref.verse === undefined) return null;
  const passage = normalizePassage(
    ref.book.nameEn,
    ref.chapter,
    ref.verse,
    ref.verseEnd,
  );
  return passage ? formatPassageKey(passage) : null;
}
