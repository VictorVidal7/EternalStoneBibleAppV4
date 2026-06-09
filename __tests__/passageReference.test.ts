/**
 * Sprint 72 — pure passage reference + metadata for shared verse images.
 */

import {
  formatVerseList,
  buildPassageReference,
  passageMetaLine,
} from '../src/lib/reading/passageReference';

describe('formatVerseList', () => {
  it('returns a single number unchanged', () => {
    expect(formatVerseList([16])).toBe('16');
  });

  it('collapses a consecutive run into a range', () => {
    expect(formatVerseList([16, 17, 18])).toBe('16-18');
  });

  it('mixes singles and ranges', () => {
    expect(formatVerseList([1, 4, 5])).toBe('1,4-5');
    expect(formatVerseList([1, 2, 4, 6, 7, 8])).toBe('1-2,4,6-8');
  });

  it('sorts and de-duplicates unsorted input', () => {
    expect(formatVerseList([18, 16, 17, 16])).toBe('16-18');
  });

  it('returns an empty string for an empty list', () => {
    expect(formatVerseList([])).toBe('');
  });
});

describe('buildPassageReference', () => {
  it('composes a range reference', () => {
    expect(buildPassageReference('John', 3, [16, 17, 18])).toBe('John 3:16-18');
  });

  it('falls back to the chapter when nothing is selected', () => {
    expect(buildPassageReference('Salmos', 23, [])).toBe('Salmos 23');
  });
});

describe('passageMetaLine', () => {
  it('shows the version + count for a real passage', () => {
    expect(passageMetaLine('RVR1960', 3, 'versículos')).toBe(
      'RVR1960 · 3 versículos',
    );
  });

  it('shows only the version for a single verse', () => {
    expect(passageMetaLine('KJV', 1, 'verses')).toBe('KJV');
  });
});
