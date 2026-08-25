/**
 * Reading-preferences sheet — dictionary vs. reader `context` prop
 * (papercuts sweep, 2026-08-24). The sheet is shared by the verse reader
 * (app/(tabs)/verse/[book]/[chapter].tsx, chapter.web.tsx) and the
 * dictionary entry screen (app/features/dictionary/[slug].tsx). Reading
 * [slug].tsx directly (not assuming) confirms it has: no audio/Listen
 * affordance (no AudioPlayerContext/ImmersiveReader import, header only has
 * back + Aa buttons), no chapter concept (`router.back()`/`router.push`
 * only, no swipe gesture, no prev/next), and no scripture text with
 * red-letter markup (gloss/article bodies run through `MarkdownBody` over
 * plain dictionary prose, never `hasRedLetterData`-gated verse text). So the
 * Audio, Navigation and Red-letter-words sections are hidden for
 * `context="dictionary"`, while the 6 typography/layout sections (reading
 * theme, font, size, line spacing, alignment, margins) — all genuinely wired
 * into the dictionary screen's `proseStyle`/`readerPaddingHorizontal`/
 * `themedColors` — stay visible everywhere.
 *
 * This pins 3 things:
 *   1. Section/coverage matrix: `context="dictionary"` hides exactly those 3
 *      sections + their controls; `context="reader"` AND the no-prop default
 *      (every pre-existing call site) show all of them — the default must
 *      not silently change the reader's behavior.
 *   2. Hiding a control never mutates `ReaderPreferencesContext`: toggling
 *      swipe-nav/red-letter from the reader, reopening the SAME sheet
 *      instance in dictionary context and back, leaves both exactly as the
 *      user set them.
 *   3. The header reset button is scoped in dictionary context to only the
 *      6 visible fields — it must NOT silently reset the 3 hidden ones
 *      (which would corrupt them for the next real-reader visit); in reader
 *      context the reset still restores everything, unchanged from before.
 */

import {render, fireEvent} from '@testing-library/react-native';
import {ReaderPreferencesSheet} from '../src/components/reading/ReaderPreferencesSheet';
import {
  ReaderPreferencesProvider,
  DEFAULT_READER_PREFERENCES,
} from '../src/context/ReaderPreferencesContext';
import {PremiumProvider} from '../src/context/PremiumContext';
import {translations} from '../src/i18n/translations';

const t = translations.es;

const mockColors = {
  background: '#ffffff',
  surface: '#f8fafc',
  surfaceVariant: '#f1f5f9',
  card: '#ffffff',
  text: '#0f172a',
  textSecondary: '#475569',
  textTertiary: '#94a3b8',
  primary: '#1d4ed8',
  border: '#cbd5e1',
};

jest.mock('../src/hooks/useTheme', () => ({
  useTheme: () => ({colors: mockColors, isDark: false}),
}));

jest.mock('../src/hooks/useLanguage', () => ({
  useLanguage: () => ({
    language: 'es',
    t: require('../src/i18n/translations').translations.es,
  }),
}));

jest.mock('../src/lib/haptics', () => ({
  haptics: {tap: jest.fn()},
}));

jest.mock('../src/context/OfferingSheetContext', () => ({
  useOfferingSheet: () => ({open: jest.fn()}),
}));

// The red-letter Switch is `disabled` unless the active version has real
// red-letter data (ReaderPreferencesSheetRedLetterAvailability.test.tsx) —
// WEB here so the state-preservation test below can actually flip it rather
// than have `onValueChange` be a silent no-op on a disabled control.
jest.mock('../src/hooks/useBibleVersion', () => ({
  useBibleVersionOptional: () => ({
    selectedVersion: {id: 'WEB', language: 'en', abbreviation: 'WEB'},
  }),
}));

function sheetTree(context?: 'reader' | 'dictionary') {
  return (
    <PremiumProvider>
      <ReaderPreferencesProvider>
        <ReaderPreferencesSheet
          visible
          onClose={jest.fn()}
          {...(context ? {context} : {})}
        />
      </ReaderPreferencesProvider>
    </PremiumProvider>
  );
}

const hiddenSectionTitles = [
  t.readerPrefs.audioSection,
  t.readerPrefs.navigationSection,
  t.readerPrefs.redLetterSection,
];
const hiddenControlLabels = [
  t.readerPrefs.autoImmersive,
  t.readerPrefs.swipeChapterNav,
  t.readerPrefs.redLetterWords,
];
const alwaysVisibleSectionTitles = [
  t.readerPrefs.theme,
  t.readerPrefs.font,
  t.readerPrefs.size,
  t.readerPrefs.lineSpacing,
  t.readerPrefs.alignment,
  t.readerPrefs.margin,
];

describe('ReaderPreferencesSheet — dictionary vs. reader context', () => {
  it("shows every section with no context prop — the default preserves every existing call site's behavior", () => {
    const {queryByText, queryByLabelText} = render(sheetTree(undefined));
    for (const title of [
      ...alwaysVisibleSectionTitles,
      ...hiddenSectionTitles,
    ]) {
      expect(queryByText(title)).toBeTruthy();
    }
    for (const label of hiddenControlLabels) {
      expect(queryByLabelText(label)).toBeTruthy();
    }
  });

  it('shows every section with context="reader"', () => {
    const {queryByText, queryByLabelText} = render(sheetTree('reader'));
    for (const title of [
      ...alwaysVisibleSectionTitles,
      ...hiddenSectionTitles,
    ]) {
      expect(queryByText(title)).toBeTruthy();
    }
    for (const label of hiddenControlLabels) {
      expect(queryByLabelText(label)).toBeTruthy();
    }
  });

  it('hides audio/navigation/red-letter (section + control) with context="dictionary", keeping the 6 typography sections', () => {
    const {queryByText, queryByLabelText} = render(sheetTree('dictionary'));
    for (const title of alwaysVisibleSectionTitles) {
      expect(queryByText(title)).toBeTruthy();
    }
    for (const title of hiddenSectionTitles) {
      expect(queryByText(title)).toBeNull();
    }
    for (const label of hiddenControlLabels) {
      expect(queryByLabelText(label)).toBeNull();
    }
  });

  it('never mutates the hidden preferences: toggling them in reader context, reopening in dictionary context and back, preserves the exact values', () => {
    const {rerender, getByLabelText, queryByLabelText} = render(
      sheetTree('reader'),
    );

    // Defaults per DEFAULT_READER_PREFERENCES: swipe off, red-letter on.
    const swipeToggle = getByLabelText(t.readerPrefs.swipeChapterNav);
    const redLetterToggle = getByLabelText(t.readerPrefs.redLetterWords);
    expect(swipeToggle.props.value).toBe(false);
    expect(redLetterToggle.props.value).toBe(true);

    fireEvent(swipeToggle, 'valueChange', true);
    fireEvent(redLetterToggle, 'valueChange', false);
    expect(getByLabelText(t.readerPrefs.swipeChapterNav).props.value).toBe(
      true,
    );
    expect(getByLabelText(t.readerPrefs.redLetterWords).props.value).toBe(
      false,
    );

    // Re-render the SAME sheet instance in dictionary context — the
    // Provider tree stays mounted across `rerender`, so in-memory state
    // survives the flip (no AsyncStorage hydration timing to fight).
    rerender(sheetTree('dictionary'));
    expect(queryByLabelText(t.readerPrefs.swipeChapterNav)).toBeNull();
    expect(queryByLabelText(t.readerPrefs.redLetterWords)).toBeNull();

    // Flip back to reader context — both toggled values must have held,
    // untouched by being hidden in between.
    rerender(sheetTree('reader'));
    expect(getByLabelText(t.readerPrefs.swipeChapterNav).props.value).toBe(
      true,
    );
    expect(getByLabelText(t.readerPrefs.redLetterWords).props.value).toBe(
      false,
    );
  });

  it('scopes the header reset in dictionary context to only the 6 visible fields, leaving a hidden preference exactly as the user set it', () => {
    const {getByLabelText, rerender} = render(sheetTree('reader'));

    // Turn on a preference that dictionary context hides.
    fireEvent(
      getByLabelText(t.readerPrefs.swipeChapterNav),
      'valueChange',
      true,
    );

    rerender(sheetTree('dictionary'));

    // Move a visible field away from its default (margin: medium -> large).
    fireEvent.press(getByLabelText(t.readerPrefs.marginLarge));
    expect(
      getByLabelText(t.readerPrefs.marginLarge).props.accessibilityState,
    ).toEqual({selected: true});

    // Reset from the dictionary-context header button.
    fireEvent.press(getByLabelText(t.readerPrefs.reset));

    // The visible field is restored to its default...
    expect(
      getByLabelText(t.readerPrefs.marginMedium).props.accessibilityState,
    ).toEqual({selected: true});
    expect(
      getByLabelText(t.readerPrefs.marginLarge).props.accessibilityState,
    ).toEqual({selected: false});

    // ...but the hidden swipe-navigation preference must be untouched by
    // that reset — confirmed by flipping back to reader context, where its
    // control is visible again.
    rerender(sheetTree('reader'));
    expect(getByLabelText(t.readerPrefs.swipeChapterNav).props.value).toBe(
      true,
    );
  });

  it('context="reader" reset still restores every field, including swipe-navigation (unchanged pre-existing behavior)', () => {
    const {getByLabelText} = render(sheetTree('reader'));

    fireEvent(
      getByLabelText(t.readerPrefs.swipeChapterNav),
      'valueChange',
      true,
    );
    expect(getByLabelText(t.readerPrefs.swipeChapterNav).props.value).toBe(
      true,
    );

    fireEvent.press(getByLabelText(t.readerPrefs.reset));

    expect(getByLabelText(t.readerPrefs.swipeChapterNav).props.value).toBe(
      DEFAULT_READER_PREFERENCES.swipeChapterNavigation,
    );
  });
});
