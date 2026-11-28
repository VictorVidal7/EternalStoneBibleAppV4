/**
 * R9-477 — scripts/build-originals-pack.js dropped 235 Greek words.
 *
 * TAGNT marks the English versification, where it differs from the Greek
 * edition's, with `[ch.v]` after the reference: "2Co.13.13[13.14]#01" is the
 * benediction (2 Co 13:14 in English), "Php.1.16[1.17]" is the verse the
 * English numbers 1:17. parseStep's row regex accepted `{…}` and `(…)` there,
 * not brackets, so those rows failed the match and the `continue` dropped them
 * without counting: 2 Co 13:13-14 and Phil 1:16-17 shipped with no originals.
 *
 * The fix files such a row under the bracketed (English) reference — the one
 * bible-seed.db uses — and makes any other word-shaped row the regex does not
 * understand abort the build instead of vanishing.
 *
 * The rows below follow TAGNT's column layout ([0] ref, [1] "Greek (translit)",
 * [2] English, [3] dStrongs=Grammar, [4] lemma=gloss, [8] Spanish); the words
 * are the first ones of the verses they name.
 */
const {parseStep} = require('../scripts/build-originals-pack');

const greekRow = (ref, greek, en, strongsGrammar, lemmaGloss, es) =>
  [ref, greek, en, strongsGrammar, lemmaGloss, '', '', '', es].join('\t');

const header = [
  'TAGNT test fixture header line',
  '',
  '# 2Co.13.13\tἩ χάρις τοῦ κυρίου',
].join('\n');

function parse(text, lang = 'G') {
  return [...parseStep(text, lang)];
}

describe('R9-477 — TAGNT rows with an English `[ch.v]` reference', () => {
  it('control: a plain row parses under its own reference', () => {
    const rows = parse(
      greekRow(
        'Mat.1.1#01=NKO',
        'Βίβλος (Biblos)',
        '[The] book',
        'G0976=N-NSF',
        'βίβλος=book',
        'Libro',
      ),
    );
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      bookId: 40,
      chapter: 1,
      verse: 1,
      position: 1,
      word: 'Βίβλος',
      strongs: 'G976',
    });
  });

  it('2 Co 13:14 (the benediction) is filed under 13:14, not dropped', () => {
    const text = [
      header,
      greekRow(
        '2Co.13.13[13.14]#01=NKO',
        'Ἡ (Hē)',
        'The',
        'G3588=T-NSF',
        'ὁ=the/this/who',
        'La',
      ),
      greekRow(
        '2Co.13.13[13.14]#02=NKO',
        'χάρις (charis)',
        'grace',
        'G5485=N-NSF',
        'χάρις=grace',
        'gracia',
      ),
    ].join('\n');
    const rows = parse(text);
    expect(rows.map(r => [r.bookId, r.chapter, r.verse, r.position])).toEqual([
      [47, 13, 14, 1],
      [47, 13, 14, 2],
    ]);
    expect(rows[1]).toMatchObject({word: 'χάρις', strongs: 'G5485'});
  });

  it('a bracketed row that crosses into the next chapter is filed there', () => {
    const rows = parse(
      greekRow(
        'Rev.12.18[13.1]#01=NKO',
        'Καὶ (Kai)',
        'And',
        'G2532=CONJ',
        'καί=and',
        'Y',
      ),
    );
    expect(rows.map(r => [r.bookId, r.chapter, r.verse, r.position])).toEqual([
      [66, 13, 1, 1],
    ]);
  });

  it('a bracketed row keeps its row data under the English verse', () => {
    const rows = parse(
      greekRow(
        'Php.1.16[1.17]#01=NKO',
        'οἱ (hoi)',
        'the',
        'G3588=T-NPM',
        'ὁ=the/this/who',
        'los',
      ),
    );
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      bookId: 50,
      chapter: 1,
      verse: 17,
      position: 1,
      word: 'οἱ',
      translit: 'hoi',
      glossEs: 'los',
      grammar: 'T-NPM',
    });
  });

  it('a word row with an annotation the parser does not know aborts the build', () => {
    const text = [
      header,
      greekRow(
        'Mat.1.1<1.2>#01=NKO',
        'Βίβλος (Biblos)',
        '[The] book',
        'G0976=N-NSF',
        'βίβλος=book',
        'Libro',
      ),
    ].join('\n');
    expect(() => parse(text)).toThrow(/1 word rows .*Mat\.1\.1<1\.2>#01=NKO/);
  });

  it('header, blank and verse-text lines are not counted as dropped rows', () => {
    expect(parse(header)).toEqual([]);
  });

  it('control: the Hebrew `=X` LXX-retroversion rows are still skipped, not counted', () => {
    const hebrewRow = (ref, word) =>
      [ref, word, 'translit', 'gloss', 'H0001', 'HNcmsc'].join('\t');
    const rows = parse(
      [
        hebrewRow('Gen.1.1#01=L', 'בְּ/רֵאשִׁ֖ית'),
        hebrewRow('Deu.30.16#01=X', 'אִם'),
      ].join('\n'),
      'H',
    );
    expect(rows.map(r => [r.bookId, r.chapter, r.verse])).toEqual([[1, 1, 1]]);
  });
});
