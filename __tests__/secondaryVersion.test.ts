import {
  resolveSecondaryVersion,
  secondaryVersionChoices,
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
