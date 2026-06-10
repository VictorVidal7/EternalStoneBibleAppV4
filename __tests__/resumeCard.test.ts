/**
 * resumeCard — pure policy for the Home "Continue listening" card (Sprint 75).
 *
 * The card was effectively dead since Sprint 53 (the cold-start restore won the
 * same isResumable window and the card required !playerVisible). These tests
 * lock the revived three-mode table: navigate / resume / hidden.
 */

import {resumeCardMode} from '../src/features/audio/lib/resumeCard';
import {RESUME_MAX_AGE_MS} from '../src/features/audio/lib/playbackPosition';
import type {PlaybackPosition} from '../src/features/audio/lib/playbackPosition';

const NOW = 1_750_000_000_000;

const position = (
  overrides: Partial<PlaybackPosition> = {},
): PlaybackPosition => ({
  book: 'Psalms',
  chapter: 118,
  verseIndex: 11,
  verse: 12,
  totalVerses: 29,
  updatedAt: NOW - 60_000,
  ...overrides,
});

const base = {
  isPremium: true,
  position: position(),
  now: NOW,
  playerVisible: false,
  playerPlaying: false,
  playerLocation: null,
};

describe('resumeCardMode', () => {
  it('hides for free users', () => {
    expect(resumeCardMode({...base, isPremium: false})).toBe('hidden');
  });

  it('hides without a saved position', () => {
    expect(resumeCardMode({...base, position: null})).toBe('hidden');
  });

  it('hides a stale position (older than the 30-day resume window)', () => {
    expect(
      resumeCardMode({
        ...base,
        position: position({updatedAt: NOW - RESUME_MAX_AGE_MS - 1}),
      }),
    ).toBe('hidden');
  });

  it('navigates when the player is not up (original S51 path)', () => {
    expect(resumeCardMode(base)).toBe('navigate');
  });

  it('hides while audio is actively playing (the player is the surface)', () => {
    expect(
      resumeCardMode({
        ...base,
        playerVisible: true,
        playerPlaying: true,
        playerLocation: {bookId: 19, chapter: 118},
      }),
    ).toBe('hidden');
  });

  it('resumes when the player sits paused on the saved chapter (S53 restore)', () => {
    expect(
      resumeCardMode({
        ...base,
        playerVisible: true,
        playerLocation: {bookId: 19, chapter: 118},
      }),
    ).toBe('resume');
  });

  it('hides when the paused player holds a DIFFERENT chapter (user moved on)', () => {
    expect(
      resumeCardMode({
        ...base,
        playerVisible: true,
        playerLocation: {bookId: 19, chapter: 119},
      }),
    ).toBe('hidden');
  });

  it('hides when the paused player holds another book entirely', () => {
    expect(
      resumeCardMode({
        ...base,
        playerVisible: true,
        playerLocation: {bookId: 43, chapter: 3},
      }),
    ).toBe('hidden');
  });

  it('hides when the player is up but has no loaded chapter', () => {
    expect(
      resumeCardMode({...base, playerVisible: true, playerLocation: null}),
    ).toBe('hidden');
  });

  it('hides when the saved book name is unknown (no canonical match)', () => {
    expect(
      resumeCardMode({
        ...base,
        position: position({book: 'Atlantis'}),
        playerVisible: true,
        playerLocation: {bookId: 19, chapter: 118},
      }),
    ).toBe('hidden');
  });

  it('matches the saved chapter across languages (Salmos ↔ Psalms)', () => {
    expect(
      resumeCardMode({
        ...base,
        position: position({book: 'Salmos'}),
        playerVisible: true,
        playerLocation: {bookId: 19, chapter: 118},
      }),
    ).toBe('resume');
  });
});
