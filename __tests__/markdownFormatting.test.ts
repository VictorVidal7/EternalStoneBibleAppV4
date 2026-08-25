import {applyMarkdownFormat} from '../src/lib/text/markdownFormatting';

describe('markdownFormatting — applyMarkdownFormat', () => {
  describe('bold', () => {
    it('inserts an empty ** pair and parks the cursor between them when there is no selection', () => {
      const result = applyMarkdownFormat('Hello  world', 6, 6, 'bold');
      expect(result.text).toBe('Hello **** world');
      expect(result.selectionStart).toBe(8);
      expect(result.selectionEnd).toBe(8);
    });

    it('wraps a selection in ** and keeps the original text selected', () => {
      // "Hello world" — select "world" (indices 6-11).
      const result = applyMarkdownFormat('Hello world', 6, 11, 'bold');
      expect(result.text).toBe('Hello **world**');
      expect(result.selectionStart).toBe(8);
      expect(result.selectionEnd).toBe(13);
      expect(
        result.text.slice(result.selectionStart, result.selectionEnd),
      ).toBe('world');
    });

    it('wraps a selection at the very start of the text', () => {
      const result = applyMarkdownFormat('Hello', 0, 5, 'bold');
      expect(result.text).toBe('**Hello**');
      expect(result.selectionStart).toBe(2);
      expect(result.selectionEnd).toBe(7);
    });
  });

  describe('italic', () => {
    it('inserts an empty * pair and parks the cursor between them when there is no selection', () => {
      const result = applyMarkdownFormat('', 0, 0, 'italic');
      expect(result.text).toBe('**');
      expect(result.selectionStart).toBe(1);
      expect(result.selectionEnd).toBe(1);
    });

    it('wraps a selection in single asterisks', () => {
      const result = applyMarkdownFormat('Hello world', 0, 5, 'italic');
      expect(result.text).toBe('*Hello* world');
      expect(result.selectionStart).toBe(1);
      expect(result.selectionEnd).toBe(6);
    });
  });

  describe('bulletList', () => {
    it('prefixes the current (cursor-only) line', () => {
      const result = applyMarkdownFormat('First point', 4, 4, 'bulletList');
      expect(result.text).toBe('- First point');
      // The whole edit happens before the cursor's original position, so the
      // cursor shifts right by the prefix length.
      expect(result.selectionStart).toBe(6);
      expect(result.selectionEnd).toBe(6);
    });

    it('prefixes an empty (blank) current line', () => {
      const result = applyMarkdownFormat('', 0, 0, 'bulletList');
      expect(result.text).toBe('- ');
      expect(result.selectionStart).toBe(2);
      expect(result.selectionEnd).toBe(2);
    });

    it('prefixes every non-empty line touched by a multi-line selection', () => {
      const text = 'one\ntwo\nthree';
      // Select the whole block (start of "one" through end of "three").
      const result = applyMarkdownFormat(text, 0, text.length, 'bulletList');
      expect(result.text).toBe('- one\n- two\n- three');
    });

    it('skips blank lines within a multi-line selection', () => {
      const text = 'one\n\nthree';
      const result = applyMarkdownFormat(text, 0, text.length, 'bulletList');
      expect(result.text).toBe('- one\n\n- three');
    });

    it('does not pull in a trailing line the selection only touches at its very start', () => {
      const text = 'one\ntwo\nthree';
      // Selection ends exactly at the start of "three" (index right after
      // "two\n"), so "three" should be left untouched.
      const end = text.indexOf('three');
      const result = applyMarkdownFormat(text, 0, end, 'bulletList');
      expect(result.text).toBe('- one\n- two\nthree');
    });

    it('toggles the prefix off when re-applied to an already-bulleted single line', () => {
      const once = applyMarkdownFormat('First point', 4, 4, 'bulletList');
      const twice = applyMarkdownFormat(
        once.text,
        once.selectionStart,
        once.selectionEnd,
        'bulletList',
      );
      expect(twice.text).toBe('First point');
    });

    it('toggles the prefix off across a multi-line selection when every line already has it', () => {
      const already = '- one\n- two\n- three';
      const result = applyMarkdownFormat(
        already,
        0,
        already.length,
        'bulletList',
      );
      expect(result.text).toBe('one\ntwo\nthree');
    });

    it('adds the prefix only to lines missing it in a mixed multi-line selection', () => {
      const mixed = '- one\ntwo\n- three';
      const result = applyMarkdownFormat(mixed, 0, mixed.length, 'bulletList');
      expect(result.text).toBe('- one\n- two\n- three');
    });

    it('keeps the selection anchored to the same logical content after prefixing', () => {
      const text = 'one\ntwo';
      // Select just "two" (indices 4-7).
      const result = applyMarkdownFormat(text, 4, 7, 'bulletList');
      expect(result.text).toBe('one\n- two');
      expect(
        result.text.slice(result.selectionStart, result.selectionEnd),
      ).toBe('two');
    });
  });

  describe('heading', () => {
    it('prefixes the current line even when the cursor sits mid-line', () => {
      const result = applyMarkdownFormat('Hello world', 5, 5, 'heading');
      expect(result.text).toBe('## Hello world');
      // Cursor was right after "Hello" (index 5); the edit happens before
      // it, so it shifts right by the full prefix length (3).
      expect(result.selectionStart).toBe(8);
      expect(result.text.slice(0, result.selectionStart)).toBe('## Hello');
    });

    it('prefixes a blank current line', () => {
      const result = applyMarkdownFormat('', 0, 0, 'heading');
      expect(result.text).toBe('## ');
      expect(result.selectionStart).toBe(3);
    });

    it('only affects the line containing the selection start, even with a multi-line selection', () => {
      const text = 'one\ntwo\nthree';
      const result = applyMarkdownFormat(text, 0, text.length, 'heading');
      expect(result.text).toBe('## one\ntwo\nthree');
    });

    it('toggles the heading prefix off when re-applied to the same line', () => {
      const once = applyMarkdownFormat('Title here', 0, 0, 'heading');
      expect(once.text).toBe('## Title here');
      const twice = applyMarkdownFormat(
        once.text,
        once.selectionStart,
        once.selectionEnd,
        'heading',
      );
      expect(twice.text).toBe('Title here');
    });

    it('shifts the end of a same-line selection along with the start', () => {
      // Select "world" on a single line — heading should still shift both
      // ends of the selection by the inserted prefix length.
      const result = applyMarkdownFormat('Hello world', 6, 11, 'heading');
      expect(result.text).toBe('## Hello world');
      expect(result.selectionStart).toBe(9);
      expect(result.selectionEnd).toBe(14);
      expect(
        result.text.slice(result.selectionStart, result.selectionEnd),
      ).toBe('world');
    });
  });

  describe('selection order', () => {
    it('normalizes a reversed selection (end before start)', () => {
      const result = applyMarkdownFormat('Hello world', 11, 6, 'bold');
      expect(result.text).toBe('Hello **world**');
    });
  });
});
