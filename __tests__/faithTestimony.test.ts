/**
 * "Mi testimonio" (free tier) — pure logic behind sessions: creating,
 * editing, deleting, listing, composing the share-ready text, and defensive
 * parse/serialize. Mirrors sermonNotes.test.ts's shape for its sibling model.
 */
import {
  MAX_SECTION_LENGTH,
  MAX_TESTIMONY_SESSIONS,
  MAX_TITLE_LENGTH,
  buildTestimonyText,
  canCreateTestimonySession,
  createTestimonySession,
  defaultTestimonyTitle,
  deleteTestimonySession,
  emptyFaithTestimonyMap,
  formatTestimonyDateLabel,
  generateFaithTestimonyId,
  hasTestimonyContent,
  listTestimonySessions,
  parseFaithTestimonyMap,
  serializeFaithTestimonyMap,
  updateTestimonySession,
  type FaithTestimonyMap,
  type FaithTestimonySession,
} from '../src/features/study/faithTestimony';

function session(
  overrides: Partial<FaithTestimonySession> = {},
): FaithTestimonySession {
  return {
    id: 'testimony_1',
    title: '22 jul 2026',
    before: '',
    change: '',
    now: '',
    createdAt: 1,
    updatedAt: 1,
    ...overrides,
  };
}

describe('generateFaithTestimonyId', () => {
  it('produces unique, prefixed ids', () => {
    const a = generateFaithTestimonyId();
    const b = generateFaithTestimonyId();
    expect(a).not.toBe(b);
    expect(a.startsWith('testimony_')).toBe(true);
  });
});

describe('canCreateTestimonySession', () => {
  it('allows creating a session under the cap', () => {
    expect(canCreateTestimonySession(emptyFaithTestimonyMap())).toBe(true);
  });

  it('refuses creating a session at MAX_TESTIMONY_SESSIONS', () => {
    const map: FaithTestimonyMap = {};
    for (let i = 0; i < MAX_TESTIMONY_SESSIONS; i++) {
      map[`s${i}`] = session({id: `s${i}`});
    }
    expect(Object.keys(map)).toHaveLength(MAX_TESTIMONY_SESSIONS);
    expect(canCreateTestimonySession(map)).toBe(false);
  });
});

describe('formatTestimonyDateLabel / defaultTestimonyTitle', () => {
  it('formats a Spanish date label from a local timestamp', () => {
    const ts = new Date(2026, 6, 22).getTime();
    expect(formatTestimonyDateLabel(ts, 'es')).toBe('22 jul 2026');
  });

  it('formats an English date label from a local timestamp', () => {
    const ts = new Date(2026, 6, 22).getTime();
    expect(formatTestimonyDateLabel(ts, 'en')).toBe('Jul 22, 2026');
  });

  it('defaultTestimonyTitle uses the date label', () => {
    const ts = new Date(2026, 0, 5).getTime();
    expect(defaultTestimonyTitle(ts, 'es')).toBe(
      formatTestimonyDateLabel(ts, 'es'),
    );
  });
});

describe('createTestimonySession', () => {
  it('creates a session with empty sections', () => {
    const map = createTestimonySession(
      emptyFaithTestimonyMap(),
      'Mi historia',
      1000,
      'id1',
    );
    expect(map.id1).toEqual({
      id: 'id1',
      title: 'Mi historia',
      before: '',
      change: '',
      now: '',
      createdAt: 1000,
      updatedAt: 1000,
    });
  });

  it('is a no-op for a blank title', () => {
    const map = emptyFaithTestimonyMap();
    expect(createTestimonySession(map, '   ')).toBe(map);
  });

  it('is a no-op once at the cap', () => {
    const map: FaithTestimonyMap = {};
    for (let i = 0; i < MAX_TESTIMONY_SESSIONS; i++) {
      map[`s${i}`] = session({id: `s${i}`});
    }
    const next = createTestimonySession(map, 'One more');
    expect(next).toBe(map);
  });

  it('never generates or fills in content — no example wording', () => {
    // The whole point of this module: it never writes the writer's words.
    const map = createTestimonySession(
      emptyFaithTestimonyMap(),
      'Test',
      1,
      'id1',
    );
    const created = map.id1;
    expect(created.before).toBe('');
    expect(created.change).toBe('');
    expect(created.now).toBe('');
  });
});

describe('updateTestimonySession', () => {
  it('updates sections and bumps updatedAt', () => {
    const map: FaithTestimonyMap = {id1: session({id: 'id1'})};
    const next = updateTestimonySession(
      map,
      'id1',
      {before: 'Antes...', change: 'Cambió...', now: 'Ahora...'},
      2000,
    );
    expect(next.id1.before).toBe('Antes...');
    expect(next.id1.change).toBe('Cambió...');
    expect(next.id1.now).toBe('Ahora...');
    expect(next.id1.updatedAt).toBe(2000);
  });

  it('ignores a blank title but keeps the previous one', () => {
    const map: FaithTestimonyMap = {
      id1: session({id: 'id1', title: 'Original'}),
    };
    const next = updateTestimonySession(map, 'id1', {title: '   '});
    expect(next.id1.title).toBe('Original');
  });

  it('is a no-op for an unknown id', () => {
    const map = emptyFaithTestimonyMap();
    expect(updateTestimonySession(map, 'nope', {before: 'x'})).toBe(map);
  });

  it('clamps sections to MAX_SECTION_LENGTH', () => {
    const map: FaithTestimonyMap = {id1: session({id: 'id1'})};
    const long = 'a'.repeat(MAX_SECTION_LENGTH + 500);
    const next = updateTestimonySession(map, 'id1', {before: long});
    expect(next.id1.before.length).toBe(MAX_SECTION_LENGTH);
  });

  it('clamps title to MAX_TITLE_LENGTH', () => {
    const map: FaithTestimonyMap = {id1: session({id: 'id1'})};
    const long = 'a'.repeat(MAX_TITLE_LENGTH + 50);
    const next = updateTestimonySession(map, 'id1', {title: long});
    expect(next.id1.title.length).toBe(MAX_TITLE_LENGTH);
  });
});

describe('deleteTestimonySession', () => {
  it('removes a session', () => {
    const map: FaithTestimonyMap = {id1: session({id: 'id1'})};
    expect(deleteTestimonySession(map, 'id1')).toEqual({});
  });

  it('is a no-op for an unknown id', () => {
    const map = emptyFaithTestimonyMap();
    expect(deleteTestimonySession(map, 'nope')).toBe(map);
  });
});

describe('listTestimonySessions', () => {
  it('sorts most-recently-updated first', () => {
    const map: FaithTestimonyMap = {
      a: session({id: 'a', updatedAt: 1}),
      b: session({id: 'b', updatedAt: 3}),
      c: session({id: 'c', updatedAt: 2}),
    };
    expect(listTestimonySessions(map).map(s => s.id)).toEqual(['b', 'c', 'a']);
  });
});

describe('hasTestimonyContent', () => {
  it('is false when every section is blank', () => {
    expect(hasTestimonyContent(session())).toBe(false);
    expect(hasTestimonyContent(session({before: '   '}))).toBe(false);
  });

  it('is true when any section has content', () => {
    expect(hasTestimonyContent(session({before: 'Antes'}))).toBe(true);
    expect(hasTestimonyContent(session({change: 'Cambió'}))).toBe(true);
    expect(hasTestimonyContent(session({now: 'Ahora'}))).toBe(true);
  });
});

describe('buildTestimonyText', () => {
  it('joins non-empty sections with paragraph breaks, no injected headings', () => {
    const s = session({
      before: 'Antes...',
      change: 'Cambió...',
      now: 'Ahora...',
    });
    expect(buildTestimonyText(s)).toBe('Antes...\n\nCambió...\n\nAhora...');
  });

  it('skips empty sections rather than leaving blank paragraphs', () => {
    const s = session({before: 'Antes...', now: 'Ahora...'});
    expect(buildTestimonyText(s)).toBe('Antes...\n\nAhora...');
  });

  it('trims each section', () => {
    const s = session({before: '  Antes...  '});
    expect(buildTestimonyText(s)).toBe('Antes...');
  });

  it('returns an empty string when nothing is written', () => {
    expect(buildTestimonyText(session())).toBe('');
  });
});

describe('parseFaithTestimonyMap / serializeFaithTestimonyMap', () => {
  it('round-trips a valid map', () => {
    const map: FaithTestimonyMap = {id1: session({id: 'id1'})};
    const raw = serializeFaithTestimonyMap(map);
    expect(parseFaithTestimonyMap(raw)).toEqual(map);
  });

  it('tolerates corrupt input', () => {
    expect(parseFaithTestimonyMap(null)).toEqual({});
    expect(parseFaithTestimonyMap(undefined)).toEqual({});
    expect(parseFaithTestimonyMap('not json')).toEqual({});
    expect(parseFaithTestimonyMap('42')).toEqual({});
    expect(parseFaithTestimonyMap('[]')).toEqual({});
  });

  it('drops malformed entries but keeps valid ones', () => {
    const raw = JSON.stringify({
      good: session({id: 'good'}),
      bad: {id: 'bad'}, // missing title
      alsoBad: 'not an object',
    });
    const parsed = parseFaithTestimonyMap(raw);
    expect(Object.keys(parsed)).toEqual(['good']);
  });

  it('caps at MAX_TESTIMONY_SESSIONS when parsing', () => {
    const map: Record<string, FaithTestimonySession> = {};
    for (let i = 0; i < MAX_TESTIMONY_SESSIONS + 10; i++) {
      map[`s${i}`] = session({id: `s${i}`});
    }
    const parsed = parseFaithTestimonyMap(JSON.stringify(map));
    expect(Object.keys(parsed).length).toBe(MAX_TESTIMONY_SESSIONS);
  });
});
