/**
 * 🏆 BADGE COLLECTION SCREEN
 *
 * Galería de badges, logros y títulos coleccionables
 * Muestra progreso y permite equipar títulos
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import {LinearGradient} from 'expo-linear-gradient';
import {Ionicons} from '@expo/vector-icons';
import {haptics} from '@lib/haptics';
import {useTheme} from '../hooks/useTheme';
import {useLanguage} from '../hooks/useLanguage';
import {focusTrapProps} from '@lib/a11y/focusTrap';
import {useToast} from '../context/ToastContext';
import {staticColors} from '../styles/designTokens';
import {centeredMaxWidth, CONTENT_MAX_WIDTH} from '../styles/responsive';
import {
  badgeSystemService,
  BadgeProgress,
  Title,
  BadgeRarity,
  BadgeCategory,
} from '../lib/badges/BadgeSystem';
import {ScreenHeaderBack} from '../components/ScreenHeaderBack';
import {router} from 'expo-router';
import {
  AchievementImageModal,
  type ShareableAccomplishment,
} from '../components/insights/AchievementImageModal';

const {width: SCREEN_WIDTH} = Dimensions.get('window');
// Sprint 96: derive the 3-up badge card width from the CAPPED content width on
// wide screens so the grid stays a comfortable size; no-op on phones.
const EFFECTIVE_CONTENT_WIDTH = Math.min(SCREEN_WIDTH, CONTENT_MAX_WIDTH);

interface BadgeCollectionScreenProps {
  userId: string;
}

type ViewMode = 'badges' | 'titles';
type FilterCategory = 'all' | BadgeCategory;

export const BadgeCollectionScreen: React.FC<BadgeCollectionScreenProps> = ({
  userId,
}) => {
  const {colors} = useTheme();
  const {t, language} = useLanguage();
  const toast = useToast();

  // State
  const [viewMode, setViewMode] = useState<ViewMode>('badges');
  const [badgesProgress, setBadgesProgress] = useState<BadgeProgress[]>([]);
  const [userTitles, setUserTitles] = useState<Title[]>([]);
  const [equippedTitle, setEquippedTitle] = useState<Title | null>(null);
  const [filterCategory, setFilterCategory] = useState<FilterCategory>('all');
  const [selectedBadge, setSelectedBadge] = useState<BadgeProgress | null>(
    null,
  );
  const [selectedTitle, setSelectedTitle] = useState<Title | null>(null);
  const [shareAccomplishment, setShareAccomplishment] =
    useState<ShareableAccomplishment | null>(null);
  // Tracks the FIRST load so the stats card never flashes a fabricated "0/0
  // · 0% · 0" while the real progress is still reading from SQLite (Sprint
  // 91). Re-loads on language change don't re-show the spinner because the
  // data is already populated.
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [userId, language]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Persist any badges the user has earned via real progress but that
      // weren't yet recorded in user_badges. Returns the freshly-persisted
      // ones so we can toast them — celebrates the "moment of unlock" the
      // first time the user opens the screen after meeting the requirement.
      const newlyUnlocked =
        await badgeSystemService.persistNewlyUnlockedBadges(userId);

      const [badges, titles, equipped] = await Promise.all([
        badgeSystemService.getAllBadgesProgress(userId),
        badgeSystemService.getUserTitles(userId),
        badgeSystemService.getEquippedTitle(userId),
      ]);

      // Translate badges and titles
      const {
        translateBadge,
        translateBadgeProgress,
        translateTitles,
        translateTitle,
      } = await import('../lib/badges/BadgeTranslationHelper');

      const translatedBadges = await translateBadgeProgress(badges);
      const translatedTitles = await translateTitles(titles);
      const translatedEquipped = equipped
        ? await translateTitle(equipped)
        : null;

      setBadgesProgress(translatedBadges);
      setUserTitles(translatedTitles);
      setEquippedTitle(translatedEquipped);

      // Toast each newly-unlocked badge (translated to the active language)
      // — staggered 600ms so multiple unlocks read as a sequence rather
      // than collapsing into a single toast slot.
      for (let i = 0; i < newlyUnlocked.length; i++) {
        const translated = await translateBadge(newlyUnlocked[i]);
        const message = t.badgeSystem.unlockedToast.replace(
          '{{name}}',
          translated.name,
        );
        setTimeout(() => toast.success(message, 3500), i * 600);
      }
    } catch (error) {
      console.error('Error loading badge data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEquipTitle = async (title: Title) => {
    try {
      await badgeSystemService.equipTitle(userId, title.id);
      setEquippedTitle(title);
      setSelectedTitle(null);
      haptics.success();
    } catch (error) {
      console.error('Error equipping title:', error);
    }
  };

  const handleUnequipTitle = async () => {
    try {
      await badgeSystemService.unequipTitle(userId);
      setEquippedTitle(null);
      setSelectedTitle(null);
      haptics.success();
    } catch (error) {
      console.error('Error unequipping title:', error);
    }
  };

  const getRarityColor = (rarity: BadgeRarity): string => {
    const colors = {
      common: '#9CA3AF',
      rare: '#3B82F6',
      epic: '#8B5CF6',
      legendary: '#F59E0B',
      mythic: '#EC4899',
    };
    return colors[rarity];
  };

  const getRarityName = (rarity: BadgeRarity): string => {
    const names = {
      common: t.badgeSystem.rarity.common,
      rare: t.badgeSystem.rarity.rare,
      epic: t.badgeSystem.rarity.epic,
      legendary: t.badgeSystem.rarity.legendary,
      mythic: t.badgeSystem.rarity.mythic,
    };
    return names[rarity];
  };

  // Long-press a title to share it as an image (same captureRef pipeline as
  // the achievements/constancy/etc. share modals — Sprint 92).
  const handleShareTitle = (title: Title) => {
    haptics.press();
    setShareAccomplishment({
      icon: title.icon,
      title: title.prefix || title.suffix || '',
      description: title.description,
      tierLabel: getRarityName(title.rarity).toUpperCase(),
    });
  };

  const getCategoryName = (category: BadgeCategory): string => {
    const names: Record<BadgeCategory, string> = {
      reading: t.badgeSystem.category.reading,
      streak: t.badgeSystem.category.streak,
      completion: t.badgeSystem.category.completion,
      knowledge: t.badgeSystem.category.knowledge,
      social: t.badgeSystem.category.social,
      special: t.badgeSystem.category.special,
    };
    return names[category];
  };

  const getCategoryIcon = (category: BadgeCategory): string => {
    const icons = {
      reading: 'book',
      streak: 'flame',
      completion: 'checkmark-done',
      knowledge: 'school',
      social: 'people',
      special: 'star',
    };
    return icons[category];
  };

  const filteredBadges =
    filterCategory === 'all'
      ? badgesProgress
      : badgesProgress.filter(bp => bp.badge.category === filterCategory);

  const unlockedCount = badgesProgress.filter(bp => bp.isUnlocked).length;
  const totalBadges = badgesProgress.length;
  // Guard against the empty/cold-load case (0/0) which would render "NaN%".
  const completionPercent =
    totalBadges > 0 ? Math.round((unlockedCount / totalBadges) * 100) : 0;

  // First load: show a spinner under the title instead of a "0/0" stats card.
  if (loading && badgesProgress.length === 0) {
    return (
      <View style={[styles.container, {backgroundColor: colors.background}]}>
        <View style={styles.header}>
          <ScreenHeaderBack style={styles.backButton} />
          <Text style={[styles.title, {color: colors.text}]}>
            {t.badgeSystem.collectionTitle}
          </Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, {backgroundColor: colors.background}]}>
      {/* Header */}
      <View style={styles.header}>
        <ScreenHeaderBack style={styles.backButton} />
        <Text style={[styles.title, {color: colors.text}]}>
          {t.badgeSystem.collectionTitle}
        </Text>

        {/* Cross-link back to the Achievements tab. Badges/titles share the
            same user_stats milestones as the 35 achievements; this bridges
            the two gamification surfaces instead of leaving them isolated
            (Sprint 92). */}
        <TouchableOpacity
          style={styles.achievementsLink}
          onPress={() => router.push('/(tabs)/achievements')}
          accessibilityRole="button"
          accessibilityLabel={t.badgeSystem.viewAllAchievementsA11y}>
          <Ionicons name="trophy-outline" size={16} color={colors.primary} />
          <Text style={[styles.achievementsLinkText, {color: colors.primary}]}>
            {t.badgeSystem.viewAllAchievements}
          </Text>
          <Ionicons name="chevron-forward" size={14} color={colors.primary} />
        </TouchableOpacity>

        {/* Equipped Title Display */}
        {equippedTitle && (
          <TouchableOpacity
            style={[
              styles.equippedTitleCard,
              {backgroundColor: colors.surface},
            ]}
            onPress={() => setViewMode('titles')}
            onLongPress={() => handleShareTitle(equippedTitle)}
            accessibilityRole="button"
            accessibilityHint={t.badgeSystem.shareTitleA11y}
            accessibilityLabel={`${
              equippedTitle.prefix || equippedTitle.suffix
            }, ${t.badgeSystem.equippedTitle}`}>
            <Text style={styles.equippedTitleIcon}>{equippedTitle.icon}</Text>
            <View style={styles.equippedTitleInfo}>
              <Text
                style={[
                  styles.equippedTitleName,
                  {color: equippedTitle.color},
                ]}>
                {equippedTitle.prefix || equippedTitle.suffix}
              </Text>
              <Text
                style={[
                  styles.equippedTitleLabel,
                  {color: colors.textSecondary},
                ]}>
                {t.badgeSystem.equippedTitle}
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={colors.textTertiary}
            />
          </TouchableOpacity>
        )}

        {/* Stats */}
        <View style={[styles.statsCard, {backgroundColor: colors.surface}]}>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, {color: colors.primary}]}>
              {unlockedCount}/{totalBadges}
            </Text>
            <Text style={[styles.statLabel, {color: colors.textSecondary}]}>
              {t.badgeSystem.unlocked}
            </Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, {color: colors.accent}]}>
              {completionPercent}%
            </Text>
            <Text style={[styles.statLabel, {color: colors.textSecondary}]}>
              {t.badgeSystem.completed}
            </Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, {color: colors.warning}]}>
              {userTitles.length}
            </Text>
            <Text style={[styles.statLabel, {color: colors.textSecondary}]}>
              {t.badgeSystem.myTitles}
            </Text>
          </View>
        </View>
      </View>

      {/* View Mode Toggle */}
      <View style={styles.toggleContainer}>
        <TouchableOpacity
          style={[
            styles.toggleButton,
            viewMode === 'badges' && [
              styles.toggleButtonActive,
              {backgroundColor: colors.primary},
            ],
            viewMode !== 'badges' && {backgroundColor: colors.surface},
          ]}
          onPress={() => setViewMode('badges')}
          accessibilityRole="button"
          accessibilityState={{selected: viewMode === 'badges'}}
          accessibilityLabel={t.badgeSystem.allBadges}>
          <Ionicons
            name="trophy"
            size={18}
            color={viewMode === 'badges' ? staticColors.white : colors.text}
          />
          <Text
            style={[
              styles.toggleText,
              {color: viewMode === 'badges' ? staticColors.white : colors.text},
            ]}>
            {t.badgeSystem.allBadges}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.toggleButton,
            viewMode === 'titles' && [
              styles.toggleButtonActive,
              {backgroundColor: colors.primary},
            ],
            viewMode !== 'titles' && {backgroundColor: colors.surface},
          ]}
          onPress={() => setViewMode('titles')}
          accessibilityRole="button"
          accessibilityState={{selected: viewMode === 'titles'}}
          accessibilityLabel={t.badgeSystem.myTitles}>
          <Ionicons
            name="ribbon"
            size={18}
            color={viewMode === 'titles' ? staticColors.white : colors.text}
          />
          <Text
            style={[
              styles.toggleText,
              {color: viewMode === 'titles' ? staticColors.white : colors.text},
            ]}>
            {t.badgeSystem.myTitles}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Badges View */}
      {viewMode === 'badges' && (
        <>
          {/* Category Filter — ONE horizontal row (Sprint 91). It used to be a
              wrapping View because an earlier horizontal scroller stretched the
              chips into full-height bars; that was a flex bug, not an inherent
              one — a ScrollView with no flex (chips sized by their own padding,
              same proven pattern as the Achievements filter and Home feelings
              strip) keeps them to a single tidy row. */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filterScroll}
            contentContainerStyle={styles.filterContainer}>
            <TouchableOpacity
              style={[
                styles.filterChip,
                filterCategory === 'all' && {backgroundColor: colors.primary},
                filterCategory !== 'all' && {backgroundColor: colors.surface},
              ]}
              onPress={() => setFilterCategory('all')}
              accessibilityRole="button"
              accessibilityState={{selected: filterCategory === 'all'}}
              accessibilityLabel={t.badgeSystem.all}>
              <Text
                style={[
                  styles.filterChipText,
                  {
                    color:
                      filterCategory === 'all'
                        ? staticColors.white
                        : colors.text,
                  },
                ]}>
                {t.badgeSystem.all}
              </Text>
            </TouchableOpacity>

            {(
              [
                'reading',
                'streak',
                'completion',
                'knowledge',
                'social',
                'special',
              ] as BadgeCategory[]
            ).map(category => (
              <TouchableOpacity
                key={category}
                style={[
                  styles.filterChip,
                  filterCategory === category && {
                    backgroundColor: colors.primary,
                  },
                  filterCategory !== category && {
                    backgroundColor: colors.surface,
                  },
                ]}
                onPress={() => setFilterCategory(category)}
                accessibilityRole="button"
                accessibilityState={{selected: filterCategory === category}}
                accessibilityLabel={getCategoryName(category)}>
                <Ionicons
                  name={
                    getCategoryIcon(category) as keyof typeof Ionicons.glyphMap
                  }
                  size={14}
                  color={
                    filterCategory === category
                      ? staticColors.white
                      : colors.text
                  }
                />
                <Text
                  style={[
                    styles.filterChipText,
                    {
                      color:
                        filterCategory === category
                          ? staticColors.white
                          : colors.text,
                    },
                  ]}>
                  {getCategoryName(category)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Badges Grid */}
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={[styles.badgesGrid, centeredMaxWidth()]}>
            {filteredBadges.map(badgeProgress => {
              const isLocked = !badgeProgress.isUnlocked;
              return (
                <TouchableOpacity
                  key={badgeProgress.badge.id}
                  style={[
                    styles.badgeCard,
                    {backgroundColor: colors.surface},
                    isLocked && styles.badgeCardLocked,
                  ]}
                  onPress={() => {
                    haptics.tap();
                    setSelectedBadge(badgeProgress);
                  }}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityLabel={`${badgeProgress.badge.name}, ${getRarityName(
                    badgeProgress.badge.rarity,
                  )}, ${
                    isLocked
                      ? `${badgeProgress.percentComplete}%`
                      : t.badgeSystem.unlocked
                  }`}>
                  <LinearGradient
                    colors={
                      isLocked
                        ? ['#6B7280', '#4B5563']
                        : [
                            getRarityColor(badgeProgress.badge.rarity),
                            `${getRarityColor(badgeProgress.badge.rarity)}BB`,
                          ]
                    }
                    start={{x: 0, y: 0}}
                    end={{x: 1, y: 1}}
                    style={styles.badgeIconContainer}>
                    <Text
                      style={[
                        styles.badgeIcon,
                        isLocked && styles.badgeIconLocked,
                      ]}>
                      {badgeProgress.badge.icon}
                    </Text>
                    {isLocked && (
                      <View style={styles.lockOverlay}>
                        <Ionicons name="lock-closed" size={24} color="#FFF" />
                      </View>
                    )}
                  </LinearGradient>

                  <Text
                    style={[
                      styles.badgeName,
                      {color: isLocked ? colors.textTertiary : colors.text},
                    ]}
                    numberOfLines={2}>
                    {badgeProgress.badge.name}
                  </Text>

                  {/* Progress Bar */}
                  {isLocked && (
                    <View
                      style={[
                        styles.progressBarSmall,
                        {backgroundColor: staticColors.overlayBlack10},
                      ]}>
                      <View
                        style={[
                          styles.progressFillSmall,
                          {
                            width: `${badgeProgress.percentComplete}%`,
                            backgroundColor: colors.primary,
                          },
                        ]}
                      />
                    </View>
                  )}

                  <View
                    style={[
                      styles.rarityBadgeSmall,
                      {
                        backgroundColor: getRarityColor(
                          badgeProgress.badge.rarity,
                        ),
                      },
                    ]}>
                    <Text style={styles.rarityTextSmall}>
                      {getRarityName(badgeProgress.badge.rarity)}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </>
      )}

      {/* Titles View */}
      {viewMode === 'titles' && (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.titlesContainer, centeredMaxWidth()]}>
          {userTitles.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🏆</Text>
              <Text style={[styles.emptyText, {color: colors.text}]}>
                {t.badgeSystem.noTitles}
              </Text>
              <Text
                style={[styles.emptySubtext, {color: colors.textSecondary}]}>
                {t.badgeSystem.noTitlesDescription}
              </Text>
            </View>
          ) : (
            userTitles.map(title => {
              const isEquipped = equippedTitle?.id === title.id;
              return (
                <TouchableOpacity
                  key={title.id}
                  style={[
                    styles.titleCard,
                    {backgroundColor: colors.surface},
                    isEquipped && styles.titleCardEquipped,
                    isEquipped && {borderColor: title.color},
                  ]}
                  onPress={() => setSelectedTitle(title)}
                  onLongPress={() => handleShareTitle(title)}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityState={{selected: isEquipped}}
                  accessibilityHint={t.badgeSystem.shareTitleA11y}
                  accessibilityLabel={`${title.prefix || title.suffix}, ${getRarityName(
                    title.rarity,
                  )}${isEquipped ? `, ${t.badgeSystem.equippedTitle}` : ''}`}>
                  <View style={styles.titleHeader}>
                    <Text style={styles.titleIcon}>{title.icon}</Text>
                    <View style={styles.titleInfo}>
                      <Text style={[styles.titleName, {color: title.color}]}>
                        {title.prefix || title.suffix}
                      </Text>
                      <Text
                        style={[
                          styles.titleDescription,
                          {color: colors.textSecondary},
                        ]}>
                        {title.description}
                      </Text>
                    </View>
                    {isEquipped && (
                      <View style={styles.equippedBadge}>
                        <Ionicons
                          name="checkmark-circle"
                          size={24}
                          color={title.color}
                        />
                      </View>
                    )}
                  </View>

                  <View
                    style={[
                      styles.rarityBadge,
                      {backgroundColor: getRarityColor(title.rarity)},
                    ]}>
                    <Text style={styles.rarityText}>
                      {getRarityName(title.rarity)}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>
      )}

      {/* Badge Detail Modal */}
      {selectedBadge && (
        <Modal
          visible={true}
          animationType="fade"
          transparent
          onRequestClose={() => setSelectedBadge(null)}>
          <View style={styles.modalOverlay}>
            <View
              style={[
                styles.modalContent,
                {backgroundColor: colors.surface, borderColor: colors.border},
              ]}
              {...focusTrapProps()}>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setSelectedBadge(null)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>

              <LinearGradient
                colors={[
                  getRarityColor(selectedBadge.badge.rarity),
                  `${getRarityColor(selectedBadge.badge.rarity)}BB`,
                ]}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 1}}
                style={styles.badgeIconLarge}>
                <Text style={styles.badgeIconTextLarge}>
                  {selectedBadge.badge.icon}
                </Text>
              </LinearGradient>

              <Text style={[styles.badgeNameLarge, {color: colors.text}]}>
                {selectedBadge.badge.name}
              </Text>

              <Text
                style={[
                  styles.badgeDescriptionLarge,
                  {color: colors.textSecondary},
                ]}>
                {selectedBadge.badge.description}
              </Text>

              <View
                style={[
                  styles.rarityBadgeLarge,
                  {backgroundColor: getRarityColor(selectedBadge.badge.rarity)},
                ]}>
                <Text style={styles.rarityTextLarge}>
                  {getRarityName(selectedBadge.badge.rarity)}
                </Text>
              </View>

              {!selectedBadge.isUnlocked && (
                <View style={styles.progressSection}>
                  <Text style={[styles.progressText, {color: colors.text}]}>
                    {t.badgeSystem.progress}: {selectedBadge.currentProgress}/
                    {selectedBadge.badge.requirementValue}
                  </Text>
                  <View
                    style={[
                      styles.progressBarLarge,
                      {backgroundColor: staticColors.overlayBlack10},
                    ]}>
                    <View
                      style={[
                        styles.progressFillLarge,
                        {
                          width: `${selectedBadge.percentComplete}%`,
                          backgroundColor: getRarityColor(
                            selectedBadge.badge.rarity,
                          ),
                        },
                      ]}
                    />
                  </View>
                  <Text
                    style={[styles.percentText, {color: colors.textSecondary}]}>
                    {selectedBadge.percentComplete}% {t.badgeSystem.completed}
                  </Text>
                </View>
              )}

              <View style={styles.rewardSection}>
                <Ionicons name="star" size={20} color={colors.warning} />
                <Text style={[styles.rewardText, {color: colors.text}]}>
                  +{selectedBadge.badge.xpReward} XP
                </Text>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* Title Detail Modal */}
      {selectedTitle && (
        <Modal
          visible={true}
          animationType="fade"
          transparent
          onRequestClose={() => setSelectedTitle(null)}>
          <View style={styles.modalOverlay}>
            <View
              style={[
                styles.modalContent,
                {backgroundColor: colors.surface, borderColor: colors.border},
              ]}
              {...focusTrapProps()}>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setSelectedTitle(null)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>

              <Text style={styles.titleIconLarge}>{selectedTitle.icon}</Text>

              <Text
                style={[styles.titleNameLarge, {color: selectedTitle.color}]}>
                {selectedTitle.prefix || selectedTitle.suffix}
              </Text>

              <Text
                style={[
                  styles.titleDescriptionLarge,
                  {color: colors.textSecondary},
                ]}>
                {selectedTitle.description}
              </Text>

              <View
                style={[
                  styles.rarityBadgeLarge,
                  {backgroundColor: getRarityColor(selectedTitle.rarity)},
                ]}>
                <Text style={styles.rarityTextLarge}>
                  {getRarityName(selectedTitle.rarity)}
                </Text>
              </View>

              {equippedTitle?.id !== selectedTitle.id && (
                <TouchableOpacity
                  style={[
                    styles.equipButton,
                    {backgroundColor: selectedTitle.color},
                  ]}
                  onPress={() => handleEquipTitle(selectedTitle)}>
                  <Text style={styles.equipButtonText}>
                    {t.badgeSystem.equip}
                  </Text>
                </TouchableOpacity>
              )}

              {equippedTitle?.id === selectedTitle.id && (
                <>
                  <View
                    style={[
                      styles.equippedIndicator,
                      {backgroundColor: selectedTitle.color},
                    ]}>
                    <Ionicons name="checkmark-circle" size={20} color="#FFF" />
                    <Text style={styles.equippedText}>
                      {t.badgeSystem.equippedTitle}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={[
                      styles.unequipButton,
                      {borderColor: selectedTitle.color},
                    ]}
                    onPress={handleUnequipTitle}>
                    <Text
                      style={[
                        styles.unequipButtonText,
                        {color: selectedTitle.color},
                      ]}>
                      {t.badgeSystem.unequip}
                    </Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        </Modal>
      )}

      {/* Share a title as an image (long-press a title card) */}
      {shareAccomplishment && (
        <AchievementImageModal
          visible
          item={shareAccomplishment}
          headerTitle={t.badgeSystem.shareTitleAction}
          eyebrow={t.badgeSystem.shareEarnedLabel}
          onClose={() => setShareAccomplishment(null)}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  badgeIconLocked: {opacity: 0.3},
  titleCardEquipped: {borderWidth: 2},
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 60,
  },
  backButton: {
    marginBottom: 14,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 10,
  },
  achievementsLink: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    marginBottom: 16,
  },
  achievementsLinkText: {
    fontSize: 14,
    fontWeight: '700',
  },
  equippedTitleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  equippedTitleIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  equippedTitleInfo: {
    flex: 1,
  },
  equippedTitleName: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  equippedTitleLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
  statsCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    backgroundColor: staticColors.overlayBlack10,
  },
  toggleContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  toggleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 12,
    gap: 8,
  },
  toggleButtonActive: {},
  toggleText: {
    fontSize: 14,
    fontWeight: '700',
  },
  // flexGrow:0 keeps the horizontal scroller sized to the chip height (it
  // sits in a flex column, so without this it could stretch — the bug the
  // old wrapping View worked around).
  filterScroll: {
    flexGrow: 0,
    marginBottom: 16,
  },
  filterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    gap: 6,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
  },
  badgesGrid: {
    padding: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  badgeCard: {
    // 3-column grid: subtract the grid's 32px horizontal padding (16×2) + the
    // two 12px gaps between cards (24), plus 2px slack so subpixel rounding
    // never pushes the third card onto a second row.
    width: (EFFECTIVE_CONTENT_WIDTH - 58) / 3,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  badgeCardLocked: {
    opacity: 0.6,
  },
  badgeIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  badgeIcon: {
    fontSize: 32,
  },
  lockOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: staticColors.overlayBlack50,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeName: {
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 6,
    lineHeight: 14,
  },
  progressBarSmall: {
    width: '100%',
    height: 3,
    borderRadius: 1.5,
    marginBottom: 6,
  },
  progressFillSmall: {
    height: '100%',
    borderRadius: 1.5,
  },
  rarityBadgeSmall: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  rarityTextSmall: {
    fontSize: 8,
    fontWeight: '700',
    color: staticColors.white,
    textTransform: 'uppercase',
  },
  titlesContainer: {
    padding: 16,
    gap: 12,
  },
  titleCard: {
    padding: 16,
    borderRadius: 12,
  },
  titleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  titleIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  titleInfo: {
    flex: 1,
  },
  titleName: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  titleDescription: {
    fontSize: 12,
    lineHeight: 16,
  },
  equippedBadge: {
    marginLeft: 8,
  },
  rarityBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  rarityText: {
    fontSize: 10,
    fontWeight: '700',
    color: staticColors.white,
    textTransform: 'uppercase',
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 13,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: staticColors.overlayBlack60,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    padding: 24,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 1,
  },
  badgeIconLarge: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  badgeIconTextLarge: {
    fontSize: 48,
  },
  badgeNameLarge: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 8,
    textAlign: 'center',
  },
  badgeDescriptionLarge: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 16,
  },
  rarityBadgeLarge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 16,
  },
  rarityTextLarge: {
    fontSize: 12,
    fontWeight: '700',
    color: staticColors.white,
    textTransform: 'uppercase',
  },
  progressSection: {
    width: '100%',
    marginBottom: 16,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  progressBarLarge: {
    height: 8,
    borderRadius: 4,
    marginBottom: 8,
  },
  progressFillLarge: {
    height: '100%',
    borderRadius: 4,
  },
  percentText: {
    fontSize: 12,
    textAlign: 'center',
  },
  rewardSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rewardText: {
    fontSize: 16,
    fontWeight: '700',
  },
  titleIconLarge: {
    fontSize: 64,
    marginBottom: 16,
  },
  titleNameLarge: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 8,
    textAlign: 'center',
  },
  titleDescriptionLarge: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 16,
  },
  equipButton: {
    width: '100%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  equipButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: staticColors.white,
  },
  equippedIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    gap: 8,
    marginTop: 8,
  },
  equippedText: {
    fontSize: 14,
    fontWeight: '700',
    color: staticColors.white,
  },
  unequipButton: {
    width: '100%',
    padding: 14,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    marginTop: 8,
    backgroundColor: staticColors.transparent,
  },
  unequipButtonText: {
    fontSize: 15,
    fontWeight: '700',
  },
});
