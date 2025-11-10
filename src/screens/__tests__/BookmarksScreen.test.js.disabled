import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import BookmarksScreen from '../BookmarksScreen';
import * as BookmarksContext from '../../context/BookmarksContext';
import { ErrorProvider } from '../../context/ErrorContext';
import { UserPreferencesProvider } from '../../context/UserPreferencesContext';
import { NavigationContainer } from '@react-navigation/native';

// Mock de useNavigation
jest.mock('@react-navigation/native', () => {
  return {
    ...jest.requireActual('@react-navigation/native'),
    useNavigation: () => ({
      navigate: jest.fn(),
    }),
  };
});

// Mock de UserPreferencesContext
jest.mock('../../context/UserPreferencesContext', () => ({
  ...jest.requireActual('../../context/UserPreferencesContext'),
  useUserPreferences: () => ({
    nightMode: false,
    fontSize: 'medium',
    fontFamily: 'default',
  }),
}));

const mockBookmarks = [
  { book: 'Genesis', chapter: 1, verse: 1 },
  { book: 'Psalms', chapter: 23, verse: 1 },
];

const renderWithProviders = (ui, { bookmarks = [], removeBookmark = jest.fn() } = {}) => {
  jest.spyOn(BookmarksContext, 'useBookmarks').mockReturnValue({
    bookmarks,
    removeBookmark,
  });

  return render(
    <ErrorProvider>
      <UserPreferencesProvider>
        <NavigationContainer>
          {ui}
        </NavigationContainer>
      </UserPreferencesProvider>
    </ErrorProvider>
  );
};

describe('BookmarksScreen', () => {
  it('renders correctly with bookmarks', () => {
    const { getByText } = renderWithProviders(<BookmarksScreen />, { bookmarks: mockBookmarks });

    expect(getByText('Genesis 1:1')).toBeTruthy();
    expect(getByText('Psalms 23:1')).toBeTruthy();
  });

  it('displays message when no bookmarks', () => {
    const { getByText } = renderWithProviders(<BookmarksScreen />, { bookmarks: [] });

    expect(getByText('No tienes marcadores guardados.')).toBeTruthy();
  });

  it('calls removeBookmark when delete icon is pressed', () => {
    const mockRemoveBookmark = jest.fn();
    const { getAllByTestId } = renderWithProviders(<BookmarksScreen />, {
      bookmarks: mockBookmarks,
      removeBookmark: mockRemoveBookmark,
    });

    const deleteButtons = getAllByTestId('delete-bookmark');
    fireEvent.press(deleteButtons[0]);

    expect(mockRemoveBookmark).toHaveBeenCalledWith('Genesis', 1, 1);
  });

  it('navigates to Verse screen when bookmark is pressed', () => {
    const mockNavigate = jest.fn();
    jest.spyOn(require('@react-navigation/native'), 'useNavigation').mockReturnValue({ navigate: mockNavigate });

    const { getAllByTestId } = renderWithProviders(<BookmarksScreen />, { bookmarks: mockBookmarks });

    const bookmarkItems = getAllByTestId('bookmark-item');
    fireEvent.press(bookmarkItems[0]);

    expect(mockNavigate).toHaveBeenCalledWith('Verse', { book: 'Genesis', chapter: 1, verse: 1 });
  });
});