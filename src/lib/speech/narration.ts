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
