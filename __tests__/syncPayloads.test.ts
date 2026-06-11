/**
 * Sprint 77 — withoutUndefined: Firestore payload sanitizer.
 *
 * Firestore rejects documents containing `undefined` field values
 * ("Unsupported field value: undefined") and the SyncEngine retries until it
 * DROPS the entry — a note-less favorite / label-less bookmark never synced.
 * These tests lock the sanitizer every *ToRemote builder now passes through.
 */

import {withoutUndefined} from '../src/lib/sync/sanitize';

describe('withoutUndefined', () => {
  it('drops undefined-valued keys', () => {
    expect(withoutUndefined({id: 'f1', note: undefined, rating: 5})).toEqual({
      id: 'f1',
      rating: 5,
    });
  });

  it('keeps every legal falsy value (null, 0, empty string, false)', () => {
    const payload = {a: null, b: 0, c: '', d: false, e: [] as string[]};
    expect(withoutUndefined(payload)).toEqual(payload);
  });

  it('returns an equal copy when nothing is undefined', () => {
    const favorite = {
      id: 'fav_1',
      verseId: 'Psalms_118_2',
      book: 'Psalms',
      chapter: 118,
      verse: 2,
      text: 'Diga ahora Israel…',
      category: 'other',
      rating: 5,
      tags: [] as string[],
      note: 'kept when present',
      createdAt: 1,
      updatedAt: 2,
    };
    const out = withoutUndefined(favorite);
    expect(out).toEqual(favorite);
    expect(out).not.toBe(favorite);
  });

  it('never leaves an undefined value anywhere in the copy', () => {
    const out = withoutUndefined({label: undefined, x: 1, y: undefined});
    expect(Object.values(out).includes(undefined)).toBe(false);
    expect(Object.keys(out)).toEqual(['x']);
  });
});
