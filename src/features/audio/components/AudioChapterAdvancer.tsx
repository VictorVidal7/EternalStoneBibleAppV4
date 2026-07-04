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
  isBookEnd,
  nextChapterLocation,
  shouldAdvanceChapter,
} from '../lib/chapterNavigation';

export const AudioChapterAdvancer: React.FC = () => {
  const {
    state,
    verses,
    autoAdvanceChapter,
    sleepTimer,
    loadChapter,
    play,
    queueInfo,
    cancelSleepTimer,
  } = useAudioPlayer();
  const {selectedVersion} = useBibleVersion();

  // Refs mirroring every value/callback the effect below reads, kept fresh
  // EAGERLY on every render (mirrors AudioPlayerContext's own
  // versionLangRef/versionIdRef pattern) rather than through the effect's own
  // dependency array.
  //
  // Root cause confirmed live 2026-07-03: the effect used to list `verses`
  // (among others) as a dependency, needing it to read the finished chapter's
  // last verse. But `loadChapter` — called from INSIDE this same effect to
  // advance into the next chapter — updates `verses`. That change re-ran the
  // effect immediately (same render pass), and React tore down the in-flight
  // invocation via its cleanup FIRST, setting that closure's `cancelled` to
  // true. The already-scheduled `setTimeout(() => { if (!cancelled) play();
  // }, 150)` then fired 150ms later against the STALE (now-true) `cancelled`,
  // so `play()` was silently skipped every single time. Logs showed the next
  // chapter's DB query, `loadChapter`, and UI (title/progress) all succeeding
  // — only the follow-up `play()` never ran, matching the reported "audio
  // doesn't continue" (it silently loads-but-pauses on every chapter
  // boundary). Depending on refs instead of the live values means this
  // effect's identity — and thus whether it tears itself down — depends ONLY
  // on `state.chapterEndCount`, so its own side effects can never cancel it.
  const versesRef = useRef(verses);
  versesRef.current = verses;
  const autoAdvanceRef = useRef(autoAdvanceChapter);
  autoAdvanceRef.current = autoAdvanceChapter;
  const sleepModeRef = useRef(sleepTimer.mode);
  sleepModeRef.current = sleepTimer.mode;
  const queueModeRef = useRef(queueInfo.mode);
  queueModeRef.current = queueInfo.mode;
  const versionRef = useRef(selectedVersion);
  versionRef.current = selectedVersion;
  const loadChapterRef = useRef(loadChapter);
  loadChapterRef.current = loadChapter;
  const playRef = useRef(play);
  playRef.current = play;
  const cancelSleepTimerRef = useRef(cancelSleepTimer);
  cancelSleepTimerRef.current = cancelSleepTimer;

  // Dedup: each chapter-end bump is handled exactly once (back-to-back chapter
  // ends increment the counter, so a value-equality guard fires per chapter).
  const handledRef = useRef(0);

  useEffect(() => {
    const count = state.chapterEndCount;
    if (count === 0 || count === handledRef.current) return;
    handledRef.current = count;

    if (
      !shouldAdvanceChapter({
        autoAdvance: autoAdvanceRef.current,
        sleepMode: sleepModeRef.current,
        queueMode: queueModeRef.current,
      })
    ) {
      return;
    }

    // The chapter that just finished is described by its last verse.
    const last = versesRef.current[versesRef.current.length - 1];
    if (!last) return;
    const bookInfo = getBookByName(last.book);
    if (!bookInfo) return;

    // "End of book" sleep timer: stop the instant the finished chapter is the
    // book's last (the next chapter would cross into a different book, or the
    // canon ended) and clear the timer, instead of rolling into the next book.
    if (
      sleepModeRef.current === 'end-of-book' &&
      isBookEnd(bookInfo.id, last.chapter)
    ) {
      logger.info('End-of-book sleep timer reached — stopping at book end', {
        bookId: bookInfo.id,
        chapter: last.chapter,
      });
      cancelSleepTimerRef.current();
      return;
    }

    const target = nextChapterLocation(bookInfo.id, last.chapter);
    if (!target) return; // end of the canon — stay stopped

    let cancelled = false;
    void (async () => {
      try {
        await bibleDB.initialize();
        const raw = await bibleDB.getChapter(
          target.bookId,
          target.chapter,
          versionRef.current.id,
        );
        if (cancelled || raw.length === 0) return;

        logger.info('Auto-advancing audio to next chapter', {
          bookId: target.bookId,
          chapter: target.chapter,
          verses: raw.length,
        });

        loadChapterRef.current(toAudioVerses(raw));
        // Let loadChapter's state refs settle before play (mirrors the reader's
        // startAudioPlayback delay). `cancelled` is only ever flipped by THIS
        // invocation's own cleanup (unmount), never by loadChapter's state
        // update, since the effect no longer depends on the values it mutates.
        setTimeout(() => {
          if (!cancelled) playRef.current();
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
    // Intentionally depends ONLY on the chapter-end signal — every other value
    // is read through the refs above so this effect's own side effects
    // (loadChapter mutating `verses`/`queueInfo`, etc.) can never re-trigger
    // or tear down an in-flight advance.
  }, [state.chapterEndCount]);

  return null;
};

export default AudioChapterAdvancer;
