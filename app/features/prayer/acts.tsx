/**
 * 🙏 GUIDED PRAYER — the ACTS path ("Oración guiada", Sprint 93)
 *
 * A calm, full-screen walk through the four historic movements of prayer —
 * Adoration → Confession → Thanksgiving → Supplication — one unhurried step at
 * a time. Each step frames the movement with a curated scripture anchor (chosen
 * deterministically by day, pure [[acts]]) and a gentle prompt, so the reader
 * prays in the light of the Word. The finale stamps today's prayer
 * (DEVICE-LOCAL [[prayerLog]] — never Firestore) and offers to save a request
 * into the journal.
 *
 * Reached from the prayer journal "Orar ahora", the Home prayer card, and the
 * deep link eternalbible://features/prayer/acts. Verse text from SQLite; 100%
 * JS, zero new native.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import {useEffect, useMemo, useState} from 'react';
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
import {parseThemeRef} from '@/features/study/themes';
import {
  buildActsSession,
  type ActsSessionStep,
  type ActsStartChoice,
} from '@/features/prayer/acts';
import {recordTodayPrayer} from '@/features/prayer/prayerLogStore';
import {
  borderRadius,
  fontSize as fontSizes,
  spacing,
  staticColors,
} from '@/styles/designTokens';

type LoadStatus = 'loading' | 'ready' | 'error';

interface ResolvedStep extends ActsSessionStep {
  reference: string;
  text: string | null;
}

export default function GuidedPrayerScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {colors, gradient, highContrast} = useTheme();
  const {t} = useLanguage();
  const {selectedVersion} = useBibleVersion();
  const ta = t.prayer.acts;

  // Capture the day once so the start choice (below) doesn't reroll anchors.
  const today = useMemo(() => new Date(), []);
  // Which movement the reader opens with (Adoration by default; a burdened
  // heart may begin Confessing — Luke 18:13). Chosen on the intro screen,
  // per session, so it tracks the heart of the day.
  const [startWith, setStartWith] = useState<ActsStartChoice>('adoration');
  const session = useMemo(
    () => buildActsSession(today, startWith),
    [today, startWith],
  );
  const [status, setStatus] = useState<LoadStatus>('loading');
  const [steps, setSteps] = useState<ResolvedStep[]>([]);
  // -1 = intro, 0..n-1 = a step, n = finished.
  const [phase, setPhase] = useState(-1);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        await bibleDB.initialize();
        const resolved = await Promise.all(
          session.map(async (s): Promise<ResolvedStep> => {
            const parsed = parseThemeRef(s.anchor);
            const book = parsed ? getBookByName(parsed.book) : undefined;
            if (!parsed || !book) {
              return {...s, reference: s.anchor, text: null};
            }
            const display =
              selectedVersion.language === 'es' ? book.name : book.nameEn;
            const row = await bibleDB.getVerse(
              book.id,
              parsed.chapter,
              parsed.verse,
              selectedVersion.id,
            );
            return {
              ...s,
              reference: `${display} ${parsed.chapter}:${parsed.verse}`,
              text: row?.text ?? null,
            };
          }),
        );
        if (cancelled) return;
        setSteps(resolved);
        setStatus('ready');
      } catch (error) {
        logger.error('Guided prayer load failed', error as Error, {
          component: 'GuidedPrayerScreen',
          action: 'load',
        });
        if (!cancelled) setStatus('error');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [session, selectedVersion.language, selectedVersion.id]);

  // Stamp today's prayer the moment the walk completes (device-local, once).
  useEffect(() => {
    if (status === 'ready' && phase === steps.length && steps.length > 0) {
      void recordTodayPrayer();
    }
  }, [status, phase, steps.length]);

  const accent =
    phase >= 0 && phase < steps.length
      ? steps[phase].meta.accent
      : colors.primary;
  const headerGradient: readonly [string, string, ...string[]] = highContrast
    ? (gradient.headerColors as readonly [string, string, ...string[]])
    : [colors.primary, colors.primaryDark];

  const advance = () => {
    haptics.tap();
    setPhase(p => p + 1);
  };

  // Hardware back: retreat one movement (the UI is forward-only, but back
  // should still step, not exit the whole prayer straight to the intro/Home).
  useBackHandlerStep(() => {
    if (phase > -1) {
      setPhase(p => p - 1);
      return true;
    }
    return false;
  });

  const stepCopy = (step: ActsSessionStep['step']) => ta[step];

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
            <Ionicons name="arrow-back" size={24} color={staticColors.white} />
          </TouchableOpacity>
          <View style={styles.headerTextRow}>
            <View style={styles.headerIcon}>
              <Ionicons name="sparkles" size={22} color={staticColors.white} />
            </View>
            <View style={styles.headerInfo}>
              <AppText scaleRole="compact" style={styles.headerLabel}>
                {ta.subtitle}
              </AppText>
              <AppText scaleRole="display" style={styles.headerTitle}>
                {ta.title}
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
              <AppText style={[styles.bodyText, {color: colors.textSecondary}]}>
                {ta.missingText}
              </AppText>
            </View>
          )}

          {status === 'ready' && phase === -1 && (
            <View style={styles.introBlock}>
              <Ionicons
                name="rose"
                size={48}
                color={colors.primary}
                style={styles.introIcon}
              />
              <AppText style={[styles.introText, {color: colors.text}]}>
                {ta.intro}
              </AppText>

              {/* How to draw near today — Adoration leads by default (the
                  Lord's Prayer, Isaiah 6), but a burdened heart may begin by
                  confessing (Luke 18:13; Psalm 51). Per-session, not a buried
                  setting, so it follows the heart of the moment. */}
              <View style={styles.startChoiceWrap}>
                <AppText
                  scaleRole="compact"
                  style={[styles.startQuestion, {color: colors.textSecondary}]}>
                  {ta.startQuestion}
                </AppText>
                <View style={styles.startChoiceRow}>
                  {(['adoration', 'confession'] as const).map(choice => {
                    const active = startWith === choice;
                    const label =
                      choice === 'adoration'
                        ? ta.startAdoring
                        : ta.startConfessing;
                    return (
                      <TouchableOpacity
                        key={choice}
                        style={[
                          styles.startChip,
                          {
                            backgroundColor: active
                              ? colors.primary + '22'
                              : colors.card,
                            borderColor: active
                              ? colors.primary
                              : colors.border,
                          },
                        ]}
                        onPress={() => {
                          haptics.tap();
                          setStartWith(choice);
                        }}
                        accessibilityRole="radio"
                        accessibilityState={{selected: active}}
                        accessibilityLabel={label}>
                        <Ionicons
                          name={choice === 'adoration' ? 'sparkles' : 'water'}
                          size={16}
                          color={active ? colors.primary : colors.textSecondary}
                        />
                        <AppText
                          scaleRole="compact"
                          style={[
                            styles.startChipText,
                            {
                              color: active
                                ? colors.primary
                                : colors.textSecondary,
                            },
                          ]}>
                          {label}
                        </AppText>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              <TouchableOpacity
                style={[styles.primaryBtn, {backgroundColor: colors.primary}]}
                onPress={advance}
                accessibilityRole="button"
                accessibilityLabel={ta.begin}>
                <AppText
                  style={[styles.primaryBtnText, {color: colors.onPrimary}]}>
                  {ta.begin}
                </AppText>
              </TouchableOpacity>
            </View>
          )}

          {status === 'ready' &&
            phase >= 0 &&
            phase < steps.length &&
            (() => {
              const s = steps[phase];
              const copy = stepCopy(s.step);
              const isLast = phase === steps.length - 1;
              return (
                <View style={styles.stepBlock}>
                  <AppText
                    scaleRole="compact"
                    style={[styles.stepCount, {color: colors.textTertiary}]}>
                    {ta.stepOf
                      .replace('{{n}}', String(phase + 1))
                      .replace('{{total}}', String(steps.length))}
                  </AppText>
                  <View style={styles.stepNameRow}>
                    <View
                      style={[
                        styles.stepIcon,
                        {backgroundColor: accent + '22'},
                      ]}>
                      <Ionicons
                        name={s.meta.icon as never}
                        size={22}
                        color={accent}
                      />
                    </View>
                    <AppText
                      scaleRole="display"
                      style={[styles.stepName, {color: colors.text}]}>
                      {copy.name}
                    </AppText>
                  </View>

                  <View
                    style={[
                      styles.verseCard,
                      {
                        backgroundColor: colors.card,
                        borderColor: accent + '40',
                      },
                    ]}>
                    <AppText
                      scaleRole="compact"
                      style={[styles.verseRef, {color: accent}]}>
                      {s.reference}
                    </AppText>
                    <AppText style={[styles.verseText, {color: colors.text}]}>
                      {s.text ?? ta.missingText}
                    </AppText>
                  </View>

                  <AppText
                    style={[styles.promptText, {color: colors.textSecondary}]}>
                    {copy.prompt}
                  </AppText>

                  <TouchableOpacity
                    style={[styles.primaryBtn, {backgroundColor: accent}]}
                    onPress={advance}
                    accessibilityRole="button"
                    accessibilityLabel={isLast ? ta.finish : ta.next}>
                    <AppText
                      style={[
                        styles.primaryBtnText,
                        {color: staticColors.white},
                      ]}>
                      {isLast ? ta.finish : ta.next}
                    </AppText>
                    <Ionicons
                      name={isLast ? 'checkmark' : 'arrow-forward'}
                      size={18}
                      color={staticColors.white}
                    />
                  </TouchableOpacity>
                </View>
              );
            })()}

          {status === 'ready' && phase >= steps.length && steps.length > 0 && (
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
                {ta.finishedTitle}
              </AppText>
              <AppText
                style={[styles.introText, {color: colors.textSecondary}]}>
                {ta.finishedBody}
              </AppText>
              <TouchableOpacity
                style={[styles.primaryBtn, {backgroundColor: colors.primary}]}
                onPress={() => {
                  haptics.tap();
                  router.replace('/features/prayer?openAdd=1' as never);
                }}
                accessibilityRole="button"
                accessibilityLabel={ta.addToJournal}>
                <Ionicons name="add" size={18} color={colors.onPrimary} />
                <AppText
                  style={[styles.primaryBtnText, {color: colors.onPrimary}]}>
                  {ta.addToJournal}
                </AppText>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.secondaryBtn}
                onPress={() => {
                  haptics.tap();
                  router.back();
                }}
                accessibilityRole="button"
                accessibilityLabel={ta.done}>
                <AppText
                  style={[
                    styles.secondaryBtnText,
                    {color: colors.textSecondary},
                  ]}>
                  {ta.done}
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
  content: {padding: spacing.lg, gap: spacing.lg},
  centerState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing['2xl'],
    gap: spacing.sm,
  },
  bodyText: {fontSize: fontSizes.md, textAlign: 'center'},
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
  startChoiceWrap: {
    alignSelf: 'stretch',
    gap: spacing.sm,
    alignItems: 'center',
  },
  startQuestion: {
    fontSize: fontSizes.sm,
    fontWeight: '600',
    textAlign: 'center',
  },
  startChoiceRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignSelf: 'stretch',
  },
  startChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
  },
  startChipText: {fontSize: fontSizes.md, fontWeight: '700'},
  finishedTitle: {fontSize: fontSizes['2xl'], fontWeight: '800'},
  stepBlock: {gap: spacing.lg},
  stepCount: {
    fontSize: fontSizes.sm,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  stepNameRow: {flexDirection: 'row', alignItems: 'center', gap: spacing.md},
  stepIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepName: {fontSize: fontSizes['2xl'], fontWeight: '800'},
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
    letterSpacing: 0.5,
  },
  verseText: {fontSize: fontSizes.lg, lineHeight: fontSizes.lg * 1.6},
  promptText: {fontSize: fontSizes.md, lineHeight: fontSizes.md * 1.6},
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
  secondaryBtn: {paddingVertical: spacing.sm, paddingHorizontal: spacing.lg},
  secondaryBtnText: {fontSize: fontSizes.md, fontWeight: '600'},
});
