/**
 * 📝 prepNotes — the PURE model for the preparer's own words on a "Mesa de
 * preparación" passage (Sprint 103).
 *
 * The assembler ([[prepTable]]) gathers the curated helps; THIS holds what the
 * preparer writes into each outline section — their observations, the single Big
 * Idea, the application they sensed before the Lord. One `PrepNotes` per passage
 * key ("John/3/16-21"), so re-opening a passage restores the work in progress
 * (preparing a sermon is slow, prayerful work — losing it on a navigate-away
 * would be a real loss).
 *
 * Kept React-/storage-free (the [[prepNotesStore]] does the AsyncStorage I/O),
 * mirroring [[feelingsLog]] / [[feelingsLogStore]]. The notes are DEVICE-LOCAL
 * and never leave the phone — a preparer's unfinished study is theirs alone.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import type {PrepSection} from './prepTable';

/** What the preparer wrote for one passage. */
export interface PrepNotes {
  /** Free prose per outline section, keyed by `PrepSection` id. */
  sections: Partial<Record<PrepSection, string>>;
  /** Last-edited epoch ms — lets a future "recent prep" list sort by recency. */
  updatedAt: number;
}

/** The whole device-local store: passage key → the preparer's notes. */
export type PrepNotesMap = Record<string, PrepNotes>;

/** A fresh, empty notes object. */
export function emptyPrepNotes(): PrepNotes {
  return {sections: {}, updatedAt: 0};
}

/** True when nothing has been written (every section blank/whitespace). */
export function isPrepNotesEmpty(notes: PrepNotes | null | undefined): boolean {
  if (!notes) return true;
  return Object.values(notes.sections).every(
    text => !text || text.trim().length === 0,
  );
}

/**
 * Set one section's prose, returning a NEW notes object (immutable update).
 * A blank/whitespace value removes the key so an empty section doesn't linger
 * in storage and `isPrepNotesEmpty` stays honest. `updatedAt` advances to `now`.
 */
export function setSectionNote(
  notes: PrepNotes,
  section: PrepSection,
  text: string,
  now: number = Date.now(),
): PrepNotes {
  const sections = {...notes.sections};
  const trimmed = typeof text === 'string' ? text : '';
  if (trimmed.trim().length === 0) {
    delete sections[section];
  } else {
    sections[section] = trimmed;
  }
  return {sections, updatedAt: now};
}

/** Coerce an unknown value into a clean `PrepNotes` (drops bad fields). */
function coercePrepNotes(value: unknown): PrepNotes | null {
  if (!value || typeof value !== 'object') return null;
  const raw = value as {sections?: unknown; updatedAt?: unknown};
  const sections: Partial<Record<PrepSection, string>> = {};
  if (raw.sections && typeof raw.sections === 'object') {
    for (const [key, text] of Object.entries(
      raw.sections as Record<string, unknown>,
    )) {
      if (typeof text === 'string' && text.trim().length > 0) {
        sections[key as PrepSection] = text;
      }
    }
  }
  const updatedAt =
    typeof raw.updatedAt === 'number' && Number.isFinite(raw.updatedAt)
      ? raw.updatedAt
      : 0;
  return {sections, updatedAt};
}

/**
 * Parse the persisted JSON map, tolerating corruption: a bad blob, a non-object
 * root, or any malformed entry yields an empty (or partial) map rather than a
 * throw — the preparer should never lose the whole store to one bad row.
 */
export function parsePrepNotesMap(
  raw: string | null | undefined,
): PrepNotesMap {
  if (!raw) return {};
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return {};
  }
  if (!parsed || typeof parsed !== 'object') return {};
  const map: PrepNotesMap = {};
  for (const [key, value] of Object.entries(
    parsed as Record<string, unknown>,
  )) {
    const notes = coercePrepNotes(value);
    if (notes && !isPrepNotesEmpty(notes)) map[key] = notes;
  }
  return map;
}

/** Serialize the map for storage. */
export function serializePrepNotesMap(map: PrepNotesMap): string {
  return JSON.stringify(map);
}

/**
 * Apply a section edit to the map under `passageKey`, returning a NEW map. An
 * edit that empties the last section drops the passage entry entirely, so the
 * store doesn't accumulate hollow rows.
 */
export function setMapSectionNote(
  map: PrepNotesMap,
  passageKey: string,
  section: PrepSection,
  text: string,
  now: number = Date.now(),
): PrepNotesMap {
  const current = map[passageKey] ?? emptyPrepNotes();
  const next = setSectionNote(current, section, text, now);
  const out = {...map};
  if (isPrepNotesEmpty(next)) {
    delete out[passageKey];
  } else {
    out[passageKey] = next;
  }
  return out;
}
