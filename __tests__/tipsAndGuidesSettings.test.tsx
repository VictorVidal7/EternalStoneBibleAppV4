/**
 * TipsAndGuidesSettings — consolidated into a single Ajustes row that opens
 * a full-screen "pick a guide" modal (same pattern as GoalsSettings /
 * NotificationsSettings), instead of listing every `FeatureGuideModal` in
 * `FEATURE_GUIDES` inline in the main Settings scroll. Locks: (a) the
 * guides list is not present until the entry row is tapped, (b) tapping
 * the entry row reveals it, (c) tapping a guide row from inside that list
 * still opens its own `FeatureGuideModal` on top, unchanged.
 */
import {render, fireEvent} from '@testing-library/react-native';
import TipsAndGuidesSettings from '../src/components/settings/TipsAndGuidesSettings';
import {translations} from '../src/i18n/translations';

const mockColors = {
  background: '#0f172a',
  text: '#f1f5f9',
  textSecondary: '#94a3b8',
  textTertiary: '#64748b',
  primary: '#38bdf8',
  surface: '#111827',
  border: '#374151',
};

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

const ts = translations.es.settings;
// "memory" is the first entry in FEATURE_GUIDES — used as a stand-in guide.
const memoryGuide = translations.es.memory.guide;

describe('TipsAndGuidesSettings', () => {
  it('shows the entry row but not the guides list until tapped', () => {
    const {getByText, queryByText} = render(<TipsAndGuidesSettings />);

    expect(getByText(ts.tipsAndGuidesEntryTitle)).toBeTruthy();
    expect(getByText(ts.tipsAndGuidesEntryDesc)).toBeTruthy();
    // The list modal starts closed — none of its guide rows are rendered.
    expect(queryByText(memoryGuide.title)).toBeNull();
  });

  it('reveals the guides list after tapping the entry row', () => {
    const {getByText} = render(<TipsAndGuidesSettings />);

    fireEvent.press(getByText(ts.tipsAndGuidesEntryTitle));

    expect(getByText(memoryGuide.title)).toBeTruthy();
  });

  it('still opens a guide-specific FeatureGuideModal on top of the list', () => {
    const {getByText} = render(<TipsAndGuidesSettings />);

    fireEvent.press(getByText(ts.tipsAndGuidesEntryTitle));
    fireEvent.press(getByText(memoryGuide.title));

    // The FeatureGuideModal's intro + CTA close label only render once
    // that specific guide modal is open.
    expect(getByText(memoryGuide.intro)).toBeTruthy();
    expect(getByText(memoryGuide.close)).toBeTruthy();
  });
});
