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
 * Pick an explicit **es-ES (Castilian)** voice id for Spanish narration when
 * the user hasn't chosen a voice (56th-session finding).
 *
 * `Speech.speak({language: 'es-ES'})` with no `voice` lets the OS pick — and
 * on a phone whose system TTS default is a Latin-America voice, that
 * substitute es-us voice **mangles the archaic vosotros enclitic-imperative
 * forms** ("alabadle", "hacedlo", "decidle" … "-Vd" + clitic). A genuine
 * es-ES neural voice pronounces the whole class correctly with no text
 * patching (device-verified), and Victor confirmed a Castilian accent is fine
 * for the Bible narration. So we pin an es-ES voice explicitly rather than
 * trusting the OS default.
 *
 * Only `es-ES` is targeted — it is the one variant verified good. Any other
 * `es-*` is left to the OS (returns `undefined`, today's behaviour) rather
 * than guessing at a near-miss locale.
 *
 * Tie-break, most to least significant: prefer an offline/embedded voice
 * (Google TTS names its network voices "…-network"), then higher reported
 * quality (rarely disambiguates on-device — every voice reports "Enhanced"
 * on the emulator — but harmless), then first for stability.
 */
export function pickDefaultSpanishVoiceId(
  voices: readonly VoiceInfo[] | null | undefined,
): string | undefined {
  if (!voices || voices.length === 0) return undefined;
  const esEs = voices.filter(v => {
    const tag = (v.language || '').toLowerCase().replace(/_/g, '-');
    return tag === 'es-es' || tag.startsWith('es-es-');
  });
  if (esEs.length === 0) return undefined;
  const qualityRank: Record<VoiceInfo['quality'], number> = {
    Premium: 2,
    Enhanced: 1,
    Default: 0,
  };
  const score = (v: VoiceInfo): number =>
    (/network/i.test(v.identifier) ? 0 : 100) + qualityRank[v.quality];
  return [...esEs].sort((a, b) => score(b) - score(a))[0].identifier;
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
 * - When no voice is chosen (or the chosen one is dropped) and the target is
 *   Spanish, an explicit es-ES voice is pinned from `availableVoices` if one
 *   is present — see {@link pickDefaultSpanishVoiceId}. The `language` stays
 *   the bare `es-ES` tag either way (never the picked voice's own raw tag),
 *   so `applySpanishPronunciationFixes`' `startsWith('es')` gate is unaffected.
 */
export function resolveNarration(params: {
  contentLanguage: AudioLanguage | null;
  selectedLanguage: AudioLanguage;
  voice: VoiceInfo | null;
  /**
   * The system's full voice list (`Speech.getAvailableVoicesAsync()`).
   * Optional: omitted / not yet resolved → the auto-pick is skipped and the
   * OS default for `language` is used, exactly as before.
   */
  availableVoices?: readonly VoiceInfo[] | null;
}): NarrationChoice {
  const {contentLanguage, selectedLanguage, voice, availableVoices} = params;
  const targetLang = contentLanguage ?? selectedLanguage;
  const voiceMatches =
    !!voice && voiceLanguageFamily(voice.language) === targetLang;
  if (voiceMatches && voice) {
    return {language: voice.language, voiceId: voice.identifier};
  }
  const language = SUPPORTED_LANGUAGES[targetLang][0];
  const voiceId =
    targetLang === 'es'
      ? pickDefaultSpanishVoiceId(availableVoices)
      : undefined;
  return {language, voiceId};
}

export interface VoiceSelectorLanguage {
  /** The language whose voices the selector should list. */
  language: AudioLanguage;
  /**
   * True when the language is dictated by the loaded content (so the selector
   * hides its language toggle): offering the other language would only let the
   * user pick a voice that {@link resolveNarration} would drop.
   */
  locked: boolean;
}

/**
 * Decide which language's voices the voice selector should show (Sprint 101).
 *
 * Because the spoken language follows the loaded text (see {@link resolveNarration}),
 * a voice from any other language is never used. So when content is loaded the
 * selector LOCKS to that language and hides the es/en toggle; only with nothing
 * loaded (`contentLanguage` null) does it fall back to the manual preference.
 */
export function voiceSelectorLanguage(params: {
  contentLanguage: AudioLanguage | null;
  selectedLanguage: AudioLanguage;
}): VoiceSelectorLanguage {
  if (params.contentLanguage) {
    return {language: params.contentLanguage, locked: true};
  }
  return {language: params.selectedLanguage, locked: false};
}
