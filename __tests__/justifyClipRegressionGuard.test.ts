import fs from 'fs';
import path from 'path';

/**
 * Sprint 112 (the reader's right-edge text-clipping saga, closed
 * 2026-07-28, live on main): justified text on Android clipped/corrupted
 * glyphs ("trajo" -> "trajc") because of two `isJustified`-conditional
 * levers:
 *
 *   1. `marginRight`/`marginLeft` — a margin narrows the Text's own box
 *      WITHOUT extending Android's glyph clip rect the way padding does, so
 *      it never fully prevented the clip and (worse, for `marginLeft`)
 *      broke justify's own fill-width math, overshooting the box.
 *   2. `textBreakStrategy: 'highQuality'` — its denser optimal line-packing
 *      occasionally overshot the reserved gutter by an amount that scaled
 *      unpredictably with margin/font-size settings; no fixed padding
 *      multiple was safe across every configuration.
 *
 * The fix, confirmed clip-free on-device and now unconditional for BOTH
 * alignments: `marginLeft: 0, marginRight: 0` always; `paddingLeft`/
 * `paddingRight` always carry the actual gutter; `textBreakStrategy` is
 * always `'simple'`. No more branching on `isJustified`/`textAlign` for any
 * of these 4 properties, anywhere.
 *
 * Victor, after this got fixed: "hay que asegurar que esto no vuelva a
 * pasar nunca jamás" ("we need to make sure this never happens again"). A
 * pixel-level assertion isn't viable — the real defect was native Android
 * line-breaker packing behavior, not something JS can predict — so this
 * guards the ARCHITECTURE instead: it statically re-reads the 3 source
 * files this saga touched (chapter.tsx, ReaderPreferencesSheet.tsx,
 * dictionary/[slug].tsx) and fails if the dangerous pattern is ever
 * reintroduced, in either direction:
 *
 *   - re-adding a non-zero or conditional marginLeft/marginRight,
 *   - re-adding 'highQuality' (or any computed/ternary expression) for
 *     textBreakStrategy,
 *   - silently DELETING a `textBreakStrategy="simple"` prop. RN's Android
 *     default is 'highQuality' (react-native/ReactCommon/react/renderer/
 *     attributedstring/ParagraphAttributes.h: `TextBreakStrategy::
 *     HighQuality`), so an omitted prop is exactly as dangerous as an
 *     explicit 'highQuality' — and leaves no "highQuality" string behind to
 *     grep for. The per-file minimum-count checks below catch that case
 *     specifically.
 *
 * This is a source-text scan, not a parser. All 3 files carry extensive
 * comments that quote `marginRight`, `marginLeft`, `paddingLeft` and
 * `'highQuality'` in prose explaining this very history — a naive
 * substring/regex check would false-positive on those comments, so every
 * check here strips comments first. It's safe to do that with a plain
 * regex specifically for these 3 files because none of them contain a
 * line-comment or block-comment delimiter inside a string literal
 * (verified: no URL literals in any of the three) — a real parser would be
 * needed for the general case.
 *
 * The style-object slices are extracted by anchoring on unique, nearby
 * source text (not line numbers, which drift) — if a future refactor
 * renames/moves these blocks enough that the anchors no longer match, this
 * throws a loud "marker not found" error instead of silently no-op-passing.
 */

function readSource(relPathFromRepoRoot: string): string {
  return fs.readFileSync(
    path.join(__dirname, '..', relPathFromRepoRoot),
    'utf8',
  );
}

function stripComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
}

/**
 * Slices `source` from the first occurrence of `startMarker` (at or after
 * `fromIndex`) through the end of the next occurrence of `endMarker`. Throws
 * if either marker is missing, so a rename/restructure fails the test suite
 * loudly rather than silently skipping the check it was guarding.
 */
function extractBetween(
  source: string,
  startMarker: string,
  endMarker: string,
  fromIndex = 0,
): {slice: string; endIndex: number} {
  const startIndex = source.indexOf(startMarker, fromIndex);
  if (startIndex === -1) {
    throw new Error(
      `justifyClipRegressionGuard: start marker not found (has the file been restructured?): ${JSON.stringify(startMarker)}`,
    );
  }
  const markerEnd = startIndex + startMarker.length;
  const endIndex = source.indexOf(endMarker, markerEnd);
  if (endIndex === -1) {
    throw new Error(
      `justifyClipRegressionGuard: end marker not found (has the file been restructured?): ${JSON.stringify(endMarker)}`,
    );
  }
  const sliceEnd = endIndex + endMarker.length;
  return {slice: source.slice(startIndex, sliceEnd), endIndex: sliceEnd};
}

/** Every `prop: <value>,`/`}` occurrence in `slice` (values found in order). */
function propValues(slice: string, prop: string): string[] {
  const re = new RegExp(`\\b${prop}\\s*:\\s*([^,}]+)[,}]`, 'g');
  const values: string[] = [];
  let m: RegExpExecArray | null = re.exec(slice);
  while (m) {
    values.push(m[1].trim());
    m = re.exec(slice);
  }
  return values;
}

/**
 * The shared invariant for every verse/prose text style block in all 3
 * files: marginLeft/marginRight, if present at all, must always be the
 * literal 0 — never a non-zero value, never conditional. paddingLeft/
 * paddingRight, if present, must carry an actual (non-zero) gutter value.
 * And nothing in the block may be a ternary/conditional expression at all
 * (a `?` in this narrow, comment-stripped window can only be a JS
 * conditional operator — every legitimate ternary in these files, e.g. the
 * verse's own `color` resolution, lives outside these anchored slices).
 */
function expectSafeGutterBlock(slice: string, label: string) {
  expect({label, hasTernary: /\?/.test(slice)}).toEqual({
    label,
    hasTernary: false,
  });

  for (const prop of ['marginLeft', 'marginRight']) {
    const values = propValues(slice, prop);
    if (values.length === 0) {
      continue; // absent is safe too (ReaderPreferencesSheet, dictionary)
    }
    expect({label, prop, values}).toEqual({
      label,
      prop,
      values: values.map(() => '0'),
    });
  }

  for (const prop of ['paddingLeft', 'paddingRight']) {
    const values = propValues(slice, prop);
    if (prop === 'paddingRight') {
      // Every file in this saga reserves a right-edge gutter — this one
      // must always be present.
      expect({label, prop, count: values.length > 0}).toEqual({
        label,
        prop,
        count: true,
      });
    }
    for (const value of values) {
      expect({label, prop, value}).not.toEqual({label, prop, value: '0'});
    }
  }
}

describe('justify-clip regression guard (Sprint 112, "nunca jamás")', () => {
  describe('app/(tabs)/verse/[book]/[chapter].tsx', () => {
    const raw = readSource('app/(tabs)/verse/[book]/[chapter].tsx');
    // The anchors below are themselves comment text, so extraction MUST run
    // on the raw (comment-intact) source — only the extracted slice gets
    // comments stripped before its properties are inspected.
    const stripped = stripComments(raw);

    it('primary verse textStyle never conditions marginLeft/marginRight/padding on alignment', () => {
      const {slice} = extractBetween(
        raw,
        '// Right-edge anti-clip reserve as paddingRight',
        'paddingLeft: leftSlack,',
      );
      expectSafeGutterBlock(stripComments(slice), 'chapter.tsx textStyle');
    });

    it('the stacked (non-dual-column) companion text never conditions its own margin/padding on alignment', () => {
      const primary = extractBetween(
        raw,
        '// Right-edge anti-clip reserve as paddingRight',
        'paddingLeft: leftSlack,',
      );
      const {slice} = extractBetween(
        raw,
        '// This companion never got the primary',
        'paddingLeft: leftSlack,',
        primary.endIndex,
      );
      expectSafeGutterBlock(
        stripComments(slice),
        'chapter.tsx sideBySideText companion',
      );
    });

    it('never sets textBreakStrategy to anything but the literal "simple", and never deletes it', () => {
      // Deletion is just as dangerous as reintroducing 'highQuality': RN's
      // Android default IS 'highQuality', and an omitted prop leaves no
      // "highQuality" string behind for a plain substring check to catch —
      // hence the minimum-count assertion below, not just an absence check.
      const matches = [
        ...stripped.matchAll(
          /textBreakStrategy\s*(?:=|:)\s*(\{[^}]*\}|"[^"]*"|'[^']*')/g,
        ),
      ].map(m => m[1]);

      expect(matches.length).toBeGreaterThanOrEqual(3);
      for (const value of matches) {
        expect(value.startsWith('{')).toBe(false); // never a computed/ternary expression
        expect(value.replace(/['"]/g, '')).toBe('simple');
      }
    });

    it('never reintroduces "highQuality" anywhere in real code (comments excluded)', () => {
      expect(stripped).not.toMatch(/highQuality/);
    });
  });

  describe('src/components/reading/ReaderPreferencesSheet.tsx', () => {
    const raw = readSource('src/components/reading/ReaderPreferencesSheet.tsx');
    const stripped = stripComments(raw);

    it('live-preview text style never conditions margin/padding on alignment', () => {
      const {slice} = extractBetween(
        raw,
        'const previewRightSlack',
        '} as const;',
      );
      expectSafeGutterBlock(
        stripComments(slice),
        'ReaderPreferencesSheet previewTextStyle',
      );
    });

    it('never sets textBreakStrategy to anything but the literal "simple", and never deletes it', () => {
      const matches = [
        ...stripped.matchAll(
          /textBreakStrategy\s*(?:=|:)\s*(\{[^}]*\}|"[^"]*"|'[^']*')/g,
        ),
      ].map(m => m[1]);

      expect(matches.length).toBeGreaterThanOrEqual(1);
      for (const value of matches) {
        expect(value.startsWith('{')).toBe(false);
        expect(value.replace(/['"]/g, '')).toBe('simple');
      }
    });

    it('never reintroduces "highQuality" anywhere in real code (comments excluded)', () => {
      expect(stripped).not.toMatch(/highQuality/);
    });
  });

  describe('app/features/dictionary/[slug].tsx', () => {
    const raw = readSource('app/features/dictionary/[slug].tsx');
    const stripped = stripComments(raw);

    it('shared prose style (gloss/article/multi-view) never conditions margin/padding on alignment', () => {
      const {slice} = extractBetween(
        raw,
        'const proseRightSlack',
        '} as const;',
      );
      expectSafeGutterBlock(
        stripComments(slice),
        'dictionary [slug].tsx proseStyle',
      );
    });

    it('never sets textBreakStrategy to anything but the literal "simple" on any of the 3 prose surfaces, and never deletes one', () => {
      const matches = [
        ...stripped.matchAll(
          /textBreakStrategy\s*(?:=|:)\s*(\{[^}]*\}|"[^"]*"|'[^']*')/g,
        ),
      ].map(m => m[1]);

      // gloss + article + each multi-view section card all reuse proseStyle
      // but pass their own textBreakStrategy prop — 3 today (gloss, article,
      // the multi-view section Text).
      expect(matches.length).toBeGreaterThanOrEqual(3);
      for (const value of matches) {
        expect(value.startsWith('{')).toBe(false);
        expect(value.replace(/['"]/g, '')).toBe('simple');
      }
    });

    it('never reintroduces "highQuality" anywhere in real code (comments excluded)', () => {
      expect(stripped).not.toMatch(/highQuality/);
    });
  });
});
