/**
 * T24c — immersive passive follow freed from the premium gate (batch 3 #3).
 *
 * Before this fix, `listening = isPremium && audioBound` gated BOTH the
 * draggable scrubber/karaoke AND the passive "move the displayed verse to
 * match the audio engine" effect — so a free listener (Victor's real-device
 * report, release APK) who started audio elsewhere and opened the immersive
 * reader saw it freeze on the verse it opened on, never following along,
 * even though the normal (non-immersive) reader already follows audio for
 * free. The fix keys the follow effect off `audioBound` alone (same-chapter
 * bound, entitlement-agnostic) while the scrubber/karaoke stay keyed off
 * `listening` (still premium-only) — this test pins that split.
 */
import {useEffect} from 'react';
import {render} from '@testing-library/react-native';
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

jest.mock('expo-speech', () => ({
  speak: jest.fn(),
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

// TouchableOpacity's built-in press animation calls Animated.timing(...,
// {useNativeDriver: true}).start(), which tries to attach to a real native
// view tag on re-render (componentDidUpdate) — react-test-renderer has no
// such tag, so any post-mount prop change on a TouchableOpacity (e.g. the
// Previous/Next buttons' `disabled` flipping once the follow effect moves
// currentIndex) throws "Unable to locate attached view in the native tree".
// A plain View swap sidesteps the animation entirely; this test only needs
// text/label queries, not real touch feedback.
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

/** Primes the shared AudioPlayerProvider as if audio were already playing
 * this chapter from OUTSIDE the immersive reader (e.g. the free mini-player)
 * — the exact scenario from Victor's report. */
function AudioEngineHarness({seedIndex}: {seedIndex: number}) {
  const {loadChapter, goToVerse} = useAudioPlayer();
  useEffect(() => {
    loadChapter(audioVerses);
    goToVerse(seedIndex);
  }, []);
  return null;
}

function renderImmersive(seedIndex: number) {
  return render(
    <PremiumProvider>
      <AudioPlayerProvider>
        <AudioEngineHarness seedIndex={seedIndex} />
        <ImmersiveReader
          verses={bibleVerses}
          onClose={jest.fn()}
          startIndex={0}
        />
      </AudioPlayerProvider>
    </PremiumProvider>,
  );
}

describe('ImmersiveReader — free passive follow (T24c)', () => {
  beforeEach(async () => {
    __resetForTests();
    mockPurchases.__reset();
    await SecureStore.deleteItemAsync(ENTITLEMENT_CACHE_KEY);
  });

  it('free listener: moves off the opening verse to match audio already bound to this chapter', async () => {
    const {findByText} = renderImmersive(3);
    // Opened at startIndex 0 (verse 1/5); the engine is bound to this same
    // chapter at index 3 (verse 4). The follow effect should move the
    // displayed progress to match the engine, with NO premium entitlement.
    expect(await findByText(/4 \/ 5/)).toBeTruthy();
  });

  it('free listener: the draggable scrubber and "Escuchar" control stay premium-gated', async () => {
    const {findByText, queryByLabelText, queryByText} = renderImmersive(3);
    await findByText(/4 \/ 5/);
    // The scrubber (rendered only when `listening` = isPremium && audioBound)
    // never appears for a free listener, even though the follow moved.
    expect(queryByLabelText(t.audio.scrub.a11yLabel)).toBeNull();
    expect(queryByText(t.audio.immersive.listen)).toBeNull();
  });
});
