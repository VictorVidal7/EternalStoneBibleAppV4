import {
  shuffleUpcoming,
  restoreUpcomingOrder,
  nextPlaylistIndex,
  DEFAULT_QUEUE_OPTIONS,
} from '../src/features/audio/lib/playlistQueueOptions';

/** Deterministic "random" source: pops the given values in order. */
function seeded(values: number[]): () => number {
  let i = 0;
  return () => values[i++ % values.length];
}

describe('playlistQueueOptions (Sprint 80 — shuffle + repeat)', () => {
  const items = ['a', 'b', 'c', 'd', 'e', 'f'];

  describe('shuffleUpcoming', () => {
    it('never moves the played history or the current item', () => {
      for (let trial = 0; trial < 25; trial++) {
        const out = shuffleUpcoming(items, 2);
        expect(out.slice(0, 3)).toEqual(['a', 'b', 'c']);
        expect([...out.slice(3)].sort()).toEqual(['d', 'e', 'f']);
      }
    });

    it('is a permutation of the same items (nothing lost, nothing doubled)', () => {
      const out = shuffleUpcoming(items, 0);
      expect([...out].sort()).toEqual([...items].sort());
      expect(out[0]).toBe('a');
    });

    it('is deterministic under an injected random source', () => {
      const a = shuffleUpcoming(items, 1, seeded([0.9, 0.1, 0.5, 0.3]));
      const b = shuffleUpcoming(items, 1, seeded([0.9, 0.1, 0.5, 0.3]));
      expect(a).toEqual(b);
      expect(a.slice(0, 2)).toEqual(['a', 'b']);
    });

    it('does nothing when the current verse is the last one or index is invalid', () => {
      expect(shuffleUpcoming(items, items.length - 1)).toEqual(items);
      expect(shuffleUpcoming(items, -1)).toEqual(items);
      expect(shuffleUpcoming([], 0)).toEqual([]);
    });

    it('does not mutate the input', () => {
      const input = [...items];
      shuffleUpcoming(input, 0);
      expect(input).toEqual(items);
    });
  });

  describe('restoreUpcomingOrder', () => {
    it('puts the upcoming items back in canonical order, history untouched', () => {
      // A shuffled queue: history [a, b], current c, upcoming shuffled.
      const shuffled = ['a', 'b', 'c', 'f', 'd', 'e'];
      const out = restoreUpcomingOrder(shuffled, 2, items);
      expect(out).toEqual(['a', 'b', 'c', 'd', 'e', 'f']);
    });

    it('round-trips with shuffleUpcoming', () => {
      const shuffled = shuffleUpcoming(items, 1, seeded([0.7, 0.2, 0.9]));
      const restored = restoreUpcomingOrder(shuffled, 1, items);
      expect(restored).toEqual(items);
    });

    it('matches by reference so duplicate-looking objects stay distinct', () => {
      const v1 = {verse: 1};
      const v2 = {verse: 1}; // same shape, different identity
      const v3 = {verse: 3};
      const original = [v1, v2, v3];
      const out = restoreUpcomingOrder([v1, v3, v2], 0, original);
      expect(out[1]).toBe(v2);
      expect(out[2]).toBe(v3);
    });

    it('sinks items missing from the original order to the end', () => {
      const extra = 'x';
      const out = restoreUpcomingOrder(['a', extra, 'c', 'b'], 0, items);
      expect(out).toEqual(['a', 'b', 'c', extra]);
    });
  });

  describe('nextPlaylistIndex', () => {
    it('advances normally inside the list', () => {
      expect(
        nextPlaylistIndex({currentIndex: 0, total: 3, repeat: false}),
      ).toBe(1);
      expect(nextPlaylistIndex({currentIndex: 1, total: 3, repeat: true})).toBe(
        2,
      );
    });

    it('stops at the end without repeat', () => {
      expect(
        nextPlaylistIndex({currentIndex: 2, total: 3, repeat: false}),
      ).toBeNull();
    });

    it('wraps to the start with repeat on', () => {
      expect(nextPlaylistIndex({currentIndex: 2, total: 3, repeat: true})).toBe(
        0,
      );
    });

    it('never plays an empty queue', () => {
      expect(
        nextPlaylistIndex({currentIndex: 0, total: 0, repeat: true}),
      ).toBeNull();
    });
  });

  it('defaults keep both options off (the chapter contract)', () => {
    expect(DEFAULT_QUEUE_OPTIONS).toEqual({shuffle: false, repeat: false});
  });
});
