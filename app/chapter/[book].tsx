/**
 * 🎨 CHAPTER SELECTION SCREEN - PREMIUM
 *
 * Pantalla de selección de capítulos con diseño premium
 */

import React, { useCallback, useEffect, useState, useMemo, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  Platform,
  FlatList,
} from 'react-native';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { getBookByName } from '../../src/constants/bible';
import { useTheme } from '../../src/hooks/useTheme';
import { useLanguage } from '../../src/hooks/useLanguage';

// Design tokens
import {
  spacing,
  borderRadius,
  fontSize,
  shadows,
} from '../../src/styles/designTokens';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_MARGIN = spacing.md;
const CARDS_PER_ROW = 3;
const CARD_SIZE =
  (SCREEN_WIDTH - spacing.lg * 2 - CARD_MARGIN * (CARDS_PER_ROW - 1)) / CARDS_PER_ROW;

interface ChapterItem {
  chapter: number;
  id: string;
}

export default function ChapterSelectionScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();
  const params = useLocalSearchParams<{ book: string }>();
  const [isLoading, setIsLoading] = useState(true);

  // Manejar el parámetro book (puede venir como string o array)
  const book = typeof params.book === 'string' ? params.book : (params.book?.[0] || '');

  // Animaciones
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-50)).current;

  const bookInfo = getBookByName(book);

  /**
   * Generar lista de capítulos
   */
  const chapters = useMemo((): ChapterItem[] => {
    if (!bookInfo) {
      console.log('📚 No bookInfo found for:', book);
      return [];
    }

    const chapterList = Array.from({ length: bookInfo.chapters }, (_, i) => ({
      chapter: i + 1,
      id: `chapter-${i + 1}`,
    }));

    console.log('📚 Generated chapters:', chapterList.length, 'for book:', bookInfo.name);
    return chapterList;
  }, [bookInfo, book]);

  useEffect(() => {
    console.log('📚 ChapterScreen mounted with book:', book);
    console.log('📚 BookInfo:', bookInfo);
    console.log('📚 Chapters count:', chapters.length);

    const timer = setTimeout(() => {
      setIsLoading(false);
      startAnimations();
    }, 100);
    return () => clearTimeout(timer);
  }, [book, bookInfo, chapters]);

  const startAnimations = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  };

  /**
   * Navegar a la pantalla de versículos
   */
  const navigateToVerse = useCallback(
    (chapter: number) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      router.push(`/verse/${book}/${chapter}` as any);
    },
    [router, book]
  );

  /**
   * Renderizar item de capítulo con animación
   */
  const renderItem = useCallback(
    ({ item, index }: { item: ChapterItem; index: number }) => (
      <ChapterCard
        chapter={item.chapter}
        onPress={() => navigateToVerse(item.chapter)}
        index={index}
        colors={colors}
        isDark={isDark}
        t={t}
        bookName={bookInfo?.name || ''}
      />
    ),
    [colors, isDark, navigateToVerse, bookInfo, t]
  );

  if (!bookInfo) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.text }}>Libro no encontrado</Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />

      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header con gradiente */}
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }}
        >
          <LinearGradient
            colors={
              isDark
                ? ['#667eea', '#764ba2', colors.background]
                : ['#667eea', '#764ba2', colors.background]
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.header}
          >
            <View style={styles.headerContent}>
              <View style={styles.headerIconContainer}>
                <Ionicons name="book-outline" size={32} color="#ffffff" />
              </View>
              <View style={styles.headerTextContainer}>
                <Text style={styles.headerSubtitle}>Selecciona un capítulo</Text>
                <Text style={styles.headerTitle} numberOfLines={1}>
                  {bookInfo.name}
                </Text>
                <View style={styles.chapterCountBadge}>
                  <Ionicons name="document-text" size={14} color="#fbbf24" />
                  <Text style={styles.chapterCountText}>
                    {chapters.length} {chapters.length === 1 ? 'capítulo' : 'capítulos'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Decoración */}
            <View style={styles.headerDecoration}>
              <Ionicons
                name="sparkles"
                size={20}
                color="rgba(255,255,255,0.3)"
                style={styles.decorationIcon1}
              />
              <Ionicons
                name="star"
                size={16}
                color="rgba(255,255,255,0.2)"
                style={styles.decorationIcon2}
              />
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Grid de capítulos */}
        <Animated.View style={[styles.listContainer, { opacity: fadeAnim }]}>
          {chapters.length > 0 ? (
            <FlatList
              data={chapters}
              renderItem={renderItem}
              keyExtractor={(item) => item.id}
              numColumns={CARDS_PER_ROW}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listContent}
              initialNumToRender={15}
              maxToRenderPerBatch={10}
              windowSize={5}
            />
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="book-outline" size={64} color={colors.textTertiary} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                No se pudieron cargar los capítulos
              </Text>
              <Text style={[styles.emptySubtext, { color: colors.textTertiary }]}>
                Libro: {book || 'No especificado'}
              </Text>
            </View>
          )}
        </Animated.View>
      </View>
    </>
  );
}

// ==================== CHAPTER CARD COMPONENT ====================

interface ChapterCardProps {
  chapter: number;
  onPress: () => void;
  index: number;
  colors: any;
  isDark: boolean;
  t: any;
  bookName: string;
}

const ChapterCard: React.FC<ChapterCardProps> = React.memo(
  ({ chapter, onPress, index, colors, isDark, t, bookName }) => {
    const scaleAnim = useRef(new Animated.Value(0)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const [isPressed, setIsPressed] = useState(false);

    useEffect(() => {
      // Animación staggered
      const delay = (index % 9) * 50; // 9 items por pantalla aprox

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
    }, [index]);

    const handlePressIn = () => {
      setIsPressed(true);
      Animated.spring(scaleAnim, {
        toValue: 0.95,
        tension: 100,
        friction: 5,
        useNativeDriver: true,
      }).start();
    };

    const handlePressOut = () => {
      setIsPressed(false);
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 100,
        friction: 5,
        useNativeDriver: true,
      }).start();
    };

    return (
      <Animated.View
        style={[
          styles.cardWrapper,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          accessibilityRole="button"
          accessibilityLabel={`${t.bible.chapter} ${chapter}`}
          accessibilityHint={`${t.bible.tapToRead} ${chapter} ${t.bible.of} ${bookName}`}
        >
          <View
            style={[
              styles.card,
              {
                backgroundColor: colors.card,
                borderColor: isDark
                  ? 'rgba(255,255,255,0.1)'
                  : 'rgba(0,0,0,0.05)',
              },
              shadows.md,
            ]}
          >
            {/* Gradiente sutil en el fondo */}
            <LinearGradient
              colors={
                isDark
                  ? ['rgba(102, 126, 234, 0.1)', 'transparent']
                  : ['rgba(102, 126, 234, 0.05)', 'transparent']
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />

            {/* Número del capítulo */}
            <Text
              style={[
                styles.chapterNumber,
                {
                  color: isPressed ? colors.primary : colors.text,
                },
              ]}
            >
              {chapter}
            </Text>

            {/* Ícono decorativo */}
            <View
              style={[
                styles.cardIconContainer,
                {
                  backgroundColor: isPressed
                    ? colors.primary + '20'
                    : colors.primaryLight + '15',
                },
              ]}
            >
              <Ionicons
                name="document-text-outline"
                size={16}
                color={isPressed ? colors.primary : colors.textSecondary}
              />
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  }
);

ChapterCard.displayName = 'ChapterCard';

// ==================== STYLES ====================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  // Header
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
    borderBottomLeftRadius: borderRadius['2xl'],
    borderBottomRightRadius: borderRadius['2xl'],
    ...shadows.lg,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIconContainer: {
    width: 64,
    height: 64,
    borderRadius: borderRadius.lg,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.base,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  headerTextContainer: {
    flex: 1,
  },
  headerSubtitle: {
    fontSize: fontSize.sm,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '500',
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: fontSize['3xl'],
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: spacing.xs,
  },
  chapterCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
    alignSelf: 'flex-start',
    gap: 4,
  },
  chapterCountText: {
    fontSize: fontSize.xs,
    color: '#ffffff',
    fontWeight: '600',
  },
  headerDecoration: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  decorationIcon1: {
    position: 'absolute',
    top: 70,
    right: 30,
  },
  decorationIcon2: {
    position: 'absolute',
    top: 110,
    right: 50,
  },

  // List
  listContainer: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing['2xl'],
  },
  emptyText: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    marginTop: spacing.base,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: fontSize.sm,
    marginTop: spacing.xs,
    textAlign: 'center',
  },

  // Card
  cardWrapper: {
    width: CARD_SIZE,
    height: CARD_SIZE,
    padding: CARD_MARGIN / 2,
  },
  card: {
    flex: 1,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  chapterNumber: {
    fontSize: fontSize['4xl'],
    fontWeight: '800',
    marginBottom: spacing.xs,
  },
  cardIconContainer: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
