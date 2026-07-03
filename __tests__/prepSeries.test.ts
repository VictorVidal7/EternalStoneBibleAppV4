/**
 * T8.4.4 — pure logic behind the "Series de predicación" planner: creating,
 * renaming, adding/removing/reordering passages, deleting, progress
 * computation, defensive parse/serialize, and the free-text reference
 * parser that produces the canonical `passageKey`.
 */
import {
  MAX_PASSAGES_PER_SERIES,
  MAX_SERIES,
  MAX_SERIES_NAME_LENGTH,
  addPassageToSeries,
  canAddPassage,
  canCreateSeries,
  computeSeriesProgress,
  createSeries,
  deleteSeries,
  emptySeriesMap,
  generateSeriesId,
  listSeries,
  moveSeriesPassage,
  parsePrepSeriesMap,
  passageKeyFromReference,
  removePassageFromSeries,
  renameSeries,
  serializePrepSeriesMap,
  type PrepSeries,
  type PrepSeriesMap,
} from '../src/features/study/prepSeries';
import type {PrepNotesMap} from '../src/features/study/prepNotes';

function series(overrides: Partial<PrepSeries> = {}): PrepSeries {
  return {
    id: 'series_1',
    name: 'Efesios en 8 semanas',
    passageKeys: [],
    createdAt: 1,
    updatedAt: 1,
    ...overrides,
  };
}

describe('generateSeriesId', () => {
  it('produces unique, prefixed ids', () => {
    const a = generateSeriesId();
    const b = generateSeriesId();
    expect(a).not.toBe(b);
    expect(a.startsWith('series_')).toBe(true);
  });
});

describe('canCreateSeries / canAddPassage', () => {
  it('allows creating a series under the cap', () => {
    expect(canCreateSeries(emptySeriesMap())).toBe(true);
  });

  it('refuses creating a series at MAX_SERIES', () => {
    const map: PrepSeriesMap = {};
    for (let i = 0; i < MAX_SERIES; i++) {
      map[`s${i}`] = series({id: `s${i}`});
    }
    expect(Object.keys(map)).toHaveLength(MAX_SERIES);
    expect(canCreateSeries(map)).toBe(false);
  });

  it('allows adding a passage under the per-series cap', () => {
    expect(canAddPassage(series())).toBe(true);
  });

  it('refuses adding a passage at MAX_PASSAGES_PER_SERIES', () => {
    const full = series({
      passageKeys: Array.from(
        {length: MAX_PASSAGES_PER_SERIES},
        (_, i) => `Book/${i}/1`,
      ),
    });
    expect(canAddPassage(full)).toBe(false);
  });
});

describe('createSeries', () => {
  it('creates a series with a trimmed name and empty passages by default', () => {
    const map = createSeries(emptySeriesMap(), '  Efesios  ', [], 100, 'id1');
    expect(map.id1).toEqual({
      id: 'id1',
      name: 'Efesios',
      passageKeys: [],
      createdAt: 100,
      updatedAt: 100,
    });
  });

  it('creates a series with an initial passage list, deduped and capped', () => {
    const map = createSeries(
      emptySeriesMap(),
      'Juan',
      ['John/1/1', 'John/1/1', 'John/3/16'],
      100,
      'id1',
    );
    expect(map.id1.passageKeys).toEqual(['John/1/1', 'John/3/16']);
  });

  it('caps an oversized initial passage list at MAX_PASSAGES_PER_SERIES', () => {
    const many = Array.from(
      {length: MAX_PASSAGES_PER_SERIES + 10},
      (_, i) => `Book/${i}/1`,
    );
    const map = createSeries(emptySeriesMap(), 'Long series', many, 1, 'id1');
    expect(map.id1.passageKeys).toHaveLength(MAX_PASSAGES_PER_SERIES);
  });

  it('is a no-op for a blank name', () => {
    const map = emptySeriesMap();
    expect(createSeries(map, '   ')).toBe(map);
    expect(createSeries(map, '')).toBe(map);
  });

  it('is a no-op once MAX_SERIES is reached', () => {
    let map: PrepSeriesMap = {};
    for (let i = 0; i < MAX_SERIES; i++) {
      map = createSeries(map, `Series ${i}`, [], i, `id${i}`);
    }
    const before = map;
    map = createSeries(map, 'One too many', [], 999, 'overflow');
    expect(map).toBe(before);
    expect(map.overflow).toBeUndefined();
  });

  it('clamps an overlong name to MAX_SERIES_NAME_LENGTH', () => {
    const long = 'x'.repeat(200);
    const map = createSeries(emptySeriesMap(), long, [], 1, 'id1');
    expect(map.id1.name.length).toBe(MAX_SERIES_NAME_LENGTH);
  });
});

describe('renameSeries', () => {
  it('renames an existing series and bumps updatedAt', () => {
    const map: PrepSeriesMap = {id1: series({updatedAt: 1})};
    const next = renameSeries(map, 'id1', '  Nuevo nombre  ', 200);
    expect(next.id1.name).toBe('Nuevo nombre');
    expect(next.id1.updatedAt).toBe(200);
  });

  it('is a no-op for an unknown id', () => {
    const map: PrepSeriesMap = {id1: series()};
    expect(renameSeries(map, 'nope', 'X')).toBe(map);
  });

  it('is a no-op for a blank name', () => {
    const map: PrepSeriesMap = {id1: series()};
    expect(renameSeries(map, 'id1', '   ')).toBe(map);
  });
});

describe('addPassageToSeries', () => {
  it('appends a passage and bumps updatedAt', () => {
    const map: PrepSeriesMap = {id1: series({passageKeys: ['John/1/1']})};
    const next = addPassageToSeries(map, 'id1', 'John/3/16', 200);
    expect(next.id1.passageKeys).toEqual(['John/1/1', 'John/3/16']);
    expect(next.id1.updatedAt).toBe(200);
  });

  it('does not duplicate an already-present passage', () => {
    const map: PrepSeriesMap = {id1: series({passageKeys: ['John/1/1']})};
    expect(addPassageToSeries(map, 'id1', 'John/1/1')).toBe(map);
  });

  it('is a no-op for an unknown series id', () => {
    const map: PrepSeriesMap = {id1: series()};
    expect(addPassageToSeries(map, 'nope', 'John/1/1')).toBe(map);
  });

  it('is a no-op once the series is at MAX_PASSAGES_PER_SERIES', () => {
    const full = series({
      passageKeys: Array.from(
        {length: MAX_PASSAGES_PER_SERIES},
        (_, i) => `Book/${i}/1`,
      ),
    });
    const map: PrepSeriesMap = {id1: full};
    expect(addPassageToSeries(map, 'id1', 'Book/999/1')).toBe(map);
  });
});

describe('removePassageFromSeries', () => {
  it('removes a passage and bumps updatedAt', () => {
    const map: PrepSeriesMap = {
      id1: series({passageKeys: ['John/1/1', 'John/3/16']}),
    };
    const next = removePassageFromSeries(map, 'id1', 'John/1/1', 200);
    expect(next.id1.passageKeys).toEqual(['John/3/16']);
    expect(next.id1.updatedAt).toBe(200);
  });

  it('is a no-op when the passage is not in the series', () => {
    const map: PrepSeriesMap = {id1: series({passageKeys: ['John/3/16']})};
    expect(removePassageFromSeries(map, 'id1', 'John/1/1')).toBe(map);
  });

  it('is a no-op for an unknown series id', () => {
    const map: PrepSeriesMap = {id1: series({passageKeys: ['John/1/1']})};
    expect(removePassageFromSeries(map, 'nope', 'John/1/1')).toBe(map);
  });
});

describe('moveSeriesPassage', () => {
  const base: PrepSeriesMap = {
    id1: series({passageKeys: ['A/1/1', 'B/1/1', 'C/1/1']}),
  };

  it('moves a passage up (earlier) one slot', () => {
    const next = moveSeriesPassage(base, 'id1', 'B/1/1', 'up', 200);
    expect(next.id1.passageKeys).toEqual(['B/1/1', 'A/1/1', 'C/1/1']);
    expect(next.id1.updatedAt).toBe(200);
  });

  it('moves a passage down (later) one slot', () => {
    const next = moveSeriesPassage(base, 'id1', 'B/1/1', 'down', 200);
    expect(next.id1.passageKeys).toEqual(['A/1/1', 'C/1/1', 'B/1/1']);
  });

  it('is a no-op moving the first passage up', () => {
    expect(moveSeriesPassage(base, 'id1', 'A/1/1', 'up')).toBe(base);
  });

  it('is a no-op moving the last passage down', () => {
    expect(moveSeriesPassage(base, 'id1', 'C/1/1', 'down')).toBe(base);
  });

  it('is a no-op for an unknown passage', () => {
    expect(moveSeriesPassage(base, 'id1', 'Z/1/1', 'up')).toBe(base);
  });

  it('is a no-op for an unknown series id', () => {
    expect(moveSeriesPassage(base, 'nope', 'A/1/1', 'up')).toBe(base);
  });
});

describe('deleteSeries', () => {
  it('removes a series from the map', () => {
    const map: PrepSeriesMap = {id1: series(), id2: series({id: 'id2'})};
    const next = deleteSeries(map, 'id1');
    expect(next.id1).toBeUndefined();
    expect(next.id2).toBeDefined();
  });

  it('is a no-op for an unknown id', () => {
    const map: PrepSeriesMap = {id1: series()};
    expect(deleteSeries(map, 'nope')).toBe(map);
  });
});

describe('listSeries', () => {
  it('sorts by updatedAt descending', () => {
    const map: PrepSeriesMap = {
      a: series({id: 'a', updatedAt: 100}),
      b: series({id: 'b', updatedAt: 300}),
      c: series({id: 'c', updatedAt: 200}),
    };
    expect(listSeries(map).map(s => s.id)).toEqual(['b', 'c', 'a']);
  });

  it('returns an empty array for an empty map', () => {
    expect(listSeries(emptySeriesMap())).toEqual([]);
  });
});

describe('computeSeriesProgress', () => {
  it('counts passages whose prep notes are non-empty', () => {
    const s = series({passageKeys: ['John/1/1', 'John/3/16', 'Romans/8/28']});
    const notesMap: PrepNotesMap = {
      'John/1/1': {sections: {context: 'En el principio'}, updatedAt: 1},
      'John/3/16': {sections: {}, updatedAt: 0}, // empty sections
    };
    expect(computeSeriesProgress(s, notesMap)).toEqual({total: 3, started: 1});
  });

  it('reports zero started for a series with no notes at all', () => {
    const s = series({passageKeys: ['John/1/1']});
    expect(computeSeriesProgress(s, {})).toEqual({total: 1, started: 0});
  });

  it('reports zero total for an empty series', () => {
    expect(computeSeriesProgress(series(), {})).toEqual({total: 0, started: 0});
  });
});

describe('parsePrepSeriesMap / serializePrepSeriesMap', () => {
  it('round-trips a well-formed map', () => {
    const map: PrepSeriesMap = {
      id1: series({id: 'id1', passageKeys: ['John/3/16']}),
    };
    const raw = serializePrepSeriesMap(map);
    expect(parsePrepSeriesMap(raw)).toEqual(map);
  });

  it('returns an empty map for null/undefined/empty input', () => {
    expect(parsePrepSeriesMap(null)).toEqual({});
    expect(parsePrepSeriesMap(undefined)).toEqual({});
    expect(parsePrepSeriesMap('')).toEqual({});
  });

  it('returns an empty map for invalid JSON rather than throwing', () => {
    expect(parsePrepSeriesMap('{not json')).toEqual({});
  });

  it('returns an empty map for a non-object JSON root', () => {
    expect(parsePrepSeriesMap('42')).toEqual({});
    expect(parsePrepSeriesMap('"a string"')).toEqual({});
    expect(parsePrepSeriesMap('null')).toEqual({});
  });

  it('drops an entry missing a valid id', () => {
    const raw = JSON.stringify({
      bad: {name: 'No id', passageKeys: [], createdAt: 1, updatedAt: 1},
    });
    expect(parsePrepSeriesMap(raw)).toEqual({});
  });

  it('drops an entry with a blank name', () => {
    const raw = JSON.stringify({
      id1: {
        id: 'id1',
        name: '   ',
        passageKeys: [],
        createdAt: 1,
        updatedAt: 1,
      },
    });
    expect(parsePrepSeriesMap(raw)).toEqual({});
  });

  it("keys the result by each entry's own id, not the raw JSON key", () => {
    const raw = JSON.stringify({
      mismatchedKey: {
        id: 'realId',
        name: 'Real',
        passageKeys: [],
        createdAt: 1,
        updatedAt: 1,
      },
    });
    const map = parsePrepSeriesMap(raw);
    expect(map.realId).toBeDefined();
    expect(map.mismatchedKey).toBeUndefined();
  });

  it('drops non-string passageKeys and dedupes/caps the rest', () => {
    const raw = JSON.stringify({
      id1: {
        id: 'id1',
        name: 'X',
        passageKeys: ['John/1/1', 42, 'John/1/1', null, 'John/3/16'],
        createdAt: 1,
        updatedAt: 1,
      },
    });
    expect(parsePrepSeriesMap(raw).id1.passageKeys).toEqual([
      'John/1/1',
      'John/3/16',
    ]);
  });

  it('defaults a non-array passageKeys to an empty array', () => {
    const raw = JSON.stringify({
      id1: {
        id: 'id1',
        name: 'X',
        passageKeys: 'not-an-array',
        createdAt: 1,
        updatedAt: 1,
      },
    });
    expect(parsePrepSeriesMap(raw).id1.passageKeys).toEqual([]);
  });

  it('defaults a missing/invalid createdAt/updatedAt to 0', () => {
    const raw = JSON.stringify({
      id1: {id: 'id1', name: 'X', passageKeys: []},
    });
    const parsed = parsePrepSeriesMap(raw).id1;
    expect(parsed.createdAt).toBe(0);
    expect(parsed.updatedAt).toBe(0);
  });

  it('caps the number of series read at MAX_SERIES', () => {
    const raw: Record<string, unknown> = {};
    for (let i = 0; i < MAX_SERIES + 5; i++) {
      raw[`id${i}`] = {
        id: `id${i}`,
        name: `Series ${i}`,
        passageKeys: [],
        createdAt: i,
        updatedAt: i,
      };
    }
    const parsed = parsePrepSeriesMap(JSON.stringify(raw));
    expect(Object.keys(parsed)).toHaveLength(MAX_SERIES);
  });

  it('skips a single corrupt entry without losing the rest of the map', () => {
    const raw = JSON.stringify({
      good: {
        id: 'good',
        name: 'Good',
        passageKeys: [],
        createdAt: 1,
        updatedAt: 1,
      },
      bad: 'not an object',
    });
    const parsed = parsePrepSeriesMap(raw);
    expect(Object.keys(parsed)).toEqual(['good']);
  });
});

describe('passageKeyFromReference', () => {
  it('parses a single-verse Spanish reference', () => {
    expect(passageKeyFromReference('Juan 3:16')).toBe('John/3/16');
  });

  it('parses a verse-range reference', () => {
    expect(passageKeyFromReference('Juan 3:16-21')).toBe('John/3/16-21');
  });

  it('parses an English reference', () => {
    expect(passageKeyFromReference('Romans 8:28-30')).toBe('Romans/8/28-30');
  });

  it('parses an abbreviation', () => {
    expect(passageKeyFromReference('Gen 1:1')).toBe('Genesis/1/1');
  });

  it('returns null for a chapter-only reference (no verse)', () => {
    expect(passageKeyFromReference('Juan 3')).toBeNull();
  });

  it('returns null for unparseable text', () => {
    expect(passageKeyFromReference('not a reference')).toBeNull();
  });

  it('returns null for an out-of-range chapter', () => {
    expect(passageKeyFromReference('Juan 999:1')).toBeNull();
  });

  it('returns null for an empty string', () => {
    expect(passageKeyFromReference('')).toBeNull();
  });
});
