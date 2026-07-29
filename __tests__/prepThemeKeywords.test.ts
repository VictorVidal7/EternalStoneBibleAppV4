import {BIBLE_THEMES} from '../src/features/study/themes';
import {
  THEME_KEYWORDS,
  TOPIC_SYNONYM_EXPANSION,
  countKeywordOccurrences,
  getKeywordsForThemes,
  getThemeKeywords,
  keywordTokenScore,
  normalizeThemeText,
  tokenizeTopic,
} from '../src/features/study/prepThemeKeywords';

const VALID_THEME_IDS = new Set(BIBLE_THEMES.map(t => t.id));

describe('prepThemeKeywords — taxonomy shape', () => {
  it('every THEME_KEYWORDS key is a real BIBLE_THEMES id', () => {
    for (const id of Object.keys(THEME_KEYWORDS)) {
      expect(VALID_THEME_IDS.has(id)).toBe(true);
    }
  });

  it('every BIBLE_THEMES id has an entry in THEME_KEYWORDS', () => {
    for (const theme of BIBLE_THEMES) {
      expect(THEME_KEYWORDS[theme.id]).toBeTruthy();
    }
  });

  it('every TOPIC_SYNONYM_EXPANSION value only names real theme ids', () => {
    for (const [word, themeIds] of Object.entries(TOPIC_SYNONYM_EXPANSION)) {
      for (const id of themeIds) {
        expect(VALID_THEME_IDS.has(id)).toBe(true);
      }
      // Defensive: no entry should be blank/whitespace.
      expect(word.trim().length).toBeGreaterThan(0);
    }
  });
});

describe('normalizeThemeText', () => {
  it('lowercases and strips accents', () => {
    expect(normalizeThemeText('Perdón')).toBe('perdon');
    expect(normalizeThemeText('SABIDURÍA')).toBe('sabiduria');
  });
});

describe('getThemeKeywords / getKeywordsForThemes', () => {
  it('folds a mapped synonym into its theme (reverse lookup)', () => {
    expect(getThemeKeywords('courage')).toEqual(
      expect.arrayContaining(['courage', 'valor', 'temor', 'miedo']),
    );
  });

  it('returns an empty list for an unknown theme id', () => {
    expect(getThemeKeywords('not-a-real-theme')).toEqual([]);
  });

  it('unions keywords across several theme ids without duplicates', () => {
    const keywords = getKeywordsForThemes(['forgiveness', 'grace']);
    expect(keywords).toEqual(expect.arrayContaining(['perdon', 'gracia']));
    expect(new Set(keywords).size).toBe(keywords.length);
  });
});

describe('keywordTokenScore', () => {
  it('scores an exact match highest', () => {
    expect(keywordTokenScore('gracia', 'gracia')).toBe(3);
  });

  it('scores a whole-token containment match lower', () => {
    expect(keywordTokenScore('miedos', 'miedo')).toBeGreaterThan(0);
    expect(keywordTokenScore('miedos', 'miedo')).toBeLessThan(3);
  });

  it('never matches a short keyword as a substring of an unrelated word', () => {
    // "fe" is a real keyword (faith) but must not match inside "feliz".
    expect(keywordTokenScore('feliz', 'fe')).toBe(0);
  });

  it('scores unrelated words 0', () => {
    expect(keywordTokenScore('elefante', 'gracia')).toBe(0);
  });
});

describe('tokenizeTopic', () => {
  it('normalizes, splits and drops common stopwords', () => {
    expect(tokenizeTopic('el perdón de Dios')).toEqual(['perdon', 'dios']);
  });

  it('returns an empty array for blank input', () => {
    expect(tokenizeTopic('   ')).toEqual([]);
    expect(tokenizeTopic('')).toEqual([]);
  });
});

describe('countKeywordOccurrences', () => {
  it('counts whole-word matches only', () => {
    // "paz" must not match inside "capaz".
    const text = normalizeThemeText('Eres capaz de tener paz y calma hoy.');
    expect(countKeywordOccurrences(text, ['paz', 'calma'])).toBe(2);
  });

  it('returns 0 when no keyword is present', () => {
    const text = normalizeThemeText('Un texto sin relación alguna.');
    expect(countKeywordOccurrences(text, ['gracia', 'perdon'])).toBe(0);
  });
});
