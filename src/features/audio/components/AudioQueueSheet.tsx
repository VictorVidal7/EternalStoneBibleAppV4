/**
 * AudioQueueSheet (Sprint 75 — the listening queue).
 *
 * A bottom sheet listing the chapters continuous playback (∞, Sprint 72) will
 * roll through next — the "session" made visible, Spotify-queue style. Opened
 * from the expanded player's "∞ Up next" row; only meaningful while continuous
 * playback is on (the entry point hides otherwise).
 *
 * Shows the chapter playing NOW (with its live verse counter) and the next
 * {@link AUDIO_QUEUE_LENGTH} chapters via the pure `upcomingChapters` walker.
 * Tapping an upcoming chapter JUMPS the session there — the same
 * `getChapter → toAudioVerses → loadChapter → play` orchestration the
 * AudioChapterAdvancer runs on a natural boundary crossing, so jumping behaves
 * exactly like the session arriving there on its own.
 *
 * Mirrors SleepTimerModal's sheet idiom (overlay Pressable + focus trap).
 *
 * Para la gloria de Dios - Eternal Stone Bible App
 */

import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Pressable,
  AccessibilityInfo,
} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {haptics} from '@lib/haptics';
import bibleDB, {chapterCountKey} from '@lib/database';
import {logger} from '@lib/utils/logger';
import {useTheme} from '../../../hooks/useTheme';
import {useLanguage} from '../../../hooks/useLanguage';
import {useBibleVersion} from '@hooks/useBibleVersion';
import {staticColors} from '../../../styles/designTokens';
import {focusTrapProps} from '@lib/a11y/focusTrap';
import {getBookByName} from '@/constants/bible';
import {useAudioPlayer} from '../context/AudioPlayerContext';
import {toAudioVerses} from '../lib/immersiveAudio';
import {
  upcomingChapters,
  localizedChapterTitle,
  type ChapterLocation,
} from '../lib/chapterNavigation';
import {summarizeListening} from '../lib/listeningStats';
import {getListeningStats} from '../lib/listeningStatsStore';
import {
  addAudioBookmark,
  bookmarkAtVerse,
  createAudioBookmark,
  removeAudioBookmark,
  type AudioBookmark,
} from '../lib/audioBookmarks';
import {
  getAudioBookmarks,
  saveAudioBookmarks,
} from '../lib/audioBookmarksStore';
import {
  averageMsPerVerse,
  queueRowMeta,
  formatQueueRowMeta,
} from '../lib/queueMeta';
import {AUDIO_QUEUE_LENGTH} from '../constants/audioConstants';

interface AudioQueueSheetProps {
  visible: boolean;
  onClose: () => void;
}

export const AudioQueueSheet: React.FC<AudioQueueSheetProps> = ({
  visible,
  onClose,
}) => {
  const {colors} = useTheme();
  const {t, language} = useLanguage();
  const {selectedVersion} = useBibleVersion();
  const {state, currentVerse, verses, loadChapter, play, goToVerse} =
    useAudioPlayer();
  const tQueue = t.audio.queue;
  const lang = language === 'en' ? 'en' : 'es';

  // Localized "Salmos 118" title of the chapter playing now.
  const nowPlayingTitle = (() => {
    if (!currentVerse) return null;
    const info = getBookByName(currentVerse.book);
    const name = info
      ? language === 'en'
        ? info.nameEn
        : info.name
      : currentVerse.book;
    return `${name} ${currentVerse.chapter}`;
  })();

  const queue = upcomingChapters(currentVerse, AUDIO_QUEUE_LENGTH);
  // Fewer upcoming chapters than asked for = the canon ends inside the queue.
  const reachesEndOfCanon = queue.length < AUDIO_QUEUE_LENGTH;

  // Row meta (Sprint 76): real verse counts for the upcoming chapters (one
  // batched COUNT) + the user's own listening pace for an honest "~N min".
  // Keyed on the queue's chapter signature, NOT `queue` itself — the walker
  // returns a fresh array per render, but the chapters only change when the
  // session crosses a chapter boundary.
  const [chapterCounts, setChapterCounts] = useState<Map<
    string,
    number
  > | null>(null);
  const [msPerVerse, setMsPerVerse] = useState<number | null>(null);
  const queueKey = queue
    .map(target => chapterCountKey(target.bookId, target.chapter))
    .join(',');

  useEffect(() => {
    if (!visible || queue.length === 0) return;
    let cancelled = false;
    void (async () => {
      try {
        await bibleDB.initialize();
        const counts = await bibleDB.getChapterVerseCounts(
          queue.map(target => ({
            bookId: target.bookId,
            chapter: target.chapter,
          })),
          selectedVersion.id,
        );
        if (!cancelled) setChapterCounts(counts);
      } catch (error) {
        logger.warn('Queue verse counts failed', {error: String(error)});
      }
    })();
    return () => {
      cancelled = true;
    };
    // queueKey stands in for `queue` (fresh array identity every render).
  }, [visible, queueKey, selectedVersion.id]);

  useEffect(() => {
    if (!visible) return;
    let cancelled = false;
    void (async () => {
      const stats = await getListeningStats();
      if (cancelled) return;
      setMsPerVerse(averageMsPerVerse(summarizeListening(stats, Date.now())));
    })();
    return () => {
      cancelled = true;
    };
  }, [visible]);

  // 🔖 Saved listening positions (Sprint 77) — loaded when the sheet opens;
  // mutations go through the pure model and persist via the serialized store.
  const [bookmarks, setBookmarks] = useState<AudioBookmark[]>([]);
  useEffect(() => {
    if (!visible) return;
    let cancelled = false;
    void (async () => {
      const stored = await getAudioBookmarks();
      if (!cancelled) setBookmarks(stored);
    })();
    return () => {
      cancelled = true;
    };
  }, [visible]);

  const currentBookmark = currentVerse
    ? bookmarkAtVerse(bookmarks, currentVerse)
    : undefined;

  const handleToggleBookmark = () => {
    if (!currentVerse) return;
    if (currentBookmark) {
      haptics.tap();
      const next = removeAudioBookmark(bookmarks, currentBookmark.id);
      setBookmarks(next);
      void saveAudioBookmarks(next);
      return;
    }
    const created = createAudioBookmark(currentVerse, Date.now());
    if (!created) return;
    haptics.success();
    const next = addAudioBookmark(bookmarks, created);
    setBookmarks(next);
    void saveAudioBookmarks(next);
  };

  const handleDeleteBookmark = (id: string) => {
    haptics.tap();
    const next = removeAudioBookmark(bookmarks, id);
    setBookmarks(next);
    void saveAudioBookmarks(next);
  };

  // Localized "Salmos 118:2" label for a pin (canonical book stored).
  const bookmarkLabel = (bm: AudioBookmark): string => {
    const info = getBookByName(bm.book);
    const name = info ? (language === 'en' ? info.nameEn : info.name) : bm.book;
    return `${name} ${bm.chapter}:${bm.verse}`;
  };

  // Jump straight to a pinned verse: load its chapter in the LIVE version,
  // then seek + play. goToVerse syncs the engine ref eagerly (S77), so the
  // same-tick play() resumes at the pin, not at verse 1.
  const handleBookmarkJump = (bm: AudioBookmark) => {
    haptics.press();
    onClose();
    void (async () => {
      try {
        await bibleDB.initialize();
        const raw = await bibleDB.getChapter(
          bm.bookId,
          bm.chapter,
          selectedVersion.id,
        );
        if (raw.length === 0) return;

        logger.info('Bookmark jump', {
          bookId: bm.bookId,
          chapter: bm.chapter,
          verse: bm.verse,
        });

        const audioVerses = toAudioVerses(raw);
        loadChapter(audioVerses);
        const index = audioVerses.findIndex(v => v.verse === bm.verse);
        setTimeout(() => {
          goToVerse(Math.max(0, index));
          play();
        }, 150);

        AccessibilityInfo.announceForAccessibility(bookmarkLabel(bm));
      } catch (error) {
        logger.warn('Bookmark jump failed', {error: String(error)});
      }
    })();
  };

  const handleJump = (target: ChapterLocation) => {
    haptics.press();
    onClose();
    // Same orchestration as AudioChapterAdvancer's natural boundary crossing:
    // load the target chapter in the live version, then play after the engine's
    // refs settle.
    void (async () => {
      try {
        await bibleDB.initialize();
        const raw = await bibleDB.getChapter(
          target.bookId,
          target.chapter,
          selectedVersion.id,
        );
        if (raw.length === 0) return;

        logger.info('Queue jump to chapter', {
          bookId: target.bookId,
          chapter: target.chapter,
          verses: raw.length,
        });

        loadChapter(toAudioVerses(raw));
        setTimeout(() => play(), 150);

        const title = localizedChapterTitle(target, lang);
        if (title) {
          AccessibilityInfo.announceForAccessibility(
            t.audio.immersive.chapterAdvanced.replace('{{chapter}}', title),
          );
        }
      } catch (error) {
        logger.warn('Queue jump failed', {error: String(error)});
      }
    })();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable
          style={[styles.modalContent, {backgroundColor: colors.card}]}
          onPress={e => e.stopPropagation()}
          {...focusTrapProps()}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={styles.headerLeft}>
              <Ionicons name="infinite" size={24} color={colors.primary} />
              <Text style={[styles.modalTitle, {color: colors.text}]}>
                {tQueue.title}
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel={t.audio.a11y.close}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          {/* Now playing */}
          {nowPlayingTitle && (
            <View style={styles.section}>
              <Text
                style={[styles.sectionTitle, {color: colors.textSecondary}]}>
                {tQueue.nowPlaying}
              </Text>
              <View
                style={[
                  styles.nowPlayingRow,
                  {backgroundColor: colors.primary + '15'},
                ]}
                accessible={true}
                accessibilityLabel={`${tQueue.nowPlaying}, ${nowPlayingTitle}`}
                accessibilityValue={{
                  text: t.audio.scrub.preview
                    .replace('{{n}}', String(state.currentVerseIndex + 1))
                    .replace('{{total}}', String(verses.length)),
                }}>
                <Ionicons
                  name={state.isPlaying ? 'volume-high' : 'pause'}
                  size={18}
                  color={colors.primary}
                />
                <Text
                  style={[styles.nowPlayingTitle, {color: colors.text}]}
                  numberOfLines={1}>
                  {nowPlayingTitle}
                </Text>
                <Text
                  style={[styles.nowPlayingCounter, {color: colors.primary}]}>
                  {state.currentVerseIndex + 1}/{verses.length}
                </Text>
                {/* 🔖 Pin/unpin the verse being heard (Sprint 77). */}
                <TouchableOpacity
                  onPress={handleToggleBookmark}
                  hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
                  accessibilityRole="button"
                  accessibilityLabel={
                    currentBookmark ? tQueue.bookmarkRemove : tQueue.bookmarkAdd
                  }
                  accessibilityState={{selected: !!currentBookmark}}>
                  <Ionicons
                    name={currentBookmark ? 'bookmark' : 'bookmark-outline'}
                    size={18}
                    color={colors.primary}
                  />
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* 🔖 Saved listening positions (Sprint 77) */}
          {bookmarks.length > 0 && (
            <View style={styles.section}>
              <Text
                style={[styles.sectionTitle, {color: colors.textSecondary}]}>
                {tQueue.bookmarksSection}
              </Text>
              {bookmarks.map(bm => {
                const label = bookmarkLabel(bm);
                return (
                  <View
                    key={bm.id}
                    style={[
                      styles.queueRow,
                      {borderBottomColor: colors.border},
                    ]}>
                    <Ionicons
                      name="bookmark"
                      size={14}
                      color={colors.primary}
                    />
                    <TouchableOpacity
                      style={styles.bookmarkJump}
                      onPress={() => handleBookmarkJump(bm)}
                      accessibilityRole="button"
                      accessibilityLabel={label}
                      accessibilityHint={tQueue.bookmarkJumpHint}>
                      <Text
                        style={[styles.queueTitle, {color: colors.text}]}
                        numberOfLines={1}>
                        {label}
                      </Text>
                      <Ionicons
                        name="play"
                        size={16}
                        color={colors.textSecondary}
                      />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleDeleteBookmark(bm.id)}
                      hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}
                      accessibilityRole="button"
                      accessibilityLabel={`${tQueue.bookmarkDelete}, ${label}`}>
                      <Ionicons
                        name="trash-outline"
                        size={16}
                        color={colors.textTertiary}
                      />
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          )}

          {/* Upcoming chapters */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, {color: colors.textSecondary}]}>
              {tQueue.upNextSection}
            </Text>
            {queue.map((target, i) => {
              const title = localizedChapterTitle(target, lang);
              if (!title) return null;
              const meta = queueRowMeta(
                chapterCounts?.get(
                  chapterCountKey(target.bookId, target.chapter),
                ),
                msPerVerse,
              );
              const metaLine = meta
                ? formatQueueRowMeta(
                    meta,
                    tQueue.versesMeta,
                    tQueue.minutesMeta,
                  )
                : ' '; // reserved slot — the row never jumps when counts land
              return (
                <TouchableOpacity
                  key={`${target.bookId}-${target.chapter}`}
                  style={[styles.queueRow, {borderBottomColor: colors.border}]}
                  onPress={() => handleJump(target)}
                  accessibilityRole="button"
                  accessibilityLabel={meta ? `${title}, ${metaLine}` : title}
                  accessibilityHint={tQueue.jumpHint}>
                  <Text
                    style={[styles.queueIndex, {color: colors.textTertiary}]}>
                    {i + 1}
                  </Text>
                  <View style={styles.queueTitleWrap}>
                    <Text
                      style={[styles.queueTitle, {color: colors.text}]}
                      numberOfLines={1}>
                      {title}
                    </Text>
                    <Text
                      style={[styles.queueMeta, {color: colors.textTertiary}]}
                      numberOfLines={1}>
                      {metaLine}
                    </Text>
                  </View>
                  <Ionicons
                    name="play"
                    size={16}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
              );
            })}
            {reachesEndOfCanon && (
              <View style={styles.endRow}>
                <Ionicons
                  name="flag-outline"
                  size={14}
                  color={colors.textTertiary}
                />
                <Text style={[styles.endText, {color: colors.textTertiary}]}>
                  {tQueue.endOfCanon}
                </Text>
              </View>
            )}
          </View>

          {/* Info */}
          <View style={styles.infoContainer}>
            <Ionicons
              name="information-circle"
              size={16}
              color={colors.textTertiary}
            />
            <Text style={[styles.infoText, {color: colors.textTertiary}]}>
              {tQueue.info}
            </Text>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: staticColors.overlayBlack50,
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 34,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: staticColors.overlayBlack10,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  section: {
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
    marginLeft: 4,
  },
  nowPlayingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    borderRadius: 12,
  },
  nowPlayingTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
  },
  nowPlayingCounter: {
    fontSize: 12,
    fontWeight: '600',
  },
  queueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 13,
    paddingHorizontal: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  queueIndex: {
    width: 16,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  queueTitleWrap: {
    flex: 1,
    gap: 1,
  },
  bookmarkJump: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  queueTitle: {
    fontSize: 15,
    fontWeight: '500',
  },
  queueMeta: {
    fontSize: 12,
    lineHeight: 15,
  },
  endRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  endText: {
    fontSize: 12,
    fontWeight: '500',
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  infoText: {
    fontSize: 12,
    flex: 1,
    lineHeight: 16,
  },
});

export default AudioQueueSheet;
