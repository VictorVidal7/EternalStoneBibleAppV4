/**
 * 🗓️ Devotional builder — bake a verse-a-day calendar to share (Sprint 110).
 *
 * The creator side of the last "juntos sin servidor" capability. Pick a verse
 * (plus an optional short note) for each of N consecutive days, set a start
 * date, and share ONE link: everyone who opens it sees the SAME verse for the
 * SAME calendar day, 100% offline, zero backend/cost. The whole calendar rides
 * in the link (see src/lib/together `makeCalBundle` / `encodeHttpsLink`); only
 * the verse REFERENCE travels, so each recipient reads it in their own version.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import {useEffect, useState} from 'react';
import {
  FlatList,
  Modal,
  ScrollView,
  Share,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {Stack, useRouter} from 'expo-router';
import {Ionicons} from '@expo/vector-icons';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import {AppText as Text} from '@components/ui/AppText';
import {useTheme} from '@hooks/useTheme';
import {useLanguage} from '@hooks/useLanguage';
import {useBibleVersion} from '@hooks/useBibleVersion';
import {useToast} from '@context/ToastContext';
import {haptics} from '@lib/haptics';
import {centeredMaxWidth} from '@/styles/responsive';
import {focusTrapProps} from '@lib/a11y/focusTrap';
import bibleDB from '@lib/database';
import {BIBLE_BOOKS, getBookById} from '@/constants/bible';
import {
  addDaysISO,
  CAL_NOTE_MAX,
  encodeHttpsLink,
  makeCalBundle,
  MAX_CAL_DAYS,
  todayDateISO,
} from '@lib/together';

interface DraftDay {
  bookId: number;
  chapter: number;
  verse: number;
  note: string;
}

const VERSE_FALLBACK_MAX = 176; // Psalm 119 — used until the DB count loads.

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

export default function DevotionalBuilderScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {colors} = useTheme();
  const {t, language} = useLanguage();
  const db = t.devotionalBuilder;
  const toast = useToast();
  const {selectedVersion} = useBibleVersion();
  // Book names follow the READING version's language (RVR1960 → "Juan");
  // `language` is kept only for the date formatting.
  const bookNameLang: 'es' | 'en' =
    selectedVersion.language === 'es' ? 'es' : 'en';

  const today = todayDateISO();
  const [title, setTitle] = useState('');
  const [startDate, setStartDate] = useState(today);
  const [days, setDays] = useState<DraftDay[]>([]);

  // Add-day modal state.
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickBookId, setPickBookId] = useState<number | null>(null);
  const [chapter, setChapter] = useState(1);
  const [verse, setVerse] = useState(1);
  const [maxVerse, setMaxVerse] = useState(VERSE_FALLBACK_MAX);

  const bookName = (id: number) => {
    const b = getBookById(id);
    if (!b) return String(id);
    return bookNameLang === 'en' ? b.nameEn : b.name;
  };

  const pickBook = pickBookId != null ? getBookById(pickBookId) : undefined;
  const maxChapter = pickBook?.chapters ?? 1;

  // Load the verse count for the chosen book+chapter so the verse stepper can't
  // overshoot the chapter. Falls back to a safe max until the count arrives.
  useEffect(() => {
    let alive = true;
    if (pickBookId == null) return;
    (async () => {
      try {
        await bibleDB.initialize();
        const count = await bibleDB.getChapterVerseCount(
          pickBookId,
          chapter,
          selectedVersion.id,
        );
        if (!alive) return;
        const max = count > 0 ? count : VERSE_FALLBACK_MAX;
        setMaxVerse(max);
        setVerse(v => Math.min(v, max));
      } catch {
        if (alive) setMaxVerse(VERSE_FALLBACK_MAX);
      }
    })();
    return () => {
      alive = false;
    };
  }, [pickBookId, chapter, selectedVersion.id]);

  const openPicker = () => {
    haptics.tap();
    setPickBookId(null);
    setChapter(1);
    setVerse(1);
    setMaxVerse(VERSE_FALLBACK_MAX);
    setPickerOpen(true);
  };

  const chooseBook = (id: number) => {
    haptics.tap();
    setPickBookId(id);
    setChapter(1);
    setVerse(1);
  };

  const confirmDay = () => {
    if (pickBookId == null) return;
    haptics.tap();
    setDays(prev => [...prev, {bookId: pickBookId, chapter, verse, note: ''}]);
    setPickerOpen(false);
  };

  const removeDay = (index: number) => {
    haptics.tap();
    setDays(prev => prev.filter((_, i) => i !== index));
  };

  const setNote = (index: number, note: string) => {
    setDays(prev => prev.map((d, i) => (i === index ? {...d, note} : d)));
  };

  const startDisabledBack = startDate <= today;

  const onShare = async () => {
    const bundle = makeCalBundle(
      startDate,
      title,
      days.map(d => ({
        bookId: d.bookId,
        chapter: d.chapter,
        verse: d.verse,
        note: d.note.trim() || undefined,
      })),
    );
    if (!bundle) {
      toast.info(db.needOneDay);
      return;
    }
    haptics.success();
    const link = encodeHttpsLink(bundle);
    const heading = title.trim() || db.title;
    const message = db.shareMessage
      .replace('{{title}}', heading)
      .replace('{{link}}', link);
    Share.share({message}).catch(() => undefined);
  };

  const canShare = days.length > 0;

  const stepBtn = (
    label: string,
    onPress: () => void,
    disabled: boolean,
    icon: 'remove' | 'add',
  ) => (
    <TouchableOpacity
      style={[
        styles.stepBtn,
        {borderColor: colors.border},
        disabled && styles.disabled,
      ]}
      disabled={disabled}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}>
      <Ionicons name={icon} size={20} color={colors.text} />
    </TouchableOpacity>
  );

  const stepper = (
    value: number,
    dec: () => void,
    inc: () => void,
    min: number,
    max: number,
  ) => (
    <View style={styles.stepperRow}>
      {stepBtn('−1', dec, value <= min, 'remove')}
      <View style={styles.stepValue}>
        <Text style={[styles.stepValueText, {color: colors.text}]}>
          {value}
        </Text>
      </View>
      {stepBtn('+1', inc, value >= max, 'add')}
    </View>
  );

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
          {db.title}
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={[styles.body, centeredMaxWidth()]}
        keyboardShouldPersistTaps="handled">
        <Text style={[styles.intro, {color: colors.textSecondary}]}>
          {db.intro}
        </Text>

        {/* Title */}
        <Text style={[styles.label, {color: colors.text}]}>{db.nameLabel}</Text>
        <TextInput
          style={[
            styles.input,
            {
              color: colors.text,
              borderColor: colors.border,
              backgroundColor: colors.card,
            },
          ]}
          value={title}
          onChangeText={setTitle}
          placeholder={db.namePlaceholder}
          placeholderTextColor={colors.textSecondary}
          maxLength={60}
          returnKeyType="done"
        />

        {/* Start date */}
        <Text style={[styles.label, {color: colors.text}]}>
          {db.startLabel}
        </Text>
        <View style={[styles.startRow, {backgroundColor: colors.card}]}>
          <TouchableOpacity
            style={[
              styles.startStep,
              {borderColor: colors.border},
              startDisabledBack && styles.disabled,
            ]}
            disabled={startDisabledBack}
            onPress={() => {
              haptics.tap();
              setStartDate(d => addDaysISO(d, -1));
            }}
            accessibilityRole="button"
            accessibilityLabel="-1">
            <Ionicons name="remove" size={18} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.startLabelWrap}>
            <Ionicons
              name="calendar-outline"
              size={16}
              color={colors.primary}
            />
            <Text style={[styles.startText, {color: colors.text}]}>
              {startDate === today
                ? db.startToday
                : formatDate(startDate, language)}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.startStep, {borderColor: colors.border}]}
            onPress={() => {
              haptics.tap();
              setStartDate(d => addDaysISO(d, 1));
            }}
            accessibilityRole="button"
            accessibilityLabel="+1">
            <Ionicons name="add" size={18} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* Days */}
        <Text style={[styles.label, {color: colors.text}]}>
          {db.daysLabel}
          {days.length > 0 ? ` · ${days.length}` : ''}
        </Text>
        {days.length === 0 ? (
          <Text style={[styles.empty, {color: colors.textSecondary}]}>
            {db.noDays}
          </Text>
        ) : (
          days.map((d, i) => (
            <View
              key={`${d.bookId}-${d.chapter}-${d.verse}-${i}`}
              style={[styles.dayCard, {backgroundColor: colors.card}]}>
              <View style={styles.dayCardHead}>
                <Text style={[styles.dayCardDay, {color: colors.primary}]}>
                  {db.dayN.replace('{{n}}', String(i + 1))}
                </Text>
                <Text style={[styles.dayCardRef, {color: colors.text}]}>
                  {bookName(d.bookId)} {d.chapter}:{d.verse}
                </Text>
                <TouchableOpacity
                  onPress={() => removeDay(i)}
                  accessibilityRole="button"
                  accessibilityLabel={db.removeDay}
                  hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
                  <Ionicons
                    name="close-circle"
                    size={20}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>
              <TextInput
                style={[styles.noteInput, {color: colors.text}]}
                value={d.note}
                onChangeText={text => setNote(i, text)}
                placeholder={db.notePlaceholder}
                placeholderTextColor={colors.textSecondary}
                maxLength={CAL_NOTE_MAX}
                multiline
              />
            </View>
          ))
        )}
        <TouchableOpacity
          style={[
            styles.addBtn,
            {borderColor: colors.primary},
            days.length >= MAX_CAL_DAYS && styles.disabled,
          ]}
          disabled={days.length >= MAX_CAL_DAYS}
          onPress={openPicker}
          accessibilityRole="button"
          accessibilityLabel={db.addDay}>
          <Ionicons name="add" size={20} color={colors.primary} />
          <Text style={[styles.addBtnText, {color: colors.primary}]}>
            {db.addDay}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.shareBtn,
            {backgroundColor: colors.primary},
            !canShare && styles.disabled,
          ]}
          disabled={!canShare}
          onPress={onShare}
          accessibilityRole="button"
          accessibilityLabel={db.share}>
          <Ionicons
            name="share-social-outline"
            size={20}
            color={colors.onPrimary}
          />
          <Text style={[styles.shareBtnText, {color: colors.onPrimary}]}>
            {db.share}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Add-day modal */}
      <Modal
        visible={pickerOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setPickerOpen(false)}>
        <View style={[styles.overlay, {backgroundColor: colors.overlay}]}>
          <View
            style={[
              styles.modalCard,
              {backgroundColor: colors.card, borderColor: colors.border},
            ]}
            {...focusTrapProps()}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, {color: colors.text}]}>
                {pickBook ? bookName(pickBook.id) : db.pickVerse}
              </Text>
              <TouchableOpacity
                onPress={() => setPickerOpen(false)}
                accessibilityRole="button"
                accessibilityLabel={t.close}
                hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {pickBookId == null ? (
              <FlatList
                data={BIBLE_BOOKS}
                keyExtractor={b => String(b.id)}
                style={styles.bookList}
                keyboardShouldPersistTaps="handled"
                renderItem={({item}) => (
                  <TouchableOpacity
                    style={[styles.bookRow, {borderBottomColor: colors.border}]}
                    onPress={() => chooseBook(item.id)}
                    accessibilityRole="button">
                    <Text style={[styles.bookRowText, {color: colors.text}]}>
                      {bookNameLang === 'en' ? item.nameEn : item.name}
                    </Text>
                    <Text
                      style={[
                        styles.bookRowMeta,
                        {color: colors.textSecondary},
                      ]}>
                      {item.chapters}
                    </Text>
                  </TouchableOpacity>
                )}
              />
            ) : (
              <View style={styles.pickerBody}>
                <Text style={[styles.rangeLabel, {color: colors.text}]}>
                  {db.chapter}
                </Text>
                {stepper(
                  chapter,
                  () => setChapter(v => Math.max(1, v - 1)),
                  () => setChapter(v => Math.min(maxChapter, v + 1)),
                  1,
                  maxChapter,
                )}
                <Text style={[styles.rangeLabel, {color: colors.text}]}>
                  {db.verse}
                </Text>
                {stepper(
                  verse,
                  () => setVerse(v => Math.max(1, v - 1)),
                  () => setVerse(v => Math.min(maxVerse, v + 1)),
                  1,
                  maxVerse,
                )}

                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={[styles.changeBookBtn, {borderColor: colors.border}]}
                    onPress={() => setPickBookId(null)}
                    accessibilityRole="button"
                    accessibilityLabel={db.changeBook}>
                    <Text style={[styles.changeBookText, {color: colors.text}]}>
                      {db.changeBook}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.confirmBtn,
                      {backgroundColor: colors.primary},
                    ]}
                    onPress={confirmDay}
                    accessibilityRole="button"
                    accessibilityLabel={db.addThisDay}>
                    <Text
                      style={[
                        styles.confirmBtnText,
                        {color: colors.onPrimary},
                      ]}>
                      {db.addThisDay}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>
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
  body: {padding: 16, paddingBottom: 48},
  intro: {fontSize: 14, lineHeight: 20, marginBottom: 8},
  label: {fontSize: 14, fontWeight: '700', marginTop: 20, marginBottom: 8},
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 15,
  },
  startRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 8,
    gap: 10,
  },
  startStep: {
    width: 44,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  startLabelWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  startText: {fontSize: 15, fontWeight: '600', textTransform: 'capitalize'},
  empty: {fontSize: 14, fontStyle: 'italic', marginBottom: 4},
  dayCard: {borderRadius: 12, padding: 14, marginBottom: 8, gap: 8},
  dayCardHead: {flexDirection: 'row', alignItems: 'center', gap: 10},
  dayCardDay: {fontSize: 13, fontWeight: '800'},
  dayCardRef: {flex: 1, fontSize: 15, fontWeight: '600'},
  noteInput: {
    fontSize: 14,
    lineHeight: 20,
    minHeight: 38,
    paddingVertical: 6,
    paddingHorizontal: 8,
    textAlignVertical: 'top',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingVertical: 12,
    marginTop: 4,
  },
  addBtnText: {fontSize: 15, fontWeight: '700'},
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 14,
    paddingVertical: 15,
    marginTop: 28,
  },
  shareBtnText: {fontSize: 16, fontWeight: '700'},
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 12,
  },
  stepBtn: {
    width: 48,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepValue: {flex: 1, alignItems: 'center'},
  stepValueText: {fontSize: 22, fontWeight: '800'},
  disabled: {opacity: 0.4},
  overlay: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    borderRadius: 20,
    borderWidth: 1,
    maxHeight: '80%',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 10,
  },
  modalTitle: {flex: 1, fontSize: 18, fontWeight: '700'},
  pickerBody: {paddingBottom: 6},
  bookList: {paddingHorizontal: 8},
  bookRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  bookRowText: {fontSize: 16, fontWeight: '600'},
  bookRowMeta: {fontSize: 13},
  rangeLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 16,
    paddingHorizontal: 18,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 18,
    paddingTop: 20,
    paddingBottom: 18,
  },
  changeBookBtn: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
  },
  changeBookText: {fontSize: 15, fontWeight: '600'},
  confirmBtn: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
  },
  confirmBtnText: {fontSize: 15, fontWeight: '700'},
});
