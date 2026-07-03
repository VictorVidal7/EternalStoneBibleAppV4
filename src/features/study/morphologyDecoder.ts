/**
 * 📜 morphologyDecoder — decodes the raw Robinson/STEPBible grammar code
 * bundled per word in the originals pack (`OriginalWord.grammar`, e.g.
 * "V-AAI-3S" or "HC/Ncmsc/Sp3ms") into human-readable Greek/Hebrew/Aramaic
 * parsing. Part of "Originales+" (T6.4 — offering-unlocked).
 *
 * The codes and their meanings come from STEPBible.org's published TEGMC/
 * TEHMC documentation (CC BY 4.0, based on work at Tyndale House Cambridge —
 * https://github.com/STEPBible/STEPBible-Data/tree/master/Morphology%20codes),
 * the SAME project that produced the bundled originals pack itself
 * (STEPBible TAGNT/TAHOT). Nothing here is invented: `greekMorphologyCodes.json`
 * / `hebrewMorphologyCodes.json` are that documentation's own code→attribute
 * table, filtered to the codes that actually occur in the bundled data and
 * verified (during development) to cover 100% of them.
 *
 * Splitting rules, confirmed against STEPBible's own documentation and every
 * code actually present in the originals pack:
 *  - Greek: a merged/contracted word is written "CODE + G1234" (a Strong's
 *    number for the merged component, not another grammar code) — only the
 *    first part is decoded as grammar.
 *  - Hebrew/Aramaic: a single word can carry several morphemes (e.g. a
 *    prefixed conjunction, the word itself, a pronominal suffix), written
 *    "SEG1/SEG2/SEG3…". Two independent words glued into one lexical unit
 *    use "//" between them. TEGMC/TEHMC's own note: "the 1st character
 *    indicates Hebrew or Aramaic. When codes are strung together, this
 *    character becomes '/'" — so only the very first segment of the whole
 *    code carries the full H/A-prefixed code; every other segment (in every
 *    word, even after a "//") needs that same leading letter re-applied
 *    before it resolves in the table.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import greekCodesRaw from './data/greekMorphologyCodes.json';
import hebrewCodesRaw from './data/hebrewMorphologyCodes.json';
import {morphLabel, type MorphAttributeKey} from './morphologyLabels';

export interface MorphAttributes {
  function?: string;
  tense?: string;
  voice?: string;
  mood?: string;
  person?: string;
  case?: string;
  number?: string;
  gender?: string;
  extra?: string;
  nameType?: string;
  originalLanguage?: string;
  adjNumber?: string;
  nameInOriginalLanguage?: string;
  form?: string;
  state?: string;
  stem?: string;
}

export interface MorphSegment {
  /** The raw sub-code this segment came from, e.g. "HC", "Ncmsc", "Sp3ms". */
  code: string;
  attrs: MorphAttributes;
}

export interface DecodedMorphology {
  segments: MorphSegment[];
  /** A merged/contracted Greek word's embedded Strong's number, if any — see the Greek splitting rule above. Not itself decoded as grammar. */
  mergedStrongs?: string;
}

const GREEK_CODES = greekCodesRaw as Record<string, MorphAttributes>;
const HEBREW_CODES = hebrewCodesRaw as Record<string, MorphAttributes>;

const STRONGS_SUFFIX_RE = /^[GH]\d+$/;

/**
 * Decode a raw `grammar` code into its morphological segments. Returns
 * `null` when the code is empty or the language isn't recognized. A segment
 * that fails to resolve (should not happen for real bundled data — see the
 * module doc) is simply omitted rather than thrown, so a single bad/foreign
 * code degrades to "no morphology available" instead of crashing the sheet.
 */
export function decodeMorphologyCode(
  grammar: string | null | undefined,
  lang: string | null | undefined,
): DecodedMorphology | null {
  const code = grammar?.trim();
  if (!code) return null;

  if (lang === 'G') {
    const [main, merged] = code.split(' + ').map(s => s.trim());
    const attrs = GREEK_CODES[main];
    if (!attrs) return null;
    return {
      segments: [{code: main, attrs}],
      mergedStrongs:
        merged && STRONGS_SUFFIX_RE.test(merged) ? merged : undefined,
    };
  }

  if (lang === 'H') {
    const wordGroups = code.split('//').map(g => g.trim());
    const firstSeg = wordGroups[0]?.split('/')[0]?.trim();
    const langLetter = firstSeg?.[0];
    if (!langLetter) return null;

    const segments: MorphSegment[] = [];
    for (const group of wordGroups) {
      for (const seg of group.split('/').map(s => s.trim())) {
        const attrs = HEBREW_CODES[seg] ?? HEBREW_CODES[langLetter + seg];
        if (attrs) segments.push({code: seg, attrs});
      }
    }
    return segments.length > 0 ? {segments} : null;
  }

  return null;
}

/** Display order for attributes within one segment's description. */
const ATTRIBUTE_ORDER: MorphAttributeKey[] = [
  'function',
  'stem',
  'tense',
  'voice',
  'mood',
  'form',
  'state',
  'case',
  'person',
  'number',
  'gender',
  'nameType',
  'extra',
  'originalLanguage',
  'adjNumber',
  'nameInOriginalLanguage',
];

/** Human phrase for one segment, e.g. "Verbo, aoristo, activo, indicativo, 3ª persona, singular". */
function describeSegment(
  attrs: MorphAttributes,
  language: 'es' | 'en',
): string {
  const parts: string[] = [];
  for (const key of ATTRIBUTE_ORDER) {
    const value = attrs[key];
    if (!value) continue;
    parts.push(morphLabel(key, value, language));
  }
  return parts.join(', ');
}

/**
 * The full human-readable parsing for a decoded word, e.g. for the Hebrew
 * compound "HC/Ncmsc/Sp3ms": "Conjunción + Sustantivo, común, masculino,
 * singular, constructo + Sufijo, 3ª persona, masculino, singular".
 */
export function describeMorphology(
  decoded: DecodedMorphology,
  language: 'es' | 'en',
): string {
  return decoded.segments
    .map(seg => describeSegment(seg.attrs, language))
    .filter(Boolean)
    .join(' + ');
}
