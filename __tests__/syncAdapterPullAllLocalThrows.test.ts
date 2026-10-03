/**
 * R9-257 — `pullAllLocal` de notas y subrayados LANZA cuando la lectura falla.
 *
 * Los dos atrapaban el fallo y devolvian `[]`. El bulk push no podia saber que
 * la lectura habia fallado: marcaba la cuenta como subida (`'2'`) sin haber
 * encolado esas filas, y no volvian a subir por esa via. Ahora el motor
 * registra el fallo y reintenta esa coleccion en el `start()` siguiente.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

const mockInitialize = jest.fn().mockResolvedValue(undefined);
const mockGetNotes = jest.fn();
const mockGetAllHighlights = jest.fn();

jest.mock('@lib/database', () => ({
  __esModule: true,
  default: {
    initialize: (...args: unknown[]) => mockInitialize(...args),
    getNotes: (...args: unknown[]) => mockGetNotes(...args),
  },
}));

jest.mock('@lib/highlights/HighlightService', () => ({
  HighlightService: jest.fn().mockImplementation(() => ({
    initialize: jest.fn().mockResolvedValue(undefined),
    getAllHighlights: (...args: unknown[]) => mockGetAllHighlights(...args),
  })),
}));

import {highlightsSyncAdapter} from '../src/lib/sync/adapters/highlights';
import {notesSyncAdapter} from '../src/lib/sync/adapters/notes';

beforeEach(() => {
  mockInitialize.mockClear().mockResolvedValue(undefined);
  mockGetNotes.mockReset();
  mockGetAllHighlights.mockReset();
});

describe('R9-257 — pullAllLocal lanza cuando la lectura falla', () => {
  it('notas: la lectura que falla rechaza; la sana devuelve las filas', async () => {
    mockGetNotes.mockResolvedValueOnce([]);
    // CONTROL: con la lectura sana, resuelve.
    await expect(notesSyncAdapter.pullAllLocal()).resolves.toEqual([]);

    mockGetNotes.mockRejectedValueOnce(new Error('SQLITE_BUSY'));
    // Pre-fix resolvia a `[]`.
    await expect(notesSyncAdapter.pullAllLocal()).rejects.toThrow(
      /SQLITE_BUSY/,
    );
  });

  it('subrayados: la lectura que falla rechaza; la sana devuelve las filas', async () => {
    mockGetAllHighlights.mockResolvedValueOnce([]);
    // CONTROL: con la lectura sana, resuelve.
    await expect(highlightsSyncAdapter.pullAllLocal()).resolves.toEqual([]);

    mockGetAllHighlights.mockRejectedValueOnce(new Error('SQLITE_BUSY'));
    // Pre-fix resolvia a `[]`.
    await expect(highlightsSyncAdapter.pullAllLocal()).rejects.toThrow(
      /SQLITE_BUSY/,
    );
  });
});
