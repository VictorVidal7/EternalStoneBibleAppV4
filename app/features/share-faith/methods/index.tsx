/**
 * 🕊️ COMPARTE TU FE — "Cómo compartir el evangelio" browse screen.
 *
 * Lists the curated gospel-sharing outlines ([[shareFaithMethods]]) as
 * tappable cards, mirroring the "Preguntas frecuentes" browse screen
 * (`/features/share-faith/objections`) exactly. Picking one opens the
 * per-method detail (`/features/share-faith/methods/[id]`) with its ordered
 * steps. A framing paragraph above the list makes clear these are
 * cross-tradition tools for telling the same gospel, not one denomination's
 * formula — see `shareFaith.methods.framingNote`.
 *
 * 100% FREE — no `usePremium()` / `useOfferingSheet()` anywhere in this
 * flow. 100% JS: the taxonomy is the pure
 * src/features/study/shareFaithMethods.ts; zero new native, zero Firestore.
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
import {getAllShareFaithMethods} from '@/features/study/shareFaithMethods';
import type {ShareFaithMethod} from '@/features/study/shareFaithMethods';
import {
  borderRadius,
  fontSize as fontSizes,
  spacing,
  staticColors,
} from '@/styles/designTokens';

type MethodListEntry = {title: string; description: string};

export default function ShareFaithMethodsBrowseScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {colors, gradient, highContrast} = useTheme();
  const {t} = useLanguage();
  const tt = t.shareFaith.methods;
  const list = tt.list as Record<string, MethodListEntry>;
  const methods = getAllShareFaithMethods();

  const handleOpen = useCallback(
    (method: ShareFaithMethod) => {
      haptics.tap();
      router.push(`/features/share-faith/methods/${method.id}` as never);
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
              <Ionicons name="map" size={24} color={staticColors.white} />
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
            style={[styles.framingNote, {color: colors.textSecondary}]}>
            {tt.framingNote}
          </AppText>

          {methods.map(method => {
            const entry = list[method.id];
            const title = entry?.title ?? method.id;
            const count = `${method.steps.length} ${tt.verses}`;
            return (
              <TouchableOpacity
                key={method.id}
                style={[
                  styles.card,
                  {backgroundColor: colors.card, borderColor: colors.border},
                ]}
                onPress={() => handleOpen(method)}
                accessibilityRole="button"
                accessibilityLabel={title}
                accessibilityHint={entry?.description}>
                <View
                  style={[
                    styles.cardIcon,
                    {backgroundColor: method.accent + '22'},
                  ]}>
                  <Ionicons
                    name={method.icon as keyof typeof Ionicons.glyphMap}
                    size={22}
                    color={method.accent}
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
                      numberOfLines={2}>
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
  framingNote: {
    fontSize: fontSizes.sm,
    lineHeight: fontSizes.sm * 1.5,
    marginBottom: spacing.md,
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
