/**
 * FTS5-safe query builder for `BibleDatabase.searchVerses`/`searchByBook`
 * (src/lib/database/index.ts).
 *
 * Both methods bind the user's raw typed search string directly as the
 * argument to a SQLite FTS5 `MATCH` query. `MATCH`'s argument isn't a plain
 * string — FTS5 parses it as its own small query language (AND/OR/NOT,
 * `"phrase"` quoting, `prefix*` wildcards, `()` grouping, `column:` filters).
 * That means ordinary vocabulary containing FTS5-special characters throws a
 * SQL syntax error instead of matching. Hyphenated words are the big one:
 * "self-control" (Galatas 5:23), "co-heirs" (Romanos 8:17) etc. all fail to
 * parse — FTS5 reads the bareword "self-control" as the column filter
 * `self` `-control` (a NOT on a "control" column) and throws "no such
 * column: control". Unbalanced quotes, a bare `NOT`/`AND`, a stray `(`, and
 * a literal `"` character all throw too. Every call site's generic
 * try/catch then collapses that SQL error into the exact same empty-results
 * UI state as a genuine zero-match search — the user is silently told
 * "no resultados" for a word that's verbatim in the text.
 *
 * Fix: tokenize the raw input ourselves and wrap every token FTS5 doesn't
 * already treat as safe, deliberate syntax in double quotes, doubling any
 * embedded `"` per FTS5's own documented escaping rule (sqlite.org/fts5.html
 * §3: "a string is a token, or several tokens, enclosed in double quotes...
 * literal double quote characters embedded within a string may be escaped
 * by doubling them"). A quoted token can never be misread as an operator,
 * column filter, or grouping paren, so it always parses — and because FTS5
 * runs the SAME tokenizer over quoted phrase content as it does over
 * indexed row content, quoting "self-control" reproduces the exact
 * `self`,`control` adjacent-token pair the indexer already produced for
 * that word (the unicode61 tokenizer splits on the hyphen as a separator on
 * BOTH sides), so it matches for real — not just "fails to crash".
 *
 * Deliberately preserved, NOT quoted-into-literal-text, because they're the
 * legitimate slice of FTS5 syntax this app's search screen already exposes
 * and documents to users:
 *  - a trailing `*` on an otherwise plain word — prefix search (`amor*`)
 *  - the bare uppercase keywords `OR` / `AND` / `NOT` — boolean operators
 *    (lowercase `or`/`and`/`not` are NOT treated as operators by FTS5 itself
 *    either, so ordinary sentence case is untouched)
 *  - a `"already quoted"` segment — explicit phrase search; its content is
 *    kept as one adjacency-requiring phrase (not split into separate
 *    per-word requirements) and any literal `"` inside it is still escaped
 *    by doubling
 *
 * Everything else (bare hyphens, colons, parens, stray quotes, apostrophes,
 * accented punctuation, etc.) is treated as literal text to search for, not
 * syntax to interpret — which is the right default for a search box real
 * people type Bible vocabulary into.
 */

const BOOLEAN_KEYWORDS = new Set(['OR', 'AND', 'NOT']);

// A bare word (letters/digits/combining marks only, Unicode-aware) with an
// optional trailing `*` for a prefix query, e.g. `amor*`. Deliberately does
// NOT allow a hyphen or other punctuation before the `*` — a token like
// `self-control*` still gets literal-quoted (the `*` is dropped as it can't
// be expressed safely inside a quoted phrase) rather than guessing intent.
const PREFIX_WILDCARD_RE = /^[\p{L}\p{N}]+\*$/u;

/**
 * Splits raw input on whitespace, EXCEPT a run that opens with `"` — that
 * consumes everything up to (and including) the next `"`, or to the end of
 * the string if none follows (an unbalanced quote auto-closes at the end of
 * input rather than throwing later on). This keeps an explicit phrase like
 * `"amor odio"` together as a single token so its word-adjacency is
 * preserved instead of being split into independent per-word terms.
 */
function splitRespectingQuotes(input: string): string[] {
  const tokens: string[] = [];
  let i = 0;
  const len = input.length;

  while (i < len) {
    while (i < len && /\s/.test(input[i])) i++;
    if (i >= len) break;

    if (input[i] === '"') {
      let j = i + 1;
      while (j < len && input[j] !== '"') j++;
      const end = j < len ? j + 1 : j; // include closing quote if present
      tokens.push(input.slice(i, end));
      i = end;
    } else {
      let j = i;
      while (j < len && !/\s/.test(input[j])) j++;
      tokens.push(input.slice(i, j));
      i = j;
    }
  }

  return tokens;
}

/** Doubles every literal `"` — FTS5's own escaping rule for text that will
 *  live inside a quoted string. */
function escapeQuotes(text: string): string {
  return text.replace(/"/g, '""');
}

/**
 * `OR`/`AND`/`NOT` are BINARY operators in FTS5's grammar — `X OR Y`, never
 * a standalone or prefix-unary form. `NOT` (bare), `"amor" AND` (missing
 * right operand), and `OR "amor"` (missing left operand) are all syntax
 * errors from FTS5 itself (confirmed empirically — see
 * `__tests__/sanitizeFtsQuery.test.ts`). So a keyword token only gets to
 * stay an unquoted operator when it has a real term immediately on both
 * sides in the ORIGINAL token stream; otherwise it's demoted to literal
 * text (quoted) like any other token, which is always safe.
 */
function isValidBinaryOperator(rawTokens: string[], index: number): boolean {
  if (index === 0 || index === rawTokens.length - 1) return false;
  const prev = rawTokens[index - 1];
  const next = rawTokens[index + 1];
  return !BOOLEAN_KEYWORDS.has(prev) && !BOOLEAN_KEYWORDS.has(next);
}

/**
 * Builds a safe FTS5 `MATCH` argument out of arbitrary user-typed text.
 * Never throws, never lets user input reach FTS5 un-neutralized, and still
 * matches the literal words the user typed (hyphenated ones included).
 */
export function sanitizeFtsQuery(rawQuery: string): string {
  const trimmed = rawQuery.trim();
  if (!trimmed) return '""'; // empty phrase: parses fine, matches nothing

  const tokens = splitRespectingQuotes(trimmed);

  const parts = tokens.map((token, index) => {
    if (BOOLEAN_KEYWORDS.has(token)) {
      if (isValidBinaryOperator(tokens, index)) return token;
      return `"${escapeQuotes(token)}"`; // e.g. bare "NOT" typed as a word
    }
    if (PREFIX_WILDCARD_RE.test(token)) return token;

    if (token.startsWith('"')) {
      // Already an (optionally unbalanced, auto-closed above) quoted
      // segment — unwrap the outer quotes we scanned past, re-escape
      // whatever is left, and re-wrap. Keeps the enclosed words as one
      // adjacency-requiring phrase.
      let inner = token.slice(1);
      if (inner.endsWith('"')) inner = inner.slice(0, -1);
      return `"${escapeQuotes(inner)}"`;
    }

    return `"${escapeQuotes(token)}"`;
  });

  return parts.join(' ');
}
