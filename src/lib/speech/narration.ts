/**
 * narration — pure helpers behind [[useNarratedWalkthrough]], the shared
 * auto-advancing TTS engine now powering Rutas bíblicas, Hilo profético and
 * Biblia para niños' "Leer juntos" (Item 4, Tanda 3). No React, no
 * `expo-speech` — mirrors [[planPace]]'s split of pure logic from side
 * effects, so the tricky bits (language mapping, advance/stop decisions) are
 * unit-testable without mocking the speech API.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

export type SpeechLang = 'es-ES' | 'en-US';

/**
 * Maps the app's UI/version language code to an `expo-speech` locale.
 * Accepts a plain `string` (not a narrowed `'es'|'en'` union) because the
 * Bible-version language field ([[BibleVersion.language]]) is typed as
 * `string`, not the UI-language union — any non-'es' value falls back to
 * English, mirroring the ternary this helper replaces at every call site.
 */
export function resolveSpeechLanguage(lang: string): SpeechLang {
  return lang === 'es' ? 'es-ES' : 'en-US';
}

/**
 * Spanish-voice pronunciation fixes for specific words a Spanish `expo-speech`
 * engine mispronounces even with the correct `es-*` locale genuinely requested
 * (confirmed via [[resolveNarration]]/Sprint 100) AND with an es-ES voice
 * pinned ([[narrationVoice]].pickDefaultSpanishVoiceId, 56th session) — i.e.
 * the residue that is neither a locale bug nor a voice-substitution bug, but a
 * true per-token engine quirk. `expo-speech` doesn't reliably support SSML
 * phoneme tags on Android, so every entry below is a plain-text substitution
 * applied to the UTTERANCE ONLY, right before `Speech.speak` — never to the
 * text actually rendered on screen.
 *
 * Root causes observed on real-device RVR1960 narration, confidence noted
 * per entry:
 *  - "JAH" (HIGH confidence in the mechanism) — a short ALL-CAPS token with
 *    no Spanish-lexicon entry trips the engine's "unknown acronym, spell it
 *    out" heuristic ("J-A-H"). Respelling in mixed case sidesteps that
 *    heuristic outright. The target sound — Hebrew יָהּ, the short form of
 *    the divine name behind the "-luyah" in "Aleluya", distinct from
 *    "Jehová" — is conventionally "Yah" (rhymes with "spa"). Spanish "h" is
 *    silent, so "Yah" is spoken "Ya". This NAMES GOD — flag any mismatch on
 *    a live listen before treating the exact respelling as final. If "Yah"
 *    comes out with an English "yeah" sound or an audible aspirated h,
 *    "Yáh" is the same-length (3-char) fallback to try next — swap just the
 *    replacement string below, the invariant stays intact.
 *  - "Jacob" — a `Jacob`→`Jacób` entry lived here (MEDIUM confidence:
 *    homograph with English "Jacob", plausibly read with English phonetics).
 *    REMOVED in the es-ES voice-selection change (56th session): once
 *    narration pins an explicit es-ES voice for Spanish
 *    ([[narrationVoice]].pickDefaultSpanishVoiceId), the accented respelling
 *    BACKFIRES — the es-ES voice forces letter-to-sound and reads "Jacób" as
 *    "Yacob" (initial /ʝ/). The plain, unaccented "Jacob" is already read
 *    correctly ("ha-COB") by that voice's default Spanish letter-to-sound.
 *  - "estatutos" (LOW confidence / inferred, not a homograph or an acronym)
 *    — Salmos 89:31 etc. drop a syllable ("estatuos"), plausibly the engine
 *    confusing this rarer word for the much more common "estatuas"
 *    (statues). The accent lands on the syllable Spanish already stresses
 *    by default, so it's harmless either way; it's included only because
 *    it's the literal word Victor reported broken. Deliberately NOT
 *    extended to the singular "estatuto" (same guess, never reported).
 *
 * INVARIANT: every replacement is the SAME CHARACTER LENGTH as the word it
 * replaces (see the length-preserving test in narration.test.ts) — the audio
 * player's karaoke word-highlight ([[karaoke]]/`KaraokeText`) indexes the
 * TTS engine's `onBoundary.charIndex` (which counts into whatever text was
 * actually SPOKEN) straight against the ORIGINAL displayed text, so a
 * length-changing substitution here would silently desync the highlight
 * from that word onward. If a future fix genuinely can't be done at equal
 * length, that desync has to be solved first (an index-mapping layer
 * between the spoken and displayed text) — don't add an unequal-length
 * entry without it.
 */
const SPANISH_PRONUNCIATION_FIXES: ReadonlyArray<{
  pattern: RegExp;
  replacement: string;
}> = [
  {pattern: /\bJAH\b/g, replacement: 'Yah'},
  // Two explicit-case entries rather than a case-insensitive match with a
  // fixed-case replacement — a generic "preserve the match's case" helper
  // would also re-uppercase "JAH" (undoing the point of that fix above), so
  // each entry states the exact casing it produces instead. Only the
  // lowercase form is actually attested in the RVR1960 corpus (122x); the
  // capitalized-plural entry has zero occurrences today and exists only so
  // a future sentence-initial "Estatutos" doesn't silently miss the fix.
  {pattern: /\bestatutos\b/g, replacement: 'estatútos'},
  {pattern: /\bEstatutos\b/g, replacement: 'Estatútos'},
];

/**
 * Apply the Spanish-voice pronunciation fixes above to `text`, but ONLY when
 * `language` is a Spanish locale (`es`, `es-ES`, `es-MX`, `es-419`, ...) —
 * English narration must pass through byte-identical. Callers should call
 * this unconditionally right before `Speech.speak` with whatever language
 * they resolved (matches [[resolveNarration]]'s `NarrationChoice.language`,
 * which can be a specific voice's own tag like `es-MX`, not just `es-ES`).
 */
export function applySpanishPronunciationFixes(
  text: string,
  language: string,
): string {
  if (!language.toLowerCase().startsWith('es')) return text;
  return SPANISH_PRONUNCIATION_FIXES.reduce(
    (acc, {pattern, replacement}) => acc.replace(pattern, replacement),
    text,
  );
}

/** "label. note" — joins only the parts that are present (Rutas bíblicas). */
export function buildStopNarration(label?: string, note?: string): string {
  return [label, note].filter((s): s is string => Boolean(s)).join('. ');
}

export interface NarrationAdvance {
  /** True when `index` was already the last step — the walkthrough should stop. */
  done: boolean;
  /** The step to move to next; equals `index` when `done`. */
  nextIndex: number;
}

/** Whether a finished step should advance the walkthrough or end it. */
export function planNarrationAdvance(
  index: number,
  total: number,
): NarrationAdvance {
  const isLast = total <= 0 || index >= total - 1;
  return isLast
    ? {done: true, nextIndex: index}
    : {done: false, nextIndex: index + 1};
}
