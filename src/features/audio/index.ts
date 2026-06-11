/**
 * Audio Bible Feature
 *
 * Text-to-Speech con reproductor flotante estilo Spotify
 * Soporta espanol e ingles
 *
 * Para la gloria de Dios - Eternal Stone Bible App
 */

// Context & Provider
export {
  AudioPlayerProvider,
  useAudioPlayer,
} from './context/AudioPlayerContext';

// Components
export {
  MiniAudioPlayer,
  AudioResumeRestorer,
  AudioChapterAdvancer,
  AudioListeningTracker,
  AudioControls,
  AudioProgressBar,
  MiniProgressDots,
  MiniVerseProgress,
  AudioSpeedSelector,
  VoiceSelector,
  SleepTimerModal,
  AudioQueueSheet,
  KaraokeText,
} from './components';

// Hooks
export {useVoices} from './hooks/useVoices';
export {useSleepTimer} from './hooks/useSleepTimer';

// Types
export type {
  AudioPlayerState,
  AudioPlayerContextValue,
  AudioVerse,
  AudioChapter,
  VoiceInfo,
  PlaybackSpeed,
  AudioLanguage,
  SleepTimerState,
  AudioPreferences,
  AudioEvent,
} from './types/audio';

// Constants
export {
  PLAYBACK_SPEEDS,
  PLAYBACK_SPEED_LABELS,
  DEFAULT_PLAYBACK_SPEED,
  SUPPORTED_LANGUAGES,
  LANGUAGE_LABELS,
  LANGUAGE_FLAGS,
  DEFAULT_LANGUAGE,
  SLEEP_TIMER_OPTIONS,
  PLAYER_DIMENSIONS,
  AUDIO_STORAGE_KEYS,
  AUDIO_ICONS,
} from './constants/audioConstants';

// Playback position — "Continue listening" (Sprint 51)
export {
  getLastPosition,
  setLastPosition,
  clearLastPosition,
} from './lib/playbackPositionStore';
export {
  clampVerseIndex,
  isResumable,
  isSameChapter,
  createPosition,
  parsePosition,
  serializePosition,
  RESUME_MAX_AGE_MS,
} from './lib/playbackPosition';
export type {PlaybackPosition} from './lib/playbackPosition';

// Immersive ↔ audio bridge — premium audio in the ImmersiveReader (Sprint 52);
// bibleVersesFromAudio added in S73 for immersive cross-chapter following.
export {
  toAudioVerses,
  isSameAudioChapter,
  bibleVersesFromAudio,
} from './lib/immersiveAudio';
export type {VerseLike} from './lib/immersiveAudio';

// Continuous playback across chapters (Sprint 72); cross-chapter following
// helpers added in S73 (chapterLocationFromVerse / shouldFollowAudioChapter);
// reader-follow policy added in S74 (shouldReaderFollowAudio).
export {
  nextChapterLocation,
  shouldAdvanceChapter,
  chapterLocationFromVerse,
  shouldFollowAudioChapter,
  nextChapterTitle,
  sameChapterLocation,
  shouldReaderFollowAudio,
  localizedChapterTitle,
  upcomingChapters,
} from './lib/chapterNavigation';
export type {ChapterLocation, VerseChapterRef} from './lib/chapterNavigation';

// Home "Continue listening" card policy (Sprint 75 — revives the card the
// S53 cold-start restore had effectively killed; see resumeCard.ts).
export {resumeCardMode} from './lib/resumeCard';
export type {ResumeCardMode, ResumeCardParams} from './lib/resumeCard';

// Karaoke word highlight (Sprint 75 — TTS word boundaries → text spans).
export {tokenizeForKaraoke, activeTokenIndex} from './lib/karaoke';
export type {KaraokeToken} from './lib/karaoke';
export type {SpeechBoundary} from './types/audio';

// Collapsed-bar swipe policy (Sprint 75; landing bounds + paused flash S77).
export {
  resolveHorizontalSwipe,
  swipeDisplacement,
  swipeTargetIndex,
  PAUSED_SWIPE_FLASH_MS,
} from './lib/miniPlayerGestures';
export type {SwipeAction} from './lib/miniPlayerGestures';

// Listening time (Sprint 75 — per-day buckets + the "Mi lectura" summary).
export {
  listeningDateKey,
  parseListeningStats,
  serializeListeningStats,
  recordListening,
  summarizeListening,
  listeningStreaks,
  EMPTY_LISTENING_STATS,
  LISTENING_RETENTION_DAYS,
} from './lib/listeningStats';
export type {
  ListeningStats,
  ListeningDay,
  ListeningSummary,
  ListeningStreaks,
} from './lib/listeningStats';
export {getListeningStats, appendListening} from './lib/listeningStatsStore';

// Verse playlists (Sprint 79 — listen to favorites / a collection).
export {buildVersePlaylist, playlistUpNext} from './lib/versePlaylist';
export type {
  PlaylistSourceVerse,
  PlaylistUpNextEntry,
} from './lib/versePlaylist';

// Saved listening positions (Sprint 77 — "retomar en este verso").
export {
  createAudioBookmark,
  addAudioBookmark,
  removeAudioBookmark,
  bookmarkAtVerse,
  parseAudioBookmarks,
  serializeAudioBookmarks,
  MAX_AUDIO_BOOKMARKS,
} from './lib/audioBookmarks';
export type {AudioBookmark} from './lib/audioBookmarks';
export {getAudioBookmarks, saveAudioBookmarks} from './lib/audioBookmarksStore';

// Cold-start player restore (Sprint 53)
export {resolveColdStartRestore} from './lib/coldStartRestore';
export type {
  ColdStartRestoreDeps,
  ColdStartRestoreTarget,
} from './lib/coldStartRestore';
