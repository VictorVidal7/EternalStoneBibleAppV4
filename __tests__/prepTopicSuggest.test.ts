import {BIBLE_THEMES} from '../src/features/study/themes';
import {
  TOPIC_SUGGESTION_MAX,
  suggestPassagesForTopic,
  type TopicPassageSuggestion,
} from '../src/features/study/prepTopicSuggest';

/** Every ref the taxonomy actually ships — the ONLY refs a suggestion may ever cite. */
const ALL_CURATED_REFS = new Set(
  BIBLE_THEMES.flatMap(theme => theme.verseRefs),
);

describe('suggestPassagesForTopic', () => {
  it('matches a topic word that is a theme\'s own Spanish name ("gracia" → grace)', () => {
    const results = suggestPassagesForTopic('gracia');
    expect(results.length).toBeGreaterThan(0);
    expect(results.every(r => r.themeId === 'grace')).toBe(true);
  });

  it('matches a theme\'s own curated label with an accent ("perdón" → forgiveness)', () => {
    const results = suggestPassagesForTopic('perdón');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].themeId).toBe('forgiveness');
  });

  it('matches the example synonym from the spec ("miedo" → courage, via "temor")', () => {
    const results = suggestPassagesForTopic('miedo');
    expect(results.length).toBeGreaterThan(0);
    expect(results.every(r => r.themeId === 'courage')).toBe(true);
  });

  it('returns 3-5 candidates for a well-covered topic', () => {
    const results = suggestPassagesForTopic('gracia');
    expect(results.length).toBeGreaterThanOrEqual(3);
    expect(results.length).toBeLessThanOrEqual(TOPIC_SUGGESTION_MAX);
  });

  it('respects a custom max', () => {
    const results = suggestPassagesForTopic('gracia', 2);
    expect(results.length).toBeLessThanOrEqual(2);
  });

  it('returns an empty array for blank input', () => {
    expect(suggestPassagesForTopic('')).toEqual([]);
    expect(suggestPassagesForTopic('   ')).toEqual([]);
  });

  it('returns an empty array for a topic with no match at all', () => {
    expect(suggestPassagesForTopic('xyzzyqwerty12345')).toEqual([]);
  });

  it('never returns the same ref twice, even when two matched themes share it', () => {
    // Ephesians/2/8 is curated under BOTH "faith" and "grace" — a topic that
    // matches both must still only surface it once.
    const results = suggestPassagesForTopic('fe y gracia');
    const refs = results.map(r => r.ref);
    expect(new Set(refs).size).toBe(refs.length);
  });

  it('a phrase (multiple words) still resolves to the right theme', () => {
    const results = suggestPassagesForTopic('estoy sintiendo mucho miedo');
    expect(results.length).toBeGreaterThan(0);
    expect(results.every(r => r.themeId === 'courage')).toBe(true);
  });

  // ── Guardrail — mirrors faithTestimony.test.ts:118-129's "never generates
  // or fills in content" precedent. The whole point of this module: it may
  // only ever return POINTERS into data the app already curates, never
  // generated prose or a new theological judgment. ─────────────────────────
  describe('guardrail — pointers only, never generated content', () => {
    const allTopics = ['gracia', 'perdón', 'miedo', 'fe', 'paz', 'sabiduría'];

    it('every result object has EXACTLY the ref/themeId shape — no free-text field', () => {
      for (const topic of allTopics) {
        for (const result of suggestPassagesForTopic(topic)) {
          expect(Object.keys(result).sort()).toEqual(['ref', 'themeId']);
          expect(typeof result.ref).toBe('string');
          expect(typeof result.themeId).toBe('string');
        }
      }
    });

    it('every returned ref is a canonical "Book/Chapter/Verse" reference string', () => {
      for (const topic of allTopics) {
        for (const {ref} of suggestPassagesForTopic(topic)) {
          expect(ref).toMatch(/^[A-Za-z0-9][A-Za-z0-9. ]*\/\d+\/\d+$/);
        }
      }
    });

    it('every returned ref already exists in BIBLE_THEMES.verseRefs — nothing is invented', () => {
      for (const topic of allTopics) {
        for (const {ref} of suggestPassagesForTopic(topic)) {
          expect(ALL_CURATED_REFS.has(ref)).toBe(true);
        }
      }
    });

    it('every returned themeId is a real, existing BIBLE_THEMES id', () => {
      const validIds = new Set(BIBLE_THEMES.map(t => t.id));
      for (const topic of allTopics) {
        for (const {themeId} of suggestPassagesForTopic(topic)) {
          expect(validIds.has(themeId)).toBe(true);
        }
      }
    });

    it("a returned ref is one of ITS OWN themeId's curated verseRefs (association is real, not cross-wired)", () => {
      const byId = new Map(BIBLE_THEMES.map(t => [t.id, t.verseRefs]));
      const results: TopicPassageSuggestion[] = allTopics.flatMap(topic =>
        suggestPassagesForTopic(topic),
      );
      for (const {ref, themeId} of results) {
        expect(byId.get(themeId)).toContain(ref);
      }
    });
  });
});
