/**
 * 📖 passageReference — PURE helpers for a shared multi-verse passage (Sprint 72).
 *
 * Sharing a RANGE of verses as an image already shipped (the reader collects the
 * selected verse numbers, joins their text, and hands it to `ImageShareModal`).
 * This lifts the range-collapsing reference logic out of the reader screen —
 * where it lived inline and untested — into a pure, unit-tested module, and adds
 * the metadata subtitle that credits the translation + verse count on the shared
 * card (a shared Scripture image should say WHICH version it is).
 *
 * Kept free of React / storage so the run-collapsing edge cases are tested in
 * isolation, mirroring [[noteCard]] / [[comparisonCard]].
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

/**
 * Compact verse list, collapsing consecutive runs into ranges.
 * e.g. [16] → "16", [16,17,18] → "16-18", [1,4,5] → "1,4-5". Unsorted and
 * duplicate inputs are normalized; an empty list yields "".
 */
export function formatVerseList(nums: number[]): string {
  if (nums.length === 0) return '';
  const sorted = [...new Set(nums)].sort((a, b) => a - b);
  const parts: string[] = [];
  let runStart = sorted[0];
  let prev = sorted[0];
  for (let i = 1; i <= sorted.length; i++) {
    const current = sorted[i];
    if (current === prev + 1) {
      prev = current;
      continue;
    }
    parts.push(runStart === prev ? `${runStart}` : `${runStart}-${prev}`);
    runStart = current;
    prev = current;
  }
  return parts.join(',');
}

/**
 * Full passage reference, e.g. "John 3:16-18" — or just "John 3" when no verses
 * are selected. `bookName` is the caller-localized book name.
 */
export function buildPassageReference(
  bookName: string,
  chapter: number,
  verseNums: number[],
): string {
  const list = formatVerseList(verseNums);
  return list ? `${bookName} ${chapter}:${list}` : `${bookName} ${chapter}`;
}

/**
 * Subtitle crediting the translation (+ verse count for a real passage) on a
 * shared image, e.g. "RVR1960 · 3 versículos". The count is omitted for a single
 * verse; `versesWord` is the caller-localized plural noun.
 */
export function passageMetaLine(
  versionAbbr: string,
  verseCount: number,
  versesWord: string,
): string {
  if (verseCount > 1) return `${versionAbbr} · ${verseCount} ${versesWord}`;
  return versionAbbr;
}
