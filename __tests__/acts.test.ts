/**
 * Sprint 93 — the guided ACTS prayer content. Validates every scripture anchor
 * against the canonical book table (a typo fails CI rather than shipping a dead
 * verse) and pins the deterministic-by-day anchor rotation.
 */
import {
  ACTS_STEPS,
  ACTS_STEP_ORDER,
  actsStepOrder,
  buildActsSession,
} from '../src/features/prayer/acts';
import {parseThemeRef} from '../src/features/study/themes';
import {getBookByName} from '../src/constants/bible';

describe('ACTS anchors resolve to canonical books in range', () => {
  it('every anchor parses to a real book + chapter', () => {
    const bad: string[] = [];
    for (const step of ACTS_STEP_ORDER) {
      for (const ref of ACTS_STEPS[step].anchors) {
        const parsed = parseThemeRef(ref);
        if (!parsed) {
          bad.push(`${step}: unparseable "${ref}"`);
          continue;
        }
        const book = getBookByName(parsed.book);
        if (!book) {
          bad.push(`${step}: unknown book "${parsed.book}" in "${ref}"`);
          continue;
        }
        if (book.nameEn !== parsed.book) {
          bad.push(
            `${step}: non-canonical book "${parsed.book}" (expected "${book.nameEn}")`,
          );
        }
        if (parsed.chapter < 1 || parsed.chapter > book.chapters) {
          bad.push(
            `${step}: chapter ${parsed.chapter} out of range for ${book.nameEn}`,
          );
        }
      }
    }
    expect(bad).toEqual([]);
  });

  it('each step maps to a distinct accent + a category', () => {
    const accents = ACTS_STEP_ORDER.map(s => ACTS_STEPS[s].accent);
    expect(new Set(accents).size).toBe(ACTS_STEP_ORDER.length);
    for (const s of ACTS_STEP_ORDER) {
      expect(ACTS_STEPS[s].category).toBeTruthy();
      expect(ACTS_STEPS[s].anchors.length).toBeGreaterThan(0);
    }
  });
});

describe('buildActsSession', () => {
  it('returns the four steps in fixed order, each with a valid anchor', () => {
    const session = buildActsSession(new Date(2026, 5, 15));
    expect(session.map(s => s.step)).toEqual([
      'adoration',
      'confession',
      'thanksgiving',
      'supplication',
    ]);
    for (const s of session) {
      expect(ACTS_STEPS[s.step].anchors).toContain(s.anchor);
    }
  });

  it('is deterministic for a given day', () => {
    const a = buildActsSession(new Date(2026, 5, 15));
    const b = buildActsSession(new Date(2026, 5, 15));
    expect(a.map(s => s.anchor)).toEqual(b.map(s => s.anchor));
  });

  it('rotates anchors across days (not frozen)', () => {
    const day1 = buildActsSession(new Date(2026, 0, 1)).map(s => s.anchor);
    const day2 = buildActsSession(new Date(2026, 0, 2)).map(s => s.anchor);
    // At least one step should advance to a different anchor.
    expect(day1).not.toEqual(day2);
  });
});

describe('flexible start (Adoration vs Confession)', () => {
  it('defaults to Adoration-first (the ACTS order)', () => {
    expect(actsStepOrder()).toEqual(ACTS_STEP_ORDER);
    expect(buildActsSession(new Date(2026, 5, 15)).map(s => s.step)).toEqual([
      'adoration',
      'confession',
      'thanksgiving',
      'supplication',
    ]);
  });

  it('swaps only the first two movements when starting with Confession', () => {
    expect(actsStepOrder('confession')).toEqual([
      'confession',
      'adoration',
      'thanksgiving',
      'supplication',
    ]);
    expect(
      buildActsSession(new Date(2026, 5, 15), 'confession').map(s => s.step),
    ).toEqual(['confession', 'adoration', 'thanksgiving', 'supplication']);
  });

  it('keeps each movement its own day-anchor regardless of the start choice', () => {
    const day = new Date(2026, 5, 15);
    const a = buildActsSession(day, 'adoration');
    const c = buildActsSession(day, 'confession');
    const anchorOf = (
      session: ReturnType<typeof buildActsSession>,
      step: string,
    ) => session.find(s => s.step === step)?.anchor;
    for (const step of ACTS_STEP_ORDER) {
      expect(anchorOf(a, step)).toBe(anchorOf(c, step));
    }
  });
});
