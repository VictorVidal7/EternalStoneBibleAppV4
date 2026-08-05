/**
 * Sprint 84 — reader font loader perf fix.
 *
 * `loadReaderFonts()` used to be the ONLY loader: it registers all 18 bundled
 * `.ttf` files (9 families × Regular/Bold) via a single `Font.loadAsync`
 * call. On native that's fine (fired unawaited in a background `Promise.all`
 * — see `app/_layout.tsx`), but on web, `expo-font`'s loader forces an eager
 * fetch of every family it's asked to load — so calling it there downloaded
 * the whole ~3.58MB catalog on every page load, and `app/_layout.web.tsx`
 * used to `await` it before clearing the loading screen, blocking first
 * paint on top of that.
 *
 * This test proves the fix at the loader level: `loadFontFamily(id)` asks
 * `Font.loadAsync` for exactly that one family's two files (never the other
 * 16), while `loadReaderFonts()` still asks for all 18 (native's contract,
 * unchanged).
 */
import * as Font from 'expo-font';
import {
  READER_FONT_ASSETS,
  loadReaderFonts,
  loadFontFamily,
} from '../src/lib/reader/fontAssets';

jest.mock('expo-font', () => ({
  loadAsync: jest.fn(() => Promise.resolve()),
}));

const mockLoadAsync = Font.loadAsync as jest.Mock;

describe('reader fontAssets loader (Sprint 84 — web perf fix)', () => {
  beforeEach(() => {
    mockLoadAsync.mockClear();
  });

  it('loadReaderFonts() (native path) requests all 18 bundled files', async () => {
    await loadReaderFonts();

    expect(mockLoadAsync).toHaveBeenCalledTimes(1);
    const requested = mockLoadAsync.mock.calls[0][0];
    expect(Object.keys(requested)).toHaveLength(18);
    expect(requested).toBe(READER_FONT_ASSETS);
  });

  it('loadFontFamily("sans") (web startup path) requests only Inter Regular+Bold', async () => {
    await loadFontFamily('sans');

    expect(mockLoadAsync).toHaveBeenCalledTimes(1);
    const requested = mockLoadAsync.mock.calls[0][0];
    expect(Object.keys(requested).sort()).toEqual(
      ['Inter_400Regular', 'Inter_700Bold'].sort(),
    );
  });

  it('loadFontFamily("slab") (an offering-unlocked family) requests only its own 2 files', async () => {
    await loadFontFamily('slab');

    const requested = mockLoadAsync.mock.calls[0][0];
    expect(Object.keys(requested).sort()).toEqual(
      ['RobotoSlab_400Regular', 'RobotoSlab_700Bold'].sort(),
    );
  });

  it('loadFontFamily can be called again on demand for a second family (lazy load, not "never loadable")', async () => {
    await loadFontFamily('sans');
    await loadFontFamily('serif');

    expect(mockLoadAsync).toHaveBeenCalledTimes(2);
    expect(Object.keys(mockLoadAsync.mock.calls[1][0]).sort()).toEqual(
      ['Lora_400Regular', 'Lora_700Bold'].sort(),
    );
  });

  it('every family in the catalog resolves to exactly 2 distinct real font-asset keys', async () => {
    const {READER_FONT_FAMILY_ORDER} = jest.requireActual(
      '../src/lib/reader/typefaces',
    );
    for (const id of READER_FONT_FAMILY_ORDER as string[]) {
      mockLoadAsync.mockClear();
      await loadFontFamily(id as Parameters<typeof loadFontFamily>[0]);
      const keys = Object.keys(mockLoadAsync.mock.calls[0][0]);
      expect(keys).toHaveLength(2);
      for (const key of keys) {
        expect(
          Object.prototype.hasOwnProperty.call(READER_FONT_ASSETS, key),
        ).toBe(true);
      }
    }
  });

  it('falls back to sans for an unrecognized family id (corrupt persisted value)', async () => {
    // @ts-expect-error — intentionally an invalid id, mirroring how a
    // corrupted AsyncStorage blob could slip past isReaderFontFamily.
    await loadFontFamily('not-a-real-family');

    const requested = mockLoadAsync.mock.calls[0][0];
    expect(Object.keys(requested).sort()).toEqual(
      ['Inter_400Regular', 'Inter_700Bold'].sort(),
    );
  });
});
