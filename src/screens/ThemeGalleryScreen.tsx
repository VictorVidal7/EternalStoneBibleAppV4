/**
 * 🎨 THEME GALLERY SCREEN
 *
 * Pantalla para explorar, previsualizar y desbloquear temas premium
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Alert,
} from 'react-native';
import {LinearGradient} from 'expo-linear-gradient';
import {Ionicons} from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import {
  PREMIUM_THEMES,
  PremiumTheme,
  ThemeRarity,
  getRarityColor,
  getUnlockedThemes,
} from '../lib/themes/premiumThemes';
import {useTheme} from '../hooks/useTheme';

const {width: SCREEN_WIDTH} = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - 40;

interface ThemeGalleryScreenProps {
  userLevel: number;
  userStreak: number;
  achievementCount: number;
  onThemeSelect: (themeId: string) => void;
  currentThemeId: string;
}

export const ThemeGalleryScreen: React.FC<ThemeGalleryScreenProps> = ({
  userLevel,
  userStreak,
  achievementCount,
  onThemeSelect,
  currentThemeId,
}) => {
  const {colors, isDark} = useTheme();
  const [selectedCategory, setSelectedCategory] = useState<'all' | ThemeRarity>(
    'all',
  );

  const unlockedThemes = getUnlockedThemes(
    userLevel,
    userStreak,
    achievementCount,
  );
  const unlockedThemeIds = new Set(unlockedThemes.map(t => t.id));

  const allThemes = Object.values(PREMIUM_THEMES);

  const filteredThemes =
    selectedCategory === 'all'
      ? allThemes
      : allThemes.filter(t => t.rarity === selectedCategory);

  const handleThemePress = (theme: PremiumTheme) => {
    if (!unlockedThemeIds.has(theme.id)) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      showUnlockInfo(theme);
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onThemeSelect(theme.id);
  };

  const showUnlockInfo = (theme: PremiumTheme) => {
    let message = '';

    switch (theme.unlockMethod) {
      case 'level':
        message = `Alcanza el nivel ${theme.unlockRequirement} para desbloquear este tema.\nNivel actual: ${userLevel}`;
        break;
      case 'streak':
        message = `Mantén una racha de ${theme.unlockRequirement} días para desbloquear este tema.\nRacha actual: ${userStreak} días`;
        break;
      case 'achievement':
        message = `Desbloquea ${theme.unlockRequirement} logros para obtener este tema.\nLogros actuales: ${achievementCount}`;
        break;
      case 'purchase':
        message = 'Este tema premium está disponible por compra.';
        break;
      case 'event':
        message =
          'Este tema especial estará disponible durante eventos limitados.';
        break;
    }

    Alert.alert(`🔒 ${theme.name}`, message);
  };

  const getRarityName = (rarity: ThemeRarity): string => {
    const names: Record<ThemeRarity, string> = {
      common: 'Común',
      rare: 'Raro',
      epic: 'Épico',
      legendary: 'Legendario',
      mythic: 'Mítico',
    };
    return names[rarity];
  };

  return (
    <View style={[styles.container, {backgroundColor: colors.background}]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, {color: colors.text}]}>
          Galería de Temas
        </Text>
        <Text style={[styles.subtitle, {color: colors.textSecondary}]}>
          {unlockedThemes.length} de {allThemes.length} desbloqueados
        </Text>
      </View>

      {/* Category Filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterContainer}
        contentContainerStyle={styles.filterContent}>
        <TouchableOpacity
          style={[
            styles.filterChip,
            selectedCategory === 'all' && styles.filterChipActive,
            {
              backgroundColor:
                selectedCategory === 'all' ? colors.primary : colors.surface,
              borderColor: colors.border,
            },
          ]}
          onPress={() => setSelectedCategory('all')}>
          <Text
            style={[
              styles.filterChipText,
              {color: selectedCategory === 'all' ? '#FFF' : colors.text},
            ]}>
            Todos
          </Text>
        </TouchableOpacity>

        {Object.values(ThemeRarity).map(rarity => (
          <TouchableOpacity
            key={rarity}
            style={[
              styles.filterChip,
              selectedCategory === rarity && styles.filterChipActive,
              {
                backgroundColor:
                  selectedCategory === rarity
                    ? getRarityColor(rarity)
                    : colors.surface,
                borderColor: getRarityColor(rarity),
              },
            ]}
            onPress={() => setSelectedCategory(rarity)}>
            <Text
              style={[
                styles.filterChipText,
                {color: selectedCategory === rarity ? '#FFF' : colors.text},
              ]}>
              {getRarityName(rarity)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Themes Grid */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.themesContainer}
        showsVerticalScrollIndicator={false}>
        {filteredThemes.map(theme => {
          const isUnlocked = unlockedThemeIds.has(theme.id);
          const isActive = theme.id === currentThemeId;

          return (
            <TouchableOpacity
              key={theme.id}
              style={[
                styles.themeCard,
                !isUnlocked && styles.themeCardLocked,
                isActive && styles.themeCardActive,
                {backgroundColor: colors.surface},
              ]}
              onPress={() => handleThemePress(theme)}
              activeOpacity={0.8}>
              {/* Theme Preview */}
              <LinearGradient
                colors={theme.colors.primaryGradient}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 1}}
                style={styles.themePreview}>
                {!isUnlocked && (
                  <View style={styles.lockedOverlay}>
                    <Ionicons name="lock-closed" size={32} color="#FFF" />
                  </View>
                )}

                {isActive && (
                  <View style={styles.activeBadge}>
                    <Ionicons
                      name="checkmark-circle"
                      size={24}
                      color="#10B981"
                    />
                  </View>
                )}

                <Text style={styles.themePreviewEmoji}>{theme.preview}</Text>

                {/* Particles indicator */}
                {theme.hasParticles && (
                  <View style={styles.featureBadge}>
                    <Ionicons name="sparkles" size={14} color="#FFF" />
                  </View>
                )}
              </LinearGradient>

              {/* Theme Info */}
              <View style={styles.themeInfo}>
                <View style={styles.themeHeader}>
                  <Text
                    style={[
                      styles.themeName,
                      {color: isUnlocked ? colors.text : colors.textTertiary},
                    ]}
                    numberOfLines={1}>
                    {theme.name}
                  </Text>
                  <View
                    style={[
                      styles.rarityBadge,
                      {backgroundColor: getRarityColor(theme.rarity)},
                    ]}>
                    <Text style={styles.rarityText}>
                      {getRarityName(theme.rarity)}
                    </Text>
                  </View>
                </View>

                <Text
                  style={[
                    styles.themeDescription,
                    {color: colors.textSecondary},
                  ]}
                  numberOfLines={2}>
                  {theme.description}
                </Text>

                {/* Features */}
                <View style={styles.features}>
                  {theme.hasAnimation && (
                    <View style={styles.featureTag}>
                      <Ionicons name="flash" size={12} color={colors.accent} />
                      <Text
                        style={[
                          styles.featureText,
                          {color: colors.textSecondary},
                        ]}>
                        Animado
                      </Text>
                    </View>
                  )}
                  {theme.isDark ? (
                    <View style={styles.featureTag}>
                      <Ionicons
                        name="moon"
                        size={12}
                        color={colors.textSecondary}
                      />
                      <Text
                        style={[
                          styles.featureText,
                          {color: colors.textSecondary},
                        ]}>
                        Oscuro
                      </Text>
                    </View>
                  ) : (
                    <View style={styles.featureTag}>
                      <Ionicons name="sunny" size={12} color={colors.warning} />
                      <Text
                        style={[
                          styles.featureText,
                          {color: colors.textSecondary},
                        ]}>
                        Claro
                      </Text>
                    </View>
                  )}
                </View>

                {/* Unlock info */}
                {!isUnlocked && (
                  <View style={styles.unlockInfo}>
                    <Ionicons
                      name="lock-closed"
                      size={12}
                      color={colors.textTertiary}
                    />
                    <Text
                      style={[styles.unlockText, {color: colors.textTertiary}]}>
                      {theme.unlockMethod === 'level' &&
                        `Nivel ${theme.unlockRequirement}`}
                      {theme.unlockMethod === 'streak' &&
                        `${theme.unlockRequirement} días`}
                      {theme.unlockMethod === 'achievement' &&
                        `${theme.unlockRequirement} logros`}
                      {theme.unlockMethod === 'purchase' && 'Premium'}
                      {theme.unlockMethod === 'event' && 'Evento'}
                    </Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Stats Footer */}
      <View
        style={[
          styles.footer,
          {backgroundColor: colors.surface, borderTopColor: colors.border},
        ]}>
        <View style={styles.statItem}>
          <Ionicons name="star" size={20} color={colors.warning} />
          <Text style={[styles.statText, {color: colors.textSecondary}]}>
            Nivel {userLevel}
          </Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="flame" size={20} color="#F97316" />
          <Text style={[styles.statText, {color: colors.textSecondary}]}>
            {userStreak} días
          </Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="trophy" size={20} color={colors.accent} />
          <Text style={[styles.statText, {color: colors.textSecondary}]}>
            {achievementCount} logros
          </Text>
        </View>
      </View>
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
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  filterContainer: {
    maxHeight: 50,
    marginBottom: 16,
  },
  filterContent: {
    paddingHorizontal: 20,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterChipActive: {
    borderWidth: 0,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  themesContainer: {
    padding: 20,
    paddingTop: 0,
    gap: 16,
  },
  themeCard: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  themeCardLocked: {
    opacity: 0.7,
  },
  themeCardActive: {
    borderWidth: 3,
    borderColor: '#10B981',
  },
  themePreview: {
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  themePreviewEmoji: {
    fontSize: 56,
  },
  lockedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#FFF',
    borderRadius: 12,
  },
  featureBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  themeInfo: {
    padding: 16,
  },
  themeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  themeName: {
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
    marginRight: 8,
  },
  rarityBadge: {
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
  themeDescription: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
  },
  features: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  featureTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  featureText: {
    fontSize: 11,
    fontWeight: '500',
  },
  unlockInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  unlockText: {
    fontSize: 12,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
    borderTopWidth: 1,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
