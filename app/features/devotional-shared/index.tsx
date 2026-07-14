/**
 * 🗓️ Shared devotional calendar — a baked verse-a-day plan, READ-ONLY
 * (Sprint 110, the last of the four "juntos sin servidor" capabilities).
 *
 * Reached by the deep link
 *   eternalbible://features/devotional-shared?d=<base64url(cal bundle)>
 *
 * The bundle (see src/lib/together) carries only a start date + an ordered list
 * of days, each a single verse reference and an optional short note. With the
 * shared start date everyone sees the SAME verse for the SAME calendar day
 * (today = start + elapsed days). The verse TEXT is not shipped — only the
 * reference — so this screen loads it from the local DB in the RECIPIENT's own
 * Bible version; only the creator's notes travel. Nothing is editable and
 * nothing leaves the device; incoming text is treated as untrusted (already
 * sanitized by the decoder) and clearly labelled "shared with you".
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
import {getBookById} from '@/constants/bible';
import {addDaysISO, decodeTogetherParam, type CalBundle} from '@lib/together';

interface DayRow {
  index: number; // 0-based
  dateISO: string;
  bookId: number;
  bookNav: string;
  bookDisplay: string;
  chapter: number;
  verse: number;
  note?: string;
  text: string | null;
}

/** Whole days from a `YYYY-MM-DD` start to `now`, in the user's LOCAL calendar. */
function daysSince(startISO: string, now: Date): number {
  const [y, m, d] = startISO.split('-').map(Number);
  const start = new Date(y, m - 1, d).getTime();
  const today = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  ).getTime();
  return Math.round((today - start) / 86_400_000);
}

function formatDate(iso: string, language: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  try {
    return new Date(y, m - 1, d).toLocaleDateString(
      language === 'en' ? 'en-US' : 'es-ES',
      {weekday: 'long', day: 'numeric', month: 'long'},
    );
  } catch {
    return iso;
  }
}

export default function SharedDevotionalScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {colors, gradient, highContrast} = useTheme();
  const {t, language} = useLanguage();
  const dv = t.devotionalShared;
  const {selectedVersion} = useBibleVersion();

  const params = useLocalSearchParams<{d?: string}>();

  const bundle = useMemo<CalBundle | null>(() => {
    if (!params.d) return null;
    const res = decodeTogetherParam(params.d);
    return res.ok && res.bundle.t === 'cal' ? res.bundle : null;
  }, [params.d]);

  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<DayRow[]>([]);

  useEffect(() => {
    let active = true;
    if (!bundle) {
      setLoading(false);
      return;
    }
    (async () => {
      setLoading(true);
      const version = selectedVersion.id;
      try {
        await bibleDB.initialize();
        const resolved = await Promise.all(
          bundle.d.map(async (day, index) => {
            const [bookId, chapter, verse] = day.r;
            const info = getBookById(bookId);
            const display = info
              ? language === 'en'
                ? info.nameEn
                : info.name
              : String(bookId);
            const nav = info
              ? language === 'en'
                ? info.nameEn
                : info.name
              : '';
            const row = await bibleDB
              .getVerse(bookId, chapter, verse, version)
              .catch(() => null);
            return {
              index,
              dateISO: addDaysISO(bundle.s, index),
              bookId,
              bookNav: nav,
              bookDisplay: display,
              chapter,
              verse,
              note: day.n,
              text: row?.text ?? null,
            } satisfies DayRow;
          }),
        );
        if (!active) return;
        setRows(resolved);
        setLoading(false);
      } catch (err) {
        logger.error('Shared devotional load failed', err as Error, {
          component: 'SharedDevotionalScreen',
        });
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [bundle, selectedVersion.id, language]);

  const headerGradient: readonly [string, string, ...string[]] = highContrast
    ? (gradient.headerColors as readonly [string, string, ...string[]])
    : [colors.primary, colors.primaryDark];

  // Which day is "today" — clamped into range; plus the not-started / finished
  // states so the focus card always shows something meaningful.
  const {focusIdx, status} = useMemo(() => {
    if (!bundle) return {focusIdx: 0, status: 'active' as const};
    const since = daysSince(bundle.s, new Date());
    if (since < 0) return {focusIdx: 0, status: 'upcoming' as const};
    if (since >= bundle.d.length)
      return {focusIdx: bundle.d.length - 1, status: 'finished' as const};
    return {focusIdx: since, status: 'active' as const};
  }, [bundle]);

  const openVerse = (row: DayRow) => {
    if (!row.bookNav) return;
    haptics.tap();
    router.push({
      pathname: `/verse/${row.bookNav}/${row.chapter}` as never,
      params: {verse: row.verse},
    });
  };

  // ── Invalid / unsupported payload ──
  if (!bundle) {
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
            {dv.title}
          </Text>
        </View>
        <View style={styles.center}>
          <Ionicons
            name="alert-circle-outline"
            size={40}
            color={colors.textSecondary}
          />
          <Text style={[styles.invalid, {color: colors.textSecondary}]}>
            {dv.invalid}
          </Text>
        </View>
      </View>
    );
  }

  const focus = rows[focusIdx];
  const statusLine =
    status === 'upcoming'
      ? dv.startsOn.replace('{{date}}', formatDate(bundle.s, language))
      : status === 'finished'
        ? dv.finished
        : dv.todayLabel;

  const renderVerse = (row: DayRow) => (
    <Text style={[styles.verseText, {color: colors.text}]}>
      <Text style={[styles.refInline, {color: colors.primary}]}>
        {row.bookDisplay} {row.chapter}:{row.verse}
        {'  '}
      </Text>
      {row.text ? `“${row.text}”` : '…'}
    </Text>
  );

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
          <Text style={styles.banner}>{dv.banner}</Text>
        </View>
        <Text style={styles.titleText}>{bundle.ti || dv.title}</Text>
        <Text style={styles.meta}>
          {dv.daysMeta.replace('{{n}}', String(bundle.d.length))}
        </Text>
      </LinearGradient>

      <ScrollView contentContainerStyle={[styles.body, centeredMaxWidth()]}>
        {/* Focus (today / upcoming / finished) card */}
        {focus ? (
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => openVerse(focus)}
            disabled={!focus.bookNav}
            style={[
              styles.todayCard,
              {backgroundColor: colors.card, borderColor: colors.primary},
            ]}
            accessibilityRole="button"
            accessibilityLabel={`${focus.bookDisplay} ${focus.chapter}:${focus.verse}`}>
            <View style={styles.todayTopRow}>
              <View
                style={[styles.todayBadge, {backgroundColor: colors.primary}]}>
                <Text
                  style={[styles.todayBadgeText, {color: staticColors.white}]}>
                  {statusLine}
                </Text>
              </View>
              <Text style={[styles.dayNum, {color: colors.textSecondary}]}>
                {dv.dayN.replace('{{n}}', String(focusIdx + 1))} ·{' '}
                {formatDate(focus.dateISO, language)}
              </Text>
            </View>
            {renderVerse(focus)}
            {focus.note ? (
              <Text style={[styles.noteText, {color: colors.textSecondary}]}>
                {focus.note}
              </Text>
            ) : null}
          </TouchableOpacity>
        ) : null}

        {loading ? (
          <ActivityIndicator
            style={styles.loader}
            color={colors.primary}
            size="small"
          />
        ) : null}

        {/* All days */}
        {rows.length > 1 ? (
          <>
            <Text style={[styles.sectionLabel, {color: colors.text}]}>
              {dv.allDays}
            </Text>
            {rows.map(row => {
              const isFocus = row.index === focusIdx;
              return (
                <TouchableOpacity
                  key={row.index}
                  activeOpacity={0.8}
                  onPress={() => openVerse(row)}
                  disabled={!row.bookNav}
                  style={[
                    styles.dayRow,
                    {backgroundColor: colors.card, borderColor: colors.border},
                    isFocus && {borderColor: colors.primary},
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={`${dv.dayN.replace(
                    '{{n}}',
                    String(row.index + 1),
                  )}: ${row.bookDisplay} ${row.chapter}:${row.verse}`}>
                  <View style={styles.dayRowHead}>
                    <Text style={[styles.dayRowDay, {color: colors.primary}]}>
                      {dv.dayN.replace('{{n}}', String(row.index + 1))}
                    </Text>
                    <Text
                      style={[styles.dayRowRef, {color: colors.textSecondary}]}>
                      {row.bookDisplay} {row.chapter}:{row.verse}
                    </Text>
                  </View>
                  {row.text ? (
                    <Text
                      style={[styles.dayRowText, {color: colors.text}]}
                      numberOfLines={2}>
                      {row.text}
                    </Text>
                  ) : null}
                  {row.note ? (
                    <Text
                      style={[styles.dayRowNote, {color: colors.textTertiary}]}
                      numberOfLines={2}>
                      {row.note}
                    </Text>
                  ) : null}
                </TouchableOpacity>
              );
            })}
          </>
        ) : null}
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
  banner: {color: staticColors.glassWhite85, fontSize: 12.5, fontWeight: '600'},
  titleText: {
    color: staticColors.white,
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.4,
    marginTop: 6,
  },
  meta: {color: staticColors.glassWhite85, fontSize: 14, marginTop: 2},
  body: {padding: 16, paddingBottom: 48},
  todayCard: {
    borderWidth: 1.5,
    borderRadius: 16,
    padding: 16,
    gap: 10,
  },
  todayTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  todayBadge: {borderRadius: 999, paddingHorizontal: 12, paddingVertical: 4},
  todayBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  dayNum: {flex: 1, fontSize: 12.5, textAlign: 'right'},
  verseText: {
    fontSize: 17,
    lineHeight: 26,
    paddingRight: verseTextRightSlack(17),
  },
  refInline: {fontSize: 13, fontWeight: '800'},
  noteText: {
    fontSize: 15,
    lineHeight: 22,
    fontStyle: 'italic',
    paddingRight: verseTextRightSlack(15),
  },
  loader: {marginVertical: 16},
  sectionLabel: {
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginTop: 24,
    marginBottom: 10,
  },
  dayRow: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    gap: 5,
    marginBottom: 8,
  },
  dayRowHead: {flexDirection: 'row', alignItems: 'center', gap: 10},
  dayRowDay: {fontSize: 13, fontWeight: '800'},
  dayRowRef: {flex: 1, fontSize: 13, fontWeight: '600'},
  dayRowText: {
    fontSize: 14.5,
    lineHeight: 21,
    paddingRight: verseTextRightSlack(14.5),
  },
  dayRowNote: {
    fontSize: 13.5,
    lineHeight: 20,
    fontStyle: 'italic',
    paddingRight: verseTextRightSlack(13.5),
  },
});
