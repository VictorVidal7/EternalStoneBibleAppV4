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
 */

export interface DailyVerseRef {
  book: number;
  chapter: number;
  verse: number;
}

export const DAILY_VERSE_REFS: DailyVerseRef[] = [
  {book: 1, chapter: 1, verse: 1}, // Genesis 1:1
  {book: 2, chapter: 14, verse: 14}, // Exodus 14:14
  {book: 2, chapter: 15, verse: 2}, // Exodus 15:2
  {book: 4, chapter: 6, verse: 24}, // Numbers 6:24
  {book: 5, chapter: 31, verse: 6}, // Deuteronomy 31:6
  {book: 5, chapter: 31, verse: 8}, // Deuteronomy 31:8
  {book: 6, chapter: 1, verse: 9}, // Joshua 1:9
  {book: 6, chapter: 24, verse: 15}, // Joshua 24:15
  {book: 9, chapter: 16, verse: 7}, // 1 Samuel 16:7
  {book: 13, chapter: 16, verse: 11}, // 1 Chronicles 16:11
  {book: 14, chapter: 7, verse: 14}, // 2 Chronicles 7:14
  {book: 16, chapter: 8, verse: 10}, // Nehemiah 8:10
  {book: 18, chapter: 19, verse: 25}, // Job 19:25
  {book: 19, chapter: 1, verse: 1}, // Psalm 1:1
  {book: 19, chapter: 16, verse: 11}, // Psalm 16:11
  {book: 19, chapter: 18, verse: 2}, // Psalm 18:2
  {book: 19, chapter: 19, verse: 1}, // Psalm 19:1
  {book: 19, chapter: 23, verse: 1}, // Psalm 23:1
  {book: 19, chapter: 27, verse: 1}, // Psalm 27:1
  {book: 19, chapter: 28, verse: 7}, // Psalm 28:7
  {book: 19, chapter: 30, verse: 5}, // Psalm 30:5
  {book: 19, chapter: 32, verse: 8}, // Psalm 32:8
  {book: 19, chapter: 34, verse: 8}, // Psalm 34:8
  {book: 19, chapter: 34, verse: 18}, // Psalm 34:18
  {book: 19, chapter: 37, verse: 4}, // Psalm 37:4
  {book: 19, chapter: 42, verse: 11}, // Psalm 42:11
  {book: 19, chapter: 46, verse: 1}, // Psalm 46:1
  {book: 19, chapter: 46, verse: 10}, // Psalm 46:10
  {book: 19, chapter: 51, verse: 10}, // Psalm 51:10
  {book: 19, chapter: 55, verse: 22}, // Psalm 55:22
  {book: 19, chapter: 56, verse: 3}, // Psalm 56:3
  {book: 19, chapter: 62, verse: 1}, // Psalm 62:1
  {book: 19, chapter: 73, verse: 26}, // Psalm 73:26
  {book: 19, chapter: 90, verse: 12}, // Psalm 90:12
  {book: 19, chapter: 91, verse: 1}, // Psalm 91:1
  {book: 19, chapter: 91, verse: 2}, // Psalm 91:2
  {book: 19, chapter: 94, verse: 19}, // Psalm 94:19
  {book: 19, chapter: 100, verse: 4}, // Psalm 100:4
  {book: 19, chapter: 103, verse: 1}, // Psalm 103:1
  {book: 19, chapter: 103, verse: 2}, // Psalm 103:2
  {book: 19, chapter: 118, verse: 24}, // Psalm 118:24
  {book: 19, chapter: 119, verse: 105}, // Psalm 119:105
  {book: 19, chapter: 121, verse: 1}, // Psalm 121:1
  {book: 19, chapter: 121, verse: 2}, // Psalm 121:2
  {book: 19, chapter: 139, verse: 14}, // Psalm 139:14
  {book: 19, chapter: 143, verse: 8}, // Psalm 143:8
  {book: 19, chapter: 145, verse: 18}, // Psalm 145:18
  {book: 19, chapter: 147, verse: 3}, // Psalm 147:3
  {book: 20, chapter: 3, verse: 5}, // Proverbs 3:5
  {book: 20, chapter: 3, verse: 6}, // Proverbs 3:6
  {book: 20, chapter: 4, verse: 23}, // Proverbs 4:23
  {book: 20, chapter: 15, verse: 1}, // Proverbs 15:1
  {book: 20, chapter: 16, verse: 3}, // Proverbs 16:3
  {book: 20, chapter: 17, verse: 17}, // Proverbs 17:17
  {book: 20, chapter: 18, verse: 10}, // Proverbs 18:10
  {book: 20, chapter: 22, verse: 6}, // Proverbs 22:6
  {book: 20, chapter: 27, verse: 17}, // Proverbs 27:17
  {book: 20, chapter: 31, verse: 25}, // Proverbs 31:25
  {book: 21, chapter: 3, verse: 1}, // Ecclesiastes 3:1
  {book: 23, chapter: 12, verse: 2}, // Isaiah 12:2
  {book: 23, chapter: 26, verse: 3}, // Isaiah 26:3
  {book: 23, chapter: 40, verse: 31}, // Isaiah 40:31
  {book: 23, chapter: 41, verse: 10}, // Isaiah 41:10
  {book: 23, chapter: 43, verse: 2}, // Isaiah 43:2
  {book: 23, chapter: 53, verse: 5}, // Isaiah 53:5
  {book: 23, chapter: 55, verse: 8}, // Isaiah 55:8
  {book: 23, chapter: 64, verse: 8}, // Isaiah 64:8
  {book: 24, chapter: 29, verse: 11}, // Jeremiah 29:11
  {book: 24, chapter: 33, verse: 3}, // Jeremiah 33:3
  {book: 25, chapter: 3, verse: 22}, // Lamentations 3:22
  {book: 25, chapter: 3, verse: 23}, // Lamentations 3:23
  {book: 33, chapter: 6, verse: 8}, // Micah 6:8
  {book: 34, chapter: 1, verse: 7}, // Nahum 1:7
  {book: 35, chapter: 3, verse: 19}, // Habakkuk 3:19
  {book: 36, chapter: 3, verse: 17}, // Zephaniah 3:17
  {book: 40, chapter: 5, verse: 14}, // Matthew 5:14
  {book: 40, chapter: 5, verse: 16}, // Matthew 5:16
  {book: 40, chapter: 6, verse: 21}, // Matthew 6:21
  {book: 40, chapter: 6, verse: 33}, // Matthew 6:33
  {book: 40, chapter: 6, verse: 34}, // Matthew 6:34
  {book: 40, chapter: 7, verse: 7}, // Matthew 7:7
  {book: 40, chapter: 11, verse: 28}, // Matthew 11:28
  {book: 40, chapter: 19, verse: 26}, // Matthew 19:26
  {book: 40, chapter: 22, verse: 37}, // Matthew 22:37
  {book: 40, chapter: 28, verse: 19}, // Matthew 28:19
  {book: 40, chapter: 28, verse: 20}, // Matthew 28:20
  {book: 41, chapter: 10, verse: 27}, // Mark 10:27
  {book: 41, chapter: 11, verse: 24}, // Mark 11:24
  {book: 41, chapter: 12, verse: 30}, // Mark 12:30
  {book: 42, chapter: 1, verse: 37}, // Luke 1:37
  {book: 42, chapter: 6, verse: 31}, // Luke 6:31
  {book: 43, chapter: 1, verse: 1}, // John 1:1
  {book: 43, chapter: 3, verse: 16}, // John 3:16
  {book: 43, chapter: 8, verse: 12}, // John 8:12
  {book: 43, chapter: 10, verse: 10}, // John 10:10
  {book: 43, chapter: 13, verse: 34}, // John 13:34
  {book: 43, chapter: 14, verse: 1}, // John 14:1
  {book: 43, chapter: 14, verse: 6}, // John 14:6
  {book: 43, chapter: 14, verse: 27}, // John 14:27
  {book: 43, chapter: 15, verse: 5}, // John 15:5
  {book: 43, chapter: 16, verse: 33}, // John 16:33
  {book: 44, chapter: 1, verse: 8}, // Acts 1:8
  {book: 45, chapter: 5, verse: 1}, // Romans 5:1
  {book: 45, chapter: 5, verse: 8}, // Romans 5:8
  {book: 45, chapter: 6, verse: 23}, // Romans 6:23
  {book: 45, chapter: 8, verse: 1}, // Romans 8:1
  {book: 45, chapter: 8, verse: 28}, // Romans 8:28
  {book: 45, chapter: 8, verse: 31}, // Romans 8:31
  {book: 45, chapter: 8, verse: 38}, // Romans 8:38
  {book: 45, chapter: 10, verse: 9}, // Romans 10:9
  {book: 45, chapter: 12, verse: 2}, // Romans 12:2
  {book: 45, chapter: 12, verse: 12}, // Romans 12:12
  {book: 45, chapter: 15, verse: 13}, // Romans 15:13
  {book: 46, chapter: 10, verse: 13}, // 1 Corinthians 10:13
  {book: 46, chapter: 13, verse: 4}, // 1 Corinthians 13:4
  {book: 46, chapter: 13, verse: 13}, // 1 Corinthians 13:13
  {book: 46, chapter: 15, verse: 58}, // 1 Corinthians 15:58
  {book: 46, chapter: 16, verse: 14}, // 1 Corinthians 16:14
  {book: 47, chapter: 4, verse: 16}, // 2 Corinthians 4:16
  {book: 47, chapter: 5, verse: 7}, // 2 Corinthians 5:7
  {book: 47, chapter: 5, verse: 17}, // 2 Corinthians 5:17
  {book: 47, chapter: 9, verse: 7}, // 2 Corinthians 9:7
  {book: 47, chapter: 12, verse: 9}, // 2 Corinthians 12:9
  {book: 48, chapter: 2, verse: 20}, // Galatians 2:20
  {book: 48, chapter: 5, verse: 22}, // Galatians 5:22
  {book: 48, chapter: 6, verse: 9}, // Galatians 6:9
  {book: 49, chapter: 2, verse: 8}, // Ephesians 2:8
  {book: 49, chapter: 3, verse: 20}, // Ephesians 3:20
  {book: 49, chapter: 4, verse: 32}, // Ephesians 4:32
  {book: 49, chapter: 6, verse: 10}, // Ephesians 6:10
  {book: 50, chapter: 1, verse: 6}, // Philippians 1:6
  {book: 50, chapter: 4, verse: 6}, // Philippians 4:6
  {book: 50, chapter: 4, verse: 7}, // Philippians 4:7
  {book: 50, chapter: 4, verse: 8}, // Philippians 4:8
  {book: 50, chapter: 4, verse: 13}, // Philippians 4:13
  {book: 50, chapter: 4, verse: 19}, // Philippians 4:19
  {book: 51, chapter: 3, verse: 2}, // Colossians 3:2
  {book: 51, chapter: 3, verse: 15}, // Colossians 3:15
  {book: 51, chapter: 3, verse: 23}, // Colossians 3:23
  {book: 52, chapter: 5, verse: 16}, // 1 Thessalonians 5:16
  {book: 52, chapter: 5, verse: 17}, // 1 Thessalonians 5:17
  {book: 52, chapter: 5, verse: 18}, // 1 Thessalonians 5:18
  {book: 54, chapter: 4, verse: 12}, // 1 Timothy 4:12
  {book: 55, chapter: 1, verse: 7}, // 2 Timothy 1:7
  {book: 55, chapter: 3, verse: 16}, // 2 Timothy 3:16
  {book: 58, chapter: 4, verse: 12}, // Hebrews 4:12
  {book: 58, chapter: 10, verse: 23}, // Hebrews 10:23
  {book: 58, chapter: 11, verse: 1}, // Hebrews 11:1
  {book: 58, chapter: 11, verse: 6}, // Hebrews 11:6
  {book: 58, chapter: 12, verse: 1}, // Hebrews 12:1
  {book: 58, chapter: 12, verse: 2}, // Hebrews 12:2
  {book: 58, chapter: 13, verse: 5}, // Hebrews 13:5
  {book: 58, chapter: 13, verse: 8}, // Hebrews 13:8
  {book: 59, chapter: 1, verse: 2}, // James 1:2
  {book: 59, chapter: 1, verse: 5}, // James 1:5
  {book: 59, chapter: 1, verse: 12}, // James 1:12
  {book: 59, chapter: 1, verse: 17}, // James 1:17
  {book: 59, chapter: 4, verse: 7}, // James 4:7
  {book: 59, chapter: 4, verse: 8}, // James 4:8
  {book: 60, chapter: 1, verse: 3}, // 1 Peter 1:3
  {book: 60, chapter: 3, verse: 15}, // 1 Peter 3:15
  {book: 60, chapter: 4, verse: 8}, // 1 Peter 4:8
  {book: 60, chapter: 5, verse: 6}, // 1 Peter 5:6
  {book: 60, chapter: 5, verse: 7}, // 1 Peter 5:7
  {book: 61, chapter: 3, verse: 9}, // 2 Peter 3:9
  {book: 62, chapter: 1, verse: 9}, // 1 John 1:9
  {book: 62, chapter: 3, verse: 1}, // 1 John 3:1
  {book: 62, chapter: 4, verse: 7}, // 1 John 4:7
  {book: 62, chapter: 4, verse: 8}, // 1 John 4:8
  {book: 62, chapter: 4, verse: 18}, // 1 John 4:18
  {book: 62, chapter: 4, verse: 19}, // 1 John 4:19
  {book: 62, chapter: 5, verse: 14}, // 1 John 5:14
  {book: 65, chapter: 1, verse: 24}, // Jude 1:24
  {book: 66, chapter: 3, verse: 20}, // Revelation 3:20
  {book: 66, chapter: 21, verse: 4}, // Revelation 21:4
  {book: 66, chapter: 21, verse: 5}, // Revelation 21:5

  // Sprint 95 — Christ-centred additions, so the most-seen verse leans the
  // reader toward the Lord Jesus (2 Pet 3:18). The day pick is index-based and
  // order-independent, so these are appended rather than re-sorted in place.
  {book: 23, chapter: 9, verse: 6}, // Isaiah 9:6 — unto us a child is born
  {book: 40, chapter: 28, verse: 6}, // Matthew 28:6 — He is risen
  {book: 42, chapter: 19, verse: 10}, // Luke 19:10 — to seek and to save the lost
  {book: 43, chapter: 1, verse: 14}, // John 1:14 — the Word made flesh
  {book: 43, chapter: 6, verse: 35}, // John 6:35 — I am the bread of life
  {book: 43, chapter: 10, verse: 11}, // John 10:11 — I am the good shepherd
  {book: 43, chapter: 11, verse: 25}, // John 11:25 — I am the resurrection
  {book: 44, chapter: 4, verse: 12}, // Acts 4:12 — no other name
  {book: 44, chapter: 16, verse: 31}, // Acts 16:31 — believe on the Lord Jesus
  {book: 45, chapter: 8, verse: 32}, // Romans 8:32 — he that spared not his own Son
  {book: 47, chapter: 5, verse: 21}, // 2 Corinthians 5:21 — made him to be sin for us
  {book: 48, chapter: 6, verse: 14}, // Galatians 6:14 — glory in the cross
  {book: 49, chapter: 1, verse: 7}, // Ephesians 1:7 — redemption through his blood
  {book: 50, chapter: 2, verse: 9}, // Philippians 2:9 — God hath highly exalted him
  {book: 51, chapter: 1, verse: 16}, // Colossians 1:16 — by him all things created
  {book: 54, chapter: 1, verse: 15}, // 1 Timothy 1:15 — Christ came to save sinners
  {book: 56, chapter: 2, verse: 11}, // Titus 2:11 — the grace of God that bringeth salvation
  {book: 58, chapter: 7, verse: 25}, // Hebrews 7:25 — able to save to the uttermost
  {book: 60, chapter: 2, verse: 24}, // 1 Peter 2:24 — bore our sins in his own body
  {book: 61, chapter: 3, verse: 18}, // 2 Peter 3:18 — grow in grace and knowledge
  {book: 62, chapter: 4, verse: 10}, // 1 John 4:10 — he loved us, the propitiation
  {book: 66, chapter: 1, verse: 8}, // Revelation 1:8 — Alpha and Omega
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
