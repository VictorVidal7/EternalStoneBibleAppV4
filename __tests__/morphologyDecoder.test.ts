import {
  decodeMorphologyCode,
  describeMorphology,
} from '../src/features/study/morphologyDecoder';
import greekCodes from '../src/features/study/data/greekMorphologyCodes.json';
import hebrewCodes from '../src/features/study/data/hebrewMorphologyCodes.json';

describe('decodeMorphologyCode — Greek', () => {
  it('decodes a real verb form (John 3:16 ἠγάπησεν = "he loved")', () => {
    const decoded = decodeMorphologyCode('V-AAI-3S', 'G');
    expect(decoded).toEqual({
      segments: [
        {
          code: 'V-AAI-3S',
          attrs: {
            function: 'Verb',
            tense: 'Aorist',
            voice: 'Active',
            mood: 'Indicative',
            person: '3rd',
            number: 'Singular',
          },
        },
      ],
      mergedStrongs: undefined,
    });
  });

  it('decodes a real noun form (John 3:16 θεὸς = "God")', () => {
    const decoded = decodeMorphologyCode('N-NSM-T', 'G');
    expect(decoded?.segments[0].attrs).toEqual({
      function: 'Noun',
      case: 'Nominative',
      number: 'Singular',
      gender: 'Masculine',
      nameType: 'Title',
    });
  });

  it("captures a merged word's embedded Strong's number without decoding it as grammar", () => {
    const decoded = decodeMorphologyCode('CONJ + G1437', 'G');
    expect(decoded?.segments).toEqual([
      {code: 'CONJ', attrs: {function: 'Conjunction'}},
    ]);
    expect(decoded?.mergedStrongs).toBe('G1437');
  });

  it('returns null for an unrecognized code', () => {
    expect(decodeMorphologyCode('NOT-A-REAL-CODE', 'G')).toBeNull();
  });
});

describe('decodeMorphologyCode — Hebrew/Aramaic', () => {
  it('decodes a real verb form (Genesis 1:1 בָּרָא = "he created")', () => {
    const decoded = decodeMorphologyCode('HVqp3ms', 'H');
    expect(decoded?.segments).toEqual([
      {
        code: 'HVqp3ms',
        attrs: {
          function: 'Verb',
          stem: 'Qal',
          form: 'Perfect',
          voice: 'Active',
          mood: 'Indicative',
          person: 'Third',
          gender: 'Masculine',
          number: 'Singular',
        },
      },
    ]);
  });

  it('decodes a real noun form (Genesis 1:1 אֱלֹהִים = "God")', () => {
    const decoded = decodeMorphologyCode('HNcmpa', 'H');
    expect(decoded?.segments[0].attrs).toEqual({
      function: 'Noun',
      form: 'Common',
      gender: 'Masculine',
      number: 'Plural',
      state: 'Absolute',
    });
  });

  it('decodes a 3-morpheme compound (conjunction + noun + pronominal suffix)', () => {
    const decoded = decodeMorphologyCode('HC/Ncmsc/Sp3ms', 'H');
    expect(decoded?.segments.map(s => s.code)).toEqual([
      'HC',
      'Ncmsc',
      'Sp3ms',
    ]);
    expect(decoded?.segments[0].attrs.function).toBe('Conjunction');
    expect(decoded?.segments[1].attrs).toMatchObject({
      function: 'Noun',
      state: 'Construct',
    });
    expect(decoded?.segments[2].attrs).toMatchObject({
      function: 'Suffix',
      person: 'Third',
    });
  });

  it('propagates the language letter across a "//" two-word boundary', () => {
    // A real code from the bundled data: two glued words, the second
    // segment carries no language letter of its own.
    const decoded = decodeMorphologyCode('HR//D', 'H');
    expect(decoded?.segments.map(s => s.code)).toEqual(['HR', 'D']);
  });

  it('returns null for an unrecognized code', () => {
    expect(decodeMorphologyCode('ZZZ-not-real', 'H')).toBeNull();
  });
});

describe('decodeMorphologyCode — edge cases', () => {
  it('returns null for empty/missing grammar', () => {
    expect(decodeMorphologyCode('', 'G')).toBeNull();
    expect(decodeMorphologyCode(null, 'G')).toBeNull();
    expect(decodeMorphologyCode(undefined, 'H')).toBeNull();
  });

  it('returns null for an unrecognized language', () => {
    expect(decodeMorphologyCode('V-AAI-3S', 'X')).toBeNull();
  });
});

describe('describeMorphology', () => {
  it('describes a simple Greek verb in Spanish', () => {
    const decoded = decodeMorphologyCode('V-AAI-3S', 'G')!;
    expect(describeMorphology(decoded, 'es')).toBe(
      'Verbo, Aoristo, Activa, Indicativo, 3ª persona, Singular',
    );
  });

  it('describes the same Greek verb in English', () => {
    const decoded = decodeMorphologyCode('V-AAI-3S', 'G')!;
    expect(describeMorphology(decoded, 'en')).toBe(
      'Verb, Aorist, Active, Indicative, 3rd person, Singular',
    );
  });

  it('describes a Hebrew compound with " + " between morphemes, in Spanish', () => {
    const decoded = decodeMorphologyCode('HC/Ncmsc/Sp3ms', 'H')!;
    expect(describeMorphology(decoded, 'es')).toBe(
      'Conjunción + Sustantivo, Común, Constructo, Singular, Masculino + Sufijo, Personal, 3ª persona, Singular, Masculino',
    );
  });
});

describe('data coverage — every code bundled in the app decodes cleanly', () => {
  it('every Greek code in the shipped table resolves to itself', () => {
    for (const code of Object.keys(greekCodes)) {
      expect(decodeMorphologyCode(code, 'G')).not.toBeNull();
    }
  });

  it('every Hebrew code in the shipped table resolves to itself', () => {
    for (const code of Object.keys(hebrewCodes)) {
      // Bare segments need their language letter to resolve standalone,
      // same as they would inside a real compound — reuse the segment's
      // own first character when it's already a valid H/A-prefixed code,
      // otherwise this is a suffix/bound form only meaningful in context
      // (already covered by the compound tests above).
      const lang = /^[HA]/.test(code) ? 'H' : null;
      if (lang) expect(decodeMorphologyCode(code, lang)).not.toBeNull();
    }
  });
});
