import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import ChapterScreen from '../ChapterScreen';
import { UserPreferencesProvider } from '../../context/UserPreferencesContext';

const mockNavigate = jest.fn();
const mockRoute = {
  params: { book: 'Génesis' }
};

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({
    navigate: mockNavigate,
  }),
}));

jest.mock('../../data/bibleVerses', () => ({
  bibleBooks: {
    'Génesis': 50,
  },
}));

jest.mock('../../hooks/useStyles', () => ({
  useStyles: jest.fn(() => ({
    container: {},
    bookTitle: {},
    chapterItem: {},
    chapterText: {},
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

describe('ChapterScreen', () => {
  it('renders correctly', () => {
    const { getByText, getAllByText } = renderWithProviders(<ChapterScreen route={mockRoute} />);

    expect(getByText('Génesis')).toBeTruthy();
    const chapterButtons = getAllByText(/Capítulo \d+/);
    expect(chapterButtons.length).toBe(50);
    expect(chapterButtons[0]).toHaveTextContent('Capítulo 1');
    expect(chapterButtons[49]).toHaveTextContent('Capítulo 50');
  });

  it('navigates to Verse screen when a chapter is pressed', () => {
    const { getByText } = renderWithProviders(<ChapterScreen route={mockRoute} />);

    fireEvent.press(getByText('Capítulo 1'));
    expect(mockNavigate).toHaveBeenCalledWith('Verse', { book: 'Génesis', chapter: 1 });
  });
});