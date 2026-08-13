/**
 * Sprint 102 — Memory practice "Show verse" reveal step.
 *
 * Box-1 cards (a verse's first time in the deck) are shown in full because
 * the progressive mask hides 0% at that level. The reveal button would do
 * nothing on an already-complete verse, so the screen must skip straight to
 * the grade buttons. Masked cards (box ≥ 2) keep the reveal-then-grade flow.
 */
import React from 'react';
import {render, fireEvent} from '@testing-library/react-native';
import MemoryPracticeScreen from '../app/features/memory/practice';
import {translations} from '../src/i18n/translations';
import {createCard} from '../src/lib/memory/srs';

let mockDueCards: ReturnType<typeof createCard>[] = [];

jest.mock('expo-router', () => ({
  useRouter: () => ({back: jest.fn()}),
  useLocalSearchParams: () => ({}),
  Stack: {Screen: () => null},
}));

jest.mock('@expo/vector-icons', () => ({Ionicons: () => null}));

jest.mock('expo-linear-gradient', () => {
  const {View} = require('react-native');
  return {LinearGradient: View};
});

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({top: 0, bottom: 0, left: 0, right: 0}),
}));

jest.mock('@lib/haptics', () => ({
  haptics: {tap: jest.fn(), success: jest.fn(), warning: jest.fn()},
}));

jest.mock('@components/MemoryGuideModal', () => ({
  MemoryGuideModal: () => null,
}));

jest.mock('@hooks/useTheme', () => ({
  useTheme: () => ({
    gradient: undefined,
    colors: {
      background: '#000000',
      surface: '#111111',
      border: '#222222',
      primary: '#6366f1',
      text: '#ffffff',
      textSecondary: '#cccccc',
      textTertiary: '#999999',
    },
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
}));

jest.mock('@context/MemoryDeckContext', () => ({
  useMemoryDeck: () => ({dueCards: mockDueCards, reviewCard: jest.fn()}),
}));

// Favorito ↔ Memorizar cross-link (added alongside the 'type' recall mode)
// pulls in these two contexts — mock them so this pre-existing reveal-step
// test keeps working without a real FavoritesProvider/ToastProvider.
jest.mock('@context/FavoritesContext', () => ({
  useFavorites: () => ({
    favorites: [],
    addFavorite: jest.fn().mockResolvedValue(undefined),
    removeFavorite: jest.fn().mockResolvedValue(undefined),
  }),
}));

jest.mock('@context/ToastContext', () => ({
  useToast: () => ({
    success: jest.fn(),
    info: jest.fn(),
    error: jest.fn(),
    warning: jest.fn(),
  }),
}));

const p = translations.es.memory.practice;

const makeCard = (box: 1 | 2 | 3 | 4 | 5) => ({
  ...createCard({
    verseKey: 'Juan/3/16',
    bookName: 'Juan',
    chapter: 3,
    verse: 16,
    text: 'Porque de tal manera amó Dios al mundo, que ha dado a su Hijo unigénito',
    version: 'RVR1960',
    now: new Date().toISOString(),
  }),
  box,
});

describe('Memory practice — reveal step', () => {
  it('skips the reveal button for a box-1 (full-verse) card and grades directly', () => {
    mockDueCards = [makeCard(1)];
    const {queryByText} = render(<MemoryPracticeScreen />);

    // No "Show verse" button — the verse is already complete.
    expect(queryByText(p.reveal)).toBeNull();
    // Grade buttons are shown straight away.
    expect(queryByText(p.again)).not.toBeNull();
    expect(queryByText(p.easy)).not.toBeNull();
    // The prompt acknowledges the verse is fully shown (first-time read).
    expect(queryByText(p.promptFullVerse)).not.toBeNull();
    expect(queryByText(p.prompt)).toBeNull();
  });

  it('keeps reveal-then-grade for a masked (box-3) card', () => {
    mockDueCards = [makeCard(3)];
    const {queryByText, getByText} = render(<MemoryPracticeScreen />);

    // Reveal button present; grades hidden until reveal.
    expect(queryByText(p.reveal)).not.toBeNull();
    expect(queryByText(p.again)).toBeNull();
    expect(queryByText(p.promptFullVerse)).toBeNull();

    fireEvent.press(getByText(p.reveal));

    // After revealing, grades appear with the standard recall prompt.
    expect(queryByText(p.again)).not.toBeNull();
    expect(queryByText(p.prompt)).not.toBeNull();
    expect(queryByText(p.promptFullVerse)).toBeNull();
  });
});
