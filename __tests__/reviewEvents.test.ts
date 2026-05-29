import {
  buildReviewEvent,
  isRecallSuccess,
  remoteToReviewEvent,
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
