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
 * Batch 3 (Tanda 5, v2 multi-view — Bautismo, Milenio): `treatment ===
 * 'multi-view'` entries have `article_es: null` by design (see
 * `DictionaryEntry`'s own comment) — their premium content is several
 * labeled sections (`getDictionaryMultiviewSections`), one per signed
 * doctrinal tradition or eschatological posture, fetched alongside the entry
 * and rendered as a list of cards instead of one article block. Same gate:
 * the gloss is always visible, every section sits behind `isPremium`
 * together (not section-by-section — there's no product reason to unlock
 * one posture but not another).
 *
 * Reached from the browse screen (`/features/dictionary`) and the deep link
 * eternalbible://features/dictionary/<slug>.
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
import {useTheme} from '@hooks/useTheme';
import {centeredMaxWidth} from '@/styles/responsive';
import {useLanguage} from '@hooks/useLanguage';
import {usePremium} from '@context/PremiumContext';
import {useOfferingSheet} from '@context/OfferingSheetContext';
import {useReaderPreferences} from '@context/ReaderPreferencesContext';
import {
  ReaderPreferencesSheet,
  resolveFontFamily,
  resolveFontFamilyBold,
} from '@components/reading/ReaderPreferencesSheet';
import {haptics} from '@lib/haptics';
import {AppText} from '@components/ui/AppText';
import bibleDB, {
  type DictionaryEntry,
  type DictionaryMultiviewSection,
} from '@lib/database';
import {
  parseMarkdownSegments,
  titleCaseHeadword,
} from '@/features/study/dictionary';
import {
  borderRadius,
  fontSize as fontSizes,
  spacing,
  staticColors,
  verseTextRightSlack,
} from '@/styles/designTokens';

type LoadStatus = 'loading' | 'ready' | 'error' | 'unknown';

/** Renders `parseMarkdownSegments(text)` as inline `Text` nodes — shared by
 *  the single-article body and every multi-view section body, so the bold
 *  and italic handling only lives in one place. Plain-style segments are
 *  returned as bare strings, inheriting the wrapping `Text`'s color — no
 *  separate "plain" color prop needed here.
 *
 *  `boldFontFamily` (reader-preferences wiring): the bundled reader typefaces
 *  are static font FILES, so RN cannot synthesize a faux-bold weight for them
 *  — a bold run needs to switch to the face's own bold-weight family, not
 *  just add `fontWeight: '700'` (see `src/lib/reader/typefaces.ts`'s own
 *  rationale, mirrored exactly here). Plain and italic segments inherit the
 *  wrapping `Text`'s regular-weight `fontFamily`, so they don't need the prop. */
function MarkdownBody({
  text,
  boldColor,
  boldFontFamily,
}: {
  text: string;
  boldColor: string;
  boldFontFamily: string;
}) {
  return (
    <>
      {parseMarkdownSegments(text).map((seg, i) => {
        if (seg.style === 'bold') {
          return (
            <Text
              key={i}
              style={[
                styles.articleBold,
                {color: boldColor, fontFamily: boldFontFamily},
              ]}>
              {seg.text}
            </Text>
          );
        }
        if (seg.style === 'italic') {
          return (
            <Text key={i} style={styles.articleItalic}>
              {seg.text}
            </Text>
          );
        }
        return seg.text;
      })}
    </>
  );
}

export default function DictionaryDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {colors, gradient, highContrast} = useTheme();
  const {t} = useLanguage();
  const dt = t.dictionary;
  const {isPremium} = usePremium();
  const {open: openOfferingSheet} = useOfferingSheet();

  // Aa reading preferences — reuses the SAME global store as the main verse
  // reader (Victor: "si todo lo del reader es reutilizable en el diccionario,
  // adelante"). Only the fields that make sense for a prose gloss/article are
  // wired in below (see `proseStyle`); `margin` and `theme` are deliberately
  // left out — see the comments at their would-be call sites for why.
  const {preferences: readerPrefs} = useReaderPreferences();
  const readerFontFamily = useMemo(
    () => resolveFontFamily(readerPrefs.fontFamily),
    [readerPrefs.fontFamily],
  );
  const readerFontFamilyBold = useMemo(
    () => resolveFontFamilyBold(readerPrefs.fontFamily),
    [readerPrefs.fontFamily],
  );
  const [readerPrefsVisible, setReaderPrefsVisible] = useState(false);

  const params = useLocalSearchParams<{slug?: string}>();
  const [status, setStatus] = useState<LoadStatus>('loading');
  const [entry, setEntry] = useState<DictionaryEntry | null>(null);
  const [multiviewSections, setMultiviewSections] = useState<
    DictionaryMultiviewSection[]
  >([]);

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
      setMultiviewSections(
        row.treatment === 'multi-view'
          ? await bibleDB.getDictionaryMultiviewSections(params.slug)
          : [],
      );
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

  // Prose styling for the gloss + article/multi-view bodies, driven by the
  // reader preferences wired in above. `verseTextRightSlack` already takes a
  // dynamic fontSize (it's the same "fixed-size scripture card" gutter helper
  // this file used before, just no longer pinned to `fontSizes.md`), and the
  // margin/padding split for the anti-clip gutter mirrors the main reader's
  // own hard-won fix (chapter.tsx): a right PADDING disables Android's native
  // inter-word justification, so justified text needs the gutter as a MARGIN
  // instead, while left-aligned text keeps it as padding (the lever that
  // actually clears the OEM glyph-overhang clip there).
  const isJustified = readerPrefs.textAlign === 'justify';
  const proseRightSlack = verseTextRightSlack(readerPrefs.fontSize);
  const proseStyle = {
    fontFamily: readerFontFamily,
    fontSize: readerPrefs.fontSize,
    lineHeight: readerPrefs.fontSize * readerPrefs.lineHeightMultiplier,
    textAlign: readerPrefs.textAlign,
    marginRight: isJustified ? proseRightSlack : 0,
    paddingRight: isJustified ? 0 : proseRightSlack,
  } as const;

  return (
    <>
      <Stack.Screen options={{headerShown: false}} />
      <View style={[styles.container, {backgroundColor: colors.background}]}>
        <LinearGradient
          colors={headerGradient}
          start={{x: 0, y: 0}}
          end={{x: 0, y: 1}}
          style={[styles.header, {paddingTop: insets.top + spacing.md}]}>
          <View style={styles.headerTopRow}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
              accessibilityRole="button"
              accessibilityLabel={t.bible.back}>
              <Ionicons
                name="arrow-back"
                size={24}
                color={staticColors.white}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.readerPrefsButton}
              onPress={() => {
                haptics.tap();
                setReaderPrefsVisible(true);
              }}
              accessibilityRole="button"
              accessibilityLabel={t.readerPrefs.openLabel}>
              <Ionicons
                name="text-outline"
                size={22}
                color={staticColors.white}
              />
            </TouchableOpacity>
          </View>
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
              <Text
                style={[
                  styles.gloss,
                  proseStyle,
                  {color: colors.textSecondary},
                ]}>
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
                        proseStyle,
                        {color: colors.textSecondary},
                      ]}>
                      <MarkdownBody
                        text={entry.article_es}
                        boldColor={colors.text}
                        boldFontFamily={readerFontFamilyBold}
                      />
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
                          color={colors.onPrimary}
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

              {entry.treatment === 'multi-view' &&
              multiviewSections.length > 0 ? (
                <View
                  style={[
                    styles.articleSection,
                    {borderTopColor: colors.border},
                  ]}>
                  <View style={styles.articleHeaderRow}>
                    <Text style={[styles.articleLabel, {color: colors.text}]}>
                      {dt.viewsLabel}
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
                    <View style={styles.viewsList}>
                      {multiviewSections.map(section => (
                        <View
                          key={section.position}
                          style={[
                            styles.viewCard,
                            {
                              backgroundColor: colors.background,
                              borderColor: colors.border,
                            },
                          ]}>
                          <Text
                            style={[styles.viewLabel, {color: colors.primary}]}>
                            {section.label_es}
                          </Text>
                          <Text
                            style={[
                              styles.articleText,
                              proseStyle,
                              {color: colors.textSecondary},
                            ]}>
                            <MarkdownBody
                              text={section.body_es}
                              boldColor={colors.text}
                              boldFontFamily={readerFontFamilyBold}
                            />
                          </Text>
                        </View>
                      ))}
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={styles.lockedRow}
                      onPress={handleUnlock}
                      accessibilityRole="button"
                      accessibilityLabel={`${dt.viewsLabel} — ${t.offering.badgeA11y}`}>
                      <View
                        style={[
                          styles.lockBadge,
                          {backgroundColor: colors.primary},
                        ]}>
                        <Ionicons
                          name="leaf-outline"
                          size={11}
                          color={colors.onPrimary}
                        />
                      </View>
                      <Text
                        style={[
                          styles.lockedText,
                          {color: colors.textSecondary},
                        ]}>
                        {dt.viewsLocked}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              ) : null}
            </View>
          )}
        </ScrollView>

        {/* Aa reading preferences — same global sheet/store as the verse
            reader (app/(tabs)/verse/[book]/[chapter].tsx). */}
        <ReaderPreferencesSheet
          visible={readerPrefsVisible}
          onClose={() => setReaderPrefsVisible(false)}
        />
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
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  readerPrefsButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
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
  // fontSize/lineHeight/textAlign/paddingRight|marginRight come from the
  // reader-preferences-derived `proseStyle` (always merged in after this
  // base style at every call site), so this only needs to exist as a stable
  // style-array anchor.
  gloss: {},
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
  // See `gloss` above — sizing/alignment/gutter all come from `proseStyle`.
  articleText: {},
  articleBold: {
    fontWeight: '700',
  },
  articleItalic: {
    fontStyle: 'italic',
  },
  viewsList: {
    gap: spacing.md,
  },
  viewCard: {
    borderWidth: 1,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    gap: spacing.xs,
  },
  viewLabel: {
    fontSize: fontSizes.sm,
    fontWeight: '700',
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
