/**
 * NoteMarkdownText — confirms bold/italic segments render as separate
 * styled `<Text>` nodes (not literal asterisks), and that plain-text notes
 * with no markers still render exactly as typed.
 */
import React from 'react';
import {render} from '@testing-library/react-native';
import {NoteMarkdownText} from '../src/components/notes/NoteMarkdownText';

describe('NoteMarkdownText', () => {
  it('renders plain text with no markers unchanged', () => {
    const {getByText} = render(<NoteMarkdownText text="Just a plain note." />);
    expect(getByText('Just a plain note.')).toBeTruthy();
  });

  it('renders a bold span as its own styled node, without the asterisks', () => {
    const {getByText, queryByText} = render(
      <NoteMarkdownText text="This is **important** to remember" />,
    );
    const boldNode = getByText('important');
    expect(boldNode.props.style).toEqual(
      expect.objectContaining({fontWeight: '700'}),
    );
    expect(queryByText(/\*\*/)).toBeNull();
  });

  it('renders an italic span as its own styled node', () => {
    const {getByText} = render(
      <NoteMarkdownText text="He said *hesed* means loyalty" />,
    );
    const italicNode = getByText('hesed');
    expect(italicNode.props.style).toEqual(
      expect.objectContaining({fontStyle: 'italic'}),
    );
  });

  it('passes through numberOfLines and style to the outer Text', () => {
    const {UNSAFE_getByProps} = render(
      <NoteMarkdownText
        text="A note"
        numberOfLines={3}
        style={{color: 'red'}}
      />,
    );
    expect(UNSAFE_getByProps({numberOfLines: 3})).toBeTruthy();
  });

  it('never crosses a line break for a hand-typed bullet (no accidental italics)', () => {
    const text = '* punto uno\n* punto dos';
    const {getByText} = render(<NoteMarkdownText text={text} />);
    expect(getByText(text)).toBeTruthy();
  });

  it('renders a "- " line as a "•" bullet, inline (no separate node/View)', () => {
    const {getByText} = render(
      <NoteMarkdownText text={'- primero\n- segundo'} />,
    );
    expect(getByText('• primero\n• segundo')).toBeTruthy();
  });
});
