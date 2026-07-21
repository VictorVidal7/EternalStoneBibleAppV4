/**
 * 📖 DICTIONARY DETAIL — free gloss + gated premium article (Tanda 5, v1)
 *
 * Resolves one `dictionary_entries` row (`getDictionaryEntry`) by slug. The
 * free gloss is always shown in full (never a crippled teaser). The premium
 * full article sits behind the exact same free/premium split already shipped
 * for the KJV gloss on Word Study (`app/(tabs)/features/word-study.tsx`,
 * ~L365-419): `isPremium` shows the full text, otherwise a locked row opens
 * the offering sheet. An entry whose `article_es` is `null` (none in the v1
 * batch today, but the column allows it) simply omits that section — no
 * broken teaser for content that doesn't exist.
 *
 * Reached from the browse screen (`/features/dictionary`) and the deep link
 * eternalbible://features/dictionary/<slug>.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import React, {useCallback, useEffect, useState} from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import {Stack, useLocalSearchParams, useRouter} from 'expo-router';
import {Ionicons} from '@expo/vector-icons';
import {LinearGradient} from 'expo-linear-gradient';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTheme} from '@hooks/useTheme';
import {centeredMaxWidth} from '@/styles/responsive';
import {useLanguage} from '@hooks/useLanguage';
import {usePremium} from '@context/PremiumContext';
import {useOfferingSheet} from '@context/OfferingSheetContext';
import {haptics} from '@lib/haptics';
import {AppText} from '@components/ui/AppText';
import bibleDB, {type DictionaryEntry} from '@lib/database';
import {titleCaseHeadword} from '@/features/study/dictionary';
import {
  borderRadius,
  fontSize as fontSizes,
  spacing,
  staticColors,
  verseTextRightSlack,
} from '@/styles/designTokens';

type LoadStatus = 'loading' | 'ready' | 'error' | 'unknown';

export default function DictionaryDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {colors, gradient, highContrast} = useTheme();
  const {t} = useLanguage();
  const dt = t.dictionary;
  const {isPremium} = usePremium();
  const {open: openOfferingSheet} = useOfferingSheet();

  const params = useLocalSearchParams<{slug?: string}>();
  const [status, setStatus] = useState<LoadStatus>('loading');
  const [entry, setEntry] = useState<DictionaryEntry | null>(null);

  const load = useCallback(async () => {
    if (!params.slug) {
      setStatus('unknown');
      return;
    }
    try {
      setStatus('loading');
      await bibleDB.initialize();
      const row = await bibleDB.getDictionaryEntry(params.slug);
      if (!row) {
        setStatus('unknown');
        return;
      }
      setEntry(row);
      setStatus('ready');
    } catch {
      setStatus('error');
    }
  }, [params.slug]);

  useEffect(() => {
    load();
  }, [load]);

  const handleUnlock = useCallback(() => {
    haptics.tap();
    openOfferingSheet();
  }, [openOfferingSheet]);

  const title = entry ? titleCaseHeadword(entry.headword_es) : '';
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
              <Ionicons name="book" size={24} color={staticColors.white} />
            </View>
            <View style={styles.headerInfo}>
              <AppText scaleRole="compact" style={styles.headerLabel}>
                {dt.subtitle}
              </AppText>
              <AppText scaleRole="display" style={styles.headerTitle}>
                {title}
              </AppText>
            </View>
          </View>
        </LinearGradient>

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}>
          {status === 'loading' && (
            <View style={styles.centerState}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          )}

          {(status === 'error' || status === 'unknown') && (
            <View style={styles.centerState}>
              <Ionicons
                name="alert-circle-outline"
                size={40}
                color={colors.textTertiary}
              />
              <AppText
                style={[styles.stateText, {color: colors.textSecondary}]}>
                {dt.error}
              </AppText>
            </View>
          )}

          {status === 'ready' && entry && (
            <View
              style={[
                styles.entryCard,
                {backgroundColor: colors.surface, borderColor: colors.primary},
              ]}>
              <Text style={[styles.gloss, {color: colors.textSecondary}]}>
                {entry.gloss_es}
              </Text>

              {entry.article_es ? (
                <View
                  style={[
                    styles.articleSection,
                    {borderTopColor: colors.border},
                  ]}>
                  <View style={styles.articleHeaderRow}>
                    <Text style={[styles.articleLabel, {color: colors.text}]}>
                      {dt.articleLabel}
                    </Text>
                    <View
                      style={[
                        styles.exclusiveBadge,
                        {backgroundColor: colors.primary + '1a'},
                      ]}>
                      <Text
                        style={[styles.exclusiveText, {color: colors.primary}]}>
                        {t.originals.exclusiveLabel}
                      </Text>
                    </View>
                  </View>
                  {isPremium ? (
                    <Text
                      style={[
                        styles.articleText,
                        {color: colors.textSecondary},
                      ]}>
                      {entry.article_es}
                    </Text>
                  ) : (
                    <TouchableOpacity
                      style={styles.lockedRow}
                      onPress={handleUnlock}
                      accessibilityRole="button"
                      accessibilityLabel={`${dt.articleLabel} — ${t.offering.badgeA11y}`}>
                      <View
                        style={[
                          styles.lockBadge,
                          {backgroundColor: colors.primary},
                        ]}>
                        <Ionicons
                          name="leaf-outline"
                          size={11}
                          color={staticColors.white}
                        />
                      </View>
                      <Text
                        style={[
                          styles.lockedText,
                          {color: colors.textSecondary},
                        ]}>
                        {dt.articleLocked}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              ) : null}
            </View>
          )}
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
    gap: spacing.md,
    ...centeredMaxWidth(),
  },
  centerState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing['2xl'],
    gap: spacing.sm,
  },
  stateText: {
    fontSize: fontSizes.md,
    fontWeight: '700',
    textAlign: 'center',
  },
  entryCard: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    padding: spacing.md,
    gap: spacing.sm,
  },
  gloss: {
    fontSize: fontSizes.md,
    lineHeight: fontSizes.md * 1.5,
    paddingRight: verseTextRightSlack(fontSizes.md),
  },
  articleSection: {
    marginTop: spacing.xs,
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: spacing.xs,
  },
  articleHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  articleLabel: {fontSize: fontSizes.sm, fontWeight: '700'},
  articleText: {
    fontSize: fontSizes.md,
    lineHeight: fontSizes.md * 1.5,
    paddingRight: verseTextRightSlack(fontSizes.md),
  },
  lockedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: 2,
  },
  lockBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockedText: {fontSize: fontSizes.sm, flexShrink: 1},
  exclusiveBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  exclusiveText: {
    fontSize: fontSizes.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
});
