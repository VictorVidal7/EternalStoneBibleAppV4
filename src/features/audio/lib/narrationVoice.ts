/**
 * Narration voice/language resolution (Sprint 100).
 *
 * The TTS narration must speak in the language of the TEXT it is reading. The
 * audio engine's text is a Bible chapter/playlist loaded from a specific Bible
 * version (RVR1960 → Spanish, KJV/WEB → English), so the spoken language has to
 * follow that version — NOT a manual, decoupled audio-language preference.
 *
 * Before this, the engine narrated with whatever voice/language the user had
 * picked in the voice selector. Switching the Bible version mid-listen (e.g.
 * English WEB → Spanish RVR1960) then left an English voice reading Spanish
 * text — the "se hace bolas la voz" garble the user reported: an English engine
 * trying to pronounce Spanish words (and the reverse).
 *
 * These helpers are React-/RN-free so they unit-test without rendering (mirror
 * of scrubMath.ts / immersiveAudio.ts).
 *
 * Para la gloria de Dios - Eternal Stone Bible App
 */

import type {AudioLanguage, VoiceInfo} from '../types/audio';
import {SUPPORTED_LANGUAGES} from '../constants/audioConstants';

/**
 * Coerce a Bible version's language tag ('es' / 'en') to an {@link AudioLanguage}.
 * Only Spanish and English versions exist, so anything that isn't explicitly
 * Spanish is treated as English.
 */
export function toAudioLanguage(
  lang: string | null | undefined,
): AudioLanguage {
  return lang === 'es' ? 'es' : 'en';
}

/**
 * The 'es' | 'en' family of a BCP-47-ish voice language tag ('es-MX' → 'es',
 * 'en-GB' → 'en'), or null when it is neither supported language.
 */
export function voiceLanguageFamily(
  lang: string | null | undefined,
): AudioLanguage | null {
  if (!lang) return null;
  const base = lang.toLowerCase().split('-')[0];
  if (base === 'es') return 'es';
  if (base === 'en') return 'en';
  return null;
}

export interface NarrationChoice {
  /** BCP-47 language code passed to `Speech.speak`. */
  language: string;
  /** Voice identifier, or undefined to let the OS pick a default for `language`. */
  voiceId: string | undefined;
}

/**
 * Resolve the TTS language + voice to narrate with, so the VOICE always matches
 * the LANGUAGE OF THE TEXT being read.
 *
 * - `contentLanguage` (the loaded content's Bible-version language) WINS for the
 *   spoken language when known — a Spanish RVR1960 chapter is never read by an
 *   English voice (Sprint 100). When it is null (a legacy load with no version
 *   info), the manual `selectedLanguage` is used, preserving the old behaviour.
 * - The user's chosen `voice` is honoured only when its language family matches
 *   the target language; otherwise it is dropped and the OS default voice for
 *   the target language is used (a mismatched explicit voice is exactly what
 *   produced the garble).
 */
export function resolveNarration(params: {
  contentLanguage: AudioLanguage | null;
  selectedLanguage: AudioLanguage;
  voice: VoiceInfo | null;
}): NarrationChoice {
  const {contentLanguage, selectedLanguage, voice} = params;
  const targetLang = contentLanguage ?? selectedLanguage;
  const voiceMatches =
    !!voice && voiceLanguageFamily(voice.language) === targetLang;
  if (voiceMatches && voice) {
    return {language: voice.language, voiceId: voice.identifier};
  }
  return {language: SUPPORTED_LANGUAGES[targetLang][0], voiceId: undefined};
}
