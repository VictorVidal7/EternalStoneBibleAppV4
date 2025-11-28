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
import {VerseWidget} from '../widgets/VerseWidget';
import {ProgressWidget} from '../widgets/ProgressWidget';
import {MissionWidget} from '../widgets/MissionWidget';
import {useRouter} from 'expo-router';

export const WidgetsDemoScreen: React.FC = () => {
  const {colors} = useTheme();
  const router = useRouter();

  const handleVersePress = (book: string, chapter: number, verse: number) => {
    router.push(`/verse/${book}/${chapter}?highlight=${verse}`);
  };

  const handleProgressPress = () => {
    router.push('/profile');
  };

  const handleMissionPress = () => {
    router.push('/missions');
  };

  return (
    <View style={[styles.container, {backgroundColor: colors.background}]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, {color: colors.text}]}>
          Widgets de EternalStone
        </Text>
        <Text style={[styles.subtitle, {color: colors.textSecondary}]}>
          Mantén tu progreso visible en todo momento
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
            📖 Verso del Día
          </Text>
          <Text style={[styles.sectionDesc, {color: colors.textSecondary}]}>
            Inspiración diaria directamente en tu pantalla principal
          </Text>
          <VerseWidget onPress={handleVersePress} />
        </View>

        {/* Progress Widget */}
        <View style={styles.widgetSection}>
          <Text style={[styles.sectionTitle, {color: colors.text}]}>
            📊 Tu Progreso
          </Text>
          <Text style={[styles.sectionDesc, {color: colors.textSecondary}]}>
            Visualiza tu racha, nivel y objetivos diarios
          </Text>
          <ProgressWidget userId="demo-user" onPress={handleProgressPress} />
        </View>

        {/* Mission Widget */}
        <View style={styles.widgetSection}>
          <Text style={[styles.sectionTitle, {color: colors.text}]}>
            🎯 Misión Activa
          </Text>
          <Text style={[styles.sectionDesc, {color: colors.textSecondary}]}>
            Completa misiones diarias y gana recompensas
          </Text>
          <MissionWidget userId="demo-user" onPress={handleMissionPress} />
        </View>

        {/* Info Section */}
        <View style={[styles.infoCard, {backgroundColor: colors.surface}]}>
          <Text style={[styles.infoTitle, {color: colors.text}]}>
            💡 Cómo usar los Widgets
          </Text>
          <View style={styles.infoList}>
            <Text style={[styles.infoItem, {color: colors.textSecondary}]}>
              1. Mantén presionada la pantalla principal de tu teléfono
            </Text>
            <Text style={[styles.infoItem, {color: colors.textSecondary}]}>
              2. Toca el ícono "+" en la esquina superior
            </Text>
            <Text style={[styles.infoItem, {color: colors.textSecondary}]}>
              3. Busca "EternalStone" en la lista de apps
            </Text>
            <Text style={[styles.infoItem, {color: colors.textSecondary}]}>
              4. Selecciona el widget que desees agregar
            </Text>
            <Text style={[styles.infoItem, {color: colors.textSecondary}]}>
              5. ¡Listo! Ahora tendrás acceso rápido a tu contenido favorito
            </Text>
          </View>
        </View>

        {/* Feature Highlights */}
        <View style={styles.featuresSection}>
          <Text style={[styles.featureTitle, {color: colors.text}]}>
            ✨ Características
          </Text>
          <View style={styles.featuresList}>
            <View
              style={[styles.featureCard, {backgroundColor: colors.surface}]}>
              <Text style={styles.featureEmoji}>🔄</Text>
              <Text style={[styles.featureText, {color: colors.text}]}>
                Actualización automática cada hora
              </Text>
            </View>
            <View
              style={[styles.featureCard, {backgroundColor: colors.surface}]}>
              <Text style={styles.featureEmoji}>🎨</Text>
              <Text style={[styles.featureText, {color: colors.text}]}>
                Diseño adaptativo claro/oscuro
              </Text>
            </View>
            <View
              style={[styles.featureCard, {backgroundColor: colors.surface}]}>
              <Text style={styles.featureEmoji}>⚡</Text>
              <Text style={[styles.featureText, {color: colors.text}]}>
                Rendimiento optimizado
              </Text>
            </View>
            <View
              style={[styles.featureCard, {backgroundColor: colors.surface}]}>
              <Text style={styles.featureEmoji}>📱</Text>
              <Text style={[styles.featureText, {color: colors.text}]}>
                Múltiples tamaños disponibles
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
