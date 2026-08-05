/**
 * 📤⬇️ shareOrDownloadImage — the platform-branching last step shared by
 * every "share as image" pipeline in the app (captureRef → this).
 *
 * WHY THIS EXISTS: on web, expo-sharing's web shim
 * (`expo-sharing/build/ExpoSharing.web.js`) only ever checks `!!navigator.share`
 * and, if truthy, calls `navigator.share({...options, url})` — passing the
 * captured `data:` URI (react-native-view-shot's web shim returns the same
 * base64 data URI for `result: 'tmpfile'` as for `'data-uri'`) as `url`. Two
 * problems: (1) the Web Share API's `url` field expects a real absolute URL,
 * not a `data:` URI, so browsers that DO support `navigator.share` reject or
 * ignore it; (2) most desktop browsers (Chrome, Firefox, Safari desktop)
 * don't implement `navigator.share` at all, so `isAvailableAsync()` resolves
 * `false` and every one of the 18 share-as-image screens in this app just
 * showed a generic error toast — no way for a desktop web user to ever get
 * the image out of the app.
 *
 * This function bypasses expo-sharing entirely on web. It turns the captured
 * `data:` URI into a real `File`, checks `navigator.canShare({files: [file]})`
 * — NOT just whether `navigator.share` exists, since some mobile browsers
 * support the Web Share API for text/URLs but reject file shares — and only
 * calls `navigator.share` when a file share would actually succeed. Every
 * other web case (which today is every desktop browser) falls back to a
 * direct browser download: a blob URL fed to an off-DOM `<a download>` click.
 * That guarantees the share action always DOES something instead of failing
 * silently.
 *
 * Native (iOS/Android) behavior is completely unchanged — same
 * `Sharing.isAvailableAsync` / `Sharing.shareAsync` pair as before.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */
import {Platform} from 'react-native';
import * as Sharing from 'expo-sharing';

export type ShareOrDownloadResult = 'shared' | 'downloaded' | 'unavailable';

export interface ShareOrDownloadImageOptions {
  /** System share-sheet dialog title (native) / Web Share API `title` (web). */
  dialogTitle: string;
  /** Suggested filename for the web download fallback (and the web File). */
  fileName?: string;
}

const DEFAULT_FILE_NAME = 'eternal-stone-bible.png';

/**
 * Shares (or, on web when file-sharing isn't available, downloads) a PNG
 * previously captured with `react-native-view-shot`'s `captureRef` using
 * `{format: 'png', quality: 1, result: 'tmpfile'}`.
 *
 * Returns which path was actually taken so callers can choose their own
 * success/error feedback without this helper dictating toast copy or modal
 * dismissal — those vary per screen (some show no success toast, some don't
 * auto-close), so this stays a single-purpose "did it work, and how" call.
 */
export async function shareOrDownloadImage(
  uri: string,
  {dialogTitle, fileName = DEFAULT_FILE_NAME}: ShareOrDownloadImageOptions,
): Promise<ShareOrDownloadResult> {
  if (Platform.OS === 'web') {
    return shareOrDownloadImageOnWeb(uri, dialogTitle, fileName);
  }

  if (!(await Sharing.isAvailableAsync())) return 'unavailable';

  await Sharing.shareAsync(uri, {
    mimeType: 'image/png',
    dialogTitle,
    UTI: 'public.png',
  });
  return 'shared';
}

async function shareOrDownloadImageOnWeb(
  dataUri: string,
  dialogTitle: string,
  fileName: string,
): Promise<ShareOrDownloadResult> {
  if (typeof navigator === 'undefined') return 'unavailable';

  const file = dataUriToFile(dataUri, fileName);

  if (
    navigator.share &&
    navigator.canShare &&
    navigator.canShare({files: [file]})
  ) {
    try {
      await navigator.share({files: [file], title: dialogTitle});
      return 'shared';
    } catch (error) {
      // The user dismissing the native share-sheet UI throws `AbortError` —
      // that's a deliberate cancel, not a failure, so it should NOT fall
      // through to an unwanted download the user never asked for.
      if ((error as {name?: string} | null)?.name === 'AbortError') {
        return 'shared';
      }
      // Any other failure (permission denied, etc.) falls through to the
      // download fallback below instead of leaving the user stranded.
    }
  }

  downloadFile(file);
  return 'downloaded';
}

/**
 * Decodes a `data:<mime>;base64,<data>` URI — what `captureRef`'s web shim
 * returns for every `result` option (see `RNViewShot.web.js`) — into a real
 * `File`. Done with `atob` rather than a `fetch(dataUri)` round-trip so this
 * stays synchronous, has no network/CSP dependency, and is trivial to test.
 */
function dataUriToFile(dataUri: string, fileName: string): File {
  const match = /^data:([^;]+);base64,(.*)$/.exec(dataUri);
  const mime = match?.[1] ?? 'image/png';
  const base64 = match?.[2] ?? '';
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new File([bytes], fileName, {type: mime});
}

/** Triggers a direct browser download of `file` via a blob URL + a synthetic,
 * off-DOM `<a download>` click — the most broadly-compatible way to hand a
 * generated image to a desktop web user with no Web Share API support. */
function downloadFile(file: File): void {
  const url = URL.createObjectURL(file);
  const link = document.createElement('a');
  link.href = url;
  link.download = file.name;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  // Give the browser a tick to pick up the blob URL before revoking it —
  // revoking synchronously can race the download start in some browsers.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
