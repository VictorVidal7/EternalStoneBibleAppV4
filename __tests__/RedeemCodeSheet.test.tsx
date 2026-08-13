/**
 * Gift-code-redemption feature — RedeemCodeSheet.
 *
 * Mirrors ExtrasSettings.test.tsx / DonationSheet.test.tsx's mocking style:
 * useTheme/useLanguage/ToastContext/haptics are mocked, and giftCodeService
 * + offeringService's refreshEntitlement are mocked so each RedeemOutcome
 * can be driven directly without a real network call.
 */

import {render, waitFor, fireEvent, act} from '@testing-library/react-native';

const mockColors = {
  background: '#ffffff',
  card: '#f8fafc',
  text: '#0f172a',
  textSecondary: '#475569',
  textTertiary: '#94a3b8',
  primary: '#1d4ed8',
  onPrimary: '#ffffff',
  border: '#cbd5e1',
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

const mockToast = {
  success: jest.fn(),
  error: jest.fn(),
  warning: jest.fn(),
  info: jest.fn(),
};
jest.mock('../src/context/ToastContext', () => ({
  useToast: () => mockToast,
}));

jest.mock('../src/lib/haptics', () => ({
  haptics: {tap: jest.fn(), success: jest.fn()},
}));

const mockRedeemGiftCode = jest.fn();
jest.mock('../src/lib/offering/giftCodeService', () => ({
  redeemGiftCode: (...args: unknown[]) => mockRedeemGiftCode(...args),
}));

const mockRefreshEntitlement = jest.fn().mockResolvedValue(undefined);
jest.mock('../src/lib/offering/offeringService', () => ({
  refreshEntitlement: (...args: unknown[]) => mockRefreshEntitlement(...args),
}));

const mockGetStringAsync = jest.fn().mockResolvedValue('');
jest.mock('expo-clipboard', () => ({
  getStringAsync: (...args: unknown[]) => mockGetStringAsync(...args),
}));

import RedeemCodeSheet from '../src/components/settings/RedeemCodeSheet';

function renderSheet(onClose = jest.fn()) {
  return render(<RedeemCodeSheet visible onClose={onClose} />);
}

describe('RedeemCodeSheet', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetStringAsync.mockResolvedValue('');
    mockRefreshEntitlement.mockResolvedValue(undefined);
  });

  it('renders the sheet title and input', async () => {
    const {findByText, findByPlaceholderText} = renderSheet();
    expect(await findByText('Canjear código de regalo')).toBeTruthy();
    expect(await findByPlaceholderText('XXXX-XXXX')).toBeTruthy();
  });

  it('auto-uppercases and formats the code as the user types', async () => {
    const {findByPlaceholderText} = renderSheet();
    const input = await findByPlaceholderText('XXXX-XXXX');
    fireEvent.changeText(input, 'abcd1234');
    expect(input.props.value).toBe('ABCD-1234');
  });

  it('disables the submit button until a code is entered', async () => {
    const {findByLabelText, findByPlaceholderText} = renderSheet();
    const submit = await findByLabelText('Canjear');
    expect(submit.props.accessibilityState?.disabled).toBe(true);

    const input = await findByPlaceholderText('XXXX-XXXX');
    fireEvent.changeText(input, 'ABCD1234');
    await waitFor(() =>
      expect(submit.props.accessibilityState?.disabled).toBe(false),
    );
  });

  it('on success: refreshes the entitlement, toasts, and closes', async () => {
    mockRedeemGiftCode.mockResolvedValue({status: 'success'});
    const onClose = jest.fn();
    const {findByLabelText, findByPlaceholderText} = renderSheet(onClose);

    fireEvent.changeText(await findByPlaceholderText('XXXX-XXXX'), 'ABCD1234');
    fireEvent.press(await findByLabelText('Canjear'));

    await waitFor(() =>
      expect(mockRedeemGiftCode).toHaveBeenCalledWith('ABCD-1234'),
    );
    await waitFor(() =>
      expect(mockRefreshEntitlement).toHaveBeenCalledTimes(1),
    );
    expect(mockToast.success).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('on already_redeemed: warns and keeps the sheet open', async () => {
    mockRedeemGiftCode.mockResolvedValue({status: 'already_redeemed'});
    const onClose = jest.fn();
    const {findByLabelText, findByPlaceholderText} = renderSheet(onClose);

    fireEvent.changeText(await findByPlaceholderText('XXXX-XXXX'), 'ABCD1234');
    fireEvent.press(await findByLabelText('Canjear'));

    await waitFor(() => expect(mockToast.warning).toHaveBeenCalledTimes(1));
    expect(onClose).not.toHaveBeenCalled();
    expect(mockRefreshEntitlement).not.toHaveBeenCalled();
  });

  it('on not_found: shows an error toast', async () => {
    mockRedeemGiftCode.mockResolvedValue({status: 'not_found'});
    const {findByLabelText, findByPlaceholderText} = renderSheet();

    fireEvent.changeText(await findByPlaceholderText('XXXX-XXXX'), 'ABCD1234');
    fireEvent.press(await findByLabelText('Canjear'));

    await waitFor(() => expect(mockToast.error).toHaveBeenCalledTimes(1));
  });

  it('on invalid: shows an error toast', async () => {
    mockRedeemGiftCode.mockResolvedValue({status: 'invalid'});
    const {findByLabelText, findByPlaceholderText} = renderSheet();

    fireEvent.changeText(await findByPlaceholderText('XXXX-XXXX'), 'ABCD1234');
    fireEvent.press(await findByLabelText('Canjear'));

    await waitFor(() => expect(mockToast.error).toHaveBeenCalledTimes(1));
  });

  it('on error: shows an error toast', async () => {
    mockRedeemGiftCode.mockResolvedValue({
      status: 'error',
      message: 'network down',
    });
    const {findByLabelText, findByPlaceholderText} = renderSheet();

    fireEvent.changeText(await findByPlaceholderText('XXXX-XXXX'), 'ABCD1234');
    fireEvent.press(await findByLabelText('Canjear'));

    await waitFor(() => expect(mockToast.error).toHaveBeenCalledTimes(1));
  });

  it('offers a one-tap fill when the clipboard holds a plausible code', async () => {
    mockGetStringAsync.mockResolvedValue('wxyz-9876');
    const {findByLabelText, findByPlaceholderText} = renderSheet();

    const hint = await findByLabelText(
      'Código detectado en el portapapeles. Toca para usarlo.',
    );
    fireEvent.press(hint);

    const input = await findByPlaceholderText('XXXX-XXXX');
    await waitFor(() => expect(input.props.value).toBe('WXYZ-9876'));
  });

  it('does not offer a paste hint for clipboard content that is not a plausible code', async () => {
    mockGetStringAsync.mockResolvedValue('hi there');
    const {queryByLabelText} = renderSheet();

    await act(async () => {
      await Promise.resolve();
    });
    expect(
      queryByLabelText(
        'Código detectado en el portapapeles. Toca para usarlo.',
      ),
    ).toBeNull();
  });

  it('does not offer a paste hint for unrelated 8+ character clipboard text (e.g. a pasted URL)', async () => {
    // Regression guard: an earlier version of the paste-detection heuristic
    // ran clipboard text through the lenient typing formatter (which strips
    // punctuation, so almost any 8+ alphanumeric-char string "looked" like
    // an XXXX-XXXX code) before checking the shape. The real check must run
    // against the RAW clipboard text instead, so unrelated copied content
    // like a URL never triggers a false-positive hint.
    mockGetStringAsync.mockResolvedValue('https://example.com/abc12345');
    const {queryByLabelText} = renderSheet();

    await act(async () => {
      await Promise.resolve();
    });
    expect(
      queryByLabelText(
        'Código detectado en el portapapeles. Toca para usarlo.',
      ),
    ).toBeNull();
  });
});
