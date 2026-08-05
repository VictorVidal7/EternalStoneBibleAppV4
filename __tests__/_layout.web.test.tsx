/**
 * Sprint 84 — web reader-font startup perf fix.
 *
 * Before this fix, `app/_layout.web.tsx` called `await loadReaderFonts()`
 * (all 18 bundled `.ttf` files, ~3.58MB) INSIDE `initializeApp()`, before
 * `setIsLoading(false)` cleared the loading screen — so every web page load
 * blocked first paint on the whole reader-font catalog, even though
 * `expo-font`'s web loader forces an eager fetch of every family it's given
 * (unlike native, where the same call is a cheap async registration).
 *
 * This test proves, at the web root layout's `AppContent` level:
 *  1. The loading screen clears as soon as `initializeBibleData` resolves,
 *     WITHOUT waiting on the reader-font load (mirrors native's existing
 *     `_layout.test.tsx` non-blocking-services test).
 *  2. Only the user's currently-active family is requested — never the
 *     full catalog — and only once the persisted preference has hydrated.
 */
import React from 'react';
import {render, waitFor} from '@testing-library/react-native';
import {AppContent} from '../app/_layout.web';

// ---- The genuinely-required step ----
const mockInitializeBibleData = jest.fn();
jest.mock('../src/lib/database/data-loader', () => ({
  initializeBibleData: (onProgress?: (loaded: number, total: number) => void) =>
    mockInitializeBibleData(onProgress),
}));

jest.mock('../src/lib/database/data-loader.web', () => ({
  clearWebStorageForLockRecovery: jest.fn(() => Promise.resolve()),
}));

jest.mock('../src/lib/database/storageLockError', () => ({
  isStorageLockError: () => false,
}));

// ---- The reader-font loader — the thing under test ----
const mockLoadFontFamily = jest.fn((_familyId: string) => Promise.resolve());
jest.mock('../src/lib/reader/fontAssets', () => ({
  loadFontFamily: (familyId: string) => mockLoadFontFamily(familyId),
}));

// ---- Hooks AppContent reads directly ----
jest.mock('../src/hooks/useLanguage', () => ({
  useLanguage: () => ({
    t: require('../src/i18n/translations').translations.es,
  }),
  LanguageProvider: ({children}: {children: React.ReactNode}) => children,
}));

jest.mock('../src/hooks/useReducedMotion', () => ({
  useReducedMotion: () => false,
}));

// Controllable per-test: simulates the ReaderPreferencesContext hydration
// lifecycle (starts un-hydrated at the default family, later resolves to
// whatever the persisted preference actually was).
const mockUseReaderPreferences = jest.fn();
jest.mock('../src/context/ReaderPreferencesContext', () => ({
  useReaderPreferences: () => mockUseReaderPreferences(),
  ReaderPreferencesProvider: ({children}: {children: React.ReactNode}) =>
    children,
}));

jest.mock('expo-router', () => ({
  Stack: Object.assign(() => null, {Screen: () => null}),
}));

describe('web AppContent — reader-font startup (Sprint 84)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseReaderPreferences.mockReturnValue({
      preferences: {fontFamily: 'sans'},
      hydrated: false,
    });
  });

  it('clears the loading screen once initializeBibleData resolves, without waiting on the font load', async () => {
    mockInitializeBibleData.mockImplementation(async () => undefined);
    // Hang the font load forever — it must NOT hold up first paint.
    mockLoadFontFamily.mockImplementation(() => new Promise(() => {}));
    mockUseReaderPreferences.mockReturnValue({
      preferences: {fontFamily: 'serif'},
      hydrated: true,
    });

    const {queryByText} = render(<AppContent />);

    expect(queryByText('Preparando...')).toBeTruthy();

    await waitFor(() => {
      expect(queryByText('Preparando...')).toBeNull();
    });

    // The hung font load must actually have been invoked — otherwise a
    // green test could be a false pass from it never firing.
    expect(mockLoadFontFamily).toHaveBeenCalledWith('serif');
  });

  it('requests only the active family, never the full 9-family/18-file catalog', async () => {
    mockInitializeBibleData.mockImplementation(async () => undefined);
    mockUseReaderPreferences.mockReturnValue({
      preferences: {fontFamily: 'condensed'},
      hydrated: true,
    });

    render(<AppContent />);

    await waitFor(() => {
      expect(mockLoadFontFamily).toHaveBeenCalledTimes(1);
    });
    expect(mockLoadFontFamily).toHaveBeenCalledWith('condensed');
  });

  it('does not request any font family before the persisted preference has hydrated', async () => {
    mockInitializeBibleData.mockImplementation(async () => undefined);
    mockUseReaderPreferences.mockReturnValue({
      preferences: {fontFamily: 'sans'},
      hydrated: false,
    });

    const {queryByText} = render(<AppContent />);

    await waitFor(() => {
      expect(queryByText('Preparando...')).toBeNull();
    });

    expect(mockLoadFontFamily).not.toHaveBeenCalled();
  });

  it('still surfaces an error and clears loading when initializeBibleData itself fails', async () => {
    mockInitializeBibleData.mockImplementation(async () => {
      throw new Error('seed copy failed');
    });

    const {queryByText, findByText} = render(<AppContent />);

    expect(queryByText('Preparando...')).toBeTruthy();

    await findByText('seed copy failed');
    expect(queryByText('Preparando...')).toBeNull();
  });
});
