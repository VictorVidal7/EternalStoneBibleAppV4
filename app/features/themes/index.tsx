/**
 * 🗂️ EXPLORE BY THEME — topical browse screen (Sprint 63)
 *
 * Lists the curated themes ([[themes]]) as tappable cards. Picking one opens
 * the per-theme detail (`/features/themes/[theme]`) with its passages. This is
 * the SUBJECT entry point into Scripture — a reader who feels anxious finds
 * "Peace" here rather than already knowing the reference.
 *
 * Reached from the Home "Explore by Theme" card, the cross-references sheet, and
 * the deep link eternalbible://features/themes. 100% JS: the taxonomy is the
 * pure src/features/study/themes.ts; zero new native, zero Firestore.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import {useCallback} from 'react';
import {View, ScrollView, TouchableOpacity, StyleSheet} from 'react-native';
import {Stack, useRouter} from 'expo-router';
import {Ionicons} from '@expo/vector-icons';
import {LinearGradient} from 'expo-linear-gradient';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTheme} from '@hooks/useTheme';
import {useLanguage} from '@hooks/useLanguage';
import {haptics} from '@lib/haptics';
import {AppText} from '@components/ui/AppText';
import {getAllThemes} from '@/features/study/themes';
import type {BibleTheme} from '@/features/study/themes';
import {
  borderRadius,
  fontSize as fontSizes,
  spacing,
  staticColors,
} from '@/styles/designTokens';

type ThemeListEntry = {name: string; description: string};

export default function ThemesBrowseScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {colors, gradient, highContrast} = useTheme();
  const {t} = useLanguage();
  const tt = t.themes;
  const list = tt.list as Record<string, ThemeListEntry>;
  const themes = getAllThemes();

  const handleOpen = useCallback(
    (theme: BibleTheme) => {
      haptics.tap();
      router.push(`/features/themes/${theme.id}` as never);
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
              <Ionicons name="grid" size={24} color={staticColors.white} />
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

          {themes.map(theme => {
            const entry = list[theme.id];
            const name = entry?.name ?? theme.id;
            const count = `${theme.verseRefs.length} ${tt.verses}`;
            return (
              <TouchableOpacity
                key={theme.id}
                style={[
                  styles.themeCard,
                  {backgroundColor: colors.card, borderColor: colors.border},
                ]}
                onPress={() => handleOpen(theme)}
                accessibilityRole="button"
                accessibilityLabel={name}
                accessibilityHint={entry?.description}>
                <View
                  style={[
                    styles.themeIcon,
                    {backgroundColor: theme.accent + '22'},
                  ]}>
                  <Ionicons
                    name={theme.icon as keyof typeof Ionicons.glyphMap}
                    size={22}
                    color={theme.accent}
                  />
                </View>
                <View style={styles.themeInfo}>
                  <AppText
                    scaleRole="display"
                    style={[styles.themeName, {color: colors.text}]}>
                    {name}
                  </AppText>
                  {entry?.description ? (
                    <AppText
                      scaleRole="compact"
                      style={[styles.themeDesc, {color: colors.textSecondary}]}
                      numberOfLines={1}>
                      {entry.description}
                    </AppText>
                  ) : null}
                  <AppText
                    scaleRole="compact"
                    style={[styles.themeCount, {color: colors.textTertiary}]}>
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
  themeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    padding: spacing.md,
    gap: spacing.md,
  },
  themeIcon: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  themeInfo: {flex: 1, gap: 2},
  themeName: {
    fontSize: fontSizes.md,
    fontWeight: '700',
  },
  themeDesc: {
    fontSize: fontSizes.sm,
  },
  themeCount: {
    fontSize: fontSizes.xs,
    fontWeight: '600',
  },
});
