/**
 * 🌐 alsoInVersions — PURE policy for the daily verse's "see it in …" chips
 * (Sprint 77).
 *
 * The Home VerseOfDayCard always quotes the user's SELECTED version (post-S75
 * hotfix). These helpers pick which OTHER translations to offer as a quick
 * inline peek and how to caption them. Cross-LANGUAGE versions lead the row —
 * the headline use case is "ver también en español/inglés" — and same-language
 * alternatives follow, preserving catalog order within each group.
 *
 * Composes with [[secondaryVersion]]'s choice filter; kept generic over
 * version-shaped objects so it stays unit-testable with no React/SQLite.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import {secondaryVersionChoices} from '../reading/secondaryVersion';

export interface AlsoVersionLike {
  id: string;
  language: string;
}

/**
 * The versions to offer as "see it in …" chips for `selected`: every other
 * catalog version, cross-language ones first (stable within each group).
 * Empty when the catalog has a single version.
 */
export function orderAlsoVersions<T extends AlsoVersionLike>(
  selected: AlsoVersionLike,
  versions: T[],
): T[] {
  const choices = secondaryVersionChoices(selected.id, versions);
  const crossLanguage = choices.filter(v => v.language !== selected.language);
  const sameLanguage = choices.filter(v => v.language === selected.language);
  return [...crossLanguage, ...sameLanguage];
}

/**
 * Compact visible caption for a chip: "EN · KJV". The language prefix is the
 * actual headline (the verse in the OTHER tongue); the abbreviation
 * disambiguates between same-language siblings (KJV vs WEB).
 */
export function alsoChipLabel(version: {
  abbreviation: string;
  language: string;
}): string {
  return `${version.language.toUpperCase()} · ${version.abbreviation}`;
}
