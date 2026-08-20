/**
 * AccessibilitySettings — consolidated into a single Ajustes row that opens
 * a full-screen modal containing the app's three accessibility toggles (same
 * pattern as NotificationsSettings/GoalsSettings), instead of three separate
 * cards permanently inline. Locks: (a) the toggles aren't present until the
 * entry row is tapped, (b) tapping the entry row reveals them, (c) each
 * toggle still calls its own context setter, unchanged from the inline
 * version it replaced.
 */
import {render, fireEvent} from '@testing-library/react-native';
import AccessibilitySettings from '../src/components/settings/AccessibilitySettings';
import {translations} from '../src/i18n/translations';

const mockColors = {
  background: '#0f172a',
  text: '#f1f5f9',
  textSecondary: '#94a3b8',
  primary: '#38bdf8',
  surface: '#111827',
  border: '#374151',
};

const mockSetHighContrast = jest.fn();
let mockHighContrast = false;
jest.mock('../src/hooks/useTheme', () => ({
  useTheme: () => ({
    isDark: true,
    colors: mockColors,
    highContrast: mockHighContrast,
    setHighContrast: mockSetHighContrast,
  }),
}));

jest.mock('../src/hooks/useLanguage', () => ({
  useLanguage: () => ({
    language: 'es',
    t: require('../src/i18n/translations').translations.es,
  }),
}));

jest.mock('../src/lib/haptics', () => ({
  haptics: {press: jest.fn(), tap: jest.fn()},
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({top: 0, bottom: 0, left: 0, right: 0}),
}));

const mockSetKeepScreenAwake = jest.fn();
let mockKeepScreenAwake = false;
jest.mock('../src/context/ReaderPreferencesContext', () => ({
  useReaderPreferences: () => ({
    preferences: {keepScreenAwake: mockKeepScreenAwake},
    setKeepScreenAwake: mockSetKeepScreenAwake,
  }),
}));

const mockSetReduceMotionOverride = jest.fn();
let mockReduceMotionOverride = false;
jest.mock('../src/context/AccessibilityPreferencesContext', () => ({
  useAccessibilityPreferences: () => ({
    reduceMotionOverride: mockReduceMotionOverride,
    setReduceMotionOverride: mockSetReduceMotionOverride,
  }),
}));

const ts = translations.es.settings;

describe('AccessibilitySettings', () => {
  beforeEach(() => {
    mockSetHighContrast.mockClear();
    mockSetKeepScreenAwake.mockClear();
    mockSetReduceMotionOverride.mockClear();
    mockHighContrast = false;
    mockKeepScreenAwake = false;
    mockReduceMotionOverride = false;
  });

  it('shows the entry row but not the toggles until tapped', () => {
    const {getByText, queryByText} = render(<AccessibilitySettings />);

    expect(getByText(ts.accessibilityEntryTitle)).toBeTruthy();
    expect(getByText(ts.accessibilityEntryDesc)).toBeTruthy();
    // The modal starts closed — none of the toggle rows are rendered.
    expect(queryByText(ts.keepAwakeTitle)).toBeNull();
    expect(queryByText(ts.highContrastTitle)).toBeNull();
    expect(queryByText(ts.reduceMotionTitle)).toBeNull();
  });

  it('reveals the three toggles after tapping the entry row', () => {
    const {getByText} = render(<AccessibilitySettings />);

    fireEvent.press(getByText(ts.accessibilityEntryTitle));

    expect(getByText(ts.keepAwakeTitle)).toBeTruthy();
    expect(getByText(ts.highContrastTitle)).toBeTruthy();
    expect(getByText(ts.highContrastReaderNote)).toBeTruthy();
    expect(getByText(ts.reduceMotionTitle)).toBeTruthy();
  });

  it('toggling "keep screen awake" calls setKeepScreenAwake', () => {
    const {getByText, getByLabelText} = render(<AccessibilitySettings />);
    fireEvent.press(getByText(ts.accessibilityEntryTitle));

    fireEvent(getByLabelText(ts.keepAwakeTitle), 'valueChange', true);

    expect(mockSetKeepScreenAwake).toHaveBeenCalledWith(true);
  });

  it('toggling high contrast calls setHighContrast', () => {
    const {getByText, getByLabelText} = render(<AccessibilitySettings />);
    fireEvent.press(getByText(ts.accessibilityEntryTitle));

    fireEvent(getByLabelText(ts.highContrastTitle), 'valueChange', true);

    expect(mockSetHighContrast).toHaveBeenCalledWith(true);
  });

  it('toggling reduce motion calls setReduceMotionOverride', () => {
    const {getByText, getByLabelText} = render(<AccessibilitySettings />);
    fireEvent.press(getByText(ts.accessibilityEntryTitle));

    fireEvent(getByLabelText(ts.reduceMotionTitle), 'valueChange', true);

    expect(mockSetReduceMotionOverride).toHaveBeenCalledWith(true);
  });

  it('closes the modal via the close button', () => {
    const {getByText, queryByText, getByLabelText} = render(
      <AccessibilitySettings />,
    );
    fireEvent.press(getByText(ts.accessibilityEntryTitle));
    expect(getByText(ts.keepAwakeTitle)).toBeTruthy();

    fireEvent.press(getByLabelText(translations.es.close));

    expect(queryByText(ts.keepAwakeTitle)).toBeNull();
  });
});
