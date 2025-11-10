import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import HomeScreen from '../HomeScreen';
import { UserPreferencesProvider } from '../../context/UserPreferencesContext';
import { BookmarksProvider } from '../../context/BookmarksContext';
import { ReadingPlanProvider } from '../../context/ReadingPlanContext';
import { ErrorProvider } from '../../context/ErrorContext';

// Mock the navigation
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

// Mock the hooks
jest.mock('../../context/BookmarksContext', () => ({
  ...jest.requireActual('../../context/BookmarksContext'),
  useBookmarks: () => ({ bookmarks: [] }),
}));

jest.mock('../../context/ReadingPlanContext', () => ({
  ...jest.requireActual('../../context/ReadingPlanContext'),
  useReadingPlan: () => ({ currentPlan: null }),
}));

jest.mock('../../hooks/useStyles', () => ({
  useStyles: () => ({
    container: {},
    title: {},
    button: {},
    buttonText: {},
    infoContainer: {},
    infoText: {},
    dynamicFontSize: 16,
  }),
}));

const AllTheProviders = ({ children }) => {
  return (
    <NavigationContainer>
      <ErrorProvider>
        <UserPreferencesProvider>
          <BookmarksProvider>
            <ReadingPlanProvider>
              {children}
            </ReadingPlanProvider>
          </BookmarksProvider>
        </UserPreferencesProvider>
      </ErrorProvider>
    </NavigationContainer>
  );
};

describe('HomeScreen', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  it('renders correctly', () => {
    const { getByText } = render(<HomeScreen />, { wrapper: AllTheProviders });
    expect(getByText('Eternal Stone Bible App')).toBeTruthy();
    expect(getByText('Explorar la Biblia')).toBeTruthy();
    expect(getByText('Mis Marcadores (0)')).toBeTruthy();
    expect(getByText('Seleccionar Plan de Lectura')).toBeTruthy();
    expect(getByText('Buscar en la Biblia')).toBeTruthy();
    expect(getByText('Configuración')).toBeTruthy();
  });

  it('navigates to Bible screen when "Explorar la Biblia" is pressed', () => {
    const { getByText } = render(<HomeScreen />, { wrapper: AllTheProviders });
    fireEvent.press(getByText('Explorar la Biblia'));
    expect(mockNavigate).toHaveBeenCalledWith('Bible');
  });

  it('navigates to Bookmarks screen when "Mis Marcadores" is pressed', () => {
    const { getByText } = render(<HomeScreen />, { wrapper: AllTheProviders });
    fireEvent.press(getByText('Mis Marcadores (0)'));
    expect(mockNavigate).toHaveBeenCalledWith('Bookmarks');
  });

  it('navigates to ReadingPlan screen when "Seleccionar Plan de Lectura" is pressed', () => {
    const { getByText } = render(<HomeScreen />, { wrapper: AllTheProviders });
    fireEvent.press(getByText('Seleccionar Plan de Lectura'));
    expect(mockNavigate).toHaveBeenCalledWith('ReadingPlan');
  });

  it('navigates to Search screen when "Buscar en la Biblia" is pressed', () => {
    const { getByText } = render(<HomeScreen />, { wrapper: AllTheProviders });
    fireEvent.press(getByText('Buscar en la Biblia'));
    expect(mockNavigate).toHaveBeenCalledWith('Search');
  });

  it('navigates to Settings screen when "Configuración" is pressed', () => {
    const { getByText } = render(<HomeScreen />, { wrapper: AllTheProviders });
    fireEvent.press(getByText('Configuración'));
    expect(mockNavigate).toHaveBeenCalledWith('Settings');
  });
});