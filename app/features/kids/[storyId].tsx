/**
 * 🧒 KIDS STORY — one Bible story for kids: scenes → a 3-question quiz →
 * "Para enseñar" (Item 4, Tanda 1 of the kids/family mode).
 *
 * A simple state machine (`scenes` → `quiz` → `done`) walks one scene at a
 * time: a $0 SVG+emoji illustration ([[KidsSceneCanvas]]), an adapted
 * paragraph, an optional "Escuchar" read-aloud (expo-speech, mirroring the
 * narrated-walkthrough pattern from journeys/prophecies but for a single
 * scene — no auto-advance chain, since a young reader sets their own pace),
 * and a collapsible "Ver el versículo" that resolves the scene's real verse
 * text from SQLite. After the last scene, [[KidsQuizPanel]] asks 3
 * fact-based questions; on finish, the "done" stage shows the score,
 * unlocks the kids SPECIAL achievements when earned, and offers a
 * collapsible "Para enseñar" panel (context + open discussion questions —
 * no prescribed wording, same theological care as [[scripturePrayers]]).
 *
 * Reached from the kids hub `/features/kids`.
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
  useWindowDimensions,
} from 'react-native';
import {Stack, useRouter, useLocalSearchParams} from 'expo-router';
import {Ionicons} from '@expo/vector-icons';
import {LinearGradient} from 'expo-linear-gradient';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTheme} from '@hooks/useTheme';
import {centeredMaxWidth} from '@/styles/responsive';
import {useLanguage} from '@hooks/useLanguage';
import {useBibleVersion} from '@hooks/useBibleVersion';
import {useServices} from '@context/ServicesContext';
import {useNarratedWalkthrough} from '@hooks/useNarratedWalkthrough';
import {resolveSpeechLanguage} from '@/lib/speech/narration';
import {haptics} from '@lib/haptics';
import {AppText} from '@components/ui/AppText';
import bibleDB from '@lib/database';
import {getBookByName} from '@/constants/bible';
import {parseChristRef} from '@/features/study/christConnections';
import {KidsSceneCanvas} from '@components/kids/KidsSceneCanvas';
import {KidsQuizPanel} from '@components/kids/KidsQuizPanel';
import {
  KIDS_STORIES,
  KIDS_STORY_PALETTE,
  getKidsStory,
} from '@/features/kids/kidsStories';
import {
  markKidsSceneSeen,
  recordKidsQuizScore,
  markKidsStoryCompleted,
} from '@/features/kids/kidsProgress';
import {
  borderRadius,
  fontSize as fontSizes,
  spacing,
  staticColors,
} from '@/styles/designTokens';

type Stage = 'scenes' | 'quiz' | 'done';

interface KidsStoryText {
  title: string;
  subtitle: string;
  refLabel: string;
  teachContext: string;
  teachQuestions: string[];
  scenes: Record<string, {text: string}>;
}

export default function KidsStoryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {width} = useWindowDimensions();
  const {colors} = useTheme();
  const {t, language} = useLanguage();
  const {selectedVersion} = useBibleVersion();
  const {achievementService, notifyAchievements} = useServices();
  const tk = t.kids;

  const params = useLocalSearchParams<{storyId?: string}>();
  const story = getKidsStory(params.storyId ?? '') ?? KIDS_STORIES[0];
  const storyId = story.id;
  const accent = KIDS_STORY_PALETTE[storyId].accent;
  const storyText = (tk.stories as Record<string, KidsStoryText>)[storyId];

  const [stage, setStage] = useState<Stage>('scenes');
  const [sceneIndex, setSceneIndex] = useState(0);
  const [showVerse, setShowVerse] = useState(false);
  const [verseText, setVerseText] = useState<string | null | undefined>(
    undefined,
  );
  const [quizScore, setQuizScore] = useState(0);
  const [teachOpen, setTeachOpen] = useState(false);

  const scene = story.scenes[sceneIndex];
  const sceneText = storyText?.scenes?.[scene.id]?.text ?? '';
  const isLastScene = sceneIndex === story.scenes.length - 1;

  useEffect(() => {
    void markKidsSceneSeen(storyId, sceneIndex);
  }, [storyId, sceneIndex]);

  useEffect(() => {
    setShowVerse(false);
    setVerseText(undefined);
  }, [sceneIndex, storyId]);

  // "Escuchar" (single scene) + "Leer juntos" (auto-advancing tour) — both
  // powered by the shared narration engine ([[useNarratedWalkthrough]],
  // Tanda 3). Scene text is already in memory (no DB fetch), so `segments`
  // is always ready. Reaching the last scene stops the tour without opening
  // the quiz automatically — "Comenzar el reto" stays a deliberate tap.
  const segments = useMemo(() => (sceneText ? [sceneText] : []), [sceneText]);
  const {
    speaking,
    walkthroughActive,
    toggle: toggleReadTogetherTour,
    speakOnce,
    stop: stopReadAloud,
  } = useNarratedWalkthrough({
    total: story.scenes.length,
    index: sceneIndex,
    setIndex: setSceneIndex,
    segments,
    getLanguage: () => resolveSpeechLanguage(language),
    rate: 0.9,
  });

  const canvasW = Math.min(width - spacing.lg * 2, 480);
  const headerGradient: [string, string] = [accent, colors.primaryDark];

  // A deep link straight into this screen leaves no back-stack entry, so
  // router.back() would throw a "GO_BACK not handled" navigation error.
  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/features/kids' as never);
  };

  const toggleListen = () => {
    haptics.tap();
    speakOnce();
  };

  const toggleReadTogether = () => {
    haptics.tap();
    toggleReadTogetherTour();
  };

  const toggleVerse = () => {
    haptics.tap();
    if (showVerse) {
      setShowVerse(false);
      return;
    }
    setShowVerse(true);
    if (verseText !== undefined) return;
    const parsed = parseChristRef(scene.refs[0]);
    const book = parsed ? getBookByName(parsed.book) : null;
    if (!parsed || !book) {
      setVerseText(null);
      return;
    }
    void (async () => {
      try {
        await bibleDB.initialize();
        const row = await bibleDB
          .getVerse(book.id, parsed.chapter, parsed.verse, selectedVersion.id)
          .catch(() => null);
        setVerseText(row?.text ?? null);
      } catch {
        setVerseText(null);
      }
    })();
  };

  const nextScene = () => {
    haptics.tap();
    if (isLastScene) {
      // sceneIndex doesn't change here, so the hook's own manual-nav effect
      // won't fire to stop an in-progress tour/one-shot narration — stop
      // explicitly before leaving the scenes stage.
      stopReadAloud();
      setStage('quiz');
      return;
    }
    setSceneIndex(i => i + 1);
  };

  const prevScene = () => {
    haptics.tap();
    setSceneIndex(i => Math.max(0, i - 1));
  };

  const handleQuizFinish = (correct: number) => {
    setQuizScore(correct);
    void (async () => {
      await recordKidsQuizScore(storyId, correct);
      const progress = await markKidsStoryCompleted(storyId);
      setStage('done');
      if (!achievementService) return;
      const unlocked = [];
      if (progress.storiesCompleted.length === 1) {
        unlocked.push(
          ...(await achievementService.trackKidsFirstStoryComplete()),
        );
      }
      if (progress.storiesCompleted.length === KIDS_STORIES.length) {
        unlocked.push(
          ...(await achievementService.trackKidsAllStoriesComplete()),
        );
      }
      if (unlocked.length > 0) notifyAchievements(unlocked);
    })();
  };

  const openInReader = () => {
    haptics.tap();
    const parsed = parseChristRef(story.scenes[0].refs[0]);
    const book = parsed ? getBookByName(parsed.book) : null;
    if (!parsed || !book) return;
    const display = selectedVersion.language === 'es' ? book.name : book.nameEn;
    router.push(
      `/verse/${display}/${parsed.chapter}?verse=${parsed.verse}` as never,
    );
  };

  if (!storyText) return null;

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
            onPress={goBack}
            accessibilityRole="button"
            accessibilityLabel={t.bible.back}>
            <Ionicons name="arrow-back" size={24} color={staticColors.white} />
          </TouchableOpacity>
          <AppText scaleRole="compact" style={styles.headerLabel}>
            {storyText.subtitle}
          </AppText>
          <AppText scaleRole="display" style={styles.headerTitle}>
            {storyText.title}
          </AppText>
          {stage === 'scenes' && (
            <AppText scaleRole="compact" style={styles.headerProgress}>
              {tk.sceneOf
                .replace('{{n}}', String(sceneIndex + 1))
                .replace('{{total}}', String(story.scenes.length))}
            </AppText>
          )}
        </LinearGradient>

        <ScrollView
          contentContainerStyle={[
            styles.content,
            {paddingBottom: insets.bottom + spacing['2xl']},
            centeredMaxWidth(),
          ]}
          showsVerticalScrollIndicator={false}>
          {stage === 'scenes' && (
            <>
              <KidsSceneCanvas
                art={scene.art}
                width={canvasW}
                accessibilityLabel={sceneText}
              />
              <AppText style={[styles.sceneText, {color: colors.text}]}>
                {sceneText}
              </AppText>

              <View style={styles.actionsRow}>
                {!walkthroughActive && (
                  <TouchableOpacity
                    style={[styles.actionBtn, {borderColor: accent + '55'}]}
                    onPress={toggleListen}
                    accessibilityRole="button"
                    accessibilityLabel={
                      speaking ? tk.stopListening : tk.listen
                    }>
                    <Ionicons
                      name={speaking ? 'stop-circle' : 'volume-high'}
                      size={18}
                      color={accent}
                    />
                    <AppText
                      scaleRole="compact"
                      style={[styles.actionText, {color: accent}]}>
                      {speaking ? tk.stopListening : tk.listen}
                    </AppText>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={[styles.actionBtn, {borderColor: accent + '55'}]}
                  onPress={toggleReadTogether}
                  accessibilityRole="button"
                  accessibilityLabel={
                    walkthroughActive ? tk.readTogetherStop : tk.readTogether
                  }>
                  <Ionicons
                    name={
                      walkthroughActive ? 'stop-circle' : 'play-skip-forward'
                    }
                    size={18}
                    color={accent}
                  />
                  <AppText
                    scaleRole="compact"
                    style={[styles.actionText, {color: accent}]}>
                    {walkthroughActive ? tk.readTogetherStop : tk.readTogether}
                  </AppText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionBtn, {borderColor: accent + '55'}]}
                  onPress={toggleVerse}
                  accessibilityRole="button"
                  accessibilityLabel={showVerse ? tk.hideVerse : tk.showVerse}>
                  <Ionicons name="book-outline" size={18} color={accent} />
                  <AppText
                    scaleRole="compact"
                    style={[styles.actionText, {color: accent}]}>
                    {showVerse ? tk.hideVerse : tk.showVerse}
                  </AppText>
                </TouchableOpacity>
              </View>

              {showVerse && (
                <View style={[styles.verseBox, {borderColor: colors.border}]}>
                  {verseText === undefined ? (
                    <ActivityIndicator color={accent} />
                  ) : (
                    <AppText style={[styles.verseText, {color: colors.text}]}>
                      {verseText ?? tk.missingVerse}
                    </AppText>
                  )}
                </View>
              )}

              <View style={styles.navRow}>
                <TouchableOpacity
                  style={[
                    styles.navBtn,
                    {borderColor: colors.border},
                    sceneIndex === 0 && styles.navBtnDisabled,
                  ]}
                  onPress={prevScene}
                  disabled={sceneIndex === 0}
                  accessibilityRole="button"
                  accessibilityState={{disabled: sceneIndex === 0}}
                  accessibilityLabel={tk.previous}>
                  <AppText
                    style={[
                      styles.navBtnText,
                      {
                        color:
                          sceneIndex === 0 ? colors.textTertiary : colors.text,
                      },
                    ]}>
                    {tk.previous}
                  </AppText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.navBtn,
                    styles.navBtnPrimary,
                    {backgroundColor: accent},
                  ]}
                  onPress={nextScene}
                  accessibilityRole="button"
                  accessibilityLabel={isLastScene ? tk.quiz.start : tk.next}>
                  <AppText
                    style={[styles.navBtnText, {color: staticColors.white}]}>
                    {isLastScene ? tk.quiz.start : tk.next}
                  </AppText>
                </TouchableOpacity>
              </View>
            </>
          )}

          {stage === 'quiz' && (
            <KidsQuizPanel story={story} onFinish={handleQuizFinish} />
          )}

          {stage === 'done' && (
            <View style={styles.doneWrap}>
              <AppText style={[styles.doneStars, {color: accent}]}>
                {'⭐'.repeat(quizScore) || '·'}
              </AppText>
              <AppText style={[styles.doneScore, {color: colors.text}]}>
                {tk.quiz.score
                  .replace('{{n}}', String(quizScore))
                  .replace('{{total}}', String(story.quiz.length))}
              </AppText>

              <TouchableOpacity
                style={[styles.teachToggle, {borderColor: accent + '55'}]}
                onPress={() => {
                  haptics.tap();
                  setTeachOpen(o => !o);
                }}
                accessibilityRole="button"
                accessibilityState={{expanded: teachOpen}}
                accessibilityLabel={tk.teach.title}>
                <Ionicons name="school-outline" size={18} color={accent} />
                <AppText style={[styles.teachToggleText, {color: accent}]}>
                  {tk.teach.title}
                </AppText>
                <Ionicons
                  name={teachOpen ? 'chevron-up' : 'chevron-down'}
                  size={18}
                  color={accent}
                />
              </TouchableOpacity>

              {teachOpen && (
                <View style={[styles.teachBox, {borderColor: colors.border}]}>
                  <AppText
                    style={[styles.teachSectionTitle, {color: colors.text}]}>
                    {tk.teach.contextTitle}
                  </AppText>
                  <AppText
                    style={[styles.teachBody, {color: colors.textSecondary}]}>
                    {storyText.teachContext}
                  </AppText>

                  <AppText
                    style={[styles.teachSectionTitle, {color: colors.text}]}>
                    {tk.teach.talkTitle}
                  </AppText>
                  {storyText.teachQuestions.map((q, i) => (
                    <AppText
                      key={i}
                      style={[
                        styles.teachQuestion,
                        {color: colors.textSecondary},
                      ]}>
                      {`•  ${q}`}
                    </AppText>
                  ))}

                  <TouchableOpacity
                    style={[styles.readerChip, {borderColor: accent + '55'}]}
                    onPress={openInReader}
                    accessibilityRole="button"
                    accessibilityLabel={`${tk.teach.openInReader}: ${storyText.refLabel}`}>
                    <Ionicons name="book-outline" size={14} color={accent} />
                    <AppText
                      scaleRole="compact"
                      style={[styles.readerChipText, {color: accent}]}>
                      {tk.teach.openInReader} — {storyText.refLabel}
                    </AppText>
                  </TouchableOpacity>
                </View>
              )}

              <TouchableOpacity
                style={[
                  styles.navBtn,
                  styles.navBtnPrimary,
                  {backgroundColor: accent},
                ]}
                onPress={goBack}
                accessibilityRole="button"
                accessibilityLabel={tk.title}>
                <AppText
                  style={[styles.navBtnText, {color: staticColors.white}]}>
                  {tk.title}
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
  headerLabel: {
    color: staticColors.glassWhite95,
    fontSize: fontSizes.sm,
    fontWeight: '600',
    marginTop: spacing.xs,
  },
  headerTitle: {
    color: staticColors.white,
    fontSize: fontSizes['2xl'],
    fontWeight: '800',
  },
  headerProgress: {
    color: staticColors.glassWhite90,
    fontSize: fontSizes.sm,
    fontWeight: '700',
    marginTop: spacing.sm,
  },
  content: {padding: spacing.lg, gap: spacing.md, alignItems: 'center'},
  sceneText: {
    fontSize: fontSizes.md,
    lineHeight: fontSizes.md * 1.6,
    textAlign: 'center',
  },
  actionsRow: {flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm},
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    minHeight: 44,
  },
  actionText: {fontSize: fontSizes.sm, fontWeight: '700'},
  verseBox: {
    alignSelf: 'stretch',
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    padding: spacing.base,
  },
  verseText: {fontSize: fontSizes.md, lineHeight: fontSizes.md * 1.5},
  navRow: {
    flexDirection: 'row',
    alignSelf: 'stretch',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  navBtn: {
    flex: 1,
    minHeight: 52,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  navBtnPrimary: {borderWidth: 0},
  navBtnDisabled: {opacity: 0.4},
  navBtnText: {fontSize: fontSizes.md, fontWeight: '800'},
  doneWrap: {alignSelf: 'stretch', alignItems: 'center', gap: spacing.md},
  doneStars: {fontSize: fontSizes['3xl']},
  doneScore: {fontSize: fontSizes.lg, fontWeight: '800'},
  teachToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    alignSelf: 'stretch',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.base,
    borderRadius: borderRadius.full,
    borderWidth: 1,
  },
  teachToggleText: {fontSize: fontSizes.md, fontWeight: '700'},
  teachBox: {
    alignSelf: 'stretch',
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    padding: spacing.base,
    gap: spacing.sm,
  },
  teachSectionTitle: {
    fontSize: fontSizes.sm,
    fontWeight: '800',
    marginTop: spacing.xs,
  },
  teachBody: {fontSize: fontSizes.sm, lineHeight: fontSizes.sm * 1.5},
  teachQuestion: {fontSize: fontSizes.sm, lineHeight: fontSizes.sm * 1.5},
  readerChip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    marginTop: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
    borderWidth: 1,
  },
  readerChipText: {fontSize: fontSizes.xs, fontWeight: '700'},
});
