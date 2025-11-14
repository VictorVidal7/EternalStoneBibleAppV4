import React, {useCallback, useMemo, useEffect} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ViewToken,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {FlashList} from '@shopify/flash-list';
import {useReadingPlan} from '../context/ReadingPlanContext';
import {readingPlans} from '../data/readingPlans';
import {useTheme} from '../context/ThemeContext';
import {withTheme} from '../hoc/withTheme';
import {useLanguage} from '../hooks/useLanguage';
import {AnalyticsService} from '../services/AnalyticsService';
import {logger} from '../lib/utils/logger';

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
    card: string;
    primary: string;
  };
}

interface ReadingPlanScreenProps {
  theme: Theme;
}

interface RenderPlanItemProps {
  item: ReadingPlan;
  index: number;
}

// ==================== COMPONENT ====================

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
  const {colors} = theme;
  const {t} = useLanguage();

  const styles = useMemo(() => createStyles(colors), [colors]);

  // ==================== EFFECTS ====================

  useEffect(() => {
    logger.breadcrumb('ReadingPlanScreen mounted', 'screen-lifecycle', {
      hasCurrentPlan: !!currentPlan,
      progressKeys: progress ? Object.keys(progress).length : 0,
    });

    logger.debug('ReadingPlan context loaded', {
      screen: 'ReadingPlanScreen',
      currentPlanId: currentPlan?.id,
      progressCount: progress ? Object.keys(progress).length : 0,
      hasFunctions: {
        startPlan: typeof startPlan === 'function',
        continuePlan: typeof continuePlan === 'function',
      },
    });
  }, [currentPlan, progress, startPlan, continuePlan]);

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
          t.readingPlan.changePlanTitle,
          t.readingPlan.changePlanMessage,
          [
            {
              text: t.cancel,
              style: 'cancel',
              onPress: () => {
                logger.breadcrumb('Plan change cancelled', 'user-action', {
                  planId: plan.id,
                });
              },
            },
            {
              text: t.change,
              onPress: async () => {
                try {
                  await savePlan(plan);
                  AnalyticsService.logEvent('reading_plan_changed', {
                    planId: plan.id,
                  });
                  logger.breadcrumb(
                    'Plan changed successfully',
                    'user-action',
                    {
                      newPlanId: plan.id,
                      previousPlanId: currentPlan.id,
                    },
                  );
                } catch (error) {
                  logger.error('Failed to change plan', error as Error, {
                    screen: 'ReadingPlanScreen',
                    action: 'handlePlanSelection',
                    planId: plan.id,
                  });
                }
              },
            },
          ],
        );
      } else if (!currentPlan) {
        savePlan(plan)
          .then(() => {
            AnalyticsService.logEvent('reading_plan_selected', {
              planId: plan.id,
            });
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
    [currentPlan, savePlan, t],
  );

  const handleStartContinuePlan = useCallback(() => {
    logger.breadcrumb('Start/Continue plan initiated', 'user-action', {
      hasCurrentPlan: !!currentPlan,
      currentPlanId: currentPlan?.id,
      hasProgress: progress && currentPlan ? !!progress[currentPlan.id] : false,
    });

    if (currentPlan) {
      const hasPlanProgress = progress && progress[currentPlan.id];

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
        t.readingPlan.noPlanSelectedTitle,
        t.readingPlan.noPlanSelectedMessage,
      );
    }
  }, [currentPlan, progress, continuePlan, startPlan, navigation, t]);

  // ==================== RENDER FUNCTIONS ====================

  const renderPlanItem = useCallback(
    ({item}: RenderPlanItemProps) => {
      const isCurrentPlan = currentPlan?.id === item.id;
      const planProgress = progress?.[item.id] || {};
      const completedDays = Object.keys(planProgress).length;
      const progressPercentage = (completedDays / item.duration) * 100;

      return (
        <TouchableOpacity
          style={[styles.planItem, isCurrentPlan && styles.currentPlanItem]}
          onPress={() => handlePlanSelection(item)}
          testID={`plan-item-${item.id}`}
          accessibilityRole="button"
          accessibilityLabel={`${item.name}. ${item.description}. ${t.readingPlan.duration}: ${item.duration} ${t.readingPlan.days}`}
          accessibilityHint={
            isCurrentPlan
              ? t.readingPlan.currentPlanHint
              : t.readingPlan.selectPlanHint
          }>
          <View style={styles.planHeader}>
            <Text style={styles.planName}>{item.name}</Text>
            {isCurrentPlan && (
              <Text
                style={styles.checkIcon}
                accessibilityLabel={t.readingPlan.selected}>
                ✓
              </Text>
            )}
          </View>
          <Text style={styles.planDescription}>{item.description}</Text>
          <Text style={styles.planDuration}>
            {t.readingPlan.durationText}: {item.duration} {t.readingPlan.days}
          </Text>
          {isCurrentPlan && completedDays > 0 && (
            <View style={styles.progressContainer}>
              <View
                style={[
                  styles.progressBar,
                  {width: `${Math.min(progressPercentage, 100)}%`},
                ]}
                accessibilityLabel={`${t.readingPlan.progress}: ${Math.round(progressPercentage)}%`}
              />
              <Text style={styles.progressText}>
                {completedDays}/{item.duration} {t.readingPlan.daysCompleted}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      );
    },
    [styles, currentPlan, progress, handlePlanSelection, t],
  );

  const getItemType = useCallback((item: ReadingPlan) => {
    return 'plan-item';
  }, []);

  const renderListHeader = useCallback(() => {
    return (
      <Text style={styles.header} accessibilityRole="header">
        {t.readingPlan.availablePlans}
      </Text>
    );
  }, [styles.header, t]);

  const memoizedPlans = useMemo(() => readingPlans as ReadingPlan[], []);

  // ==================== RENDER ====================

  return (
    <View style={styles.container} testID="reading-plan-screen">
      {currentPlan && (
        <TouchableOpacity
          style={styles.startContinueButton}
          onPress={handleStartContinuePlan}
          accessibilityRole="button"
          accessibilityLabel={
            progress && progress[currentPlan.id]
              ? t.readingPlan.continueReading
              : t.readingPlan.startPlan
          }
          accessibilityHint={t.readingPlan.startContinueHint}>
          <Text style={styles.startContinueButtonText}>
            {progress && progress[currentPlan.id]
              ? t.readingPlan.continueReading
              : t.readingPlan.startPlan}
          </Text>
        </TouchableOpacity>
      )}
      <FlashList
        data={memoizedPlans}
        renderItem={renderPlanItem}
        keyExtractor={item => item.id}
        getItemType={getItemType}
        ListHeaderComponent={renderListHeader}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={true}
        drawDistance={400}
        accessible={true}
        accessibilityLabel={t.readingPlan.listLabel}
      />
    </View>
  );
};

// ==================== STYLES ====================

const createStyles = (colors: Theme['colors']) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      padding: 10,
    },
    listContent: {
      paddingBottom: 20,
    },
    header: {
      fontSize: 22,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 15,
      marginTop: 10,
    },
    planItem: {
      backgroundColor: colors.card,
      padding: 15,
      borderRadius: 10,
      marginBottom: 15,
      elevation: 3,
      shadowColor: colors.text,
      shadowOffset: {width: 0, height: 1},
      shadowOpacity: 0.22,
      shadowRadius: 2.22,
    },
    currentPlanItem: {
      borderColor: colors.primary,
      borderWidth: 2,
    },
    planHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 5,
    },
    planName: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.text,
      flex: 1,
    },
    planDescription: {
      fontSize: 14,
      color: colors.text,
      marginBottom: 5,
      opacity: 0.8,
    },
    planDuration: {
      fontSize: 12,
      color: colors.text,
      opacity: 0.7,
    },
    progressContainer: {
      marginTop: 10,
    },
    progressBar: {
      height: 5,
      backgroundColor: colors.primary,
      borderRadius: 5,
    },
    progressText: {
      fontSize: 12,
      color: colors.text,
      marginTop: 5,
      opacity: 0.8,
    },
    checkIcon: {
      color: colors.primary,
      fontSize: 24,
      marginLeft: 10,
    },
    startContinueButton: {
      backgroundColor: colors.primary,
      padding: 15,
      borderRadius: 10,
      alignItems: 'center',
      marginBottom: 15,
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 1},
      shadowOpacity: 0.2,
      shadowRadius: 2,
    },
    startContinueButtonText: {
      color: colors.background,
      fontSize: 16,
      fontWeight: 'bold',
    },
  });

export default withTheme(React.memo(ReadingPlanScreen));
