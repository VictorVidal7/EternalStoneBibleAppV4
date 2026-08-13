/**
 * Sprint 48 — MemoryDeckContext integration: the calibrated ease prior.
 *
 * Verifies the runtime wiring (not just the pure math): the provider reads
 * the review-event log on mount, computes the population ease prior, caches
 * it, and seeds a newly-added card with that ease. We mock the SQLite-backed
 * review-event store so the log is deterministic; everything else (the pure
 * `computeEasePrior`, `createCard`, AsyncStorage) runs for real.
 */

import {Text} from 'react-native';
import {act, cleanup, render, waitFor} from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type {ReviewEvent} from '../src/lib/memory/reviewEvents';
import {
  EASE_PRIOR_SENSITIVITY,
  TARGET_RETENTION,
} from '../src/lib/memory/easePrior';

// Control the review log the prior is calibrated from. `mock`-prefixed so the
// jest.mock factory can close over it (babel-plugin-jest-hoist requirement).
const mockGetAllReviewEvents = jest.fn<Promise<ReviewEvent[]>, []>();
jest.mock('../src/lib/memory/reviewEventStore', () => ({
  __esModule: true,
  getAllReviewEvents: () => mockGetAllReviewEvents(),
  addReviewEvent: jest.fn().mockResolvedValue(undefined),
  getReviewEventById: jest.fn().mockResolvedValue(null),
  removeReviewEvent: jest.fn().mockResolvedValue(undefined),
}));

import {
  MemoryDeckProvider,
  useMemoryDeck,
  type MemoryDeckContextValue,
} from '../src/context/MemoryDeckContext';
import {DEFAULT_EASE as SRS_DEFAULT_EASE} from '../src/lib/memory/srs';

/** `count` interval-bearing review events, all recalled (retention = 1.0). */
function recalledEvents(count: number): ReviewEvent[] {
  const now = Date.now();
  return Array.from({length: count}, (_, k) => ({
    id: `John/3/16__${now - k * 1000}`,
    verseKey: 'John/3/16',
    bookName: 'John',
    grade: 'good',
    boxBefore: 1,
    boxAfter: 2,
    intervalDays: 3,
    reviewedAt: now - k * 1000,
  }));
}

let captured: MemoryDeckContextValue | null = null;
function Capture() {
  captured = useMemoryDeck();
  return <Text>{captured.cards.length}</Text>;
}

/** Mount the provider and wait until hydration + the async prior load settle. */
async function mountAndSettle() {
  render(
    <MemoryDeckProvider>
      <Capture />
    </MemoryDeckProvider>,
  );
  await waitFor(() => expect(captured?.hydrated).toBe(true));
  // Flush the async refreshEasePrior (getAllReviewEvents → summary → prior).
  await act(async () => {
    await new Promise(resolve => setTimeout(resolve, 0));
  });
}

describe('MemoryDeckContext — calibrated ease prior', () => {
  beforeEach(async () => {
    captured = null;
    mockGetAllReviewEvents.mockReset();
    // The AsyncStorage mock persists across tests — clear the deck blob so a
    // card added by one test doesn't rehydrate (and dedupe) into the next.
    await AsyncStorage.clear();
  });

  // Unmount the previous provider so its Capture can't clobber `captured`
  // (auto-cleanup isn't guaranteed under this jest-expo setup).
  afterEach(() => {
    cleanup();
  });

  it('seeds a newly added card with the calibrated population prior', async () => {
    // 40 interval-bearing reviews, all recalled → retention 1.0 → ease up.
    mockGetAllReviewEvents.mockResolvedValue(recalledEvents(40));
    await mountAndSettle();

    await act(async () => {
      captured!.addCard({
        bookName: 'Psalms',
        chapter: 23,
        verse: 1,
        text: 'The LORD is my shepherd…',
        version: 'KJV',
      });
    });
    await waitFor(() => expect(captured!.cards.length).toBe(1));

    const expected =
      SRS_DEFAULT_EASE + EASE_PRIOR_SENSITIVITY * (1 - TARGET_RETENTION);
    expect(captured!.cards[0].ease).toBeCloseTo(expected, 5);
    expect(captured!.cards[0].ease).toBeGreaterThan(SRS_DEFAULT_EASE);
  });

  it('falls back to the default ease when the log is too sparse', async () => {
    // Below MIN_CALIBRATION_REVIEWS → uncalibrated → plain Leitner.
    mockGetAllReviewEvents.mockResolvedValue(recalledEvents(5));
    await mountAndSettle();

    await act(async () => {
      captured!.addCard({
        bookName: 'Psalms',
        chapter: 23,
        verse: 1,
        text: 'The LORD is my shepherd…',
        version: 'KJV',
      });
    });
    await waitFor(() => expect(captured!.cards.length).toBe(1));

    expect(captured!.cards[0].ease).toBe(SRS_DEFAULT_EASE);
  });
});
