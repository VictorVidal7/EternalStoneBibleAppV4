/**
 * 📖 VERSE OF THE DAY WIDGET
 *
 * Widget que muestra el verso del día en la pantalla principal
 * Diseño hermoso con gradientes y tipografía elegante
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import {staticColors} from '@/styles/designTokens';

import {LinearGradient} from 'expo-linear-gradient';
import {Ionicons} from '@expo/vector-icons';
import {widgetTaskHandler, VerseWidgetData} from './WidgetTaskHandler';
import {useTheme} from '../hooks/useTheme';
import {useLanguage} from '../hooks/useLanguage';

interface VerseWidgetProps {
  onPress?: (book: string, chapter: number, verse: number) => void;
  compact?: boolean;
}

export const VerseWidget: React.FC<VerseWidgetProps> = ({
  onPress,
  compact = false,
}) => {
  const {colors, isDark} = useTheme();
  const {t, language} = useLanguage();
  const [verseData, setVerseData] = useState<VerseWidgetData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadVerse();
  }, []);

  const loadVerse = async () => {
    try {
      setLoading(true);
      const data = await widgetTaskHandler.getVerseOfTheDay();
      setVerseData(data);
    } catch (error) {
      console.error('Error loading verse widget:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, {backgroundColor: colors.surface}]}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  }

  if (!verseData) {
    return null;
  }

  const handlePress = () => {
    if (onPress) {
      onPress(verseData.book, verseData.chapter, verseData.verseNumber);
    }
  };

  const gradientColors = isDark
    ? ['#1E293B', '#334155', '#475569']
    : ['#E0F2FE', '#BAE6FD', '#7DD3FC'];

  return (
    <TouchableOpacity
      style={[styles.container, compact && styles.containerCompact]}
      onPress={handlePress}
      activeOpacity={0.9}>
      <LinearGradient
        colors={gradientColors as [string, string, ...string[]]}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 1}}
        style={styles.gradient}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Ionicons name="book" size={20} color={colors.primary} />
          </View>
          <Text style={[styles.headerText, {color: colors.text}]}>
            {t.widgets.verseOfDay}
          </Text>
          <View style={styles.dateContainer}>
            <Text style={[styles.dateText, {color: colors.textSecondary}]}>
              {new Date().toLocaleDateString(
                language === 'en' ? 'en-US' : 'es-ES',
                {
                  day: 'numeric',
                  month: 'short',
                },
              )}
            </Text>
          </View>
        </View>

        {/* Verse Text */}
        <View style={styles.verseContainer}>
          <Text
            style={[
              styles.verseText,
              {color: colors.text},
              compact && styles.verseTextCompact,
            ]}
            numberOfLines={compact ? 3 : undefined}>
            "{verseData.verse}"
          </Text>
        </View>

        {/* Reference */}
        <View style={styles.footer}>
          <Text style={[styles.reference, {color: colors.textSecondary}]}>
            {verseData.reference}
          </Text>
          <View style={styles.badge}>
            <Text style={[styles.badgeText, {color: colors.primary}]}>
              {verseData.translation}
            </Text>
          </View>
        </View>

        {/* Tap to read indicator */}
        <View style={styles.tapIndicator}>
          <Ionicons
            name="chevron-forward"
            size={16}
            color={colors.textTertiary}
          />
          <Text style={[styles.tapText, {color: colors.textTertiary}]}>
            {t.tap} {t.to.toLowerCase()} {t.readMore.toLowerCase()}
          </Text>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    overflow: 'hidden',
    marginVertical: 12,
    marginHorizontal: 16,
    shadowColor: staticColors.black,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  containerCompact: {
    marginVertical: 8,
  },
  gradient: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: staticColors.glassWhite20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerText: {
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
  },
  dateContainer: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: staticColors.glassWhite15,
  },
  dateText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  verseContainer: {
    marginBottom: 16,
  },
  verseText: {
    fontSize: 17,
    lineHeight: 26,
    fontWeight: '500',
    fontStyle: 'italic',
  },
  verseTextCompact: {
    fontSize: 15,
    lineHeight: 22,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: staticColors.overlayBlack08,
  },
  reference: {
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: staticColors.glassWhite30,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  tapIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    opacity: 0.6,
  },
  tapText: {
    fontSize: 11,
    fontWeight: '500',
    marginLeft: 4,
  },
});
