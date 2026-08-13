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

import {useEffect, useMemo, useRef, useState} from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import {Stack, useRouter, useLocalSearchParams} from 'expo-router';
import {Ionicons, MaterialCommunityIcons} from '@expo/vector-icons';
import {LinearGradient} from 'expo-linear-gradient';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTheme} from '@hooks/useTheme';
import {centeredMaxWidth} from '@/styles/responsive';
import {useLanguage} from '@hooks/useLanguage';
import {useBibleVersion} from '@hooks/useBibleVersion';
import {useBackHandlerStep} from '@hooks/useBackHandlerStep';
import {useNarratedWalkthrough} from '@hooks/useNarratedWalkthrough';
import {resolveSpeechLanguage} from '@/lib/speech/narration';
import {haptics} from '@lib/haptics';
import {AppText} from '@components/ui/AppText';
import bibleDB from '@lib/database';
import {logger} from '@lib/utils/logger';
import {useMemoryDeck} from '@context/MemoryDeckContext';
import {useToast} from '@context/ToastContext';
import {useServices} from '@context/ServicesContext';
import {buildVerseKey} from '@lib/memory/srs';
import {getBookByName} from '@/constants/bible';
import {
  parseChristRef,
  getChristConnectionById,
} from '@/features/study/christConnections';
import {
  MESSIANIC_PROPHECIES,
  PROPHECY_GROUP_ACCENT,
  PROPHECY_GROUP_ICON,
  isNtQuoted,
  getPropheciesByGroup,
  getDailyProphecyIndex,
  type ProphecyRefKey,
} from '@/features/study/messianicProphecies';
import {
  getVisitedProphecies,
  markPropheciesVisited,
} from '@/features/study/prophecyProgress';
import {
  getFavoriteProphecies,
  toggleProphecyFavorite,
} from '@/features/study/prophecyFavorites';
import {
  ProphecyShareModal,
  type ProphecyShareContent,
} from '@components/study/ProphecyShareModal';
import {OriginalLanguagesSheet} from '@components/reading/OriginalLanguagesSheet';
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
  const {colors, gradient, highContrast} = useTheme();
  const {t} = useLanguage();
  const {selectedVersion} = useBibleVersion();
  const {hasCard, addCard} = useMemoryDeck();
  const {achievementService, notifyAchievements} = useServices();
  const toast = useToast();
  const tp = t.prophecies;

  const total = MESSIANIC_PROPHECIES.length;
  // Optional deep-link/param to open straight on a given prophecy (the reader's
  // "Parte del Hilo profético → ver" jump). -1 = intro otherwise.
  const params = useLocalSearchParams<{start?: string}>();
  const startPhase = useMemo(() => {
    const n = Number(params.start);
    return Number.isInteger(n) && n >= 0 && n < total ? n : -1;
  }, [params.start, total]);
  // -1 = intro, 0..total-1 = a prophecy, total = finished.
  const [phase, setPhase] = useState(startPhase);
  const [status, setStatus] = useState<LoadStatus>('loading');
  const [prophecy, setProphecy] = useState<ResolvedRef | null>(null);
  const [fulfillment, setFulfillment] = useState<ResolvedRef | null>(null);
  const [sourcesOpen, setSourcesOpen] = useState(false);
  const [whyOpen, setWhyOpen] = useState(false);
  const [indexOpen, setIndexOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [visited, setVisited] = useState<Set<string>>(new Set());
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [indexFilter, setIndexFilter] = useState<
    'all' | 'favorites' | 'quoted'
  >('all');
  // Original-languages sheet (Strong's) for a tapped verse card.
  const [originalsVisible, setOriginalsVisible] = useState(false);
  const [originalsTarget, setOriginalsTarget] = useState<{
    book: string;
    chapter: number;
    verse: number;
  } | null>(null);
  // The main content ScrollView — reset to the top on every phase change
  // (see the effect below); QA BUG-10.
  const scrollRef = useRef<ScrollView>(null);

  // Load the device-local "explored" + "favorite" marks once.
  useEffect(() => {
    let active = true;
    void getVisitedProphecies().then(set => {
      if (active) setVisited(set);
    });
    void getFavoriteProphecies().then(set => {
      if (active) setFavorites(set);
    });
    return () => {
      active = false;
    };
  }, []);

  const toggleFavorite = (id: string) => {
    haptics.tap();
    void toggleProphecyFavorite(id).then(setFavorites);
  };

  // When every prophecy has been explored, unlock the "walked the whole thread"
  // badge (idempotent; the global achievement modal surfaces it).
  const allVisited = total > 0 && visited.size >= total;
  useEffect(() => {
    if (!allVisited || !achievementService) return;
    void achievementService.trackPropheticThreadComplete().then(unlocked => {
      if (unlocked.length > 0) notifyAchievements(unlocked);
    });
  }, [allVisited, achievementService, notifyAchievements]);

  // "Escuchar" (single step) + "Recorrido narrado" (auto-advancing tour) —
  // both powered by the shared narration engine ([[useNarratedWalkthrough]],
  // Tanda 3). `segments` is null while the current step's verses are still
  // resolving from SQLite, so the hook waits rather than racing ahead with
  // stale/undefined text; `[]` (both verses missing) skips the tour forward
  // to the next step instead of stalling on it.
  const segments = useMemo(
    () =>
      status === 'ready'
        ? [prophecy?.text, fulfillment?.text].filter((s): s is string =>
            Boolean(s),
          )
        : null,
    [status, prophecy, fulfillment],
  );
  const {
    speaking,
    walkthroughActive,
    toggle: toggleWalkthroughTour,
    speakOnce,
  } = useNarratedWalkthrough({
    total,
    index: phase,
    setIndex: setPhase,
    segments,
    getLanguage: () => resolveSpeechLanguage(selectedVersion.language),
  });

  const handleListen = () => {
    haptics.tap();
    speakOnce();
  };

  const toggleWalkthrough = () => {
    haptics.tap();
    toggleWalkthroughTour();
  };

  const current =
    phase >= 0 && phase < total ? MESSIANIC_PROPHECIES[phase] : null;
  const accent = current
    ? PROPHECY_GROUP_ACCENT[current.group]
    : colors.primary;
  // High contrast (whole app): swap to the flat dark header gradient instead
  // of the amber→white pair `colors.primary`/`colors.primaryDark` become
  // under that theme (Tanda L precedent, e.g. daily-light/index.tsx).
  const headerGradient: readonly [string, string, ...string[]] = highContrast
    ? (gradient.headerColors as readonly [string, string, ...string[]])
    : [colors.primary, colors.primaryDark];

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

  const openOriginals = (refKey: ProphecyRefKey) => {
    const info = localizedRef(refKey);
    if (!info) return;
    haptics.tap();
    setOriginalsTarget({
      book: info.display,
      chapter: info.chapter,
      verse: info.verse,
    });
    setOriginalsVisible(true);
  };

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

  // QA BUG-10: tapping "Siguiente" from the bottom of a long step used to
  // leave the ScrollView at its old scroll offset, so the next prophecy
  // rendered scrolled to the middle (showing "Cumplido en" first, forcing a
  // scroll back up to see the title) instead of starting at the top. Reset
  // on every phase change — covers Anterior/Siguiente, jumping from the
  // index or the "today" card, the narrated walkthrough auto-advancing, and
  // the back-navigation hub jump above — not just the one repro path.
  useEffect(() => {
    scrollRef.current?.scrollTo({y: 0, animated: false});
  }, [phase]);

  const go = (delta: number) => {
    haptics.tap();
    setPhase(p => Math.max(-1, Math.min(total, p + delta)));
  };

  // Shared "back" priority for BOTH hardware back and the header arrow (kept
  // as one function so the two can't drift apart): close an open sheet
  // first; then, if mid-thread (`phase > -1`), jump straight to this
  // feature's own intro/hub card (`setPhase(-1)`) — a single jump, not
  // one-prophecy-at-a-time. Only once nothing is left to close/step back
  // from (no sheet open AND already at the hub) does it return `false`,
  // meaning "this screen has nothing more to do — actually leave."
  //
  // This intentionally OVERRIDES the previous design that used to live in
  // this comment (Tanda G): hardware back and the header arrow both called
  // `router.back()`/fell through immediately regardless of phase, reasoned
  // as matching a 79-item list where stepping back one prophecy per press
  // would take ~79 presses to leave. That reasoning still holds — this is a
  // single jump straight to the hub, NOT one-prophecy-at-a-time, so the
  // "~79 presses to leave" problem is not reintroduced — but the "always
  // exit immediately" half of the old design turned out to be the actual
  // bug: a live test (screenshot-confirmed, 2026-07-15) showed tapping back
  // mid-thread (e.g. "Profecía 38 de 79") dropped straight to Home instead
  // of back to this feature's own hub card, forcing a full re-entry into the
  // feature to resume browsing. Now one back press returns to the hub card,
  // and a second press from there (genuinely `phase === -1`) exits to Home.
  const consumeBackPress = (): boolean => {
    if (shareOpen) {
      setShareOpen(false);
      return true;
    }
    if (indexOpen) {
      setIndexOpen(false);
      return true;
    }
    if (whyOpen) {
      setWhyOpen(false);
      return true;
    }
    if (sourcesOpen) {
      setSourcesOpen(false);
      return true;
    }
    if (phase > -1) {
      setPhase(-1);
      return true;
    }
    return false;
  };

  useBackHandlerStep(consumeBackPress);

  const sections = useMemo(() => getPropheciesByGroup(), []);

  // The index, filtered by the active chip (all / favorites / NT-quoted);
  // empty movements drop out so the list stays tight.
  const filteredSections = useMemo(() => {
    const match = (id: string) =>
      indexFilter === 'all' ||
      (indexFilter === 'favorites' && favorites.has(id)) ||
      (indexFilter === 'quoted' && isNtQuoted(id));
    return sections
      .map(s => ({...s, entries: s.entries.filter(e => match(e.prophecy.id))}))
      .filter(s => s.entries.length > 0);
  }, [sections, indexFilter, favorites]);

  const jumpTo = (index: number) => {
    haptics.tap();
    setIndexOpen(false);
    setPhase(index);
  };

  const indexFilters: {key: 'all' | 'favorites' | 'quoted'; label: string}[] = [
    {key: 'all', label: tp.filterAll},
    {key: 'favorites', label: tp.filterFavorites},
    {key: 'quoted', label: tp.filterQuoted},
  ];

  // "Profecía de hoy" — the featured daily pick on the intro hub (the Home tile
  // lands here, so the map / index / sources stay reachable; this card opens
  // straight into today's prophecy).
  const todayIndex = useMemo(() => getDailyProphecyIndex(), []);
  const todayProphecy = MESSIANIC_PROPHECIES[todayIndex];
  const todayRefs = useMemo(() => {
    const p = localizedRef(todayProphecy.prophecy);
    const f = localizedRef(todayProphecy.fulfillment);
    return {prophecy: p?.reference ?? '', fulfillment: f?.reference ?? ''};
  }, [todayProphecy, localizedRef]);

  const openMap = () => {
    haptics.tap();
    setIndexOpen(false);
    router.push('/features/prophecies/map' as never);
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

  // "Cristo en este pasaje" — surface the curated christConnections note for
  // this prophecy's OT verse when one exists (many do not; shown only when
  // present, so the deeper reflection rides on existing, vetted content).
  const christHereNote = useMemo(() => {
    if (!current) return null;
    const info = localizedRef(current.prophecy);
    if (!info) return null;
    const conn = getChristConnectionById(info.bookId, info.chapter, info.verse);
    if (!conn) return null;
    const notes = t.christConnections.notes as Record<string, string>;
    return notes[conn.id] ?? null;
  }, [current, localizedRef, t.christConnections.notes]);

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

  // "Memorizar" — add the OT prophecy verse to the spaced-repetition deck, the
  // same deck the reader/daily-light feed (so the thread becomes something the
  // reader can hide His Word in their heart, Salmo 119:11).
  const memVerseKey = (() => {
    if (!current) return '';
    const info = localizedRef(current.prophecy);
    return info ? buildVerseKey(info.display, info.chapter, info.verse) : '';
  })();
  const inDeck = memVerseKey ? hasCard(memVerseKey) : false;

  const memorize = () => {
    if (!current || !prophecy?.text || inDeck) return;
    const info = localizedRef(current.prophecy);
    if (!info) return;
    haptics.tap();
    addCard({
      bookName: info.display,
      chapter: info.chapter,
      verse: info.verse,
      text: prophecy.text,
      version: selectedVersion.id,
    });
    toast.success(t.memory.addedToast);
  };

  // Content for the image-card share modal (null until the verses resolve).
  const shareContent: ProphecyShareContent | null =
    current && prophecy && fulfillment
      ? {
          accent,
          groupTitle: groups[current.group],
          label: items[current.id]?.label ?? '',
          note: items[current.id]?.note ?? '',
          prophecyLabel:
            current.kind === 'shadow' ? tp.shadowLabel : tp.prophecyLabel,
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
          {role === 'prophecy'
            ? current?.kind === 'shadow'
              ? tp.shadowLabel
              : tp.prophecyLabel
            : tp.fulfilledIn}
        </AppText>
        <View style={styles.verseCardHeaderRight}>
          <TouchableOpacity
            onPress={() => openOriginals(refKey)}
            hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}
            accessibilityRole="button"
            accessibilityLabel={t.originals.buttonLabel}>
            <Ionicons
              name="language-outline"
              size={15}
              color={colors.textTertiary}
            />
          </TouchableOpacity>
          <AppText
            scaleRole="compact"
            style={[styles.verseRef, {color: colors.textSecondary}]}>
            {data?.reference ?? ''}
          </AppText>
        </View>
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
              onPress={() => {
                haptics.tap();
                // Same priority as hardware back (`consumeBackPress` above,
                // see its comment): close an open sheet, else jump to the
                // hub if mid-thread, else this screen has nothing left to
                // do — actually leave.
                if (!consumeBackPress()) {
                  router.back();
                }
              }}
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
          ref={scrollRef}
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
              {/* The visual web map — reachable from the index too, so it is
                  findable from any step (not just the intro). */}
              <TouchableOpacity
                style={[styles.indexMapBtn, {borderColor: colors.border}]}
                onPress={openMap}
                accessibilityRole="button"
                accessibilityLabel={tp.mapTitle}>
                <Ionicons name="git-network" size={16} color={colors.primary} />
                <AppText
                  scaleRole="compact"
                  style={[styles.introIndexText, {color: colors.primary}]}>
                  {tp.viewMap}
                </AppText>
              </TouchableOpacity>
              {/* Filter chips — all / favorites / NT-quoted. */}
              <View style={styles.indexFilters}>
                {indexFilters.map(f => {
                  const active = indexFilter === f.key;
                  return (
                    <TouchableOpacity
                      key={f.key}
                      style={[
                        styles.indexFilterChip,
                        active
                          ? {
                              borderColor: colors.primary,
                              backgroundColor: colors.primary + '18',
                            }
                          : {borderColor: colors.border},
                      ]}
                      onPress={() => {
                        haptics.tap();
                        setIndexFilter(f.key);
                      }}
                      accessibilityRole="button"
                      accessibilityState={{selected: active}}
                      accessibilityLabel={f.label}>
                      <AppText
                        scaleRole="compact"
                        style={[
                          styles.indexFilterText,
                          {
                            color: active
                              ? colors.primary
                              : colors.textSecondary,
                          },
                        ]}>
                        {f.label}
                      </AppText>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {filteredSections.length === 0 ? (
                <AppText
                  style={[styles.indexEmpty, {color: colors.textTertiary}]}>
                  {tp.noFavorites}
                </AppText>
              ) : (
                filteredSections.map(section => (
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
                        {favorites.has(p.id) ? (
                          <Ionicons
                            name="heart"
                            size={14}
                            color={PROPHECY_GROUP_ACCENT[section.group]}
                          />
                        ) : null}
                        <Ionicons
                          name="chevron-forward"
                          size={16}
                          color={colors.textTertiary}
                        />
                      </TouchableOpacity>
                    ))}
                  </View>
                ))
              )}
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

                  {/* Profecía de hoy — the featured daily pick (the Home tile
                      teases it; tapping opens straight into that step). */}
                  <TouchableOpacity
                    style={[
                      styles.todayCard,
                      {
                        backgroundColor:
                          PROPHECY_GROUP_ACCENT[todayProphecy.group] + '14',
                        borderColor:
                          PROPHECY_GROUP_ACCENT[todayProphecy.group] + '40',
                      },
                    ]}
                    onPress={() => {
                      haptics.tap();
                      setPhase(todayIndex);
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={`${tp.todayTitle}: ${items[todayProphecy.id]?.label ?? ''}`}>
                    <View style={styles.todayHeader}>
                      <Ionicons
                        name="sparkles"
                        size={13}
                        color={PROPHECY_GROUP_ACCENT[todayProphecy.group]}
                      />
                      <AppText
                        scaleRole="compact"
                        style={[
                          styles.todayLabel,
                          {color: PROPHECY_GROUP_ACCENT[todayProphecy.group]},
                        ]}>
                        {tp.todayTitle}
                      </AppText>
                    </View>
                    <AppText
                      scaleRole="compact"
                      style={[styles.todayName, {color: colors.text}]}
                      numberOfLines={2}>
                      {items[todayProphecy.id]?.label ?? ''}
                    </AppText>
                    <View style={styles.todayRefRow}>
                      <AppText
                        scaleRole="compact"
                        style={[styles.todayRef, {color: colors.textSecondary}]}
                        numberOfLines={1}>
                        {todayRefs.prophecy}
                      </AppText>
                      <Ionicons
                        name="arrow-forward"
                        size={12}
                        color={colors.textTertiary}
                      />
                      <AppText
                        scaleRole="compact"
                        style={[styles.todayRef, {color: colors.textSecondary}]}
                        numberOfLines={1}>
                        {todayRefs.fulfillment}
                      </AppText>
                    </View>
                  </TouchableOpacity>

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
                        {color: colors.onPrimary},
                      ]}>
                      {tp.begin}
                    </AppText>
                    <Ionicons
                      name="arrow-forward"
                      size={18}
                      color={colors.onPrimary}
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

                  {/* The visual web map of the whole thread. */}
                  <TouchableOpacity
                    style={styles.introIndexBtn}
                    onPress={() => {
                      haptics.tap();
                      router.push('/features/prophecies/map' as never);
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={tp.mapTitle}>
                    <Ionicons
                      name="git-network"
                      size={16}
                      color={colors.primary}
                    />
                    <AppText
                      scaleRole="compact"
                      style={[styles.introIndexText, {color: colors.primary}]}>
                      {tp.viewMap}
                    </AppText>
                  </TouchableOpacity>

                  {/* Together — the thread's derived reading plan already
                      supports the app's standard shared-pace sharing (same
                      start date, private progress); this just surfaces that
                      entry point from the guided walk itself. */}
                  <TouchableOpacity
                    style={styles.introIndexBtn}
                    onPress={() => {
                      haptics.tap();
                      router.push('/plan/prophetic-thread' as never);
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={tp.togetherCta}>
                    <Ionicons
                      name="people-outline"
                      size={16}
                      color={colors.primary}
                    />
                    <AppText
                      scaleRole="compact"
                      style={[styles.introIndexText, {color: colors.primary}]}>
                      {tp.togetherCta}
                    </AppText>
                  </TouchableOpacity>

                  {/* Matching quiz: prophecy <-> fulfillment (robustness round 3). */}
                  <TouchableOpacity
                    style={styles.introIndexBtn}
                    onPress={() => {
                      haptics.tap();
                      router.push('/features/prophecies/quiz' as never);
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={tp.quizPlay}>
                    <Ionicons
                      name="game-controller-outline"
                      size={16}
                      color={colors.primary}
                    />
                    <AppText
                      scaleRole="compact"
                      style={[styles.introIndexText, {color: colors.primary}]}>
                      {tp.quizPlay}
                    </AppText>
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
                      {current.group === 'coming' ? (
                        <MaterialCommunityIcons
                          name="star-shooting"
                          size={13}
                          color={accent}
                        />
                      ) : (
                        <Ionicons
                          name={PROPHECY_GROUP_ICON[current.group] as never}
                          size={13}
                          color={accent}
                        />
                      )}
                      <AppText
                        scaleRole="compact"
                        style={[styles.groupChipText, {color: accent}]}>
                        {groups[current.group]}
                      </AppText>
                    </View>
                    <View style={styles.stepTopRight}>
                      <TouchableOpacity
                        onPress={() => toggleFavorite(current.id)}
                        hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
                        accessibilityRole="button"
                        accessibilityLabel={
                          favorites.has(current.id)
                            ? tp.unfavorite
                            : tp.favorite
                        }
                        accessibilityState={{
                          selected: favorites.has(current.id),
                        }}>
                        <Ionicons
                          name={
                            favorites.has(current.id)
                              ? 'heart'
                              : 'heart-outline'
                          }
                          size={20}
                          color={
                            favorites.has(current.id)
                              ? accent
                              : colors.textTertiary
                          }
                        />
                      </TouchableOpacity>
                      <AppText
                        scaleRole="compact"
                        style={[
                          styles.stepCount,
                          {color: colors.textTertiary},
                        ]}>
                        {tp.stepOf
                          .replace('{{n}}', String(phase + 1))
                          .replace('{{total}}', String(total))}
                      </AppText>
                    </View>
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

                      {/* Escuchar (single-step) + Recorrido narrado
                          (auto-advancing tour) — the plain listen pill hides
                          while the tour is running, since it already reads
                          every step aloud. */}
                      <View style={styles.listenRow}>
                        {!walkthroughActive && (
                          <TouchableOpacity
                            style={[
                              styles.listenBtn,
                              {borderColor: accent + '55'},
                            ]}
                            onPress={handleListen}
                            accessibilityRole="button"
                            accessibilityLabel={
                              speaking ? tp.stopListening : tp.listen
                            }>
                            <Ionicons
                              name={speaking ? 'stop-circle' : 'volume-high'}
                              size={18}
                              color={accent}
                            />
                            <AppText
                              scaleRole="compact"
                              style={[styles.listenText, {color: accent}]}>
                              {speaking ? tp.stopListening : tp.listen}
                            </AppText>
                          </TouchableOpacity>
                        )}
                        <TouchableOpacity
                          style={[
                            styles.listenBtn,
                            {borderColor: accent + '55'},
                          ]}
                          onPress={toggleWalkthrough}
                          accessibilityRole="button"
                          accessibilityLabel={
                            walkthroughActive
                              ? tp.walkthroughStop
                              : tp.walkthroughStart
                          }>
                          <Ionicons
                            name={
                              walkthroughActive
                                ? 'stop-circle'
                                : 'play-skip-forward'
                            }
                            size={18}
                            color={accent}
                          />
                          <AppText
                            scaleRole="compact"
                            style={[styles.listenText, {color: accent}]}>
                            {walkthroughActive
                              ? tp.walkthroughStop
                              : tp.walkthroughStart}
                          </AppText>
                        </TouchableOpacity>
                      </View>

                      {/* "Cristo en este pasaje" — the curated christConnections
                          reflection on this OT verse, when one exists. */}
                      {christHereNote ? (
                        <View
                          style={[
                            styles.christCard,
                            {
                              backgroundColor: accent + '12',
                              borderColor: accent + '33',
                            },
                          ]}>
                          <View style={styles.christHeader}>
                            <Ionicons
                              name="sparkles"
                              size={13}
                              color={accent}
                            />
                            <AppText
                              scaleRole="compact"
                              style={[styles.christTitle, {color: accent}]}>
                              {tp.christHereTitle}
                            </AppText>
                          </View>
                          <AppText
                            style={[
                              styles.christBody,
                              {color: colors.textSecondary},
                            ]}>
                            {christHereNote}
                          </AppText>
                        </View>
                      ) : null}

                      {/* "¿Por qué importa?" — a shared, humble note on the weight
                          of fulfilled prophecy (Lucas 24:27,44; Juan 5:39).
                          Collapsed by default so the step stays calm. */}
                      <View
                        style={[styles.whyCard, {borderColor: colors.border}]}>
                        <TouchableOpacity
                          style={styles.whyHeader}
                          onPress={() => {
                            haptics.tap();
                            setWhyOpen(o => !o);
                          }}
                          accessibilityRole="button"
                          accessibilityState={{expanded: whyOpen}}
                          accessibilityLabel={tp.whyTitle}>
                          <Ionicons
                            name="help-circle-outline"
                            size={16}
                            color={colors.primary}
                          />
                          <AppText
                            scaleRole="compact"
                            style={[styles.whyTitle, {color: colors.text}]}>
                            {tp.whyTitle}
                          </AppText>
                          <Ionicons
                            name={whyOpen ? 'chevron-up' : 'chevron-down'}
                            size={16}
                            color={colors.textTertiary}
                          />
                        </TouchableOpacity>
                        {whyOpen ? (
                          <AppText
                            style={[
                              styles.whyBody,
                              {color: colors.textSecondary},
                            ]}>
                            {tp.whyBody}
                          </AppText>
                        ) : null}
                      </View>

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
                        <TouchableOpacity
                          style={[
                            styles.actionChip,
                            {borderColor: colors.border},
                            inDeck ? styles.actionChipDisabled : null,
                          ]}
                          onPress={memorize}
                          disabled={inDeck}
                          accessibilityRole="button"
                          accessibilityState={{disabled: inDeck}}
                          accessibilityLabel={
                            inDeck ? tp.memorized : tp.memorize
                          }>
                          <Ionicons
                            name={inDeck ? 'school' : 'school-outline'}
                            size={15}
                            color={
                              inDeck ? colors.primary : colors.textSecondary
                            }
                          />
                          <AppText
                            scaleRole="compact"
                            style={[
                              styles.actionChipText,
                              {
                                color: inDeck
                                  ? colors.primary
                                  : colors.textSecondary,
                              },
                            ]}
                            numberOfLines={1}>
                            {inDeck ? tp.memorized : tp.memorize}
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
                    name={allVisited ? 'trophy' : 'checkmark-circle'}
                    size={56}
                    color={allVisited ? colors.warning : colors.primary}
                    style={styles.introIcon}
                  />
                  {allVisited ? (
                    <View
                      style={[
                        styles.completedBadge,
                        {backgroundColor: colors.warning + '22'},
                      ]}>
                      <Ionicons
                        name="ribbon"
                        size={14}
                        color={colors.warning}
                      />
                      <AppText
                        scaleRole="compact"
                        style={[
                          styles.completedBadgeText,
                          {color: colors.warning},
                        ]}>
                        {tp.completedBadge}
                      </AppText>
                    </View>
                  ) : null}
                  <AppText
                    scaleRole="display"
                    style={[styles.finishedTitle, {color: colors.text}]}>
                    {tp.finishedTitle}
                  </AppText>
                  <AppText
                    style={[styles.introText, {color: colors.textSecondary}]}>
                    {tp.finishedBody}
                  </AppText>
                  {/* "Terminar" — the completion screen's own CTA after
                      finishing all `total` steps, not a back/close affordance
                      (contrast the header arrow above): it deliberately keeps
                      exiting immediately regardless of phase, matching the
                      same "done" finish button on this app's other guided
                      walks (verified: prayer/acts.tsx's `ta.done` and
                      lectio.tsx's `tl.done`, both a plain `router.back()` on
                      their own finished screen). Routing it through the hub
                      first would undo the point of "I'm finished" and make
                      the user tap twice to leave after completing the whole
                      thread. */}
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
                        {color: colors.onPrimary},
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
      <OriginalLanguagesSheet
        visible={originalsVisible}
        sourceBook={originalsTarget?.book ?? ''}
        sourceChapter={originalsTarget?.chapter ?? 0}
        sourceVerse={originalsTarget?.verse ?? null}
        version={selectedVersion.id}
        onClose={() => setOriginalsVisible(false)}
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
  indexMapBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
  },
  todayCard: {
    alignSelf: 'stretch',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    padding: spacing.base,
    gap: spacing.xs,
  },
  todayHeader: {flexDirection: 'row', alignItems: 'center', gap: spacing.xs},
  todayLabel: {
    fontSize: fontSizes.xs,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  todayName: {fontSize: fontSizes.lg, fontWeight: '800'},
  todayRefRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flexWrap: 'wrap',
  },
  todayRef: {fontSize: fontSizes.sm, fontWeight: '700', flexShrink: 1},
  indexProgress: {
    fontSize: fontSizes.sm,
    fontWeight: '600',
    textAlign: 'center',
  },
  indexFilters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    justifyContent: 'center',
  },
  indexFilterChip: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    borderWidth: 1,
  },
  indexFilterText: {fontSize: fontSizes.sm, fontWeight: '700'},
  indexEmpty: {
    fontSize: fontSizes.sm,
    textAlign: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    lineHeight: fontSizes.sm * 1.5,
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
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  completedBadgeText: {
    fontSize: fontSizes.sm,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  stepBlock: {gap: spacing.md},
  stepTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  stepTopRight: {flexDirection: 'row', alignItems: 'center', gap: spacing.sm},
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
  verseCardHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flexShrink: 1,
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
  listenRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  listenBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    alignSelf: 'flex-start',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.base,
    borderRadius: borderRadius.full,
    borderWidth: 1,
  },
  listenText: {fontSize: fontSizes.sm, fontWeight: '700'},
  christCard: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    padding: spacing.base,
    gap: spacing.xs,
  },
  christHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  christTitle: {
    fontSize: fontSizes.xs,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  christBody: {fontSize: fontSizes.sm, lineHeight: fontSizes.sm * 1.6},
  whyCard: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.xs,
  },
  whyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  whyTitle: {flex: 1, fontSize: fontSizes.sm, fontWeight: '700'},
  whyBody: {
    fontSize: fontSizes.sm,
    lineHeight: fontSizes.sm * 1.6,
    paddingBottom: spacing.sm,
  },
  actionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  actionChip: {
    flexGrow: 1,
    flexBasis: '45%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    borderRadius: borderRadius.full,
    borderWidth: 1,
  },
  actionChipDisabled: {opacity: 0.7},
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
