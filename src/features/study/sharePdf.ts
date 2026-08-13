/**
 * 📄 sharePdf — hand a just-generated prep/series PDF to the OS share sheet
 * under a MEANINGFUL filename.
 *
 * expo-print's `printToFileAsync` writes to a cache file with a random UUID
 * name (e.g. "1508d140-…-c2a.pdf"), which is what the share sheet then shows.
 * This copies that temp file to a cache file named after the passage/series
 * (via [[prepPdf]]'s `pdfFileName`) before sharing, so the exported document is
 * recognizable ("Juan 3.16-21.pdf", "Efesios en 8 semanas.pdf"). Best-effort:
 * if the rename fails for any reason it shares the original temp file rather
 * than failing the whole export.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import * as Sharing from 'expo-sharing';
import {File, Paths} from 'expo-file-system';
import {pdfFileName} from './prepPdf';

/**
 * Share a generated PDF (its temp `sourceUri` from `Print.printToFileAsync`)
 * renamed to `${name}.pdf`. No-op when the platform can't share.
 */
export async function sharePreparedPdf(
  sourceUri: string,
  name: string,
  dialogTitle: string,
): Promise<void> {
  if (!(await Sharing.isAvailableAsync())) return;

  let shareUri = sourceUri;
  try {
    const source = new File(sourceUri);
    const target = new File(Paths.cache, `${pdfFileName(name)}.pdf`);
    if (target.exists) target.delete();
    await source.copy(target);
    shareUri = target.uri;
  } catch {
    // Fall back to the original temp file — a friendly name is a nicety, not
    // worth failing the export over.
  }

  await Sharing.shareAsync(shareUri, {
    mimeType: 'application/pdf',
    dialogTitle,
    UTI: 'com.adobe.pdf',
  });
}
