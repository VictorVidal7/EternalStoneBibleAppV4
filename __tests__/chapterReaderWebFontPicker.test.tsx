/**
 * Web reader font picker — wires the existing cross-platform
 * `ReaderPreferencesSheet` into the dedicated web reader screen
 * (`app/(tabs)/verse/[book]/[chapter].web.tsx`), which previously only ever
 * applied `fontSize` to verse text (never `fontFamily`), and had no way to
 * open the sheet at all.
 *
 * This renders the REAL web reader screen + the REAL `ReaderPreferencesSheet`
 * + the REAL `ReaderPreferencesProvider` (not hand-rolled test doubles), so a
 * tap on a font-family card genuinely flows through `setFontFamily` and back
 * out through `resolveTypeface`/`resolveTypefaceBold` — the same catalog the
 * native reader uses. Premium/OfferingSheet are redirected to their real
 * `.web` stub siblings (the same substitution Metro performs for any web
 * bundle — see `webStubProviders.test.tsx` for the established precedent),
 * so the premium-font gating exercised here is the ACTUAL web behavior
 * (`isPremium` permanently false, `openOfferingSheet()` a no-op), not a
 * simulation of it.
 */
import React from 'react';
import {render, fireEvent, waitFor} from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

jest.mock('@context/PremiumContext', () =>
  require('../src/context/PremiumContext.web'),
);
jest.mock('@context/OfferingSheetContext', () =>
  require('../src/context/OfferingSheetContext.web'),
);

jest.mock('expo-router', () => ({
  useRouter: () => ({push: jest.fn(), replace: jest.fn()}),
  useLocalSearchParams: () => ({book: 'Juan', chapter: '3'}),
  Stack: {Screen: () => null},
}));

jest.mock('@expo/vector-icons', () => ({Ionicons: () => null}));

jest.mock('@lib/haptics', () => ({
  haptics: {tap: jest.fn()},
}));

jest.mock('@lib/reading/redLetterText.web', () => ({
  getRedLetterSpans: jest.fn(() => []),
  mergeRedLetterSpans: jest.fn((text: string) => [{text, isRedLetter: false}]),
  loadRedLetterSpans: jest.fn(async () => undefined),
}));

const SAMPLE_VERSE = {
  book: 'Juan',
  chapter: 3,
  verse: 16,
  text: 'Porque de tal manera amó Dios al mundo...',
};
jest.mock('@lib/database', () => ({
  __esModule: true,
  default: {
    initialize: jest.fn(async () => undefined),
    getChapter: jest.fn(async () => [SAMPLE_VERSE]),
  },
}));

const mockColors = {
  background: '#ffffff',
  surface: '#f8fafc',
  surfaceVariant: '#f1f5f9',
  text: '#0f172a',
  textSecondary: '#475569',
  textTertiary: '#94a3b8',
  primary: '#1d4ed8',
  border: '#cbd5e1',
  glassBorder: '#e2e8f0',
  error: '#dc2626',
};
jest.mock('@hooks/useTheme', () => ({
  useTheme: () => ({
    colors: mockColors,
    isDark: false,
    mode: 'light',
    setThemeMode: jest.fn(),
  }),
}));

jest.mock('@hooks/useLanguage', () => ({
  useLanguage: () => ({
    language: 'es',
    t: require('../src/i18n/translations').translations.es,
  }),
}));

jest.mock('@hooks/useBibleVersion', () => ({
  useBibleVersion: () => ({
    selectedVersion: {id: 'RVR1960', language: 'es', abbreviation: 'RVR1960'},
  }),
}));

// Real components — deliberately NOT mocked, per the file header comment.
import ChapterReaderWeb from '../app/(tabs)/verse/[book]/[chapter].web';
import {ReaderPreferencesProvider} from '../src/context/ReaderPreferencesContext';
import {PremiumProvider} from '@context/PremiumContext';
import {OfferingSheetProvider} from '@context/OfferingSheetContext';

const es = require('../src/i18n/translations').translations.es;

function renderScreen() {
  return render(
    <PremiumProvider>
      <OfferingSheetProvider>
        <ReaderPreferencesProvider>
          <ChapterReaderWeb />
        </ReaderPreferencesProvider>
      </OfferingSheetProvider>
    </PremiumProvider>,
  );
}

describe('Web reader — reader preferences sheet wiring', () => {
  // Each test mounts a fresh ReaderPreferencesProvider, but the underlying
  // AsyncStorage mock is a module-level singleton that otherwise persists
  // `@reader_preferences` across tests in this file — clear it so every test
  // hydrates from the real DEFAULT_READER_PREFERENCES, not whatever a prior
  // test's setFontFamily() call left behind.
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('opens ReaderPreferencesSheet from the new header button', async () => {
    const {findByLabelText, findByText, queryByText} = renderScreen();
    // Not present before the button is pressed — proves the assertion below
    // is actually driven by the tap, not just always-mounted Modal content.
    expect(queryByText(es.readerPrefs.title)).toBeNull();
    fireEvent.press(await findByLabelText(es.readerPrefs.openLabel));
    expect(await findByText(es.readerPrefs.title)).toBeTruthy();
  });

  it('defaults verse text to the sans (Inter) family before any selection', async () => {
    const {findByTestId} = renderScreen();
    const verseText = await findByTestId('web-verse-text-16');
    const flatStyle = Object.assign(
      {},
      ...([] as unknown[]).concat(verseText.props.style),
    );
    expect(flatStyle.fontFamily).toBe('Inter_400Regular');
  });

  it('selecting a free face (Serif) applies its resolved fontFamily to verse text and number', async () => {
    const {findByLabelText, findByTestId} = renderScreen();
    fireEvent.press(await findByLabelText(es.readerPrefs.openLabel));
    fireEvent.press(await findByLabelText('Serif'));

    await waitFor(async () => {
      const verseText = await findByTestId('web-verse-text-16');
      const flatStyle = Object.assign(
        {},
        ...([] as unknown[]).concat(verseText.props.style),
      );
      expect(flatStyle.fontFamily).toBe('Lora_400Regular');
    });

    const verseText = await findByTestId('web-verse-text-16');
    const numberChild = verseText.props.children[0];
    const numberStyle = Object.assign(
      {},
      ...([] as unknown[]).concat(numberChild.props.style),
    );
    expect(numberStyle.fontFamily).toBe('Lora_700Bold');
  });

  it('a locked premium face (Sólida/slab) stays gated on web — verse text is unaffected', async () => {
    const {findByLabelText, findByTestId} = renderScreen();
    fireEvent.press(await findByLabelText(es.readerPrefs.openLabel));
    // On web isPremium is permanently false (PremiumContext.web stub) and
    // openOfferingSheet() is a logging no-op (OfferingSheetContext.web
    // stub) — pressing a locked premium face must neither crash nor change
    // the applied font.
    const lockedCard = await findByLabelText(/^Sólida/);
    expect(() => fireEvent.press(lockedCard)).not.toThrow();

    const verseText = await findByTestId('web-verse-text-16');
    const flatStyle = Object.assign(
      {},
      ...([] as unknown[]).concat(verseText.props.style),
    );
    expect(flatStyle.fontFamily).toBe('Inter_400Regular');
  });
});
