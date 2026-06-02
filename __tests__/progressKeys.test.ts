import {
  canonicalProgressKey,
  canonicalizeProgressMap,
} from '../src/lib/progress/progressKeys';

describe('canonicalProgressKey', () => {
  it('maps any book spelling to the canonical English key', () => {
    expect(canonicalProgressKey('Juan')).toBe('John');
    expect(canonicalProgressKey('John')).toBe('John');
    expect(canonicalProgressKey('Génesis')).toBe('Genesis');
  });

  it('is the bridge that fixes the 0% bug: the writer key (Spanish) and the Home reader key (English) collapse to one', () => {
    // The reader persists under the Spanish bookInfo.name; the Home card reads
    // by the route param (English). Both must resolve to the same storage key.
    expect(canonicalProgressKey('Juan')).toBe(canonicalProgressKey('John'));
  });
});

describe('canonicalizeProgressMap', () => {
  it('re-keys legacy Spanish-keyed progress to canonical English', () => {
    const legacy = {Juan: {'3': 80}, Génesis: {'1': 50}};
    expect(canonicalizeProgressMap(legacy)).toEqual({
      John: {'3': 80},
      Genesis: {'1': 50},
    });
  });

  it('merges duplicate spellings of the same book, keeping the higher % per chapter', () => {
    const mixed = {
      Juan: {'3': 40, '4': 90},
      John: {'3': 75, '5': 20},
    };
    expect(canonicalizeProgressMap(mixed)).toEqual({
      John: {'3': 75, '4': 90, '5': 20},
    });
  });

  it('is idempotent', () => {
    const once = canonicalizeProgressMap({Juan: {'3': 80}});
    expect(canonicalizeProgressMap(once)).toEqual(once);
  });

  it('leaves already-canonical data unchanged', () => {
    const canonical = {Genesis: {'1': 100}, John: {'3': 60}};
    expect(canonicalizeProgressMap(canonical)).toEqual(canonical);
  });

  it('is defensive against null / malformed shapes', () => {
    expect(canonicalizeProgressMap(null)).toEqual({});
    expect(canonicalizeProgressMap(undefined)).toEqual({});
    // malformed inner values are dropped, not thrown on
    const bad = {Juan: {'3': 'x' as unknown as number, '4': 70}};
    expect(canonicalizeProgressMap(bad)).toEqual({John: {'4': 70}});
  });
});
