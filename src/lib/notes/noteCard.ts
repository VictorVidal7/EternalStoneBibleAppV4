/**
 * 🖼️ noteCard — PURE model for the shareable "verse note" image (Sprint 70).
 *
 * The reader could write a personal note on a verse, but there was no way to
 * SHARE that reflection. This builds the render-ready model for a single
 * designer card — the verse reference, the verse text, and the user's note —
 * captured by `NoteImageModal` with the Sprint 56 view-shot pipeline
 * (`captureRef` → `expo-sharing`) over an `imageTemplates` gradient.
 *
 * Kept pure (no React / storage) so the text normalization is unit-tested in
 * isolation, mirroring `collectionCard.ts` / `comparisonCard.ts`. The verse text
 * collapses its whitespace (source verses carry no meaningful line breaks), but
 * the NOTE preserves the user's own line breaks — only the surrounding
 * whitespace is trimmed — so a multi-paragraph reflection renders verbatim.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

/** The render-ready note card model. */
export interface NoteCardModel {
  /** e.g. "John 3:16" — composed + localized by the caller. */
  reference: string;
  /** The verse text, whitespace-collapsed (no ragged source line breaks). */
  verseText: string;
  /** The user's note, trimmed but with its own line breaks preserved. */
  note: string;
  /** Whether there is any note content to draw (false ⇒ nothing to share). */
  hasNote: boolean;
}

/**
 * Build the card model. `reference` and `verseText` are trimmed and the verse's
 * internal whitespace runs are collapsed to single spaces; the `note` is trimmed
 * at its edges but keeps its internal newlines so the writer's formatting shows.
 */
export function buildNoteCard(
  reference: string,
  verseText: string,
  note: string,
): NoteCardModel {
  const cleanNote = note.trim();
  return {
    reference: reference.trim(),
    verseText: verseText.trim().replace(/\s+/g, ' '),
    note: cleanNote,
    hasNote: cleanNote.length > 0,
  };
}
