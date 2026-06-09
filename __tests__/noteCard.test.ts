import {buildNoteCard} from '../src/lib/notes/noteCard';

describe('buildNoteCard', () => {
  it('carries the reference, verse text and note through', () => {
    const card = buildNoteCard(
      'John 3:16',
      'For God so loved the world',
      'This is my favourite verse.',
    );
    expect(card.reference).toBe('John 3:16');
    expect(card.verseText).toBe('For God so loved the world');
    expect(card.note).toBe('This is my favourite verse.');
    expect(card.hasNote).toBe(true);
  });

  it('collapses whitespace in the verse text (no ragged source breaks)', () => {
    const card = buildNoteCard(
      '  John 3:16  ',
      'For God\n  so   loved\tthe world ',
      'note',
    );
    expect(card.reference).toBe('John 3:16');
    expect(card.verseText).toBe('For God so loved the world');
  });

  it('preserves the note’s own line breaks (only edges trimmed)', () => {
    const card = buildNoteCard(
      'Ps 23:1',
      'The Lord is my shepherd',
      '\n  Line one\nLine two  \n',
    );
    expect(card.note).toBe('Line one\nLine two');
  });

  it('flags an empty/whitespace-only note as nothing to share', () => {
    expect(
      buildNoteCard('Ps 23:1', 'The Lord is my shepherd', '   \n ').hasNote,
    ).toBe(false);
    expect(
      buildNoteCard('Ps 23:1', 'The Lord is my shepherd', '').hasNote,
    ).toBe(false);
  });
});
