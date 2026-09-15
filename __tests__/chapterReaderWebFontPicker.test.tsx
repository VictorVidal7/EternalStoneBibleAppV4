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

// Only the three DATA functions are stubbed; everything else on the module
// is spread in from the REAL web file. That matters: a hand-written mock
// object would silently define this module's export surface for the test,
// so a symbol missing from the real web file (exactly R9-13) would be
// invisible here — and, worse, would STAY invisible after the fix.
jest.mock('@lib/reading/redLetterText.web', () => ({
  ...jest.requireActual('@lib/reading/redLetterText.web'),
  getRedLetterSpans: jest.fn(() => []),
  mergeRedLetterSpans: jest.fn((text: string) => [{text, isRedLetter: false}]),
  loadRedLetterSpans: jest.fn(async () => undefined),
}));
// R9-15: the line above only covers the EXPLICIT `.web` specifier, which is
// what this screen imports. But the screen also renders
// `ReaderPreferencesSheet`, which imports the BARE specifier — and Metro
// resolves THAT to redLetterText.web.ts too when bundling for web, while
// jest's native preset resolves it to redLetterText.ts. Without this second
// redirect the sheet runs against the NATIVE module inside a test whose
// whole subject is the web screen, so any native/web export divergence
// passes the gate green (it is precisely how R9-13 shipped). Same
// substitution as webStubProviders.test.tsx:516-532.
jest.mock('@lib/reading/redLetterText', () =>
  require('@lib/reading/redLetterText.web'),
);

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
  useBibleVersionOptional: () => ({
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
