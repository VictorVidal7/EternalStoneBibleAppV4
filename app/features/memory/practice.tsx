/**
 * 🧠 MEMORY PRACTICE SCREEN
 *
 * Flashcard-style review session. The queue is captured **once** on
 * mount (from `dueCards` at that moment) so users finish exactly the
 * session they started — reviewing a card with grade `again` reschedules
 * it via the SRS algo but does NOT re-add it to the active queue.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import React, {useMemo, useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import {useRouter, Stack} from 'expo-router';
import {Ionicons} from '@expo/vector-icons';
import {LinearGradient} from 'expo-linear-gradient';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import {useTheme} from '@hooks/useTheme';
import {useLanguage} from '@hooks/useLanguage';
import {useMemoryDeck} from '@context/MemoryDeckContext';
import {getBookByName} from '@/constants/bible';
import type {ReviewGrade} from '@lib/memory/srs';
import {
  borderRadius,
  fontSize as fontSizes,
  spacing,
} from '@/styles/designTokens';

const GRADE_COLORS: Record<ReviewGrade, string> = {
  again: '#EF4444',
  hard: '#F59E0B',
  good: '#22C55E',
  easy: '#3B82F6',
};

export default function MemoryPracticeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {colors, gradient} = useTheme();
  const {t, language} = useLanguage();
  const {dueCards, reviewCard} = useMemoryDeck();

  // Freeze the queue on mount so a grade-driven reshuffle doesn't add
  // the same card back into the current session.
  const [queue] = useState(() => [...dueCards]);
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);

  const total = queue.length;
  const card = queue[index];
  const done = index >= total;

  const headerGradient = useMemo(
    () =>
      gradient?.headerColors
        ? ([...gradient.headerColors] as [string, string, string])
        : (['#4f46e5', '#7c3aed', '#a855f7'] as [string, string, string]),
    [gradient?.headerColors],
  );

  const displayBookName = useMemo(() => {
    if (!card) return '';
    const info = getBookByName(card.bookName);
    if (!info) return card.bookName;
    return language === 'en' ? info.nameEn : info.name;
  }, [card, language]);

  const handleReveal = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRevealed(true);
  };

  const handleGrade = (grade: ReviewGrade) => {
    if (!card) return;
    Haptics.notificationAsync(
      grade === 'again'
        ? Haptics.NotificationFeedbackType.Warning
        : Haptics.NotificationFeedbackType.Success,
    );
    reviewCard(card.verseKey, grade);
    // Advance to the next card. We don't pull from `dueCards` again on
    // purpose — see the queue-freeze rationale at the top.
    setIndex(prev => prev + 1);
    setRevealed(false);
  };

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
            <Ionicons name="close" size={24} color="#FFFFFF" />
          </TouchableOpacity>

          <View style={styles.headerTextRow}>
            <Text style={styles.headerTitle}>{t.memory.practice.title}</Text>
            {!done && (
              <Text style={styles.headerProgress}>
                {t.memory.practice.progress
                  .replace('{{current}}', String(Math.min(index + 1, total)))
                  .replace('{{total}}', String(total))}
              </Text>
            )}
          </View>

          {/* Progress bar */}
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                {width: `${total ? (index / total) * 100 : 0}%`},
              ]}
            />
          </View>
        </LinearGradient>

        <ScrollView
          style={styles.body}
          contentContainerStyle={[
            styles.bodyContent,
            {paddingBottom: insets.bottom + spacing['4xl']},
          ]}>
          {done ? (
            <View style={styles.doneState}>
              <Text style={styles.doneEmoji}>🎉</Text>
              <Text style={[styles.doneTitle, {color: colors.text}]}>
                {t.memory.practice.done}
              </Text>
              <Text style={[styles.doneBody, {color: colors.textSecondary}]}>
                {total === 1
                  ? t.memory.practice.doneBodySingular
                  : t.memory.practice.doneBody.replace(
                      '{{count}}',
                      String(total),
                    )}
              </Text>
              <TouchableOpacity
                style={[styles.doneCta, {backgroundColor: colors.primary}]}
                onPress={() => router.back()}>
                <Text style={styles.doneCtaText}>
                  {t.memory.practice.doneCta}
                </Text>
              </TouchableOpacity>
            </View>
          ) : card ? (
            <>
              <View
                style={[
                  styles.flashcard,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                ]}>
                <Text style={[styles.reference, {color: colors.primary}]}>
                  {displayBookName} {card.chapter}:{card.verse}
                </Text>
                {revealed ? (
                  <Text style={[styles.verseText, {color: colors.text}]}>
                    {card.text}
                  </Text>
                ) : (
                  <Text style={[styles.hidden, {color: colors.textTertiary}]}>
                    {/* Show a few hint dots so the card has visual weight
                        before reveal; equivalent length helps the user
                        gauge how long the verse is. */}
                    {hintDots(card.text)}
                  </Text>
                )}
              </View>

              {!revealed ? (
                <TouchableOpacity
                  style={[
                    styles.revealButton,
                    {backgroundColor: colors.primary},
                  ]}
                  onPress={handleReveal}>
                  <Ionicons name="eye-outline" size={22} color="#FFFFFF" />
                  <Text style={styles.revealText}>
                    {t.memory.practice.reveal}
                  </Text>
                </TouchableOpacity>
              ) : (
                <>
                  <Text style={[styles.prompt, {color: colors.textSecondary}]}>
                    {t.memory.practice.prompt}
                  </Text>
                  <View style={styles.gradeRow}>
                    <GradeButton
                      grade="again"
                      label={t.memory.practice.again}
                      onPress={() => handleGrade('again')}
                    />
                    <GradeButton
                      grade="hard"
                      label={t.memory.practice.hard}
                      onPress={() => handleGrade('hard')}
                    />
                    <GradeButton
                      grade="good"
                      label={t.memory.practice.good}
                      onPress={() => handleGrade('good')}
                    />
                    <GradeButton
                      grade="easy"
                      label={t.memory.practice.easy}
                      onPress={() => handleGrade('easy')}
                    />
                  </View>
                </>
              )}
            </>
          ) : null}
        </ScrollView>
      </View>
    </>
  );
}

const GradeButton: React.FC<{
  grade: ReviewGrade;
  label: string;
  onPress: () => void;
}> = ({grade, label, onPress}) => (
  <TouchableOpacity
    style={[styles.gradeButton, {backgroundColor: GRADE_COLORS[grade]}]}
    onPress={onPress}
    accessibilityRole="button"
    accessibilityLabel={label}>
    <Text style={styles.gradeText}>{label}</Text>
  </TouchableOpacity>
);

function hintDots(text: string): string {
  // Render one dot per word, max 30, so the user gets a sense of length.
  const words = text.trim().split(/\s+/).length;
  return '•  '.repeat(Math.min(words, 30)).trim();
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  headerTextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: fontSizes['2xl'],
    fontWeight: '800',
  },
  headerProgress: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: fontSizes.sm,
    fontWeight: '700',
  },
  progressTrack: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 3,
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
  },
  flashcard: {
    padding: spacing.xl,
    borderRadius: borderRadius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    minHeight: 220,
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  reference: {
    fontSize: fontSizes.lg,
    fontWeight: '800',
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  verseText: {
    fontSize: fontSizes.lg,
    lineHeight: 28,
    textAlign: 'center',
  },
  hidden: {
    fontSize: fontSizes.base,
    letterSpacing: 4,
    lineHeight: 28,
    textAlign: 'center',
  },
  revealButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
  },
  revealText: {
    color: '#FFFFFF',
    fontSize: fontSizes.base,
    fontWeight: '800',
  },
  prompt: {
    fontSize: fontSizes.base,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  gradeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  gradeButton: {
    flexBasis: '47%',
    flexGrow: 1,
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gradeText: {
    color: '#FFFFFF',
    fontSize: fontSizes.base,
    fontWeight: '800',
  },
  doneState: {
    alignItems: 'center',
    paddingTop: spacing['4xl'],
    gap: spacing.sm,
  },
  doneEmoji: {
    fontSize: 64,
  },
  doneTitle: {
    fontSize: fontSizes['2xl'],
    fontWeight: '800',
    textAlign: 'center',
  },
  doneBody: {
    fontSize: fontSizes.base,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  doneCta: {
    paddingHorizontal: spacing['2xl'],
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.full,
  },
  doneCtaText: {
    color: '#FFFFFF',
    fontSize: fontSizes.base,
    fontWeight: '800',
  },
});
