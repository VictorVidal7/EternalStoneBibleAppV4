/**
 * 📝 noteMarkdown — a lightweight, live-typing-safe `**bold**`/`*italic*`
 * parser for user-authored verse notes (Tanda: pro text editor v1a → v1b).
 *
 * Deliberately a SEPARATE parser from the dictionary's own
 * `parseMarkdownSegments` ([[dictionary]]), not a shared/reused one, even
 * though the surface syntax looks identical — the two have different
 * correctness requirements. Dictionary content is pre-vetted, well-formed,
 * server-authored prose where a span can safely run across a full sentence.
 * A verse note is typed live, one keystroke at a time, by a user who may
 * never have intended markdown at all — e.g. a hand-typed bullet like
 * "* punto importante" is a single, unpaired "*". If matching were allowed
 * to span newlines (as the dictionary parser does), that lone "*" could pair
 * with an unrelated "*" many lines later in the SAME note and silently
 * italicize everything in between — a real, silent corruption of content the
 * user already wrote, not a rendering nicety. This parser closes that off by
 * scoping both bold and italic spans to a SINGLE LINE (`[^*\n]` instead of
 * `[^*]`): a lone "*" can now only ever pair with another "*" on the same
 * line, and any truly unterminated marker (e.g. mid-typing "**bold") is left
 * as literal text rather than guessed at.
 *
 * No nested bold-inside-italic/italic-inside-bold support — unlike the
 * dictionary's articles, a short verse note has no real use for that
 * combination, and skipping it keeps this parser simpler to reason about.
 *
 * Bullet lines (v1b-plus) use a leading "- " (dash-space), NOT "*" — this is
 * load-bearing, not a style choice. Keeping the bullet marker disjoint from
 * the emphasis markers is what keeps a hand-typed "* punto" bullet (the
 * exact corruption case this file was hardened against above) reading as
 * plain literal text instead of colliding with italic. A future edit that
 * "also accepts '*' as a bullet marker for convenience" would silently
 * reopen that corruption — don't do it without re-deriving this reasoning.
 * Bullets render INLINE (a "•" substituted for the "- ", still inside one
 * plain-text run) rather than as a separate list-item construct, so both
 * render sites' existing `numberOfLines` truncation keeps working unchanged
 * — a real `View`-per-bullet layout would break that in the notes list and
 * the share-image card, which is why this stays a text substitution, not a
 * new segment style.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

export type NoteMarkdownStyle = 'plain' | 'bold' | 'italic';

export interface NoteMarkdownSegment {
  text: string;
  style: NoteMarkdownStyle;
}

// Bold is tried before italic at each position so "**bold**" is never
// misread as two adjacent italic spans. Content excludes both "*" (so a
// span never swallows another marker) and "\n" (so a span never crosses a
// line boundary — see the file header comment for why that matters).
const BOLD_SRC = '\\*\\*[^*\\n]+\\*\\*';
const ITALIC_SRC = '\\*[^*\\n]+\\*';
// A capturing group so `.split` keeps the matched delimiters in the result
// instead of discarding them.
const SPLIT_RE = new RegExp(`(${BOLD_SRC}|${ITALIC_SRC})`, 'g');

/** Replace a leading "- " (dash-space) on any line with "• " (bullet-space).
 *  Only the line's own first two characters are checked — no leading-
 *  whitespace tolerance, no nested/indented list levels; a plain flat list
 *  is the whole of what "lightweight" means here. A line that's just "-"
 *  with no following space, or a "-" anywhere but the start, is untouched. */
function applyBulletMarkers(text: string): string {
  return text
    .split('\n')
    .map(line => (line.startsWith('- ') ? '•' + line.slice(1) : line))
    .join('\n');
}

/** Split note text into styled segments for rendering. Unmatched/unpaired
 *  "*"/"**" are left as literal plain text — never guessed at, never dropped.
 *  Empty input returns an empty array. */
export function parseNoteMarkdown(text: string): NoteMarkdownSegment[] {
  if (!text) return [];
  return applyBulletMarkers(text)
    .split(SPLIT_RE)
    .filter(part => part.length > 0)
    .map((part): NoteMarkdownSegment => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return {text: part.slice(2, -2), style: 'bold'};
      }
      if (part.startsWith('*') && part.endsWith('*')) {
        return {text: part.slice(1, -1), style: 'italic'};
      }
      return {text: part, style: 'plain'};
    });
}
