/**
 * VoiceSelector Component
 *
 * Selector de voz para TTS con soporte para espanol e ingles
 * Muestra voces disponibles del dispositivo con preview
 *
 * Para la gloria de Dios - Eternal Stone Bible App
 */

import React, {useState, useMemo} from 'react';
import {staticColors} from '@/styles/designTokens';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  Platform,
  Pressable,
} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import * as Localization from 'expo-localization';
import {haptics} from '@lib/haptics';
import {useTheme} from '../../../hooks/useTheme';
import {useLanguage} from '../../../hooks/useLanguage';
import {focusTrapProps} from '@lib/a11y/focusTrap';
import {hitSlopToMinTarget} from '@lib/a11y/touchTarget';
import {VoiceInfo, AudioLanguage} from '../types/audio';
import {useVoices} from '../hooks/useVoices';
import {
  pickDefaultSpanishVoiceId,
  voiceSelectorLanguage,
} from '../lib/narrationVoice';
import {openTtsSettings} from '../lib/openTtsSettings';
import {LANGUAGE_LABELS, LANGUAGE_FLAGS} from '../constants/audioConstants';
import {
  groupVoicesByRegion,
  friendlyVoiceLabel,
  findFriendlyVoiceLabel,
} from '../lib/voiceGrouping';

// The "open TTS settings" hint button renders ~34dp tall (8dp padding + a
// ~18dp line) — expand the tap area to the 48dp minimum without changing the
// visual (matches the sibling MiniAudioPlayer's hit-slop treatment).
const SPAIN_HINT_BUTTON_HIT_SLOP = hitSlopToMinTarget(34);

interface VoiceSelectorProps {
  currentVoice: VoiceInfo | null;
  currentLanguage: AudioLanguage;
  onVoiceSelect: (voice: VoiceInfo) => void;
  onLanguageChange: (language: AudioLanguage) => void;
  /**
   * Language of the loaded text (Sprint 100). When set, the narration speaks
   * this language, so the selector locks its list to it and hides the es/en
   * toggle — offering the other language would only let the user pick a voice
   * that would be dropped for not matching the spoken language (Sprint 101).
   */
  contentLanguage?: AudioLanguage | null;
  variant?: 'default' | 'compact';
}

export const VoiceSelector: React.FC<VoiceSelectorProps> = ({
  currentVoice,
  currentLanguage,
  onVoiceSelect,
  onLanguageChange,
  contentLanguage = null,
  variant = 'default',
}) => {
  const {colors} = useTheme();
  const {t} = useLanguage();
  const tv = t.audio.voiceSelector;
  const [modalVisible, setModalVisible] = useState(false);
  const {spanishVoices, englishVoices, isLoading, previewVoice, stopPreview} =
    useVoices();

  // The narration follows the loaded text's language, so lock the list to it
  // when content is loaded (hiding the toggle); otherwise honour the manual pick.
  const {language: listLanguage, locked} = voiceSelectorLanguage({
    contentLanguage,
    selectedLanguage: currentLanguage,
  });
  const voices = listLanguage === 'es' ? spanishVoices : englishVoices;
  // Whether the device has a pinnable es-ES voice — picks which Spanish hint to
  // show: "elige una voz de España" when one is installed vs "descárgala en los
  // ajustes de Texto a voz" + a deep-link button when it isn't (58th session).
  const spainVoiceAvailable = useMemo(
    () => pickDefaultSpanishVoiceId(spanishVoices) !== undefined,
    [spanishVoices],
  );
  const isCompact = variant === 'compact';
  const deviceRegionCode = Localization.getLocales()[0]?.regionCode ?? null;
  const voiceGroups = useMemo(
    () => groupVoicesByRegion(voices, deviceRegionCode, tv.regions),
    [voices, deviceRegionCode, tv.regions],
  );
  const currentVoiceLabel = currentVoice
    ? findFriendlyVoiceLabel(voiceGroups, currentVoice.identifier, tv.voiceWord)
    : null;

  const handleOpenModal = () => {
    haptics.tap();
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    stopPreview();
    setModalVisible(false);
  };

  const handleVoiceSelect = (voice: VoiceInfo) => {
    haptics.press();
    onVoiceSelect(voice);
    handleCloseModal();
  };

  const handlePreview = (voice: VoiceInfo) => {
    haptics.tap();
    previewVoice(voice);
  };

  const handleLanguageSwitch = (lang: AudioLanguage) => {
    haptics.tap();
    onLanguageChange(lang);
  };

  const handleOpenTtsSettings = () => {
    haptics.tap();
    void openTtsSettings();
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
              {listLanguage.toUpperCase()}
            </Text>
          ) : (
            <>
              <View style={styles.triggerTextContainer}>
                <Text
                  style={[styles.triggerLabel, {color: colors.textSecondary}]}>
                  {tv.triggerLabel}
                </Text>
                <Text
                  style={[styles.triggerValue, {color: colors.text}]}
                  numberOfLines={1}>
                  {currentVoiceLabel ?? tv.triggerPlaceholder}
                </Text>
              </View>
              <Text style={styles.languageFlag}>
                {LANGUAGE_FLAGS[listLanguage]}
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
            style={[
              styles.modalContent,
              {
                backgroundColor: colors.cardSolid,
                borderTopColor: colors.border,
              },
            ]}
            onPress={e => e.stopPropagation()}
            {...focusTrapProps()}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, {color: colors.text}]}>
                {tv.modalTitle}
              </Text>
              <TouchableOpacity onPress={handleCloseModal}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            {/* Language Tabs — hidden when the loaded text locks the language
                (the narration follows it, so the other language is unusable). */}
            {locked ? (
              <View style={styles.lockedLanguage}>
                <Text style={styles.languageTabFlag}>
                  {LANGUAGE_FLAGS[listLanguage]}
                </Text>
                <Text style={[styles.lockedLanguageText, {color: colors.text}]}>
                  {LANGUAGE_LABELS[listLanguage]}
                </Text>
              </View>
            ) : (
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
                            currentLanguage === lang
                              ? colors.onPrimary
                              : colors.text,
                        },
                      ]}>
                      {LANGUAGE_LABELS[lang]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Voice List */}
            <ScrollView
              style={styles.voiceList}
              showsVerticalScrollIndicator={false}>
              {isLoading ? (
                <View style={styles.loadingContainer}>
                  <Text
                    style={[styles.loadingText, {color: colors.textSecondary}]}>
                    {tv.loading}
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
                    {tv.empty}
                  </Text>
                </View>
              ) : (
                <>
                  <Text
                    style={[
                      styles.regionListHint,
                      {color: colors.textTertiary},
                    ]}>
                    {tv.regionHint}
                  </Text>
                  {/* RVR1960 renders archaic vosotros enclitic imperatives
                      ("alabadle" …) that Latin-America voices mispronounce but
                      Castilian ones read correctly (57th session). Steer the
                      Spanish-list user toward a Spain voice — and if the phone
                      has none installed, point them to the OS TTS settings to
                      download one (58th session). */}
                  {listLanguage === 'es' && (
                    <View
                      style={[
                        styles.spainHint,
                        {backgroundColor: colors.primaryLight + '20'},
                      ]}>
                      <Ionicons
                        name="information-circle-outline"
                        size={15}
                        color={colors.primary}
                      />
                      <View style={styles.spainHintBody}>
                        <Text
                          style={[styles.spainHintText, {color: colors.text}]}>
                          {spainVoiceAvailable
                            ? tv.spainRecommendation
                            : tv.spainRecommendationNoVoice}
                        </Text>
                        {!spainVoiceAvailable && Platform.OS === 'android' && (
                          <TouchableOpacity
                            style={[
                              styles.spainHintButton,
                              {backgroundColor: colors.primary},
                            ]}
                            hitSlop={SPAIN_HINT_BUTTON_HIT_SLOP}
                            onPress={handleOpenTtsSettings}
                            accessibilityRole="button"
                            accessibilityLabel={tv.openTtsSettings}>
                            <Ionicons
                              name="open-outline"
                              size={14}
                              color={colors.onPrimary}
                            />
                            <Text
                              style={[
                                styles.spainHintButtonText,
                                {color: colors.onPrimary},
                              ]}>
                              {tv.openTtsSettings}
                            </Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  )}
                  {voiceGroups.map(group => (
                    <View key={group.key}>
                      <View style={styles.regionHeader}>
                        <Text style={styles.regionHeaderFlag}>
                          {group.flag}
                        </Text>
                        <Text
                          style={[
                            styles.regionHeaderText,
                            {color: colors.textSecondary},
                          ]}>
                          {group.label}
                        </Text>
                      </View>
                      {group.voices.map((voice, index) => {
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
                                  : staticColors.transparent,
                                borderColor: isSelected
                                  ? colors.primary
                                  : colors.border,
                              },
                            ]}
                            onPress={() => handleVoiceSelect(voice)}>
                            <View style={styles.voiceInfo}>
                              <Text
                                style={[
                                  styles.voiceName,
                                  {color: colors.text},
                                ]}>
                                {friendlyVoiceLabel(
                                  group.label,
                                  index,
                                  tv.voiceWord,
                                )}
                              </Text>
                              <Text
                                style={[
                                  styles.voiceIdentifier,
                                  {color: colors.textTertiary},
                                ]}>
                                {voice.identifier}
                              </Text>
                              {voice.quality !== 'Default' && (
                                <View style={styles.voiceMeta}>
                                  <View
                                    style={[
                                      styles.qualityBadge,
                                      {
                                        backgroundColor:
                                          voice.quality === 'Premium'
                                            ? staticColors.emerald
                                            : staticColors.amber500,
                                      },
                                    ]}>
                                    <Text style={styles.qualityText}>
                                      {voice.quality}
                                    </Text>
                                  </View>
                                </View>
                              )}
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
                      })}
                    </View>
                  ))}
                </>
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
    backgroundColor: staticColors.overlayBlack50,
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: StyleSheet.hairlineWidth,
    maxHeight: '80%',
    paddingBottom: 34,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: staticColors.overlayBlack10,
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
  lockedLanguage: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 8,
  },
  lockedLanguageText: {
    fontSize: 14,
    fontWeight: '600',
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
  regionListHint: {
    fontSize: 12,
    marginTop: 8,
    marginBottom: 4,
  },
  spainHint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
    marginTop: 4,
    marginBottom: 4,
  },
  spainHintBody: {
    flex: 1,
    gap: 6,
  },
  spainHintText: {
    fontSize: 12,
    lineHeight: 16,
  },
  spainHintButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginTop: 2,
  },
  spainHintButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  regionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    marginBottom: 6,
  },
  regionHeaderFlag: {
    fontSize: 16,
  },
  regionHeaderText: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
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
    marginBottom: 2,
  },
  voiceIdentifier: {
    fontSize: 11,
    marginBottom: 4,
  },
  voiceMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  qualityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  qualityText: {
    fontSize: 10,
    fontWeight: '600',
    color: staticColors.white,
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
