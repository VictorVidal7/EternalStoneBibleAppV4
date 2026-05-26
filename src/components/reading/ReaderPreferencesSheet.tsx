/**
 * 🎛️ READER PREFERENCES SHEET
 *
 * Bottom-sheet modal for the verse reader's typography + layout knobs:
 * font family, size, line spacing, alignment, margins. Renders a live
 * sample paragraph at the top so the user sees each change before they
 * commit. State lives in [[ReaderPreferencesContext]] and persists to
 * AsyncStorage automatically — this sheet is a pure UI surface.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import React, {useMemo} from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  ScrollView,
} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import {
  useReaderPreferences,
  READER_FONT_SIZE_MIN,
  READER_FONT_SIZE_MAX,
  READER_FONT_SIZE_STEP,
  READER_MARGIN_PADDING,
  ReaderFontFamily,
  ReaderTextAlign,
  ReaderMargin,
} from '../../context/ReaderPreferencesContext';
import {useTheme} from '../../hooks/useTheme';
import {useLanguage} from '../../hooks/useLanguage';
import {
  borderRadius,
  fontSize as fontSizes,
  spacing,
} from '../../styles/designTokens';

interface ReaderPreferencesSheetProps {
  visible: boolean;
  onClose: () => void;
}

const LINE_HEIGHT_OPTIONS = [1.2, 1.4, 1.6, 1.8, 2.0];

export const ReaderPreferencesSheet: React.FC<ReaderPreferencesSheetProps> = ({
  visible,
  onClose,
}) => {
  const {colors} = useTheme();
  const {t} = useLanguage();
  const {
    preferences,
    setFontFamily,
    setFontSize,
    setLineHeightMultiplier,
    setTextAlign,
    setMargin,
    reset,
  } = useReaderPreferences();

  const previewFontFamily = useMemo(
    () => resolveFontFamily(preferences.fontFamily),
    [preferences.fontFamily],
  );

  const tap = (fn: () => void) => () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    fn();
  };

  const fontFamilyOptions: {
    id: ReaderFontFamily;
    label: string;
    sample: string;
  }[] = [
    {id: 'sans', label: t.readerPrefs.fontSans, sample: 'Aa'},
    {id: 'serif', label: t.readerPrefs.fontSerif, sample: 'Aa'},
  ];

  const alignOptions: {id: ReaderTextAlign; icon: string; label: string}[] = [
    {id: 'left', icon: 'list-outline', label: t.readerPrefs.alignLeft},
    {id: 'justify', icon: 'menu-outline', label: t.readerPrefs.alignJustify},
  ];

  const marginOptions: {id: ReaderMargin; label: string}[] = [
    {id: 'small', label: t.readerPrefs.marginSmall},
    {id: 'medium', label: t.readerPrefs.marginMedium},
    {id: 'large', label: t.readerPrefs.marginLarge},
  ];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity
          style={styles.overlayDismiss}
          onPress={onClose}
          activeOpacity={1}
          accessibilityRole="button"
          accessibilityLabel={t.close}
        />

        <View
          style={[
            styles.sheet,
            {
              backgroundColor: colors.surface,
              borderTopColor: colors.border,
            },
          ]}>
          <View style={styles.handle} />

          <View style={styles.header}>
            <Text style={[styles.title, {color: colors.text}]}>
              {t.readerPrefs.title}
            </Text>
            <View style={styles.headerActions}>
              <TouchableOpacity
                onPress={tap(reset)}
                accessibilityRole="button"
                accessibilityLabel={t.readerPrefs.reset}>
                <Text style={[styles.resetText, {color: colors.primary}]}>
                  {t.readerPrefs.reset}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={onClose}
                accessibilityRole="button"
                accessibilityLabel={t.close}>
                <Ionicons name="close" size={26} color={colors.text} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Live preview */}
          <View
            style={[
              styles.preview,
              {
                backgroundColor: colors.background,
                borderColor: colors.border,
                paddingHorizontal: READER_MARGIN_PADDING[preferences.margin],
              },
            ]}>
            <Text
              style={{
                color: colors.text,
                fontSize: preferences.fontSize,
                lineHeight:
                  preferences.fontSize * preferences.lineHeightMultiplier,
                textAlign: preferences.textAlign,
                fontFamily: previewFontFamily,
              }}>
              <Text style={[styles.previewNumber, {color: colors.primary}]}>
                1{'  '}
              </Text>
              {t.readerPrefs.sampleText}
            </Text>
          </View>

          <ScrollView
            style={styles.options}
            contentContainerStyle={styles.optionsContent}>
            {/* Font family */}
            <Section title={t.readerPrefs.font} colors={colors}>
              <View style={styles.row}>
                {fontFamilyOptions.map(opt => (
                  <ChoiceCard
                    key={opt.id}
                    active={preferences.fontFamily === opt.id}
                    colors={colors}
                    onPress={tap(() => setFontFamily(opt.id))}
                    accessibilityLabel={opt.label}>
                    <Text
                      style={{
                        color:
                          preferences.fontFamily === opt.id
                            ? colors.primary
                            : colors.text,
                        fontSize: 24,
                        fontWeight: '700',
                        fontFamily: resolveFontFamily(opt.id),
                      }}>
                      {opt.sample}
                    </Text>
                    <Text style={[styles.choiceLabel, {color: colors.text}]}>
                      {opt.label}
                    </Text>
                  </ChoiceCard>
                ))}
              </View>
            </Section>

            {/* Font size — stepper */}
            <Section title={t.readerPrefs.size} colors={colors}>
              <View style={styles.stepperRow}>
                <TouchableOpacity
                  style={[
                    styles.stepperButton,
                    {backgroundColor: colors.background},
                  ]}
                  disabled={preferences.fontSize <= READER_FONT_SIZE_MIN}
                  onPress={tap(() =>
                    setFontSize(preferences.fontSize - READER_FONT_SIZE_STEP),
                  )}
                  accessibilityRole="button"
                  accessibilityLabel={t.readerPrefs.decreaseSize}>
                  <Ionicons
                    name="remove"
                    size={22}
                    color={
                      preferences.fontSize <= READER_FONT_SIZE_MIN
                        ? colors.textTertiary
                        : colors.text
                    }
                  />
                </TouchableOpacity>
                <Text style={[styles.stepperValue, {color: colors.text}]}>
                  {preferences.fontSize}
                </Text>
                <TouchableOpacity
                  style={[
                    styles.stepperButton,
                    {backgroundColor: colors.background},
                  ]}
                  disabled={preferences.fontSize >= READER_FONT_SIZE_MAX}
                  onPress={tap(() =>
                    setFontSize(preferences.fontSize + READER_FONT_SIZE_STEP),
                  )}
                  accessibilityRole="button"
                  accessibilityLabel={t.readerPrefs.increaseSize}>
                  <Ionicons
                    name="add"
                    size={22}
                    color={
                      preferences.fontSize >= READER_FONT_SIZE_MAX
                        ? colors.textTertiary
                        : colors.text
                    }
                  />
                </TouchableOpacity>
              </View>
            </Section>

            {/* Line spacing */}
            <Section title={t.readerPrefs.lineSpacing} colors={colors}>
              <View style={styles.row}>
                {LINE_HEIGHT_OPTIONS.map(value => (
                  <PillButton
                    key={value}
                    active={
                      Math.abs(preferences.lineHeightMultiplier - value) < 0.05
                    }
                    colors={colors}
                    onPress={tap(() => setLineHeightMultiplier(value))}
                    accessibilityLabel={`${t.readerPrefs.lineSpacing} ${value}`}>
                    <Text
                      style={{
                        color:
                          Math.abs(preferences.lineHeightMultiplier - value) <
                          0.05
                            ? colors.primary
                            : colors.text,
                        fontWeight: '700',
                      }}>
                      {value.toFixed(1)}
                    </Text>
                  </PillButton>
                ))}
              </View>
            </Section>

            {/* Text alignment */}
            <Section title={t.readerPrefs.alignment} colors={colors}>
              <View style={styles.row}>
                {alignOptions.map(opt => (
                  <ChoiceCard
                    key={opt.id}
                    active={preferences.textAlign === opt.id}
                    colors={colors}
                    onPress={tap(() => setTextAlign(opt.id))}
                    accessibilityLabel={opt.label}>
                    <Ionicons
                      name={opt.icon as any}
                      size={22}
                      color={
                        preferences.textAlign === opt.id
                          ? colors.primary
                          : colors.text
                      }
                    />
                    <Text style={[styles.choiceLabel, {color: colors.text}]}>
                      {opt.label}
                    </Text>
                  </ChoiceCard>
                ))}
              </View>
            </Section>

            {/* Margins */}
            <Section title={t.readerPrefs.margin} colors={colors}>
              <View style={styles.row}>
                {marginOptions.map(opt => (
                  <PillButton
                    key={opt.id}
                    active={preferences.margin === opt.id}
                    colors={colors}
                    onPress={tap(() => setMargin(opt.id))}
                    accessibilityLabel={opt.label}>
                    <Text
                      style={{
                        color:
                          preferences.margin === opt.id
                            ? colors.primary
                            : colors.text,
                        fontWeight: '700',
                      }}>
                      {opt.label}
                    </Text>
                  </PillButton>
                ))}
              </View>
            </Section>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

/** Resolve a `fontFamily` value safe to set on RN Text per platform. */
export function resolveFontFamily(
  family: ReaderFontFamily,
): string | undefined {
  if (family === 'serif') {
    return Platform.OS === 'ios' ? 'Georgia' : 'serif';
  }
  // sans → undefined uses the platform's default system sans, which already
  // looks native on each OS.
  return undefined;
}

interface SectionProps {
  title: string;
  children: React.ReactNode;
  colors: {textSecondary: string};
}
const Section: React.FC<SectionProps> = ({title, children, colors}) => (
  <View style={styles.section}>
    <Text style={[styles.sectionTitle, {color: colors.textSecondary}]}>
      {title}
    </Text>
    {children}
  </View>
);

interface ChoiceCardProps {
  active: boolean;
  colors: {primary: string; background: string; border: string};
  onPress: () => void;
  accessibilityLabel: string;
  children: React.ReactNode;
}
const ChoiceCard: React.FC<ChoiceCardProps> = ({
  active,
  colors,
  onPress,
  accessibilityLabel,
  children,
}) => (
  <TouchableOpacity
    style={[
      styles.choiceCard,
      {
        backgroundColor: colors.background,
        borderColor: active ? colors.primary : colors.border,
        borderWidth: active ? 2 : 1,
      },
    ]}
    onPress={onPress}
    accessibilityRole="button"
    accessibilityLabel={accessibilityLabel}
    accessibilityState={{selected: active}}>
    {children}
  </TouchableOpacity>
);

interface PillButtonProps {
  active: boolean;
  colors: {primary: string; background: string; border: string};
  onPress: () => void;
  accessibilityLabel: string;
  children: React.ReactNode;
}
const PillButton: React.FC<PillButtonProps> = ({
  active,
  colors,
  onPress,
  accessibilityLabel,
  children,
}) => (
  <TouchableOpacity
    style={[
      styles.pill,
      {
        backgroundColor: colors.background,
        borderColor: active ? colors.primary : colors.border,
        borderWidth: active ? 2 : 1,
      },
    ]}
    onPress={onPress}
    accessibilityRole="button"
    accessibilityLabel={accessibilityLabel}
    accessibilityState={{selected: active}}>
    {children}
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  overlayDismiss: {
    flex: 1,
  },
  sheet: {
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingBottom: spacing.xl,
    maxHeight: '85%',
  },
  handle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.md,
  },
  title: {
    fontSize: fontSizes.lg,
    fontWeight: '800',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  resetText: {
    fontSize: fontSizes.sm,
    fontWeight: '700',
  },
  preview: {
    marginHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: spacing.md,
  },
  previewNumber: {
    fontWeight: '700',
  },
  options: {
    flexGrow: 0,
  },
  optionsContent: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
  },
  section: {
    marginTop: spacing.lg,
  },
  sectionTitle: {
    fontSize: fontSizes.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  choiceCard: {
    flex: 1,
    minWidth: 100,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  choiceLabel: {
    fontSize: fontSizes.xs,
    fontWeight: '600',
  },
  pill: {
    minWidth: 56,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
  },
  stepperButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperValue: {
    fontSize: 22,
    fontWeight: '800',
    minWidth: 40,
    textAlign: 'center',
  },
});
