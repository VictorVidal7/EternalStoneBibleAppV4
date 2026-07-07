import {Platform} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useAudioPlayer, PLAYER_DIMENSIONS} from '../features/audio';

// Mirrors app/(tabs)/_layout.tsx's tabBarBaseHeight — the tab bar is
// absolutely positioned, so it doesn't push scrollable content up on its own.
const TAB_BAR_BASE_HEIGHT = Platform.OS === 'ios' ? 88 : 68;

/**
 * Bottom padding for scrollable content on a root tab screen, so the last
 * item clears the floating tab bar and, when it's on screen, the floating
 * MiniAudioPlayer riding above it (app/_layout.tsx). Both float outside
 * normal layout flow, so nothing else reserves space for them.
 */
export function useContentBottomInset(): number {
  const insets = useSafeAreaInsets();
  const {isVisible, isSuppressed, currentVerse, verses} = useAudioPlayer();
  const miniPlayerVisible =
    isVisible && !isSuppressed && !!currentVerse && verses.length > 0;

  return (
    TAB_BAR_BASE_HEIGHT +
    insets.bottom +
    (miniPlayerVisible
      ? PLAYER_DIMENSIONS.collapsedHeight + PLAYER_DIMENSIONS.bottomMargin
      : 0)
  );
}
