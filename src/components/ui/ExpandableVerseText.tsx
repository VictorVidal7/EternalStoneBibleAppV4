/**
 * 📐 ExpandableVerseText — a truncated verse/passage `Text` with a discreet
 * chevron toggle to grow the box in place.
 *
 * User feedback (2026-06-30, UX batch): study/cross-reference connection
 * cards truncate verse text with `numberOfLines`, and jumping into the
 * reader is too heavy just to peek at the rest. This gives a lighter
 * in-place alternative. The toggle is its own small row BELOW the text
 * (not the text itself) so it never conflicts with a card's existing
 * tap-to-navigate behavior — most of these cards are already a
 * TouchableOpacity that jumps to the reader. Kept icon-only and quiet (no
 * label) per follow-up feedback — the card shouldn't shout "there's more
 * here," just offer a small, discoverable affordance.
 *
 * The chevron only renders when the text actually overflows
 * `numberOfLines` (follow-up feedback: it showed on every card at first).
 * `onTextLayout` on a `numberOfLines`-capped Text doesn't reliably report
 * the untruncated line count across platforms, so an invisible, absolutely
 * positioned twin (same style, unrestricted) measures the true line count.
 *
 * Mirrors the app's one existing collapse convention (the prophecy
 * screen's "¿Por qué importa?" / "Fuentes y método": a boolean + chevron,
 * no animation library) — LayoutAnimation is the one addition, a built-in
 * RN API that "just works" under the New Architecture (no Android
 * UIManager opt-in needed), for a smooth grow instead of an instant snap.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import {useState} from 'react';
import {
  LayoutAnimation,
  NativeSyntheticEvent,
  StyleProp,
  StyleSheet,
  Text,
  TextLayoutEventData,
  TextStyle,
  TouchableOpacity,
  View,
} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {useTheme} from '@hooks/useTheme';
import {useLanguage} from '@hooks/useLanguage';
import {haptics} from '@lib/haptics';

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
  const [truncatable, setTruncatable] = useState(false);

  const handleMeasuredLayout = (
    e: NativeSyntheticEvent<TextLayoutEventData>,
  ) => {
    if (e.nativeEvent.lines.length > numberOfLines) {
      setTruncatable(true);
    }
  };

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
      {!truncatable && (
        <Text
          style={[style, styles.measurer]}
          onTextLayout={handleMeasuredLayout}
          pointerEvents="none">
          {children}
        </Text>
      )}
      {truncatable && (
        <TouchableOpacity
          onPress={toggle}
          hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
          style={styles.toggle}
          accessibilityRole="button"
          accessibilityLabel={expanded ? t.readLess : t.readMore}
          accessibilityState={{expanded}}>
          <Ionicons
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={13}
            color={colors.textTertiary}
          />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  measurer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    opacity: 0,
    zIndex: -1,
  },
  toggle: {
    alignSelf: 'flex-start',
    marginTop: 2,
    opacity: 0.7,
  },
});
