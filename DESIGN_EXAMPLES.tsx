/**
 * 🎨 EJEMPLOS DE IMPLEMENTACIÓN - Sistema de Diseño Unificado
 * EternalStone Bible App
 *
 * Estos son ejemplos de cómo aplicar el nuevo sistema de diseño
 * a diferentes tipos de tarjetas en la app.
 */

import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import {useTheme} from './hooks/useTheme';

// ============================================================================
// DESIGN TOKENS - Centralizados
// ============================================================================

const DESIGN_TOKENS = {
  // Spacing (8pt grid)
  spacing: {
    xs: 8,
    sm: 12,
    md: 16,
    base: 20,
    lg: 24,
    xl: 32,
  },

  // Border Radius
  radius: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    full: 9999,
  },

  // Elevation (sombras por nivel y modo)
  elevation: {
    level0: {
      light: {},
      dark: {},
    },
    level1: {
      light: {
        shadowColor: '#000000',
        shadowOffset: {width: 0, height: 1},
        shadowOpacity: 0.04,
        shadowRadius: 4,
        elevation: 1,
      },
      dark: {
        shadowColor: '#000000',
        shadowOffset: {width: 0, height: 1},
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 1,
      },
    },
    level2: {
      light: {
        shadowColor: '#000000',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 2,
      },
      dark: {
        shadowColor: '#000000',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 2,
      },
    },
    level3: {
      light: {
        shadowColor: '#000000',
        shadowOffset: {width: 0, height: 4},
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 4,
      },
      dark: {
        shadowColor: '#000000',
        shadowOffset: {width: 0, height: 4},
        shadowOpacity: 0.35,
        shadowRadius: 12,
        elevation: 4,
      },
    },
  },
};

// ============================================================================
// EJEMPLO 1: VERSE CARD (Daily Verse / Destacado)
// Tipo: Primary Card
// ============================================================================

interface VerseCardProps {
  title: string;
  verseText: string;
  reference: string;
  onPress: () => void;
}

export const VerseCard: React.FC<VerseCardProps> = ({
  title,
  verseText,
  reference,
  onPress,
}) => {
  const {colors, isDark} = useTheme();

  return (
    <TouchableOpacity
      style={[
        styles.verseCard,
        {backgroundColor: colors.card},
        isDark
          ? DESIGN_TOKENS.elevation.level2.dark
          : DESIGN_TOKENS.elevation.level2.light,
      ]}
      onPress={onPress}
      activeOpacity={0.7}>
      {/* Título */}
      <Text style={[styles.verseCardTitle, {color: colors.primary}]}>
        {title}
      </Text>

      {/* Texto del versículo */}
      <Text style={[styles.verseCardText, {color: colors.text}]}>
        "{verseText}"
      </Text>

      {/* Referencia */}
      <Text style={[styles.verseCardReference, {color: colors.secondary}]}>
        {reference}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  // ==================== VERSE CARD ====================
  verseCard: {
    // Layout
    borderRadius: DESIGN_TOKENS.radius.lg, // 16dp
    paddingHorizontal: DESIGN_TOKENS.base, // 20dp
    paddingVertical: DESIGN_TOKENS.base, // 20dp
    marginHorizontal: DESIGN_TOKENS.md, // 16dp
    marginVertical: DESIGN_TOKENS.sm, // 12dp

    // NO border (solo sombra)
    borderWidth: 0,
  },

  verseCardTitle: {
    fontSize: 19,
    fontWeight: '800',
    letterSpacing: -0.3,
    marginBottom: DESIGN_TOKENS.sm, // 12dp
  },

  verseCardText: {
    fontSize: 16,
    lineHeight: 24,
    fontStyle: 'italic',
    letterSpacing: 0.1,
    marginBottom: DESIGN_TOKENS.sm, // 12dp
  },

  verseCardReference: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: -0.2,
    textAlign: 'right',
  },
});

// ============================================================================
// EJEMPLO 2: QUICK ACCESS CARD (Home Menu Items)
// Tipo: Primary Card con icono
// ============================================================================

interface QuickAccessCardProps {
  icon: string;
  title: string;
  onPress: () => void;
}

export const QuickAccessCard: React.FC<QuickAccessCardProps> = ({
  icon,
  title,
  onPress,
}) => {
  const {colors, isDark} = useTheme();

  return (
    <TouchableOpacity
      style={[
        styles.quickAccessCard,
        {backgroundColor: colors.card},
        isDark
          ? DESIGN_TOKENS.elevation.level2.dark
          : DESIGN_TOKENS.elevation.level2.light,
      ]}
      onPress={onPress}
      activeOpacity={0.7}>
      {/* Icon container (NO circular, redondeado) */}
      <View
        style={[
          styles.quickAccessIcon,
          {backgroundColor: colors.primary + '15'},
        ]}>
        <Text style={styles.quickAccessEmoji}>{icon}</Text>
      </View>

      {/* Título */}
      <Text style={[styles.quickAccessTitle, {color: colors.text}]}>
        {title}
      </Text>
    </TouchableOpacity>
  );
};

Object.assign(
  styles,
  StyleSheet.create({
    // ==================== QUICK ACCESS CARD ====================
    quickAccessCard: {
      // Layout - Aspecto cuadrado
      width: '48%',
      aspectRatio: 1,
      borderRadius: DESIGN_TOKENS.radius.lg, // 16dp
      padding: DESIGN_TOKENS.base, // 20dp
      marginBottom: DESIGN_TOKENS.base, // 20dp

      // Flexbox
      justifyContent: 'center',
      alignItems: 'center',

      // NO border
      borderWidth: 0,
    },

    quickAccessIcon: {
      // Contenedor redondeado (NO circular)
      width: 56,
      height: 56,
      borderRadius: DESIGN_TOKENS.radius.md, // 12dp
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: DESIGN_TOKENS.md, // 16dp
    },

    quickAccessEmoji: {
      fontSize: 28,
    },

    quickAccessTitle: {
      fontSize: 15,
      fontWeight: '600',
      letterSpacing: -0.2,
      textAlign: 'center',
    },
  }),
);

// ============================================================================
// EJEMPLO 3: BIBLE BOOK CARD (Lista de libros)
// Tipo: Secondary Card (en lista)
// ============================================================================

interface BibleBookCardProps {
  bookName: string;
  testament: 'OT' | 'NT';
  onPress: () => void;
}

export const BibleBookCard: React.FC<BibleBookCardProps> = ({
  bookName,
  testament,
  onPress,
}) => {
  const {colors, isDark} = useTheme();

  return (
    <TouchableOpacity
      style={[
        styles.bibleBookCard,
        {
          backgroundColor: colors.card,
          borderBottomColor: colors.border,
        },
        // Elevación mínima (nivel 1) - solo en dark mode para separación
        isDark ? DESIGN_TOKENS.elevation.level1.dark : {},
      ]}
      onPress={onPress}
      activeOpacity={0.7}>
      {/* Icon container */}
      <View style={[styles.bookIcon, {backgroundColor: colors.primary + '15'}]}>
        <Text style={styles.bookEmoji}>📖</Text>
      </View>

      {/* Book name */}
      <Text style={[styles.bookName, {color: colors.text}]}>{bookName}</Text>

      {/* Chevron */}
      <Text style={[styles.bookChevron, {color: colors.textSecondary}]}>›</Text>
    </TouchableOpacity>
  );
};

Object.assign(
  styles,
  StyleSheet.create({
    // ==================== BIBLE BOOK CARD ====================
    bibleBookCard: {
      // Layout - Item de lista
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: DESIGN_TOKENS.md, // 16dp
      paddingVertical: DESIGN_TOKENS.md, // 16dp

      // Separador hairline (solo en light mode)
      borderBottomWidth: StyleSheet.hairlineWidth,

      // NO border radius (item de lista)
      // NO sombra en light mode (solo hairline separator)
    },

    bookIcon: {
      width: 48,
      height: 48,
      borderRadius: DESIGN_TOKENS.radius.md, // 12dp (redondeado, NO circular)
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: DESIGN_TOKENS.md, // 16dp
    },

    bookEmoji: {
      fontSize: 22,
    },

    bookName: {
      flex: 1,
      fontSize: 17,
      fontWeight: '600',
      letterSpacing: -0.2,
    },

    bookChevron: {
      fontSize: 28,
      fontWeight: '300',
      opacity: 0.6,
    },
  }),
);

// ============================================================================
// EJEMPLO 4: ACHIEVEMENT CARD (Logros)
// Tipo: Primary Card con estado
// ============================================================================

interface AchievementCardProps {
  icon: string;
  title: string;
  description: string;
  progress: number; // 0-100
  isUnlocked: boolean;
  tierColor: string;
  onPress: () => void;
}

export const AchievementCard: React.FC<AchievementCardProps> = ({
  icon,
  title,
  description,
  progress,
  isUnlocked,
  tierColor,
  onPress,
}) => {
  const {colors, isDark} = useTheme();

  return (
    <TouchableOpacity
      style={[
        styles.achievementCard,
        {
          backgroundColor: isUnlocked
            ? isDark
              ? colors.primary + '15'
              : colors.primary + '08'
            : colors.card,
        },
        // Sombra adaptativa según estado
        isUnlocked
          ? isDark
            ? DESIGN_TOKENS.elevation.level2.dark
            : DESIGN_TOKENS.elevation.level2.light
          : isDark
            ? DESIGN_TOKENS.elevation.level1.dark
            : DESIGN_TOKENS.elevation.level1.light,
      ]}
      onPress={onPress}
      activeOpacity={0.7}>
      {/* Icon container */}
      <View
        style={[styles.achievementIcon, {backgroundColor: tierColor + '20'}]}>
        <Text
          style={[styles.achievementEmoji, {opacity: isUnlocked ? 1 : 0.4}]}>
          {icon}
        </Text>
      </View>

      {/* Content */}
      <View style={styles.achievementContent}>
        {/* Title */}
        <Text
          style={[
            styles.achievementTitle,
            {color: isUnlocked ? colors.primary : colors.text},
          ]}>
          {title}
        </Text>

        {/* Description */}
        <Text
          style={[
            styles.achievementDescription,
            {color: colors.textSecondary},
          ]}>
          {description}
        </Text>

        {/* Progress bar (solo si no está desbloqueado) */}
        {!isUnlocked && (
          <View style={styles.achievementProgress}>
            <View
              style={[styles.progressBar, {backgroundColor: colors.border}]}>
              <View
                style={[
                  styles.progressFill,
                  {backgroundColor: tierColor, width: `${progress}%`},
                ]}
              />
            </View>
          </View>
        )}
      </View>

      {/* Unlocked badge */}
      {isUnlocked && (
        <View
          style={[styles.unlockedBadge, {backgroundColor: colors.secondary}]}>
          <Text style={styles.unlockedText}>✓</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

Object.assign(
  styles,
  StyleSheet.create({
    // ==================== ACHIEVEMENT CARD ====================
    achievementCard: {
      // Layout
      flexDirection: 'row',
      borderRadius: DESIGN_TOKENS.radius.lg, // 16dp
      padding: DESIGN_TOKENS.lg, // 24dp (generoso)
      marginHorizontal: DESIGN_TOKENS.md, // 16dp
      marginBottom: DESIGN_TOKENS.md, // 16dp

      // NO border (solo sombra según estado)
      borderWidth: 0,
    },

    achievementIcon: {
      width: 56,
      height: 56,
      borderRadius: DESIGN_TOKENS.radius.md, // 12dp
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: DESIGN_TOKENS.md, // 16dp
    },

    achievementEmoji: {
      fontSize: 28,
    },

    achievementContent: {
      flex: 1,
    },

    achievementTitle: {
      fontSize: 16,
      fontWeight: '700',
      letterSpacing: -0.2,
      marginBottom: DESIGN_TOKENS.xs, // 8dp
    },

    achievementDescription: {
      fontSize: 14,
      lineHeight: 20,
      marginBottom: DESIGN_TOKENS.sm, // 12dp
    },

    achievementProgress: {
      marginTop: DESIGN_TOKENS.xs, // 8dp
    },

    progressBar: {
      height: 6,
      borderRadius: DESIGN_TOKENS.radius.xs, // 4dp
      overflow: 'hidden',
    },

    progressFill: {
      height: '100%',
      borderRadius: DESIGN_TOKENS.radius.xs,
    },

    unlockedBadge: {
      position: 'absolute',
      top: DESIGN_TOKENS.sm,
      right: DESIGN_TOKENS.sm,
      width: 24,
      height: 24,
      borderRadius: 12, // circular OK para badge pequeño
      justifyContent: 'center',
      alignItems: 'center',
    },

    unlockedText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '700',
    },
  }),
);

// ============================================================================
// EJEMPLO 5: SUMMARY CARD (Estadísticas resumen)
// Tipo: Primary Card destacada
// ============================================================================

interface SummaryCardProps {
  items: Array<{
    value: string | number;
    label: string;
  }>;
}

export const SummaryCard: React.FC<SummaryCardProps> = ({items}) => {
  const {colors, isDark} = useTheme();

  return (
    <View
      style={[
        styles.summaryCard,
        {backgroundColor: colors.card},
        isDark
          ? DESIGN_TOKENS.elevation.level2.dark
          : DESIGN_TOKENS.elevation.level2.light,
      ]}>
      {items.map((item, index) => (
        <React.Fragment key={index}>
          {index > 0 && (
            <View
              style={[styles.summaryDivider, {backgroundColor: colors.divider}]}
            />
          )}
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, {color: colors.primary}]}>
              {item.value}
            </Text>
            <Text style={[styles.summaryLabel, {color: colors.textSecondary}]}>
              {item.label}
            </Text>
          </View>
        </React.Fragment>
      ))}
    </View>
  );
};

Object.assign(
  styles,
  StyleSheet.create({
    // ==================== SUMMARY CARD ====================
    summaryCard: {
      // Layout
      flexDirection: 'row',
      borderRadius: DESIGN_TOKENS.radius.lg, // 16dp
      padding: DESIGN_TOKENS.xl, // 32dp (extra generoso)
      marginHorizontal: DESIGN_TOKENS.md, // 16dp
      marginVertical: DESIGN_TOKENS.sm, // 12dp

      // NO border
      borderWidth: 0,
    },

    summaryItem: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: DESIGN_TOKENS.xs, // 8dp
    },

    summaryValue: {
      fontSize: 30, // 2xl
      fontWeight: '800',
      letterSpacing: -0.5,
      marginBottom: DESIGN_TOKENS.xs, // 8dp
    },

    summaryLabel: {
      fontSize: 14,
      textAlign: 'center',
      letterSpacing: -0.1,
    },

    summaryDivider: {
      width: 1,
      marginHorizontal: DESIGN_TOKENS.md, // 16dp (separación generosa)
    },
  }),
);

// ============================================================================
// EJEMPLO 6: CHAPTER BUTTON (Grid de capítulos)
// Tipo: Tertiary Card (elemento pequeño)
// ============================================================================

interface ChapterButtonProps {
  chapter: number;
  onPress: () => void;
}

export const ChapterButton: React.FC<ChapterButtonProps> = ({
  chapter,
  onPress,
}) => {
  const {colors, isDark} = useTheme();

  return (
    <TouchableOpacity
      style={[
        styles.chapterButton,
        {backgroundColor: colors.surface},
        // Nivel 1 muy sutil solo en dark
        isDark ? DESIGN_TOKENS.elevation.level1.dark : {},
      ]}
      onPress={onPress}
      activeOpacity={0.7}>
      <Text style={[styles.chapterNumber, {color: colors.text}]}>
        {chapter}
      </Text>
    </TouchableOpacity>
  );
};

Object.assign(
  styles,
  StyleSheet.create({
    // ==================== CHAPTER BUTTON ====================
    chapterButton: {
      // Layout - Elemento pequeño
      width: 56,
      height: 56,
      borderRadius: DESIGN_TOKENS.radius.md, // 12dp
      justifyContent: 'center',
      alignItems: 'center',
      margin: DESIGN_TOKENS.xs, // 8dp

      // NO border
      borderWidth: 0,
    },

    chapterNumber: {
      fontSize: 18,
      fontWeight: '600',
      letterSpacing: -0.2,
    },
  }),
);

// ============================================================================
// COMPARACIÓN: ANTES vs DESPUÉS
// ============================================================================

/*
❌ ANTES (Problemas):

const oldVerseCard = {
  padding: 16,                    // Inconsistente
  borderRadius: roundness,        // Variable
  margin: 16,                     // No específico
  elevation: 2,                   // Sin diferencia light/dark
  shadowOpacity: 0.1,            // Igual para ambos modos
  borderWidth: 1,                 // Border + shadow = doble marco
  borderColor: colors.border,
}

✅ DESPUÉS (Correcto):

const newVerseCard = {
  paddingHorizontal: 20,          // 8pt grid, específico
  paddingVertical: 20,
  borderRadius: 16,               // Valor fijo del sistema
  marginHorizontal: 16,           // Específico por dirección
  marginVertical: 12,
  // Sombra adaptativa por modo:
  // Light: shadowOpacity: 0.06
  // Dark: shadowOpacity: 0.25
  borderWidth: 0,                 // Sin border (solo sombra)
}

MEJORAS:
✓ Padding más generoso (16 → 20)
✓ Border radius fijo del sistema
✓ Margin específico por dirección
✓ Sombras optimizadas por modo
✓ Un solo nivel de elevación (no border + shadow)
✓ Jerarquía visual clara
*/

export default {
  VerseCard,
  QuickAccessCard,
  BibleBookCard,
  AchievementCard,
  SummaryCard,
  ChapterButton,
};
