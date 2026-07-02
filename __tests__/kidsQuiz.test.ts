/**
 * The kids per-story quiz round preparation — pure display-order shuffling.
 */
import {prepareKidsQuiz} from '../src/features/kids/kidsQuiz';
import {KIDS_STORIES} from '../src/features/kids/kidsStories';

/** Deterministic RNG for reproducible tests: cycles through a fixed sequence. */
function seededRng(seed: number[]): () => number {
  let i = 0;
  return () => seed[i++ % seed.length];
}

const story = KIDS_STORIES.find(s => s.id === 'creation')!;

describe('prepareKidsQuiz', () => {
  it('returns one prepared question per quiz question, in catalog order', () => {
    const prepared = prepareKidsQuiz(story, Math.random);
    expect(prepared.map(p => p.id)).toEqual(story.quiz.map(q => q.id));
  });

  it('each order is a full permutation of [0,1,2]', () => {
    const prepared = prepareKidsQuiz(story, Math.random);
    for (const p of prepared) {
      expect(p.order.slice().sort()).toEqual([0, 1, 2]);
    }
  });

  it('correctPosition points back at the authored correctIndex', () => {
    const prepared = prepareKidsQuiz(story, Math.random);
    for (let i = 0; i < prepared.length; i++) {
      const p = prepared[i];
      const spec = story.quiz[i];
      expect(p.order[p.correctPosition]).toBe(spec.correctIndex);
    }
  });

  it('is deterministic for a fixed rng', () => {
    const rngSeq = [0.9, 0.1, 0.5, 0.2, 0.7, 0.3];
    const a = prepareKidsQuiz(story, seededRng(rngSeq));
    const b = prepareKidsQuiz(story, seededRng(rngSeq));
    expect(a).toEqual(b);
  });

  it('never throws for any story in the catalog', () => {
    for (const s of KIDS_STORIES) {
      expect(() => prepareKidsQuiz(s, Math.random)).not.toThrow();
      expect(prepareKidsQuiz(s, Math.random).length).toBe(3);
    }
  });
});
