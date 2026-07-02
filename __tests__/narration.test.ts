/**
 * The pure helpers behind the shared narrated-walkthrough engine (Item 4,
 * Tanda 3): language mapping, stop-text joining, and the advance/stop
 * decision at the end of a step.
 */
import {
  resolveSpeechLanguage,
  buildStopNarration,
  planNarrationAdvance,
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
