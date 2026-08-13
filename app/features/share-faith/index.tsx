/**
 * 🕊️ COMPARTE TU FE — free-tier hub screen.
 *
 * Three entry points into the "Comparte tu fe" feature:
 *   - "Preguntas frecuentes" — a curated, browsable list of common
 *     questions/objections a believer might face when sharing their faith,
 *     each mapped to a handful of relevant verses ([[shareFaithObjections]]).
 *   - "Cómo compartir el evangelio" — curated, ORDERED gospel-sharing
 *     verse sequences (a Romans-only route, a bridge image, a four-step
 *     summary, a design/brokenness/restoration arc), each verse carrying a
 *     one-clause caption ([[shareFaithMethods]]).
 *   - "Mi testimonio" — a guided-but-not-scripted writing surface for the
 *     reader's OWN testimony, shareable as an image ([[faithTestimony]]).
 *
 * 100% FREE — no `usePremium()` / `useOfferingSheet()` anywhere in this
 * flow, same free-tier posture as "Notas de sermón" (this screen's closest
 * shape precedent).
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
import {centeredMaxWidth} from '@/styles/responsive';
import {useLanguage} from '@hooks/useLanguage';
import {haptics} from '@lib/haptics';
import {AppText} from '@components/ui/AppText';
import {
  borderRadius,
  fontSize as fontSizes,
  spacing,
  staticColors,
} from '@/styles/designTokens';

export default function ShareFaithHubScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {colors, gradient, highContrast} = useTheme();
  const {t} = useLanguage();
  const h = t.shareFaith.hub;

  const handleOpenObjections = useCallback(() => {
    haptics.tap();
    router.push('/features/share-faith/objections' as never);
  }, [router]);

  const handleOpenMethods = useCallback(() => {
    haptics.tap();
    router.push('/features/share-faith/methods' as never);
  }, [router]);

  const handleOpenTestimony = useCallback(() => {
    haptics.tap();
    router.push('/features/share-faith/testimony' as never);
  }, [router]);

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
              <Ionicons name="heart" size={24} color={staticColors.white} />
            </View>
            <View style={styles.headerInfo}>
              <AppText scaleRole="display" style={styles.headerTitle}>
                {h.title}
              </AppText>
              <AppText scaleRole="compact" style={styles.headerSubtitle}>
                {h.subtitle}
              </AppText>
            </View>
          </View>
        </LinearGradient>

        <ScrollView
          contentContainerStyle={[styles.content, centeredMaxWidth()]}
          showsVerticalScrollIndicator={false}>
          <TouchableOpacity
            style={[
              styles.card,
              {backgroundColor: colors.card, borderColor: colors.border},
            ]}
            onPress={handleOpenObjections}
            accessibilityRole="button"
            accessibilityLabel={h.objectionsCardTitle}
            accessibilityHint={h.objectionsCardSubtitle}>
            <View
              style={[
                styles.cardIcon,
                {backgroundColor: colors.primary + '22'},
              ]}>
              <Ionicons name="help-circle" size={26} color={colors.primary} />
            </View>
            <View style={styles.cardInfo}>
              <AppText
                scaleRole="display"
                style={[styles.cardTitle, {color: colors.text}]}>
                {h.objectionsCardTitle}
              </AppText>
              <AppText
                scaleRole="compact"
                style={[styles.cardSubtitle, {color: colors.textSecondary}]}>
                {h.objectionsCardSubtitle}
              </AppText>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={colors.textTertiary}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.card,
              {backgroundColor: colors.card, borderColor: colors.border},
            ]}
            onPress={handleOpenMethods}
            accessibilityRole="button"
            accessibilityLabel={h.methodsCardTitle}
            accessibilityHint={h.methodsCardSubtitle}>
            <View
              style={[
                styles.cardIcon,
                {backgroundColor: colors.primary + '22'},
              ]}>
              <Ionicons name="map" size={26} color={colors.primary} />
            </View>
            <View style={styles.cardInfo}>
              <AppText
                scaleRole="display"
                style={[styles.cardTitle, {color: colors.text}]}>
                {h.methodsCardTitle}
              </AppText>
              <AppText
                scaleRole="compact"
                style={[styles.cardSubtitle, {color: colors.textSecondary}]}>
                {h.methodsCardSubtitle}
              </AppText>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={colors.textTertiary}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.card,
              {backgroundColor: colors.card, borderColor: colors.border},
            ]}
            onPress={handleOpenTestimony}
            accessibilityRole="button"
            accessibilityLabel={h.testimonyCardTitle}
            accessibilityHint={h.testimonyCardSubtitle}>
            <View
              style={[
                styles.cardIcon,
                {backgroundColor: colors.primary + '22'},
              ]}>
              <Ionicons name="create" size={26} color={colors.primary} />
            </View>
            <View style={styles.cardInfo}>
              <AppText
                scaleRole="display"
                style={[styles.cardTitle, {color: colors.text}]}>
                {h.testimonyCardTitle}
              </AppText>
              <AppText
                scaleRole="compact"
                style={[styles.cardSubtitle, {color: colors.textSecondary}]}>
                {h.testimonyCardSubtitle}
              </AppText>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={colors.textTertiary}
            />
          </TouchableOpacity>
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
  headerTitle: {
    color: staticColors.white,
    fontSize: fontSizes['2xl'],
    fontWeight: '800',
  },
  headerSubtitle: {
    color: staticColors.glassWhite95,
    fontSize: fontSizes.sm,
    marginTop: 2,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing['2xl'],
    gap: spacing.md,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    padding: spacing.lg,
    gap: spacing.md,
  },
  cardIcon: {
    width: 52,
    height: 52,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardInfo: {flex: 1, gap: 2},
  cardTitle: {
    fontSize: fontSizes.lg,
    fontWeight: '700',
  },
  cardSubtitle: {
    fontSize: fontSizes.sm,
  },
});
