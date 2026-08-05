/**
 * exportPrepPdf.ts — web path. This is the bug fix: expo-print (v15.0.8)'s
 * web implementation ignores the `html`/`uri` options entirely and just
 * calls bare `window.print()` — `printToFileAsync` resolves to `undefined`
 * (no `{uri}`), and even `printAsync` would print whatever's currently
 * rendered on screen, not the built sermon document. So on web this module
 * never touches expo-print at all: it prints the ALREADY-BUILT html string
 * itself via a hidden iframe + the browser's native print dialog.
 *
 * `Platform.OS` is forced to 'web' for this whole file via the `react-native`
 * mock below (this project's jest platform otherwise defaults to 'ios').
 * Each test calls `jest.resetModules()` then re-requires the module under
 * test, since `exportPrepPdf.ts` caches one hidden iframe at module scope
 * (intentionally, to avoid tearing it down mid-print) — a fresh module
 * instance per test keeps that cache from leaking between tests.
 */

jest.mock('react-native', () => ({Platform: {OS: 'web'}}));

const mockPrintToFile = jest.fn();
jest.mock('expo-print', () => ({
  printToFileAsync: (...args: unknown[]) => mockPrintToFile(...args),
}));

const mockSharePreparedPdf = jest.fn();
jest.mock('../src/features/study/sharePdf', () => ({
  sharePreparedPdf: (...args: unknown[]) => mockSharePreparedPdf(...args),
}));

type FakeIframe = {
  style: Record<string, string>;
  setAttribute: jest.Mock;
  onload: (() => void) | null;
  contentWindow: {focus: jest.Mock; print: jest.Mock} | null;
  parentNode: unknown;
  srcdoc?: string;
};

/** A minimal `document` stand-in — this project's jest env is Node, no jsdom. */
function makeFakeDocument(iframe: FakeIframe) {
  return {
    createElement: jest.fn(() => iframe),
    body: {
      appendChild: jest.fn(() => {
        iframe.parentNode = fakeDocument.body;
      }),
      removeChild: jest.fn(),
    },
  } as unknown as Document;
}
let fakeDocument: ReturnType<typeof makeFakeDocument>;

function requireFreshModule() {
  jest.resetModules();
  return require('../src/features/study/exportPrepPdf') as typeof import('../src/features/study/exportPrepPdf');
}

describe('exportPreparedPdf — web', () => {
  const originalDocument = (global as {document?: unknown}).document;

  afterEach(() => {
    mockPrintToFile.mockReset();
    mockSharePreparedPdf.mockReset();
    (global as {document?: unknown}).document = originalDocument;
  });

  it('resolves false without throwing when `document` is unavailable', async () => {
    delete (global as {document?: unknown}).document;
    const {exportPreparedPdf} = requireFreshModule();

    const ok = await exportPreparedPdf('<html></html>', 'name', 'title');

    expect(ok).toBe(false);
    expect(mockPrintToFile).not.toHaveBeenCalled();
    expect(mockSharePreparedPdf).not.toHaveBeenCalled();
  });

  it('prints the already-built HTML via a hidden iframe + the browser print dialog — never expo-print', async () => {
    const mockPrint = jest.fn();
    const mockFocus = jest.fn();
    const iframe: FakeIframe = {
      style: {},
      setAttribute: jest.fn(),
      onload: null,
      contentWindow: {focus: mockFocus, print: mockPrint},
      parentNode: null,
    };
    // Simulate the browser firing `load` once the iframe's document is set.
    Object.defineProperty(iframe, 'srcdoc', {
      set(value: string) {
        this._srcdoc = value;
        this.onload?.();
      },
      get() {
        return this._srcdoc;
      },
    });
    fakeDocument = makeFakeDocument(iframe);
    (global as {document?: unknown}).document = fakeDocument;

    const {exportPreparedPdf} = requireFreshModule();
    const ok = await exportPreparedPdf(
      '<html>bosquejo</html>',
      'Juan 3.16-21',
      'Compartir bosquejo en PDF',
    );

    expect(ok).toBe(true);
    expect(fakeDocument.body.appendChild).toHaveBeenCalledWith(iframe);
    expect(mockFocus).toHaveBeenCalledTimes(1);
    expect(mockPrint).toHaveBeenCalledTimes(1);
    // The actual bug fix: web export must NEVER go through expo-print or the
    // native share sheet — the print dialog itself is the export on web.
    expect(mockPrintToFile).not.toHaveBeenCalled();
    expect(mockSharePreparedPdf).not.toHaveBeenCalled();
  });

  it('resolves false when contentWindow.print() itself throws', async () => {
    const iframe: FakeIframe = {
      style: {},
      setAttribute: jest.fn(),
      onload: null,
      contentWindow: {
        focus: jest.fn(),
        print: jest.fn(() => {
          throw new Error('print failed');
        }),
      },
      parentNode: null,
    };
    Object.defineProperty(iframe, 'srcdoc', {
      set(value: string) {
        this._srcdoc = value;
        this.onload?.();
      },
      get() {
        return this._srcdoc;
      },
    });
    fakeDocument = makeFakeDocument(iframe);
    (global as {document?: unknown}).document = fakeDocument;

    const {exportPreparedPdf} = requireFreshModule();
    const ok = await exportPreparedPdf('<html></html>', 'name', 'title');

    expect(ok).toBe(false);
  });

  it('resolves false when the iframe never gets a contentWindow', async () => {
    const iframe: FakeIframe = {
      style: {},
      setAttribute: jest.fn(),
      onload: null,
      contentWindow: null,
      parentNode: null,
    };
    Object.defineProperty(iframe, 'srcdoc', {
      set(value: string) {
        this._srcdoc = value;
        this.onload?.();
      },
      get() {
        return this._srcdoc;
      },
    });
    fakeDocument = makeFakeDocument(iframe);
    (global as {document?: unknown}).document = fakeDocument;

    const {exportPreparedPdf} = requireFreshModule();
    const ok = await exportPreparedPdf('<html></html>', 'name', 'title');

    expect(ok).toBe(false);
  });
});
