/**
 * Sprint 92 — the achievement/title share card (AchievementImageModal).
 * Pins the eyebrow, the accomplishment title + description, the tier badge,
 * the points line, and that points/tier are optional (titles have no points).
 */
import React from 'react';
import {render} from '@testing-library/react-native';
import {
  AchievementImageModal,
  type ShareableAccomplishment,
} from '../src/components/insights/AchievementImageModal';

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
  captureRef: jest.fn(() => Promise.resolve('file://achievement.png')),
}));
jest.mock('expo-sharing', () => ({
  isAvailableAsync: jest.fn(() => Promise.resolve(true)),
  shareAsync: jest.fn(() => Promise.resolve()),
}));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({top: 0, bottom: 0, left: 0, right: 0}),
}));

const achievement: ShareableAccomplishment = {
  icon: '📖',
  title: 'Lector Dedicado',
  description: 'Lee 100 versículos',
  tierLabel: 'COMÚN',
  points: 50,
};

describe('AchievementImageModal (Sprint 92)', () => {
  it('renders the eyebrow, title, description, tier and points', () => {
    const {getByText} = render(
      <AchievementImageModal
        visible
        item={achievement}
        headerTitle="Compartir logro"
        eyebrow="Logro desbloqueado"
        onClose={jest.fn()}
      />,
    );
    expect(getByText('Logro desbloqueado')).toBeTruthy();
    expect(getByText('Lector Dedicado')).toBeTruthy();
    expect(getByText('Lee 100 versículos')).toBeTruthy();
    expect(getByText('COMÚN')).toBeTruthy();
    expect(getByText('50 pts')).toBeTruthy();
    expect(getByText('Compartir logro')).toBeTruthy();
  });

  it('omits the tier badge and points for a title (no points)', () => {
    const title: ShareableAccomplishment = {
      icon: '👑',
      title: 'El Sabio',
      description: 'Completa logros de conocimiento',
    };
    const {queryByText, getByText} = render(
      <AchievementImageModal
        visible
        item={title}
        headerTitle="Compartir título"
        eyebrow="Título obtenido"
        onClose={jest.fn()}
      />,
    );
    expect(getByText('El Sabio')).toBeTruthy();
    expect(getByText('Título obtenido')).toBeTruthy();
    expect(queryByText(/pts$/)).toBeNull();
  });
});
