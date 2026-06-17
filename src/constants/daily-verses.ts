/**
 * Curated daily verses.
 *
 * A hand-picked set of well-known, encouraging passages. The verse for a
 * given calendar day is chosen deterministically from the day of the year,
 * so every user sees the same verse on the same day and it never changes
 * mid-day (unlike a random pick).
 *
 * Only references are stored here — the verse text is resolved from the
 * database via `bibleDB.getVerse(book, chapter, verse, version)`, so the
 * daily verse always matches the Bible version the user has selected
 * (RVR1960 / KJV). `book` is the standard book id (1-66).
 *
 * Each verse also carries a `theme` (one of the 14 ids in [[themes]]) so the
 * Daily Light devotional can show reflection/application questions that match
 * what the verse is actually about — the verse, its "Christ in this passage"
 * note and its application questions all speak to the same thing (Sprint 98;
 * before this the theme rotated on an independent salt, so a love verse could
 * land beside wisdom questions). `dailyVerses.test` asserts every entry's
 * theme is a real theme id.
 */

/** The 14 theme ids from the topical index ([[themes]] / `BIBLE_THEMES`). */
export type DailyVerseTheme =
  | 'faith'
  | 'love'
  | 'hope'
  | 'peace'
  | 'strength'
  | 'forgiveness'
  | 'wisdom'
  | 'prayer'
  | 'courage'
  | 'comfort'
  | 'joy'
  | 'grace'
  | 'salvation'
  | 'guidance';

export interface DailyVerseRef {
  book: number;
  chapter: number;
  verse: number;
  /** Topical theme this verse speaks to — drives Daily Light's questions. */
  theme: DailyVerseTheme;
}

export const DAILY_VERSE_REFS: DailyVerseRef[] = [
  {book: 1, chapter: 1, verse: 1, theme: 'faith'}, // Genesis 1:1
  {book: 2, chapter: 14, verse: 14, theme: 'strength'}, // Exodus 14:14
  {book: 2, chapter: 15, verse: 2, theme: 'strength'}, // Exodus 15:2
  {book: 4, chapter: 6, verse: 24, theme: 'grace'}, // Numbers 6:24
  {book: 5, chapter: 31, verse: 6, theme: 'courage'}, // Deuteronomy 31:6
  {book: 5, chapter: 31, verse: 8, theme: 'courage'}, // Deuteronomy 31:8
  {book: 6, chapter: 1, verse: 9, theme: 'courage'}, // Joshua 1:9
  {book: 6, chapter: 24, verse: 15, theme: 'faith'}, // Joshua 24:15
  {book: 9, chapter: 16, verse: 7, theme: 'wisdom'}, // 1 Samuel 16:7
  {book: 13, chapter: 16, verse: 11, theme: 'strength'}, // 1 Chronicles 16:11
  {book: 14, chapter: 7, verse: 14, theme: 'prayer'}, // 2 Chronicles 7:14
  {book: 16, chapter: 8, verse: 10, theme: 'joy'}, // Nehemiah 8:10
  {book: 18, chapter: 19, verse: 25, theme: 'hope'}, // Job 19:25
  {book: 19, chapter: 1, verse: 1, theme: 'wisdom'}, // Psalm 1:1
  {book: 19, chapter: 16, verse: 11, theme: 'joy'}, // Psalm 16:11
  {book: 19, chapter: 18, verse: 2, theme: 'strength'}, // Psalm 18:2
  {book: 19, chapter: 19, verse: 1, theme: 'faith'}, // Psalm 19:1
  {book: 19, chapter: 23, verse: 1, theme: 'comfort'}, // Psalm 23:1
  {book: 19, chapter: 27, verse: 1, theme: 'courage'}, // Psalm 27:1
  {book: 19, chapter: 28, verse: 7, theme: 'strength'}, // Psalm 28:7
  {book: 19, chapter: 30, verse: 5, theme: 'hope'}, // Psalm 30:5
  {book: 19, chapter: 32, verse: 8, theme: 'guidance'}, // Psalm 32:8
  {book: 19, chapter: 34, verse: 8, theme: 'faith'}, // Psalm 34:8
  {book: 19, chapter: 34, verse: 18, theme: 'comfort'}, // Psalm 34:18
  {book: 19, chapter: 37, verse: 4, theme: 'joy'}, // Psalm 37:4
  {book: 19, chapter: 42, verse: 11, theme: 'hope'}, // Psalm 42:11
  {book: 19, chapter: 46, verse: 1, theme: 'strength'}, // Psalm 46:1
  {book: 19, chapter: 46, verse: 10, theme: 'peace'}, // Psalm 46:10
  {book: 19, chapter: 51, verse: 10, theme: 'forgiveness'}, // Psalm 51:10
  {book: 19, chapter: 55, verse: 22, theme: 'peace'}, // Psalm 55:22
  {book: 19, chapter: 56, verse: 3, theme: 'courage'}, // Psalm 56:3
  {book: 19, chapter: 62, verse: 1, theme: 'peace'}, // Psalm 62:1
  {book: 19, chapter: 73, verse: 26, theme: 'strength'}, // Psalm 73:26
  {book: 19, chapter: 90, verse: 12, theme: 'wisdom'}, // Psalm 90:12
  {book: 19, chapter: 91, verse: 1, theme: 'peace'}, // Psalm 91:1
  {book: 19, chapter: 91, verse: 2, theme: 'peace'}, // Psalm 91:2
  {book: 19, chapter: 94, verse: 19, theme: 'comfort'}, // Psalm 94:19
  {book: 19, chapter: 100, verse: 4, theme: 'joy'}, // Psalm 100:4
  {book: 19, chapter: 103, verse: 1, theme: 'joy'}, // Psalm 103:1
  {book: 19, chapter: 103, verse: 2, theme: 'grace'}, // Psalm 103:2
  {book: 19, chapter: 118, verse: 24, theme: 'joy'}, // Psalm 118:24
  {book: 19, chapter: 119, verse: 105, theme: 'guidance'}, // Psalm 119:105
  {book: 19, chapter: 121, verse: 1, theme: 'comfort'}, // Psalm 121:1
  {book: 19, chapter: 121, verse: 2, theme: 'comfort'}, // Psalm 121:2
  {book: 19, chapter: 139, verse: 14, theme: 'grace'}, // Psalm 139:14
  {book: 19, chapter: 143, verse: 8, theme: 'guidance'}, // Psalm 143:8
  {book: 19, chapter: 145, verse: 18, theme: 'prayer'}, // Psalm 145:18
  {book: 19, chapter: 147, verse: 3, theme: 'comfort'}, // Psalm 147:3
  {book: 20, chapter: 3, verse: 5, theme: 'wisdom'}, // Proverbs 3:5
  {book: 20, chapter: 3, verse: 6, theme: 'guidance'}, // Proverbs 3:6
  {book: 20, chapter: 4, verse: 23, theme: 'wisdom'}, // Proverbs 4:23
  {book: 20, chapter: 15, verse: 1, theme: 'wisdom'}, // Proverbs 15:1
  {book: 20, chapter: 16, verse: 3, theme: 'guidance'}, // Proverbs 16:3
  {book: 20, chapter: 17, verse: 17, theme: 'love'}, // Proverbs 17:17
  {book: 20, chapter: 18, verse: 10, theme: 'strength'}, // Proverbs 18:10
  {book: 20, chapter: 22, verse: 6, theme: 'wisdom'}, // Proverbs 22:6
  {book: 20, chapter: 27, verse: 17, theme: 'wisdom'}, // Proverbs 27:17
  {book: 20, chapter: 31, verse: 25, theme: 'strength'}, // Proverbs 31:25
  {book: 21, chapter: 3, verse: 1, theme: 'wisdom'}, // Ecclesiastes 3:1
  {book: 23, chapter: 12, verse: 2, theme: 'salvation'}, // Isaiah 12:2
  {book: 23, chapter: 26, verse: 3, theme: 'peace'}, // Isaiah 26:3
  {book: 23, chapter: 40, verse: 31, theme: 'hope'}, // Isaiah 40:31
  {book: 23, chapter: 41, verse: 10, theme: 'courage'}, // Isaiah 41:10
  {book: 23, chapter: 43, verse: 2, theme: 'comfort'}, // Isaiah 43:2
  {book: 23, chapter: 53, verse: 5, theme: 'salvation'}, // Isaiah 53:5
  {book: 23, chapter: 55, verse: 8, theme: 'wisdom'}, // Isaiah 55:8
  {book: 23, chapter: 64, verse: 8, theme: 'faith'}, // Isaiah 64:8
  {book: 24, chapter: 29, verse: 11, theme: 'hope'}, // Jeremiah 29:11
  {book: 24, chapter: 33, verse: 3, theme: 'prayer'}, // Jeremiah 33:3
  {book: 25, chapter: 3, verse: 22, theme: 'grace'}, // Lamentations 3:22
  {book: 25, chapter: 3, verse: 23, theme: 'faith'}, // Lamentations 3:23
  {book: 33, chapter: 6, verse: 8, theme: 'guidance'}, // Micah 6:8
  {book: 34, chapter: 1, verse: 7, theme: 'strength'}, // Nahum 1:7
  {book: 35, chapter: 3, verse: 19, theme: 'strength'}, // Habakkuk 3:19
  {book: 36, chapter: 3, verse: 17, theme: 'joy'}, // Zephaniah 3:17
  {book: 40, chapter: 5, verse: 14, theme: 'faith'}, // Matthew 5:14
  {book: 40, chapter: 5, verse: 16, theme: 'faith'}, // Matthew 5:16
  {book: 40, chapter: 6, verse: 21, theme: 'wisdom'}, // Matthew 6:21
  {book: 40, chapter: 6, verse: 33, theme: 'faith'}, // Matthew 6:33
  {book: 40, chapter: 6, verse: 34, theme: 'peace'}, // Matthew 6:34
  {book: 40, chapter: 7, verse: 7, theme: 'prayer'}, // Matthew 7:7
  {book: 40, chapter: 11, verse: 28, theme: 'peace'}, // Matthew 11:28
  {book: 40, chapter: 19, verse: 26, theme: 'faith'}, // Matthew 19:26
  {book: 40, chapter: 22, verse: 37, theme: 'love'}, // Matthew 22:37
  {book: 40, chapter: 28, verse: 19, theme: 'faith'}, // Matthew 28:19
  {book: 40, chapter: 28, verse: 20, theme: 'comfort'}, // Matthew 28:20
  {book: 41, chapter: 10, verse: 27, theme: 'faith'}, // Mark 10:27
  {book: 41, chapter: 11, verse: 24, theme: 'prayer'}, // Mark 11:24
  {book: 41, chapter: 12, verse: 30, theme: 'love'}, // Mark 12:30
  {book: 42, chapter: 1, verse: 37, theme: 'faith'}, // Luke 1:37
  {book: 42, chapter: 6, verse: 31, theme: 'love'}, // Luke 6:31
  {book: 43, chapter: 1, verse: 1, theme: 'faith'}, // John 1:1
  {book: 43, chapter: 3, verse: 16, theme: 'love'}, // John 3:16
  {book: 43, chapter: 8, verse: 12, theme: 'faith'}, // John 8:12
  {book: 43, chapter: 10, verse: 10, theme: 'salvation'}, // John 10:10
  {book: 43, chapter: 13, verse: 34, theme: 'love'}, // John 13:34
  {book: 43, chapter: 14, verse: 1, theme: 'comfort'}, // John 14:1
  {book: 43, chapter: 14, verse: 6, theme: 'salvation'}, // John 14:6
  {book: 43, chapter: 14, verse: 27, theme: 'peace'}, // John 14:27
  {book: 43, chapter: 15, verse: 5, theme: 'faith'}, // John 15:5
  {book: 43, chapter: 16, verse: 33, theme: 'peace'}, // John 16:33
  {book: 44, chapter: 1, verse: 8, theme: 'courage'}, // Acts 1:8
  {book: 45, chapter: 5, verse: 1, theme: 'salvation'}, // Romans 5:1
  {book: 45, chapter: 5, verse: 8, theme: 'love'}, // Romans 5:8
  {book: 45, chapter: 6, verse: 23, theme: 'salvation'}, // Romans 6:23
  {book: 45, chapter: 8, verse: 1, theme: 'grace'}, // Romans 8:1
  {book: 45, chapter: 8, verse: 28, theme: 'hope'}, // Romans 8:28
  {book: 45, chapter: 8, verse: 31, theme: 'courage'}, // Romans 8:31
  {book: 45, chapter: 8, verse: 38, theme: 'love'}, // Romans 8:38
  {book: 45, chapter: 10, verse: 9, theme: 'salvation'}, // Romans 10:9
  {book: 45, chapter: 12, verse: 2, theme: 'wisdom'}, // Romans 12:2
  {book: 45, chapter: 12, verse: 12, theme: 'hope'}, // Romans 12:12
  {book: 45, chapter: 15, verse: 13, theme: 'hope'}, // Romans 15:13
  {book: 46, chapter: 10, verse: 13, theme: 'strength'}, // 1 Corinthians 10:13
  {book: 46, chapter: 13, verse: 4, theme: 'love'}, // 1 Corinthians 13:4
  {book: 46, chapter: 13, verse: 13, theme: 'love'}, // 1 Corinthians 13:13
  {book: 46, chapter: 15, verse: 58, theme: 'strength'}, // 1 Corinthians 15:58
  {book: 46, chapter: 16, verse: 14, theme: 'love'}, // 1 Corinthians 16:14
  {book: 47, chapter: 4, verse: 16, theme: 'hope'}, // 2 Corinthians 4:16
  {book: 47, chapter: 5, verse: 7, theme: 'faith'}, // 2 Corinthians 5:7
  {book: 47, chapter: 5, verse: 17, theme: 'grace'}, // 2 Corinthians 5:17
  {book: 47, chapter: 9, verse: 7, theme: 'joy'}, // 2 Corinthians 9:7
  {book: 47, chapter: 12, verse: 9, theme: 'grace'}, // 2 Corinthians 12:9
  {book: 48, chapter: 2, verse: 20, theme: 'faith'}, // Galatians 2:20
  {book: 48, chapter: 5, verse: 22, theme: 'joy'}, // Galatians 5:22
  {book: 48, chapter: 6, verse: 9, theme: 'strength'}, // Galatians 6:9
  {book: 49, chapter: 2, verse: 8, theme: 'grace'}, // Ephesians 2:8
  {book: 49, chapter: 3, verse: 20, theme: 'faith'}, // Ephesians 3:20
  {book: 49, chapter: 4, verse: 32, theme: 'forgiveness'}, // Ephesians 4:32
  {book: 49, chapter: 6, verse: 10, theme: 'strength'}, // Ephesians 6:10
  {book: 50, chapter: 1, verse: 6, theme: 'hope'}, // Philippians 1:6
  {book: 50, chapter: 4, verse: 6, theme: 'prayer'}, // Philippians 4:6
  {book: 50, chapter: 4, verse: 7, theme: 'peace'}, // Philippians 4:7
  {book: 50, chapter: 4, verse: 8, theme: 'wisdom'}, // Philippians 4:8
  {book: 50, chapter: 4, verse: 13, theme: 'strength'}, // Philippians 4:13
  {book: 50, chapter: 4, verse: 19, theme: 'grace'}, // Philippians 4:19
  {book: 51, chapter: 3, verse: 2, theme: 'wisdom'}, // Colossians 3:2
  {book: 51, chapter: 3, verse: 15, theme: 'peace'}, // Colossians 3:15
  {book: 51, chapter: 3, verse: 23, theme: 'guidance'}, // Colossians 3:23
  {book: 52, chapter: 5, verse: 16, theme: 'joy'}, // 1 Thessalonians 5:16
  {book: 52, chapter: 5, verse: 17, theme: 'prayer'}, // 1 Thessalonians 5:17
  {book: 52, chapter: 5, verse: 18, theme: 'joy'}, // 1 Thessalonians 5:18
  {book: 54, chapter: 4, verse: 12, theme: 'faith'}, // 1 Timothy 4:12
  {book: 55, chapter: 1, verse: 7, theme: 'courage'}, // 2 Timothy 1:7
  {book: 55, chapter: 3, verse: 16, theme: 'guidance'}, // 2 Timothy 3:16
  {book: 58, chapter: 4, verse: 12, theme: 'guidance'}, // Hebrews 4:12
  {book: 58, chapter: 10, verse: 23, theme: 'faith'}, // Hebrews 10:23
  {book: 58, chapter: 11, verse: 1, theme: 'faith'}, // Hebrews 11:1
  {book: 58, chapter: 11, verse: 6, theme: 'faith'}, // Hebrews 11:6
  {book: 58, chapter: 12, verse: 1, theme: 'strength'}, // Hebrews 12:1
  {book: 58, chapter: 12, verse: 2, theme: 'faith'}, // Hebrews 12:2
  {book: 58, chapter: 13, verse: 5, theme: 'comfort'}, // Hebrews 13:5
  {book: 58, chapter: 13, verse: 8, theme: 'faith'}, // Hebrews 13:8
  {book: 59, chapter: 1, verse: 2, theme: 'joy'}, // James 1:2
  {book: 59, chapter: 1, verse: 5, theme: 'wisdom'}, // James 1:5
  {book: 59, chapter: 1, verse: 12, theme: 'strength'}, // James 1:12
  {book: 59, chapter: 1, verse: 17, theme: 'grace'}, // James 1:17
  {book: 59, chapter: 4, verse: 7, theme: 'courage'}, // James 4:7
  {book: 59, chapter: 4, verse: 8, theme: 'prayer'}, // James 4:8
  {book: 60, chapter: 1, verse: 3, theme: 'hope'}, // 1 Peter 1:3
  {book: 60, chapter: 3, verse: 15, theme: 'hope'}, // 1 Peter 3:15
  {book: 60, chapter: 4, verse: 8, theme: 'love'}, // 1 Peter 4:8
  {book: 60, chapter: 5, verse: 6, theme: 'grace'}, // 1 Peter 5:6
  {book: 60, chapter: 5, verse: 7, theme: 'peace'}, // 1 Peter 5:7
  {book: 61, chapter: 3, verse: 9, theme: 'salvation'}, // 2 Peter 3:9
  {book: 62, chapter: 1, verse: 9, theme: 'forgiveness'}, // 1 John 1:9
  {book: 62, chapter: 3, verse: 1, theme: 'love'}, // 1 John 3:1
  {book: 62, chapter: 4, verse: 7, theme: 'love'}, // 1 John 4:7
  {book: 62, chapter: 4, verse: 8, theme: 'love'}, // 1 John 4:8
  {book: 62, chapter: 4, verse: 18, theme: 'love'}, // 1 John 4:18
  {book: 62, chapter: 4, verse: 19, theme: 'love'}, // 1 John 4:19
  {book: 62, chapter: 5, verse: 14, theme: 'prayer'}, // 1 John 5:14
  {book: 65, chapter: 1, verse: 24, theme: 'grace'}, // Jude 1:24
  {book: 66, chapter: 3, verse: 20, theme: 'salvation'}, // Revelation 3:20
  {book: 66, chapter: 21, verse: 4, theme: 'comfort'}, // Revelation 21:4
  {book: 66, chapter: 21, verse: 5, theme: 'hope'}, // Revelation 21:5

  // Sprint 95 — Christ-centred additions, so the most-seen verse leans the
  // reader toward the Lord Jesus (2 Pet 3:18). The day pick is index-based and
  // order-independent, so these are appended rather than re-sorted in place.
  {book: 23, chapter: 9, verse: 6, theme: 'salvation'}, // Isaiah 9:6 — unto us a child is born
  {book: 40, chapter: 28, verse: 6, theme: 'hope'}, // Matthew 28:6 — He is risen
  {book: 42, chapter: 19, verse: 10, theme: 'salvation'}, // Luke 19:10 — to seek and to save the lost
  {book: 43, chapter: 1, verse: 14, theme: 'grace'}, // John 1:14 — the Word made flesh
  {book: 43, chapter: 6, verse: 35, theme: 'faith'}, // John 6:35 — I am the bread of life
  {book: 43, chapter: 10, verse: 11, theme: 'comfort'}, // John 10:11 — I am the good shepherd
  {book: 43, chapter: 11, verse: 25, theme: 'hope'}, // John 11:25 — I am the resurrection
  {book: 44, chapter: 4, verse: 12, theme: 'salvation'}, // Acts 4:12 — no other name
  {book: 44, chapter: 16, verse: 31, theme: 'salvation'}, // Acts 16:31 — believe on the Lord Jesus
  {book: 45, chapter: 8, verse: 32, theme: 'love'}, // Romans 8:32 — he that spared not his own Son
  {book: 47, chapter: 5, verse: 21, theme: 'salvation'}, // 2 Corinthians 5:21 — made him to be sin for us
  {book: 48, chapter: 6, verse: 14, theme: 'salvation'}, // Galatians 6:14 — glory in the cross
  {book: 49, chapter: 1, verse: 7, theme: 'grace'}, // Ephesians 1:7 — redemption through his blood
  {book: 50, chapter: 2, verse: 9, theme: 'faith'}, // Philippians 2:9 — God hath highly exalted him
  {book: 51, chapter: 1, verse: 16, theme: 'faith'}, // Colossians 1:16 — by him all things created
  {book: 54, chapter: 1, verse: 15, theme: 'salvation'}, // 1 Timothy 1:15 — Christ came to save sinners
  {book: 56, chapter: 2, verse: 11, theme: 'grace'}, // Titus 2:11 — the grace of God that bringeth salvation
  {book: 58, chapter: 7, verse: 25, theme: 'salvation'}, // Hebrews 7:25 — able to save to the uttermost
  {book: 60, chapter: 2, verse: 24, theme: 'salvation'}, // 1 Peter 2:24 — bore our sins in his own body
  {book: 61, chapter: 3, verse: 18, theme: 'grace'}, // 2 Peter 3:18 — grow in grace and knowledge
  {book: 62, chapter: 4, verse: 10, theme: 'love'}, // 1 John 4:10 — he loved us, the propitiation
  {book: 66, chapter: 1, verse: 8, theme: 'faith'}, // Revelation 1:8 — Alpha and Omega
];

/** Day of the year (1-366) for the given date, in local time. */
function getDayOfYear(date: Date): number {
  const startOfYear = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - startOfYear.getTime();
  return Math.floor(diff / 86_400_000);
}

/**
 * The curated verse reference for the given day (defaults to today).
 * Deterministic: the same calendar day always yields the same verse.
 */
export function getDailyVerseRef(date: Date = new Date()): DailyVerseRef {
  const index = (getDayOfYear(date) - 1) % DAILY_VERSE_REFS.length;
  return DAILY_VERSE_REFS[
    (index + DAILY_VERSE_REFS.length) % DAILY_VERSE_REFS.length
  ];
}
