/**
 * AudioChapterAdvancer (Sprint 72 — continuous playback across chapters).
 *
 * A render-less effect host, mounted next to <MiniAudioPlayer/> so it shares the
 * provider scope and keeps working from ANY screen (the floating player outlives
 * the reader). The TTS engine historically stopped dead at the last verse of a
 * chapter; now, when the user's continuous-playback preference is on, this
 * watches the engine's `chapterEndCount` signal and, on each natural chapter
 * end, loads + plays the NEXT chapter — rolling over book boundaries (Génesis 50
 * → Éxodo 1) and stopping only at the end of the canon or when a sleep timer is
 * set to "end of chapter".
 *
 * It owns NO state and changes nothing in the engine: it just orchestrates the
 * existing primitives (`loadChapter` + `play`). The decision + boundary logic
 * lives in the pure [[chapterNavigation]] resolvers; this component only wires
 * the real dependencies (current version, the Bible DB, book-id lookup).
 *
 * Para la gloria de Dios - Eternal Stone Bible App
 */

import React, {useEffect, useRef} from 'react';
import bibleDB from '@lib/database';
import {getBookByName} from '@/constants/bible';
import {logger} from '@lib/utils/logger';
import {useBibleVersion} from '@hooks/useBibleVersion';
import {useAudioPlayer} from '../context/AudioPlayerContext';
import {toAudioVerses} from '../lib/immersiveAudio';
import {
  nextChapterLocation,
  shouldAdvanceChapter,
} from '../lib/chapterNavigation';

export const AudioChapterAdvancer: React.FC = () => {
  const {state, verses, autoAdvanceChapter, sleepTimer, loadChapter, play} =
    useAudioPlayer();
  const {selectedVersion} = useBibleVersion();

  // Dedup: each chapter-end bump is handled exactly once (back-to-back chapter
  // ends increment the counter, so a value-equality guard fires per chapter).
  const handledRef = useRef(0);

  useEffect(() => {
    const count = state.chapterEndCount;
    if (count === 0 || count === handledRef.current) return;
    handledRef.current = count;

    if (
      !shouldAdvanceChapter({
        autoAdvance: autoAdvanceChapter,
        sleepMode: sleepTimer.mode,
      })
    ) {
      return;
    }

    // The chapter that just finished is described by its last verse.
    const last = verses[verses.length - 1];
    if (!last) return;
    const bookInfo = getBookByName(last.book);
    if (!bookInfo) return;
    const target = nextChapterLocation(bookInfo.id, last.chapter);
    if (!target) return; // end of the canon — stay stopped

    let cancelled = false;
    void (async () => {
      try {
        await bibleDB.initialize();
        const raw = await bibleDB.getChapter(
          target.bookId,
          target.chapter,
          selectedVersion.id,
        );
        if (cancelled || raw.length === 0) return;

        logger.info('Auto-advancing audio to next chapter', {
          bookId: target.bookId,
          chapter: target.chapter,
          verses: raw.length,
        });

        loadChapter(toAudioVerses(raw));
        // Let loadChapter's state refs settle before play (mirrors the reader's
        // startAudioPlayback delay).
        setTimeout(() => {
          if (!cancelled) play();
        }, 150);
      } catch (error) {
        logger.warn('Auto-advance to next chapter failed', {
          error: String(error),
        });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    state.chapterEndCount,
    autoAdvanceChapter,
    sleepTimer.mode,
    verses,
    selectedVersion,
    loadChapter,
    play,
  ]);

  return null;
};

export default AudioChapterAdvancer;
