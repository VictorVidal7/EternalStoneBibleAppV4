/**
 * ShareService is a non-React static service, so it reads the active language
 * imperatively via languageUtils.getTranslations(). These tests prove the
 * native share dialog title, the in-message app promo, and the clipboard
 * fallback feedback are localized (es/en) instead of hardcoded Spanish.
 *
 * The clipboard fallback used to fire a native Alert.alert; it now calls an
 * optional `onFeedback(variant, message)` callback (UX audit, 2026-07) so the
 * caller can route it through its own themed `useToast()` instead.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

const mockShareFn = jest.fn().mockResolvedValue({action: 'sharedAction'});
const mockIsAvailableAsync = jest.fn().mockResolvedValue(true);
const mockSetStringAsync = jest.fn().mockResolvedValue(undefined);

// `react-native`'s index re-exports `Share` as a lazy getter over
// `./Libraries/Share/Share`. Mocking the whole `react-native` module (even
// via `{...jest.requireActual('react-native')}`) forces every one of those
// lazy getters to evaluate eagerly — including native-only subsystems like
// DevMenu — and crashes under jest-expo with a TurboModuleRegistry
// invariant. Mocking just the submodule that backs `Share` (same targeted
// style used for TouchableOpacity elsewhere in this suite) avoids that.
jest.mock('react-native/Libraries/Share/Share', () => ({
  __esModule: true,
  default: {share: (...args: unknown[]) => mockShareFn(...args)},
}));
jest.mock('expo-sharing', () => ({
  isAvailableAsync: (...args: unknown[]) => mockIsAvailableAsync(...args),
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
  mockShareFn.mockResolvedValue({action: 'sharedAction'});
  mockIsAvailableAsync.mockResolvedValue(true);
});

describe('ShareService localization', () => {
  it('uses the Spanish dialog title and promo when language is es', async () => {
    await setLanguage('es');
    await ShareService.shareVerse(verse, 'Juan 3:16');

    expect(mockShareFn).toHaveBeenCalledTimes(1);
    const [{message}, opts] = mockShareFn.mock.calls[0];
    expect(opts.dialogTitle).toBe('Compartir versículo');
    expect(message).toContain('✨ Compartido desde Eternal Stone Bible');
  });

  it('uses the English dialog title and promo when language is en', async () => {
    await setLanguage('en');
    await ShareService.shareVerse(verse, 'John 3:16');

    expect(mockShareFn).toHaveBeenCalledTimes(1);
    const [{message}, opts] = mockShareFn.mock.calls[0];
    expect(opts.dialogTitle).toBe('Share verse');
    expect(message).toContain('✨ Shared from Eternal Stone Bible');
  });

  it('localizes the clipboard-fallback feedback when the share sheet throws', async () => {
    const onFeedback = jest.fn();
    mockShareFn.mockRejectedValueOnce(new Error('boom'));

    await setLanguage('en');
    await ShareService.shareVerse(verse, 'John 3:16', {}, onFeedback);

    expect(mockSetStringAsync).toHaveBeenCalledTimes(1);
    expect(onFeedback).toHaveBeenCalledWith(
      'success',
      'The content was copied to the clipboard',
    );
  });
});
