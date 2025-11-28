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
} from 'react-native';
import {LinearGradient} from 'expo-linear-gradient';
import {Ionicons} from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import {useTheme} from '../hooks/useTheme';
import {
  badgeSystemService,
  BadgeProgress,
  Title,
  BadgeRarity,
  BadgeCategory,
} from '../lib/badges/BadgeSystem';

const {width: SCREEN_WIDTH} = Dimensions.get('window');

interface BadgeCollectionScreenProps {
  userId: string;
}

type ViewMode = 'badges' | 'titles';
type FilterCategory = 'all' | BadgeCategory;

export const BadgeCollectionScreen: React.FC<BadgeCollectionScreenProps> = ({
  userId,
}) => {
  const {colors, isDark} = useTheme();

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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [userId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [badges, titles, equipped] = await Promise.all([
        badgeSystemService.getAllBadgesProgress(userId),
        badgeSystemService.getUserTitles(userId),
        badgeSystemService.getEquippedTitle(userId),
      ]);

      setBadgesProgress(badges);
      setUserTitles(titles);
      setEquippedTitle(equipped);
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
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('Error equipping title:', error);
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
      common: 'Común',
      rare: 'Raro',
      epic: 'Épico',
      legendary: 'Legendario',
      mythic: 'Mítico',
    };
    return names[rarity];
  };

  const getCategoryName = (category: BadgeCategory): string => {
    const names = {
      reading: 'Lectura',
      streak: 'Racha',
      completion: 'Completitud',
      knowledge: 'Conocimiento',
      social: 'Social',
      special: 'Especial',
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
  const completionPercent = Math.round((unlockedCount / totalBadges) * 100);

  return (
    <View style={[styles.container, {backgroundColor: colors.background}]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, {color: colors.text}]}>
          Colección de Logros
        </Text>

        {/* Equipped Title Display */}
        {equippedTitle && (
          <TouchableOpacity
            style={[
              styles.equippedTitleCard,
              {backgroundColor: colors.surface},
            ]}
            onPress={() => setViewMode('titles')}>
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
                Título equipado
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
              Desbloqueados
            </Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, {color: colors.accent}]}>
              {completionPercent}%
            </Text>
            <Text style={[styles.statLabel, {color: colors.textSecondary}]}>
              Completado
            </Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, {color: colors.warning}]}>
              {userTitles.length}
            </Text>
            <Text style={[styles.statLabel, {color: colors.textSecondary}]}>
              Títulos
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
          onPress={() => setViewMode('badges')}>
          <Ionicons
            name="trophy"
            size={18}
            color={viewMode === 'badges' ? '#FFF' : colors.text}
          />
          <Text
            style={[
              styles.toggleText,
              {color: viewMode === 'badges' ? '#FFF' : colors.text},
            ]}>
            Badges
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
          onPress={() => setViewMode('titles')}>
          <Ionicons
            name="ribbon"
            size={18}
            color={viewMode === 'titles' ? '#FFF' : colors.text}
          />
          <Text
            style={[
              styles.toggleText,
              {color: viewMode === 'titles' ? '#FFF' : colors.text},
            ]}>
            Títulos
          </Text>
        </TouchableOpacity>
      </View>

      {/* Badges View */}
      {viewMode === 'badges' && (
        <>
          {/* Category Filter */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filterContainer}
            contentContainerStyle={styles.filterContent}>
            <TouchableOpacity
              style={[
                styles.filterChip,
                filterCategory === 'all' && {backgroundColor: colors.primary},
                filterCategory !== 'all' && {backgroundColor: colors.surface},
              ]}
              onPress={() => setFilterCategory('all')}>
              <Text
                style={[
                  styles.filterChipText,
                  {color: filterCategory === 'all' ? '#FFF' : colors.text},
                ]}>
                Todos
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
                onPress={() => setFilterCategory(category)}>
                <Ionicons
                  name={getCategoryIcon(category) as any}
                  size={14}
                  color={filterCategory === category ? '#FFF' : colors.text}
                />
                <Text
                  style={[
                    styles.filterChipText,
                    {
                      color: filterCategory === category ? '#FFF' : colors.text,
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
            contentContainerStyle={styles.badgesGrid}>
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
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSelectedBadge(badgeProgress);
                  }}
                  activeOpacity={0.8}>
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
                      style={[styles.badgeIcon, isLocked && {opacity: 0.3}]}>
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
                        {backgroundColor: 'rgba(0,0,0,0.1)'},
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
          contentContainerStyle={styles.titlesContainer}>
          {userTitles.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🏆</Text>
              <Text style={[styles.emptyText, {color: colors.text}]}>
                Aún no has desbloqueado ningún título
              </Text>
              <Text
                style={[styles.emptySubtext, {color: colors.textSecondary}]}>
                Completa logros para obtener títulos especiales
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
                    isEquipped && {borderColor: title.color, borderWidth: 2},
                  ]}
                  onPress={() => setSelectedTitle(title)}
                  activeOpacity={0.8}>
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
              style={[styles.modalContent, {backgroundColor: colors.surface}]}>
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
                    Progreso: {selectedBadge.currentProgress}/
                    {selectedBadge.badge.requirementValue}
                  </Text>
                  <View
                    style={[
                      styles.progressBarLarge,
                      {backgroundColor: 'rgba(0,0,0,0.1)'},
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
                    {selectedBadge.percentComplete}% completado
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
              style={[styles.modalContent, {backgroundColor: colors.surface}]}>
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
                  <Text style={styles.equipButtonText}>Equipar Título</Text>
                </TouchableOpacity>
              )}

              {equippedTitle?.id === selectedTitle.id && (
                <View
                  style={[
                    styles.equippedIndicator,
                    {backgroundColor: selectedTitle.color},
                  ]}>
                  <Ionicons name="checkmark-circle" size={20} color="#FFF" />
                  <Text style={styles.equippedText}>Título Equipado</Text>
                </View>
              )}
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 16,
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
    backgroundColor: 'rgba(0,0,0,0.1)',
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
  filterContainer: {
    marginBottom: 16,
  },
  filterContent: {
    paddingHorizontal: 16,
    gap: 8,
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
    width: (SCREEN_WIDTH - 52) / 3,
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
    backgroundColor: 'rgba(0,0,0,0.5)',
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
    color: '#FFF',
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
    color: '#FFF',
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
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    padding: 24,
    borderRadius: 20,
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
    color: '#FFF',
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
    color: '#FFF',
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
    color: '#FFF',
  },
});
