/**
 * Quiz → memorization bridge (T18b).
 *
 * A quiz question ({@link QuizQuestionSpec}) only carries a curated i18n prose
 * plus an English `refKey` ("EnglishBook/Chapter/Verse"); the memorization deck
 * ({@link MemoryDeckContext}'s `addCard`) needs the REAL verse text in the
 * user's current reading version. This module resolves that text from the
 * embedded Bible DB and returns the exact shape `addCard` expects — or `null`
 * (never throws) so the caller can simply hide the "memorize" affordance.
 *
 * Book-name convention — we store the canonical ENGLISH name (`nameEn`), the
 * same identity the favorites add-path uses (see `canonicalBookName`, the
 * Sprint 58 fix). The deck's verseKey (`buildVerseKey(bookName, …)`) doubles as
 * both its AsyncStorage key AND its Firestore doc id in MemoryDeckContext, so a
 * language-independent name keeps the same verse from forking into two separate
 * cards across devices/languages. The UI re-localizes on display
 * (memory/practice.tsx + memory/insights.tsx both re-derive the label via
 * `getBookByName`), so a Spanish reader still SEES "Juan 3:16" even though the
 * stored identity is "John".
 */
import {bibleDB} from '@/lib/database';
import {getBookByName} from '@/constants/bible';
import {parseChristRef} from '@/features/study/christConnections';
import {buildVerseKey} from '@/lib/memory/srs';

/**
 * Structurally compatible with MemoryDeckContext's `AddCardInput` (which is not
 * exported). Kept as its own type so this resolver stays decoupled from the
 * deck context — the caller passes the object straight into `addCard`.
 */
export interface ResolvedQuizVerse {
  bookName: string;
  chapter: number;
  verse: number;
  text: string;
  version: string;
}

interface ResolvedRef {
  bookId: number;
  bookNameEn: string;
  chapter: number;
  verse: number;
}

/**
 * Parses a quiz `refKey` down to the book/chapter/verse identity the
 * memorization deck uses — WITHOUT hitting the DB. Deliberately the ONE place
 * this parsing happens: both the SRS-reschedule path (`hasCard`/`reviewCard`,
 * which needs a verseKey synchronously to decide whether a just-answered verse
 * is already in the deck) and the add-to-deck path below (which additionally
 * fetches real verse text) go through this, so they can never disagree on the
 * book-name form — a divergence here would make `hasCard` silently miss a card
 * that genuinely exists.
 */
function resolveRef(refKey: string): ResolvedRef | null {
  const parsed = parseChristRef(refKey);
  if (!parsed) return null;

  const book = getBookByName(parsed.book);
  if (!book) return null;

  return {
    bookId: book.id,
    // Canonical English identity → language-independent verseKey, matching
    // the favorites add-path; display layers re-localize this (see header).
    bookNameEn: book.nameEn,
    chapter: parsed.chapter,
    verse: parsed.verse,
  };
}

/**
 * A quiz `refKey`'s memorization-deck verse key (`buildVerseKey`'s exact
 * format), or `null` if the refKey doesn't resolve to a known book. Use this —
 * not a hand-rolled string — anywhere you need to check `hasCard()`/call
 * `reviewCard()` for a quiz question's verse.
 */
export function refKeyToVerseKey(refKey: string): string | null {
  const resolved = resolveRef(refKey);
  if (!resolved) return null;
  return buildVerseKey(resolved.bookNameEn, resolved.chapter, resolved.verse);
}

/**
 * Resolve a quiz `refKey` ("EnglishBook/Chapter/Verse") to the real embedded
 * verse text for `version`, shaped for `addCard`. Returns `null` (never throws)
 * when the refKey is unparseable, names an unknown book, or the verse is not in
 * the DB for that version.
 *
 * @param refKey  Canonical English reference, e.g. `"John/3/16"`.
 * @param version Reading version id, e.g. `"RVR1960"` / `"WEB"` (the same value
 *                lectio/favorites pass as `version` — stored verbatim).
 */
export async function resolveVerseForAddCard(
  refKey: string,
  version: string,
): Promise<ResolvedQuizVerse | null> {
  const resolved = resolveRef(refKey);
  if (!resolved) return null;

  try {
    // On-demand entry point (fired when a quiz answer is wrong), so make sure
    // the DB is ready — cheap no-op once initialized. Mirrors favorites'
    // handleListenAll path.
    await bibleDB.initialize();
    const row = await bibleDB.getVerse(
      resolved.bookId,
      resolved.chapter,
      resolved.verse,
      version,
    );
    if (!row || !row.text) return null;

    return {
      bookName: resolved.bookNameEn,
      chapter: resolved.chapter,
      verse: resolved.verse,
      text: row.text,
      version,
    };
  } catch {
    return null;
  }
}
