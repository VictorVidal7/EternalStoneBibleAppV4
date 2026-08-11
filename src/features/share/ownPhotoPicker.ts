/**
 * 🖼️ ownPhotoPicker — "use your own photo" background for ImageShareModal.
 *
 * Wraps `expo-image-picker`'s LIBRARY picker (never the camera — this app
 * has no other camera use case, and gallery access is the minimal
 * permission needed for "pick an existing photo"). Mirrors
 * `shareOrDownloadImage.ts`'s shape: a single async function returning a
 * discriminated result so the caller (`ImageShareModal`) never has to touch
 * `expo-image-picker` directly or duplicate try/catch handling.
 *
 * `expo-image-picker` was already an installed-but-unused dependency before
 * this — this is its first real call site in the app. On Android this makes
 * the previously-dormant photo-library permission ACTUALLY USED at runtime
 * for the first time (see the app.json `expo-image-picker` plugin entry,
 * which explicitly blocks the camera/microphone permissions the module
 * would otherwise pull in, since this app only ever wants gallery access).
 *
 * Para la gloria de Dios Todopoderoso ✨
 */
import * as ImagePicker from 'expo-image-picker';
import {logger} from '@lib/utils/logger';

export type PickOwnPhotoResult =
  | {status: 'success'; uri: string}
  | {status: 'canceled'}
  | {status: 'denied'}
  | {status: 'error'};

/**
 * Requests photo-library permission (if needed) and opens the system photo
 * picker for a single image. Never touches the camera.
 *
 * - User picks a photo → `{status: 'success', uri}`.
 * - User cancels the picker → `{status: 'canceled'}` — the caller must treat
 *   this as a no-op and keep whatever background was active before.
 * - Permission denied/blocked → `{status: 'denied'}` — the caller shows a
 *   clear, non-blocking message instead of crashing or silently failing.
 * - Anything else throws (unexpected native error) → `{status: 'error'}`,
 *   logged for diagnostics.
 */
export async function pickOwnPhotoBackground(): Promise<PickOwnPhotoResult> {
  try {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      return {status: 'denied'};
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 1,
    });

    if (result.canceled || !result.assets?.[0]?.uri) {
      return {status: 'canceled'};
    }

    return {status: 'success', uri: result.assets[0].uri};
  } catch (error) {
    logger.error('Own-photo picker failed', error as Error, {
      component: 'ownPhotoPicker',
      action: 'pickOwnPhotoBackground',
    });
    return {status: 'error'};
  }
}
