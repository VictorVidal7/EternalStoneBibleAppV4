/**
 * R9-572 (S180) — the R9-427 test (miniAudioPlayerCloseResetsExpand) replaces
 * the audio context with a store whose `hidePlayer` sets `isExpanded = false`;
 * the real one left it `true` (R9-571: `stop()` rebuilt the state from a ref
 * that still said expanded, and its object overwrote the queued collapse). So
 * that test pinned a path the app never took: live, expand → ✕ → next audio
 * came back EXPANDED (248 px), with and without the R9-427 effect.
 *
 * This is the user's path on the REAL `AudioPlayerProvider` under the REAL
 * `MiniAudioPlayer`: expand with the button, close with the ✕, load the next
 * chapter. It comes back collapsed, and usable.
 *
 * Same boundary mocks as the R9-427 test (Reanimated with a persistent
 * `useSharedValue` and a linear `interpolate`, the heavy children, theme,
 * language, toast, premium, favorites, router, blur), plus expo-speech and the
 * selected version for the provider.
 */
import {render, fireEvent, act} from '@testing-library/react-native';
import {StyleSheet} from 'react-native';
import type {ReactTestInstance} from 'react-test-renderer';
import AsyncStorage from '@react-native-async-storage/async-storage';

jest.mock('react-native-reanimated', () => {
  const R = require('react');
  const base = require('react-native-reanimated/mock');
  const interpolate = (x: number, input: number[], output: number[]) => {
    const t = Math.max(0, Math.min(1, (x - input[0]) / (input[1] - input[0])));
    return output[0] + (output[1] - output[0]) * t;
  };
  return {
    ...base,
    __esModule: true,
    default: base.default ?? base,
    useSharedValue: (init: unknown) => R.useRef({value: init}).current,
    interpolate,
  };
});

jest.mock('@hooks/useBibleVersion', () => {
  const version = {id: 'RVR1960', language: 'es'};
  return {
    useBibleVersion: () => ({selectedVersion: version}),
    useBibleVersionOptional: () => ({selectedVersion: version}),
  };
});
jest.mock('expo-speech', () => ({
  speak: jest.fn(),
  stop: jest.fn(() => Promise.resolve()),
  getAvailableVoicesAsync: jest.fn(() => Promise.resolve([])),
}));
jest.mock('../src/hooks/useTheme', () => {
  const colors = new Proxy({}, {get: () => '#123456'});
  const value = {isDark: false, colors};
  return {useTheme: () => value};
});
jest.mock('../src/hooks/useLanguage', () => {
  const value = {
    language: 'es',
    t: require('../src/i18n/translations').translations.es,
  };
  return {useLanguage: () => value};
});
jest.mock('../src/hooks/useReducedMotion', () => ({
  useReducedMotion: () => false,
}));
jest.mock('../src/context/ToastContext', () => {
  const value = {
    show: jest.fn(),
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
  };
  return {useToast: () => value};
});
jest.mock('../src/context/PremiumContext', () => {
  const value = {isPremium: true, isLoading: false};
  return {usePremium: () => value, usePremiumOptional: () => value};
});
jest.mock('../src/context/FavoritesContext', () => {
  const value = {
    favorites: [],
    addFavorite: jest.fn(),
    removeFavorite: jest.fn(),
    isFavorite: () => false,
  };
  return {useFavorites: () => value};
});
jest.mock('expo-router', () => ({usePathname: () => '/bible'}));
jest.mock('expo-blur', () => {
  const R = require('react');
  const {View} = require('react-native');
  return {
    BlurView: (props: {children?: unknown}) =>
      R.createElement(View, null, props.children),
  };
});
jest.mock('react-native-safe-area-context', () => {
  const insets = {top: 0, bottom: 0, left: 0, right: 0};
  return {useSafeAreaInsets: () => insets};
});
jest.mock('@components/ui/AppText', () => {
  const R = require('react');
  const {Text} = require('react-native');
  return {AppText: (props: object) => R.createElement(Text, props)};
});
jest.mock('@lib/haptics', () => ({
  haptics: new Proxy({}, {get: () => () => {}}),
}));
jest.mock('../src/features/audio/lib/narrationVoice', () => ({
  ...jest.requireActual('../src/features/audio/lib/narrationVoice'),
  shouldPromptForSpainVoice: () => false,
}));
jest.mock('../src/features/audio/components/AudioControls', () => ({
  AudioControls: () => null,
}));
jest.mock('../src/features/audio/components/AudioProgressBar', () => ({
  MiniVerseProgress: () => null,
}));
jest.mock('../src/features/audio/components/VerseScrubber', () => ({
  VerseScrubber: () => null,
}));
jest.mock('../src/features/audio/components/AudioWaveform', () => ({
  AudioWaveform: () => null,
}));
jest.mock('../src/features/audio/components/AudioSpeedSelector', () => ({
  AudioSpeedSelector: () => null,
}));
// The modal's props are captured (R9-573: what MiniAudioPlayer offers).
const mockSleepModalProps: {current: {showEndOfBook?: boolean} | null} = {
  current: null,
};
jest.mock('../src/features/audio/components/SleepTimerModal', () => ({
  SleepTimerModal: (props: {showEndOfBook?: boolean}) => {
    mockSleepModalProps.current = props;
    return null;
  },
}));
jest.mock('../src/features/audio/components/AudioQueueSheet', () => ({
  AudioQueueSheet: () => null,
}));
jest.mock('../src/features/audio/components/VoiceSelector', () => ({
  VoiceSelector: () => null,
}));
jest.mock('@components/FeatureGuideModal', () => ({
  FeatureGuideModal: () => null,
}));

import {MiniAudioPlayer} from '../src/features/audio/components/MiniAudioPlayer';
import {
  AudioPlayerProvider,
  useAudioPlayer,
} from '../src/features/audio/context/AudioPlayerContext';
import {PLAYER_DIMENSIONS} from '../src/features/audio/constants/audioConstants';
import type {AudioVerse} from '../src/features/audio/types/audio';
import {translations} from '../src/i18n/translations';

const t = translations.es;
const COLLAPSED = PLAYER_DIMENSIONS.collapsedHeight;
const EXPANDED = PLAYER_DIMENSIONS.expandedHeight;

const chapter = (n: number): AudioVerse[] =>
  [1, 2].map(verse => ({
    book: 'Juan',
    chapter: n,
    verse,
    text: `Juan ${n}:${verse}`,
  }));

type Player = ReturnType<typeof useAudioPlayer>;
const player: {current: Player | null} = {current: null};
function Probe() {
  player.current = useAudioPlayer();
  return null;
}

function mount() {
  return render(
    <AudioPlayerProvider>
      <Probe />
      <MiniAudioPlayer />
    </AudioPlayerProvider>,
  );
}

type Screen = ReturnType<typeof render>;
type Panel = {pointerEvents: string; opacity: number} | null;

/** The nearest ancestor that is one of the two cross-fading panels. */
function panelOf(node: ReactTestInstance | null): Panel {
  let current = node;
  while (current) {
    if (
      typeof current.type === 'string' &&
      current.props.pointerEvents !== undefined
    ) {
      const style = StyleSheet.flatten(current.props.style) || {};
      if (style.opacity !== undefined) {
        return {
          pointerEvents: current.props.pointerEvents,
          opacity: style.opacity,
        };
      }
    }
    current = current.parent;
  }
  return null;
}

/** What the user sees (height, opacities) vs. what takes the touches. */
function measure(screen: Screen) {
  const hosts = screen.UNSAFE_root.findAll(
    node => typeof node.type === 'string',
  );
  const container = hosts.find(node => {
    const style = StyleSheet.flatten(node.props.style) || {};
    return style.bottom !== undefined && style.height !== undefined;
  });
  const expandButtons = screen.queryAllByLabelText(t.audio.a11y.expand);
  return {
    height: container ? StyleSheet.flatten(container.props.style).height : null,
    collapsed: panelOf(expandButtons[expandButtons.length - 1] ?? null),
    expanded: panelOf(screen.queryByLabelText(t.audio.a11y.close)),
  };
}

const COLLAPSED_VIEW = {
  height: COLLAPSED,
  collapsed: {pointerEvents: 'auto', opacity: 1},
  expanded: {pointerEvents: 'none', opacity: 0},
};
const EXPANDED_VIEW = {
  height: EXPANDED,
  collapsed: {pointerEvents: 'none', opacity: 0},
  expanded: {pointerEvents: 'auto', opacity: 1},
};

/** Past the handlers' 300 ms double-tap lock. */
const pastTheTapLock = () =>
  act(() => {
    jest.advanceTimersByTime(350);
  });

function pressExpand(screen: Screen) {
  const buttons = screen.getAllByLabelText(t.audio.a11y.expand);
  fireEvent.press(buttons[buttons.length - 1]);
}

async function loadChapter(n: number) {
  await act(async () => {
    player.current!.loadChapter(chapter(n));
  });
  // The animated styles are computed at render time in the mock (in the app
  // they follow the shared value on the UI thread): paint once more to read
  // what the R9-427 effect left in `expandProgress`.
  await act(async () => {
    player.current!.setBottomOffset(0);
  });
}

describe('R9-571/R9-572 — the ✕ on the REAL audio provider', () => {
  beforeEach(async () => {
    jest.useFakeTimers();
    await AsyncStorage.clear();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('expand → ✕ → next chapter: it comes back COLLAPSED, and expanding works', async () => {
    const screen = mount();
    await loadChapter(3);
    expect(measure(screen)).toEqual(COLLAPSED_VIEW);

    pressExpand(screen);
    expect(player.current!.state.isExpanded).toBe(true);
    expect(measure(screen)).toEqual(EXPANDED_VIEW);
    pastTheTapLock();

    await act(async () => {
      fireEvent.press(screen.getByLabelText(t.audio.a11y.close));
    });
    expect(player.current!.isVisible).toBe(false);
    expect(screen.toJSON()).toBeNull();
    pastTheTapLock();

    await loadChapter(4);
    // What the user sees first (live, before the fix: 248 px, expanded)...
    expect(measure(screen)).toEqual(COLLAPSED_VIEW);
    // ...and why.
    expect(player.current!.state.isExpanded).toBe(false);

    pressExpand(screen);
    expect(player.current!.state.isExpanded).toBe(true);
    expect(measure(screen)).toEqual(EXPANDED_VIEW);
    screen.unmount();
  });

  it('control — the ✕ still stops narration and resets the position, as before', async () => {
    const screen = mount();
    await loadChapter(3);
    await act(async () => {
      player.current!.goToVerse(1);
    });
    pressExpand(screen);
    pastTheTapLock();
    await act(async () => {
      fireEvent.press(screen.getByLabelText(t.audio.a11y.close));
    });
    expect(player.current!.state).toEqual(
      expect.objectContaining({
        isPlaying: false,
        isPaused: false,
        currentVerseIndex: 0,
      }),
    );
    screen.unmount();
  });

  it('control — expand → chevron → hidden → next chapter: collapsed', async () => {
    const screen = mount();
    await loadChapter(3);
    pressExpand(screen);
    pastTheTapLock();
    fireEvent.press(screen.getByLabelText(t.audio.a11y.collapse));
    pastTheTapLock();
    await act(async () => {
      await player.current!.hidePlayer();
    });
    await loadChapter(4);
    expect(measure(screen)).toEqual(COLLAPSED_VIEW);
    screen.unmount();
  });
});

describe('R9-573 — "End of book" is not offered over a verse playlist', () => {
  beforeEach(async () => {
    jest.useFakeTimers();
    await AsyncStorage.clear();
    mockSleepModalProps.current = null;
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('a chapter offers it; a playlist does not; back to a chapter, offered again', async () => {
    const screen = mount();
    await loadChapter(3);
    expect(mockSleepModalProps.current?.showEndOfBook).toBe(true);

    await act(async () => {
      player.current!.loadChapter(chapter(3), {
        mode: 'playlist',
        label: 'Favoritos',
      });
    });
    expect(mockSleepModalProps.current?.showEndOfBook).toBe(false);

    await loadChapter(4);
    expect(mockSleepModalProps.current?.showEndOfBook).toBe(true);
    screen.unmount();
  });
});
