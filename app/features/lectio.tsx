/**
 * 🕯️ LECTIO DIVINA — guided praying of one verse (Sprint 79)
 *
 * The ancient four-movement path through a passage, as a calm full-screen
 * journey: LEE (the verse, large and unhurried, with a listen button) →
 * MEDITA (a deterministic-by-day prompt from [[lectio]]) → ORA (write your
 * prayer; on finish it is APPENDED to the verse's note and synced like any
 * note) → CONTEMPLA (a quiet 1–3 minute timer, plain text, RM-safe). The
 * finale offers the existing share-as-image pipeline.
 *
 * Reached from the Home study-tools card (daily verse) and the reader
 * selection-bar overflow (first selected verse); deep link
 * eternalbible://features/lectio?book=Salmos&chapter=23&verse=1.
 * 100% JS: verse text from SQLite, notes via the existing store + sync queue.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import {Stack, useLocalSearchParams, useRouter} from 'expo-router';
import {Ionicons} from '@expo/vector-icons';
import {LinearGradient} from 'expo-linear-gradient';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTheme} from '@hooks/useTheme';
import {centeredMaxWidth} from '@/styles/responsive';
import {useLanguage} from '@hooks/useLanguage';
import {useToast} from '@context/ToastContext';
import {useServices} from '@context/ServicesContext';
import {useBibleVersion} from '@hooks/useBibleVersion';
import {useMemoryDeck} from '@context/MemoryDeckContext';
import {buildVerseKey} from '@lib/memory/srs';
import {haptics} from '@lib/haptics';
import {AppText} from '@components/ui/AppText';
import bibleDB from '@lib/database';
import {logger} from '@lib/utils/logger';
import {getSyncEngine} from '@lib/sync';
import {buildNoteRemotePayload} from '@lib/sync/adapters/notes';
import {getBookByName, canonicalBookName} from '@/constants/bible';
import {recordTodayDevotion} from '@/features/study/devotionLogStore';
import {useAudioPlayer} from '@/features/audio';
import {ImageShareModal} from '@components/reading/ImageShareModal';
import {
  LECTIO_STEPS,
  CONTEMPLATION_OPTIONS_SEC,
  meditationPromptIndex,
  formatCountdown,
  buildLectioPrayerBlock,
  composeNoteWithPrayer,
} from '@/features/study/lectio';
import {
  borderRadius,
  fontSize as fontSizes,
  spacing,
  staticColors,
  verseTextRightSlack,
} from '@/styles/designTokens';

type LoadStatus = 'loading' | 'ready' | 'error';

export default function LectioScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {colors} = useTheme();
  const {t, language} = useLanguage();
  const toast = useToast();
  const {achievementService, notifyAchievements} = useServices();
  const {selectedVersion} = useBibleVersion();
  const {addCard, hasCard} = useMemoryDeck();
  const {loadChapter, play} = useAudioPlayer();
  const {width: windowWidth} = useWindowDimensions();
  const tl = t.lectio;

  const params = useLocalSearchParams<{
    book?: string;
    chapter?: string;
    verse?: string;
  }>();
  const bookInfo = useMemo(
    () => getBookByName(params.book ?? ''),
    [params.book],
  );
  const chapterNum = Number(params.chapter);
  const verseNum = Number(params.verse);
  const paramsValid =
    !!bookInfo &&
    Number.isInteger(chapterNum) &&
    chapterNum >= 1 &&
    Number.isInteger(verseNum) &&
    verseNum >= 1;

  const bookDisplay = bookInfo
    ? language === 'en'
      ? bookInfo.nameEn
      : bookInfo.name
    : (params.book ?? '');
  const reference = paramsValid
    ? `${bookDisplay} ${chapterNum}:${verseNum}`
    : '';

  const [status, setStatus] = useState<LoadStatus>('loading');
  const [verseText, setVerseText] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      if (!paramsValid || !bookInfo) {
        setStatus('error');
        return;
      }
      try {
        await bibleDB.initialize();
        const row = await bibleDB.getVerse(
          bookInfo.id,
          chapterNum,
          verseNum,
          selectedVersion.id,
        );
        if (cancelled) return;
        if (!row?.text) {
          setStatus('error');
          return;
        }
        setVerseText(row.text);
        setStatus('ready');
      } catch (error) {
        logger.error('Lectio passage load failed', error as Error, {
          component: 'LectioScreen',
          action: 'load',
        });
        if (!cancelled) setStatus('error');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [paramsValid, bookInfo, chapterNum, verseNum, selectedVersion.id]);

  // ---- journey state ----
  const [stepIndex, setStepIndex] = useState(0);
  const [finished, setFinished] = useState(false);
  const [prayer, setPrayer] = useState('');
  const [shareVisible, setShareVisible] = useState(false);
  const step = LECTIO_STEPS[stepIndex];

  // Stamp the day's "Momento con Dios" the moment the journey closes (Sprint
  // 84). `finished` only ever flips false→true (handleFinish, both the saved-
  // prayer and the error path), so this records exactly once per completion.
  // DEVICE-LOCAL — recordTodayDevotion writes only the @devotion_log; unlike
  // the prayer-as-note or the Memorize button, it never touches Firestore.
  useEffect(() => {
    if (finished) void recordTodayDevotion();
  }, [finished]);

  // Deterministic meditation prompt: same passage + same local day = same
  // question; a new day rotates it.
  const prompt = useMemo(() => {
    const now = new Date();
    const dateKey = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
    const idx = meditationPromptIndex(
      `${bookInfo?.nameEn ?? ''}:${chapterNum}:${verseNum}`,
      dateKey,
      tl.meditationPrompts.length,
    );
    return tl.meditationPrompts[idx];
  }, [bookInfo, chapterNum, verseNum, tl.meditationPrompts]);

  // ---- contemplation timer (plain text, RM-safe by construction) ----
  const [timerTotal, setTimerTotal] = useState<number>(
    CONTEMPLATION_OPTIONS_SEC[0],
  );
  const [remaining, setRemaining] = useState<number>(
    CONTEMPLATION_OPTIONS_SEC[0],
  );
  const [running, setRunning] = useState(false);
  useEffect(() => {
    if (!running) return;
    const interval = setInterval(() => {
      setRemaining(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          setRunning(false);
          haptics.success();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [running]);

  const pickDuration = (seconds: number) => {
    haptics.tap();
    setRunning(false);
    setTimerTotal(seconds);
    setRemaining(seconds);
  };

  // 🎧 Hear the verse: a one-verse playlist (the ∞ advancer never rolls on).
  const handleListen = useCallback(() => {
    if (!verseText || !params.book) return;
    haptics.tap();
    loadChapter(
      [
        {
          book: params.book,
          chapter: chapterNum,
          verse: verseNum,
          text: verseText,
        },
      ],
      {mode: 'playlist', label: tl.title},
    );
    setTimeout(() => play(), 150);
  }, [verseText, params.book, chapterNum, verseNum, loadChapter, play, tl]);

  // Memorize the verse (Sprint 83): the finale's closing step of the guided
  // arc. Adds it to the SRS deck (de-duped by verse key — a no-op if already
  // there, so we toast "already in your deck" instead of silently doing
  // nothing). bookName/version match the favorites add path.
  const handleMemorize = useCallback(() => {
    if (!verseText || !paramsValid) return;
    haptics.tap();
    const key = buildVerseKey(bookDisplay, chapterNum, verseNum);
    if (hasCard(key)) {
      toast.info(tl.memorizedAlready);
      return;
    }
    addCard({
      bookName: bookDisplay,
      chapter: chapterNum,
      verse: verseNum,
      text: verseText,
      version: selectedVersion.id,
    });
    toast.success(tl.memorized);
  }, [
    verseText,
    paramsValid,
    bookDisplay,
    chapterNum,
    verseNum,
    hasCard,
    addCard,
    selectedVersion.id,
    toast,
    tl.memorized,
    tl.memorizedAlready,
  ]);

  // Finish: append the prayer (if any) to the verse's note + sync, then show
  // the finale.
  const savingRef = useRef(false);
  const handleFinish = useCallback(async () => {
    if (savingRef.current) return;
    savingRef.current = true;
    try {
      const trimmed = prayer.trim();
      if (trimmed && bookInfo && verseText) {
        const canonical = canonicalBookName(bookDisplay);
        const dateLabel = new Date().toLocaleDateString(
          language === 'en' ? 'en-US' : 'es-ES',
          {year: 'numeric', month: 'long', day: 'numeric'},
        );
        const block = buildLectioPrayerBlock(trimmed, dateLabel, tl.title);
        const existing = await bibleDB.getNoteForVerse(
          canonical,
          chapterNum,
          verseNum,
        );
        let savedId: string;
        let savedNote;
        if (existing) {
          const composed = composeNoteWithPrayer(existing.note, block);
          await bibleDB.updateNote(existing.id, composed);
          savedId = existing.id;
          savedNote = {
            ...existing,
            note: composed,
            updatedAt: new Date().toISOString(),
          };
        } else {
          const now = new Date().toISOString();
          const noteToAdd = {
            book: canonical,
            chapter: chapterNum,
            verse: verseNum,
            text: verseText,
            note: block,
            createdAt: now,
            updatedAt: now,
          };
          savedId = await bibleDB.addNote(noteToAdd);
          savedNote = {id: savedId, ...noteToAdd};
          // A lectio prayer that creates a NEW note counts toward the note
          // achievements like any other note (Sprint 81).
          achievementService
            ?.trackNote()
            .then(notifyAchievements)
            .catch(() => undefined);
        }
        getSyncEngine()?.queueWrite(
          'notes',
          savedId,
          buildNoteRemotePayload(savedNote),
        );
        logger.info('Lectio prayer saved to note', {reference});
        toast.success(tl.prayerSaved);
      }
      haptics.success();
      setFinished(true);
    } catch (error) {
      logger.error('Lectio prayer save failed', error as Error, {
        component: 'LectioScreen',
        action: 'handleFinish',
      });
      // Still close the journey honestly — the prayer stays on screen.
      setFinished(true);
    } finally {
      savingRef.current = false;
    }
  }, [
    prayer,
    bookInfo,
    verseText,
    bookDisplay,
    chapterNum,
    verseNum,
    language,
    reference,
    toast,
    tl.prayerSaved,
    tl.title,
    achievementService,
    notifyAchievements,
  ]);

  const goNext = () => {
    haptics.tap();
    if (stepIndex < LECTIO_STEPS.length - 1) setStepIndex(stepIndex + 1);
  };
  const goBack = () => {
    haptics.tap();
    if (stepIndex > 0) setStepIndex(stepIndex - 1);
  };

  const headerGradient: [string, string] = [colors.primaryDark, colors.primary];

  function renderStepDots() {
    return (
      <View style={styles.dotsRow}>
        {LECTIO_STEPS.map((s, i) => (
          <View key={s} style={styles.dotWrap}>
            <View
              style={[
                styles.dot,
                {
                  backgroundColor:
                    i <= stepIndex ? colors.primary : colors.border,
                },
              ]}
            />
            <AppText
              scaleRole="compact"
              style={[
                styles.dotLabel,
                i === stepIndex ? styles.dotLabelActive : styles.dotLabelIdle,
                {
                  color: i === stepIndex ? colors.primary : colors.textTertiary,
                },
              ]}>
              {tl.stepLabels[s]}
            </AppText>
          </View>
        ))}
      </View>
    );
  }

  function renderVerseCard(compact: boolean) {
    return (
      <View
        style={[
          styles.verseCard,
          {backgroundColor: colors.card, borderColor: colors.border},
        ]}>
        <AppText
          scaleRole="compact"
          style={[styles.verseRef, {color: colors.primary}]}>
          {reference} · {selectedVersion.abbreviation}
        </AppText>
        <AppText
          scaleRole="body"
          style={[
            compact ? styles.verseTextCompact : styles.verseTextLarge,
            {color: colors.text},
          ]}>
          {verseText}
        </AppText>
      </View>
    );
  }

  function renderStep() {
    switch (step) {
      case 'lectio':
        return (
          <>
            {renderVerseCard(false)}
            <TouchableOpacity
              style={[styles.listenButton, {borderColor: colors.primary}]}
              onPress={handleListen}
              accessibilityRole="button"
              accessibilityLabel={tl.listen}>
              <Ionicons name="headset" size={16} color={colors.primary} />
              <AppText
                scaleRole="compact"
                style={[styles.listenText, {color: colors.primary}]}>
                {tl.listen}
              </AppText>
            </TouchableOpacity>
          </>
        );
      case 'meditatio':
        return (
          <>
            {renderVerseCard(true)}
            <View
              style={[
                styles.promptCard,
                {
                  backgroundColor: colors.primary + '12',
                  borderColor: colors.primary + '40',
                },
              ]}>
              <Ionicons name="leaf" size={18} color={colors.primary} />
              <AppText
                scaleRole="body"
                style={[styles.promptText, {color: colors.text}]}>
                {prompt}
              </AppText>
            </View>
          </>
        );
      case 'oratio':
        return (
          <>
            {renderVerseCard(true)}
            <TextInput
              style={[
                styles.prayerInput,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  color: colors.text,
                },
              ]}
              placeholder={tl.prayerPlaceholder}
              placeholderTextColor={colors.textTertiary}
              multiline
              textAlignVertical="top"
              value={prayer}
              onChangeText={setPrayer}
              accessibilityLabel={tl.prayerPlaceholder}
            />
            <AppText
              scaleRole="compact"
              style={[styles.prayerHint, {color: colors.textTertiary}]}>
              {tl.prayerHint}
            </AppText>
          </>
        );
      case 'contemplatio':
        return (
          <>
            <View style={styles.timerOptions}>
              {CONTEMPLATION_OPTIONS_SEC.map(seconds => (
                <TouchableOpacity
                  key={seconds}
                  style={[
                    styles.timerOption,
                    {
                      borderColor:
                        timerTotal === seconds ? colors.primary : colors.border,
                      backgroundColor:
                        timerTotal === seconds
                          ? colors.primary + '18'
                          : staticColors.transparent,
                    },
                  ]}
                  onPress={() => pickDuration(seconds)}
                  accessibilityRole="button"
                  accessibilityState={{selected: timerTotal === seconds}}
                  accessibilityLabel={tl.minutesOption.replace(
                    '{{n}}',
                    String(seconds / 60),
                  )}>
                  <AppText
                    scaleRole="compact"
                    style={[
                      styles.timerOptionText,
                      {
                        color:
                          timerTotal === seconds
                            ? colors.primary
                            : colors.textSecondary,
                      },
                    ]}>
                    {tl.minutesOption.replace('{{n}}', String(seconds / 60))}
                  </AppText>
                </TouchableOpacity>
              ))}
            </View>
            <AppText
              scaleRole="display"
              style={[styles.countdown, {color: colors.text}]}
              accessibilityLiveRegion="polite">
              {formatCountdown(remaining)}
            </AppText>
            {remaining === 0 ? (
              <AppText
                scaleRole="compact"
                style={[styles.timerDone, {color: colors.textSecondary}]}>
                {tl.timerDone}
              </AppText>
            ) : (
              <TouchableOpacity
                style={[styles.timerButton, {backgroundColor: colors.primary}]}
                onPress={() => {
                  haptics.tap();
                  setRunning(r => !r);
                }}
                accessibilityRole="button"
                accessibilityLabel={running ? tl.timerPause : tl.timerStart}>
                <Ionicons
                  name={running ? 'pause' : 'play'}
                  size={16}
                  color={staticColors.white}
                />
                <AppText scaleRole="compact" style={styles.timerButtonText}>
                  {running ? tl.timerPause : tl.timerStart}
                </AppText>
              </TouchableOpacity>
            )}
          </>
        );
    }
  }

  function renderFinale() {
    return (
      <View style={styles.finale}>
        <Ionicons name="rose" size={44} color={colors.primary} />
        <AppText
          scaleRole="display"
          style={[styles.finaleTitle, {color: colors.text}]}>
          {tl.finishedTitle}
        </AppText>
        <AppText
          scaleRole="body"
          style={[styles.finaleMessage, {color: colors.textSecondary}]}>
          {tl.finishedMessage}
        </AppText>
        {renderVerseCard(true)}
        <TouchableOpacity
          style={[styles.finaleAction, {backgroundColor: colors.primary}]}
          onPress={() => {
            haptics.tap();
            setShareVisible(true);
          }}
          accessibilityRole="button"
          accessibilityLabel={tl.shareImage}>
          <Ionicons name="image-outline" size={16} color={staticColors.white} />
          <AppText scaleRole="compact" style={styles.finaleActionText}>
            {tl.shareImage}
          </AppText>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.finaleSecondary, {borderColor: colors.primary}]}
          onPress={handleMemorize}
          accessibilityRole="button"
          accessibilityLabel={tl.memorize}>
          <Ionicons name="bulb-outline" size={16} color={colors.primary} />
          <AppText
            scaleRole="compact"
            style={[styles.finaleSecondaryText, {color: colors.primary}]}>
            {tl.memorize}
          </AppText>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.finaleGhost, {borderColor: colors.border}]}
          onPress={() => {
            haptics.tap();
            router.back();
          }}
          accessibilityRole="button"
          accessibilityLabel={tl.done}>
          <AppText
            scaleRole="compact"
            style={[styles.finaleGhostText, {color: colors.textSecondary}]}>
            {tl.done}
          </AppText>
        </TouchableOpacity>
      </View>
    );
  }

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
            accessibilityLabel={tl.exitA11y}>
            <Ionicons name="close" size={24} color={staticColors.white} />
          </TouchableOpacity>
          <View style={styles.headerTextRow}>
            <View style={styles.headerIcon}>
              <Ionicons name="flame" size={22} color={staticColors.white} />
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
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
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

          {status === 'ready' && finished && renderFinale()}

          {status === 'ready' && !finished && (
            <>
              {renderStepDots()}
              <AppText
                scaleRole="body"
                style={[styles.stepIntro, {color: colors.textSecondary}]}>
                {tl.stepIntros[step]}
              </AppText>
              {renderStep()}
              <View style={styles.navRow}>
                {stepIndex > 0 ? (
                  <TouchableOpacity
                    style={[styles.navGhost, {borderColor: colors.border}]}
                    onPress={goBack}
                    accessibilityRole="button"
                    accessibilityLabel={tl.back}>
                    <AppText
                      scaleRole="compact"
                      style={[
                        styles.navGhostText,
                        {color: colors.textSecondary},
                      ]}>
                      {tl.back}
                    </AppText>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.navSpacer} />
                )}
                {stepIndex < LECTIO_STEPS.length - 1 ? (
                  <TouchableOpacity
                    style={[
                      styles.navPrimary,
                      {backgroundColor: colors.primary},
                    ]}
                    onPress={goNext}
                    accessibilityRole="button"
                    accessibilityLabel={tl.next}>
                    <AppText scaleRole="compact" style={styles.navPrimaryText}>
                      {tl.next}
                    </AppText>
                    <Ionicons
                      name="arrow-forward"
                      size={16}
                      color={staticColors.white}
                    />
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={[
                      styles.navPrimary,
                      {backgroundColor: colors.primary},
                    ]}
                    onPress={() => void handleFinish()}
                    accessibilityRole="button"
                    accessibilityLabel={tl.finish}>
                    <AppText scaleRole="compact" style={styles.navPrimaryText}>
                      {tl.finish}
                    </AppText>
                    <Ionicons
                      name="checkmark"
                      size={16}
                      color={staticColors.white}
                    />
                  </TouchableOpacity>
                )}
              </View>
            </>
          )}
        </ScrollView>

        <ImageShareModal
          visible={shareVisible}
          verseText={verseText ?? ''}
          verseReference={reference}
          versionAbbr={selectedVersion.abbreviation}
          verseCount={1}
          hasSelection={!!verseText}
          cardSize={windowWidth - spacing.xl * 2}
          onClose={() => setShareVisible(false)}
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
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
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
  content: {
    padding: spacing.lg,
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
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xs,
  },
  dotWrap: {alignItems: 'center', gap: 4, flex: 1},
  dot: {width: 10, height: 10, borderRadius: 5},
  dotLabel: {fontSize: fontSizes.xs},
  dotLabelActive: {fontWeight: '700'},
  dotLabelIdle: {fontWeight: '500'},
  stepIntro: {
    fontSize: fontSizes.md,
    lineHeight: fontSizes.md * 1.5,
    fontStyle: 'italic',
    textAlign: 'center',
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
  verseTextLarge: {
    fontSize: fontSizes.xl,
    lineHeight: fontSizes.xl * 1.6,
    // Right-edge anti-clip slack (Sprint 94).
    paddingRight: verseTextRightSlack(fontSizes.xl),
  },
  verseTextCompact: {
    fontSize: fontSizes.md,
    lineHeight: fontSizes.md * 1.55,
    paddingRight: verseTextRightSlack(fontSizes.md),
  },
  listenButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    alignSelf: 'center',
    borderWidth: 1.5,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  listenText: {fontSize: fontSizes.sm, fontWeight: '700'},
  promptCard: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'flex-start',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    padding: spacing.md,
  },
  promptText: {
    flex: 1,
    fontSize: fontSizes.md,
    lineHeight: fontSizes.md * 1.5,
  },
  prayerInput: {
    minHeight: 140,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    padding: spacing.md,
    fontSize: fontSizes.md,
    lineHeight: fontSizes.md * 1.4,
  },
  prayerHint: {fontSize: fontSizes.xs, textAlign: 'center'},
  timerOptions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  timerOption: {
    borderWidth: 1.5,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  timerOptionText: {fontSize: fontSizes.sm, fontWeight: '700'},
  countdown: {
    fontSize: 56,
    fontWeight: '200',
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
    marginVertical: spacing.md,
  },
  timerDone: {
    fontSize: fontSizes.sm,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  timerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    alignSelf: 'center',
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  timerButtonText: {
    fontSize: fontSizes.sm,
    fontWeight: '700',
    color: staticColors.white,
  },
  navRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  navSpacer: {width: 1},
  navGhost: {
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  navGhostText: {fontSize: fontSizes.sm, fontWeight: '600'},
  navPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  navPrimaryText: {
    fontSize: fontSizes.sm,
    fontWeight: '700',
    color: staticColors.white,
  },
  finale: {alignItems: 'center', gap: spacing.md, paddingTop: spacing.lg},
  finaleTitle: {fontSize: fontSizes['2xl'], fontWeight: '800'},
  finaleMessage: {
    fontSize: fontSizes.md,
    textAlign: 'center',
    lineHeight: fontSizes.md * 1.5,
  },
  finaleAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  finaleActionText: {
    fontSize: fontSizes.sm,
    fontWeight: '700',
    color: staticColors.white,
  },
  finaleSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderWidth: 1.5,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  finaleSecondaryText: {
    fontSize: fontSizes.sm,
    fontWeight: '700',
  },
  finaleGhost: {
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  finaleGhostText: {fontSize: fontSizes.sm, fontWeight: '600'},
});
