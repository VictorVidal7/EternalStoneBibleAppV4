/**
 * 🕊️ COMPARTE TU FE — method detail (ordered steps for one gospel outline).
 *
 * Resolves a method's curated, ORDERED steps ([[shareFaithMethods]]) to verse
 * text from the SQLite Bible DB and lists them in sequence, each step
 * showing its one-clause caption plus the resolved verse text, tappable to
 * jump straight into the reader — mirrors the objection detail screen
 * (`/features/share-faith/objections/[id]`) exactly, with the addition of
 * ordering + captions (this module's own thing, see [[shareFaithMethods]]'s
 * header). The header takes the method's accent colour so each outline has
 * its own identity.
 *
 * The app never argues a case here — it only reproduces well-known gospel
 * verse sequences (a Romans-only route, a bridge image, a four-step
 * summary, and a design/brokenness/restoration creation-fall-redemption
 * arc — see [[shareFaithMethods]] for why none is named after any one org's
 * specific tract) with its own real Scripture; reading, reflecting, and
 * sharing in their own words is left entirely to the reader.
 *
 * 100% FREE — no `usePremium()` / `useOfferingSheet()` anywhere in this
 * flow. 100% JS: the taxonomy is the pure
 * src/features/study/shareFaithMethods.ts; verse text is fetched from
 * SQLite; zero new native, zero Firestore.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import React, {useCallback, useEffect, useMemo, useState} from 'react';
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
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useTheme} from '@hooks/useTheme';
import {centeredMaxWidth} from '@/styles/responsive';
import {useLanguage} from '@hooks/useLanguage';
import {haptics} from '@lib/haptics';
import {AppText} from '@components/ui/AppText';
import bibleDB from '@lib/database';
import {getBookByName} from '@/constants/bible';
import {christLangForVersion} from '@/features/study/christConnections';
import {
  getShareFaithMethod,
  parseMethodRef,
} from '@/features/study/shareFaithMethods';
import type {
  MethodRefKey,
  ShareFaithMethodStep,
} from '@/features/study/shareFaithMethods';
import {logger} from '@lib/utils/logger';
import {
  borderRadius,
  fontSize as fontSizes,
  spacing,
  staticColors,
  verseTextRightSlack,
} from '@/styles/designTokens';

type LoadStatus = 'loading' | 'ready' | 'error' | 'unknown';

/** A resolved step row (canonical key + display name + fetched text + caption). */
interface MethodStepRow {
  captionKey: string;
  bookId: number | null;
  bookDisplay: string;
  chapter: number;
  verse: number;
  text: string | null;
}

const VERSION_KEY = '@bible_version';

/**
 * Resolve a method step's canonical ref to a display row.
 *
 * Every branch that ends up with `text: null` (and thus renders the
 * `missingText` placeholder) logs WHY — a typo'd/malformed ref, an unknown
 * book, a query that threw, or a query that simply found no row — plus the
 * ref and the active `version`. Before this, all four cases collapsed into
 * an indistinguishable "(texto no disponible)" with a bare `catch {}` and
 * `row?.text ?? null`, which is exactly why a real report of this
 * placeholder appearing was undiagnosable from the code alone (no signal on
 * which reading version was active, or whether the DB call even ran).
 */
async function resolveStepRow(
  step: ShareFaithMethodStep,
  version: string,
  language: 'es' | 'en',
): Promise<MethodStepRow> {
  const key: MethodRefKey = step.ref;
  const parsed = parseMethodRef(key);
  if (!parsed) {
    logger.warn('Share-faith method step: unparseable ref', {
      component: 'ShareFaithMethodDetailScreen',
      action: 'resolveStepRow',
      ref: key,
      version,
      reason: 'unparseable-ref',
    });
    return {
      captionKey: step.captionKey,
      bookId: null,
      bookDisplay: key,
      chapter: 0,
      verse: 0,
      text: null,
    };
  }
  const book = getBookByName(parsed.book);
  const bookDisplay = book
    ? language === 'en'
      ? book.nameEn
      : book.name
    : parsed.book;
  if (!book) {
    logger.warn('Share-faith method step: unknown book', {
      component: 'ShareFaithMethodDetailScreen',
      action: 'resolveStepRow',
      ref: key,
      version,
      reason: 'unknown-book',
    });
    return {
      captionKey: step.captionKey,
      bookId: null,
      bookDisplay,
      chapter: parsed.chapter,
      verse: parsed.verse,
      text: null,
    };
  }
  try {
    const row = await bibleDB.getVerse(
      book.id,
      parsed.chapter,
      parsed.verse,
      version,
    );
    if (!row) {
      logger.warn('Share-faith method step: verse not found for version', {
        component: 'ShareFaithMethodDetailScreen',
        action: 'resolveStepRow',
        ref: key,
        version,
        bookId: book.id,
        reason: 'no-row',
      });
    }
    return {
      captionKey: step.captionKey,
      bookId: book.id,
      bookDisplay,
      chapter: parsed.chapter,
      verse: parsed.verse,
      text: row?.text ?? null,
    };
  } catch (err) {
    logger.warn('Share-faith method step: getVerse threw', {
      component: 'ShareFaithMethodDetailScreen',
      action: 'resolveStepRow',
      ref: key,
      version,
      bookId: book.id,
      reason: 'query-threw',
      error: err instanceof Error ? err.message : String(err),
    });
    return {
      captionKey: step.captionKey,
      bookId: book.id,
      bookDisplay,
      chapter: parsed.chapter,
      verse: parsed.verse,
      text: null,
    };
  }
}

export default function ShareFaithMethodDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {colors, gradient, highContrast} = useTheme();
  const {t} = useLanguage();
  const tt = t.shareFaith.methods;

  const params = useLocalSearchParams<{id?: string}>();
  const method = useMemo(() => getShareFaithMethod(params.id), [params.id]);
  const localized = method
    ? (tt.list as Record<string, {title: string; description: string}>)[
        method.id
      ]
    : undefined;
  const title = localized?.title ?? method?.id ?? '';
  const stepCaptions = method
    ? (tt.stepCaptions as Record<string, Record<string, string>>)[method.id]
    : undefined;

  const [status, setStatus] = useState<LoadStatus>('loading');
  const [rows, setRows] = useState<MethodStepRow[]>([]);

  const load = useCallback(async () => {
    if (!method) {
      setStatus('unknown');
      return;
    }
    try {
      setStatus('loading');
      const version = (await AsyncStorage.getItem(VERSION_KEY)) ?? 'RVR1960';
      // Book names follow the reading version's language, not the UI language.
      const bookLang = christLangForVersion(version);
      const resolved = await Promise.all(
        method.steps.map(step => resolveStepRow(step, version, bookLang)),
      );
      setRows(resolved);
      setStatus('ready');
    } catch (err) {
      logger.error('Share-faith method detail load failed', err as Error, {
        component: 'ShareFaithMethodDetailScreen',
        action: 'load',
      });
      setStatus('error');
    }
  }, [method]);

  useEffect(() => {
    load();
  }, [load]);

  const handleJump = useCallback(
    (row: MethodStepRow) => {
      if (row.bookId == null) return;
      haptics.tap();
      router.push({
        pathname: `/verse/${row.bookDisplay}/${row.chapter}` as never,
        params: {verse: row.verse},
      });
    },
    [router],
  );

  const accent = method?.accent ?? colors.primary;
  const headerGradient: readonly [string, string, ...string[]] = highContrast
    ? (gradient.headerColors as readonly [string, string, ...string[]])
    : [accent, colors.primaryDark];

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
                name={(method?.icon ?? 'map') as keyof typeof Ionicons.glyphMap}
                size={24}
                color={staticColors.white}
              />
            </View>
            <View style={styles.headerInfo}>
              <AppText scaleRole="compact" style={styles.headerLabel}>
                {tt.subtitle}
              </AppText>
              <AppText scaleRole="display" style={styles.headerTitle}>
                {title}
              </AppText>
            </View>
          </View>
          {localized?.description ? (
            <AppText scaleRole="compact" style={styles.headerDesc}>
              {localized.description}
            </AppText>
          ) : null}
        </LinearGradient>

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}>
          {status === 'loading' && (
            <View style={styles.centerState}>
              <ActivityIndicator size="large" color={accent} />
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
                {tt.error}
              </AppText>
            </View>
          )}

          {status === 'ready' &&
            rows.map((row, index) => {
              const ref = `${row.bookDisplay} ${row.chapter}:${row.verse}`;
              const caption = stepCaptions?.[row.captionKey];
              const stepLabel = tt.stepLabel.replace(
                '{{n}}',
                String(index + 1),
              );
              return (
                <TouchableOpacity
                  key={row.captionKey}
                  style={[
                    styles.stepCard,
                    {backgroundColor: colors.card, borderColor: colors.border},
                  ]}
                  onPress={() => handleJump(row)}
                  disabled={row.bookId == null}
                  accessibilityRole="button"
                  accessibilityLabel={`${stepLabel}: ${ref}`}
                  accessibilityHint={tt.openHint}>
                  <View style={styles.stepHeader}>
                    <View
                      style={[
                        styles.stepBadge,
                        {backgroundColor: accent + '22'},
                      ]}>
                      <AppText
                        scaleRole="compact"
                        style={[styles.stepBadgeText, {color: accent}]}>
                        {index + 1}
                      </AppText>
                    </View>
                    <AppText
                      scaleRole="compact"
                      style={[styles.stepLabel, {color: colors.textTertiary}]}>
                      {stepLabel}
                    </AppText>
                    <View style={styles.stepHeaderSpacer} />
                    <Ionicons
                      name="chevron-forward"
                      size={16}
                      color={colors.textTertiary}
                    />
                  </View>
                  {caption ? (
                    <AppText
                      scaleRole="compact"
                      style={[styles.stepCaption, {color: colors.text}]}>
                      {caption}
                    </AppText>
                  ) : null}
                  <AppText
                    scaleRole="compact"
                    style={[styles.verseRef, {color: accent}]}>
                    {ref}
                  </AppText>
                  <Text
                    style={[styles.verseText, {color: colors.textSecondary}]}
                    numberOfLines={4}>
                    {row.text ?? tt.missingText}
                  </Text>
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
  headerDesc: {
    color: staticColors.glassWhite95,
    fontSize: fontSizes.sm,
    marginTop: spacing.sm,
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
  stepCard: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    padding: spacing.md,
    gap: spacing.xs,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  stepBadge: {
    width: 24,
    height: 24,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepBadgeText: {
    fontSize: fontSizes.xs,
    fontWeight: '800',
  },
  stepLabel: {
    fontSize: fontSizes.xs,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  stepHeaderSpacer: {flex: 1},
  stepCaption: {
    fontSize: fontSizes.md,
    fontWeight: '600',
  },
  verseRef: {
    fontSize: fontSizes.sm,
    fontWeight: '700',
  },
  verseText: {
    fontSize: fontSizes.md,
    lineHeight: fontSizes.md * 1.5,
    paddingRight: verseTextRightSlack(fontSizes.md),
  },
});
