import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import VerseScreen from '../VerseScreen';
import * as BookmarksContext from '../../context/BookmarksContext';
import * as UserPreferencesContext from '../../context/UserPreferencesContext';
import * as bibleVerses from '../../data/bibleVerses';
import * as useStylesModule from '../../hooks/useStyles';

// Mock de los hooks y contextos
jest.mock('../../context/BookmarksContext', () => ({
  useBookmarks: jest.fn(),
}));

jest.mock('../../context/UserPreferencesContext', () => ({
  useUserPreferences: jest.fn(),
}));

jest.mock('../../hooks/useStyles', () => ({
  useStyles: jest.fn(),
}));

jest.mock('../../data/bibleVerses', () => ({
  getVersesForChapter: jest.fn(),
}));

// Mock de Icon
jest.mock('react-native-vector-icons/MaterialIcons', () => 'Icon');

describe('VerseScreen', () => {
  const mockVerses = [
    { number: 1, text: 'In the beginning God created the heavens and the earth.' },
    { number: 2, text: 'Now the earth was formless and empty, darkness was over the surface of the deep, and the Spirit of God was hovering over the waters.' },
  ];

  const mockAddBookmark = jest.fn();
  const mockRemoveBookmark = jest.fn();
  const mockStyles = {
    container: { backgroundColor: '#f5f5f5' },
    verseContainer: {},
    verseNumber: { fontSize: 14 },
    verseText: { fontSize: 16 },
    bookmarkColor: '#007AFF',
  };

  beforeEach(() => {
    jest.clearAllMocks();

    UserPreferencesContext.useUserPreferences.mockReturnValue({
      nightMode: false,
      fontSize: 'medium',
      fontFamily: 'default',
    });

    BookmarksContext.useBookmarks.mockReturnValue({
      bookmarks: [],
      addBookmark: mockAddBookmark,
      removeBookmark: mockRemoveBookmark,
    });

    bibleVerses.getVersesForChapter.mockReturnValue(mockVerses);

    useStylesModule.useStyles.mockReturnValue(mockStyles);
  });

  const renderVerseScreen = (props = {}) => {
    return render(
      <VerseScreen
        route={{ params: { book: 'Genesis', chapter: 1 } }}
        {...props}
      />
    );
  };

  it('renders verses correctly', () => {
    const { getByText } = renderVerseScreen();

    expect(getByText('1')).toBeTruthy();
    expect(getByText('In the beginning God created the heavens and the earth.')).toBeTruthy();
    expect(getByText('2')).toBeTruthy();
    expect(getByText('Now the earth was formless and empty, darkness was over the surface of the deep, and the Spirit of God was hovering over the waters.')).toBeTruthy();
  });

  it('adds bookmark when bookmark icon is pressed', () => {
    const { getAllByTestId } = renderVerseScreen();

    const bookmarkIcons = getAllByTestId('bookmark-icon');
    fireEvent.press(bookmarkIcons[0]);

    expect(mockAddBookmark).toHaveBeenCalledWith('Genesis', 1, 1);
  });

  it('removes bookmark when bookmark icon is pressed for an existing bookmark', () => {
    BookmarksContext.useBookmarks.mockReturnValue({
      bookmarks: [{ book: 'Genesis', chapter: 1, verse: 1 }],
      addBookmark: mockAddBookmark,
      removeBookmark: mockRemoveBookmark,
    });

    const { getAllByTestId } = renderVerseScreen();

    const bookmarkIcons = getAllByTestId('bookmark-icon');
    fireEvent.press(bookmarkIcons[0]);

    expect(mockRemoveBookmark).toHaveBeenCalledWith('Genesis', 1, 1);
  });

  it('applies night mode styles when night mode is enabled', () => {
    UserPreferencesContext.useUserPreferences.mockReturnValue({
      nightMode: true,
      fontSize: 'medium',
      fontFamily: 'default',
    });

    useStylesModule.useStyles.mockReturnValue({
      ...mockStyles,
      container: { backgroundColor: '#121212' },
    });

    const { getByTestId } = renderVerseScreen();

    const container = getByTestId('verse-screen-container');
    expect(container.props.style).toHaveProperty('backgroundColor', '#121212');
  });

  it('applies correct font size based on user preferences', () => {
    UserPreferencesContext.useUserPreferences.mockReturnValue({
      nightMode: false,
      fontSize: 'large',
      fontFamily: 'default',
    });

    useStylesModule.useStyles.mockReturnValue({
      ...mockStyles,
      verseText: { fontSize: 18 },
    });

    const { getByTestId } = renderVerseScreen();

    const verseText = getByTestId('verse-text-1');
    expect(verseText.props.style).toHaveProperty('fontSize', 18);
  });

  it('uses correct font family based on user preferences', () => {
    UserPreferencesContext.useUserPreferences.mockReturnValue({
      nightMode: false,
      fontSize: 'medium',
      fontFamily: 'serif',
    });

    useStylesModule.useStyles.mockReturnValue({
      ...mockStyles,
      verseText: { ...mockStyles.verseText, fontFamily: 'serif' },
    });

    const { getByTestId } = renderVerseScreen();

    const verseText = getByTestId('verse-text-1');
    expect(verseText.props.style).toHaveProperty('fontFamily', 'serif');
  });

  it('renders correct bookmark icon for bookmarked verses', () => {
    BookmarksContext.useBookmarks.mockReturnValue({
      bookmarks: [{ book: 'Genesis', chapter: 1, verse: 1 }],
      addBookmark: mockAddBookmark,
      removeBookmark: mockRemoveBookmark,
    });

    renderVerseScreen();

    expect(bibleVerses.getVersesForChapter).toHaveBeenCalledWith('Genesis', 1);
  });

  it('calls getVersesForChapter with correct parameters', () => {
    renderVerseScreen({ route: { params: { book: 'Exodus', chapter: 2 } } });

    expect(bibleVerses.getVersesForChapter).toHaveBeenCalledWith('Exodus', 2);
  });
});