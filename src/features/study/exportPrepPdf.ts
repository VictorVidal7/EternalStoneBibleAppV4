/**
 * 🖨️ exportPrepPdf — the single platform-aware "hand the already-built HTML
 * off to the reader" step for a prep/series PDF export, sitting between
 * prepPdf.ts (pure HTML string builder) and the two screens that trigger an
 * export (Mesa de preparación + series detail).
 *
 * BUG FIXED HERE (web only): `Print.printToFileAsync` and `Print.printAsync`
 * from expo-print (v15.0.8) BOTH ignore the `html`/`uri` options entirely on
 * web — their web implementation is just `async () => { window.print(); }`,
 * full stop. That means:
 *   1. `printToFileAsync` resolves to `undefined` (no `{uri}`), so the call
 *      site's `const {uri} = await Print.printToFileAsync(...)` throws a
 *      TypeError destructuring `undefined`.
 *   2. Even `printAsync` (which "opens the print dialog" on web) would print
 *      whatever's CURRENTLY RENDERED ON SCREEN — the app's own React Native
 *      Web UI — not the generated sermon document, since it never looks at
 *      `options.html`.
 * Both call sites wrapped that in a `try { … } catch (err) { logger.warn(...) }`
 * with no user-facing feedback, so on web "Exportar PDF" silently did
 * nothing (the destructure threw immediately, before any file/share step
 * ever ran).
 *
 * The fix: on web, never go through expo-print at all. Print the
 * ALREADY-BUILT html string ourselves via a hidden iframe + the browser's
 * own native print dialog (which offers "Save as PDF") — standard DOM APIs
 * only, no new dependency, and it prints the actual sermon document instead
 * of the app chrome. On native (iOS/Android) this is byte-identical to the
 * pre-existing behavior: `Print.printToFileAsync` + `sharePreparedPdf`.
 *
 * Returns whether the export was actually handed off, so a caller can show
 * an honest error toast instead of doing nothing when it wasn't.
 */

import {Platform} from 'react-native';
import * as Print from 'expo-print';
import {sharePreparedPdf} from './sharePdf';

/**
 * One hidden iframe, created lazily and reused across exports — NOT
 * recreated/removed per call. Tearing an iframe down right after calling
 * `contentWindow.print()` risks canceling the browser's print preview in
 * some browsers (the call returns before the dialog is actually closed), so
 * the safest lifetime is "outlives the print dialog", i.e. never removed.
 */
let printIframe: HTMLIFrameElement | null = null;

function getOrCreatePrintIframe(): HTMLIFrameElement | null {
  if (typeof document === 'undefined') return null;
  if (printIframe && printIframe.parentNode) return printIframe;
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  iframe.setAttribute('aria-hidden', 'true');
  document.body.appendChild(iframe);
  printIframe = iframe;
  return iframe;
}

/**
 * Print an already-built HTML document via a hidden iframe + the browser's
 * native print dialog. Resolves `true` once the dialog was actually invoked,
 * `false` if printing isn't possible here (no `document`, e.g. under test)
 * or if `contentWindow.print()` itself threw.
 */
function printHtmlOnWeb(html: string): Promise<boolean> {
  return new Promise(resolve => {
    const iframe = getOrCreatePrintIframe();
    if (!iframe) {
      resolve(false);
      return;
    }

    let settled = false;
    const finish = (ok: boolean) => {
      if (settled) return;
      settled = true;
      resolve(ok);
    };

    // Assign onload BEFORE srcdoc so a synchronous/cached load can't fire
    // before the handler is attached.
    iframe.onload = () => {
      try {
        const win = iframe.contentWindow;
        if (!win) {
          finish(false);
          return;
        }
        win.focus();
        win.print();
        finish(true);
      } catch {
        finish(false);
      }
    };

    iframe.srcdoc = html;
  });
}

/**
 * Generate + hand off a prep/series PDF export for the reader's platform.
 * Native (iOS/Android): exactly the pre-existing behavior — write a real
 * PDF file via expo-print, then share it under `name` via `sharePreparedPdf`.
 * Web: print the given `html` directly through the browser's print dialog
 * (see module doc); `name`/`dialogTitle` aren't used there — there is no OS
 * share sheet to hand a filename to, the print dialog IS the export.
 *
 * Native errors (e.g. `Print.printToFileAsync` throwing) propagate to the
 * caller unchanged, same as before this module existed.
 */
export async function exportPreparedPdf(
  html: string,
  name: string,
  dialogTitle: string,
): Promise<boolean> {
  if (Platform.OS === 'web') {
    return await printHtmlOnWeb(html);
  }
  const {uri} = await Print.printToFileAsync({html, base64: false});
  await sharePreparedPdf(uri, name, dialogTitle);
  return true;
}
