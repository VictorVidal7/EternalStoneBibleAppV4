/**
 * S90 audit coverage — the sync LWW timestamp normalizer. It is the single
 * point that reconciles the app's inconsistent clocks (SQLite millis vs ISO
 * strings vs AsyncStorage ISO vs Firestore Timestamp objects) into millis for
 * last-write-wins. A regression here silently mis-orders synced edits, so pin
 * every branch — including the defensive "unparseable -> 0 (oldest)" contract.
 */
import {toMillis, millisToIso} from '../src/lib/sync/timeUtils';

describe('toMillis', () => {
  it('passes through a finite number', () => {
    expect(toMillis(1_700_000_000_000)).toBe(1_700_000_000_000);
    expect(toMillis(0)).toBe(0);
  });

  it('parses an ISO string', () => {
    const iso = '2026-06-15T12:00:00.000Z';
    expect(toMillis(iso)).toBe(Date.parse(iso));
  });

  it('parses a numeric string (legacy data)', () => {
    expect(toMillis('1700000000000')).toBe(1_700_000_000_000);
  });

  it('reads a Firestore Timestamp via toMillis()', () => {
    expect(toMillis({toMillis: () => 1234})).toBe(1234);
  });

  it('reads a Firestore Timestamp via seconds (drops nanos)', () => {
    expect(toMillis({seconds: 1700, nanoseconds: 500})).toBe(1_700_000);
  });

  it('treats missing/unparseable input as the oldest possible (0)', () => {
    expect(toMillis(undefined)).toBe(0);
    expect(toMillis(null)).toBe(0);
    expect(toMillis('not a date')).toBe(0);
    expect(toMillis(NaN)).toBe(0);
    expect(toMillis(Infinity)).toBe(0);
    expect(toMillis({})).toBe(0);
  });

  it('orders edits correctly for LWW (newer string beats older millis)', () => {
    const older = toMillis(1_000);
    const newer = toMillis('2026-06-15T12:00:00.000Z');
    expect(newer).toBeGreaterThan(older);
  });
});

describe('millisToIso', () => {
  it('round-trips with toMillis', () => {
    const ms = Date.parse('2026-06-15T12:00:00.000Z');
    expect(millisToIso(ms)).toBe('2026-06-15T12:00:00.000Z');
    expect(toMillis(millisToIso(ms))).toBe(ms);
  });
});
