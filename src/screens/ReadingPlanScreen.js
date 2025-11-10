import React, { useCallback, useMemo, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useReadingPlan } from '../context/ReadingPlanContext';
import { readingPlans } from '../data/readingPlans';
import { useTheme } from '../context/ThemeContext';
import { withTheme } from '../hoc/withTheme';
import { useTranslation } from 'react-i18next';
import { AnalyticsService } from '../services/AnalyticsService';

const ReadingPlanScreen = ({ theme }) => {
  const navigation = useNavigation();
  const { currentPlan, savePlan, progress, startPlan, continuePlan, updateProgress } = useReadingPlan();
  const { colors } = theme;
  const { t } = useTranslation();

  const styles = useMemo(() => createStyles(colors), [colors]);

  useEffect(() => {
    console.log('ReadingPlan context:', { currentPlan, progress, startPlan, continuePlan });
  }, [currentPlan, progress, startPlan, continuePlan]);

  const handlePlanSelection = useCallback((plan) => {
    if (currentPlan && currentPlan.id !== plan.id) {
      Alert.alert(
        t("Cambiar Plan de Lectura"),
        t("¿Estás seguro de que quieres cambiar tu plan de lectura actual? Tu progreso en el plan actual se guardará."),
        [
          { text: t("Cancelar"), style: "cancel" },
          { 
            text: t("Cambiar"), 
            onPress: () => {
              savePlan(plan);
              AnalyticsService.logEvent('reading_plan_changed', { planId: plan.id });
            } 
          }
        ]
      );
    } else if (!currentPlan) {
      savePlan(plan);
      AnalyticsService.logEvent('reading_plan_selected', { planId: plan.id });
    }
  }, [currentPlan, savePlan, t]);

  const handleStartContinuePlan = useCallback(() => {
    console.log('handleStartContinuePlan called');
    if (currentPlan) {
      if (progress && progress[currentPlan.id]) {
        console.log('Continuing plan');
        continuePlan && continuePlan();
        AnalyticsService.logEvent('reading_plan_continued', { planId: currentPlan.id });
      } else {
        console.log('Starting plan');
        startPlan && startPlan();
        AnalyticsService.logEvent('reading_plan_started', { planId: currentPlan.id });
      }
      navigation.navigate('Biblia', {
        screen: 'BibleList',
        params: { fromReadingPlan: true }
      });
    } else {
      console.log('No current plan selected');
      Alert.alert(t("No hay plan seleccionado"), t("Por favor, selecciona un plan de lectura primero."));
    }
  }, [currentPlan, progress, continuePlan, startPlan, navigation, t]);

  const renderPlanItem = useCallback(({ item }) => {
    const isCurrentPlan = currentPlan && currentPlan.id === item.id;
    const planProgress = progress && progress[item.id] ? progress[item.id] : {};
    const completedDays = Object.keys(planProgress).length;
    const progressPercentage = (completedDays / item.duration) * 100;

    return (
      <TouchableOpacity
        style={[styles.planItem, isCurrentPlan && styles.currentPlanItem]}
        onPress={() => handlePlanSelection(item)}
        testID={`plan-item-${item.id}`}
      >
        <View style={styles.planHeader}>
          <Text style={styles.planName}>{item.name}</Text>
          {isCurrentPlan && <Text style={styles.checkIcon}>✓</Text>}
        </View>
        <Text style={styles.planDescription}>{item.description}</Text>
        <Text style={styles.planDuration}>{t('Duración: {{duration}} días', { duration: item.duration })}</Text>
        {isCurrentPlan && (
          <View style={styles.progressContainer}>
            <View style={[styles.progressBar, { width: `${progressPercentage}%` }]} />
            <Text style={styles.progressText}>{t('{{completed}}/{{total}} días completados', { completed: completedDays, total: item.duration })}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  }, [styles, currentPlan, progress, handlePlanSelection, t]);

  const memoizedPlans = useMemo(() => readingPlans, []);

  return (
    <View style={styles.container} testID="reading-plan-screen">
      {currentPlan && (
        <TouchableOpacity style={styles.startContinueButton} onPress={handleStartContinuePlan}>
          <Text style={styles.startContinueButtonText}>
          {progress && progress[currentPlan.id] ? t("Continuar Lectura") : t("Comenzar Plan")}
          </Text>
        </TouchableOpacity>
      )}
      <FlatList
        data={memoizedPlans}
        renderItem={renderPlanItem}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <Text style={styles.header}>{t('Planes de Lectura Disponibles')}</Text>
        }
      />
    </View>
  );
};

const createStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 10,
  },
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 15,
  },
  planItem: {
    backgroundColor: colors.card,
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    elevation: 3,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 1 },
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
  },
  planDescription: {
    fontSize: 14,
    color: colors.text,
    marginBottom: 5,
  },
  planDuration: {
    fontSize: 12,
    color: colors.text,
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
  },
  checkIcon: {
    color: colors.primary,
    fontSize: 24,
  },
  startContinueButton: {
    backgroundColor: colors.primary,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 15,
  },
  startContinueButtonText: {
    color: colors.background,
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default withTheme(React.memo(ReadingPlanScreen));