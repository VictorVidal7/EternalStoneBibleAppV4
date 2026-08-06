import fs from 'fs';
import path from 'path';
import {translations} from '../src/i18n/translations';

/**
 * A11y gap fix — the reader's per-verse favorite heart icon
 * (`app/(tabs)/verse/[book]/[chapter].tsx`, `styles.favoriteIndicator`) had
 * no `accessibilityLabel`/`accessibilityRole`/`accessibilityState`, so
 * TalkBack/VoiceOver announced it as a bare unlabeled "button" with no hint
 * of what it did or its current (favorited) state.
 *
 * This file, like the same directory's `justifyClipRegressionGuard.test.ts`
 * (which also guards this exact screen), is a source-text scan rather than a
 * rendered-component test. `[chapter].tsx` pulls in ~15 contexts plus audio/
 * sync/database/gesture-handler wiring — no test in this repo fully mounts
 * it, and building a from-scratch render harness just for this one control
 * would be disproportionate to the fix. Anchoring on the unique
 * `styles.favoriteIndicator` JSX block and asserting its exact prop wiring
 * is a faithful, low-maintenance proxy for "TalkBack announces the right
 * thing" without needing a live accessibility tree.
 *
 * Important caveat (NOT papered over): this button only ever MOUNTS while
 * `isFavorited` is true (see the `{isFavorited && (...)}` guard around it),
 * so today only the "favorited, tap to remove" state is ever reachable at
 * runtime — the `t.verse.addFavorite` half of the label ternary is
 * currently dead code, kept only so the wiring stays correct if that guard
 * is ever relaxed. This test pins the STATIC wiring (both ternary branches
 * present, state bound to the live `isFavorited` variable) — it does not
 * and cannot exercise two different rendered states, because the component
 * itself doesn't offer one.
 */

function readSource(relPathFromRepoRoot: string): string {
  return fs.readFileSync(
    path.join(__dirname, '..', relPathFromRepoRoot),
    'utf8',
  );
}

describe('reader favorite heart — accessibility wiring (app/(tabs)/verse/[book]/[chapter].tsx)', () => {
  const raw = readSource('app/(tabs)/verse/[book]/[chapter].tsx');

  // Anchored on the unique style reference so this can't accidentally match
  // one of the file's many OTHER `accessibilityRole="button"` elements.
  const startMarker = 'style={styles.favoriteIndicator}';
  const startIndex = raw.indexOf(startMarker);

  it('the favoriteIndicator block exists exactly once', () => {
    expect(startIndex).toBeGreaterThan(-1);
    expect(raw.indexOf(startMarker, startIndex + 1)).toBe(-1);
  });

  // Slice from the style prop through the JSX element's closing `>` (the
  // Ionicons child starts right after), so every prop asserted below is
  // scoped to this one TouchableOpacity.
  const closeIndex = raw.indexOf('>', startIndex);
  const slice = raw.slice(startIndex, closeIndex + 1);

  it('declares accessibilityRole="button"', () => {
    expect(slice).toMatch(/accessibilityRole="button"/);
  });

  it('binds accessibilityState to the live isFavorited value, not a hardcoded boolean', () => {
    expect(slice).toMatch(/accessibilityState=\{\{selected:\s*isFavorited\}\}/);
  });

  it('labels both toggle directions via the same i18n keys VerseOfDayCard uses, ordered on isFavorited', () => {
    // Mirrors src/components/celestial/VerseOfDayCard.tsx's own favorite
    // toggle exactly: `isFavorited ? t.verse.removeFavorite :
    // t.verse.addFavorite` — no hardcoded Spanish/English strings.
    expect(slice).toMatch(/accessibilityLabel=\{/);
    expect(slice).toMatch(/isFavorited/);
    expect(slice).toMatch(/\?\s*t\.verse\.removeFavorite/);
    expect(slice).toMatch(/:\s*t\.verse\.addFavorite/);
  });

  it('both i18n keys referenced actually exist for every supported language', () => {
    for (const lang of Object.keys(translations) as Array<
      keyof typeof translations
    >) {
      expect(typeof translations[lang].verse.addFavorite).toBe('string');
      expect(typeof translations[lang].verse.removeFavorite).toBe('string');
      expect(translations[lang].verse.addFavorite.length).toBeGreaterThan(0);
      expect(translations[lang].verse.removeFavorite.length).toBeGreaterThan(0);
    }
  });
});
