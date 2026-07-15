/**
 * Tanda O — the "Auto" (auto-scroll timer) button is a genuine dead control
 * for a FREE user in one specific state: audio already bound to this same
 * chapter AND playing.
 *
 * `listening = isPremium && audioBound` gates the combined play/pause
 * button, so a free listener never sees it — they always land on the
 * "Auto"/"Avance automático" branch instead. But the auto-scroll effect's
 * own guard (`!(audioBound && audioState.isPlaying)`) skips scheduling in
 * that exact state, since the audio engine already owns `currentIndex`.
 * Tapping "Auto" there toggles local state with zero observable effect on
 * verse advancement — a dead control, not just a confusingly-labeled one.
 *
 * This test pins that the button now renders disabled in that narrow state,
 * and stays fully interactive everywhere else (e.g. audio bound but paused).
 */
import React, {useEffect} from 'react';
import {render, waitFor} from '@testing-library/react-native';
import Purchases from 'react-native-purchases';
import * as SecureStore from 'expo-secure-store';
import {ImmersiveReader} from '../src/components/reading/ImmersiveReader';
import {
  AudioPlayerProvider,
  useAudioPlayer,
} from '../src/features/audio/context/AudioPlayerContext';
import {PremiumProvider} from '../src/context/PremiumContext';
import {ENTITLEMENT_CACHE_KEY} from '../src/lib/offering/entitlementCache';
import {__resetForTests} from '../src/lib/offering/offeringService';
import {translations} from '../src/i18n/translations';
import type {AudioVerse} from '../src/features/audio/types/audio';
import type {BibleVerse} from '../src/types/bible';

const mockPurchases = Purchases as unknown as {
  __setCustomerInfo: (info: unknown) => void;
  __reset: () => void;
};

// Unlike the sibling immersiveReaderFreeFollow test, `speak` here actually
// fires `onStart` synchronously so `play()` flips audioState.isPlaying to
// true — this test needs a real "audio is playing" state, not just "bound".
jest.mock('expo-speech', () => ({
  speak: jest.fn((_text: string, options?: {onStart?: () => void}) => {
    options?.onStart?.();
    return Promise.resolve();
  }),
  stop: jest.fn(() => Promise.resolve()),
  getAvailableVoicesAsync: jest.fn(() => Promise.resolve([])),
}));

jest.mock('expo-haptics', () => ({
  ImpactFeedbackStyle: {Light: 'light', Medium: 'medium', Heavy: 'heavy'},
  NotificationFeedbackType: {
    Success: 'success',
    Warning: 'warning',
    Error: 'error',
  },
  impactAsync: jest.fn(() => Promise.resolve()),
  selectionAsync: jest.fn(() => Promise.resolve()),
  notificationAsync: jest.fn(() => Promise.resolve()),
}));

jest.mock('expo-linear-gradient', () => {
  const {View} = require('react-native');
  return {LinearGradient: View};
});

// Same rationale as immersiveReaderFreeFollow.test.tsx: TouchableOpacity's
// built-in press animation throws when react-test-renderer re-renders a
// mounted instance with no real native view tag. A plain View swap keeps
// this test scoped to props/label queries only.
jest.mock(
  'react-native/Libraries/Components/Touchable/TouchableOpacity',
  () => {
    const {View} = require('react-native');
    return {__esModule: true, default: View};
  },
);

jest.mock('@expo/vector-icons', () => ({Ionicons: () => null}));

jest.mock('@hooks/useTheme', () => ({
  useTheme: () => ({
    colors: {background: '#000000', primary: '#6366f1'},
    isDark: true,
    gradient: undefined,
  }),
}));

jest.mock('@hooks/useLanguage', () => ({
  useLanguage: () => ({
    language: 'es',
    t: require('../src/i18n/translations').translations.es,
  }),
}));

jest.mock('@hooks/useBibleVersion', () => ({
  useBibleVersion: () => ({
    selectedVersion: {id: 'RVR1960', language: 'es', abbreviation: 'RVR1960'},
  }),
  useBibleVersionOptional: () => ({
    selectedVersion: {id: 'RVR1960', language: 'es', abbreviation: 'RVR1960'},
  }),
}));

jest.mock('@context/ReaderPreferencesContext', () => ({
  useReaderPreferences: () => ({
    preferences: {theme: 'system', fontFamily: 'sans'},
  }),
}));

const t = translations.es;

const bibleVerses: BibleVerse[] = [1, 2, 3, 4, 5].map(v => ({
  id: v,
  book: 'Génesis',
  bookNumber: 1,
  chapter: 1,
  verse: v,
  text: `Verso ${v}`,
  version: 'RVR1960',
}));

const audioVerses: AudioVerse[] = bibleVerses.map(v => ({
  book: v.book,
  chapter: v.chapter,
  verse: v.verse,
  text: v.text,
}));

/** Primes the shared AudioPlayerProvider as if audio were already bound to
 * this chapter from OUTSIDE the immersive reader (e.g. the free mini-player),
 * optionally starting playback so `audioState.isPlaying` becomes true. */
function AudioEngineHarness({startPlaying}: {startPlaying: boolean}) {
  const {loadChapter, goToVerse, play} = useAudioPlayer();
  useEffect(() => {
    loadChapter(audioVerses);
    goToVerse(0);
    if (startPlaying) {
      play();
    }
  }, []);
  return null;
}

function renderImmersive(opts: {bindAudio: boolean; playing: boolean}) {
  return render(
    <PremiumProvider>
      <AudioPlayerProvider>
        {opts.bindAudio && <AudioEngineHarness startPlaying={opts.playing} />}
        <ImmersiveReader
          verses={bibleVerses}
          onClose={jest.fn()}
          startIndex={0}
        />
      </AudioPlayerProvider>
    </PremiumProvider>,
  );
}

describe('ImmersiveReader — "Auto" button disabled in the free dead-control state (Tanda O)', () => {
  beforeEach(async () => {
    __resetForTests();
    mockPurchases.__reset();
    await SecureStore.deleteItemAsync(ENTITLEMENT_CACHE_KEY);
  });

  it('free user, audio bound to this chapter AND playing: Auto renders disabled', async () => {
    const {getByLabelText} = renderImmersive({bindAudio: true, playing: true});

    await waitFor(() => {
      const button = getByLabelText(t.verse.autoPlay);
      expect(button.props.disabled).toBe(true);
      expect(button.props.accessibilityState?.disabled).toBe(true);
    });
  });

  it('free user, audio bound but PAUSED: Auto stays enabled', async () => {
    const {getByLabelText} = renderImmersive({bindAudio: true, playing: false});

    // Give any (absent) async transition a chance to settle, then assert the
    // button never entered the disabled state.
    await waitFor(() => {
      const button = getByLabelText(t.verse.autoPlay);
      expect(button.props.disabled).toBeFalsy();
      expect(button.props.accessibilityState?.disabled).toBeFalsy();
    });
  });

  it('free user, no audio bound at all: Auto stays enabled', async () => {
    const {getByLabelText} = renderImmersive({
      bindAudio: false,
      playing: false,
    });

    await waitFor(() => {
      const button = getByLabelText(t.verse.autoPlay);
      expect(button.props.disabled).toBeFalsy();
      expect(button.props.accessibilityState?.disabled).toBeFalsy();
    });
  });
});
