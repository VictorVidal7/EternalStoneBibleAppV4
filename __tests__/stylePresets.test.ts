import {
  addStylePreset,
  MAX_STYLE_PRESETS,
  parseStylePresets,
  removeStylePreset,
  serializeStylePresets,
  type NewStylePreset,
  type SharedStylePreset,
} from '../src/features/share/stylePresets';

const BASE: NewStylePreset = {
  templateId: 'classic',
  texture: 'none',
  fontSize: 20,
  textAlign: 'center',
  fontFamilyId: 'serif',
  aspect: 'square',
};

describe('addStylePreset', () => {
  it('appends a new preset, auto-numbered by position', () => {
    const next = addStylePreset([], BASE, 1000);
    expect(next).toHaveLength(1);
    expect(next[0].name).toBe('Estilo 1');
    expect(next[0].id).toBe('preset_1000');
    expect(next[0].templateId).toBe('classic');
  });

  it('numbers subsequent presets sequentially', () => {
    let list = addStylePreset([], BASE, 1);
    list = addStylePreset(list, BASE, 2);
    list = addStylePreset(list, BASE, 3);
    expect(list.map(p => p.name)).toEqual(['Estilo 1', 'Estilo 2', 'Estilo 3']);
  });

  it('drops the oldest preset once the cap is exceeded', () => {
    let list: SharedStylePreset[] = [];
    for (let i = 0; i < MAX_STYLE_PRESETS + 2; i++) {
      list = addStylePreset(list, BASE, i);
    }
    expect(list).toHaveLength(MAX_STYLE_PRESETS);
    // The two oldest (ids preset_0, preset_1) should have been dropped.
    expect(list.map(p => p.id)).not.toContain('preset_0');
    expect(list.map(p => p.id)).not.toContain('preset_1');
    expect(list[list.length - 1].id).toBe(`preset_${MAX_STYLE_PRESETS + 1}`);
  });
});

describe('removeStylePreset', () => {
  it('removes the matching preset by id', () => {
    const list = addStylePreset(addStylePreset([], BASE, 1), BASE, 2);
    const next = removeStylePreset(list, list[0].id);
    expect(next).toHaveLength(1);
    expect(next[0].id).toBe(list[1].id);
  });

  it('is a no-op when the id is not found', () => {
    const list = addStylePreset([], BASE, 1);
    expect(removeStylePreset(list, 'nope')).toEqual(list);
  });
});

describe('parseStylePresets / serializeStylePresets', () => {
  it('round-trips a real list', () => {
    const list = addStylePreset(addStylePreset([], BASE, 1), BASE, 2);
    const raw = serializeStylePresets(list);
    expect(parseStylePresets(raw)).toEqual(list);
  });

  it('returns an empty list for null/undefined/empty input', () => {
    expect(parseStylePresets(null)).toEqual([]);
    expect(parseStylePresets(undefined)).toEqual([]);
    expect(parseStylePresets('')).toEqual([]);
  });

  it('returns an empty list for corrupt JSON', () => {
    expect(parseStylePresets('{not json')).toEqual([]);
  });

  it('returns an empty list for a non-array root', () => {
    expect(parseStylePresets('{"a":1}')).toEqual([]);
  });

  it('drops malformed rows but keeps well-formed ones', () => {
    const good = addStylePreset([], BASE, 1)[0];
    const raw = JSON.stringify([good, {id: 'bad'}, null, 'nope', 42]);
    expect(parseStylePresets(raw)).toEqual([good]);
  });

  it('caps parsed output at MAX_STYLE_PRESETS', () => {
    const list: SharedStylePreset[] = [];
    for (let i = 0; i < MAX_STYLE_PRESETS + 5; i++) {
      list.push({...BASE, id: `x${i}`, name: `Estilo ${i}`});
    }
    const raw = JSON.stringify(list);
    expect(parseStylePresets(raw)).toHaveLength(MAX_STYLE_PRESETS);
  });
});
