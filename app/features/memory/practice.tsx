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

import React, {useEffect, useMemo, useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import {useRouter, useLocalSearchParams, Stack} from 'expo-router';
import {Ionicons} from '@expo/vector-icons';
import {LinearGradient} from 'expo-linear-gradient';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {haptics} from '@lib/haptics';
import {useTheme} from '@hooks/useTheme';
import {contrastRatio} from '@lib/a11y/contrast';
import {centeredMaxWidth} from '@/styles/responsive';
import {useLanguage} from '@hooks/useLanguage';
import {useBibleVersion} from '@hooks/useBibleVersion';
import {useMemoryDeck} from '@context/MemoryDeckContext';
import {useFavorites} from '@context/FavoritesContext';
import {useToast} from '@context/ToastContext';
import {getBookByName, canonicalBookName} from '@/constants/bible';
import {applyMask, MASK_LEVEL_PERCENT, maskLevelForBox} from '@lib/memory/srs';
import type {ReviewGrade} from '@lib/memory/srs';
import {
  firstLetterPrompt,
  buildFillLayout,
  fillScore,
  checkTypedVerse,
} from '@lib/memory/recall';
import {WriteCanvas} from '@/features/memory/WriteCanvas';
import {MemoryGuideModal} from '@components/MemoryGuideModal';
import {
  borderRadius,
  fontSize as fontSizes,
  spacing,
  staticColors,
} from '@/styles/designTokens';

/** The active-recall modes layered on the SRS. */
type PracticeMode = 'reveal' | 'firstLetter' | 'fill' | 'write' | 'type';
const MODE_ORDER: PracticeMode[] = [
  'reveal',
  'firstLetter',
  'fill',
  'write',
  'type',
];
const MODE_ICON: Record<PracticeMode, keyof typeof Ionicons.glyphMap> = {
  reveal: 'eye-outline',
  firstLetter: 'text-outline',
  fill: 'create-outline',
  write: 'brush-outline',
  // 'write' already owns the hand-drawing brush icon — this is the
  // keyboard-typing mode, so a pencil (already used elsewhere in the app for
  // "type/edit text") keeps the two visually distinct.
  type: 'pencil-outline',
};

export default function MemoryPracticeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {colors, gradient} = useTheme();
  const {t} = useLanguage();
  const {selectedVersion} = useBibleVersion();
  const {dueCards, cards, reviewCard} = useMemoryDeck();
  const {favorites, addFavorite, removeFavorite} = useFavorites();
  const toast = useToast();

  // "Practicar sin calificar" (free practice) — `?free=1` opens this same
  // screen ungraded, seeded from the WHOLE deck (or a single card via
  // `?verseKey=...`) instead of only what's currently due. Free sessions
  // never call `reviewCard` — see handleGrade/handleNext below — so they
  // can never touch the SRS schedule, stats, streaks, or Firestore.
  //
  // `isFree` is STATE, not just a param-derived constant, because
  // "Repetir" (handleRepeat below) forces it to true even for a session
  // that started graded. reviewCard mutates the LIVE deck by verseKey, not
  // the frozen `queue` snapshot below — so replaying the same queue with
  // grading still live would grade the same card a second time in one
  // sitting (box jumps twice, a near-zero-interval review event pollutes
  // the retention history that calibrates every FUTURE card's ease, and
  // the daily goal/streak double-count). The first pass's grades (already
  // applied to the real deck before Repetir is ever pressed) are correct
  // and untouched — only the REPLAY must be ungraded.
  const params = useLocalSearchParams<{free?: string; verseKey?: string}>();
  const [isFree, setIsFree] = useState(params.free === '1');

  // Freeze the queue on mount so a grade-driven reshuffle doesn't add
  // the same card back into the current session. Seeding reads the
  // ORIGINAL param-derived free-ness (captured once, before any Repetir
  // flip) — a graded session's queue/dueCards-seeding must never change
  // just because a later Repetir switches the UI to ungraded.
  const [queue] = useState(() => {
    const seedFromWholeDeck = params.free === '1';
    if (seedFromWholeDeck) {
      if (params.verseKey) {
        const target = cards.find(c => c.verseKey === params.verseKey);
        if (target) return [target];
        // Target verse not found (e.g. removed from the deck between
        // navigating and this mount) — fall back to the whole deck rather
        // than stranding the user on an instant "session complete".
      }
      return [...cards];
    }
    return [...dueCards];
  });
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  // Box-1 cards show the full verse in 'reveal' mode (nothing masked), which
  // is pointless for free practice off-schedule — default to a real recall
  // mode instead. The user can still switch back to 'reveal' freely. Reads
  // the initial `isFree` value only (mode shouldn't jump on a later Repetir
  // flip — "Repetir" keeps the SAME mode the session was already in).
  const [mode, setMode] = useState<PracticeMode>(
    params.free === '1' ? 'firstLetter' : 'reveal',
  );
  const [fillAnswers, setFillAnswers] = useState<string[]>([]);
  const [typedAnswer, setTypedAnswer] = useState('');
  const [guideVisible, setGuideVisible] = useState(false);

  const total = queue.length;
  const card = queue[index];
  const done = index >= total;

  // A fresh card or a mode switch starts the recall over.
  useEffect(() => {
    setRevealed(false);
    setFillAnswers([]);
    setTypedAnswer('');
  }, [index, mode]);

  // Favorito ↔ Memorizar cross-link: the CURRENT card, favorited or not.
  // Mirrors the reader's handleToggleSingleFavorite / favorites.tsx's
  // school-icon toggle, just in the other direction.
  const currentFavorite = useMemo(() => {
    if (!card) return undefined;
    const book = canonicalBookName(card.bookName);
    return favorites.find(
      f =>
        canonicalBookName(f.book) === book &&
        f.chapter === card.chapter &&
        f.verse === card.verse,
    );
  }, [favorites, card]);
  const isCardFavorited = Boolean(currentFavorite);

  const handleToggleFavorite = () => {
    if (!card) return;
    haptics.press();
    if (currentFavorite) {
      void removeFavorite(currentFavorite.id).then(() => {
        toast.info(t.verse.removedFromFavorites);
      });
    } else {
      void addFavorite(
        {
          book: card.bookName,
          chapter: card.chapter,
          verse: card.verse,
          text: card.text,
        },
        'other',
        5,
      ).then(() => {
        toast.success(t.verse.addedToFavorites);
      });
    }
  };

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
    return selectedVersion.language === 'es' ? info.name : info.nameEn;
  }, [card, selectedVersion.language]);

  const maskLevel = card ? maskLevelForBox(card.box) : 0;
  const maskPercent = MASK_LEVEL_PERCENT[maskLevel];
  const maskedText = useMemo(
    () => (card ? applyMask(card.text, maskLevel) : ''),
    [card, maskLevel],
  );
  const firstLetterText = useMemo(
    () => (card ? firstLetterPrompt(card.text) : ''),
    [card],
  );
  const fillLayout = useMemo(
    () => (card ? buildFillLayout(card.text) : {tokens: [], blankCount: 0}),
    [card],
  );
  const maskHintLabel =
    maskPercent === 0
      ? t.memory.practice.maskNone
      : t.memory.practice.maskHint.replace('{{percent}}', String(maskPercent));

  // Box-1 cards (a verse's first time in the deck) are shown in full in REVEAL
  // mode — the mask hides nothing — so there is nothing to "reveal"; skip the
  // reveal step there. The other modes always pose a real recall, so they wait
  // for the user to reveal/check.
  const nothingMasked = mode === 'reveal' && maskLevel === 0;
  const showAnswer = revealed || nothingMasked;

  const fillExpected = useMemo(
    () => fillLayout.tokens.filter(tk => tk.isBlank).map(tk => tk.text),
    [fillLayout],
  );
  const fillCorrect = fillScore(fillAnswers, fillExpected);

  // 'type' mode — the whole verse is expected words, not just the blanks.
  const typeExpectedWords = useMemo(
    () => (card ? card.text.split(/\s+/).filter(w => w.length > 0) : []),
    [card],
  );
  const typeCheckResult = useMemo(
    () => checkTypedVerse(typedAnswer, card ? card.text : ''),
    [typedAnswer, card],
  );

  const handleReveal = () => {
    haptics.tap();
    setRevealed(true);
  };

  const setFillAnswer = (blankIndex: number, value: string) => {
    setFillAnswers(prev => {
      const next = [...prev];
      next[blankIndex] = value;
      return next;
    });
  };

  const handleGrade = (grade: ReviewGrade) => {
    // Free-practice sessions never grade — the UI swaps this whole control
    // for handleNext below, but guard here too so it's structurally
    // impossible to reach reviewCard from a free session.
    if (!card || isFree) return;
    if (grade === 'again') haptics.warning();
    else haptics.success();
    reviewCard(card.verseKey, grade);
    // Advance to the next card. We don't pull from `dueCards` again on
    // purpose — see the queue-freeze rationale at the top.
    setIndex(prev => prev + 1);
    setRevealed(false);
  };

  // Free-practice's ungraded "Siguiente" advance — purely local UI state,
  // no reviewCard call, no SRS/stats/streak write.
  const handleNext = () => {
    haptics.tap();
    setIndex(prev => prev + 1);
    setRevealed(false);
  };

  // "Repetir" — replay the SAME frozen queue, in the SAME recall mode, from
  // the start. ALWAYS forces free/ungraded mode for the replay — even when
  // the session that just finished was graded — because reviewCard keys off
  // verseKey against the LIVE deck, not this frozen queue: grading the same
  // card again here would silently re-apply a second review to a card
  // already reviewed this session (see the isFree comment above for the
  // downstream SRS/ease/retention/streak fallout). The already-applied
  // first-pass grades are unaffected. Resetting `index` alone handles the
  // rest: the [index, mode] effect clears revealed/fillAnswers/typedAnswer.
  const handleRepeat = () => {
    haptics.tap();
    setIsFree(true);
    setIndex(0);
  };

  const modeLabel = (m: PracticeMode): string => {
    switch (m) {
      case 'reveal':
        return t.memory.practice.modeReveal;
      case 'firstLetter':
        return t.memory.practice.modeFirstLetter;
      case 'fill':
        return t.memory.practice.modeFill;
      case 'write':
        return t.memory.practice.modeWrite;
      case 'type':
        return t.memory.practice.modeType;
    }
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
          <View style={styles.headerTopRow}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
              accessibilityRole="button"
              accessibilityLabel={t.bible.back}>
              <Ionicons name="close" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => {
                haptics.tap();
                setGuideVisible(true);
              }}
              accessibilityRole="button"
              accessibilityLabel={t.memory.guide.openLabel}>
              <Ionicons name="help-circle-outline" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

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
            centeredMaxWidth(),
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
              {/* "Repetir" — replay this same queue/mode from the start
                  (graded sessions keep grading; free sessions stay free). */}
              <TouchableOpacity
                style={[styles.doneRepeatCta, {borderColor: colors.primary}]}
                onPress={handleRepeat}
                accessibilityRole="button">
                <Ionicons name="refresh" size={18} color={colors.primary} />
                <Text
                  style={[styles.doneRepeatCtaText, {color: colors.primary}]}>
                  {t.memory.practice.repeat}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.doneCta, {backgroundColor: colors.primary}]}
                onPress={() => router.back()}
                accessibilityRole="button">
                <Text style={[styles.doneCtaText, {color: colors.onPrimary}]}>
                  {t.memory.practice.doneCta}
                </Text>
              </TouchableOpacity>
            </View>
          ) : card ? (
            <>
              {/* Free-practice disclaimer — this session is ungraded and
                  never touches the SRS schedule/streak/goal. */}
              {isFree && (
                <View
                  style={[
                    styles.freeBanner,
                    {
                      backgroundColor: colors.warning + '15',
                      borderColor: colors.warning + '40',
                    },
                  ]}>
                  <Ionicons
                    name="information-circle-outline"
                    size={16}
                    color={colors.warning}
                  />
                  <Text
                    style={[
                      styles.freeBannerText,
                      {color: colors.textSecondary},
                    ]}>
                    {t.memory.practice.freeModeCaption}
                  </Text>
                </View>
              )}

              {/* Recall-mode selector */}
              <View style={styles.modeRow}>
                {MODE_ORDER.map(m => {
                  const active = mode === m;
                  const label = modeLabel(m);
                  return (
                    <TouchableOpacity
                      key={m}
                      style={[
                        styles.modeTab,
                        {
                          backgroundColor: active
                            ? colors.primary
                            : colors.surface,
                          borderColor: active ? colors.primary : colors.border,
                        },
                      ]}
                      onPress={() => {
                        haptics.tap();
                        setMode(m);
                      }}
                      accessibilityRole="button"
                      accessibilityState={{selected: active}}
                      accessibilityLabel={label}>
                      <Ionicons
                        name={MODE_ICON[m]}
                        size={15}
                        color={active ? colors.onPrimary : colors.textSecondary}
                      />
                      <Text
                        style={[
                          styles.modeTabText,
                          {
                            color: active
                              ? colors.onPrimary
                              : colors.textSecondary,
                          },
                        ]}
                        numberOfLines={1}
                        // Four equal-width tabs leave little room — let a long
                        // label (e.g. ES "Iniciales") shrink to fit instead of
                        // clipping to "Primera l…" (UX review #4).
                        adjustsFontSizeToFit
                        minimumFontScale={0.8}>
                        {label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View
                style={[
                  styles.flashcard,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                ]}>
                <View style={styles.cardMetaRow}>
                  <View
                    style={[
                      styles.boxBadge,
                      {backgroundColor: colors.primary + '22'},
                    ]}>
                    <Text
                      style={[styles.boxBadgeText, {color: colors.primary}]}>
                      {t.memory.practice.boxLabel.replace(
                        '{{box}}',
                        String(card.box),
                      )}
                    </Text>
                  </View>
                  <View style={styles.cardMetaRight}>
                    {mode === 'reveal' ? (
                      <Text
                        style={[
                          styles.maskHintText,
                          {color: colors.textTertiary},
                        ]}>
                        {maskHintLabel}
                      </Text>
                    ) : null}
                    {/* Favorito ↔ Memorizar cross-link — mark the CURRENT
                        card as a Favorito too, mirroring the reader's own
                        heart toggle. */}
                    <TouchableOpacity
                      onPress={handleToggleFavorite}
                      hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}
                      accessibilityRole="button"
                      accessibilityLabel={
                        isCardFavorited
                          ? t.verse.removeFavorite
                          : t.verse.addFavorite
                      }
                      accessibilityState={{selected: isCardFavorited}}>
                      <Ionicons
                        name={isCardFavorited ? 'heart' : 'heart-outline'}
                        size={20}
                        color={
                          isCardFavorited ? colors.primary : colors.textTertiary
                        }
                      />
                    </TouchableOpacity>
                  </View>
                </View>
                <Text style={[styles.reference, {color: colors.primary}]}>
                  {displayBookName} {card.chapter}:{card.verse}
                </Text>

                {/* Body per recall mode */}
                {showAnswer && mode !== 'type' ? (
                  <Text style={[styles.verseText, {color: colors.text}]}>
                    {card.text}
                  </Text>
                ) : mode === 'reveal' ? (
                  <Text style={[styles.verseText, {color: colors.text}]}>
                    {maskedText}
                  </Text>
                ) : mode === 'firstLetter' ? (
                  <Text style={[styles.verseText, {color: colors.text}]}>
                    {firstLetterText}
                  </Text>
                ) : mode === 'fill' ? (
                  <View style={styles.fillWrap}>
                    {fillLayout.tokens.map((tk, i) =>
                      tk.isBlank ? (
                        <TextInput
                          key={`tk-${i}`}
                          style={[
                            styles.fillInput,
                            {color: colors.text, borderColor: colors.primary},
                          ]}
                          value={fillAnswers[tk.blankIndex] ?? ''}
                          onChangeText={v => setFillAnswer(tk.blankIndex, v)}
                          autoCapitalize="none"
                          autoCorrect={false}
                          placeholder="·····"
                          placeholderTextColor={colors.textTertiary}
                          accessibilityLabel={t.memory.practice.fillPrompt}
                        />
                      ) : (
                        <Text
                          key={`tk-${i}`}
                          style={[styles.fillWord, {color: colors.text}]}>
                          {tk.text}
                        </Text>
                      ),
                    )}
                  </View>
                ) : mode === 'type' ? (
                  showAnswer ? (
                    <View style={styles.typeResultWrap}>
                      {typeExpectedWords.map((word, i) => (
                        <Text
                          key={`tw-${i}`}
                          style={[
                            styles.typeResultWord,
                            {
                              color: typeCheckResult.wordResults[i]
                                ? colors.success
                                : colors.error,
                            },
                          ]}>
                          {word}
                        </Text>
                      ))}
                    </View>
                  ) : (
                    <TextInput
                      style={[
                        styles.typeInput,
                        {
                          color: colors.text,
                          borderColor: colors.border,
                          backgroundColor: colors.background,
                        },
                      ]}
                      value={typedAnswer}
                      onChangeText={setTypedAnswer}
                      multiline
                      autoCapitalize="none"
                      autoCorrect={false}
                      placeholder={t.memory.practice.typePlaceholder}
                      placeholderTextColor={colors.textTertiary}
                      accessibilityLabel={t.memory.practice.typePrompt}
                    />
                  )
                ) : (
                  <WriteCanvas
                    key={`${card.verseKey}-write`}
                    strokeColor={colors.text}
                    bgColor={colors.background}
                    borderColor={colors.border}
                    controlColor={colors.primary}
                    clearLabel={t.memory.practice.clear}
                    undoLabel={t.memory.practice.undo}
                  />
                )}
              </View>

              {!showAnswer ? (
                <TouchableOpacity
                  style={[
                    styles.revealButton,
                    {backgroundColor: colors.primary},
                  ]}
                  onPress={handleReveal}>
                  <Ionicons
                    name={
                      (mode === 'fill' && fillLayout.blankCount > 0) ||
                      mode === 'type'
                        ? 'checkmark-circle-outline'
                        : 'eye-outline'
                    }
                    size={22}
                    color={colors.onPrimary}
                  />
                  <Text style={[styles.revealText, {color: colors.onPrimary}]}>
                    {mode === 'fill' && fillLayout.blankCount > 0
                      ? t.memory.practice.fillCheck
                      : mode === 'type'
                        ? t.memory.practice.typeCheck
                        : t.memory.practice.reveal}
                  </Text>
                </TouchableOpacity>
              ) : (
                <>
                  <Text style={[styles.prompt, {color: colors.textSecondary}]}>
                    {mode === 'fill' && fillLayout.blankCount > 0
                      ? t.memory.practice.fillResult
                          .replace('{{correct}}', String(fillCorrect))
                          .replace('{{total}}', String(fillLayout.blankCount))
                      : mode === 'type'
                        ? t.memory.practice.typeResult
                            .replace(
                              '{{correct}}',
                              String(typeCheckResult.correctCount),
                            )
                            .replace(
                              '{{total}}',
                              String(typeCheckResult.totalCount),
                            )
                        : nothingMasked
                          ? t.memory.practice.promptFullVerse
                          : t.memory.practice.prompt}
                  </Text>
                  {isFree ? (
                    // Free practice — no grade, just move on. Never calls
                    // reviewCard (see handleNext), so the SRS schedule,
                    // stats, streaks and Firestore are untouched.
                    <TouchableOpacity
                      style={[
                        styles.revealButton,
                        {backgroundColor: colors.primary},
                      ]}
                      onPress={handleNext}
                      accessibilityRole="button"
                      accessibilityLabel={t.next}>
                      <Ionicons
                        name="arrow-forward"
                        size={22}
                        color={colors.onPrimary}
                      />
                      <Text
                        style={[styles.revealText, {color: colors.onPrimary}]}>
                        {t.next}
                      </Text>
                    </TouchableOpacity>
                  ) : (
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
                  )}
                </>
              )}
            </>
          ) : null}
        </ScrollView>

        {/* "How memorization works" explainer (Sprint 98) */}
        <MemoryGuideModal
          visible={guideVisible}
          onClose={() => setGuideVisible(false)}
        />
      </View>
    </>
  );
}

const DARK_INK = '#0f172a';

const GradeButton: React.FC<{
  grade: ReviewGrade;
  label: string;
  onPress: () => void;
}> = ({grade, label, onPress}) => {
  const {colors} = useTheme();
  const gradeColors: Record<ReviewGrade, string> = {
    again: colors.error,
    hard: colors.warning,
    good: colors.success,
    easy: colors.primary,
  };
  const backgroundColor = gradeColors[grade];
  // Theme/high-contrast palettes vary widely in lightness, so pick whichever
  // ink actually reads best against THIS background instead of assuming
  // white — same problem `onPrimary` solves per-palette for the primary
  // color, applied here at render time since error/warning/success have no
  // precomputed "on" token of their own.
  const textColor =
    contrastRatio(backgroundColor, staticColors.white) >=
    contrastRatio(backgroundColor, DARK_INK)
      ? staticColors.white
      : DARK_INK;

  return (
    <TouchableOpacity
      style={[styles.gradeButton, {backgroundColor}]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}>
      <Text style={[styles.gradeText, {color: textColor}]}>{label}</Text>
    </TouchableOpacity>
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
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: staticColors.glassWhite18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  headerTitle: {
    color: staticColors.white,
    fontSize: fontSizes['2xl'],
    fontWeight: '800',
  },
  headerProgress: {
    color: staticColors.glassWhite85,
    fontSize: fontSizes.sm,
    fontWeight: '700',
  },
  progressTrack: {
    height: 6,
    backgroundColor: staticColors.glassWhite18,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: staticColors.white,
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
  cardMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  cardMetaRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  boxBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
  },
  boxBadgeText: {
    fontSize: fontSizes.xs,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  maskHintText: {
    fontSize: fontSizes.xs,
    fontWeight: '600',
  },
  modeRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.lg,
  },
  modeTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    borderRadius: borderRadius.full,
    borderWidth: 1,
  },
  modeTabText: {
    fontSize: fontSizes.xs,
    fontWeight: '700',
  },
  fillWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  fillWord: {
    fontSize: fontSizes.lg,
    lineHeight: 36,
  },
  fillInput: {
    minWidth: 64,
    fontSize: fontSizes.base,
    fontWeight: '700',
    textAlign: 'center',
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderBottomWidth: 2,
  },
  typeInput: {
    minHeight: 100,
    fontSize: fontSizes.base,
    lineHeight: 24,
    borderWidth: 1,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    textAlignVertical: 'top',
  },
  typeResultWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  typeResultWord: {
    fontSize: fontSizes.lg,
    lineHeight: 28,
    fontWeight: '700',
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
  revealButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
  },
  revealText: {
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
    fontSize: fontSizes.base,
    fontWeight: '800',
  },
  doneRepeatCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing['2xl'],
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.full,
    borderWidth: 1.5,
  },
  doneRepeatCtaText: {
    fontSize: fontSizes.base,
    fontWeight: '800',
  },
  freeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: spacing.md,
  },
  freeBannerText: {
    flex: 1,
    fontSize: fontSizes.xs,
    fontWeight: '600',
  },
});
