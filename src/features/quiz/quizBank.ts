/**
 * ✝️ quizBank — the curated "Quiz bíblico" question catalog (T18, deep-audit
 * #22-adjacent "features nuevas" item).
 *
 * 24 questions across 4 types: who-said-it (a direct quote → who said it),
 * complete-verse (a verse with one word blanked), ref-to-content (a
 * reference → its exact text, wrong options are always OTHER real verses
 * from this same bank, never fabricated), and event-order (which of 4
 * events happened first, restricted to macro-eras with no academic
 * chronology dispute — creation → patriarchs → exodus → monarchy → the
 * stages of Christ's earthly life, in that order).
 *
 * Wording + every distractor were reviewed with Victor (2026-07-07) before
 * any UI was built, per the plan's explicit T18 gate. `refKey` is a
 * canonical "EnglishBook/Chapter/Verse" key (same convention as
 * [[messianicProphecies]]'s `ProphecyRefKey`), validated by the accompanying
 * test against the book table; for `complete-verse`/`ref-to-content`, the
 * test also asserts the quoted es/en text is an EXACT match of the bundled
 * RVR1960/WEB verse — not just that the reference resolves.
 *
 * Question/option prose lives in i18n (`t.quiz.bank[id]`), mirroring
 * [[kidsQuiz]]'s `t.kids.stories[id].quiz[qId]` pattern — this module only
 * holds structure + which option is correct.
 *
 * Deliberately RVR1960/WEB, not RVR1960/KJV as the plan's own text said: KJV
 * isn't a bundled version (`bundled: false` in `constants/bible.ts`) — using
 * it would break the English quiz for anyone who hasn't downloaded that
 * pack. WEB is bundled and already the app's default English version.
 *
 * Pure module — no React/RN/DB import, mirrors [[messianicProphecies]] /
 * [[kidsQuiz]].
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

export type QuizQuestionType =
  | 'who-said-it'
  | 'complete-verse'
  | 'ref-to-content'
  | 'event-order';

export interface QuizQuestionSpec {
  /** Stable id — also the i18n key `t.quiz.bank[id]`. */
  id: string;
  type: QuizQuestionType;
  /**
   * Canonical "EnglishBook/Chapter/Verse" this question is grounded in. For
   * `event-order`, a representative supporting reference for the CORRECT
   * option (the test still checks it resolves; the other 3 options are
   * prose-only event names, not separately keyed).
   */
  refKey: string;
  /** 0-based index into the i18n `options` array marking the correct choice. */
  correctIndex: number;
}

export const QUIZ_BANK: readonly QuizQuestionSpec[] = [
  // ── ¿Quién lo dijo? ──────────────────────────────────────────────────
  {id: 'who-01', type: 'who-said-it', refKey: 'Genesis/1/3', correctIndex: 0},
  {id: 'who-02', type: 'who-said-it', refKey: 'Luke/1/38', correctIndex: 0},
  {id: 'who-03', type: 'who-said-it', refKey: 'Genesis/4/9', correctIndex: 0},
  {
    id: 'who-04',
    type: 'who-said-it',
    refKey: 'Philippians/4/13',
    correctIndex: 0,
  },
  {id: 'who-05', type: 'who-said-it', refKey: 'John/8/11', correctIndex: 0},
  {id: 'who-06', type: 'who-said-it', refKey: 'Psalms/23/1', correctIndex: 0},

  // ── Completa el versículo ────────────────────────────────────────────
  {
    id: 'complete-01',
    type: 'complete-verse',
    refKey: 'John/3/16',
    correctIndex: 0,
  },
  {
    id: 'complete-02',
    type: 'complete-verse',
    refKey: 'Psalms/23/1',
    correctIndex: 0,
  },
  {
    id: 'complete-03',
    type: 'complete-verse',
    refKey: 'Genesis/1/1',
    correctIndex: 0,
  },
  {
    id: 'complete-04',
    type: 'complete-verse',
    refKey: 'Philippians/4/13',
    correctIndex: 0,
  },
  {
    id: 'complete-05',
    type: 'complete-verse',
    refKey: 'Matthew/6/33',
    correctIndex: 0,
  },
  {
    id: 'complete-06',
    type: 'complete-verse',
    refKey: 'Psalms/27/1',
    correctIndex: 0,
  },

  // ── Referencia → contenido ───────────────────────────────────────────
  {
    id: 'refcontent-01',
    type: 'ref-to-content',
    refKey: 'John/3/16',
    correctIndex: 0,
  },
  {
    id: 'refcontent-02',
    type: 'ref-to-content',
    refKey: 'Psalms/23/1',
    correctIndex: 0,
  },
  {
    id: 'refcontent-03',
    type: 'ref-to-content',
    refKey: 'Genesis/1/1',
    correctIndex: 0,
  },
  {
    id: 'refcontent-04',
    type: 'ref-to-content',
    refKey: 'Romans/3/23',
    correctIndex: 0,
  },
  {
    id: 'refcontent-05',
    type: 'ref-to-content',
    refKey: 'Philippians/4/13',
    correctIndex: 0,
  },
  {
    id: 'refcontent-06',
    type: 'ref-to-content',
    refKey: 'Matthew/28/19',
    correctIndex: 0,
  },

  // ── Orden de eventos ─────────────────────────────────────────────────
  {
    id: 'order-01',
    type: 'event-order',
    refKey: 'Genesis/1/1',
    correctIndex: 0,
  },
  {
    id: 'order-02',
    type: 'event-order',
    refKey: 'Genesis/12/1',
    correctIndex: 0,
  },
  {
    id: 'order-03',
    type: 'event-order',
    refKey: 'Exodus/14/21',
    correctIndex: 0,
  },
  {
    id: 'order-04',
    type: 'event-order',
    refKey: '2 Samuel/5/3',
    correctIndex: 0,
  },
  {id: 'order-05', type: 'event-order', refKey: 'Luke/2/7', correctIndex: 0},
  {
    id: 'order-06',
    type: 'event-order',
    refKey: 'Matthew/3/16',
    correctIndex: 0,
  },
];

/** Total questions in the bank — kept in sync with the array above. */
export const QUIZ_BANK_COUNT = QUIZ_BANK.length;
