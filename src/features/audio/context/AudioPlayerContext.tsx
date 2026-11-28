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
import {AppState} from 'react-native';
import * as Speech from 'expo-speech';
import {activateKeepAwakeAsync, deactivateKeepAwake} from 'expo-keep-awake';
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
  AudioQueueInfo,
  AudioQueueOptions,
  LoadQueueOptions,
} from '../types/audio';
import {
  DEFAULT_PLAYBACK_SPEED,
  DEFAULT_LANGUAGE,
  AUDIO_STORAGE_KEYS,
  AUDIO_KEEP_AWAKE_TAG,
  PLAYBACK_SPEEDS,
} from '../constants/audioConstants';
import {shouldKeepScreenAwake} from '../lib/keepAwake';
import {clampPlaybackSpeed} from '../lib/playbackSpeed';
import {createPosition} from '../lib/playbackPosition';
import {setLastPosition, clearLastPosition} from '../lib/playbackPositionStore';
import {
  DEFAULT_QUEUE_OPTIONS,
  shuffleUpcoming,
  restoreUpcomingOrder,
} from '../lib/playlistQueueOptions';
import {
  pickDefaultSpanishVoiceId,
  resolveNarration,
  toAudioLanguage,
} from '../lib/narrationVoice';
import {applySpanishPronunciationFixes} from '@lib/speech/narration';
import {reconcileSleepTimer} from '../lib/sleepTimer';
import {shouldReplayVerse} from '../lib/verseRepeat';
import {useBibleVersionOptional} from '@hooks/useBibleVersion';
import {usePremiumOptional} from '../../../context/PremiumContext';
import {subscribeBackupRestored} from '@lib/backup/restoreSignal';

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
  contentLanguage: null,
  contentVersionId: null,
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

// R9-604, S167 — `@audio_preferences` can come from a restored file. Valid
// JSON that is not an object (`null`, a number, a string, an array) is no
// saved preferences, not an object to read fields from or spread into. Nor is
// text that does not parse: the next save writes a fresh object over it.
function parsePreferencesObject(
  raw: string | null,
): Record<string, unknown> | null {
  if (!raw) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    logger.warn('Unreadable audio preferences on disk');
    return null;
  }
  return typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)
    ? (parsed as Record<string, unknown>)
    : null;
}

// What the player may hydrate from disk, field by field: a field of the wrong
// type or out of range is dropped and reads as absent.
function readStoredPreferences(
  raw: string | null,
): Partial<AudioPreferences> | null {
  const p = parsePreferencesObject(raw);
  if (!p) return null;
  const prefs: Partial<AudioPreferences> = {};
  if (PLAYBACK_SPEEDS.includes(p.playbackSpeed as PlaybackSpeed)) {
    prefs.playbackSpeed = p.playbackSpeed as PlaybackSpeed;
  }
  if (typeof p.selectedVoiceId === 'string' || p.selectedVoiceId === null) {
    prefs.selectedVoiceId = p.selectedVoiceId;
  }
  if (p.selectedLanguage === 'es' || p.selectedLanguage === 'en') {
    prefs.selectedLanguage = p.selectedLanguage;
  }
  if (typeof p.autoAdvanceChapter === 'boolean') {
    prefs.autoAdvanceChapter = p.autoAdvanceChapter;
  }
  if (typeof p.readerFollowsAudio === 'boolean') {
    prefs.readerFollowsAudio = p.readerFollowsAudio;
  }
  return prefs;
}

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
  // Reader follow (Sprint 74). Defaults ON (batch6 reader-feedback, item 13):
  // out of the box, continuous playback and this were two independently
  // defaulted settings guaranteed to diverge — the reader could show one
  // chapter while audio played another with no visible link between them.
  // The policy itself (shouldReaderFollowAudio's synced-chapter latch) already
  // guards against hijacking the user's own manual navigation, so following by
  // default doesn't yank an actively-reading user back to the narration.
  const [readerFollowsAudio, setReaderFollowsAudioState] = useState(true);
  // Memorization "repeat verse" loop. Runtime-only (NOT persisted) so it never
  // surprises a fresh session; defaults off. When on, a finished verse replays
  // instead of advancing.
  const [repeatVerse, setRepeatVerseState] = useState(false);
  // Transient flag for screens that show overlay sheets/modals on top of the
  // mini player — the player draws over them otherwise because its high
  // elevation+zIndex lifts it above the native modal window. Audio keeps
  // playing; we only suppress the UI.
  const [isSuppressed, setIsSuppressed] = useState(false);
  // What kind of queue the engine holds (Sprint 79 — verse playlists). A plain
  // loadChapter resets it to chapter mode, so every historical call site keeps
  // its contract by construction.
  const [queueInfo, setQueueInfo] = useState<AudioQueueInfo>({
    mode: 'chapter',
    label: null,
  });
  // Runtime queue toggles (Sprint 80 — shuffle + repeat). Playlist-only; a
  // plain loadChapter resets them with the rest of the queue identity.
  const [queueOptions, setQueueOptionsState] = useState<AudioQueueOptions>(
    DEFAULT_QUEUE_OPTIONS,
  );

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
  // Mirror of the repeat-verse toggle, read by the speech onDone callback so a
  // toggle mid-verse is honoured the instant the current verse finishes.
  const repeatVerseRef = useRef(repeatVerse);
  // R9-426 — the playback run. Every scheduled continuation (the next verse,
  // the repeat-verse loop, the playlist wrap) carries the run it was
  // scheduled under and gives up if a pause, a stop, backgrounding, a load or
  // a new direct start has advanced it since: what is paused in the 50 ms gap
  // between two verses used to sound again.
  const playbackRunRef = useRef(0);
  // Queue identity/options mirrors for the onDone end-of-queue branch (the
  // repeat decision) — updated EAGERLY in their setters, never via effects,
  // so a toggle right before the last verse ends is always honoured.
  const queueInfoRef = useRef(queueInfo);
  const queueOptionsRef = useRef(queueOptions);
  // The playlist's order as loaded — what "un-shuffle" restores to.
  const originalOrderRef = useRef<AudioVerse[]>([]);
  // The language of the text currently loaded in the engine (its Bible
  // version's language). Captured at load time so the TTS narration always
  // speaks the language of the text — switching the Bible version mid-listen
  // never leaves a wrong-language voice reading the verses (Sprint 100). Null =
  // unknown (legacy load) → fall back to the manual audio-language preference.
  const contentLanguageRef = useRef<AudioLanguage | null>(null);
  // Mirror of the live selected Bible version's language, so a plain
  // loadChapter (no explicit `language`) still tags its text correctly. The
  // optional hook returns undefined in trees/tests without the version provider
  // (then content language is unknown and the old behaviour stands).
  const versionCtx = useBibleVersionOptional();
  const versionLangRef = useRef<AudioLanguage | null>(null);
  versionLangRef.current = versionCtx
    ? toAudioLanguage(versionCtx.selectedVersion.language)
    : null;
  // Mirror of the live selected Bible version's id, captured into the engine
  // state at load time so a screen can tell the loaded text apart from the
  // version now on screen and re-sync after a mid-listen version switch (S102).
  const versionIdRef = useRef<string | null>(null);
  versionIdRef.current = versionCtx ? versionCtx.selectedVersion.id : null;

  // The system's full TTS voice list, enumerated once on mount. Lets
  // resolveNarration pin an explicit es-ES (Castilian) voice for Spanish
  // narration when the user hasn't chosen one — a bare `es-ES` request
  // otherwise lets the OS substitute a Latin-America voice that mangles the
  // archaic "-dle" imperative forms ("alabadle" …). undefined until the async
  // call resolves; a verse spoken before then just uses the OS default.
  const availableVoicesRef = useRef<VoiceInfo[] | undefined>(undefined);

  // Whether the enumerated voice list has an es-ES voice `pickDefaultSpanishVoiceId`
  // can pin (58th session). `null` until the list resolves; `false` on a phone
  // with Latin-America Spanish voice data only — the mini player watches this to
  // show its one-time "install a Spain voice" prompt. State (not a ref) so the
  // player re-renders when it flips.
  const [hasSpainVoice, setHasSpainVoice] = useState<boolean | null>(null);

  // Gates the premium-only 2.25x/2.5x playback speeds (T24). Optional variant
  // (mirrors useBibleVersionOptional above) so a test tree that mounts
  // AudioPlayerProvider without a PremiumProvider ancestor still works —
  // degrades to "free, not loading" rather than throwing.
  const premiumCtx = usePremiumOptional();
  const isPremium = premiumCtx?.isPremium ?? false;
  const premiumLoading = premiumCtx?.isLoading ?? false;

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
    // A playlist (Sprint 79) is a mixed-verse queue — restoring it as a
    // "chapter position" would resurrect the wrong thing, so the last CHAPTER
    // position is left untouched while one plays.
    if (queueInfo.mode === 'playlist') return;
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
  }, [state.currentVerseIndex, verses, isVisible, queueInfo.mode]);

  // Hold the screen awake WHILE narration is actively playing, so the OS
  // screen-timeout never sleeps the device mid-chapter and kills expo-speech
  // (it only narrates in the foreground with the screen on) — what made
  // continuous chapter/book listening stop silently when the phone rested. The
  // lock is released the instant playback pauses/stops (and on unmount), so the
  // device sleeps normally otherwise. Best-effort: a device/emulator lacking the
  // capability simply no-ops (errors are swallowed, never surfaced).
  const keepScreenAwake = shouldKeepScreenAwake(state);
  useEffect(() => {
    if (!keepScreenAwake) return;
    activateKeepAwakeAsync(AUDIO_KEEP_AWAKE_TAG).catch(err =>
      logger.warn('Error activating keep-awake', {error: String(err)}),
    );
    return () => {
      deactivateKeepAwake(AUDIO_KEEP_AWAKE_TAG).catch(err =>
        logger.warn('Error deactivating keep-awake', {error: String(err)}),
      );
    };
  }, [keepScreenAwake]);

  // Safe Haptics wrapper to prevent crashes on emulators/devices.
  // Delegates to the shared `haptics` helper (already swallows unsupported-
  // device rejections); kept as a stable callback referenced in deps arrays.
  const safeHaptic = useCallback(() => {
    haptics.tap();
  }, []);

  // ==================== LOAD PREFERENCES ====================

  // R9-30, S165 — bumped by every user setter of a field `loadPreferences`
  // hydrates. A read in flight when the user taps drops its result instead of
  // putting the pre-tap value back on screen.
  const prefsPickSeq = useRef(0);

  // R9-607, S167 — the tail of the `savePreferences` queue (see there).
  const prefsSaveQueue = useRef<Promise<void>>(Promise.resolve());

  useEffect(() => {
    loadPreferences();
  }, []);

  // R9-30, S165 — `@audio_preferences` travels in the backup. Re-read it
  // after an import, or the player keeps the old speed, audio language,
  // continuous playback and reader follow in memory until a restart.
  useEffect(
    () => subscribeBackupRestored(() => void loadPreferences(true)),
    [],
  );

  // Enumerate the system TTS voices, so resolveNarration can pin an explicit
  // es-ES voice for Spanish narration with no user-chosen voice. Runs on mount
  // AND every time the app returns to the foreground: the 58th-session
  // VoiceSelector hint / mini-player prompt sends the user out to the OS
  // Text-to-speech settings to install a "Español (España)" voice, and without
  // a refresh on return that freshly-installed voice stays invisible
  // (availableVoicesRef stale, hasSpainVoice stuck false) until an app restart —
  // MiniAudioPlayer is a persistent root component, so nothing else remounts
  // this. Only touches availableVoicesRef + hasSpainVoice; never the chosen
  // voice, so a refresh can't flip a pin.
  useEffect(() => {
    let cancelled = false;
    const enumerateVoices = () => {
      Speech.getAvailableVoicesAsync()
        .then(voices => {
          if (cancelled) return;
          const mapped = voices.map(v => ({
            identifier: v.identifier,
            name: v.name,
            language: v.language,
            quality: (v.quality || 'Default') as VoiceInfo['quality'],
          }));
          availableVoicesRef.current = mapped;
          // Does the OS have a pinnable es-ES voice? Drives the mini player's
          // one-time "install a Spain voice" prompt (58th session). An empty
          // enumeration (TTS engine not yet bound — transient) is "unknown",
          // NOT "no Spain voice": keep it null so the prompt can't fire on a
          // false negative and a later foreground refresh still resolves it.
          const spainVoice =
            mapped.length === 0
              ? null
              : pickDefaultSpanishVoiceId(mapped) !== undefined;
          setHasSpainVoice(spainVoice);
          // One-shot ground-truth log — the es-* tags/identifiers an engine
          // actually reports vary (es-ES / es_ES / …); useful when diagnosing
          // a wrong-accent narration report.
          logger.info('TTS voices enumerated', {
            count: voices.length,
            hasSpainVoice: spainVoice,
            spanish: mapped
              .filter(v => v.language.toLowerCase().startsWith('es'))
              .map(v => `${v.identifier}|${v.language}|${v.quality}`),
          });
        })
        .catch(err =>
          logger.warn('Error enumerating TTS voices', {error: String(err)}),
        );
    };
    enumerateVoices();
    const sub = AppState.addEventListener('change', next => {
      if (next === 'active') enumerateVoices();
    });
    return () => {
      cancelled = true;
      sub.remove();
    };
  }, []);

  const loadPreferences = async (afterRestore = false) => {
    const seq = prefsPickSeq.current;
    try {
      const stored = await AsyncStorage.getItem(AUDIO_STORAGE_KEYS.preferences);
      if (seq !== prefsPickSeq.current) return;
      const prefs = readStoredPreferences(stored);
      if (prefs) {
        // What this device had pinned before the restored file lands.
        const held = stateRef.current;
        // R9-30, S165 / R9-603, S167 — the voice belongs to the device: after
        // a restore in the same audio language (`setLanguage` un-pins it on a
        // change), the one pinned here may stay over the file's.
        const holdable =
          afterRestore &&
          held.selectedVoice !== null &&
          held.selectedLanguage === (prefs.selectedLanguage ?? DEFAULT_LANGUAGE)
            ? held.selectedVoice
            : null;
        setState(prev => ({
          ...prev,
          // A corrupted/stale value that isn't one of the recognized speeds
          // was dropped by readStoredPreferences (entitlement-based clamping
          // to FREE_MAX_PLAYBACK_SPEED happens separately once isPremium is
          // known — see the effect below, which avoids clamping a real
          // premium speed during the brief async window before it resolves).
          playbackSpeed: prefs.playbackSpeed ?? DEFAULT_PLAYBACK_SPEED,
          selectedLanguage: prefs.selectedLanguage ?? DEFAULT_LANGUAGE,
          // No voice saved: the one held here, or none (a re-read after a
          // restore in another audio language must also un-pin the one on
          // screen). Screen and disk get the same voice.
          ...(prefs.selectedVoiceId ? {} : {selectedVoice: holdable}),
        }));
        // Continuous playback (Sprint 72) and reader follow (Sprint 74) — an
        // older prefs without the field keeps the ON default. Set both every
        // time: a re-read after a restore must also put the default back.
        setAutoAdvanceChapterState(
          typeof prefs.autoAdvanceChapter === 'boolean'
            ? prefs.autoAdvanceChapter
            : true,
        );
        setReaderFollowsAudioState(
          typeof prefs.readerFollowsAudio === 'boolean'
            ? prefs.readerFollowsAudio
            : true,
        );

        // A file without a voice (the default on any phone) keeps the one
        // pinned here, and puts its id back on disk for the next cold start.
        if (!prefs.selectedVoiceId && holdable) {
          void savePreferences({selectedVoiceId: holdable.identifier});
        }
        // The voice id names a TTS voice of the device that saved it.
        if (prefs.selectedVoiceId) {
          const voices = await Speech.getAvailableVoicesAsync();
          if (seq !== prefsPickSeq.current) return;
          const savedVoice = voices.find(
            v => v.identifier === prefs.selectedVoiceId,
          );
          // R9-30, S165 — a restored file from another phone names a voice
          // this one lacks. Keep the one pinned here and put its id back on
          // disk over the foreign one. R9-606, S167: also when the engine
          // returns an empty list (still binding): the fallback below would
          // un-pin it and leave the foreign id on disk for good.
          const keepHeld = !savedVoice ? holdable : null;
          if (keepHeld) {
            setState(prev => ({...prev, selectedVoice: keepHeld}));
            void savePreferences({selectedVoiceId: keepHeld.identifier});
            return;
          }
          // A voice this device does not have (an uninstalled voice, or a
          // backup in another audio language) is not pinned: the automatic
          // pick narrates.
          // The one on screen stays only if it IS the saved one (an empty
          // enumeration while the TTS engine binds is transient).
          setState(prev => ({
            ...prev,
            selectedVoice: savedVoice
              ? {
                  identifier: savedVoice.identifier,
                  name: savedVoice.name,
                  language: savedVoice.language,
                  quality: savedVoice.quality as VoiceInfo['quality'],
                }
              : prev.selectedVoice?.identifier === prefs.selectedVoiceId
                ? prev.selectedVoice
                : null,
          }));
        }
      }
    } catch (error) {
      // Defaults already cover a failed load — warn, don't LogBox-toast.
      logger.warn('Error loading audio preferences', {error: String(error)});
    }
  };

  const writePreferences = async (prefs: Partial<AudioPreferences>) => {
    try {
      const current = await AsyncStorage.getItem(
        AUDIO_STORAGE_KEYS.preferences,
      );
      // Unknown fields (a newer build's) are kept; a non-object is replaced.
      const currentPrefs = parsePreferencesObject(current) ?? {
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
      logger.warn('Error saving audio preferences', {error: String(error)});
    }
  };

  // R9-607, S167 — each save reads, merges and writes the whole key. Two at
  // once (the speed clamp and the voice kept after a restore) read the same
  // value, and the last write dropped the other's field. Saves run one after
  // another; `writePreferences` never rejects, so the queue never breaks.
  const savePreferences = (prefs: Partial<AudioPreferences>) => {
    const run = prefsSaveQueue.current.then(() => writePreferences(prefs));
    prefsSaveQueue.current = run;
    return run;
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
  // `run` is passed only by the engine's own continuations; a direct start
  // (play, next, previous, go to) opens a new run, which disowns any
  // continuation still pending from the previous one (R9-426).
  const speakVerseByIndex = useCallback(
    async (index: number, run?: number) => {
      if (run !== undefined && run !== playbackRunRef.current) {
        logger.info('Scheduled continuation dropped (paused or replaced)', {
          index,
        });
        return;
      }
      const myRun = run ?? ++playbackRunRef.current;
      const isCurrentRun = () => playbackRunRef.current === myRun;
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
          speakVerseByIndex(index + 1, myRun);
        } else {
          setState(prev => ({...prev, isPlaying: false, isLoading: false}));
        }
        return;
      }

      const currentState = stateRef.current;
      // Narrate in the language of the TEXT (its Bible version's language), and
      // only use the user's chosen voice when it matches that language — so a
      // Spanish chapter is never read by an English voice and vice versa
      // (Sprint 100). Falls back to the manual audio-language preference when
      // the loaded text's language is unknown (legacy loads).
      const {language, voiceId} = resolveNarration({
        contentLanguage: contentLanguageRef.current,
        selectedLanguage: currentState.selectedLanguage,
        voice: currentState.selectedVoice,
        availableVoices: availableVoicesRef.current,
      });

      // Text-only fix for specific words the Spanish TTS engine mispronounces
      // even with the correct es-* locale genuinely requested (e.g. "Jacob"
      // read with English phonetics, "JAH" spelled out letter-by-letter) — a
      // no-op for English narration. See narration.ts for the word list and
      // the length-preserving invariant that keeps karaoke highlighting in
      // sync (it indexes onBoundary against this exact spoken string).
      const textToSpeak = applySpanishPronunciationFixes(verse.text, language);

      logger.info('Attempting to speak verse', {
        index,
        reference: `${verse.book} ${verse.chapter}:${verse.verse}`,
        textLength: verse.text.length,
        voice: voiceId,
        language,
      });

      setState(prev => ({...prev, isLoading: true, currentVerseIndex: index}));

      try {
        // First ensure we are not already speaking
        await Speech.stop().catch((err: any) =>
          logger.warn('Error in Speech.stop', {error: String(err)}),
        );
        // R9-426 — paused (or replaced) while the engine was being stopped.
        if (!isCurrentRun()) return;

        await Speech.speak(textToSpeak, {
          language,
          voice: voiceId,
          rate: currentState.playbackSpeed,
          pitch: 1.0,
          onStart: () => {
            logger.info('Speech started callback', {index});
            // R9-426 — a start that lands after a pause must not undo it.
            if (!isCurrentRun()) return;
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

            // R9-426 — the end of an utterance from a run that was paused or
            // replaced since drives nothing.
            if (!isCurrentRun()) {
              logger.info('Auto-advance skipped (run replaced)');
              return;
            }

            // Don't auto-advance if paused or not playing
            if (freshState.isPaused || !freshState.isPlaying) {
              logger.info('Auto-advance skipped (paused or stopped)');
              return;
            }

            // Memorization loop: re-speak the SAME verse instead of advancing.
            // Takes precedence over chapter advance / playlist repeat so a single
            // verse loops until the user toggles it off (or pauses/stops).
            if (
              shouldReplayVerse(
                repeatVerseRef.current,
                freshState.isPlaying,
                freshState.isPaused,
              )
            ) {
              logger.info('Repeating verse for memorization', {index});
              setTimeout(() => speakVerseByIndex(index, myRun), 50);
              return;
            }

            if (index >= freshVerses.length - 1) {
              const isPlaylist = queueInfoRef.current.mode === 'playlist';
              // A sleep timer that ends HERE: "end of chapter" always; "end of
              // book" over a verse playlist too (R9-573, S180) — a list has no
              // book of its own, so the end of the list is the only end it
              // will ever reach (the advancer leaves on a playlist before it
              // looks at the timer). The modal doesn't offer "end of book"
              // while a list is loaded; this covers one armed earlier, on a
              // chapter.
              const stoppedBySleepTimer =
                freshSleepTimer.mode === 'end-of-chapter' ||
                (isPlaylist && freshSleepTimer.mode === 'end-of-book');
              // Repeat-the-list (Sprint 80): a repeating playlist wraps to
              // its start instead of stopping. A sleep timer that ends here
              // is an explicit "stop here", so it wins (the same rule
              // shouldAdvanceChapter applies to continuous playback).
              if (
                isPlaylist &&
                queueOptionsRef.current.repeat &&
                !stoppedBySleepTimer
              ) {
                logger.info('Playlist repeating from the start');
                setTimeout(() => speakVerseByIndex(0, myRun), 50);
                return;
              }
              logger.info('Reached end of chapter');
              // An end-of-chapter sleep timer is consumed HERE, and it is the
              // engine that honours it: the chapter-end signal below is not
              // raised at all (R9-425). Raising it and letting the advancer
              // decide does not work — the timer is cancelled in this same
              // callback, so by the time AudioChapterAdvancer reads the mode it
              // is already null and continuous playback rolled on, chapter
              // after chapter, with no timer left.
              if (stoppedBySleepTimer) {
                cancelSleepTimer();
              }
              // Stop here; otherwise bump chapterEndCount so
              // AudioChapterAdvancer can pick up continuous playback into the
              // next chapter (Sprint 72). If continuous is off the advancer
              // ignores the bump and the player simply stays stopped.
              const finalState = {
                ...freshState,
                isPlaying: false,
                isPaused: false,
                chapterEndCount: stoppedBySleepTimer
                  ? freshState.chapterEndCount
                  : freshState.chapterEndCount + 1,
              };
              stateRef.current = finalState;
              setState(finalState);
              return;
            }

            // Small delay before next verse to avoid rapid recursive calls
            setTimeout(() => {
              const nextIdx = index + 1;
              speakVerseByIndex(nextIdx, myRun);
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
    // R9-426 — a continuation already scheduled must not resume playback.
    playbackRunRef.current++;
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
    // R9-426 — same as pause: nothing scheduled sounds after a stop.
    playbackRunRef.current++;
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

  // Entitlement reconciliation for playback speed (T24): once premium status
  // is known (not just on revocation — also covers the initial hydration
  // read, which can't safely clamp inline because isPremium resolves
  // asynchronously), pull a premium-only speed back down to
  // FREE_MAX_PLAYBACK_SPEED for a free listener. Mirrors
  // ReaderPreferencesSheet's revert-on-revoke effect. Persists the correction
  // so a genuinely revoked entitlement (not just the loading window) doesn't
  // keep restoring the premium speed on the next cold start.
  useEffect(() => {
    if (premiumLoading) return;
    const clamped = clampPlaybackSpeed(state.playbackSpeed, isPremium);
    if (clamped === state.playbackSpeed) return;
    setState(prev => ({...prev, playbackSpeed: clamped}));
    savePreferences({playbackSpeed: clamped});
  }, [isPremium, premiumLoading, state.playbackSpeed]);

  const setPlaybackSpeed = useCallback(
    (speed: PlaybackSpeed) => {
      const clamped = clampPlaybackSpeed(speed, isPremium);
      prefsPickSeq.current += 1;
      haptics.tap();
      setState(prev => ({...prev, playbackSpeed: clamped}));
      savePreferences({playbackSpeed: clamped});
    },
    [isPremium],
  );

  const setVoice = useCallback((voice: VoiceInfo) => {
    prefsPickSeq.current += 1;
    haptics.tap();
    setState(prev => ({...prev, selectedVoice: voice}));
    savePreferences({selectedVoiceId: voice.identifier});
  }, []);

  // Un-pin the chosen voice and hand narration back to the automatic pick
  // (resolveNarration → pickDefaultSpanishVoiceId for Spanish). Mirrors
  // setVoice; `setLanguage` also clears the voice but that isn't discoverable.
  const clearVoice = useCallback(() => {
    prefsPickSeq.current += 1;
    haptics.tap();
    setState(prev => ({...prev, selectedVoice: null}));
    savePreferences({selectedVoiceId: null});
  }, []);

  const setLanguage = useCallback((language: AudioLanguage) => {
    prefsPickSeq.current += 1;
    haptics.tap();
    setState(prev => ({
      ...prev,
      selectedLanguage: language,
      selectedVoice: null,
    }));
    savePreferences({selectedLanguage: language, selectedVoiceId: null});
  }, []);

  const setAutoAdvanceChapter = useCallback((enabled: boolean) => {
    prefsPickSeq.current += 1;
    haptics.tap();
    setAutoAdvanceChapterState(enabled);
    savePreferences({autoAdvanceChapter: enabled});
  }, []);

  const setReaderFollowsAudio = useCallback((enabled: boolean) => {
    prefsPickSeq.current += 1;
    haptics.tap();
    setReaderFollowsAudioState(enabled);
    savePreferences({readerFollowsAudio: enabled});
  }, []);

  // Toggle the memorization "repeat verse" loop. Eager ref update (like the
  // pause/stop pattern) so the speech onDone — which may fire in the same tick —
  // sees the new value immediately. Runtime-only, so nothing is persisted.
  const setRepeatVerse = useCallback((enabled: boolean) => {
    haptics.tap();
    repeatVerseRef.current = enabled;
    setRepeatVerseState(enabled);
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
    // R9-571 (S180): collapse through the REF, before stop(). stop() rebuilds
    // the whole state from stateRef.current (the pause/stop pattern) and sets
    // it as an object; a queued `setState(prev => …isExpanded: false)` here was
    // overwritten by it while the ref still said expanded, and the next audio
    // opened the player expanded. stop()'s own write now carries the collapse.
    stateRef.current = {...stateRef.current, isExpanded: false};
    haptics.press();
    await stop();
    // Closing the player is an explicit "I'm done" — drop the saved position so
    // "Continue listening" doesn't resurrect a chapter the user dismissed.
    void clearLastPosition();
  }, [stop]);

  // ==================== SLEEP TIMER ====================

  // Arm (or RE-arm) the timed-sleep timers against an absolute wall-clock
  // endTime (epoch ms). The one-shot timeout stops playback at endTime; the
  // interval refreshes the displayed minutes by RECOMPUTING from endTime each
  // tick (never blind-decrementing), so a throttled/late tick can't drift the
  // countdown. Reused by setSleepTimer and by the foreground reconciliation.
  const armSleepTimers = useCallback(
    (endTimeMs: number) => {
      if (sleepTimerRef.current) clearTimeout(sleepTimerRef.current);
      if (sleepCountdownRef.current) clearInterval(sleepCountdownRef.current);

      const remaining = endTimeMs - Date.now();
      if (remaining <= 0) {
        // Already past endTime (e.g. reconciled long after backgrounding):
        // pause rather than stop — see the rationale on the setTimeout branch
        // below, which hits this exact same bug via the live in-foreground path.
        pause();
        cancelSleepTimer();
        return;
      }

      sleepTimerRef.current = setTimeout(() => {
        // A sleep timer expiring is "stop narrating", NOT "I'm done with this
        // chapter" — the listener fell asleep mid-verse and expects to resume
        // there later. stop() resets currentVerseIndex to 0, and the
        // position-autosave effect above persists whatever index is current
        // as the "Continue listening" position — so a bare stop() here would
        // silently overwrite a real resume point with verse 0. pause() stops
        // playback the same way but leaves currentVerseIndex untouched,
        // exactly like backgrounding does a few effects down.
        pause();
        cancelSleepTimer();
      }, remaining);

      sleepCountdownRef.current = setInterval(() => {
        const r = reconcileSleepTimer(endTimeMs, Date.now());
        if (r.expired) {
          if (sleepCountdownRef.current)
            clearInterval(sleepCountdownRef.current);
          return;
        }
        setSleepTimerState(prev =>
          prev.mode === 'time'
            ? {...prev, remainingMinutes: r.remainingMinutes}
            : prev,
        );
      }, 30 * 1000);
    },
    [pause, cancelSleepTimer],
  );

  const setSleepTimer = useCallback(
    (minutes: number) => {
      haptics.press();
      const endTime = new Date(Date.now() + minutes * 60 * 1000);
      setSleepTimerState({
        isActive: true,
        remainingMinutes: minutes,
        endTime,
        mode: 'time',
      });
      armSleepTimers(endTime.getTime());
    },
    [armSleepTimers],
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

  // "Stop at the end of the BOOK" — continuous playback keeps rolling through the
  // book's chapters (even if the auto-advance preference is off; see
  // shouldAdvanceChapter) and AudioChapterAdvancer stops + cancels this timer the
  // moment the next chapter would cross into a different book (isBookEnd).
  const setSleepTimerEndOfBook = useCallback(() => {
    haptics.press();

    // Clear existing timers
    if (sleepTimerRef.current) clearTimeout(sleepTimerRef.current);
    if (sleepCountdownRef.current) clearInterval(sleepCountdownRef.current);

    setSleepTimerState({
      isActive: true,
      remainingMinutes: 0,
      endTime: null,
      mode: 'end-of-book',
    });
  }, []);

  // Reconcile the TIMED sleep timer against the wall clock whenever the app
  // returns to the foreground. JS timers are throttled/suspended while
  // backgrounded (screen off / home button), so without this the countdown
  // drifts and the stop fires late. On 'active' we recompute from the stored
  // endTime: fire + cancel if it already elapsed, otherwise re-arm the timers
  // for the true remaining time and resync the displayed minutes. Only 'time'
  // mode uses a wall clock (end-of-chapter / end-of-book are event-driven).
  useEffect(() => {
    const sub = AppState.addEventListener('change', next => {
      if (next !== 'active') return;
      const timer = sleepTimerStateRef.current;
      if (timer.mode !== 'time' || !timer.endTime) return;
      const r = reconcileSleepTimer(timer.endTime.getTime(), Date.now());
      if (r.expired) {
        // Same rationale as the setTimeout branch in armSleepTimers: a sleep
        // timer that elapsed while backgrounded should leave the resume
        // position exactly where it was, not zero it out via stop().
        pause();
        cancelSleepTimer();
        return;
      }
      setSleepTimerState(prev =>
        prev.mode === 'time'
          ? {...prev, remainingMinutes: r.remainingMinutes}
          : prev,
      );
      armSleepTimers(timer.endTime.getTime());
    });
    return () => sub.remove();
  }, [pause, cancelSleepTimer, armSleepTimers]);

  // expo-speech chains verses by having JS call Speech.speak() again from
  // each utterance's onDone callback — there's no native queue. Backgrounding
  // the app throttles JS timers/callbacks (confirmed live: the in-flight
  // utterance finishes, but the next one never fires), so playback silently
  // stalls while the UI still claims isPlaying. Rather than leave that zombie
  // state, pause explicitly on backgrounding so resuming shows an honest,
  // resumable state. True background-continuous playback would need a
  // foreground service (Android) + declared background audio (iOS) PLUS
  // restructuring this JS-chained narration into a native-queued player —
  // out of scope here; this only fixes the misleading "still playing" state.
  useEffect(() => {
    const sub = AppState.addEventListener('change', next => {
      if (next !== 'background') return;
      if (!stateRef.current.isPlaying) return;
      // R9-426 — the next verse, if already scheduled, stays unsaid.
      playbackRunRef.current++;
      const nextState = {
        ...stateRef.current,
        isPlaying: false,
        isPaused: true,
        isLoading: false,
      };
      stateRef.current = nextState;
      setState(nextState);
      Speech.stop().catch(err =>
        logger.warn('Error stopping speech on background', {
          error: String(err),
        }),
      );
    });
    return () => sub.remove();
  }, []);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (sleepTimerRef.current) clearTimeout(sleepTimerRef.current);
      if (sleepCountdownRef.current) clearInterval(sleepCountdownRef.current);
    };
  }, []);

  // ==================== CHAPTER LOADING ====================

  const loadChapter = useCallback(
    (newVerses: AudioVerse[], options?: LoadQueueOptions) => {
      logger.info('Loading new chapter for audio', {
        versesCount: newVerses.length,
        queueMode: options?.mode ?? 'chapter',
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
      // R9-426 — a continuation of the previous queue never speaks into this
      // one.
      playbackRunRef.current++;

      // Tag the loaded text with its language so narration speaks it correctly
      // (Sprint 100): the explicit option wins; otherwise the live selected
      // version's language (the version these verses were just fetched from).
      contentLanguageRef.current = options?.language ?? versionLangRef.current;

      // Update refs immediately for synchronous access (before async setState)
      versesRef.current = newVerses;
      stateRef.current = {
        ...stateRef.current,
        currentVerseIndex: 0,
        totalVerses: newVerses.length,
        isPlaying: false,
        isPaused: false,
        isLoading: false,
        contentLanguage: contentLanguageRef.current,
        contentVersionId: versionIdRef.current,
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
        contentLanguage: contentLanguageRef.current,
        contentVersionId: versionIdRef.current,
      }));
      const nextQueueInfo: AudioQueueInfo = {
        mode: options?.mode ?? 'chapter',
        label: options?.mode === 'playlist' ? (options?.label ?? null) : null,
      };
      queueInfoRef.current = nextQueueInfo;
      setQueueInfo(nextQueueInfo);
      // Every load starts an un-shuffled, non-repeating queue, and remembers
      // the loaded order as what "un-shuffle" restores to (Sprint 80).
      originalOrderRef.current = newVerses;
      queueOptionsRef.current = DEFAULT_QUEUE_OPTIONS;
      setQueueOptionsState(DEFAULT_QUEUE_OPTIONS);
      setIsVisible(true);
    },
    [],
  );

  const clearChapter = useCallback(async () => {
    await stop();
    setVerses([]);
    setState(prev => ({
      ...prev,
      currentVerseIndex: 0,
      totalVerses: 0,
      contentLanguage: null,
      contentVersionId: null,
    }));
    queueInfoRef.current = {mode: 'chapter', label: null};
    setQueueInfo({mode: 'chapter', label: null});
    contentLanguageRef.current = null;
    originalOrderRef.current = [];
    queueOptionsRef.current = DEFAULT_QUEUE_OPTIONS;
    setQueueOptionsState(DEFAULT_QUEUE_OPTIONS);
    setIsVisible(false);
  }, [stop]);

  // ==================== QUEUE OPTIONS (Sprint 80) ====================

  /**
   * Toggle devotional shuffle. Only the verses AFTER the one playing are
   * permuted (history + current stay put), so every index captured by an
   * in-flight speech callback stays valid — nothing restarts, nothing skips.
   */
  const setQueueShuffle = useCallback((on: boolean) => {
    if (queueInfoRef.current.mode !== 'playlist') return;
    const idx = stateRef.current.currentVerseIndex;
    const reordered = on
      ? shuffleUpcoming(versesRef.current, idx)
      : restoreUpcomingOrder(versesRef.current, idx, originalOrderRef.current);
    versesRef.current = reordered;
    setVerses(reordered);
    const next = {...queueOptionsRef.current, shuffle: on};
    queueOptionsRef.current = next;
    setQueueOptionsState(next);
    logger.info('Playlist shuffle toggled', {on, fromIndex: idx});
  }, []);

  /** Toggle repeat-the-list; honoured by the onDone end-of-queue branch. */
  const setQueueRepeat = useCallback((on: boolean) => {
    if (queueInfoRef.current.mode !== 'playlist') return;
    const next = {...queueOptionsRef.current, repeat: on};
    queueOptionsRef.current = next;
    setQueueOptionsState(next);
    logger.info('Playlist repeat toggled', {on});
  }, []);

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
    clearVoice,
    setLanguage,

    autoAdvanceChapter,
    setAutoAdvanceChapter,

    readerFollowsAudio,
    setReaderFollowsAudio,

    repeatVerse,
    setRepeatVerse,

    expand,
    collapse,
    toggleExpanded,
    showPlayer,
    hidePlayer,
    setSuppressed: setIsSuppressed,

    setSleepTimer,
    setSleepTimerEndOfChapter,
    setSleepTimerEndOfBook,
    cancelSleepTimer,

    loadChapter,
    clearChapter,
    setBottomOffset,
    queueInfo,
    queueOptions,
    setQueueShuffle,
    setQueueRepeat,

    subscribeToBoundary,

    hasSpainVoice,
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
