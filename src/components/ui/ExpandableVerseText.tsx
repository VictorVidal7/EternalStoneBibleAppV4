/**
 * 📐 ExpandableVerseText — a truncated verse/passage `Text` with a "Leer
 * más" / "Leer menos" toggle to grow the box in place.
 *
 * User feedback (2026-06-30, UX batch): study/cross-reference connection
 * cards truncate verse text with `numberOfLines`, and jumping into the
 * reader is too heavy just to peek at the rest. This gives a lighter
 * in-place alternative. The toggle is its own small row BELOW the text
 * (not the text itself) so it never conflicts with a card's existing
 * tap-to-navigate behavior — most of these cards are already a
 * TouchableOpacity that jumps to the reader.
 *
 * Mirrors the app's one existing collapse convention (the prophecy
 * screen's "¿Por qué importa?" / "Fuentes y método": a boolean + chevron,
 * no animation library) — LayoutAnimation is the one addition, a built-in
 * RN API that "just works" under the New Architecture (no Android
 * UIManager opt-in needed), for a smooth grow instead of an instant snap.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import React, {useState} from 'react';
import {
  LayoutAnimation,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  TouchableOpacity,
  View,
} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {useTheme} from '@hooks/useTheme';
import {useLanguage} from '@hooks/useLanguage';
import {haptics} from '@lib/haptics';
import {fontSize as fontSizes, spacing} from '@/styles/designTokens';

export interface ExpandableVerseTextProps {
  children: string;
  numberOfLines: number;
  style?: StyleProp<TextStyle>;
}

export function ExpandableVerseText({
  children,
  numberOfLines,
  style,
}: ExpandableVerseTextProps) {
  const {colors} = useTheme();
  const {t} = useLanguage();
  const [expanded, setExpanded] = useState(false);

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    haptics.tap();
    setExpanded(e => !e);
  };

  return (
    <View>
      <Text style={style} numberOfLines={expanded ? undefined : numberOfLines}>
        {children}
      </Text>
      <TouchableOpacity
        onPress={toggle}
        hitSlop={{top: 6, bottom: 6, left: 6, right: 6}}
        style={styles.toggle}
        accessibilityRole="button"
        accessibilityLabel={expanded ? t.readLess : t.readMore}
        accessibilityState={{expanded}}>
        <Text style={[styles.toggleText, {color: colors.textTertiary}]}>
          {expanded ? t.readLess : t.readMore}
        </Text>
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={14}
          color={colors.textTertiary}
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  toggle: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 2,
    marginTop: spacing.xs,
  },
  toggleText: {
    fontSize: fontSizes.xs,
    fontWeight: '700',
  },
});
