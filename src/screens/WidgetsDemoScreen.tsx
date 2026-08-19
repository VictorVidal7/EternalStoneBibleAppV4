/**
 * 📱 WIDGETS SCREEN
 *
 * Showcases the real, installable Android home-screen widget — the daily
 * verse (VerseWidgetProvider, native) — and explains how to add it to the
 * home screen. The two demo-only previews (progress/mission) that had no
 * native counterpart were retired in Sprint 91 so the screen no longer
 * promises widgets the user cannot actually place.
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
} from 'react-native';
import {useTheme} from '../hooks/useTheme';
import {useLanguage} from '../hooks/useLanguage';
import {VerseWidget} from '../widgets/VerseWidget';
import {useRouter} from 'expo-router';
import {Ionicons} from '@expo/vector-icons';
import {haptics} from '@lib/haptics';
import {ScreenHeaderBack} from '../components/ScreenHeaderBack';
import {FeatureGuideModal} from '@components/FeatureGuideModal';
import {getFeatureGuideContent} from '@lib/onboarding/featureGuides';

export const WidgetsDemoScreen: React.FC = () => {
  const {colors} = useTheme();
  const {t} = useLanguage();
  const router = useRouter();
  const [guideVisible, setGuideVisible] = useState(false);

  const handleVersePress = (book: string, chapter: number, verse: number) => {
    router.push(`/verse/${book}/${chapter}?highlight=${verse}`);
  };

  const steps = [
    t.widgets.howToUseSteps.step1,
    t.widgets.howToUseSteps.step2,
    t.widgets.howToUseSteps.step3,
    t.widgets.howToUseSteps.step4,
    t.widgets.howToUseSteps.step5,
  ];

  return (
    <View style={[styles.container, {backgroundColor: colors.background}]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <ScreenHeaderBack />
          <TouchableOpacity
            onPress={() => {
              haptics.tap();
              setGuideVisible(true);
            }}
            hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
            accessibilityRole="button"
            accessibilityLabel={t.widgets.guide.openLabel}>
            <Ionicons
              name="help-circle-outline"
              size={24}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        </View>
        <Text style={[styles.title, {color: colors.text}]}>
          {t.widgets.title}
        </Text>
        <Text style={[styles.subtitle, {color: colors.textSecondary}]}>
          {t.widgets.subtitle}
        </Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Verse of the Day — the real, installable widget */}
        <View style={styles.widgetSection}>
          <Text style={[styles.sectionTitle, {color: colors.text}]}>
            📖 {t.widgets.verseOfDay}
          </Text>
          <Text style={[styles.sectionDesc, {color: colors.textSecondary}]}>
            {t.widgets.verseOfDayDesc}
          </Text>
          <VerseWidget onPress={handleVersePress} />
        </View>

        {/* How to add it to the home screen */}
        <View style={[styles.infoCard, {backgroundColor: colors.surface}]}>
          <Text style={[styles.infoTitle, {color: colors.text}]}>
            💡 {t.widgets.howToUse}
          </Text>
          <View style={styles.infoList}>
            {steps.map((step, index) => (
              <View key={index} style={styles.stepRow}>
                <View
                  style={[
                    styles.stepBadge,
                    {backgroundColor: colors.primary + '20'},
                  ]}>
                  <Text style={[styles.stepNumber, {color: colors.primary}]}>
                    {index + 1}
                  </Text>
                </View>
                <Text style={[styles.infoItem, {color: colors.textSecondary}]}>
                  {step}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Honest note: the widget refreshes once a day and adapts to the
            system light/dark theme — no overpromising. */}
        <View style={styles.noteRow}>
          <Ionicons
            name="information-circle-outline"
            size={18}
            color={colors.textTertiary}
          />
          <Text style={[styles.noteText, {color: colors.textTertiary}]}>
            {t.widgets.note}
          </Text>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>

      <FeatureGuideModal
        visible={guideVisible}
        onClose={() => setGuideVisible(false)}
        {...getFeatureGuideContent('widgets', t)}
      />
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
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
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
    marginBottom: 24,
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
    marginBottom: 16,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  infoList: {
    gap: 14,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stepBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumber: {
    fontSize: 14,
    fontWeight: '800',
  },
  infoItem: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  noteRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  noteText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
  },
  bottomPadding: {
    height: 20,
  },
});
