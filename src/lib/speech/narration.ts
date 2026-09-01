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
 * engine mispronounces even though the correct `es-*` locale IS genuinely
 * being requested (confirmed via [[resolveNarration]]/Sprint 100 — this is
 * NOT a voice/locale bug, so it is fixed here with plain-text respelling
 * rather than by touching language/voice selection). `expo-speech` doesn't
 * reliably support SSML phoneme tags on Android, so every entry below is a
 * plain-text substitution applied to the UTTERANCE ONLY, right before
 * `Speech.speak` — never to the text actually rendered on screen.
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
 *  - "Jacob" (MEDIUM confidence) — spelled IDENTICALLY in English and
 *    Spanish RVR1960 text, so the engine's proper-noun lexicon plausibly
 *    reads it with English phonetics. Changing the token (adding an accent)
 *    forces a fallback to default Spanish letter-to-sound rules, which
 *    independently already stress the final syllable for a word ending in a
 *    consonant other than n/s — matching the natural spoken "ha-COB".
 *  - "estatutos" (LOW confidence / inferred, not a homograph or an acronym)
 *    — Salmos 89:31 etc. drop a syllable ("estatuos"), plausibly the engine
 *    confusing this rarer word for the much more common "estatuas"
 *    (statues). The accent lands on the syllable Spanish already stresses
 *    by default, so it's harmless either way; it's included only because
 *    it's the literal word Victor reported broken. Deliberately NOT
 *    extended to the singular "estatuto" (same guess, never reported).
 *  - ALL-CAPS divine-name / title tokens: "JEHOVÁ", "DIOS", "JESÚS",
 *    "CRISTO", "SANTIDAD" → title case (MEDIUM confidence — INFERRED from
 *    the "JAH" mechanism; acoustic detail pending a live listen). RVR1960
 *    renders a handful of inscriptions in full caps: "SANTIDAD A JEHOVÁ"
 *    (the priestly plate — Éx 28:36 / 39:30, Zac 14:20), "ESTE ES JESÚS,
 *    EL REY DE LOS JUDÍOS" + "llamarás su nombre JESÚS" (Mt 1:21), "AL DIOS
 *    NO CONOCIDO" (Hch 17:23), "CRISTO el Señor" (Lc 2:11). A short ALL-CAPS
 *    token trips the same "unknown acronym, spell it out" heuristic as
 *    "JAH". This is not a phonetic guess — it normalizes 2–6 outlier tokens
 *    to the exact title-case form already narrated acceptably thousands of
 *    times elsewhere ("Jehová" 5811x, "Dios" 3569x, …), so the downside is
 *    bounded at "no-op". Case-sensitive so the already-correct forms pass
 *    through untouched. NAMES GOD / Christ — flag any mismatch on a live
 *    listen before treating these as final. "JEHOVÁ" ends in the non-ASCII
 *    "Á", after which JS `\b` can never match, so that one entry uses a
 *    negative lookahead for its trailing edge. All five are equal length.
 *  - Hyphenated tokens (MEDIUM confidence, pending a live listen): every
 *    letter-`-`-letter token in RVR1960 is a transliterated compound proper
 *    noun (204 distinct forms / 627 occurrences — Bet-el 69x, Ben-adad 27x,
 *    Abed-nego 15x, Maher-salal-hasbaz …). The engine may read the "-" aloud
 *    as "guión" or mis-join the halves. "-" → " " is exactly 1:1 in length
 *    AND karaoke-safe: a boundary landing anywhere inside the displayed
 *    token's span still resolves back to that single token. Applied as one
 *    generic rule, not 204 entries. (The two seed-data artifacts noted in
 *    DOCS/TTS_PRONUNCIATION_SWEEP.md — "mujer)--Jehová" in Nm 5:21,
 *    "Jehová- nisi" in Éx 17:15 — are not letter-`-`-letter, so this rule
 *    leaves them alone.)
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
 *
 * NOTE (56th session): the archaic vosotros enclitic-imperative class
 * ("alabadle", "hacedlo", "decidle" … "-Vd" + clitic, 167 forms) was
 * investigated and is NOT fixed here. A device A/B proved it is
 * VOICE-DEPENDENT: an `es-ES` (Castilian) neural voice (`es-es-x-*-local`) pronounces the
 * whole class correctly with no substitution, while an `es-us` (Latin
 * America) voice mangles it. The app requests `language:'es-ES'` but the OS
 * can substitute an es-us voice; the real fix is voice selection (make
 * [[resolveNarration]] pick an explicit es-ES voice id for Spanish content —
 * see [[narrationVoice]].pickDefaultSpanishVoiceId), not text. That same
 * change also removes the "Jacob"→"Jacób" entry, which backfires on the
 * es-ES voice. See DOCS/TTS_PRONUNCIATION_SWEEP.md (its "build a mapping
 * layer" recommendation is superseded).
 */
const SPANISH_PRONUNCIATION_FIXES: ReadonlyArray<{
  pattern: RegExp;
  replacement: string;
}> = [
  {pattern: /\bJAH\b/g, replacement: 'Yah'},
  {pattern: /\bJacob\b/g, replacement: 'Jacób'},
  // Two explicit-case entries rather than a case-insensitive match with a
  // fixed-case replacement — a generic "preserve the match's case" helper
  // would also re-uppercase "JAH" (undoing the point of that fix above), so
  // each entry states the exact casing it produces instead. Only the
  // lowercase form is actually attested in the RVR1960 corpus (122x); the
  // capitalized-plural entry has zero occurrences today and exists only so
  // a future sentence-initial "Estatutos" doesn't silently miss the fix.
  {pattern: /\bestatutos\b/g, replacement: 'estatútos'},
  {pattern: /\bEstatutos\b/g, replacement: 'Estatútos'},

  // ALL-CAPS divine-name / title tokens → title case (see the JSDoc bullet).
  // Equal length: 6→6, 4→4, 5→5, 6→6, 8→8.
  {pattern: /\bJEHOVÁ(?![A-Za-zÑñÁÉÍÓÚÜáéíóúü])/g, replacement: 'Jehová'},
  {pattern: /\bDIOS\b/g, replacement: 'Dios'},
  {pattern: /\bJESÚS\b/g, replacement: 'Jesús'},
  {pattern: /\bCRISTO\b/g, replacement: 'Cristo'},
  {pattern: /\bSANTIDAD\b/g, replacement: 'Santidad'},

  // Hyphenated transliterated proper nouns → space (see the JSDoc bullet).
  // One generic rule; "-" → " " is 1:1 in length. Overlapping matches in a
  // 3-part token (Maher-salal-hasbaz) are both handled in a single .replace()
  // pass because the global regex resumes scanning after each match.
  {pattern: /(\p{L})-(\p{L})/gu, replacement: '$1 $2'},
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
