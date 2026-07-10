/**
 * One-time "we restored your progress" notice on the Memory Insights
 * screen — shown only when `useMemoryGoal().showRestoreBanner` is true
 * (a fresh-device floor was just seeded), dismissible for good.
 */

import React from 'react';
import {render, fireEvent} from '@testing-library/react-native';
import MemoryInsightsScreen from '../app/features/memory/insights';
import {PremiumProvider} from '../src/context/PremiumContext';
import {computeReviewHistory} from '../src/lib/memory/history';
import {computeGoalProgress, DEFAULT_DAILY_GOAL} from '../src/lib/memory/goals';
import {DEFAULT_EASE, type MemoryCard} from '../src/lib/memory/srs';
import type {ReviewEvent} from '../src/lib/memory/reviewEvents';

const NOW = new Date(2026, 6, 1, 12, 0, 0, 0);

const mockEvents: ReviewEvent[] = [
  {
    id: 'Juan/3/16__1',
    verseKey: 'Juan/3/16',
    bookName: 'Juan',
    grade: 'good',
    boxBefore: 1,
    boxAfter: 2,
    intervalDays: 2,
    reviewedAt: NOW.getTime() - 1000,
  },
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
  reviewCount: 1,
  lapseCount: 0,
  ease: DEFAULT_EASE,
  updatedAt: NOW.getTime(),
};

const mockHistory = computeReviewHistory(mockEvents, NOW);
const mockGoal = computeGoalProgress(mockHistory.summary, DEFAULT_DAILY_GOAL);
const mockDismissRestoreBanner = jest.fn();

// Mutable per-test — set in each `it` before rendering.
let mockShowRestoreBanner = false;

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
    showRestoreBanner: mockShowRestoreBanner,
    dismissRestoreBanner: mockDismissRestoreBanner,
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

jest.mock('../src/context/OfferingSheetContext', () => ({
  useOfferingSheet: () => ({open: jest.fn()}),
}));

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

const BANNER_TEXT =
  'Restauramos tu racha y tu progreso general de memorización de otro dispositivo.';

describe('MemoryInsightsScreen — restore banner', () => {
  beforeEach(() => {
    mockShowRestoreBanner = false;
    mockDismissRestoreBanner.mockClear();
  });

  it('does not render when no restore just happened', async () => {
    const {findByText, queryByText} = renderScreen();
    await findByText('Dominio del mazo'); // wait for the screen to settle
    expect(queryByText(BANNER_TEXT)).toBeNull();
  });

  it('shows the notice once, right after a fresh-device restore', async () => {
    mockShowRestoreBanner = true;
    const {findByText} = renderScreen();
    expect(await findByText(BANNER_TEXT)).toBeTruthy();
  });

  it('dismisses via the close button, calling the hook once', async () => {
    mockShowRestoreBanner = true;
    const {findByLabelText} = renderScreen();
    fireEvent.press(await findByLabelText('Cerrar aviso'));
    expect(mockDismissRestoreBanner).toHaveBeenCalledTimes(1);
  });
});
