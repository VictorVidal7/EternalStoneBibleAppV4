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
import {StyleSheet} from 'react-native';
import DictionaryDetailScreen from '../app/features/dictionary/[slug]';
import {translations} from '../src/i18n/translations';

let mockSlug = 'bautismo';
jest.mock('expo-router', () => ({
  useRouter: () => ({push: jest.fn(), back: jest.fn()}),
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
  haptics: {tap: jest.fn()},
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

const mockGetDictionaryEntry = jest.fn();
const mockGetDictionaryMultiviewSections = jest.fn();
jest.mock('@lib/database', () => ({
  __esModule: true,
  default: {
    initialize: jest.fn(async () => undefined),
    getDictionaryEntry: (...args: unknown[]) => mockGetDictionaryEntry(...args),
    getDictionaryMultiviewSections: (...args: unknown[]) =>
      mockGetDictionaryMultiviewSections(...args),
  },
}));

describe('DictionaryDetailScreen — multi-view branch (Bautismo, Milenio)', () => {
  beforeEach(() => {
    mockSlug = 'bautismo';
    mockIsPremium = false;
    mockOpenOfferingSheet.mockClear();
    mockGetDictionaryEntry.mockReset();
    mockGetDictionaryMultiviewSections.mockReset();
    mockIonicons.mockClear();
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
});
