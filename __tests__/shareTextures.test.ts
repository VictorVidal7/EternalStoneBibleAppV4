import {
  SHARE_TEXTURES,
  isTextureUnlocked,
} from '../src/features/share/textures';

describe('SHARE_TEXTURES', () => {
  it('lists none first, followed by the pattern options', () => {
    expect(SHARE_TEXTURES[0]).toBe('none');
    expect(SHARE_TEXTURES).toEqual(['none', 'dots', 'lines', 'grain']);
  });
});

describe('isTextureUnlocked', () => {
  it('"none" is always unlocked', () => {
    expect(isTextureUnlocked('none', false)).toBe(true);
    expect(isTextureUnlocked('none', true)).toBe(true);
  });

  it('every real texture requires premium', () => {
    expect(isTextureUnlocked('dots', false)).toBe(false);
    expect(isTextureUnlocked('lines', false)).toBe(false);
    expect(isTextureUnlocked('grain', false)).toBe(false);
    expect(isTextureUnlocked('dots', true)).toBe(true);
    expect(isTextureUnlocked('lines', true)).toBe(true);
    expect(isTextureUnlocked('grain', true)).toBe(true);
  });
});
