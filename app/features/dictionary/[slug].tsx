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
import {
  useReaderPreferences,
  READER_MARGIN_PADDING,
} from '@context/ReaderPreferencesContext';
import {
  ReaderPreferencesSheet,
  resolveFontFamily,
  resolveFontFamilyBold,
} from '@components/reading/ReaderPreferencesSheet';
import {resolveReaderTheme} from '@/styles/readerThemes';
import {
  linkifyReferences,
  type ParsedReference,
} from '@/lib/references/parseReference';
import {haptics} from '@lib/haptics';
import {AppText} from '@components/ui/AppText';
import bibleDB, {
  type DictionaryEntry,
  type DictionaryMultiviewSection,
} from '@lib/database';
import {
  getRelatedSlugs,
  parseMarkdownSegments,
  titleCaseHeadword,
} from '@/features/study/dictionary';
import {getNavesCrossReferences} from '@/features/study/dictionaryNaves';
import {
  borderRadius,
  fontSize as fontSizes,
  spacing,
  staticColors,
  verseTextRightSlack,
} from '@/styles/designTokens';

type LoadStatus = 'loading' | 'ready' | 'error' | 'unknown';

/** Linkify Bible references (`linkifyReferences`) inside a run of plain
 *  text, rendering matches as tappable underlined spans — the SAME
 *  recognizer + tap-to-jump affordance already used inline in the main verse
 *  reader (`app/(tabs)/verse/[book]/[chapter].tsx`'s `jumpToReference`) and
 *  derived for sermon notes (`src/features/study/sermonNotes.ts`'s
 *  `getReferencedVerses`), now reused so dictionary citations like "Lv 16" or
 *  "Dt 1:2" become tappable too. Called both per-segment from `MarkdownBody`
 *  (article/multi-view bodies) and directly on the free gloss (which has no
 *  bold/italic markdown of its own, so it skips `parseMarkdownSegments`).
 *  Segments with no reference are returned as bare strings, inheriting the
 *  wrapping `Text`'s style — same "no separate plain color prop" idiom as
 *  `MarkdownBody` itself. `keyPrefix` disambiguates React keys across the
 *  outer loop (one caller can invoke this several times, e.g. once per
 *  markdown segment, and each one can itself contain zero, one, or several
 *  references).
 *
 *  FIXED GAP (was pre-existing in `linkifyReferences`): `REF_REGEX` used to
 *  be built from each book's raw `abbr` string with no diacritic folding, so
 *  an accented abbreviation actually used in the seeded ISBE text — "Éx" for
 *  Éxodo — never matched, because `BIBLE_BOOKS`' own `abbr` for that book is
 *  the unaccented "Ex" (confirmed against `assets/dictionary-v1-es.json`,
 *  which contains many "Éx 4:1"-style citations). `parseReference.ts` now
 *  builds `REF_REGEX` with accent-insensitive vowel character classes (see
 *  `accentInsensitiveSource`), so both "Éx 4:1" and "Ex 4:1" — and any other
 *  accented/unaccented spelling of an abbreviation — resolve to the same
 *  book. Fixed at the shared-parser level, so the main reader and sermon
 *  notes get the same fix for free. */
function linkifyMarkdownSegment(
  text: string,
  linkColor: string,
  onPressReference: (ref: ParsedReference) => void,
  keyPrefix: number,
): React.ReactNode {
  const refSegments = linkifyReferences(text);
  if (refSegments.length === 1 && !refSegments[0].ref) return text;
  return refSegments.map((seg, j) =>
    seg.ref ? (
      <Text
        key={`${keyPrefix}-${j}`}
        onPress={() => onPressReference(seg.ref!)}
        style={[styles.crossRefLink, {color: linkColor}]}>
        {seg.text}
      </Text>
    ) : (
      seg.text
    ),
  );
}

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
 *  wrapping `Text`'s regular-weight `fontFamily`, so they don't need the prop.
 *
 *  Every segment (regardless of bold/italic/plain) is additionally run
 *  through `linkifyMarkdownSegment` so an inline Bible citation stays
 *  tappable no matter which markdown style it happens to sit inside. */
function MarkdownBody({
  text,
  boldColor,
  boldFontFamily,
  linkColor,
  onPressReference,
}: {
  text: string;
  boldColor: string;
  boldFontFamily: string;
  linkColor: string;
  onPressReference: (ref: ParsedReference) => void;
}) {
  return (
    <>
      {parseMarkdownSegments(text).map((seg, i) => {
        const linked = linkifyMarkdownSegment(
          seg.text,
          linkColor,
          onPressReference,
          i,
        );
        if (seg.style === 'bold') {
          return (
            <Text
              key={i}
              style={[
                styles.articleBold,
                {color: boldColor, fontFamily: boldFontFamily},
              ]}>
              {linked}
            </Text>
          );
        }
        if (seg.style === 'italic') {
          return (
            <Text key={i} style={styles.articleItalic}>
              {linked}
            </Text>
          );
        }
        return <React.Fragment key={i}>{linked}</React.Fragment>;
      })}
    </>
  );
}

export default function DictionaryDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {colors, gradient, highContrast, isDark} = useTheme();
  const {t} = useLanguage();
  const dt = t.dictionary;
  const {isPremium} = usePremium();
  const {open: openOfferingSheet} = useOfferingSheet();

  // Aa reading preferences — reuses the SAME global store as the main verse
  // reader (Victor: "si todo lo del reader es reutilizable en el diccionario,
  // adelante"). Every field is wired in: typography/alignment feed
  // `proseStyle` below; `margin` sets the horizontal gutter around the entry
  // card via `READER_MARGIN_PADDING` (mirrors chapter.tsx's
  // `readerPaddingHorizontal`); `theme` recolors the reading surface — the
  // entry/multi-view cards and their body text — via `resolveReaderTheme`
  // into `themedColors` below. The top header banner, the Aa button and the
  // EXCLUSIVO badge stay on the plain app theme, same as chapter.tsx keeps
  // its own screen chrome (nav bar, toolbar) off the reading-surface palette.
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
  // "Ver también" — sibling entries from the small static
  // `getRelatedSlugs` map (src/features/study/dictionary.ts), resolved to
  // their display headwords. Only queried when the current entry actually
  // has related slugs, in the map's own order (not alphabetical/query
  // order) so the most relevant link surfaces first.
  const [relatedEntries, setRelatedEntries] = useState<
    Pick<DictionaryEntry, 'slug' | 'headword_es' | 'gloss_es'>[]
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
      const relatedSlugs = getRelatedSlugs(row.slug);
      if (relatedSlugs.length > 0) {
        const all = await bibleDB.getAllDictionaryEntries();
        const bySlug = new Map(all.map(e => [e.slug, e]));
        setRelatedEntries(
          relatedSlugs
            .map(slug => bySlug.get(slug))
            .filter(
              (
                e,
              ): e is Pick<
                DictionaryEntry,
                'slug' | 'headword_es' | 'gloss_es'
              > => e !== undefined,
            ),
        );
      } else {
        setRelatedEntries([]);
      }
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

  // Tap-to-jump for an inline Bible citation recognized by `linkifyReferences`
  // inside a gloss/article body (see `MarkdownBody`). Mirrors chapter.tsx's
  // `jumpToReference` — pushes the cited chapter (optionally scrolled to a
  // specific verse) onto the verse-reader route. No jump-back-stack bookkeeping
  // here (that's chapter.tsx's own within-screen cross-ref feature); this is a
  // normal `router.push` from a different screen, so the OS/back button
  // already returns to this dictionary entry.
  const handleReferencePress = useCallback(
    (ref: ParsedReference) => {
      haptics.selection();
      const base = `/verse/${ref.book.name}/${ref.chapter}`;
      router.push(
        (ref.verse !== undefined
          ? `${base}?verse=${ref.verse}`
          : base) as never,
      );
    },
    [router],
  );

  // "Ver también" row tap — same in-app navigation the browse screen uses
  // (`app/features/dictionary/index.tsx`'s own `router.push`), just from
  // this detail screen instead of the list. Always free: this is plain
  // additive navigation between entries that already exist, never gated.
  const handleRelatedPress = useCallback(
    (slug: string) => {
      haptics.selection();
      router.push(`/features/dictionary/${slug}` as never);
    },
    [router],
  );

  const title = entry ? titleCaseHeadword(entry.headword_es) : '';
  const headerGradient: readonly [string, string, ...string[]] = highContrast
    ? (gradient.headerColors as readonly [string, string, ...string[]])
    : [colors.primary, colors.primaryDark];

  // Nave's Topical Bible cross-reference panel (Tanda 5, v1.1 fast-follow —
  // see `dictionaryNaves.ts`'s own doc comment for scope/sourcing). A pure
  // static lookup keyed by slug, empty outside the 6-entry allow-list, so
  // this is a no-op render for every other entry. Always free, same
  // reasoning as "Ver también" above — a list of Bible references, not
  // translated commentary.
  const navesSections = entry ? getNavesCrossReferences(entry.slug) : [];

  // Reader-margin gutter (Sprint T-audit): the horizontal padding between the
  // screen edge and the entry card now follows the Aa margin preference,
  // exactly like chapter.tsx's `readerPaddingHorizontal` does for the verse
  // column. `centeredMaxWidth()`'s wide-screen cap on `styles.content` is
  // untouched — margin only adjusts the padding WITHIN that cap.
  const readerPaddingHorizontal = READER_MARGIN_PADDING[readerPrefs.margin];

  // Reading-surface theme (Sprint T-audit): recolors the entry/multi-view
  // cards and their body text via the SAME palette resolver the main reader
  // uses (`resolveReaderTheme`) — 'system' (the default) resolves back to the
  // live app colors, so an existing user sees zero change until they pick a
  // reading theme. Scoped narrowly to the article content, NOT the top header
  // banner / Aa button / EXCLUSIVO badge — those stay on `colors` (the plain
  // app theme), same split chapter.tsx keeps between its reading surface and
  // its own screen chrome.
  const themedColors = resolveReaderTheme(colors, readerPrefs.theme, isDark);

  // Prose styling for the gloss + article/multi-view bodies, driven by the
  // reader preferences wired in above. `verseTextRightSlack` already takes a
  // dynamic fontSize (it's the same "fixed-size scripture card" gutter helper
  // this file used before, just no longer pinned to `fontSizes.md`).
  //
  // This used to give justified text the gutter as a MARGIN instead of
  // padding, on the theory that padding disables Android's native
  // inter-word justification. Sprint 112 (chapter.tsx's own clip saga,
  // 2026-07-28) disproved that: `textAlign: 'justify'` was pixel-scanned
  // on-device and found NOT to actually stretch lines flush on this
  // Android/RN build at all, AND marginRight was independently found to
  // never fully prevent the clip (it narrows the box but doesn't extend
  // Android's glyph clip rect the way padding does). Every other screen
  // using `verseTextRightSlack` already applies it as a plain
  // unconditional `paddingRight` — this file was the one outlier still
  // carrying the disproven pattern, found while closing that investigation
  // out. Now unconditional, matching everyone else.
  const proseRightSlack = verseTextRightSlack(readerPrefs.fontSize);
  const proseStyle = {
    fontFamily: readerFontFamily,
    fontSize: readerPrefs.fontSize,
    lineHeight: readerPrefs.fontSize * readerPrefs.lineHeightMultiplier,
    textAlign: readerPrefs.textAlign,
    paddingRight: proseRightSlack,
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
          contentContainerStyle={[
            styles.content,
            {paddingHorizontal: readerPaddingHorizontal},
          ]}
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
                {
                  backgroundColor: themedColors.surface,
                  borderColor: themedColors.primary,
                },
              ]}>
              <Text
                style={[
                  styles.gloss,
                  proseStyle,
                  {color: themedColors.textSecondary},
                ]}
                textBreakStrategy="simple">
                {linkifyMarkdownSegment(
                  entry.gloss_es,
                  themedColors.primary,
                  handleReferencePress,
                  0,
                )}
              </Text>

              {entry.article_es ? (
                <View
                  style={[
                    styles.articleSection,
                    {borderTopColor: colors.border},
                  ]}>
                  <View style={styles.articleHeaderRow}>
                    <Text
                      style={[styles.articleLabel, {color: themedColors.text}]}>
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
                        {color: themedColors.textSecondary},
                      ]}
                      textBreakStrategy="simple">
                      <MarkdownBody
                        text={entry.article_es}
                        boldColor={themedColors.text}
                        boldFontFamily={readerFontFamilyBold}
                        linkColor={themedColors.primary}
                        onPressReference={handleReferencePress}
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
                          {color: themedColors.textSecondary},
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
                    <Text
                      style={[styles.articleLabel, {color: themedColors.text}]}>
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
                              backgroundColor: themedColors.background,
                              borderColor: themedColors.border,
                            },
                          ]}>
                          <Text
                            style={[
                              styles.viewLabel,
                              {color: themedColors.primary},
                            ]}>
                            {section.label_es}
                          </Text>
                          <Text
                            style={[
                              styles.articleText,
                              proseStyle,
                              {color: themedColors.textSecondary},
                            ]}
                            textBreakStrategy="simple">
                            <MarkdownBody
                              text={section.body_es}
                              boldColor={themedColors.text}
                              boldFontFamily={readerFontFamilyBold}
                              linkColor={themedColors.primary}
                              onPressReference={handleReferencePress}
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
                          {color: themedColors.textSecondary},
                        ]}>
                        {dt.viewsLocked}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              ) : null}

              {navesSections.length > 0 ? (
                <View
                  style={[
                    styles.articleSection,
                    {borderTopColor: colors.border},
                  ]}>
                  <View style={styles.articleHeaderRow}>
                    <Text
                      style={[styles.articleLabel, {color: themedColors.text}]}>
                      {dt.navesLabel}
                    </Text>
                  </View>
                  <View style={styles.navesList}>
                    {navesSections.map((section, i) => (
                      <View
                        key={i}
                        style={[
                          styles.navesCard,
                          {
                            backgroundColor: themedColors.background,
                            borderColor: themedColors.border,
                          },
                        ]}>
                        <Text
                          style={[
                            styles.navesHeading,
                            {color: themedColors.text},
                          ]}>
                          {section.heading}
                        </Text>
                        <Text
                          style={[
                            styles.navesRefs,
                            {color: themedColors.textSecondary},
                          ]}>
                          {linkifyMarkdownSegment(
                            section.refs.join('; '),
                            themedColors.primary,
                            handleReferencePress,
                            i,
                          )}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              ) : null}

              {relatedEntries.length > 0 ? (
                <View
                  style={[
                    styles.articleSection,
                    {borderTopColor: colors.border},
                  ]}>
                  <View style={styles.articleHeaderRow}>
                    <Text
                      style={[styles.articleLabel, {color: themedColors.text}]}>
                      {dt.relatedLabel}
                    </Text>
                  </View>
                  <View style={styles.relatedList}>
                    {relatedEntries.map(rel => (
                      <TouchableOpacity
                        key={rel.slug}
                        style={styles.relatedRow}
                        onPress={() => handleRelatedPress(rel.slug)}
                        accessibilityRole="button"
                        accessibilityLabel={titleCaseHeadword(rel.headword_es)}>
                        <Ionicons
                          name="arrow-forward-circle-outline"
                          size={18}
                          color={themedColors.primary}
                        />
                        <Text
                          style={[
                            styles.relatedText,
                            {color: themedColors.primary},
                          ]}>
                          {titleCaseHeadword(rel.headword_es)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
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
  // paddingHorizontal is NOT set here — it comes from the reader-preferences
  // -derived `readerPaddingHorizontal` (always merged in as an inline
  // override at the ScrollView call site), so the Aa margin control actually
  // takes effect. Vertical padding and the `centeredMaxWidth()` wide-screen
  // cap stay fixed regardless of margin.
  content: {
    paddingTop: spacing.lg,
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
  articleLabel: {fontSize: fontSizes.sm, fontWeight: '700', flexShrink: 1},
  // See `gloss` above — sizing/alignment/gutter all come from `proseStyle`.
  articleText: {},
  articleBold: {
    fontWeight: '700',
  },
  articleItalic: {
    fontStyle: 'italic',
  },
  // Tappable inline Bible citation (linkifyReferences match) — color comes
  // from `linkColor` at each MarkdownBody call site.
  crossRefLink: {
    textDecorationLine: 'underline',
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
  // Nave's Topical Bible cross-reference panel — mirrors viewsList/viewCard's
  // card layout so it reads as the same visual family as the multi-view
  // section, not a new pattern.
  navesList: {
    gap: spacing.sm,
  },
  navesCard: {
    borderWidth: 1,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    gap: spacing.xs,
  },
  navesHeading: {
    fontSize: fontSizes.sm,
    fontWeight: '700',
  },
  navesRefs: {
    fontSize: fontSizes.sm,
    lineHeight: fontSizes.sm * 1.4,
  },
  // "Ver también" related-entry links.
  relatedList: {
    gap: spacing.xs,
  },
  relatedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: 2,
  },
  relatedText: {
    fontSize: fontSizes.sm,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});
