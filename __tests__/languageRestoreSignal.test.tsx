/**
 * R9-30 — the app language travels in the backup, and the mounted
 * `LanguageProvider` applies it on `subscribeBackupRestored`.
 *
 * It read `@app_language` once on mount: after a restore the screens kept the
 * old language, and the non-React cache (`getCurrentLanguage`, used by the
 * badge and mission texts) kept it too.
 *
 * Lo REAL: LanguageProvider, languageUtils, the restore signal, over the
 * AsyncStorage mock. Lo sustituido: expo-localization.
 */
import {Text, TouchableOpacity} from 'react-native';
import {act, fireEvent, render, waitFor} from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

jest.mock('expo-localization', () => ({
  getLocales: () => [{languageCode: 'es'}],
}));

import {LanguageProvider, useLanguage} from '../src/hooks/useLanguage';
import {
  getCurrentLanguage,
  invalidateLanguageCache,
} from '../src/i18n/languageUtils';
import {
  __resetBackupRestoredListenersForTests,
  emitBackupRestored,
} from '../src/lib/backup/restoreSignal';

function Probe() {
  const {language, setLanguage} = useLanguage();
  return (
    <>
      <Text testID="lang">{language}</Text>
      <TouchableOpacity testID="pick-es" onPress={() => setLanguage('es')} />
    </>
  );
}

function renderProvider() {
  return render(
    <LanguageProvider>
      <Probe />
    </LanguageProvider>,
  );
}

describe('R9-30 — LanguageProvider applies the restored language', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    __resetBackupRestoredListenersForTests();
    invalidateLanguageCache();
    await AsyncStorage.setItem('@app_language', 'es');
  });

  it('the screens and the non-React cache switch to the restored language', async () => {
    const view = renderProvider();
    await waitFor(() =>
      expect(view.getByTestId('lang').props.children).toBe('es'),
    );
    expect(await getCurrentLanguage()).toBe('es');

    // What importBackup does: write payload.local, then announce it.
    await AsyncStorage.setItem('@app_language', 'en');
    await act(async () => {
      emitBackupRestored();
    });

    await waitFor(() =>
      expect(view.getByTestId('lang').props.children).toBe('en'),
    );
    expect(await getCurrentLanguage()).toBe('en');
  });

  it('a pick made while the re-read is in flight is not overwritten by it', async () => {
    const view = renderProvider();
    await waitFor(() =>
      expect(view.getByTestId('lang').props.children).toBe('es'),
    );

    await AsyncStorage.setItem('@app_language', 'en');
    // Keep the mock's implementation, not the function, or it calls itself.
    const getItemMock = AsyncStorage.getItem as jest.Mock;
    const realImpl = getItemMock.getMockImplementation()!;
    let release: (() => void) | undefined;
    const gate = new Promise<void>(r => (release = r));
    getItemMock.mockImplementation(async (key: string) => {
      const value = (await realImpl(key)) as string | null;
      if (key === '@app_language') await gate;
      return value;
    });
    try {
      await act(async () => {
        emitBackupRestored();
      });
      // The user picks Spanish while the re-read still holds 'en'.
      await act(async () => {
        fireEvent.press(view.getByTestId('pick-es'));
      });
      await act(async () => {
        release!();
      });
    } finally {
      getItemMock.mockImplementation(realImpl);
    }

    await waitFor(async () =>
      expect(await AsyncStorage.getItem('@app_language')).toBe('es'),
    );
    expect(view.getByTestId('lang').props.children).toBe('es');
  });

  // R9-608 — importBackup no longer writes a language this build cannot use
  // (`backupUnusableLocalValues.test.tsx`): a bad value on disk is not what a
  // restore leaves. This only checks that the re-read stays defensive: it
  // ignores the value and writes nothing back.
  it('CONTROL: the re-read ignores a bad value on disk and writes nothing', async () => {
    const view = renderProvider();
    await waitFor(() =>
      expect(view.getByTestId('lang').props.children).toBe('es'),
    );
    await AsyncStorage.setItem('@app_language', 'fr');
    (AsyncStorage.setItem as jest.Mock).mockClear();
    await act(async () => {
      emitBackupRestored();
    });
    expect(view.getByTestId('lang').props.children).toBe('es');
    expect(AsyncStorage.setItem as jest.Mock).not.toHaveBeenCalled();
  });
});
