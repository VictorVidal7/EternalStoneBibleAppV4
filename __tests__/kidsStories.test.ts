/**
 * The "Biblia para niños" story catalog — every scene/quiz reference must
 * resolve to a real canonical verse-in-range (a typo fails CI rather than
 * shipping a dead scene), ids are unique, every story has exactly 3 quiz
 * questions with a valid correctIndex, every ref belongs to its story's
 * declared passage range, and every story/scene/question has an es/en label.
 */
import {
  KIDS_STORIES,
  KIDS_STORY_ORDER,
  KIDS_STORY_ICON,
  KIDS_STORY_PALETTE,
  getKidsStory,
  type KidsStoryId,
} from '../src/features/kids/kidsStories';
import {parseChristRef} from '../src/features/study/christConnections';
import {getBookByName} from '../src/constants/bible';
import {translations} from '../src/i18n/translations';
import {ACHIEVEMENT_DEFINITIONS} from '../src/lib/achievements/definitions';

type AnyRecord = Record<string, unknown>;
const esK = (translations.es as AnyRecord).kids as AnyRecord;
const enK = (translations.en as AnyRecord).kids as AnyRecord;
const esStories = esK?.stories as Record<string, AnyRecord>;
const enStories = enK?.stories as Record<string, AnyRecord>;

describe('kidsStories — catalog shape', () => {
  it('ships at least 10 stories with several scenes each', () => {
    expect(KIDS_STORIES.length).toBeGreaterThanOrEqual(10);
    for (const s of KIDS_STORIES) {
      expect(s.scenes.length).toBeGreaterThanOrEqual(4);
    }
  });

  it('has unique story ids', () => {
    const ids = KIDS_STORIES.map(s => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('has unique scene ids across the whole catalog', () => {
    const ids = KIDS_STORIES.flatMap(s => s.scenes.map(sc => sc.id));
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('has unique quiz question ids across the whole catalog', () => {
    const ids = KIDS_STORIES.flatMap(s => s.quiz.map(q => q.id));
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('covers every story in KIDS_STORY_ORDER exactly once', () => {
    const ids = KIDS_STORIES.map(s => s.id);
    expect(new Set(KIDS_STORY_ORDER).size).toBe(KIDS_STORY_ORDER.length);
    expect([...ids].sort()).toEqual([...KIDS_STORY_ORDER].sort());
  });

  it('every story has an icon and a palette with hex colors', () => {
    for (const id of KIDS_STORY_ORDER) {
      expect(KIDS_STORY_ICON[id]).toBeTruthy();
      expect(KIDS_STORY_PALETTE[id].accent).toMatch(/^#/);
      expect(KIDS_STORY_PALETTE[id].gradient[0]).toMatch(/^#/);
      expect(KIDS_STORY_PALETTE[id].gradient[1]).toMatch(/^#/);
    }
  });

  it('every scene has 1-3 refs', () => {
    for (const s of KIDS_STORIES) {
      for (const scene of s.scenes) {
        expect(scene.refs.length).toBeGreaterThan(0);
        expect(scene.refs.length).toBeLessThanOrEqual(3);
      }
    }
  });

  it('every story has exactly 3 quiz questions with a valid correctIndex', () => {
    for (const s of KIDS_STORIES) {
      expect(s.quiz.length).toBe(3);
      for (const q of s.quiz) {
        expect(q.correctIndex).toBeGreaterThanOrEqual(0);
        expect(q.correctIndex).toBeLessThan(3);
      }
    }
  });
});

describe('kidsStories — every reference is real and in range', () => {
  it('resolves every scene ref to a canonical, in-range verse', () => {
    const bad: string[] = [];
    for (const s of KIDS_STORIES) {
      for (const scene of s.scenes) {
        for (const ref of scene.refs) {
          const parsed = parseChristRef(ref);
          if (!parsed) {
            bad.push(`${scene.id}: unparseable "${ref}"`);
            continue;
          }
          const book = getBookByName(parsed.book);
          if (!book) {
            bad.push(`${scene.id}: unknown book "${parsed.book}"`);
            continue;
          }
          if (book.nameEn !== parsed.book) {
            bad.push(`${scene.id}: non-canonical book "${parsed.book}"`);
          }
          if (parsed.chapter < 1 || parsed.chapter > book.chapters) {
            bad.push(`${scene.id}: chapter ${parsed.chapter} out of range`);
          }
        }
      }
    }
    expect(bad).toEqual([]);
  });

  it('resolves every quiz ref to a canonical, in-range verse', () => {
    const bad: string[] = [];
    for (const s of KIDS_STORIES) {
      for (const q of s.quiz) {
        const parsed = parseChristRef(q.ref);
        if (!parsed) {
          bad.push(`${q.id}: unparseable "${q.ref}"`);
          continue;
        }
        const book = getBookByName(parsed.book);
        if (!book) {
          bad.push(`${q.id}: unknown book "${parsed.book}"`);
          continue;
        }
        if (book.nameEn !== parsed.book) {
          bad.push(`${q.id}: non-canonical book "${parsed.book}"`);
        }
        if (parsed.chapter < 1 || parsed.chapter > book.chapters) {
          bad.push(`${q.id}: chapter ${parsed.chapter} out of range`);
        }
      }
    }
    expect(bad).toEqual([]);
  });

  it('keeps every scene + quiz ref inside its story’s declared passage', () => {
    const bad: string[] = [];
    for (const s of KIDS_STORIES) {
      const allRefs = [
        ...s.scenes.flatMap(sc => sc.refs.map(r => ({id: sc.id, ref: r}))),
        ...s.quiz.map(q => ({id: q.id, ref: q.ref})),
      ];
      for (const {id, ref} of allRefs) {
        const parsed = parseChristRef(ref);
        if (!parsed) continue;
        if (parsed.book !== s.passage.book) {
          bad.push(
            `${id}: book "${parsed.book}" != passage "${s.passage.book}"`,
          );
        }
        if (
          parsed.chapter < s.passage.chapterStart ||
          parsed.chapter > s.passage.chapterEnd
        ) {
          bad.push(
            `${id}: chapter ${parsed.chapter} outside passage ${s.passage.chapterStart}-${s.passage.chapterEnd}`,
          );
        }
      }
    }
    expect(bad).toEqual([]);
  });

  it('keeps scenes in non-decreasing canonical order within a story', () => {
    const bad: string[] = [];
    for (const s of KIDS_STORIES) {
      let prev: {chapter: number; verse: number} | null = null;
      for (const scene of s.scenes) {
        const first = parseChristRef(scene.refs[0]);
        if (!first) continue;
        if (
          prev &&
          (first.chapter < prev.chapter ||
            (first.chapter === prev.chapter && first.verse < prev.verse))
        ) {
          bad.push(`${scene.id}: goes backward from previous scene`);
        }
        const last = parseChristRef(scene.refs[scene.refs.length - 1]);
        prev = last ?? first;
      }
    }
    expect(bad).toEqual([]);
  });
});

describe('kidsStories — i18n parity', () => {
  it('has hub/detail/quiz UI strings in both languages', () => {
    const uiKeys = [
      'cardTitle',
      'cardSubtitle',
      'title',
      'subtitle',
      'intro',
      'listen',
      'showVerse',
      'hideVerse',
      'missingVerse',
      'next',
      'previous',
      'stopListening',
      'listenAll',
      'listenAllHint',
    ];
    for (const key of uiKeys) {
      expect(typeof esK?.[key]).toBe('string');
      expect((esK[key] as string).length).toBeGreaterThan(0);
      expect(typeof enK?.[key]).toBe('string');
      expect((enK[key] as string).length).toBeGreaterThan(0);
    }
    expect(typeof (esK.quiz as AnyRecord)?.start).toBe('string');
    expect(typeof (enK.quiz as AnyRecord)?.start).toBe('string');
    expect(typeof (esK.teach as AnyRecord)?.title).toBe('string');
    expect(typeof (enK.teach as AnyRecord)?.title).toBe('string');
  });

  it('has title + subtitle + refLabel + teachContext in BOTH languages for every story', () => {
    const bad: string[] = [];
    for (const s of KIDS_STORIES) {
      for (const [lang, stories] of [
        ['es', esStories],
        ['en', enStories],
      ] as const) {
        const story = stories?.[s.id];
        if (!story) {
          bad.push(`${lang}: missing story ${s.id}`);
          continue;
        }
        for (const field of ['title', 'subtitle', 'refLabel', 'teachContext']) {
          if (typeof story[field] !== 'string' || !story[field]) {
            bad.push(`${lang}: ${s.id} missing ${field}`);
          }
        }
      }
    }
    expect(bad).toEqual([]);
  });

  it('has at least 3 open teachQuestions in BOTH languages for every story', () => {
    const bad: string[] = [];
    for (const s of KIDS_STORIES) {
      for (const [lang, stories] of [
        ['es', esStories],
        ['en', enStories],
      ] as const) {
        const questions = stories?.[s.id]?.teachQuestions as
          | string[]
          | undefined;
        if (!Array.isArray(questions) || questions.length < 3) {
          bad.push(`${lang}: ${s.id} needs >=3 teachQuestions`);
        }
      }
    }
    expect(bad).toEqual([]);
  });

  it('has scene text in BOTH languages for every scene', () => {
    const bad: string[] = [];
    for (const s of KIDS_STORIES) {
      for (const scene of s.scenes) {
        for (const [lang, stories] of [
          ['es', esStories],
          ['en', enStories],
        ] as const) {
          const text = (stories?.[s.id]?.scenes as AnyRecord)?.[scene.id] as
            | AnyRecord
            | undefined;
          if (typeof text?.text !== 'string' || !text.text) {
            bad.push(`${lang}: missing scene text ${scene.id}`);
          }
        }
      }
    }
    expect(bad).toEqual([]);
  });

  it('has question + 3 options (same length both languages) for every quiz question', () => {
    const bad: string[] = [];
    for (const s of KIDS_STORIES) {
      for (const q of s.quiz) {
        for (const [lang, stories] of [
          ['es', esStories],
          ['en', enStories],
        ] as const) {
          const entry = (stories?.[s.id]?.quiz as AnyRecord)?.[q.id] as
            | {question?: string; options?: string[]}
            | undefined;
          if (typeof entry?.question !== 'string' || !entry.question) {
            bad.push(`${lang}: ${q.id} missing question`);
          }
          if (!Array.isArray(entry?.options) || entry.options.length !== 3) {
            bad.push(`${lang}: ${q.id} needs exactly 3 options`);
          }
        }
      }
    }
    expect(bad).toEqual([]);
  });

  it('has no orphan i18n story entries (every keyed story is in the catalog)', () => {
    const ids = new Set<string>(KIDS_STORIES.map(s => s.id));
    for (const key of Object.keys(esStories ?? {})) {
      expect(ids.has(key)).toBe(true);
    }
  });
});

describe('kidsStories — achievements wiring', () => {
  it('registers both kids SPECIAL achievements with es/en names', () => {
    for (const id of ['kids_first_story', 'kids_stories_complete']) {
      const def = ACHIEVEMENT_DEFINITIONS.find(a => a.id === id);
      expect(def).toBeTruthy();
      const esDefs = ((translations.es as AnyRecord).achievements as AnyRecord)
        .definitions as Record<string, {name: string} | undefined>;
      const enDefs = ((translations.en as AnyRecord).achievements as AnyRecord)
        .definitions as Record<string, {name: string} | undefined>;
      expect(esDefs[id]?.name).toBeTruthy();
      expect(enDefs[id]?.name).toBeTruthy();
    }
  });
});

describe('getKidsStory', () => {
  it('finds a known story by id and returns undefined for an unknown one', () => {
    const id: KidsStoryId = 'creation';
    expect(getKidsStory(id)?.testament).toBe('ot');
    expect(getKidsStory('not-a-real-id')).toBeUndefined();
  });
});
