/**
 * Wiring test for `useShareImage` — the hook behind 11 of the app's 12
 * hook-based "share as image" modals (Achievement, Challenge, Collection,
 * Constancy, Highlights, Mood, Note, PeriodRecap, Testimony, Timeline,
 * WeeklyRecap).
 *
 * `shareOrDownloadImage.test.ts` covers the share-vs-download DECISION
 * itself in isolation. This file instead pins that the HOOK reacts
 * correctly to each of that function's three possible results — in
 * particular that the new 'downloaded' result (the web fallback path) gets
 * its own distinct toast copy instead of silently reusing "ready to share",
 * and still calls `onShared` (so the modal still closes) exactly like the
 * pre-existing 'shared' path.
 */
import {renderHook, act} from '@testing-library/react-native';
import {useShareImage} from '../src/features/share/useShareImage';
import {shareOrDownloadImage} from '../src/features/share/shareOrDownloadImage';
import {translations} from '../src/i18n/translations';

jest.mock('../src/features/share/shareOrDownloadImage', () => ({
  shareOrDownloadImage: jest.fn(),
}));

jest.mock('react-native-view-shot', () => ({
  captureRef: jest.fn(() => Promise.resolve('data:image/png;base64,xxx')),
}));

jest.mock('../src/lib/haptics', () => ({
  haptics: {press: jest.fn(), tap: jest.fn()},
}));

jest.mock('../src/lib/utils/logger', () => ({
  logger: {error: jest.fn(), info: jest.fn(), warn: jest.fn()},
}));

jest.mock('../src/hooks/useLanguage', () => ({
  useLanguage: () => ({t: require('../src/i18n/translations').translations.es}),
}));

const mockToastSuccess = jest.fn();
const mockToastError = jest.fn();
jest.mock('../src/context/ToastContext', () => ({
  useToast: () => ({success: mockToastSuccess, error: mockToastError}),
}));

const mockedShareOrDownloadImage = shareOrDownloadImage as jest.Mock;

describe('useShareImage — reacts to the shared/downloaded/unavailable result', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  function setup(onShared = jest.fn()) {
    const {result} = renderHook(() =>
      useShareImage({componentName: 'TestModal', onShared}),
    );
    // A real modal assigns this ref via the rendered <LinearGradient> host;
    // here we simulate "the card is mounted" directly since this test
    // exercises the hook in isolation from any component tree.
    (result.current.previewRef as {current: unknown}).current = {};
    return {result, onShared};
  }

  it('shows the pre-existing "ready to share" toast and calls onShared on "shared"', async () => {
    mockedShareOrDownloadImage.mockResolvedValue('shared');
    const {result, onShared} = setup();

    await act(async () => {
      await result.current.handleShare();
    });

    expect(mockToastSuccess).toHaveBeenCalledWith(
      translations.es.verse.imageReady,
    );
    expect(onShared).toHaveBeenCalledTimes(1);
  });

  it('shows the distinct "downloaded" toast (not "ready to share") and still calls onShared on "downloaded"', async () => {
    mockedShareOrDownloadImage.mockResolvedValue('downloaded');
    const {result, onShared} = setup();

    await act(async () => {
      await result.current.handleShare();
    });

    expect(mockToastSuccess).toHaveBeenCalledWith(
      translations.es.verse.imageDownloaded,
    );
    expect(mockToastSuccess).not.toHaveBeenCalledWith(
      translations.es.verse.imageReady,
    );
    expect(onShared).toHaveBeenCalledTimes(1);
  });

  it('shows the error toast and does NOT call onShared on "unavailable"', async () => {
    mockedShareOrDownloadImage.mockResolvedValue('unavailable');
    const {result, onShared} = setup();

    await act(async () => {
      await result.current.handleShare();
    });

    expect(mockToastError).toHaveBeenCalledWith(
      translations.es.verse.imageShareError,
    );
    expect(mockToastSuccess).not.toHaveBeenCalled();
    expect(onShared).not.toHaveBeenCalled();
  });
});
