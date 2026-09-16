/**
 * R9-78 — the three red-letter lists that MUST agree, checked against each
 * other instead of against a comment.
 *
 * Red-letter availability is declared in three places, in three different
 * worlds:
 *
 *   1. `redLetterByVersion` in src/lib/reading/redLetterText.ts — native, which
 *      answers `hasRedLetterData` from statically bundled arrays.
 *   2. `RED_LETTER_PACKS` in src/lib/reading/redLetterText.web.ts — web, which
 *      answers the SAME question from a per-version JSON pack fetched at
 *      runtime, and holds each pack's FILENAME.
 *   3. `RED_LETTER_SPECS` in scripts/build-web-packs.js — the only thing that
 *      actually BUILDS those packs, and the only place their filenames are
 *      produced.
 *
 * All three carried a header comment asking the next person to keep them in
 * sync, and nothing detected the day one of them didn't. `R9-13` is that day:
 * RVR1960 was in the native map, absent from the other two, so the web reader
 * answered "yes, this version has Words of Christ", enabled the switch, and
 * rendered none — silently, in Spanish, for a month. The session that fixed it
 * added a gate for a version DISAPPEARING from the published manifest
 * (`R9-73`), which cannot see this case at all: a version that never got a pack
 * has no entry in the baseline to go missing from.
 *
 * So this compares the lists by value. A comment is a note; this is the gate.
 *
 * Both sibling modules are required through their EXPLICIT specifiers. The bare
 * one would resolve to the native file under jest's native preset (the trap
 * documented in webNativeModuleParity.test.ts), and comparing native against
 * itself is the vacuum this whole review program keeps finding.
 */
import {redLetterVersionIds as nativeVersionIds} from '../src/lib/reading/redLetterText';
import {
  redLetterVersionIds as webVersionIds,
  RED_LETTER_PACKS,
} from '../src/lib/reading/redLetterText.web';

const {RED_LETTER_SPECS, PACK_SPECS} =
  require('../scripts/build-web-packs.js') as {
    RED_LETTER_SPECS: ReadonlyArray<{
      versionId: string;
      source: string;
      out: string;
    }>;
    PACK_SPECS: ReadonlyArray<{id: string; file: string}>;
  };

const sorted = (values: Iterable<string>): string[] => [...values].sort();

describe('the three red-letter version lists agree', () => {
  it('each list is non-empty (the floor: comparing empty sets always passes)', () => {
    // Without this, a require that silently resolved to something else — or an
    // export renamed out from under the imports above — would turn every
    // comparison below into [] vs [] and report success. Two is not a
    // convention, it is the count this repo actually ships.
    expect(nativeVersionIds().length).toBeGreaterThanOrEqual(2);
    expect(webVersionIds().length).toBeGreaterThanOrEqual(2);
    expect(RED_LETTER_SPECS.length).toBeGreaterThanOrEqual(2);
  });

  it('native and web answer hasRedLetterData for the SAME version ids', () => {
    // The R9-13 direction: a version native claims to have and web cannot
    // deliver reads red-letter-free while the UI says otherwise.
    expect(sorted(webVersionIds())).toEqual(sorted(nativeVersionIds()));
  });

  it('the build script emits a pack for exactly those version ids', () => {
    // The other end of the same thread. Web can only deliver what the build
    // actually produced, and that list is hand-maintained.
    expect(sorted(RED_LETTER_SPECS.map(spec => spec.versionId))).toEqual(
      sorted(nativeVersionIds()),
    );
  });

  it('the filenames web FETCHES are the filenames the build script WRITES', () => {
    // Matching ids with mismatched filenames is the same outage wearing a
    // different hat: the fetch 404s and red-letter is dead for that version.
    const built = Object.fromEntries(
      RED_LETTER_SPECS.map(spec => [spec.versionId, spec.out]),
    );
    expect(Object.fromEntries(RED_LETTER_PACKS)).toEqual(built);
  });

  it('every red-letter version also has a verse pack to align its spans against', () => {
    // Spans are character offsets into THAT version's text, so a red-letter
    // spec with no matching .sqlite pack cannot be verified at build time —
    // verifyRedLetterAlignment would open a file that was never built.
    const packIds = new Set(PACK_SPECS.map(spec => spec.id));
    for (const spec of RED_LETTER_SPECS) {
      expect([spec.versionId, packIds.has(spec.versionId)]).toEqual([
        spec.versionId,
        true,
      ]);
    }
  });

  it('names a drift instead of just failing (the control on the comparison)', () => {
    // A control for the comparisons themselves: they must react to a difference
    // in EITHER direction, not merely to a shorter list. Without this, a check
    // written as "web contains every native id" would pass while web carried an
    // extra version that nothing builds.
    const native = sorted(nativeVersionIds());
    expect(sorted([...native, 'KJV'])).not.toEqual(native);
    expect(sorted(native.slice(1))).not.toEqual(native);
  });
});
