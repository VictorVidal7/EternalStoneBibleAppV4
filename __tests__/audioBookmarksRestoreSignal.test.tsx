/**
 * R9-30 — the listening queue re-reads its pins when a backup is restored.
 *
 * The store is safe on its own terms, but the queue sheet holds the pin list
 * in `useState` (read when the sheet opens) and every toggle saves the WHOLE
 * list it holds. An import can still be running when the user opens the
 * floating player's queue; when it lands with the sheet open, the next tap
 * wrote the pre-import pins (plus the tap) back over the restored ones.
 *
 * Lo REAL: AudioQueueSheet, audioBookmarksStore, the pure bookmark model and
 * the restore signal, over the AsyncStorage mock. Lo sustituido: the audio
 * context, theme, language, version, haptics and the database (no counts).
 */
import {act, fireEvent, render, waitFor} from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

jest.mock('@expo/vector-icons', () => ({Ionicons: () => null}));
jest.mock('@lib/haptics', () => ({
  haptics: {tap: jest.fn(), success: jest.fn(), press: jest.fn()},
}));
const mockColors = new Proxy({}, {get: () => '#888888'});
jest.mock('../src/hooks/useTheme', () => ({
  useTheme: () => ({colors: mockColors}),
}));
jest.mock('../src/hooks/useLanguage', () => ({
  useLanguage: () => ({
    language: 'es',
    t: require('../src/i18n/translations').translations.es,
  }),
}));
jest.mock('@hooks/useBibleVersion', () => ({
  useBibleVersion: () => ({selectedVersion: {id: 'rvr1960', language: 'es'}}),
}));
jest.mock('@lib/database', () => {
  const db = {
    initialize: jest.fn().mockResolvedValue(undefined),
    getChapterVerseCounts: jest.fn().mockResolvedValue(new Map()),
    getChapter: jest.fn().mockResolvedValue([]),
  };
  return {__esModule: true, default: db, chapterCountKey: () => 'k'};
});
jest.mock('../src/features/audio/context/AudioPlayerContext', () => {
  const noop = () => {};
  const verse = {
    id: 3,
    book: 'Juan',
    chapter: 3,
    verse: 16,
    text: 'Juan 3:16',
    version: 'RVR1960',
  };
  const value = {
    state: {isPlaying: true, currentVerseIndex: 0},
    currentVerse: verse,
    verses: [verse],
    loadChapter: noop,
    play: noop,
    goToVerse: noop,
    queueInfo: {mode: 'chapter', label: null},
    queueOptions: {shuffle: false, repeat: false},
    setQueueShuffle: noop,
    setQueueRepeat: noop,
  };
  return {useAudioPlayer: () => value};
});

import {AudioQueueSheet} from '../src/features/audio/components/AudioQueueSheet';
import {getAudioBookmarks} from '../src/features/audio/lib/audioBookmarksStore';
import {
  __resetBackupRestoredListenersForTests,
  emitBackupRestored,
} from '../src/lib/backup/restoreSignal';
import {translations} from '../src/i18n/translations';

const KEY = '@audio_bookmarks';
const pin = (id: string, bookId: number, book: string, verse: number) => ({
  id,
  bookId,
  book,
  chapter: 1,
  verse,
  createdAt: 1,
});

beforeEach(async () => {
  await AsyncStorage.clear();
  __resetBackupRestoredListenersForTests();
});

it('R9-30 — a tap after the restore signal edits the restored pins', async () => {
  await AsyncStorage.setItem(
    KEY,
    JSON.stringify([pin('pre', 19, 'Salmos', 1)]),
  );
  const screen = render(<AudioQueueSheet visible onClose={() => {}} />);
  await waitFor(() => expect(screen.getByText('Salmos 1:1')).toBeTruthy());

  // What `importBackup` does: the file's raw value, then the signal.
  await AsyncStorage.setItem(
    KEY,
    JSON.stringify([
      pin('rest1', 1, 'Génesis', 1),
      pin('rest2', 43, 'Juan', 1),
    ]),
  );
  await act(async () => {
    emitBackupRestored();
    for (let i = 0; i < 5; i++) await new Promise(r => setImmediate(r));
  });

  // The user pins the verse playing now (Juan 3:16).
  await act(async () => {
    fireEvent.press(
      screen.getByLabelText(translations.es.audio.queue.bookmarkAdd),
    );
    for (let i = 0; i < 5; i++) await new Promise(r => setImmediate(r));
  });
  screen.unmount();

  const ids = (await getAudioBookmarks()).map(b => b.id);
  expect(ids.slice(1)).toEqual(['rest1', 'rest2']);
  expect(ids).not.toContain('pre');
  expect(ids[0]).toMatch(/^abm_\d+_43_3_16$/);
});

it('CONTROL: without a restore, a tap keeps the pins already there', async () => {
  await AsyncStorage.setItem(
    KEY,
    JSON.stringify([pin('pre', 19, 'Salmos', 1)]),
  );
  const screen = render(<AudioQueueSheet visible onClose={() => {}} />);
  await waitFor(() => expect(screen.getByText('Salmos 1:1')).toBeTruthy());
  await act(async () => {
    fireEvent.press(
      screen.getByLabelText(translations.es.audio.queue.bookmarkAdd),
    );
    for (let i = 0; i < 5; i++) await new Promise(r => setImmediate(r));
  });
  screen.unmount();
  expect((await getAudioBookmarks()).map(b => b.id).slice(1)).toEqual(['pre']);
});
