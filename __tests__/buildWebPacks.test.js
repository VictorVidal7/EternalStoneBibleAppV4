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

const {
  buildPack,
  verifyRedLetterAlignment,
  shrinkComplaints,
  assertNoShrink,
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

  it('says NOTHING was written, so the message is actionable', () => {
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
    ).toThrow(/NOTHING was written/);
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
