import {
  addCompactStylePreset,
  MAX_COMPACT_STYLE_PRESETS,
  parseCompactStylePresets,
  removeCompactStylePreset,
  serializeCompactStylePresets,
  type CompactStylePreset,
  type NewCompactStylePreset,
} from '../src/features/share/compactStylePresets';

const BASE: NewCompactStylePreset = {
  templateId: 'classic',
  texture: 'none',
};

describe('addCompactStylePreset', () => {
  it('appends a new preset, auto-numbered by position', () => {
    const next = addCompactStylePreset([], BASE, 1000);
    expect(next).toHaveLength(1);
    expect(next[0].name).toBe('1');
    expect(next[0].id).toBe('preset_1000');
    expect(next[0].templateId).toBe('classic');
  });

  it('numbers subsequent presets sequentially, as a plain ordinal', () => {
    let list = addCompactStylePreset([], BASE, 1);
    list = addCompactStylePreset(list, BASE, 2);
    list = addCompactStylePreset(list, BASE, 3);
    expect(list.map(p => p.name)).toEqual(['1', '2', '3']);
  });

  it('never bakes a language into the name, so the UI can localize it', () => {
    const next = addCompactStylePreset([], BASE, 1);
    expect(next[0].name).not.toMatch(/[a-zA-Z]/);
  });

  it('drops the oldest preset once the cap is exceeded', () => {
    let list: CompactStylePreset[] = [];
    for (let i = 0; i < MAX_COMPACT_STYLE_PRESETS + 2; i++) {
      list = addCompactStylePreset(list, BASE, i);
    }
    expect(list).toHaveLength(MAX_COMPACT_STYLE_PRESETS);
    // The two oldest (ids preset_0, preset_1) should have been dropped.
    expect(list.map(p => p.id)).not.toContain('preset_0');
    expect(list.map(p => p.id)).not.toContain('preset_1');
    expect(list[list.length - 1].id).toBe(
      `preset_${MAX_COMPACT_STYLE_PRESETS + 1}`,
    );
  });
});

describe('removeCompactStylePreset', () => {
  it('removes the matching preset by id', () => {
    const list = addCompactStylePreset(
      addCompactStylePreset([], BASE, 1),
      BASE,
      2,
    );
    const next = removeCompactStylePreset(list, list[0].id);
    expect(next).toHaveLength(1);
    expect(next[0].id).toBe(list[1].id);
  });

  it('is a no-op when the id is not found', () => {
    const list = addCompactStylePreset([], BASE, 1);
    expect(removeCompactStylePreset(list, 'nope')).toEqual(list);
  });
});

describe('parseCompactStylePresets / serializeCompactStylePresets', () => {
  it('round-trips a real list', () => {
    const list = addCompactStylePreset(
      addCompactStylePreset([], BASE, 1),
      BASE,
      2,
    );
    const raw = serializeCompactStylePresets(list);
    expect(parseCompactStylePresets(raw)).toEqual(list);
  });

  it('returns an empty list for null/undefined/empty input', () => {
    expect(parseCompactStylePresets(null)).toEqual([]);
    expect(parseCompactStylePresets(undefined)).toEqual([]);
    expect(parseCompactStylePresets('')).toEqual([]);
  });

  it('returns an empty list for corrupt JSON', () => {
    expect(parseCompactStylePresets('{not json')).toEqual([]);
  });

  it('returns an empty list for a non-array root', () => {
    expect(parseCompactStylePresets('{"a":1}')).toEqual([]);
  });

  it('drops malformed rows but keeps well-formed ones', () => {
    const good = addCompactStylePreset([], BASE, 1)[0];
    const raw = JSON.stringify([good, {id: 'bad'}, null, 'nope', 42]);
    expect(parseCompactStylePresets(raw)).toEqual([good]);
  });

  it('caps parsed output at MAX_COMPACT_STYLE_PRESETS', () => {
    const list: CompactStylePreset[] = [];
    for (let i = 0; i < MAX_COMPACT_STYLE_PRESETS + 5; i++) {
      list.push({...BASE, id: `x${i}`, name: `Estilo ${i}`});
    }
    const raw = JSON.stringify(list);
    expect(parseCompactStylePresets(raw)).toHaveLength(
      MAX_COMPACT_STYLE_PRESETS,
    );
  });
});
