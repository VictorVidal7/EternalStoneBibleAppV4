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
import * as Haptics from 'expo-haptics';
import {
  AudioPlayerState,
  AudioPlayerContextValue,
  AudioVerse,
  VoiceInfo,
  PlaybackSpeed,
  AudioLanguage,
  SleepTimerState,
  AudioPreferences,
} from '../types/audio';
import {
  DEFAULT_PLAYBACK_SPEED,
  DEFAULT_LANGUAGE,
  AUDIO_STORAGE_KEYS,
  SUPPORTED_LANGUAGES,
} from '../constants/audioConstants';

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

  // Refs
  const sleepTimerRef = useRef<NodeJS.Timeout | null>(null);
  const sleepCountdownRef = useRef<NodeJS.Timeout | null>(null);

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

  // ==================== CURRENT VERSE ====================

  const currentVerse = verses[state.currentVerseIndex] || null;

  // ==================== PLAYBACK CONTROLS ====================

  // Speak a verse by index - uses refs to avoid stale closures
  const speakVerseByIndex = useCallback(async (index: number) => {
    const currentVerses = versesRef.current;
    const verse = currentVerses[index];
    if (!verse) return;

    setState(prev => ({...prev, isLoading: true, currentVerseIndex: index}));

    try {
      // Stop any current speech
      await Speech.stop();

      // Get language code based on selection (read from ref for fresh values)
      const currentState = stateRef.current;
      const languageCodes = SUPPORTED_LANGUAGES[currentState.selectedLanguage];
      const language = currentState.selectedVoice?.language || languageCodes[0];

      console.log('🎵 Speaking verse', index + 1, 'of', currentVerses.length);

      await Speech.speak(verse.text, {
        language,
        voice: currentState.selectedVoice?.identifier,
        rate: currentState.playbackSpeed,
        pitch: 1.0,
        onStart: () => {
          console.log('🎵 Speech started for verse', index + 1);
          setState(prev => ({
            ...prev,
            isPlaying: true,
            isPaused: false,
            isLoading: false,
          }));
        },
        onDone: () => {
          console.log('🎵 Speech done for verse', index + 1);
          // Use refs to get fresh values and auto-advance
          const freshState = stateRef.current;
          const freshVerses = versesRef.current;
          const freshSleepTimer = sleepTimerStateRef.current;
          const currentIdx = freshState.currentVerseIndex;

          // Don't auto-advance if paused or not playing
          if (freshState.isPaused || !freshState.isPlaying) {
            console.log('🎵 Playback paused/stopped, not auto-advancing');
            return;
          }

          // Check if we're at the end of the chapter
          if (currentIdx >= freshVerses.length - 1) {
            console.log('🎵 Chapter complete');
            if (freshSleepTimer.mode === 'end-of-chapter') {
              Speech.stop();
              setState(prev => ({...prev, isPlaying: false, isPaused: false}));
            } else {
              setState(prev => ({...prev, isPlaying: false, isPaused: false}));
            }
            return;
          }

          // Auto-advance to next verse
          const nextIdx = currentIdx + 1;
          console.log('🎵 Auto-advancing to verse', nextIdx + 1);
          speakVerseByIndex(nextIdx);
        },
        onStopped: () => {
          console.log('🎵 Speech stopped');
          setState(prev => ({
            ...prev,
            isPlaying: false,
            isPaused: true,
            isLoading: false,
          }));
        },
        onError: error => {
          console.error('Speech error:', error);
          setState(prev => ({
            ...prev,
            isPlaying: false,
            isPaused: false,
            isLoading: false,
          }));
        },
      });
    } catch (error) {
      console.error('Error speaking verse:', error);
      setState(prev => ({...prev, isLoading: false}));
    }
  }, []);

  // Legacy speakVerse for compatibility
  const speakVerse = useCallback(
    async (verse: AudioVerse) => {
      const index = versesRef.current.findIndex(
        v =>
          v.book === verse.book &&
          v.chapter === verse.chapter &&
          v.verse === verse.verse,
      );
      if (index >= 0) {
        speakVerseByIndex(index);
      }
    },
    [speakVerseByIndex],
  );

  // handleVerseComplete is now handled inline in onDone callback
  const handleVerseComplete = useCallback(() => {
    // This is now handled in the onDone callback above using refs
  }, []);

  const play = useCallback(() => {
    const currentIdx = stateRef.current.currentVerseIndex;
    const currentVerses = versesRef.current;
    if (currentVerses.length === 0) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    speakVerseByIndex(currentIdx);
  }, [speakVerseByIndex]);

  const pause = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Update ref immediately so callbacks see paused state synchronously
    stateRef.current = {
      ...stateRef.current,
      isPlaying: false,
      isPaused: true,
      isLoading: false,
    };
    // Then update React state
    setState(prev => ({
      ...prev,
      isPlaying: false,
      isPaused: true,
      isLoading: false,
    }));
    await Speech.stop();
  }, []);

  const stop = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Update ref immediately so callbacks see stopped state synchronously
    stateRef.current = {
      ...stateRef.current,
      isPlaying: false,
      isPaused: false,
      isLoading: false,
      currentVerseIndex: 0,
    };
    // Then update React state
    setState(prev => ({
      ...prev,
      isPlaying: false,
      isPaused: false,
      isLoading: false,
      currentVerseIndex: 0,
    }));
    await Speech.stop();
  }, []);

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
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const nextIndex = currentState.currentVerseIndex + 1;

      if (currentState.isPlaying) {
        speakVerseByIndex(nextIndex);
      } else {
        setState(prev => ({...prev, currentVerseIndex: nextIndex}));
      }
    }
  }, [speakVerseByIndex]);

  const previousVerse = useCallback(() => {
    const currentState = stateRef.current;
    if (currentState.currentVerseIndex > 0) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const prevIndex = currentState.currentVerseIndex - 1;

      if (currentState.isPlaying) {
        speakVerseByIndex(prevIndex);
      } else {
        setState(prev => ({...prev, currentVerseIndex: prevIndex}));
      }
    }
  }, [speakVerseByIndex]);

  const goToVerse = useCallback(
    (index: number) => {
      const currentState = stateRef.current;
      const currentVerses = versesRef.current;
      if (index >= 0 && index < currentVerses.length) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

        if (currentState.isPlaying) {
          speakVerseByIndex(index);
        } else {
          setState(prev => ({...prev, currentVerseIndex: index}));
        }
      }
    },
    [speakVerseByIndex],
  );

  // ==================== SETTINGS ====================

  const setPlaybackSpeed = useCallback((speed: PlaybackSpeed) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setState(prev => ({...prev, playbackSpeed: speed}));
    savePreferences({playbackSpeed: speed});
  }, []);

  const setVoice = useCallback((voice: VoiceInfo) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setState(prev => ({...prev, selectedVoice: voice}));
    savePreferences({selectedVoiceId: voice.identifier});
  }, []);

  const setLanguage = useCallback((language: AudioLanguage) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setState(prev => ({
      ...prev,
      selectedLanguage: language,
      selectedVoice: null,
    }));
    savePreferences({selectedLanguage: language, selectedVoiceId: null});
  }, []);

  // ==================== PLAYER UI ====================

  const expand = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setState(prev => ({...prev, isExpanded: true}));
  }, []);

  const collapse = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setState(prev => ({...prev, isExpanded: false}));
  }, []);

  const toggleExpanded = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await stop();
  }, [stop]);

  // ==================== SLEEP TIMER ====================

  const setSleepTimer = useCallback(
    (minutes: number) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

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
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

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

  const cancelSleepTimer = useCallback(() => {
    if (sleepTimerRef.current) clearTimeout(sleepTimerRef.current);
    if (sleepCountdownRef.current) clearInterval(sleepCountdownRef.current);

    setSleepTimerState(initialSleepTimerState);
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

    expand,
    collapse,
    toggleExpanded,
    showPlayer,
    hidePlayer,

    setSleepTimer,
    setSleepTimerEndOfChapter,
    cancelSleepTimer,

    loadChapter,
    clearChapter,
    setBottomOffset,
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
