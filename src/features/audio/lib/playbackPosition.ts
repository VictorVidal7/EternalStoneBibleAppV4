/**
 * Audio playback position model (Sprint 51 — "Continue listening").
 *
 * Pure, React-/storage-free helpers describing WHERE the user last was in the
 * audio player so playback can resume there. The TTS player advances verse by
 * verse (expo-speech has no continuous time — see scrubMath.ts), so a position
 * is a DISCRETE `{book, chapter, verseIndex}` snapshot rather than a timestamp.
 *
 * This finally wires the long-dead `AUDIO_STORAGE_KEYS.lastPosition` key and the
 * `AudioPreferences.continueFromLastPosition` flag. Kept pure (mirror of
 * scrubMath.ts / insights.ts) so parsing/clamping is unit-testable without RN.
 *
 * Resume is a PREMIUM feature (Sprint 50 gate) — the persisted position is read
 * back only for unlocked users; free users always start a chapter at verse 1.
 *
 * Para la gloria de Dios - Eternal Stone Bible App
 */

export interface PlaybackPosition {
  /** Book name as stored on the verse (English canonical, e.g. "Genesis"). */
  book: string;
  /** 1-based chapter number. */
  chapter: number;
  /** 0-based index into the chapter's verse list (drives `goToVerse`). */
  verseIndex: number;
  /** The actual verse number at `verseIndex` — for display only. */
  verse: number;
  /** Total verses in the chapter when the position was saved. */
  totalVerses: number;
  /** ms-epoch when this position was last written. */
  updatedAt: number;
}

/**
 * A saved position older than this is treated as stale and NOT offered for
 * resume (so "Continue listening" always feels fresh, never resurrects a
 * months-old chapter). 30 days.
 */
export const RESUME_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

/**
 * Clamp a verse index into the valid range `[0, totalVerses - 1]`.
 * Returns 0 for an empty/invalid chapter so callers never index past the end.
 * A different Bible version can have a different verse count, so the reader
 * re-clamps the restored index against the freshly-loaded chapter.
 */
export function clampVerseIndex(index: number, totalVerses: number): number {
  if (totalVerses <= 0) return 0;
  if (!Number.isFinite(index) || index < 0) return 0;
  if (index > totalVerses - 1) return totalVerses - 1;
  return Math.round(index);
}

/**
 * Defensively coerce an unknown object into a `PlaybackPosition`, or `null` if
 * any required field is missing/ill-typed. `verseIndex` is clamped to the
 * stored `totalVerses` so a corrupt blob can never point past the chapter.
 */
export function normalizePosition(obj: unknown): PlaybackPosition | null {
  if (!obj || typeof obj !== 'object') return null;
  const o = obj as Record<string, unknown>;
  const {book, chapter, verseIndex, verse, totalVerses, updatedAt} = o;
  if (
    typeof book !== 'string' ||
    book.length === 0 ||
    !isFiniteNumber(chapter) ||
    chapter <= 0 ||
    !isFiniteNumber(verseIndex) ||
    verseIndex < 0 ||
    !isFiniteNumber(verse) ||
    verse <= 0 ||
    !isFiniteNumber(totalVerses) ||
    totalVerses <= 0 ||
    !isFiniteNumber(updatedAt) ||
    updatedAt < 0
  ) {
    return null;
  }
  const total = Math.round(totalVerses);
  return {
    book,
    chapter: Math.round(chapter),
    verseIndex: clampVerseIndex(verseIndex, total),
    verse: Math.round(verse),
    totalVerses: total,
    updatedAt,
  };
}

/** Parse a raw JSON string from storage into a position, or `null`. */
export function parsePosition(
  raw: string | null | undefined,
): PlaybackPosition | null {
  if (!raw) return null;
  try {
    return normalizePosition(JSON.parse(raw));
  } catch {
    return null;
  }
}

/** Serialize a position for storage. */
export function serializePosition(pos: PlaybackPosition): string {
  return JSON.stringify(pos);
}

/**
 * Build a fresh position, clamping `verseIndex` and stamping `updatedAt=now`.
 * Pure so the player context (and tests) can construct one deterministically.
 */
export function createPosition(input: {
  book: string;
  chapter: number;
  verseIndex: number;
  verse: number;
  totalVerses: number;
  now: number;
}): PlaybackPosition {
  const total = Math.max(1, Math.round(input.totalVerses));
  return {
    book: input.book,
    chapter: Math.round(input.chapter),
    verseIndex: clampVerseIndex(input.verseIndex, total),
    verse: Math.round(input.verse),
    totalVerses: total,
    updatedAt: input.now,
  };
}

/** Whether the position refers to the given chapter. */
export function isSameChapter(
  pos: PlaybackPosition | null,
  book: string,
  chapter: number,
): boolean {
  return !!pos && pos.book === book && pos.chapter === chapter;
}

/**
 * Whether a position is fresh enough to surface as "Continue listening".
 * Guards against negative ages (a clock that moved backwards) and stale blobs.
 */
export function isResumable(
  pos: PlaybackPosition | null,
  now: number,
  maxAgeMs: number = RESUME_MAX_AGE_MS,
): boolean {
  if (!pos) return false;
  const age = now - pos.updatedAt;
  return age >= 0 && age <= maxAgeMs;
}
