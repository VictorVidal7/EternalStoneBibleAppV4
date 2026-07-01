/**
 * 🙏 SCRIPTURE PRAYER WALKTHROUGH — one passage, verse by verse.
 *
 * Walks the reader through one passage from [[scripturePrayers]] one verse
 * at a time: the verse text (in the reader's selected Bible version) and an
 * OPTIONAL blank field to write a personal prayer response — nothing
 * suggested, nothing prescribed (see the hub's disclaimer). On finishing, if
 * anything was written, offers to save it as one entry in the prayer
 * journal via [[usePrayerJournal]].
 *
 * Deliberately spare compared to the rest of the app's guided walkthroughs:
 * no progress badges, no favorites, no achievements, no watermark — this is
 * prayer, not a collection to complete.
 *
 * Reached from the hub `/features/prayer/scripture`.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import React, {useMemo, useState} from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import {Stack, useRouter, useLocalSearchParams} from 'expo-router';
import {Ionicons} from '@expo/vector-icons';
import {LinearGradient} from 'expo-linear-gradient';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTheme} from '@hooks/useTheme';
import {centeredMaxWidth} from '@/styles/responsive';
import {useLanguage} from '@hooks/useLanguage';
import {useBibleVersion} from '@hooks/useBibleVersion';
import {useToast} from '@context/ToastContext';
import {usePrayerJournal} from '@hooks/usePrayerJournal';
import {haptics} from '@lib/haptics';
import {AppText} from '@components/ui/AppText';
import bibleDB from '@lib/database';
import {getBookByName} from '@/constants/bible';
import {parseChristRef} from '@/features/study/christConnections';
import {getScripturePrayerById} from '@/features/prayer/scripturePrayers';
import {
  borderRadius,
  fontSize as fontSizes,
  spacing,
  staticColors,
} from '@/styles/designTokens';

type LoadStatus = 'loading' | 'ready' | 'error';

export default function ScripturePrayerWalkScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {colors} = useTheme();
  const {t} = useLanguage();
  const {selectedVersion} = useBibleVersion();
  const toast = useToast();
  const {add: addToJournal} = usePrayerJournal();
  const ts = t.scripturePrayer;
  const params = useLocalSearchParams<{passageId?: string}>();
  const passage = getScripturePrayerById(params.passageId ?? '');
  const passageMeta = (
    ts.passages as Record<string, {title: string; context: string}>
  )[params.passageId ?? ''];

  const total = passage?.refs.length ?? 0;
  // -1 = intro (context note), 0..total-1 = a verse, total = finished.
  const [phase, setPhase] = useState(-1);
  const [status, setStatus] = useState<LoadStatus>('ready');
  const [verseText, setVerseText] = useState<string | null>(null);
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState<Record<number, string>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const localizedRef = useMemo(
    () => (ref: string) => {
      const parsed = parseChristRef(ref);
      if (!parsed) return null;
      const book = getBookByName(parsed.book);
      if (!book) return null;
      const display =
        selectedVersion.language === 'es' ? book.name : book.nameEn;
      return {
        display,
        reference: `${display} ${parsed.chapter}:${parsed.verse}`,
        bookId: book.id,
        chapter: parsed.chapter,
        verse: parsed.verse,
      };
    },
    [selectedVersion.language],
  );

  React.useEffect(() => {
    if (!passage) return;
    const ref = phase >= 0 && phase < total ? passage.refs[phase] : null;
    if (!ref) return;
    let cancelled = false;
    setStatus('loading');
    void (async () => {
      try {
        await bibleDB.initialize();
        const info = localizedRef(ref);
        if (!info) {
          if (!cancelled) {
            setVerseText(null);
            setReference(ref);
            setStatus('ready');
          }
          return;
        }
        const row = await bibleDB
          .getVerse(info.bookId, info.chapter, info.verse, selectedVersion.id)
          .catch(() => null);
        if (cancelled) return;
        setVerseText(row?.text ?? null);
        setReference(info.reference);
        setStatus('ready');
      } catch {
        if (!cancelled) setStatus('error');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [phase, total, passage, selectedVersion.id, localizedRef]);

  if (!passage || !passageMeta) {
    return (
      <View style={[styles.container, {backgroundColor: colors.background}]}>
        <Stack.Screen options={{headerShown: false}} />
      </View>
    );
  }

  const headerGradient: [string, string] = [colors.primary, colors.primaryDark];

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/features/prayer/scripture' as never);
  };

  const go = (delta: number) => {
    haptics.tap();
    setPhase(p => Math.max(-1, Math.min(total, p + delta)));
  };

  const writtenNotes = Object.entries(notes)
    .filter(([, text]) => text.trim().length > 0)
    .map(([index, text]) => ({
      ref: passage.refs[Number(index)],
      text: text.trim(),
    }));

  const handleSave = async () => {
    if (saving || writtenNotes.length === 0) return;
    setSaving(true);
    haptics.tap();
    const detail = writtenNotes
      .map(n => {
        const info = localizedRef(n.ref);
        return `${info?.reference ?? n.ref}: ${n.text}`;
      })
      .join('\n\n');
    await addToJournal({
      title: passageMeta.title,
      detail,
      category: 'supplication',
    });
    setSaving(false);
    setSaved(true);
    toast.success(ts.savedToast);
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
            onPress={goBack}
            accessibilityRole="button"
            accessibilityLabel={t.bible.back}>
            <Ionicons name="arrow-back" size={24} color={staticColors.white} />
          </TouchableOpacity>
          <AppText scaleRole="display" style={styles.headerTitle}>
            {passageMeta.title}
          </AppText>
          {phase >= 0 && phase < total && (
            <AppText scaleRole="compact" style={styles.headerProgress}>
              {ts.verseProgress
                .replace('{{n}}', String(phase + 1))
                .replace('{{total}}', String(total))}
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
          {phase === -1 && (
            <View style={styles.introBlock}>
              <Ionicons name="rose" size={44} color={colors.primary} />
              <AppText
                style={[styles.contextText, {color: colors.textSecondary}]}>
                {passageMeta.context}
              </AppText>
              <TouchableOpacity
                style={[styles.primaryBtn, {backgroundColor: colors.primary}]}
                onPress={() => go(1)}
                accessibilityRole="button"
                accessibilityLabel={ts.begin}>
                <AppText
                  style={[styles.primaryBtnText, {color: staticColors.white}]}>
                  {ts.begin}
                </AppText>
                <Ionicons
                  name="arrow-forward"
                  size={18}
                  color={staticColors.white}
                />
              </TouchableOpacity>
            </View>
          )}

          {phase >= 0 && phase < total && (
            <View style={styles.stepBlock}>
              {status === 'loading' ? (
                <View style={styles.centerState}>
                  <ActivityIndicator size="large" color={colors.primary} />
                </View>
              ) : (
                <>
                  <View
                    style={[
                      styles.verseCard,
                      {
                        backgroundColor: colors.card,
                        borderColor: colors.border,
                      },
                    ]}>
                    <AppText
                      scaleRole="compact"
                      style={[styles.verseRef, {color: colors.primary}]}>
                      {reference}
                    </AppText>
                    <AppText style={[styles.verseText, {color: colors.text}]}>
                      {verseText ?? ts.missingText}
                    </AppText>
                  </View>

                  <View>
                    <AppText
                      scaleRole="compact"
                      style={[
                        styles.inputLabel,
                        {color: colors.textSecondary},
                      ]}>
                      {ts.yourPrayerLabel}
                    </AppText>
                    <TextInput
                      value={notes[phase] ?? ''}
                      onChangeText={text =>
                        setNotes(prev => ({...prev, [phase]: text}))
                      }
                      placeholder={ts.yourPrayerPlaceholder}
                      placeholderTextColor={colors.textTertiary}
                      multiline
                      style={[
                        styles.input,
                        {
                          color: colors.text,
                          backgroundColor: colors.card,
                          borderColor: colors.border,
                        },
                      ]}
                    />
                  </View>
                </>
              )}

              <View style={styles.navRow}>
                <TouchableOpacity
                  style={[styles.navBtn, {borderColor: colors.border}]}
                  onPress={() => go(-1)}
                  accessibilityRole="button"
                  accessibilityLabel={ts.prev}>
                  <Ionicons
                    name="arrow-back"
                    size={16}
                    color={colors.textSecondary}
                  />
                  <AppText
                    style={[styles.navBtnText, {color: colors.textSecondary}]}>
                    {ts.prev}
                  </AppText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.navBtn,
                    styles.navBtnPrimary,
                    {backgroundColor: colors.primary},
                  ]}
                  onPress={() => go(1)}
                  accessibilityRole="button"
                  accessibilityLabel={
                    phase === total - 1 ? ts.finish : ts.next
                  }>
                  <AppText
                    style={[styles.navBtnText, {color: staticColors.white}]}>
                    {phase === total - 1 ? ts.finish : ts.next}
                  </AppText>
                  <Ionicons
                    name={phase === total - 1 ? 'checkmark' : 'arrow-forward'}
                    size={16}
                    color={staticColors.white}
                  />
                </TouchableOpacity>
              </View>
            </View>
          )}

          {phase >= total && (
            <View style={styles.introBlock}>
              <Ionicons
                name="checkmark-circle"
                size={56}
                color={colors.primary}
              />
              <AppText
                scaleRole="display"
                style={[styles.finishedTitle, {color: colors.text}]}>
                {ts.finishedTitle}
              </AppText>
              <AppText
                style={[styles.introText, {color: colors.textSecondary}]}>
                {ts.finishedBody}
              </AppText>

              {writtenNotes.length > 0 && !saved && (
                <>
                  <AppText
                    style={[styles.introText, {color: colors.textSecondary}]}>
                    {ts.saveJournalPrompt}
                  </AppText>
                  <TouchableOpacity
                    style={[
                      styles.primaryBtn,
                      {backgroundColor: colors.primary},
                    ]}
                    onPress={() => void handleSave()}
                    disabled={saving}
                    accessibilityRole="button"
                    accessibilityLabel={ts.saveJournalButton}>
                    {saving ? (
                      <ActivityIndicator color={staticColors.white} />
                    ) : (
                      <AppText
                        style={[
                          styles.primaryBtnText,
                          {color: staticColors.white},
                        ]}>
                        {ts.saveJournalButton}
                      </AppText>
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={goBack}
                    accessibilityRole="button"
                    accessibilityLabel={ts.discardButton}>
                    <AppText
                      style={[
                        styles.discardText,
                        {color: colors.textTertiary},
                      ]}>
                      {ts.discardButton}
                    </AppText>
                  </TouchableOpacity>
                </>
              )}

              {(writtenNotes.length === 0 || saved) && (
                <TouchableOpacity
                  style={[styles.primaryBtn, {backgroundColor: colors.primary}]}
                  onPress={goBack}
                  accessibilityRole="button"
                  accessibilityLabel={ts.done}>
                  <AppText
                    style={[
                      styles.primaryBtnText,
                      {color: staticColors.white},
                    ]}>
                    {ts.done}
                  </AppText>
                </TouchableOpacity>
              )}
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
  headerTitle: {
    color: staticColors.white,
    fontSize: fontSizes['2xl'],
    fontWeight: '800',
    marginTop: spacing.sm,
  },
  headerProgress: {
    color: staticColors.glassWhite90,
    fontSize: fontSizes.sm,
    fontWeight: '600',
    marginTop: spacing.xs,
  },
  content: {padding: spacing.lg, gap: spacing.lg, alignItems: 'center'},
  introBlock: {
    alignItems: 'center',
    gap: spacing.lg,
    paddingTop: spacing.xl,
    paddingHorizontal: spacing.sm,
  },
  contextText: {
    fontSize: fontSizes.lg,
    lineHeight: fontSizes.lg * 1.5,
    textAlign: 'center',
  },
  introText: {
    fontSize: fontSizes.md,
    lineHeight: fontSizes.md * 1.5,
    textAlign: 'center',
  },
  finishedTitle: {fontSize: fontSizes['2xl'], fontWeight: '800'},
  discardText: {fontSize: fontSizes.sm, fontWeight: '600'},
  centerState: {alignItems: 'center', paddingVertical: spacing['2xl']},
  stepBlock: {alignSelf: 'stretch', gap: spacing.lg},
  verseCard: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  verseRef: {
    fontSize: fontSizes.sm,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  verseText: {fontSize: fontSizes.md, lineHeight: fontSizes.md * 1.55},
  inputLabel: {
    fontSize: fontSizes.sm,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  input: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: fontSizes.md,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  navRow: {flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs},
  navBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
  },
  navBtnPrimary: {borderWidth: 0},
  navBtnText: {fontSize: fontSizes.md, fontWeight: '700'},
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
});
