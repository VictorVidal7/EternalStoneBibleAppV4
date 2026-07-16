/**
 * 💡 prepIllustrations — the PURE model for the "Banco de ilustraciones"
 * (Tanda 4), a slice of the premium pastors/teachers "Mesa de preparación"
 * track.
 *
 * A preacher collects illustrations, quotes, and analogies over years —
 * a historical anecdote here, a scientist's quote there, a personal
 * testimony worth reusing — and today has nowhere in the app to keep them.
 * This module is that personal bank: a flat collection of short, self-written
 * snippets ([[PrepIllustration]]), each tagged with ONE of a fixed set of 7
 * categories (never free-text tags — same fixed-enum discipline as
 * [[prayer]]'s `PrayerCategory`), searchable by title/body substring, listed
 * most-recently-updated first.
 *
 * Kept React-/storage-free (the [[prepIllustrationsStore]] does the
 * AsyncStorage I/O), mirroring [[prepSeries]] (map-keyed-by-id, defensive
 * parse/serialize, `MAX_*` caps) for STRUCTURE and [[prayer]] (fixed category
 * enum + `isX` narrowing + per-category icon/accent metadata) for the
 * CATEGORY taxonomy.
 *
 * A fresh illustration is created BLANK (no upfront "name required" modal,
 * unlike [[prepSeries]]) — the editor screen fills in title/body/category
 * afterward field-by-field, autosaving exactly like [[prepNotesStore]]'s
 * per-section `savePrepNote`. Nothing here auto-deletes an emptied entry
 * (unlike [[prepNotes]]'s auto-vanish-on-empty): the screen decides that
 * policy for an abandoned blank creation; this module stays dumb CRUD.
 *
 * 100% DEVICE-LOCAL, same privacy-first stance as every other prep artifact —
 * an illustration bank is the preparer's own private library, never synced
 * (see [[prepIllustrationsStore]]). Pure organization of material the
 * preparer wrote themselves; nothing here generates or suggests content, so
 * the app's "never write the sermon" guardrail (Jeremías 23:30-32) doesn't
 * apply to this module.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

/**
 * The seven fixed categories a preacher's illustration can be filed under —
 * a closed set (never free-text tags), same discipline as [[prayer]]'s
 * `PrayerCategory`. Labels live in i18n (`t.prepIllustrations.categories[id]`).
 */
export type IllustrationCategory =
  | 'historical'
  | 'scienceNature'
  | 'testimony'
  | 'quote'
  | 'analogy'
  | 'currentEvents'
  | 'humor';

/** Display order for the category chips (filter row + editor picker). */
export const ILLUSTRATION_CATEGORY_ORDER: readonly IllustrationCategory[] = [
  'historical',
  'scienceNature',
  'testimony',
  'quote',
  'analogy',
  'currentEvents',
  'humor',
];

/** Per-category icon + accent, theme-independent (mirrors `PrayerCategoryMeta`). */
export interface IllustrationCategoryMeta {
  id: IllustrationCategory;
  /** Ionicons glyph for the category chip/badge. */
  icon: string;
  /** Accent hue (hex) — semantic per category, stable across themes. */
  accent: string;
}

export const ILLUSTRATION_CATEGORY_META: Record<
  IllustrationCategory,
  IllustrationCategoryMeta
> = {
  historical: {id: 'historical', icon: 'time-outline', accent: '#b45309'},
  scienceNature: {
    id: 'scienceNature',
    icon: 'leaf-outline',
    accent: '#10b981',
  },
  testimony: {id: 'testimony', icon: 'person-outline', accent: '#6366f1'},
  quote: {id: 'quote', icon: 'chatbox-outline', accent: '#8b5cf6'},
  analogy: {id: 'analogy', icon: 'bulb-outline', accent: '#f59e0b'},
  currentEvents: {
    id: 'currentEvents',
    icon: 'newspaper-outline',
    accent: '#0ea5e9',
  },
  humor: {id: 'humor', icon: 'happy-outline', accent: '#f472b6'},
};

/** Narrow an arbitrary value to a known {@link IllustrationCategory}. */
export function isIllustrationCategory(
  value: unknown,
): value is IllustrationCategory {
  return (
    typeof value === 'string' &&
    Object.prototype.hasOwnProperty.call(ILLUSTRATION_CATEGORY_META, value)
  );
}

/** The category a freshly created (still-blank) illustration starts with. */
export const DEFAULT_ILLUSTRATION_CATEGORY: IllustrationCategory = 'analogy';

/** One saved illustration/quote in the preacher's personal bank. */
export interface PrepIllustration {
  id: string;
  /** Short label shown in the list row (e.g. "El reloj y el relojero"). */
  title: string;
  /** The illustration/quote/anecdote itself, in the preacher's own words. */
  body: string;
  category: IllustrationCategory;
  createdAt: number;
  updatedAt: number;
}

/** The whole device-local store: illustration id → the illustration. */
export type PrepIllustrationsMap = Record<string, PrepIllustration>;

/**
 * Cap — generous for a genuine personal library built up over years (a
 * preacher reusing illustrations across a lifetime of sermons is unlikely to
 * exceed a couple hundred distinct ones) while keeping the device-local JSON
 * blob small and the list screen boundable. Not a hard product requirement —
 * just a sane, adjustable backstop so the store never grows without limit.
 */
export const MAX_ILLUSTRATIONS = 200;
/** Defensive cap on an illustration's own title length. */
export const MAX_ILLUSTRATION_TITLE_LENGTH = 120;
/** Defensive cap on an illustration's body — generous (a full anecdote/quote
 * easily fits), but bounded so a corrupt paste can't bloat device storage. */
export const MAX_ILLUSTRATION_BODY_LENGTH = 4000;

/** A fresh, empty map. */
export function emptyIllustrationsMap(): PrepIllustrationsMap {
  return {};
}

/** A reasonably-unique id, same shape as other device-local records in this app. */
export function generateIllustrationId(): string {
  return `illustration_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function clampTitle(title: string): string {
  return typeof title === 'string'
    ? title.trim().slice(0, MAX_ILLUSTRATION_TITLE_LENGTH)
    : '';
}

function clampBody(body: string): string {
  return typeof body === 'string'
    ? body.trim().slice(0, MAX_ILLUSTRATION_BODY_LENGTH)
    : '';
}

/** True when neither title nor body has any real content. */
export function isIllustrationEmpty(title: string, body: string): boolean {
  return (
    (typeof title !== 'string' || title.trim().length === 0) &&
    (typeof body !== 'string' || body.trim().length === 0)
  );
}

/** True while the map has room for one more illustration. */
export function canCreateIllustration(map: PrepIllustrationsMap): boolean {
  return Object.keys(map).length < MAX_ILLUSTRATIONS;
}

/**
 * Create a BLANK illustration and add it to the map immediately — mirrors
 * [[prepNotes]]'s "no name required upfront" idiom (NOT [[prepSeries]]'s
 * name-required creation modal): the editor screen fills in
 * title/body/category afterward via autosave. A no-op once
 * `MAX_ILLUSTRATIONS` is reached — callers should check
 * `canCreateIllustration` first for real "banco lleno" feedback.
 */
export function createIllustration(
  map: PrepIllustrationsMap,
  now: number = Date.now(),
  id: string = generateIllustrationId(),
  category: IllustrationCategory = DEFAULT_ILLUSTRATION_CATEGORY,
): PrepIllustrationsMap {
  if (!canCreateIllustration(map)) return map;
  const item: PrepIllustration = {
    id,
    title: '',
    body: '',
    category: isIllustrationCategory(category)
      ? category
      : DEFAULT_ILLUSTRATION_CATEGORY,
    createdAt: now,
    updatedAt: now,
  };
  return {...map, [id]: item};
}

/** Set an illustration's title. A no-op for an unknown id. */
export function setIllustrationTitle(
  map: PrepIllustrationsMap,
  id: string,
  title: string,
  now: number = Date.now(),
): PrepIllustrationsMap {
  const existing = map[id];
  if (!existing) return map;
  return {
    ...map,
    [id]: {...existing, title: clampTitle(title), updatedAt: now},
  };
}

/** Set an illustration's body. A no-op for an unknown id. */
export function setIllustrationBody(
  map: PrepIllustrationsMap,
  id: string,
  body: string,
  now: number = Date.now(),
): PrepIllustrationsMap {
  const existing = map[id];
  if (!existing) return map;
  return {
    ...map,
    [id]: {...existing, body: clampBody(body), updatedAt: now},
  };
}

/** Set an illustration's category. A no-op for an unknown id or invalid category. */
export function setIllustrationCategory(
  map: PrepIllustrationsMap,
  id: string,
  category: IllustrationCategory,
  now: number = Date.now(),
): PrepIllustrationsMap {
  const existing = map[id];
  if (!existing || !isIllustrationCategory(category)) return map;
  return {...map, [id]: {...existing, category, updatedAt: now}};
}

/** Delete an illustration. A no-op for an unknown id. */
export function deleteIllustration(
  map: PrepIllustrationsMap,
  id: string,
): PrepIllustrationsMap {
  if (!map[id]) return map;
  const next = {...map};
  delete next[id];
  return next;
}

/** All illustrations, most-recently-updated first (same convention as [[prepSeries]]'s `listSeries`). */
export function listIllustrations(
  map: PrepIllustrationsMap,
): PrepIllustration[] {
  return Object.values(map).sort((a, b) => b.updatedAt - a.updatedAt);
}

/** Simple case-insensitive substring match over title + body. Blank query returns the list unchanged. */
export function searchIllustrations(
  list: readonly PrepIllustration[],
  query: string,
): PrepIllustration[] {
  const q = typeof query === 'string' ? query.trim().toLowerCase() : '';
  if (!q) return [...list];
  return list.filter(
    item =>
      item.title.toLowerCase().includes(q) ||
      item.body.toLowerCase().includes(q),
  );
}

/** Filter a list to one category (or pass `'all'` for no filter). */
export function filterIllustrationsByCategory(
  list: readonly PrepIllustration[],
  category: IllustrationCategory | 'all',
): PrepIllustration[] {
  if (category === 'all') return [...list];
  return list.filter(item => item.category === category);
}

// ── Defensive parse/serialize, mirroring prepSeries' parsePrepSeriesMap. ────

function coerceIllustration(value: unknown): PrepIllustration | null {
  if (!value || typeof value !== 'object') return null;
  const raw = value as {
    id?: unknown;
    title?: unknown;
    body?: unknown;
    category?: unknown;
    createdAt?: unknown;
    updatedAt?: unknown;
  };
  if (typeof raw.id !== 'string' || raw.id.length === 0) return null;
  // Blank title/body is a VALID state (a freshly created, not-yet-filled-in
  // illustration) — unlike prepSeries' name, nothing here requires non-blank
  // content to survive a parse; only a missing/invalid id drops the entry.
  const title = clampTitle(typeof raw.title === 'string' ? raw.title : '');
  const body = clampBody(typeof raw.body === 'string' ? raw.body : '');
  const category = isIllustrationCategory(raw.category)
    ? raw.category
    : DEFAULT_ILLUSTRATION_CATEGORY;
  const createdAt =
    typeof raw.createdAt === 'number' && Number.isFinite(raw.createdAt)
      ? raw.createdAt
      : 0;
  const updatedAt =
    typeof raw.updatedAt === 'number' && Number.isFinite(raw.updatedAt)
      ? raw.updatedAt
      : createdAt;
  return {id: raw.id, title, body, category, createdAt, updatedAt};
}

/**
 * Parse the persisted JSON map, tolerating corruption exactly like
 * `parsePrepSeriesMap`: a bad blob, a non-object root, or a malformed entry
 * yields an empty (or partial) map rather than a throw. Keyed by each
 * illustration's OWN `id` field (not the raw JSON key) so a hand-edited or
 * corrupted key never desyncs the map from its entries; anything beyond
 * `MAX_ILLUSTRATIONS` is dropped.
 */
export function parsePrepIllustrationsMap(
  raw: string | null | undefined,
): PrepIllustrationsMap {
  if (!raw) return {};
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return {};
  }
  if (!parsed || typeof parsed !== 'object') return {};
  const map: PrepIllustrationsMap = {};
  for (const value of Object.values(parsed as Record<string, unknown>)) {
    if (Object.keys(map).length >= MAX_ILLUSTRATIONS) break;
    const item = coerceIllustration(value);
    if (item) map[item.id] = item;
  }
  return map;
}

/** Serialize the map for storage. */
export function serializePrepIllustrationsMap(
  map: PrepIllustrationsMap,
): string {
  return JSON.stringify(map);
}
