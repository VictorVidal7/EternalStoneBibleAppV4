import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import DailyVerse from '../DailyVerse';
import DailyVerseService from '../../services/DailyVerseService';
import { UserPreferencesProvider } from '../../context/UserPreferencesContext';

jest.mock('../../services/DailyVerseService');

const MockWrapper = ({ children }) => (
  <UserPreferencesProvider>{children}</UserPreferencesProvider>
);

describe('DailyVerse', () => {
  it('renders daily verse correctly', async () => {
    const mockVerse = {
      book: 'Genesis',
      chapter: 1,
      number: 1,
      text: 'In the beginning God created the heavens and the earth.',
    };

    DailyVerseService.getDailyVerse.mockResolvedValue(mockVerse);

    const { getByText } = render(<DailyVerse navigation={{}} />, { wrapper: MockWrapper });

    await waitFor(() => {
      expect(getByText('Versículo del Día')).toBeTruthy();
      expect(getByText(mockVerse.text)).toBeTruthy();
      expect(getByText(`${mockVerse.book} ${mockVerse.chapter}:${mockVerse.number}`)).toBeTruthy();
    }, { timeout: 10000 }); // Aumentamos el timeout a 10 segundos
  }, 15000); // Aumentamos el timeout del test a 15 segundos
});