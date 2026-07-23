/**
 * Tests for the \wj ("words of Jesus") span extractor
 * (scripts/lib/usfmRedLetter.js) — the highest-risk piece of the red-letter
 * spike, since it touches the actual wording attributed to Christ.
 *
 * All USFM fixture constants below (the *_USFM / *_RAW strings) are copied
 * verbatim from eBible.org's own eng-web ("World English Bible Classic")
 * USFM distribution — extracted MECHANICALLY (never hand-retyped: even the
 * per-verse fixtures were pulled out via this same module's own
 * `parseUsfmBook`, then serialized with JSON.stringify and round-trip
 * verified) — see the red-letter-web spike report for how the source was
 * fetched, and why this parser's output is NOT yet safe to apply to this
 * app's own bundled WEB text (a different WEB revision — see that report).
 */
import {
  extractRedLetterSpans,
  parseUsfmBook,
  extractBookRedLetter,
} from '../scripts/lib/usfmRedLetter';

// Matthew 5:1-4 (the opening of the Sermon on the Mount / Beatitudes).
// Verses 3-4 each span two physical USFM lines (\v line + \q2 poetry
// continuation), and v3's continuation re-opens \wj plus trails a \x
// cross-reference — a real multi-line, cross-ref-suffixed case.
const MATT_5_1_4_USFM =
  '\\id MAT 40-MAT-web.sfm World English Bible (WEB) \n\\c 5  \n\\p\n\\v 1 \\w Seeing|strong="G3708"\\w* \\w the|strong="G2532"\\w* \\w multitudes|strong="G3793"\\w*, \\w he|strong="G2532"\\w* \\w went|strong="G4334"\\w* \\w up|strong="G1519"\\w* \\w onto|strong="G1519"\\w* \\w the|strong="G2532"\\w* \\w mountain|strong="G3735"\\w*. \\w When|strong="G1161"\\w* \\w he|strong="G2532"\\w* \\w had|strong="G2532"\\w* \\w sat|strong="G2523"\\w* \\w down|strong="G2523"\\w*, \\w his|strong="G1519"\\w* \\w disciples|strong="G3101"\\w* \\w came|strong="G4334"\\w* \\w to|strong="G1519"\\w* \\w him|strong="G3588"\\w*.  \n\\v 2 \\w He|strong="G2532"\\w* opened \\w his|strong="G1438"\\w* \\w mouth|strong="G4750"\\w* \\w and|strong="G2532"\\w* \\w taught|strong="G1321"\\w* \\w them|strong="G3588"\\w*, \\w saying|strong="G3004"\\w*,   \n\\q1\n\\v 3 \\wj “\\+w Blessed|strong="G3107"\\+w* \\+w are|strong="G1510"\\+w* \\+w the|strong="G3588"\\+w* \\+w poor|strong="G4434"\\+w* \\+w in|strong="G4151"\\+w* \\+w spirit|strong="G4151"\\+w*,\\wj*  \n\\q2 \\wj \\+w for|strong="G3754"\\+w* theirs \\+w is|strong="G1510"\\+w* \\+w the|strong="G3588"\\+w* Kingdom \\+w of|strong="G4151"\\+w* \\+w Heaven|strong="G3772"\\+w*.\\wj*\\x + \\xo 5:3 \\xt Isaiah 57:15; 66:2\\x*   \n\\q1\n\\v 4 \\wj \\+w Blessed|strong="G3107"\\+w* \\+w are|strong="G3588"\\+w* \\+w those|strong="G3588"\\+w* \\+w who|strong="G3588"\\+w* \\+w mourn|strong="G3996"\\+w*,\\wj*  \n\\q2 \\wj \\+w for|strong="G3754"\\+w* \\+w they|strong="G3588"\\+w* \\+w shall|strong="G3748"\\+w* \\+w be|strong="G3588"\\+w* \\+w comforted|strong="G3870"\\+w*.\\wj*\\x + \\xo 5:4 \\xt Isaiah 61:2; 66:10,13\\x*   ';

// John 3:1-4 (Nicodemus's visit). v1 is pure narration (no \wj). v2 is
// Nicodemus's OWN quoted words — dialogue, but NOT \wj — a negative control
// proving quotation marks alone don't trigger a span. v3 is Jesus's answer,
// and eBible splits its single continuous quote around a \f footnote
// mid-verse (no continuation line needed here, unlike the Matthew case) —
// the extractor must still report ONE span, not two. v4 is Nicodemus's
// second question, again not \wj.
const JOHN_3_1_4_USFM =
  '\\id JHN 43-JHN-web.sfm World English Bible (WEB) \n\\c 3  \n\\p\n\\v 1 \\w Now|strong="G1161"\\w* \\w there|strong="G1161"\\w* \\w was|strong="G1510"\\w* \\w a|strong="G1510"\\w* man \\w of|strong="G1537"\\w* \\w the|strong="G1537"\\w* \\w Pharisees|strong="G5330"\\w* \\w named|strong="G3686"\\w* \\w Nicodemus|strong="G3530"\\w*, \\w a|strong="G1510"\\w* ruler \\w of|strong="G1537"\\w* \\w the|strong="G1537"\\w* \\w Jews|strong="G2453"\\w*.  \n\\v 2 \\w He|strong="G2532"\\w* \\w came|strong="G2064"\\w* \\w to|strong="G4314"\\w* \\w Jesus|strong="G3004"\\w* \\w by|strong="G4314"\\w* \\w night|strong="G3571"\\w* \\w and|strong="G2532"\\w* \\w said|strong="G3004"\\w* \\w to|strong="G4314"\\w* \\w him|strong="G3588"\\w*, “\\w Rabbi|strong="G4461"\\w*, \\w we|strong="G3739"\\w* \\w know|strong="G1492"\\w* \\w that|strong="G3754"\\w* \\w you|strong="G4771"\\w* \\w are|strong="G1510"\\w* \\w a|strong="G2532"\\w* \\w teacher|strong="G1320"\\w* \\w come|strong="G2064"\\w* \\w from|strong="G2064"\\w* \\w God|strong="G2316"\\w*, \\w for|strong="G1063"\\w* \\w no|strong="G3762"\\w* \\w one|strong="G3762"\\w* \\w can|strong="G1410"\\w* \\w do|strong="G4160"\\w* \\w these|strong="G3778"\\w* \\w signs|strong="G4592"\\w* \\w that|strong="G3754"\\w* \\w you|strong="G4771"\\w* \\w do|strong="G4160"\\w*, \\w unless|strong="G1437"\\w* \\w God|strong="G2316"\\w* \\w is|strong="G1510"\\w* \\w with|strong="G3326"\\w* \\w him|strong="G3588"\\w*.”   \n\\p\n\\v 3 \\w Jesus|strong="G2424"\\w* \\w answered|strong="G3004"\\w* \\w him|strong="G3588"\\w*, \\wj “\\+w Most|strong="G2316"\\+w* \\+w certainly|strong="G2532"\\+w* \\+w I|strong="G2532"\\+w* \\+w tell|strong="G3004"\\+w* \\+w you|strong="G4771"\\+w*, \\+w unless|strong="G1437"\\+w* \\+w one|strong="G5100"\\+w* \\+w is|strong="G3588"\\+w* \\+w born|strong="G1080"\\+w* anew, \\wj*\\f + \\fr 3:3 \\ft The word translated “anew” here and in John 3:7 (ἄνωθεν) also means “again” and “from above”.\\f* \\wj \\+w he|strong="G2532"\\+w* \\+w can|strong="G1410"\\+w*’\\+w t|strong="G3588"\\+w* \\+w see|strong="G3708"\\+w* \\+w God|strong="G2316"\\+w*’s Kingdom.”\\wj*   \n\\p\n\\v 4 \\w Nicodemus|strong="G3530"\\w* \\w said|strong="G3004"\\w* \\w to|strong="G1519"\\w* \\w him|strong="G3588"\\w*, “\\w How|strong="G4459"\\w* \\w can|strong="G1410"\\w* \\w a|strong="G2532"\\w* \\w man|strong="G3361"\\w* \\w be|strong="G1510"\\w* \\w born|strong="G1080"\\w* \\w when|strong="G2532"\\w* \\w he|strong="G2532"\\w* \\w is|strong="G1510"\\w* \\w old|strong="G1088"\\w*? \\w Can|strong="G1410"\\w* \\w he|strong="G2532"\\w* \\w enter|strong="G1525"\\w* \\w a|strong="G2532"\\w* \\w second|strong="G1208"\\w* \\w time|strong="G1208"\\w* \\w into|strong="G1519"\\w* \\w his|strong="G1519"\\w* \\w mother|strong="G3384"\\w*’s \\w womb|strong="G2836"\\w* \\w and|strong="G2532"\\w* \\w be|strong="G1510"\\w* \\w born|strong="G1080"\\w*?”   ';

// Below: the same source's individual verses (as this module's own
// parseUsfmBook would split them out of the two book fixtures above) reused
// standalone, so extractRedLetterSpans can be tested in isolation from the
// book-assembly step.

// Matt 5:3, already stitched across its \q2 continuation + trailing \x.
const MATT_5_3_RAW =
  '\\wj “\\+w Blessed|strong="G3107"\\+w* \\+w are|strong="G1510"\\+w* \\+w the|strong="G3588"\\+w* \\+w poor|strong="G4434"\\+w* \\+w in|strong="G4151"\\+w* \\+w spirit|strong="G4151"\\+w*,\\wj*   \\wj \\+w for|strong="G3754"\\+w* theirs \\+w is|strong="G1510"\\+w* \\+w the|strong="G3588"\\+w* Kingdom \\+w of|strong="G4151"\\+w* \\+w Heaven|strong="G3772"\\+w*.\\wj*\\x + \\xo 5:3 \\xt Isaiah 57:15; 66:2\\x*    ';

// John 3:16 — the footnote-split "only born" / "Son" quote named in the
// task (eBible's own footnote explains the Greek "μονογενη").
const JOHN_3_16_RAW =
  '\\wj \\+w For|strong="G1063"\\+w* \\+w God|strong="G2316"\\+w* \\+w so|strong="G3779"\\+w* loved \\+w the|strong="G1519"\\+w* \\+w world|strong="G2889"\\+w*, \\+w that|strong="G2443"\\+w* \\+w he|strong="G3588"\\+w* \\+w gave|strong="G1325"\\+w* \\+w his|strong="G3956"\\+w* \\+w only|strong="G3439"\\+w* born\\wj*\\f + \\fr 3:16 \\ft The phrase “only born” is from the Greek word “μονογενη”, which is sometimes translated “only begotten” or “one and only”.\\f* \\wj \\+w Son|strong="G5207"\\+w*, \\+w that|strong="G2443"\\+w* \\+w whoever|strong="G3956"\\+w* \\+w believes|strong="G4100"\\+w* \\+w in|strong="G1519"\\+w* \\+w him|strong="G3588"\\+w* \\+w should|strong="G2316"\\+w* \\+w not|strong="G3361"\\+w* perish, \\+w but|strong="G3361"\\+w* \\+w have|strong="G2192"\\+w* eternal \\+w life|strong="G2222"\\+w*. \\wj*  ';

// John 3:22 — pure narration, no \wj at all.
const JOHN_3_22_RAW =
  '\\w After|strong="G3326"\\w* \\w these|strong="G3778"\\w* \\w things|strong="G3778"\\w*, \\w Jesus|strong="G2424"\\w* \\w came|strong="G2064"\\w* \\w with|strong="G3326"\\w* \\w his|strong="G1519"\\w* \\w disciples|strong="G3101"\\w* \\w into|strong="G1519"\\w* \\w the|strong="G2532"\\w* \\w land|strong="G1093"\\w* \\w of|strong="G2532"\\w* \\w Judea|strong="G2453"\\w*. \\w He|strong="G2532"\\w* \\w stayed|strong="G1304"\\w* \\w there|strong="G1563"\\w* \\w with|strong="G3326"\\w* \\w them|strong="G3588"\\w* \\w and|strong="G2532"\\w* baptized.  ';

// John 3:2 — Nicodemus's own quoted words, NOT \wj.
const JOHN_3_2_RAW =
  '\\w He|strong="G2532"\\w* \\w came|strong="G2064"\\w* \\w to|strong="G4314"\\w* \\w Jesus|strong="G3004"\\w* \\w by|strong="G4314"\\w* \\w night|strong="G3571"\\w* \\w and|strong="G2532"\\w* \\w said|strong="G3004"\\w* \\w to|strong="G4314"\\w* \\w him|strong="G3588"\\w*, “\\w Rabbi|strong="G4461"\\w*, \\w we|strong="G3739"\\w* \\w know|strong="G1492"\\w* \\w that|strong="G3754"\\w* \\w you|strong="G4771"\\w* \\w are|strong="G1510"\\w* \\w a|strong="G2532"\\w* \\w teacher|strong="G1320"\\w* \\w come|strong="G2064"\\w* \\w from|strong="G2064"\\w* \\w God|strong="G2316"\\w*, \\w for|strong="G1063"\\w* \\w no|strong="G3762"\\w* \\w one|strong="G3762"\\w* \\w can|strong="G1410"\\w* \\w do|strong="G4160"\\w* \\w these|strong="G3778"\\w* \\w signs|strong="G4592"\\w* \\w that|strong="G3754"\\w* \\w you|strong="G4771"\\w* \\w do|strong="G4160"\\w*, \\w unless|strong="G1437"\\w* \\w God|strong="G2316"\\w* \\w is|strong="G1510"\\w* \\w with|strong="G3326"\\w* \\w him|strong="G3588"\\w*.”    ';

describe('extractRedLetterSpans (single-verse raw USFM -> plain text + spans)', () => {
  it('strips \\w/\\+w word wrappers and reports the Beatitude as one span (Matt 5:3)', () => {
    const {plainText, spans} = extractRedLetterSpans(MATT_5_3_RAW);
    expect(plainText).toBe(
      '“Blessed are the poor in spirit, for theirs is the Kingdom of Heaven.',
    );
    expect(spans).toEqual([{start: 0, end: plainText.length}]);
  });

  it('merges the \\wj run eBible splits around a footnote into ONE span (John 3:16)', () => {
    const {plainText, spans} = extractRedLetterSpans(JOHN_3_16_RAW);
    expect(plainText).toBe(
      'For God so loved the world, that he gave his only born Son, that whoever believes in him should not perish, but have eternal life.',
    );
    // The core assertion: ONE continuous span, not two fragments split by
    // the removed footnote. eBible's own markup decided John 3:16 IS Jesus
    // speaking (continuing the Nicodemus discourse) — see the report for
    // how far that \wj block runs (through v21).
    expect(spans).toHaveLength(1);
    expect(plainText.slice(spans[0].start, spans[0].end)).toBe(plainText);
  });

  it('does NOT merge two genuinely separate quotes that have real narration between them', () => {
    // Synthetic (placeholder wording, not scripture) — isolates the
    // touching-vs-real-gap distinction from the footnote-merge test above.
    const raw =
      '\\w Jesus|strong="G2424"\\w* \\w said|strong="G3004"\\w*, \\wj “Sample one.”\\wj* \\w Then|strong="G1"\\w* \\w he|strong="G1"\\w* \\w said|strong="G1"\\w*, \\wj “Sample two.”\\wj*';
    const {plainText, spans} = extractRedLetterSpans(raw);
    expect(plainText).toBe(
      'Jesus said, “Sample one.” Then he said, “Sample two.”',
    );
    expect(spans).toHaveLength(2);
    expect(plainText.slice(spans[0].start, spans[0].end)).toBe('“Sample one.”');
    expect(plainText.slice(spans[1].start, spans[1].end)).toBe('“Sample two.”');
  });

  it('reports no spans for a verse with no \\wj markers at all (John 3:22)', () => {
    const {plainText, spans} = extractRedLetterSpans(JOHN_3_22_RAW);
    expect(plainText).toBe(
      'After these things, Jesus came with his disciples into the land of Judea. He stayed there with them and baptized.',
    );
    expect(spans).toEqual([]);
  });

  it("does NOT mark another speaker's quoted words merely for having quotation marks (Nicodemus, John 3:2)", () => {
    const {spans} = extractRedLetterSpans(JOHN_3_2_RAW);
    expect(spans).toEqual([]);
  });
});

describe('parseUsfmBook + extractBookRedLetter (whole-book USFM -> verse records)', () => {
  it('assembles Matthew 5:1-4, stitching \\q2 poetry continuations back onto their verse', () => {
    const verses = parseUsfmBook(MATT_5_1_4_USFM);
    expect(verses.map(v => `${v.book} ${v.chapter}:${v.verse}`)).toEqual([
      'MAT 5:1',
      'MAT 5:2',
      'MAT 5:3',
      'MAT 5:4',
    ]);
  });

  it('marks the Beatitudes (v3-4) as words of Jesus and the scene-setting narration (v1-2) as not', () => {
    const result = extractBookRedLetter(MATT_5_1_4_USFM);
    const byVerse = new Map(result.map(v => [v.verse, v]));

    expect(byVerse.get(1)?.spans).toEqual([]);
    expect(byVerse.get(2)?.spans).toEqual([]);

    const v3 = byVerse.get(3)!;
    expect(v3.plainText).toBe(
      '“Blessed are the poor in spirit, for theirs is the Kingdom of Heaven.',
    );
    // The \q2 continuation re-opens \wj immediately, and eBible appends a
    // \x cross-reference at the very end — both must disappear cleanly and
    // the two physical lines must still read as ONE continuous span.
    expect(v3.spans).toHaveLength(1);
    expect(v3.plainText.slice(v3.spans[0].start, v3.spans[0].end)).toBe(
      v3.plainText,
    );

    const v4 = byVerse.get(4)!;
    expect(v4.plainText).toBe(
      'Blessed are those who mourn, for they shall be comforted.',
    );
    expect(v4.spans).toHaveLength(1);
    expect(v4.plainText.slice(v4.spans[0].start, v4.spans[0].end)).toBe(
      v4.plainText,
    );
  });

  it('assembles John 3:1-4 (Nicodemus) with correct book/chapter/verse keys', () => {
    const verses = parseUsfmBook(JOHN_3_1_4_USFM);
    expect(verses.map(v => `${v.book} ${v.chapter}:${v.verse}`)).toEqual([
      'JHN 3:1',
      'JHN 3:2',
      'JHN 3:3',
      'JHN 3:4',
    ]);
  });

  it("marks only Jesus's answer (v3) as red-letter, not the narration (v1) or Nicodemus's questions (v2, v4)", () => {
    const result = extractBookRedLetter(JOHN_3_1_4_USFM);
    const byVerse = new Map(result.map(v => [v.verse, v]));

    expect(byVerse.get(1)?.spans).toEqual([]);
    expect(byVerse.get(2)?.spans).toEqual([]);
    expect(byVerse.get(4)?.spans).toEqual([]);

    const v3 = byVerse.get(3)!;
    // The footnote-split "anew,"/"he" boundary must still read as one quote
    // that starts at the opening curly quote and runs to the end of v3.
    expect(v3.spans).toHaveLength(1);
    const quoteStart = v3.plainText.indexOf('“');
    expect(v3.plainText.slice(v3.spans[0].start, v3.spans[0].end)).toBe(
      v3.plainText.slice(quoteStart),
    );
  });
});
