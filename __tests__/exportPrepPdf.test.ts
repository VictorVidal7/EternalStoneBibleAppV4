/**
 * exportPrepPdf.ts — native (iOS/Android) path. Runs under this project's
 * default jest test platform ('ios', per react-native's jest-preset haste
 * config), so `Platform.OS === 'web'` is false here and every call goes
 * through the pre-existing `Print.printToFileAsync` + `sharePreparedPdf`
 * pair, unchanged from before `exportPrepPdf.ts` existed.
 *
 * See exportPrepPdfWeb.test.ts for the web path this module was written to
 * fix (expo-print's web implementation silently no-ops there).
 */
import {exportPreparedPdf} from '../src/features/study/exportPrepPdf';

const mockPrintToFile = jest.fn();
jest.mock('expo-print', () => ({
  printToFileAsync: (...args: unknown[]) => mockPrintToFile(...args),
}));

const mockSharePreparedPdf = jest.fn();
jest.mock('../src/features/study/sharePdf', () => ({
  sharePreparedPdf: (...args: unknown[]) => mockSharePreparedPdf(...args),
}));

describe('exportPreparedPdf — native', () => {
  beforeEach(() => {
    mockPrintToFile.mockReset();
    mockSharePreparedPdf.mockReset();
  });

  it('writes a real PDF file via expo-print and shares it under the given name, resolving true', async () => {
    mockPrintToFile.mockResolvedValue({uri: 'file:///mock.pdf'});

    const ok = await exportPreparedPdf(
      '<html>hola</html>',
      'Juan 3.16-21',
      'Compartir bosquejo en PDF',
    );

    expect(ok).toBe(true);
    expect(mockPrintToFile).toHaveBeenCalledWith({
      html: '<html>hola</html>',
      base64: false,
    });
    expect(mockSharePreparedPdf).toHaveBeenCalledWith(
      'file:///mock.pdf',
      'Juan 3.16-21',
      'Compartir bosquejo en PDF',
    );
  });

  it('propagates a thrown error the same way the old inline call did (caller catches it)', async () => {
    mockPrintToFile.mockRejectedValue(new Error('native print failed'));

    await expect(
      exportPreparedPdf('<html></html>', 'name', 'title'),
    ).rejects.toThrow('native print failed');
    expect(mockSharePreparedPdf).not.toHaveBeenCalled();
  });
});
