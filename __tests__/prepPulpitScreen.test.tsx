/**
 * Modo púlpito — presenter screen. Covers the premium gate, the empty state
 * (a valid passage with no notes yet), the ready state (passage text + only
 * the non-empty outline sections), and the keep-awake activate/release around
 * presenting. Uses the REAL PremiumProvider + REAL prepNotes store (seeded via
 * AsyncStorage's global jest mock), mirroring prepSeriesDetailScreen.test.tsx.
 */
import React from 'react';
import {render, waitFor} from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import PulpitModeScreen from '../app/features/prep/pulpit';
import {PremiumProvider} from '../src/context/PremiumContext';
import {ENTITLEMENT_CACHE_KEY} from '../src/lib/offering/entitlementCache';
import {serializePrepNotesMap} from '../src/features/study/prepNotes';
import type {PrepNotesMap} from '../src/features/study/prepNotes';
import {translations} from '../src/i18n/translations';

const PREP_NOTES_KEY = '@prep_notes';

jest.mock(
  'react-native/Libraries/Components/Touchable/TouchableOpacity',
  () => {
    const ReactActual = require('react');
    const {Pressable} = jest.requireActual('react-native');
    return {
      __esModule: true,
      default: ReactActual.forwardRef(
        ({children, ...props}: Record<string, unknown>, ref: unknown) =>
          ReactActual.createElement(Pressable, {...props, ref}, children),
      ),
    };
  },
);

const mockBack = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({back: mockBack, push: jest.fn()}),
  useLocalSearchParams: () => ({
    book: 'John',
    chapter: '3',
    startVerse: '16',
    endVerse: '21',
    version: 'RVR1960',
  }),
  Stack: {Screen: () => null},
}));

jest.mock('@expo/vector-icons', () => ({Ionicons: () => null}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({top: 0, bottom: 0, left: 0, right: 0}),
}));

const mockActivateKeepAwake = jest.fn().mockResolvedValue(undefined);
const mockDeactivateKeepAwake = jest.fn().mockResolvedValue(undefined);
jest.mock('expo-keep-awake', () => ({
  activateKeepAwakeAsync: (...args: unknown[]) =>
    mockActivateKeepAwake(...args),
  deactivateKeepAwake: (...args: unknown[]) => mockDeactivateKeepAwake(...args),
}));

jest.mock('@lib/database', () => ({
  __esModule: true,
  default: {
    getVerse: jest.fn().mockResolvedValue({text: 'Texto del versículo'}),
  },
}));

jest.mock('@lib/haptics', () => ({
  haptics: {tap: jest.fn(), success: jest.fn()},
}));

const mockColors = {
  background: '#000000',
  card: '#111111',
  border: '#222222',
  primary: '#6366f1',
  primaryDark: '#4338ca',
  text: '#ffffff',
  textSecondary: '#cccccc',
  textTertiary: '#999999',
  surface: '#111111',
  overlay: 'rgba(0,0,0,0.5)',
  error: '#ff0000',
};
jest.mock('@hooks/useTheme', () => ({
  useTheme: () => ({colors: mockColors, isDark: true}),
}));
jest.mock('@hooks/useLanguage', () => ({
  useLanguage: () => ({
    language: 'es',
    t: require('../src/i18n/translations').translations.es,
  }),
}));
jest.mock('@hooks/useBibleVersion', () => ({
  useBibleVersion: () => ({
    selectedVersion: {id: 'RVR1960', language: 'es', abbreviation: 'RVR1960'},
  }),
}));

const mockOpenOfferingSheet = jest.fn();
jest.mock('@context/OfferingSheetContext', () => ({
  useOfferingSheet: () => ({open: mockOpenOfferingSheet}),
}));

const p = translations.es.prepTable;
const h = translations.es.prepPulpit;

function renderScreen() {
  return render(
    <PremiumProvider>
      <PulpitModeScreen />
    </PremiumProvider>,
  );
}

async function seedNotes(map: PrepNotesMap) {
  await AsyncStorage.setItem(PREP_NOTES_KEY, serializePrepNotesMap(map));
}

async function unlockPremium() {
  await SecureStore.setItemAsync(ENTITLEMENT_CACHE_KEY, 'true');
}

describe('PulpitModeScreen', () => {
  beforeEach(async () => {
    mockBack.mockClear();
    mockOpenOfferingSheet.mockClear();
    mockActivateKeepAwake.mockClear();
    mockDeactivateKeepAwake.mockClear();
    await AsyncStorage.removeItem(PREP_NOTES_KEY);
    await SecureStore.deleteItemAsync(ENTITLEMENT_CACHE_KEY);
  });

  it('shows a locked teaser for a free reader', async () => {
    const {findByText} = renderScreen();
    expect(await findByText(h.lockedTitle)).toBeTruthy();
  });

  it('shows the empty state for a passage with no notes yet', async () => {
    await unlockPremium();
    const {findByText} = renderScreen();
    expect(await findByText(h.emptyTitle)).toBeTruthy();
  });

  it('renders the passage text and only the non-empty sections', async () => {
    await unlockPremium();
    await seedNotes({
      'John/3/16-21': {
        sections: {bigIdea: 'El amor de Dios da vida.', context: '   '},
        updatedAt: 1,
      },
    });
    const {findByText, queryByText, findAllByText} = renderScreen();

    // Passage text (from the mocked getVerse) is shown. Each verse renders the
    // number and text in one Text node, so match on a substring regex.
    expect((await findAllByText(/Texto del versículo/)).length).toBeGreaterThan(
      0,
    );
    // The filled bigIdea section renders (label + prose)...
    expect(await findByText(p.sections.bigIdea.label)).toBeTruthy();
    expect(await findByText('El amor de Dios da vida.')).toBeTruthy();
    // ...but the whitespace-only "Contexto" section does NOT.
    expect(queryByText(p.sections.context.label)).toBeNull();
    // Nor an untouched section like "Aplicación".
    expect(queryByText(p.sections.application.label)).toBeNull();
  });

  it('keeps the screen awake while presenting and releases it on exit', async () => {
    await unlockPremium();
    await seedNotes({
      'John/3/16-21': {sections: {bigIdea: 'Idea.'}, updatedAt: 1},
    });
    const {findByText, unmount} = renderScreen();
    await findByText('Idea.');

    await waitFor(() =>
      expect(mockActivateKeepAwake).toHaveBeenCalledWith(
        'essb-pulpit-presenting',
      ),
    );

    unmount();
    expect(mockDeactivateKeepAwake).toHaveBeenCalledWith(
      'essb-pulpit-presenting',
    );
  });
});
