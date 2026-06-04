import {
  buildComparisonCard,
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
