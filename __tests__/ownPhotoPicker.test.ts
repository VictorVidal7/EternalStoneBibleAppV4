/**
 * Tests for `pickOwnPhotoBackground` — the `expo-image-picker` LIBRARY-only
 * wrapper backing ImageShareModal's "own photo" background (see
 * `imageShareModalOwnPhoto.test.tsx` for the component-level coverage of how
 * each of these results drives the modal's UI/state).
 *
 * Isolated here (mirroring `shareOrDownloadImage.test.ts`) so the native
 * error path — the one case that's awkward to trigger through the full
 * modal — gets direct coverage without mocking the whole component tree.
 */
import * as ImagePicker from 'expo-image-picker';
import {logger} from '@lib/utils/logger';
import {pickOwnPhotoBackground} from '../src/features/share/ownPhotoPicker';

jest.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: jest.fn(),
  launchImageLibraryAsync: jest.fn(),
}));

jest.mock('@lib/utils/logger', () => ({
  logger: {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  },
}));

const mockRequestPermission =
  ImagePicker.requestMediaLibraryPermissionsAsync as jest.Mock;
const mockLaunchLibrary = ImagePicker.launchImageLibraryAsync as jest.Mock;

describe('pickOwnPhotoBackground', () => {
  beforeEach(() => {
    mockRequestPermission.mockReset();
    mockLaunchLibrary.mockReset();
    (logger.error as jest.Mock).mockClear();
  });

  it('returns the picked asset uri on success, never touching the camera', async () => {
    mockRequestPermission.mockResolvedValue({granted: true});
    mockLaunchLibrary.mockResolvedValue({
      canceled: false,
      assets: [{uri: 'file://photo.jpg'}],
    });

    const result = await pickOwnPhotoBackground();

    expect(result).toEqual({status: 'success', uri: 'file://photo.jpg'});
    expect(mockLaunchLibrary).toHaveBeenCalledTimes(1);
    // No camera-related option (e.g. `cameraType`) is ever passed — this
    // wrapper exclusively opens the gallery/library picker.
    expect(mockLaunchLibrary.mock.calls[0][0]).not.toHaveProperty('cameraType');
  });

  it('returns "denied" without opening the picker when permission is refused', async () => {
    mockRequestPermission.mockResolvedValue({granted: false});

    const result = await pickOwnPhotoBackground();

    expect(result).toEqual({status: 'denied'});
    expect(mockLaunchLibrary).not.toHaveBeenCalled();
  });

  it('returns "canceled" when the user dismisses the picker', async () => {
    mockRequestPermission.mockResolvedValue({granted: true});
    mockLaunchLibrary.mockResolvedValue({canceled: true, assets: null});

    const result = await pickOwnPhotoBackground();

    expect(result).toEqual({status: 'canceled'});
  });

  it('returns "canceled" if the picker resolves with no assets (defensive)', async () => {
    mockRequestPermission.mockResolvedValue({granted: true});
    mockLaunchLibrary.mockResolvedValue({canceled: false, assets: []});

    const result = await pickOwnPhotoBackground();

    expect(result).toEqual({status: 'canceled'});
  });

  it('returns "error" and logs when the permission request throws', async () => {
    mockRequestPermission.mockRejectedValue(new Error('native boom'));

    const result = await pickOwnPhotoBackground();

    expect(result).toEqual({status: 'error'});
    expect(logger.error).toHaveBeenCalledTimes(1);
  });

  it('returns "error" and logs when the picker itself throws', async () => {
    mockRequestPermission.mockResolvedValue({granted: true});
    mockLaunchLibrary.mockRejectedValue(new Error('native boom'));

    const result = await pickOwnPhotoBackground();

    expect(result).toEqual({status: 'error'});
    expect(logger.error).toHaveBeenCalledTimes(1);
  });
});
