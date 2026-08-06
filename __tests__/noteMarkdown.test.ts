import {parseNoteMarkdown} from '../src/lib/notes/noteMarkdown';

describe('parseNoteMarkdown', () => {
  it('returns an empty array for empty input', () => {
    expect(parseNoteMarkdown('')).toEqual([]);
  });

  it('returns a single plain segment for text with no markers', () => {
    expect(parseNoteMarkdown('Just a plain note.')).toEqual([
      {text: 'Just a plain note.', style: 'plain'},
    ]);
  });

  it('parses a bold span', () => {
    expect(parseNoteMarkdown('This is **important** to remember')).toEqual([
      {text: 'This is ', style: 'plain'},
      {text: 'important', style: 'bold'},
      {text: ' to remember', style: 'plain'},
    ]);
  });

  it('parses an italic span', () => {
    expect(parseNoteMarkdown('He said *hesed* means loyalty')).toEqual([
      {text: 'He said ', style: 'plain'},
      {text: 'hesed', style: 'italic'},
      {text: ' means loyalty', style: 'plain'},
    ]);
  });

  it('parses multiple bold and italic spans in one note', () => {
    expect(parseNoteMarkdown('**Key**: read *slowly* and **pray**')).toEqual([
      {text: 'Key', style: 'bold'},
      {text: ': read ', style: 'plain'},
      {text: 'slowly', style: 'italic'},
      {text: ' and ', style: 'plain'},
      {text: 'pray', style: 'bold'},
    ]);
  });

  it('tries bold before italic so "**text**" is not read as nested italics', () => {
    expect(parseNoteMarkdown('**bold**')).toEqual([
      {text: 'bold', style: 'bold'},
    ]);
  });

  it('leaves an unterminated bold marker as literal text (mid-typing state)', () => {
    expect(parseNoteMarkdown('This is **almost bold')).toEqual([
      {text: 'This is **almost bold', style: 'plain'},
    ]);
  });

  it('leaves an unterminated italic marker as literal text', () => {
    expect(parseNoteMarkdown('a lone *star with no partner')).toEqual([
      {text: 'a lone *star with no partner', style: 'plain'},
    ]);
  });

  it('does NOT let a hand-typed bullet list pair across lines (the corruption case)', () => {
    // Two independent single "*" bullets on separate lines must never be
    // read as one italic span spanning both lines and everything between.
    const text = '* punto uno\n* punto dos';
    expect(parseNoteMarkdown(text)).toEqual([{text, style: 'plain'}]);
  });

  it('does not let a bold span cross a line break either', () => {
    const text = '**start of note\nsecond line** end';
    expect(parseNoteMarkdown(text)).toEqual([{text, style: 'plain'}]);
  });

  it('keeps a genuine same-line italic span intact even with other text on other lines', () => {
    const text = 'Line one\nThis has *real emphasis* here\nLine three';
    expect(parseNoteMarkdown(text)).toEqual([
      {text: 'Line one\nThis has ', style: 'plain'},
      {text: 'real emphasis', style: 'italic'},
      {text: ' here\nLine three', style: 'plain'},
    ]);
  });

  describe('bullet lines ("- ")', () => {
    it('turns a leading "- " into a "•" bullet', () => {
      expect(parseNoteMarkdown('- primer punto')).toEqual([
        {text: '• primer punto', style: 'plain'},
      ]);
    });

    it('converts multiple bullet lines, one per line', () => {
      expect(parseNoteMarkdown('- uno\n- dos\n- tres')).toEqual([
        {text: '• uno\n• dos\n• tres', style: 'plain'},
      ]);
    });

    it('only converts a "- " at the very start of a line, not mid-line', () => {
      const text = 'Nota - con un guión aquí';
      expect(parseNoteMarkdown(text)).toEqual([{text, style: 'plain'}]);
    });

    it('leaves a lone "-" (no following space) untouched', () => {
      const text = '-sin espacio';
      expect(parseNoteMarkdown(text)).toEqual([{text, style: 'plain'}]);
    });

    it('does NOT treat "*" as an alternate bullet marker (stays disjoint from italics)', () => {
      // The corruption-prevention case from above must still hold once
      // bullets exist: only "- " is a bullet, never "*".
      const text = '* punto uno\n* punto dos';
      expect(parseNoteMarkdown(text)).toEqual([{text, style: 'plain'}]);
    });

    it('supports bold/italic INSIDE a bullet line', () => {
      expect(parseNoteMarkdown('- esto es **muy** importante')).toEqual([
        {text: '• esto es ', style: 'plain'},
        {text: 'muy', style: 'bold'},
        {text: ' importante', style: 'plain'},
      ]);
    });

    it('supports a mix of bullet and non-bullet lines', () => {
      const result = parseNoteMarkdown(
        'Puntos clave:\n- primero\n- segundo\nFin.',
      );
      expect(result).toEqual([
        {text: 'Puntos clave:\n• primero\n• segundo\nFin.', style: 'plain'},
      ]);
    });
  });
});
