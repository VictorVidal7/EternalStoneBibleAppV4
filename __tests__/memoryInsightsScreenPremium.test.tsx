/**
 * T8.1 — Estadísticas ampliadas de memorización (retención por libro,
 * tendencia mensual, historial completo del mapa de calor, tarjeta
 * compartible). Scoped to these NEW premium sections on the Memory
 * Insights screen — its pre-existing free sections (mastery, distribution,
 * forecast, struggling, base heatmap, retention-by-interval, calibration,
 * leeches) are untouched by this tanda.
 *
 * `useMemoryGoal`/`useMemoryDeck` are mocked with fixed fixtures (built via
 * the REAL pure `computeReviewHistory`/`computeGoalProgress`, not hand-typed
 * shapes) instead of exercising the SQLite/AsyncStorage-backed hook chain.
 */

import React from 'react';
import {render, waitFor, fireEvent} from '@testing-library/react-native';
import * as SecureStore from 'expo-secure-store';
import Purchases from 'react-native-purchases';
import MemoryInsightsScreen from '../app/features/memory/insights';
import {PremiumProvider} from '../src/context/PremiumContext';
import {ENTITLEMENT_CACHE_KEY} from '../src/lib/offering/entitlementCache';
import {
  ENTITLEMENT_ID,
  initialize,
  __resetForTests,
  __setApiKeyForTests,
} from '../src/lib/offering/offeringService';
import {computeReviewHistory} from '../src/lib/memory/history';
import {computeGoalProgress, DEFAULT_DAILY_GOAL} from '../src/lib/memory/goals';
import {DEFAULT_EASE, type MemoryCard} from '../src/lib/memory/srs';
import type {ReviewEvent} from '../src/lib/memory/reviewEvents';

const mockPurchases = Purchases as unknown as {
  __setCustomerInfo: (info: unknown) => void;
  __reset: () => void;
};

const activeEntitlementInfo = {
  entitlements: {
    active: {[ENTITLEMENT_ID]: {identifier: ENTITLEMENT_ID}},
    all: {},
  },
};
const noEntitlementInfo = {entitlements: {active: {}, all: {}}};

const NOW = new Date(2026, 6, 1, 12, 0, 0, 0);

function mkEvent(
  over: Partial<ReviewEvent> & {reviewedAt: number},
): ReviewEvent {
  return {
    id: over.id ?? `${over.verseKey ?? 'Juan/3/16'}__${over.reviewedAt}`,
    verseKey: over.verseKey ?? 'Juan/3/16',
    bookName: over.bookName ?? 'Juan',
    grade: over.grade ?? 'good',
    boxBefore: over.boxBefore ?? 1,
    boxAfter: over.boxAfter ?? 2,
    intervalDays: over.intervalDays === undefined ? 2 : over.intervalDays,
    reviewedAt: over.reviewedAt,
  };
}

// Two books' worth of retention-eligible reviews so `retentionByBook` and
// `retentionTrend` have real, non-empty output to assert against.
const mockEvents: ReviewEvent[] = [
  mkEvent({
    verseKey: 'Juan/3/16',
    bookName: 'Juan',
    reviewedAt: NOW.getTime() - 1000,
    grade: 'good',
  }),
  mkEvent({
    verseKey: 'Juan/3/16',
    bookName: 'Juan',
    reviewedAt: NOW.getTime() - 2000,
    grade: 'again',
  }),
  mkEvent({
    verseKey: 'Salmos/23/1',
    bookName: 'Salmos',
    reviewedAt: NOW.getTime() - 3000,
    grade: 'good',
  }),
];

const mockCard: MemoryCard = {
  verseKey: 'Juan/3/16',
  bookName: 'Juan',
  chapter: 3,
  verse: 16,
  text: 'Porque de tal manera amó Dios al mundo...',
  version: 'RVR1960',
  box: 3,
  dueAt: NOW.toISOString(),
  addedAt: NOW.toISOString(),
  lastReviewedAt: NOW.toISOString(),
  reviewCount: 2,
  ease: DEFAULT_EASE,
  updatedAt: NOW.getTime(),
};

const mockHistory = computeReviewHistory(mockEvents, NOW);
const mockGoal = computeGoalProgress(mockHistory.summary, DEFAULT_DAILY_GOAL);

jest.mock('../src/context/MemoryDeckContext', () => ({
  useMemoryDeck: () => ({cards: [mockCard]}),
}));

jest.mock('../src/hooks/useMemoryGoal', () => ({
  useMemoryGoal: () => ({
    loaded: true,
    events: mockEvents,
    history: mockHistory,
    goal: mockGoal,
    milestone: null,
    setGoal: jest.fn(),
    dismissMilestone: jest.fn(),
  }),
}));

jest.mock('expo-router', () => ({
  useRouter: () => ({push: jest.fn(), back: jest.fn()}),
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

jest.mock('react-native-view-shot', () => ({
  captureRef: jest.fn(async () => 'file://mock.png'),
}));

jest.mock('expo-sharing', () => ({
  isAvailableAsync: jest.fn(async () => true),
  shareAsync: jest.fn(async () => undefined),
}));

// Pre-existing component, unrelated to T8.1: its mount effect starts a
// native Animated timing that this jest environment can't attach to a real
// view ("Unable to locate attached view in the native tree"). Not what this
// suite is testing — stub it out to a plain View.
jest.mock('../src/components/SVGCircularProgress', () => {
  const RN = require('react-native');
  const R = require('react');
  return {
    __esModule: true,
    default: () => R.createElement(RN.View),
  };
});

jest.mock('../src/lib/haptics', () => ({
  haptics: {tap: jest.fn(), press: jest.fn()},
}));

const mockColors = {
  background: '#ffffff',
  surface: '#f8fafc',
  card: '#ffffff',
  text: '#0f172a',
  textSecondary: '#475569',
  textTertiary: '#94a3b8',
  primary: '#1d4ed8',
  border: '#cbd5e1',
  success: '#16a34a',
  warning: '#d97706',
};

jest.mock('../src/hooks/useTheme', () => ({
  useTheme: () => ({colors: mockColors, gradient: null}),
}));

jest.mock('../src/hooks/useLanguage', () => ({
  useLanguage: () => ({
    language: 'es',
    t: require('../src/i18n/translations').translations.es,
  }),
}));

const mockOpenOfferingSheet = jest.fn();
jest.mock('../src/context/OfferingSheetContext', () => ({
  useOfferingSheet: () => ({open: mockOpenOfferingSheet}),
}));

// MemoryShareCardModal (only mounted once isPremium) calls useToast() for
// its share success/error feedback — not what this suite is testing.
jest.mock('../src/context/ToastContext', () => ({
  useToast: () => ({
    show: jest.fn(),
    success: jest.fn(),
    error: jest.fn(),
    warning: jest.fn(),
    info: jest.fn(),
  }),
}));

function renderScreen() {
  return render(
    <PremiumProvider>
      <MemoryInsightsScreen />
    </PremiumProvider>,
  );
}

describe('MemoryInsightsScreen — T8.1 premium sections', () => {
  beforeEach(async () => {
    __resetForTests();
    mockPurchases.__reset();
    mockOpenOfferingSheet.mockClear();
    await SecureStore.deleteItemAsync(ENTITLEMENT_CACHE_KEY);
  });

  it('shows locked teasers for the by-book and trend sections for a free user', async () => {
    const {findAllByText} = renderScreen();
    const teasers = await findAllByText('Se desbloquea con una ofrenda');
    // By-book, trend, full-history toggle, and the share button all lock.
    expect(teasers.length).toBeGreaterThanOrEqual(2);
  });

  it('does not show the real per-book breakdown for a free user', async () => {
    const {findByText, queryByText} = renderScreen();
    await findByText('Retención por libro');
    // "Juan" would appear as a book row label if unlocked.
    expect(queryByText('Juan')).toBeNull();
  });

  it('opens the offering sheet when tapping the locked by-book teaser', async () => {
    const {findByLabelText} = renderScreen();
    fireEvent.press(
      await findByLabelText(
        'Retención por libro — Extra — se desbloquea con una ofrenda',
      ),
    );
    expect(mockOpenOfferingSheet).toHaveBeenCalledTimes(1);
  });

  it('opens the offering sheet when tapping the locked share-progress button', async () => {
    const {findByLabelText} = renderScreen();
    fireEvent.press(
      await findByLabelText(
        'Compartir mi progreso — Extra — se desbloquea con una ofrenda',
      ),
    );
    expect(mockOpenOfferingSheet).toHaveBeenCalledTimes(1);
  });

  it('shows the real per-book breakdown and trend once unlocked', async () => {
    await SecureStore.setItemAsync(ENTITLEMENT_CACHE_KEY, 'true');
    const {findByText} = renderScreen();
    expect(await findByText('Retención por libro')).toBeTruthy();
    expect(await findByText('Juan')).toBeTruthy();
    expect(await findByText('Tendencia de retención')).toBeTruthy();
  });

  it('shows the full-history heatmap toggle as active (not locked) once unlocked', async () => {
    await SecureStore.setItemAsync(ENTITLEMENT_CACHE_KEY, 'true');
    const {findByText, queryByText} = renderScreen();
    await findByText('Ver historial completo');
    expect(queryByText(/Ver historial completo — /)).toBeNull();
  });

  it('reverts the by-book section to locked if the entitlement is revoked', async () => {
    __setApiKeyForTests('test-key');
    await initialize();
    mockPurchases.__setCustomerInfo(activeEntitlementInfo);

    const {findByText, findAllByText, queryByText} = renderScreen();
    expect(await findByText('Juan')).toBeTruthy();

    mockPurchases.__setCustomerInfo(noEntitlementInfo);

    await waitFor(async () => {
      const teasers = await findAllByText('Se desbloquea con una ofrenda');
      expect(teasers.length).toBeGreaterThanOrEqual(2);
    });
    expect(queryByText('Juan')).toBeNull();
  });
});
