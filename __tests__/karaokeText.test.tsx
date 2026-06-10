/**
 * Sprint 76 — KaraokeText: word-by-word highlight in the NORMAL reader.
 *
 * The pure span math (tokenizeForKaraoke / activeTokenIndex) is covered by
 * karaoke.test.ts; these tests pin the component contract — subscribe only
 * while active, ignore other verses' boundaries, re-render just this node per
 * word, and fall back to children until a boundary arrives.
 */
import React from 'react';
import {Text} from 'react-native';
import {render, act} from '@testing-library/react-native';
import {KaraokeText} from '../src/features/audio/components/KaraokeText';
import type {SpeechBoundary} from '../src/features/audio/types/audio';

// Fan-out double for the provider: capture subscribers, push boundaries.
const mockListeners = new Set<(b: SpeechBoundary) => void>();
jest.mock('../src/features/audio/context/AudioPlayerContext', () => ({
  useAudioPlayer: () => ({
    subscribeToBoundary: (cb: (b: SpeechBoundary) => void) => {
      mockListeners.add(cb);
      return () => mockListeners.delete(cb);
    },
  }),
}));

const emitBoundary = (boundary: SpeechBoundary) => {
  act(() => {
    mockListeners.forEach(cb => cb(boundary));
  });
};

const VERSE = 'Jehová es mi pastor; nada me faltará.';
const WORD_STYLE = {fontWeight: '700'} as const;

const renderKaraoke = (active: boolean) =>
  render(
    <Text>
      <KaraokeText
        text={VERSE}
        verseIndex={3}
        active={active}
        wordStyle={WORD_STYLE}>
        {VERSE}
      </KaraokeText>
    </Text>,
  );

afterEach(() => mockListeners.clear());

describe('KaraokeText', () => {
  it('renders the fallback children until a boundary arrives', () => {
    const screen = renderKaraoke(true);
    expect(screen.getByText(VERSE)).toBeTruthy();
  });

  it('does not subscribe while inactive', () => {
    renderKaraoke(false);
    expect(mockListeners.size).toBe(0);
  });

  it('lights the word at the boundary, splitting the verse into runs', () => {
    const screen = renderKaraoke(true);
    expect(mockListeners.size).toBe(1);

    // "pastor;" starts at char 13. The lit word becomes its own styled run
    // (the wrapping Text still composes the full verse around it).
    emitBoundary({verseIndex: 3, charIndex: 13, charLength: 6});

    expect(screen.getByText('pastor;')).toBeTruthy();
  });

  it("ignores boundaries for OTHER verses' engine indices", () => {
    const screen = renderKaraoke(true);

    emitBoundary({verseIndex: 9, charIndex: 13, charLength: 6});

    expect(screen.getByText(VERSE)).toBeTruthy();
    expect(screen.queryByText('pastor;')).toBeNull();
  });

  it('drops the highlight (and subscription) when deactivated', () => {
    const screen = renderKaraoke(true);
    emitBoundary({verseIndex: 3, charIndex: 13, charLength: 6});
    expect(screen.getByText('pastor;')).toBeTruthy();

    screen.rerender(
      <Text>
        <KaraokeText
          text={VERSE}
          verseIndex={3}
          active={false}
          wordStyle={WORD_STYLE}>
          {VERSE}
        </KaraokeText>
      </Text>,
    );

    expect(screen.getByText(VERSE)).toBeTruthy();
    expect(mockListeners.size).toBe(0);
  });

  it('advances the lit word as later boundaries arrive', () => {
    const screen = renderKaraoke(true);

    emitBoundary({verseIndex: 3, charIndex: 0, charLength: 6});
    expect(screen.getByText('Jehová')).toBeTruthy();

    // "faltará." ends the verse (starts at char 29).
    emitBoundary({verseIndex: 3, charIndex: 29, charLength: 7});
    expect(screen.getByText('faltará.')).toBeTruthy();
    expect(screen.queryByText('Jehová')).toBeNull();
  });
});
