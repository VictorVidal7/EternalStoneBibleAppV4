import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import SearchScreen from '../SearchScreen';
import { UserPreferencesProvider } from '../../context/UserPreferencesContext';
import * as bibleVerses from '../../data/bibleVerses';

jest.mock('../../data/bibleVerses', () => ({
  searchBible: jest.fn(),
}));

const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
  }),
}));

const renderWithProviders = (ui, options) =>
  render(
    <UserPreferencesProvider>
      {ui}
    </UserPreferencesProvider>,
    options
  );

describe('SearchScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly', () => {
    const { getByPlaceholderText, getAllByText } = renderWithProviders(<SearchScreen />);

    expect(getByPlaceholderText('Buscar en la Biblia...')).toBeTruthy();
    expect(getAllByText('Toda')[0]).toBeTruthy();
    expect(getAllByText('A.T.')[0]).toBeTruthy();
    expect(getAllByText('N.T.')[0]).toBeTruthy();
  });

  it('performs search when text is entered and search icon is pressed', async () => {
    const mockSearchResults = [
      { book: 'Génesis', chapter: 1, verseNumber: 1, text: 'En el principio creó Dios los cielos y la tierra.' },
    ];
    bibleVerses.searchBible.mockReturnValue(mockSearchResults);

    const { getByTestId, queryByText, debug } = renderWithProviders(<SearchScreen />);

    const searchInput = getByTestId('search-input');
    const searchIcon = getByTestId('search-icon');
    
    await act(async () => {
      fireEvent.changeText(searchInput, 'principio');
    });

    await act(async () => {
      fireEvent.press(searchIcon);
    });

    // Espera a que los resultados se rendericen
    await waitFor(() => {
      expect(queryByText('No se encontraron resultados')).toBeNull();
      expect(queryByText('Génesis 1:1')).toBeTruthy();
      expect(queryByText('En el principio creó Dios los cielos y la tierra.')).toBeTruthy();
    });

    debug();
  });

  it('navigates to verse when result is pressed', async () => {
    const mockSearchResults = [
      { book: 'Génesis', chapter: 1, verseNumber: 1, text: 'En el principio creó Dios los cielos y la tierra.' },
    ];
    bibleVerses.searchBible.mockReturnValue(mockSearchResults);

    const { getByTestId, queryByText } = renderWithProviders(<SearchScreen />);

    const searchInput = getByTestId('search-input');
    const searchIcon = getByTestId('search-icon');
    
    await act(async () => {
      fireEvent.changeText(searchInput, 'principio');
    });

    await act(async () => {
      fireEvent.press(searchIcon);
    });

    // Espera a que los resultados se rendericen
    await waitFor(() => {
      expect(queryByText('Génesis 1:1')).toBeTruthy();
    });

    const resultItem = queryByText('Génesis 1:1');
    fireEvent.press(resultItem);

    expect(mockNavigate).toHaveBeenCalledWith('Verse', { book: 'Génesis', chapter: 1, verseNumber: 1 });
  });
});