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
  const {state, currentVerse, verses, loadChapter, play} = useAudioPlayer();
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
              </View>
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
