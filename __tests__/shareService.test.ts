/**
 * ShareService is a non-React static service, so it reads the active language
 * imperatively via languageUtils.getTranslations(). These tests prove the
 * native share dialog title, the in-message app promo, and the clipboard
 * fallback alert are localized (es/en) instead of hardcoded Spanish.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import {Alert} from 'react-native';

const mockShareAsync = jest.fn().mockResolvedValue(undefined);
const mockIsAvailableAsync = jest.fn().mockResolvedValue(true);
const mockSetStringAsync = jest.fn().mockResolvedValue(undefined);

jest.mock('expo-sharing', () => ({
  isAvailableAsync: (...args: unknown[]) => mockIsAvailableAsync(...args),
  shareAsync: (...args: unknown[]) => mockShareAsync(...args),
}));
jest.mock('expo-clipboard', () => ({
  setStringAsync: (...args: unknown[]) => mockSetStringAsync(...args),
}));
jest.mock('@lib/haptics', () => ({
  haptics: {tap: jest.fn(), press: jest.fn(), success: jest.fn()},
}));

import ShareService from '../src/services/ShareService';
import {invalidateLanguageCache} from '../src/i18n/languageUtils';
import type {BibleVerse} from '../src/types/bible';

const verse = {
  book: 'Juan',
  chapter: 3,
  verse: 16,
  text: 'Porque de tal manera amó Dios al mundo...',
  version: 'RVR1960',
} as BibleVerse;

async function setLanguage(lang: 'es' | 'en') {
  await AsyncStorage.setItem('@app_language', lang);
  invalidateLanguageCache();
}

beforeEach(() => {
  jest.clearAllMocks();
  mockIsAvailableAsync.mockResolvedValue(true);
});

describe('ShareService localization', () => {
  it('uses the Spanish dialog title and promo when language is es', async () => {
    await setLanguage('es');
    await ShareService.shareVerse(verse, 'Juan 3:16');

    expect(mockShareAsync).toHaveBeenCalledTimes(1);
    const [message, opts] = mockShareAsync.mock.calls[0];
    expect(opts.dialogTitle).toBe('Compartir versículo');
    expect(message).toContain('✨ Compartido desde Eternal Bible');
  });

  it('uses the English dialog title and promo when language is en', async () => {
    await setLanguage('en');
    await ShareService.shareVerse(verse, 'John 3:16');

    expect(mockShareAsync).toHaveBeenCalledTimes(1);
    const [message, opts] = mockShareAsync.mock.calls[0];
    expect(opts.dialogTitle).toBe('Share verse');
    expect(message).toContain('✨ Shared from Eternal Bible');
  });

  it('localizes the clipboard-fallback alert when sharing is unavailable', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    mockIsAvailableAsync.mockResolvedValue(false);

    await setLanguage('en');
    await ShareService.shareVerse(verse, 'John 3:16');

    expect(mockSetStringAsync).toHaveBeenCalledTimes(1);
    expect(alertSpy).toHaveBeenCalledWith(
      'Copied',
      'The content was copied to the clipboard',
      [{text: 'OK'}],
    );
    alertSpy.mockRestore();
  });
});
