/**
 * Sprint 94 — the answered-prayer testimony share card (TestimonyImageModal).
 * Pins the eyebrow ("Dios fue fiel"), the request title, the answered-on line,
 * the optional testimony quote, and that the testimony is omitted when absent.
 */
import React from 'react';
import {render} from '@testing-library/react-native';
import {TestimonyImageModal} from '../src/components/insights/TestimonyImageModal';

const mockColors = {
  background: '#0f172a',
  text: '#f1f5f9',
  textSecondary: '#94a3b8',
  textTertiary: '#64748b',
  primary: '#38bdf8',
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
jest.mock('../src/context/ToastContext', () => ({
  useToast: () => ({success: jest.fn(), error: jest.fn()}),
}));
jest.mock('../src/lib/haptics', () => ({
  haptics: {press: jest.fn(), tap: jest.fn()},
}));
jest.mock('react-native-view-shot', () => ({
  captureRef: jest.fn(() => Promise.resolve('file://testimony.png')),
}));
jest.mock('expo-sharing', () => ({
  isAvailableAsync: jest.fn(() => Promise.resolve(true)),
  shareAsync: jest.fn(() => Promise.resolve()),
}));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({top: 0, bottom: 0, left: 0, right: 0}),
}));

describe('TestimonyImageModal (Sprint 94)', () => {
  it('renders the eyebrow, request title, answered line and testimony', () => {
    const {getByText} = render(
      <TestimonyImageModal
        visible
        title="Sanidad de mi madre"
        testimony="El Señor la levantó de la cama."
        answeredLine="Respondida el 16 jun 2026"
        onClose={jest.fn()}
      />,
    );
    expect(getByText('Dios fue fiel')).toBeTruthy();
    expect(getByText('Sanidad de mi madre')).toBeTruthy();
    expect(getByText('Respondida el 16 jun 2026')).toBeTruthy();
    expect(getByText('“El Señor la levantó de la cama.”')).toBeTruthy();
    // Header + share button both read the testimony share label.
    expect(getByText('Compartir testimonio')).toBeTruthy();
  });

  it('omits the testimony quote when no note was recorded', () => {
    const {queryByText, getByText} = render(
      <TestimonyImageModal
        visible
        title="Provisión"
        answeredLine="Respondida el 1 may 2026"
        onClose={jest.fn()}
      />,
    );
    expect(getByText('Provisión')).toBeTruthy();
    // No testimony note → no quoted line rendered.
    expect(queryByText(/“.*”/)).toBeNull();
  });
});
