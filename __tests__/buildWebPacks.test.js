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
