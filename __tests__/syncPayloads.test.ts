/**
 * Sprint 77 — the Firestore payload sanitizer.
 * Sprint 78 — deep variant (engine boundary) + the highlight builder that
 * carried the same silent-loss flaw as S77's note-less favorites.
 * R9-44/45/50 — the sanitizer now NULLIFIES instead of dropping.
 *
 * Firestore rejects documents containing `undefined` field values
 * ("Unsupported field value: undefined") and the SyncEngine retries until it
 * DROPS the entry — a note-less favorite / label-less bookmark never synced.
 * The original fix removed those keys outright, which collided with
 * `pushOne`'s `{merge: true}`: an ABSENT key means "keep the server's value",
 * so an optional field could never be unset by sync. Sending an explicit
 * `null` satisfies Firestore AND actually overwrites. These tests lock that
 * contract for every *ToRemote builder.
 */

import {nullifyUndefined, deepNullifyUndefined} from '../src/lib/sync/sanitize';
import {buildHighlightRemotePayload} from '../src/lib/sync/adapters/highlights';
import {HighlightColor, type Highlight} from '../src/lib/highlights';

describe('nullifyUndefined', () => {
  it('replaces undefined-valued keys with null, keeping the key', () => {
    expect(nullifyUndefined({id: 'f1', note: undefined, rating: 5})).toEqual({
      id: 'f1',
      note: null,
      rating: 5,
    });
  });

  it('keeps every legal falsy value (null, 0, empty string, false)', () => {
    const payload = {a: null, b: 0, c: '', d: false, e: [] as string[]};
    expect(nullifyUndefined(payload)).toEqual(payload);
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
    const out = nullifyUndefined(favorite);
    expect(out).toEqual(favorite);
    expect(out).not.toBe(favorite);
  });

  it('never leaves an undefined value anywhere in the copy', () => {
    const out = nullifyUndefined({label: undefined, x: 1, y: undefined});
    expect(Object.values(out).includes(undefined)).toBe(false);
    expect(Object.keys(out)).toEqual(['label', 'x', 'y']);
  });
});

describe('deepNullifyUndefined (Sprint 78 — engine boundary)', () => {
  it('nullifies undefined keys at every nesting level', () => {
    const record = {
      id: 'conflict-1',
      localVersion: {note: undefined, color: '#FFF59D', updatedAt: 1},
      remoteVersion: {note: 'remote', color: '#FFF59D', updatedAt: 2},
      resolvedValue: {nested: {deep: undefined, kept: null}},
    };
    expect(deepNullifyUndefined(record)).toEqual({
      id: 'conflict-1',
      localVersion: {note: null, color: '#FFF59D', updatedAt: 1},
      remoteVersion: {note: 'remote', color: '#FFF59D', updatedAt: 2},
      resolvedValue: {nested: {deep: null, kept: null}},
    });
  });

  it('maps undefined ARRAY elements to null and recurses object elements', () => {
    const out = deepNullifyUndefined({
      tags: ['a', undefined, 'b'],
      rows: [{keep: 1, drop: undefined}],
    });
    expect(out).toEqual({
      tags: ['a', null, 'b'],
      rows: [{keep: 1, drop: null}],
    });
  });

  it('passes class instances through untouched (FieldValue sentinels, Date)', () => {
    class Sentinel {
      kind = 'serverTimestamp';
    }
    const sentinel = new Sentinel();
    const when = new Date(0);
    const out = deepNullifyUndefined({stamp: sentinel, at: when, x: undefined});
    expect(out.stamp).toBe(sentinel);
    expect(out.at).toBe(when);
    expect(out.x).toBeNull();
  });

  it('keeps every legal falsy value at depth', () => {
    const payload = {a: {b: null, c: 0, d: '', e: false}};
    expect(deepNullifyUndefined(payload)).toEqual(payload);
  });
});

describe('highlightToRemote — S78 silent loss + R9-50 unsettable optionals', () => {
  const base: Highlight = {
    id: 'hl_1',
    verseId: 'Genesis:1:1',
    bookId: 'Genesis',
    chapter: 1,
    verse: 1,
    color: HighlightColor.YELLOW,
    createdAt: 1,
    updatedAt: 2,
  };

  it('sends absent category/note as an explicit null, never undefined', () => {
    const out = buildHighlightRemotePayload(base);
    // The KEY must be present — that is what lets `{merge: true}` clear a
    // note the user just deleted, instead of inheriting the server's copy.
    expect('category' in out).toBe(true);
    expect('note' in out).toBe(true);
    expect(out.category).toBeNull();
    expect(out.note).toBeNull();
    expect(Object.values(out).includes(undefined)).toBe(false);
    expect(out.verseId).toBe('Genesis:1:1');
    expect(out.updatedAt).toBe(2);
  });

  it('keeps category/note when present', () => {
    const out = buildHighlightRemotePayload({
      ...base,
      note: 'mi nota',
    });
    expect(out.note).toBe('mi nota');
  });
});
