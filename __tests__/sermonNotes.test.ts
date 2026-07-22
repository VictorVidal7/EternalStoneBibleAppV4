/**
 * "Notas de sermón" (free tier) — pure logic behind sessions: creating,
 * editing, deleting, listing, deriving referenced verses from free-flowing
 * prose, the quick-insert reference formatter, and defensive parse/serialize.
 */
import {
  MAX_SESSIONS,
  MAX_SOURCE_LENGTH,
  MAX_TITLE_LENGTH,
  canCreateSession,
  createSession,
  defaultSessionTitle,
  deleteSession,
  emptySermonNotesMap,
  formatReferenceForInsert,
  formatReferencedVerseLabel,
  formatSessionDateLabel,
  generateSermonNoteId,
  getReferencedVerses,
  insertReferenceText,
  listSessions,
  parseSermonNotesMap,
  serializeSermonNotesMap,
  updateSession,
  type SermonNoteSession,
  type SermonNotesMap,
} from '../src/features/study/sermonNotes';

function session(
  overrides: Partial<SermonNoteSession> = {},
): SermonNoteSession {
  return {
    id: 'sermon_1',
    title: '22 jul 2026',
    bodyText: '',
    createdAt: 1,
    updatedAt: 1,
    ...overrides,
  };
}

describe('generateSermonNoteId', () => {
  it('produces unique, prefixed ids', () => {
    const a = generateSermonNoteId();
    const b = generateSermonNoteId();
    expect(a).not.toBe(b);
    expect(a.startsWith('sermon_')).toBe(true);
  });
});

describe('canCreateSession', () => {
  it('allows creating a session under the cap', () => {
    expect(canCreateSession(emptySermonNotesMap())).toBe(true);
  });

  it('refuses creating a session at MAX_SESSIONS', () => {
    const map: SermonNotesMap = {};
    for (let i = 0; i < MAX_SESSIONS; i++) {
      map[`s${i}`] = session({id: `s${i}`});
    }
    expect(Object.keys(map)).toHaveLength(MAX_SESSIONS);
    expect(canCreateSession(map)).toBe(false);
  });
});

describe('formatSessionDateLabel / defaultSessionTitle', () => {
  it('formats a Spanish date label from a local timestamp', () => {
    const ts = new Date(2026, 6, 22).getTime(); // 22 jul 2026, local time
    expect(formatSessionDateLabel(ts, 'es')).toBe('22 jul 2026');
  });

  it('formats an English date label from a local timestamp', () => {
    const ts = new Date(2026, 6, 22).getTime();
    expect(formatSessionDateLabel(ts, 'en')).toBe('Jul 22, 2026');
  });

  it('defaults the language to Spanish', () => {
    const ts = new Date(2026, 0, 5).getTime();
    expect(formatSessionDateLabel(ts)).toBe('5 ene 2026');
  });

  it("defaultSessionTitle is today's date label", () => {
    const ts = new Date(2026, 11, 1).getTime();
    expect(defaultSessionTitle(ts, 'es')).toBe('1 dic 2026');
  });
});

describe('createSession', () => {
  it('creates a session with a trimmed title, empty body, no source by default', () => {
    const map = createSession(
      emptySermonNotesMap(),
      '  Prédica de hoy  ',
      '',
      100,
      'id1',
    );
    expect(map.id1).toEqual({
      id: 'id1',
      title: 'Prédica de hoy',
      bodyText: '',
      createdAt: 100,
      updatedAt: 100,
    });
  });

  it('includes a trimmed source when provided', () => {
    const map = createSession(
      emptySermonNotesMap(),
      'Título',
      '  Iglesia Central — Pr. Juan  ',
      100,
      'id1',
    );
    expect(map.id1.source).toBe('Iglesia Central — Pr. Juan');
  });

  it('is a no-op for a blank title', () => {
    const map = emptySermonNotesMap();
    expect(createSession(map, '   ')).toBe(map);
    expect(createSession(map, '')).toBe(map);
  });

  it('is a no-op once MAX_SESSIONS is reached', () => {
    let map: SermonNotesMap = {};
    for (let i = 0; i < MAX_SESSIONS; i++) {
      map = createSession(map, `Nota ${i}`, '', i, `id${i}`);
    }
    const before = map;
    map = createSession(map, 'One too many', '', 999, 'overflow');
    expect(map).toBe(before);
    expect(map.overflow).toBeUndefined();
  });

  it('clamps an overlong title to MAX_TITLE_LENGTH', () => {
    const long = 'x'.repeat(200);
    const map = createSession(emptySermonNotesMap(), long, '', 1, 'id1');
    expect(map.id1.title.length).toBe(MAX_TITLE_LENGTH);
  });

  it('clamps an overlong source to MAX_SOURCE_LENGTH', () => {
    const long = 'x'.repeat(200);
    const map = createSession(emptySermonNotesMap(), 'T', long, 1, 'id1');
    expect(map.id1.source?.length).toBe(MAX_SOURCE_LENGTH);
  });
});

describe('updateSession', () => {
  it('updates the title and bumps updatedAt', () => {
    const map: SermonNotesMap = {id1: session({updatedAt: 1})};
    const next = updateSession(map, 'id1', {title: '  Nuevo título  '}, 200);
    expect(next.id1.title).toBe('Nuevo título');
    expect(next.id1.updatedAt).toBe(200);
  });

  it('ignores a blank title patch, keeping the previous title', () => {
    const map: SermonNotesMap = {id1: session({title: 'Original'})};
    const next = updateSession(map, 'id1', {title: '   '}, 200);
    expect(next.id1.title).toBe('Original');
    // Still bumps updatedAt — this is a real (if no-op-on-title) edit attempt.
    expect(next.id1.updatedAt).toBe(200);
  });

  it('sets a source', () => {
    const map: SermonNotesMap = {id1: session()};
    const next = updateSession(map, 'id1', {source: '  Iglesia X  '});
    expect(next.id1.source).toBe('Iglesia X');
  });

  it('clears a source with an empty string', () => {
    const map: SermonNotesMap = {id1: session({source: 'Iglesia X'})};
    const next = updateSession(map, 'id1', {source: '   '});
    expect(next.id1.source).toBeUndefined();
  });

  it('replaces the body text', () => {
    const map: SermonNotesMap = {id1: session({bodyText: 'old'})};
    const next = updateSession(map, 'id1', {bodyText: 'new prose'});
    expect(next.id1.bodyText).toBe('new prose');
  });

  it('allows an empty body text (does not fall back to the previous value)', () => {
    const map: SermonNotesMap = {id1: session({bodyText: 'old'})};
    const next = updateSession(map, 'id1', {bodyText: ''});
    expect(next.id1.bodyText).toBe('');
  });

  it('applies several fields at once', () => {
    const map: SermonNotesMap = {id1: session()};
    const next = updateSession(map, 'id1', {
      title: 'T',
      source: 'S',
      bodyText: 'B',
    });
    expect(next.id1).toMatchObject({title: 'T', source: 'S', bodyText: 'B'});
  });

  it('is a no-op for an unknown id', () => {
    const map: SermonNotesMap = {id1: session()};
    expect(updateSession(map, 'nope', {title: 'X'})).toBe(map);
  });
});

describe('deleteSession', () => {
  it('removes a session from the map', () => {
    const map: SermonNotesMap = {id1: session(), id2: session({id: 'id2'})};
    const next = deleteSession(map, 'id1');
    expect(next.id1).toBeUndefined();
    expect(next.id2).toBeDefined();
  });

  it('is a no-op for an unknown id', () => {
    const map: SermonNotesMap = {id1: session()};
    expect(deleteSession(map, 'nope')).toBe(map);
  });
});

describe('listSessions', () => {
  it('sorts by updatedAt descending', () => {
    const map: SermonNotesMap = {
      a: session({id: 'a', updatedAt: 100}),
      b: session({id: 'b', updatedAt: 300}),
      c: session({id: 'c', updatedAt: 200}),
    };
    expect(listSessions(map).map(s => s.id)).toEqual(['b', 'c', 'a']);
  });

  it('returns an empty array for an empty map', () => {
    expect(listSessions(emptySermonNotesMap())).toEqual([]);
  });
});

describe('getReferencedVerses', () => {
  it('returns an empty array for empty prose', () => {
    expect(getReferencedVerses('')).toEqual([]);
  });

  it('finds a single-verse inline reference', () => {
    const refs = getReferencedVerses('El pastor leyó Juan 3:16 esta mañana.');
    expect(refs).toEqual([
      {key: 'John/3/16', bookNameEn: 'John', chapter: 3, verse: 16},
    ]);
  });

  it('finds multiple distinct references in order', () => {
    const refs = getReferencedVerses('Leímos Romanos 8:28 y luego Juan 3:16.');
    expect(refs.map(r => r.key)).toEqual(['Romans/8/28', 'John/3/16']);
  });

  it('dedupes a reference mentioned twice', () => {
    const refs = getReferencedVerses('Juan 3:16 ... y otra vez, Juan 3:16.');
    expect(refs).toHaveLength(1);
  });

  it('recognizes a verse range', () => {
    const refs = getReferencedVerses('Lean conmigo Romanos 8:28-30.');
    expect(refs[0]).toEqual({
      key: 'Romans/8/28-30',
      bookNameEn: 'Romans',
      chapter: 8,
      verse: 28,
      verseEnd: 30,
    });
  });

  it('recognizes a chapter-only mention', () => {
    const refs = getReferencedVerses('Vamos a leer todo Juan 3 hoy.');
    expect(refs[0].key).toBe('John/3');
    expect(refs[0].verse).toBeUndefined();
  });

  it('ignores an out-of-range chapter', () => {
    const refs = getReferencedVerses('Genesis 99:1 no existe.');
    expect(refs).toEqual([]);
  });

  it('returns an empty array for prose with no references', () => {
    expect(
      getReferencedVerses('Hoy el pastor habló del amor de Dios.'),
    ).toEqual([]);
  });
});

describe('formatReferencedVerseLabel', () => {
  it('formats a single verse in Spanish', () => {
    expect(
      formatReferencedVerseLabel(
        {key: 'John/3/16', bookNameEn: 'John', chapter: 3, verse: 16},
        'es',
      ),
    ).toBe('Juan 3:16');
  });

  it('formats a verse range in English', () => {
    expect(
      formatReferencedVerseLabel(
        {
          key: 'Romans/8/28-30',
          bookNameEn: 'Romans',
          chapter: 8,
          verse: 28,
          verseEnd: 30,
        },
        'en',
      ),
    ).toBe('Romans 8:28-30');
  });

  it('formats a chapter-only reference without a colon', () => {
    expect(
      formatReferencedVerseLabel(
        {key: 'John/3', bookNameEn: 'John', chapter: 3},
        'es',
      ),
    ).toBe('Juan 3');
  });
});

describe('formatReferenceForInsert', () => {
  it('formats a Spanish-typed reference', () => {
    expect(formatReferenceForInsert('Juan 3:16', 'es')).toBe('Juan 3:16');
  });

  it('formats an English-typed reference into the requested book language', () => {
    expect(formatReferenceForInsert('John 3:16', 'es')).toBe('Juan 3:16');
  });

  it('formats a verse range', () => {
    expect(formatReferenceForInsert('Romans 8:28-30', 'en')).toBe(
      'Romans 8:28-30',
    );
  });

  it('formats a chapter-only reference', () => {
    expect(formatReferenceForInsert('Juan 3', 'es')).toBe('Juan 3');
  });

  it('returns null for unrecognized text', () => {
    expect(formatReferenceForInsert('not a reference')).toBeNull();
  });

  it('returns null for an out-of-range chapter', () => {
    expect(formatReferenceForInsert('Juan 999:1')).toBeNull();
  });
});

describe('insertReferenceText', () => {
  it('appends to an empty body without a leading newline', () => {
    expect(insertReferenceText('', 'Juan 3:16')).toBe('Juan 3:16 ');
  });

  it('appends on a new line when the body has content', () => {
    expect(insertReferenceText('Notas del sermón', 'Juan 3:16')).toBe(
      'Notas del sermón\nJuan 3:16 ',
    );
  });

  it('does not add a redundant newline when the body already ends with one', () => {
    expect(insertReferenceText('Notas\n', 'Juan 3:16')).toBe(
      'Notas\nJuan 3:16 ',
    );
  });
});

describe('parseSermonNotesMap / serializeSermonNotesMap', () => {
  it('round-trips a well-formed map', () => {
    const map: SermonNotesMap = {
      id1: session({
        id: 'id1',
        source: 'Iglesia Central',
        bodyText: 'Juan 3:16 es central.',
      }),
    };
    const raw = serializeSermonNotesMap(map);
    expect(parseSermonNotesMap(raw)).toEqual(map);
  });

  it('returns an empty map for null/undefined/empty input', () => {
    expect(parseSermonNotesMap(null)).toEqual({});
    expect(parseSermonNotesMap(undefined)).toEqual({});
    expect(parseSermonNotesMap('')).toEqual({});
  });

  it('returns an empty map for invalid JSON rather than throwing', () => {
    expect(parseSermonNotesMap('{not json')).toEqual({});
  });

  it('returns an empty map for a non-object JSON root', () => {
    expect(parseSermonNotesMap('42')).toEqual({});
    expect(parseSermonNotesMap('"a string"')).toEqual({});
    expect(parseSermonNotesMap('null')).toEqual({});
  });

  it('drops an entry missing a valid id', () => {
    const raw = JSON.stringify({
      bad: {title: 'No id', bodyText: '', createdAt: 1, updatedAt: 1},
    });
    expect(parseSermonNotesMap(raw)).toEqual({});
  });

  it('drops an entry with a blank title', () => {
    const raw = JSON.stringify({
      id1: {id: 'id1', title: '   ', bodyText: '', createdAt: 1, updatedAt: 1},
    });
    expect(parseSermonNotesMap(raw)).toEqual({});
  });

  it("keys the result by each entry's own id, not the raw JSON key", () => {
    const raw = JSON.stringify({
      mismatchedKey: {
        id: 'realId',
        title: 'Real',
        bodyText: '',
        createdAt: 1,
        updatedAt: 1,
      },
    });
    const map = parseSermonNotesMap(raw);
    expect(map.realId).toBeDefined();
    expect(map.mismatchedKey).toBeUndefined();
  });

  it('defaults a missing/invalid createdAt/updatedAt to 0', () => {
    const raw = JSON.stringify({id1: {id: 'id1', title: 'X'}});
    const parsed = parseSermonNotesMap(raw).id1;
    expect(parsed.createdAt).toBe(0);
    expect(parsed.updatedAt).toBe(0);
  });

  it('drops a non-string bodyText, defaulting to empty', () => {
    const raw = JSON.stringify({
      id1: {id: 'id1', title: 'X', bodyText: 42, createdAt: 1, updatedAt: 1},
    });
    expect(parseSermonNotesMap(raw).id1.bodyText).toBe('');
  });

  it('caps the number of sessions read at MAX_SESSIONS', () => {
    const raw: Record<string, unknown> = {};
    for (let i = 0; i < MAX_SESSIONS + 5; i++) {
      raw[`id${i}`] = {
        id: `id${i}`,
        title: `Nota ${i}`,
        bodyText: '',
        createdAt: i,
        updatedAt: i,
      };
    }
    const parsed = parseSermonNotesMap(JSON.stringify(raw));
    expect(Object.keys(parsed)).toHaveLength(MAX_SESSIONS);
  });

  it('skips a single corrupt entry without losing the rest of the map', () => {
    const raw = JSON.stringify({
      good: {
        id: 'good',
        title: 'Good',
        bodyText: '',
        createdAt: 1,
        updatedAt: 1,
      },
      bad: 'not an object',
    });
    const parsed = parseSermonNotesMap(raw);
    expect(Object.keys(parsed)).toEqual(['good']);
  });
});
