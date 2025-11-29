/**
 * ⚡ CACHE STATS SCREEN
 *
 * Pantalla para visualizar estadísticas del sistema de caché
 * Útil para debugging y optimización
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
  RefreshControl,
  Alert,
} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {useTheme} from '../hooks/useTheme';
import {useLanguage} from '../hooks/useLanguage';
import {
  predictiveCacheService,
  ReadingPattern,
  PredictionResult,
} from '../lib/cache/PredictiveCache';
import {useCacheStats} from '../hooks/useCache';

interface CacheStatsScreenProps {
  userId: string;
}

export const CacheStatsScreen: React.FC<CacheStatsScreenProps> = ({userId}) => {
  const {colors} = useTheme();
  const {t} = useLanguage();
  const {stats, refresh: refreshStats} = useCacheStats();

  const [refreshing, setRefreshing] = useState(false);
  const [readingPattern, setReadingPattern] = useState<ReadingPattern | null>(
    null,
  );
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);

  useEffect(() => {
    loadData();
  }, [userId]);

  const loadData = async () => {
    try {
      const [pattern, pred] = await Promise.all([
        predictiveCacheService.analyzeReadingPatterns(userId),
        predictiveCacheService.predictNextChapter(userId),
      ]);

      setReadingPattern(pattern);
      setPrediction(pred);
    } catch (error) {
      console.error('Error loading cache data:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refreshStats(), loadData()]);
    setRefreshing(false);
  };

  const handleClearCache = () => {
    Alert.alert(t.cacheStats.clearCache, t.cacheStats.clearConfirm, [
      {text: t.cancel, style: 'cancel'},
      {
        text: t.cacheStats.clearCache,
        style: 'destructive',
        onPress: async () => {
          await predictiveCacheService.clearAll();
          await handleRefresh();
          Alert.alert(t.ok, t.cacheStats.clearSuccess);
        },
      },
    ]);
  };

  const handleWarmup = async () => {
    Alert.alert('Precalentando Caché', 'Precargando contenido popular...');

    await predictiveCacheService.warmupCache();
    await handleRefresh();

    Alert.alert('¡Completado!', 'Caché precalentado exitosamente');
  };

  const handleCleanup = async () => {
    const removed = await predictiveCacheService.cleanup();
    await handleRefresh();
    Alert.alert('¡Listo!', `Se eliminaron ${removed} entradas expiradas`);
  };

  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 0.8) return '#10B981';
    if (confidence >= 0.6) return '#F59E0B';
    return '#EF4444';
  };

  const getSequenceEmoji = (sequence: string): string => {
    switch (sequence) {
      case 'sequential':
        return '📚';
      case 'mixed':
        return '🔀';
      case 'random':
        return '🎲';
      default:
        return '📖';
    }
  };

  return (
    <View style={[styles.container, {backgroundColor: colors.background}]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, {color: colors.text}]}>
          {t.cacheStats.title}
        </Text>
        <Text style={[styles.subtitle, {color: colors.textSecondary}]}>
          Sistema de optimización inteligente
        </Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }>
        {/* Cache Stats Cards */}
        <View style={styles.statsSection}>
          <Text style={[styles.sectionTitle, {color: colors.text}]}>
            Rendimiento del Caché
          </Text>

          <View style={styles.statsGrid}>
            <View
              style={[
                styles.statCard,
                {backgroundColor: colors.surface, borderColor: colors.primary},
              ]}>
              <Ionicons name="database" size={24} color={colors.primary} />
              <Text style={[styles.statValue, {color: colors.text}]}>
                {stats.totalEntries}
              </Text>
              <Text style={[styles.statLabel, {color: colors.textSecondary}]}>
                Entradas Totales
              </Text>
            </View>

            <View
              style={[
                styles.statCard,
                {backgroundColor: colors.surface, borderColor: colors.accent},
              ]}>
              <Ionicons name="flash" size={24} color={colors.accent} />
              <Text style={[styles.statValue, {color: colors.text}]}>
                {stats.memoryEntries}
              </Text>
              <Text style={[styles.statLabel, {color: colors.textSecondary}]}>
                En Memoria
              </Text>
            </View>

            <View
              style={[
                styles.statCard,
                {backgroundColor: colors.surface, borderColor: '#10B981'},
              ]}>
              <Ionicons name="checkmark-circle" size={24} color="#10B981" />
              <Text style={[styles.statValue, {color: colors.text}]}>
                {stats.hitRate}%
              </Text>
              <Text style={[styles.statLabel, {color: colors.textSecondary}]}>
                Tasa de Acierto
              </Text>
            </View>

            <View
              style={[
                styles.statCard,
                {backgroundColor: colors.surface, borderColor: colors.warning},
              ]}>
              <Ionicons name="trending-up" size={24} color={colors.warning} />
              <Text style={[styles.statValue, {color: colors.text}]}>
                {stats.avgAccessCount}
              </Text>
              <Text style={[styles.statLabel, {color: colors.textSecondary}]}>
                Accesos Promedio
              </Text>
            </View>
          </View>
        </View>

        {/* Reading Pattern Analysis */}
        {readingPattern && (
          <View style={styles.patternSection}>
            <Text style={[styles.sectionTitle, {color: colors.text}]}>
              Patrón de Lectura Analizado
            </Text>

            <View
              style={[styles.patternCard, {backgroundColor: colors.surface}]}>
              <View style={styles.patternRow}>
                <View style={styles.patternItem}>
                  <Text style={styles.patternEmoji}>
                    {getSequenceEmoji(readingPattern.readingSequence)}
                  </Text>
                  <Text
                    style={[
                      styles.patternLabel,
                      {color: colors.textSecondary},
                    ]}>
                    Secuencia
                  </Text>
                  <Text style={[styles.patternValue, {color: colors.text}]}>
                    {readingPattern.readingSequence === 'sequential'
                      ? 'Secuencial'
                      : readingPattern.readingSequence === 'mixed'
                        ? 'Mixta'
                        : 'Aleatoria'}
                  </Text>
                </View>

                <View style={styles.patternItem}>
                  <Text style={styles.patternEmoji}>⏱️</Text>
                  <Text
                    style={[
                      styles.patternLabel,
                      {color: colors.textSecondary},
                    ]}>
                    Tiempo Promedio
                  </Text>
                  <Text style={[styles.patternValue, {color: colors.text}]}>
                    {readingPattern.averageReadingTime} min
                  </Text>
                </View>
              </View>

              <View style={styles.patternRow}>
                <View style={styles.patternItem}>
                  <Text style={styles.patternEmoji}>📖</Text>
                  <Text
                    style={[
                      styles.patternLabel,
                      {color: colors.textSecondary},
                    ]}>
                    Versos/Sesión
                  </Text>
                  <Text style={[styles.patternValue, {color: colors.text}]}>
                    {readingPattern.averageVersesPerSession}
                  </Text>
                </View>

                <View style={styles.patternItem}>
                  <Text style={styles.patternEmoji}>🕐</Text>
                  <Text
                    style={[
                      styles.patternLabel,
                      {color: colors.textSecondary},
                    ]}>
                    Hora Preferida
                  </Text>
                  <Text style={[styles.patternValue, {color: colors.text}]}>
                    {readingPattern.preferredTimeOfDay}:00
                  </Text>
                </View>
              </View>

              {readingPattern.commonBooks.length > 0 && (
                <View style={styles.commonBooksSection}>
                  <Text
                    style={[
                      styles.commonBooksTitle,
                      {color: colors.textSecondary},
                    ]}>
                    Libros Frecuentes
                  </Text>
                  <View style={styles.booksList}>
                    {readingPattern.commonBooks.map((book, index) => (
                      <View
                        key={index}
                        style={[
                          styles.bookChip,
                          {backgroundColor: colors.primaryLight},
                        ]}>
                        <Text
                          style={[styles.bookText, {color: colors.primary}]}>
                          {book}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Predictions */}
        {prediction && (
          <View style={styles.predictionSection}>
            <Text style={[styles.sectionTitle, {color: colors.text}]}>
              Predicción Inteligente
            </Text>

            <View
              style={[
                styles.predictionCard,
                {backgroundColor: colors.surface},
              ]}>
              <View style={styles.predictionHeader}>
                <Text style={[styles.predictionTitle, {color: colors.text}]}>
                  Próxima Lectura Sugerida
                </Text>
                <View
                  style={[
                    styles.confidenceBadge,
                    {
                      backgroundColor: getConfidenceColor(
                        prediction.confidence,
                      ),
                    },
                  ]}>
                  <Text style={styles.confidenceText}>
                    {Math.round(prediction.confidence * 100)}%
                  </Text>
                </View>
              </View>

              <View style={styles.nextChapter}>
                <Text style={styles.nextChapterEmoji}>📖</Text>
                <View>
                  <Text style={[styles.nextChapterBook, {color: colors.text}]}>
                    {prediction.nextChapter.book}
                  </Text>
                  <Text
                    style={[
                      styles.nextChapterNumber,
                      {color: colors.textSecondary},
                    ]}>
                    Capítulo {prediction.nextChapter.chapter}
                  </Text>
                </View>
              </View>

              {prediction.relatedChapters.length > 0 && (
                <>
                  <Text
                    style={[
                      styles.relatedTitle,
                      {color: colors.textSecondary},
                    ]}>
                    También precargado:
                  </Text>
                  <View style={styles.relatedList}>
                    {prediction.relatedChapters.map((chapter, index) => (
                      <Text
                        key={index}
                        style={[styles.relatedItem, {color: colors.text}]}>
                        • {chapter.book} {chapter.chapter}
                      </Text>
                    ))}
                  </View>
                </>
              )}
            </View>
          </View>
        )}

        {/* Actions */}
        <View style={styles.actionsSection}>
          <Text style={[styles.sectionTitle, {color: colors.text}]}>
            Acciones
          </Text>

          <TouchableOpacity
            style={[styles.actionButton, {backgroundColor: colors.primary}]}
            onPress={handleWarmup}>
            <Ionicons name="flame" size={20} color="#FFF" />
            <Text style={styles.actionButtonText}>Precalentar Caché</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, {backgroundColor: colors.accent}]}
            onPress={handleCleanup}>
            <Ionicons name="trash-outline" size={20} color="#FFF" />
            <Text style={styles.actionButtonText}>
              Limpiar Entradas Expiradas
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, {backgroundColor: colors.error}]}
            onPress={handleClearCache}>
            <Ionicons name="close-circle" size={20} color="#FFF" />
            <Text style={styles.actionButtonText}>Limpiar Todo el Caché</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
  },
  subtitle: {
    fontSize: 14,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    gap: 24,
  },
  statsSection: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderLeftWidth: 4,
  },
  statValue: {
    fontSize: 32,
    fontWeight: '800',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  patternSection: {
    gap: 12,
  },
  patternCard: {
    padding: 16,
    borderRadius: 12,
  },
  patternRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  patternItem: {
    flex: 1,
    alignItems: 'center',
  },
  patternEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  patternLabel: {
    fontSize: 11,
    fontWeight: '500',
    marginBottom: 4,
  },
  patternValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  commonBooksSection: {
    marginTop: 8,
  },
  commonBooksTitle: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
  },
  booksList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  bookChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  bookText: {
    fontSize: 12,
    fontWeight: '700',
  },
  predictionSection: {
    gap: 12,
  },
  predictionCard: {
    padding: 16,
    borderRadius: 12,
  },
  predictionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  predictionTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  confidenceBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  confidenceText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFF',
  },
  nextChapter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  nextChapterEmoji: {
    fontSize: 40,
  },
  nextChapterBook: {
    fontSize: 18,
    fontWeight: '700',
  },
  nextChapterNumber: {
    fontSize: 14,
    fontWeight: '500',
  },
  relatedTitle: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
  },
  relatedList: {
    gap: 4,
  },
  relatedItem: {
    fontSize: 13,
  },
  actionsSection: {
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 10,
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFF',
  },
});
