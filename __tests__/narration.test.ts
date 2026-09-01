/**
 * The pure helpers behind the shared narrated-walkthrough engine (Item 4,
 * Tanda 3): language mapping, stop-text joining, and the advance/stop
 * decision at the end of a step.
 */
import {
  resolveSpeechLanguage,
  buildStopNarration,
  planNarrationAdvance,
  applySpanishPronunciationFixes,
} from '../src/lib/speech/narration';

describe('resolveSpeechLanguage', () => {
  it('maps es to es-ES and en to en-US', () => {
    expect(resolveSpeechLanguage('es')).toBe('es-ES');
    expect(resolveSpeechLanguage('en')).toBe('en-US');
  });

  it('falls back to en-US for any other value', () => {
    expect(resolveSpeechLanguage('fr')).toBe('en-US');
    expect(resolveSpeechLanguage('')).toBe('en-US');
  });
});

describe('buildStopNarration', () => {
  it('joins label and note with a period', () => {
    expect(buildStopNarration('Ramesés', 'Punto de partida')).toBe(
      'Ramesés. Punto de partida',
    );
  });

  it('drops a missing label or note instead of leaving an empty segment', () => {
    expect(buildStopNarration(undefined, 'Solo nota')).toBe('Solo nota');
    expect(buildStopNarration('Solo label', undefined)).toBe('Solo label');
  });

  it('returns an empty string when both are missing', () => {
    expect(buildStopNarration(undefined, undefined)).toBe('');
  });
});

describe('applySpanishPronunciationFixes', () => {
  it('fixes "Jacob" (English-phonetics homograph) only for Spanish narration', () => {
    const verse = 'Y dijeron: No verá JAH, Ni entenderá el Dios de Jacob.';
    expect(applySpanishPronunciationFixes(verse, 'es-ES')).toBe(
      'Y dijeron: No verá Yah, Ni entenderá el Dios de Jacób.',
    );
    // English narration passes through byte-identical, even if it somehow
    // contained the same literal words.
    expect(applySpanishPronunciationFixes(verse, 'en-US')).toBe(verse);
  });

  it('fixes "JAH" (standalone divine-name abbreviation) without touching "Jehová"', () => {
    expect(applySpanishPronunciationFixes('JAH es su nombre', 'es-ES')).toBe(
      'Yah es su nombre',
    );
    expect(
      applySpanishPronunciationFixes('Alaba, oh alma mía, a Jehová', 'es-ES'),
    ).toBe('Alaba, oh alma mía, a Jehová');
  });

  it('does NOT match "Jacobo" (James) — the nearest false-positive to "Jacob"', () => {
    expect(
      applySpanishPronunciationFixes('Jacobo, siervo de Dios', 'es-ES'),
    ).toBe('Jacobo, siervo de Dios');
  });

  it('fixes "estatutos" (Salmos 89:31 dropped-syllable case) case-insensitively', () => {
    expect(
      applySpanishPronunciationFixes(
        'Si profanaren mis estatutos, Y no guardaren mis mandamientos,',
        'es-ES',
      ),
    ).toBe('Si profanaren mis estatútos, Y no guardaren mis mandamientos,');
    expect(applySpanishPronunciationFixes('Estatutos de Jehová', 'es-ES')).toBe(
      'Estatútos de Jehová',
    );
  });

  it('does NOT touch the singular "estatuto" (never reported, weaker inference)', () => {
    expect(applySpanishPronunciationFixes('Guarda mi estatuto', 'es-ES')).toBe(
      'Guarda mi estatuto',
    );
  });

  it('title-cases ALL-CAPS divine-name / title tokens (JAH-style spell-out)', () => {
    // "JEHOVÁ" ends in the non-ASCII "Á" — its entry uses a negative
    // lookahead instead of a trailing \b (which never matches there),
    // including before a trailing period.
    expect(
      applySpanishPronunciationFixes(
        'grabadura de sello: SANTIDAD A JEHOVÁ.',
        'es-ES',
      ),
    ).toBe('grabadura de sello: Santidad A Jehová.');
    expect(
      applySpanishPronunciationFixes(
        'su causa escrita: ESTE ES JESÚS, EL REY DE LOS JUDÍOS.',
        'es-ES',
      ),
    ).toBe('su causa escrita: ESTE ES Jesús, EL REY DE LOS JUDÍOS.');
    expect(
      applySpanishPronunciationFixes(
        'el altar decía: AL DIOS NO CONOCIDO',
        'es-ES',
      ),
    ).toBe('el altar decía: AL Dios NO CONOCIDO');
    expect(
      applySpanishPronunciationFixes(
        'un Salvador, que es CRISTO el Señor',
        'es-ES',
      ),
    ).toBe('un Salvador, que es Cristo el Señor');
  });

  it('leaves the already-correct title-case divine names untouched', () => {
    const text = 'Alaba a Jehová, oh Dios; en Cristo Jesús está la santidad.';
    expect(applySpanishPronunciationFixes(text, 'es-ES')).toBe(text);
  });

  it('replaces the hyphen in transliterated compound proper nouns with a space', () => {
    expect(
      applySpanishPronunciationFixes(
        'Y llamó el nombre de aquel lugar Bet-el',
        'es-ES',
      ),
    ).toBe('Y llamó el nombre de aquel lugar Bet el');
    // multi-hyphen token: both joins handled in a single .replace() pass
    expect(
      applySpanishPronunciationFixes(
        'llama su nombre Maher-salal-hasbaz',
        'es-ES',
      ),
    ).toBe('llama su nombre Maher salal hasbaz');
    // 1:1 in length — karaoke-safe
    const v = 'Obed-edom y Quiriat-jearim';
    expect(applySpanishPronunciationFixes(v, 'es-ES').length).toBe(v.length);
    // the seed-data artifact in Nm 5:21 is not letter-"-"-letter → left alone
    expect(
      applySpanishPronunciationFixes(
        'dirá el sacerdote a la mujer)--Jehová',
        'es-ES',
      ),
    ).toBe('dirá el sacerdote a la mujer)--Jehová');
  });

  it('applies the ALL-CAPS and hyphen fixes only for Spanish narration', () => {
    const verse = 'SANTIDAD A JEHOVÁ, escrito en Bet-el';
    expect(applySpanishPronunciationFixes(verse, 'en-US')).toBe(verse);
  });

  it('is a no-op for English narration even with a matching word', () => {
    const text = 'Jacob had a dream';
    expect(applySpanishPronunciationFixes(text, 'en-US')).toBe(text);
  });

  it('applies for any Spanish-family locale tag, not just es-ES', () => {
    for (const lang of ['es', 'es-MX', 'es-419', 'es-US', 'ES-ES']) {
      expect(applySpanishPronunciationFixes('JAH', lang)).toBe('Yah');
    }
  });

  it('never changes the total character length (karaoke offset invariant)', () => {
    // Exercises every entry that changes text — JAH/Jacob/estatutos, the 5
    // ALL-CAPS tokens, and the hyphen rule — all of which are equal-length.
    const verse =
      'JAH ha escogido a Jacob para sí; si profanaren mis estatutos. ' +
      'SANTIDAD A JEHOVÁ en Bet-el; CRISTO el Señor; AL DIOS NO CONOCIDO.';
    const fixed = applySpanishPronunciationFixes(verse, 'es-ES');
    expect(fixed).not.toBe(verse);
    expect(fixed.length).toBe(verse.length);
  });
});

describe('planNarrationAdvance', () => {
  it('advances to the next index when not yet at the last step', () => {
    expect(planNarrationAdvance(0, 5)).toEqual({done: false, nextIndex: 1});
    expect(planNarrationAdvance(3, 5)).toEqual({done: false, nextIndex: 4});
  });

  it('reports done at the last step without advancing further', () => {
    expect(planNarrationAdvance(4, 5)).toEqual({done: true, nextIndex: 4});
  });

  it('reports done for a single-step or empty walkthrough', () => {
    expect(planNarrationAdvance(0, 1)).toEqual({done: true, nextIndex: 0});
    expect(planNarrationAdvance(0, 0)).toEqual({done: true, nextIndex: 0});
  });
});
