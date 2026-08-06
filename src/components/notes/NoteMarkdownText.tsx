/**
 * 📝 NoteMarkdownText — renders a verse note's `**bold**`/`*italic*` spans
 * styled instead of showing the literal asterisks.
 *
 * Generic on purpose (no note-feature-specific styling baked in) so it can
 * sit in every render site a plain note `<Text>` used to: the notes list
 * (`app/(tabs)/notes.tsx`) and the shareable note image card
 * (`NoteImageModal.tsx`). Standard RN `Text` props (`numberOfLines`, `style`,
 * `accessibilityRole`, etc.) pass straight through to the outer `<Text>` —
 * the nested `<Text>` spans inherit truncation from it the normal RN way.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */
import React from 'react';
import {Text, TextProps, StyleSheet} from 'react-native';
import {parseNoteMarkdown} from '@lib/notes/noteMarkdown';

export interface NoteMarkdownTextProps extends Omit<TextProps, 'children'> {
  text: string;
}

export const NoteMarkdownText: React.FC<NoteMarkdownTextProps> = ({
  text,
  ...textProps
}) => {
  const segments = parseNoteMarkdown(text);
  return (
    <Text {...textProps}>
      {segments.map((segment, index) => {
        if (segment.style === 'bold') {
          return (
            <Text key={index} style={styles.bold}>
              {segment.text}
            </Text>
          );
        }
        if (segment.style === 'italic') {
          return (
            <Text key={index} style={styles.italic}>
              {segment.text}
            </Text>
          );
        }
        return <Text key={index}>{segment.text}</Text>;
      })}
    </Text>
  );
};

const styles = StyleSheet.create({
  bold: {fontWeight: '700'},
  italic: {fontStyle: 'italic'},
});
