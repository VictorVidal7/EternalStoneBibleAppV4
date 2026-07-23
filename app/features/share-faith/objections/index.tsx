/**
 * 🕊️ COMPARTE TU FE — "Preguntas frecuentes" browse screen.
 *
 * Lists the curated objections ([[shareFaithObjections]]) as tappable
 * cards, mirroring the "Explora por tema" browse screen exactly. Picking one
 * opens the per-objection detail (`/features/share-faith/objections/[id]`)
 * with its verses.
 *
 * 100% FREE — no `usePremium()` / `useOfferingSheet()` anywhere in this
 * flow. 100% JS: the taxonomy is the pure
 * src/features/study/shareFaithObjections.ts; zero new native, zero
 * Firestore.
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
import {getAllShareFaithObjections} from '@/features/study/shareFaithObjections';
import type {ShareFaithObjection} from '@/features/study/shareFaithObjections';
import {
  borderRadius,
  fontSize as fontSizes,
  spacing,
  staticColors,
} from '@/styles/designTokens';

type ObjectionListEntry = {title: string; description: string};

export default function ShareFaithObjectionsBrowseScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {colors, gradient, highContrast} = useTheme();
  const {t} = useLanguage();
  const tt = t.shareFaith.objections;
  const list = tt.list as Record<string, ObjectionListEntry>;
  const objections = getAllShareFaithObjections();

  const handleOpen = useCallback(
    (objection: ShareFaithObjection) => {
      haptics.tap();
      router.push(`/features/share-faith/objections/${objection.id}` as never);
    },
    [router],
  );

  const headerGradient: readonly [string, string, ...string[]] = highContrast
    ? (gradient.headerColors as readonly [string, string, ...string[]])
    : [colors.primary, colors.primaryDark];

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
                name="help-circle"
                size={24}
                color={staticColors.white}
              />
            </View>
            <View style={styles.headerInfo}>
              <AppText scaleRole="compact" style={styles.headerLabel}>
                {tt.subtitle}
              </AppText>
              <AppText scaleRole="display" style={styles.headerTitle}>
                {tt.title}
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
            {tt.browseHint}
          </AppText>

          {objections.map(objection => {
            const entry = list[objection.id];
            const title = entry?.title ?? objection.id;
            const count = `${objection.verseRefs.length} ${tt.verses}`;
            return (
              <TouchableOpacity
                key={objection.id}
                style={[
                  styles.card,
                  {backgroundColor: colors.card, borderColor: colors.border},
                ]}
                onPress={() => handleOpen(objection)}
                accessibilityRole="button"
                accessibilityLabel={title}
                accessibilityHint={entry?.description}>
                <View
                  style={[
                    styles.cardIcon,
                    {backgroundColor: objection.accent + '22'},
                  ]}>
                  <Ionicons
                    name={objection.icon as keyof typeof Ionicons.glyphMap}
                    size={22}
                    color={objection.accent}
                  />
                </View>
                <View style={styles.cardInfo}>
                  <AppText
                    scaleRole="display"
                    style={[styles.cardTitleText, {color: colors.text}]}>
                    {title}
                  </AppText>
                  {entry?.description ? (
                    <AppText
                      scaleRole="compact"
                      style={[styles.cardDesc, {color: colors.textSecondary}]}
                      numberOfLines={1}>
                      {entry.description}
                    </AppText>
                  ) : null}
                  <AppText
                    scaleRole="compact"
                    style={[styles.cardCount, {color: colors.textTertiary}]}>
                    {count}
                  </AppText>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={colors.textTertiary}
                />
              </TouchableOpacity>
            );
          })}
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
    gap: spacing.sm,
  },
  browseHint: {
    fontSize: fontSizes.sm,
    marginBottom: spacing.xs,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    padding: spacing.md,
    gap: spacing.md,
  },
  cardIcon: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardInfo: {flex: 1, gap: 2},
  cardTitleText: {
    fontSize: fontSizes.md,
    fontWeight: '700',
  },
  cardDesc: {
    fontSize: fontSizes.sm,
  },
  cardCount: {
    fontSize: fontSizes.xs,
    fontWeight: '600',
  },
});
