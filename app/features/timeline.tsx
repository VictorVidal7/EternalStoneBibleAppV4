/**
 * 🕰️ TU LÍNEA DE TIEMPO — the milestone feed (Sprint 80)
 *
 * A chronological feed of the reader's walk through the Word: completed
 * books, unlocked achievements, the first favorite/note/highlight, streak
 * records and started plans — PURE composition over stores the app already
 * keeps ([[timeline]]), so the past simply becomes visible. Grouped by
 * month, newest first, with the Mi lectura visual idiom.
 *
 * Reached from the "Tu línea de tiempo" card in Mi lectura and the deep
 * link eternalbible://features/timeline. 100% JS, zero new storage.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import {useRouter, Stack} from 'expo-router';
import {Ionicons} from '@expo/vector-icons';
import {LinearGradient} from 'expo-linear-gradient';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTheme} from '@hooks/useTheme';
import {centeredMaxWidth} from '@/styles/responsive';
import {useLanguage} from '@hooks/useLanguage';
import {useServices} from '@context/ServicesContext';
import {useFavorites} from '@context/FavoritesContext';
import {useReadingPlanProgress} from '@context/ReadingPlanProgressContext';
import bibleDB from '@lib/database';
import {AppText} from '@components/ui/AppText';
import {getBookByName} from '@/constants/bible';
import {READING_PLANS, getLocalizedPlan} from '@/constants/reading-plans';
import {
  buildTimeline,
  timelineMonthKey,
  type TimelineEvent,
} from '@/features/reading-insights/timeline';
import {
  buildTimelineCard,
  type TimelineCardModel,
} from '@/features/reading-insights/timelineCard';
import {TimelineImageModal} from '@components/insights/TimelineImageModal';
import {getDevotionLog} from '@/features/study/devotionLogStore';
import {haptics} from '@lib/haptics';
import {logger} from '@lib/utils/logger';
import {
  borderRadius,
  fontSize as fontSizes,
  spacing,
  staticColors,
} from '@/styles/designTokens';

type LoadStatus = 'loading' | 'ready' | 'error';

/** Per-type glyph; achievements bring their own from the catalog. */
const TYPE_ICONS: Record<TimelineEvent['type'], string> = {
  'book-completed': 'book',
  achievement: 'trophy',
  'first-favorite': 'heart',
  'first-note': 'create',
  'first-highlight': 'color-palette',
  'streak-record': 'flame',
  'devotion-streak': 'sparkles',
  'plan-started': 'calendar',
  'plan-completed': 'ribbon',
};

export default function TimelineScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {colors} = useTheme();
  const {t, language} = useLanguage();
  const tl = t.readingInsights.timeline;
  const {achievementService, highlightService} = useServices();
  const {favorites} = useFavorites();
  const {getStartedAt, getCompletedAt} = useReadingPlanProgress();

  const [events, setEvents] = useState<TimelineEvent[] | null>(null);
  const [status, setStatus] = useState<LoadStatus>('loading');
  // Share-as-image modal (Sprint 81/83) — the S56 view-shot pipeline. The
  // target is either the recent-milestones card (header button) or a SINGLE
  // milestone (long-press a row); each carries its own headline/caption.
  const [share, setShare] = useState<{
    card: TimelineCardModel;
    headline?: string;
    caption?: string;
  } | null>(null);

  const load = useCallback(async () => {
    if (!achievementService || !highlightService) return;
    try {
      setStatus('loading');
      await bibleDB.initialize();
      const [
        completedBooks,
        achievements,
        readingLog,
        highlights,
        notes,
        devotionLog,
      ] = await Promise.all([
        achievementService.getCompletedBooks(),
        achievementService.getAllAchievements(),
        achievementService.getReadingLog(),
        highlightService.getAllHighlights(),
        // Notes live in bible.db (the NotesContext store is legacy).
        bibleDB.getNotes(),
        // Devotion habit log (Sprint 84) — device-local, never synced.
        getDevotionLog(),
      ]);
      setEvents(
        buildTimeline({
          completedBooks,
          achievements,
          favorites,
          notes,
          // Highlight stores the book name under `bookId` ("Genesis:1:1" ids).
          highlights: highlights.map(h => ({
            book: h.bookId,
            chapter: h.chapter,
            verse: h.verse,
            createdAt: h.createdAt,
          })),
          plans: READING_PLANS.map(plan => ({
            planId: plan.id,
            startedAt: getStartedAt(plan.id),
            // Stamped from S81 on; older completions stay honestly omitted.
            completedAt: getCompletedAt(plan.id),
          })),
          readingLog,
          devotionLog: Object.keys(devotionLog.days).map(date => ({date})),
        }),
      );
      setStatus('ready');
    } catch (err) {
      logger.error('Timeline load failed', err as Error, {
        component: 'TimelineScreen',
        action: 'load',
      });
      setStatus('error');
    }
  }, [
    achievementService,
    highlightService,
    favorites,
    getStartedAt,
    getCompletedAt,
  ]);

  useEffect(() => {
    load();
  }, [load]);

  const locale = language === 'en' ? 'en-US' : 'es-ES';

  /** Localized "John 3:16" for a first-event's structured verse. */
  const localizedRef = useCallback(
    (event: TimelineEvent) => {
      if (!event.verse) return event.subject;
      const info = getBookByName(event.verse.book);
      const name = info
        ? language === 'en'
          ? info.nameEn
          : info.name
        : event.verse.book;
      return `${name} ${event.verse.chapter}:${event.verse.verse}`;
    },
    [language],
  );

  const eventTitle = useCallback(
    (event: TimelineEvent): string => {
      switch (event.type) {
        case 'book-completed': {
          const info = getBookByName(event.subject);
          const name = info
            ? language === 'en'
              ? info.nameEn
              : info.name
            : event.subject;
          return tl.bookCompleted.replace('{{book}}', name);
        }
        case 'achievement':
          return tl.achievement.replace('{{name}}', event.subject);
        case 'first-favorite':
          return tl.firstFavorite.replace('{{ref}}', localizedRef(event));
        case 'first-note':
          return tl.firstNote.replace('{{ref}}', localizedRef(event));
        case 'first-highlight':
          return tl.firstHighlight.replace('{{ref}}', localizedRef(event));
        case 'streak-record':
          return tl.streakRecord.replace('{{n}}', event.subject);
        case 'devotion-streak':
          return tl.devotionStreak.replace('{{n}}', event.subject);
        case 'plan-started': {
          const plan = READING_PLANS.find(p => p.id === event.subject);
          const name = plan ? getLocalizedPlan(plan, t).name : event.subject;
          return tl.planStarted.replace('{{plan}}', name);
        }
        case 'plan-completed': {
          const plan = READING_PLANS.find(p => p.id === event.subject);
          const name = plan ? getLocalizedPlan(plan, t).name : event.subject;
          return tl.planCompleted.replace('{{plan}}', name);
        }
      }
    },
    [tl, t, language, localizedRef],
  );

  const eventAccent = useCallback(
    (type: TimelineEvent['type']): string => {
      switch (type) {
        case 'book-completed':
          return colors.success;
        case 'achievement':
        case 'streak-record':
          return colors.warning;
        case 'devotion-streak':
          return colors.primary;
        case 'first-favorite':
          return colors.error;
        case 'first-highlight':
          return colors.accent;
        default:
          return colors.primary;
      }
    },
    [colors],
  );

  // Month sections, newest first (the feed is already sorted).
  const sections = useMemo(() => {
    if (!events) return [];
    const byMonth = new Map<string, TimelineEvent[]>();
    for (const event of events) {
      const key = timelineMonthKey(event.timestamp);
      const bucket = byMonth.get(key);
      if (bucket) bucket.push(event);
      else byMonth.set(key, [event]);
    }
    return [...byMonth.entries()].map(([key, monthEvents]) => ({
      key,
      caption: new Date(monthEvents[0].timestamp).toLocaleDateString(locale, {
        month: 'long',
        year: 'numeric',
      }),
      events: monthEvents,
    }));
  }, [events, locale]);

  const headerGradient: [string, string] = [colors.primary, colors.primaryDark];

  // Render-ready share card: the newest milestones, already localized (the
  // feed arrives newest-first). Uniform Ionicons glyphs — achievement events
  // carry EMOJI icons that belong to Text, not to the card's glyph circles.
  const shareCard = useMemo(
    () =>
      buildTimelineCard(
        (events ?? []).map(event => ({
          title: eventTitle(event),
          dateLabel: new Date(event.timestamp).toLocaleDateString(locale, {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          }),
          icon: TYPE_ICONS[event.type],
        })),
      ),
    [events, eventTitle, locale],
  );

  // Share ONE milestone (Sprint 83): long-press a row → a focused single-
  // milestone card (the same view-shot pipeline, headline + the milestone's
  // full date instead of a "1 hito" count). Haptic confirms the long-press.
  const shareSingle = useCallback(
    (event: TimelineEvent) => {
      haptics.press();
      const milestone = {
        title: eventTitle(event),
        dateLabel: new Date(event.timestamp).toLocaleDateString(locale, {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        }),
        icon: TYPE_ICONS[event.type],
      };
      setShare({
        card: buildTimelineCard([milestone], {maxItems: 1}),
        headline: tl.shareOneTitle,
        caption: milestone.dateLabel,
      });
    },
    [eventTitle, locale, tl.shareOneTitle],
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
            {/* Share the recent milestones as an image (Sprint 81) — hidden
                for empty feeds: nothing to compose, honest gate. */}
            {events && events.length > 0 ? (
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => {
                  haptics.tap();
                  setShare({card: shareCard});
                }}
                accessibilityRole="button"
                accessibilityLabel={tl.shareImage}>
                <Ionicons
                  name="share-outline"
                  size={22}
                  color={staticColors.white}
                />
              </TouchableOpacity>
            ) : null}
          </View>
          <View style={styles.headerTextRow}>
            <View style={styles.headerIcon}>
              <Ionicons name="footsteps" size={26} color={staticColors.white} />
            </View>
            <View style={styles.headerInfo}>
              <AppText scaleRole="compact" style={styles.headerLabel}>
                {tl.subtitle}
              </AppText>
              <AppText scaleRole="display" style={styles.headerTitle}>
                {tl.title}
              </AppText>
            </View>
          </View>
        </LinearGradient>

        <ScrollView
          contentContainerStyle={[styles.content, centeredMaxWidth()]}
          showsVerticalScrollIndicator={false}>
          {status === 'loading' && (
            <View style={styles.centerState}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          )}

          {status === 'error' && (
            <View style={styles.centerState}>
              <Ionicons
                name="alert-circle-outline"
                size={40}
                color={colors.textTertiary}
              />
              <AppText
                style={[styles.stateText, {color: colors.textSecondary}]}>
                {tl.error}
              </AppText>
            </View>
          )}

          {status === 'ready' && sections.length === 0 && (
            <View style={styles.centerState}>
              <Ionicons
                name="footsteps-outline"
                size={40}
                color={colors.textTertiary}
              />
              <AppText style={[styles.stateText, {color: colors.text}]}>
                {tl.empty}
              </AppText>
              <AppText
                scaleRole="compact"
                style={[styles.stateHint, {color: colors.textSecondary}]}>
                {tl.emptyHint}
              </AppText>
            </View>
          )}

          {status === 'ready' &&
            sections.map(section => (
              <View key={section.key} style={styles.monthSection}>
                <AppText
                  scaleRole="compact"
                  style={[styles.monthCaption, {color: colors.textTertiary}]}>
                  {section.caption}
                </AppText>
                <View
                  style={[
                    styles.monthCard,
                    {backgroundColor: colors.card, borderColor: colors.border},
                  ]}>
                  {section.events.map((event, index) => {
                    const accent = eventAccent(event.type);
                    const dateCaption = new Date(
                      event.timestamp,
                    ).toLocaleDateString(locale, {
                      day: 'numeric',
                      month: 'short',
                    });
                    return (
                      <TouchableOpacity
                        key={event.id}
                        activeOpacity={0.6}
                        onLongPress={() => shareSingle(event)}
                        delayLongPress={300}
                        style={[
                          styles.eventRow,
                          index < section.events.length - 1 && [
                            styles.eventRowDivider,
                            {borderBottomColor: colors.divider},
                          ],
                        ]}
                        accessible={true}
                        accessibilityLabel={`${eventTitle(event)}, ${dateCaption}`}
                        accessibilityHint={tl.shareOneHint}
                        accessibilityActions={[
                          {name: 'longpress', label: tl.shareOneA11y},
                        ]}
                        onAccessibilityAction={e => {
                          if (e.nativeEvent.actionName === 'longpress') {
                            shareSingle(event);
                          }
                        }}>
                        <View
                          style={[
                            styles.eventGlyph,
                            {backgroundColor: accent + '1F'},
                          ]}>
                          {/* Achievements carry an EMOJI from their catalog —
                              a standalone Text in a fixed circle (safe; the
                              S70 emoji hazard is inline-in-wrapping-text).
                              Everything else uses the type's Ionicons. */}
                          {event.icon ? (
                            <AppText style={styles.eventEmoji}>
                              {event.icon}
                            </AppText>
                          ) : (
                            <Ionicons
                              name={
                                TYPE_ICONS[
                                  event.type
                                ] as keyof typeof Ionicons.glyphMap
                              }
                              size={17}
                              color={accent}
                            />
                          )}
                        </View>
                        <AppText
                          style={[styles.eventTitle, {color: colors.text}]}
                          numberOfLines={2}>
                          {eventTitle(event)}
                        </AppText>
                        <AppText
                          scaleRole="compact"
                          style={[
                            styles.eventDate,
                            {color: colors.textTertiary},
                          ]}>
                          {dateCaption}
                        </AppText>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            ))}
        </ScrollView>

        {/* Share-as-image (Sprint 81/83) — recent milestones (header button)
            or a single milestone (row long-press). Mounted only with content. */}
        {share && share.card.milestones.length > 0 ? (
          <TimelineImageModal
            visible
            card={share.card}
            headline={share.headline}
            caption={share.caption}
            onClose={() => setShare(null)}
          />
        ) : null}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1},
  header: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    borderBottomLeftRadius: borderRadius['2xl'],
    borderBottomRightRadius: borderRadius['2xl'],
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -spacing['1.5'],
  },
  headerTextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.lg,
    backgroundColor: staticColors.glassWhite20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  headerInfo: {flex: 1},
  headerLabel: {
    color: staticColors.glassWhite80,
    fontSize: fontSizes.xs,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  headerTitle: {
    color: staticColors.white,
    fontSize: fontSizes['2xl'],
    fontWeight: '700',
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing['3xl'],
  },
  centerState: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing['3xl'],
    paddingHorizontal: spacing.lg,
  },
  stateText: {
    fontSize: fontSizes.md,
    fontWeight: '600',
    textAlign: 'center',
  },
  stateHint: {
    fontSize: fontSizes.sm,
    textAlign: 'center',
    lineHeight: 20,
  },
  monthSection: {
    marginBottom: spacing.lg,
  },
  monthCaption: {
    fontSize: fontSizes.xs,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: spacing.xs,
    marginLeft: spacing.xs,
  },
  monthCard: {
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
  },
  eventRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  eventRowDivider: {
    borderBottomWidth: 1,
  },
  eventGlyph: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eventEmoji: {
    fontSize: 15,
    lineHeight: 19,
  },
  eventTitle: {
    flex: 1,
    fontSize: fontSizes.sm,
    fontWeight: '600',
    lineHeight: 19,
  },
  eventDate: {
    fontSize: fontSizes.xs,
    fontWeight: '600',
  },
});
