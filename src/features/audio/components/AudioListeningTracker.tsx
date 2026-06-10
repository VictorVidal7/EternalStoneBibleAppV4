/**
 * AudioListeningTracker (Sprint 75 — listening time).
 *
 * A render-less effect host, mounted next to <MiniAudioPlayer/> (same provider
 * scope as AudioChapterAdvancer/AudioResumeRestorer), that finally TRACKS
 * audio listening — nothing about it was recorded before. Two signals:
 *
 *   - TIME: wall-clock while `isPlaying`. Stamped when playback turns on,
 *     flushed into today's bucket when it turns off (pause/stop/natural end)
 *     or this host unmounts. A session crossing midnight credits the day the
 *     flush lands on — a deliberate simplification.
 *   - VERSES: a verse counts once when it BEGINS voicing (keyed by its
 *     book|chapter|verse identity, so pause/resume of the same verse never
 *     double-counts, while continuous playback's chapter swaps keep counting).
 *
 * It owns NO state and changes nothing in the engine; appends go through the
 * serialized [[listeningStatsStore]] queue. The "Mi lectura" dashboard reads
 * the buckets via the pure [[listeningStats]] summarizer.
 *
 * Para la gloria de Dios - Eternal Stone Bible App
 */

import React, {useEffect, useRef} from 'react';
import {useAudioPlayer} from '../context/AudioPlayerContext';
import {appendListening} from '../lib/listeningStatsStore';

export const AudioListeningTracker: React.FC = () => {
  const {state, currentVerse} = useAudioPlayer();

  // ---- Active listening time -------------------------------------------
  const playStartRef = useRef<number | null>(null);
  useEffect(() => {
    if (state.isPlaying) {
      if (playStartRef.current === null) {
        playStartRef.current = Date.now();
      }
      return;
    }
    if (playStartRef.current !== null) {
      const ms = Date.now() - playStartRef.current;
      playStartRef.current = null;
      if (ms > 0) void appendListening({ms});
    }
  }, [state.isPlaying]);

  // Flush a still-open span if the host ever unmounts mid-playback.
  useEffect(
    () => () => {
      if (playStartRef.current !== null) {
        const ms = Date.now() - playStartRef.current;
        playStartRef.current = null;
        if (ms > 0) void appendListening({ms});
      }
    },
    [],
  );

  // ---- Verses that began voicing ----------------------------------------
  const lastVerseKeyRef = useRef<string | null>(null);
  useEffect(() => {
    if (!state.isPlaying || !currentVerse) return;
    const key = `${currentVerse.book}|${currentVerse.chapter}|${currentVerse.verse}`;
    if (key === lastVerseKeyRef.current) return;
    lastVerseKeyRef.current = key;
    void appendListening({verses: 1});
  }, [state.isPlaying, currentVerse]);

  return null;
};

export default AudioListeningTracker;
