/**
 * 📚 VERSION COMPARISON SCREEN
 *
 * Pantalla para comparar múltiples versiones de la Biblia lado a lado
 * Permite análisis profundo con visualización de diferencias
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
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {useTheme} from '../hooks/useTheme';
import {
  versionComparisonService,
  BibleVersion,
  VerseComparison,
  ComparisonAnalysis,
} from '../lib/comparison/VersionComparison';

interface VersionComparisonScreenProps {
  book: string;
  chapter: number;
  initialVerse?: number;
  userId: string;
}

export const VersionComparisonScreen: React.FC<
  VersionComparisonScreenProps
> = ({book, chapter, initialVerse = 1, userId}) => {
  const {colors, isDark} = useTheme();

  // State
  const [availableVersions, setAvailableVersions] = useState<BibleVersion[]>(
    [],
  );
  const [selectedVersions, setSelectedVersions] = useState<string[]>([
    'rvr1960',
  ]);
  const [currentVerse, setCurrentVerse] = useState(initialVerse);
  const [comparison, setComparison] = useState<VerseComparison | null>(null);
  const [analysis, setAnalysis] = useState<ComparisonAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [showVersionPicker, setShowVersionPicker] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [comparisonName, setComparisonName] = useState('');
  const [comparisonNotes, setComparisonNotes] = useState('');

  useEffect(() => {
    loadVersions();
  }, []);

  useEffect(() => {
    if (selectedVersions.length > 0) {
      loadComparison();
    }
  }, [currentVerse, selectedVersions]);

  const loadVersions = async () => {
    try {
      const versions =
        await versionComparisonService.getAvailableVersions('es');
      setAvailableVersions(versions);
    } catch (error) {
      console.error('Error loading versions:', error);
    }
  };

  const loadComparison = async () => {
    try {
      setLoading(true);
      const comp = await versionComparisonService.compareVerse(
        book,
        chapter,
        currentVerse,
        selectedVersions,
      );
      setComparison(comp);

      if (comp.versions.length >= 2) {
        const analysisResult = versionComparisonService.analyzeComparison(comp);
        setAnalysis(analysisResult);
      }
    } catch (error) {
      console.error('Error loading comparison:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleVersion = (versionId: string) => {
    if (selectedVersions.includes(versionId)) {
      if (selectedVersions.length > 1) {
        setSelectedVersions(selectedVersions.filter(id => id !== versionId));
      }
    } else {
      if (selectedVersions.length < 4) {
        setSelectedVersions([...selectedVersions, versionId]);
      } else {
        Alert.alert(
          'Límite alcanzado',
          'Solo puedes comparar hasta 4 versiones simultáneamente',
        );
      }
    }
  };

  const handleSaveComparison = async () => {
    if (!comparisonName.trim()) {
      Alert.alert('Error', 'Por favor ingresa un nombre para la comparación');
      return;
    }

    try {
      await versionComparisonService.saveComparison(
        userId,
        comparisonName,
        book,
        chapter,
        `${currentVerse}`,
        selectedVersions,
        comparisonNotes,
      );

      Alert.alert('¡Guardado!', 'Comparación guardada exitosamente');
      setShowSaveDialog(false);
      setComparisonName('');
      setComparisonNotes('');
    } catch (error) {
      Alert.alert('Error', 'No se pudo guardar la comparación');
    }
  };

  const getVersionColor = (index: number) => {
    const versionColors = [
      '#3B82F6', // Blue
      '#10B981', // Green
      '#F59E0B', // Orange
      '#8B5CF6', // Purple
    ];
    return versionColors[index % versionColors.length];
  };

  return (
    <View style={[styles.container, {backgroundColor: colors.background}]}>
      {/* Header */}
      <View style={[styles.header, {borderBottomColor: colors.border}]}>
        <View style={styles.headerTop}>
          <Text style={[styles.title, {color: colors.text}]}>
            Comparación de Versiones
          </Text>
          <TouchableOpacity
            style={[styles.saveButton, {backgroundColor: colors.primary}]}
            onPress={() => setShowSaveDialog(true)}>
            <Ionicons name="bookmark" size={20} color="#FFF" />
          </TouchableOpacity>
        </View>

        <Text style={[styles.reference, {color: colors.textSecondary}]}>
          {book} {chapter}:{currentVerse}
        </Text>

        {/* Version Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.versionPills}
          contentContainerStyle={styles.versionPillsContent}>
          {selectedVersions.map((versionId, index) => {
            const version = availableVersions.find(v => v.id === versionId);
            return (
              <View
                key={versionId}
                style={[
                  styles.versionPill,
                  {
                    backgroundColor: getVersionColor(index),
                    borderColor: getVersionColor(index),
                  },
                ]}>
                <Text style={styles.versionPillText}>
                  {version?.abbreviation || versionId.toUpperCase()}
                </Text>
              </View>
            );
          })}
          <TouchableOpacity
            style={[
              styles.addVersionButton,
              {borderColor: colors.border, backgroundColor: colors.surface},
            ]}
            onPress={() => setShowVersionPicker(true)}>
            <Ionicons name="add" size={18} color={colors.primary} />
            <Text style={[styles.addVersionText, {color: colors.primary}]}>
              Agregar
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}>
          {/* Versions Comparison */}
          {comparison?.versions.map((version, index) => (
            <View
              key={version.versionId}
              style={[
                styles.versionCard,
                {
                  backgroundColor: colors.surface,
                  borderLeftColor: getVersionColor(index),
                },
              ]}>
              <View style={styles.versionHeader}>
                <View
                  style={[
                    styles.versionBadge,
                    {backgroundColor: getVersionColor(index)},
                  ]}>
                  <Text style={styles.versionBadgeText}>
                    {version.versionAbbr}
                  </Text>
                </View>
                <Text
                  style={[styles.versionName, {color: colors.textSecondary}]}>
                  {version.versionName}
                </Text>
              </View>

              <Text style={[styles.verseText, {color: colors.text}]}>
                {version.text}
              </Text>

              <View style={styles.versionMeta}>
                <View style={styles.metaItem}>
                  <Ionicons name="text" size={12} color={colors.textTertiary} />
                  <Text style={[styles.metaText, {color: colors.textTertiary}]}>
                    {version.wordCount} palabras
                  </Text>
                </View>
              </View>
            </View>
          ))}

          {/* Analysis Section */}
          {analysis && (
            <View
              style={[
                styles.analysisCard,
                {backgroundColor: colors.surface, borderColor: colors.border},
              ]}>
              <View style={styles.analysisHeader}>
                <Ionicons name="analytics" size={20} color={colors.accent} />
                <Text style={[styles.analysisTitle, {color: colors.text}]}>
                  Análisis de Diferencias
                </Text>
              </View>

              {/* Similarity Score */}
              <View style={styles.similaritySection}>
                <Text
                  style={[
                    styles.similarityLabel,
                    {color: colors.textSecondary},
                  ]}>
                  Similaridad
                </Text>
                <View style={styles.similarityBar}>
                  <View
                    style={[
                      styles.similarityFill,
                      {
                        width: `${analysis.similarity}%`,
                        backgroundColor:
                          analysis.similarity >= 80
                            ? '#10B981'
                            : analysis.similarity >= 60
                              ? '#F59E0B'
                              : '#EF4444',
                      },
                    ]}
                  />
                </View>
                <Text style={[styles.similarityValue, {color: colors.text}]}>
                  {analysis.similarity}%
                </Text>
              </View>

              {/* Word Stats */}
              <View style={styles.wordStats}>
                <View style={styles.statCard}>
                  <Text style={[styles.statValue, {color: colors.accent}]}>
                    {analysis.commonWords.size}
                  </Text>
                  <Text
                    style={[styles.statLabel, {color: colors.textSecondary}]}>
                    Palabras comunes
                  </Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={[styles.statValue, {color: colors.warning}]}>
                    {analysis.uniqueWords.size}
                  </Text>
                  <Text
                    style={[styles.statLabel, {color: colors.textSecondary}]}>
                    Palabras únicas
                  </Text>
                </View>
              </View>

              {/* Insights */}
              {analysis.insights.length > 0 && (
                <View style={styles.insightsSection}>
                  <Text style={[styles.insightsTitle, {color: colors.text}]}>
                    Observaciones
                  </Text>
                  {analysis.insights.map((insight, index) => (
                    <View key={index} style={styles.insightItem}>
                      <Ionicons name="bulb" size={14} color={colors.warning} />
                      <Text
                        style={[
                          styles.insightText,
                          {color: colors.textSecondary},
                        ]}>
                        {insight}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}
        </ScrollView>
      )}

      {/* Verse Navigation */}
      <View
        style={[
          styles.navigationBar,
          {backgroundColor: colors.surface, borderTopColor: colors.border},
        ]}>
        <TouchableOpacity
          style={[
            styles.navButton,
            currentVerse <= 1 && styles.navButtonDisabled,
          ]}
          onPress={() => setCurrentVerse(prev => Math.max(1, prev - 1))}
          disabled={currentVerse <= 1}>
          <Ionicons
            name="chevron-back"
            size={24}
            color={currentVerse <= 1 ? colors.textTertiary : colors.primary}
          />
        </TouchableOpacity>

        <Text style={[styles.verseNumber, {color: colors.text}]}>
          Verso {currentVerse}
        </Text>

        <TouchableOpacity
          style={styles.navButton}
          onPress={() => setCurrentVerse(prev => prev + 1)}>
          <Ionicons name="chevron-forward" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Version Picker Modal */}
      <Modal
        visible={showVersionPicker}
        animationType="slide"
        transparent
        onRequestClose={() => setShowVersionPicker(false)}>
        <View style={styles.modalOverlay}>
          <View
            style={[styles.modalContent, {backgroundColor: colors.surface}]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, {color: colors.text}]}>
                Seleccionar Versiones
              </Text>
              <TouchableOpacity onPress={() => setShowVersionPicker(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.versionList}>
              {availableVersions.map(version => {
                const isSelected = selectedVersions.includes(version.id);
                return (
                  <TouchableOpacity
                    key={version.id}
                    style={[
                      styles.versionListItem,
                      {borderBottomColor: colors.border},
                      isSelected && {backgroundColor: colors.primaryLight},
                    ]}
                    onPress={() => toggleVersion(version.id)}>
                    <View style={styles.versionInfo}>
                      <Text
                        style={[styles.versionListName, {color: colors.text}]}>
                        {version.name}
                      </Text>
                      <Text
                        style={[
                          styles.versionListDesc,
                          {color: colors.textSecondary},
                        ]}>
                        {version.description}
                      </Text>
                    </View>
                    {isSelected && (
                      <Ionicons
                        name="checkmark-circle"
                        size={24}
                        color={colors.primary}
                      />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Save Dialog */}
      <Modal
        visible={showSaveDialog}
        animationType="slide"
        transparent
        onRequestClose={() => setShowSaveDialog(false)}>
        <View style={styles.modalOverlay}>
          <View
            style={[styles.modalContent, {backgroundColor: colors.surface}]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, {color: colors.text}]}>
                Guardar Comparación
              </Text>
              <TouchableOpacity onPress={() => setShowSaveDialog(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.saveForm}>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.background,
                    color: colors.text,
                    borderColor: colors.border,
                  },
                ]}
                placeholder="Nombre de la comparación"
                placeholderTextColor={colors.textTertiary}
                value={comparisonName}
                onChangeText={setComparisonName}
              />

              <TextInput
                style={[
                  styles.input,
                  styles.textArea,
                  {
                    backgroundColor: colors.background,
                    color: colors.text,
                    borderColor: colors.border,
                  },
                ]}
                placeholder="Notas (opcional)"
                placeholderTextColor={colors.textTertiary}
                value={comparisonNotes}
                onChangeText={setComparisonNotes}
                multiline
                numberOfLines={4}
              />

              <TouchableOpacity
                style={[
                  styles.saveButtonLarge,
                  {backgroundColor: colors.primary},
                ]}
                onPress={handleSaveComparison}>
                <Text style={styles.saveButtonText}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
  },
  saveButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reference: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  versionPills: {
    marginTop: 8,
  },
  versionPillsContent: {
    gap: 8,
  },
  versionPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 2,
  },
  versionPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFF',
  },
  addVersionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    gap: 4,
  },
  addVersionText: {
    fontSize: 12,
    fontWeight: '700',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 16,
  },
  versionCard: {
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
  },
  versionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 10,
  },
  versionBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  versionBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFF',
  },
  versionName: {
    fontSize: 13,
    fontWeight: '600',
  },
  verseText: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 12,
  },
  versionMeta: {
    flexDirection: 'row',
    gap: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 11,
    fontWeight: '500',
  },
  analysisCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  analysisHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 10,
  },
  analysisTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  similaritySection: {
    marginBottom: 16,
  },
  similarityLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
  },
  similarityBar: {
    height: 8,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  similarityFill: {
    height: '100%',
    borderRadius: 4,
  },
  similarityValue: {
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  wordStats: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    backgroundColor: 'rgba(0,0,0,0.03)',
    borderRadius: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
  },
  insightsSection: {
    gap: 8,
  },
  insightsTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  insightText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
  },
  navigationBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderTopWidth: 1,
  },
  navButton: {
    padding: 8,
  },
  navButtonDisabled: {
    opacity: 0.3,
  },
  verseNumber: {
    fontSize: 16,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  versionList: {
    padding: 20,
  },
  versionListItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
    borderBottomWidth: 1,
  },
  versionInfo: {
    flex: 1,
  },
  versionListName: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  versionListDesc: {
    fontSize: 12,
    lineHeight: 16,
  },
  saveForm: {
    padding: 20,
    gap: 12,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  saveButtonLarge: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
  },
});
