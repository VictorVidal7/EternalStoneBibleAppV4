/**
 * ✨ VERSE OF DAY CARD - Tarjeta del Verso del Día
 *
 * Componente hermoso para mostrar el verso diario con:
 * - Glassmorphism y backdrop blur
 * - Tipografía serif para el texto bíblico
 * - Border-left de 4px estilo blockquote
 * - Botones con estados hover/active
 * - Ícono Sparkles con gradiente
 *
 * Para la gloria de Dios - Eternal Bible App
 */

import React, {useState} from 'react';
import {View, StyleSheet, TouchableOpacity, Animated} from 'react-native';
import {AppText as Text} from '../ui/AppText';
import {BlurView} from 'expo-blur';
import {Ionicons} from '@expo/vector-icons';
import {
  createCelestialTheme,
  celestialBorderRadius,
} from '../../styles/celestialTheme';
import {useLanguage} from '../../hooks/useLanguage';
import {useTheme} from '../../hooks/useTheme';
import {usePressScale} from '../../hooks/usePressScale';

interface VerseOfDayCardProps {
  /**
   * Texto del versículo
   */
  verseText: string;

  /**
   * Referencia bíblica (ej: "Juan 3:16")
   */
  reference: string;

  /**
   * Título de la card
   * @default "Verso del Día"
   */
  title?: string;

  /**
   * Callback al presionar la card
   */
  onPress?: () => void;

  /**
   * Callback al presionar el botón de compartir
   */
  onShare?: () => void;

  /**
   * Callback al presionar el botón de favorito
   */
  onFavorite?: () => void;

  /**
   * Modo oscuro
   * @default false
   */
  isDark?: boolean;

  /**
   * Small version tag rendered next to the reference (e.g. "RVR1960") —
   * names the Bible version the verse text comes from (the user's selected
   * reading version). Pass undefined to hide.
   */
  versionLabel?: string;

  /**
   * Callback to open Study mode (S61) for this verse. When provided AND
   * {@link studyConnectionsCount} > 0, the card shows a "study web" CTA that
   * invites the reader into the verse's two-way connection web.
   */
  onStudy?: () => void;

  /**
   * Number of study connections (references + referenced-by) this verse has.
   * Drives the badge on the study CTA; the CTA is hidden when this is 0.
   */
  studyConnectionsCount?: number;
}

const VerseOfDayCard: React.FC<VerseOfDayCardProps> = ({
  verseText,
  reference,
  title,
  onPress,
  onShare,
  onFavorite,
  isDark = false,
  versionLabel,
  onStudy,
  studyConnectionsCount = 0,
}) => {
  const {t} = useLanguage();
  const {colors} = useTheme();
  // Pasar colores dinámicos del tema seleccionado
  const theme = createCelestialTheme(isDark, {
    primary: colors.primary,
    primaryLight: colors.primaryLight,
    primaryDark: colors.primaryDark,
    info: colors.info,
  });
  // Sprint 67: shared, reduce-motion-aware press depress (see usePressScale).
  const press = usePressScale();
  const [isFavorited, setIsFavorited] = useState(false);

  // Use translation if title not provided
  const displayTitle = title || t.home.dailyVerse;

  const handleFavorite = () => {
    setIsFavorited(!isFavorited);
    onFavorite?.();
  };

  return (
    <Animated.View style={{transform: [{scale: press.scale}]}}>
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={onPress}
        onPressIn={press.onPressIn}
        onPressOut={press.onPressOut}
        disabled={!onPress}>
        <BlurView
          intensity={isDark ? 30 : 60}
          tint={isDark ? 'dark' : 'light'}
          style={[
            styles.card,
            {
              backgroundColor: theme.colors.surfaceGlass,
              borderColor: theme.colors.glassBorder,
              borderRadius: celestialBorderRadius.cardMedium, // 24px
            },
            theme.shadows.lg,
          ]}>
          {/* Header con ícono sparkles */}
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <View
                style={[
                  styles.iconContainerBase,
                  styles.iconChipRadius,
                  {backgroundColor: colors.primary + '20'},
                ]}>
                <Ionicons name="sparkles" size={24} color={colors.primary} />
              </View>
            </View>

            <View style={styles.titleContainer}>
              <Text
                scaleRole="display"
                style={[styles.title, {color: theme.colors.text}]}>
                {displayTitle}
              </Text>
              <View style={styles.subtitleRow}>
                <Text
                  scaleRole="compact"
                  style={[
                    styles.subtitle,
                    {color: theme.colors.textSecondary},
                  ]}>
                  {reference}
                </Text>
                {versionLabel ? (
                  <View
                    style={[
                      styles.versionBadge,
                      {
                        backgroundColor: colors.primary + '22',
                        borderColor: colors.primary,
                      },
                    ]}>
                    <Text
                      scaleRole="compact"
                      style={[
                        styles.versionBadgeText,
                        {color: colors.primary},
                      ]}>
                      {versionLabel}
                    </Text>
                  </View>
                ) : null}
              </View>
            </View>
          </View>

          {/* Verso con tipografía serif y border-left */}
          <View
            style={[
              styles.verseContainer,
              {
                borderLeftColor: colors.primary,
              },
            ]}>
            <Text
              scaleRole="body"
              style={[
                styles.verseText,
                {
                  color: theme.colors.text,
                  fontFamily: theme.typography.fontFamily.serif,
                },
              ]}>
              "{verseText}"
            </Text>
          </View>

          {/* Footer con botones de acción */}
          <View style={styles.footer}>
            {/* Botón leer capítulo completo */}
            {onPress && (
              <TouchableOpacity style={styles.actionButton} onPress={onPress}>
                <Text
                  scaleRole="compact"
                  style={[styles.actionText, {color: colors.primary}]}>
                  {t.home.readFullChapter}
                </Text>
                <Ionicons
                  name="arrow-forward"
                  size={18}
                  color={colors.primary}
                />
              </TouchableOpacity>
            )}

            {/* Botones de share y favorite */}
            <View style={styles.iconButtons}>
              {onShare && (
                <TouchableOpacity
                  style={[
                    styles.iconButton,
                    {backgroundColor: theme.colors.hover},
                  ]}
                  onPress={onShare}
                  accessibilityRole="button"
                  accessibilityLabel={t.verse.shareVerse}>
                  <Ionicons
                    name="share-outline"
                    size={20}
                    color={theme.colors.text}
                  />
                </TouchableOpacity>
              )}

              {onFavorite && (
                <TouchableOpacity
                  style={[
                    styles.iconButton,
                    {backgroundColor: theme.colors.hover},
                  ]}
                  onPress={handleFavorite}
                  accessibilityRole="button"
                  accessibilityLabel={
                    isFavorited ? t.verse.removeFavorite : t.verse.addFavorite
                  }
                  accessibilityState={{selected: isFavorited}}>
                  <Ionicons
                    name={isFavorited ? 'heart' : 'heart-outline'}
                    size={20}
                    color={isFavorited ? '#ef4444' : theme.colors.text}
                  />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Study web CTA (S62) — invites the reader into the verse's two-way
              study connections (S61). Hidden when the verse has no connections. */}
          {onStudy && studyConnectionsCount > 0 ? (
            <TouchableOpacity
              style={[
                styles.studyCta,
                {borderTopColor: theme.colors.glassBorder},
              ]}
              onPress={onStudy}
              accessibilityRole="button"
              accessibilityLabel={`${t.home.studyVerse}, ${studyConnectionsCount}`}>
              <Ionicons
                name="git-network-outline"
                size={18}
                color={colors.primary}
              />
              <Text
                scaleRole="compact"
                style={[styles.studyCtaText, {color: colors.primary}]}>
                {t.home.studyVerse}
              </Text>
              <View
                style={[
                  styles.studyBadge,
                  {backgroundColor: colors.primary + '22'},
                ]}>
                <Text
                  scaleRole="compact"
                  style={[styles.studyBadgeText, {color: colors.primary}]}>
                  {studyConnectionsCount}
                </Text>
              </View>
              <Ionicons name="arrow-forward" size={16} color={colors.primary} />
            </TouchableOpacity>
          ) : null}
        </BlurView>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  iconChipRadius: {borderRadius: 12},
  card: {
    borderWidth: 1,
    overflow: 'hidden',
    padding: 24, // celestialSpacing.cardPadding
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconContainer: {
    marginRight: 12,
  },
  iconContainerBase: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 20, // lg
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 12, // xs
    fontWeight: '500',
    marginTop: 2,
    opacity: 0.7,
  },
  subtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  versionBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
  },
  versionBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  verseContainer: {
    borderLeftWidth: 4,
    paddingLeft: 16,
    marginBottom: 16,
  },
  verseText: {
    fontSize: 16, // base
    lineHeight: 25.6, // 16 * 1.6
    fontStyle: 'italic',
    opacity: 0.95,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 16,
    borderTopWidth: 0,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionText: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  iconButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  studyCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
  },
  studyCtaText: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.2,
    flex: 1,
  },
  studyBadge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    paddingHorizontal: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  studyBadgeText: {
    fontSize: 12,
    fontWeight: '800',
  },
});

export default VerseOfDayCard;
