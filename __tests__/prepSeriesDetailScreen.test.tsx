/**
 * T8.4.4 — "Series de predicación" detail screen.
 *
 * Covers the premium gate, the not-found state, adding a passage by typing
 * a free-text reference (valid, invalid, duplicate), each passage's own
 * started/not-started status (read from the SAME prep notes the
 * single-passage Mesa de preparación already saves), removing a passage,
 * reordering, renaming and deleting the series, and navigating to the
 * single-passage prep table on row tap — the same passageKey parsing
 * history.tsx (T8.4.1) already uses.
 *
 * Uses the REAL PremiumProvider + REAL prepSeries/prepNotes stores (seeded
 * through AsyncStorage's global jest mock), mirroring
 * prepSeriesListScreen.test.tsx / prepHistoryScreen.test.tsx.
 */
import {render, fireEvent, waitFor} from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import PrepSeriesDetailScreen from '../app/features/prep/series/[id]';
import {PremiumProvider} from '../src/context/PremiumContext';
import {ENTITLEMENT_CACHE_KEY} from '../src/lib/offering/entitlementCache';
import {getPrepSeries} from '../src/features/study/prepSeriesStore';
import {
  serializePrepSeriesMap,
  type PrepSeries,
  type PrepSeriesMap,
} from '../src/features/study/prepSeries';
import {serializePrepNotesMap} from '../src/features/study/prepNotes';
import type {PrepNotesMap} from '../src/features/study/prepNotes';
import {translations} from '../src/i18n/translations';

const PREP_SERIES_KEY = '@prep_series';
const PREP_NOTES_KEY = '@prep_notes';
const SERIES_ID = 'series_1';

// RN's own TouchableOpacity drives its press/disabled feedback through an
// internal Animated.Value. Swapping it for Pressable (no internal Animated
// opacity) for this suite keeps press/style/accessibility behavior. It was
// added because pressing through a modal threw "Unable to locate attached
// view in the native tree", blamed on react-test-renderer; that throw
// depends on NODE_ENV instead (RN only tolerates the missing native view
// under 'test', which jest.config.js now pins). Measured in S24: without the
// swap, all 18 cases pass under 'test' and 5 throw under 'development'. The
// swap stays as a second layer.
jest.mock(
  'react-native/Libraries/Components/Touchable/TouchableOpacity',
  () => {
    const ReactActual = require('react');
    const {Pressable} = jest.requireActual('react-native');
    const MockTouchableOpacity = ReactActual.forwardRef(
      ({children, ...props}: Record<string, unknown>, ref: unknown) =>
        ReactActual.createElement(Pressable, {...props, ref}, children),
    );
    return {__esModule: true, default: MockTouchableOpacity};
  },
);

const mockPush = jest.fn();
const mockBack = jest.fn();

jest.mock('expo-router', () => {
  const ReactActual = require('react');
  return {
    useRouter: () => ({push: mockPush, back: mockBack}),
    useLocalSearchParams: () => ({id: 'series_1'}),
    // A dependency-aware stand-in for the real useFocusEffect: reruns only
    // when the callback identity changes (mirrors real focus/dep behavior)
    // rather than on every render — a naive `cb()`-per-render mock would
    // re-fire `load()` on every keystroke in the "add passage" input and
    // race itself.
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

const mockToast = {
  success: jest.fn(),
  error: jest.fn(),
  warning: jest.fn(),
  info: jest.fn(),
  show: jest.fn(),
};
jest.mock('@context/ToastContext', () => ({
  useToast: () => mockToast,
}));

const mockPrintToFile = jest
  .fn()
  .mockResolvedValue({uri: 'file:///series.pdf'});
jest.mock('expo-print', () => ({
  printToFileAsync: (...args: unknown[]) => mockPrintToFile(...args),
}));

const mockShareAsync = jest.fn().mockResolvedValue(undefined);
const mockIsAvailable = jest.fn().mockResolvedValue(true);
jest.mock('expo-sharing', () => ({
  isAvailableAsync: () => mockIsAvailable(),
  shareAsync: (...args: unknown[]) => mockShareAsync(...args),
}));

// The whole-series export assembler reads verse text through bibleDB; a light
// fake keeps the export deterministic and off the real SQLite layer.
jest.mock('@lib/database', () => ({
  __esModule: true,
  default: {
    getVerse: jest.fn().mockResolvedValue({text: 'Texto del versículo'}),
    getChapterVerseCount: jest.fn().mockResolvedValue(0),
  },
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
  useTheme: () => ({colors: mockColors, isDark: false}),
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

const h = translations.es.prepSeries;
const t = translations.es;

function renderScreen() {
  return render(
    <PremiumProvider>
      <PrepSeriesDetailScreen />
    </PremiumProvider>,
  );
}

function series(overrides: Partial<PrepSeries> = {}): PrepSeries {
  return {
    id: SERIES_ID,
    name: 'Efesios',
    passageKeys: [],
    createdAt: 1,
    updatedAt: 1,
    ...overrides,
  };
}

async function seedSeries(map: PrepSeriesMap) {
  await AsyncStorage.setItem(PREP_SERIES_KEY, serializePrepSeriesMap(map));
}

async function seedNotes(map: PrepNotesMap) {
  await AsyncStorage.setItem(PREP_NOTES_KEY, serializePrepNotesMap(map));
}

async function unlockPremium() {
  await SecureStore.setItemAsync(ENTITLEMENT_CACHE_KEY, 'true');
}

describe('PrepSeriesDetailScreen — T8.4.4', () => {
  beforeEach(async () => {
    mockPush.mockClear();
    mockBack.mockClear();
    mockOpenOfferingSheet.mockClear();
    mockPrintToFile.mockClear();
    mockShareAsync.mockClear();
    mockIsAvailable.mockClear();
    mockToast.error.mockClear();
    await AsyncStorage.removeItem(PREP_SERIES_KEY);
    await AsyncStorage.removeItem(PREP_NOTES_KEY);
    await SecureStore.deleteItemAsync(ENTITLEMENT_CACHE_KEY);
  });

  it('shows a locked teaser for a free reader', async () => {
    const {findByText} = renderScreen();
    expect(await findByText(h.lockedTitle)).toBeTruthy();
  });

  it('shows a not-found state for an unknown series id', async () => {
    await unlockPremium();
    const {findByText} = renderScreen();
    expect(await findByText(h.notFound)).toBeTruthy();
  });

  it("shows the series name, progress, and each passage's own status", async () => {
    await unlockPremium();
    await seedSeries({
      [SERIES_ID]: series({passageKeys: ['John/1/1', 'John/3/16']}),
    });
    await seedNotes({
      'John/1/1': {sections: {context: 'En el principio'}, updatedAt: 1},
    });

    const {findByText} = renderScreen();
    expect(await findByText('Efesios')).toBeTruthy();
    expect(
      await findByText(
        h.progress.replace('{{started}}', '1').replace('{{total}}', '2'),
      ),
    ).toBeTruthy();
    expect(await findByText('Juan 1:1')).toBeTruthy();
    expect(await findByText('Juan 3:16')).toBeTruthy();
    expect(await findByText(h.passageStarted)).toBeTruthy();
    expect(await findByText(h.passageNotStarted)).toBeTruthy();
  });

  it('shows the empty-passages state for a series with none yet', async () => {
    await unlockPremium();
    await seedSeries({[SERIES_ID]: series()});
    const {findByText} = renderScreen();
    expect(await findByText(h.emptyPassagesTitle)).toBeTruthy();
  });

  it('adds a passage by typing a valid free-text reference', async () => {
    await unlockPremium();
    await seedSeries({[SERIES_ID]: series()});
    const {findByPlaceholderText, findByLabelText, findByText} = renderScreen();
    // Settle on the loaded empty-passages state first — interacting before
    // the premium-flip + initial load fully settle can hit a transitional
    // render.
    await findByText(h.emptyPassagesTitle);
    const input = await findByPlaceholderText(h.addPassagePlaceholder);
    fireEvent.changeText(input, 'Juan 3:16-21');
    fireEvent.press(await findByLabelText(h.addPassage));

    expect(await findByText('Juan 3:16-21')).toBeTruthy();
    const updated = await getPrepSeries(SERIES_ID);
    expect(updated?.passageKeys).toEqual(['John/3/16-21']);
  });

  it('shows an inline error for an unrecognized reference', async () => {
    await unlockPremium();
    await seedSeries({[SERIES_ID]: series()});
    const {findByPlaceholderText, findByLabelText, findByText} = renderScreen();
    await findByText(h.emptyPassagesTitle);
    const input = await findByPlaceholderText(h.addPassagePlaceholder);
    fireEvent.changeText(input, 'not a reference');
    fireEvent.press(await findByLabelText(h.addPassage));

    expect(await findByText(h.addPassageInvalid)).toBeTruthy();
  });

  it('shows an inline error when adding a passage already in the series', async () => {
    await unlockPremium();
    await seedSeries({[SERIES_ID]: series({passageKeys: ['John/3/16']})});
    const {findByPlaceholderText, findByLabelText, findByText} = renderScreen();
    await findByText('Juan 3:16');
    const input = await findByPlaceholderText(h.addPassagePlaceholder);
    fireEvent.changeText(input, 'Juan 3:16');
    fireEvent.press(await findByLabelText(h.addPassage));

    expect(await findByText(h.addPassageDuplicate)).toBeTruthy();
  });

  it('removes a passage from the series', async () => {
    await unlockPremium();
    await seedSeries({
      [SERIES_ID]: series({passageKeys: ['John/1/1', 'John/3/16']}),
    });
    const {findAllByLabelText, findByText, queryByText} = renderScreen();
    await findByText('Juan 1:1');
    const removeButtons = await findAllByLabelText(h.removePassage);
    fireEvent.press(removeButtons[0]);

    await waitFor(() => expect(queryByText('Juan 1:1')).toBeNull());
    expect(await findByText('Juan 3:16')).toBeTruthy();
    const updated = await getPrepSeries(SERIES_ID);
    expect(updated?.passageKeys).toEqual(['John/3/16']);
  });

  it('reorders a passage down via the move-down button', async () => {
    await unlockPremium();
    await seedSeries({
      [SERIES_ID]: series({passageKeys: ['John/1/1', 'John/3/16']}),
    });
    const {findAllByLabelText, findByText} = renderScreen();
    await findByText('Juan 1:1');
    const downButtons = await findAllByLabelText(h.moveDown);
    fireEvent.press(downButtons[0]);

    await waitFor(async () => {
      const updated = await getPrepSeries(SERIES_ID);
      expect(updated?.passageKeys).toEqual(['John/3/16', 'John/1/1']);
    });
  });

  it('renames the series', async () => {
    await unlockPremium();
    await seedSeries({[SERIES_ID]: series()});
    const {findByLabelText, findByPlaceholderText, findByText} = renderScreen();
    await findByText('Efesios');
    fireEvent.press(await findByLabelText(h.renameLabel));
    const input = await findByPlaceholderText(h.namePlaceholder);
    fireEvent.changeText(input, 'Efesios — otoño');
    fireEvent.press(await findByText(t.save));

    expect(await findByText('Efesios — otoño')).toBeTruthy();
    const updated = await getPrepSeries(SERIES_ID);
    expect(updated?.name).toBe('Efesios — otoño');
  });

  it('sets and clears the sermon type via the type chips', async () => {
    await unlockPremium();
    await seedSeries({[SERIES_ID]: series()});
    const {findByLabelText} = renderScreen();
    fireEvent.press(
      await findByLabelText(
        `${h.sermonTypeLabel}: ${h.sermonTypes.expositiva}`,
      ),
    );
    await waitFor(async () => {
      expect((await getPrepSeries(SERIES_ID))?.sermonType).toBe('expositiva');
    });

    fireEvent.press(
      await findByLabelText(`${h.sermonTypeLabel}: ${h.sermonTypeNone}`),
    );
    await waitFor(async () => {
      expect((await getPrepSeries(SERIES_ID))?.sermonType).toBeUndefined();
    });
  });

  it('deletes the series via the confirm dialog and goes back', async () => {
    await unlockPremium();
    await seedSeries({[SERIES_ID]: series()});
    const {findByLabelText, findByText} = renderScreen();
    await findByText('Efesios');
    fireEvent.press(await findByLabelText(h.deleteLabel));
    expect(await findByText(h.deleteConfirmTitle)).toBeTruthy();
    fireEvent.press(await findByText(t.delete));

    await waitFor(() => expect(mockBack).toHaveBeenCalledTimes(1));
    const updated = await getPrepSeries(SERIES_ID);
    expect(updated).toBeNull();
  });

  it('navigates to the Mesa de preparación with the parsed passage on row tap', async () => {
    await unlockPremium();
    await seedSeries({
      [SERIES_ID]: series({passageKeys: ['Romans/8/28-30']}),
    });
    const {findByText} = renderScreen();
    fireEvent.press(await findByText('Romanos 8:28-30'));

    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/features/prep',
      params: {
        book: 'Romans',
        chapter: '8',
        startVerse: '28',
        endVerse: '30',
      },
    });
  });

  it('sets a passage date via a quick chip', async () => {
    await unlockPremium();
    await seedSeries({[SERIES_ID]: series({passageKeys: ['John/3/16']})});
    const {findByText, findByLabelText} = renderScreen();
    await findByText('Juan 3:16');
    // The date pill reads "Sin fecha" until a date is set.
    fireEvent.press(await findByLabelText(h.noDate));
    fireEvent.press(await findByText(h.dateThisSunday));

    await waitFor(async () => {
      const updated = await getPrepSeries(SERIES_ID);
      expect(updated?.schedule?.['John/3/16']?.date).toMatch(
        /^\d{4}-\d{2}-\d{2}$/,
      );
    });
  });

  it('clears a passage date', async () => {
    await unlockPremium();
    await seedSeries({
      [SERIES_ID]: series({
        passageKeys: ['John/3/16'],
        schedule: {'John/3/16': {date: '2026-07-12'}},
      }),
    });
    const {findByText, findByLabelText} = renderScreen();
    await findByText('Juan 3:16');
    fireEvent.press(await findByLabelText(`${h.dateModalTitle}: 12 jul 2026`));
    fireEvent.press(await findByText(h.clearDate));

    await waitFor(async () => {
      const updated = await getPrepSeries(SERIES_ID);
      expect(updated?.schedule?.['John/3/16']).toBeUndefined();
    });
  });

  it('exports the whole series to a PDF and shares it', async () => {
    await unlockPremium();
    await seedSeries({
      [SERIES_ID]: series({passageKeys: ['John/3/16', 'Romans/8/28']}),
    });
    const {findByText, findByLabelText} = renderScreen();
    await findByText('Juan 3:16');
    fireEvent.press(await findByLabelText(h.exportSeries));

    await waitFor(() => expect(mockPrintToFile).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(mockShareAsync).toHaveBeenCalledTimes(1));
  });

  // The bug this fixes (web-specific, not exercised on this default 'ios'
  // test platform — see exportPrepPdf.test.ts for the web path itself): a
  // failed export used to fail SILENTLY (just a console.warn). Now it
  // surfaces an honest error toast via exportPrepPdf.ts.
  it('shows an error toast (no longer silently swallowed) when the series PDF generation throws', async () => {
    mockPrintToFile.mockRejectedValueOnce(new Error('boom'));
    await unlockPremium();
    await seedSeries({
      [SERIES_ID]: series({passageKeys: ['John/3/16', 'Romans/8/28']}),
    });
    const {findByText, findByLabelText} = renderScreen();
    await findByText('Juan 3:16');
    fireEvent.press(await findByLabelText(h.exportSeries));

    await waitFor(() => expect(mockToast.error).toHaveBeenCalledTimes(1));
    expect(mockToast.error).toHaveBeenCalledWith(h.exportError);
    expect(mockShareAsync).not.toHaveBeenCalled();
  });

  it('hides the reorder controls in the "by date" view', async () => {
    await unlockPremium();
    await seedSeries({
      [SERIES_ID]: series({passageKeys: ['John/1/1', 'John/3/16']}),
    });
    const {findByText, findByLabelText, queryAllByLabelText} = renderScreen();
    await findByText('Juan 1:1');
    expect(queryAllByLabelText(h.moveDown).length).toBeGreaterThan(0);

    fireEvent.press(await findByLabelText(h.viewByDate));
    await waitFor(() => expect(queryAllByLabelText(h.moveDown).length).toBe(0));
  });

  // R9-52, the bank (S162) — the real store, with `setItem` rejecting only
  // for `@prep_series`. Every write here used to be swallowed by the store:
  // the screen cleared the draft, closed the sheet, or went back as if done.
  describe('a failed write of the bank', () => {
    const setItem = AsyncStorage.setItem as jest.Mock;
    const real = setItem.getMockImplementation()!;
    const saveError = t.prepTable.saveError;
    let failed = 0;
    beforeEach(() => {
      failed = 0;
    });
    afterEach(() => {
      setItem.mockImplementation(real);
    });
    function failBankWrites() {
      setItem.mockImplementation((key: string, value: string) => {
        if (key === PREP_SERIES_KEY) {
          failed += 1;
          return Promise.reject(new Error('disco lleno'));
        }
        return real(key, value);
      });
    }

    it('adding a passage shows an error and keeps the typed reference', async () => {
      await unlockPremium();
      await seedSeries({[SERIES_ID]: series()});
      const {findByPlaceholderText, findByLabelText, findByText} =
        renderScreen();
      await findByText(h.emptyPassagesTitle);
      const input = await findByPlaceholderText(h.addPassagePlaceholder);
      fireEvent.changeText(input, 'Juan 3:16-21');
      failBankWrites();
      fireEvent.press(await findByLabelText(h.addPassage));

      await waitFor(() => expect(mockToast.error).toHaveBeenCalledTimes(1));
      expect(mockToast.error).toHaveBeenCalledWith(saveError);
      expect(failed).toBe(1);
      expect(input.props.value).toBe('Juan 3:16-21');
      expect((await getPrepSeries(SERIES_ID))?.passageKeys).toEqual([]);
    });

    it('renaming shows an error and keeps the sheet open with the name', async () => {
      await unlockPremium();
      await seedSeries({[SERIES_ID]: series()});
      const {findByLabelText, findByPlaceholderText, findByText} =
        renderScreen();
      await findByText('Efesios');
      fireEvent.press(await findByLabelText(h.renameLabel));
      const input = await findByPlaceholderText(h.namePlaceholder);
      fireEvent.changeText(input, 'Efesios — otoño');
      failBankWrites();
      fireEvent.press(await findByText(t.save));

      await waitFor(() => expect(mockToast.error).toHaveBeenCalledTimes(1));
      expect(mockToast.error).toHaveBeenCalledWith(saveError);
      expect(failed).toBe(1);
      expect((await findByPlaceholderText(h.namePlaceholder)).props.value).toBe(
        'Efesios — otoño',
      );
      expect((await getPrepSeries(SERIES_ID))?.name).toBe('Efesios');
    });

    it('deleting shows an error and does not go back', async () => {
      await unlockPremium();
      await seedSeries({[SERIES_ID]: series()});
      const {findByLabelText, findByText} = renderScreen();
      await findByText('Efesios');
      fireEvent.press(await findByLabelText(h.deleteLabel));
      failBankWrites();
      fireEvent.press(await findByText(t.delete));

      await waitFor(() => expect(mockToast.error).toHaveBeenCalledTimes(1));
      expect(mockToast.error).toHaveBeenCalledWith(saveError);
      expect(failed).toBe(1);
      expect(mockBack).not.toHaveBeenCalled();
      expect(await getPrepSeries(SERIES_ID)).not.toBeNull();
    });

    it('removing, moving, the sermon type and a date each report it', async () => {
      await unlockPremium();
      await seedSeries({
        [SERIES_ID]: series({passageKeys: ['John/1/1', 'John/3/16']}),
      });
      const {findAllByLabelText, findByLabelText, findByText} = renderScreen();
      await findByText('Juan 1:1');
      failBankWrites();

      fireEvent.press((await findAllByLabelText(h.removePassage))[0]);
      await waitFor(() => expect(mockToast.error).toHaveBeenCalledTimes(1));
      fireEvent.press((await findAllByLabelText(h.moveDown))[0]);
      await waitFor(() => expect(mockToast.error).toHaveBeenCalledTimes(2));
      fireEvent.press(
        await findByLabelText(
          `${h.sermonTypeLabel}: ${h.sermonTypes.expositiva}`,
        ),
      );
      await waitFor(() => expect(mockToast.error).toHaveBeenCalledTimes(3));
      fireEvent.press((await findAllByLabelText(h.noDate))[0]);
      fireEvent.press(await findByText(h.dateThisSunday));
      await waitFor(() => expect(mockToast.error).toHaveBeenCalledTimes(4));

      expect(failed).toBe(4);
      for (const call of mockToast.error.mock.calls) {
        expect(call).toEqual([saveError]);
      }
      // The date sheet stays open, to try again.
      expect(await findByText(h.dateThisSunday)).toBeTruthy();
      expect(await getPrepSeries(SERIES_ID)).toMatchObject({
        passageKeys: ['John/1/1', 'John/3/16'],
      });
      expect((await getPrepSeries(SERIES_ID))?.sermonType).toBeUndefined();
      expect((await getPrepSeries(SERIES_ID))?.schedule).toBeUndefined();
    });
  });
});
