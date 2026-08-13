/**
 * PrepExportFormatSheet (Tanda 3) — the export-format picker for the "Mesa de
 * preparación". Pins the fully-controlled contract: 'manuscript' is always
 * tappable regardless of `isPremium`, the other 3 rows route to
 * `onLockedAction` instead of `onSelect` while locked, and the component
 * never reaches for usePremium()/useOfferingSheet() itself.
 */
import {render, fireEvent} from '@testing-library/react-native';
import {PrepExportFormatSheet} from '../src/features/study/PrepExportFormatSheet';

const mockColors = {
  text: '#0f172a',
  textSecondary: '#475569',
  border: '#cbd5e1',
  surface: '#ffffff',
  card: '#f8fafc',
  primary: '#2563eb',
  onPrimary: '#ffffff',
  overlay: 'rgba(0, 0, 0, 0.75)',
};

jest.mock('../src/hooks/useTheme', () => ({
  useTheme: () => ({colors: mockColors, isDark: false}),
}));
jest.mock('../src/hooks/useLanguage', () => ({
  useLanguage: () => ({
    language: 'es',
    t: require('../src/i18n/translations').translations.es,
  }),
}));
jest.mock('../src/lib/haptics', () => ({
  haptics: {tap: jest.fn(), press: jest.fn(), success: jest.fn()},
}));

const p = require('../src/i18n/translations').translations.es.prepTable;

describe('PrepExportFormatSheet', () => {
  it('renders the title and all 4 format rows', () => {
    const {getByText} = render(
      <PrepExportFormatSheet
        visible
        isPremium={false}
        onSelect={jest.fn()}
        onLockedAction={jest.fn()}
        onClose={jest.fn()}
      />,
    );
    expect(getByText(p.exportFormatSheetTitle)).toBeTruthy();
    expect(getByText(p.exportFormatManuscriptLabel)).toBeTruthy();
    expect(getByText(p.exportFormatOutlineLabel)).toBeTruthy();
    expect(getByText(p.exportFormatHandoutLabel)).toBeTruthy();
    expect(getByText(p.exportFormatDiscussionLabel)).toBeTruthy();
  });

  it('lets a free reader tap the free "manuscript" row', () => {
    const onSelect = jest.fn();
    const onLockedAction = jest.fn();
    const {getByLabelText} = render(
      <PrepExportFormatSheet
        visible
        isPremium={false}
        onSelect={onSelect}
        onLockedAction={onLockedAction}
        onClose={jest.fn()}
      />,
    );
    fireEvent.press(getByLabelText(p.exportFormatManuscriptLabel));
    expect(onSelect).toHaveBeenCalledWith('manuscript');
    expect(onLockedAction).not.toHaveBeenCalled();
  });

  it('routes a locked row (free reader) to onLockedAction, never onSelect', () => {
    const onSelect = jest.fn();
    const onLockedAction = jest.fn();
    const {getByLabelText} = render(
      <PrepExportFormatSheet
        visible
        isPremium={false}
        onSelect={onSelect}
        onLockedAction={onLockedAction}
        onClose={jest.fn()}
      />,
    );
    // Locked rows carry an accessibility label suffixed with the shared
    // offering-badge a11y text, same idiom as ReaderPreferencesSheet.
    const label = `${p.exportFormatOutlineLabel} — ${require('../src/i18n/translations').translations.es.offering.badgeA11y}`;
    fireEvent.press(getByLabelText(label));
    expect(onLockedAction).toHaveBeenCalledTimes(1);
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('lets a premium reader tap every row, each calling onSelect with its own format', () => {
    const onSelect = jest.fn();
    const onLockedAction = jest.fn();
    const {getByLabelText} = render(
      <PrepExportFormatSheet
        visible
        isPremium
        onSelect={onSelect}
        onLockedAction={onLockedAction}
        onClose={jest.fn()}
      />,
    );
    fireEvent.press(getByLabelText(p.exportFormatOutlineLabel));
    fireEvent.press(getByLabelText(p.exportFormatHandoutLabel));
    fireEvent.press(getByLabelText(p.exportFormatDiscussionLabel));
    expect(onSelect.mock.calls).toEqual([
      ['outline'],
      ['handout'],
      ['discussion'],
    ]);
    expect(onLockedAction).not.toHaveBeenCalled();
  });

  it('fires onClose when the close button is tapped', () => {
    const onClose = jest.fn();
    const {getByLabelText} = render(
      <PrepExportFormatSheet
        visible
        isPremium={false}
        onSelect={jest.fn()}
        onLockedAction={jest.fn()}
        onClose={onClose}
      />,
    );
    fireEvent.press(getByLabelText(p.exportFormatCloseLabel));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
