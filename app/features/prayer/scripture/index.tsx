/**
 * 🙏 ORAR LA ESCRITURA — a hub of prayers already recorded in Scripture.
 *
 * Lists the curated passages from [[scripturePrayers]], grouped by category,
 * each opening its own verse-by-verse walkthrough at
 * `/features/prayer/scripture/[passageId]`. The disclaimer at the top is
 * always visible (not collapsible) — these are examples to learn FROM, never
 * a formula, and the user asked explicitly that this be emphasized.
 *
 * Reached from the prayer journal's "Orar la Escritura" card + the deep link
 * eternalbible://features/prayer/scripture.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

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
  SCRIPTURE_PRAYER_CATEGORY_ORDER,
  getScripturePrayersByCategory,
} from '@/features/prayer/scripturePrayers';
import {
  borderRadius,
  fontSize as fontSizes,
  spacing,
  staticColors,
} from '@/styles/designTokens';

export default function ScripturePrayerHubScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {colors, gradient, highContrast} = useTheme();
  const {t} = useLanguage();
  const ts = t.scripturePrayer;
  const categories = ts.categories as Record<string, string>;
  const passages = ts.passages as Record<string, {title: string}>;

  const headerGradient: readonly [string, string, ...string[]] = highContrast
    ? (gradient.headerColors as readonly [string, string, ...string[]])
    : [colors.primary, colors.primaryDark];

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/' as never);
  };

  const openPassage = (id: string) => {
    haptics.tap();
    router.push(`/features/prayer/scripture/${id}` as never);
  };

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
            onPress={goBack}
            accessibilityRole="button"
            accessibilityLabel={t.bible.back}>
            <Ionicons name="arrow-back" size={24} color={staticColors.white} />
          </TouchableOpacity>
          <View style={styles.headerTextRow}>
            <View style={styles.headerIcon}>
              <Ionicons name="rose" size={22} color={staticColors.white} />
            </View>
            <View style={styles.headerInfo}>
              <AppText scaleRole="compact" style={styles.headerLabel}>
                {ts.subtitle}
              </AppText>
              <AppText scaleRole="display" style={styles.headerTitle}>
                {ts.title}
              </AppText>
            </View>
          </View>
        </LinearGradient>

        <ScrollView
          contentContainerStyle={[
            styles.content,
            {paddingBottom: insets.bottom + spacing['2xl']},
            centeredMaxWidth(),
          ]}
          showsVerticalScrollIndicator={false}>
          <View style={styles.introBlock}>
            <AppText style={[styles.intro, {color: colors.textSecondary}]}>
              {ts.intro}
            </AppText>

            {/* Always visible, never collapsed — the user asked explicitly
                that this be emphasized, not tucked away. */}
            <View
              style={[
                styles.disclaimerCard,
                {
                  backgroundColor: colors.primary + '12',
                  borderColor: colors.primary + '33',
                },
              ]}>
              <Ionicons
                name="information-circle"
                size={15}
                color={colors.primary}
              />
              <AppText style={[styles.disclaimerText, {color: colors.text}]}>
                {ts.disclaimer}
              </AppText>
            </View>
          </View>

          {SCRIPTURE_PRAYER_CATEGORY_ORDER.map(category => {
            const items = getScripturePrayersByCategory(category);
            if (items.length === 0) return null;
            return (
              <View key={category} style={styles.section}>
                <AppText
                  scaleRole="compact"
                  style={[styles.sectionTitle, {color: colors.textTertiary}]}>
                  {categories[category].toUpperCase()}
                </AppText>
                {items.map(item => (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.card,
                      {
                        backgroundColor: colors.card,
                        borderColor: colors.border,
                      },
                    ]}
                    activeOpacity={0.85}
                    onPress={() => openPassage(item.id)}
                    accessibilityRole="button"
                    accessibilityLabel={passages[item.id]?.title ?? item.id}>
                    <View style={styles.cardInfo}>
                      <AppText style={[styles.cardTitle, {color: colors.text}]}>
                        {passages[item.id]?.title ?? item.id}
                      </AppText>
                      <AppText
                        scaleRole="compact"
                        style={[styles.cardMeta, {color: colors.textTertiary}]}>
                        {ts.versesCount.replace(
                          '{{n}}',
                          String(item.refs.length),
                        )}
                      </AppText>
                    </View>
                    <Ionicons
                      name="chevron-forward"
                      size={20}
                      color={colors.textTertiary}
                    />
                  </TouchableOpacity>
                ))}
              </View>
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
  backButton: {width: 40, height: 40, justifyContent: 'center'},
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
  content: {padding: spacing.lg, gap: spacing.lg},
  introBlock: {gap: spacing.sm},
  intro: {
    fontSize: fontSizes.sm,
    lineHeight: fontSizes.sm * 1.4,
    textAlign: 'left',
  },
  disclaimerCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    padding: spacing.sm,
  },
  disclaimerText: {
    flex: 1,
    fontSize: fontSizes.xs,
    lineHeight: fontSizes.xs * 1.4,
  },
  section: {gap: spacing.sm},
  sectionTitle: {
    fontSize: fontSizes.xs,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    padding: spacing.base,
  },
  cardInfo: {flex: 1, gap: 2},
  cardTitle: {fontSize: fontSizes.md, fontWeight: '700'},
  cardMeta: {fontSize: fontSizes.xs, fontWeight: '600'},
});
