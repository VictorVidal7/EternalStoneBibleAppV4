/**
 * Zero-backend bug/feedback entry point (mailto: link) in the Settings
 * screen's About card — FeedbackRow. Not a Firestore-backed inbox, per the
 * app's standing rule to minimize Firestore sync/writes wherever an
 * alternative exists.
 */

import {render, fireEvent} from '@testing-library/react-native';
import {Linking, Platform} from 'react-native';
import FeedbackRow, {
  FEEDBACK_EMAIL,
} from '../src/components/settings/FeedbackRow';

const mockColors = {
  primary: '#1d4ed8',
};

jest.mock('../src/hooks/useTheme', () => ({
  useTheme: () => ({colors: mockColors}),
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

jest.mock('expo-constants', () => ({
  __esModule: true,
  default: {expoConfig: {version: '9.9.9'}},
}));

describe('FeedbackRow', () => {
  beforeEach(() => {
    jest.spyOn(Linking, 'openURL').mockResolvedValue(true);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders the row label', async () => {
    const {findByText} = render(<FeedbackRow />);
    expect(await findByText('Reportar un problema')).toBeTruthy();
  });

  it('opens a mailto: URL to the feedback address with subject and diagnostics on press', async () => {
    const {findByText} = render(<FeedbackRow />);
    fireEvent.press(await findByText('Reportar un problema'));

    expect(Linking.openURL).toHaveBeenCalledTimes(1);
    const url = (Linking.openURL as jest.Mock).mock.calls[0][0] as string;

    expect(url.startsWith(`mailto:${FEEDBACK_EMAIL}?`)).toBe(true);
    expect(url).toContain(
      encodeURIComponent('Eternal Stone Bible — Reporte de problema'),
    );

    const decoded = decodeURIComponent(url);
    // Diagnostic footer: app version (from the mocked expo-constants) and
    // platform, so a report arrives with basic repro context.
    expect(decoded).toContain('9.9.9');
    expect(decoded).toContain(Platform.OS);
  });
});
