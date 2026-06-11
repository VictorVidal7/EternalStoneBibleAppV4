/**
 * 💛 HOW ARE YOU FEELING — emotional check-in browse screen (Sprint 79)
 *
 * Lists the curated feelings ([[feelings]]) as a soft two-column grid. Picking
 * one opens the per-feeling detail (`/features/feelings/[feeling]`) with its
 * passages and a short breath-prayer. Where "Explore by Theme" is the SUBJECT
 * entry point into Scripture, this is the HEART entry point — the reader names
 * what they feel and the Word answers.
 *
 * Reached from the Home chip row, the Study-tools card, and the deep link
 * eternalbible://features/feelings. 100% JS: the taxonomy is the pure
 * src/features/study/feelings.ts; zero new native, zero Firestore.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import React, {useCallback} from 'react';
import {View, ScrollView, TouchableOpacity, StyleSheet} from 'react-native';
import {Stack, useRouter} from 'expo-router';
import {Ionicons} from '@expo/vector-icons';
import {LinearGradient} from 'expo-linear-gradient';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTheme} from '@hooks/useTheme';
import {useLanguage} from '@hooks/useLanguage';
import {haptics} from '@lib/haptics';
import {AppText} from '@components/ui/AppText';
import {getAllFeelings} from '@/features/study/feelings';
import type {Feeling} from '@/features/study/feelings';
import {
  borderRadius,
  fontSize as fontSizes,
  spacing,
  staticColors,
} from '@/styles/designTokens';

type FeelingListEntry = {name: string; description: string; prayer: string};

export default function FeelingsBrowseScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {colors} = useTheme();
  const {t} = useLanguage();
  const tf = t.feelings;
  const list = tf.list as Record<string, FeelingListEntry>;
  const feelings = getAllFeelings();

  const handleOpen = useCallback(
    (feeling: Feeling) => {
      haptics.tap();
      router.push(`/features/feelings/${feeling.id}` as never);
    },
    [router],
  );

  const headerGradient: [string, string] = [colors.primary, colors.primaryDark];

  return (
    <>
      <Stack.Screen options={{headerShown: false}} />
      <View style={[styles.container, {backgroundColor: colors.background}]}>
        <LinearGradient
          colors={headerGradient}
          start={{x: 0, y: 0}}
          end={{x: 0, y: 1}}
          style={[styles.header, {paddingTop: insets.top + spacing.md}]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel={t.bible.back}>
            <Ionicons name="arrow-back" size={24} color={staticColors.white} />
          </TouchableOpacity>
          <View style={styles.headerTextRow}>
            <View style={styles.headerIcon}>
              <Ionicons
                name="heart-half"
                size={24}
                color={staticColors.white}
              />
            </View>
            <View style={styles.headerInfo}>
              <AppText scaleRole="compact" style={styles.headerLabel}>
                {tf.subtitle}
              </AppText>
              <AppText scaleRole="display" style={styles.headerTitle}>
                {tf.title}
              </AppText>
            </View>
          </View>
        </LinearGradient>

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}>
          <AppText
            scaleRole="compact"
            style={[styles.browseHint, {color: colors.textTertiary}]}>
            {tf.browseHint}
          </AppText>

          <View style={styles.grid}>
            {feelings.map(feeling => {
              const entry = list[feeling.id];
              const name = entry?.name ?? feeling.id;
              return (
                <TouchableOpacity
                  key={feeling.id}
                  style={[
                    styles.feelingCard,
                    {backgroundColor: colors.card, borderColor: colors.border},
                  ]}
                  onPress={() => handleOpen(feeling)}
                  accessibilityRole="button"
                  accessibilityLabel={name}
                  accessibilityHint={entry?.description}>
                  <View
                    style={[
                      styles.feelingIcon,
                      {backgroundColor: feeling.accent + '22'},
                    ]}>
                    <Ionicons
                      name={feeling.icon as keyof typeof Ionicons.glyphMap}
                      size={24}
                      color={feeling.accent}
                    />
                  </View>
                  <AppText
                    scaleRole="display"
                    style={[styles.feelingName, {color: colors.text}]}
                    numberOfLines={1}>
                    {name}
                  </AppText>
                  {entry?.description ? (
                    <AppText
                      scaleRole="compact"
                      style={[
                        styles.feelingDesc,
                        {color: colors.textSecondary},
                      ]}
                      numberOfLines={2}>
                      {entry.description}
                    </AppText>
                  ) : null}
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1},
  header: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    borderBottomLeftRadius: borderRadius.xl,
    borderBottomRightRadius: borderRadius.xl,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  headerTextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.xs,
  },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.lg,
    backgroundColor: staticColors.glassWhite25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerInfo: {flex: 1},
  headerLabel: {
    color: staticColors.glassWhite95,
    fontSize: fontSizes.sm,
    fontWeight: '600',
  },
  headerTitle: {
    color: staticColors.white,
    fontSize: fontSizes['2xl'],
    fontWeight: '800',
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing['2xl'],
  },
  browseHint: {
    fontSize: fontSizes.sm,
    marginBottom: spacing.md,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  // flexBasis (not flex:1+minWidth) so the grid truly wraps 2-up on RN/Yoga —
  // the S71 typeface-grid lesson.
  feelingCard: {
    flexBasis: '47%',
    flexGrow: 1,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    padding: spacing.md,
    gap: spacing.xs,
  },
  feelingIcon: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  feelingName: {
    fontSize: fontSizes.md,
    fontWeight: '700',
  },
  feelingDesc: {
    fontSize: fontSizes.sm,
    lineHeight: fontSizes.sm * 1.4,
  },
});
