/**
 * VoiceSelector Component
 *
 * Selector de voz para TTS con soporte para espanol e ingles
 * Muestra voces disponibles del dispositivo con preview
 *
 * Para la gloria de Dios - Eternal Stone Bible App
 */

import React, {useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  Pressable,
} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import {useTheme} from '../../../hooks/useTheme';
import {VoiceInfo, AudioLanguage} from '../types/audio';
import {useVoices} from '../hooks/useVoices';
import {LANGUAGE_LABELS, LANGUAGE_FLAGS} from '../constants/audioConstants';

interface VoiceSelectorProps {
  currentVoice: VoiceInfo | null;
  currentLanguage: AudioLanguage;
  onVoiceSelect: (voice: VoiceInfo) => void;
  onLanguageChange: (language: AudioLanguage) => void;
  variant?: 'default' | 'compact';
}

export const VoiceSelector: React.FC<VoiceSelectorProps> = ({
  currentVoice,
  currentLanguage,
  onVoiceSelect,
  onLanguageChange,
  variant = 'default',
}) => {
  const {colors} = useTheme();
  const [modalVisible, setModalVisible] = useState(false);
  const {spanishVoices, englishVoices, isLoading, previewVoice, stopPreview} =
    useVoices();

  const voices = currentLanguage === 'es' ? spanishVoices : englishVoices;
  const isCompact = variant === 'compact';

  const handleOpenModal = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    stopPreview();
    setModalVisible(false);
  };

  const handleVoiceSelect = (voice: VoiceInfo) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onVoiceSelect(voice);
    handleCloseModal();
  };

  const handlePreview = (voice: VoiceInfo) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    previewVoice(voice);
  };

  const handleLanguageSwitch = (lang: AudioLanguage) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onLanguageChange(lang);
  };

  return (
    <>
      {/* Trigger Button */}
      <TouchableOpacity
        style={[
          isCompact ? styles.triggerButtonCompact : styles.triggerButton,
          {backgroundColor: colors.surfaceVariant},
        ]}
        onPress={handleOpenModal}>
        <View
          style={
            isCompact ? styles.triggerContentCompact : styles.triggerContent
          }>
          <Ionicons
            name="mic"
            size={isCompact ? 16 : 18}
            color={colors.primary}
          />
          {isCompact ? (
            <Text
              style={[
                styles.languageLabelCompact,
                {color: colors.textSecondary},
              ]}>
              {currentLanguage.toUpperCase()}
            </Text>
          ) : (
            <>
              <View style={styles.triggerTextContainer}>
                <Text
                  style={[styles.triggerLabel, {color: colors.textSecondary}]}>
                  Voz
                </Text>
                <Text
                  style={[styles.triggerValue, {color: colors.text}]}
                  numberOfLines={1}>
                  {currentVoice?.name || 'Seleccionar'}
                </Text>
              </View>
              <Text style={styles.languageFlag}>
                {LANGUAGE_FLAGS[currentLanguage]}
              </Text>
            </>
          )}
        </View>
      </TouchableOpacity>

      {/* Voice Selection Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={handleCloseModal}>
        <Pressable style={styles.modalOverlay} onPress={handleCloseModal}>
          <Pressable
            style={[styles.modalContent, {backgroundColor: colors.card}]}
            onPress={e => e.stopPropagation()}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, {color: colors.text}]}>
                Seleccionar Voz
              </Text>
              <TouchableOpacity onPress={handleCloseModal}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            {/* Language Tabs */}
            <View style={styles.languageTabs}>
              {(['es', 'en'] as AudioLanguage[]).map(lang => (
                <TouchableOpacity
                  key={lang}
                  style={[
                    styles.languageTab,
                    {
                      backgroundColor:
                        currentLanguage === lang
                          ? colors.primary
                          : colors.surfaceVariant,
                    },
                  ]}
                  onPress={() => handleLanguageSwitch(lang)}>
                  <Text style={styles.languageTabFlag}>
                    {LANGUAGE_FLAGS[lang]}
                  </Text>
                  <Text
                    style={[
                      styles.languageTabText,
                      {
                        color:
                          currentLanguage === lang ? '#FFFFFF' : colors.text,
                      },
                    ]}>
                    {LANGUAGE_LABELS[lang]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Voice List */}
            <ScrollView
              style={styles.voiceList}
              showsVerticalScrollIndicator={false}>
              {isLoading ? (
                <View style={styles.loadingContainer}>
                  <Text
                    style={[styles.loadingText, {color: colors.textSecondary}]}>
                    Cargando voces...
                  </Text>
                </View>
              ) : voices.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Ionicons
                    name="mic-off"
                    size={48}
                    color={colors.textTertiary}
                  />
                  <Text
                    style={[styles.emptyText, {color: colors.textSecondary}]}>
                    No hay voces disponibles para este idioma
                  </Text>
                </View>
              ) : (
                voices.map(voice => {
                  const isSelected =
                    currentVoice?.identifier === voice.identifier;
                  return (
                    <TouchableOpacity
                      key={voice.identifier}
                      style={[
                        styles.voiceItem,
                        {
                          backgroundColor: isSelected
                            ? colors.primaryLight + '20'
                            : 'transparent',
                          borderColor: isSelected
                            ? colors.primary
                            : colors.border,
                        },
                      ]}
                      onPress={() => handleVoiceSelect(voice)}>
                      <View style={styles.voiceInfo}>
                        <Text style={[styles.voiceName, {color: colors.text}]}>
                          {voice.name}
                        </Text>
                        <View style={styles.voiceMeta}>
                          <Text
                            style={[
                              styles.voiceLanguage,
                              {color: colors.textSecondary},
                            ]}>
                            {voice.language}
                          </Text>
                          {voice.quality !== 'Default' && (
                            <View
                              style={[
                                styles.qualityBadge,
                                {
                                  backgroundColor:
                                    voice.quality === 'Premium'
                                      ? '#10b981'
                                      : '#f59e0b',
                                },
                              ]}>
                              <Text style={styles.qualityText}>
                                {voice.quality}
                              </Text>
                            </View>
                          )}
                        </View>
                      </View>
                      <View style={styles.voiceActions}>
                        <TouchableOpacity
                          style={[
                            styles.previewButton,
                            {backgroundColor: colors.surfaceVariant},
                          ]}
                          onPress={() => handlePreview(voice)}>
                          <Ionicons
                            name="play"
                            size={16}
                            color={colors.primary}
                          />
                        </TouchableOpacity>
                        {isSelected && (
                          <Ionicons
                            name="checkmark-circle"
                            size={24}
                            color={colors.primary}
                          />
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })
              )}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  triggerButton: {
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  triggerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  triggerButtonCompact: {
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 5,
    height: 24,
    minWidth: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  triggerContentCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  triggerTextContainer: {
    flex: 1,
  },
  triggerLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
  triggerValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  languageFlag: {
    fontSize: 20,
  },
  languageLabelCompact: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.4,
    lineHeight: 12,
    includeFontPadding: false,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
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
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  languageTabs: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  languageTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  languageTabFlag: {
    fontSize: 18,
  },
  languageTabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  voiceList: {
    paddingHorizontal: 16,
  },
  voiceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  voiceInfo: {
    flex: 1,
  },
  voiceName: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  voiceMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  voiceLanguage: {
    fontSize: 12,
  },
  qualityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  qualityText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  voiceActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  previewButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
  },
});

export default VoiceSelector;
