/**
 * Tests for `shareOrDownloadImage` — the web fallback for every "share as
 * image" call site in the app (the 11 modals wired through `useShareImage`
 * plus 7 standalone screens that used to roll their own `captureRef` →
 * `expo-sharing` pipeline).
 *
 * Before this fix, on web the pipeline either threw (expo-sharing's web shim
 * passes the captured `data:` URI as `url`, which the Web Share API rejects)
 * or, on browsers without `navigator.share` at all (every desktop browser),
 * just showed a generic error toast with no way to actually get the image.
 *
 * Native (iOS/Android) behavior must stay byte-for-byte identical — that's
 * the regression guard in the first `describe` block, since 11 modals depend
 * on this function unconditionally now.
 */
import {Platform} from 'react-native';
import * as Sharing from 'expo-sharing';
import {shareOrDownloadImage} from '../src/features/share/shareOrDownloadImage';

jest.mock('expo-sharing', () => ({
  isAvailableAsync: jest.fn(),
  shareAsync: jest.fn(),
}));

const DATA_URI = `data:image/png;base64,${Buffer.from(
  'fake-png-bytes',
).toString('base64')}`;

describe('shareOrDownloadImage', () => {
  const originalOS = Platform.OS;
  const originalNavigatorDescriptor = Object.getOwnPropertyDescriptor(
    globalThis,
    'navigator',
  );

  function setNavigator(nav: unknown) {
    Object.defineProperty(globalThis, 'navigator', {
      value: nav,
      configurable: true,
      writable: true,
    });
  }

  afterEach(() => {
    Platform.OS = originalOS;
    if (originalNavigatorDescriptor) {
      Object.defineProperty(
        globalThis,
        'navigator',
        originalNavigatorDescriptor,
      );
    }
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  describe('native (iOS/Android) — must stay an unchanged passthrough', () => {
    beforeEach(() => {
      Platform.OS = 'ios';
    });

    it('shares via expo-sharing when available', async () => {
      (Sharing.isAvailableAsync as jest.Mock).mockResolvedValue(true);
      (Sharing.shareAsync as jest.Mock).mockResolvedValue(undefined);

      const result = await shareOrDownloadImage('file://tmp/card.png', {
        dialogTitle: 'Share this',
      });

      expect(result).toBe('shared');
      expect(Sharing.shareAsync).toHaveBeenCalledWith('file://tmp/card.png', {
        mimeType: 'image/png',
        dialogTitle: 'Share this',
        UTI: 'public.png',
      });
    });

    it('returns "unavailable" without calling shareAsync when Sharing.isAvailableAsync() is false', async () => {
      (Sharing.isAvailableAsync as jest.Mock).mockResolvedValue(false);

      const result = await shareOrDownloadImage('file://tmp/card.png', {
        dialogTitle: 'Share this',
      });

      expect(result).toBe('unavailable');
      expect(Sharing.shareAsync).not.toHaveBeenCalled();
    });
  });

  describe('web', () => {
    beforeEach(() => {
      Platform.OS = 'web';
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    function stubDom() {
      const link = {href: '', download: '', click: jest.fn()};
      const createElement = jest.fn(() => link);
      const appendChild = jest.fn();
      const removeChild = jest.fn();
      // No `document` global in the node jest environment — stub the tiny
      // slice `downloadFile()` actually touches.
      // @ts-expect-error test-only global stub
      global.document = {createElement, body: {appendChild, removeChild}};
      const createObjectURL = jest
        .spyOn(URL, 'createObjectURL')
        .mockReturnValue('blob:mock-url');
      const revokeObjectURL = jest
        .spyOn(URL, 'revokeObjectURL')
        .mockImplementation(() => undefined);
      return {
        link,
        createElement,
        appendChild,
        removeChild,
        createObjectURL,
        revokeObjectURL,
      };
    }

    it('downloads when navigator.share does not exist at all (every desktop browser today)', async () => {
      setNavigator({});
      const dom = stubDom();

      const result = await shareOrDownloadImage(DATA_URI, {
        dialogTitle: 'Share this',
        fileName: 'card.png',
      });
      jest.runAllTimers();

      expect(result).toBe('downloaded');
      expect(dom.link.download).toBe('card.png');
      expect(dom.link.click).toHaveBeenCalledTimes(1);
      expect(dom.createObjectURL).toHaveBeenCalledTimes(1);

      // The captured `data:` URI decoded correctly into the downloaded File.
      const [file] = dom.createObjectURL.mock.calls[0] as [File];
      expect(file.type).toBe('image/png');
      expect(file.name).toBe('card.png');
      await expect(file.text()).resolves.toBe('fake-png-bytes');
    });

    it('downloads — the discriminating case — when navigator.share exists but canShare({files}) rejects it', async () => {
      const share = jest.fn();
      const canShare = jest.fn(() => false);
      setNavigator({share, canShare});
      const dom = stubDom();

      const result = await shareOrDownloadImage(DATA_URI, {
        dialogTitle: 'Share this',
      });
      jest.runAllTimers();

      expect(canShare).toHaveBeenCalledWith({files: [expect.any(File)]});
      expect(share).not.toHaveBeenCalled();
      expect(result).toBe('downloaded');
      expect(dom.link.click).toHaveBeenCalledTimes(1);
    });

    it('shares via the Web Share API with `files` (not `url`) when canShare({files}) accepts it, and does not download', async () => {
      const share = jest.fn().mockResolvedValue(undefined);
      const canShare = jest.fn(() => true);
      setNavigator({share, canShare});
      const dom = stubDom();

      const result = await shareOrDownloadImage(DATA_URI, {
        dialogTitle: 'Share this',
      });

      expect(result).toBe('shared');
      expect(share).toHaveBeenCalledTimes(1);
      const shareArg = share.mock.calls[0][0];
      expect(shareArg.files).toHaveLength(1);
      expect(shareArg.url).toBeUndefined();
      expect(dom.createElement).not.toHaveBeenCalled();
    });

    it('treats the user cancelling the native share sheet (AbortError) as shared, not a fallback to download', async () => {
      const abortError = Object.assign(new Error('cancelled'), {
        name: 'AbortError',
      });
      const share = jest.fn().mockRejectedValue(abortError);
      const canShare = jest.fn(() => true);
      setNavigator({share, canShare});
      const dom = stubDom();

      const result = await shareOrDownloadImage(DATA_URI, {
        dialogTitle: 'Share this',
      });

      expect(result).toBe('shared');
      expect(dom.createElement).not.toHaveBeenCalled();
    });

    it('falls back to download when navigator.share fails for any other reason', async () => {
      const share = jest.fn().mockRejectedValue(new Error('permission denied'));
      const canShare = jest.fn(() => true);
      setNavigator({share, canShare});
      const dom = stubDom();

      const result = await shareOrDownloadImage(DATA_URI, {
        dialogTitle: 'Share this',
      });
      jest.runAllTimers();

      expect(result).toBe('downloaded');
      expect(dom.link.click).toHaveBeenCalledTimes(1);
    });

    it('returns "unavailable" when navigator itself does not exist (defensive)', async () => {
      // @ts-expect-error test-only: remove the global entirely
      delete global.navigator;

      const result = await shareOrDownloadImage(DATA_URI, {
        dialogTitle: 'Share this',
      });
      expect(result).toBe('unavailable');
    });

    it('returns "unavailable" — instead of silently downloading a zero-byte file — when the captured uri is not a base64 data URI', async () => {
      // `captureRef` on web always returns a `data:...;base64,...` string
      // (RNViewShot.web.js). If a future caller ever passes something else
      // (a blob: or file: URI), decoding it naively would produce an empty
      // File that "successfully" downloads — the exact silent-failure bug
      // this module exists to fix, one layer down. It must bail out instead.
      setNavigator({});
      const dom = stubDom();

      const result = await shareOrDownloadImage('blob:http://localhost/abc', {
        dialogTitle: 'Share this',
      });
      jest.runAllTimers();

      expect(result).toBe('unavailable');
      expect(dom.createObjectURL).not.toHaveBeenCalled();
      expect(dom.createElement).not.toHaveBeenCalled();
    });
  });
});
