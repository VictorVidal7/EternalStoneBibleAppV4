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
  it('fixes "JAH"→"Yah" and splits "Jacob"→"Ja cob" (so the es-ES voice says "ha-KOB", not "Yacob")', () => {
    const verse = 'Y dijeron: No verá JAH, Ni entenderá el Dios de Jacob.';
    expect(applySpanishPronunciationFixes(verse, 'es-ES')).toBe(
      'Y dijeron: No verá Yah, Ni entenderá el Dios de Ja cob.',
    );
    // English narration passes through byte-identical.
    expect(applySpanishPronunciationFixes(verse, 'en-US')).toBe(verse);
  });

  it('does NOT split "Jacobo" (Santiago/James) — the nearest false-positive', () => {
    expect(
      applySpanishPronunciationFixes(
        'Jacobo, siervo de Dios y del Señor',
        'es-ES',
      ),
    ).toBe('Jacobo, siervo de Dios y del Señor');
  });

  it('fixes "JAH" (standalone divine-name abbreviation) without touching "Jehová"', () => {
    expect(applySpanishPronunciationFixes('JAH es su nombre', 'es-ES')).toBe(
      'Yah es su nombre',
    );
    expect(
      applySpanishPronunciationFixes('Alaba, oh alma mía, a Jehová', 'es-ES'),
    ).toBe('Alaba, oh alma mía, a Jehová');
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
    // exactly 1:1 in length — karaoke-safe
    const v = 'Obed-edom y Quiriat-jearim';
    expect(applySpanishPronunciationFixes(v, 'es-ES').length).toBe(v.length);
  });

  it('leaves a non-letter-hyphen-letter sequence (seed-data artifact) alone', () => {
    // Nm 5:21 "…dirá el sacerdote a la mujer)--Jehová…" — ")" and "-" before
    // the "-" are not \p{L}, so the rule does not fire.
    expect(
      applySpanishPronunciationFixes(
        'dirá el sacerdote a la mujer)--Jehová te dé',
        'es-ES',
      ),
    ).toBe('dirá el sacerdote a la mujer)--Jehová te dé');
  });

  it('does not apply the hyphen fix to English narration', () => {
    expect(
      applySpanishPronunciationFixes('the altar at Beth-el', 'en-US'),
    ).toBe('the altar at Beth-el');
  });

  it('is a no-op for English narration even with a matching word', () => {
    const text = 'JAH is his name and his estatutos endure';
    expect(applySpanishPronunciationFixes(text, 'en-US')).toBe(text);
  });

  it('applies for any Spanish-family locale tag, not just es-ES', () => {
    for (const lang of ['es', 'es-MX', 'es-419', 'es-US', 'ES-ES']) {
      expect(applySpanishPronunciationFixes('JAH', lang)).toBe('Yah');
    }
  });

  it('is length-preserving for every entry EXCEPT the deliberate "Jacob"→"Ja cob" (+1)', () => {
    // No "Jacob": length is exactly preserved (JAH→Yah, estatutos→estatútos).
    const noJacob = 'JAH exaltó sus estatutos sobre todo pueblo de la tierra.';
    const fixedNoJacob = applySpanishPronunciationFixes(noJacob, 'es-ES');
    expect(fixedNoJacob).not.toBe(noJacob);
    expect(fixedNoJacob.length).toBe(noJacob.length);

    // With "Jacob": exactly +1 per occurrence, and nothing else drifts.
    const withJacob = 'JAH ha escogido a Jacob, y a Jacob dio sus estatutos.';
    const fixedWithJacob = applySpanishPronunciationFixes(withJacob, 'es-ES');
    expect(fixedWithJacob).toContain('Ja cob');
    expect(fixedWithJacob.length).toBe(withJacob.length + 2); // "Jacob" ×2
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
