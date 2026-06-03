import {
  resolveSecondaryVersion,
  secondaryVersionChoices,
  normalizeDualLayout,
  toggleDualLayout,
  swapVersions,
} from '../src/lib/reading/secondaryVersion';

const VERSIONS = [{id: 'RVR1960'}, {id: 'KJV'}, {id: 'WEB'}];

describe('secondaryVersionChoices', () => {
  it('returns every version except the primary, in order', () => {
    expect(secondaryVersionChoices('RVR1960', VERSIONS)).toEqual([
      {id: 'KJV'},
      {id: 'WEB'},
    ]);
    expect(secondaryVersionChoices('WEB', VERSIONS)).toEqual([
      {id: 'RVR1960'},
      {id: 'KJV'},
    ]);
  });

  it('is empty for a single-version install', () => {
    expect(secondaryVersionChoices('RVR1960', [{id: 'RVR1960'}])).toEqual([]);
  });
});

describe('resolveSecondaryVersion', () => {
  it('honors a valid, non-primary preference', () => {
    expect(resolveSecondaryVersion('RVR1960', 'WEB', VERSIONS)).toEqual({
      id: 'WEB',
    });
    expect(resolveSecondaryVersion('WEB', 'KJV', VERSIONS)).toEqual({
      id: 'KJV',
    });
  });

  it('falls back to the first companion when there is no preference', () => {
    expect(resolveSecondaryVersion('RVR1960', null, VERSIONS)).toEqual({
      id: 'KJV',
    });
    expect(resolveSecondaryVersion('RVR1960', undefined, VERSIONS)).toEqual({
      id: 'KJV',
    });
  });

  it('falls back when the preference equals the primary', () => {
    // Reading WEB with WEB still saved as the companion → pick a real other one.
    expect(resolveSecondaryVersion('WEB', 'WEB', VERSIONS)).toEqual({
      id: 'RVR1960',
    });
  });

  it('falls back when the preference is unknown/stale', () => {
    expect(resolveSecondaryVersion('RVR1960', 'NVI', VERSIONS)).toEqual({
      id: 'KJV',
    });
  });

  it('returns undefined when no other version exists', () => {
    expect(
      resolveSecondaryVersion('RVR1960', 'KJV', [{id: 'RVR1960'}]),
    ).toBeUndefined();
  });
});

describe('normalizeDualLayout', () => {
  it('keeps "columns"', () => {
    expect(normalizeDualLayout('columns')).toBe('columns');
  });

  it('defaults anything else to "stacked"', () => {
    expect(normalizeDualLayout('stacked')).toBe('stacked');
    expect(normalizeDualLayout(null)).toBe('stacked');
    expect(normalizeDualLayout(undefined)).toBe('stacked');
    expect(normalizeDualLayout('garbage')).toBe('stacked');
  });
});

describe('toggleDualLayout', () => {
  it('flips between the two layouts', () => {
    expect(toggleDualLayout('stacked')).toBe('columns');
    expect(toggleDualLayout('columns')).toBe('stacked');
  });
});

describe('swapVersions', () => {
  it('swaps primary and companion', () => {
    expect(swapVersions('RVR1960', 'KJV')).toEqual({
      primaryId: 'KJV',
      secondaryId: 'RVR1960',
    });
  });

  it('is its own inverse', () => {
    const once = swapVersions('RVR1960', 'WEB');
    expect(swapVersions(once.primaryId, once.secondaryId)).toEqual({
      primaryId: 'RVR1960',
      secondaryId: 'WEB',
    });
  });

  it('is a no-op when there is no companion to swap with', () => {
    expect(swapVersions('RVR1960', null)).toEqual({
      primaryId: 'RVR1960',
      secondaryId: 'RVR1960',
    });
    expect(swapVersions('RVR1960', 'RVR1960')).toEqual({
      primaryId: 'RVR1960',
      secondaryId: 'RVR1960',
    });
  });
});
