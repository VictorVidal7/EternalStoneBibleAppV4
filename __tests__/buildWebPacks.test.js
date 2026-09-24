/**
 * R9-66 — scripts/build-web-packs.js is the only thing in this whole review
 * program that touches DATA THAT GETS PUBLISHED, so its own verification has
 * to be un-passable in a vacuum.
 *
 * `verifyRedLetterAlignment` used to iterate the entries and collect
 * failures, which meant ZERO entries collected ZERO failures and printed
 * "ALL slices non-blank and in-range" — a green light. The script would then
 * write a 2-byte `[]` pack, hash it, and record `entries: 0, spans: 0` in
 * web-bootstrap.json. Publishing that kills "Words of Christ" for that
 * version on the web exactly the way R9-13 did, except with the build's
 * blessing.
 *
 * It is not a hypothetical path: BOTH source arrays are AUTO-GENERATED
 * (bible-data-rvr1960-redletter.ts from decisions/*.json), so a regeneration
 * that yields an empty or short array is the ordinary way to get here. The
 * .sqlite half of the script already refuses to pass empty — it pins
 * `n === expectCount`, `books === 66`, the 1..66 id range and zero blank
 * verses. The red-letter half had no floor at all; this gives it one.
 */
const fs = require('fs');
const os = require('os');
const path = require('path');

const crypto = require('crypto');

const {
  buildPack,
  verifyRedLetterAlignment,
  readPreviousManifest,
  shrinkComplaints,
  baselineComparisonCounts,
  assertNoShrink,
  main,
} = require('../scripts/build-web-packs.js');

const JOHN_316 =
  'Porque de tal manera amo Dios al mundo, que ha dado a su Hijo unigenito, ' +
  'para que todo aquel que en el cree, no se pierda, mas tenga vida eterna.';

let tmpDir;
let dbFile;
let logSpy;

beforeAll(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'essb-packs-'));
  dbFile = path.join(tmpDir, 'rvr1960.sqlite');
  buildPack(
    [
      {
        book_id: 43,
        book_name: 'Juan',
        chapter: 3,
        verse: 16,
        text: JOHN_316,
      },
    ],
    dbFile,
  );
});

afterAll(() => {
  fs.rmSync(tmpDir, {recursive: true, force: true});
});

beforeEach(() => {
  // The function narrates to stdout on the happy path; silence just that so
  // a PASSING run stays readable.
  logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
});
afterEach(() => logSpy.mockRestore());

describe('verifyRedLetterAlignment cannot pass in a vacuum', () => {
  it('refuses an EMPTY entry list instead of reporting it as aligned', () => {
    // The whole finding. A regenerated-empty source file used to sail
    // through here and get published.
    expect(() => verifyRedLetterAlignment([], dbFile, 'RVR1960')).toThrow(
      /no entries|empty/i,
    );
  });

  it('refuses entries that carry no spans at all', () => {
    // The second shape of the same hole: rows present, every `spans` array
    // empty. Zero spans checked is still zero spans verified, and the pack
    // renders exactly as red-letter-free as an empty one.
    expect(() =>
      verifyRedLetterAlignment(
        [{book_id: 43, chapter: 3, verse: 16, spans: []}],
        dbFile,
        'RVR1960',
      ),
    ).toThrow(/no spans|0 spans/i);
  });

  it('still ACCEPTS a genuinely aligned pack (the control)', () => {
    // Without this, a verification that threw unconditionally would pass
    // both cases above and break every real build.
    expect(() =>
      verifyRedLetterAlignment(
        [{book_id: 43, chapter: 3, verse: 16, spans: [[0, JOHN_316.length]]}],
        dbFile,
        'RVR1960',
      ),
    ).not.toThrow();
  });

  it('still catches a span that runs past the end of the verse', () => {
    // The check that already worked, pinned so the new floor above cannot be
    // mistaken for the whole of the verification.
    expect(() =>
      verifyRedLetterAlignment(
        [{book_id: 43, chapter: 3, verse: 16, spans: [[0, 9999]]}],
        dbFile,
        'RVR1960',
      ),
    ).toThrow(/exceeds/);
  });

  it('still catches a span that slices only whitespace', () => {
    expect(() =>
      verifyRedLetterAlignment(
        [{book_id: 43, chapter: 3, verse: 16, spans: [[6, 7]]}],
        dbFile,
        'RVR1960',
      ),
    ).toThrow(/blank/);
  });

  it('still catches an entry pointing at a verse the pack does not have', () => {
    expect(() =>
      verifyRedLetterAlignment(
        [{book_id: 1, chapter: 1, verse: 1, spans: [[0, 5]]}],
        dbFile,
        'RVR1960',
      ),
    ).toThrow(/verse not found/);
  });
});

/**
 * R9-66, second half. The floors above are floors of ZERO: they catch a source
 * that regenerated to nothing and nothing else. A regeneration yielding 3
 * entries instead of 2057 is the same accident with a less convenient number.
 * The committed web-bootstrap.json already records what the last run produced,
 * so it is a free reference point — and a count going DOWN is worth stopping
 * for.
 */
describe('a run that would SHRINK what is already published', () => {
  const PUBLISHED = {
    packs: [
      {id: 'RVR1960', verseCount: 31102},
      {id: 'WEB', verseCount: 31098},
    ],
    redLetter: [
      {versionId: 'WEB', entries: 2059, spans: 2077},
      {versionId: 'RVR1960', entries: 2057, spans: 2077},
    ],
  };
  const SAME_PACKS = [
    {id: 'RVR1960', verseCount: 31102},
    {id: 'WEB', verseCount: 31098},
  ];
  const SAME_RED_LETTER = [
    {versionId: 'WEB', entries: 2059, spans: 2077},
    {versionId: 'RVR1960', entries: 2057, spans: 2077},
  ];

  it('is refused when red-letter entries drop', () => {
    expect(() =>
      assertNoShrink(
        PUBLISHED,
        SAME_PACKS,
        [
          {versionId: 'WEB', entries: 2059, spans: 2077},
          {versionId: 'RVR1960', entries: 3, spans: 3},
        ],
        false,
      ),
    ).toThrow(/2057 entries -> 3/);
  });

  it('is refused when VERSE counts drop, not just red-letter ones', () => {
    // The .sqlite half has its own floors, but they pin the DB against the
    // SOURCE — a source that quietly lost verses satisfies both.
    expect(() =>
      assertNoShrink(
        PUBLISHED,
        [
          {id: 'RVR1960', verseCount: 31102},
          {id: 'WEB', verseCount: 20000},
        ],
        SAME_RED_LETTER,
        false,
      ),
    ).toThrow(/31098 verses -> 20000/);
  });

  it('is refused when spans drop even though entries did not', () => {
    expect(() =>
      assertNoShrink(
        PUBLISHED,
        SAME_PACKS,
        [
          {versionId: 'WEB', entries: 2059, spans: 2077},
          {versionId: 'RVR1960', entries: 2057, spans: 900},
        ],
        false,
      ),
    ).toThrow(/2077 spans -> 900/);
  });

  it('says NOTHING was written AND warns about an earlier run leftovers', () => {
    // R9-72: this used to pin a claim that was FALSE — both .sqlite packs had
    // already been written into the output directory by the time this threw. The
    // staging rewrite made the claim true; the second half pins the other half
    // of honesty, because an ABORTED run still leaves the PREVIOUS run's files
    // sitting there, and publishing is a manual upload of that directory.
    const shrunk = () =>
      assertNoShrink(
        PUBLISHED,
        SAME_PACKS,
        [
          {versionId: 'WEB', entries: 2059, spans: 2077},
          {versionId: 'RVR1960', entries: 3, spans: 3},
        ],
        false,
      );
    expect(shrunk).toThrow(/NOTHING was written/);
    expect(shrunk).toThrow(/EARLIER run/);
    expect(shrunk).toThrow(/sha256/);
  });

  it('continues with --allow-shrink, because an editorial removal is legitimate', () => {
    // The escape hatch. `decisions/*.json` is a human pass, so a span really
    // can be withdrawn on purpose; this is a stop sign, not a wall, and the
    // flag in the shell history is the record of the decision.
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    expect(() =>
      assertNoShrink(
        PUBLISHED,
        SAME_PACKS,
        [
          {versionId: 'WEB', entries: 2059, spans: 2077},
          {versionId: 'RVR1960', entries: 2056, spans: 2076},
        ],
        true,
      ),
    ).not.toThrow();
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it('says nothing when the counts are unchanged (the control)', () => {
    // Without this, a check that complained unconditionally would pass every
    // case above and break every ordinary rebuild.
    expect(shrinkComplaints(PUBLISHED, SAME_PACKS, SAME_RED_LETTER)).toEqual(
      [],
    );
  });

  it('says nothing when counts GREW', () => {
    expect(
      shrinkComplaints(
        PUBLISHED,
        [
          {id: 'RVR1960', verseCount: 31102},
          {id: 'WEB', verseCount: 31099},
        ],
        [
          {versionId: 'WEB', entries: 2060, spans: 2078},
          {versionId: 'RVR1960', entries: 2057, spans: 2077},
        ],
      ),
    ).toEqual([]);
  });

  it('does not block the FIRST run of a brand-new version', () => {
    // Nothing published to compare against is not a shrink.
    expect(
      shrinkComplaints(PUBLISHED, SAME_PACKS, [
        ...SAME_RED_LETTER,
        {versionId: 'KJV', entries: 1, spans: 1},
      ]),
    ).toEqual([]);
    expect(shrinkComplaints(null, SAME_PACKS, SAME_RED_LETTER)).toEqual([]);
  });

  it('can still read a manifest written BEFORE redLetter became an array', () => {
    // web-bootstrap.json carried a single `redLetter` OBJECT until 2026-09-15.
    // A checker that only understood the new shape would compare against
    // nothing and pass — vacuously, which is the very bug being fixed.
    const legacy = {
      packs: PUBLISHED.packs,
      redLetter: {file: 'web-red-letter.json', entries: 2059, spans: 2077},
    };
    expect(
      shrinkComplaints(legacy, SAME_PACKS, [
        {versionId: 'WEB', entries: 5, spans: 5},
      ]),
    ).toEqual([
      expect.stringContaining('2059 entries -> 5'),
      expect.stringContaining('2077 spans -> 5'),
    ]);
  });
});

/**
 * R9-73 — a version that VANISHES is the largest shrink there is, and the
 * count loops above cannot see it, because they walk the NEW list. That is the
 * same vice R9-66 was about: a loop body that never runs for the thing that
 * went missing.
 *
 * It is not hypothetical either. `redLetterSpecs` is a hand-maintained list —
 * the third known blind spot of this repo — and the last time it was short of
 * RVR1960, red-letter was silently dead in Spanish on the web for a month
 * (that IS R9-13). Worse, the run would then rewrite web-bootstrap.json
 * without the missing version, erasing the only baseline the next run has.
 */
describe('a run that would DROP a version that is already published', () => {
  const PUBLISHED = {
    packs: [
      {id: 'RVR1960', verseCount: 31102},
      {id: 'WEB', verseCount: 31098},
    ],
    redLetter: [
      {versionId: 'WEB', entries: 2059, spans: 2077},
      {versionId: 'RVR1960', entries: 2057, spans: 2077},
    ],
  };

  it('is refused when a red-letter pack disappears entirely', () => {
    expect(
      shrinkComplaints(PUBLISHED, PUBLISHED.packs, [
        {versionId: 'WEB', entries: 2059, spans: 2077},
      ]),
    ).toEqual([expect.stringContaining('RVR1960')]);
  });

  it('is refused when a .sqlite pack disappears entirely', () => {
    expect(
      shrinkComplaints(
        PUBLISHED,
        [{id: 'WEB', verseCount: 31098}],
        PUBLISHED.redLetter,
      ),
    ).toEqual([expect.stringContaining('RVR1960')]);
  });

  it('is refused when EVERYTHING disappears', () => {
    // The extreme of the same shape, and the one a bare count loop is most
    // sure to miss: with nothing to iterate, there is nothing to compare.
    expect(shrinkComplaints(PUBLISHED, [], [])).toHaveLength(4);
  });

  it('names what went missing, not just that something did', () => {
    expect(() =>
      assertNoShrink(
        PUBLISHED,
        PUBLISHED.packs,
        [{versionId: 'WEB', entries: 2059, spans: 2077}],
        false,
      ),
    ).toThrow(/RVR1960[\s\S]*NO PACK/);
  });

  it('still lets a DELIBERATE removal through with --allow-shrink', () => {
    // Same escape hatch as a count going down: retiring a version is an
    // editorial decision, and the flag in the shell history records it.
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    expect(() =>
      assertNoShrink(
        PUBLISHED,
        PUBLISHED.packs,
        [{versionId: 'WEB', entries: 2059, spans: 2077}],
        true,
      ),
    ).not.toThrow();
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it('says nothing when a version is ADDED (the control)', () => {
    // Without this, a check that complained about any difference in the
    // version list would block every new pack.
    expect(
      shrinkComplaints(
        PUBLISHED,
        [...PUBLISHED.packs, {id: 'KJV', verseCount: 31100}],
        [...PUBLISHED.redLetter, {versionId: 'KJV', entries: 1, spans: 1}],
      ),
    ).toEqual([]);
  });
});

/**
 * R9-74 — `readPreviousManifest` used to swallow EVERY error into `null`, and a
 * `null` baseline turns the whole shrink check off. Silently: the run printed
 * not one word about having skipped it, and then overwrote the file.
 *
 * "Absent" really is fine — a first run has nothing to compare against.
 * "Present but unreadable" is not the same thing, and it is reachable: this
 * script writes that file with a single writeFileSync, so its own interrupted
 * run leaves a truncated JSON, and a bad merge leaves conflict markers. Either
 * way the NEXT run would be unable to refuse a shrink and unable to say so.
 */
describe('readPreviousManifest tells absent apart from unreadable', () => {
  let dir;
  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'essb-manifest-'));
  });
  afterEach(() => fs.rmSync(dir, {recursive: true, force: true}));

  it('returns null for a manifest that is simply ABSENT (first run)', () => {
    expect(readPreviousManifest(path.join(dir, 'nope.json'))).toBeNull();
  });

  it('THROWS on a truncated manifest instead of quietly returning null', () => {
    const file = path.join(dir, 'web-bootstrap.json');
    fs.writeFileSync(file, '{ "schema": 1, "packs": [');
    expect(() => readPreviousManifest(file)).toThrow(/PARSE|baseline/i);
  });

  it('THROWS on a manifest with no `packs` array at all', () => {
    // Valid JSON, useless as a baseline: every count comparison would find
    // nothing to compare and pass. That is the bug, not a first run.
    const file = path.join(dir, 'web-bootstrap.json');
    fs.writeFileSync(file, '{"schema": 1}');
    expect(() => readPreviousManifest(file)).toThrow(/packs/);
  });

  it('THROWS on a `redLetter` field that is neither array nor object', () => {
    // R9-77. Absent is a real historical shape and is handled downstream; a
    // string is a mangled baseline, and swallowing it would put the red-letter
    // comparisons back in the vacuum this whole file is about.
    const file = path.join(dir, 'web-bootstrap.json');
    fs.writeFileSync(
      file,
      JSON.stringify({
        schema: 1,
        packs: [{id: 'WEB', verseCount: 7}],
        redLetter: 'nope',
      }),
    );
    expect(() => readPreviousManifest(file)).toThrow(/redLetter/);
  });

  it('still ACCEPTS a baseline with no `redLetter` key at all (the control)', () => {
    // The shape web/packs/web-bootstrap.json really carried until a0782a6.
    // Refusing it HERE would be wrong: absent is indistinguishable from
    // "nothing was ever published", so the refusal belongs where the run knows
    // what it is about to emit. Without this control the check above could be
    // widened to reject absence and every genuine first run would break.
    const file = path.join(dir, 'web-bootstrap.json');
    fs.writeFileSync(
      file,
      JSON.stringify({schema: 1, packs: [{id: 'WEB', verseCount: 7}]}),
    );
    expect(readPreviousManifest(file).packs).toHaveLength(1);
  });

  it('returns the parsed manifest when it is readable (the control)', () => {
    const file = path.join(dir, 'web-bootstrap.json');
    fs.writeFileSync(
      file,
      JSON.stringify({schema: 1, packs: [{id: 'WEB', verseCount: 7}]}),
    );
    expect(readPreviousManifest(file).packs[0].verseCount).toBe(7);
  });
});

/**
 * R9-77 - a baseline that pins NOTHING still produced zero complaints, and
 * zero complaints was printed as success.
 *
 * Every comparison in shrinkComplaints skips silently when its `before` is
 * missing, and the R9-73 disappearance loops walk the PREVIOUS lists - so an
 * EMPTY previous list makes both halves pass in a vacuum, which is R9-66's
 * shape one level further out than R9-73 reached. The reachable way in is a
 * manifest with `packs` and no `redLetter`: web/packs/web-bootstrap.json
 * carried exactly that from c3a9aac (2026-07-08) until a0782a6, so an older
 * revision of it, a revert, or a merge that takes the old side lands here. And
 * the success line named `packs.length` - the size of the NEW list - as though
 * it were the number of comparisons made, which it only is on a good run.
 */
describe('a baseline that pins nothing cannot be reported as success', () => {
  const PINNED = {
    packs: [
      {id: 'RVR1960', verseCount: 31102},
      {id: 'WEB', verseCount: 31098},
    ],
    redLetter: [
      {versionId: 'WEB', entries: 2059, spans: 2077},
      {versionId: 'RVR1960', entries: 2057, spans: 2077},
    ],
  };
  const PACKS = [
    {id: 'RVR1960', verseCount: 31102},
    {id: 'WEB', verseCount: 31098},
  ];
  const RED_LETTER = [
    {versionId: 'WEB', entries: 2059, spans: 2077},
    {versionId: 'RVR1960', entries: 2057, spans: 2077},
  ];
  /** The shape the committed manifest really had before a0782a6. */
  const NO_RED_LETTER_KEY = {schema: 1, packs: PINNED.packs};

  // The MECHANISM, on its own, so a revert cannot take these down on an
  // earlier assertion and leave the consequence below proving nothing.
  it('counts what the baseline PINS, not what the run emits', () => {
    expect(baselineComparisonCounts(PINNED, PACKS, RED_LETTER)).toEqual({
      packs: 2,
      redLetter: 2,
    });
    expect(
      baselineComparisonCounts(NO_RED_LETTER_KEY, PACKS, RED_LETTER),
    ).toEqual({packs: 2, redLetter: 0});
    expect(
      baselineComparisonCounts({packs: [], redLetter: []}, PACKS, RED_LETTER),
    ).toEqual({packs: 0, redLetter: 0});
  });

  it('counts a version the baseline does not know as UNPINNED, not as compared', () => {
    // The partial case, which must NOT trip the floor: two of the three are
    // pinned, so the comparison is real even though the newcomer is not.
    expect(
      baselineComparisonCounts(PINNED, PACKS, [
        ...RED_LETTER,
        {versionId: 'KJV', entries: 1, spans: 1},
      ]),
    ).toEqual({packs: 2, redLetter: 2});
  });

  it('counts a legacy OBJECT-shaped redLetter baseline as a pin', () => {
    expect(
      baselineComparisonCounts(
        {packs: PINNED.packs, redLetter: {entries: 2059, spans: 2077}},
        PACKS,
        RED_LETTER,
      ),
      // TWO emitted, ONE pinned: the legacy object only ever described WEB, so
      // an expectation of 1 here is only meaningful while the run emits 2.
    ).toEqual({packs: 2, redLetter: 1});
  });

  // The CONSEQUENCE.
  it('REFUSES a baseline with no `redLetter` key while emitting red-letter packs', () => {
    // The finding. Counts equal, nothing missing from the NEW list, and the old
    // code called that "nothing went down and nothing went missing".
    expect(() =>
      assertNoShrink(NO_RED_LETTER_KEY, PACKS, RED_LETTER, false),
    ).toThrow(/pins NOTHING/);
  });

  it('REFUSES an empty `redLetter` array just the same', () => {
    // The same vacuum wearing a valid shape - and the shape this very script
    // writes if the spec list is ever emptied once, so it survives a round trip.
    expect(() =>
      assertNoShrink(
        {packs: PINNED.packs, redLetter: []},
        PACKS,
        RED_LETTER,
        false,
      ),
    ).toThrow(/red-letter:[\s\S]*pins counts for NONE/);
  });

  it('REFUSES an empty `packs` array too, not just the red-letter half', () => {
    expect(() =>
      assertNoShrink(
        {packs: [], redLetter: PINNED.redLetter},
        PACKS,
        RED_LETTER,
        false,
      ),
    ).toThrow(/packs: this run emits 2[\s\S]*NONE/);
  });

  it('says NOTHING was written, like every other abort does', () => {
    // The R9-72 honesty clause has to hold on this path too: it is a NEW way to
    // abort, and the directory it aborts before touching is the same one a
    // human uploads by hand.
    expect(() =>
      assertNoShrink(NO_RED_LETTER_KEY, PACKS, RED_LETTER, false),
    ).toThrow(/NOTHING was written[\s\S]*EARLIER run/);
  });

  it('lets a genuine FIRST emission through with --allow-shrink', () => {
    // The escape hatch, and the reason this is a stop sign and not a wall:
    // a0782a6 really was a run that emitted red-letter packs for the first time
    // against a baseline that pinned none.
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    expect(() =>
      assertNoShrink(NO_RED_LETTER_KEY, PACKS, RED_LETTER, true),
    ).not.toThrow();
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it('does not fire when the run emits nothing of that kind at all', () => {
    // Retiring red-letter entirely is not a vacuum, it is an empty emission -
    // the floor is guarded on `redLetter.length > 0` and this pins that guard.
    expect(() =>
      assertNoShrink(NO_RED_LETTER_KEY, PACKS, [], false),
    ).not.toThrow();
  });

  it('passes a fully pinned baseline (the control)', () => {
    // Without this, a floor that threw unconditionally would satisfy every case
    // above and block every ordinary rebuild.
    expect(() =>
      assertNoShrink(PINNED, PACKS, RED_LETTER, false),
    ).not.toThrow();
  });

  // R9-83 - the neighbour this very floor left open.
  it('REFUSES an ABSENT baseline, which pins strictly less than an empty one', () => {
    // The floor above stops a baseline that pins nothing and makes a human say
    // --allow-shrink. A baseline that is not there at all pins LESS than that,
    // and used to need no flag, print one reassuring line, and publish.
    expect(() => assertNoShrink(null, PACKS, RED_LETTER, false)).toThrow(
      /NO baseline/,
    );
  });

  it('says NOTHING was written on that path too', () => {
    expect(() => assertNoShrink(null, PACKS, RED_LETTER, false)).toThrow(
      /NOTHING was written[\s\S]*EARLIER run/,
    );
  });

  it('lets an absent baseline through with --allow-shrink (the control)', () => {
    // Same escape hatch as every other stop sign here, so this is not a wall:
    // a genuine first run against a brand-new manifest path says so on the
    // command line, and the flag in the shell history is the record.
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    expect(() => assertNoShrink(null, PACKS, RED_LETTER, true)).not.toThrow();
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it('names the manifest it could not find when it is told one', () => {
    // The actionable half: "restore THIS file" beats "restore the baseline".
    expect(() =>
      assertNoShrink(null, PACKS, RED_LETTER, false, '/tmp/web-bootstrap.json'),
    ).toThrow(/web-bootstrap\.json/);
  });

  it('reports how many comparisons it MADE, not how many packs it emits', () => {
    // The second half of the finding. Those two numbers agree on every good
    // run, which is exactly why the disagreement went unnoticed on the bad one.
    // Here they genuinely differ: three red-letter packs emitted, two pinned.
    assertNoShrink(
      PINNED,
      PACKS,
      [...RED_LETTER, {versionId: 'KJV', entries: 1, spans: 1}],
      false,
    );
    const said = logSpy.mock.calls.map(c => c.join(' ')).join('\n');
    expect(said).toContain('2 of 2 packs');
    expect(said).toContain('2 of 3 red-letter packs');
  });
});

/**
 * R9-72 — the ORDER of the writes, pinned end to end against the real main().
 *
 * The abort message claims "no pack file was emitted, so nothing here is
 * publishable yet". That was false: only the red-letter JSON writes were
 * deferred, while buildPack() had already written both .sqlite packs into the
 * output directory. Publishing is a MANUAL upload of whatever sits in that
 * directory, so a message that asserts the directory is untouched is worse
 * than no message at all.
 *
 * These run the REAL main() against a 66-verse fixture corpus — the smallest
 * thing verifyPack's floors accept (n === expectCount, 66 distinct books, ids
 * 1..66, no blank text, John 3:16 present) — so the ordering is exercised in
 * milliseconds instead of parsing the 8 MB generated data files. A property of
 * main() cannot be pinned by testing the pure helpers around it.
 */
describe('main() emits nothing at all when it aborts', () => {
  const JOHN_FIXTURE = 'Jesus said these words aloud.';
  let dir;
  let world;

  function writeVerseSource(file, arrayName, johnText) {
    const rows = [];
    for (let book = 1; book <= 66; book++) {
      rows.push(
        book === 43
          ? {
              book_id: 43,
              book_name: 'Juan',
              chapter: 3,
              verse: 16,
              text: johnText,
            }
          : {
              book_id: book,
              book_name: 'B' + book,
              chapter: 1,
              verse: 1,
              text: 'Verse of book ' + book,
            },
      );
    }
    fs.writeFileSync(
      file,
      'export const ' + arrayName + ' = ' + JSON.stringify(rows) + ';\n',
      'utf8',
    );
  }

  function writeRedLetterSource(file, arrayName) {
    const entries = [{book_id: 43, chapter: 3, verse: 16, spans: [[0, 5]]}];
    fs.writeFileSync(
      file,
      'export const ' + arrayName + ' = ' + JSON.stringify(entries) + ';\n',
      'utf8',
    );
  }

  function buildWorld(johnText) {
    const src = path.join(dir, 'src');
    fs.mkdirSync(src, {recursive: true});
    writeVerseSource(path.join(src, 'rvr.ts'), 'RVR1960_DATA', johnText);
    writeVerseSource(path.join(src, 'web.ts'), 'WEB_DATA', johnText);
    writeRedLetterSource(path.join(src, 'rvr-rl.ts'), 'RVR1960_RED_LETTER');
    writeRedLetterSource(path.join(src, 'web-rl.ts'), 'WEB_RED_LETTER');
    return {
      out: path.join(dir, 'out'),
      manifestFile: path.join(dir, 'web-bootstrap.json'),
      specs: [
        {
          id: 'RVR1960',
          file: path.join(src, 'rvr.ts'),
          arrayName: 'RVR1960_DATA',
        },
        {id: 'WEB', file: path.join(src, 'web.ts'), arrayName: 'WEB_DATA'},
      ],
      redLetterSpecs: [
        {
          versionId: 'WEB',
          source: path.join(src, 'web-rl.ts'),
          out: 'web-red-letter.json',
        },
        {
          versionId: 'RVR1960',
          source: path.join(src, 'rvr-rl.ts'),
          out: 'rvr1960-red-letter.json',
        },
      ],
    };
  }

  /** Only the files a human would upload — never the staging scratch. */
  function publishable(outDir) {
    if (!fs.existsSync(outDir)) return [];
    return fs
      .readdirSync(outDir)
      .filter(name => /\.(sqlite|json)$/.test(name))
      .sort();
  }

  /**
   * The manifest on disk, checked against the BYTES in the output directory.
   *
   * R9-87: the clean-run control below used to pin `main()`'s manifest write
   * with `readPreviousManifest(...).packs.toHaveLength(2)`, and that
   * discriminated only because the file did not exist yet, so the call threw.
   * R9-83's beforeEach now writes a baseline carrying exactly two packs, so the
   * FIXTURE answers the question the assertion was asking and a main() that
   * never writes the manifest at all stays green. Measured, whole repo, with
   * the write disabled: 363 suites / 4263 tests, all passing.
   *
   * That write is not a detail: data-loader.web.ts treats the manifest sha256
   * as the ONLY signal that a new pack exists, so a manifest that stops being
   * rewritten leaves every already-booted web reader on the old pack forever,
   * in silence.
   *
   * So this asks the world instead of the shape. Every entry has to name a file
   * that is really in `out`, with the byte count and the sha256 those bytes
   * really have. The fixture baseline carries no `file`, no `bytes` and no
   * `sha256`, so it cannot satisfy this by accident - and neither can a stale
   * manifest left by an earlier run whose packs have since changed.
   */
  function manifestAgainstDisk(outDir, manifestFile) {
    if (!fs.existsSync(manifestFile)) {
      return {compared: 0, problems: [`no manifest at ${manifestFile}`]};
    }
    const manifest = JSON.parse(fs.readFileSync(manifestFile, 'utf8'));
    const entries = [...(manifest.packs ?? []), ...(manifest.redLetter ?? [])];
    const problems = [];
    for (const entry of entries) {
      const name = entry.id ?? entry.versionId ?? '(unnamed)';
      const packFile = entry.file ? path.join(outDir, entry.file) : null;
      if (!packFile || !fs.existsSync(packFile)) {
        problems.push(`${name}: manifest names no file that exists in out`);
        continue;
      }
      const buf = fs.readFileSync(packFile);
      if (entry.bytes !== buf.length) {
        problems.push(`${entry.file}: bytes ${entry.bytes} != ${buf.length}`);
      }
      const sha = crypto.createHash('sha256').update(buf).digest('hex');
      if (entry.sha256 !== sha) {
        problems.push(`${entry.file}: sha256 does not match the bytes on disk`);
      }
    }
    return {compared: entries.length, problems};
  }

  /**
   * A baseline that matches exactly what this fixture world produces, so the
   * ordinary cases below run the way the real script does: against a manifest
   * that PINS every count. Before R9-83 these cases ran with no baseline at
   * all, which is the one shape the shrink check cannot say anything about -
   * so the "clean run" control was, strictly, a control of the vacuum.
   */
  function writeMatchingBaseline(file) {
    fs.writeFileSync(
      file,
      JSON.stringify({
        schema: 1,
        packs: [
          {id: 'RVR1960', verseCount: 66},
          {id: 'WEB', verseCount: 66},
        ],
        redLetter: [
          {versionId: 'WEB', entries: 1, spans: 1},
          {versionId: 'RVR1960', entries: 1, spans: 1},
        ],
      }),
    );
  }

  /** A baseline that makes RVR1960 look bigger than this run can produce. */
  function writeInflatedBaseline(file) {
    fs.writeFileSync(
      file,
      JSON.stringify({
        schema: 1,
        packs: [
          {id: 'RVR1960', verseCount: 99999},
          {id: 'WEB', verseCount: 66},
        ],
        redLetter: [
          {versionId: 'WEB', entries: 1, spans: 1},
          {versionId: 'RVR1960', entries: 1, spans: 1},
        ],
      }),
    );
  }

  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'essb-main-'));
    world = buildWorld(JOHN_FIXTURE);
    writeMatchingBaseline(world.manifestFile);
  });
  afterEach(() => fs.rmSync(dir, {recursive: true, force: true}));

  it('writes all four packs and the manifest on a clean run (the control)', () => {
    // Without this, a main() that aborted unconditionally would satisfy every
    // case below and emit nothing, ever.
    main(world);
    expect(publishable(world.out)).toEqual([
      'rvr1960-red-letter.json',
      'rvr1960.sqlite',
      'web-red-letter.json',
      'web.sqlite',
    ]);
    // R9-87: against the WORLD, not against the shape - see
    // manifestAgainstDisk. The old `.packs.toHaveLength(2)` is satisfied by the
    // fixture baseline itself.
    const written = manifestAgainstDisk(world.out, world.manifestFile);
    // Floor: a manifest with no entries would make that loop hold vacuously,
    // which is the shape this whole review keeps finding.
    expect(written.compared).toBe(4);
    expect(written.problems).toEqual([]);
  });

  /**
   * R9-108. The "Done." message is what a human follows to publish, so each
   * thing it says about the world is checked against the world here, not
   * against a string. It used to say "Upload the *.sqlite AND
   * *-red-letter.json" and never name the manifest, which main() writes to
   * `manifestFile` — outside `out` — and whose sha256 is the only signal
   * data-loader.web.ts has that a pack changed.
   */
  describe('the Done message names the manifest, and it is checked against the world (R9-108)', () => {
    /** Everything main() printed from its final "Done." on. */
    function doneMessage() {
      const printed = logSpy.mock.calls.map(args => args.join(' ')).join('\n');
      const at = printed.lastIndexOf('\nDone.');
      if (at < 0) throw new Error('main() printed no "Done." at all');
      return printed.slice(at);
    }

    /** The numbered publish steps, in the order they were printed. */
    function steps(done) {
      return done
        .split('\n')
        .map(line => line.match(/^ {2}(\d+)\. (.*)$/))
        .filter(Boolean)
        .map(([, n, text]) => ({n: Number(n), text}));
    }

    /** data-loader.web.ts, the reader the published files are for. */
    function readerSource() {
      return fs.readFileSync(
        path.join(
          __dirname,
          '..',
          'src',
          'lib',
          'database',
          'data-loader.web.ts',
        ),
        'utf8',
      );
    }

    it('names the manifest by its real path, as the LAST step, after every file it put in out', () => {
      main(world);
      const printed = steps(doneMessage());
      // Floor: the four packs and the manifest, numbered in order.
      expect(printed.map(step => step.n)).toEqual([1, 2, 3, 4, 5]);
      // Every step before the last is a file that really is in `out`, and
      // together they are all of them.
      expect(
        printed
          .slice(0, -1)
          .map(step => step.text)
          .sort(),
      ).toEqual(publishable(world.out).map(name => path.join(world.out, name)));
      const last = printed[printed.length - 1].text;
      expect(last).toMatch(/^LAST\b/);
      expect(last).toContain(world.manifestFile);
      // And what sits at the path it names is the manifest for those bytes.
      expect(
        manifestAgainstDisk(world.out, world.manifestFile).problems,
      ).toEqual([]);
    });

    it('says where it goes: /packs/, under the name the web reader fetches', () => {
      main(world);
      const source = readerSource();
      // The reader's default base URL is the Pages /packs/ directory...
      expect(source).toMatch(/'https:\/\/[^']+\/packs\/'/);
      // ...and the manifest is the one file it fetches there by a fixed name.
      const fetched = [
        ...source.matchAll(/\$\{WEB_PACKS_BASE_URL\}([\w.-]+)/g),
      ].map(match => match[1]);
      expect(fetched).toEqual(['web-bootstrap.json']);
      expect(doneMessage()).toContain(
        `${world.manifestFile} -> /packs/${fetched[0]}`,
      );
    });

    it('says the manifest is NOT in out, and it is not', () => {
      main(world);
      expect(doneMessage()).toContain(`It is NOT in ${world.out}.`);
      expect(fs.readdirSync(world.out)).not.toContain(
        path.basename(world.manifestFile),
      );
    });
  });

  it('leaves the output directory EMPTY when a count shrank', () => {
    // The finding. Before the fix this directory held two freshly written
    // .sqlite packs while the error said none had been emitted.
    writeInflatedBaseline(world.manifestFile);
    expect(() => main(world)).toThrow(/went DOWN/);
    expect(publishable(world.out)).toEqual([]);
  });

  it('leaves the output directory EMPTY when a version disappeared', () => {
    fs.writeFileSync(
      world.manifestFile,
      JSON.stringify({
        schema: 1,
        packs: [
          {id: 'RVR1960', verseCount: 66},
          {id: 'WEB', verseCount: 66},
        ],
        redLetter: [
          {versionId: 'WEB', entries: 1, spans: 1},
          {versionId: 'RVR1960', entries: 1, spans: 1},
        ],
      }),
    );
    expect(() =>
      main({
        ...world,
        redLetterSpecs: world.redLetterSpecs.filter(
          rl => rl.versionId !== 'RVR1960',
        ),
      }),
    ).toThrow(/NO PACK/);
    expect(publishable(world.out)).toEqual([]);
  });

  it('leaves the output directory EMPTY when the baseline is unreadable', () => {
    fs.writeFileSync(world.manifestFile, '{ "schema": 1, "packs": [');
    expect(() => main(world)).toThrow(/PARSE|baseline/i);
    expect(publishable(world.out)).toEqual([]);
  });

  it('does not clobber an EARLIER run’s packs when it aborts', () => {
    // The consequence that makes the false message dangerous: publishing is a
    // manual upload of whatever sits in this directory, so an abort must leave
    // the previous, GOOD bytes exactly as they were — not half-replace them
    // with the bytes of a run that was judged unpublishable.
    main(world);
    const before = crypto
      .createHash('sha256')
      .update(fs.readFileSync(path.join(world.out, 'web.sqlite')))
      .digest('hex');

    // A source that changed AND a baseline that says the count must not fall.
    const changed = buildWorld('Jesus said something else entirely here.');
    writeInflatedBaseline(changed.manifestFile);
    expect(() => main({...changed, out: world.out})).toThrow(/went DOWN/);

    const after = crypto
      .createHash('sha256')
      .update(fs.readFileSync(path.join(world.out, 'web.sqlite')))
      .digest('hex');
    expect(after).toBe(before);
  });

  it('leaves the output directory EMPTY when the baseline pins no red-letter', () => {
    // R9-77 end to end, and the reason it is a P1 rather than a tidiness
    // complaint: this is the R9-13 accident verbatim - RVR1960 dropped from
    // redLetterSpecs - against a baseline in the shape web/packs/
    // web-bootstrap.json really carried until a0782a6. Before the floor, the
    // run EMITTED, printed "nothing went down and nothing went missing", and
    // rewrote the manifest without RVR1960, destroying the only baseline the
    // next run had to notice with.
    fs.writeFileSync(
      world.manifestFile,
      JSON.stringify({
        schema: 1,
        packs: [
          {id: 'RVR1960', verseCount: 66},
          {id: 'WEB', verseCount: 66},
        ],
      }),
    );
    expect(() =>
      main({
        ...world,
        redLetterSpecs: world.redLetterSpecs.filter(
          rl => rl.versionId !== 'RVR1960',
        ),
      }),
    ).toThrow(/pins NOTHING/);
    expect(publishable(world.out)).toEqual([]);
    // And the baseline is still the baseline: an abort that rewrote the
    // manifest would have erased the very evidence the next run needs.
    expect(
      JSON.parse(fs.readFileSync(world.manifestFile, 'utf8')).redLetter,
    ).toBeUndefined();
  });

  it('still emits against that same baseline with --allow-shrink (the control)', () => {
    // Without this the floor above could be a wall, and a0782a6 - the run that
    // genuinely emitted red-letter packs for the first time - would have had no
    // way through.
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    fs.writeFileSync(
      world.manifestFile,
      JSON.stringify({
        schema: 1,
        packs: [
          {id: 'RVR1960', verseCount: 66},
          {id: 'WEB', verseCount: 66},
        ],
      }),
    );
    main({...world, allowShrink: true});
    expect(publishable(world.out)).toEqual([
      'rvr1960-red-letter.json',
      'rvr1960.sqlite',
      'web-red-letter.json',
      'web.sqlite',
    ]);
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it('refuses BEFORE moving anything when a destination cannot be replaced', () => {
    // R9-81. Moving four files is four operations, and one failure used to
    // leave this directory holding two packs from this run and two from the
    // last - under a raw EPERM with none of the guidance the other aborts
    // carry, and with the staging scratch already swept away, so nothing was
    // left to show the move had been partial.
    main(world);
    const before = Object.fromEntries(
      publishable(world.out).map(name => [
        name,
        crypto
          .createHash('sha256')
          .update(fs.readFileSync(path.join(world.out, name)))
          .digest('hex'),
      ]),
    );

    // A destination that cannot be replaced, the way a file held open by
    // another process cannot be.
    fs.rmSync(path.join(world.out, 'web.sqlite'));
    fs.mkdirSync(path.join(world.out, 'web.sqlite'));

    const changed = buildWorld('Jesus said something else entirely here.');
    expect(() => main({...changed, out: world.out})).toThrow(
      /Cannot replace[\s\S]*NOTHING was written/,
    );

    // The property that matters: the OTHER three are untouched, so the
    // directory is still a single coherent run rather than two halves.
    for (const [name, sha] of Object.entries(before)) {
      if (name === 'web.sqlite') continue;
      expect([
        name,
        crypto
          .createHash('sha256')
          .update(fs.readFileSync(path.join(world.out, name)))
          .digest('hex'),
      ]).toEqual([name, sha]);
    }
  });

  it('names exactly what moved and what did not if a rename fails anyway', () => {
    // The residual race the preflight cannot close: the destination was
    // replaceable a moment ago and is not any more. It must not be silent.
    main(world);
    // R9-85: the real renameSync has to be captured BEFORE the spy replaces it.
    // `jest.requireActual('fs')` returns the SAME module object for a core
    // module, so `jest.requireActual('fs').renameSync` is the spy itself
    // (probed: SAME_MODULE=true, SAME_FN=true, IS_MOCK=true). The first rename
    // therefore re-entered the mock, bumped the counter to 2 and threw, so
    // `moved` was always EMPTY and this test - the one named for the halfway
    // case - only ever exercised the nothing-moved one. The old regex only
    // checked that the two LABELS were present, which they are either way.
    const realRename = fs.renameSync;
    const renameSpy = jest.spyOn(fs, 'renameSync');
    let calls = 0;
    renameSpy.mockImplementation((from, to) => {
      calls += 1;
      if (calls === 2) throw new Error('EPERM: operation not permitted');
      return realRename(from, to);
    });
    let message = '';
    try {
      const changed = buildWorld('Jesus said something else entirely here.');
      try {
        main({...changed, out: world.out});
      } catch (error) {
        message = error.message;
      }
    } finally {
      renameSpy.mockRestore();
    }

    // Named, not merely labelled: exactly one file moved and the other three
    // did not, and the message has to say WHICH. `readdirSync` sorts, so the
    // first name is the one that got through.
    expect(calls).toBe(2);
    expect(message).toMatch(/FAILED HALFWAY/);
    expect(message).not.toMatch(/FIRST FILE/);
    expect(message).toMatch(
      /moved \(THIS run's bytes\):\s+rvr1960-red-letter\.json$/m,
    );
    expect(message).toMatch(
      /not moved \(an EARLIER run's\):\s+rvr1960\.sqlite, web-red-letter\.json, web\.sqlite$/m,
    );
  });

  it('does NOT call the directory MIXED when the FIRST rename fails', () => {
    // R9-84. The message R9-81 added is an ASSERTION about the world, and on
    // this path it asserted a falsehood: with `moved: none` it still said "That
    // directory is MIXED ... Do NOT upload anything from it". Nothing moved, so
    // the directory is a coherent EARLIER run whose sha256 are pinned in the
    // manifest - the same class as R9-66's "no pack file was emitted" over
    // 9.5 MB of freshly written packs, mirrored. R9-81's own test fails the
    // SECOND rename, so the `'none'` branch - whose string literal is right
    // there in the source - was never once executed.
    main(world);
    const before = Object.fromEntries(
      publishable(world.out).map(name => [
        name,
        crypto
          .createHash('sha256')
          .update(fs.readFileSync(path.join(world.out, name)))
          .digest('hex'),
      ]),
    );

    const renameSpy = jest.spyOn(fs, 'renameSync');
    renameSpy.mockImplementation(() => {
      throw new Error('EPERM: operation not permitted');
    });
    let message = '';
    try {
      const changed = buildWorld('Jesus said something else entirely here.');
      try {
        main({...changed, out: world.out});
      } catch (error) {
        message = error.message;
      }
    } finally {
      renameSpy.mockRestore();
    }

    expect(message).toMatch(/FAILED ON THE FIRST FILE/);
    expect(message).not.toMatch(/MIXED/);
    expect(message).toMatch(/NOTHING was written[\s\S]*EARLIER run/);

    // And the claim checked against the WORLD, not the string: every byte in
    // that directory is still the earlier run's, so it really is publishable.
    expect(
      Object.fromEntries(
        publishable(world.out).map(name => [
          name,
          crypto
            .createHash('sha256')
            .update(fs.readFileSync(path.join(world.out, name)))
            .digest('hex'),
        ]),
      ),
    ).toEqual(before);
  });

  describe('a failing cleanup never SPEAKS FOR the run (R9-95)', () => {
    /**
     * Make only the staging SWEEP fail.
     *
     * `recursive` is the discriminator, not the path: buildPack removes each
     * .sqlite it is about to write, and those live inside the staging
     * directory, so matching on the name alone breaks the build long before
     * the cleanup and the test measures the wrong failure. (It did, first try:
     * the run died in buildPack and the message under test was the mock's own.)
     *
     * R9-85's lesson applies verbatim: `realRm` is captured BEFORE the spy, so
     * the passthrough cannot re-enter the mock.
     */
    function breakStagingCleanup() {
      const realRm = fs.rmSync;
      const spy = jest.spyOn(fs, 'rmSync');
      spy.mockImplementation((target, options) => {
        if (options?.recursive && String(target).includes('.staging-')) {
          throw new Error('EBUSY: resource busy or locked, rmdir');
        }
        return realRm(target, options);
      });
      return spy;
    }

    it('keeps the REASON the run aborted', () => {
      // The one that matters. A `finally` that throws replaces the exception
      // the `try` was throwing, so the shrink check could catch a shrinking
      // pack and the operator would read only `EBUSY ... rmdir`. Measured
      // before the fix: "mentions the real reason (went DOWN)? false".
      writeInflatedBaseline(world.manifestFile);
      const spy = breakStagingCleanup();
      let message = '';
      try {
        main(world);
      } catch (error) {
        message = error.message;
      } finally {
        spy.mockRestore();
      }
      expect(message).toMatch(/went DOWN/);
      // And the cleanup problem is reported too, not swallowed in its place.
      expect(message).toMatch(/scratch directory[\s\S]*could NOT be removed/);
      expect(message).toMatch(/EBUSY/);
      expect(publishable(world.out)).toEqual([]);
    });

    it('does not report a SUCCESSFUL run as a bare EBUSY', () => {
      // The mirror. Everything published, manifest rewritten, and the only
      // thing the operator saw was a directory-removal error.
      const spy = breakStagingCleanup();
      let message = '';
      try {
        main(world);
      } catch (error) {
        message = error.message;
      } finally {
        spy.mockRestore();
      }
      expect(message).toMatch(/build itself SUCCEEDED/);
      expect(message).toMatch(/scratch directory[\s\S]*could NOT be removed/);
      // Checked against the world, not the sentence: it really did publish.
      expect(publishable(world.out)).toEqual([
        'rvr1960-red-letter.json',
        'rvr1960.sqlite',
        'web-red-letter.json',
        'web.sqlite',
      ]);
      const written = manifestAgainstDisk(world.out, world.manifestFile);
      expect(written.compared).toBe(4);
      expect(written.problems).toEqual([]);
    });
  });

  it('says what state it left behind when the MANIFEST write fails', () => {
    // R9-96. The renames land, then the manifest write fails: `out` now holds
    // THIS run's bytes while the committed manifest still pins the previous
    // ones. Every other abort in this script explains itself; this one raised
    // a bare `EPERM: ... open ...web-bootstrap.json` — and it is the only path
    // where "those files are an EARLIER run's" would be a lie.
    main(world);
    const realWrite = fs.writeFileSync;
    const spy = jest.spyOn(fs, 'writeFileSync');
    spy.mockImplementation((target, data, options) => {
      if (String(target) === world.manifestFile) {
        throw new Error('EPERM: operation not permitted, open');
      }
      return realWrite(target, data, options);
    });
    let message = '';
    try {
      const changed = buildWorld('Jesus said something else entirely here.');
      try {
        main({...changed, out: world.out});
      } catch (error) {
        message = error.message;
      }
    } finally {
      spy.mockRestore();
    }

    expect(message).toMatch(/WRITING THE MANIFEST[\s\S]*FAILED/);
    expect(message).toMatch(/NOT an earlier run/);
    expect(message).toMatch(/Do NOT upload from it as-is/);

    // And the claim checked against the world: `out` really did get refreshed
    // while the manifest really did stay behind.
    const stale = manifestAgainstDisk(world.out, world.manifestFile);
    expect(stale.compared).toBe(4);
    expect(stale.problems.length).toBeGreaterThan(0);
  });

  it('does NOT call it coherent when an EARLIER run left it mixed', () => {
    // R9-93, and the exact neighbour R9-84 left open. R9-84 stopped the message
    // saying MIXED when nothing had moved; this stops the replacement saying
    // "coherent - one run, whole - and its sha256 are still the ones the
    // manifest pins" when an earlier run already mixed the directory. Both
    // halves of that sentence are claims about the world, and on this path the
    // world says otherwise.
    //
    // The sequence is three runs, and every step of it is the race R9-81
    // documents as the one its preflight cannot close:
    //   1. a clean run, so the manifest pins all four files;
    //   2. a run that fails on a LATER rename - `out` is now mixed, and the
    //      manifest was never rewritten, so it describes neither state;
    //   3. a run that fails on the FIRST rename.
    // Run 3 used to reassure its operator about the very directory run 2 told
    // them not to upload.
    main(world);

    const realRename = fs.renameSync;
    const failOn = attempt => {
      const spy = jest.spyOn(fs, 'renameSync');
      let calls = 0;
      spy.mockImplementation((from, to) => {
        calls += 1;
        if (calls === attempt)
          throw new Error('EPERM: operation not permitted');
        return realRename(from, to);
      });
      let message = '';
      try {
        const changed = buildWorld('Jesus said something else entirely here.');
        try {
          main({...changed, out: world.out});
        } catch (error) {
          message = error.message;
        }
      } finally {
        spy.mockRestore();
      }
      return message;
    };

    // Run 2: mixed, and the message is right about it.
    expect(failOn(3)).toMatch(/FAILED HALFWAY[\s\S]*MIXED/);

    // The world, before believing any message about it: the manifest still
    // pins run 1, and `out` no longer matches it everywhere.
    const pinned = new Map(
      [
        ...readPreviousManifest(world.manifestFile).packs,
        ...readPreviousManifest(world.manifestFile).redLetter,
      ].map(entry => [entry.file, entry.sha256]),
    );
    const drifted = publishable(world.out).filter(
      name =>
        crypto
          .createHash('sha256')
          .update(fs.readFileSync(path.join(world.out, name)))
          .digest('hex') !== pinned.get(name),
    );
    expect(drifted.length).toBeGreaterThan(0);

    // Run 3: first rename fails. It must NOT call this coherent.
    const message = failOn(1);
    expect(message).toMatch(/FAILED ON THE FIRST FILE/);
    expect(message).toMatch(/NOT coherent/);
    expect(message).toMatch(/MIXED/);
    expect(message).toMatch(/Do NOT upload anything from it/);
    // Named, not merely alleged: the file it reports is the one that really
    // drifted, checked against the manifest above.
    for (const name of drifted) expect(message).toContain(name);
    expect(message).not.toMatch(/IS coherent/);
  });

  /**
   * Fail every rename, so the abort is always the FIRST FILE one, and hand back
   * what it said. Shared by the two cases below.
   */
  function messageWhenTheFirstRenameFails() {
    const spy = jest.spyOn(fs, 'renameSync');
    spy.mockImplementation(() => {
      throw new Error('EPERM: operation not permitted');
    });
    let message = '';
    try {
      const changed = buildWorld('Jesus said something else entirely here.');
      try {
        main({...changed, out: world.out});
      } catch (error) {
        message = error.message;
      }
    } finally {
      spy.mockRestore();
    }
    return message;
  }

  it('does NOT call an output directory with files MISSING "one run, whole"', () => {
    // R9-97. R9-93 replaced an unchecked claim with a checked one, and then
    // checked it in one direction only: it walks the files that ARE in `out`
    // and asks the manifest about each. Nothing walks the manifest asking the
    // directory, so a file the manifest pins and the directory does not have
    // is invisible - and `[]` back from that loop is printed as "Checked, not
    // assumed ... it IS coherent - one run, whole".
    //
    // That is R9-73's shape (a loop over the NEW list cannot see what is
    // missing from the OLD) wearing R9-74's consequence (the vacuum prints
    // success), inside the gate written to stop exactly that.
    //
    // Two of four is the dangerous half, not the empty one: "whole" sends its
    // owner to upload a directory holding half a run, and data-loader.web.ts
    // then fetches a pack that is not there - a GitHub Pages 404 is served
    // with no CORS header, so the browser sees `TypeError: Failed to fetch`
    // rather than anything legible.
    main(world);
    const removed = publishable(world.out).slice(0, 2);
    for (const name of removed) fs.rmSync(path.join(world.out, name));
    expect(publishable(world.out)).toHaveLength(2);

    const message = messageWhenTheFirstRenameFails();
    expect(message).toMatch(/FAILED ON THE FIRST FILE/);
    expect(message).not.toMatch(/IS coherent/);
    expect(message).not.toMatch(/one run, whole/);
    // Named, not merely alleged.
    for (const name of removed) expect(message).toContain(name);
  });

  it('does NOT call an EMPTY output directory "one run, whole" either', () => {
    // R9-97, the end of the same range: zero files, and the loop that decides
    // whether to say "coherent" has nothing to iterate at all. This is the
    // ordinary first run into a fresh output directory whose first rename
    // loses the race R9-81 documents.
    main(world);
    for (const name of publishable(world.out))
      fs.rmSync(path.join(world.out, name));
    expect(publishable(world.out)).toEqual([]);

    const message = messageWhenTheFirstRenameFails();
    expect(message).toMatch(/FAILED ON THE FIRST FILE/);
    expect(message).not.toMatch(/IS coherent/);
    expect(message).not.toMatch(/one run, whole/);
  });

  it('still reads a LEGACY object-shaped manifest on that same path', () => {
    // R9-98. `readPreviousManifest` accepts a `redLetter` that is a single
    // OBJECT on purpose - web/packs/web-bootstrap.json carried that shape until
    // 2026-09-15, and this file already has `previousRedLetterOf` to normalize
    // it (R9-77). `filesNotPinnedBy` spreads the raw field instead, and
    // spreading a plain object throws.
    //
    // The consequence is the one R9-95 removed two hundred lines above, put
    // back by the same commit: the throw happens INSIDE the rename's catch, so
    // it replaces the entire FIRST FILE message with
    // `TypeError: (previous.redLetter ?? []) is not iterable` and the operator
    // never learns what state the directory is in.
    main(world);
    const current = JSON.parse(fs.readFileSync(world.manifestFile, 'utf8'));
    expect(Array.isArray(current.redLetter)).toBe(true);
    fs.writeFileSync(
      world.manifestFile,
      JSON.stringify({
        schema: 1,
        packs: current.packs,
        redLetter: current.redLetter.find(e => e.versionId === 'WEB'),
      }),
    );

    const message = messageWhenTheFirstRenameFails();
    expect(message).not.toMatch(/is not iterable/);
    expect(message).toMatch(/FAILED ON THE FIRST FILE/);
    // And it really did CHECK rather than merely survive: the legacy object
    // describes WEB's red-letter pack and nothing else, so both .sqlite packs
    // still match and `rvr1960-red-letter.json` is the one file the manifest
    // has no entry for. Naming it is the proof the normalizer ran.
    expect(message).toMatch(/NOT coherent/);
    expect(message).toContain('rvr1960-red-letter.json');
  });

  it('still moves every file when nothing is in the way (the control)', () => {
    // Without this, a preflight that refused unconditionally would satisfy both
    // cases above and never publish anything again.
    main(world);
    const changed = buildWorld('Jesus said something else entirely here.');
    main({...changed, out: world.out});
    expect(publishable(world.out)).toEqual([
      'rvr1960-red-letter.json',
      'rvr1960.sqlite',
      'web-red-letter.json',
      'web.sqlite',
    ]);
    expect(
      fs.readFileSync(path.join(world.out, 'web-red-letter.json'), 'utf8'),
    ).toContain('43');
  });

  it('leaves the output directory EMPTY when there is no baseline at all', () => {
    // R9-83 end to end, and the reason it is a P1 and not a nicety: this is
    // R9-13 verbatim (RVR1960 out of redLetterSpecs) against a manifest that is
    // simply not there. Before the fix the run EMITTED, said only "shrink check
    // SKIPPED ... (first run for this output)", and rewrote the manifest
    // WITHOUT RVR1960 - destroying the one baseline the next run had.
    fs.rmSync(world.manifestFile, {force: true});
    expect(() =>
      main({
        ...world,
        redLetterSpecs: world.redLetterSpecs.filter(
          rl => rl.versionId !== 'RVR1960',
        ),
      }),
    ).toThrow(/NO baseline/);
    expect(publishable(world.out)).toEqual([]);
    expect(fs.existsSync(world.manifestFile)).toBe(false);
  });

  it('still emits with no baseline when --allow-shrink says so (the control)', () => {
    // Without this the stop sign is a wall, and a genuinely new manifest path
    // could never be created at all.
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    fs.rmSync(world.manifestFile, {force: true});
    main({...world, allowShrink: true});
    expect(publishable(world.out)).toEqual([
      'rvr1960-red-letter.json',
      'rvr1960.sqlite',
      'web-red-letter.json',
      'web.sqlite',
    ]);
    // R9-87, the half no other case can pin: this is the ONLY test in the file
    // where the manifest is guaranteed ABSENT before main() runs, so it is the
    // one place that can prove main() CREATES it rather than leaving whatever
    // was already there.
    const written = manifestAgainstDisk(world.out, world.manifestFile);
    expect(written.compared).toBe(4);
    expect(written.problems).toEqual([]);
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it('leaves no staging scratch behind on a clean run OR an abort', () => {
    main(world);
    expect(fs.readdirSync(world.out).filter(n => n.startsWith('.'))).toEqual(
      [],
    );
    writeInflatedBaseline(world.manifestFile);
    expect(() => main(world)).toThrow();
    expect(fs.readdirSync(world.out).filter(n => n.startsWith('.'))).toEqual(
      [],
    );
  });
});
