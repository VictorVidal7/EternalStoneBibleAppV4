/**
 * 📖 ABOUT THIS BOOK
 *
 * Devotional / educational intro to a specific Bible book — author,
 * approximate date, central theme, historical context and a handful
 * of key verses that deep-link into the reader.
 *
 * Reached from the chapter-grid header's info button. Content lives
 * in [[BOOK_INTROS]] indexed by the canonical book id.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import React, {useMemo} from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import {useLocalSearchParams, useRouter, Stack} from 'expo-router';
import {Ionicons} from '@expo/vector-icons';
import {LinearGradient} from 'expo-linear-gradient';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {haptics} from '@lib/haptics';
import {useTheme} from '@hooks/useTheme';
import {centeredMaxWidth} from '@/styles/responsive';
import {useLanguage} from '@hooks/useLanguage';
import {getBookByName} from '@/constants/bible';
import {getBookIntro} from '@/constants/book-intros';
import {
  borderRadius,
  fontSize as fontSizes,
  spacing,
  staticColors,
} from '@/styles/designTokens';

export default function AboutBookScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {colors, gradient} = useTheme();
  const {t, language} = useLanguage();
  const params = useLocalSearchParams<{book: string}>();

  const rawBook = params.book;
  const bookSlug = typeof rawBook === 'string' ? rawBook : rawBook?.[0] || '';
  const bookInfo = getBookByName(bookSlug);
  const intro = useMemo(
    () => (bookInfo ? getBookIntro(bookInfo.id, language) : null),
    [bookInfo, language],
  );

  const headerGradient = useMemo(
    () =>
      gradient?.headerColors
        ? ([...gradient.headerColors] as [string, string, string])
        : (['#4f46e5', '#7c3aed', '#a855f7'] as [string, string, string]),
    [gradient?.headerColors],
  );

  const localizedBookName = bookInfo
    ? language === 'en'
      ? bookInfo.nameEn
      : bookInfo.name
    : bookSlug;

  // Parse a "1:1" or "1:1-3" reference and jump the reader there. The
  // reader respects the `verse` query param (single int), so for a range
  // we just open at the first verse and the user can scan the rest.
  const handleKeyVerseTap = (ref: string) => {
    if (!bookInfo) return;
    haptics.tap();
    const [chapterPart, versePart] = ref.split(':');
    const chapter = parseInt(chapterPart, 10);
    if (Number.isNaN(chapter)) return;
    const firstVerse = versePart
      ? parseInt(versePart.split('-')[0].split(',')[0], 10)
      : NaN;
    const verseQuery = Number.isNaN(firstVerse) ? '' : `?verse=${firstVerse}`;
    router.push(`/verse/${bookInfo.name}/${chapter}${verseQuery}` as never);
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
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel={t.bible.back}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>

          <View style={styles.headerTextRow}>
            <View style={styles.headerIcon}>
              <Ionicons name="information-circle" size={28} color="#FFFFFF" />
            </View>
            <View style={styles.headerInfo}>
              <Text style={styles.headerLabel}>{t.bookIntro.headerTitle}</Text>
              <Text style={styles.headerTitle} numberOfLines={1}>
                {localizedBookName}
              </Text>
            </View>
          </View>
        </LinearGradient>

        <ScrollView
          style={styles.body}
          contentContainerStyle={[
            styles.bodyContent,
            {paddingBottom: insets.bottom + spacing['4xl']},
            centeredMaxWidth(),
          ]}>
          {intro ? (
            <>
              <InfoCard
                icon="person-outline"
                label={t.bookIntro.author}
                value={intro.author}
                colors={colors}
              />
              <InfoCard
                icon="calendar-outline"
                label={t.bookIntro.date}
                value={intro.date}
                colors={colors}
              />

              <SectionCard
                icon="bulb-outline"
                title={t.bookIntro.theme}
                body={intro.theme}
                colors={colors}
              />
              <SectionCard
                icon="library-outline"
                title={t.bookIntro.context}
                body={intro.context}
                colors={colors}
              />

              <View style={[styles.card, {backgroundColor: colors.surface}]}>
                <View style={styles.cardHeader}>
                  <Ionicons
                    name="bookmark-outline"
                    size={18}
                    color={colors.primary}
                  />
                  <Text style={[styles.cardTitle, {color: colors.text}]}>
                    {t.bookIntro.keyVerses}
                  </Text>
                </View>
                <View style={styles.verseChips}>
                  {intro.keyVerses.map(ref => (
                    <TouchableOpacity
                      key={ref}
                      style={[
                        styles.verseChip,
                        {
                          backgroundColor: colors.primary + '15',
                          borderColor: colors.primary + '40',
                        },
                      ]}
                      onPress={() => handleKeyVerseTap(ref)}
                      accessibilityRole="link"
                      accessibilityLabel={`${localizedBookName} ${ref}`}>
                      <Text
                        style={[styles.verseChipText, {color: colors.primary}]}>
                        {localizedBookName} {ref}
                      </Text>
                      <Ionicons
                        name="chevron-forward"
                        size={14}
                        color={colors.primary}
                      />
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </>
          ) : (
            <View style={[styles.card, {backgroundColor: colors.surface}]}>
              <Text style={[styles.cardBody, {color: colors.textSecondary}]}>
                {t.bookIntro.missingMessage}
              </Text>
            </View>
          )}
        </ScrollView>
      </View>
    </>
  );
}

interface InfoCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  colors: {
    surface: string;
    text: string;
    textSecondary: string;
    primary: string;
  };
}
const InfoCard: React.FC<InfoCardProps> = ({icon, label, value, colors}) => (
  <View style={[styles.card, {backgroundColor: colors.surface}]}>
    <View style={styles.cardHeader}>
      <Ionicons name={icon} size={18} color={colors.primary} />
      <Text style={[styles.cardLabel, {color: colors.textSecondary}]}>
        {label}
      </Text>
    </View>
    <Text style={[styles.cardValue, {color: colors.text}]}>{value}</Text>
  </View>
);

interface SectionCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  body: string;
  colors: InfoCardProps['colors'];
}
const SectionCard: React.FC<SectionCardProps> = ({
  icon,
  title,
  body,
  colors,
}) => (
  <View style={[styles.card, {backgroundColor: colors.surface}]}>
    <View style={styles.cardHeader}>
      <Ionicons name={icon} size={18} color={colors.primary} />
      <Text style={[styles.cardTitle, {color: colors.text}]}>{title}</Text>
    </View>
    <Text style={[styles.cardBody, {color: colors.textSecondary}]}>{body}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: staticColors.glassWhite15,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  headerTextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  headerIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: staticColors.glassWhite18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerInfo: {
    flex: 1,
  },
  headerLabel: {
    color: staticColors.glassWhite80,
    fontSize: fontSizes.sm,
    fontWeight: '600',
    marginBottom: 2,
  },
  headerTitle: {
    color: staticColors.white,
    fontSize: fontSizes['2xl'],
    fontWeight: '800',
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  card: {
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  cardLabel: {
    fontSize: fontSizes.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  cardValue: {
    fontSize: fontSizes.lg,
    fontWeight: '700',
  },
  cardTitle: {
    fontSize: fontSizes.base,
    fontWeight: '700',
  },
  cardBody: {
    fontSize: fontSizes.base,
    lineHeight: 24,
  },
  verseChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  verseChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    gap: 4,
  },
  verseChipText: {
    fontSize: fontSizes.sm,
    fontWeight: '700',
  },
});
