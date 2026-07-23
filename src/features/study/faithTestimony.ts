/**
 * 📖 faithTestimony — the PURE model behind "Mi testimonio" ("Comparte tu
 * fe" Part 3, free tier).
 *
 * A guided-but-NOT-scripted writing surface: three structured prompts —
 * "¿Cómo era tu vida antes?" / "¿Qué cambió?" / "¿Cómo es tu vida ahora?" —
 * that only give the writer STRUCTURE to organize their own testimony, the
 * same non-prescriptive posture already established for prayer ([[prepTable]]
 * never writes the sermon; the prayer companion never writes the prayer) and
 * for preaching prep in this codebase. This module NEVER supplies example
 * sentences, suggested wording, or generated text of any kind — every field
 * is the writer's own words, or it's empty.
 *
 * SHAPE mirrors [[sermonNotes]] (a named record with `id`/`createdAt`/
 * `updatedAt`, kept in a device-local map, most-recently-updated first,
 * defensive parse/serialize) — that free-tier sermon note-taking model is
 * never imported here, this is its own independent, ungated model built the
 * same way. A writer may keep several testimony drafts (e.g. a shorter
 * version for a stranger vs. a fuller one for a small group), same as a
 * listener keeps many sermon note sessions.
 *
 * 100% DEVICE-LOCAL (AsyncStorage only, see [[faithTestimonyStore]]) — a
 * believer's own testimony is private, personal content that never needs to
 * leave the device on its own; only the rendered share-image leaves the
 * device, and only when the writer explicitly chooses to share it (see the
 * testimony editor screen, which reuses the already-shipped, already-free
 * `TestimonyImageModal` share pipeline).
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

/** One "Mi testimonio" writing session — three structured, free-text sections. */
export interface FaithTestimonySession {
  id: string;
  /** Short title — defaults to the creation date (`defaultTestimonyTitle`). */
  title: string;
  /** "¿Cómo era tu vida antes?" — the writer's own words, or empty. */
  before: string;
  /** "¿Qué cambió?" — the writer's own words, or empty. */
  change: string;
  /** "¿Cómo es tu vida ahora?" — the writer's own words, or empty. */
  now: string;
  createdAt: number;
  updatedAt: number;
}

/** Partial edits applied by the autosaving editor — any subset of fields. */
export interface FaithTestimonyDraft {
  title?: string;
  before?: string;
  change?: string;
  now?: string;
}

/** The whole device-local store: session id → the session. */
export type FaithTestimonyMap = Record<string, FaithTestimonySession>;

/**
 * Cap — generous for a lifetime of testimony drafts (50 is far more than
 * anyone needs) while keeping the device-local JSON blob bounded. Not a hard
 * product requirement — a deliberate, adjustable backstop, same spirit as
 * [[sermonNotes]]'s `MAX_SESSIONS`.
 */
export const MAX_TESTIMONY_SESSIONS = 50;
/** Defensive cap on a session's own title length. */
export const MAX_TITLE_LENGTH = 100;
/**
 * Defensive cap on each of the three sections — generous enough for a full
 * page of testimony prose per section.
 */
export const MAX_SECTION_LENGTH = 6000;

/** A fresh, empty map. */
export function emptyFaithTestimonyMap(): FaithTestimonyMap {
  return {};
}

/** A reasonably-unique id, same shape as other device-local records in this app. */
export function generateFaithTestimonyId(): string {
  return `testimony_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function clampTitle(title: string): string {
  return typeof title === 'string'
    ? title.trim().slice(0, MAX_TITLE_LENGTH)
    : '';
}

function clampSection(text: string): string {
  return typeof text === 'string' ? text.slice(0, MAX_SECTION_LENGTH) : '';
}

/** True while the map has room for one more session. */
export function canCreateTestimonySession(map: FaithTestimonyMap): boolean {
  return Object.keys(map).length < MAX_TESTIMONY_SESSIONS;
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
 * 2026"), device-local (never UTC) — same format as [[sermonNotes]]'s
 * `formatSessionDateLabel`, kept as an independent copy so this module has
 * no runtime dependency on the sermon-notes feature.
 */
export function formatTestimonyDateLabel(
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
export function defaultTestimonyTitle(
  now: number = Date.now(),
  lang: 'es' | 'en' = 'es',
): string {
  return formatTestimonyDateLabel(now, lang);
}

/**
 * Create a new session and add it to the map. A no-op (returns `map`
 * unchanged) for a blank title or once `MAX_TESTIMONY_SESSIONS` is reached —
 * screens should check `canCreateTestimonySession` first for a real "llegaste
 * al máximo" message; this is just the defensive backstop.
 */
export function createTestimonySession(
  map: FaithTestimonyMap,
  title: string,
  now: number = Date.now(),
  id: string = generateFaithTestimonyId(),
): FaithTestimonyMap {
  const trimmedTitle = clampTitle(title);
  if (!trimmedTitle || !canCreateTestimonySession(map)) return map;
  const session: FaithTestimonySession = {
    id,
    title: trimmedTitle,
    before: '',
    change: '',
    now: '',
    createdAt: now,
    updatedAt: now,
  };
  return {...map, [id]: session};
}

/**
 * Apply a partial edit to an existing session. A no-op for an unknown id.
 * `title`, when provided blank/whitespace-only, is IGNORED (keeps the
 * previous title — a session always keeps some title, mirroring
 * [[sermonNotes]]'s `updateSession`). Each of `before`/`change`/`now`, when
 * provided, always replaces the previous value (clamped) — an empty string
 * is a valid, meaningful value (the writer hasn't answered that prompt yet).
 */
export function updateTestimonySession(
  map: FaithTestimonyMap,
  id: string,
  patch: FaithTestimonyDraft,
  now: number = Date.now(),
): FaithTestimonyMap {
  const session = map[id];
  if (!session) return map;
  const next: FaithTestimonySession = {...session, updatedAt: now};

  if (patch.title !== undefined) {
    const trimmed = clampTitle(patch.title);
    if (trimmed) next.title = trimmed;
  }
  if (patch.before !== undefined) next.before = clampSection(patch.before);
  if (patch.change !== undefined) next.change = clampSection(patch.change);
  if (patch.now !== undefined) next.now = clampSection(patch.now);

  return {...map, [id]: next};
}

/** Delete a whole session. A no-op for an unknown id. */
export function deleteTestimonySession(
  map: FaithTestimonyMap,
  id: string,
): FaithTestimonyMap {
  if (!map[id]) return map;
  const next = {...map};
  delete next[id];
  return next;
}

/** All sessions, most-recently-updated first (same convention as [[sermonNotes]]). */
export function listTestimonySessions(
  map: FaithTestimonyMap,
): FaithTestimonySession[] {
  return Object.values(map).sort((a, b) => b.updatedAt - a.updatedAt);
}

/** True once the writer has put down at least a few words in any section. */
export function hasTestimonyContent(session: FaithTestimonySession): boolean {
  return Boolean(
    session.before.trim() || session.change.trim() || session.now.trim(),
  );
}

/**
 * Compose the three sections into one flowing block of the writer's OWN
 * prose, ready to hand to the share-image card as a single `testimony`
 * string — plain paragraph breaks only, no headings/labels injected (a
 * heading like "Before:" baked into the shared image would look like part of
 * the writer's own words rather than the app's scaffold). Empty sections are
 * skipped rather than left as blank paragraphs. Pure — testable without the
 * share pipeline.
 */
export function buildTestimonyText(session: FaithTestimonySession): string {
  return [session.before, session.change, session.now]
    .map(part => part.trim())
    .filter(Boolean)
    .join('\n\n');
}

// ── Defensive parse/serialize, mirroring sermonNotes' parseSermonNotesMap. ─

function coerceSession(value: unknown): FaithTestimonySession | null {
  if (!value || typeof value !== 'object') return null;
  const raw = value as {
    id?: unknown;
    title?: unknown;
    before?: unknown;
    change?: unknown;
    now?: unknown;
    createdAt?: unknown;
    updatedAt?: unknown;
  };
  if (typeof raw.id !== 'string' || raw.id.length === 0) return null;
  const title = clampTitle(typeof raw.title === 'string' ? raw.title : '');
  if (!title) return null;
  const before = clampSection(typeof raw.before === 'string' ? raw.before : '');
  const change = clampSection(typeof raw.change === 'string' ? raw.change : '');
  const now = clampSection(typeof raw.now === 'string' ? raw.now : '');
  const createdAt =
    typeof raw.createdAt === 'number' && Number.isFinite(raw.createdAt)
      ? raw.createdAt
      : 0;
  const updatedAt =
    typeof raw.updatedAt === 'number' && Number.isFinite(raw.updatedAt)
      ? raw.updatedAt
      : createdAt;
  return {id: raw.id, title, before, change, now, createdAt, updatedAt};
}

/**
 * Parse the persisted JSON map, tolerating corruption exactly like
 * `parseSermonNotesMap`: a bad blob, a non-object root, or a malformed entry
 * yields an empty (or partial) map rather than a throw. Keyed by each
 * session's OWN `id` field (not the raw JSON key); anything beyond
 * `MAX_TESTIMONY_SESSIONS` is dropped.
 */
export function parseFaithTestimonyMap(
  raw: string | null | undefined,
): FaithTestimonyMap {
  if (!raw) return {};
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return {};
  }
  if (!parsed || typeof parsed !== 'object') return {};
  const map: FaithTestimonyMap = {};
  for (const value of Object.values(parsed as Record<string, unknown>)) {
    if (Object.keys(map).length >= MAX_TESTIMONY_SESSIONS) break;
    const session = coerceSession(value);
    if (session) map[session.id] = session;
  }
  return map;
}

/** Serialize the map for storage. */
export function serializeFaithTestimonyMap(map: FaithTestimonyMap): string {
  return JSON.stringify(map);
}
