/**
 * KaraokeText (Sprint 76) — word-by-word highlight for the NORMAL reader.
 *
 * The Sprint 75 karaoke lit the word being voiced in the IMMERSIVE reader
 * only; this carries it to the regular chapter screen. Renders a verse's text
 * as three runs (before / spoken word / after), subscribing to the engine's
 * word boundaries ITSELF so per-word events re-render exactly one verse —
 * never the provider, never the whole verses.map (the S75 ref-based fan-out
 * taken one level further).
 *
 * `active` gates the subscription: every verse mounts one of these, but only
 * the voiced verse listens, and the subscription drops the moment the engine
 * moves on. Until a boundary arrives — or on engines that never emit them —
 * it renders `children` (the reader's linkified segments), byte-identical to
 * the non-karaoke verse, so inline reference links stay tappable.
 *
 * Static restyle of one run per word — no motion — so it is reduce-motion
 * safe by construction.
 *
 * Para la gloria de Dios - Eternal Stone Bible App
 */

import React, {useEffect, useMemo, useState} from 'react';
import {Text, type StyleProp, type TextStyle} from 'react-native';
import {useAudioPlayer} from '../context/AudioPlayerContext';
import {tokenizeForKaraoke, activeTokenIndex} from '../lib/karaoke';
import type {SpeechBoundary} from '../types/audio';

interface KaraokeTextProps {
  /** The verse's full text (what the engine's char offsets index into). */
  text: string;
  /** Engine index of THIS verse — boundaries for other verses are ignored. */
  verseIndex: number;
  /** Subscribe + highlight only while the engine voices this very verse. */
  active: boolean;
  /** Style of the word being voiced (layered on the inherited text style). */
  wordStyle: StyleProp<TextStyle>;
  /** Fallback body while no word is lit (the reader's linkified segments). */
  children?: React.ReactNode;
}

export const KaraokeText: React.FC<KaraokeTextProps> = ({
  text,
  verseIndex,
  active,
  wordStyle,
  children,
}) => {
  const {subscribeToBoundary} = useAudioPlayer();
  const [boundary, setBoundary] = useState<SpeechBoundary | null>(null);

  useEffect(() => {
    if (!active) {
      setBoundary(null);
      return;
    }
    return subscribeToBoundary(setBoundary);
  }, [active, subscribeToBoundary]);

  // Drop a stale boundary if the verse under this row changes (chapter swap).
  useEffect(() => {
    setBoundary(null);
  }, [text]);

  const word = useMemo(() => {
    if (!active || !boundary || boundary.verseIndex !== verseIndex) {
      return null;
    }
    const tokens = tokenizeForKaraoke(text);
    const idx = activeTokenIndex(tokens, boundary.charIndex);
    return idx >= 0 ? tokens[idx] : null;
  }, [active, boundary, verseIndex, text]);

  if (!word) return <>{children ?? text}</>;
  return (
    <>
      {text.slice(0, word.start)}
      <Text style={wordStyle}>{text.slice(word.start, word.end)}</Text>
      {text.slice(word.end)}
    </>
  );
};

export default KaraokeText;
