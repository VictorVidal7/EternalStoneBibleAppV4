/**
 * 🧩 Plan builder — create your own reading plan (Sprint 108).
 *
 * Pick chapter-range passages, choose a pace, name it, and the app distributes
 * the chapters across days (pure logic in src/lib/reading/customPlanBuild). The
 * plan is saved to the device-local custom-plan registry and opened. It can
 * later be shared peer-to-peer as a together `cplan` link — extending the plan
 * catalogue with zero backend or cost (DOCS/COMMUNITY_DESIGN §9.1).
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import {useEffect, useMemo, useRef, useState} from 'react';
import {
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {Stack, useLocalSearchParams, useRouter} from 'expo-router';
import {Ionicons} from '@expo/vector-icons';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import {AppText as Text} from '@components/ui/AppText';
import {useTheme} from '@hooks/useTheme';
import {useLanguage} from '@hooks/useLanguage';
import {useBibleVersion} from '@hooks/useBibleVersion';
import {useToast} from '@context/ToastContext';
import {useCustomPlans} from '@context/CustomPlansContext';
import {useReadingPlanProgress} from '@context/ReadingPlanProgressContext';
import {haptics} from '@lib/haptics';
import {staticColors} from '@/styles/designTokens';
import {centeredMaxWidth} from '@/styles/responsive';
import {focusTrapProps} from '@lib/a11y/focusTrap';
import {BIBLE_BOOKS, getBookById} from '@/constants/bible';
import {
  buildCustomPlan,
  countChapters,
  daysToPassages,
  distributeChapters,
  inferPerDay,
  passagesToChapters,
  type PlanPace,
  type PlanPassage,
} from '@/lib/reading/customPlanBuild';
import {
  bundleFromCustomPlan,
  customPlanFromBundle,
} from '@/lib/reading/customPlans';

/**
 * The central value of a − [n] + stepper, made directly editable so a big jump
 * (e.g. chapter 50 → 3) is one tap + typing instead of ~47 taps on the steppers
 * (user feedback). Keeps a free-text draft while focused — digits only, no
 * clamping mid-type so multi-digit values below the minimum can still be typed —
 * and clamps to [min, max] on blur/submit. `selectTextOnFocus` makes the first
 * keystroke replace the current number.
 */
function StepperValueInput({
  value,
  min,
  max,
  onCommit,
  textColor,
  accessibilityLabel,
}: {
  value: number;
  min: number;
  max: number;
  onCommit: (n: number) => void;
  textColor: string;
  accessibilityLabel: string;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  const commit = () => {
    const n = parseInt(draft ?? '', 10);
    if (!Number.isNaN(n)) onCommit(Math.min(max, Math.max(min, n)));
    setDraft(null);
  };
  return (
    <View style={styles.stepValue}>
      <TextInput
        style={[
          styles.stepValueText,
          styles.stepValueInput,
          {color: textColor},
        ]}
        value={draft ?? String(value)}
        onChangeText={txt => setDraft(txt.replace(/[^0-9]/g, '').slice(0, 3))}
        onBlur={commit}
        onSubmitEditing={commit}
        keyboardType="number-pad"
        returnKeyType="done"
        selectTextOnFocus
        textAlign="center"
        maxLength={3}
        accessibilityLabel={accessibilityLabel}
      />
    </View>
  );
}

export default function PlanBuilderScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {colors} = useTheme();
  const {t} = useLanguage();
  const {selectedVersion} = useBibleVersion();
  // Book names follow the READING version's language (RVR1960 → "Juan").
  const bookNameLang: 'es' | 'en' =
    selectedVersion.language === 'es' ? 'es' : 'en';
  const tb = t.planBuilder;
  const toast = useToast();
  const {getCustomPlanById, saveCustomPlan, replaceCustomPlan} =
    useCustomPlans();
  const {setPlanStart, migratePlanProgress} = useReadingPlanProgress();

  // When opened with `?editId=<planId>` the screen edits that custom plan in
  // place instead of creating a new one (Sprint 110, completing S108).
  const {editId} = useLocalSearchParams<{editId?: string}>();
  const isEdit = Boolean(editId);

  const [name, setName] = useState('');
  const [passages, setPassages] = useState<PlanPassage[]>([]);
  const [paceMode, setPaceMode] = useState<PlanPace['mode']>('perDay');
  const [perDay, setPerDay] = useState(3);
  const [totalDays, setTotalDays] = useState(7);

  // Pre-fill ONCE from the plan being edited. The custom-plan list loads
  // asynchronously, so this runs in an effect (guarded by a ref) rather than in
  // useState initializers, and reconstructs the editor passages from the saved
  // days (which is all a custom plan stores).
  const prefilled = useRef(false);
  useEffect(() => {
    if (!editId || prefilled.current) return;
    const plan = getCustomPlanById(editId);
    if (!plan) return;
    prefilled.current = true;
    const days = bundleFromCustomPlan(plan).d;
    setName(plan.name);
    setPassages(daysToPassages(days));
    setPaceMode('perDay');
    setPerDay(inferPerDay(days));
  }, [editId, getCustomPlanById]);

  // Add-passage modal state.
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickBookId, setPickBookId] = useState<number | null>(null);
  const [fromCh, setFromCh] = useState(1);
  const [toCh, setToCh] = useState(1);

  const bookName = (id: number) => {
    const b = getBookById(id);
    if (!b) return String(id);
    return bookNameLang === 'en' ? b.nameEn : b.name;
  };

  const pace: PlanPace =
    paceMode === 'perDay'
      ? {mode: 'perDay', chaptersPerDay: perDay}
      : {mode: 'totalDays', days: totalDays};

  const totalChapters = useMemo(() => countChapters(passages), [passages]);
  const dayCount = useMemo(
    () => distributeChapters(passagesToChapters(passages), pace).length,
    // pace is rebuilt each render; its fields are the real signals.
    [passages, paceMode, perDay, totalDays],
  );

  const canCreate = name.trim().length > 0 && passages.length > 0;

  const openPicker = () => {
    haptics.tap();
    setPickBookId(null);
    setFromCh(1);
    setToCh(1);
    setPickerOpen(true);
  };

  const chooseBook = (id: number) => {
    haptics.tap();
    const b = getBookById(id);
    setPickBookId(id);
    setFromCh(1);
    setToCh(b?.chapters ?? 1);
  };

  const confirmPassage = () => {
    if (pickBookId == null) return;
    haptics.tap();
    setPassages(prev => [
      ...prev,
      {bookId: pickBookId, fromChapter: fromCh, toChapter: toCh},
    ]);
    setPickerOpen(false);
  };

  const removePassage = (index: number) => {
    haptics.tap();
    setPassages(prev => prev.filter((_, i) => i !== index));
  };

  const onCreate = async () => {
    if (!canCreate) {
      toast.info(tb.needNameAndPassage);
      return;
    }
    const bundle = buildCustomPlan(name, passages, pace);
    const plan = customPlanFromBundle(bundle);
    if (!plan) {
      toast.info(tb.needNameAndPassage);
      return;
    }
    haptics.success();
    if (isEdit && editId) {
      // Editing rebuilds the plan under a fresh content-derived id. Carry the
      // progress (and its original start date) to the new id, then replace the
      // old entry in one atomic write so the two ids can't clobber each other.
      if (plan.id !== editId) await migratePlanProgress(editId, plan.id);
      await replaceCustomPlan(editId, plan);
      toast.success(tb.updated);
    } else {
      await saveCustomPlan(plan);
      // Seed today's start so the plan opens already guiding "Day 1".
      await setPlanStart(plan.id, new Date().toISOString());
      toast.success(tb.created);
    }
    router.replace(`/plan/${plan.id}` as never);
  };

  const pickBook = pickBookId != null ? getBookById(pickBookId) : undefined;
  const maxCh = pickBook?.chapters ?? 1;

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
          {isEdit ? tb.editTitle : tb.title}
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={[styles.body, centeredMaxWidth()]}
        keyboardShouldPersistTaps="handled">
        <Text style={[styles.intro, {color: colors.textSecondary}]}>
          {tb.intro}
        </Text>

        {/* Name */}
        <Text style={[styles.label, {color: colors.text}]}>{tb.nameLabel}</Text>
        <TextInput
          style={[
            styles.input,
            {
              color: colors.text,
              borderColor: colors.border,
              backgroundColor: colors.card,
            },
          ]}
          value={name}
          onChangeText={setName}
          placeholder={tb.namePlaceholder}
          placeholderTextColor={colors.textSecondary}
          maxLength={60}
          returnKeyType="done"
        />

        {/* Passages */}
        <Text style={[styles.label, {color: colors.text}]}>
          {tb.passagesLabel}
        </Text>
        {passages.length === 0 ? (
          <Text style={[styles.empty, {color: colors.textSecondary}]}>
            {tb.noPassages}
          </Text>
        ) : (
          passages.map((p, i) => (
            <View
              key={`${p.bookId}-${p.fromChapter}-${p.toChapter}-${i}`}
              style={[styles.passageRow, {backgroundColor: colors.card}]}>
              <Ionicons name="book-outline" size={18} color={colors.primary} />
              <Text style={[styles.passageText, {color: colors.text}]}>
                {bookName(p.bookId)}{' '}
                {p.fromChapter === p.toChapter
                  ? p.fromChapter
                  : `${p.fromChapter}–${p.toChapter}`}
              </Text>
              <TouchableOpacity
                onPress={() => removePassage(i)}
                accessibilityRole="button"
                accessibilityLabel={tb.removePassage}
                hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
                <Ionicons
                  name="close-circle"
                  size={20}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            </View>
          ))
        )}
        <TouchableOpacity
          style={[styles.addBtn, {borderColor: colors.primary}]}
          onPress={openPicker}
          accessibilityRole="button"
          accessibilityLabel={tb.addPassage}>
          <Ionicons name="add" size={20} color={colors.primary} />
          <Text style={[styles.addBtnText, {color: colors.primary}]}>
            {tb.addPassage}
          </Text>
        </TouchableOpacity>

        {/* Pace */}
        <Text style={[styles.label, {color: colors.text}]}>{tb.paceLabel}</Text>
        <View style={styles.segment}>
          {(['perDay', 'totalDays'] as const).map(mode => {
            const selected = paceMode === mode;
            return (
              <TouchableOpacity
                key={mode}
                style={[
                  styles.segmentBtn,
                  {borderColor: colors.border},
                  selected && {
                    backgroundColor: colors.primary + '22',
                    borderColor: colors.primary,
                  },
                ]}
                onPress={() => {
                  haptics.tap();
                  setPaceMode(mode);
                }}
                accessibilityRole="button"
                accessibilityState={{selected}}>
                <Text
                  style={[
                    styles.segmentText,
                    {color: selected ? colors.primary : colors.textSecondary},
                  ]}>
                  {mode === 'perDay' ? tb.pacePerDay : tb.paceTotalDays}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
        <View style={styles.stepperRow}>
          {paceMode === 'perDay'
            ? stepBtn(
                '−1',
                () => setPerDay(v => Math.max(1, v - 1)),
                perDay <= 1,
                'remove',
              )
            : stepBtn(
                '−1',
                () => setTotalDays(v => Math.max(1, v - 1)),
                totalDays <= 1,
                'remove',
              )}
          <StepperValueInput
            value={paceMode === 'perDay' ? perDay : totalDays}
            min={1}
            max={paceMode === 'perDay' ? 20 : 365}
            onCommit={n =>
              paceMode === 'perDay' ? setPerDay(n) : setTotalDays(n)
            }
            textColor={colors.text}
            accessibilityLabel={
              paceMode === 'perDay' ? tb.pacePerDay : tb.paceTotalDays
            }
          />
          {paceMode === 'perDay'
            ? stepBtn('+1', () => setPerDay(v => v + 1), perDay >= 20, 'add')
            : stepBtn(
                '+1',
                () => setTotalDays(v => v + 1),
                totalDays >= 365,
                'add',
              )}
        </View>

        {/* Preview */}
        <View style={[styles.preview, {backgroundColor: colors.card}]}>
          <Ionicons name="calendar-outline" size={18} color={colors.primary} />
          <Text style={[styles.previewText, {color: colors.text}]}>
            {passages.length === 0
              ? tb.previewEmpty
              : tb.preview
                  .replace('{{days}}', String(dayCount))
                  .replace('{{chapters}}', String(totalChapters))}
          </Text>
        </View>

        <TouchableOpacity
          style={[
            styles.createBtn,
            {backgroundColor: colors.primary},
            !canCreate && styles.disabled,
          ]}
          disabled={!canCreate}
          onPress={onCreate}
          accessibilityRole="button"
          accessibilityLabel={isEdit ? tb.save : tb.create}>
          <Ionicons
            name="checkmark-circle-outline"
            size={20}
            color={colors.onPrimary}
          />
          <Text style={[styles.createBtnText, {color: colors.onPrimary}]}>
            {isEdit ? tb.save : tb.create}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Add-passage modal */}
      <Modal
        visible={pickerOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setPickerOpen(false)}>
        <View style={styles.overlay}>
          <View
            style={[styles.modalCard, {backgroundColor: colors.card}]}
            {...focusTrapProps()}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, {color: colors.text}]}>
                {pickBook ? bookName(pickBook.id) : tb.pickBook}
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
              <View>
                <Text style={[styles.rangeLabel, {color: colors.text}]}>
                  {tb.fromChapter}
                </Text>
                <View style={styles.stepperRow}>
                  {stepBtn(
                    '−1',
                    () => setFromCh(v => Math.max(1, v - 1)),
                    fromCh <= 1,
                    'remove',
                  )}
                  <StepperValueInput
                    value={fromCh}
                    min={1}
                    max={maxCh}
                    onCommit={n => {
                      setFromCh(n);
                      if (n > toCh) setToCh(n);
                    }}
                    textColor={colors.text}
                    accessibilityLabel={tb.fromChapter}
                  />
                  {stepBtn(
                    '+1',
                    () =>
                      setFromCh(v => {
                        const next = Math.min(maxCh, v + 1);
                        if (next > toCh) setToCh(next);
                        return next;
                      }),
                    fromCh >= maxCh,
                    'add',
                  )}
                </View>

                <Text style={[styles.rangeLabel, {color: colors.text}]}>
                  {tb.toChapter}
                </Text>
                <View style={styles.stepperRow}>
                  {stepBtn(
                    '−1',
                    () => setToCh(v => Math.max(fromCh, v - 1)),
                    toCh <= fromCh,
                    'remove',
                  )}
                  <StepperValueInput
                    value={toCh}
                    min={fromCh}
                    max={maxCh}
                    onCommit={n => setToCh(Math.max(fromCh, n))}
                    textColor={colors.text}
                    accessibilityLabel={tb.toChapter}
                  />
                  {stepBtn(
                    '+1',
                    () => setToCh(v => Math.min(maxCh, v + 1)),
                    toCh >= maxCh,
                    'add',
                  )}
                </View>

                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={[styles.changeBookBtn, {borderColor: colors.border}]}
                    onPress={() => setPickBookId(null)}
                    accessibilityRole="button"
                    accessibilityLabel={tb.changeBook}>
                    <Text style={[styles.changeBookText, {color: colors.text}]}>
                      {tb.changeBook}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.confirmBtn,
                      {backgroundColor: colors.primary},
                    ]}
                    onPress={confirmPassage}
                    accessibilityRole="button"
                    accessibilityLabel={tb.addThisPassage}>
                    <Text
                      style={[
                        styles.confirmBtnText,
                        {color: colors.onPrimary},
                      ]}>
                      {tb.addThisPassage}
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
  empty: {fontSize: 14, fontStyle: 'italic', marginBottom: 4},
  passageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 8,
  },
  passageText: {flex: 1, fontSize: 15, fontWeight: '600'},
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
  segment: {flexDirection: 'row', gap: 10},
  segmentBtn: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  segmentText: {fontSize: 14, fontWeight: '700'},
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
  // The editable variant strips TextInput's default padding/min-height so the
  // number sits exactly where the static <Text> did, and reserves a little width
  // so a 1–3 digit value stays comfortably tappable.
  stepValueInput: {paddingVertical: 0, minWidth: 72},
  disabled: {opacity: 0.4},
  preview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginTop: 24,
  },
  previewText: {fontSize: 15, fontWeight: '700'},
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 14,
    paddingVertical: 15,
    marginTop: 16,
  },
  createBtnText: {fontSize: 16, fontWeight: '700'},
  overlay: {
    flex: 1,
    backgroundColor: staticColors.overlayBlack60,
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {borderRadius: 20, maxHeight: '80%', overflow: 'hidden'},
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 10,
  },
  modalTitle: {flex: 1, fontSize: 18, fontWeight: '700'},
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
