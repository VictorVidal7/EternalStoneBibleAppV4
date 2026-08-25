/**
 * ✍️ markdownFormatting — pure string transforms behind the shared
 * `MarkdownFormatToolbar` (Bold / Italic / Bullet list / Heading).
 *
 * Both plain-text surfaces this feeds (`app/features/sermon-notes/[id].tsx`'s
 * `bodyText` and `app/features/prep/index.tsx`'s per-section `drafts[section]`)
 * store nothing but a plain string — the Markdown syntax IS the content, and
 * `buildSermonNoteMarkdown` / the prep table's own export just pass it
 * through untouched. So this module never touches storage; it only computes
 * the next `{text, selectionStart, selectionEnd}` for a given action, and the
 * React component wires that straight into the `TextInput`'s
 * `onChangeText` + (imperative) `setSelection`.
 *
 * Two small toggle niceties are supported (pressing the same button again
 * undoes it), scoped to stay unambiguous:
 *  - Bullet/heading re-prefixing a line that already has the prefix removes
 *    it instead of double-prefixing.
 *  - Bold/italic do NOT toggle-unwrap — with `**`/`*` sharing a character,
 *    detecting "already wrapped" reliably would need lookahead into
 *    surrounding text that's easy to get subtly wrong; wrapping is the one
 *    behavior the toolbar spec actually requires, so that's all it does.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

export type MarkdownFormatAction = 'bold' | 'italic' | 'bulletList' | 'heading';

export interface MarkdownFormatResult {
  text: string;
  selectionStart: number;
  selectionEnd: number;
}

/** Index of the start of the line containing `pos` (0 if `pos` is on the first line). */
function lineStartIndex(text: string, pos: number): number {
  const idx = text.lastIndexOf('\n', Math.max(0, pos - 1));
  return idx === -1 ? 0 : idx + 1;
}

/** Index just past the end of the line containing `pos` (exclusive of the newline). */
function lineEndIndex(text: string, pos: number): number {
  const idx = text.indexOf('\n', pos);
  return idx === -1 ? text.length : idx;
}

/**
 * Wrap the selection in `marker` on both sides (Bold `**`, Italic `*`).
 * With no selection (cursor only), inserts an empty pair and parks the
 * cursor between the two halves, ready to type. With a real selection, the
 * previously-selected text stays selected (now shifted past the opening
 * marker) so the user sees exactly what got wrapped.
 */
function wrapSelection(
  text: string,
  start: number,
  end: number,
  marker: string,
): MarkdownFormatResult {
  if (start === end) {
    const nextText = text.slice(0, start) + marker + marker + text.slice(start);
    const cursor = start + marker.length;
    return {text: nextText, selectionStart: cursor, selectionEnd: cursor};
  }
  const selected = text.slice(start, end);
  const nextText =
    text.slice(0, start) + marker + selected + marker + text.slice(end);
  return {
    text: nextText,
    selectionStart: start + marker.length,
    selectionEnd: start + marker.length + selected.length,
  };
}

/** A single "insert/remove `prefix.length` chars at `at`" edit, for remapping positions. */
interface LineEdit {
  at: number;
  delta: number;
}

/** Map an original absolute position through a sorted (ascending `at`) list of line edits. */
function mapThroughEdits(pos: number, edits: LineEdit[]): number {
  let mapped = pos;
  for (const edit of edits) {
    if (edit.delta > 0) {
      if (pos >= edit.at) mapped += edit.delta;
    } else if (edit.delta < 0) {
      const removeLen = -edit.delta;
      if (pos >= edit.at + removeLen) {
        mapped += edit.delta;
      } else if (pos > edit.at) {
        // pos fell inside the removed prefix — collapse it to the edit point.
        mapped -= pos - edit.at;
      }
    }
  }
  return mapped;
}

/**
 * Prefix line(s) with `prefix` (Bullet list `- `, Heading `## `), toggling it
 * off when every eligible line already has it.
 *
 * `singleLine` (Heading) always confines the edit to the line containing
 * `start`, ignoring how far the selection extends — the toolbar spec treats
 * Heading as a single-line action. It also always applies to that line, even
 * if blank (e.g. an empty line the user wants to turn into a heading).
 *
 * `!singleLine` (Bullet list) covers every line the selection touches, but
 * skips blank lines within a real multi-line selection (a blank separator
 * line shouldn't sprout a bullet). A single line touched — cursor-only or a
 * same-line selection — is always eligible, blank or not, matching Heading.
 */
function applyLinePrefix(
  text: string,
  start: number,
  end: number,
  prefix: string,
  singleLine: boolean,
): MarkdownFormatResult {
  const blockStart = lineStartIndex(text, start);
  let blockEndAnchor = start;
  if (!singleLine) {
    blockEndAnchor = end;
    // If the selection's end sits exactly at the start of a following line
    // (i.e. right after a newline) with nothing of that line selected,
    // don't pull that untouched line into the block.
    if (end > start && text[end - 1] === '\n') {
      blockEndAnchor = end - 1;
    }
  }
  const blockEnd = lineEndIndex(text, blockEndAnchor);
  const block = text.slice(blockStart, blockEnd);
  const lines = block.split('\n');
  const skipBlanks = lines.length > 1;
  const isEligible = (line: string) => !skipBlanks || line.trim().length > 0;

  const eligibleLines = lines.filter(isEligible);
  const allPrefixed =
    eligibleLines.length > 0 && eligibleLines.every(l => l.startsWith(prefix));

  const edits: LineEdit[] = [];
  const newLines: string[] = [];
  let cursor = blockStart;
  for (const line of lines) {
    const lineOrigStart = cursor;
    if (isEligible(line)) {
      if (allPrefixed) {
        if (line.startsWith(prefix)) {
          newLines.push(line.slice(prefix.length));
          edits.push({at: lineOrigStart, delta: -prefix.length});
        } else {
          newLines.push(line);
        }
      } else if (line.startsWith(prefix)) {
        newLines.push(line);
      } else {
        newLines.push(prefix + line);
        edits.push({at: lineOrigStart, delta: prefix.length});
      }
    } else {
      newLines.push(line);
    }
    cursor += line.length + 1; // +1 for the '\n' separator (harmless past the last line)
  }

  const newBlock = newLines.join('\n');
  const nextText = text.slice(0, blockStart) + newBlock + text.slice(blockEnd);

  return {
    text: nextText,
    selectionStart: mapThroughEdits(start, edits),
    selectionEnd: mapThroughEdits(end, edits),
  };
}

/**
 * Apply one Markdown formatting action to `text` at the given selection,
 * returning the new text plus where the selection/cursor should land.
 */
export function applyMarkdownFormat(
  text: string,
  selectionStart: number,
  selectionEnd: number,
  action: MarkdownFormatAction,
): MarkdownFormatResult {
  const start = Math.max(0, Math.min(selectionStart, selectionEnd));
  const end = Math.min(text.length, Math.max(selectionStart, selectionEnd));

  switch (action) {
    case 'bold':
      return wrapSelection(text, start, end, '**');
    case 'italic':
      return wrapSelection(text, start, end, '*');
    case 'bulletList':
      return applyLinePrefix(text, start, end, '- ', false);
    case 'heading':
      return applyLinePrefix(text, start, end, '## ', true);
    default: {
      const _exhaustive: never = action;
      return _exhaustive;
    }
  }
}
