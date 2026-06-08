import {
  buildComparisonCard,
  buildComparisonCards,
  type ComparisonCardModel,
} from '../src/lib/comparison/comparisonCard';

const KJV = 'For God so loved the world, that he gave his only begotten Son';
const WEB = 'For God so loved the world, that he gave his one and only Son';

const divergentTextsOf = (card: ComparisonCardModel, versionIndex: number) =>
  card.versions[versionIndex].tokens
    .filter(tok => tok.divergent)
    .map(tok => tok.text);

describe('buildComparisonCard', () => {
  it('carries the reference, similarity and highlight flag through', () => {
    const card = buildComparisonCard('John 3:16', 80, true, [
      {abbr: 'KJV', text: KJV},
      {abbr: 'WEB', text: WEB},
    ]);
    expect(card.reference).toBe('John 3:16');
    expect(card.similarity).toBe(80);
    expect(card.highlight).toBe(true);
    expect(card.versions.map(v => v.abbr)).toEqual(['KJV', 'WEB']);
  });

  it('tokenizes each version so its divergent words are flagged (symmetric)', () => {
    const card = buildComparisonCard('John 3:16', 80, true, [
      {abbr: 'KJV', text: KJV},
      {abbr: 'WEB', text: WEB},
    ]);
    // KJV's unique words (vs the shared set) are flagged on the KJV side...
    expect(divergentTextsOf(card, 0)).toEqual(['begotten']);
    // ...and WEB's unique words on the WEB side (symmetric highlight).
    expect(divergentTextsOf(card, 1)).toEqual(['one', 'and']);
  });

  it('keeps the full text per version (the modal clamps it)', () => {
    const card = buildComparisonCard('John 3:16', 80, true, [
      {abbr: 'KJV', text: KJV},
      {abbr: 'WEB', text: WEB},
    ]);
    expect(card.versions[0].text).toBe(KJV);
    expect(card.versions[1].text).toBe(WEB);
  });

  it('still computes truthful tokens when highlight is off (modal gates drawing)', () => {
    // The tokens always carry the divergence truth; `highlight=false` only tells
    // the modal NOT to bold them (cross-language case).
    const card = buildComparisonCard('Juan 3:16', 40, false, [
      {abbr: 'KJV', text: KJV},
      {abbr: 'RVR', text: 'Porque de tal manera amó Dios al mundo'},
    ]);
    expect(card.highlight).toBe(false);
    // tokens are still flagged underneath (almost every word diverges here)
    expect(divergentTextsOf(card, 1).length).toBeGreaterThan(0);
  });

  it('preserves whitespace tokens so the verse renders verbatim', () => {
    const card = buildComparisonCard('John 3:16', 80, true, [
      {abbr: 'KJV', text: KJV},
      {abbr: 'WEB', text: WEB},
    ]);
    const rebuilt = card.versions[0].tokens.map(tok => tok.text).join('');
    expect(rebuilt).toBe(KJV);
  });
});

describe('buildComparisonCards (multi-verse carousel)', () => {
  const WEB17 = 'For God did not send his Son into the world to condemn';
  const KJV17 = 'For God sent not his Son into the world to condemn';

  it('builds one card per verse input, in order', () => {
    const cards = buildComparisonCards([
      {
        reference: 'John 3:16',
        similarity: 80,
        highlight: true,
        versions: [
          {abbr: 'KJV', text: KJV},
          {abbr: 'WEB', text: WEB},
        ],
      },
      {
        reference: 'John 3:17',
        similarity: 90,
        highlight: true,
        versions: [
          {abbr: 'KJV', text: KJV17},
          {abbr: 'WEB', text: WEB17},
        ],
      },
    ]);
    expect(cards).toHaveLength(2);
    expect(cards.map(c => c.reference)).toEqual(['John 3:16', 'John 3:17']);
    expect(cards.map(c => c.similarity)).toEqual([80, 90]);
  });

  it('gives each verse its OWN divergent set (per-verse common words)', () => {
    const cards = buildComparisonCards([
      {
        reference: 'John 3:16',
        similarity: 80,
        highlight: true,
        versions: [
          {abbr: 'KJV', text: KJV},
          {abbr: 'WEB', text: WEB},
        ],
      },
      {
        reference: 'John 3:17',
        similarity: 90,
        highlight: true,
        versions: [
          {abbr: 'KJV', text: KJV17},
          {abbr: 'WEB', text: WEB17},
        ],
      },
    ]);
    // v16's KJV divergent word vs v17's KJV divergent word differ — proving the
    // per-verse common set (not a single shared set across all verses).
    // v17: KJV "sent" vs WEB "did send" — "not" is shared, only "sent" diverges.
    expect(divergentTextsOf(cards[0], 0)).toEqual(['begotten']);
    expect(divergentTextsOf(cards[1], 0)).toEqual(['sent']);
  });

  it('returns an empty array for no inputs', () => {
    expect(buildComparisonCards([])).toEqual([]);
  });
});
