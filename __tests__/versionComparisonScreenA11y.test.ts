import fs from 'fs';
import path from 'path';
import {translations} from '../src/i18n/translations';

/**
 * A11y gap fix — an audit found `VersionComparisonScreen.tsx` to be the
 * worst-covered screen in the app: ~11 icon-only buttons (back nav, view
 * toggle, saved-comparisons/save/share header icons, prev/next verse nav,
 * 3 modal close buttons, and per-item edit/delete on saved comparisons) had
 * no `accessibilityRole`/`accessibilityLabel`/`accessibilityState`, so
 * TalkBack/VoiceOver announced every one of them as a bare, contextless
 * "button" — worst of all the delete action on a saved comparison, which
 * gave no hint of WHICH comparison it would remove.
 *
 * Like `readerFavoriteHeartA11y.test.ts` (which guards the reader's
 * favorite-heart fix the same way), this is a source-text scan rather than a
 * rendered-component test: `VersionComparisonScreen` pulls in the DB layer,
 * the audio player context, language/theme hooks, and several comparison
 * services, so no test in this repo mounts it live. Anchoring on unique
 * fragments of each button's own `onPress`/`onRequestClose` callback and
 * asserting the accessibility props that immediately follow is a faithful,
 * low-maintenance proxy for "TalkBack announces the right, specific thing".
 *
 * The screen's share-image header button (`t.versionComparison.shareImage`)
 * already had correct a11y wiring before this fix and is intentionally left
 * untouched — it is not re-asserted here.
 */

function readSource(relPathFromRepoRoot: string): string {
  return fs.readFileSync(
    path.join(__dirname, '..', relPathFromRepoRoot),
    'utf8',
  );
}

const raw = readSource('src/screens/VersionComparisonScreen.tsx');

/**
 * Slices the source from the first occurrence of `anchor` (a fragment unique
 * to one button's callback) up to the next occurrence of `endMarker` (the
 * child element that starts right after the JSX opening tag closes) — i.e.
 * the region containing every prop declared between the callback and the
 * button's child icon, including the accessibility props added by this fix.
 *
 * Deliberately does NOT search for the tag-closing `>` directly: several of
 * these callbacks are arrow functions (`() => ...`), whose own `>` would be
 * found first and truncate the slice before the accessibility props.
 */
function sliceBetween(anchor: string, endMarker = '<Ionicons'): string {
  const anchorIndex = raw.indexOf(anchor);
  expect(anchorIndex).toBeGreaterThan(-1);
  // Must be unique — otherwise this slice could silently anchor on the wrong
  // button if the source ever grows another matching fragment.
  expect(raw.indexOf(anchor, anchorIndex + 1)).toBe(-1);
  const endIndex = raw.indexOf(endMarker, anchorIndex);
  expect(endIndex).toBeGreaterThan(anchorIndex);
  return raw.slice(anchorIndex, endIndex);
}

function expectKeyExistsForEveryLanguage(getValue: (t: any) => unknown) {
  for (const lang of Object.keys(translations) as Array<
    keyof typeof translations
  >) {
    const value = getValue(translations[lang]);
    expect(typeof value).toBe('string');
    expect((value as string).length).toBeGreaterThan(0);
  }
}

describe('VersionComparisonScreen — accessibility wiring', () => {
  it('header back button: role=button, label=t.bible.back', () => {
    const slice = sliceBetween('onPress={() => router.back()}');
    expect(slice).toMatch(/accessibilityRole="button"/);
    expect(slice).toMatch(/accessibilityLabel=\{t\.bible\.back\}/);
    expectKeyExistsForEveryLanguage(t => t.bible.back);
  });

  it('view-mode toggle: role=button, state bound to viewMode, label switches between grid/list actions', () => {
    const slice = sliceBetween(
      "setViewMode(viewMode === 'list' ? 'grid' : 'list')",
    );
    expect(slice).toMatch(/accessibilityRole="button"/);
    expect(slice).toMatch(
      /accessibilityState=\{\{selected:\s*viewMode === 'grid'\}\}/,
    );
    expect(slice).toMatch(/accessibilityLabel=\{/);
    expect(slice).toMatch(/t\.versionComparison\.switchToGridView/);
    expect(slice).toMatch(/t\.versionComparison\.switchToListView/);
    expectKeyExistsForEveryLanguage(t => t.versionComparison.switchToGridView);
    expectKeyExistsForEveryLanguage(t => t.versionComparison.switchToListView);
  });

  it('open-saved-comparisons header button: role=button, label=t.versionComparison.savedComparisons', () => {
    const slice = sliceBetween('setShowSavedComparisons(true);');
    expect(slice).toMatch(/accessibilityRole="button"/);
    expect(slice).toMatch(
      /accessibilityLabel=\{t\.versionComparison\.savedComparisons\}/,
    );
    expectKeyExistsForEveryLanguage(t => t.versionComparison.savedComparisons);
  });

  it('save-comparison circle button: role=button, label=t.versionComparison.saveComparison', () => {
    const slice = sliceBetween('onPress={() => setShowSaveDialog(true)}');
    expect(slice).toMatch(/accessibilityRole="button"/);
    expect(slice).toMatch(
      /accessibilityLabel=\{t\.versionComparison\.saveComparison\}/,
    );
    expectKeyExistsForEveryLanguage(t => t.versionComparison.saveComparison);
  });

  it('previous-verse nav button: role=button, label=t.verse.previousVerse', () => {
    const slice = sliceBetween(
      'onPress={() => setCurrentVerse(prev => Math.max(1, prev - 1))}',
    );
    expect(slice).toMatch(/accessibilityRole="button"/);
    expect(slice).toMatch(/accessibilityLabel=\{t\.verse\.previousVerse\}/);
    expectKeyExistsForEveryLanguage(t => t.verse.previousVerse);
  });

  it('next-verse nav button: role=button, label=t.verse.nextVerse', () => {
    const slice = sliceBetween(
      'setCurrentVerse(prev => Math.min(totalVerses, prev + 1))',
    );
    expect(slice).toMatch(/accessibilityRole="button"/);
    expect(slice).toMatch(/accessibilityLabel=\{t\.verse\.nextVerse\}/);
    expectKeyExistsForEveryLanguage(t => t.verse.nextVerse);
  });

  it.each([
    ['version-picker', 'onRequestClose={() => setShowVersionPicker(false)}>'],
    [
      'saved-comparisons',
      'onRequestClose={() => setShowSavedComparisons(false)}>',
    ],
    ['verse-picker', 'onRequestClose={() => setShowVersePicker(false)}>'],
  ])(
    '%s modal close (X) button: role=button, label=t.close',
    (_name, modalAnchor) => {
      const modalIndex = raw.indexOf(modalAnchor);
      expect(modalIndex).toBeGreaterThan(-1);
      // The close TouchableOpacity is the first accessibilityLabel={t.close}
      // that appears after this modal's own onRequestClose — i.e. the button
      // inside its own modalHeader, not a later modal's.
      const closeLabelIndex = raw.indexOf(
        'accessibilityLabel={t.close}',
        modalIndex,
      );
      expect(closeLabelIndex).toBeGreaterThan(modalIndex);
      const roleIndex = raw.lastIndexOf(
        'accessibilityRole="button"',
        closeLabelIndex,
      );
      expect(roleIndex).toBeGreaterThan(modalIndex);
      expectKeyExistsForEveryLanguage(t => t.close);
    },
  );

  it('per-item edit (pencil) button: role=button, label names the specific saved comparison', () => {
    const slice = sliceBetween('handleEditComparison(comp);');
    expect(slice).toMatch(/accessibilityRole="button"/);
    expect(slice).toMatch(
      /accessibilityLabel=\{`\$\{t\.versionComparison\.editComparison\}/,
    );
    expect(slice).toMatch(
      /comp\.name \|\| t\.versionComparison\.untitledComparison/,
    );
    expectKeyExistsForEveryLanguage(t => t.versionComparison.editComparison);
    expectKeyExistsForEveryLanguage(
      t => t.versionComparison.untitledComparison,
    );
  });

  it('per-item delete (trash) button: role=button, label names the specific saved comparison', () => {
    const slice = sliceBetween('handleDeleteComparison(comp.id);');
    expect(slice).toMatch(/accessibilityRole="button"/);
    expect(slice).toMatch(
      /accessibilityLabel=\{`\$\{t\.versionComparison\.deleteTitle\}/,
    );
    expect(slice).toMatch(
      /comp\.name \|\| t\.versionComparison\.untitledComparison/,
    );
    expectKeyExistsForEveryLanguage(t => t.versionComparison.deleteTitle);
  });

  it('the pre-existing share-image button is untouched (still correctly labeled)', () => {
    const slice = sliceBetween('onPress={handleShareImage}');
    expect(slice).toMatch(/accessibilityRole="button"/);
    expect(slice).toMatch(
      /accessibilityLabel=\{t\.versionComparison\.shareImage\}/,
    );
  });
});
