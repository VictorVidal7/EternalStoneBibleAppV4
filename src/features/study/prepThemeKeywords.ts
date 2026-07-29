/**
 * 🔑 prepThemeKeywords — a small, hand-authored keyword index over the
 * EXISTING "Explore by Theme" taxonomy ([[themes]], Sprint 63), built to
 * power two pure, deterministic, offline additions to "Mesa de
 * preparación":
 *
 *   1. [[prepTopicSuggest]] — given a topic a preacher TYPES (e.g. "miedo"),
 *      find which curated theme(s) it speaks to, and surface passages the
 *      app ALREADY associates with that theme (`BIBLE_THEMES.verseRefs`).
 *   2. [[prepRelevance]] — given a passage's own theme ids (already computed
 *      by `buildPrepTable`), re-rank the preacher's OWN saved illustrations
 *      and past preps by how many of those themes' keywords appear in the
 *      preacher's OWN words.
 *
 * NEITHER feature is AI/ML/semantic: this is plain string containment plus a
 * short hand-maintained synonym list — no embeddings, no model, no network
 * call. "Mesa de preparación" stays 100% offline & deterministic exactly as
 * documented in app/features/prep/index.tsx and prepTable.ts (both
 * unchanged by this module).
 *
 * `THEME_KEYWORDS` is NOT new theological content: every word is either the
 * theme's own `id` (English, from themes.ts) or its Spanish `name` (the
 * SAME string already shipped verbatim under `t.themes.list[id].name` in
 * src/i18n/translations.ts), plus a handful of specific, low-collision nouns
 * drawn verbatim from that SAME theme's `description` in translations.ts
 * (hand-copied here, not imported, so this stays a pure module with zero
 * i18n coupling — mirroring prepTable.ts's own "ids only" discipline).
 * Deliberately generic/shared words that would blur two themes together
 * (e.g. "Dios", "camino", "corazón") are left OUT even where they appear in
 * a description, to keep matches specific — see the per-theme comments
 * below for exactly which description words were kept and why.
 *
 * `TOPIC_SYNONYM_EXPANSION` is the ONLY place this file adds a word the
 * taxonomy doesn't already ship verbatim — a short list of everyday Spanish
 * synonyms for those SAME existing labels (e.g. "miedo" as a synonym of
 * "temor", already in the courage theme's own curated description). This
 * never creates a new theme, a new theological judgment, or a new verse
 * association — it only widens which typed words can find the SAME
 * already-curated passages. Every ref either feature can ever point to
 * already lives in `BIBLE_THEMES.verseRefs` ([[themes]]).
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

/** Strip accents/diacritics and lowercase, so "Perdón" and "perdon" match. */
export function normalizeThemeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim();
}

/**
 * Core keywords per theme id. Every key MUST be a real `BIBLE_THEMES` id
 * (validated by prepThemeKeywords.test.ts, same discipline as themes.test.ts
 * validating `BIBLE_THEMES` itself). Sourced per theme as:
 *   - the theme's own `id` (English single word already in themes.ts);
 *   - its Spanish `name` from `t.themes.list[id].name`;
 *   - 0-2 specific nouns from that theme's own `description`, picked ONLY
 *     when they are not shared with another theme's description (e.g.
 *     "temor" for courage's "Valor frente al temor"; "camino" was left off
 *     BOTH salvation and guidance because both descriptions use it).
 */
export const THEME_KEYWORDS: Readonly<Record<string, readonly string[]>> = {
  faith: ['faith', 'fe'],
  love: ['love', 'amor'],
  hope: ['hope', 'esperanza'],
  // "calma"/"ansioso" — from "Calma para el corazón ansioso".
  peace: ['peace', 'paz', 'calma', 'ansioso'],
  // "fuerzas"/"debilidad" — from "Fuerzas renovadas en la debilidad".
  strength: ['strength', 'fortaleza', 'fuerzas', 'debilidad'],
  forgiveness: ['forgiveness', 'perdon'],
  // "decidir" — from "Sabiduría para decidir bien".
  wisdom: ['wisdom', 'sabiduria', 'decidir'],
  prayer: ['prayer', 'oracion'],
  // "temor" — from "Valor frente al temor".
  courage: ['courage', 'valor', 'temor'],
  // "dolor"/"perdida" — from "Consuelo en el dolor y la pérdida".
  comfort: ['comfort', 'consuelo', 'dolor', 'perdida'],
  // "gratitud" — from "Gozo y gratitud en el Señor".
  joy: ['joy', 'gozo', 'gratitud'],
  // "inmerecida" — from "La gracia inmerecida de Dios".
  grace: ['grace', 'gracia', 'inmerecida'],
  salvation: ['salvation', 'salvacion'],
  // "direccion" — from "Dirección para tu camino" ("camino" itself omitted,
  // shared with salvation's "El camino de la salvación").
  guidance: ['guidance', 'guia', 'direccion'],
};

/**
 * A SMALL, explicitly-labeled synonym-expansion table. Keys are everyday
 * Spanish words a preacher is likely to type; values are the EXISTING theme
 * id(s) that word is a plain synonym for. Kept intentionally short — this is
 * a coverage patch for common gaps, not an attempt at exhaustive recall.
 */
export const TOPIC_SYNONYM_EXPANSION: Readonly<
  Record<string, readonly string[]>
> = {
  miedo: ['courage'], // synonym of "temor" (courage's own description)
  ansiedad: ['peace'], // synonym of "ansioso" (peace's own description)
  angustia: ['peace', 'comfort'],
  tristeza: ['comfort'],
  duda: ['faith'],
  culpa: ['forgiveness'],
  soledad: ['comfort'],
  decision: ['wisdom'],
  proposito: ['guidance'],
  cansancio: ['strength'],
  desanimo: ['strength', 'comfort'],
  enojo: ['peace'],
  ira: ['peace'],
};

/**
 * All keywords for one theme id — its core keywords plus any synonym-table
 * word whose mapping includes this theme (reverse lookup), normalized and
 * deduplicated. Unknown ids return an empty list rather than throwing.
 */
export function getThemeKeywords(themeId: string): string[] {
  const core = THEME_KEYWORDS[themeId] ?? [];
  const synonyms = Object.entries(TOPIC_SYNONYM_EXPANSION)
    .filter(([, themeIds]) => themeIds.includes(themeId))
    .map(([word]) => word);
  return Array.from(new Set([...core, ...synonyms].map(normalizeThemeText)));
}

/** Union of keywords across several theme ids, normalized and deduplicated. */
export function getKeywordsForThemes(themeIds: readonly string[]): string[] {
  const all = new Set<string>();
  for (const id of themeIds) {
    for (const keyword of getThemeKeywords(id)) all.add(keyword);
  }
  return Array.from(all);
}

/**
 * Score a single typed token against a single keyword: exact match scores
 * highest, a whole-word containment match (either direction, e.g. "miedos"
 * containing the synonym "miedo") scores lower, anything else scores 0.
 * Both sides must be at least 3 characters for the containment check, so a
 * short keyword like "fe" only ever matches by exact equality — never as a
 * false-positive substring of an unrelated word (e.g. "feliz").
 */
export function keywordTokenScore(token: string, keyword: string): number {
  if (!token || !keyword) return 0;
  if (token === keyword) return 3;
  if (
    token.length >= 3 &&
    keyword.length >= 3 &&
    (token.includes(keyword) || keyword.includes(token))
  ) {
    return 2;
  }
  return 0;
}

const TOPIC_STOPWORDS: ReadonlySet<string> = new Set([
  'de',
  'del',
  'al',
  'el',
  'la',
  'los',
  'las',
  'un',
  'una',
  'unos',
  'unas',
  'en',
  'a',
  'y',
  'o',
  'que',
  'con',
  'por',
  'para',
  'es',
  'soy',
  'estoy',
  'siento',
  'mi',
  'tu',
  'su',
  'me',
  'se',
  'sobre',
  'como',
]);

/**
 * Normalize + split a preacher-typed topic into meaningful tokens (accents
 * stripped, common short Spanish function words dropped). Returns an empty
 * array for blank/whitespace-only/stopword-only input.
 */
export function tokenizeTopic(topic: string): string[] {
  if (typeof topic !== 'string') return [];
  return normalizeThemeText(topic)
    .split(/[^a-z0-9]+/)
    .filter(token => token.length > 0 && !TOPIC_STOPWORDS.has(token));
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Count whole-word occurrences of any of `keywords` inside `normalizedText`
 * (already lowercased/accent-stripped by the caller — see
 * [[normalizeThemeText]]). Word-boundary matching (`\b`) so a short keyword
 * like "paz" never matches inside an unrelated word like "capaz".
 */
export function countKeywordOccurrences(
  normalizedText: string,
  keywords: readonly string[],
): number {
  let total = 0;
  for (const keyword of keywords) {
    if (!keyword) continue;
    const pattern = new RegExp(`\\b${escapeRegExp(keyword)}\\b`, 'g');
    const matches = normalizedText.match(pattern);
    if (matches) total += matches.length;
  }
  return total;
}
