/**
 * 🔊 useNarratedWalkthrough — the shared auto-advancing TTS engine behind
 * Rutas bíblicas, Hilo profético and Biblia para niños' "Leer juntos" (Item
 * 4, Tanda 3). Extracted from 3 near-identical `expo-speech` implementations
 * that had started to drift (the same duplication pattern that caused the
 * "Anterior" button bug in Tanda 1) into one hook, migrating all 3 call
 * sites onto it.
 *
 * The caller owns the step index as external state (`index`/`setIndex` —
 * Hilo profético and Niños already worked this way; Rutas gains one trivial
 * `useState`) and supplies the CURRENT step's speech segments, memoized:
 *   - `null` = not ready yet (async resolution in flight, e.g. a DB fetch) —
 *     the hook waits for a re-render with real data, exactly like Hilo
 *     profético's driver effect did before extraction.
 *   - `[]` = ready, nothing to say at this step — the hook skips forward.
 *   - `[a, b, ...]` = spoken in order before advancing.
 *
 * Pure decision logic lives in [[narration]] (`planNarrationAdvance`); this
 * hook is the thin `expo-speech` + React-state shell around it.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import {useEffect, useRef, useState} from 'react';
import * as Speech from 'expo-speech';
import {
  applySpanishPronunciationFixes,
  planNarrationAdvance,
  type SpeechLang,
} from '@/lib/speech/narration';

export interface UseNarratedWalkthroughParams {
  /** Total number of steps. */
  total: number;
  /** The caller-owned current step index. */
  index: number;
  /** Caller-owned setter for the current step index. */
  setIndex: (next: number) => void;
  /**
   * Segments for the CURRENT `index`, MUST be a memoized reference (stable
   * until the underlying data actually changes) — see the module doc for
   * the `null` / `[]` / real-array contract.
   */
  segments: readonly string[] | null;
  /** Read fresh for every utterance (UI vs. Bible-version language can differ). */
  getLanguage: () => SpeechLang;
  rate?: number;
  /** Side effect fired when a step becomes current (e.g. mark-visited). */
  onEnterStep?: (index: number) => void;
  /** Fired once the walkthrough completes the last step. */
  onComplete?: () => void;
}

export interface UseNarratedWalkthrough {
  /** A single step is currently being spoken (tour or one-shot). */
  speaking: boolean;
  /** The auto-advancing tour is running. */
  walkthroughActive: boolean;
  /** Starts the tour, optionally jumping to `fromIndex` first (default: current index). */
  start: (fromIndex?: number) => void;
  /** Stops the tour / cancels any in-flight speech. */
  stop: () => void;
  /** Toggles the tour on/off; when turning on, behaves like `start`. */
  toggle: (fromIndex?: number) => void;
  /** Speaks the current step's segments once, without advancing. */
  speakOnce: () => void;
}

export function useNarratedWalkthrough({
  total,
  index,
  setIndex,
  segments,
  getLanguage,
  rate,
  onEnterStep,
  onComplete,
}: UseNarratedWalkthroughParams): UseNarratedWalkthrough {
  const [speaking, setSpeaking] = useState(false);
  const [walkthroughActive, setWalkthroughActive] = useState(false);
  const autoAdvancingRef = useRef(false);
  // Invalidates in-flight Speech callbacks after stop()/unmount/a fresh
  // speak, so a stale onDone from a superseded utterance is a no-op —
  // protects against rapid stop/start taps leaving orphaned narration.
  const genRef = useRef(0);

  // Manual navigation (index changed by something other than this hook's
  // own auto-advance) cancels the tour — mirrors Hilo profético's original
  // `[phase]` effect.
  useEffect(() => {
    setSpeaking(false);
    if (!autoAdvancingRef.current) {
      setWalkthroughActive(false);
    }
    autoAdvancingRef.current = false;
    return () => {
      void Speech.stop();
    };
  }, [index]);

  const advanceOrFinish = () => {
    const advance = planNarrationAdvance(index, total);
    if (!advance.done) {
      autoAdvancingRef.current = true;
      onEnterStep?.(advance.nextIndex);
      setIndex(advance.nextIndex);
    } else {
      setWalkthroughActive(false);
      onComplete?.();
    }
  };

  const speakSegments = (segs: readonly string[]) => {
    const gen = ++genRef.current;
    const language = getLanguage();
    setSpeaking(true);
    let i = 0;
    const speakNext = () => {
      if (gen !== genRef.current) return;
      if (i >= segs.length) {
        setSpeaking(false);
        if (walkthroughActive) advanceOrFinish();
        return;
      }
      const text = segs[i++];
      // Same Spanish-only pronunciation fixes as the main Audio Bible player
      // (see narration.ts) — a no-op for English segments/steps.
      const textToSpeak = applySpanishPronunciationFixes(text, language);
      void Speech.speak(textToSpeak, {
        language,
        rate,
        onDone: () => {
          if (gen === genRef.current) speakNext();
        },
        onStopped: () => {
          if (gen === genRef.current) setSpeaking(false);
        },
        onError: () => {
          if (gen === genRef.current) setSpeaking(false);
        },
      });
    };
    void Speech.stop().then(() => {
      if (gen === genRef.current) speakNext();
    });
  };

  // Drives speaking during a tour — keyed on `segments` itself (not
  // `index`/a loading status separately): segments update the instant the
  // current step's text is ready, exactly like Hilo profético's original
  // driver effect (keyed on the resolved prophecy/fulfillment objects).
  useEffect(() => {
    if (!walkthroughActive || speaking) return;
    if (segments === null) return; // not ready yet — wait for a re-render
    if (segments.length === 0) {
      advanceOrFinish(); // nothing to say at this step — skip forward
      return;
    }
    speakSegments(segments);
  }, [walkthroughActive, segments]);

  const start = (fromIndex?: number) => {
    const target = fromIndex ?? index;
    if (fromIndex != null && fromIndex !== index) {
      autoAdvancingRef.current = true;
      setIndex(fromIndex);
    }
    onEnterStep?.(target);
    setWalkthroughActive(true);
  };

  const stop = () => {
    genRef.current++;
    void Speech.stop();
    setSpeaking(false);
    setWalkthroughActive(false);
  };

  const toggle = (fromIndex?: number) => {
    if (walkthroughActive) {
      stop();
      return;
    }
    start(fromIndex);
  };

  const speakOnce = () => {
    if (speaking) {
      stop();
      return;
    }
    if (!segments || segments.length === 0) return;
    speakSegments(segments);
  };

  return {speaking, walkthroughActive, start, stop, toggle, speakOnce};
}
