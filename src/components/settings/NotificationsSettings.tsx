/**
 * Consolidated notification-reminders section: one card, six compact rows
 * (Versículo del día, Oración, Tiempo en la Palabra, Profecía del día,
 * ¿Sabías qué?, Memorización), replacing what used to be six separate
 * full-width sections. Each row keeps its own {enabled, hour, busy} state
 * and calls its own NotificationService functions — a toggle in flight on
 * one type must never disable another type's switch. Purely a presentation
 * consolidation: NotificationService's scheduling logic is untouched.
 */

import React, {useCallback, useEffect, useState} from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {haptics} from '@lib/haptics';
import {useTheme} from '@hooks/useTheme';
import {useLanguage} from '@hooks/useLanguage';
import {useBibleVersion} from '@hooks/useBibleVersion';
import {staticColors} from '@/styles/designTokens';
import {useToast} from '@context/ToastContext';
import NotificationReminderRow from './NotificationReminderRow';
import {
  getNotificationPreferences,
  setDailyVerseEnabled,
  updateDailyVerseHour,
  getPrayerReminderPreferences,
  setPrayerReminderEnabled,
  updatePrayerReminderHour,
  getDevotionReminderPreferences,
  setDevotionReminderEnabled,
  updateDevotionReminderHour,
  getPropheticReminderPreferences,
  setPropheticReminderEnabled,
  updatePropheticReminderHour,
  getSabiasQueReminderPreferences,
  setSabiasQueReminderEnabled,
  updateSabiasQueReminderHour,
  getMemoryReminderPreferences,
  setMemoryReminderEnabled,
  updateMemoryReminderHour,
} from '@lib/notifications/NotificationService';

const DAILY_VERSE_HOURS = [6, 7, 8, 12, 18, 21];
const PRAYER_HOURS = [6, 7, 8, 12, 18, 20, 21];
const DEVOTION_HOURS = [6, 7, 8, 9, 12, 18, 21];
const PROPHETIC_HOURS = [6, 7, 8, 9, 12, 18, 21];
const SABIAS_QUE_HOURS = [6, 7, 8, 9, 12, 18, 21];
const MEMORY_HOURS = [6, 7, 8, 12, 18, 21];

interface ReminderState {
  enabled: boolean;
  hour: number;
  busy: boolean;
}

export default function NotificationsSettings() {
  const {colors, isDark} = useTheme();
  const {t, language} = useLanguage();
  const {selectedVersion} = useBibleVersion();
  const toast = useToast();

  const [dailyVerse, setDailyVerse] = useState<ReminderState>({
    enabled: false,
    hour: 8,
    busy: false,
  });
  const [prayer, setPrayer] = useState<ReminderState>({
    enabled: false,
    hour: 20,
    busy: false,
  });
  const [devotion, setDevotion] = useState<ReminderState>({
    enabled: false,
    hour: 8,
    busy: false,
  });
  const [prophetic, setProphetic] = useState<ReminderState>({
    enabled: false,
    hour: 8,
    busy: false,
  });
  const [sabiasQue, setSabiasQue] = useState<ReminderState>({
    enabled: false,
    hour: 12,
    busy: false,
  });
  const [memory, setMemory] = useState<ReminderState>({
    enabled: false,
    hour: 19,
    busy: false,
  });

  useEffect(() => {
    (async () => {
      const [dv, pr, dev, prop, sq, mem] = await Promise.all([
        getNotificationPreferences(),
        getPrayerReminderPreferences(),
        getDevotionReminderPreferences(),
        getPropheticReminderPreferences(),
        getSabiasQueReminderPreferences(),
        getMemoryReminderPreferences(),
      ]);
      setDailyVerse(s => ({...s, enabled: dv.enabled, hour: dv.hour}));
      setPrayer(s => ({...s, enabled: pr.enabled, hour: pr.hour}));
      setDevotion(s => ({...s, enabled: dev.enabled, hour: dev.hour}));
      setProphetic(s => ({...s, enabled: prop.enabled, hour: prop.hour}));
      setSabiasQue(s => ({...s, enabled: sq.enabled, hour: sq.hour}));
      setMemory(s => ({...s, enabled: mem.enabled, hour: mem.hour}));
    })();
  }, []);

  // --- Versículo del día -----------------------------------------------
  const handleDailyVerseToggle = useCallback(
    async (value: boolean) => {
      if (dailyVerse.busy) return;
      setDailyVerse(s => ({...s, busy: true}));
      haptics.tap();
      try {
        const ok = await setDailyVerseEnabled(value, {
          hour: dailyVerse.hour,
          language,
          version: selectedVersion.id,
        });
        if (value && !ok) {
          toast.warning(t.notifications.permissionDeniedMessage);
          setDailyVerse(s => ({...s, enabled: false}));
          return;
        }
        setDailyVerse(s => ({...s, enabled: value}));
        toast.success(
          value ? t.notifications.enabled : t.notifications.disabled,
        );
      } finally {
        setDailyVerse(s => ({...s, busy: false}));
      }
    },
    [dailyVerse.busy, dailyVerse.hour, language, selectedVersion.id, t, toast],
  );

  const handleDailyVerseHourSelect = useCallback(
    async (selected: number) => {
      if (dailyVerse.busy || selected === dailyVerse.hour) return;
      setDailyVerse(s => ({...s, hour: selected}));
      haptics.tap();
      if (dailyVerse.enabled) {
        setDailyVerse(s => ({...s, busy: true}));
        try {
          await updateDailyVerseHour({
            hour: selected,
            language,
            version: selectedVersion.id,
          });
          toast.success(t.notifications.enabled);
        } finally {
          setDailyVerse(s => ({...s, busy: false}));
        }
      }
    },
    [
      dailyVerse.busy,
      dailyVerse.hour,
      dailyVerse.enabled,
      language,
      selectedVersion.id,
      t,
      toast,
    ],
  );

  // --- Oración ------------------------------------------------------------
  const handlePrayerToggle = useCallback(
    async (value: boolean) => {
      if (prayer.busy) return;
      setPrayer(s => ({...s, busy: true}));
      haptics.tap();
      try {
        const ok = await setPrayerReminderEnabled(value, {
          hour: prayer.hour,
          language,
        });
        if (value && !ok) {
          toast.warning(t.notifications.permissionDeniedMessage);
          setPrayer(s => ({...s, enabled: false}));
          return;
        }
        setPrayer(s => ({...s, enabled: value}));
        toast.success(
          value
            ? t.notifications.prayerReminderEnabled
            : t.notifications.prayerReminderDisabled,
        );
      } finally {
        setPrayer(s => ({...s, busy: false}));
      }
    },
    [prayer.busy, prayer.hour, language, t, toast],
  );

  const handlePrayerHourSelect = useCallback(
    async (selected: number) => {
      if (prayer.busy || selected === prayer.hour) return;
      setPrayer(s => ({...s, hour: selected}));
      haptics.tap();
      if (prayer.enabled) {
        setPrayer(s => ({...s, busy: true}));
        try {
          await updatePrayerReminderHour({hour: selected, language});
          toast.success(t.notifications.prayerReminderEnabled);
        } finally {
          setPrayer(s => ({...s, busy: false}));
        }
      }
    },
    [prayer.busy, prayer.hour, prayer.enabled, language, t, toast],
  );

  // --- Tiempo en la Palabra (devoción) ------------------------------------
  const handleDevotionToggle = useCallback(
    async (value: boolean) => {
      if (devotion.busy) return;
      setDevotion(s => ({...s, busy: true}));
      haptics.tap();
      try {
        const ok = await setDevotionReminderEnabled(value, {
          hour: devotion.hour,
          language,
        });
        if (value && !ok) {
          toast.warning(t.notifications.permissionDeniedMessage);
          setDevotion(s => ({...s, enabled: false}));
          return;
        }
        setDevotion(s => ({...s, enabled: value}));
        toast.success(
          value
            ? t.notifications.devotionReminderEnabled
            : t.notifications.devotionReminderDisabled,
        );
      } finally {
        setDevotion(s => ({...s, busy: false}));
      }
    },
    [devotion.busy, devotion.hour, language, t, toast],
  );

  const handleDevotionHourSelect = useCallback(
    async (selected: number) => {
      if (devotion.busy || selected === devotion.hour) return;
      setDevotion(s => ({...s, hour: selected}));
      haptics.tap();
      if (devotion.enabled) {
        setDevotion(s => ({...s, busy: true}));
        try {
          await updateDevotionReminderHour({hour: selected, language});
          toast.success(t.notifications.devotionReminderEnabled);
        } finally {
          setDevotion(s => ({...s, busy: false}));
        }
      }
    },
    [devotion.busy, devotion.hour, devotion.enabled, language, t, toast],
  );

  // --- Profecía del día ----------------------------------------------------
  const handlePropheticToggle = useCallback(
    async (value: boolean) => {
      if (prophetic.busy) return;
      setProphetic(s => ({...s, busy: true}));
      haptics.tap();
      try {
        const ok = await setPropheticReminderEnabled(value, {
          hour: prophetic.hour,
          language,
        });
        if (value && !ok) {
          toast.warning(t.notifications.permissionDeniedMessage);
          setProphetic(s => ({...s, enabled: false}));
          return;
        }
        setProphetic(s => ({...s, enabled: value}));
        toast.success(
          value
            ? t.notifications.prophecyReminderEnabled
            : t.notifications.prophecyReminderDisabled,
        );
      } finally {
        setProphetic(s => ({...s, busy: false}));
      }
    },
    [prophetic.busy, prophetic.hour, language, t, toast],
  );

  const handlePropheticHourSelect = useCallback(
    async (selected: number) => {
      if (prophetic.busy || selected === prophetic.hour) return;
      setProphetic(s => ({...s, hour: selected}));
      haptics.tap();
      if (prophetic.enabled) {
        setProphetic(s => ({...s, busy: true}));
        try {
          await updatePropheticReminderHour({hour: selected, language});
          toast.success(t.notifications.prophecyReminderEnabled);
        } finally {
          setProphetic(s => ({...s, busy: false}));
        }
      }
    },
    [prophetic.busy, prophetic.hour, prophetic.enabled, language, t, toast],
  );

  // --- ¿Sabías qué? --------------------------------------------------------
  const handleSabiasQueToggle = useCallback(
    async (value: boolean) => {
      if (sabiasQue.busy) return;
      setSabiasQue(s => ({...s, busy: true}));
      haptics.tap();
      try {
        const ok = await setSabiasQueReminderEnabled(value, {
          hour: sabiasQue.hour,
          language,
        });
        if (value && !ok) {
          toast.warning(t.notifications.permissionDeniedMessage);
          setSabiasQue(s => ({...s, enabled: false}));
          return;
        }
        setSabiasQue(s => ({...s, enabled: value}));
        toast.success(
          value
            ? t.notifications.sabiasQueReminderEnabled
            : t.notifications.sabiasQueReminderDisabled,
        );
      } finally {
        setSabiasQue(s => ({...s, busy: false}));
      }
    },
    [sabiasQue.busy, sabiasQue.hour, language, t, toast],
  );

  const handleSabiasQueHourSelect = useCallback(
    async (selected: number) => {
      if (sabiasQue.busy || selected === sabiasQue.hour) return;
      setSabiasQue(s => ({...s, hour: selected}));
      haptics.tap();
      if (sabiasQue.enabled) {
        setSabiasQue(s => ({...s, busy: true}));
        try {
          await updateSabiasQueReminderHour({hour: selected, language});
          toast.success(t.notifications.sabiasQueReminderEnabled);
        } finally {
          setSabiasQue(s => ({...s, busy: false}));
        }
      }
    },
    [sabiasQue.busy, sabiasQue.hour, sabiasQue.enabled, language, t, toast],
  );

  // --- Memorización (mitad recordatorio) -----------------------------------
  const handleMemoryToggle = useCallback(
    async (value: boolean) => {
      if (memory.busy) return;
      setMemory(s => ({...s, busy: true}));
      haptics.tap();
      try {
        const ok = await setMemoryReminderEnabled(value, {
          hour: memory.hour,
          language,
        });
        if (value && !ok) {
          toast.warning(t.notifications.permissionDeniedMessage);
          setMemory(s => ({...s, enabled: false}));
          return;
        }
        setMemory(s => ({...s, enabled: value}));
        toast.success(
          value
            ? t.notifications.memoryReminderEnabled
            : t.notifications.memoryReminderDisabled,
        );
      } finally {
        setMemory(s => ({...s, busy: false}));
      }
    },
    [memory.busy, memory.hour, language, t, toast],
  );

  const handleMemoryHourSelect = useCallback(
    async (selected: number) => {
      if (memory.busy || selected === memory.hour) return;
      setMemory(s => ({...s, hour: selected}));
      haptics.tap();
      if (memory.enabled) {
        setMemory(s => ({...s, busy: true}));
        try {
          await updateMemoryReminderHour({hour: selected, language});
          toast.success(t.notifications.memoryReminderEnabled);
        } finally {
          setMemory(s => ({...s, busy: false}));
        }
      }
    },
    [memory.busy, memory.hour, memory.enabled, language, t, toast],
  );

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Ionicons
          name="notifications-outline"
          size={22}
          color={colors.primary}
        />
        <Text style={[styles.sectionTitle, {color: colors.text}]}>
          {t.notifications.title}
        </Text>
      </View>

      <View
        style={[
          styles.card,
          isDark ? styles.cardShadowDark : styles.cardShadowLight,
          {backgroundColor: colors.surface},
        ]}>
        <NotificationReminderRow
          isFirst
          icon="notifications-outline"
          label={t.notifications.dailyVerse}
          description={t.notifications.dailyVerseDesc}
          enabled={dailyVerse.enabled}
          hour={dailyVerse.hour}
          hourOptions={DAILY_VERSE_HOURS}
          busy={dailyVerse.busy}
          onToggle={handleDailyVerseToggle}
          onHourSelect={handleDailyVerseHourSelect}
        />
        <NotificationReminderRow
          icon="heart-outline"
          label={t.notifications.prayerReminder}
          description={t.notifications.prayerReminderDesc}
          enabled={prayer.enabled}
          hour={prayer.hour}
          hourOptions={PRAYER_HOURS}
          busy={prayer.busy}
          onToggle={handlePrayerToggle}
          onHourSelect={handlePrayerHourSelect}
        />
        <NotificationReminderRow
          icon="book-outline"
          label={t.notifications.devotionReminder}
          description={t.notifications.devotionReminderDesc}
          enabled={devotion.enabled}
          hour={devotion.hour}
          hourOptions={DEVOTION_HOURS}
          busy={devotion.busy}
          onToggle={handleDevotionToggle}
          onHourSelect={handleDevotionHourSelect}
        />
        <NotificationReminderRow
          icon="flame-outline"
          label={t.notifications.prophecyReminder}
          description={t.notifications.prophecyReminderDesc}
          enabled={prophetic.enabled}
          hour={prophetic.hour}
          hourOptions={PROPHETIC_HOURS}
          busy={prophetic.busy}
          onToggle={handlePropheticToggle}
          onHourSelect={handlePropheticHourSelect}
        />
        <NotificationReminderRow
          icon="bulb-outline"
          label={t.notifications.sabiasQueReminder}
          description={t.notifications.sabiasQueReminderDesc}
          enabled={sabiasQue.enabled}
          hour={sabiasQue.hour}
          hourOptions={SABIAS_QUE_HOURS}
          busy={sabiasQue.busy}
          onToggle={handleSabiasQueToggle}
          onHourSelect={handleSabiasQueHourSelect}
        />
        <NotificationReminderRow
          icon="school-outline"
          label={t.notifications.memoryReminder}
          description={t.notifications.memoryReminderDesc}
          enabled={memory.enabled}
          hour={memory.hour}
          hourOptions={MEMORY_HOURS}
          busy={memory.busy}
          onToggle={handleMemoryToggle}
          onHourSelect={handleMemoryHourSelect}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  card: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 4,
    shadowColor: staticColors.black,
    shadowOffset: {width: 0, height: 2},
    shadowRadius: 4,
    elevation: 3,
  },
  cardShadowDark: {shadowOpacity: 0.3},
  cardShadowLight: {shadowOpacity: 0.1},
});
