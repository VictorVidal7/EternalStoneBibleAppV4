/**
 * Sprint 94 — the answered-prayer testimony share card (TestimonyImageModal).
 * Pins the eyebrow ("Dios fue fiel"), the request title, the answered-on line,
 * the optional testimony quote, and that the testimony is omitted when absent.
 *
 * Tanda M Phase B — wires the offering-gated `PremiumShareExtras` (premium
 * templates/textures/saved styles) into this screen, mirroring the wiring
 * `imageShareModalPremium.test.tsx` exercises on the flagship. `usePremium`
 * is mocked via a `jest.fn()` (prefixed `mock*` so babel-plugin-jest-hoist
 * allows referencing it from inside the hoisted `jest.mock` factory) so
 * individual tests can flip `isPremium` without needing the real
 * `PremiumProvider` + entitlement-cache plumbing.
 */
import {render, fireEvent} from '@testing-library/react-native';
import {TestimonyImageModal} from '../src/components/insights/TestimonyImageModal';

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
  captureRef: jest.fn(() => Promise.resolve('file://testimony.png')),
}));
jest.mock('expo-sharing', () => ({
  isAvailableAsync: jest.fn(() => Promise.resolve(true)),
  shareAsync: jest.fn(() => Promise.resolve()),
}));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({top: 0, bottom: 0, left: 0, right: 0}),
}));

const mockUsePremium = jest.fn(() => ({isPremium: false}));
jest.mock('@context/PremiumContext', () => ({
  usePremium: () => mockUsePremium(),
}));

const mockOpenOfferingSheet = jest.fn();
jest.mock('@context/OfferingSheetContext', () => ({
  useOfferingSheet: () => ({open: mockOpenOfferingSheet}),
}));

describe('TestimonyImageModal (Sprint 94)', () => {
  beforeEach(() => {
    mockUsePremium.mockReturnValue({isPremium: false});
    mockOpenOfferingSheet.mockClear();
  });

  it('renders the eyebrow, request title, answered line and testimony', () => {
    const {getByText} = render(
      <TestimonyImageModal
        visible
        title="Sanidad de mi madre"
        testimony="El Señor la levantó de la cama."
        answeredLine="Respondida el 16 jun 2026"
        onClose={jest.fn()}
      />,
    );
    expect(getByText('Dios fue fiel')).toBeTruthy();
    expect(getByText('Sanidad de mi madre')).toBeTruthy();
    expect(getByText('Respondida el 16 jun 2026')).toBeTruthy();
    expect(getByText('“El Señor la levantó de la cama.”')).toBeTruthy();
    // Header + share button both read the testimony share label.
    expect(getByText('Compartir testimonio')).toBeTruthy();
  });

  it('omits the testimony quote when no note was recorded', () => {
    const {queryByText, getByText} = render(
      <TestimonyImageModal
        visible
        title="Provisión"
        answeredLine="Respondida el 1 may 2026"
        onClose={jest.fn()}
      />,
    );
    expect(getByText('Provisión')).toBeTruthy();
    // No testimony note → no quoted line rendered.
    expect(queryByText(/“.*”/)).toBeNull();
  });

  it('caps the testimony body at 8 lines so an unbounded testimony (no hard char limit elsewhere) cannot render an absurdly tall share card', () => {
    const longTestimony = 'Dios es fiel. '.repeat(400); // ~5,600 chars
    const {getByText} = render(
      <TestimonyImageModal
        visible
        title="Sanidad de mi madre"
        testimony={longTestimony}
        answeredLine="Respondida el 16 jun 2026"
        onClose={jest.fn()}
      />,
    );
    const testimonyNode = getByText(`“${longTestimony}”`);
    expect(testimonyNode.props.numberOfLines).toBe(8);
  });
});

describe('TestimonyImageModal — Tanda M Phase B (premium share extras)', () => {
  beforeEach(() => {
    mockUsePremium.mockReturnValue({isPremium: false});
    mockOpenOfferingSheet.mockClear();
  });

  function renderModal() {
    return render(
      <TestimonyImageModal
        visible
        title="Sanidad de mi madre"
        answeredLine="Respondida el 16 jun 2026"
        onClose={jest.fn()}
      />,
    );
  }

  it('marks a premium template as locked for a free user and opens the offering sheet on tap', async () => {
    const {findByLabelText} = renderModal();
    // SHARE_TEMPLATES[10] ("cosmos") is the first of the 9 premium designs
    // appended after the 10 free ones — 1-indexed as "Estilo 11" in the a11y
    // label, with the offering suffix PremiumShareExtras adds when locked.
    const lockedTemplate = await findByLabelText(/Estilo 11 · /);
    expect(lockedTemplate).toBeTruthy();

    fireEvent.press(lockedTemplate);
    expect(mockOpenOfferingSheet).toHaveBeenCalledTimes(1);
  });

  it('renders the same premium template unlocked (no offering suffix) once isPremium is true', async () => {
    mockUsePremium.mockReturnValue({isPremium: true});
    const {findByLabelText} = renderModal();

    const unlockedTemplate = await findByLabelText('Estilo 11');
    expect(unlockedTemplate).toBeTruthy();

    fireEvent.press(unlockedTemplate);
    expect(mockOpenOfferingSheet).not.toHaveBeenCalled();
  });
});
