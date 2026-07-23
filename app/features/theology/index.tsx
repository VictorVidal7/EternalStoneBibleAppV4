/**
 * ✝️ TEOLOGÍA — browsable hub of short, essential doctrine essays
 * (BORRADOR — infrastructure phase, see below).
 *
 * A small, deliberately-narrow catalog scoped to "mere Christianity"
 * consensus (Trinity, salvation by grace, Christ's deity/resurrection),
 * mirroring the visual language of the "¿Sabías qué?" hub
 * (`app/features/facts/index.tsx`) — a header + a list of expandable cards,
 * each showing the full essay + its cited passage(s) + a one-tap jump to the
 * reader for the primary anchor verse. Unlike ¿Sabías qué?, entries here can
 * cite multiple/ranged passages (e.g. "1 Corintios 15:3-8; Juan 20:28"), so
 * there is no daily-rotation hero and no live verse-text resolution for
 * every citation — only the primary anchor (`refs[0]`) resolves to a
 * "Abrir en el lector" jump, the full citation is shown as plain text.
 *
 * 100% FREE — no `usePremium()` / `useOfferingSheet()` anywhere in this flow
 * (matches the ¿Sabías qué? / sermon-notes free-tier precedent).
 *
 * Reached from the Home "Explorar" tile.
 *
 * ⚠️ BORRADOR — pendiente de revisión doctrinal, no publicado. The three
 * entries this screen renders (`src/features/study/theology.ts`) are
 * placeholder seed content, NOT yet reviewed or approved by Victor. This
 * screen exists to prove the feature shell works end-to-end — do not treat
 * the content as ship-ready.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import React, {useCallback, useState} from 'react';
import {View, ScrollView, TouchableOpacity, StyleSheet} from 'react-native';
import {Stack, useRouter} from 'expo-router';
import {Ionicons} from '@expo/vector-icons';
import {LinearGradient} from 'expo-linear-gradient';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTheme} from '@hooks/useTheme';
import {useLanguage} from '@hooks/useLanguage';
import {haptics} from '@lib/haptics';
import {AppText} from '@components/ui/AppText';
import {getBookByName} from '@/constants/bible';
import {parseChristRef} from '@/features/study/christConnections';
import {THEOLOGY_ENTRIES, type TheologyEntry} from '@/features/study/theology';
import {
  borderRadius,
  fontSize as fontSizes,
  spacing,
  staticColors,
} from '@/styles/designTokens';

interface TheologyItem {
  title: string;
  topic: string;
  body: string;
  passage: string;
}

export default function TheologyScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {colors, gradient, highContrast} = useTheme();
  const {t, language} = useLanguage();
  const tt = t.theology;
  const items = tt.items as Record<string, TheologyItem>;

  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const toggleExpanded = useCallback((id: string) => {
    haptics.tap();
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const openInReader = useCallback(
    (entry: TheologyEntry) => {
      const primary = entry.refs[0];
      const parsed = primary ? parseChristRef(primary) : null;
      if (!parsed) return;
      const book = getBookByName(parsed.book);
      if (!book) return;
      haptics.tap();
      const display = language === 'es' ? book.name : book.nameEn;
      router.push(
        `/verse/${display}/${parsed.chapter}?verse=${parsed.verse}` as never,
      );
    },
    [router, language],
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
              <Ionicons name="school" size={24} color={staticColors.white} />
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

          {THEOLOGY_ENTRIES.map(entry => {
            const item = items[entry.id];
            if (!item) return null;
            const isOpen = expanded.has(entry.id);
            return (
              <View
                key={entry.id}
                style={[
                  styles.card,
                  {backgroundColor: colors.card, borderColor: colors.border},
                ]}>
                <TouchableOpacity
                  style={styles.cardHeader}
                  onPress={() => toggleExpanded(entry.id)}
                  accessibilityRole="button"
                  accessibilityState={{expanded: isOpen}}
                  accessibilityLabel={item.title}>
                  <View
                    style={[
                      styles.cardIcon,
                      {backgroundColor: entry.accent + '22'},
                    ]}>
                    <Ionicons
                      name={entry.icon as never}
                      size={18}
                      color={entry.accent}
                    />
                  </View>
                  <View style={styles.cardHeaderText}>
                    <AppText
                      scaleRole="compact"
                      style={[styles.cardTopic, {color: entry.accent}]}>
                      {item.topic}
                    </AppText>
                    <AppText
                      style={[styles.cardTitle, {color: colors.text}]}
                      numberOfLines={isOpen ? undefined : 2}>
                      {item.title}
                    </AppText>
                  </View>
                  <Ionicons
                    name={isOpen ? 'chevron-up' : 'chevron-down'}
                    size={16}
                    color={colors.textTertiary}
                  />
                </TouchableOpacity>
                {isOpen && (
                  <View style={styles.cardBody}>
                    <AppText
                      style={[styles.bodyText, {color: colors.textSecondary}]}>
                      {item.body}
                    </AppText>
                    <View style={styles.bottomRow}>
                      <View
                        style={[
                          styles.passageChip,
                          {borderColor: colors.border},
                        ]}>
                        <Ionicons
                          name="bookmark-outline"
                          size={14}
                          color={colors.primary}
                        />
                        <AppText
                          scaleRole="compact"
                          style={[
                            styles.passageChipText,
                            {color: colors.primary},
                          ]}
                          numberOfLines={2}>
                          {item.passage}
                        </AppText>
                      </View>
                      <TouchableOpacity
                        style={[
                          styles.readerButton,
                          {borderColor: colors.border},
                        ]}
                        onPress={() => openInReader(entry)}
                        accessibilityRole="button"
                        accessibilityLabel={tt.openInReader}>
                        <Ionicons
                          name="book-outline"
                          size={14}
                          color={colors.primary}
                        />
                        <AppText
                          scaleRole="compact"
                          style={[
                            styles.readerButtonText,
                            {color: colors.primary},
                          ]}>
                          {tt.openInReader}
                        </AppText>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>
            );
          })}
        </ScrollView>
      </View>
    </>
  );
}

/** Total entries in the catalog, exported for tests. */
export const TOTAL_THEOLOGY_ENTRIES = THEOLOGY_ENTRIES.length;

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
  card: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
  },
  cardIcon: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardHeaderText: {flex: 1, gap: 2},
  cardTopic: {
    fontSize: fontSizes.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  cardTitle: {
    fontSize: fontSizes.md,
    fontWeight: '800',
  },
  cardBody: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    gap: spacing.sm,
  },
  bodyText: {
    fontSize: fontSizes.sm,
    lineHeight: 21,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  passageChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    flexShrink: 1,
  },
  passageChipText: {
    fontSize: fontSizes.xs,
    fontWeight: '700',
    flexShrink: 1,
  },
  readerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
    borderWidth: 1,
  },
  readerButtonText: {
    fontSize: fontSizes.xs,
    fontWeight: '700',
  },
});
