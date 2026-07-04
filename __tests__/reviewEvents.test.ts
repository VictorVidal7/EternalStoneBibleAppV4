import {
  buildReviewEvent,
  isRecallSuccess,
  isReviewEventEligibleForCloudCleanup,
  isReviewEventWithinSyncWindow,
  remoteToReviewEvent,
  REVIEW_EVENT_SYNC_WINDOW_MS,
  reviewEventToRemote,
} from '../src/lib/memory/reviewEvents';
import {applyReview, createCard, type MemoryCard} from '../src/lib/memory/srs';

const T0 = '2026-05-01T12:00:00.000Z';

function mkCard(over: Partial<MemoryCard> = {}): MemoryCard {
  const base = createCard({
    verseKey: 'John/3/16',
    bookName: 'John',
    chapter: 3,
    verse: 16,
    text: 'For God so loved the world…',
    version: 'KJV',
    now: T0,
  });
  return {...base, ...over};
}

describe('isRecallSuccess', () => {
  it('treats only "again" as a lapse', () => {
    expect(isRecallSuccess('again')).toBe(false);
    expect(isRecallSuccess('hard')).toBe(true);
    expect(isRecallSuccess('good')).toBe(true);
    expect(isRecallSuccess('easy')).toBe(true);
  });
});

describe('buildReviewEvent', () => {
  it('captures box transition and a deterministic id', () => {
    const before = mkCard({box: 2, lastReviewedAt: null});
    const now = new Date('2026-05-10T08:00:00.000Z');
    const after = applyReview(before, 'good', now);
    const event = buildReviewEvent({
      cardBefore: before,
      cardAfter: after,
      grade: 'good',
      now,
    });

    expect(event.id).toBe(`John/3/16__${now.getTime()}`);
    expect(event.verseKey).toBe('John/3/16');
    expect(event.bookName).toBe('John');
    expect(event.grade).toBe('good');
    expect(event.boxBefore).toBe(2);
    expect(event.boxAfter).toBe(3); // good → +1 box
    expect(event.reviewedAt).toBe(now.getTime());
  });

  it('reports null interval for a first-ever review', () => {
    const before = mkCard({lastReviewedAt: null});
    const now = new Date('2026-05-10T08:00:00.000Z');
    const after = applyReview(before, 'good', now);
    const event = buildReviewEvent({
      cardBefore: before,
      cardAfter: after,
      grade: 'good',
      now,
    });
    expect(event.intervalDays).toBeNull();
  });

  it('rounds the elapsed days since the previous review', () => {
    const before = mkCard({lastReviewedAt: '2026-05-04T08:00:00.000Z'});
    const now = new Date('2026-05-10T08:00:00.000Z'); // 6 days later
    const after = applyReview(before, 'hard', now);
    const event = buildReviewEvent({
      cardBefore: before,
      cardAfter: after,
      grade: 'hard',
      now,
    });
    expect(event.intervalDays).toBe(6);
  });
});

describe('remote round-trip', () => {
  it('survives reviewEventToRemote → remoteToReviewEvent unchanged', () => {
    const before = mkCard({box: 1, lastReviewedAt: '2026-05-08T12:00:00.000Z'});
    const now = new Date('2026-05-10T12:00:00.000Z');
    const after = applyReview(before, 'easy', now);
    const event = buildReviewEvent({
      cardBefore: before,
      cardAfter: after,
      grade: 'easy',
      now,
    });

    const remote = reviewEventToRemote(event);
    expect(remote.updatedAt).toBe(event.reviewedAt);

    const back = remoteToReviewEvent(event.id, remote);
    expect(back).toEqual(event);
  });

  it('falls back to updatedAt when a remote doc lacks reviewedAt', () => {
    const back = remoteToReviewEvent('John/3/16__999', {
      verseKey: 'John/3/16',
      bookName: 'John',
      grade: 'good',
      boxBefore: 1,
      boxAfter: 2,
      intervalDays: null,
      // reviewedAt intentionally missing — older/partial remote doc.
      updatedAt: 999,
    } as never);
    expect(back.reviewedAt).toBe(999);
  });
});

// =============================================================
// Quota hardening — 12-month cloud sync window (exact boundaries)
// =============================================================
//
// `isReviewEventWithinSyncWindow` gates queueWrite (outbound) and
// applyRemoteUpsert (inbound); `isReviewEventEligibleForCloudCleanup`
// gates SyncEngine.cleanupOldReviewEvents' destructive delete. They are
// deliberately NOT plain negations of each other for invalid input: both
// resolve ambiguity toward "never lose/never delete" (see reviewEvents.ts).

const FIXED_NOW = new Date('2026-07-02T12:00:00.000Z').getTime();

describe('isReviewEventWithinSyncWindow — exact boundary', () => {
  it('is true for an event exactly AT the window boundary (not yet "more than" 12 months)', () => {
    const reviewedAt = FIXED_NOW - REVIEW_EVENT_SYNC_WINDOW_MS;
    expect(isReviewEventWithinSyncWindow(reviewedAt, FIXED_NOW)).toBe(true);
  });

  it('is true for an event 1ms inside the window', () => {
    const reviewedAt = FIXED_NOW - REVIEW_EVENT_SYNC_WINDOW_MS + 1;
    expect(isReviewEventWithinSyncWindow(reviewedAt, FIXED_NOW)).toBe(true);
  });

  it('is false for an event 1ms past the window boundary', () => {
    const reviewedAt = FIXED_NOW - REVIEW_EVENT_SYNC_WINDOW_MS - 1;
    expect(isReviewEventWithinSyncWindow(reviewedAt, FIXED_NOW)).toBe(false);
  });

  it('is true for a brand-new event (age 0)', () => {
    expect(isReviewEventWithinSyncWindow(FIXED_NOW, FIXED_NOW)).toBe(true);
  });

  it.each([undefined, null, NaN, 'not-a-number', {}])(
    'defensively returns true for ambiguous input %p (never skip syncing on doubt)',
    value => {
      expect(isReviewEventWithinSyncWindow(value, FIXED_NOW)).toBe(true);
    },
  );
});

describe('isReviewEventEligibleForCloudCleanup — exact boundary', () => {
  it('is false for an event exactly AT the window boundary', () => {
    const updatedAt = FIXED_NOW - REVIEW_EVENT_SYNC_WINDOW_MS;
    expect(isReviewEventEligibleForCloudCleanup(updatedAt, FIXED_NOW)).toBe(
      false,
    );
  });

  it('is false for an event 1ms inside the window', () => {
    const updatedAt = FIXED_NOW - REVIEW_EVENT_SYNC_WINDOW_MS + 1;
    expect(isReviewEventEligibleForCloudCleanup(updatedAt, FIXED_NOW)).toBe(
      false,
    );
  });

  it('is true for an event 1ms past the window boundary', () => {
    const updatedAt = FIXED_NOW - REVIEW_EVENT_SYNC_WINDOW_MS - 1;
    expect(isReviewEventEligibleForCloudCleanup(updatedAt, FIXED_NOW)).toBe(
      true,
    );
  });

  it('is true for a clearly ancient event (e.g. 5 years old)', () => {
    const updatedAt = FIXED_NOW - 5 * 365 * 24 * 60 * 60 * 1000;
    expect(isReviewEventEligibleForCloudCleanup(updatedAt, FIXED_NOW)).toBe(
      true,
    );
  });

  it.each([undefined, null, NaN, 'not-a-number', {}])(
    'defensively returns false for ambiguous input %p (never delete on doubt)',
    value => {
      expect(isReviewEventEligibleForCloudCleanup(value, FIXED_NOW)).toBe(
        false,
      );
    },
  );

  it('is the exact complement of isReviewEventWithinSyncWindow for every valid timestamp', () => {
    for (const offsetDays of [-1, 0, 1, 30, 180, 364, 365, 366, 400, 1000]) {
      const ts = FIXED_NOW - offsetDays * 24 * 60 * 60 * 1000;
      expect(isReviewEventEligibleForCloudCleanup(ts, FIXED_NOW)).toBe(
        !isReviewEventWithinSyncWindow(ts, FIXED_NOW),
      );
    }
  });
});
