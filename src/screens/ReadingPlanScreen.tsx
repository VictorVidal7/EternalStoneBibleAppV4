/**
 * 📚 READING PLAN SCREEN - PREMIUM REDESIGN
 *
 * Pantalla de planes de lectura completamente rediseñada con:
 * - Gradientes impactantes y glassmorphism
 * - Animaciones suaves y profesionales
 * - Indicadores de progreso visuales mejorados
 * - Design tokens modernos
 */

import React, {useCallback, useMemo, useEffect, useRef} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Animated,
  Dimensions,
  ScrollView,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {FlashList} from '@shopify/flash-list';
import {Ionicons} from '@expo/vector-icons';
import {LinearGradient} from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

import {useReadingPlan} from '../context/ReadingPlanContext';
import {readingPlans} from '../data/readingPlans';
import {useTheme} from '../context/ThemeContext';
import {withTheme} from '../hoc/withTheme';
import {useLanguage} from '../hooks/useLanguage';
import {AnalyticsService} from '../services/AnalyticsService';
import {logger} from '../lib/utils/logger';

// Design tokens
import {
  spacing,
  borderRadius,
  fontSize,
  shadows,
} from '../styles/designTokens';

const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} = Dimensions.get('window');

// ==================== INTERFACES ====================

interface PlanReading {
  day: number;
  passages: string[];
}

interface ReadingPlan {
  id: string;
  name: string;
  description: string;
  duration: number;
  readings: PlanReading[];
  color?: string;
  icon?: string;
}

interface PlanProgress {
  [planId: string]: {
    [day: number]: boolean;
  };
}

interface ReadingPlanContextType {
  currentPlan: ReadingPlan | null;
  progress: PlanProgress;
  savePlan: (plan: ReadingPlan) => Promise<void>;
  startPlan?: () => Promise<void>;
  continuePlan?: () => void;
  updateProgress: (day: number) => Promise<void>;
}

interface Theme {
  colors: {
    background: string;
    text: string;
    textSecondary: string;
    textTertiary: string;
    card: string;
    primary: string;
    border: string;
    surface: string;
  };
  isDark: boolean;
}

interface ReadingPlanScreenProps {
  theme: Theme;
}

interface RenderPlanItemProps {
  item: ReadingPlan;
  index: number;
}

// ==================== PLAN CARD COMPONENT ====================

interface PlanCardProps {
  plan: ReadingPlan;
  isCurrentPlan: boolean;
  progressPercentage: number;
  completedDays: number;
  onSelect: () => void;
  colors: Theme['colors'];
  isDark: boolean;
  t: any;
  index: number;
}

const PlanCard: React.FC<PlanCardProps> = ({
  plan,
  isCurrentPlan,
  progressPercentage,
  completedDays,
  onSelect,
  colors,
  isDark,
  t,
  index,
}) => {
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const delay = index * 80;
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSelect();
  };

  const planColor = plan.color || colors.primary;
  const planIcon = (plan.icon || 'book-outline') as keyof typeof Ionicons.glyphMap;

  return (
    <Animated.View
      style={[
        styles.planCardContainer,
        {
          transform: [{scale: scaleAnim}],
          opacity: fadeAnim,
        },
      ]}
    >
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={handlePress}
        style={styles.planCardTouchable}
      >
        <LinearGradient
          colors={
            isCurrentPlan
              ? isDark
                ? [planColor + '45', planColor + '25']
                : [planColor + '35', planColor + '15']
              : isDark
              ? [colors.card, colors.surface]
              : [colors.card, colors.surface]
          }
          start={{x: 0, y: 0}}
          end={{x: 1, y: 1}}
          style={[
            styles.planCardGradient,
            isCurrentPlan && {borderColor: planColor, borderWidth: 2.5},
            !isCurrentPlan && {borderColor: colors.border, borderWidth: 1.5},
          ]}
        >
          {/* Círculo decorativo */}
          <View
            style={[
              styles.planDecorativeCircle,
              {backgroundColor: planColor + '15'},
            ]}
          />

          {/* Header del plan */}
          <View style={styles.planCardHeader}>
            <View
              style={[
                styles.planCardIconContainer,
                {backgroundColor: planColor + '25', borderColor: planColor},
              ]}
            >
              <Ionicons name={planIcon} size={32} color={planColor} />
            </View>

            {isCurrentPlan && (
              <View style={[styles.currentBadge, {backgroundColor: planColor}]}>
                <Ionicons name="checkmark-circle" size={16} color="#ffffff" />
                <Text style={styles.currentBadgeText}>
                  {t.readingPlan.selected || 'Actual'}
                </Text>
              </View>
            )}
          </View>

          {/* Contenido del plan */}
          <View style={styles.planCardContent}>
            <Text style={[styles.planCardName, {color: colors.text}]}>
              {plan.name}
            </Text>

            <Text
              style={[styles.planCardDescription, {color: colors.textSecondary}]}
              numberOfLines={2}
            >
              {plan.description}
            </Text>

            {/* Badge de duración */}
            <View style={styles.planCardMeta}>
              <View
                style={[
                  styles.planDurationTag,
                  {backgroundColor: planColor + '20', borderColor: planColor},
                ]}
              >
                <Ionicons name="calendar-outline" size={16} color={planColor} />
                <Text style={[styles.planDurationText, {color: planColor}]}>
                  {plan.duration} {t.readingPlan.days || 'días'}
                </Text>
              </View>
            </View>

            {/* Progreso (solo si es el plan actual y hay progreso) */}
            {isCurrentPlan && completedDays > 0 && (
              <View style={styles.progressSection}>
                <View style={styles.progressHeader}>
                  <Text
                    style={[styles.progressLabel, {color: colors.textSecondary}]}
                  >
                    {t.readingPlan.progress || 'Progreso'}
                  </Text>
                  <Text style={[styles.progressValue, {color: planColor}]}>
                    {completedDays}/{plan.duration}
                  </Text>
                </View>

                {/* Barra de progreso premium */}
                <View
                  style={[
                    styles.progressBarContainer,
                    {backgroundColor: planColor + '20'},
                  ]}
                >
                  <LinearGradient
                    colors={[planColor, planColor + 'CC']}
                    start={{x: 0, y: 0}}
                    end={{x: 1, y: 0}}
                    style={[
                      styles.progressBarFill,
                      {width: `${Math.min(progressPercentage, 100)}%`},
                    ]}
                  />
                  <View style={styles.progressShine} />
                </View>

                <Text
                  style={[styles.progressPercentage, {color: colors.textTertiary}]}
                >
                  {Math.round(progressPercentage)}% completado
                </Text>
              </View>
            )}
          </View>

          {/* Botón de acción */}
          <View style={styles.planCardFooter}>
            <View
              style={[
                styles.planActionButton,
                isCurrentPlan
                  ? {backgroundColor: planColor}
                  : {backgroundColor: colors.surface, borderColor: planColor, borderWidth: 1.5},
              ]}
            >
              <Text
                style={[
                  styles.planActionText,
                  {color: isCurrentPlan ? '#ffffff' : planColor},
                ]}
              >
                {isCurrentPlan
                  ? t.readingPlan.selected || 'Plan Actual'
                  : t.readingPlan.selectPlan || 'Seleccionar Plan'}
              </Text>
              <Ionicons
                name={isCurrentPlan ? 'checkmark-circle' : 'arrow-forward-circle'}
                size={20}
                color={isCurrentPlan ? '#ffffff' : planColor}
              />
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
};

// ==================== MAIN COMPONENT ====================

const ReadingPlanScreen: React.FC<ReadingPlanScreenProps> = ({theme}) => {
  const navigation = useNavigation<any>();
  const {
    currentPlan,
    savePlan,
    progress,
    startPlan,
    continuePlan,
    updateProgress,
  } = useReadingPlan() as ReadingPlanContextType;
  const {colors, isDark} = theme;
  const {t} = useLanguage();

  const floatingButtonScale = useRef(new Animated.Value(0)).current;
  const headerFadeAnim = useRef(new Animated.Value(0)).current;
  const headerSlideAnim = useRef(new Animated.Value(-50)).current;

  const styles = useMemo(() => createStyles(colors), [colors]);

  // ==================== EFFECTS ====================

  useEffect(() => {
    logger.breadcrumb('ReadingPlanScreen mounted', 'screen-lifecycle', {
      hasCurrentPlan: !!currentPlan,
      progressKeys: progress ? Object.keys(progress).length : 0,
    });

    // Animaciones de entrada
    Animated.parallel([
      Animated.timing(headerFadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(headerSlideAnim, {
        toValue: 0,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();

    // Animar botón flotante si hay plan actual
    if (currentPlan) {
      Animated.spring(floatingButtonScale, {
        toValue: 1,
        tension: 100,
        friction: 7,
        delay: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [currentPlan]);

  // ==================== HANDLERS ====================

  const handlePlanSelection = useCallback(
    (plan: ReadingPlan) => {
      logger.breadcrumb('Plan selection initiated', 'user-action', {
        planId: plan.id,
        planName: plan.name,
        hasCurrentPlan: !!currentPlan,
        isChangingPlan: currentPlan?.id !== plan.id,
      });

      if (currentPlan && currentPlan.id !== plan.id) {
        Alert.alert(
          t.readingPlan.changePlanTitle || 'Cambiar plan',
          t.readingPlan.changePlanMessage || '¿Deseas cambiar de plan de lectura?',
          [
            {
              text: t.cancel || 'Cancelar',
              style: 'cancel',
              onPress: () => {
                logger.breadcrumb('Plan change cancelled', 'user-action', {
                  planId: plan.id,
                });
              },
            },
            {
              text: t.change || 'Cambiar',
              onPress: async () => {
                try {
                  await savePlan(plan);
                  AnalyticsService.logEvent('reading_plan_changed', {
                    planId: plan.id,
                  });
                  Haptics.notificationAsync(
                    Haptics.NotificationFeedbackType.Success
                  );
                  logger.breadcrumb('Plan changed successfully', 'user-action', {
                    newPlanId: plan.id,
                    previousPlanId: currentPlan.id,
                  });
                } catch (error) {
                  logger.error('Failed to change plan', error as Error, {
                    screen: 'ReadingPlanScreen',
                    action: 'handlePlanSelection',
                    planId: plan.id,
                  });
                }
              },
            },
          ]
        );
      } else if (!currentPlan) {
        savePlan(plan)
          .then(() => {
            AnalyticsService.logEvent('reading_plan_selected', {
              planId: plan.id,
            });
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            logger.breadcrumb('Plan selected successfully', 'user-action', {
              planId: plan.id,
            });
          })
          .catch(error => {
            logger.error('Failed to select plan', error as Error, {
              screen: 'ReadingPlanScreen',
              action: 'handlePlanSelection',
              planId: plan.id,
            });
          });
      }
    },
    [currentPlan, savePlan, t]
  );

  const handleStartContinuePlan = useCallback(() => {
    logger.breadcrumb('Start/Continue plan initiated', 'user-action', {
      hasCurrentPlan: !!currentPlan,
      currentPlanId: currentPlan?.id,
      hasProgress: progress && currentPlan ? !!progress[currentPlan.id] : false,
    });

    if (currentPlan) {
      const hasPlanProgress = progress && progress[currentPlan.id];

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      if (hasPlanProgress) {
        logger.debug('Continuing existing plan', {
          screen: 'ReadingPlanScreen',
          action: 'handleStartContinuePlan',
          planId: currentPlan.id,
          completedDays: Object.keys(progress[currentPlan.id]).length,
        });

        if (continuePlan) {
          continuePlan();
        }

        AnalyticsService.logEvent('reading_plan_continued', {
          planId: currentPlan.id,
        });
      } else {
        logger.debug('Starting new plan', {
          screen: 'ReadingPlanScreen',
          action: 'handleStartContinuePlan',
          planId: currentPlan.id,
        });

        if (startPlan) {
          startPlan().catch(error => {
            logger.error('Failed to start plan', error as Error, {
              screen: 'ReadingPlanScreen',
              action: 'handleStartContinuePlan',
              planId: currentPlan.id,
            });
          });
        }

        AnalyticsService.logEvent('reading_plan_started', {
          planId: currentPlan.id,
        });
      }

      navigation.navigate('Biblia', {
        screen: 'BibleList',
        params: {fromReadingPlan: true},
      });
    } else {
      logger.warn('Attempted to start plan without selection', {
        screen: 'ReadingPlanScreen',
        action: 'handleStartContinuePlan',
      });

      Alert.alert(
        t.readingPlan.noPlanSelectedTitle || 'Sin plan',
        t.readingPlan.noPlanSelectedMessage || 'Por favor selecciona un plan primero'
      );
    }
  }, [currentPlan, progress, continuePlan, startPlan, navigation, t]);

  // ==================== RENDER FUNCTIONS ====================

  const renderPlanItem = useCallback(
    ({item, index}: RenderPlanItemProps) => {
      const isCurrentPlan = currentPlan?.id === item.id;
      const planProgress = progress?.[item.id] || {};
      const completedDays = Object.keys(planProgress).length;
      const progressPercentage = (completedDays / item.duration) * 100;

      return (
        <PlanCard
          plan={item}
          isCurrentPlan={isCurrentPlan}
          progressPercentage={progressPercentage}
          completedDays={completedDays}
          onSelect={() => handlePlanSelection(item)}
          colors={colors}
          isDark={isDark}
          t={t}
          index={index}
        />
      );
    },
    [colors, currentPlan, progress, handlePlanSelection, t, isDark]
  );

  const getItemType = useCallback(() => 'plan-item', []);

  const renderListHeader = useCallback(() => {
    return (
      <Animated.View
        style={{
          opacity: headerFadeAnim,
          transform: [{translateY: headerSlideAnim}],
        }}
      >
        {/* Hero Header */}
        <LinearGradient
          colors={
            isDark
              ? ['#10b981', '#059669', '#047857']
              : ['#34d399', '#10b981', '#059669']
          }
          start={{x: 0, y: 0}}
          end={{x: 1, y: 1}}
          style={styles.heroHeader}
        >
          {/* Estrellas decorativas */}
          <View style={styles.starsContainer}>
            <Ionicons
              name="star"
              size={20}
              color="rgba(255,255,255,0.3)"
              style={styles.star1}
            />
            <Ionicons
              name="star"
              size={16}
              color="rgba(255,255,255,0.2)"
              style={styles.star2}
            />
            <Ionicons
              name="star"
              size={12}
              color="rgba(255,255,255,0.25)"
              style={styles.star3}
            />
          </View>

          <Ionicons name="book" size={56} color="#ffffff" />
          <Text style={styles.heroTitle}>
            {t.readingPlan.title || 'Planes de Lectura'}
          </Text>
          <Text style={styles.heroSubtitle}>
            {t.readingPlan.subtitle ||
              'Comienza tu viaje a través de la Biblia'}
          </Text>

          {/* Stats si hay plan actual */}
          {currentPlan && (
            <View style={styles.heroStats}>
              <View style={styles.heroStatItem}>
                <Ionicons name="calendar" size={24} color="#fbbf24" />
                <Text style={styles.heroStatValue}>
                  {progress && currentPlan && progress[currentPlan.id]
                    ? Object.keys(progress[currentPlan.id]).length
                    : 0}
                </Text>
                <Text style={styles.heroStatLabel}>
                  {t.readingPlan.daysCompleted || 'Días'}
                </Text>
              </View>

              <View style={styles.heroStatDivider} />

              <View style={styles.heroStatItem}>
                <Ionicons name="flame" size={24} color="#fbbf24" />
                <Text style={styles.heroStatValue}>
                  {progress && currentPlan && progress[currentPlan.id]
                    ? Math.round(
                        (Object.keys(progress[currentPlan.id]).length /
                          currentPlan.duration) *
                          100
                      )
                    : 0}
                  %
                </Text>
                <Text style={styles.heroStatLabel}>
                  {t.readingPlan.progress || 'Progreso'}
                </Text>
              </View>
            </View>
          )}
        </LinearGradient>

        {/* Sección de planes disponibles */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, {color: colors.text}]}>
            {t.readingPlan.availablePlans || 'Planes Disponibles'}
          </Text>
          <Ionicons name="library" size={20} color={colors.primary} />
        </View>
      </Animated.View>
    );
  }, [headerFadeAnim, headerSlideAnim, currentPlan, progress, colors, isDark, t]);

  const memoizedPlans = useMemo(() => readingPlans as ReadingPlan[], []);

  // ==================== RENDER ====================

  return (
    <View style={styles.container} testID="reading-plan-screen">
      <FlashList
        data={memoizedPlans}
        renderItem={renderPlanItem}
        keyExtractor={item => item.id}
        getItemType={getItemType}
        ListHeaderComponent={renderListHeader}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={true}
        estimatedItemSize={300}
        drawDistance={400}
      />

      {/* Floating Action Button */}
      {currentPlan && (
        <Animated.View
          style={[
            styles.floatingButtonContainer,
            {transform: [{scale: floatingButtonScale}]},
          ]}
        >
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={handleStartContinuePlan}
            style={styles.floatingButton}
          >
            <LinearGradient
              colors={
                isDark
                  ? ['#3b82f6', '#2563eb']
                  : ['#60a5fa', '#3b82f6']
              }
              start={{x: 0, y: 0}}
              end={{x: 1, y: 1}}
              style={styles.floatingButtonGradient}
            >
              <Ionicons
                name={
                  progress && currentPlan && progress[currentPlan.id]
                    ? 'play-circle'
                    : 'rocket'
                }
                size={24}
                color="#ffffff"
              />
              <Text style={styles.floatingButtonText}>
                {progress && currentPlan && progress[currentPlan.id]
                  ? t.readingPlan.continueReading || 'Continuar'
                  : t.readingPlan.startPlan || 'Comenzar'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      )}
    </View>
  );
};

// ==================== STYLES ====================

const createStyles = (colors: Theme['colors']) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    listContent: {
      paddingBottom: 100,
    },

    // Hero Header
    heroHeader: {
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing['2xl'],
      alignItems: 'center',
      marginBottom: spacing.xl,
      borderBottomLeftRadius: borderRadius['2xl'],
      borderBottomRightRadius: borderRadius['2xl'],
      ...shadows.xl,
      position: 'relative',
      overflow: 'hidden',
    },
    starsContainer: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
    },
    star1: {
      position: 'absolute',
      top: 30,
      right: 40,
    },
    star2: {
      position: 'absolute',
      top: 70,
      right: 100,
    },
    star3: {
      position: 'absolute',
      top: 50,
      left: 50,
    },
    heroTitle: {
      fontSize: fontSize['3xl'],
      fontWeight: '700',
      color: '#ffffff',
      marginTop: spacing.base,
      marginBottom: spacing.xs,
      textAlign: 'center',
    },
    heroSubtitle: {
      fontSize: fontSize.base,
      color: 'rgba(255,255,255,0.9)',
      textAlign: 'center',
      marginBottom: spacing.lg,
    },
    heroStats: {
      flexDirection: 'row',
      backgroundColor: 'rgba(255,255,255,0.15)',
      borderRadius: borderRadius.lg,
      paddingVertical: spacing.base,
      paddingHorizontal: spacing.lg,
      alignItems: 'center',
    },
    heroStatItem: {
      alignItems: 'center',
      flex: 1,
    },
    heroStatValue: {
      fontSize: fontSize['2xl'],
      fontWeight: '700',
      color: '#ffffff',
      marginTop: spacing.xs,
    },
    heroStatLabel: {
      fontSize: fontSize.xs,
      color: 'rgba(255,255,255,0.8)',
      marginTop: 2,
    },
    heroStatDivider: {
      width: 1,
      height: 40,
      backgroundColor: 'rgba(255,255,255,0.2)',
      marginHorizontal: spacing.md,
    },

    // Section Header
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.lg,
      marginBottom: spacing.base,
    },
    sectionTitle: {
      fontSize: fontSize.xl,
      fontWeight: '700',
    },

    // Plan Card
    planCardContainer: {
      marginBottom: spacing.base,
      marginHorizontal: spacing.lg,
    },
    planCardTouchable: {
      flex: 1,
    },
    planCardGradient: {
      borderRadius: borderRadius.xl,
      overflow: 'hidden',
      ...shadows.lg,
      position: 'relative',
    },
    planDecorativeCircle: {
      position: 'absolute',
      width: 150,
      height: 150,
      borderRadius: 75,
      top: -50,
      right: -30,
      opacity: 0.3,
    },
    planCardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: spacing.base,
    },
    planCardIconContainer: {
      width: 68,
      height: 68,
      borderRadius: borderRadius['2xl'],
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 2.5,
      ...shadows.md,
    },
    currentBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: borderRadius.lg,
      gap: 4,
    },
    currentBadgeText: {
      fontSize: fontSize.xs,
      fontWeight: '700',
      color: '#ffffff',
    },
    planCardContent: {
      paddingHorizontal: spacing.base,
      paddingBottom: spacing.base,
    },
    planCardName: {
      fontSize: fontSize['2xl'],
      fontWeight: '700',
      marginBottom: spacing.xs,
      lineHeight: fontSize['2xl'] * 1.3,
    },
    planCardDescription: {
      fontSize: fontSize.base,
      lineHeight: fontSize.base * 1.5,
      marginBottom: spacing.md,
    },
    planCardMeta: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginBottom: spacing.md,
    },
    planDurationTag: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: borderRadius.md,
      gap: 4,
      borderWidth: 1.5,
    },
    planDurationText: {
      fontSize: fontSize.sm,
      fontWeight: '600',
    },

    // Progress Section
    progressSection: {
      marginTop: spacing.base,
      paddingTop: spacing.base,
      borderTopWidth: 1,
      borderTopColor: 'rgba(128,128,128,0.2)',
    },
    progressHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.xs,
    },
    progressLabel: {
      fontSize: fontSize.sm,
      fontWeight: '600',
    },
    progressValue: {
      fontSize: fontSize.sm,
      fontWeight: '700',
    },
    progressBarContainer: {
      height: 8,
      borderRadius: borderRadius.md,
      overflow: 'hidden',
      position: 'relative',
    },
    progressBarFill: {
      height: '100%',
      borderRadius: borderRadius.md,
      ...shadows.sm,
    },
    progressShine: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: 4,
      backgroundColor: 'rgba(255,255,255,0.3)',
      borderTopLeftRadius: borderRadius.md,
      borderTopRightRadius: borderRadius.md,
    },
    progressPercentage: {
      fontSize: fontSize.xs,
      marginTop: spacing.xs,
      textAlign: 'right',
    },

    // Plan Card Footer
    planCardFooter: {
      padding: spacing.base,
    },
    planActionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.base,
      borderRadius: borderRadius.lg,
      gap: spacing.xs,
      ...shadows.sm,
    },
    planActionText: {
      fontSize: fontSize.base,
      fontWeight: '700',
    },

    // Floating Button
    floatingButtonContainer: {
      position: 'absolute',
      bottom: spacing.xl,
      right: spacing.lg,
      left: spacing.lg,
    },
    floatingButton: {
      borderRadius: borderRadius.xl,
      overflow: 'hidden',
      ...shadows.xl,
    },
    floatingButtonGradient: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: spacing.base,
      paddingHorizontal: spacing.lg,
      gap: spacing.sm,
    },
    floatingButtonText: {
      fontSize: fontSize.lg,
      fontWeight: '700',
      color: '#ffffff',
    },
  });

export default withTheme(React.memo(ReadingPlanScreen));
