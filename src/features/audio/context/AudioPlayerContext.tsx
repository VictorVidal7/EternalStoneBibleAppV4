/**
 * Audio Player Context
 *
 * Contexto global para el reproductor de Audio Bible con TTS
 * Maneja estado, controles de reproduccion y preferencias
 *
 * Para la gloria de Dios - Eternal Stone Bible App
 */

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
  ReactNode,
} from 'react';
import * as Speech from 'expo-speech';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {haptics} from '@lib/haptics';
import {logger} from '@lib/utils/logger';
import {
  AudioPlayerState,
  AudioPlayerContextValue,
  AudioVerse,
  VoiceInfo,
  PlaybackSpeed,
  AudioLanguage,
  SleepTimerState,
  AudioPreferences,
  SpeechBoundary,
} from '../types/audio';
import {
  DEFAULT_PLAYBACK_SPEED,
  DEFAULT_LANGUAGE,
  AUDIO_STORAGE_KEYS,
  SUPPORTED_LANGUAGES,
} from '../constants/audioConstants';
import {createPosition} from '../lib/playbackPosition';
import {setLastPosition, clearLastPosition} from '../lib/playbackPositionStore';

// ==================== INITIAL STATE ====================

const initialPlayerState: AudioPlayerState = {
  isPlaying: false,
  isPaused: false,
  isLoading: false,
  currentVerseIndex: 0,
  totalVerses: 0,
  playbackSpeed: DEFAULT_PLAYBACK_SPEED,
  selectedVoice: null,
  selectedLanguage: DEFAULT_LANGUAGE,
  isExpanded: false,
  bottomOffset: 0,
  chapterEndCount: 0,
};

const initialSleepTimerState: SleepTimerState = {
  isActive: false,
  remainingMinutes: 0,
  endTime: null,
  mode: null,
};

// ==================== CONTEXT ====================

const AudioPlayerContext = createContext<AudioPlayerContextValue | undefined>(
  undefined,
);

// ==================== PROVIDER ====================

interface AudioPlayerProviderProps {
  children: ReactNode;
}

export const AudioPlayerProvider: React.FC<AudioPlayerProviderProps> = ({
  children,
}) => {
  // State
  const [state, setState] = useState<AudioPlayerState>(initialPlayerState);
  const [sleepTimer, setSleepTimerState] = useState<SleepTimerState>(
    initialSleepTimerState,
  );
  const [verses, setVerses] = useState<AudioVerse[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  // Continuous playback across chapters (Sprint 72). Defaults ON so listening
  // flows past the end of a chapter; persisted in AudioPreferences and stopped
  // explicitly by a "end of chapter" sleep timer.
  const [autoAdvanceChapter, setAutoAdvanceChapterState] = useState(true);
  // Reader follow (Sprint 74). Defaults OFF (opt-in): when on, the reader
  // screen navigates along with continuous playback across a chapter boundary.
  const [readerFollowsAudio, setReaderFollowsAudioState] = useState(false);
  // Transient flag for screens that show overlay sheets/modals on top of the
  // mini player — the player draws over them otherwise because its high
  // elevation+zIndex lifts it above the native modal window. Audio keeps
  // playing; we only suppress the UI.
  const [isSuppressed, setIsSuppressed] = useState(false);

  // Refs
  const sleepTimerRef = useRef<NodeJS.Timeout | null>(null);
  const sleepCountdownRef = useRef<NodeJS.Timeout | null>(null);

  // Word-boundary fan-out (Sprint 75 — karaoke). Listeners live in a ref so
  // per-word events never re-render the provider; only subscribers (the
  // immersive reader) update their own local state.
  const boundaryListenersRef = useRef(
    new Set<(boundary: SpeechBoundary) => void>(),
  );
  const subscribeToBoundary = useCallback(
    (cb: (boundary: SpeechBoundary) => void) => {
      boundaryListenersRef.current.add(cb);
      return () => {
        boundaryListenersRef.current.delete(cb);
      };
    },
    [],
  );

  // Refs for avoiding stale closures in speech callbacks
  const stateRef = useRef(state);
  const versesRef = useRef(verses);
  const sleepTimerStateRef = useRef(sleepTimer);

  // Keep refs in sync with state
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    versesRef.current = verses;
  }, [verses]);

  useEffect(() => {
    sleepTimerStateRef.current = sleepTimer;
  }, [sleepTimer]);

  // Persist the current audio position so playback can resume later ("Continue
  // listening", Sprint 51). Fires whenever the active verse changes while the
  // player is visible — this single effect captures every path (auto-advance,
  // next/prev, goToVerse, the premium scrubber). The position is read back only
  // for premium users; writing it always keeps it ready the moment they unlock.
  useEffect(() => {
    if (!isVisible || verses.length === 0) return;
    const idx = state.currentVerseIndex;
    const v = verses[idx];
    if (!v || !v.book || !v.chapter) return;
    void setLastPosition(
      createPosition({
        book: v.book,
        chapter: v.chapter,
        verseIndex: idx,
        verse: v.verse,
        totalVerses: verses.length,
        now: Date.now(),
      }),
    );
  }, [state.currentVerseIndex, verses, isVisible]);

  // Safe Haptics wrapper to prevent crashes on emulators/devices.
  // Delegates to the shared `haptics` helper (already swallows unsupported-
  // device rejections); kept as a stable callback referenced in deps arrays.
  const safeHaptic = useCallback(() => {
    haptics.tap();
  }, []);

  // ==================== LOAD PREFERENCES ====================

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const stored = await AsyncStorage.getItem(AUDIO_STORAGE_KEYS.preferences);
      if (stored) {
        const prefs: AudioPreferences = JSON.parse(stored);
        setState(prev => ({
          ...prev,
          playbackSpeed: prefs.playbackSpeed || DEFAULT_PLAYBACK_SPEED,
          selectedLanguage: prefs.selectedLanguage || DEFAULT_LANGUAGE,
        }));
        // Continuous playback (Sprint 72) — only override the ON default when a
        // boolean was explicitly saved (older prefs without the field keep ON).
        if (typeof prefs.autoAdvanceChapter === 'boolean') {
          setAutoAdvanceChapterState(prefs.autoAdvanceChapter);
        }
        // Reader follow (Sprint 74) — opt-in, so only a saved true turns it on.
        if (typeof prefs.readerFollowsAudio === 'boolean') {
          setReaderFollowsAudioState(prefs.readerFollowsAudio);
        }

        // Load voice if saved
        if (prefs.selectedVoiceId) {
          const voices = await Speech.getAvailableVoicesAsync();
          const savedVoice = voices.find(
            v => v.identifier === prefs.selectedVoiceId,
          );
          if (savedVoice) {
            setState(prev => ({
              ...prev,
              selectedVoice: {
                identifier: savedVoice.identifier,
                name: savedVoice.name,
                language: savedVoice.language,
                quality: savedVoice.quality as VoiceInfo['quality'],
              },
            }));
          }
        }
      }
    } catch (error) {
      console.error('Error loading audio preferences:', error);
    }
  };

  const savePreferences = async (prefs: Partial<AudioPreferences>) => {
    try {
      const current = await AsyncStorage.getItem(
        AUDIO_STORAGE_KEYS.preferences,
      );
      const currentPrefs: AudioPreferences = current
        ? JSON.parse(current)
        : {
            playbackSpeed: DEFAULT_PLAYBACK_SPEED,
            selectedVoiceId: null,
            selectedLanguage: DEFAULT_LANGUAGE,
            autoPlay: false,
            continueFromLastPosition: true,
            autoAdvanceChapter: true,
          };

      const updated = {...currentPrefs, ...prefs};
      await AsyncStorage.setItem(
        AUDIO_STORAGE_KEYS.preferences,
        JSON.stringify(updated),
      );
    } catch (error) {
      console.error('Error saving audio preferences:', error);
    }
  };

  // ==================== SLEEP TIMER = :MOVED UP ====================

  const cancelSleepTimer = useCallback(() => {
    if (sleepTimerRef.current) clearTimeout(sleepTimerRef.current);
    if (sleepCountdownRef.current) clearInterval(sleepCountdownRef.current);

    setSleepTimerState(initialSleepTimerState);
  }, []);

  // ==================== CURRENT VERSE ====================

  const currentVerse = verses[state.currentVerseIndex] || null;

  // ==================== PLAYBACK CONTROLS ====================

  // Speak a verse by index - uses refs to avoid stale closures
  const speakVerseByIndex = useCallback(
    async (index: number) => {
      const currentVerses = versesRef.current;

      if (index < 0 || index >= currentVerses.length) {
        logger.warn('Index out of bounds in speakVerseByIndex', {
          index,
          count: currentVerses.length,
        });
        setState(prev => ({...prev, isPlaying: false, isLoading: false}));
        return;
      }

      const verse = currentVerses[index];
      if (!verse || !verse.text) {
        logger.warn('Found empty verse or no text at index', {index});
        // If we have more verses, try skip to next, otherwise stop
        if (index + 1 < currentVerses.length) {
          speakVerseByIndex(index + 1);
        } else {
          setState(prev => ({...prev, isPlaying: false, isLoading: false}));
        }
        return;
      }

      const currentState = stateRef.current;
      // Map language code correctly
      const languageCodes = SUPPORTED_LANGUAGES[
        currentState.selectedLanguage
      ] || ['es-ES'];
      const language = currentState.selectedVoice?.language || languageCodes[0];

      logger.info('Attempting to speak verse', {
        index,
        reference: `${verse.book} ${verse.chapter}:${verse.verse}`,
        textLength: verse.text.length,
        voice: currentState.selectedVoice?.identifier,
        language,
      });

      setState(prev => ({...prev, isLoading: true, currentVerseIndex: index}));

      try {
        // First ensure we are not already speaking
        await Speech.stop().catch((err: any) =>
          logger.warn('Error in Speech.stop', {error: String(err)}),
        );

        await Speech.speak(verse.text, {
          language,
          voice: currentState.selectedVoice?.identifier,
          rate: currentState.playbackSpeed,
          pitch: 1.0,
          onStart: () => {
            logger.info('Speech started callback', {index});
            setState(prev => ({
              ...prev,
              isPlaying: true,
              isPaused: false,
              isLoading: false,
              currentVerseIndex: index,
            }));
          },
          onDone: () => {
            logger.info('Speech finished normally', {index});
            // Use refs to get fresh values and auto-advance
            const freshState = stateRef.current;
            const freshVerses = versesRef.current;
            const freshSleepTimer = sleepTimerStateRef.current;

            // Don't auto-advance if paused or not playing
            if (freshState.isPaused || !freshState.isPlaying) {
              logger.info('Auto-advance skipped (paused or stopped)');
              return;
            }

            if (index >= freshVerses.length - 1) {
              logger.info('Reached end of chapter');
              if (freshSleepTimer.mode === 'end-of-chapter') {
                cancelSleepTimer();
              }
              // Stop here; bump chapterEndCount so AudioChapterAdvancer can pick
              // up continuous playback into the next chapter (Sprint 72). If
              // continuous is off (or a end-of-chapter timer fired) the advancer
              // ignores the bump and the player simply stays stopped.
              const finalState = {
                ...freshState,
                isPlaying: false,
                isPaused: false,
                chapterEndCount: freshState.chapterEndCount + 1,
              };
              stateRef.current = finalState;
              setState(finalState);
              return;
            }

            // Small delay before next verse to avoid rapid recursive calls
            setTimeout(() => {
              const nextIdx = index + 1;
              speakVerseByIndex(nextIdx);
            }, 50);
          },
          onStopped: () => {
            logger.info('Speech stopped callback', {index});
            setState(prev => ({
              ...prev,
              isPlaying: false,
              isPaused: true,
              isLoading: false,
            }));
          },
          // Word boundary (Sprint 75 — karaoke). Fan out through the ref so a
          // per-word event never re-renders the provider tree. Engines that
          // don't emit boundaries simply never fire this.
          onBoundary: (ev: {charIndex: number; charLength: number}) => {
            const listeners = boundaryListenersRef.current;
            if (listeners.size === 0 || typeof ev?.charIndex !== 'number') {
              return;
            }
            const boundary: SpeechBoundary = {
              verseIndex: index,
              charIndex: ev.charIndex,
              charLength: typeof ev.charLength === 'number' ? ev.charLength : 0,
            };
            listeners.forEach(listener => listener(boundary));
          },
          onError: err => {
            logger.error(
              'Speech synthesis error callback',
              new Error(String(err)),
              {
                index,
                verse: verse.verse,
              },
            );
            setState(prev => ({
              ...prev,
              isPlaying: false,
              isPaused: false,
              isLoading: false,
            }));
          },
        });
      } catch (error) {
        logger.error('Critical error in speakVerseByIndex', error as Error, {
          index,
          action: 'Speech.speak',
        });
        setState(prev => {
          const next = {...prev, isLoading: false, isPlaying: false};
          stateRef.current = next;
          return next;
        });
      }
    },
    [cancelSleepTimer, safeHaptic],
  );

  /**
   * Start or resume playback
   */
  const play = useCallback(() => {
    // We access the state from the current closure if possible, or from the ref
    // But speakVerseByIndex also uses versesRef.current
    const currentIdx = stateRef.current.currentVerseIndex;
    const currentVerses = versesRef.current;

    logger.info('Play button pressed', {
      index: currentIdx,
      versesCount: currentVerses.length,
      isVisible,
    });

    if (currentVerses.length === 0) {
      logger.warn('Attempted to play with no verses loaded');
      return;
    }

    safeHaptic();
    speakVerseByIndex(currentIdx);
  }, [speakVerseByIndex, isVisible, safeHaptic]);

  const pause = useCallback(async () => {
    safeHaptic();
    // Update ref immediately so callbacks see paused state synchronously
    const nextState = {
      ...stateRef.current,
      isPlaying: false,
      isPaused: true,
      isLoading: false,
    };
    stateRef.current = nextState;
    // Then update React state
    setState(nextState);
    try {
      await Speech.stop();
    } catch (err) {
      logger.warn('Error stopping speech during pause', {error: String(err)});
    }
  }, [safeHaptic]);

  const stop = useCallback(async () => {
    safeHaptic();
    // Update ref immediately so callbacks see stopped state synchronously
    const nextState = {
      ...stateRef.current,
      isPlaying: false,
      isPaused: false,
      isLoading: false,
      currentVerseIndex: 0,
    };
    stateRef.current = nextState;
    // Then update React state
    setState(nextState);
    try {
      await Speech.stop();
    } catch (err) {
      logger.warn('Error stopping speech during stop', {error: String(err)});
    }
  }, [safeHaptic]);

  const togglePlayPause = useCallback(() => {
    const currentState = stateRef.current;
    if (currentState.isPlaying) {
      pause();
    } else {
      play();
    }
  }, [play, pause]);

  const nextVerse = useCallback(() => {
    const currentState = stateRef.current;
    const currentVerses = versesRef.current;
    if (currentState.currentVerseIndex < currentVerses.length - 1) {
      safeHaptic();
      const nextIndex = currentState.currentVerseIndex + 1;

      if (currentState.isPlaying) {
        speakVerseByIndex(nextIndex);
      } else {
        // Paused: TTS stays silent, so leave a trace — silent index moves
        // (e.g. an accidental collapsed-bar swipe) were undiagnosable (S77).
        logger.info('Verse index moved while paused', {
          from: currentState.currentVerseIndex,
          to: nextIndex,
        });
        // Eager state + ref (the pause()/stop() pattern): a functional
        // updater only runs at React's flush, so a play() in the same tick
        // would still read the pre-move index through the ref (S77).
        const next = {...currentState, currentVerseIndex: nextIndex};
        stateRef.current = next;
        setState(next);
      }
    }
  }, [speakVerseByIndex, safeHaptic]);

  const previousVerse = useCallback(() => {
    const currentState = stateRef.current;
    if (currentState.currentVerseIndex > 0) {
      haptics.tap();
      const prevIndex = currentState.currentVerseIndex - 1;

      if (currentState.isPlaying) {
        speakVerseByIndex(prevIndex);
      } else {
        logger.info('Verse index moved while paused', {
          from: currentState.currentVerseIndex,
          to: prevIndex,
        });
        // Eager state + ref so a play() landing before the next render
        // resumes from THIS verse, not the pre-swipe one (S77).
        const next = {...currentState, currentVerseIndex: prevIndex};
        stateRef.current = next;
        setState(next);
      }
    }
  }, [speakVerseByIndex]);

  const goToVerse = useCallback(
    (index: number) => {
      const currentState = stateRef.current;
      const currentVerses = versesRef.current;
      if (index >= 0 && index < currentVerses.length) {
        haptics.tap();

        if (currentState.isPlaying) {
          speakVerseByIndex(index);
        } else {
          // Eager state + ref so a subsequent play() — e.g. resuming a saved
          // position — starts at THIS index instead of the pre-seek one. A
          // functional updater is NOT synchronous (it runs at React's flush),
          // so a same-tick play() would read the stale index (S77).
          const next = {...currentState, currentVerseIndex: index};
          stateRef.current = next;
          setState(next);
        }
      }
    },
    [speakVerseByIndex],
  );

  // ==================== SETTINGS ====================

  const setPlaybackSpeed = useCallback((speed: PlaybackSpeed) => {
    haptics.tap();
    setState(prev => ({...prev, playbackSpeed: speed}));
    savePreferences({playbackSpeed: speed});
  }, []);

  const setVoice = useCallback((voice: VoiceInfo) => {
    haptics.tap();
    setState(prev => ({...prev, selectedVoice: voice}));
    savePreferences({selectedVoiceId: voice.identifier});
  }, []);

  const setLanguage = useCallback((language: AudioLanguage) => {
    haptics.tap();
    setState(prev => ({
      ...prev,
      selectedLanguage: language,
      selectedVoice: null,
    }));
    savePreferences({selectedLanguage: language, selectedVoiceId: null});
  }, []);

  const setAutoAdvanceChapter = useCallback((enabled: boolean) => {
    haptics.tap();
    setAutoAdvanceChapterState(enabled);
    savePreferences({autoAdvanceChapter: enabled});
  }, []);

  const setReaderFollowsAudio = useCallback((enabled: boolean) => {
    haptics.tap();
    setReaderFollowsAudioState(enabled);
    savePreferences({readerFollowsAudio: enabled});
  }, []);

  // ==================== PLAYER UI ====================

  const expand = useCallback(() => {
    haptics.tap();
    setState(prev => ({...prev, isExpanded: true}));
  }, []);

  const collapse = useCallback(() => {
    haptics.tap();
    setState(prev => ({...prev, isExpanded: false}));
  }, []);

  const toggleExpanded = useCallback(() => {
    haptics.tap();
    setState(prev => ({...prev, isExpanded: !prev.isExpanded}));
  }, []);

  const setBottomOffset = useCallback((offset: number) => {
    setState(prev => ({...prev, bottomOffset: offset}));
  }, []);

  const showPlayer = useCallback(() => {
    setIsVisible(true);
  }, []);

  const hidePlayer = useCallback(async () => {
    setIsVisible(false);
    setState(prev => ({...prev, isExpanded: false}));
    haptics.press();
    await stop();
    // Closing the player is an explicit "I'm done" — drop the saved position so
    // "Continue listening" doesn't resurrect a chapter the user dismissed.
    void clearLastPosition();
  }, [stop]);

  // ==================== SLEEP TIMER ====================

  const setSleepTimer = useCallback(
    (minutes: number) => {
      haptics.press();

      // Clear existing timers
      if (sleepTimerRef.current) clearTimeout(sleepTimerRef.current);
      if (sleepCountdownRef.current) clearInterval(sleepCountdownRef.current);

      const endTime = new Date(Date.now() + minutes * 60 * 1000);

      setSleepTimerState({
        isActive: true,
        remainingMinutes: minutes,
        endTime,
        mode: 'time',
      });

      // Set main timer
      sleepTimerRef.current = setTimeout(
        () => {
          stop();
          cancelSleepTimer();
        },
        minutes * 60 * 1000,
      );

      // Set countdown interval
      sleepCountdownRef.current = setInterval(() => {
        setSleepTimerState(prev => {
          if (prev.remainingMinutes <= 1) {
            if (sleepCountdownRef.current)
              clearInterval(sleepCountdownRef.current);
            return prev;
          }
          return {...prev, remainingMinutes: prev.remainingMinutes - 1};
        });
      }, 60 * 1000);
    },
    [stop],
  );

  const setSleepTimerEndOfChapter = useCallback(() => {
    haptics.press();

    // Clear existing timers
    if (sleepTimerRef.current) clearTimeout(sleepTimerRef.current);
    if (sleepCountdownRef.current) clearInterval(sleepCountdownRef.current);

    setSleepTimerState({
      isActive: true,
      remainingMinutes: 0,
      endTime: null,
      mode: 'end-of-chapter',
    });
  }, []);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (sleepTimerRef.current) clearTimeout(sleepTimerRef.current);
      if (sleepCountdownRef.current) clearInterval(sleepCountdownRef.current);
    };
  }, []);

  // ==================== CHAPTER LOADING ====================

  const loadChapter = useCallback((newVerses: AudioVerse[]) => {
    logger.info('Loading new chapter for audio', {
      versesCount: newVerses.length,
      firstVerse:
        newVerses[0]?.book +
        ' ' +
        newVerses[0]?.chapter +
        ':' +
        newVerses[0]?.verse,
    });

    // Stop any current speech immediately
    Speech.stop().catch(e =>
      logger.warn('Error stopping speech during loadChapter', e),
    );

    // Update refs immediately for synchronous access (before async setState)
    versesRef.current = newVerses;
    stateRef.current = {
      ...stateRef.current,
      currentVerseIndex: 0,
      totalVerses: newVerses.length,
      isPlaying: false,
      isPaused: false,
      isLoading: false,
    };
    // Then update React state
    setVerses(newVerses);
    setState(prev => ({
      ...prev,
      currentVerseIndex: 0,
      totalVerses: newVerses.length,
      isPlaying: false,
      isPaused: false,
      isLoading: false,
    }));
    setIsVisible(true);
  }, []);

  const clearChapter = useCallback(async () => {
    await stop();
    setVerses([]);
    setState(prev => ({
      ...prev,
      currentVerseIndex: 0,
      totalVerses: 0,
    }));
    setIsVisible(false);
  }, [stop]);

  // ==================== CONTEXT VALUE ====================

  const value: AudioPlayerContextValue = {
    state,
    sleepTimer,
    currentVerse,
    verses,
    isVisible,
    isSuppressed,

    play,
    pause,
    stop,
    togglePlayPause,
    nextVerse,
    previousVerse,
    goToVerse,

    setPlaybackSpeed,
    setVoice,
    setLanguage,

    autoAdvanceChapter,
    setAutoAdvanceChapter,

    readerFollowsAudio,
    setReaderFollowsAudio,

    expand,
    collapse,
    toggleExpanded,
    showPlayer,
    hidePlayer,
    setSuppressed: setIsSuppressed,

    setSleepTimer,
    setSleepTimerEndOfChapter,
    cancelSleepTimer,

    loadChapter,
    clearChapter,
    setBottomOffset,

    subscribeToBoundary,
  };

  return (
    <AudioPlayerContext.Provider value={value}>
      {children}
    </AudioPlayerContext.Provider>
  );
};

// ==================== HOOK ====================

export const useAudioPlayer = (): AudioPlayerContextValue => {
  const context = useContext(AudioPlayerContext);
  if (!context) {
    throw new Error(
      'useAudioPlayer must be used within an AudioPlayerProvider',
    );
  }
  return context;
};

export default AudioPlayerContext;
