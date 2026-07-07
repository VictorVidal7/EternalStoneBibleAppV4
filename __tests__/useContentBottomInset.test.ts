/**
 * Tests for useContentBottomInset — the shared bottom-clearance hook for
 * scrollable content on root tab screens (tab bar + floating mini-player).
 */

import {renderHook} from '@testing-library/react-native';
import {Platform} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useAudioPlayer, PLAYER_DIMENSIONS} from '../src/features/audio';
import {useContentBottomInset} from '../src/hooks/useContentBottomInset';

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: jest.fn(),
}));

jest.mock('../src/features/audio', () => ({
  useAudioPlayer: jest.fn(),
  PLAYER_DIMENSIONS: {
    collapsedHeight: 64,
    expandedHeight: 248,
    borderRadius: 20,
    bottomMargin: 16,
    horizontalPadding: 24,
  },
}));

const tabBarBaseHeight = Platform.OS === 'ios' ? 88 : 68;

describe('useContentBottomInset', () => {
  beforeEach(() => {
    (useSafeAreaInsets as jest.Mock).mockReturnValue({
      bottom: 20,
      top: 0,
      left: 0,
      right: 0,
    });
  });

  it('returns tab bar height + safe-area inset when no audio is loaded', () => {
    (useAudioPlayer as jest.Mock).mockReturnValue({
      isVisible: false,
      isSuppressed: false,
      currentVerse: null,
      verses: [],
    });
    const {result} = renderHook(() => useContentBottomInset());
    expect(result.current).toBe(tabBarBaseHeight + 20);
  });

  it('adds the collapsed mini-player clearance when it is visible', () => {
    (useAudioPlayer as jest.Mock).mockReturnValue({
      isVisible: true,
      isSuppressed: false,
      currentVerse: {book: 'Juan', chapter: 3, verse: 16, text: '...'},
      verses: [{book: 'Juan', chapter: 3, verse: 16, text: '...'}],
    });
    const {result} = renderHook(() => useContentBottomInset());
    expect(result.current).toBe(
      tabBarBaseHeight +
        20 +
        PLAYER_DIMENSIONS.collapsedHeight +
        PLAYER_DIMENSIONS.bottomMargin,
    );
  });

  it('treats a suppressed player the same as hidden', () => {
    (useAudioPlayer as jest.Mock).mockReturnValue({
      isVisible: true,
      isSuppressed: true,
      currentVerse: {book: 'Juan', chapter: 3, verse: 16, text: '...'},
      verses: [{book: 'Juan', chapter: 3, verse: 16, text: '...'}],
    });
    const {result} = renderHook(() => useContentBottomInset());
    expect(result.current).toBe(tabBarBaseHeight + 20);
  });

  it('treats an empty verse list the same as hidden', () => {
    (useAudioPlayer as jest.Mock).mockReturnValue({
      isVisible: true,
      isSuppressed: false,
      currentVerse: null,
      verses: [],
    });
    const {result} = renderHook(() => useContentBottomInset());
    expect(result.current).toBe(tabBarBaseHeight + 20);
  });
});
