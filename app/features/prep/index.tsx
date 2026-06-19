/**
 * 📋 MESA DE PREPARACIÓN — teaching / sermon prep table (Sprint 103)
 *
 * A local "study desk" for pastors and teachers. Give it a passage and it
 * gathers everything the app already curates for it — the parallel cross-
 * references, the topical themes, the "Cristo en este pasaje" note, the "Sobre
 * este libro" intro — and lays out the widely-held evangelical study scaffold
 * (Context → Observation → Interpretation → Big Idea → Christ → Application →
 * Questions) for the preparer to fill in their OWN prayerful words, autosaved
 * per passage to this device.
 *
 * 100% offline & deterministic — NO AI, NO backend. The pure assembly is
 * src/features/study/prepTable.ts; the preparer's prose is persisted by
 * prepNotesStore.ts; verse text comes from the SQLite Bible DB. The app never
 * writes the sermon — it only assembles the helps and holds the frame, so the
 * work stays the preparer's own before the Lord (2 Timoteo 2:15).
 *
 * Reached via the deep link
 *   eternalbible://features/prep?book=John&chapter=3&startVerse=16&endVerse=21
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import {Stack, useLocalSearchParams, useRouter} from 'expo-router';
import {Ionicons} from '@expo/vector-icons';
import {LinearGradient} from 'expo-linear-gradient';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Clipboard from 'expo-clipboard';
import {useTheme} from '@hooks/useTheme';
import {centeredMaxWidth} from '@/styles/responsive';
import {useLanguage} from '@hooks/useLanguage';
import {haptics} from '@lib/haptics';
import {AppText} from '@components/ui/AppText';
import bibleDB from '@lib/database';
import {getBookByName} from '@/constants/bible';
import {getBookIntro} from '@/constants/book-intros';
import {getTheme} from '@/features/study/themes';
import {
  christLangForVersion,
  formatChristRefLabel,
  parseChristRef,
  versionAbbrev,
} from '@/features/study/christConnections';
import {
  buildPrepTable,
  formatPassageLabel,
  PREP_SECTIONS,
  type PrepSection,
  type PrepTable,
} from '@/features/study/prepTable';
import {getPrepNotes, savePrepNote} from '@/features/study/prepNotesStore';
import {
  buildPrepMarkdown,
  type PrepMarkdownSection,
} from '@/features/study/prepMarkdown';
import {
  type VerseRange,
  adjustStart,
  adjustEnd,
  canDecreaseStart,
  canIncreaseStart,
  canDecreaseEnd,
  canIncreaseEnd,
} from '@/features/study/prepRange';
import {translations} from '@/i18n/translations';
import {logger} from '@lib/utils/logger';
import {
  borderRadius,
  fontSize as fontSizes,
  spacing,
  staticColors,
  verseTextRightSlack,
} from '@/styles/designTokens';

const VERSION_KEY = '@bible_version';

type LoadStatus = 'loading' | 'ready' | 'error' | 'empty';

interface VerseLine {
  verse: number;
  text: string | null;
}

interface CrossRow {
  key: string;
  bookDisplay: string;
  bookNav: string | null;
  chapter: number;
  verse: number;
  text: string | null;
}

interface ChristRow {
  id: string;
  note: string;
  pointsTo?: string;
  fulfillmentText?: string;
  versionAbbrev?: string;
}

/** Per-section icon for the outline cards. */
const SECTION_ICONS: Record<PrepSection, keyof typeof Ionicons.glyphMap> = {
  context: 'book-outline',
  observation: 'eye-outline',
  interpretation: 'bulb-outline',
  bigIdea: 'key-outline',
  christ: 'sparkles-outline',
  application: 'walk-outline',
  questions: 'help-circle-outline',
};

/** One +/− button in the verse-range stepper. */
function StepButton({
  icon,
  onPress,
  disabled,
  color,
  disabledColor,
  label,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  disabled: boolean;
  color: string;
  disabledColor: string;
  label: string;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{disabled}}
      hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}
      style={styles.stepButton}>
      <Ionicons
        name={icon}
        size={20}
        color={disabled ? disabledColor : color}
      />
    </TouchableOpacity>
  );
}

export default function PrepTableScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {colors} = useTheme();
  const {t, language} = useLanguage();
  const p = t.prepTable;

  const params = useLocalSearchParams<{
    book?: string;
    chapter?: string;
    startVerse?: string;
    endVerse?: string;
    verse?: string;
    version?: string;
  }>();
  const book = params.book ?? '';
  const chapter = Number(params.chapter ?? 0);
  const paramStart = Number(params.startVerse ?? params.verse ?? 0);
  const paramEnd = params.endVerse ? Number(params.endVerse) : paramStart;

  // The verse range is editable in-screen (the range picker), seeded from the
  // incoming params and reset whenever a new passage arrives via navigation.
  const [range, setRange] = useState<VerseRange>(() => ({
    start: paramStart >= 1 ? paramStart : 1,
    end:
      Math.max(paramStart, paramEnd) >= 1 ? Math.max(paramStart, paramEnd) : 1,
  }));
  useEffect(() => {
    setRange({
      start: paramStart >= 1 ? paramStart : 1,
      end:
        Math.max(paramStart, paramEnd) >= 1
          ? Math.max(paramStart, paramEnd)
          : 1,
    });
  }, [book, chapter, paramStart, paramEnd]);

  const table: PrepTable | null = useMemo(
    () => buildPrepTable(book, chapter, range.start, range.end),
    [book, chapter, range.start, range.end],
  );

  const [status, setStatus] = useState<LoadStatus>('loading');
  const [reloading, setReloading] = useState(false);
  const hasLoadedRef = useRef(false);
  const [maxVerse, setMaxVerse] = useState(0);
  const [lines, setLines] = useState<VerseLine[]>([]);
  const [crossRows, setCrossRows] = useState<CrossRow[]>([]);
  const [christRows, setChristRows] = useState<ChristRow[]>([]);
  const [intro, setIntro] = useState<{
    author: string;
    date: string;
    theme: string;
    context: string;
  } | null>(null);
  const [drafts, setDrafts] = useState<Partial<Record<PrepSection, string>>>(
    {},
  );
  const [versionLabel, setVersionLabel] = useState('');
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    if (!table) {
      setStatus('empty');
      return;
    }
    // First open shows the spinner; later range tweaks keep the content on
    // screen and show a subtle inline indicator instead of blanking it.
    if (hasLoadedRef.current) {
      setReloading(true);
    } else {
      setStatus('loading');
    }
    try {
      const version =
        params.version ??
        (await AsyncStorage.getItem(VERSION_KEY)) ??
        'RVR1960';
      const lang = christLangForVersion(version);

      // The chapter's verse count bounds the range picker.
      try {
        const count = await bibleDB.getChapterVerseCount(
          table.bookId,
          table.chapter,
          version,
        );
        if (count > 0) setMaxVerse(count);
      } catch {
        // Leave maxVerse open (0) — the picker still works, just unbounded up.
      }

      // Passage text (each verse in the range).
      const verseNums: number[] = [];
      for (let v = table.startVerse; v <= table.endVerse; v++)
        verseNums.push(v);
      const verseRows = await Promise.all(
        verseNums.map(async v => {
          try {
            const row = await bibleDB.getVerse(
              table.bookId,
              table.chapter,
              v,
              version,
            );
            return {verse: v, text: row?.text ?? null};
          } catch {
            return {verse: v, text: null};
          }
        }),
      );

      // Cross-reference parallels.
      const crossResolved = await Promise.all(
        table.crossRefs.map(async key => {
          const slash = key.indexOf('/');
          const bookName = slash >= 0 ? key.slice(0, slash) : key;
          const [cStr, vStr] = (slash >= 0 ? key.slice(slash + 1) : '').split(
            '/',
          );
          const c = Number(cStr);
          const v = Number(vStr);
          const info = getBookByName(bookName);
          const display = info
            ? lang === 'en'
              ? info.nameEn
              : info.name
            : bookName;
          let text: string | null = null;
          if (info && Number.isFinite(c) && Number.isFinite(v)) {
            try {
              const row = await bibleDB.getVerse(info.id, c, v, version);
              text = row?.text ?? null;
            } catch {
              text = null;
            }
          }
          return {
            key,
            bookDisplay: display,
            bookNav: info ? (lang === 'en' ? info.nameEn : info.name) : null,
            chapter: c,
            verse: v,
            text,
          };
        }),
      );

      // "Cristo en este pasaje" notes (curated; speak the version's language).
      const cc = translations[lang].christConnections;
      const christResolved = await Promise.all(
        table.christConnections.map(async conn => {
          const note = (cc.notes as Record<string, string>)[conn.id];
          let pointsTo: string | undefined;
          let fulfillmentText: string | undefined;
          if (conn.fulfillment) {
            const fp = parseChristRef(conn.fulfillment);
            const fbook = fp ? getBookByName(fp.book) : undefined;
            if (fp && fbook) {
              pointsTo = formatChristRefLabel(conn.fulfillment, lang);
              try {
                const frow = await bibleDB.getVerse(
                  fbook.id,
                  fp.chapter,
                  fp.verse,
                  version,
                );
                fulfillmentText = frow?.text ?? undefined;
              } catch {
                fulfillmentText = undefined;
              }
            }
          }
          return {
            id: conn.id,
            note,
            pointsTo,
            fulfillmentText,
            versionAbbrev: versionAbbrev(version),
          };
        }),
      );

      const bookIntro = getBookIntro(table.bookId, lang);

      const saved = await getPrepNotes(table.passageKey);

      setLines(verseRows);
      setCrossRows(crossResolved);
      setChristRows(christResolved.filter(r => Boolean(r.note)));
      setIntro(bookIntro);
      setDrafts(saved.sections);
      setVersionLabel(versionAbbrev(version));
      hasLoadedRef.current = true;
      setStatus('ready');
    } catch (err) {
      logger.error('Prep table load failed', err as Error, {
        component: 'PrepTableScreen',
        action: 'load',
      });
      if (!hasLoadedRef.current) setStatus('error');
    } finally {
      setReloading(false);
    }
  }, [table, params.version]);

  useEffect(() => {
    load();
  }, [load]);

  const handleJump = useCallback(
    (row: CrossRow) => {
      if (!row.bookNav) return;
      haptics.tap();
      router.push({
        pathname: `/verse/${row.bookNav}/${row.chapter}` as never,
        params: {verse: row.verse},
      });
    },
    [router],
  );

  const handleRange = useCallback((next: VerseRange) => {
    haptics.tap();
    setRange(next);
  }, []);

  const handleNoteChange = useCallback(
    (section: PrepSection, value: string) => {
      setDrafts(prev => ({...prev, [section]: value}));
    },
    [],
  );

  const handleNoteBlur = useCallback(
    (section: PrepSection) => {
      if (!table) return;
      savePrepNote(table.passageKey, section, drafts[section] ?? '');
    },
    [table, drafts],
  );

  const headerGradient: [string, string] = [colors.primary, colors.primaryDark];
  const passageLabel = table
    ? formatPassageLabel(table, language as 'es' | 'en')
    : '';

  const handleExport = useCallback(async () => {
    if (!table) return;
    haptics.tap();
    const themeLabel = (id: string) =>
      (t.themes.list as Record<string, {name: string; description: string}>)[id]
        ?.name ?? id;
    const sections: PrepMarkdownSection[] = PREP_SECTIONS.map(section => {
      let helps: string[] = [];
      if (section === 'context' && intro) {
        helps = [
          `${p.bookIntroTitle} — ${intro.author} · ${intro.date}`,
          intro.context,
        ];
      } else if (section === 'interpretation') {
        helps = [
          ...crossRows.map(r =>
            r.text
              ? `${r.bookDisplay} ${r.chapter}:${r.verse} — ${r.text}`
              : `${r.bookDisplay} ${r.chapter}:${r.verse}`,
          ),
          ...(table.themeIds.length > 0
            ? [`${p.themesTitle}: ${table.themeIds.map(themeLabel).join(', ')}`]
            : []),
        ];
      } else if (section === 'christ') {
        helps = christRows.map(r =>
          r.pointsTo ? `${r.note} (→ ${r.pointsTo})` : r.note,
        );
      }
      return {
        label: p.sections[section].label,
        prompt: p.sections[section].prompt,
        note: drafts[section],
        helps,
      };
    });
    const markdown = buildPrepMarkdown({
      passageLabel,
      versionLabel,
      passageText: lines.map(l => ({verse: l.verse, text: l.text ?? ''})),
      sections,
      guardrail: p.guardrail,
      generatedWith: p.title,
    });
    try {
      await Clipboard.setStringAsync(markdown);
      haptics.success();
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      logger.warn('Prep export copy failed', {error: String(err)});
    }
  }, [
    table,
    intro,
    crossRows,
    christRows,
    drafts,
    lines,
    passageLabel,
    versionLabel,
    p,
    t,
  ]);

  const renderHelpsForSection = (section: PrepSection) => {
    if (section === 'context' && intro) {
      return (
        <View
          style={[
            styles.helpCard,
            {backgroundColor: colors.card, borderColor: colors.border},
          ]}>
          <AppText
            scaleRole="compact"
            style={[styles.helpTitle, {color: colors.primary}]}>
            {p.bookIntroTitle}
          </AppText>
          <Text style={[styles.helpMeta, {color: colors.textTertiary}]}>
            {intro.author} · {intro.date}
          </Text>
          <Text style={[styles.helpBody, {color: colors.textSecondary}]}>
            {intro.context}
          </Text>
        </View>
      );
    }

    if (section === 'interpretation') {
      return (
        <>
          {crossRows.length > 0 && (
            <View style={styles.helpGroup}>
              <AppText
                scaleRole="compact"
                style={[styles.helpGroupLabel, {color: colors.textTertiary}]}>
                {p.crossRefsTitle}
              </AppText>
              {crossRows.map(row => (
                <TouchableOpacity
                  key={row.key}
                  style={[
                    styles.refCard,
                    {backgroundColor: colors.card, borderColor: colors.border},
                  ]}
                  onPress={() => handleJump(row)}
                  disabled={!row.bookNav}
                  accessibilityRole="button"
                  accessibilityLabel={`${row.bookDisplay} ${row.chapter}:${row.verse}`}
                  accessibilityHint={p.openHint}>
                  <View style={styles.refHeader}>
                    <AppText
                      scaleRole="compact"
                      style={[styles.refLabel, {color: colors.primary}]}>
                      {`${row.bookDisplay} ${row.chapter}:${row.verse}`}
                    </AppText>
                    <Ionicons
                      name="chevron-forward"
                      size={16}
                      color={colors.textTertiary}
                    />
                  </View>
                  {row.text != null && (
                    <Text
                      style={[styles.refText, {color: colors.textSecondary}]}
                      numberOfLines={3}>
                      {row.text}
                    </Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
          {table && table.themeIds.length > 0 && (
            <View style={styles.helpGroup}>
              <AppText
                scaleRole="compact"
                style={[styles.helpGroupLabel, {color: colors.textTertiary}]}>
                {p.themesTitle}
              </AppText>
              <View style={styles.chipWrap}>
                {table.themeIds.map(id => {
                  const theme = getTheme(id);
                  const label =
                    (
                      t.themes.list as Record<
                        string,
                        {name: string; description: string}
                      >
                    )[id]?.name ?? id;
                  return (
                    <View
                      key={id}
                      style={[
                        styles.chip,
                        {
                          backgroundColor: colors.card,
                          borderColor: colors.border,
                        },
                      ]}>
                      {theme?.icon ? (
                        <Ionicons
                          name={theme.icon as keyof typeof Ionicons.glyphMap}
                          size={14}
                          color={colors.primary}
                        />
                      ) : null}
                      <Text style={[styles.chipText, {color: colors.text}]}>
                        {label}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>
          )}
        </>
      );
    }

    if (section === 'christ' && christRows.length > 0) {
      return (
        <View style={styles.helpGroup}>
          {christRows.map(row => (
            <View
              key={row.id}
              style={[
                styles.helpCard,
                {backgroundColor: colors.card, borderColor: colors.border},
              ]}>
              <Text style={[styles.helpBody, {color: colors.textSecondary}]}>
                {row.note}
              </Text>
              {row.pointsTo && (
                <Text style={[styles.helpMeta, {color: colors.primary}]}>
                  → {row.pointsTo}
                  {row.versionAbbrev ? ` · ${row.versionAbbrev}` : ''}
                </Text>
              )}
              {row.fulfillmentText && (
                <Text
                  style={[styles.helpBody, {color: colors.textTertiary}]}
                  numberOfLines={3}>
                  {row.fulfillmentText}
                </Text>
              )}
            </View>
          ))}
        </View>
      );
    }

    return null;
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
            <Ionicons name="arrow-back" size={24} color={staticColors.white} />
          </TouchableOpacity>
          <View style={styles.headerTextRow}>
            <View style={styles.headerIcon}>
              <Ionicons name="reader" size={24} color={staticColors.white} />
            </View>
            <View style={styles.headerInfo}>
              <AppText scaleRole="compact" style={styles.headerLabel}>
                {p.subtitle}
              </AppText>
              <AppText scaleRole="display" style={styles.headerTitle}>
                {passageLabel || p.title}
              </AppText>
            </View>
          </View>
        </LinearGradient>

        {status === 'loading' && (
          <View style={styles.centerState}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        )}

        {status === 'empty' && (
          <View style={styles.centerState}>
            <Ionicons
              name="reader-outline"
              size={48}
              color={colors.textTertiary}
            />
            <Text style={[styles.stateText, {color: colors.textSecondary}]}>
              {p.missingPassage}
            </Text>
          </View>
        )}

        {status === 'error' && (
          <View style={styles.centerState}>
            <Text style={[styles.stateText, {color: colors.textSecondary}]}>
              {p.error}
            </Text>
          </View>
        )}

        {status === 'ready' && table && (
          <ScrollView
            contentContainerStyle={[
              styles.content,
              {paddingBottom: insets.bottom + spacing.xl},
            ]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled">
            <View style={centeredMaxWidth()}>
              {/* Verse-range picker — widen the passage in place. */}
              <View
                style={[
                  styles.rangeCard,
                  {backgroundColor: colors.card, borderColor: colors.border},
                ]}>
                <View style={styles.rangeHeaderRow}>
                  <Text
                    style={[styles.rangeTitle, {color: colors.textSecondary}]}>
                    {p.passageLabel}
                  </Text>
                  {reloading && (
                    <ActivityIndicator size="small" color={colors.primary} />
                  )}
                </View>
                <View style={styles.rangeRow}>
                  <View style={styles.stepperGroup}>
                    <Text
                      style={[
                        styles.stepperLabel,
                        {color: colors.textTertiary},
                      ]}>
                      {p.rangeStartLabel}
                    </Text>
                    <View style={styles.stepper}>
                      <StepButton
                        icon="remove-circle-outline"
                        onPress={() =>
                          handleRange(adjustStart(range, -1, maxVerse))
                        }
                        disabled={!canDecreaseStart(range)}
                        color={colors.primary}
                        disabledColor={colors.textTertiary}
                        label={`${p.decrease} ${p.rangeStartLabel}`}
                      />
                      <Text
                        style={[styles.stepperValue, {color: colors.text}]}
                        accessibilityLabel={`${p.rangeStartLabel} ${range.start}`}>
                        {range.start}
                      </Text>
                      <StepButton
                        icon="add-circle-outline"
                        onPress={() =>
                          handleRange(adjustStart(range, 1, maxVerse))
                        }
                        disabled={!canIncreaseStart(range)}
                        color={colors.primary}
                        disabledColor={colors.textTertiary}
                        label={`${p.increase} ${p.rangeStartLabel}`}
                      />
                    </View>
                  </View>

                  <Text
                    style={[styles.rangeDash, {color: colors.textTertiary}]}>
                    –
                  </Text>

                  <View style={styles.stepperGroup}>
                    <Text
                      style={[
                        styles.stepperLabel,
                        {color: colors.textTertiary},
                      ]}>
                      {p.rangeEndLabel}
                    </Text>
                    <View style={styles.stepper}>
                      <StepButton
                        icon="remove-circle-outline"
                        onPress={() =>
                          handleRange(adjustEnd(range, -1, maxVerse))
                        }
                        disabled={!canDecreaseEnd(range)}
                        color={colors.primary}
                        disabledColor={colors.textTertiary}
                        label={`${p.decrease} ${p.rangeEndLabel}`}
                      />
                      <Text
                        style={[styles.stepperValue, {color: colors.text}]}
                        accessibilityLabel={`${p.rangeEndLabel} ${range.end}`}>
                        {range.end}
                      </Text>
                      <StepButton
                        icon="add-circle-outline"
                        onPress={() =>
                          handleRange(adjustEnd(range, 1, maxVerse))
                        }
                        disabled={!canIncreaseEnd(range, maxVerse)}
                        color={colors.primary}
                        disabledColor={colors.textTertiary}
                        label={`${p.increase} ${p.rangeEndLabel}`}
                      />
                    </View>
                  </View>
                </View>
              </View>

              {/* The passage itself. */}
              <View
                style={[
                  styles.passageCard,
                  {backgroundColor: colors.card, borderColor: colors.border},
                ]}>
                {lines.map(line => (
                  <Text
                    key={line.verse}
                    style={[styles.passageText, {color: colors.text}]}>
                    <Text style={{color: colors.primary}}>{line.verse} </Text>
                    {line.text ?? ''}
                  </Text>
                ))}
              </View>

              {/* The outline scaffold. */}
              {PREP_SECTIONS.map(section => {
                const sc = p.sections[section];
                return (
                  <View
                    key={section}
                    style={[
                      styles.sectionCard,
                      {
                        backgroundColor: colors.card,
                        borderColor: colors.border,
                      },
                    ]}>
                    <View style={styles.sectionHeader}>
                      <Ionicons
                        name={SECTION_ICONS[section]}
                        size={18}
                        color={colors.primary}
                      />
                      <AppText
                        scaleRole="body"
                        style={[styles.sectionLabel, {color: colors.text}]}>
                        {sc.label}
                      </AppText>
                    </View>
                    <Text
                      style={[
                        styles.sectionPrompt,
                        {color: colors.textSecondary},
                      ]}>
                      {sc.prompt}
                    </Text>

                    {renderHelpsForSection(section)}

                    <TextInput
                      style={[
                        styles.noteInput,
                        {
                          color: colors.text,
                          backgroundColor: colors.background,
                          borderColor: colors.border,
                        },
                      ]}
                      value={drafts[section] ?? ''}
                      onChangeText={value => handleNoteChange(section, value)}
                      onBlur={() => handleNoteBlur(section)}
                      placeholder={p.notePlaceholder}
                      placeholderTextColor={colors.textTertiary}
                      multiline
                      textAlignVertical="top"
                      accessibilityLabel={sc.label}
                    />
                  </View>
                );
              })}

              {/* Export the assembled outline + the preparer's notes. */}
              <TouchableOpacity
                style={[
                  styles.exportButton,
                  {backgroundColor: colors.card, borderColor: colors.primary},
                ]}
                onPress={handleExport}
                accessibilityRole="button"
                accessibilityLabel={p.exportLabel}>
                <Ionicons
                  name={copied ? 'checkmark' : 'copy-outline'}
                  size={18}
                  color={colors.primary}
                />
                <AppText
                  scaleRole="compact"
                  style={[styles.exportText, {color: colors.primary}]}>
                  {copied ? p.copied : p.exportLabel}
                </AppText>
              </TouchableOpacity>

              {/* Pastoral guardrail. */}
              <View style={styles.guardrailWrap}>
                <Ionicons
                  name="shield-checkmark-outline"
                  size={16}
                  color={colors.textTertiary}
                />
                <Text style={[styles.guardrail, {color: colors.textTertiary}]}>
                  {p.guardrail}
                </Text>
              </View>
              <Text style={[styles.savedHint, {color: colors.textTertiary}]}>
                {p.savedHint}
              </Text>
            </View>
          </ScrollView>
        )}
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
  backButton: {marginBottom: spacing.sm},
  headerTextRow: {flexDirection: 'row', alignItems: 'center'},
  headerIcon: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    backgroundColor: staticColors.glassWhite18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  headerInfo: {flex: 1},
  headerLabel: {
    color: staticColors.white,
    opacity: 0.85,
    fontSize: fontSizes.sm,
  },
  headerTitle: {
    color: staticColors.white,
    fontSize: fontSizes.xl,
    fontWeight: '700',
  },
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.md,
  },
  stateText: {fontSize: fontSizes.md, textAlign: 'center'},
  content: {padding: spacing.lg},
  rangeCard: {
    borderRadius: borderRadius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  rangeHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  rangeTitle: {
    fontSize: fontSizes.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  rangeRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: spacing.md,
  },
  stepperGroup: {alignItems: 'center', gap: spacing.xs},
  stepperLabel: {fontSize: fontSizes.xs},
  stepper: {flexDirection: 'row', alignItems: 'center', gap: spacing.sm},
  stepButton: {padding: spacing.xs},
  stepperValue: {
    fontSize: fontSizes.lg,
    fontWeight: '700',
    minWidth: 28,
    textAlign: 'center',
  },
  rangeDash: {fontSize: fontSizes.lg, marginBottom: spacing.sm},
  passageCard: {
    borderRadius: borderRadius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  passageText: {
    fontSize: fontSizes.md,
    lineHeight: fontSizes.md * 1.5,
    marginRight: verseTextRightSlack(fontSizes.md),
  },
  sectionCard: {
    borderRadius: borderRadius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  sectionLabel: {fontWeight: '700', fontSize: fontSizes.md},
  sectionPrompt: {
    fontSize: fontSizes.sm,
    lineHeight: fontSizes.sm * 1.45,
    marginBottom: spacing.md,
  },
  helpGroup: {marginBottom: spacing.md, gap: spacing.sm},
  helpGroupLabel: {
    fontSize: fontSizes.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  helpCard: {
    borderRadius: borderRadius.md,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.xs,
  },
  helpTitle: {fontWeight: '700', fontSize: fontSizes.sm},
  helpMeta: {fontSize: fontSizes.xs},
  helpBody: {
    fontSize: fontSizes.sm,
    lineHeight: fontSizes.sm * 1.45,
  },
  refCard: {
    borderRadius: borderRadius.md,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  refHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  refLabel: {fontWeight: '700', fontSize: fontSizes.sm},
  refText: {
    fontSize: fontSizes.sm,
    lineHeight: fontSizes.sm * 1.45,
    marginRight: verseTextRightSlack(fontSizes.sm),
  },
  chipWrap: {flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm},
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    borderWidth: StyleSheet.hairlineWidth,
  },
  chipText: {fontSize: fontSizes.sm, fontWeight: '600'},
  noteInput: {
    minHeight: 88,
    borderRadius: borderRadius.md,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.md,
    fontSize: fontSizes.md,
    lineHeight: fontSizes.md * 1.4,
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: StyleSheet.hairlineWidth,
    marginTop: spacing.sm,
  },
  exportText: {fontWeight: '700', fontSize: fontSizes.md},
  guardrailWrap: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
    paddingHorizontal: spacing.xs,
  },
  guardrail: {
    flex: 1,
    fontSize: fontSizes.xs,
    lineHeight: fontSizes.xs * 1.5,
    fontStyle: 'italic',
  },
  savedHint: {
    fontSize: fontSizes.xs,
    textAlign: 'center',
    marginTop: spacing.md,
  },
});
