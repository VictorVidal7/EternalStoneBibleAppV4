/**
 * T16 (#4) — the pending-conflicts resolution screen must show friendly
 * collection/field names (shared with the insights dashboard's i18n maps)
 * instead of raw internal keys like "note" or "favorites".
 */
import React from 'react';
import {render} from '@testing-library/react-native';
import ConflictsScreen from '../app/(tabs)/conflicts';
import type {ConflictRecord} from '../src/lib/sync/types';

jest.mock('expo-router', () => ({
  useRouter: () => ({back: jest.fn(), push: jest.fn()}),
}));

jest.mock('@expo/vector-icons', () => ({Ionicons: () => null}));

jest.mock('expo-linear-gradient', () => {
  const {View} = require('react-native');
  return {LinearGradient: View};
});

jest.mock('@lib/a11y/focusTrap', () => ({
  focusTrapProps: () => ({}),
}));

const mockToast = {success: jest.fn(), error: jest.fn()};
jest.mock('@context/ToastContext', () => ({
  useToast: () => mockToast,
}));

const mockColors = {
  background: '#000000',
  surface: '#111111',
  border: '#222222',
  primary: '#6366f1',
  text: '#ffffff',
  textSecondary: '#cccccc',
  textTertiary: '#999999',
  warning: '#f59e0b',
  error: '#ef4444',
  overlay: '#00000080',
};
jest.mock('@hooks/useTheme', () => ({
  useTheme: () => ({colors: mockColors, gradient: undefined}),
}));

jest.mock('@hooks/useLanguage', () => ({
  useLanguage: () => ({
    language: 'es',
    t: require('../src/i18n/translations').translations.es,
  }),
}));

const fixtureConflict: ConflictRecord = {
  id: 'favorites__fav_1',
  collection: 'favorites',
  docId: 'fav_1',
  localVersion: {note: 'mine', category: 'prayer', updatedAt: 100},
  remoteVersion: {note: 'theirs', category: 'praise', updatedAt: 200},
  differingFields: ['note', 'category'],
  detectedAt: 90,
};

jest.mock('@context/SyncEngineContext', () => ({
  useSyncEngineOptional: () => undefined,
  useConflicts: () => [fixtureConflict],
}));

describe('ConflictsScreen — friendly labels (T16 #4)', () => {
  it('shows the localized collection label, not the raw key', () => {
    const {queryByText} = render(<ConflictsScreen />);
    expect(queryByText('Favoritos')).toBeTruthy();
    expect(queryByText('favorites')).toBeNull();
  });

  it('shows localized field labels for each differing field, not raw keys', () => {
    const {queryAllByText} = render(<ConflictsScreen />);
    expect(queryAllByText('Nota').length).toBeGreaterThan(0);
    expect(queryAllByText('Categoría').length).toBeGreaterThan(0);
    expect(queryAllByText('note').length).toBe(0);
    expect(queryAllByText('category').length).toBe(0);
  });
});
