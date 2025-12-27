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

  const speakVerse = useCallback(
    async (verse: AudioVerse) => {
      if (!verse) return;

      setState(prev => ({...prev, isLoading: true}));

      try {
        // Stop any current speech
        await Speech.stop();

        // Get language code based on selection
        const languageCodes = SUPPORTED_LANGUAGES[state.selectedLanguage];
        const language = state.selectedVoice?.language || languageCodes[0];

        await Speech.speak(verse.text, {
          language,
          voice: state.selectedVoice?.identifier,
          rate: state.playbackSpeed,
          pitch: 1.0,
          onStart: () => {
            setState(prev => ({
              ...prev,
              isPlaying: true,
              isPaused: false,
              isLoading: false,
            }));
          },
          onDone: () => {
            handleVerseComplete();
          },
          onStopped: () => {
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
    },
    [state.selectedVoice, state.playbackSpeed, state.selectedLanguage],
  );

  const handleVerseComplete = useCallback(() => {
    // Check if we're at the end of the chapter
    if (state.currentVerseIndex >= verses.length - 1) {
      // Chapter complete
      if (sleepTimer.mode === 'end-of-chapter') {
        stop();
        cancelSleepTimer();
        return;
      }
      setState(prev => ({...prev, isPlaying: false, isPaused: false}));
      return;
    }

    // Move to next verse
    const nextIndex = state.currentVerseIndex + 1;
    setState(prev => ({...prev, currentVerseIndex: nextIndex}));

    // Speak next verse
    if (verses[nextIndex]) {
      speakVerse(verses[nextIndex]);
    }
  }, [state.currentVerseIndex, verses, sleepTimer.mode, speakVerse]);

  const play = useCallback(() => {
    if (!currentVerse) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    speakVerse(currentVerse);
  }, [currentVerse, speakVerse]);

  const pause = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await Speech.stop();
    setState(prev => ({...prev, isPlaying: false, isPaused: true}));
  }, []);

  const stop = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await Speech.stop();
    setState(prev => ({
      ...prev,
      isPlaying: false,
      isPaused: false,
      currentVerseIndex: 0,
    }));
  }, []);

  const togglePlayPause = useCallback(() => {
    if (state.isPlaying) {
      pause();
    } else {
      play();
    }
  }, [state.isPlaying, play, pause]);

  const nextVerse = useCallback(() => {
    if (state.currentVerseIndex < verses.length - 1) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const nextIndex = state.currentVerseIndex + 1;
      setState(prev => ({...prev, currentVerseIndex: nextIndex}));

      if (state.isPlaying && verses[nextIndex]) {
        speakVerse(verses[nextIndex]);
      }
    }
  }, [state.currentVerseIndex, state.isPlaying, verses, speakVerse]);

  const previousVerse = useCallback(() => {
    if (state.currentVerseIndex > 0) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const prevIndex = state.currentVerseIndex - 1;
      setState(prev => ({...prev, currentVerseIndex: prevIndex}));

      if (state.isPlaying && verses[prevIndex]) {
        speakVerse(verses[prevIndex]);
      }
    }
  }, [state.currentVerseIndex, state.isPlaying, verses, speakVerse]);

  const goToVerse = useCallback(
    (index: number) => {
      if (index >= 0 && index < verses.length) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setState(prev => ({...prev, currentVerseIndex: index}));

        if (state.isPlaying && verses[index]) {
          speakVerse(verses[index]);
        }
      }
    },
    [verses, state.isPlaying, speakVerse],
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

  const showPlayer = useCallback(() => {
    setIsVisible(true);
  }, []);

  const hidePlayer = useCallback(async () => {
    await stop();
    setIsVisible(false);
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
    setVerses(newVerses);
    setState(prev => ({
      ...prev,
      currentVerseIndex: 0,
      totalVerses: newVerses.length,
      isPlaying: false,
      isPaused: false,
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
