/**
 * The "Quiz bíblico" bank (T18) — every reference must resolve to a real
 * canonical verse-in-range, AND (unlike a plain reference check) every
 * quoted/blanked verse text must match the bundled RVR1960/WEB text
 * EXACTLY, not just approximately — a typo here would ship a wrong
 * "correct" answer. `ref-to-content` distractors are checked too: they must
 * each be a real verse from elsewhere in the bank, never fabricated.
 */
import {QUIZ_BANK} from '../src/features/quiz/quizBank';
import {parseChristRef} from '../src/features/study/christConnections';
import {getBookByName} from '../src/constants/bible';
import {translations} from '../src/i18n/translations';
import {RVR1960_DATA} from '../src/lib/database/bible-data-rvr1960';
import {WEB_DATA} from '../src/lib/database/bible-data-web';

type AnyRecord = Record<string, unknown>;
type BankText = {question: string; options: string[]};

const esBank = ((translations.es as AnyRecord).quiz as AnyRecord)
  .bank as Record<string, BankText>;
const enBank = ((translations.en as AnyRecord).quiz as AnyRecord)
  .bank as Record<string, BankText>;

/** Verse-text lookup by "BookName|chapter|verse", built once per version. */
function buildVerseIndex(
  rows: readonly {
    book_name: string;
    chapter: number;
    verse: number;
    text: string;
  }[],
): Map<string, string> {
  const index = new Map<string, string>();
  for (const r of rows) {
    index.set(`${r.book_name}|${r.chapter}|${r.verse}`, r.text);
  }
  return index;
}

const rvrIndex = buildVerseIndex(RVR1960_DATA);
const webIndex = buildVerseIndex(WEB_DATA);

/** Resolves a canonical "EnglishBook/Chapter/Verse" refKey to {es, en} DB text. */
function resolveVerseText(
  refKey: string,
): {esText: string | undefined; enText: string | undefined} | null {
  const parsed = parseChristRef(refKey);
  if (!parsed) return null;
  const book = getBookByName(parsed.book);
  if (!book) return null;
  return {
    esText: rvrIndex.get(`${book.name}|${parsed.chapter}|${parsed.verse}`),
    enText: webIndex.get(`${book.nameEn}|${parsed.chapter}|${parsed.verse}`),
  };
}

const checkRef = (label: string, refKey: string, bad: string[]) => {
  const parsed = parseChristRef(refKey);
  if (!parsed) {
    bad.push(`${label}: unparseable "${refKey}"`);
    return;
  }
  const book = getBookByName(parsed.book);
  if (!book) {
    bad.push(`${label}: unknown book "${parsed.book}" in "${refKey}"`);
    return;
  }
  if (book.nameEn !== parsed.book) {
    bad.push(`${label}: non-canonical book "${parsed.book}"`);
  }
  if (parsed.chapter < 1 || parsed.chapter > book.chapters) {
    bad.push(`${label}: chapter ${parsed.chapter} out of range for ${refKey}`);
  }
};

/** Strips leading "…"/quote punctuation and trailing sentence punctuation
 *  so a UI-formatted excerpt can be compared against raw DB verse text. */
function normalizeExcerpt(s: string): string {
  return s
    .replace(/^[…"«]+/, '')
    .replace(/[."»,;:]+$/, '')
    .trim();
}

/** Pulls the text between the first and last quote-like delimiter in a
 *  prompt string (handles «…» for es and "…" for en). */
function extractQuoted(prompt: string): string | null {
  const guillemet = prompt.match(/«([^»]+)»/);
  if (guillemet) return guillemet[1];
  const firstQuote = prompt.indexOf('"');
  const lastQuote = prompt.lastIndexOf('"');
  if (firstQuote >= 0 && lastQuote > firstQuote) {
    return prompt.slice(firstQuote + 1, lastQuote);
  }
  return null;
}

describe('QUIZ_BANK — catalog shape', () => {
  it('has 24 questions, 6 per type', () => {
    expect(QUIZ_BANK.length).toBe(24);
    const byType = new Map<string, number>();
    for (const q of QUIZ_BANK)
      byType.set(q.type, (byType.get(q.type) ?? 0) + 1);
    expect(byType.get('who-said-it')).toBe(6);
    expect(byType.get('complete-verse')).toBe(6);
    expect(byType.get('ref-to-content')).toBe(6);
    expect(byType.get('event-order')).toBe(6);
  });

  it('has unique ids', () => {
    const ids = QUIZ_BANK.map(q => q.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('correctIndex is always a valid 0-3 index (4 options per question)', () => {
    for (const q of QUIZ_BANK) {
      expect(q.correctIndex).toBeGreaterThanOrEqual(0);
      expect(q.correctIndex).toBeLessThan(4);
    }
  });
});

describe('QUIZ_BANK — every refKey is a real, in-range verse', () => {
  it('resolves for all 24 questions', () => {
    const bad: string[] = [];
    for (const q of QUIZ_BANK) checkRef(q.id, q.refKey, bad);
    expect(bad).toEqual([]);
  });
});

describe('QUIZ_BANK — i18n parity (es + en)', () => {
  it('every question has an es AND en bank entry with 4 options', () => {
    const bad: string[] = [];
    for (const q of QUIZ_BANK) {
      for (const [lang, bank] of [
        ['es', esBank],
        ['en', enBank],
      ] as const) {
        const entry = bank[q.id];
        if (!entry) {
          bad.push(`${lang}: missing bank entry for ${q.id}`);
          continue;
        }
        if (typeof entry.question !== 'string' || !entry.question.trim()) {
          bad.push(`${lang}: ${q.id} missing question text`);
        }
        if (!Array.isArray(entry.options) || entry.options.length !== 4) {
          bad.push(`${lang}: ${q.id} does not have exactly 4 options`);
        }
      }
    }
    expect(bad).toEqual([]);
  });

  it('has no orphan bank entries (every keyed id is in the catalog)', () => {
    const ids = new Set(QUIZ_BANK.map(q => q.id));
    for (const key of Object.keys(esBank)) expect(ids.has(key)).toBe(true);
    for (const key of Object.keys(enBank)) expect(ids.has(key)).toBe(true);
  });
});

describe('QUIZ_BANK — who-said-it quotes are verbatim DB text', () => {
  const questions = QUIZ_BANK.filter(q => q.type === 'who-said-it');

  it('every quoted line is an exact substring of the real RVR1960/WEB verse', () => {
    const bad: string[] = [];
    for (const q of questions) {
      const resolved = resolveVerseText(q.refKey);
      if (!resolved) {
        bad.push(`${q.id}: could not resolve ${q.refKey}`);
        continue;
      }
      const esQuote = extractQuoted(esBank[q.id].question);
      const enQuote = extractQuoted(enBank[q.id].question);
      if (!esQuote) bad.push(`${q.id}: no «quote» found in es question`);
      if (!enQuote) bad.push(`${q.id}: no "quote" found in en question`);
      if (esQuote && (!resolved.esText || !resolved.esText.includes(esQuote))) {
        bad.push(
          `${q.id} (es): "${esQuote}" not found in RVR1960 ${q.refKey} → "${resolved.esText}"`,
        );
      }
      if (enQuote && (!resolved.enText || !resolved.enText.includes(enQuote))) {
        bad.push(
          `${q.id} (en): "${enQuote}" not found in WEB ${q.refKey} → "${resolved.enText}"`,
        );
      }
    }
    expect(bad).toEqual([]);
  });
});

describe('QUIZ_BANK — complete-verse blanks resolve to verbatim DB text', () => {
  const questions = QUIZ_BANK.filter(q => q.type === 'complete-verse');

  it('filling the blank with the correct option reproduces real verse text', () => {
    const bad: string[] = [];
    for (const q of questions) {
      const resolved = resolveVerseText(q.refKey);
      if (!resolved) {
        bad.push(`${q.id}: could not resolve ${q.refKey}`);
        continue;
      }
      for (const [lang, bank, dbText] of [
        ['es', esBank, resolved.esText],
        ['en', enBank, resolved.enText],
      ] as const) {
        const entry = bank[q.id];
        const template = extractQuoted(entry.question);
        if (!template) {
          bad.push(`${lang}: ${q.id} has no quoted template`);
          continue;
        }
        const correctOption = entry.options[q.correctIndex];
        const filled = normalizeExcerpt(template.replace('___', correctOption));
        if (!dbText || !dbText.includes(filled)) {
          bad.push(
            `${lang}: ${q.id} filled "${filled}" not found in ${q.refKey} → "${dbText}"`,
          );
        }
      }
    }
    expect(bad).toEqual([]);
  });
});

describe('QUIZ_BANK — ref-to-content options are all real verses', () => {
  const questions = QUIZ_BANK.filter(q => q.type === 'ref-to-content');

  it("each question's correct option is an exact match of its own reference", () => {
    const bad: string[] = [];
    for (const q of questions) {
      const resolved = resolveVerseText(q.refKey);
      if (!resolved) {
        bad.push(`${q.id}: could not resolve ${q.refKey}`);
        continue;
      }
      const esCorrect = esBank[q.id].options[q.correctIndex];
      const enCorrect = enBank[q.id].options[q.correctIndex];
      if (esCorrect !== resolved.esText) {
        bad.push(
          `${q.id} (es): correct option "${esCorrect}" !== RVR1960 text "${resolved.esText}"`,
        );
      }
      if (enCorrect !== resolved.enText) {
        bad.push(
          `${q.id} (en): correct option "${enCorrect}" !== WEB text "${resolved.enText}"`,
        );
      }
    }
    expect(bad).toEqual([]);
  });

  it('every distractor is a genuine verse quoted elsewhere in the bank, never fabricated', () => {
    // The pool of "known real quotes" this bank draws from: every unique
    // refKey used by who-said-it / complete-verse / ref-to-content questions.
    const quotedRefs = new Set(
      QUIZ_BANK.filter(q => q.type !== 'event-order').map(q => q.refKey),
    );
    const esPool = new Set<string>();
    const enPool = new Set<string>();
    for (const refKey of quotedRefs) {
      const resolved = resolveVerseText(refKey);
      if (resolved?.esText) esPool.add(resolved.esText);
      if (resolved?.enText) enPool.add(resolved.enText);
    }

    const bad: string[] = [];
    for (const q of questions) {
      const esOptions = esBank[q.id].options;
      const enOptions = enBank[q.id].options;
      esOptions.forEach((opt, i) => {
        if (i === q.correctIndex) return;
        if (!esPool.has(opt)) {
          bad.push(
            `${q.id} (es) option ${i}: "${opt}" is not a real bank verse`,
          );
        }
      });
      enOptions.forEach((opt, i) => {
        if (i === q.correctIndex) return;
        if (!enPool.has(opt)) {
          bad.push(
            `${q.id} (en) option ${i}: "${opt}" is not a real bank verse`,
          );
        }
      });
    }
    expect(bad).toEqual([]);
  });

  it('no question repeats its own correct verse as a distractor', () => {
    for (const q of questions) {
      const esOptions = esBank[q.id].options;
      const enOptions = enBank[q.id].options;
      const esCorrect = esOptions[q.correctIndex];
      const enCorrect = enOptions[q.correctIndex];
      expect(esOptions.filter((o: string) => o === esCorrect).length).toBe(1);
      expect(enOptions.filter((o: string) => o === enCorrect).length).toBe(1);
    }
  });
});

describe('QUIZ_BANK — event-order chronology has exactly one earliest option', () => {
  // Representative refs for each event name used across the 6 order-* questions,
  // independent of QUIZ_BANK's own refKey (which only tags the correct answer) —
  // this cross-checks the AUTHORED chronology itself, not just one ref per question.
  const ERA_RANK: Record<string, number> = {
    'La creación del mundo': 0,
    'The creation of the world': 0,
    'El llamado de Abraham': 1,
    'The calling of Abraham': 1,
    'El éxodo de Egipto': 2,
    'The exodus from Egypt': 2,
    'El reinado de David': 3,
    'The reign of David': 3,
    'El nacimiento de Jesús': 4,
    'The birth of Jesus': 4,
    'El bautismo de Jesús': 5,
    'The baptism of Jesus': 5,
    'La Última Cena': 6,
    'The Last Supper': 6,
    'La crucifixión de Jesús': 7,
    'The crucifixion of Jesus': 7,
    'La resurrección de Jesús': 7.5,
    'The resurrection of Jesus': 7.5,
    Pentecostés: 8,
    Pentecost: 8,
  };

  const questions = QUIZ_BANK.filter(q => q.type === 'event-order');

  it('the marked correct option is strictly earlier than the other 3, in both languages', () => {
    const bad: string[] = [];
    for (const q of questions) {
      for (const [lang, bank] of [
        ['es', esBank],
        ['en', enBank],
      ] as const) {
        const options: string[] = bank[q.id].options;
        const ranks = options.map(o => {
          const r = ERA_RANK[o];
          if (r === undefined)
            bad.push(`${lang}: ${q.id} unknown event "${o}"`);
          return r ?? Infinity;
        });
        const correctRank = ranks[q.correctIndex];
        const minRank = Math.min(...ranks);
        if (correctRank !== minRank) {
          bad.push(
            `${lang}: ${q.id} marked option is not the earliest (${options[q.correctIndex]})`,
          );
        }
        // Exactly one option should tie for earliest.
        if (ranks.filter(r => r === minRank).length !== 1) {
          bad.push(
            `${lang}: ${q.id} has an ambiguous "first" (tie at rank ${minRank})`,
          );
        }
      }
    }
    expect(bad).toEqual([]);
  });
});
