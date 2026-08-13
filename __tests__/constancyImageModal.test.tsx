/**
 * Sprint 85 — "Comparte tu constancia": the rings share card composes the same
 * ConstancyRingsGraphic the Home card shows over a gradient template, plus a
 * per-habit legend. Pins the card title, the habit labels, and the streak
 * status line.
 *
 * Tanda M Phase B adds `PremiumShareExtras` (premium templates + textures +
 * "Mis estilos") in place of the free-only `ShareStylePicker` — the two new
 * tests below pin that a premium template renders unlocked once `isPremium`
 * is true, and that a locked tap routes to the offering sheet when it's not,
 * mirroring `premiumShareExtras.test.tsx`'s own coverage of that component.
 */
import {render, fireEvent} from '@testing-library/react-native';
import {ConstancyImageModal} from '../src/components/insights/ConstancyImageModal';
import {buildConstancySummary} from '../src/lib/home/constancyRings';
import {translations} from '../src/i18n/translations';

let mockIsPremium = false;
jest.mock('../src/context/PremiumContext', () => ({
  usePremium: () => ({isPremium: mockIsPremium}),
}));

const mockOpenOfferingSheet = jest.fn();
jest.mock('../src/context/OfferingSheetContext', () => ({
  useOfferingSheet: () => ({open: mockOpenOfferingSheet}),
}));

const mockColors = {
  background: '#0f172a',
  text: '#f1f5f9',
  textSecondary: '#94a3b8',
  textTertiary: '#64748b',
  primary: '#38bdf8',
  border: '#374151',
};

jest.mock('../src/hooks/useTheme', () => ({
  useTheme: () => ({isDark: true, colors: mockColors}),
}));

jest.mock('../src/hooks/useLanguage', () => ({
  useLanguage: () => ({
    language: 'es',
    t: require('../src/i18n/translations').translations.es,
  }),
}));

jest.mock('../src/context/ToastContext', () => ({
  useToast: () => ({success: jest.fn(), error: jest.fn()}),
}));

jest.mock('../src/lib/haptics', () => ({
  haptics: {press: jest.fn(), tap: jest.fn()},
}));

jest.mock('react-native-view-shot', () => ({
  captureRef: jest.fn(() => Promise.resolve('file://constancy.png')),
}));

jest.mock('expo-sharing', () => ({
  isAvailableAsync: jest.fn(() => Promise.resolve(true)),
  shareAsync: jest.fn(() => Promise.resolve()),
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({top: 0, bottom: 0, left: 0, right: 0}),
}));

const tc = translations.es.constancy;

const summary = buildConstancySummary([
  {key: 'reading', done: true, fraction: 1, streak: 7, everDone: true},
  {key: 'memory', done: false, fraction: 0.4, streak: 0, everDone: true},
  {key: 'devotion', done: true, fraction: 1, streak: 3, everDone: true},
]);

describe('ConstancyImageModal (Sprint 85)', () => {
  beforeEach(() => {
    mockIsPremium = false;
    mockOpenOfferingSheet.mockClear();
  });

  it('renders the share card: title, subtitle and every habit label', () => {
    const {getByText} = render(
      <ConstancyImageModal visible summary={summary} onClose={jest.fn()} />,
    );
    expect(getByText(tc.shareCardTitle)).toBeTruthy();
    expect(getByText(tc.shareCardSubtitle)).toBeTruthy();
    expect(getByText(tc.habitReading)).toBeTruthy();
    expect(getByText(tc.habitMemory)).toBeTruthy();
    expect(getByText(tc.habitDevotion)).toBeTruthy();
    expect(getByText(tc.habitMood)).toBeTruthy();
  });

  it('shows a streak status for a habit with a run, today for a done one', () => {
    const {getByText, getAllByText} = render(
      <ConstancyImageModal visible summary={summary} onClose={jest.fn()} />,
    );
    // Reading streak 7 → "7 días".
    expect(getByText(tc.shareStreakDays.replace('{{n}}', '7'))).toBeTruthy();
    // Memory (no streak, not done) and mood (no activity) both show the dot.
    expect(getAllByText('·').length).toBeGreaterThan(0);
  });

  it('uses the singular day form for a one-day streak', () => {
    const oneDay = buildConstancySummary([
      {key: 'reading', done: false, fraction: 0.2, streak: 1, everDone: true},
    ]);
    const {getByText, queryByText} = render(
      <ConstancyImageModal visible summary={oneDay} onClose={jest.fn()} />,
    );
    expect(getByText(tc.shareStreakDay)).toBeTruthy();
    expect(queryByText(tc.shareStreakDays.replace('{{n}}', '1'))).toBeNull();
  });
});

describe('ConstancyImageModal — Tanda M Phase B (PremiumShareExtras wiring)', () => {
  beforeEach(() => {
    mockIsPremium = false;
    mockOpenOfferingSheet.mockClear();
  });

  it('renders a premium template unlocked (no offering suffix) once isPremium is true', async () => {
    mockIsPremium = true;
    const {findByLabelText} = render(
      <ConstancyImageModal visible summary={summary} onClose={jest.fn()} />,
    );
    // SHARE_TEMPLATES is 10 free + 9 premium — index 10 (label "Estilo 11")
    // is the first premium template in the catalog.
    expect(await findByLabelText('Estilo 11')).toBeTruthy();
  });

  it('routes a locked premium template tap to the offering sheet when isPremium is false', async () => {
    const {findByLabelText} = render(
      <ConstancyImageModal visible summary={summary} onClose={jest.fn()} />,
    );
    fireEvent.press(await findByLabelText(/Estilo 11 · /));
    expect(mockOpenOfferingSheet).toHaveBeenCalledTimes(1);
  });

  it('routes a locked texture tap to the offering sheet when isPremium is false', async () => {
    const {findByLabelText} = render(
      <ConstancyImageModal visible summary={summary} onClose={jest.fn()} />,
    );
    fireEvent.press(await findByLabelText(/Puntos · /));
    expect(mockOpenOfferingSheet).toHaveBeenCalledTimes(1);
  });
});
