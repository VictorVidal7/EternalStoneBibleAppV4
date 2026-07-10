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
  const parsed = parseChristRef(refKey);
  if (!parsed) return null;

  const book = getBookByName(parsed.book);
  if (!book) return null;

  try {
    // On-demand entry point (fired when a quiz answer is wrong), so make sure
    // the DB is ready — cheap no-op once initialized. Mirrors favorites'
    // handleListenAll path.
    await bibleDB.initialize();
    const row = await bibleDB.getVerse(
      book.id,
      parsed.chapter,
      parsed.verse,
      version,
    );
    if (!row || !row.text) return null;

    return {
      // Canonical English identity → language-independent verseKey, matching
      // the favorites add-path; display layers re-localize this.
      bookName: book.nameEn,
      chapter: parsed.chapter,
      verse: parsed.verse,
      text: row.text,
      version,
    };
  } catch {
    return null;
  }
}
