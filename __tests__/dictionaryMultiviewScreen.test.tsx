/**
 * Tanda 5 (v2 multi-view, Bautismo/Milenio) — the dictionary detail screen's
 * `treatment === 'multi-view'` branch. Mirrors quizExitConfirm.test.tsx's
 * lighter `jest.mock('@context/PremiumContext', ...)` idiom (a mocked
 * `isPremium` flag) rather than the heavier real-PremiumProvider integration
 * style, since the screen only reads `isPremium`/`open()`, nothing deeper.
 *
 * Covers: the gloss is always visible; premium renders N labeled section
 * cards (one per `dictionary_multiview_sections` row, in position order);
 * free shows a single locked row (not N locked rows) that opens the
 * offering sheet; the pre-existing single-article (`treatment: 'annotated'`)
 * branch is untouched by the new code path.
 *
 * Also covers the "Aa" reading-preferences wiring added alongside: the screen
 * reuses the SAME global `ReaderPreferencesContext`/`ReaderPreferencesSheet`
 * as the main verse reader (no dictionary-scoped store), so `resolveFontFamily`
 * and the sheet itself are mocked the same lightweight way
 * propheticThreadBackAndHeader.test.tsx mocks a heavy child sheet.
 */
import React from 'react';
import {render, fireEvent} from '@testing-library/react-native';
import {ScrollView, StyleSheet} from 'react-native';
import DictionaryDetailScreen from '../app/features/dictionary/[slug]';
import {translations} from '../src/i18n/translations';

let mockSlug = 'bautismo';
// Hoisted so assertions can inspect calls — a fresh `jest.fn()` returned
// anew on every `useRouter()` call (the previous shape) can never be
// asserted against by the test.
const mockPush = jest.fn();
const mockBack = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({push: mockPush, back: mockBack}),
  useLocalSearchParams: () => ({slug: mockSlug}),
  Stack: {Screen: () => null},
}));

// `onPrimary` deliberately differs from staticColors.white (#FFFFFF) so a
// component that still reads the hardcoded white instead of colors.onPrimary
// fails the assertion below instead of passing by coincidence (same idiom as
// DonationSheet.test.tsx / OfferingSheet.test.tsx's Tanda K regression guard).
const mockIonicons = jest.fn((_props: {name?: string; color?: string}) => null);
jest.mock('@expo/vector-icons', () => ({
  Ionicons: (props: {name?: string; color?: string}) => mockIonicons(props),
}));

jest.mock('expo-linear-gradient', () => {
  const {View} = require('react-native');
  return {LinearGradient: View};
});

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({top: 0, bottom: 0, left: 0, right: 0}),
}));

jest.mock('@hooks/useTheme', () => ({
  useTheme: () => ({
    colors: {
      background: '#000000',
      surface: '#111111',
      border: '#222222',
      primary: '#6366f1',
      primaryDark: '#4338ca',
      onPrimary: '#00ff00',
      text: '#ffffff',
      textSecondary: '#cccccc',
      textTertiary: '#999999',
    },
    gradient: {headerColors: ['#000000', '#000000']},
    highContrast: false,
  }),
}));

jest.mock('@hooks/useLanguage', () => ({
  useLanguage: () => ({
    language: 'es',
    t: require('../src/i18n/translations').translations.es,
  }),
}));

jest.mock('@lib/haptics', () => ({
  haptics: {tap: jest.fn(), selection: jest.fn()},
}));

// Reuses the SAME global reader-preferences store as the verse reader — no
// dictionary-scoped preferences. Mutable per-test so font/size/align wiring
// can be asserted against a non-default value.
let mockReaderPrefs = {
  fontFamily: 'sans',
  fontSize: 16,
  lineHeightMultiplier: 1.6,
  textAlign: 'left' as 'left' | 'justify',
  margin: 'medium',
  theme: 'system',
};
jest.mock('@context/ReaderPreferencesContext', () => ({
  useReaderPreferences: () => ({preferences: mockReaderPrefs}),
  // The screen imports this alongside `useReaderPreferences` (margin →
  // horizontal padding wiring) — must match the real module's values
  // (`src/context/ReaderPreferencesContext.tsx`) or the margin assertions
  // below would pass for the wrong reason.
  READER_MARGIN_PADDING: {small: 12, medium: 24, large: 40},
}));

// The real sheet has its own dedicated test suite (ReaderPreferencesSheet*
// .test.tsx) — here it's stubbed to a prop probe so this file can assert the
// screen actually opens it, without pulling in premium/offering wiring
// again. `resolveFontFamily`/`resolveFontFamilyBold` stay simple and
// deterministic so the font wiring assertion below doesn't depend on the
// real bundled typeface catalog.
jest.mock('@components/reading/ReaderPreferencesSheet', () => {
  const {Text} = require('react-native');
  const ReactLib = require('react');
  return {
    ReaderPreferencesSheet: ({visible}: {visible: boolean}) =>
      visible
        ? ReactLib.createElement(Text, null, 'reader-prefs-sheet-open')
        : null,
    resolveFontFamily: (family: string) => `${family}-regular`,
    resolveFontFamilyBold: (family: string) => `${family}-bold`,
  };
});

// Mutable per-test, same pattern as memoryInsightsRestoreBanner.test.tsx /
// hcHeaderGradients.test.tsx's own mutable mock flags.
let mockIsPremium = false;
jest.mock('@context/PremiumContext', () => ({
  usePremium: () => ({isPremium: mockIsPremium}),
}));

const mockOpenOfferingSheet = jest.fn();
jest.mock('@context/OfferingSheetContext', () => ({
  useOfferingSheet: () => ({open: mockOpenOfferingSheet}),
}));

const BAUTISMO_ENTRY = {
  slug: 'bautismo',
  headword_es: 'BAUTISMO',
  gloss_es: 'El bautismo es el rito de iniciación cristiana.',
  article_es: null,
  source_tier: 'v2-doctrinal',
  treatment: 'multi-view',
  updated_at: '2026-07-21',
};

const BAUTISMO_SECTIONS = [
  {
    slug: 'bautismo',
    position: 1,
    label_es: 'Bautista',
    body_es: 'Texto bautista.',
  },
  {
    slug: 'bautismo',
    position: 2,
    label_es: 'No-inmersionista',
    body_es: 'Texto no-inmersionista.',
  },
  {
    slug: 'bautismo',
    position: 3,
    label_es: 'Luterana',
    body_es: 'Texto luterano.',
  },
];

const ANNOTATED_ENTRY = {
  slug: 'expiacion',
  headword_es: 'EXPIACIÓN',
  gloss_es: 'La expiación es la obra de Cristo.',
  article_es: 'Artículo completo sobre expiación.',
  source_tier: 'v2-doctrinal',
  treatment: 'annotated',
  updated_at: '2026-07-21',
};

// A citation-bearing gloss for the linkify tests below — "Lv 16" resolves
// against `src/constants/bible.ts`'s Levítico `abbr` ('Lv') without a verse,
// exercising the base-URL-only branch of `handleReferencePress`.
const REFERENCE_ENTRY = {
  slug: 'referencia-prueba',
  headword_es: 'REFERENCIA DE PRUEBA',
  gloss_es: 'Véase Lv 16 para más detalles.',
  article_es: null,
  source_tier: 'v1',
  treatment: 'annotated',
  updated_at: '2026-07-21',
};

const mockGetDictionaryEntry = jest.fn();
const mockGetDictionaryMultiviewSections = jest.fn();
// "Ver también" (RELATED_DICTIONARY_SLUGS-driven) resolves related headwords
// through this same query whenever the loaded entry has related slugs —
// defaults to empty so every pre-existing test in this file (most of which
// use `bautismo`, which DOES have a related slug) keeps rendering exactly
// what it did before that feature existed. Tests that actually exercise
// "Ver también" below override this per-call.
const mockGetAllDictionaryEntries = jest.fn(
  async (): Promise<
    {slug: string; headword_es: string; gloss_es: string}[]
  > => [],
);
jest.mock('@lib/database', () => ({
  __esModule: true,
  default: {
    initialize: jest.fn(async () => undefined),
    getDictionaryEntry: (...args: unknown[]) => mockGetDictionaryEntry(...args),
    getDictionaryMultiviewSections: (...args: unknown[]) =>
      mockGetDictionaryMultiviewSections(...args),
    getAllDictionaryEntries: () => mockGetAllDictionaryEntries(),
  },
}));

describe('DictionaryDetailScreen — multi-view branch (Bautismo, Milenio)', () => {
  beforeEach(() => {
    mockSlug = 'bautismo';
    mockIsPremium = false;
    mockOpenOfferingSheet.mockClear();
    mockGetDictionaryEntry.mockReset();
    mockGetDictionaryMultiviewSections.mockReset();
    mockGetAllDictionaryEntries.mockReset().mockResolvedValue([]);
    mockIonicons.mockClear();
    mockPush.mockClear();
    mockBack.mockClear();
    mockReaderPrefs = {
      fontFamily: 'sans',
      fontSize: 16,
      lineHeightMultiplier: 1.6,
      textAlign: 'left',
      margin: 'medium',
      theme: 'system',
    };
  });

  it('premium: renders all 3 labeled section cards, gloss always visible', async () => {
    mockIsPremium = true;
    mockGetDictionaryEntry.mockResolvedValue(BAUTISMO_ENTRY);
    mockGetDictionaryMultiviewSections.mockResolvedValue(BAUTISMO_SECTIONS);

    const {findByText} = render(<DictionaryDetailScreen />);

    expect(
      await findByText('El bautismo es el rito de iniciación cristiana.'),
    ).toBeTruthy();
    expect(await findByText('Bautista')).toBeTruthy();
    expect(await findByText('Texto bautista.')).toBeTruthy();
    expect(await findByText('No-inmersionista')).toBeTruthy();
    expect(await findByText('Texto no-inmersionista.')).toBeTruthy();
    expect(await findByText('Luterana')).toBeTruthy();
    expect(await findByText('Texto luterano.')).toBeTruthy();

    expect(mockGetDictionaryMultiviewSections).toHaveBeenCalledWith('bautismo');
  });

  it('free: shows one locked row (not the section bodies), opens the offering sheet on press', async () => {
    mockIsPremium = false;
    mockGetDictionaryEntry.mockResolvedValue(BAUTISMO_ENTRY);
    mockGetDictionaryMultiviewSections.mockResolvedValue(BAUTISMO_SECTIONS);

    const {findByText, queryByText} = render(<DictionaryDetailScreen />);

    expect(
      await findByText('El bautismo es el rito de iniciación cristiana.'),
    ).toBeTruthy();
    const lockedRow = await findByText(translations.es.dictionary.viewsLocked);
    expect(lockedRow).toBeTruthy();

    // The gated body text never rendered — free means free, no leaked
    // premium content.
    expect(queryByText('Texto bautista.')).toBeNull();
    expect(queryByText('Bautista')).toBeNull();

    fireEvent.press(lockedRow);
    expect(mockOpenOfferingSheet).toHaveBeenCalledTimes(1);
  });

  it('does not touch the pre-existing single-article (annotated) branch', async () => {
    mockSlug = 'expiacion';
    mockIsPremium = true;
    mockGetDictionaryEntry.mockResolvedValue(ANNOTATED_ENTRY);
    mockGetDictionaryMultiviewSections.mockResolvedValue([]);

    const {findByText, queryByText} = render(<DictionaryDetailScreen />);

    expect(await findByText('Artículo completo sobre expiación.')).toBeTruthy();
    // No "different views" section for a single-article entry.
    expect(queryByText(translations.es.dictionary.viewsLabel)).toBeNull();
    expect(mockGetDictionaryMultiviewSections).not.toHaveBeenCalled();
  });

  it('"Aa" button opens the same global ReaderPreferencesSheet used by the verse reader', async () => {
    mockIsPremium = true;
    mockGetDictionaryEntry.mockResolvedValue(ANNOTATED_ENTRY);
    mockGetDictionaryMultiviewSections.mockResolvedValue([]);

    const {findByLabelText, findByText, queryByText} = render(
      <DictionaryDetailScreen />,
    );

    expect(await findByText('Artículo completo sobre expiación.')).toBeTruthy();
    expect(queryByText('reader-prefs-sheet-open')).toBeNull();

    fireEvent.press(
      await findByLabelText(translations.es.readerPrefs.openLabel),
    );

    expect(await findByText('reader-prefs-sheet-open')).toBeTruthy();
  });

  it('wires fontFamily/fontSize/textAlign from the global reader preferences into the gloss text', async () => {
    mockReaderPrefs = {
      fontFamily: 'serif',
      fontSize: 22,
      lineHeightMultiplier: 1.8,
      textAlign: 'justify',
      margin: 'large',
      theme: 'system',
    };
    mockGetDictionaryEntry.mockResolvedValue(BAUTISMO_ENTRY);
    mockGetDictionaryMultiviewSections.mockResolvedValue([]);

    const {findByText} = render(<DictionaryDetailScreen />);

    const glossNode = await findByText(
      'El bautismo es el rito de iniciación cristiana.',
    );
    const flat = StyleSheet.flatten(glossNode.props.style) as {
      fontFamily?: string;
      fontSize?: number;
      textAlign?: string;
    };
    expect(flat.fontFamily).toBe('serif-regular');
    expect(flat.fontSize).toBe(22);
    expect(flat.textAlign).toBe('justify');
  });

  // Sprint 112 regression guard ("nunca jamás" — the reader's right-edge
  // clip saga, closed 2026-07-28, live on main): this screen was the one
  // outlier still giving justified text a MARGIN-based gutter and/or
  // 'highQuality' textBreakStrategy instead of the unconditional
  // paddingRight + 'simple' every other reading surface uses. Covers all 3
  // prose surfaces that share `proseStyle` — gloss, article, and a
  // multi-view section body — in one render, under 'justify' (the alignment
  // the old, disproven pattern singled out).
  it('Sprint 112 guard: gloss/article/multi-view prose text never conditions margin or textBreakStrategy on justify', async () => {
    mockReaderPrefs = {
      fontFamily: 'sans',
      fontSize: 16,
      lineHeightMultiplier: 1.6,
      textAlign: 'justify',
      margin: 'medium',
      theme: 'system',
    };
    mockIsPremium = true;
    mockGetDictionaryEntry.mockResolvedValue({
      ...BAUTISMO_ENTRY,
      article_es: 'Artículo completo sobre el bautismo.',
    });
    mockGetDictionaryMultiviewSections.mockResolvedValue(BAUTISMO_SECTIONS);

    const {findByText} = render(<DictionaryDetailScreen />);

    const glossNode = await findByText(
      'El bautismo es el rito de iniciación cristiana.',
    );
    const articleNode = await findByText(
      'Artículo completo sobre el bautismo.',
    );
    const sectionNode = await findByText('Texto bautista.');

    for (const [label, node] of [
      ['gloss', glossNode],
      ['article', articleNode],
      ['multi-view section', sectionNode],
    ] as const) {
      const flat = StyleSheet.flatten(node.props.style) as {
        marginLeft?: number;
        marginRight?: number;
        paddingRight?: number;
        textAlign?: string;
      };
      expect({label, textAlign: flat.textAlign}).toEqual({
        label,
        textAlign: 'justify',
      });
      // The old, disproven pattern gave justified text a non-zero
      // marginRight (and sometimes marginLeft) instead of padding — both
      // must stay absent, exactly like left-align.
      expect({label, marginLeft: flat.marginLeft}).toEqual({
        label,
        marginLeft: undefined,
      });
      expect({label, marginRight: flat.marginRight}).toEqual({
        label,
        marginRight: undefined,
      });
      expect({label, hasPaddingRight: (flat.paddingRight ?? 0) > 0}).toEqual({
        label,
        hasPaddingRight: true,
      });
      // RN's Android default is 'highQuality' (denser packing, the actual
      // source of the clip) — must always be the explicit 'simple' literal.
      expect({label, textBreakStrategy: node.props.textBreakStrategy}).toEqual({
        label,
        textBreakStrategy: 'simple',
      });
    }
  });

  it('the free/premium lock badge icon reads colors.onPrimary, not a hardcoded white', async () => {
    mockIsPremium = false;
    mockGetDictionaryEntry.mockResolvedValue(BAUTISMO_ENTRY);
    mockGetDictionaryMultiviewSections.mockResolvedValue(BAUTISMO_SECTIONS);

    const {findByText} = render(<DictionaryDetailScreen />);
    expect(
      await findByText(translations.es.dictionary.viewsLocked),
    ).toBeTruthy();

    const lockBadgeCall = mockIonicons.mock.calls.find(
      ([props]) => props.name === 'leaf-outline',
    );
    expect(lockBadgeCall).toBeTruthy();
    expect(lockBadgeCall?.[0].color).toBe('#00ff00');
  });

  // Previously margin had ZERO effect on the screen — READER_MARGIN_PADDING
  // was never read, so the horizontal gutter was hardcoded at module scope
  // (`styles.content`'s `padding: spacing.lg`) and couldn't react to the
  // preference. This is the regression guard for that fix.
  it('wires the margin preference into the horizontal padding around the entry card', async () => {
    mockReaderPrefs = {
      fontFamily: 'sans',
      fontSize: 16,
      lineHeightMultiplier: 1.6,
      textAlign: 'left',
      margin: 'large',
      theme: 'system',
    };
    mockGetDictionaryEntry.mockResolvedValue(BAUTISMO_ENTRY);
    mockGetDictionaryMultiviewSections.mockResolvedValue([]);

    const {findByText, UNSAFE_getByType} = render(<DictionaryDetailScreen />);
    await findByText('El bautismo es el rito de iniciación cristiana.');

    const scrollView = UNSAFE_getByType(ScrollView);
    const flat = StyleSheet.flatten(scrollView.props.contentContainerStyle) as {
      paddingHorizontal?: number;
    };
    // READER_MARGIN_PADDING.large (src/context/ReaderPreferencesContext.tsx),
    // NOT the old hardcoded spacing.lg (24) that ignored the preference.
    expect(flat.paddingHorizontal).toBe(40);
  });

  // Previously theme had ZERO effect on the screen — resolveReaderTheme was
  // never called, so every color came from the plain app `useTheme()`
  // regardless of the Aa sheet's Night/Sepia/Musgo selection. This is the
  // regression guard for that fix.
  it('wires the theme preference into the reading-surface colors (gloss + entry card)', async () => {
    mockReaderPrefs = {
      fontFamily: 'sans',
      fontSize: 16,
      lineHeightMultiplier: 1.6,
      textAlign: 'left',
      margin: 'medium',
      theme: 'night',
    };
    mockGetDictionaryEntry.mockResolvedValue(BAUTISMO_ENTRY);
    mockGetDictionaryMultiviewSections.mockResolvedValue([]);

    const {findByText} = render(<DictionaryDetailScreen />);
    const glossNode = await findByText(
      'El bautismo es el rito de iniciación cristiana.',
    );
    const flat = StyleSheet.flatten(glossNode.props.style) as {color?: string};
    // Night theme's textSecondary (src/styles/readerThemes.ts) — NOT the
    // mocked app colors.textSecondary ('#cccccc'), proving the reading-theme
    // palette actually applies instead of the plain app theme leaking through.
    expect(flat.color).toBe('#A39E92');
    expect(flat.color).not.toBe('#cccccc');
  });

  // 'system' (the default) must resolve back to the live app colors so an
  // existing user who never opens the Aa sheet sees zero visual change.
  it("'system' theme (default) keeps the plain app colors on the gloss", async () => {
    mockGetDictionaryEntry.mockResolvedValue(BAUTISMO_ENTRY);
    mockGetDictionaryMultiviewSections.mockResolvedValue([]);

    const {findByText} = render(<DictionaryDetailScreen />);
    const glossNode = await findByText(
      'El bautismo es el rito de iniciación cristiana.',
    );
    const flat = StyleSheet.flatten(glossNode.props.style) as {color?: string};
    expect(flat.color).toBe('#cccccc'); // mocked colors.textSecondary
  });

  // Part 3 — dictionary citations become tappable, same recognizer + tap-to-
  // jump affordance already used inline in the main verse reader.
  it('linkifies an inline Bible citation in the gloss and navigates to it on tap', async () => {
    mockSlug = 'referencia-prueba';
    mockGetDictionaryEntry.mockResolvedValue(REFERENCE_ENTRY);
    mockGetDictionaryMultiviewSections.mockResolvedValue([]);

    const {findByText} = render(<DictionaryDetailScreen />);
    const refNode = await findByText('Lv 16');
    fireEvent.press(refNode);

    expect(mockPush).toHaveBeenCalledTimes(1);
    // No verse in "Lv 16" — chapter-only jump, base URL with no `?verse=`.
    expect(mockPush).toHaveBeenCalledWith('/verse/Levítico/16');
  });

  it('a gloss with no recognizable citation renders as plain text, unaffected', async () => {
    mockGetDictionaryEntry.mockResolvedValue(BAUTISMO_ENTRY);
    mockGetDictionaryMultiviewSections.mockResolvedValue([]);

    const {findByText} = render(<DictionaryDetailScreen />);
    expect(
      await findByText('El bautismo es el rito de iniciación cristiana.'),
    ).toBeTruthy();
    expect(mockPush).not.toHaveBeenCalled();
  });

  // "Ver también" (RELATED_DICTIONARY_SLUGS) — additive navigation, always
  // free (rendered regardless of `isPremium`).
  it('"Ver también" renders the related entry and navigates to it on tap', async () => {
    mockGetDictionaryEntry.mockResolvedValue(BAUTISMO_ENTRY);
    mockGetDictionaryMultiviewSections.mockResolvedValue([]);
    mockGetAllDictionaryEntries.mockResolvedValue([
      {
        slug: 'espiritu-santo',
        headword_es: 'ESPÍRITU SANTO',
        gloss_es: 'El Espíritu Santo es Dios mismo.',
      },
      // A third, unrelated entry confirms the section only lists the slugs
      // named in RELATED_DICTIONARY_SLUGS, not every bundled entry.
      {
        slug: 'sanedrin',
        headword_es: 'SANEDRÍN',
        gloss_es: 'El Sanedrín era el tribunal supremo.',
      },
    ]);

    const {findByText, queryByText} = render(<DictionaryDetailScreen />);
    const relatedLink = await findByText('Espíritu Santo');
    expect(queryByText('Sanedrín')).toBeNull();

    fireEvent.press(relatedLink);
    expect(mockPush).toHaveBeenCalledWith(
      '/features/dictionary/espiritu-santo',
    );
  });

  it('renders no "Ver también" section for an entry with no related slugs', async () => {
    mockGetDictionaryEntry.mockResolvedValue(ANNOTATED_ENTRY); // expiacion
    mockGetDictionaryMultiviewSections.mockResolvedValue([]);

    const {findByText} = render(<DictionaryDetailScreen />);
    await findByText('La expiación es la obra de Cristo.');
    expect(mockGetAllDictionaryEntries).not.toHaveBeenCalled();
    expect(translations.es.dictionary.relatedLabel).toBe('Ver también');
  });

  // Nave's Topical Bible cross-reference panel — allow-listed to exactly 6
  // slugs (`NAVES_ALLOWLIST` in dictionaryNaves.ts); always free, same as
  // "Ver también". `nazaret` is one of the 6 and uses the 'annotated'
  // treatment, same shape as REFERENCE_ENTRY above.
  it("renders the Nave's Topical Bible panel for an allow-listed entry", async () => {
    mockSlug = 'nazaret';
    mockGetDictionaryEntry.mockResolvedValue({
      slug: 'nazaret',
      headword_es: 'NAZARET',
      gloss_es: 'Nazaret era un pequeño pueblo de Galilea.',
      article_es: null,
      source_tier: 'v1-factual',
      treatment: 'annotated',
      updated_at: '2026-07-18',
    });
    mockGetDictionaryMultiviewSections.mockResolvedValue([]);

    const {findByText} = render(<DictionaryDetailScreen />);
    await findByText('Nazaret era un pequeño pueblo de Galilea.');
    expect(await findByText('José y María viven allí')).toBeTruthy();
    // A citation from the panel is independently tappable, same recognizer
    // as the gloss/article body.
    const citation = await findByText('Mateo 2:23');
    fireEvent.press(citation);
    expect(mockPush).toHaveBeenCalledWith('/verse/Mateo/2?verse=23');
  });

  it("renders no Nave's panel for an entry outside the allow-list", async () => {
    mockGetDictionaryEntry.mockResolvedValue(BAUTISMO_ENTRY);
    mockGetDictionaryMultiviewSections.mockResolvedValue([]);

    const {findByText, queryByText} = render(<DictionaryDetailScreen />);
    await findByText('El bautismo es el rito de iniciación cristiana.');
    expect(queryByText(translations.es.dictionary.navesLabel)).toBeNull();
  });
});
