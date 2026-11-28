/**
 * R9-542 (the Settings part) — the dropped-writes notice and the conflicts
 * badge are buttons whose fixed `accessibilityLabel` replaced what they show:
 * a screen reader heard «Abrir conflictos pendientes», never «3 conflictos
 * por resolver» — the number the button displays.
 *
 * The real Settings screen; its child sections are stubbed (they are not what
 * is measured) and the auth / sync contexts are mocked with a signed-in user
 * and a sync state that has dropped writes and conflicts.
 */
import {render, screen} from '@testing-library/react-native';

const mockEs = require('../src/i18n/translations').translations.es;

jest.mock('expo-router', () => ({
  useRouter: () => ({push: jest.fn(), back: jest.fn(), replace: jest.fn()}),
  useFocusEffect: () => undefined,
}));
jest.mock('@expo/vector-icons', () => ({Ionicons: () => null}));
jest.mock('expo-linear-gradient', () => {
  const {View} = require('react-native');
  return {LinearGradient: View};
});
jest.mock('expo-clipboard', () => ({
  setStringAsync: jest.fn(async () => true),
}));
jest.mock('@lib/haptics', () => ({
  haptics: {tap: jest.fn(), press: jest.fn(), success: jest.fn()},
}));
const mockColors = new Proxy({}, {get: () => '#123456'});
const mockTheme = {
  mode: 'auto',
  setThemeMode: jest.fn(),
  isDark: false,
  colors: mockColors,
  gradient: {headerColors: ['#000', '#111', '#222']},
};
jest.mock('@hooks/useTheme', () => ({useTheme: () => mockTheme}));
const mockVersion = {
  selectedVersion: {id: 'RVR1960', language: 'es', abbreviation: 'RVR1960'},
  setVersion: jest.fn(),
  availableVersions: [],
};
jest.mock('@hooks/useBibleVersion', () => ({
  useBibleVersion: () => mockVersion,
}));
const mockLang = {language: 'es', setLanguage: jest.fn(), t: mockEs};
jest.mock('@hooks/useLanguage', () => ({useLanguage: () => mockLang}));
const mockAuth = {
  user: {uid: 'u1', isAnonymous: false, email: 'a@b.c', displayName: 'A'},
  signInWithGoogle: jest.fn(),
  signOut: jest.fn(),
  deleteAccount: jest.fn(),
};
jest.mock('@context/AuthContext', () => ({useAuth: () => mockAuth}));
const mockSync = {
  state: {
    droppedWrites: 3,
    pendingWrites: 0,
    isOnline: true,
    lastSyncedAt: Date.now(),
  },
  engine: {acknowledgeDroppedWrites: jest.fn()},
};
const mockConflicts = [{id: 'c1'}, {id: 'c2'}];
jest.mock('@context/SyncEngineContext', () => ({
  useSyncEngineOptional: () => mockSync,
  useConflicts: () => mockConflicts,
}));
jest.mock('@context/ToastContext', () => ({
  useToast: () => ({success: jest.fn(), error: jest.fn(), info: jest.fn()}),
}));
for (const m of [
  'NotificationsSettings',
  'GoalsSettings',
  'ManageVersionsSection',
  'ExtrasSettings',
  'RedeemCodeSheet',
  'DonationSettings',
  'TipsAndGuidesSettings',
  'FunctionalidadesSettings',
  'ColorThemeSettings',
  'AccessibilitySettings',
  'DataSettings',
  'FeedbackRow',
]) {
  jest.doMock(`@components/settings/${m}`, () => ({
    __esModule: true,
    default: () => null,
  }));
}
jest.mock('@components/ui/ConfirmDialog', () => ({ConfirmDialog: () => null}));

const SettingsScreen = require('../app/(tabs)/settings').default;

describe('R9-542 — los avisos de Ajustes se oyen con su número', () => {
  test('cambios no guardados: el lector oye «3 cambios…» y qué hace tocar', () => {
    render(<SettingsScreen />);
    const shown = mockEs.sync.dropped.replace('{{count}}', '3');
    expect(screen.getByText(shown)).toBeTruthy();
    const button = screen.getByLabelText(shown);
    expect(button.props.accessibilityHint).toBe(mockEs.sync.droppedA11y);
  });

  test('conflictos: el lector oye «2 conflictos por resolver» y qué hace tocar', () => {
    render(<SettingsScreen />);
    const shown = mockEs.conflicts.badge.replace('{{count}}', '2');
    expect(screen.getByText(shown)).toBeTruthy();
    const button = screen.getByLabelText(shown);
    expect(button.props.accessibilityHint).toBe(mockEs.conflicts.badgeA11y);
  });
});
