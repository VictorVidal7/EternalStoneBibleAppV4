/**
 * Red-letter (Words of Christ) switch honesty — the underlying dataset only
 * exists for versions covered by `hasRedLetterData` (WEB via WEB_RED_LETTER,
 * RVR1960 via RVR1960_RED_LETTER); on any other version the switch would be
 * a silent no-op: always on-looking, always interactive, no signal that
 * flipping it does nothing. This pins the fix: the switch is ENABLED for
 * every version with real data (WEB *and* RVR1960 — RVR1960 support shipped
 * after WEB), and DISABLED (not hidden — still discoverable) with an
 * actionable hint whenever the active version has none.
 */

import {render} from '@testing-library/react-native';
import {ReaderPreferencesSheet} from '../src/components/reading/ReaderPreferencesSheet';
import {ReaderPreferencesProvider} from '../src/context/ReaderPreferencesContext';
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

const mockUseBibleVersionOptional = jest.fn();
jest.mock('../src/hooks/useBibleVersion', () => ({
  useBibleVersionOptional: () => mockUseBibleVersionOptional(),
}));

function renderSheet(onClose = jest.fn()) {
  return render(
    <PremiumProvider>
      <ReaderPreferencesProvider>
        <ReaderPreferencesSheet visible onClose={onClose} />
      </ReaderPreferencesProvider>
    </PremiumProvider>,
  );
}

describe('ReaderPreferencesSheet — red-letter data availability', () => {
  it('is enabled with the "how it works" hint when the active version is WEB', () => {
    mockUseBibleVersionOptional.mockReturnValue({
      selectedVersion: {id: 'WEB', language: 'en', abbreviation: 'WEB'},
    });
    const {getByLabelText, getByText} = renderSheet();

    const toggle = getByLabelText(t.readerPrefs.redLetterWords);
    expect(toggle.props.disabled).toBe(false);
    expect(toggle.props.accessibilityState).toEqual({disabled: false});
    expect(toggle.props.accessibilityHint).toBe(
      t.readerPrefs.redLetterWordsHint,
    );
    expect(getByText(t.readerPrefs.redLetterWordsHint)).toBeTruthy();
  });

  it('is ALSO enabled with the "how it works" hint when the active version is RVR1960', () => {
    mockUseBibleVersionOptional.mockReturnValue({
      selectedVersion: {id: 'RVR1960', language: 'es', abbreviation: 'RVR1960'},
    });
    const {getByLabelText, getByText} = renderSheet();

    const toggle = getByLabelText(t.readerPrefs.redLetterWords);
    expect(toggle.props.disabled).toBe(false);
    expect(toggle.props.accessibilityState).toEqual({disabled: false});
    expect(toggle.props.accessibilityHint).toBe(
      t.readerPrefs.redLetterWordsHint,
    );
    expect(getByText(t.readerPrefs.redLetterWordsHint)).toBeTruthy();
  });

  it('is disabled with an actionable hint when the active version has no red-letter data (e.g. RV1909, a real downloadable catalog version)', () => {
    mockUseBibleVersionOptional.mockReturnValue({
      selectedVersion: {id: 'RV1909', language: 'es', abbreviation: 'RV1909'},
    });
    const {getByLabelText, getByText} = renderSheet();

    const toggle = getByLabelText(t.readerPrefs.redLetterWords);
    expect(toggle.props.disabled).toBe(true);
    expect(toggle.props.accessibilityState).toEqual({disabled: true});
    expect(toggle.props.accessibilityHint).toBe(
      t.readerPrefs.redLetterWordsUnavailableHint,
    );
    expect(getByText(t.readerPrefs.redLetterWordsUnavailableHint)).toBeTruthy();
  });

  it('falls back to disabled when there is no BibleVersionProvider in the tree', () => {
    mockUseBibleVersionOptional.mockReturnValue(undefined);
    const {getByLabelText} = renderSheet();

    const toggle = getByLabelText(t.readerPrefs.redLetterWords);
    expect(toggle.props.disabled).toBe(true);
  });
});
