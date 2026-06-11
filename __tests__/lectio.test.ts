/**
 * Sprint 79 — lectio: the pure model behind the guided Lectio Divina session.
 * Pins the step sequence, the deterministic meditation-prompt pick, the
 * countdown formatting, the append-only prayer-note composition, and the
 * i18n completeness of prompts/labels in both languages.
 */
import {
  LECTIO_STEPS,
  MEDITATION_PROMPT_COUNT,
  CONTEMPLATION_OPTIONS_SEC,
  meditationPromptIndex,
  formatCountdown,
  buildLectioPrayerBlock,
  composeNoteWithPrayer,
} from '../src/features/study/lectio';
import {translations} from '../src/i18n/translations';

describe('lectio steps', () => {
  it('walks the four classic movements in order', () => {
    expect(LECTIO_STEPS).toEqual([
      'lectio',
      'meditatio',
      'oratio',
      'contemplatio',
    ]);
  });

  it('offers gentle contemplation lengths', () => {
    expect(CONTEMPLATION_OPTIONS_SEC).toEqual([60, 120, 180]);
  });
});

describe('meditationPromptIndex', () => {
  it('is deterministic for the same passage + day', () => {
    const a = meditationPromptIndex('Psalms:23:1', '2026-06-11');
    const b = meditationPromptIndex('Psalms:23:1', '2026-06-11');
    expect(a).toBe(b);
  });

  it('stays within the prompt count', () => {
    for (let day = 1; day <= 28; day++) {
      const idx = meditationPromptIndex(
        'John:3:16',
        `2026-06-${String(day).padStart(2, '0')}`,
      );
      expect(idx).toBeGreaterThanOrEqual(0);
      expect(idx).toBeLessThan(MEDITATION_PROMPT_COUNT);
    }
  });

  it('rotates across days and passages', () => {
    const indices = new Set<number>();
    for (let day = 1; day <= 28; day++) {
      indices.add(
        meditationPromptIndex(
          'John:3:16',
          `2026-06-${String(day).padStart(2, '0')}`,
        ),
      );
    }
    expect(indices.size).toBeGreaterThan(1);
  });

  it('returns 0 for a non-positive count', () => {
    expect(meditationPromptIndex('x', 'y', 0)).toBe(0);
  });
});

describe('formatCountdown', () => {
  it('formats mm:ss with padded seconds', () => {
    expect(formatCountdown(180)).toBe('3:00');
    expect(formatCountdown(90)).toBe('1:30');
    expect(formatCountdown(5)).toBe('0:05');
  });

  it('clamps below zero', () => {
    expect(formatCountdown(-3)).toBe('0:00');
  });
});

describe('prayer-note composition', () => {
  it('builds a dated prayer block, trimming the prayer', () => {
    expect(buildLectioPrayerBlock('  Gracias, Padre.  ', '11 jun 2026')).toBe(
      '🙏 Lectio Divina — 11 jun 2026\nGracias, Padre.',
    );
  });

  it('appends to an existing note instead of clobbering it', () => {
    const block = buildLectioPrayerBlock('Amén.', 'hoy');
    expect(composeNoteWithPrayer('Mi reflexión previa.', block)).toBe(
      `Mi reflexión previa.\n\n${block}`,
    );
  });

  it('stands alone when there is no existing note', () => {
    const block = buildLectioPrayerBlock('Amén.', 'hoy');
    expect(composeNoteWithPrayer(null, block)).toBe(block);
    expect(composeNoteWithPrayer('   ', block)).toBe(block);
  });
});

describe('i18n completeness', () => {
  it.each(['es', 'en'] as const)(
    'ships %s prompts for every deterministic index + all step copy',
    lang => {
      const lectio = translations[lang].lectio;
      expect(lectio.meditationPrompts).toHaveLength(MEDITATION_PROMPT_COUNT);
      for (const step of LECTIO_STEPS) {
        expect(lectio.stepLabels[step]).toBeTruthy();
        expect(lectio.stepIntros[step]).toBeTruthy();
      }
    },
  );
});
