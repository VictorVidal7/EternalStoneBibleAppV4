/**
 * Regression — R9-427: closing the floating player with the ✕ (which only
 * exists in the EXPANDED view) must not leave it broken for the next audio.
 *
 * Bug: the ✕ calls the context's `hidePlayer`, which sets `isExpanded: false`
 * and hides the player, but the animated value `expandProgress` stayed at 1 —
 * only the local expand/collapse handlers moved it, and the component stays
 * mounted while hidden. The next `loadChapter` showed the panel at expanded
 * height (248) with the expanded view visible, while `pointerEvents`/`zIndex`
 * came from `isExpanded = false`: the visible buttons were dead and the
 * collapsed ones sat on top, invisible.
 *
 * Fix: an effect makes `expandProgress` follow `state.isExpanded`, whoever
 * changed it.
 *
 * The REAL component. Mocked: the audio context (a tiny external store), the
 * heavy children, theme/language/toast/premium/favorites, expo-router,
 * expo-blur. Reanimated: the library's own mock with the two pieces the bug
 * lives in given their real semantics — `useSharedValue` PERSISTS across
 * renders (the stock mock makes a new one per render, which hides the bug: the
 * test would be green with and without the fix) and `interpolate` is linear
 * with clamping (the stock mock returns undefined).
 */
import {render, fireEvent, act} from '@testing-library/react-native';
import {StyleSheet} from 'react-native';
import type {ReactTestInstance} from 'react-test-renderer';

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

jest.mock('../src/features/audio/context/AudioPlayerContext', () => {
  const R = require('react');
  const store: {
    listeners: Set<() => void>;
    isVisible: boolean;
    isExpanded: boolean;
    value: unknown;
    calls: string[];
  } = {
    listeners: new Set(),
    isVisible: true,
    isExpanded: false,
    value: null,
    calls: [],
  };
  const emit = () => {
    store.value = null;
    store.listeners.forEach(listener => listener());
  };
  const verses = [1, 2].map(verse => ({
    id: verse,
    book: 'Juan',
    chapter: 3,
    verse,
    text: `Juan 3:${verse}`,
    version: 'RVR1960',
  }));
  const noop = () => {};
  const sleepTimer = {
    isActive: false,
    remainingMinutes: 0,
    endTime: null,
    mode: null,
  };
  const queueInfo = {mode: 'chapter', label: null};
  const build = () => ({
    state: {
      isPlaying: true,
      isPaused: false,
      isLoading: false,
      currentVerseIndex: 0,
      totalVerses: 2,
      playbackSpeed: 1,
      selectedVoice: null,
      selectedLanguage: 'es-ES',
      contentLanguage: 'es',
      contentVersionId: 'RVR1960',
      isExpanded: store.isExpanded,
      bottomOffset: 0,
      chapterEndCount: 0,
    },
    sleepTimer,
    currentVerse: verses[0],
    verses,
    isVisible: store.isVisible,
    isSuppressed: false,
    togglePlayPause: () => store.calls.push('togglePlayPause'),
    nextVerse: noop,
    previousVerse: noop,
    goToVerse: noop,
    setPlaybackSpeed: noop,
    expand: () => {
      store.isExpanded = true;
      emit();
    },
    collapse: () => {
      store.isExpanded = false;
      emit();
    },
    // What the real hidePlayer does to the two fields this component reads.
    hidePlayer: async () => {
      store.calls.push('hidePlayer');
      store.isVisible = false;
      store.isExpanded = false;
      emit();
    },
    setSleepTimer: noop,
    setSleepTimerEndOfChapter: noop,
    setSleepTimerEndOfBook: noop,
    cancelSleepTimer: noop,
    setVoice: noop,
    clearVoice: noop,
    setLanguage: noop,
    autoAdvanceChapter: true,
    setAutoAdvanceChapter: noop,
    readerFollowsAudio: false,
    setReaderFollowsAudio: noop,
    repeatVerse: false,
    setRepeatVerse: noop,
    queueInfo,
    hasSpainVoice: true,
  });
  const subscribe = (listener: () => void) => {
    store.listeners.add(listener);
    return () => store.listeners.delete(listener);
  };
  const get = () => {
    if (!store.value) store.value = build();
    return store.value;
  };
  return {
    __esModule: true,
    useAudioPlayer: () => R.useSyncExternalStore(subscribe, get),
    __store: store,
    __emit: emit,
  };
});

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
  const value = {isPremium: true};
  return {usePremium: () => value};
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
jest.mock('../src/features/audio/components/SleepTimerModal', () => ({
  SleepTimerModal: () => null,
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
import {PLAYER_DIMENSIONS} from '../src/features/audio/constants/audioConstants';
import {translations} from '../src/i18n/translations';

const t = translations.es;
const ctx = jest.requireMock(
  '../src/features/audio/context/AudioPlayerContext',
) as {
  __store: {isVisible: boolean; isExpanded: boolean; calls: string[]};
  __emit: () => void;
};
const COLLAPSED = PLAYER_DIMENSIONS.collapsedHeight;
const EXPANDED = PLAYER_DIMENSIONS.expandedHeight;

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

function setStore(patch: {isVisible?: boolean; isExpanded?: boolean}) {
  act(() => {
    Object.assign(ctx.__store, patch);
    ctx.__emit();
  });
}

describe('R9-427 — MiniAudioPlayer after being closed with the ✕', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    ctx.__store.calls = [];
    setStore({isVisible: true, isExpanded: false});
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('expand → ✕ → next audio: it comes back COLLAPSED, and its controls respond', async () => {
    const screen = render(<MiniAudioPlayer />);
    expect(measure(screen)).toEqual(COLLAPSED_VIEW);

    pressExpand(screen);
    expect(measure(screen)).toEqual(EXPANDED_VIEW);

    await act(async () => {
      fireEvent.press(screen.getByLabelText(t.audio.a11y.close));
    });
    expect(ctx.__store.calls).toEqual(['hidePlayer']);
    expect(screen.toJSON()).toBeNull();
    pastTheTapLock();

    // Any loadChapter shows the player again.
    setStore({isVisible: true});

    expect(measure(screen)).toEqual(COLLAPSED_VIEW);

    // And it is usable: the expand button the user now sees does expand.
    pressExpand(screen);
    expect(ctx.__store.isExpanded).toBe(true);
    expect(measure(screen)).toEqual(EXPANDED_VIEW);
    screen.unmount();
  });

  it('control — expand → collapse with the chevron → hidden → shown: collapsed', () => {
    const screen = render(<MiniAudioPlayer />);
    pressExpand(screen);
    pastTheTapLock();
    fireEvent.press(screen.getByLabelText(t.audio.a11y.collapse));
    pastTheTapLock();

    setStore({isVisible: false});
    setStore({isVisible: true});

    expect(measure(screen)).toEqual(COLLAPSED_VIEW);
    screen.unmount();
  });

  it('mirror — the state expands WITHOUT the local button (the context): the panel follows', () => {
    const screen = render(<MiniAudioPlayer />);

    setStore({isExpanded: true});
    // The mock computes animated styles at render time only (in the app they
    // follow the shared value on the UI thread), so paint once more to read
    // what the effect left in `expandProgress`.
    setStore({});

    expect(measure(screen)).toEqual(EXPANDED_VIEW);
    screen.unmount();
  });

  it('hidden while still expanded (not the ✕), then shown: it comes back expanded, as the state says', () => {
    const screen = render(<MiniAudioPlayer />);
    pressExpand(screen);
    pastTheTapLock();

    setStore({isVisible: false});
    expect(screen.toJSON()).toBeNull();
    setStore({isVisible: true});

    expect(measure(screen)).toEqual(EXPANDED_VIEW);
    screen.unmount();
  });
});
