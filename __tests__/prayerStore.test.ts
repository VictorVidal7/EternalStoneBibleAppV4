/**
 * Sprint 93 — the prayer-journal persistence layer. Pins defensive parsing
 * (malformed entries dropped, never crashes), round-trip serialization, and
 * the serialized read-modify-write mutate path over the mocked AsyncStorage.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  parsePrayerRequests,
  serializePrayerRequests,
  getPrayerRequests,
  mutatePrayerRequests,
} from '../src/features/prayer/prayerStore';
import {
  addRequest,
  markAnswered,
  newPrayerRequest,
  type PrayerRequest,
} from '../src/features/prayer/prayer';

const KEY = '@prayer_requests_v1';

const valid: PrayerRequest = {
  id: 'a',
  title: 'For my family',
  category: 'intercession',
  createdAt: 1000,
  answered: false,
};

beforeEach(async () => {
  await AsyncStorage.clear();
});

describe('parsePrayerRequests (defensive)', () => {
  it('returns [] for null / non-JSON / non-array', () => {
    expect(parsePrayerRequests(null)).toEqual([]);
    expect(parsePrayerRequests('{not json')).toEqual([]);
    expect(parsePrayerRequests('{"a":1}')).toEqual([]);
  });

  it('drops malformed entries but keeps the valid ones', () => {
    const blob = JSON.stringify([
      valid,
      {id: '', title: 'x', category: 'praise', createdAt: 1}, // empty id
      {id: 'b', title: '   ', category: 'praise', createdAt: 1}, // blank title
      {id: 'c', title: 'x', category: 'bogus', createdAt: 1}, // bad category
      {id: 'd', title: 'x', category: 'praise', createdAt: NaN}, // bad date
      {id: 'e', title: 'ok', category: 'praise', createdAt: 5}, // valid
      42, // not an object
    ]);
    const out = parsePrayerRequests(blob);
    expect(out.map(r => r.id)).toEqual(['a', 'e']);
  });

  it('drops an answered stamp/note that is malformed but keeps the request', () => {
    const blob = JSON.stringify([
      {
        ...valid,
        answered: true,
        answeredAt: 'soon', // bad → dropped
        answeredNote: '   ', // blank → dropped
      },
    ]);
    const [r] = parsePrayerRequests(blob);
    expect(r.answered).toBe(true);
    expect(r.answeredAt).toBeUndefined();
    expect(r.answeredNote).toBeUndefined();
  });

  it('round-trips a full request', () => {
    const full: PrayerRequest = {
      ...valid,
      detail: 'context',
      answered: true,
      answeredAt: 2000,
      answeredNote: 'God provided',
    };
    expect(parsePrayerRequests(serializePrayerRequests([full]))).toEqual([
      full,
    ]);
  });
});

describe('getPrayerRequests', () => {
  it('reads what was stored', async () => {
    await AsyncStorage.setItem(KEY, serializePrayerRequests([valid]));
    expect(await getPrayerRequests()).toEqual([valid]);
  });

  it('returns [] when empty', async () => {
    expect(await getPrayerRequests()).toEqual([]);
  });
});

describe('mutatePrayerRequests (serialized read-modify-write)', () => {
  it('applies a pure mutation and persists it', async () => {
    const req = newPrayerRequest(
      {title: 'Healing', category: 'supplication'},
      'id1',
      500,
    );
    const next = await mutatePrayerRequests(list => addRequest(list, req));
    expect(next.map(r => r.id)).toEqual(['id1']);
    // persisted
    expect((await getPrayerRequests()).map(r => r.id)).toEqual(['id1']);
  });

  it('serializes concurrent mutations without losing entries', async () => {
    const a = newPrayerRequest({title: 'A', category: 'praise'}, 'a', 1);
    const b = newPrayerRequest({title: 'B', category: 'praise'}, 'b', 2);
    await Promise.all([
      mutatePrayerRequests(list => addRequest(list, a)),
      mutatePrayerRequests(list => addRequest(list, b)),
    ]);
    const ids = (await getPrayerRequests()).map(r => r.id).sort();
    expect(ids).toEqual(['a', 'b']);
  });

  it('can mark a stored request answered', async () => {
    const req = newPrayerRequest({title: 'A', category: 'praise'}, 'a', 1);
    await mutatePrayerRequests(list => addRequest(list, req));
    const next = await mutatePrayerRequests(list =>
      markAnswered(list, 'a', 9000, 'Thank You'),
    );
    expect(next[0]).toMatchObject({answered: true, answeredAt: 9000});
  });
});
