/**
 * 🧩 PROPHECY QUIZ — "emparejar profecía↔cumplimiento" (Hilo profético
 * robustness round 3).
 *
 * A light matching game over the same MESSIANIC_PROPHECIES catalog the guided
 * walk and the reading plan already use: each round samples a handful of
 * entries, the left column shows the prophecy's theme label + OT reference,
 * the right column its NT fulfillment reference (shuffled independently), and
 * the player taps one from each side to pair them. A correct pair locks in
 * green; a wrong one flashes red and clears. No new theological content —
 * reuses the existing catalog + i18n label already vetted elsewhere.
 *
 * Reached from the Hilo profético intro hub ("Jugar el quiz") + the deep link
 * eternalbible://features/prophecies/quiz.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import React, {useEffect, useMemo, useRef, useState} from 'react';
import {View, ScrollView, TouchableOpacity, StyleSheet} from 'react-native';
import {Stack, useRouter} from 'expo-router';
import {Ionicons} from '@expo/vector-icons';
import {LinearGradient} from 'expo-linear-gradient';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTheme} from '@hooks/useTheme';
import {useLanguage} from '@hooks/useLanguage';
import {useBibleVersion} from '@hooks/useBibleVersion';
import {haptics} from '@lib/haptics';
import {AppText} from '@components/ui/AppText';
import {formatChristRefLabel} from '@/features/study/christConnections';
import {
  pickQuizRound,
  shuffle,
  QUIZ_ROUND_SIZE,
} from '@/features/study/propheticQuiz';
import type {MessianicProphecy} from '@/features/study/messianicProphecies';
import {
  borderRadius,
  fontSize as fontSizes,
  spacing,
  staticColors,
} from '@/styles/designTokens';

export default function PropheticQuizScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {colors, gradient} = useTheme();
  const {t} = useLanguage();
  const {selectedVersion} = useBibleVersion();
  const tp = t.prophecies;
  const lang = selectedVersion.language === 'es' ? 'es' : 'en';
  const items = tp.items as Record<string, {label: string; note: string}>;

  const seenRef = useRef<Set<string>>(new Set());
  const [roundNum, setRoundNum] = useState(1);
  const [round, setRound] = useState<MessianicProphecy[]>(() =>
    pickQuizRound(QUIZ_ROUND_SIZE, seenRef.current),
  );
  const [leftOrder, setLeftOrder] = useState<string[]>([]);
  const [rightOrder, setRightOrder] = useState<string[]>([]);
  const [matched, setMatched] = useState<Set<string>>(new Set());
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
  const [wrongIds, setWrongIds] = useState<{
    left: string;
    right: string;
  } | null>(null);
  const [score, setScore] = useState(0);
  const [mistakes, setMistakes] = useState(0);

  // (Re)shuffle both columns whenever a new round starts.
  useEffect(() => {
    setLeftOrder(shuffle(round.map(p => p.id)));
    setRightOrder(shuffle(round.map(p => p.id)));
    setMatched(new Set());
    setSelectedLeft(null);
    setWrongIds(null);
  }, [round]);

  // Auto-clear a wrong-pair flash after a beat, cleaned up on unmount so we
  // never set state on a screen the user has already left.
  useEffect(() => {
    if (!wrongIds) return;
    const timer = setTimeout(() => {
      setWrongIds(null);
      setSelectedLeft(null);
    }, 600);
    return () => clearTimeout(timer);
  }, [wrongIds]);

  const byId = useMemo(() => {
    const m = new Map<string, MessianicProphecy>();
    round.forEach(p => m.set(p.id, p));
    return m;
  }, [round]);

  const roundComplete = round.length > 0 && matched.size === round.length;

  const headerGradient = (
    gradient?.headerColors
      ? [...gradient.headerColors]
      : [colors.primary, colors.primaryDark]
  ) as [string, string, ...string[]];

  const startNextRound = () => {
    haptics.tap();
    round.forEach(p => seenRef.current.add(p.id));
    setRoundNum(n => n + 1);
    setScore(0);
    setMistakes(0);
    setRound(pickQuizRound(QUIZ_ROUND_SIZE, seenRef.current));
  };

  const tapLeft = (id: string) => {
    if (matched.has(id) || wrongIds) return;
    haptics.tap();
    setSelectedLeft(cur => (cur === id ? null : id));
  };

  const tapRight = (id: string) => {
    if (matched.has(id) || wrongIds || !selectedLeft) return;
    if (selectedLeft === id) {
      haptics.success();
      setMatched(prev => new Set(prev).add(id));
      setScore(s => s + 1);
      setSelectedLeft(null);
    } else {
      haptics.error();
      setMistakes(m => m + 1);
      setWrongIds({left: selectedLeft, right: id});
    }
  };

  function cardStyle(state: 'idle' | 'selected' | 'matched' | 'wrong') {
    switch (state) {
      case 'matched':
        return {
          backgroundColor: colors.success + '22',
          borderColor: colors.success,
        };
      case 'wrong':
        return {
          backgroundColor: colors.error + '22',
          borderColor: colors.error,
        };
      case 'selected':
        return {
          backgroundColor: colors.primary + '22',
          borderColor: colors.primary,
        };
      default:
        return {backgroundColor: colors.surface, borderColor: colors.border};
    }
  }

  return (
    <View style={[styles.container, {backgroundColor: colors.background}]}>
      <Stack.Screen options={{headerShown: false}} />
      <LinearGradient
        colors={headerGradient}
        start={{x: 0, y: 0}}
        end={{x: 0, y: 1}}
        style={[styles.header, {paddingTop: insets.top + spacing.md}]}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel={t.bible.back}>
            <Ionicons name="arrow-back" size={24} color={staticColors.white} />
          </TouchableOpacity>
          <AppText scaleRole="compact" style={styles.headerRound}>
            {tp.quizRoundOf.replace('{{n}}', String(roundNum))}
          </AppText>
        </View>
        <AppText scaleRole="display" style={styles.headerTitle}>
          {tp.quizTitle}
        </AppText>
        <AppText scaleRole="compact" style={styles.headerSubtitle}>
          {tp.quizSubtitle}
        </AppText>
        <View style={styles.scoreRow}>
          <View style={styles.scoreChip}>
            <Ionicons
              name="checkmark-circle"
              size={14}
              color={staticColors.white}
            />
            <AppText scaleRole="compact" style={styles.scoreChipText}>
              {tp.quizScore}: {score}
            </AppText>
          </View>
          <View style={styles.scoreChip}>
            <Ionicons
              name="close-circle"
              size={14}
              color={staticColors.white}
            />
            <AppText scaleRole="compact" style={styles.scoreChipText}>
              {tp.quizMistakes}: {mistakes}
            </AppText>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          {paddingBottom: insets.bottom + spacing.xl},
        ]}
        showsVerticalScrollIndicator={false}>
        <AppText
          scaleRole="compact"
          style={[styles.hint, {color: colors.textSecondary}]}>
          {tp.quizHint}
        </AppText>

        <View style={styles.board}>
          <View style={styles.column}>
            {leftOrder.map(id => {
              const p = byId.get(id);
              if (!p) return null;
              const isMatched = matched.has(id);
              const isSelected = selectedLeft === id;
              const isWrong = wrongIds?.left === id;
              const state = isMatched
                ? 'matched'
                : isWrong
                  ? 'wrong'
                  : isSelected
                    ? 'selected'
                    : 'idle';
              return (
                <TouchableOpacity
                  key={id}
                  disabled={isMatched}
                  onPress={() => tapLeft(id)}
                  accessibilityRole="button"
                  accessibilityState={{
                    selected: isSelected,
                    disabled: isMatched,
                  }}
                  accessibilityLabel={items[p.id]?.label ?? p.id}
                  style={[styles.card, cardStyle(state)]}>
                  <AppText
                    scaleRole="compact"
                    numberOfLines={2}
                    style={[styles.cardLabel, {color: colors.text}]}>
                    {items[p.id]?.label ?? p.id}
                  </AppText>
                  <AppText
                    scaleRole="compact"
                    numberOfLines={1}
                    style={[styles.cardCaption, {color: colors.textTertiary}]}>
                    {formatChristRefLabel(p.prophecy, lang)}
                  </AppText>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.column}>
            {rightOrder.map(id => {
              const p = byId.get(id);
              if (!p) return null;
              const isMatched = matched.has(id);
              const isWrong = wrongIds?.right === id;
              const state = isMatched ? 'matched' : isWrong ? 'wrong' : 'idle';
              const refText = formatChristRefLabel(p.fulfillment, lang);
              return (
                <TouchableOpacity
                  key={id}
                  disabled={isMatched}
                  onPress={() => tapRight(id)}
                  accessibilityRole="button"
                  accessibilityState={{disabled: isMatched}}
                  accessibilityLabel={refText}
                  style={[styles.card, styles.cardRight, cardStyle(state)]}>
                  <AppText
                    scaleRole="compact"
                    numberOfLines={2}
                    style={[styles.cardLabel, {color: colors.text}]}>
                    {refText}
                  </AppText>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {roundComplete ? (
          <View
            style={[
              styles.completeCard,
              {backgroundColor: colors.surface, borderColor: colors.primary},
            ]}>
            <AppText style={[styles.completeTitle, {color: colors.text}]}>
              {mistakes === 0 ? tp.quizCompletePerfect : tp.quizComplete}
            </AppText>
            <TouchableOpacity
              style={[styles.nextRoundBtn, {backgroundColor: colors.primary}]}
              onPress={startNextRound}
              accessibilityRole="button"
              accessibilityLabel={tp.quizNextRound}>
              <AppText
                style={[styles.nextRoundBtnText, {color: staticColors.white}]}>
                {tp.quizNextRound}
              </AppText>
              <Ionicons name="refresh" size={18} color={staticColors.white} />
            </TouchableOpacity>
          </View>
        ) : null}
      </ScrollView>
    </View>
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
    marginBottom: spacing.xs,
  },
  iconButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerRound: {
    color: staticColors.glassWhite90,
    fontSize: fontSizes.sm,
    fontWeight: '700',
  },
  headerTitle: {
    color: staticColors.white,
    fontSize: fontSizes['2xl'],
    fontWeight: '800',
  },
  headerSubtitle: {
    color: staticColors.glassWhite90,
    fontSize: fontSizes.sm,
    marginTop: 2,
  },
  scoreRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  scoreChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
    backgroundColor: staticColors.glassWhite18,
  },
  scoreChipText: {
    color: staticColors.white,
    fontSize: fontSizes.xs,
    fontWeight: '700',
  },
  scroll: {paddingHorizontal: spacing.lg, paddingTop: spacing.lg},
  hint: {fontSize: fontSizes.sm, marginBottom: spacing.md, textAlign: 'center'},
  board: {flexDirection: 'row', gap: spacing.sm},
  column: {flex: 1, gap: spacing.sm},
  card: {
    minHeight: 64,
    borderWidth: 1.5,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    justifyContent: 'center',
  },
  cardRight: {justifyContent: 'center'},
  cardLabel: {fontSize: fontSizes.sm, fontWeight: '700'},
  cardCaption: {fontSize: fontSizes.xs, marginTop: 2},
  completeCard: {
    marginTop: spacing.lg,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: 1.5,
    alignItems: 'center',
    gap: spacing.md,
  },
  completeTitle: {fontSize: fontSizes.lg, fontWeight: '800'},
  nextRoundBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
  },
  nextRoundBtnText: {fontSize: fontSizes.md, fontWeight: '700'},
});
