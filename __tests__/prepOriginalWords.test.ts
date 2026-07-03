import {
  groupOriginalWordsByStrongs,
  type PrepOriginalVerseWords,
} from '../src/features/study/prepOriginalWords';
import type {OriginalWord} from '../src/features/study/originals';

function word(
  overrides: Partial<OriginalWord> & {strongs: string},
): OriginalWord {
  return {
    position: 0,
    lang: 'G',
    word: overrides.word ?? 'λόγος',
    translit: overrides.translit ?? 'logos',
    gloss_en: overrides.gloss_en ?? 'word',
    gloss_es: overrides.gloss_es ?? 'palabra',
    grammar: overrides.grammar ?? 'N-NSM',
    ...overrides,
  };
}

describe('prepOriginalWords — grouping/dedup across a passage range (T8.4.2)', () => {
  it('returns an empty array for an empty range', () => {
    expect(groupOriginalWordsByStrongs([])).toEqual([]);
  });

  it('drops words without a real lexicon-linked Strong’s number', () => {
    const verses: PrepOriginalVerseWords[] = [
      {
        verse: 16,
        words: [
          word({strongs: 'G25'}),
          word({strongs: null as unknown as string}),
          word({strongs: 'not-a-strongs'}),
        ],
      },
    ];
    const groups = groupOriginalWordsByStrongs(verses);
    expect(groups).toHaveLength(1);
    expect(groups[0].strongs).toBe('G25');
  });

  it('collapses repeats of the same Strong’s number across verses into one group with a count', () => {
    const verses: PrepOriginalVerseWords[] = [
      {verse: 16, words: [word({strongs: 'G25', word: 'ἠγάπησεν'})]},
      {verse: 17, words: [word({strongs: 'G2316'}), word({strongs: 'G25'})]},
    ];
    const groups = groupOriginalWordsByStrongs(verses);
    const g25 = groups.find(g => g.strongs === 'G25');
    expect(g25?.count).toBe(2);
    expect(g25?.firstVerse).toBe(16);
    // Keeps the FIRST occurrence's word/translit/grammar, not the last.
    expect(g25?.word).toBe('ἠγάπησεν');
  });

  it('collapses repeats of the same Strong’s number WITHIN one verse too', () => {
    const verses: PrepOriginalVerseWords[] = [
      {verse: 16, words: [word({strongs: 'G3588'}), word({strongs: 'G3588'})]},
    ];
    const groups = groupOriginalWordsByStrongs(verses);
    expect(groups).toHaveLength(1);
    expect(groups[0].count).toBe(2);
  });

  it('orders groups by occurrence count, descending', () => {
    const verses: PrepOriginalVerseWords[] = [
      {
        verse: 16,
        words: [word({strongs: 'G25'}), word({strongs: 'G2316'})],
      },
      {verse: 17, words: [word({strongs: 'G2316'})]},
      {verse: 18, words: [word({strongs: 'G2316'})]},
    ];
    const groups = groupOriginalWordsByStrongs(verses);
    expect(groups.map(g => g.strongs)).toEqual(['G2316', 'G25']);
    expect(groups[0].count).toBe(3);
    expect(groups[1].count).toBe(1);
  });

  it('breaks ties in count by first-appearance order (stable sort)', () => {
    const verses: PrepOriginalVerseWords[] = [
      {verse: 16, words: [word({strongs: 'G2316'}), word({strongs: 'G25'})]},
    ];
    const groups = groupOriginalWordsByStrongs(verses);
    expect(groups.map(g => g.strongs)).toEqual(['G2316', 'G25']);
  });

  it('walks verses in the order given (the caller is responsible for ascending order)', () => {
    const verses: PrepOriginalVerseWords[] = [
      {verse: 16, words: [word({strongs: 'G25'})]},
    ];
    const groups = groupOriginalWordsByStrongs(verses);
    expect(groups[0].firstVerse).toBe(16);
  });

  it('tolerates a verse with no words', () => {
    const verses: PrepOriginalVerseWords[] = [
      {verse: 16, words: []},
      {verse: 17, words: [word({strongs: 'G25'})]},
    ];
    const groups = groupOriginalWordsByStrongs(verses);
    expect(groups).toHaveLength(1);
    expect(groups[0].firstVerse).toBe(17);
  });

  it('preserves gloss_es/gloss_en/lang for reuse with pickGloss/glossLanguage', () => {
    const verses: PrepOriginalVerseWords[] = [
      {
        verse: 16,
        words: [
          word({
            strongs: 'G25',
            lang: 'G',
            gloss_es: 'amó',
            gloss_en: 'loved',
          }),
        ],
      },
    ];
    const groups = groupOriginalWordsByStrongs(verses);
    expect(groups[0]).toMatchObject({
      lang: 'G',
      gloss_es: 'amó',
      gloss_en: 'loved',
    });
  });
});
