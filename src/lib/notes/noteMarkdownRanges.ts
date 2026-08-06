'worklet';

/**
 * 📝 noteMarkdownRanges — a UI-thread worklet re-encoding of
 * `noteMarkdown.ts`'s `**bold**`/`*italic*` grammar into
 * `@expensify/react-native-live-markdown`'s `MarkdownRange[]` shape, for the
 * LIVE-EDITING view of the exact same stored plain text `noteMarkdown.ts`
 * already renders read-only elsewhere (notes list, share-image card).
 *
 * This is NOT a new grammar and NOT a wrapper around the library's own
 * bundled `parseExpensiMark`/`expensify-common` (ExpensiMark's dialect —
 * `*bold*` / `_italic_` — is a different syntax entirely and would corrupt
 * already-stored notes if applied here). It deliberately re-derives
 * `noteMarkdown.ts`'s own single-line-scoped, bold-before-italic, no-nesting
 * regex approach against a different output shape. See `noteMarkdown.ts`'s
 * header comment for the full "why" of that grammar (the hand-typed
 * "* punto" bullet corruption case, the newline-scoping rationale, etc.) —
 * it is not repeated here, only re-targeted.
 *
 * Bullets ("- " at line start) are DELIBERATELY given no live-editor
 * decoration — not an oversight. The read side keeps substituting "-"→"•" at
 * render time only (storage stays byte-identical either way); doing the same
 * substitution here, in an editable view, would rewrite characters the user
 * is actively typing out from under them. `MarkdownType` also has no
 * list/bullet member, so there would be no clean way to decorate it even if
 * this were in scope. A leading "- " is simply never matched by the regexes
 * below and passes through as literal plain text, exactly as it already
 * looks in the editor today.
 *
 * Runs on the UI thread inside a worklet (the `'worklet';` directive above
 * is the entire mechanism — Metro's babel-preset-expo chain, and this
 * project's own babel.config.js under Jest, both run
 * `react-native-worklets/plugin` over every first-party source file,
 * instrumenting this function with the `__workletHash` the library's
 * `MarkdownTextInput` requires). A throw here is a UI-thread crash, not a
 * caught JS error — so this function must NEVER throw. Any malformed or
 * unexpected input degrades to `[]` (fully plain, unstyled) rather than
 * guessing at intent, mirroring `noteMarkdown.ts`'s own
 * never-guess-at-unpaired-markers philosophy.
 */
import type {MarkdownRange} from '@expensify/react-native-live-markdown';

// Same source patterns as `noteMarkdown.ts`: bold tried before italic at
// each position (so "**bold**" is one bold span, never two adjacent
// italics); content excludes both "*" (a span never swallows another
// marker) and "\n" (a span never crosses a line boundary). Kept as plain
// strings at module scope (serialize across the worklet boundary without
// issue) rather than a pre-built `RegExp` — see the `matchRe` comment
// below for why the compiled pattern itself is built fresh per call.
const BOLD_SRC = '\\*\\*[^*\\n]+\\*\\*';
const ITALIC_SRC = '\\*[^*\\n]+\\*';

// The reference `parseExpensiMark` bails to `[]` above this same threshold
// (`node_modules/@expensify/react-native-live-markdown/src/parseExpensiMark.ts`).
// Reusing it rather than inventing a new number: verse notes have no length
// cap anywhere else in this codebase, and a live per-keystroke worklet
// parser is exactly the kind of code where an unbounded input on the UI
// thread is a real jank/ANR risk, not just a style preference. 4000 chars is
// already far beyond what a "note" is likely to contain in practice, so
// degrading to plain text past that point is a safe, unnoticeable trade.
const MAX_PARSABLE_LENGTH = 4000;

/** Parse verse-note text into live-editor `MarkdownRange`s matching
 *  `parseNoteMarkdown`'s (`noteMarkdown.ts`) bold/italic span boundaries
 *  exactly. Per matched span, emits exactly 3 ranges in order — opening
 *  `syntax`, inner `bold`/`italic` content, closing `syntax` — mirroring
 *  the reference library's own `parseTreeToTextAndRanges` emission shape.
 *  All offsets are against the original input string, markers included.
 *  Never throws: any error or out-of-scope input returns `[]`. */
export function parseNoteMarkdownRanges(text: string): MarkdownRange[] {
  'worklet';
  try {
    if (typeof text !== 'string' || text.length === 0) return [];
    if (text.length > MAX_PARSABLE_LENGTH) return [];

    // Built fresh per call rather than reusing a shared module-scope
    // `RegExp`: this function is registered as a worklet and can run on the
    // UI-thread runtime, which gets its own serialized copy of anything
    // captured from module scope. A `RegExp` carries mutable state
    // (`lastIndex`, mutated below via `.exec`) that a shared instance would
    // need to round-trip correctly across that boundary and stay isolated
    // between concurrent JS-thread/UI-thread copies — neither is guaranteed,
    // and a frozen or stale copy would fail silently into the `catch` below
    // (styling simply stops working, with no visible error). A fresh
    // `RegExp` from these two short literal strings is cheap next to the
    // parse itself and removes that whole risk category.
    const matchRe = new RegExp(`${BOLD_SRC}|${ITALIC_SRC}`, 'g');
    const ranges: MarkdownRange[] = [];
    let match: RegExpExecArray | null = matchRe.exec(text);
    // Belt-and-suspenders iteration cap: every match below consumes at
    // least 3 characters (shortest possible span is "*x*"), so the number
    // of matches can never exceed text.length. Guards against ever looping
    // forever on the UI thread, even if the regex above is edited later in
    // a way that admits a zero-length match.
    let guard = text.length + 1;
    while (match !== null && guard > 0) {
      guard -= 1;
      const full = match[0];
      const start = match.index;
      const isBold = full.length >= 4 && full.startsWith('**');
      const markerLength = isBold ? 2 : 1;
      const contentLength = full.length - markerLength * 2;

      ranges.push({type: 'syntax', start, length: markerLength});
      ranges.push({
        type: isBold ? 'bold' : 'italic',
        start: start + markerLength,
        length: contentLength,
      });
      ranges.push({
        type: 'syntax',
        start: start + markerLength + contentLength,
        length: markerLength,
      });

      match = matchRe.exec(text);
    }

    return ranges;
  } catch {
    return [];
  }
}
