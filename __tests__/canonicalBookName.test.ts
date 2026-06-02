import {canonicalBookName} from '../src/constants/bible';

describe('canonicalBookName', () => {
  it('maps a Spanish book name to its English canonical form', () => {
    expect(canonicalBookName('Génesis')).toBe('Genesis');
    expect(canonicalBookName('Juan')).toBe('John');
    expect(canonicalBookName('Éxodo')).toBe('Exodus');
    expect(canonicalBookName('Salmos')).toBe('Psalms');
  });

  it('leaves an already-canonical English name unchanged', () => {
    expect(canonicalBookName('Genesis')).toBe('Genesis');
    expect(canonicalBookName('John')).toBe('John');
  });

  it('is case-insensitive on input', () => {
    expect(canonicalBookName('génesis')).toBe('Genesis');
    expect(canonicalBookName('JUAN')).toBe('John');
  });

  it('collapses both language spellings of a verse to one key', () => {
    // The core of the Sprint 58 favorites/highlights bug: "Génesis" (from the
    // book grid / RVR1960) and "Genesis" (from a deep-link / KJV) must agree.
    expect(canonicalBookName('Génesis')).toBe(canonicalBookName('Genesis'));
    expect(canonicalBookName('Juan')).toBe(canonicalBookName('John'));
  });

  it('handles multi-word / numbered books', () => {
    expect(canonicalBookName('1 Juan')).toBe('1 John');
    expect(canonicalBookName('Cantares')).toBe('Song of Solomon');
  });

  it('passes unknown names through unchanged (defensive)', () => {
    expect(canonicalBookName('NotABook')).toBe('NotABook');
    expect(canonicalBookName('')).toBe('');
  });
});
