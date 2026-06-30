/**
 * ✝️ PROPHETIC THREAD — the "Hilo profético" (Cristo en las profecías).
 *
 * A calm, guided walk through the Old-Testament messianic prophecies and their
 * fulfillment in the Lord Jesus, in the order of His life — coming, ministry,
 * passion, resurrection ([[messianicProphecies]]). Each step frames a prophecy
 * with its theme, shows the OT verse, an arrow to the NT verse where it is
 * fulfilled, and a brief faithful note, both openable in the reader. "Y
 * comenzando desde Moisés, y siguiendo por todos los profetas, les declaraba en
 * todas las Escrituras lo que de él decían" (Lucas 24:27).
 *
 * Verse text from SQLite (the reader's selected version); 100% JS, zero new
 * native. Reached from the Home study/explore entry + the deep link
 * eternalbible://features/prophecies.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import React, {useEffect, useMemo, useState} from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import {Stack, useRouter} from 'expo-router';
import {Ionicons} from '@expo/vector-icons';
import {LinearGradient} from 'expo-linear-gradient';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTheme} from '@hooks/useTheme';
import {centeredMaxWidth} from '@/styles/responsive';
import {useLanguage} from '@hooks/useLanguage';
import {useBibleVersion} from '@hooks/useBibleVersion';
import {haptics} from '@lib/haptics';
import {AppText} from '@components/ui/AppText';
import bibleDB from '@lib/database';
import {logger} from '@lib/utils/logger';
import {getBookByName} from '@/constants/bible';
import {parseChristRef} from '@/features/study/christConnections';
import {
  MESSIANIC_PROPHECIES,
  PROPHECY_GROUP_ACCENT,
  PROPHECY_GROUP_ICON,
  isNtQuoted,
  getPropheciesByGroup,
  type ProphecyRefKey,
} from '@/features/study/messianicProphecies';
import {
  getVisitedProphecies,
  markPropheciesVisited,
} from '@/features/study/prophecyProgress';
import {
  ProphecyShareModal,
  type ProphecyShareContent,
} from '@components/study/ProphecyShareModal';
import {
  borderRadius,
  fontSize as fontSizes,
  spacing,
  staticColors,
  verseTextRightSlack,
} from '@/styles/designTokens';

type LoadStatus = 'loading' | 'ready' | 'error';

interface ResolvedRef {
  reference: string;
  text: string | null;
}

export default function PropheticThreadScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {colors} = useTheme();
  const {t} = useLanguage();
  const {selectedVersion} = useBibleVersion();
  const tp = t.prophecies;

  const total = MESSIANIC_PROPHECIES.length;
  // -1 = intro, 0..total-1 = a prophecy, total = finished.
  const [phase, setPhase] = useState(-1);
  const [status, setStatus] = useState<LoadStatus>('loading');
  const [prophecy, setProphecy] = useState<ResolvedRef | null>(null);
  const [fulfillment, setFulfillment] = useState<ResolvedRef | null>(null);
  const [sourcesOpen, setSourcesOpen] = useState(false);
  const [indexOpen, setIndexOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [visited, setVisited] = useState<Set<string>>(new Set());

  // Load the device-local "explored" marks once.
  useEffect(() => {
    let active = true;
    void getVisitedProphecies().then(set => {
      if (active) setVisited(set);
    });
    return () => {
      active = false;
    };
  }, []);

  const current =
    phase >= 0 && phase < total ? MESSIANIC_PROPHECIES[phase] : null;
  const accent = current
    ? PROPHECY_GROUP_ACCENT[current.group]
    : colors.primary;
  const headerGradient: [string, string] = [colors.primary, colors.primaryDark];

  const localizedRef = useMemo(
    () => (ref: ProphecyRefKey) => {
      const parsed = parseChristRef(ref);
      if (!parsed) return null;
      const book = getBookByName(parsed.book);
      if (!book) return null;
      const display =
        selectedVersion.language === 'es' ? book.name : book.nameEn;
      return {
        display,
        reference: `${display} ${parsed.chapter}:${parsed.verse}`,
        bookId: book.id,
        chapter: parsed.chapter,
        verse: parsed.verse,
      };
    },
    [selectedVersion.language],
  );

  // Resolve the current prophecy's two verses (OT + NT) from SQLite.
  useEffect(() => {
    const cur =
      phase >= 0 && phase < total ? MESSIANIC_PROPHECIES[phase] : null;
    if (!cur) return;
    let cancelled = false;
    setStatus('loading');
    void (async () => {
      try {
        await bibleDB.initialize();
        const resolveOne = async (
          ref: ProphecyRefKey,
        ): Promise<ResolvedRef> => {
          const info = localizedRef(ref);
          if (!info) return {reference: ref, text: null};
          const row = await bibleDB
            .getVerse(info.bookId, info.chapter, info.verse, selectedVersion.id)
            .catch(() => null);
          return {reference: info.reference, text: row?.text ?? null};
        };
        const [pr, fu] = await Promise.all([
          resolveOne(cur.prophecy),
          resolveOne(cur.fulfillment),
        ]);
        if (cancelled) return;
        setProphecy(pr);
        setFulfillment(fu);
        setStatus('ready');
        // Mark this prophecy explored (device-local).
        void markPropheciesVisited(cur.id).then(set => {
          if (!cancelled) setVisited(set);
        });
      } catch (error) {
        logger.error('Prophetic thread load failed', error as Error, {
          component: 'PropheticThreadScreen',
          action: 'load',
        });
        if (!cancelled) setStatus('error');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [phase, total, selectedVersion.id, localizedRef]);

  const go = (delta: number) => {
    haptics.tap();
    setPhase(p => Math.max(-1, Math.min(total, p + delta)));
  };

  const sections = useMemo(() => getPropheciesByGroup(), []);
  const jumpTo = (index: number) => {
    haptics.tap();
    setIndexOpen(false);
    setPhase(index);
  };

  const openInReader = (ref: ProphecyRefKey) => {
    const info = localizedRef(ref);
    if (!info) return;
    haptics.tap();
    router.push(
      `/verse/${info.display}/${info.chapter}?verse=${info.verse}` as never,
    );
  };

  const items = tp.items as Record<string, {label: string; note: string}>;
  const groups = tp.groups as Record<string, string>;

  // Cross-links + share operate on the OT prophecy verse (the thread's focus).
  const openConstellation = () => {
    if (!current) return;
    const info = localizedRef(current.prophecy);
    if (!info) return;
    haptics.tap();
    router.push({
      pathname: '/features/constellation',
      params: {
        book: info.display,
        chapter: String(info.chapter),
        verse: String(info.verse),
      },
    } as never);
  };

  const openStudy = () => {
    if (!current) return;
    const info = localizedRef(current.prophecy);
    if (!info) return;
    haptics.tap();
    router.push({
      pathname: '/features/study',
      params: {
        book: info.display,
        chapter: String(info.chapter),
        verse: String(info.verse),
        version: selectedVersion.id,
      },
    } as never);
  };

  // Content for the image-card share modal (null until the verses resolve).
  const shareContent: ProphecyShareContent | null =
    current && prophecy && fulfillment
      ? {
          accent,
          groupTitle: groups[current.group],
          label: items[current.id]?.label ?? '',
          note: items[current.id]?.note ?? '',
          prophecyLabel: tp.prophecyLabel,
          prophecyRef: prophecy.reference,
          prophecyText: prophecy.text ?? '',
          fulfilledLabel: tp.fulfilledIn,
          fulfillmentRef: fulfillment.reference,
          fulfillmentText: fulfillment.text ?? '',
          quoted: isNtQuoted(current.id),
          quotedLabel: tp.quotedBadge,
          signature: tp.shareSignature,
        }
      : null;

  const renderVerseCard = (
    role: 'prophecy' | 'fulfillment',
    data: ResolvedRef | null,
    refKey: ProphecyRefKey,
    quoted: boolean,
  ) => (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => openInReader(refKey)}
      style={[
        styles.verseCard,
        {
          backgroundColor: colors.card,
          borderColor:
            role === 'prophecy' ? accent + '40' : colors.primary + '40',
        },
      ]}
      accessibilityRole="button"
      accessibilityLabel={`${tp.openInReader}: ${data?.reference ?? ''}`}>
      <View style={styles.verseCardHeader}>
        <AppText
          scaleRole="compact"
          style={[
            styles.verseRole,
            {color: role === 'prophecy' ? accent : colors.primary},
          ]}>
          {role === 'prophecy' ? tp.prophecyLabel : tp.fulfilledIn}
        </AppText>
        <AppText
          scaleRole="compact"
          style={[styles.verseRef, {color: colors.textSecondary}]}>
          {data?.reference ?? ''}
        </AppText>
      </View>
      <AppText style={[styles.verseText, {color: colors.text}]}>
        {data?.text ?? tp.missingText}
      </AppText>
      {/* "Cited in the NT" — only on a fulfillment the NT explicitly quotes,
          so the distinction between citation and broader fulfillment is honest
          and visible (see Sources & method). */}
      {role === 'fulfillment' && quoted ? (
        <View
          style={[
            styles.quotedBadge,
            {backgroundColor: colors.primary + '18'},
          ]}>
          <Ionicons name="checkmark-circle" size={12} color={colors.primary} />
          <AppText
            scaleRole="compact"
            style={[styles.quotedBadgeText, {color: colors.primary}]}>
            {tp.quotedBadge}
          </AppText>
        </View>
      ) : null}
    </TouchableOpacity>
  );

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
              style={styles.backButton}
              onPress={() => {
                haptics.tap();
                setIndexOpen(o => !o);
              }}
              accessibilityRole="button"
              accessibilityLabel={tp.indexTitle}
              accessibilityState={{expanded: indexOpen}}>
              <Ionicons
                name={indexOpen ? 'close' : 'list'}
                size={24}
                color={staticColors.white}
              />
            </TouchableOpacity>
          </View>
          <View style={styles.headerTextRow}>
            <View style={styles.headerIcon}>
              <Ionicons
                name="git-network"
                size={22}
                color={staticColors.white}
              />
            </View>
            <View style={styles.headerInfo}>
              <AppText scaleRole="compact" style={styles.headerLabel}>
                {tp.subtitle}
              </AppText>
              <AppText scaleRole="display" style={styles.headerTitle}>
                {tp.title}
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
          {/* Index by movement — jump to any prophecy; explored ones ticked. */}
          {indexOpen ? (
            <View style={styles.indexBlock}>
              <AppText
                scaleRole="compact"
                style={[styles.indexProgress, {color: colors.textSecondary}]}>
                {tp.progress
                  .replace('{{n}}', String(visited.size))
                  .replace('{{total}}', String(total))}
              </AppText>
              {sections.map(section => (
                <View key={section.group} style={styles.indexSection}>
                  <AppText
                    scaleRole="compact"
                    style={[
                      styles.indexGroupTitle,
                      {color: PROPHECY_GROUP_ACCENT[section.group]},
                    ]}>
                    {groups[section.group]}
                  </AppText>
                  {section.entries.map(({prophecy: p, index}) => (
                    <TouchableOpacity
                      key={p.id}
                      style={[styles.indexRow, {borderColor: colors.border}]}
                      onPress={() => jumpTo(index)}
                      accessibilityRole="button"
                      accessibilityLabel={items[p.id]?.label ?? p.id}>
                      <Ionicons
                        name={
                          visited.has(p.id)
                            ? 'checkmark-circle'
                            : 'ellipse-outline'
                        }
                        size={18}
                        color={
                          visited.has(p.id)
                            ? PROPHECY_GROUP_ACCENT[section.group]
                            : colors.textTertiary
                        }
                      />
                      <AppText
                        style={[styles.indexRowText, {color: colors.text}]}
                        numberOfLines={1}>
                        {items[p.id]?.label ?? ''}
                      </AppText>
                      <Ionicons
                        name="chevron-forward"
                        size={16}
                        color={colors.textTertiary}
                      />
                    </TouchableOpacity>
                  ))}
                </View>
              ))}
            </View>
          ) : (
            <>
              {/* Intro */}
              {phase === -1 && (
                <View style={styles.introBlock}>
                  <Ionicons
                    name="sparkles"
                    size={48}
                    color={colors.primary}
                    style={styles.introIcon}
                  />
                  <AppText style={[styles.introText, {color: colors.text}]}>
                    {tp.intro}
                  </AppText>
                  <TouchableOpacity
                    style={[
                      styles.primaryBtn,
                      {backgroundColor: colors.primary},
                    ]}
                    onPress={() => go(1)}
                    accessibilityRole="button"
                    accessibilityLabel={tp.begin}>
                    <AppText
                      style={[
                        styles.primaryBtnText,
                        {color: staticColors.white},
                      ]}>
                      {tp.begin}
                    </AppText>
                    <Ionicons
                      name="arrow-forward"
                      size={18}
                      color={staticColors.white}
                    />
                  </TouchableOpacity>

                  {/* View-index link + explored progress. */}
                  <TouchableOpacity
                    style={styles.introIndexBtn}
                    onPress={() => {
                      haptics.tap();
                      setIndexOpen(true);
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={tp.indexTitle}>
                    <Ionicons name="list" size={16} color={colors.primary} />
                    <AppText
                      scaleRole="compact"
                      style={[styles.introIndexText, {color: colors.primary}]}>
                      {tp.viewIndex}
                    </AppText>
                    {visited.size > 0 ? (
                      <AppText
                        scaleRole="compact"
                        style={[
                          styles.introProgress,
                          {color: colors.textTertiary},
                        ]}>
                        {'· ' +
                          tp.progress
                            .replace('{{n}}', String(visited.size))
                            .replace('{{total}}', String(total))}
                      </AppText>
                    ) : null}
                  </TouchableOpacity>

                  {/* Sources & method — the honest "bibliography": the conservative
                  inclusion criterion + the sources (Scripture itself, the NT's
                  own citations, openbible.info). Collapsed by default. */}
                  <View
                    style={[styles.sourcesCard, {borderColor: colors.border}]}>
                    <TouchableOpacity
                      style={styles.sourcesHeader}
                      onPress={() => {
                        haptics.tap();
                        setSourcesOpen(o => !o);
                      }}
                      accessibilityRole="button"
                      accessibilityState={{expanded: sourcesOpen}}
                      accessibilityLabel={tp.sourcesTitle}>
                      <Ionicons
                        name="information-circle-outline"
                        size={16}
                        color={colors.primary}
                      />
                      <View style={styles.sourcesHeaderText}>
                        <AppText
                          scaleRole="compact"
                          style={[styles.sourcesTitle, {color: colors.text}]}>
                          {tp.sourcesTitle}
                        </AppText>
                        <AppText
                          scaleRole="compact"
                          style={[
                            styles.sourcesHint,
                            {color: colors.textTertiary},
                          ]}>
                          {tp.sourcesHint}
                        </AppText>
                      </View>
                      <Ionicons
                        name={sourcesOpen ? 'chevron-up' : 'chevron-down'}
                        size={16}
                        color={colors.textTertiary}
                      />
                    </TouchableOpacity>
                    {sourcesOpen ? (
                      <AppText
                        style={[
                          styles.sourcesBody,
                          {color: colors.textSecondary},
                        ]}>
                        {tp.sourcesBody}
                      </AppText>
                    ) : null}
                  </View>
                </View>
              )}

              {/* A prophecy step */}
              {current && (
                <View style={styles.stepBlock}>
                  <View style={styles.stepTopRow}>
                    <View
                      style={[
                        styles.groupChip,
                        {backgroundColor: accent + '22'},
                      ]}>
                      <Ionicons
                        name={PROPHECY_GROUP_ICON[current.group] as never}
                        size={13}
                        color={accent}
                      />
                      <AppText
                        scaleRole="compact"
                        style={[styles.groupChipText, {color: accent}]}>
                        {groups[current.group]}
                      </AppText>
                    </View>
                    <AppText
                      scaleRole="compact"
                      style={[styles.stepCount, {color: colors.textTertiary}]}>
                      {tp.stepOf
                        .replace('{{n}}', String(phase + 1))
                        .replace('{{total}}', String(total))}
                    </AppText>
                  </View>

                  <AppText
                    scaleRole="display"
                    style={[styles.stepName, {color: colors.text}]}>
                    {items[current.id]?.label ?? ''}
                  </AppText>

                  {status === 'loading' && !prophecy ? (
                    <View style={styles.centerState}>
                      <ActivityIndicator size="large" color={colors.primary} />
                    </View>
                  ) : (
                    <>
                      {renderVerseCard(
                        'prophecy',
                        prophecy,
                        current.prophecy,
                        false,
                      )}
                      <View style={styles.connector}>
                        <Ionicons
                          name="arrow-down"
                          size={18}
                          color={colors.textTertiary}
                        />
                      </View>
                      {renderVerseCard(
                        'fulfillment',
                        fulfillment,
                        current.fulfillment,
                        isNtQuoted(current.id),
                      )}
                      <AppText
                        style={[
                          styles.noteText,
                          {color: colors.textSecondary},
                        ]}>
                        {items[current.id]?.note ?? ''}
                      </AppText>

                      {/* Cross-links + share for the prophecy verse. */}
                      <View style={styles.actionsRow}>
                        <TouchableOpacity
                          style={[
                            styles.actionChip,
                            {borderColor: colors.border},
                          ]}
                          onPress={() => {
                            haptics.tap();
                            setShareOpen(true);
                          }}
                          accessibilityRole="button"
                          accessibilityLabel={tp.share}>
                          <Ionicons
                            name="share-outline"
                            size={15}
                            color={colors.textSecondary}
                          />
                          <AppText
                            scaleRole="compact"
                            style={[
                              styles.actionChipText,
                              {color: colors.textSecondary},
                            ]}
                            numberOfLines={1}>
                            {tp.share}
                          </AppText>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[
                            styles.actionChip,
                            {borderColor: colors.border},
                          ]}
                          onPress={openConstellation}
                          accessibilityRole="button"
                          accessibilityLabel={tp.constellation}>
                          <Ionicons
                            name="sparkles-outline"
                            size={15}
                            color={colors.textSecondary}
                          />
                          <AppText
                            scaleRole="compact"
                            style={[
                              styles.actionChipText,
                              {color: colors.textSecondary},
                            ]}
                            numberOfLines={1}>
                            {tp.constellation}
                          </AppText>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[
                            styles.actionChip,
                            {borderColor: colors.border},
                          ]}
                          onPress={openStudy}
                          accessibilityRole="button"
                          accessibilityLabel={tp.study}>
                          <Ionicons
                            name="git-network-outline"
                            size={15}
                            color={colors.textSecondary}
                          />
                          <AppText
                            scaleRole="compact"
                            style={[
                              styles.actionChipText,
                              {color: colors.textSecondary},
                            ]}
                            numberOfLines={1}>
                            {tp.study}
                          </AppText>
                        </TouchableOpacity>
                      </View>
                    </>
                  )}

                  <View style={styles.navRow}>
                    <TouchableOpacity
                      style={[styles.navBtn, {borderColor: colors.border}]}
                      onPress={() => go(-1)}
                      accessibilityRole="button"
                      accessibilityLabel={tp.prev}>
                      <Ionicons
                        name="arrow-back"
                        size={16}
                        color={colors.textSecondary}
                      />
                      <AppText
                        style={[
                          styles.navBtnText,
                          {color: colors.textSecondary},
                        ]}>
                        {tp.prev}
                      </AppText>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.navBtn,
                        styles.navBtnPrimary,
                        {backgroundColor: accent},
                      ]}
                      onPress={() => go(1)}
                      accessibilityRole="button"
                      accessibilityLabel={
                        phase === total - 1 ? tp.finish : tp.next
                      }>
                      <AppText
                        style={[
                          styles.navBtnText,
                          {color: staticColors.white},
                        ]}>
                        {phase === total - 1 ? tp.finish : tp.next}
                      </AppText>
                      <Ionicons
                        name={
                          phase === total - 1 ? 'checkmark' : 'arrow-forward'
                        }
                        size={16}
                        color={staticColors.white}
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* Finished */}
              {phase >= total && (
                <View style={styles.introBlock}>
                  <Ionicons
                    name="checkmark-circle"
                    size={56}
                    color={colors.primary}
                    style={styles.introIcon}
                  />
                  <AppText
                    scaleRole="display"
                    style={[styles.finishedTitle, {color: colors.text}]}>
                    {tp.finishedTitle}
                  </AppText>
                  <AppText
                    style={[styles.introText, {color: colors.textSecondary}]}>
                    {tp.finishedBody}
                  </AppText>
                  <TouchableOpacity
                    style={[
                      styles.primaryBtn,
                      {backgroundColor: colors.primary},
                    ]}
                    onPress={() => {
                      haptics.tap();
                      router.back();
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={tp.done}>
                    <AppText
                      style={[
                        styles.primaryBtnText,
                        {color: staticColors.white},
                      ]}>
                      {tp.done}
                    </AppText>
                  </TouchableOpacity>
                </View>
              )}
            </>
          )}
        </ScrollView>
      </View>
      <ProphecyShareModal
        visible={shareOpen}
        onClose={() => setShareOpen(false)}
        content={shareContent}
      />
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
  backButton: {width: 40, height: 40, justifyContent: 'center'},
  introIndexBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.xs,
  },
  introIndexText: {fontSize: fontSizes.sm, fontWeight: '700'},
  introProgress: {fontSize: fontSizes.sm},
  indexBlock: {gap: spacing.lg},
  indexProgress: {
    fontSize: fontSizes.sm,
    fontWeight: '600',
    textAlign: 'center',
  },
  indexSection: {gap: spacing.xs},
  indexGroupTitle: {
    fontSize: fontSizes.xs,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  indexRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
  },
  indexRowText: {flex: 1, fontSize: fontSizes.md, fontWeight: '600'},
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
  centerState: {alignItems: 'center', paddingVertical: spacing['2xl']},
  introBlock: {
    alignItems: 'center',
    gap: spacing.lg,
    paddingTop: spacing.xl,
    paddingHorizontal: spacing.sm,
  },
  introIcon: {marginBottom: spacing.xs},
  introText: {
    fontSize: fontSizes.lg,
    lineHeight: fontSizes.lg * 1.5,
    textAlign: 'center',
  },
  finishedTitle: {
    fontSize: fontSizes['2xl'],
    fontWeight: '800',
    textAlign: 'center',
  },
  stepBlock: {gap: spacing.md},
  stepTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  groupChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
  },
  groupChipText: {
    fontSize: fontSizes.xs,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  stepCount: {
    fontSize: fontSizes.sm,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  stepName: {fontSize: fontSizes['2xl'], fontWeight: '800'},
  verseCard: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  verseCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  verseRole: {
    fontSize: fontSizes.xs,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  verseRef: {
    fontSize: fontSizes.sm,
    fontWeight: '700',
    flexShrink: 1,
    textAlign: 'right',
  },
  verseText: {
    fontSize: fontSizes.md,
    lineHeight: fontSizes.md * 1.55,
    paddingRight: verseTextRightSlack(fontSizes.md),
  },
  quotedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: borderRadius.full,
    marginTop: spacing.xs,
  },
  quotedBadgeText: {
    fontSize: fontSizes.xs,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  sourcesCard: {
    alignSelf: 'stretch',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    marginTop: spacing.sm,
  },
  sourcesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  sourcesHeaderText: {flex: 1},
  sourcesTitle: {fontSize: fontSizes.sm, fontWeight: '700'},
  sourcesHint: {fontSize: fontSizes.xs, marginTop: 1},
  sourcesBody: {
    fontSize: fontSizes.sm,
    lineHeight: fontSizes.sm * 1.6,
    marginTop: spacing.sm,
  },
  connector: {alignItems: 'center'},
  noteText: {
    fontSize: fontSizes.md,
    lineHeight: fontSizes.md * 1.55,
    fontStyle: 'italic',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  actionChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    borderRadius: borderRadius.full,
    borderWidth: 1,
  },
  actionChipText: {fontSize: fontSizes.xs, fontWeight: '700', flexShrink: 1},
  navRow: {flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs},
  navBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
  },
  navBtnPrimary: {borderWidth: 0},
  navBtnText: {fontSize: fontSizes.md, fontWeight: '700'},
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.lg,
    alignSelf: 'stretch',
  },
  primaryBtnText: {fontSize: fontSizes.md, fontWeight: '700'},
});
