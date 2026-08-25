/**
 * FunctionalidadesSettings — consolidated into a single Ajustes row that
 * opens a full-screen "pick a feature" modal (same pattern as
 * TipsAndGuidesSettings / GoalsSettings), instead of listing "Unirme a un
 * grupo" / "Crear un devocional" / "Widgets" inline in the main Settings
 * scroll. Insignias y Títulos is deliberately excluded (redundant with the
 * Logros tab's existing link to the same screen — Victor confirmed). Locks:
 * (a) the feature list is not present until the entry row is tapped, (b)
 * tapping the entry row reveals it, (c) tapping a row still calls
 * router.push to that feature's existing route unchanged, (d) the modal
 * closes on that tap so it doesn't linger over the pushed screen.
 */
import {render, fireEvent} from '@testing-library/react-native';
import FunctionalidadesSettings from '../src/components/settings/FunctionalidadesSettings';
import {translations} from '../src/i18n/translations';

const mockColors = {
  background: '#0f172a',
  text: '#f1f5f9',
  textSecondary: '#94a3b8',
  textTertiary: '#64748b',
  primary: '#38bdf8',
  accent: '#a855f7',
  surface: '#111827',
  border: '#374151',
};

const mockPush = jest.fn();

jest.mock('../src/hooks/useTheme', () => ({
  useTheme: () => ({isDark: true, colors: mockColors}),
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
jest.mock('expo-router', () => ({
  useRouter: () => ({push: mockPush}),
}));

const ts = translations.es.settingsV51;
const together = translations.es.together;
const devotional = translations.es.devotionalBuilder;

describe('FunctionalidadesSettings', () => {
  beforeEach(() => {
    mockPush.mockClear();
  });

  it('shows the entry row but not the feature list until tapped', () => {
    const {getByText, queryByText} = render(<FunctionalidadesSettings />);

    expect(getByText(ts.entryTitle)).toBeTruthy();
    expect(getByText(ts.entryDesc)).toBeTruthy();
    // The list modal starts closed — none of its rows are rendered.
    expect(queryByText(together.enterCode)).toBeNull();
  });

  it('reveals the feature list after tapping the entry row', () => {
    const {getByText, queryByText} = render(<FunctionalidadesSettings />);

    fireEvent.press(getByText(ts.entryTitle));

    expect(getByText(together.enterCode)).toBeTruthy();
    expect(getByText(devotional.entryTitle)).toBeTruthy();
    expect(getByText(ts.widgets)).toBeTruthy();
    // Insignias y Títulos is intentionally not part of this list.
    expect(queryByText(ts.badges)).toBeNull();
  });

  it('pushes to the existing route and closes the modal on tap', () => {
    const {getByText, queryByText} = render(<FunctionalidadesSettings />);

    fireEvent.press(getByText(ts.entryTitle));
    fireEvent.press(getByText(together.enterCode));

    expect(mockPush).toHaveBeenCalledWith('/features/together');
    // The modal is dismissed after navigating away.
    expect(queryByText(together.enterCode)).toBeNull();
  });

  it('the Widgets row still pushes to its own route', () => {
    const {getByText} = render(<FunctionalidadesSettings />);

    fireEvent.press(getByText(ts.entryTitle));
    fireEvent.press(getByText(ts.widgets));
    expect(mockPush).toHaveBeenCalledWith('/features/widgets');
  });
});
