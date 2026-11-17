/**
 * R9-30 — the "Banco de ilustraciones" editor re-reads its illustration when
 * a backup is restored.
 *
 * The store itself is safe (every write re-reads `@prep_illustrations` from
 * disk), but the open editor holds the title and the body in `useState`,
 * read once per focus, and each keystroke saves the WHOLE field it holds.
 * With the editor focused while a restore lands (an import still running
 * when the user goes back to it), the next keystroke wrote the pre-import
 * text (plus the keystroke) back over the restored field.
 *
 * Lo REAL: PrepIllustrationEditorScreen, PremiumProvider, the
 * prepIllustrations store (with its `prepKey`/`prepWrite`) and the restore
 * signal, over the AsyncStorage mock. Lo sustituido: theme, language, router
 * (focus = mount, as in prepIllustrationEditorScreen.test.tsx) and the
 * offering sheet.
 */
import {act, fireEvent, render, waitFor} from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

jest.mock('expo-router', () => {
  const ReactActual = require('react');
  return {
    useRouter: () => ({push: jest.fn(), back: jest.fn()}),
    useLocalSearchParams: () => ({id: 'i1'}),
    useFocusEffect: (cb: () => void) => ReactActual.useEffect(cb, [cb]),
    Stack: {Screen: () => null},
  };
});
jest.mock('@expo/vector-icons', () => ({Ionicons: () => null}));
jest.mock('expo-linear-gradient', () => {
  const {View} = require('react-native');
  return {LinearGradient: View};
});
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({top: 0, bottom: 0, left: 0, right: 0}),
}));
jest.mock('@lib/haptics', () => ({
  haptics: {tap: jest.fn(), success: jest.fn()},
}));
const mockColors = new Proxy({}, {get: () => '#888888'});
jest.mock('@hooks/useTheme', () => ({
  useTheme: () => ({
    colors: mockColors,
    gradient: {headerColors: ['#000000', '#111111']},
    highContrast: false,
  }),
}));
jest.mock('@hooks/useLanguage', () => ({
  useLanguage: () => ({
    language: 'es',
    t: require('../src/i18n/translations').translations.es,
  }),
}));
jest.mock('@context/OfferingSheetContext', () => ({
  useOfferingSheet: () => ({open: jest.fn()}),
}));

import PrepIllustrationEditorScreen from '../app/features/prep/illustrations/[id]';
import {PremiumProvider} from '../src/context/PremiumContext';
import {ENTITLEMENT_CACHE_KEY} from '../src/lib/offering/entitlementCache';
import {getAllPrepIllustrations} from '../src/features/study/prepIllustrationsStore';
import {
  __resetBackupRestoredListenersForTests,
  emitBackupRestored,
} from '../src/lib/backup/restoreSignal';
import {translations} from '../src/i18n/translations';

const h = translations.es.prepIllustrations;

const illustration = (id: string, title: string, body = 'el cuerpo') => ({
  id,
  title,
  body,
  category: 'analogy' as const,
  createdAt: 1,
  updatedAt: 1,
});

const settle = async () => {
  for (let i = 0; i < 5; i++) await new Promise(r => setImmediate(r));
};

beforeEach(async () => {
  await AsyncStorage.clear();
  __resetBackupRestoredListenersForTests();
  await SecureStore.setItemAsync(ENTITLEMENT_CACHE_KEY, 'true');
});

function renderScreen() {
  return render(
    <PremiumProvider>
      <PrepIllustrationEditorScreen />
    </PremiumProvider>,
  );
}

it('R9-30 — a keystroke after the restore signal edits the restored text', async () => {
  await AsyncStorage.setItem(
    '@prep_illustrations',
    JSON.stringify({i1: illustration('i1', 'titulo PRE')}),
  );
  const screen = renderScreen();
  await waitFor(() =>
    expect(screen.getByDisplayValue('titulo PRE')).toBeTruthy(),
  );

  // What `importBackup` does: the file's value, then the signal.
  await AsyncStorage.setItem(
    '@prep_illustrations',
    JSON.stringify({
      i1: illustration('i1', 'titulo RESTAURADO', 'cuerpo restaurado'),
      i2: illustration('i2', 'otra ilustracion'),
    }),
  );
  await act(async () => {
    emitBackupRestored();
    await settle();
  });

  // The user types one more word into the field they see.
  const input = screen.getByPlaceholderText(h.titlePlaceholder);
  await act(async () => {
    fireEvent.changeText(input, `${input.props.value} y`);
  });
  // The debounced save fires (700 ms) while the editor stays open.
  await act(async () => {
    await new Promise(r => setTimeout(r, 900));
  });
  screen.unmount();
  await act(settle);

  const map = await getAllPrepIllustrations();
  expect({
    title: map.i1?.title,
    body: map.i1?.body,
    otra: map.i2?.title,
  }).toEqual({
    title: 'titulo RESTAURADO y',
    body: 'cuerpo restaurado',
    otra: 'otra ilustracion',
  });
});

it('R9-30 — a save still pending at the restore is dropped, not flushed over it', async () => {
  await AsyncStorage.setItem(
    '@prep_illustrations',
    JSON.stringify({i1: illustration('i1', 'titulo PRE')}),
  );
  const screen = renderScreen();
  await waitFor(() =>
    expect(screen.getByDisplayValue('titulo PRE')).toBeTruthy(),
  );
  // Typed just before the restore: the debounced save has not fired yet.
  await act(async () => {
    fireEvent.changeText(
      screen.getByPlaceholderText(h.titlePlaceholder),
      'titulo PRE tecleado',
    );
  });

  const restoredRaw = JSON.stringify({
    i1: illustration('i1', 'titulo RESTAURADO'),
  });
  await AsyncStorage.setItem('@prep_illustrations', restoredRaw);
  await act(async () => {
    emitBackupRestored();
    await settle();
  });
  screen.unmount();
  await act(settle);

  // Byte for byte what the backup wrote.
  expect(await AsyncStorage.getItem('@prep_illustrations')).toBe(restoredRaw);
});
