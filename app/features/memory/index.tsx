/**
 * 🧠 MEMORY DECK SCREEN
 *
 * Landing screen for the verse-memorization feature. Shows three
 * stat counters (total / due / mastered), a primary "Practice"
 * call-to-action when there are cards due today, and the list of
 * every card in the deck with its current box and next-review date.
 *
 * Cards are sorted "soonest-due first" so the user immediately sees
 * what needs attention.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import React, {useEffect, useMemo, useRef} from 'react';
import {
  Animated,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import {useRouter, Stack} from 'expo-router';
import {Ionicons} from '@expo/vector-icons';
import {LinearGradient} from 'expo-linear-gradient';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import {useTheme} from '@hooks/useTheme';
import {useLanguage} from '@hooks/useLanguage';
import {useToast} from '@context/ToastContext';
import {useMemoryDeck} from '@context/MemoryDeckContext';
import {getBookByName} from '@/constants/bible';
import type {MemoryCard} from '@lib/memory/srs';
import {isMastered} from '@lib/memory/srs';
import {
  borderRadius,
  fontSize as fontSizes,
  spacing,
} from '@/styles/designTokens';

export default function MemoryDeckScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {colors, gradient} = useTheme();
  const {t, language} = useLanguage();
  const toast = useToast();
  const {cards, dueCards, stats, removeCard} = useMemoryDeck();

  const headerGradient = useMemo(
    () =>
      gradient?.headerColors
        ? ([...gradient.headerColors] as [string, string, string])
        : (['#4f46e5', '#7c3aed', '#a855f7'] as [string, string, string]),
    [gradient?.headerColors],
  );

  // Soonest-due first; stable secondary sort by added time.
  const sortedCards = useMemo(() => {
    return [...cards].sort((a, b) => {
      const dueDiff = new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime();
      if (dueDiff !== 0) return dueDiff;
      return new Date(a.addedAt).getTime() - new Date(b.addedAt).getTime();
    });
  }, [cards]);

  const handlePractice = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/features/memory/practice' as any);
  };

  const confirmRemove = (card: MemoryCard) => {
    Alert.alert(
      t.memory.remove.title,
      t.memory.remove.message,
      [
        {text: t.memory.remove.cancel, style: 'cancel'},
        {
          text: t.memory.remove.confirm,
          style: 'destructive',
          onPress: () => {
            removeCard(card.verseKey);
            toast.success(t.memory.removedToast);
          },
        },
      ],
      {cancelable: true},
    );
  };

  const isEmpty = cards.length === 0;
  const dueCount = dueCards.length;

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
              <Ionicons name="school" size={28} color="#FFFFFF" />
            </View>
            <View style={styles.headerInfo}>
              <Text style={styles.headerLabel}>{t.memory.homeHint}</Text>
              <Text style={styles.headerTitle}>{t.memory.title}</Text>
            </View>
          </View>

          {/* Stats row */}
          <View style={styles.statsRow}>
            <StatBubble value={stats.total} label={t.memory.stats.total} />
            <StatBubble value={stats.due} label={t.memory.stats.due} />
            <StatBubble
              value={stats.mastered}
              label={t.memory.stats.mastered}
            />
          </View>
        </LinearGradient>

        <ScrollView
          style={styles.body}
          contentContainerStyle={[
            styles.bodyContent,
            {paddingBottom: insets.bottom + spacing['4xl']},
          ]}>
          {/* Practice CTA */}
          {dueCount > 0 ? (
            <PulsingPracticeCta
              onPress={handlePractice}
              backgroundColor={colors.primary}
              label={
                dueCount === 1
                  ? t.memory.practiceCtaSingular
                  : t.memory.practiceCta.replace('{{count}}', String(dueCount))
              }
            />
          ) : !isEmpty ? (
            <View
              style={[
                styles.noDueCard,
                {backgroundColor: colors.surface, borderColor: colors.border},
              ]}>
              <Ionicons
                name="checkmark-circle-outline"
                size={28}
                color={colors.success}
              />
              <Text style={[styles.noDueTitle, {color: colors.text}]}>
                {t.memory.noDueToday}
              </Text>
              <Text style={[styles.noDueHint, {color: colors.textSecondary}]}>
                {t.memory.noDueHint}
              </Text>
            </View>
          ) : null}

          {/* Empty state */}
          {isEmpty && (
            <View style={[styles.emptyCard, {backgroundColor: colors.surface}]}>
              <Text style={styles.emptyIcon}>📖</Text>
              <Text style={[styles.emptyTitle, {color: colors.text}]}>
                {t.memory.empty}
              </Text>
              <Text style={[styles.emptyBody, {color: colors.textSecondary}]}>
                {t.memory.emptyHint}
              </Text>
            </View>
          )}

          {/* Cards list */}
          {sortedCards.map(card => (
            <DeckRow
              key={card.verseKey}
              card={card}
              language={language}
              t={t}
              colors={colors}
              onRemove={() => confirmRemove(card)}
            />
          ))}
        </ScrollView>
      </View>
    </>
  );
}

interface DeckRowProps {
  card: MemoryCard;
  language: 'es' | 'en';
  t: ReturnType<typeof useLanguage>['t'];
  colors: ReturnType<typeof useTheme>['colors'];
  onRemove: () => void;
}
const DeckRow: React.FC<DeckRowProps> = ({
  card,
  language,
  t,
  colors,
  onRemove,
}) => {
  const mastered = isMastered(card);
  const bookInfo = getBookByName(card.bookName);
  const displayBook = bookInfo
    ? language === 'en'
      ? bookInfo.nameEn
      : bookInfo.name
    : card.bookName;
  const reference = `${displayBook} ${card.chapter}:${card.verse}`;
  const nextReview = formatRelativeDate(card.dueAt, language);

  return (
    <View
      style={[
        styles.row,
        {
          backgroundColor: colors.surface,
          borderColor: mastered ? colors.success : colors.border,
          borderWidth: mastered ? 1.5 : StyleSheet.hairlineWidth,
        },
      ]}>
      <View style={styles.rowMain}>
        <View style={styles.rowHeader}>
          <Text style={[styles.rowReference, {color: colors.primary}]}>
            {reference}
          </Text>
          <View
            style={[
              styles.boxBadge,
              {
                backgroundColor: mastered
                  ? colors.success + '20'
                  : colors.primary + '15',
              },
            ]}>
            <Text
              style={[
                styles.boxBadgeText,
                {color: mastered ? colors.success : colors.primary},
              ]}>
              {mastered
                ? t.memory.mastered
                : t.memory.box.replace('{{n}}', String(card.box))}
            </Text>
          </View>
        </View>
        <Text
          style={[styles.rowText, {color: colors.textSecondary}]}
          numberOfLines={2}>
          {card.text}
        </Text>
        <Text style={[styles.rowMeta, {color: colors.textTertiary}]}>
          {t.memory.nextReview}: {nextReview}
        </Text>
      </View>
      <TouchableOpacity
        style={styles.rowAction}
        onPress={onRemove}
        accessibilityRole="button"
        accessibilityLabel={t.memory.removeFromDeck}>
        <Ionicons name="trash-outline" size={20} color={colors.error} />
      </TouchableOpacity>
    </View>
  );
};

/** "today" / "tomorrow" / "in 3d" / "2d ago" — localized + concise. */
function formatRelativeDate(iso: string, language: 'es' | 'en'): string {
  const due = new Date(iso).getTime();
  const now = Date.now();
  const diffMs = due - now;
  const dayMs = 24 * 60 * 60 * 1000;
  const diffDays = Math.round(diffMs / dayMs);

  if (language === 'es') {
    if (diffDays <= 0) return 'hoy';
    if (diffDays === 1) return 'mañana';
    return `en ${diffDays} días`;
  }
  if (diffDays <= 0) return 'today';
  if (diffDays === 1) return 'tomorrow';
  return `in ${diffDays} days`;
}

const StatBubble: React.FC<{value: number; label: string}> = ({
  value,
  label,
}) => {
  // Soft spring-up entrance on mount so the stats feel like they
  // settle into place rather than appearing instantly.
  const scale = useRef(new Animated.Value(0.85)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: true,
        speed: 12,
        bounciness: 7,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start();
  }, [opacity, scale]);
  return (
    <Animated.View style={[styles.statBubble, {opacity, transform: [{scale}]}]}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </Animated.View>
  );
};

/**
 * Practice call-to-action with a slow breathing pulse — draws the eye
 * while cards are due. Pulse stops the moment the user taps so the
 * scale-up isn't competing with the route transition.
 */
const PulsingPracticeCta: React.FC<{
  onPress: () => void;
  backgroundColor: string;
  label: string;
}> = ({onPress, backgroundColor, label}) => {
  const pulse = useRef(new Animated.Value(1)).current;
  const stoppedRef = useRef(false);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.035,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => {
      stoppedRef.current = true;
      loop.stop();
    };
  }, [pulse]);

  const handlePress = () => {
    if (!stoppedRef.current) {
      pulse.stopAnimation();
      stoppedRef.current = true;
    }
    onPress();
  };

  return (
    <Animated.View style={{transform: [{scale: pulse}]}}>
      <TouchableOpacity
        style={[styles.practiceCta, {backgroundColor}]}
        onPress={handlePress}
        accessibilityRole="button">
        <Ionicons name="play" size={22} color="#FFFFFF" />
        <Text style={styles.practiceCtaText}>{label}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

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
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  headerTextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  headerIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerInfo: {
    flex: 1,
  },
  headerLabel: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: fontSizes.sm,
    fontWeight: '600',
    marginBottom: 2,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: fontSizes['2xl'],
    fontWeight: '800',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  statBubble: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  statValue: {
    color: '#FFFFFF',
    fontSize: fontSizes['2xl'],
    fontWeight: '800',
  },
  statLabel: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
    textAlign: 'center',
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  practiceCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  practiceCtaText: {
    color: '#FFFFFF',
    fontSize: fontSizes.base,
    fontWeight: '800',
  },
  noDueCard: {
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.lg,
  },
  noDueTitle: {
    fontSize: fontSizes.base,
    fontWeight: '700',
  },
  noDueHint: {
    fontSize: fontSizes.sm,
    textAlign: 'center',
  },
  emptyCard: {
    padding: spacing['2xl'],
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    gap: spacing.sm,
  },
  emptyIcon: {
    fontSize: 56,
    marginBottom: spacing.sm,
  },
  emptyTitle: {
    fontSize: fontSizes.lg,
    fontWeight: '800',
  },
  emptyBody: {
    fontSize: fontSizes.sm,
    textAlign: 'center',
    lineHeight: 20,
  },
  row: {
    flexDirection: 'row',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  rowMain: {
    flex: 1,
  },
  rowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  rowReference: {
    fontSize: fontSizes.base,
    fontWeight: '800',
  },
  boxBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  boxBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  rowText: {
    fontSize: fontSizes.sm,
    lineHeight: 18,
    marginBottom: 4,
  },
  rowMeta: {
    fontSize: 11,
    fontWeight: '600',
  },
  rowAction: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
