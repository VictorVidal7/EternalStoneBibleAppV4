/**
 * 🎤 MODO PÚLPITO — the presenter view of the Mesa de preparación (premium).
 *
 * A full-screen, large-type reading view a preacher/teacher stands behind
 * while delivering: the passage text, then their OWN outline prose (read from
 * the SAME prep notes the single-passage screen saves — non-empty sections
 * only), with a font-size stepper, a high-contrast "dark stage" toggle, a
 * pacing clock, and a jump-to-section nav. The screen keeps itself awake while
 * presenting (its own dedicated keep-awake tag, released on exit).
 *
 * Read-only: it never edits notes and generates nothing — it only holds up
 * what the preparer already wrote (2 Timoteo 2:15). Reached from the Mesa via
 *   /features/prep/pulpit?book=John&chapter=3&startVerse=16&endVerse=21
 *
 * Premium-gated independently (defense in depth for a direct deep link): a
 * free reader sees the same quiet locked teaser as the other prep screens.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  type LayoutChangeEvent,
} from 'react-native';
import {Stack, useLocalSearchParams, useRouter} from 'expo-router';
import {Ionicons} from '@expo/vector-icons';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {activateKeepAwakeAsync, deactivateKeepAwake} from 'expo-keep-awake';
import {useTheme} from '@hooks/useTheme';
import {useLanguage} from '@hooks/useLanguage';
import {useBibleVersion} from '@hooks/useBibleVersion';
import {usePremium} from '@context/PremiumContext';
import {useOfferingSheet} from '@context/OfferingSheetContext';
import {haptics} from '@lib/haptics';
import {logger} from '@lib/utils/logger';
import {AppText} from '@components/ui/AppText';
import bibleDB from '@lib/database';
import {
  PREP_SECTIONS,
  formatPassageKey,
  formatPassageLabel,
  normalizePassage,
  type PrepPassage,
  type PrepSection,
} from '@/features/study/prepTable';
import {getPrepNotes} from '@/features/study/prepNotesStore';
import {
  countPrepNotesWords,
  estimateMinutes,
  formatEstimatedDuration,
} from '@/features/study/prepTiming';
import {borderRadius, spacing, staticColors} from '@/styles/designTokens';

type Status = 'loading' | 'ready' | 'empty' | 'error';

const PULPIT_KEEP_AWAKE_TAG = 'essb-pulpit-presenting';

// A deliberate, fixed high-contrast pair for the optional "dark stage" mode —
// a preacher may want maximum contrast regardless of the app's global theme.
// (When the toggle is OFF the screen uses the theme colors; see below.)
const STAGE_BG = '#0b0b0c';
const STAGE_TEXT = '#f4f4f5';
const STAGE_DIM = '#a1a1aa';

const PULPIT_FONT_MIN = 20;
const PULPIT_FONT_MAX = 40;
const PULPIT_FONT_STEP = 2;
const PULPIT_FONT_DEFAULT = 24;

interface FilledSection {
  section: PrepSection;
  label: string;
  prose: string;
}

interface VerseLine {
  verse: number;
  text: string;
}

export default function PulpitModeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {colors} = useTheme();
  const {t} = useLanguage();
  const {selectedVersion} = useBibleVersion();
  const {isPremium} = usePremium();
  const {open: openOfferingSheet} = useOfferingSheet();
  const h = t.prepPulpit;
  const bookLang = selectedVersion.language === 'es' ? 'es' : 'en';

  const params = useLocalSearchParams<{
    book?: string;
    chapter?: string;
    startVerse?: string;
    endVerse?: string;
    version?: string;
  }>();

  const passage: PrepPassage | null = useMemo(() => {
    const book = params.book;
    const chapter = Number(params.chapter);
    const startVerse = Number(params.startVerse);
    const endVerse = params.endVerse ? Number(params.endVerse) : undefined;
    if (!book || !Number.isFinite(chapter) || !Number.isFinite(startVerse)) {
      return null;
    }
    return normalizePassage(book, chapter, startVerse, endVerse);
  }, [params.book, params.chapter, params.startVerse, params.endVerse]);

  const passageKey = passage ? formatPassageKey(passage) : '';
  const passageLabel = passage ? formatPassageLabel(passage, bookLang) : '';

  const [status, setStatus] = useState<Status>('loading');
  const [lines, setLines] = useState<VerseLine[]>([]);
  const [sections, setSections] = useState<FilledSection[]>([]);
  const [wordCount, setWordCount] = useState(0);
  const [fontSize, setFontSize] = useState(PULPIT_FONT_DEFAULT);
  const [darkStage, setDarkStage] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  const scrollRef = useRef<ScrollView>(null);
  const offsets = useRef<Record<string, number>>({});
  const startRef = useRef<number>(Date.now());

  const load = useCallback(async () => {
    if (!isPremium) return;
    if (!passage) {
      setStatus('empty');
      return;
    }
    setStatus('loading');
    try {
      const version = params.version ?? selectedVersion.id;
      const verseNums: number[] = [];
      for (let v = passage.startVerse; v <= passage.endVerse; v++) {
        verseNums.push(v);
      }
      const verseRows = await Promise.all(
        verseNums.map(async v => {
          try {
            const row = await bibleDB.getVerse(
              passage.bookId,
              passage.chapter,
              v,
              version,
            );
            return {verse: v, text: row?.text ?? ''};
          } catch {
            return {verse: v, text: ''};
          }
        }),
      );

      const notes = await getPrepNotes(passageKey);
      setLines(verseRows);

      // Present the passage even with no notes yet — a preacher can read the
      // text in large type from the first moment, and their outline prose fills
      // in below as they write it. Only the non-empty sections are shown.
      const filled: FilledSection[] = PREP_SECTIONS.map(section => ({
        section,
        label: t.prepTable.sections[section].label,
        prose: (notes.sections[section] ?? '').trim(),
      })).filter(s => s.prose.length > 0);

      setSections(filled);
      setWordCount(countPrepNotesWords(notes));
      setStatus('ready');
    } catch (err) {
      logger.error('Pulpit mode load failed', err as Error, {
        component: 'PulpitModeScreen',
        action: 'load',
      });
      setStatus('error');
    }
    // Depend on selectedVersion.id (a stable string), NOT the selectedVersion
    // object — some providers hand back a fresh object each render, which would
    // otherwise re-fire this load every render.
  }, [isPremium, passage, passageKey, params.version, selectedVersion.id, t]);

  useEffect(() => {
    load();
  }, [load]);

  // Keep the screen awake ONLY while actively presenting — its own tag,
  // released on exit, mirroring the audio engine's tag discipline (never a
  // lock that leaks past the sermon).
  useEffect(() => {
    if (!isPremium || status !== 'ready') return;
    activateKeepAwakeAsync(PULPIT_KEEP_AWAKE_TAG).catch(() => {});
    return () => {
      deactivateKeepAwake(PULPIT_KEEP_AWAKE_TAG).catch(() => {});
    };
  }, [isPremium, status]);

  // Pacing clock: recomputes from a fixed start timestamp every tick, so a
  // throttled background tick just catches up rather than ever showing wrong
  // elapsed time.
  useEffect(() => {
    if (status !== 'ready') return;
    startRef.current = Date.now();
    setElapsed(0);
    const id = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startRef.current) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, [status]);

  const elapsedLabel = useMemo(() => {
    const mm = Math.floor(elapsed / 60);
    const ss = elapsed % 60;
    return `${mm}:${String(ss).padStart(2, '0')}`;
  }, [elapsed]);

  const estimateLabel = useMemo(
    () =>
      formatEstimatedDuration(estimateMinutes(wordCount), {
        lessThanOneMinute: t.prepTable.pulpitEstimateLessThanMinute,
        aboutMinutes: t.prepTable.pulpitEstimateLabel,
      }),
    [wordCount, t],
  );

  const handleFont = useCallback((delta: number) => {
    haptics.tap();
    setFontSize(prev =>
      Math.min(PULPIT_FONT_MAX, Math.max(PULPIT_FONT_MIN, prev + delta)),
    );
  }, []);

  const handleToggleDark = useCallback(() => {
    haptics.tap();
    setDarkStage(prev => !prev);
  }, []);

  const handleJumpToSection = useCallback((section: PrepSection) => {
    haptics.tap();
    const y = offsets.current[section] ?? 0;
    scrollRef.current?.scrollTo({y, animated: true});
  }, []);

  const handleUnlock = useCallback(() => {
    haptics.tap();
    openOfferingSheet();
  }, [openOfferingSheet]);

  const bg = darkStage ? STAGE_BG : colors.background;
  const fg = darkStage ? STAGE_TEXT : colors.text;
  const dim = darkStage ? STAGE_DIM : colors.textSecondary;
  const accent = darkStage ? STAGE_TEXT : colors.primary;

  // ── Locked teaser (free reader / direct deep link) ─────────────────────────
  if (!isPremium) {
    return (
      <>
        <Stack.Screen options={{headerShown: false}} />
        <View
          style={[
            styles.container,
            {backgroundColor: colors.background, paddingTop: insets.top},
          ]}>
          <TopBarBack
            onBack={() => router.back()}
            color={colors.text}
            label={t.bible.back}
          />
          <View style={styles.centerState}>
            <View
              style={[
                styles.lockedIconCircle,
                {backgroundColor: colors.primary + '1a'},
              ]}>
              <Ionicons name="mic-outline" size={36} color={colors.primary} />
            </View>
            <Text style={[styles.lockedTitle, {color: colors.text}]}>
              {h.lockedTitle}
            </Text>
            <Text style={[styles.lockedBody, {color: colors.textSecondary}]}>
              {h.lockedBody}
            </Text>
            <TouchableOpacity
              style={[styles.unlockButton, {backgroundColor: colors.primary}]}
              onPress={handleUnlock}
              accessibilityRole="button"
              accessibilityLabel={`${h.title} — ${t.offering.badgeA11y}`}>
              <Ionicons
                name="leaf-outline"
                size={18}
                color={staticColors.white}
              />
              <AppText scaleRole="compact" style={styles.unlockButtonText}>
                {t.offering.settingsCta}
              </AppText>
            </TouchableOpacity>
          </View>
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{headerShown: false}} />
      <View
        style={[
          styles.container,
          {backgroundColor: bg, paddingTop: insets.top},
        ]}>
        <View style={styles.topBar}>
          <TouchableOpacity
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel={h.exitLabel}
            hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
            <Ionicons name="close" size={26} color={fg} />
          </TouchableOpacity>
          <Text style={[styles.topLabel, {color: fg}]} numberOfLines={1}>
            {passageLabel}
          </Text>
          <View style={styles.topControls}>
            {status === 'ready' && (
              <View
                style={styles.clockWrap}
                accessibilityLabel={h.elapsedLabel}>
                <Ionicons name="time-outline" size={16} color={dim} />
                <Text style={[styles.clockText, {color: dim}]}>
                  {elapsedLabel}
                </Text>
              </View>
            )}
            <TouchableOpacity
              onPress={() => handleFont(-PULPIT_FONT_STEP)}
              disabled={fontSize <= PULPIT_FONT_MIN}
              accessibilityRole="button"
              accessibilityLabel={h.fontSizeDecrease}
              hitSlop={{top: 8, bottom: 8, left: 6, right: 6}}>
              <Ionicons
                name="remove"
                size={22}
                color={fontSize <= PULPIT_FONT_MIN ? dim : fg}
              />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleFont(PULPIT_FONT_STEP)}
              disabled={fontSize >= PULPIT_FONT_MAX}
              accessibilityRole="button"
              accessibilityLabel={h.fontSizeIncrease}
              hitSlop={{top: 8, bottom: 8, left: 6, right: 6}}>
              <Ionicons
                name="add"
                size={22}
                color={fontSize >= PULPIT_FONT_MAX ? dim : fg}
              />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleToggleDark}
              accessibilityRole="button"
              accessibilityLabel={h.darkBackgroundToggle}
              accessibilityState={{selected: darkStage}}
              hitSlop={{top: 8, bottom: 8, left: 6, right: 6}}>
              <Ionicons
                name={darkStage ? 'sunny-outline' : 'moon-outline'}
                size={20}
                color={fg}
              />
            </TouchableOpacity>
          </View>
        </View>

        {status === 'loading' ? (
          <View style={styles.centerState}>
            <ActivityIndicator size="large" color={accent} />
          </View>
        ) : status === 'error' ? (
          <View style={styles.centerState}>
            <Ionicons name="alert-circle-outline" size={44} color={dim} />
            <Text style={[styles.stateText, {color: dim}]}>{h.errorBody}</Text>
          </View>
        ) : status === 'empty' ? (
          <View style={styles.centerState}>
            <Ionicons name="document-text-outline" size={44} color={dim} />
            <Text style={[styles.stateTitle, {color: fg}]}>{h.emptyTitle}</Text>
            <Text style={[styles.stateText, {color: dim}]}>{h.emptyBody}</Text>
          </View>
        ) : (
          <>
            {sections.length > 1 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.navRow}
                contentContainerStyle={styles.navContent}>
                {sections.map(s => (
                  <TouchableOpacity
                    key={s.section}
                    style={[styles.navChip, {borderColor: dim}]}
                    onPress={() => handleJumpToSection(s.section)}
                    accessibilityRole="button"
                    accessibilityLabel={`${h.sectionNavHint}: ${s.label}`}>
                    <Text
                      style={[styles.navChipText, {color: fg}]}
                      numberOfLines={1}>
                      {s.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
            <ScrollView
              ref={scrollRef}
              style={styles.scroll}
              contentContainerStyle={styles.scrollContent}>
              <View style={styles.passageBlock}>
                {lines.map(line => (
                  <Text
                    key={line.verse}
                    style={[
                      styles.passageText,
                      {color: fg, fontSize, lineHeight: fontSize * 1.5},
                    ]}>
                    <Text style={[styles.verseNum, {color: accent}]}>
                      {line.verse}{' '}
                    </Text>
                    {line.text}
                  </Text>
                ))}
              </View>
              {sections.map(s => (
                <View
                  key={s.section}
                  onLayout={(e: LayoutChangeEvent) => {
                    offsets.current[s.section] = e.nativeEvent.layout.y;
                  }}
                  style={styles.sectionBlock}>
                  <Text style={[styles.sectionLabel, {color: accent}]}>
                    {s.label}
                  </Text>
                  <Text
                    style={[
                      styles.sectionProse,
                      {color: fg, fontSize, lineHeight: fontSize * 1.5},
                    ]}>
                    {s.prose}
                  </Text>
                </View>
              ))}
              {wordCount > 0 && (
                <View style={styles.footerMeta}>
                  <Text style={[styles.footerMetaText, {color: dim}]}>
                    {estimateLabel}
                  </Text>
                </View>
              )}
            </ScrollView>
          </>
        )}
      </View>
    </>
  );
}

function TopBarBack({
  onBack,
  color,
  label,
}: {
  onBack: () => void;
  color: string;
  label: string;
}) {
  return (
    <View style={styles.topBar}>
      <TouchableOpacity
        onPress={onBack}
        accessibilityRole="button"
        accessibilityLabel={label}
        hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
        <Ionicons name="arrow-back" size={24} color={color} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1},
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  topLabel: {flex: 1, fontSize: 16, fontWeight: '700'},
  topControls: {flexDirection: 'row', alignItems: 'center', gap: spacing.md},
  clockWrap: {flexDirection: 'row', alignItems: 'center', gap: 3},
  clockText: {fontSize: 14, fontWeight: '600', fontVariant: ['tabular-nums']},
  navRow: {flexGrow: 0},
  navContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    gap: spacing.xs,
  },
  navChip: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    maxWidth: 160,
  },
  navChipText: {fontSize: 13, fontWeight: '600'},
  scroll: {flex: 1},
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing['2xl'],
  },
  passageBlock: {marginBottom: spacing.xl},
  passageText: {marginBottom: spacing.sm, fontStyle: 'italic'},
  verseNum: {fontWeight: '800', fontStyle: 'normal'},
  sectionBlock: {marginBottom: spacing.xl},
  sectionLabel: {
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
  sectionProse: {fontWeight: '400'},
  footerMeta: {
    marginTop: spacing.md,
    alignItems: 'center',
  },
  footerMetaText: {fontSize: 13, fontWeight: '600'},
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.md,
  },
  stateTitle: {fontSize: 18, fontWeight: '700', textAlign: 'center'},
  stateText: {fontSize: 15, textAlign: 'center', lineHeight: 21},
  lockedIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  lockedTitle: {fontSize: 18, fontWeight: '700', textAlign: 'center'},
  lockedBody: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 320,
  },
  unlockButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.full,
    marginTop: spacing.md,
  },
  unlockButtonText: {
    color: staticColors.white,
    fontWeight: '700',
    fontSize: 15,
  },
});
