/**
 * SleepTimerModal Component
 *
 * Modal para configurar el temporizador de sueno
 * Opciones: 5, 10, 15, 30, 60 minutos o fin del capitulo
 *
 * Para la gloria de Dios - Eternal Stone Bible App
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Pressable,
} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import {useTheme} from '../../../hooks/useTheme';
import {useLanguage} from '../../../hooks/useLanguage';
import {SleepTimerState} from '../types/audio';
import {SLEEP_TIMER_OPTIONS} from '../constants/audioConstants';

interface SleepTimerModalProps {
  visible: boolean;
  onClose: () => void;
  onSetTimer: (minutes: number) => void;
  onSetEndOfChapter: () => void;
  onCancelTimer: () => void;
  currentTimer: SleepTimerState;
}

export const SleepTimerModal: React.FC<SleepTimerModalProps> = ({
  visible,
  onClose,
  onSetTimer,
  onSetEndOfChapter,
  onCancelTimer,
  currentTimer,
}) => {
  const {colors} = useTheme();
  const {t} = useLanguage();
  const tSleep = t.audio.sleepTimer;

  const handleSetTimer = (minutes: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onSetTimer(minutes);
    onClose();
  };

  const handleSetEndOfChapter = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onSetEndOfChapter();
    onClose();
  };

  const handleCancelTimer = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onCancelTimer();
    onClose();
  };

  const formatRemainingTime = (minutes: number): string => {
    if (minutes < 1) return tSleep.lessThanOne;
    if (minutes === 1) return tSleep.oneRemaining;
    return tSleep.minutesRemaining.replace('{{n}}', String(minutes));
  };

  const formatOptionLabel = (minutes: number): string =>
    minutes === 60
      ? tSleep.hour1
      : tSleep.minutesShort.replace('{{n}}', String(minutes));

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable
          style={[styles.modalContent, {backgroundColor: colors.card}]}
          onPress={e => e.stopPropagation()}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={styles.headerLeft}>
              <Ionicons name="moon" size={24} color={colors.primary} />
              <Text style={[styles.modalTitle, {color: colors.text}]}>
                {tSleep.title}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          {/* Current Timer Status */}
          {currentTimer.isActive && (
            <View
              style={[
                styles.activeTimerBanner,
                {backgroundColor: colors.primary + '15'},
              ]}>
              <View style={styles.timerInfo}>
                <Ionicons name="time" size={20} color={colors.primary} />
                <Text style={[styles.timerText, {color: colors.primary}]}>
                  {currentTimer.mode === 'end-of-chapter'
                    ? tSleep.endOfChapterStatus
                    : formatRemainingTime(currentTimer.remainingMinutes)}
                </Text>
              </View>
              <TouchableOpacity
                style={[
                  styles.cancelButton,
                  {backgroundColor: colors.error + '20'},
                ]}
                onPress={handleCancelTimer}>
                <Text style={[styles.cancelButtonText, {color: colors.error}]}>
                  {tSleep.cancel}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Timer Options */}
          <View style={styles.optionsContainer}>
            <Text style={[styles.sectionTitle, {color: colors.textSecondary}]}>
              {tSleep.stopAt}
            </Text>

            <View style={styles.optionsGrid}>
              {SLEEP_TIMER_OPTIONS.map(option => (
                <TouchableOpacity
                  key={option.minutes}
                  style={[
                    styles.optionButton,
                    {
                      backgroundColor: colors.surfaceVariant,
                      borderColor: colors.border,
                    },
                  ]}
                  onPress={() => handleSetTimer(option.minutes)}>
                  <Text style={[styles.optionTime, {color: colors.text}]}>
                    {formatOptionLabel(option.minutes)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* End of Chapter Option */}
            <TouchableOpacity
              style={[
                styles.endOfChapterButton,
                {
                  backgroundColor: colors.surfaceVariant,
                  borderColor: colors.primary,
                },
              ]}
              onPress={handleSetEndOfChapter}>
              <View style={styles.endOfChapterContent}>
                <Ionicons name="book" size={20} color={colors.primary} />
                <View style={styles.endOfChapterText}>
                  <Text
                    style={[styles.endOfChapterTitle, {color: colors.text}]}>
                    {tSleep.endOfChapterTitle}
                  </Text>
                  <Text
                    style={[
                      styles.endOfChapterSubtitle,
                      {color: colors.textSecondary},
                    ]}>
                    {tSleep.endOfChapterSubtitle}
                  </Text>
                </View>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          </View>

          {/* Info */}
          <View style={styles.infoContainer}>
            <Ionicons
              name="information-circle"
              size={16}
              color={colors.textTertiary}
            />
            <Text style={[styles.infoText, {color: colors.textTertiary}]}>
              {tSleep.info}
            </Text>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 34,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  activeTimerBanner: {
    margin: 16,
    padding: 14,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  timerText: {
    fontSize: 14,
    fontWeight: '600',
  },
  cancelButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  cancelButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  optionsContainer: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 12,
    marginLeft: 4,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  optionButton: {
    width: '31%',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  optionTime: {
    fontSize: 15,
    fontWeight: '600',
  },
  endOfChapterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  endOfChapterContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  endOfChapterText: {
    flex: 1,
  },
  endOfChapterTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  endOfChapterSubtitle: {
    fontSize: 12,
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  infoText: {
    fontSize: 12,
    flex: 1,
    lineHeight: 16,
  },
});

export default SleepTimerModal;
