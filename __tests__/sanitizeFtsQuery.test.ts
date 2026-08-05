/**
 * Tests for `sanitizeFtsQuery` (src/lib/search/sanitizeFtsQuery.ts) — the fix
 * for the bug where `BibleDatabase.searchVerses`/`searchByBook` bound the
 * user's raw typed text directly as an FTS5 `MATCH` argument. FTS5's MATCH
 * argument is its own small query language, so ordinary vocabulary containing
 * FTS5-special characters threw a SQL syntax error instead of matching —
 * hyphenated words ("self-control", "co-heirs") being the big real-world
 * case, since FTS5 reads a bareword like `self-control` as a column filter
 * (`self` `-control`, i.e. NOT a "control" column) and throws
 * "no such column: control". Every call site's generic try/catch then
 * collapsed that SQL error into the exact same empty-results UI state as a
 * genuine zero-match search.
 *
 * WHY THESE ARE ASSERTIONS ON THE SANITIZED STRING, NOT A REAL FTS5 ENGINE:
 * This repo already has a real-SQL harness for `insertVerses`
 * (`insertVersesBatchedSql.test.ts`, using `sql.js`'s `sql-asm.js` build)
 * precisely because a prior session needed a genuine SQLite engine and
 * rejected Node's built-in `node:sqlite` — this repo's CI
 * (.github/workflows/ci.yml) pins `node-version: 20`, and `node:sqlite`
 * requires Node >= 22.5, so it would pass locally and break CI. That harness
 * was evaluated for reuse here and ruled out for FTS5 specifically: BOTH of
 * sql.js's builds (`sql-asm.js` and `sql-wasm.js`) ship without the fts5
 * module compiled in — confirmed directly:
 * `db.run("CREATE VIRTUAL TABLE t USING fts5(x)")` throws
 * `no such module: fts5` on both. That's the exact same limitation this
 * codebase already documents for expo-sqlite's own web/WASM build (see the
 * comment above `createSchema`'s `Platform.OS !== 'web'` check in
 * src/lib/database/index.ts). No CI-safe, dependency-free, Node-20-compatible
 * real FTS5 engine is available in this repo, so — consistent with this
 * suite's own precedent of NOT reaching for `node:sqlite` — this file tests
 * the sanitizer as a pure function instead.
 *
 * That said, the sanitizer's OUTPUT was empirically verified against a REAL
 * SQLite FTS5 engine (Python's built-in `sqlite3` module, which does ship
 * fts5) using this app's EXACT schema
 * (`fts5(book_name, chapter, verse, text, content='verses', content_rowid='id')`)
 * and its exact query shape (`fts.text MATCH ? AND v.version = ?`, joined
 * back to `verses`), with realistic verse rows. Confirmed outcomes — not
 * merely "doesn't throw", but the actual correct row sets:
 *   - 'self-control'  -> matched Galatians 5:23 and 2 Peter 1:6 (both contain
 *     the literal hyphenated word); correctly did NOT match Titus 1:8's
 *     "self-controlled" (a different, one-token-longer word).
 *   - 'co-heirs'      -> matched Romans 8:17 only.
 *   - 'long-suffering' -> matched Romans 12:12 (literal hyphenated form);
 *     correctly did NOT match Ephesians 4:2's "longsuffering" (one word, a
 *     genuinely different token sequence under FTS5's own tokenizer).
 *   - 'amor*', 'amor OR odio', '"amor odio"', 'foo"bar' (literal double
 *     quote) all round-tripped through real FTS5 with zero syntax errors.
 *   - 'love*' (prefix) matched "Love suffers", "so loved", "a lover of good"
 *     — genuine prefix semantics preserved, not just literal "love".
 *   - '"love suffers"' (phrase) matched ONLY 1 Corinthians 13:4 — adjacency
 *     preserved, not degraded to an unordered bag-of-words AND.
 *   - Zero-regression check: for ordinary unquoted multi-word Spanish
 *     queries with no special characters ('amor de Dios', 'Jehova',
 *     'dominio propio', 'de todo tu corazon'), the RAW (pre-fix) query and
 *     the SANITIZED query were run side by side against the same real
 *     engine and returned byte-identical result sets every time.
 *   - Adversarial inputs that used to throw a hard FTS5 syntax error — bare
 *     'NOT', a trailing 'AND'/leading 'OR' with a missing operand, a stray
 *     '(', a 'column:value' shape, an unterminated quote, '*' alone, a
 *     leading '*amor', a mid-word 'amor*odio' — all now execute without
 *     throwing and return a sensible (often correctly non-empty) result.
 */
import {sanitizeFtsQuery} from '../src/lib/search/sanitizeFtsQuery';

describe('sanitizeFtsQuery', () => {
  describe('the hyphenated-word bug this fix targets', () => {
    it('quotes a hyphenated word so it is searched as a literal adjacent-token phrase, not FTS5 column-filter syntax', () => {
      expect(sanitizeFtsQuery('self-control')).toBe('"self-control"');
      expect(sanitizeFtsQuery('co-heirs')).toBe('"co-heirs"');
      expect(sanitizeFtsQuery('long-suffering')).toBe('"long-suffering"');
      expect(sanitizeFtsQuery('well-being')).toBe('"well-being"');
    });
  });

  describe('legitimate existing syntax that must keep working unchanged', () => {
    it('preserves a bare trailing-* prefix wildcard', () => {
      expect(sanitizeFtsQuery('amor*')).toBe('amor*');
    });

    it('preserves boolean OR between two real terms', () => {
      expect(sanitizeFtsQuery('amor OR odio')).toBe('"amor" OR "odio"');
    });

    it('preserves boolean AND/NOT between two real terms', () => {
      expect(sanitizeFtsQuery('amor AND odio')).toBe('"amor" AND "odio"');
      expect(sanitizeFtsQuery('amor NOT odio')).toBe('"amor" NOT "odio"');
    });

    it('preserves an already-quoted phrase as one adjacency-requiring unit', () => {
      expect(sanitizeFtsQuery('"amor odio"')).toBe('"amor odio"');
    });

    it('keeps a chain of valid operators between real terms intact', () => {
      expect(sanitizeFtsQuery('amor AND odio OR paz')).toBe(
        '"amor" AND "odio" OR "paz"',
      );
    });
  });

  describe('ordinary unquoted multi-word input (no regression vs. pre-fix implicit-AND behavior)', () => {
    it('quotes each word independently so the same bag-of-words match set is preserved', () => {
      expect(sanitizeFtsQuery('amor de Dios')).toBe('"amor" "de" "Dios"');
      expect(sanitizeFtsQuery('dominio propio')).toBe('"dominio" "propio"');
    });
  });

  describe('a literal double quote in the query', () => {
    it('escapes an embedded quote by doubling it, per FTS5’s own rule, instead of producing an unterminated string', () => {
      expect(sanitizeFtsQuery('foo"bar')).toBe('"foo""bar"');
    });
  });

  describe('adversarial / malformed input that used to throw a hard FTS5 syntax error', () => {
    it('demotes a bare keyword with no valid operand to literal text instead of leaving a dangling operator', () => {
      expect(sanitizeFtsQuery('NOT')).toBe('"NOT"');
      expect(sanitizeFtsQuery('amor AND')).toBe('"amor" "AND"');
      expect(sanitizeFtsQuery('OR amor')).toBe('"OR" "amor"');
    });

    it('demotes a chain of two adjacent keywords (no term between them) to literal text', () => {
      expect(sanitizeFtsQuery('amor NOT AND odio')).toBe(
        '"amor" "NOT" "AND" "odio"',
      );
    });

    it('treats a stray unbalanced paren as literal text', () => {
      expect(sanitizeFtsQuery('(amor')).toBe('"(amor"');
    });

    it('treats a column-filter-shaped token as literal text', () => {
      expect(sanitizeFtsQuery('a:b')).toBe('"a:b"');
    });

    it('auto-closes an unterminated quote at end of input', () => {
      expect(sanitizeFtsQuery('"unterminated phrase here')).toBe(
        '"unterminated phrase here"',
      );
    });

    it('is never empty-crashing for blank/whitespace-only/quote-only input', () => {
      expect(sanitizeFtsQuery('')).toBe('""');
      expect(sanitizeFtsQuery('   ')).toBe('""');
      expect(sanitizeFtsQuery('"')).toBe('""');
      expect(sanitizeFtsQuery('""')).toBe('""');
    });

    it('handles a leading wildcard and mid-word wildcard without erroring', () => {
      expect(sanitizeFtsQuery('*amor')).toBe('"*amor"');
      expect(sanitizeFtsQuery('*')).toBe('"*"');
      expect(sanitizeFtsQuery('amor*odio')).toBe('"amor*odio"');
    });

    it('escapes a literal quote character inside an already-quoted apostrophe word', () => {
      expect(sanitizeFtsQuery("co-heirs' fellowship")).toBe(
        '"co-heirs\'" "fellowship"',
      );
    });
  });
});
