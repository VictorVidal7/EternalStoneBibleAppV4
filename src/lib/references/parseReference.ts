/**
 * Bible reference parser + linkifier.
 *
 * Accepts free-form references the way users type them — "Juan 3:16",
 * "John 3:16", "1 Jn 4", "Gen 1:1-3", "Cantares 2:1", with or without
 * accents/periods — and resolves them against the canonical book table.
 *
 * `parseReference` returns a single ParsedReference for inputs that name
 * exactly one book; `linkifyReferences` scans an arbitrary string and
 * returns segments so verse text containing inline references can render
 * the matches as tappable links.
 */
import {BIBLE_BOOKS} from '@/constants/bible';
import type {BibleBook} from '@/types/bible';

export interface ParsedReference {
  book: BibleBook;
  chapter: number;
  verse?: number;
  verseEnd?: number;
}

export interface LinkifiedSegment {
  text: string;
  ref?: ParsedReference;
}

/**
 * Normalize a string for fuzzy comparison: lowercase, strip diacritics,
 * collapse whitespace, drop punctuation that doesn't change identity.
 */
function normalize(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // strip combining diacritics
    .toLowerCase()
    .replace(/[.·]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Lookup table for fuzzy book matching. Each book registers up to six
 * keys: full Spanish name, full English name, Spanish abbr, English
 * abbr, plus the abbrs with their internal whitespace stripped so
 * "1 Sa", "1Sa" and "1sa" all reach 1 Samuel.
 */
interface BookIndexEntry {
  key: string;
  book: BibleBook;
}

const BOOK_INDEX: BookIndexEntry[] = (() => {
  const out: BookIndexEntry[] = [];
  for (const book of BIBLE_BOOKS) {
    const raw = [book.name, book.nameEn, book.abbr, book.abbrEn];
    for (const k of raw) {
      const n = normalize(k);
      if (n) out.push({key: n, book});
    }
    // Variants with internal whitespace removed ("1 S" → "1s", "1Sa" → "1sa").
    const compact = [
      book.abbr.replace(/\s+/g, ''),
      book.abbrEn.replace(/\s+/g, ''),
    ];
    for (const k of compact) {
      const n = normalize(k);
      if (n) out.push({key: n, book});
    }
  }
  return out;
})();

/**
 * Resolve a query string (free-form book name or abbreviation) to a
 * canonical BibleBook. Returns undefined if no match or if the prefix is
 * ambiguous across multiple books — the caller treats that as "no jump".
 */
export function findBook(query: string): BibleBook | undefined {
  const norm = normalize(query);
  if (!norm) return undefined;

  // 1) Exact normalized match wins immediately.
  const exact = BOOK_INDEX.find(e => e.key === norm);
  if (exact) return exact.book;

  // 2) Prefix match — only collapse to a single book if every prefix hit
  //    points to the same one. "ju" prefix-matches juan/judas/jueces, so
  //    we'd refuse to guess. "jud" is ambiguous between judas and jueces.
  //    "jue" reaches just jueces, so it collapses.
  const prefixHits = BOOK_INDEX.filter(e => e.key.startsWith(norm));
  if (prefixHits.length === 0) return undefined;
  const first = prefixHits[0].book;
  return prefixHits.every(h => h.book === first) ? first : undefined;
}

/**
 * Parse a single, complete reference. The input must shape as
 * `<book> <chapter>[:<verse>[-<verseEnd>]]` after trimming. Chapter and
 * verse must be within the book's actual range — out-of-range refs
 * resolve to null so the UI doesn't offer a broken jump.
 */
const REF_PATTERN = /^(.+?)\s+(\d+)(?::(\d+)(?:-(\d+))?)?$/;

export function parseReference(input: string): ParsedReference | null {
  // Normalize: collapse whitespace and drop whitespace flanking the
  // colon/hyphen so paste-y inputs like "Genesis  1 : 1 - 3" still parse.
  const trimmed = input
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/\s*([:-])\s*/g, '$1');
  if (!trimmed) return null;
  const m = trimmed.match(REF_PATTERN);
  if (!m) return null;
  const [, bookPart, chapterStr, verseStr, verseEndStr] = m;
  const book = findBook(bookPart);
  if (!book) return null;
  const chapter = parseInt(chapterStr, 10);
  if (chapter < 1 || chapter > book.chapters) return null;
  const verse = verseStr ? parseInt(verseStr, 10) : undefined;
  const verseEnd = verseEndStr ? parseInt(verseEndStr, 10) : undefined;
  if (verse !== undefined && verse < 1) return null;
  if (verseEnd !== undefined && verse !== undefined && verseEnd < verse) {
    return null;
  }
  return {book, chapter, verse, verseEnd};
}

/**
 * Vowel equivalence classes so the match regex is accent-insensitive.
 * Canonical abbreviations are a mix of accented ("Gá" for Gálatas) and
 * unaccented ("Ex" for Éxodo) forms, but free-form text in the wild uses
 * whichever spelling feels natural ("Éx 4:1"). Each class lists every
 * accented/unaccented variant of a base vowel; `charClass` below maps any
 * member back to its full class so the built regex accepts all of them
 * regardless of which single form appears in BIBLE_BOOKS.
 */
const VOWEL_CLASSES = ['aá', 'eé', 'ií', 'oó', 'uúü'];
const charClass = new Map<string, string>();
for (const cls of VOWEL_CLASSES) {
  for (const ch of cls) charClass.set(ch, cls);
}
const REGEX_SPECIAL = /[\\^$.*+?()[\]{}|]/;

/**
 * Turn a literal book name/abbreviation into a regex-source fragment that
 * matches any accenting of its vowels (case handled separately by the
 * outer /i flag). Non-vowel characters are escaped as needed and passed
 * through unchanged.
 */
function accentInsensitiveSource(s: string): string {
  let out = '';
  for (const ch of s) {
    const cls = charClass.get(ch.toLowerCase());
    if (cls) {
      out += `[${cls}]`;
    } else if (REGEX_SPECIAL.test(ch)) {
      out += `\\${ch}`;
    } else {
      out += ch;
    }
  }
  return out;
}

/**
 * Regex covering every known book name + abbreviation, longest first so
 * "1 John" wins over "John" inside "1 John 4:18". Built once at module
 * load — there are ~6 keys × 66 books, well within regex alternation
 * limits.
 */
const REF_REGEX = (() => {
  const names = new Set<string>();
  for (const book of BIBLE_BOOKS) {
    names.add(book.name);
    names.add(book.nameEn);
    names.add(book.abbr);
    names.add(book.abbrEn);
  }
  const sorted = [...names].sort((a, b) => b.length - a.length);
  const escaped = sorted.map(accentInsensitiveSource);
  // Allow a trailing dot on abbreviations ("Gen. 1:1"). The body of the
  // reference is `<book> <chapter>[:<verse>[-<verseEnd>]]`.
  return new RegExp(
    `(?<![\\p{L}\\p{N}])(${escaped.join('|')})\\.?\\s+(\\d+)(?::(\\d+)(?:-(\\d+))?)?(?![\\p{L}\\p{N}])`,
    'giu',
  );
})();

/**
 * Scan arbitrary text (a verse, a note, etc.) for embedded Bible
 * references and split it into plain + linked segments. Out-of-range
 * matches collapse back into plain text so we don't link a bogus jump.
 */
export function linkifyReferences(text: string): LinkifiedSegment[] {
  if (!text) return [{text: ''}];
  const segments: LinkifiedSegment[] = [];
  let lastIndex = 0;
  // Reset because the regex is module-scoped.
  REF_REGEX.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = REF_REGEX.exec(text)) !== null) {
    const matchStart = m.index;
    const matchText = m[0];
    const ref = parseReference(matchText.replace(/\.\s+/, ' '));
    if (!ref) continue;
    if (matchStart > lastIndex) {
      segments.push({text: text.slice(lastIndex, matchStart)});
    }
    segments.push({text: matchText, ref});
    lastIndex = matchStart + matchText.length;
  }
  if (lastIndex < text.length) {
    segments.push({text: text.slice(lastIndex)});
  }
  if (segments.length === 0) {
    segments.push({text});
  }
  return segments;
}
