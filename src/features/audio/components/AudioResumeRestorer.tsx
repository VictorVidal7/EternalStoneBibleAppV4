/**
 * AudioResumeRestorer (Sprint 53 — cold-start player restore).
 *
 * A render-less effect host: on a fresh app launch it re-opens the floating
 * audio player (collapsed + paused) at the user's last "Continue listening"
 * position, so a premium listener can resume from any screen with one tap.
 *
 * It owns NO state and changes NOTHING in the AudioPlayerContext engine — it
 * just orchestrates existing primitives (`loadChapter` + `goToVerse`) once,
 * after the premium flag has loaded. The eligibility + chapter resolution lives
 * in the pure `resolveColdStartRestore` resolver; this component only wires the
 * real dependencies (premium flag, saved position, book-id lookup, the Bible DB
 * for the current version) and dispatches the result.
 *
 * Premium-gated (resume is premium since Sprint 51); free users never restore.
 * Restores PAUSED — never auto-plays — so launching the app is never a surprise
 * burst of audio. Mount it next to <MiniAudioPlayer/> (same provider scope).
 *
 * Para la gloria de Dios - Eternal Stone Bible App
 */

import React, {useEffect, useRef} from 'react';
import bibleDB from '@lib/database';
import {getBookByName} from '@/constants/bible';
import {logger} from '@lib/utils/logger';
import {useBibleVersion} from '@hooks/useBibleVersion';
import {useAudioPlayer} from '../context/AudioPlayerContext';
import {usePremium} from '@/context/PremiumContext';
import {getLastPosition} from '../lib/playbackPositionStore';
import {resolveColdStartRestore} from '../lib/coldStartRestore';

export const AudioResumeRestorer: React.FC = () => {
  const {isPremium, isLoading: premiumLoading} = usePremium();
  const {selectedVersion} = useBibleVersion();
  const {isVisible, loadChapter, goToVerse} = useAudioPlayer();

  // Latest values for the one-shot effect (it captures these at run time but we
  // read through refs so a fast premium-load race can't restore with stale data).
  const isVisibleRef = useRef(isVisible);
  isVisibleRef.current = isVisible;
  const isPremiumRef = useRef(isPremium);
  isPremiumRef.current = isPremium;
  const versionIdRef = useRef(selectedVersion.id);
  versionIdRef.current = selectedVersion.id;

  // Fire exactly once, after the premium flag has been read.
  const ranRef = useRef(false);
  useEffect(() => {
    if (ranRef.current || premiumLoading) return;
    ranRef.current = true;

    void (async () => {
      // The player may already be up (rare on a true cold start, but a
      // re-render race could re-run this) — never clobber an active session.
      if (isVisibleRef.current) return;

      const target = await resolveColdStartRestore({
        isPremium: isPremiumRef.current,
        now: Date.now(),
        getLastPosition,
        resolveBookId: (book: string) => getBookByName(book)?.id ?? null,
        getChapter: async (bookId: number, chapter: number) => {
          await bibleDB.initialize();
          return bibleDB.getChapter(bookId, chapter, versionIdRef.current);
        },
      });

      if (!target || isVisibleRef.current) return;

      logger.info('Restoring audio player on cold start', {
        verses: target.verses.length,
        index: target.index,
      });

      // Read-before-load is already done (the resolver read the saved position
      // first). loadChapter resets to verse 0 + makes the player visible; then
      // seek to the saved verse. No play() — restore is paused/silent.
      loadChapter(target.verses);
      goToVerse(target.index);
    })();
  }, [premiumLoading, loadChapter, goToVerse]);

  return null;
};

export default AudioResumeRestorer;
