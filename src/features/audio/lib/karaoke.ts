/**
 * 🎤 karaoke — PURE word-boundary → highlighted-word resolution (Sprint 75).
 *
 * The TTS engine reports word boundaries while it speaks (`onBoundary`,
 * `{charIndex, charLength}` into the utterance text). The ImmersiveReader uses
 * this to paint the word being voiced — karaoke style — by splitting the verse
 * into three Text runs (before / active word / after). THIS module owns the
 * text math: tokenize a verse into word spans, and resolve which span a
 * boundary's `charIndex` lands in.
 *
 * Resolution is forgiving by design: engines disagree on whether `charIndex`
 * points at the word's first letter or at the whitespace/punctuation before
 * it, so an index that falls BETWEEN tokens snaps forward to the next token
 * (the word about to be voiced). An index past the last token clamps to the
 * last token; no tokens (or a negative index) resolve to -1 (no highlight —
 * the graceful fallback for engines that never emit boundaries is simply that
 * no boundary ever arrives).
 *
 * Kept free of React / the engine so the span math is unit-tested in
 * isolation, mirroring [[chapterNavigation]] / [[miniPlayerGestures]].
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

/** A word span inside a verse: [start, end) char offsets into the text. */
export interface KaraokeToken {
  /** The word as written (punctuation attached, e.g. "Jehová,"). */
  text: string;
  /** Inclusive char offset of the first character. */
  start: number;
  /** Exclusive char offset just past the last character. */
  end: number;
}

/**
 * Split a verse into word spans, preserving each word's char offsets in the
 * ORIGINAL text (the offsets `onBoundary` indexes into). Whitespace separates
 * words; punctuation stays attached to its word so the highlight never paints
 * half a token.
 */
export function tokenizeForKaraoke(text: string): KaraokeToken[] {
  const tokens: KaraokeToken[] = [];
  const re = /\S+/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(text)) !== null) {
    tokens.push({
      text: match[0],
      start: match.index,
      end: match.index + match[0].length,
    });
  }
  return tokens;
}

/**
 * The index of the token a boundary's `charIndex` lands in, snapping forward
 * from inter-word whitespace and clamping past-the-end indices to the last
 * token. Returns -1 when there are no tokens or the index is negative.
 */
export function activeTokenIndex(
  tokens: readonly KaraokeToken[],
  charIndex: number,
): number {
  if (tokens.length === 0 || charIndex < 0 || !Number.isFinite(charIndex)) {
    return -1;
  }
  for (let i = 0; i < tokens.length; i++) {
    // Inside this token — or in the gap before it (snap forward to the word
    // the engine is about to voice).
    if (charIndex < tokens[i].end) return i;
  }
  return tokens.length - 1;
}
