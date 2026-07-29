import {
  findBook,
  linkifyReferences,
  parseReference,
} from '../src/lib/references/parseReference';

describe('findBook', () => {
  it('resolves the exact Spanish name', () => {
    expect(findBook('Génesis')?.id).toBe(1);
  });

  it('resolves the exact English name', () => {
    expect(findBook('Genesis')?.id).toBe(1);
  });

  it('is case- and accent-insensitive', () => {
    expect(findBook('genesis')?.id).toBe(1);
    expect(findBook('GENESIS')?.id).toBe(1);
    expect(findBook('genésis')?.id).toBe(1);
  });

  it('accepts canonical abbreviations in both languages', () => {
    expect(findBook('Gn')?.id).toBe(1);
    expect(findBook('Gen')?.id).toBe(1);
    expect(findBook('Jue')?.id).toBe(7); // Jueces
    expect(findBook('Jdg')?.id).toBe(7); // Judges
  });

  it('accepts abbreviations with or without internal spaces', () => {
    expect(findBook('1 S')?.name).toBe('1 Samuel');
    expect(findBook('1S')?.name).toBe('1 Samuel');
    expect(findBook('1Sa')?.nameEn).toBe('1 Samuel');
    expect(findBook('1 Cr')?.name).toBe('1 Crónicas');
  });

  it('tolerates trailing periods on abbreviations', () => {
    expect(findBook('Gn.')?.id).toBe(1);
    expect(findBook('Jn.')?.nameEn).toBe('John');
  });

  it('collapses prefixes that point to a single book', () => {
    // "jue" prefix-matches only Jueces / Judges variants.
    expect(findBook('jue')?.id).toBe(7);
  });

  it('refuses ambiguous prefixes', () => {
    // "ju" would match juan, judas, jueces — should not guess.
    expect(findBook('ju')).toBeUndefined();
  });

  it('returns undefined for nonsense', () => {
    expect(findBook('xyz')).toBeUndefined();
    expect(findBook('')).toBeUndefined();
    expect(findBook('   ')).toBeUndefined();
  });
});

describe('parseReference', () => {
  it('parses book-chapter-verse', () => {
    const r = parseReference('Juan 3:16');
    expect(r?.book.id).toBe(43);
    expect(r?.chapter).toBe(3);
    expect(r?.verse).toBe(16);
    expect(r?.verseEnd).toBeUndefined();
  });

  it('parses book-chapter only', () => {
    const r = parseReference('Salmos 23');
    expect(r?.book.name).toBe('Salmos');
    expect(r?.chapter).toBe(23);
    expect(r?.verse).toBeUndefined();
  });

  it('parses a verse range', () => {
    const r = parseReference('John 3:16-18');
    expect(r?.book.nameEn).toBe('John');
    expect(r?.chapter).toBe(3);
    expect(r?.verse).toBe(16);
    expect(r?.verseEnd).toBe(18);
  });

  it('parses two-word numeric-prefixed books', () => {
    expect(parseReference('1 Samuel 16:7')?.book.id).toBe(9);
    expect(parseReference('2 Reyes 5:1')?.book.id).toBe(12);
    expect(parseReference('1 John 4:18')?.book.nameEn).toBe('1 John');
  });

  it('parses with abbreviations', () => {
    expect(parseReference('Gn 1:1')?.book.id).toBe(1);
    expect(parseReference('1 Sa 1:1')?.book.id).toBe(9);
    expect(parseReference('1Sa 1:1')?.book.id).toBe(9);
  });

  it('tolerates extra whitespace', () => {
    expect(parseReference('  Génesis   1 : 1  ')?.book.id).toBe(1);
  });

  it('returns null for chapter out of range', () => {
    // Genesis only has 50 chapters.
    expect(parseReference('Genesis 51:1')).toBeNull();
    // Obadiah has 1 chapter (book id 31).
    expect(parseReference('Abdías 2')).toBeNull();
  });

  it('returns null for a backwards verse range', () => {
    expect(parseReference('John 3:18-16')).toBeNull();
  });

  it('returns null for nonsense', () => {
    expect(parseReference('hello world')).toBeNull();
    expect(parseReference('Genesis')).toBeNull(); // no chapter
    expect(parseReference('')).toBeNull();
  });
});

describe('linkifyReferences', () => {
  it('returns the input untouched when no references are present', () => {
    const segs = linkifyReferences('And God said, let there be light.');
    expect(segs).toHaveLength(1);
    expect(segs[0].text).toBe('And God said, let there be light.');
    expect(segs[0].ref).toBeUndefined();
  });

  it('finds an inline reference and splits the text around it', () => {
    const segs = linkifyReferences(
      'as it is written in Isaiah 53:5, by his stripes',
    );
    expect(segs.length).toBeGreaterThan(1);
    const linked = segs.filter(s => s.ref !== undefined);
    expect(linked).toHaveLength(1);
    expect(linked[0].ref?.book.nameEn).toBe('Isaiah');
    expect(linked[0].ref?.chapter).toBe(53);
    expect(linked[0].ref?.verse).toBe(5);
  });

  it('prefers the longer numeric-prefixed name', () => {
    const segs = linkifyReferences('See 1 John 4:18 and 2 John 1:1.');
    const refs = segs.filter(s => s.ref).map(s => s.ref!);
    expect(refs).toHaveLength(2);
    expect(refs[0].book.nameEn).toBe('1 John');
    expect(refs[1].book.nameEn).toBe('2 John');
  });

  it('ignores out-of-range chapter numbers', () => {
    // Genesis only has 50 chapters; "Genesis 99:1" should not linkify.
    const segs = linkifyReferences('A reference to Genesis 99:1 is bogus.');
    expect(segs.every(s => s.ref === undefined)).toBe(true);
  });

  it('preserves the original casing of the matched text', () => {
    const segs = linkifyReferences('See JOHN 3:16 for context.');
    const linked = segs.find(s => s.ref !== undefined);
    expect(linked?.text).toBe('JOHN 3:16');
  });

  it('linkifies the accented "Éx" abbreviation for Éxodo', () => {
    const segs = linkifyReferences(
      'Como se ve en Éx 4:1, Moisés recibió señales.',
    );
    const linked = segs.filter(s => s.ref !== undefined);
    expect(linked).toHaveLength(1);
    expect(linked[0].ref?.book.name).toBe('Éxodo');
    expect(linked[0].ref?.chapter).toBe(4);
    expect(linked[0].ref?.verse).toBe(1);
    expect(linked[0].text).toBe('Éx 4:1');
  });

  it('linkifies the unaccented "Ex" abbreviation for Éxodo too', () => {
    const segs = linkifyReferences('Ex 20:3 lists the first commandment.');
    const linked = segs.filter(s => s.ref !== undefined);
    expect(linked).toHaveLength(1);
    expect(linked[0].ref?.book.name).toBe('Éxodo');
    expect(linked[0].ref?.chapter).toBe(20);
  });

  it('linkifies other accented abbreviations regardless of accent usage', () => {
    // Gálatas' canonical abbr is accented ("Gá"); the unaccented spelling
    // people actually type ("Ga") should still resolve.
    const segs = linkifyReferences('Ver Ga 5:22 sobre el fruto del Espíritu.');
    const linked = segs.filter(s => s.ref !== undefined);
    expect(linked).toHaveLength(1);
    expect(linked[0].ref?.book.name).toBe('Gálatas');
    expect(linked[0].ref?.chapter).toBe(5);
    expect(linked[0].ref?.verse).toBe(22);
  });
});

describe('parseReference accent handling', () => {
  it('parses "Éx 4:1" directly', () => {
    const r = parseReference('Éx 4:1');
    expect(r?.book.name).toBe('Éxodo');
    expect(r?.chapter).toBe(4);
    expect(r?.verse).toBe(1);
  });
});
