/**
 * 🕊️ DEVOCIÓN GUIADA — a moment with God that begins with your heart (Sprint 83)
 *
 * A short, calm bridge into the existing "Momento con Dios" journey: BREATHE +
 * name how your heart is today (the [[feelingsLog]] check-in) → the app answers
 * with ONE curated verse for that feeling (deterministic per day, the shared
 * [[feelings]].feelingVerseRefForDay hash) → REVEAL it → "Comenzar" hands off
 * to the four-movement lectio flow (lee / medita / ora / contempla), whose
 * finale now also offers to MEMORIZE the verse. Pure composition over stores
 * the app already keeps — the check-in records to the device-only feelings log,
 * nothing new is synced.
 *
 * Reached from the Home study-tools card and the deep link
 * eternalbible://features/guided. 100% JS; verse text from SQLite.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import React, {useCallback, useState} from 'react';
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
import {useBackHandlerStep} from '@hooks/useBackHandlerStep';
import {haptics} from '@lib/haptics';
import {AppText} from '@components/ui/AppText';
import bibleDB from '@lib/database';
import {logger} from '@lib/utils/logger';
import {getBookByName} from '@/constants/bible';
import {
  getAllFeelings,
  feelingVerseRefForDay,
  type Feeling,
} from '@/features/study/feelings';
import {recordTodayFeeling} from '@/features/study/feelingsLogStore';
import {feelingsDateKey} from '@/features/study/feelingsLog';
import {parseThemeRef} from '@/features/study/themes';
import {
  borderRadius,
  fontSize as fontSizes,
  spacing,
  staticColors,
  verseTextRightSlack,
} from '@/styles/designTokens';

type Phase = 'choose' | 'resolving' | 'reveal' | 'error';

interface RevealVerse {
  feeling: Feeling;
  bookEn: string;
  bookDisplay: string;
  chapter: number;
  verse: number;
  text: string;
}

export default function GuidedDevotionScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {colors} = useTheme();
  const {t} = useLanguage();
  const {selectedVersion} = useBibleVersion();
  const tg = t.guided;
  const feelingNames = t.feelings.list as Record<string, {name: string}>;

  const [phase, setPhase] = useState<Phase>('choose');
  const [reveal, setReveal] = useState<RevealVerse | null>(null);
  const feelings = getAllFeelings();

  // Hardware back: retreat to the feeling picker from resolving/reveal/error,
  // matching the on-screen "elegir otro" reset; pop the route from 'choose'.
  useBackHandlerStep(() => {
    if (phase !== 'choose') {
      setPhase('choose');
      return true;
    }
    return false;
  });

  const chooseFeeling = useCallback(
    (feeling: Feeling) => {
      haptics.press();
      // The check-in itself: record today's feeling (device-only, never synced).
      void recordTodayFeeling(feeling.id);
      setReveal(null);
      setPhase('resolving');
      void (async () => {
        try {
          const todayKey = feelingsDateKey(Date.now());
          const ref = feelingVerseRefForDay(feeling, todayKey);
          const parsed = ref ? parseThemeRef(ref) : null;
          const book = parsed ? getBookByName(parsed.book) : null;
          if (!parsed || !book) {
            setPhase('error');
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
          if (!row?.text) {
            setPhase('error');
            return;
          }
          setReveal({
            feeling,
            bookEn: book.nameEn,
            bookDisplay:
              selectedVersion.language === 'es' ? book.name : book.nameEn,
            chapter: parsed.chapter,
            verse: parsed.verse,
            text: row.text,
          });
          setPhase('reveal');
        } catch (error) {
          logger.error('Guided devotion verse load failed', error as Error, {
            component: 'GuidedDevotionScreen',
            action: 'chooseFeeling',
          });
          setPhase('error');
        }
      })();
    },
    [selectedVersion.language, selectedVersion.id],
  );

  const beginMoment = useCallback(() => {
    if (!reveal) return;
    haptics.tap();
    router.push({
      pathname: '/features/lectio' as never,
      params: {
        book: reveal.bookEn,
        chapter: String(reveal.chapter),
        verse: String(reveal.verse),
      },
    } as never);
  }, [reveal, router]);

  const headerGradient: [string, string] = [colors.primaryDark, colors.primary];

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
            accessibilityLabel={tg.exitA11y}>
            <Ionicons name="close" size={24} color={staticColors.white} />
          </TouchableOpacity>
          <View style={styles.headerTextRow}>
            <View style={styles.headerIcon}>
              <Ionicons name="leaf" size={22} color={staticColors.white} />
            </View>
            <View style={styles.headerInfo}>
              <AppText scaleRole="compact" style={styles.headerLabel}>
                {tg.subtitle}
              </AppText>
              <AppText scaleRole="display" style={styles.headerTitle}>
                {tg.title}
              </AppText>
            </View>
          </View>
        </LinearGradient>

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}>
          {/* Step 1 — breathe + name your heart. */}
          {(phase === 'choose' || phase === 'resolving') && (
            <>
              <View
                style={[
                  styles.breatheCard,
                  {
                    backgroundColor: colors.primary + '12',
                    borderColor: colors.primary + '33',
                  },
                ]}>
                <Ionicons
                  name="heart-circle"
                  size={28}
                  color={colors.primary}
                />
                <AppText
                  scaleRole="body"
                  style={[styles.breatheText, {color: colors.text}]}>
                  {tg.breathePrompt}
                </AppText>
              </View>

              <View style={styles.feelingGrid}>
                {feelings.map(feeling => {
                  const name = feelingNames[feeling.id]?.name ?? feeling.id;
                  return (
                    <TouchableOpacity
                      key={feeling.id}
                      style={[
                        styles.feelingChip,
                        {
                          backgroundColor: feeling.accent + '16',
                          borderColor: feeling.accent + '50',
                        },
                      ]}
                      disabled={phase === 'resolving'}
                      onPress={() => chooseFeeling(feeling)}
                      accessibilityRole="button"
                      accessibilityLabel={name}>
                      <Ionicons
                        name={feeling.icon as keyof typeof Ionicons.glyphMap}
                        size={16}
                        color={feeling.accent}
                      />
                      <AppText
                        scaleRole="compact"
                        style={[styles.feelingChipText, {color: colors.text}]}>
                        {name}
                      </AppText>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {phase === 'resolving' && (
                <View style={styles.resolving}>
                  <ActivityIndicator color={colors.primary} />
                </View>
              )}
            </>
          )}

          {/* Step 2 — the verse for this feeling, today. */}
          {phase === 'reveal' && reveal && (
            <View style={styles.revealWrap}>
              <View style={styles.revealFeelingRow}>
                <View
                  style={[
                    styles.revealFeelingDot,
                    {backgroundColor: reveal.feeling.accent},
                  ]}>
                  <Ionicons
                    name={reveal.feeling.icon as keyof typeof Ionicons.glyphMap}
                    size={18}
                    color={staticColors.white}
                  />
                </View>
                <AppText
                  scaleRole="compact"
                  style={[styles.revealFeelingLabel, {color: colors.primary}]}>
                  {tg.revealLabel.replace(
                    '{{feeling}}',
                    feelingNames[reveal.feeling.id]?.name ?? reveal.feeling.id,
                  )}
                </AppText>
              </View>

              <View
                style={[
                  styles.verseCard,
                  {backgroundColor: colors.card, borderColor: colors.border},
                ]}>
                <AppText
                  scaleRole="compact"
                  style={[styles.verseRef, {color: colors.primary}]}>
                  {`${reveal.bookDisplay} ${reveal.chapter}:${reveal.verse}`} ·{' '}
                  {selectedVersion.abbreviation}
                </AppText>
                <AppText
                  scaleRole="body"
                  style={[styles.verseText, {color: colors.text}]}>
                  {reveal.text}
                </AppText>
              </View>

              <TouchableOpacity
                style={[styles.beginButton, {backgroundColor: colors.primary}]}
                onPress={beginMoment}
                accessibilityRole="button"
                accessibilityLabel={tg.begin}>
                <Ionicons name="flame" size={18} color={staticColors.white} />
                <AppText scaleRole="compact" style={styles.beginButtonText}>
                  {tg.begin}
                </AppText>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.againButton, {borderColor: colors.border}]}
                onPress={() => {
                  haptics.tap();
                  setReveal(null);
                  setPhase('choose');
                }}
                accessibilityRole="button"
                accessibilityLabel={tg.another}>
                <AppText
                  scaleRole="compact"
                  style={[
                    styles.againButtonText,
                    {color: colors.textSecondary},
                  ]}>
                  {tg.another}
                </AppText>
              </TouchableOpacity>
            </View>
          )}

          {phase === 'error' && (
            <View style={styles.centerState}>
              <Ionicons
                name="alert-circle-outline"
                size={40}
                color={colors.textTertiary}
              />
              <AppText
                style={[styles.stateText, {color: colors.textSecondary}]}>
                {tg.error}
              </AppText>
              <TouchableOpacity
                style={[styles.againButton, {borderColor: colors.border}]}
                onPress={() => {
                  haptics.tap();
                  setPhase('choose');
                }}
                accessibilityRole="button"
                accessibilityLabel={tg.another}>
                <AppText
                  scaleRole="compact"
                  style={[
                    styles.againButtonText,
                    {color: colors.textSecondary},
                  ]}>
                  {tg.another}
                </AppText>
              </TouchableOpacity>
            </View>
          )}
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
  backButton: {width: 40, height: 40, justifyContent: 'center'},
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
  breatheCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    padding: spacing.lg,
  },
  breatheText: {
    flex: 1,
    fontSize: fontSizes.md,
    lineHeight: fontSizes.md * 1.5,
    fontWeight: '600',
  },
  feelingGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  feelingChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
  },
  feelingChipText: {fontSize: fontSizes.sm, fontWeight: '600'},
  resolving: {paddingVertical: spacing.lg, alignItems: 'center'},
  revealWrap: {gap: spacing.md},
  revealFeelingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  revealFeelingDot: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
  },
  revealFeelingLabel: {
    flex: 1,
    fontSize: fontSizes.sm,
    fontWeight: '700',
  },
  verseCard: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  verseRef: {
    fontSize: fontSizes.sm,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  verseText: {
    fontSize: fontSizes.xl,
    lineHeight: fontSizes.xl * 1.6,
    // Right-edge anti-clip slack (Sprint 94).
    paddingRight: verseTextRightSlack(fontSizes.xl),
  },
  beginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
  },
  beginButtonText: {
    fontSize: fontSizes.md,
    fontWeight: '700',
    color: staticColors.white,
  },
  againButton: {
    alignSelf: 'center',
    borderWidth: 1,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  againButtonText: {fontSize: fontSizes.sm, fontWeight: '600'},
  centerState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing['2xl'],
    gap: spacing.md,
  },
  stateText: {
    fontSize: fontSizes.md,
    fontWeight: '700',
    textAlign: 'center',
  },
});
