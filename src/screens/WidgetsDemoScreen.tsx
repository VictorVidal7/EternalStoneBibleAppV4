/**
 * 📱 WIDGETS DEMO SCREEN
 *
 * Pantalla para probar y visualizar todos los widgets
 * Muestra cómo integrar los widgets en diferentes contextos
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import React from 'react';
import {View, Text, StyleSheet, ScrollView} from 'react-native';
import {useTheme} from '../hooks/useTheme';
import {useLanguage} from '../hooks/useLanguage';
import {VerseWidget} from '../widgets/VerseWidget';
import {ProgressWidget} from '../widgets/ProgressWidget';
import {MissionWidget} from '../widgets/MissionWidget';
import {useRouter} from 'expo-router';

export const WidgetsDemoScreen: React.FC = () => {
  const {colors} = useTheme();
  const {t} = useLanguage();
  const router = useRouter();

  const handleVersePress = (book: string, chapter: number, verse: number) => {
    router.push(`/verse/${book}/${chapter}?highlight=${verse}`);
  };

  const handleProgressPress = () => {
    router.push('/profile');
  };

  const handleMissionPress = () => {
    // Por ahora, no hay pantalla de misiones implementada
    // En el futuro, esto navegará a la pantalla de misiones
    console.log('Mission widget pressed - missions feature coming soon');
  };

  return (
    <View style={[styles.container, {backgroundColor: colors.background}]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, {color: colors.text}]}>
          {t.widgets.title}
        </Text>
        <Text style={[styles.subtitle, {color: colors.textSecondary}]}>
          {t.widgets.subtitle}
        </Text>
      </View>

      {/* Widgets Showcase */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Verse Widget */}
        <View style={styles.widgetSection}>
          <Text style={[styles.sectionTitle, {color: colors.text}]}>
            📖 {t.widgets.verseOfDay}
          </Text>
          <Text style={[styles.sectionDesc, {color: colors.textSecondary}]}>
            {t.widgets.verseOfDayDesc}
          </Text>
          <VerseWidget onPress={handleVersePress} />
        </View>

        {/* Progress Widget */}
        <View style={styles.widgetSection}>
          <Text style={[styles.sectionTitle, {color: colors.text}]}>
            📊 {t.widgets.progressTitle}
          </Text>
          <Text style={[styles.sectionDesc, {color: colors.textSecondary}]}>
            {t.widgets.progressDesc}
          </Text>
          <ProgressWidget userId="demo-user" onPress={handleProgressPress} />
        </View>

        {/* Mission Widget */}
        <View style={styles.widgetSection}>
          <Text style={[styles.sectionTitle, {color: colors.text}]}>
            🎯 {t.widgets.missionTitle}
          </Text>
          <Text style={[styles.sectionDesc, {color: colors.textSecondary}]}>
            {t.widgets.missionDesc}
          </Text>
          <MissionWidget userId="demo-user" onPress={handleMissionPress} />
        </View>

        {/* Info Section */}
        <View style={[styles.infoCard, {backgroundColor: colors.surface}]}>
          <Text style={[styles.infoTitle, {color: colors.text}]}>
            💡 {t.widgets.howToUse}
          </Text>
          <View style={styles.infoList}>
            <Text style={[styles.infoItem, {color: colors.textSecondary}]}>
              1. {t.widgets.howToUseSteps.step1}
            </Text>
            <Text style={[styles.infoItem, {color: colors.textSecondary}]}>
              2. {t.widgets.howToUseSteps.step2}
            </Text>
            <Text style={[styles.infoItem, {color: colors.textSecondary}]}>
              3. {t.widgets.howToUseSteps.step3}
            </Text>
            <Text style={[styles.infoItem, {color: colors.textSecondary}]}>
              4. {t.widgets.howToUseSteps.step4}
            </Text>
            <Text style={[styles.infoItem, {color: colors.textSecondary}]}>
              5. {t.widgets.howToUseSteps.step5}
            </Text>
          </View>
        </View>

        {/* Feature Highlights */}
        <View style={styles.featuresSection}>
          <Text style={[styles.featureTitle, {color: colors.text}]}>
            ✨ {t.widgets.features}
          </Text>
          <View style={styles.featuresList}>
            <View
              style={[styles.featureCard, {backgroundColor: colors.surface}]}>
              <Text style={styles.featureEmoji}>🔄</Text>
              <Text style={[styles.featureText, {color: colors.text}]}>
                {t.widgets.autoUpdate}
              </Text>
            </View>
            <View
              style={[styles.featureCard, {backgroundColor: colors.surface}]}>
              <Text style={styles.featureEmoji}>🎨</Text>
              <Text style={[styles.featureText, {color: colors.text}]}>
                {t.widgets.adaptiveDesign}
              </Text>
            </View>
            <View
              style={[styles.featureCard, {backgroundColor: colors.surface}]}>
              <Text style={styles.featureEmoji}>⚡</Text>
              <Text style={[styles.featureText, {color: colors.text}]}>
                {t.widgets.optimizedPerformance}
              </Text>
            </View>
            <View
              style={[styles.featureCard, {backgroundColor: colors.surface}]}>
              <Text style={styles.featureEmoji}>📱</Text>
              <Text style={[styles.featureText, {color: colors.text}]}>
                {t.widgets.multipleSizes}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    marginBottom: 8,
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  widgetSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
    paddingHorizontal: 20,
  },
  sectionDesc: {
    fontSize: 13,
    marginBottom: 12,
    paddingHorizontal: 20,
  },
  infoCard: {
    marginHorizontal: 16,
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  infoList: {
    gap: 10,
  },
  infoItem: {
    fontSize: 14,
    lineHeight: 20,
  },
  featuresSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  featureTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
  },
  featuresList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  featureCard: {
    flexBasis: '48%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  featureEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  featureText: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  bottomPadding: {
    height: 20,
  },
});
