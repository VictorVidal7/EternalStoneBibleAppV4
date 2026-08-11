/**
 * Memory practice screen — two additions on top of the existing 4 recall
 * modes ('reveal' | 'firstLetter' | 'fill' | 'write'):
 *
 * 1. A genuinely new 5th recall mode, 'type': the user types the WHOLE
 *    verse from memory into a real TextInput (a keyboard, not the existing
 *    'write' mode's hand-drawing canvas) and gets per-word correct/
 *    incorrect feedback on check, via `checkTypedVerse` (recall.ts).
 * 2. Favorito ↔ Memorizar cross-link: a heart toggle on the current card
 *    that adds/removes it from Favoritos, mirroring the reader's own
 *    heart-icon toggle (`t.verse.addFavorite` / `t.verse.removeFavorite`).
 */
import React from 'react';
import {render, fireEvent} from '@testing-library/react-native';
import MemoryPracticeScreen from '../app/features/memory/practice';
import {translations} from '../src/i18n/translations';
import {createCard} from '../src/lib/memory/srs';
import type {Favorite} from '../src/context/FavoritesContext';

let mockDueCards: ReturnType<typeof createCard>[] = [];
let mockFavorites: Favorite[] = [];
const mockAddFavorite = jest.fn().mockResolvedValue(undefined);
const mockRemoveFavorite = jest.fn().mockResolvedValue(undefined);
const mockToastSuccess = jest.fn();
const mockToastInfo = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({back: jest.fn()}),
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
  haptics: {
    tap: jest.fn(),
    press: jest.fn(),
    success: jest.fn(),
    warning: jest.fn(),
  },
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
      onPrimary: '#ffffff',
      success: '#22c55e',
      error: '#ef4444',
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

jest.mock('@context/FavoritesContext', () => ({
  useFavorites: () => ({
    favorites: mockFavorites,
    addFavorite: mockAddFavorite,
    removeFavorite: mockRemoveFavorite,
  }),
}));

jest.mock('@context/ToastContext', () => ({
  useToast: () => ({
    success: mockToastSuccess,
    info: mockToastInfo,
    error: jest.fn(),
    warning: jest.fn(),
  }),
}));

const p = translations.es.memory.practice;
const v = translations.es.verse;

const makeCard = (box: 1 | 2 | 3 | 4 | 5) => ({
  ...createCard({
    verseKey: 'Juan/3/16',
    bookName: 'Juan',
    chapter: 3,
    verse: 16,
    text: 'Porque de tal manera amó Dios al mundo',
    version: 'RVR1960',
    now: new Date().toISOString(),
  }),
  box,
});

beforeEach(() => {
  mockFavorites = [];
  mockAddFavorite.mockClear();
  mockRemoveFavorite.mockClear();
  mockToastSuccess.mockClear();
  mockToastInfo.mockClear();
});

describe('Memory practice — "type" recall mode', () => {
  it('lists Teclear as a 5th mode tab, distinct from Escribir (the drawing mode)', () => {
    mockDueCards = [makeCard(3)];
    const {getByText} = render(<MemoryPracticeScreen />);
    expect(getByText(p.modeType)).toBeTruthy();
    expect(getByText(p.modeWrite)).toBeTruthy();
  });

  it('shows a real TextInput to type the whole verse, with a Check button (not a reveal-only eye)', () => {
    mockDueCards = [makeCard(3)];
    const {getByText, getByPlaceholderText} = render(<MemoryPracticeScreen />);

    fireEvent.press(getByText(p.modeType));

    expect(getByPlaceholderText(p.typePlaceholder)).toBeTruthy();
    expect(getByText(p.typeCheck)).toBeTruthy();
  });

  it('scores a fully-correct typed verse and shows the grade buttons after checking', () => {
    mockDueCards = [makeCard(3)];
    const {getByText, getByPlaceholderText, queryByText} = render(
      <MemoryPracticeScreen />,
    );

    fireEvent.press(getByText(p.modeType));
    fireEvent.changeText(
      getByPlaceholderText(p.typePlaceholder),
      'Porque de tal manera amó Dios al mundo',
    );
    fireEvent.press(getByText(p.typeCheck));

    // 7/7 words correct, and the recall now offers a grade.
    expect(
      getByText(
        p.typeResult.replace('{{correct}}', '8').replace('{{total}}', '8'),
      ),
    ).toBeTruthy();
    expect(queryByText(p.again)).not.toBeNull();
  });

  it('scores a partially-wrong typed verse correctly (word-by-word, not all-or-nothing)', () => {
    mockDueCards = [makeCard(3)];
    const {getByText, getByPlaceholderText} = render(<MemoryPracticeScreen />);

    fireEvent.press(getByText(p.modeType));
    // Last word wrong ("mundo" -> "planeta"), rest correct.
    fireEvent.changeText(
      getByPlaceholderText(p.typePlaceholder),
      'Porque de tal manera amó Dios al planeta',
    );
    fireEvent.press(getByText(p.typeCheck));

    expect(
      getByText(
        p.typeResult.replace('{{correct}}', '7').replace('{{total}}', '8'),
      ),
    ).toBeTruthy();
  });

  it('is accent/case-insensitive, matching the fill mode normalization', () => {
    mockDueCards = [makeCard(3)];
    const {getByText, getByPlaceholderText} = render(<MemoryPracticeScreen />);

    fireEvent.press(getByText(p.modeType));
    fireEvent.changeText(
      getByPlaceholderText(p.typePlaceholder),
      'PORQUE de tal manera amo dios al mundo',
    );
    fireEvent.press(getByText(p.typeCheck));

    expect(
      getByText(
        p.typeResult.replace('{{correct}}', '8').replace('{{total}}', '8'),
      ),
    ).toBeTruthy();
  });

  it("starts fresh (no stale answer/result) when switching back into 'type' mode", () => {
    mockDueCards = [makeCard(3)];
    const {getByText, getByPlaceholderText, queryByText} = render(
      <MemoryPracticeScreen />,
    );

    fireEvent.press(getByText(p.modeType));
    fireEvent.changeText(
      getByPlaceholderText(p.typePlaceholder),
      'Porque de tal manera amó Dios al mundo',
    );
    fireEvent.press(getByText(p.typeCheck));
    expect(queryByText(p.again)).not.toBeNull();

    // Leave and come back — the mode-switch effect should reset revealed
    // state, so we're back at the TextInput, not a stale checked result.
    fireEvent.press(getByText(p.modeReveal));
    fireEvent.press(getByText(p.modeType));

    expect(getByPlaceholderText(p.typePlaceholder)).toBeTruthy();
    expect(queryByText(p.again)).toBeNull();
  });
});

describe('Memory practice — Favorito ↔ Memorizar cross-link', () => {
  it('offers "add to favorites" for the current card when it is not yet favorited', () => {
    mockDueCards = [makeCard(3)];
    mockFavorites = [];
    const {getByLabelText} = render(<MemoryPracticeScreen />);
    expect(getByLabelText(v.addFavorite)).toBeTruthy();
  });

  it('offers "remove from favorites" when the current card IS already favorited', () => {
    mockDueCards = [makeCard(3)];
    mockFavorites = [
      {
        id: 'fav_1',
        verseId: 'Juan_3_16',
        book: 'Juan',
        chapter: 3,
        verse: 16,
        text: 'Porque de tal manera amó Dios al mundo',
        category: 'other',
        rating: 5,
        tags: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    ];
    const {getByLabelText} = render(<MemoryPracticeScreen />);
    expect(getByLabelText(v.removeFavorite)).toBeTruthy();
  });

  it('tapping the heart on an unfavorited card calls addFavorite with the card verse', () => {
    mockDueCards = [makeCard(3)];
    mockFavorites = [];
    const {getByLabelText} = render(<MemoryPracticeScreen />);

    fireEvent.press(getByLabelText(v.addFavorite));

    expect(mockAddFavorite).toHaveBeenCalledWith(
      {
        book: 'Juan',
        chapter: 3,
        verse: 16,
        text: 'Porque de tal manera amó Dios al mundo',
      },
      'other',
      5,
    );
  });

  it('tapping the heart on an already-favorited card calls removeFavorite with its id', () => {
    mockDueCards = [makeCard(3)];
    mockFavorites = [
      {
        id: 'fav_42',
        verseId: 'Juan_3_16',
        book: 'Juan',
        chapter: 3,
        verse: 16,
        text: 'Porque de tal manera amó Dios al mundo',
        category: 'other',
        rating: 5,
        tags: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    ];
    const {getByLabelText} = render(<MemoryPracticeScreen />);

    fireEvent.press(getByLabelText(v.removeFavorite));

    expect(mockRemoveFavorite).toHaveBeenCalledWith('fav_42');
  });
});
