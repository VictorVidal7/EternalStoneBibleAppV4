/**
 * 📖 Shared study — a teacher's "Mesa de preparación" outline, READ-ONLY
 * (Sprint 109).
 *
 * Reached by the deep link
 *   eternalbible://features/study-shared?d=<base64url(study bundle)>
 *
 * The bundle (see src/lib/together) carries only the passage + the teacher's
 * own per-section prose. This screen re-assembles the curated helps locally
 * (cross-references, "Cristo en este pasaje", themes, book intro) via the SAME
 * pure assembler the editable Mesa uses, in the RECIPIENT's language and Bible
 * version — so a study shared in Spanish reads naturally for an English user.
 * Nothing is editable here and nothing leaves the device; incoming text is
 * treated as untrusted (already sanitized by the decoder) and clearly labelled
 * "shared with you". The reader can open the same passage in their OWN Mesa to
 * make their own notes.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import React, {useEffect, useMemo, useState} from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import {Stack, useLocalSearchParams, useRouter} from 'expo-router';
import {Ionicons} from '@expo/vector-icons';
import {LinearGradient} from 'expo-linear-gradient';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import {AppText as Text} from '@components/ui/AppText';
import {useTheme} from '@hooks/useTheme';
import {useLanguage} from '@hooks/useLanguage';
import {useBibleVersion} from '@hooks/useBibleVersion';
import {haptics} from '@lib/haptics';
import {staticColors, verseTextRightSlack} from '@/styles/designTokens';
import {centeredMaxWidth} from '@/styles/responsive';
import bibleDB from '@lib/database';
import {logger} from '@lib/utils/logger';
import {getBookById, getBookByName} from '@/constants/bible';
import {getBookIntro} from '@/constants/book-intros';
import {translations} from '@/i18n/translations';
import {
  buildPrepTable,
  formatPassageLabel,
  PREP_SECTIONS,
  type PrepSection,
  type PrepTable,
} from '@/features/study/prepTable';
import {
  christLangForVersion,
  formatChristRefLabel,
  parseChristRef,
  versionAbbrev,
} from '@/features/study/christConnections';
import {decodeTogetherParam, type StudyBundle} from '@lib/together';

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
  versionAbbrev: string;
  navBook?: string;
  navChapter?: number;
  navVerse?: number;
}
interface Intro {
  author: string;
  date: string;
  theme: string;
  context: string;
}

export default function SharedStudyScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {colors} = useTheme();
  const {t, language} = useLanguage();
  const ss = t.sharedStudy;
  const p = t.prepTable;
  const {selectedVersion} = useBibleVersion();

  const params = useLocalSearchParams<{d?: string}>();

  const bundle = useMemo<StudyBundle | null>(() => {
    if (!params.d) return null;
    const res = decodeTogetherParam(params.d);
    return res.ok && res.bundle.t === 'study' ? res.bundle : null;
  }, [params.d]);

  const book = bundle ? getBookById(bundle.b) : undefined;
  const table: PrepTable | null = useMemo(
    () =>
      book && bundle
        ? buildPrepTable(book.nameEn, bundle.c, bundle.sv, bundle.ev)
        : null,
    [book, bundle],
  );

  const [loading, setLoading] = useState(true);
  const [lines, setLines] = useState<VerseLine[]>([]);
  const [crossRows, setCrossRows] = useState<CrossRow[]>([]);
  const [christRows, setChristRows] = useState<ChristRow[]>([]);
  const [intro, setIntro] = useState<Intro | null>(null);

  useEffect(() => {
    let active = true;
    if (!table) {
      setLoading(false);
      return;
    }
    (async () => {
      setLoading(true);
      const version = selectedVersion.id;
      const lang = christLangForVersion(version);
      try {
        await bibleDB.initialize();

        const verseNums: number[] = [];
        for (let v = table.startVerse; v <= table.endVerse; v++)
          verseNums.push(v);
        const verseRows = await Promise.all(
          verseNums.map(async v => {
            const row = await bibleDB
              .getVerse(table.bookId, table.chapter, v, version)
              .catch(() => null);
            return {verse: v, text: row?.text ?? null};
          }),
        );

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
              const row = await bibleDB
                .getVerse(info.id, c, v, version)
                .catch(() => null);
              text = row?.text ?? null;
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

        const cc = translations[lang].christConnections;
        const christResolved = await Promise.all(
          table.christConnections.map(async conn => {
            const note = (cc.notes as Record<string, string>)[conn.id];
            let pointsTo: string | undefined;
            let fulfillmentText: string | undefined;
            let navBook: string | undefined;
            let navChapter: number | undefined;
            let navVerse: number | undefined;
            if (conn.fulfillment) {
              const fp = parseChristRef(conn.fulfillment);
              const fbook = fp ? getBookByName(fp.book) : undefined;
              if (fp && fbook) {
                pointsTo = formatChristRefLabel(conn.fulfillment, lang);
                navBook = lang === 'en' ? fbook.nameEn : fbook.name;
                navChapter = fp.chapter;
                navVerse = fp.verse;
                const frow = await bibleDB
                  .getVerse(fbook.id, fp.chapter, fp.verse, version)
                  .catch(() => null);
                fulfillmentText = frow?.text ?? undefined;
              }
            }
            return {
              id: conn.id,
              note,
              pointsTo,
              fulfillmentText,
              versionAbbrev: versionAbbrev(version),
              navBook,
              navChapter,
              navVerse,
            };
          }),
        );

        const bookIntro = getBookIntro(table.bookId, lang);

        if (!active) return;
        setLines(verseRows);
        setCrossRows(crossResolved);
        setChristRows(christResolved.filter(r => Boolean(r.note)));
        setIntro(bookIntro);
        setLoading(false);
      } catch (err) {
        logger.error('Shared study load failed', err as Error, {
          component: 'SharedStudyScreen',
        });
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [table, selectedVersion.id]);

  const headerGradient: [string, string] = [colors.primary, colors.primaryDark];
  const passageLabel = table
    ? formatPassageLabel(table, language as 'es' | 'en')
    : '';

  const openVerse = (bookNav: string, chapter: number, verse: number) => {
    haptics.tap();
    router.push({
      pathname: `/verse/${bookNav}/${chapter}` as never,
      params: {verse},
    });
  };

  const openInPrep = () => {
    if (!book || !bundle) return;
    haptics.tap();
    router.push({
      pathname: '/features/prep' as never,
      params: {
        book: book.nameEn,
        chapter: String(bundle.c),
        startVerse: String(bundle.sv),
        endVerse: String(bundle.ev),
      },
    } as never);
  };

  // ── Invalid / unsupported payload ──
  if (!bundle || !table || !book) {
    return (
      <View style={[styles.container, {backgroundColor: colors.background}]}>
        <Stack.Screen options={{headerShown: false}} />
        <View style={[styles.header, {paddingTop: insets.top + 12}]}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={[styles.backBtn, {borderColor: colors.border}]}
            accessibilityRole="button"
            accessibilityLabel={t.bible.back}
            hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
            <Ionicons name="arrow-back" size={22} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, {color: colors.text}]}>
            {ss.title}
          </Text>
        </View>
        <View style={styles.center}>
          <Ionicons
            name="alert-circle-outline"
            size={40}
            color={colors.textSecondary}
          />
          <Text style={[styles.invalid, {color: colors.textSecondary}]}>
            {ss.invalid}
          </Text>
        </View>
      </View>
    );
  }

  const renderHelps = (section: PrepSection) => {
    if (section === 'context' && intro) {
      return (
        <View
          style={[
            styles.helpCard,
            {backgroundColor: colors.card, borderColor: colors.border},
          ]}>
          <Text style={[styles.helpTitle, {color: colors.primary}]}>
            {p.bookIntroTitle}
          </Text>
          <Text style={[styles.helpMeta, {color: colors.textTertiary}]}>
            {intro.author} · {intro.date}
          </Text>
          <Text style={[styles.helpBody, {color: colors.textSecondary}]}>
            {intro.context}
          </Text>
        </View>
      );
    }
    if (section === 'interpretation' && crossRows.length > 0) {
      return (
        <View style={styles.helpGroup}>
          <Text style={[styles.helpGroupLabel, {color: colors.textTertiary}]}>
            {p.crossRefsTitle}
          </Text>
          {crossRows.map(row => (
            <TouchableOpacity
              key={row.key}
              style={[
                styles.refRow,
                {backgroundColor: colors.card, borderColor: colors.border},
              ]}
              disabled={!row.bookNav}
              onPress={() =>
                row.bookNav && openVerse(row.bookNav, row.chapter, row.verse)
              }
              accessibilityRole="button"
              accessibilityLabel={`${row.bookDisplay} ${row.chapter}:${row.verse}`}>
              <Text style={[styles.refLabel, {color: colors.primary}]}>
                {row.bookDisplay} {row.chapter}:{row.verse}
              </Text>
              {row.text ? (
                <Text
                  style={[styles.refText, {color: colors.textSecondary}]}
                  numberOfLines={3}>
                  {row.text}
                </Text>
              ) : null}
            </TouchableOpacity>
          ))}
        </View>
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
              {row.fulfillmentText && row.pointsTo ? (
                <Text
                  style={[styles.christVerse, {color: colors.text}]}
                  numberOfLines={4}>
                  {`“${row.fulfillmentText}” — ${row.pointsTo} · ${row.versionAbbrev}`}
                </Text>
              ) : null}
              {row.pointsTo && row.navBook ? (
                <TouchableOpacity
                  style={[styles.pointsTo, {borderColor: colors.primary}]}
                  onPress={() =>
                    openVerse(row.navBook!, row.navChapter!, row.navVerse!)
                  }
                  accessibilityRole="button"
                  accessibilityLabel={row.pointsTo}>
                  <Ionicons
                    name="arrow-forward"
                    size={13}
                    color={colors.primary}
                  />
                  <Text style={[styles.pointsToText, {color: colors.primary}]}>
                    {row.pointsTo}
                  </Text>
                </TouchableOpacity>
              ) : null}
            </View>
          ))}
        </View>
      );
    }
    return null;
  };

  return (
    <View style={[styles.container, {backgroundColor: colors.background}]}>
      <Stack.Screen options={{headerShown: false}} />
      <LinearGradient
        colors={headerGradient}
        start={{x: 0, y: 0}}
        end={{x: 0, y: 1}}
        style={[styles.gradientHeader, {paddingTop: insets.top + 12}]}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.headerCircle}
            accessibilityRole="button"
            accessibilityLabel={t.bible.back}>
            <Ionicons name="arrow-back" size={22} color={staticColors.white} />
          </TouchableOpacity>
        </View>
        <View style={styles.bannerRow}>
          <Ionicons
            name="eye-outline"
            size={14}
            color={staticColors.glassWhite85}
          />
          <Text style={styles.banner}>{ss.banner}</Text>
        </View>
        <Text style={styles.passage}>{passageLabel}</Text>
        {bundle.ti ? (
          <Text style={styles.by}>{ss.by.replace('{{who}}', bundle.ti)}</Text>
        ) : null}
      </LinearGradient>

      <ScrollView
        contentContainerStyle={[styles.body, centeredMaxWidth()]}
        keyboardShouldPersistTaps="handled">
        {/* Passage text */}
        {lines.length > 0 ? (
          <View
            style={[
              styles.passageBox,
              {backgroundColor: colors.card, borderLeftColor: colors.primary},
            ]}>
            {lines.map(l => (
              <Text key={l.verse} style={[styles.verse, {color: colors.text}]}>
                <Text style={[styles.verseNum, {color: colors.primary}]}>
                  {l.verse}{' '}
                </Text>
                {l.text ?? '…'}
              </Text>
            ))}
          </View>
        ) : null}

        {loading ? (
          <ActivityIndicator
            style={styles.loader}
            color={colors.primary}
            size="small"
          />
        ) : null}

        {/* Outline sections — show one when it has the teacher's note OR helps. */}
        {PREP_SECTIONS.map(section => {
          const note = bundle.n[section]?.trim();
          const helps = renderHelps(section);
          if (!note && !helps) return null;
          return (
            <View key={section} style={styles.section}>
              <Text style={[styles.sectionLabel, {color: colors.text}]}>
                {p.sections[section].label}
              </Text>
              {note ? (
                <View
                  style={[
                    styles.noteCard,
                    {
                      backgroundColor: colors.card,
                      borderLeftColor: colors.primary,
                    },
                  ]}>
                  <Text style={[styles.noteText, {color: colors.text}]}>
                    {note}
                  </Text>
                </View>
              ) : null}
              {helps}
            </View>
          );
        })}

        {/* Open the same passage in the reader's OWN editable Mesa. */}
        <TouchableOpacity
          style={[styles.openPrep, {borderColor: colors.primary}]}
          onPress={openInPrep}
          accessibilityRole="button"
          accessibilityLabel={ss.openInPrep}>
          <Ionicons name="create-outline" size={18} color={colors.primary} />
          <Text style={[styles.openPrepText, {color: colors.primary}]}>
            {ss.openInPrep}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1},
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {fontSize: 20, fontWeight: '700', flex: 1},
  center: {flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12},
  invalid: {fontSize: 15, textAlign: 'center', paddingHorizontal: 32},
  gradientHeader: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  headerTopRow: {flexDirection: 'row', alignItems: 'center'},
  headerCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: staticColors.glassWhite20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  bannerRow: {flexDirection: 'row', alignItems: 'center', gap: 6},
  banner: {
    color: staticColors.glassWhite85,
    fontSize: 12.5,
    fontWeight: '600',
  },
  passage: {
    color: staticColors.white,
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.4,
    marginTop: 6,
  },
  by: {color: staticColors.glassWhite85, fontSize: 14, marginTop: 2},
  body: {padding: 16, paddingBottom: 48},
  passageBox: {
    borderLeftWidth: 4,
    borderRadius: 12,
    padding: 14,
    gap: 8,
    marginBottom: 8,
  },
  verse: {
    fontSize: 16,
    lineHeight: 25,
    paddingRight: verseTextRightSlack(16),
  },
  verseNum: {fontSize: 12, fontWeight: '800'},
  loader: {marginVertical: 16},
  section: {marginTop: 18},
  sectionLabel: {
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 8,
  },
  noteCard: {
    borderLeftWidth: 3,
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
  },
  noteText: {fontSize: 15.5, lineHeight: 23},
  helpGroup: {gap: 8},
  helpGroupLabel: {
    fontSize: 11.5,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  helpCard: {borderWidth: 1, borderRadius: 12, padding: 14, gap: 6},
  helpTitle: {fontSize: 13, fontWeight: '700'},
  helpMeta: {fontSize: 12},
  helpBody: {fontSize: 14, lineHeight: 21},
  refRow: {borderWidth: 1, borderRadius: 12, padding: 12, gap: 4},
  refLabel: {fontSize: 14, fontWeight: '700'},
  refText: {
    fontSize: 13.5,
    lineHeight: 20,
    paddingRight: verseTextRightSlack(13.5),
  },
  christVerse: {
    fontSize: 14,
    lineHeight: 21,
    fontStyle: 'italic',
    paddingRight: verseTextRightSlack(14),
  },
  pointsTo: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  pointsToText: {fontSize: 12, fontWeight: '700'},
  openPrep: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderRadius: 14,
    paddingVertical: 14,
    marginTop: 28,
  },
  openPrepText: {fontSize: 15, fontWeight: '700'},
});
