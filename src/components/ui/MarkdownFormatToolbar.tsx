/**
 * 🛠️ MarkdownFormatToolbar — a small Bold / Italic / Bullet list / Heading
 * button row that sits next to a multiline `TextInput` and inserts/wraps
 * Markdown syntax at the current cursor or selection.
 *
 * Shared by two plain-text surfaces that already export as Markdown
 * unchanged: the free "Notas de sermón" body
 * (`app/features/sermon-notes/[id].tsx`) and each per-section note in the
 * premium "Mesa de preparación" outline (`app/features/prep/index.tsx`). It
 * stays 100% free/ungated on BOTH — this is a text-entry affordance, not a
 * premium feature, matching how each screen already treats its own
 * TextInput. It changes nothing about how/where the text is stored: the
 * Markdown syntax IS the plain string, so `buildSermonNoteMarkdown` and the
 * prep table's own export keep reading it exactly as before.
 *
 * All the actual string surgery lives in the pure, unit-tested
 * [[applyMarkdownFormat]] (`@lib/text/markdownFormatting`) — this component
 * only wires that function to the input: it reads `value`/`selection`,
 * computes the next `{text, selectionStart, selectionEnd}`, hands `text` to
 * the caller's own `onChangeText` (so autosave/debounce paths stay
 * IDENTICAL to normal typing), and moves the cursor imperatively via the
 * TextInput ref's native `setSelection` — deliberately NOT by controlling
 * the `selection` prop every render, which is a known way to fight the
 * OS IME/cursor while the user is still typing. The one-frame delay before
 * `setSelection` mirrors the same "wait for the new value to land" pattern
 * already used in `CompareImageModal`.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */
import {useCallback} from 'react';
import {StyleProp, StyleSheet, TextInput, View, ViewStyle} from 'react-native';
import {MaterialCommunityIcons} from '@expo/vector-icons';
import {useTheme} from '@hooks/useTheme';
import {useLanguage} from '@hooks/useLanguage';
import {haptics} from '@lib/haptics';
import {
  applyMarkdownFormat,
  type MarkdownFormatAction,
} from '@lib/text/markdownFormatting';
import {PressableScale} from '@components/ui/PressableScale';
import {borderRadius, spacing} from '@/styles/designTokens';

export interface MarkdownFormatToolbarProps {
  /** The TextInput's current value. */
  value: string;
  /** The TextInput's current selection, tracked via its `onSelectionChange`. */
  selection: {start: number; end: number};
  /** Ref to the TextInput being formatted (used to reposition the cursor after an edit). */
  inputRef: React.RefObject<TextInput | null>;
  /** Same handler passed to the TextInput's own `onChangeText` — keeps the autosave path identical to normal typing. */
  onChangeText: (next: string) => void;
  /**
   * Same setter fed by the TextInput's own `onSelectionChange` — called
   * synchronously with the freshly-computed selection right after a button
   * press. Without this, two toolbar presses back-to-back (no tap/typing in
   * between) would both read the SAME stale `selection` prop if the native
   * `onSelectionChange` round-trip hasn't fired yet by the second press;
   * updating the caller's tracked selection directly from here keeps it
   * correct regardless of whether/when that native event lands.
   */
  onSelectionChange: (next: {start: number; end: number}) => void;
  style?: StyleProp<ViewStyle>;
}

const BUTTONS: {
  action: MarkdownFormatAction;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
}[] = [
  {action: 'bold', icon: 'format-bold'},
  {action: 'italic', icon: 'format-italic'},
  {action: 'bulletList', icon: 'format-list-bulleted'},
  {action: 'heading', icon: 'format-header-pound'},
];

export function MarkdownFormatToolbar({
  value,
  selection,
  inputRef,
  onChangeText,
  onSelectionChange,
  style,
}: MarkdownFormatToolbarProps) {
  const {colors} = useTheme();
  const {t} = useLanguage();
  const m = t.markdownToolbar;

  const labelFor = useCallback(
    (action: MarkdownFormatAction) => {
      switch (action) {
        case 'bold':
          return m.bold;
        case 'italic':
          return m.italic;
        case 'bulletList':
          return m.bulletList;
        case 'heading':
          return m.heading;
        default:
          return '';
      }
    },
    [m],
  );

  const handlePress = useCallback(
    (action: MarkdownFormatAction) => {
      haptics.tap();
      const result = applyMarkdownFormat(
        value,
        selection.start,
        selection.end,
        action,
      );
      onChangeText(result.text);
      // Sync the caller's tracked selection immediately (see the prop's
      // doc comment) — don't wait on the native `onSelectionChange` round-trip.
      onSelectionChange({
        start: result.selectionStart,
        end: result.selectionEnd,
      });
      // The native input needs a beat to render the new `value` before it
      // will accept a selection inside it — matches CompareImageModal's
      // same one-frame-delay pattern for a ref touched right after a state
      // update that resizes/reflows what it points at.
      requestAnimationFrame(() => {
        inputRef.current?.setSelection(
          result.selectionStart,
          result.selectionEnd,
        );
      });
    },
    [value, selection, onChangeText, onSelectionChange, inputRef],
  );

  return (
    // No accessibilityLabel/accessible on this wrapping View — the spec asks
    // for a label on each of the 4 buttons, not a 5th one for the row. A
    // labeled+accessible container risks grouping the buttons into a single
    // screen-reader stop and swallowing their individual labels.
    <View style={[styles.row, style]}>
      {BUTTONS.map(({action, icon}) => (
        <PressableScale
          key={action}
          onPress={() => handlePress(action)}
          style={[
            styles.button,
            {borderColor: colors.border, backgroundColor: colors.card},
          ]}
          accessibilityRole="button"
          accessibilityLabel={labelFor(action)}>
          <MaterialCommunityIcons
            name={icon}
            size={18}
            color={colors.textSecondary}
          />
        </PressableScale>
      ))}
    </View>
  );
}

export default MarkdownFormatToolbar;

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  button: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.md,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
