/**
 * Sprint 77 — withoutUndefined: Firestore payload sanitizer.
 * Sprint 78 — deepWithoutUndefined (engine boundary) + the highlight builder
 * that carried the same silent-loss flaw as S77's note-less favorites.
 *
 * Firestore rejects documents containing `undefined` field values
 * ("Unsupported field value: undefined") and the SyncEngine retries until it
 * DROPS the entry — a note-less favorite / label-less bookmark never synced.
 * These tests lock the sanitizer every *ToRemote builder now passes through.
 */

import {withoutUndefined, deepWithoutUndefined} from '../src/lib/sync/sanitize';
import {buildHighlightRemotePayload} from '../src/lib/sync/adapters/highlights';
import {HighlightColor, type Highlight} from '../src/lib/highlights';

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

describe('deepWithoutUndefined (Sprint 78 — engine boundary)', () => {
  it('strips undefined keys at every nesting level', () => {
    const record = {
      id: 'conflict-1',
      localVersion: {note: undefined, color: '#FFF59D', updatedAt: 1},
      remoteVersion: {note: 'remote', color: '#FFF59D', updatedAt: 2},
      resolvedValue: {nested: {deep: undefined, kept: null}},
    };
    expect(deepWithoutUndefined(record)).toEqual({
      id: 'conflict-1',
      localVersion: {color: '#FFF59D', updatedAt: 1},
      remoteVersion: {note: 'remote', color: '#FFF59D', updatedAt: 2},
      resolvedValue: {nested: {kept: null}},
    });
  });

  it('maps undefined ARRAY elements to null and recurses object elements', () => {
    const out = deepWithoutUndefined({
      tags: ['a', undefined, 'b'],
      rows: [{keep: 1, drop: undefined}],
    });
    expect(out).toEqual({tags: ['a', null, 'b'], rows: [{keep: 1}]});
  });

  it('passes class instances through untouched (FieldValue sentinels, Date)', () => {
    class Sentinel {
      kind = 'serverTimestamp';
    }
    const sentinel = new Sentinel();
    const when = new Date(0);
    const out = deepWithoutUndefined({stamp: sentinel, at: when, x: undefined});
    expect(out.stamp).toBe(sentinel);
    expect(out.at).toBe(when);
    expect(Object.keys(out)).toEqual(['stamp', 'at']);
  });

  it('keeps every legal falsy value at depth', () => {
    const payload = {a: {b: null, c: 0, d: '', e: false}};
    expect(deepWithoutUndefined(payload)).toEqual(payload);
  });
});

describe('highlightToRemote — the S78 silent-loss fix', () => {
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

  it('omits absent category/note instead of sending undefined', () => {
    const out = buildHighlightRemotePayload(base);
    expect('category' in out).toBe(false);
    expect('note' in out).toBe(false);
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
