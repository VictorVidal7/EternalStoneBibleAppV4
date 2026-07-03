/**
 * T8.4.5 — "Mesa de preparación" premium addition: export the outline as a
 * DESIGNED PDF. This is a pure upgrade of the free Markdown export (which
 * stays byte-for-byte the same and is covered by prepTableScreen.test.tsx) —
 * a different export FORMAT of the SAME assembled content, gated behind an
 * offering. Locked for a free reader (leaf badge + "Exclusivo" pill, tap
 * opens the offering sheet, nothing is generated); once unlocked, tapping
 * renders the outline through buildPrepHtml (unit-tested on its own in
 * prepPdf.test.ts) and hands it to expo-print + expo-sharing, mocked here
 * the same way ImageShareModal's capture/share pipeline is mocked in
 * imageShareModalPremium.test.tsx.
 */
import React from 'react';
import {render, waitFor, fireEvent} from '@testing-library/react-native';
import * as SecureStore from 'expo-secure-store';
import Purchases from 'react-native-purchases';
import PrepTableScreen from '../app/features/prep/index';
import {PremiumProvider} from '../src/context/PremiumContext';
import {ENTITLEMENT_CACHE_KEY} from '../src/lib/offering/entitlementCache';
import {__resetForTests} from '../src/lib/offering/offeringService';
import {translations} from '../src/i18n/translations';

const mockPurchases = Purchases as unknown as {
  __setCustomerInfo: (info: unknown) => void;
  __reset: () => void;
};

jest.mock('expo-router', () => ({
  useRouter: () => ({push: jest.fn(), back: jest.fn()}),
  useLocalSearchParams: () => ({
    book: 'John',
    chapter: '3',
    startVerse: '16',
    version: 'RVR1960',
  }),
  Stack: {Screen: () => null},
}));

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

jest.mock('expo-clipboard', () => ({
  setStringAsync: jest.fn(async () => true),
}));

const mockPrintToFile = jest.fn(async (_options: {html: string}) => ({
  uri: 'file://mock-prep.pdf',
}));
jest.mock('expo-print', () => ({
  printToFileAsync: (...args: unknown[]) =>
    (mockPrintToFile as (...a: unknown[]) => unknown)(...args),
}));

const mockIsAvailable = jest.fn(async () => true);
const mockShareAsync = jest.fn(
  async (_uri: string, _options: {mimeType: string; dialogTitle: string}) =>
    undefined,
);
jest.mock('expo-sharing', () => ({
  isAvailableAsync: (...args: unknown[]) =>
    (mockIsAvailable as (...a: unknown[]) => unknown)(...args),
  shareAsync: (...args: unknown[]) =>
    (mockShareAsync as (...a: unknown[]) => unknown)(...args),
}));

jest.mock('@hooks/useTheme', () => ({
  useTheme: () => ({
    colors: {
      background: '#000000',
      card: '#111111',
      border: '#222222',
      primary: '#6366f1',
      primaryDark: '#4338ca',
      text: '#ffffff',
      textSecondary: '#cccccc',
      textTertiary: '#999999',
    },
  }),
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

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(async () => null),
  setItem: jest.fn(async () => undefined),
}));

const mockOpenOfferingSheet = jest.fn();
jest.mock('../src/context/OfferingSheetContext', () => ({
  useOfferingSheet: () => ({open: mockOpenOfferingSheet}),
}));

// Imported unconditionally by the screen (only actually called once
// premium); mocked here so the real expo-file-system-backed module never
// loads, same precaution as the other prep-table test files.
jest.mock('@lib/database/originals-download-service', () => ({
  downloadAndImportOriginals: jest.fn(),
  importLocalOriginalsIfPresent: jest.fn(async () => false),
}));

jest.mock('@lib/database', () => ({
  __esModule: true,
  default: {
    getVerse: jest.fn(async (_b: number, _c: number, v: number) => ({
      text: `Texto del versículo ${v}`,
    })),
    getChapterVerseCount: jest.fn(async () => 36),
  },
}));

// T8.4.3 — the screen always mounts a "Comparar versiones" section too;
// stub it here so this file (unrelated to that feature) never touches the
// real SQLite-backed service, same precaution as prepTableScreenPremium.test.tsx.
jest.mock('@lib/comparison/VersionComparison', () => ({
  versionComparisonService: {
    getAvailableVersions: jest.fn(async () => []),
    compareVerseRange: jest.fn(async () => []),
  },
}));

const p = translations.es.prepTable;
const offeringSuffix = translations.es.offering.badgeA11y;

function renderScreen() {
  return render(
    <PremiumProvider>
      <PrepTableScreen />
    </PremiumProvider>,
  );
}

describe('Mesa de preparación — T8.4.5 PDF export', () => {
  beforeEach(async () => {
    __resetForTests();
    mockPurchases.__reset();
    mockOpenOfferingSheet.mockClear();
    mockPrintToFile.mockClear();
    mockIsAvailable.mockClear();
    mockIsAvailable.mockResolvedValue(true);
    mockShareAsync.mockClear();
    await SecureStore.deleteItemAsync(ENTITLEMENT_CACHE_KEY);
  });

  it('free reader: the PDF export button is offered but locked', async () => {
    const {findByLabelText} = renderScreen();
    expect(
      await findByLabelText(`${p.exportPdfLabel} · ${offeringSuffix}`),
    ).toBeTruthy();
  });

  it('free reader: tapping the locked PDF export opens the offering sheet and generates nothing', async () => {
    const {findByLabelText} = renderScreen();
    fireEvent.press(
      await findByLabelText(`${p.exportPdfLabel} · ${offeringSuffix}`),
    );
    expect(mockOpenOfferingSheet).toHaveBeenCalledTimes(1);
    expect(mockPrintToFile).not.toHaveBeenCalled();
    expect(mockShareAsync).not.toHaveBeenCalled();
  });

  it('premium reader: the PDF export button is unlocked (no offering suffix)', async () => {
    await SecureStore.setItemAsync(ENTITLEMENT_CACHE_KEY, 'true');
    const {findByLabelText} = renderScreen();
    expect(await findByLabelText(p.exportPdfLabel)).toBeTruthy();
  });

  it('premium reader: tapping generates the PDF and shares it, without ever opening the offering sheet', async () => {
    await SecureStore.setItemAsync(ENTITLEMENT_CACHE_KEY, 'true');
    const {findByLabelText} = renderScreen();

    fireEvent.press(await findByLabelText(p.exportPdfLabel));

    await waitFor(() => expect(mockPrintToFile).toHaveBeenCalledTimes(1));
    const call = mockPrintToFile.mock.calls[0][0];
    // The SAME assembled outline that feeds the free Markdown export shows
    // up in the HTML handed to expo-print (passage label + a gathered
    // cross-reference), rendered by buildPrepHtml.
    expect(call.html).toContain('Juan 3:16');
    expect(call.html).toContain('<!DOCTYPE html>');

    await waitFor(() => expect(mockShareAsync).toHaveBeenCalledTimes(1));
    const [uri, options] = mockShareAsync.mock.calls[0];
    expect(uri).toBe('file://mock-prep.pdf');
    expect(options.mimeType).toBe('application/pdf');
    expect(options.dialogTitle).toBe(p.exportPdfDialogTitle);

    expect(mockOpenOfferingSheet).not.toHaveBeenCalled();
  });

  it('premium reader: does not crash and skips sharing when the share sheet is unavailable', async () => {
    mockIsAvailable.mockResolvedValueOnce(false);
    await SecureStore.setItemAsync(ENTITLEMENT_CACHE_KEY, 'true');
    const {findByLabelText} = renderScreen();

    fireEvent.press(await findByLabelText(p.exportPdfLabel));

    await waitFor(() => expect(mockPrintToFile).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(mockIsAvailable).toHaveBeenCalledTimes(1));
    expect(mockShareAsync).not.toHaveBeenCalled();
  });
});
