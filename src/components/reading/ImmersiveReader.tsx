/* eslint-disable react-native/no-color-literals, react-native/no-inline-styles --
   immersive reading uses its own theme palette (celestial slates + glass
   overlays) and positions decorative stars + recolors chrome inline per
   isDark / playback state (dynamic full-screen chrome). */
/**
 * 🌟 IMMERSIVE READING MODE
 *
 * Modo de lectura inmersivo cinematográfico con:
 * - Animaciones de fade/slide entre versículos
 * - Text-to-Speech narration
 * - Backgrounds celestiales animados
 * - Auto-scroll inteligente
 * - Controles minimalistas
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import React, {useState, useEffect, useRef, useCallback, useMemo} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Platform,
  StatusBar,
  GestureResponderEvent,
  useWindowDimensions,
  AccessibilityInfo,
} from 'react-native';
import {LinearGradient} from 'expo-linear-gradient';
import {Ionicons} from '@expo/vector-icons';
import {haptics} from '@lib/haptics';
import {BibleVerse} from '../../types/bible';
import {useTheme} from '../../hooks/useTheme';
import {useLanguage} from '../../hooks/useLanguage';
import {usePremium} from '../../context/PremiumContext';
import {
  localizedVerseReference,
  localizedChapterReference,
} from '../../lib/reading/verseReference';
import {useReaderPreferences} from '../../context/ReaderPreferencesContext';
import {resolveTypeface, immersiveLineHeight} from '../../lib/reader/typefaces';
import {immersiveHighContrastColors} from '../../lib/reading/immersiveTheme';
import {focusTrapProps, a11yHiddenProps} from '../../lib/a11y/focusTrap';
import {hitSlopToMinTarget} from '../../lib/a11y/touchTarget';
import {useScreenReaderListener} from '../../hooks/useScreenReaderListener';
import {useReducedMotion} from '../../hooks/useReducedMotion';
import {
  useAudioPlayer,
  toAudioVerses,
  isSameAudioChapter,
  bibleVersesFromAudio,
  clampVerseIndex,
  chapterLocationFromVerse,
  shouldFollowAudioChapter,
  tokenizeForKaraoke,
  activeTokenIndex,
} from '../../features/audio';
import type {SpeechBoundary} from '../../features/audio';
import {
  indexToFraction,
  positionToIndex,
} from '../../features/audio/lib/scrubMath';
import {useBibleVersion} from '../../hooks/useBibleVersion';

// Removed unused dimensions

interface ImmersiveReaderProps {
  verses: BibleVerse[];
  onClose: () => void;
  startIndex?: number;
}

type BackgroundType = 'celestial' | 'minimal' | 'nature' | 'paper';

const SEEK_THUMB = 16;
// The 44dp top controls (close / font size) fall short of the 48dp minimum.
const CONTROL_HIT_SLOP = hitSlopToMinTarget(44);

export const ImmersiveReader: React.FC<ImmersiveReaderProps> = ({
  verses: propVerses,
  onClose,
  startIndex = 0,
}) => {
  const {colors, isDark, gradient} = useTheme();
  // ♿ When the reader's WCAG-AAA High-Contrast theme (S60) is active, the
  // immersive surface drops its celestial chrome for pure black/white/amber.
  const {preferences: readerPrefs} = useReaderPreferences();
  const isHighContrast = readerPrefs.theme === 'high-contrast';
  const hcColors = immersiveHighContrastColors();
  // The reader's typeface preference applies HERE too (Sprint 81) — this
  // surface used to hardcode Georgia/serif, so the picker silently did
  // nothing for anyone reading (or auto-immersing) in immersive mode. Since
  // Sprint 82 the faces are bundled fonts, so the family name is the same on
  // both platforms (no platform branch).
  const verseFontFamily = useMemo(
    () => resolveTypeface(readerPrefs.fontFamily),
    [readerPrefs.fontFamily],
  );
  const {t, language} = useLanguage();
  const {isPremium} = usePremium();
  const {selectedVersion} = useBibleVersion();
  const {
    verses: audioVersesLoaded,
    state: audioState,
    loadChapter: loadAudioChapter,
    goToVerse: audioGoToVerse,
    play: audioPlay,
    pause: audioPause,
    setSuppressed,
    subscribeToBoundary,
  } = useAudioPlayer();

  // Internal copy of the chapter on screen. Starts at the host reader's chapter
  // (the `verses` prop); when continuous audio (S72) auto-advances across a
  // chapter boundary, the immersive RE-KEYS this to the engine's new chapter so
  // it keeps following the narration instead of stranding on the old one (S73).
  const [displayVerses, setDisplayVerses] = useState<BibleVerse[]>(propVerses);
  // Latch: have we bound to the audio engine for THIS displayed chapter at least
  // once? The cross-chapter follow only fires after binding, so the immersive is
  // never hijacked to an unrelated chapter the floating player may already hold.
  const audioBoundOnceRef = useRef(false);
  // Re-sync if the host reader changes chapter (immersive reopened on a new
  // passage) — reset the displayed chapter and clear the bind latch.
  useEffect(() => {
    setDisplayVerses(propVerses);
    audioBoundOnceRef.current = false;
  }, [propVerses]);
  // Everything below reads `verses`; it now points at the internal copy so the
  // whole surface follows the auto-advanced chapter with no further changes.
  const verses = displayVerses;

  const [currentIndex, setCurrentIndex] = useState(startIndex);
  const [autoScroll, setAutoScroll] = useState(false);
  const [showControls, setShowControls] = useState(true);
  // ♿ Drives the focus-trap safety: never auto-hide the controls (which hold
  // the labeled Close button) while a screen reader is active, so a trapped SR
  // user is never stranded — the exact risk S61 deferred this surface for.
  const screenReaderEnabled = useScreenReaderListener();
  const reduceMotion = useReducedMotion();
  const [backgroundType] = useState<BackgroundType>('celestial');
  const [fontSize, setFontSize] = useState(22);

  // ==================== PREMIUM AUDIO (Sprint 52) ====================
  // The immersive reader can host the TTS player for premium users: a "Listen"
  // control + the draggable VerseScrubber, with the verse following narration.
  // The audio engine and this reader share the SAME chapter, so their index
  // spaces stay 1:1 (see immersiveAudio helpers).
  const audioVerses = useMemo(() => toAudioVerses(verses), [verses]);
  // True when the audio engine already holds THIS chapter — either we loaded it
  // here, or it was already playing in the floating player when immersive opened.
  const audioBound = isSameAudioChapter(audioVersesLoaded, audioVerses);
  const listening = isPremium && audioBound;

  // 🎤 Karaoke (Sprint 75): the TTS word boundary last voiced. Subscribed only
  // while this surface is listening; the provider fans out via refs, so the
  // per-word updates re-render just this component.
  const [karaokeBoundary, setKaraokeBoundary] = useState<SpeechBoundary | null>(
    null,
  );
  useEffect(() => {
    if (!listening) return undefined;
    return subscribeToBoundary(setKaraokeBoundary);
  }, [listening, subscribeToBoundary]);

  // Localized verse reference, e.g. "Genesis 1:8" / "Génesis 1:8". The DB stores
  // the book name in the reading version's language (RVR1960 → Spanish "Juan"),
  // so we resolve it to the UI language to match the normal reader's header
  // (was showing the raw DB "Juan 3:1" while the header said "John 3").
  const localizedReference = useCallback(
    (v: BibleVerse | undefined) => localizedVerseReference(v, language),
    [language],
  );

  // Reference for the scrubber's drag preview.
  const labelForIndex = useCallback(
    (index: number) => localizedReference(verses[index]),
    [verses, localizedReference],
  );

  // Suppress the floating mini-player while immersive is open so its high
  // z-index can't draw over this full-screen modal. Audio keeps playing; on
  // close it re-surfaces in the floating player (continuity).
  useEffect(() => {
    setSuppressed(true);
    return () => setSuppressed(false);
  }, [setSuppressed]);

  // Follow the narration: when the audio engine advances the active verse,
  // move the immersive reader to match (one-way; user navigation pushes the
  // other direction imperatively, so there is no feedback loop).
  const boundIndex = audioState.currentVerseIndex;
  useEffect(() => {
    if (!listening) return;
    if (boundIndex >= 0 && boundIndex < verses.length) {
      setCurrentIndex(prev => (prev === boundIndex ? prev : boundIndex));
    }
  }, [listening, boundIndex, verses.length]);

  // Latch that we've bound to the engine for the current displayed chapter — the
  // gate for the cross-chapter follow below.
  useEffect(() => {
    if (audioBound) audioBoundOnceRef.current = true;
  }, [audioBound]);

  // ♾️ FOLLOW CONTINUOUS PLAYBACK ACROSS A CHAPTER BOUNDARY (Sprint 73).
  // When S72's AudioChapterAdvancer auto-advances, the engine swaps its loaded
  // verses to the next chapter; this re-keys the immersive to that exact chapter
  // — derived from the engine's own AudioVerse[] (the single source of truth for
  // what's being narrated) — and snaps to the verse now playing. One-way
  // (engine → immersive): it fires only on chapter IDENTITY change, never on the
  // verse index or the user's manual prev/next, so there is no feedback loop.
  const displayLocation = useMemo(
    () => chapterLocationFromVerse(displayVerses[0]),
    [displayVerses],
  );
  const engineLocation = useMemo(
    () => chapterLocationFromVerse(audioVersesLoaded[0]),
    [audioVersesLoaded],
  );
  useEffect(() => {
    if (!isPremium || !audioBoundOnceRef.current) return;
    if (!shouldFollowAudioChapter(displayLocation, engineLocation)) return;
    const nextVerses = bibleVersesFromAudio(
      audioVersesLoaded,
      selectedVersion.abbreviation,
    );
    if (nextVerses.length === 0) return;
    setDisplayVerses(nextVerses);
    setCurrentIndex(
      clampVerseIndex(audioState.currentVerseIndex, nextVerses.length),
    );
    // Announce + flash the chapter banner. `showChapterTransition` is declared
    // further down; the effect body runs post-commit so it's already bound (kept
    // out of the deps array to avoid a TDZ at render time — this eslint config
    // has no react-hooks/exhaustive-deps rule, so no suppression is needed).
    showChapterTransition(localizedChapterReference(nextVerses[0], language));
  }, [
    isPremium,
    displayLocation,
    engineLocation,
    audioVersesLoaded,
    selectedVersion.abbreviation,
    language,
  ]);

  // Start (or resume) listening from the verse the reader is on.
  const startListening = useCallback(() => {
    haptics.press();
    setAutoScroll(false); // audio-driven advance supersedes the reading timer
    const idx = clampVerseIndex(currentIndex, audioVerses.length);
    if (!isSameAudioChapter(audioVersesLoaded, audioVerses)) {
      loadAudioChapter(audioVerses);
    }
    audioGoToVerse(idx);
    // Small delay so loadChapter's state ref propagates before play (mirrors the
    // reader's startAudioPlayback; goToVerse already syncs the ref synchronously).
    setTimeout(() => audioPlay(), 100);
  }, [
    currentIndex,
    audioVerses,
    audioVersesLoaded,
    loadAudioChapter,
    audioGoToVerse,
    audioPlay,
  ]);

  const toggleListen = useCallback(() => {
    if (audioState.isPlaying) {
      audioPause();
    } else {
      startListening();
    }
  }, [audioState.isPlaying, audioPause, startListening]);

  const handleScrubberSeek = useCallback(
    (index: number) => {
      setCurrentIndex(index);
      audioGoToVerse(index);
    },
    [audioGoToVerse],
  );

  // Seek bar implemented with the plain RN responder system + scrubMath, NOT
  // the reanimated/RNGH VerseScrubber: those do not run inside this full-screen
  // <Modal>, so the thumb wouldn't track and gestures wouldn't fire there.
  // The track uses an EXPLICIT width (not `100%` measured via onLayout) — a
  // percentage width inside the auto-sized verse container measured as 0, which
  // pinned the thumb and made the touch area zero-width.
  const {width: windowWidth} = useWindowDimensions();
  const seekTrackWidth = Math.min(windowWidth - 96, 560);
  const [seekPreview, setSeekPreview] = useState<number | null>(null);
  const handleSeekTouch = useCallback(
    (e: GestureResponderEvent, commit: boolean) => {
      const idx = positionToIndex(
        e.nativeEvent.locationX,
        seekTrackWidth,
        verses.length,
      );
      if (commit) {
        setSeekPreview(null);
        handleScrubberSeek(idx);
      } else {
        if (seekPreview === null) haptics.selection();
        setSeekPreview(idx);
      }
    },
    [seekTrackWidth, verses.length, seekPreview, handleScrubberSeek],
  );
  const seekIndex = seekPreview ?? currentIndex;
  const seekFraction = indexToFraction(seekIndex, verses.length);

  // Animations
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const controlsOpacity = useRef(new Animated.Value(1)).current;

  // ♾️ Chapter-transition banner (Sprint 73). When continuous audio auto-advances
  // into the next chapter, a brief "Salmos 118 · ∞ continuo" banner fades in and
  // out so the listener knows the immersive crossed a boundary (and keeps going).
  const [transitionTitle, setTransitionTitle] = useState<string | null>(null);
  const transitionOpacity = useRef(new Animated.Value(0)).current;
  const transitionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showChapterTransition = useCallback(
    (title: string) => {
      // Name the new chapter for screen-reader users — re-keying the verse text
      // alone wouldn't be announced on a silent, audio-driven change.
      AccessibilityInfo.announceForAccessibility(
        t.audio.immersive.chapterAdvanced.replace('{{chapter}}', title),
      );
      setTransitionTitle(title);
      if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current);
      if (reduceMotion) {
        // Motion-free: show it statically, then clear after a readable beat.
        transitionOpacity.setValue(1);
        transitionTimerRef.current = setTimeout(
          () => setTransitionTitle(null),
          1800,
        );
        return;
      }
      transitionOpacity.setValue(0);
      Animated.sequence([
        Animated.timing(transitionOpacity, {
          toValue: 1,
          duration: 450,
          useNativeDriver: true,
        }),
        Animated.delay(1100),
        Animated.timing(transitionOpacity, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start(({finished}) => {
        if (finished) setTransitionTitle(null);
      });
    },
    [reduceMotion, transitionOpacity, t.audio.immersive.chapterAdvanced],
  );
  useEffect(
    () => () => {
      if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current);
    },
    [],
  );

  const currentVerse = verses[currentIndex];

  // Drop a stale karaoke boundary the moment the verse on screen (or the verse
  // the engine speaks) changes — the next word of the new verse re-arms it.
  useEffect(() => {
    setKaraokeBoundary(null);
  }, [boundIndex, currentIndex]);

  // The word being voiced right now, resolved against the DISPLAYED verse.
  // Null (no highlight) unless actively listening to this very verse — a user
  // who browsed away mid-playback reads undisturbed, and engines that never
  // emit boundaries simply never light a word.
  const karaokeWord = useMemo(() => {
    if (!listening || !audioState.isPlaying || !karaokeBoundary) return null;
    if (karaokeBoundary.verseIndex !== boundIndex) return null;
    if (currentIndex !== boundIndex) return null;
    if (!currentVerse?.text) return null;
    const tokens = tokenizeForKaraoke(currentVerse.text);
    const idx = activeTokenIndex(tokens, karaokeBoundary.charIndex);
    return idx >= 0 ? tokens[idx] : null;
  }, [
    listening,
    audioState.isPlaying,
    karaokeBoundary,
    boundIndex,
    currentIndex,
    currentVerse,
  ]);

  // Auto-hide controls after 3 seconds — but NOT while a screen reader is on:
  // the Close button lives in this overlay, so hiding it would trap an SR user
  // inside the focus-trapped surface with no reachable way out.
  useEffect(() => {
    if (showControls && !screenReaderEnabled) {
      const timer = setTimeout(() => {
        hideControls();
      }, 3000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [showControls, screenReaderEnabled]);

  // If a screen reader turns on while the controls are hidden, bring them back
  // so the Close button (and its label) is reachable again. Keyed on the SR
  // flag alone — this eslint has no react-hooks/exhaustive-deps rule (a disable
  // directive would itself error), so no suppression is needed.
  useEffect(() => {
    if (screenReaderEnabled && !showControls) {
      revealControls();
    }
  }, [screenReaderEnabled]);

  // Auto-scroll logic
  useEffect(() => {
    if (autoScroll && currentIndex < verses.length - 1) {
      const wordsInVerse = currentVerse.text.split(' ').length;
      const avgReadingSpeed = 200; // words per minute
      const timeToRead = (wordsInVerse / avgReadingSpeed) * 60000; // milliseconds

      const timer = setTimeout(
        () => {
          goToNext();
        },
        Math.max(timeToRead, 3000),
      ); // Minimum 3 seconds

      return () => clearTimeout(timer);
    }
    return undefined;
  }, [currentIndex, autoScroll, currentVerse]);

  const animateTransition = (callback: () => void) => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: -50,
          duration: 300,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    setTimeout(callback, 300);
  };

  const goToNext = () => {
    if (currentIndex < verses.length - 1) {
      haptics.tap();
      const next = currentIndex + 1;
      animateTransition(() => setCurrentIndex(next));
      // When listening, move the narration too; the follow-effect keeps the
      // index in sync, so this is the one-way push from a user nav.
      if (listening) audioGoToVerse(next);
    }
  };

  const goToPrevious = () => {
    if (currentIndex > 0) {
      haptics.tap();
      const prev = currentIndex - 1;
      animateTransition(() => setCurrentIndex(prev));
      if (listening) audioGoToVerse(prev);
    }
  };

  const toggleAutoScroll = () => {
    setAutoScroll(!autoScroll);
    haptics.press();
  };

  const hideControls = () => {
    Animated.timing(controlsOpacity, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => setShowControls(false));
  };

  const revealControls = () => {
    setShowControls(true);
    Animated.timing(controlsOpacity, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const handleScreenTap = () => {
    if (showControls) {
      hideControls();
    } else {
      revealControls();
    }
  };

  const increaseFontSize = () => {
    setFontSize(Math.min(fontSize + 2, 32));
    haptics.tap();
  };

  const decreaseFontSize = () => {
    setFontSize(Math.max(fontSize - 2, 16));
    haptics.tap();
  };

  const getBackgroundGradient = (): readonly string[] => {
    if (isHighContrast) {
      return [hcColors.background, hcColors.background];
    }
    if (backgroundType === 'celestial') {
      return (
        gradient?.colors ||
        (isDark
          ? ['#0f172a', '#1e1b4b', '#312e81', '#4c1d95']
          : ['#dbeafe', '#bfdbfe', '#93c5fd', '#60a5fa'])
      );
    } else if (backgroundType === 'nature') {
      return isDark
        ? ['#064e3b', '#065f46', '#047857', '#059669']
        : ['#d1fae5', '#a7f3d0', '#6ee7b7', '#34d399'];
    } else if (backgroundType === 'paper') {
      return isDark
        ? ['#292524', '#1c1917', '#0c0a09']
        : ['#fef3c7', '#fde68a', '#fcd34d'];
    }
    return [colors.background, colors.background]; // minimal
  };

  return (
    <View style={styles.container} {...focusTrapProps()}>
      <StatusBar hidden />

      {/* Animated Background */}
      <LinearGradient
        colors={getBackgroundGradient() as [string, string, ...string[]]}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 1}}
        style={StyleSheet.absoluteFill}
      />

      {/* Floating stars/particles for celestial mode (hidden in High Contrast
          — decorative stars would only muddy the pure-black AAA surface) */}
      {!isHighContrast && backgroundType === 'celestial' && (
        <View style={styles.starsContainer} {...a11yHiddenProps()}>
          <Ionicons
            name="star"
            size={20}
            color="rgba(255,255,255,0.3)"
            style={[styles.star, {top: '10%', left: '20%'}]}
          />
          <Ionicons
            name="star"
            size={16}
            color="rgba(255,255,255,0.2)"
            style={[styles.star, {top: '30%', right: '15%'}]}
          />
          <Ionicons
            name="star"
            size={14}
            color="rgba(255,255,255,0.25)"
            style={[styles.star, {top: '60%', left: '10%'}]}
          />
          <Ionicons
            name="star"
            size={18}
            color="rgba(255,255,255,0.3)"
            style={[styles.star, {top: '80%', right: '25%'}]}
          />
        </View>
      )}

      {/* Tap layer — toggles the controls. A full-screen layer BEHIND the
          content (rather than a Touchable wrapping it) so the premium scrubber
          can own its gestures; a Touchable parent swallows RNGH touches. */}
      <TouchableOpacity
        style={StyleSheet.absoluteFill}
        activeOpacity={1}
        onPress={handleScreenTap}
        {...a11yHiddenProps()}
      />

      {/* Main Content — box-none lets empty-area taps fall through to the tap
          layer; the verse text/reference are pointerEvents="none" so they fall
          through too, leaving only the scrubber to capture touches. */}
      <View style={styles.contentContainer} pointerEvents="box-none">
        <Animated.View
          pointerEvents="box-none"
          style={[
            styles.verseContainer,
            {
              opacity: fadeAnim,
              transform: [{translateY: slideAnim}],
            },
          ]}>
          {/* Verse Text — while narration voices THIS verse, the word being
              spoken is painted karaoke-style (Sprint 75): three runs (before /
              active word / after), static color+tint only, reduce-motion
              safe by construction. The emphasis is METRICS-NEUTRAL (Sprint
              80): a bold run widens the line after the wrap was measured and
              Android clips that line's last word — color and background
              change no glyph advance. */}
          <Text
            pointerEvents="none"
            style={[
              styles.verseText,
              {
                fontSize,
                // Scaled with the user's font size — the old fixed 36 cramped
                // descenders at 32 and floated at 16.
                lineHeight: immersiveLineHeight(fontSize),
                fontFamily: verseFontFamily,
                color: isHighContrast
                  ? hcColors.text
                  : isDark
                    ? '#f1f5f9'
                    : '#1e293b',
                textShadowColor: isDark
                  ? 'rgba(0,0,0,0.5)'
                  : 'rgba(255,255,255,0.8)',
              },
            ]}>
            {karaokeWord ? (
              <>
                {currentVerse.text.slice(0, karaokeWord.start)}
                <Text
                  style={{
                    color: isHighContrast
                      ? hcColors.accent
                      : isDark
                        ? '#fbbf24'
                        : '#b45309',
                    backgroundColor:
                      (isHighContrast
                        ? hcColors.accent
                        : isDark
                          ? '#fbbf24'
                          : '#b45309') + '26',
                  }}>
                  {currentVerse.text.slice(karaokeWord.start, karaokeWord.end)}
                </Text>
                {currentVerse.text.slice(karaokeWord.end)}
              </>
            ) : (
              currentVerse.text
            )}
          </Text>

          {/* Reference */}
          <Text
            pointerEvents="none"
            style={[
              styles.reference,
              {
                color: isHighContrast
                  ? hcColors.reference
                  : isDark
                    ? '#cbd5e1'
                    : '#64748b',
              },
            ]}>
            {localizedReference(currentVerse)}
          </Text>

          {/* Progress indicator — premium: a draggable verse scrubber takes the
              place of the static bar (Sprint 52); free: the static bar. */}
          {listening ? (
            <View style={styles.scrubberWrap}>
              <View style={[styles.seekLabelsRow, {width: seekTrackWidth}]}>
                <Text style={styles.seekLabel}>{seekIndex + 1}</Text>
                <Text style={styles.seekLabel}>{verses.length}</Text>
              </View>
              <View
                style={[styles.seekTouch, {width: seekTrackWidth}]}
                onStartShouldSetResponder={() => true}
                onMoveShouldSetResponder={() => true}
                onResponderGrant={e => handleSeekTouch(e, false)}
                onResponderMove={e => handleSeekTouch(e, false)}
                onResponderRelease={e => handleSeekTouch(e, true)}
                onResponderTerminate={e => handleSeekTouch(e, true)}
                accessibilityRole="adjustable"
                accessibilityLabel={t.audio.scrub.a11yLabel}
                accessibilityHint={t.audio.scrub.a11yHint}>
                <View style={styles.seekTrack}>
                  <View
                    style={[
                      styles.seekFill,
                      {
                        width: Math.max(0, seekFraction * seekTrackWidth),
                        backgroundColor: isHighContrast
                          ? hcColors.accent
                          : isDark
                            ? '#60a5fa'
                            : '#3b82f6',
                      },
                    ]}
                  />
                  <View
                    style={[
                      styles.seekThumb,
                      {
                        left: seekFraction * seekTrackWidth - SEEK_THUMB / 2,
                        backgroundColor: isHighContrast
                          ? hcColors.accent
                          : isDark
                            ? '#60a5fa'
                            : '#3b82f6',
                      },
                    ]}
                  />
                </View>
              </View>
              <Text
                style={[
                  styles.seekCaption,
                  {
                    color: isHighContrast
                      ? seekPreview != null
                        ? hcColors.accent
                        : hcColors.caption
                      : seekPreview != null
                        ? '#93c5fd'
                        : '#94a3b8',
                  },
                ]}
                numberOfLines={1}>
                {seekPreview != null
                  ? labelForIndex(seekPreview)
                  : t.audio.scrub.preview
                      .replace('{{n}}', String(seekIndex + 1))
                      .replace('{{total}}', String(verses.length))}
              </Text>
            </View>
          ) : (
            <View style={styles.progressContainer} pointerEvents="none">
              <Text
                style={[
                  styles.progressText,
                  {color: isHighContrast ? hcColors.caption : '#94a3b8'},
                ]}>
                {currentIndex + 1} / {verses.length}
              </Text>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${((currentIndex + 1) / verses.length) * 100}%`,
                      backgroundColor: isHighContrast
                        ? hcColors.accent
                        : isDark
                          ? '#60a5fa'
                          : '#3b82f6',
                    },
                  ]}
                />
              </View>
            </View>
          )}
        </Animated.View>
      </View>

      {/* ♾️ Chapter-transition banner — fades in/out when continuous audio
          crosses into a new chapter (Sprint 73). pointerEvents none so it never
          blocks the verse/tap layer; SR-hidden (announced via AccessibilityInfo). */}
      {transitionTitle && (
        <Animated.View
          pointerEvents="none"
          style={[styles.transitionBanner, {opacity: transitionOpacity}]}
          {...a11yHiddenProps()}>
          <View style={styles.transitionPill}>
            <Text style={styles.transitionTitle}>{transitionTitle}</Text>
            <View style={styles.transitionBadge}>
              <Ionicons name="infinite" size={14} color="#cbd5e1" />
              <Text style={styles.transitionBadgeText}>
                {t.audio.immersive.continuous}
              </Text>
            </View>
          </View>
        </Animated.View>
      )}

      {/* Controls Overlay */}
      {showControls && (
        <Animated.View
          pointerEvents="box-none"
          style={[styles.controlsOverlay, {opacity: controlsOpacity}]}>
          {/* Top Controls */}
          <View style={styles.topControls}>
            <TouchableOpacity
              style={[
                styles.controlButton,
                {backgroundColor: 'rgba(0,0,0,0.5)'},
              ]}
              onPress={onClose}
              hitSlop={CONTROL_HIT_SLOP}
              accessibilityRole="button"
              accessibilityLabel={t.verse.closeImmersive}>
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>

            <View style={styles.topRightControls}>
              {/* Font size controls */}
              <TouchableOpacity
                style={[
                  styles.controlButton,
                  {backgroundColor: 'rgba(0,0,0,0.5)'},
                ]}
                onPress={decreaseFontSize}
                hitSlop={CONTROL_HIT_SLOP}
                accessibilityRole="button"
                accessibilityLabel={t.verse.decreaseFontSize}>
                <Ionicons name="remove" size={20} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.controlButton,
                  {backgroundColor: 'rgba(0,0,0,0.5)'},
                ]}
                onPress={increaseFontSize}
                hitSlop={CONTROL_HIT_SLOP}
                accessibilityRole="button"
                accessibilityLabel={t.verse.increaseFontSize}>
                <Ionicons name="add" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Bottom Controls */}
          <View style={styles.bottomControls}>
            {/* Previous */}
            <TouchableOpacity
              style={[
                styles.navButton,
                {opacity: currentIndex === 0 ? 0.3 : 1},
              ]}
              onPress={goToPrevious}
              disabled={currentIndex === 0}
              accessibilityRole="button"
              accessibilityLabel={t.verse.previousVerse}>
              <Ionicons name="chevron-back" size={32} color="#fff" />
            </TouchableOpacity>

            {/* Center Controls */}
            <View style={styles.centerControls}>
              {listening ? (
                /* Premium: audio play/pause drives the narration. */
                <TouchableOpacity
                  style={[styles.actionButton, styles.actionButtonActive]}
                  onPress={toggleListen}
                  accessibilityRole="button"
                  accessibilityLabel={
                    audioState.isPlaying
                      ? t.audio.a11y.pause
                      : t.audio.a11y.play
                  }>
                  <Ionicons
                    name={audioState.isPlaying ? 'pause' : 'play'}
                    size={24}
                    color="#fff"
                  />
                  <Text style={styles.actionButtonText}>
                    {audioState.isPlaying
                      ? t.audio.immersive.listening
                      : t.audio.immersive.paused}
                  </Text>
                </TouchableOpacity>
              ) : (
                <>
                  {/* Auto-scroll toggle (reading timer) */}
                  <TouchableOpacity
                    style={[
                      styles.actionButton,
                      autoScroll && styles.actionButtonActive,
                    ]}
                    onPress={toggleAutoScroll}
                    accessibilityRole="button"
                    accessibilityLabel={
                      autoScroll ? t.verse.pause : t.verse.autoPlay
                    }>
                    <Ionicons
                      name={autoScroll ? 'pause' : 'play'}
                      size={24}
                      color="#fff"
                    />
                    <Text style={styles.actionButtonText}>
                      {autoScroll ? t.verse.pause : t.verse.autoPlay}
                    </Text>
                  </TouchableOpacity>

                  {/* Premium: start listening with TTS + verse scrubber */}
                  {isPremium && (
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={startListening}
                      accessibilityRole="button"
                      accessibilityLabel={t.audio.immersive.listen}>
                      <Ionicons name="headset" size={22} color="#fff" />
                      <Text style={styles.actionButtonText}>
                        {t.audio.immersive.listen}
                      </Text>
                    </TouchableOpacity>
                  )}
                </>
              )}
            </View>

            {/* Next */}
            <TouchableOpacity
              style={[
                styles.navButton,
                {opacity: currentIndex === verses.length - 1 ? 0.3 : 1},
              ]}
              onPress={goToNext}
              disabled={currentIndex === verses.length - 1}
              accessibilityRole="button"
              accessibilityLabel={t.verse.nextVerse}>
              <Ionicons name="chevron-forward" size={32} color="#fff" />
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  starsContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  star: {
    position: 'absolute',
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  verseContainer: {
    alignItems: 'center',
    maxWidth: 700,
  },
  verseText: {
    // fontFamily/lineHeight live inline: they follow the reader's typeface
    // preference and the adjustable font size (Sprint 81).
    textAlign: 'center',
    // Stretch the canvas to the container: a centered Text shrink-wraps to
    // its MEASURED width, so a karaoke line painted 1–2px wider (Android
    // span rounding) clipped at the glyph edge. Full-width canvas gives the
    // centered lines slack on both sides (Sprint 81).
    alignSelf: 'stretch',
    marginBottom: 32,
    textShadowOffset: {width: 0, height: 1},
    textShadowRadius: 3,
  },
  reference: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 24,
    letterSpacing: 0.5,
  },
  progressContainer: {
    alignItems: 'center',
    width: '100%',
    marginTop: 16,
  },
  scrubberWrap: {
    width: '100%',
    marginTop: 16,
    paddingHorizontal: 8,
  },
  seekLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignSelf: 'center',
    marginBottom: 4,
  },
  seekLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#cbd5e1',
  },
  seekTouch: {
    alignSelf: 'center',
    paddingVertical: 14,
    justifyContent: 'center',
  },
  seekTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.2)',
    position: 'relative',
    overflow: 'visible',
  },
  seekFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    height: 4,
    borderRadius: 2,
  },
  seekThumb: {
    position: 'absolute',
    top: -(SEEK_THUMB - 4) / 2,
    width: SEEK_THUMB,
    height: SEEK_THUMB,
    borderRadius: SEEK_THUMB / 2,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.9)',
  },
  seekCaption: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 6,
  },
  progressText: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 8,
  },
  transitionBanner: {
    position: 'absolute',
    top: '20%',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  transitionPill: {
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 20,
    alignItems: 'center',
    gap: 6,
  },
  transitionTitle: {
    color: '#f8fafc',
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  transitionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  transitionBadgeText: {
    color: '#cbd5e1',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  progressBar: {
    width: 200,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  controlsOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
  },
  topControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: 20,
  },
  topRightControls: {
    flexDirection: 'row',
    gap: 12,
  },
  controlButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: Platform.OS === 'ios' ? 50 : 30,
    paddingHorizontal: 20,
  },
  navButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerControls: {
    flexDirection: 'row',
    gap: 16,
  },
  actionButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    backgroundColor: 'rgba(0,0,0,0.5)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionButtonActive: {
    backgroundColor: 'rgba(59,130,246,0.8)',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
