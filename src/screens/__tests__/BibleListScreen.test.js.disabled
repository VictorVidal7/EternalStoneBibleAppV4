import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import BibleListScreen from '../BibleListScreen';
import { UserPreferencesProvider } from '../../context/UserPreferencesContext';

const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => {
  const actualNav = jest.requireActual('@react-navigation/native');
  return {
    ...actualNav,
    useNavigation: () => ({
      navigate: mockNavigate,
    }),
  };
});

jest.mock('../../data/bibleVerses', () => ({
  bibleBooks: {
    'Génesis': 50,
    'Éxodo': 40,
  },
}));

jest.mock('../../hooks/useStyles', () => ({
  useStyles: jest.fn(() => ({
    container: {},
    bookItem: {},
    bookName: {},
  })),
}));

const renderWithProviders = (ui, options) =>
  render(
    <NavigationContainer>
      <UserPreferencesProvider>
        {ui}
      </UserPreferencesProvider>
    </NavigationContainer>,
    options
  );

describe('BibleListScreen', () => {
  it('renders correctly', () => {
    const { getByText } = renderWithProviders(<BibleListScreen />);

    expect(getByText('Génesis')).toBeTruthy();
    expect(getByText('Éxodo')).toBeTruthy();
  });

  it('navigates to Chapter screen when a book is pressed', () => {
    const { getByText } = renderWithProviders(<BibleListScreen />);

    fireEvent.press(getByText('Génesis'));
    expect(mockNavigate).toHaveBeenCalledWith('Chapter', { book: 'Génesis' });
  });
});