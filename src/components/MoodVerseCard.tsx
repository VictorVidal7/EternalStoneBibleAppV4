/**
 * 💛 MoodVerseCard — a verse for TODAY's checked-in feeling (Sprint 81).
 *
 * When the reader has named their state of heart today (the [[feelingsLog]]
 * check-in), Home answers with ONE verse from that feeling's curated
 * passages — deterministic per (feeling, local day) via the same stable
 * rolling hash the lectio prompts use, so it doesn't reshuffle on re-render
 * but DOES change day to day. Hidden entirely when there is no check-in
 * today (honest gate — Home stays calm).
 *
 * Router-free like [[FeelingChips]]: the owner injects `onOpenVerse`, so the
 * component stays unit-testable and reusable.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import React, {useCallback, useState} from 'react';
import {View, TouchableOpacity, StyleSheet} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {useFocusEffect} from 'expo-router';
import {AppText} from '@components/ui/AppText';
import {useTheme} from '@hooks/useTheme';
import {useLanguage} from '@hooks/useLanguage';
import {useBibleVersion} from '@hooks/useBibleVersion';
import {haptics} from '@lib/haptics';
import {logger} from '@lib/utils/logger';
import bibleDB from '@lib/database';
import {getBookByName} from '@/constants/bible';
import {
  getFeeling,
  feelingVerseRefForDay,
  type Feeling,
} from '@/features/study/feelings';
import {getFeelingsLog} from '@/features/study/feelingsLogStore';
import {feelingsDateKey} from '@/features/study/feelingsLog';
import {parseThemeRef} from '@/features/study/themes';
import {
  borderRadius,
  fontSize as fontSizes,
  spacing,
  verseTextRightSlack,
} from '@/styles/designTokens';

interface MoodVerseCardProps {
  /** Open the verse in its chapter (English book name + chapter + verse). */
  onOpenVerse: (book: string, chapter: number, verse: number) => void;
}

interface MoodVerse {
  feeling: Feeling;
  bookEn: string;
  bookDisplay: string;
  chapter: number;
  verse: number;
  text: string;
}

export const MoodVerseCard: React.FC<MoodVerseCardProps> = ({onOpenVerse}) => {
  const {colors} = useTheme();
  const {t, language} = useLanguage();
  const {selectedVersion} = useBibleVersion();
  const tf = t.feelings;
  const feelingNames = tf.list as Record<string, {name: string}>;

  const [moodVerse, setMoodVerse] = useState<MoodVerse | null>(null);

  // Re-resolve on every focus: a check-in happens on the feeling detail and
  // Home is the screen the reader comes back to.
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      void (async () => {
        try {
          const log = await getFeelingsLog();
          const todayKey = feelingsDateKey(Date.now());
          const feelingId = log.days[todayKey];
          const feeling = feelingId ? getFeeling(feelingId) : undefined;
          if (!feeling || feeling.verseRefs.length === 0) {
            if (!cancelled) setMoodVerse(null);
            return;
          }
          // Deterministic per (feeling, local day) — the shared lectio hash.
          const ref = feelingVerseRefForDay(feeling, todayKey);
          const parsed = ref ? parseThemeRef(ref) : null;
          const book = parsed ? getBookByName(parsed.book) : null;
          if (!parsed || !book) {
            if (!cancelled) setMoodVerse(null);
            return;
          }
          await bibleDB.initialize();
          // getVerse takes the NUMERIC book id — a string returns null.
          const row = await bibleDB.getVerse(
            book.id,
            parsed.chapter,
            parsed.verse,
            selectedVersion.id,
          );
          if (cancelled) return;
          if (!row?.text) {
            setMoodVerse(null);
            return;
          }
          setMoodVerse({
            feeling,
            bookEn: book.nameEn,
            bookDisplay: language === 'en' ? book.nameEn : book.name,
            chapter: parsed.chapter,
            verse: parsed.verse,
            text: row.text,
          });
        } catch (error) {
          logger.warn('Mood verse resolution failed', {
            component: 'MoodVerseCard',
            error: String(error),
          });
          if (!cancelled) setMoodVerse(null);
        }
      })();
      return () => {
        cancelled = true;
      };
    }, [selectedVersion.id, language]),
  );

  if (!moodVerse) return null;

  const {feeling} = moodVerse;
  const feelingName = feelingNames[feeling.id]?.name ?? feeling.id;
  const reference = `${moodVerse.bookDisplay} ${moodVerse.chapter}:${moodVerse.verse}`;

  return (
    <TouchableOpacity
      style={[
        styles.card,
        {
          backgroundColor: feeling.accent + '14',
          borderColor: feeling.accent + '45',
        },
      ]}
      onPress={() => {
        haptics.tap();
        onOpenVerse(moodVerse.bookEn, moodVerse.chapter, moodVerse.verse);
      }}
      accessibilityRole="button"
      accessibilityLabel={`${tf.moodVerseTitle} (${feelingName}): ${reference}. ${moodVerse.text}`}
      accessibilityHint={tf.moodVerseHint}>
      <View style={styles.headerRow}>
        <Ionicons
          name={feeling.icon as keyof typeof Ionicons.glyphMap}
          size={14}
          color={feeling.accent}
        />
        <AppText
          scaleRole="compact"
          style={[styles.title, {color: feeling.accent}]}>
          {tf.moodVerseTitle} · {feelingName}
        </AppText>
      </View>
      <AppText style={[styles.verseText, {color: colors.text}]}>
        “{moodVerse.text.trim()}”
      </AppText>
      <View style={styles.footerRow}>
        <AppText
          scaleRole="compact"
          style={[styles.reference, {color: colors.textSecondary}]}>
          {reference}
        </AppText>
        <Ionicons
          name="chevron-forward"
          size={14}
          color={colors.textTertiary}
        />
      </View>
    </TouchableOpacity>
  );
};

export default MoodVerseCard;

const styles = StyleSheet.create({
  card: {
    marginTop: spacing.md,
    padding: spacing.base,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  title: {
    fontSize: fontSizes.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  verseText: {
    fontSize: fontSizes.sm,
    lineHeight: fontSizes.sm * 1.55,
    fontStyle: 'italic',
    // Right-edge anti-clip slack for italic scripture on some OEMs (S94).
    paddingRight: verseTextRightSlack(fontSizes.sm),
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  reference: {
    fontSize: fontSizes.xs,
    fontWeight: '600',
  },
});
