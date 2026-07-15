/**
 * Tanda 4 — pure logic behind the "Banco de ilustraciones": creating a blank
 * entry, editing its title/body/category, deleting, listing, searching,
 * category filtering, and defensive parse/serialize.
 */
import {
  DEFAULT_ILLUSTRATION_CATEGORY,
  ILLUSTRATION_CATEGORY_ORDER,
  MAX_ILLUSTRATIONS,
  MAX_ILLUSTRATION_BODY_LENGTH,
  MAX_ILLUSTRATION_TITLE_LENGTH,
  canCreateIllustration,
  createIllustration,
  deleteIllustration,
  emptyIllustrationsMap,
  filterIllustrationsByCategory,
  generateIllustrationId,
  isIllustrationCategory,
  isIllustrationEmpty,
  listIllustrations,
  parsePrepIllustrationsMap,
  searchIllustrations,
  serializePrepIllustrationsMap,
  setIllustrationBody,
  setIllustrationCategory,
  setIllustrationTitle,
  type PrepIllustration,
  type PrepIllustrationsMap,
} from '../src/features/study/prepIllustrations';

function illustration(
  overrides: Partial<PrepIllustration> = {},
): PrepIllustration {
  return {
    id: 'illustration_1',
    title: 'El reloj y el relojero',
    body: 'Un reloj implica un relojero...',
    category: 'analogy',
    createdAt: 1,
    updatedAt: 1,
    ...overrides,
  };
}

describe('ILLUSTRATION_CATEGORY_ORDER / isIllustrationCategory', () => {
  it('has exactly 7 distinct categories', () => {
    expect(ILLUSTRATION_CATEGORY_ORDER).toHaveLength(7);
    expect(new Set(ILLUSTRATION_CATEGORY_ORDER).size).toBe(7);
  });

  it('recognizes every listed category', () => {
    for (const c of ILLUSTRATION_CATEGORY_ORDER) {
      expect(isIllustrationCategory(c)).toBe(true);
    }
  });

  it('rejects unknown values', () => {
    expect(isIllustrationCategory('not-a-category')).toBe(false);
    expect(isIllustrationCategory(42)).toBe(false);
    expect(isIllustrationCategory(null)).toBe(false);
    expect(isIllustrationCategory(undefined)).toBe(false);
  });

  it('has a default category that is itself a valid category', () => {
    expect(isIllustrationCategory(DEFAULT_ILLUSTRATION_CATEGORY)).toBe(true);
  });
});

describe('generateIllustrationId', () => {
  it('produces unique, prefixed ids', () => {
    const a = generateIllustrationId();
    const b = generateIllustrationId();
    expect(a).not.toBe(b);
    expect(a.startsWith('illustration_')).toBe(true);
  });
});

describe('canCreateIllustration', () => {
  it('allows creating under the cap', () => {
    expect(canCreateIllustration(emptyIllustrationsMap())).toBe(true);
  });

  it('refuses creating at MAX_ILLUSTRATIONS', () => {
    const map: PrepIllustrationsMap = {};
    for (let i = 0; i < MAX_ILLUSTRATIONS; i++) {
      map[`i${i}`] = illustration({id: `i${i}`});
    }
    expect(Object.keys(map)).toHaveLength(MAX_ILLUSTRATIONS);
    expect(canCreateIllustration(map)).toBe(false);
  });
});

describe('createIllustration', () => {
  it('creates a BLANK illustration (no name required upfront)', () => {
    const map = createIllustration(emptyIllustrationsMap(), 100, 'id1');
    expect(map.id1).toEqual({
      id: 'id1',
      title: '',
      body: '',
      category: DEFAULT_ILLUSTRATION_CATEGORY,
      createdAt: 100,
      updatedAt: 100,
    });
  });

  it('creates with an explicit valid category', () => {
    const map = createIllustration(
      emptyIllustrationsMap(),
      100,
      'id1',
      'humor',
    );
    expect(map.id1.category).toBe('humor');
  });

  it('falls back to the default category for an invalid one', () => {
    const map = createIllustration(
      emptyIllustrationsMap(),
      100,
      'id1',
      'bogus' as never,
    );
    expect(map.id1.category).toBe(DEFAULT_ILLUSTRATION_CATEGORY);
  });

  it('is a no-op once MAX_ILLUSTRATIONS is reached', () => {
    let map: PrepIllustrationsMap = {};
    for (let i = 0; i < MAX_ILLUSTRATIONS; i++) {
      map = createIllustration(map, i, `id${i}`);
    }
    const before = map;
    map = createIllustration(map, 999, 'overflow');
    expect(map).toBe(before);
    expect(map.overflow).toBeUndefined();
  });
});

describe('setIllustrationTitle / setIllustrationBody / setIllustrationCategory', () => {
  it('sets the title, trims it, and bumps updatedAt', () => {
    const map: PrepIllustrationsMap = {id1: illustration({updatedAt: 1})};
    const next = setIllustrationTitle(map, 'id1', '  Nuevo título  ', 200);
    expect(next.id1.title).toBe('Nuevo título');
    expect(next.id1.updatedAt).toBe(200);
  });

  it('clamps an overlong title to MAX_ILLUSTRATION_TITLE_LENGTH', () => {
    const long = 'x'.repeat(300);
    const map: PrepIllustrationsMap = {id1: illustration()};
    const next = setIllustrationTitle(map, 'id1', long, 2);
    expect(next.id1.title).toHaveLength(MAX_ILLUSTRATION_TITLE_LENGTH);
  });

  it('is a no-op setting the title of an unknown id', () => {
    const map: PrepIllustrationsMap = {id1: illustration()};
    expect(setIllustrationTitle(map, 'nope', 'X')).toBe(map);
  });

  it('sets the body, trims it, and bumps updatedAt', () => {
    const map: PrepIllustrationsMap = {id1: illustration({updatedAt: 1})};
    const next = setIllustrationBody(map, 'id1', '  Un cuerpo nuevo  ', 200);
    expect(next.id1.body).toBe('Un cuerpo nuevo');
    expect(next.id1.updatedAt).toBe(200);
  });

  it('clamps an overlong body to MAX_ILLUSTRATION_BODY_LENGTH', () => {
    const long = 'x'.repeat(MAX_ILLUSTRATION_BODY_LENGTH + 500);
    const map: PrepIllustrationsMap = {id1: illustration()};
    const next = setIllustrationBody(map, 'id1', long, 2);
    expect(next.id1.body).toHaveLength(MAX_ILLUSTRATION_BODY_LENGTH);
  });

  it('is a no-op setting the body of an unknown id', () => {
    const map: PrepIllustrationsMap = {id1: illustration()};
    expect(setIllustrationBody(map, 'nope', 'X')).toBe(map);
  });

  it('sets a valid category and bumps updatedAt', () => {
    const map: PrepIllustrationsMap = {id1: illustration({category: 'humor'})};
    const next = setIllustrationCategory(map, 'id1', 'quote', 200);
    expect(next.id1.category).toBe('quote');
    expect(next.id1.updatedAt).toBe(200);
  });

  it('is a no-op for an invalid category', () => {
    const map: PrepIllustrationsMap = {id1: illustration()};
    expect(setIllustrationCategory(map, 'id1', 'bogus' as never)).toBe(map);
  });

  it('is a no-op setting the category of an unknown id', () => {
    const map: PrepIllustrationsMap = {id1: illustration()};
    expect(setIllustrationCategory(map, 'nope', 'humor')).toBe(map);
  });
});

describe('deleteIllustration', () => {
  it('removes an illustration from the map', () => {
    const map: PrepIllustrationsMap = {
      id1: illustration(),
      id2: illustration({id: 'id2'}),
    };
    const next = deleteIllustration(map, 'id1');
    expect(next.id1).toBeUndefined();
    expect(next.id2).toBeDefined();
  });

  it('is a no-op for an unknown id', () => {
    const map: PrepIllustrationsMap = {id1: illustration()};
    expect(deleteIllustration(map, 'nope')).toBe(map);
  });
});

describe('listIllustrations', () => {
  it('sorts by updatedAt descending', () => {
    const map: PrepIllustrationsMap = {
      a: illustration({id: 'a', updatedAt: 100}),
      b: illustration({id: 'b', updatedAt: 300}),
      c: illustration({id: 'c', updatedAt: 200}),
    };
    expect(listIllustrations(map).map(i => i.id)).toEqual(['b', 'c', 'a']);
  });

  it('returns an empty array for an empty map', () => {
    expect(listIllustrations(emptyIllustrationsMap())).toEqual([]);
  });
});

describe('searchIllustrations', () => {
  const list: PrepIllustration[] = [
    illustration({
      id: '1',
      title: 'El reloj y el relojero',
      body: 'Un argumento clásico',
    }),
    illustration({
      id: '2',
      title: 'La semilla de mostaza',
      body: 'Crece en fe',
    }),
    illustration({
      id: '3',
      title: 'Cita de Spurgeon',
      body: 'Sobre la ORACIÓN diaria',
    }),
  ];

  it('returns the full list for a blank query', () => {
    expect(searchIllustrations(list, '')).toEqual(list);
    expect(searchIllustrations(list, '   ')).toEqual(list);
  });

  it('matches case-insensitively on the title', () => {
    expect(searchIllustrations(list, 'RELOJ').map(i => i.id)).toEqual(['1']);
  });

  it('matches case-insensitively on the body', () => {
    expect(searchIllustrations(list, 'oración').map(i => i.id)).toEqual(['3']);
  });

  it('returns an empty array when nothing matches', () => {
    expect(searchIllustrations(list, 'xyz-no-match')).toEqual([]);
  });
});

describe('filterIllustrationsByCategory', () => {
  const list: PrepIllustration[] = [
    illustration({id: '1', category: 'historical'}),
    illustration({id: '2', category: 'humor'}),
    illustration({id: '3', category: 'historical'}),
  ];

  it("returns the full list for 'all'", () => {
    expect(filterIllustrationsByCategory(list, 'all')).toEqual(list);
  });

  it('filters to one category', () => {
    expect(
      filterIllustrationsByCategory(list, 'historical').map(i => i.id),
    ).toEqual(['1', '3']);
  });

  it('returns an empty array for a category with no matches', () => {
    expect(filterIllustrationsByCategory(list, 'quote')).toEqual([]);
  });
});

describe('isIllustrationEmpty', () => {
  it('is true for both blank', () => {
    expect(isIllustrationEmpty('', '')).toBe(true);
    expect(isIllustrationEmpty('   ', '  ')).toBe(true);
  });

  it('is false when either has content', () => {
    expect(isIllustrationEmpty('Título', '')).toBe(false);
    expect(isIllustrationEmpty('', 'Cuerpo')).toBe(false);
    expect(isIllustrationEmpty('Título', 'Cuerpo')).toBe(false);
  });
});

describe('parsePrepIllustrationsMap / serializePrepIllustrationsMap', () => {
  it('round-trips a well-formed map', () => {
    const map: PrepIllustrationsMap = {id1: illustration({id: 'id1'})};
    const raw = serializePrepIllustrationsMap(map);
    expect(parsePrepIllustrationsMap(raw)).toEqual(map);
  });

  it('round-trips a BLANK (freshly created, untouched) illustration', () => {
    const map = createIllustration(emptyIllustrationsMap(), 1, 'id1');
    const raw = serializePrepIllustrationsMap(map);
    expect(parsePrepIllustrationsMap(raw)).toEqual(map);
  });

  it('returns an empty map for null/undefined/empty input', () => {
    expect(parsePrepIllustrationsMap(null)).toEqual({});
    expect(parsePrepIllustrationsMap(undefined)).toEqual({});
    expect(parsePrepIllustrationsMap('')).toEqual({});
  });

  it('returns an empty map for invalid JSON rather than throwing', () => {
    expect(parsePrepIllustrationsMap('{not json')).toEqual({});
  });

  it('returns an empty map for a non-object JSON root', () => {
    expect(parsePrepIllustrationsMap('42')).toEqual({});
    expect(parsePrepIllustrationsMap('"a string"')).toEqual({});
    expect(parsePrepIllustrationsMap('null')).toEqual({});
  });

  it('drops an entry missing a valid id', () => {
    const raw = JSON.stringify({
      bad: {title: 'No id', body: '', category: 'humor'},
    });
    expect(parsePrepIllustrationsMap(raw)).toEqual({});
  });

  it("keys the result by each entry's own id, not the raw JSON key", () => {
    const raw = JSON.stringify({
      mismatchedKey: {
        id: 'realId',
        title: 'Real',
        body: '',
        category: 'humor',
        createdAt: 1,
        updatedAt: 1,
      },
    });
    const map = parsePrepIllustrationsMap(raw);
    expect(map.realId).toBeDefined();
    expect(map.mismatchedKey).toBeUndefined();
  });

  it('defaults an invalid/missing category to DEFAULT_ILLUSTRATION_CATEGORY', () => {
    const raw = JSON.stringify({
      id1: {id: 'id1', title: 'X', body: '', category: 'not-real'},
    });
    expect(parsePrepIllustrationsMap(raw).id1.category).toBe(
      DEFAULT_ILLUSTRATION_CATEGORY,
    );
  });

  it('defaults non-string title/body to empty strings rather than dropping the entry', () => {
    const raw = JSON.stringify({
      id1: {id: 'id1', title: 42, body: null, category: 'humor'},
    });
    const parsed = parsePrepIllustrationsMap(raw).id1;
    expect(parsed.title).toBe('');
    expect(parsed.body).toBe('');
  });

  it('defaults a missing/invalid createdAt/updatedAt to 0', () => {
    const raw = JSON.stringify({id1: {id: 'id1', title: 'X', body: 'Y'}});
    const parsed = parsePrepIllustrationsMap(raw).id1;
    expect(parsed.createdAt).toBe(0);
    expect(parsed.updatedAt).toBe(0);
  });

  it('caps the number of illustrations read at MAX_ILLUSTRATIONS', () => {
    const raw: Record<string, unknown> = {};
    for (let i = 0; i < MAX_ILLUSTRATIONS + 5; i++) {
      raw[`id${i}`] = {
        id: `id${i}`,
        title: `Illustration ${i}`,
        body: '',
        category: 'humor',
        createdAt: i,
        updatedAt: i,
      };
    }
    const parsed = parsePrepIllustrationsMap(JSON.stringify(raw));
    expect(Object.keys(parsed)).toHaveLength(MAX_ILLUSTRATIONS);
  });

  it('skips a single corrupt entry without losing the rest of the map', () => {
    const raw = JSON.stringify({
      good: {id: 'good', title: 'Good', body: '', category: 'humor'},
      bad: 'not an object',
    });
    const parsed = parsePrepIllustrationsMap(raw);
    expect(Object.keys(parsed)).toEqual(['good']);
  });

  it('clamps an overlong persisted title/body on parse', () => {
    const raw = JSON.stringify({
      id1: {
        id: 'id1',
        title: 'x'.repeat(300),
        body: 'y'.repeat(MAX_ILLUSTRATION_BODY_LENGTH + 500),
        category: 'humor',
      },
    });
    const parsed = parsePrepIllustrationsMap(raw).id1;
    expect(parsed.title).toHaveLength(MAX_ILLUSTRATION_TITLE_LENGTH);
    expect(parsed.body).toHaveLength(MAX_ILLUSTRATION_BODY_LENGTH);
  });
});
