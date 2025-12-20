/**
 * 🔍 SearchSpotlight - Búsqueda Premium Tipo iOS/macOS
 *
 * Barra de búsqueda con animaciones fluidas y sugerencias
 * Diseñado para Celestial Premium 2.0
 *
 * Características:
 * - Expansión animada al enfocar (60fps)
 * - Sugerencias con highlight de coincidencias
 * - Historial de búsquedas recientes
 * - Haptic feedback
 * - Glassmorphism en modo overlay
 * - Cancelar/Clear con animación
 *
 * Para la gloria de Dios - Eternal Bible App
 */

import React, {useState, useCallback, useMemo, useRef, useEffect} from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  FlatList,
  Keyboard,
  ViewStyle,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  FadeIn,
  FadeOut,
  SlideInDown,
  SlideOutDown,
  Layout,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import {SPRING_CONFIGS, DURATIONS} from '../../styles/reanimatedAnimations';

// ==================== TYPES ====================

export interface SearchSuggestion {
  id: string;
  text: string;
  type: 'recent' | 'suggestion' | 'result';
  icon?: React.ReactNode;
  subtitle?: string;
  data?: any;
}

interface SearchSpotlightProps {
  placeholder?: string;
  value?: string;
  onChangeText?: (text: string) => void;
  onSubmit?: (text: string) => void;
  onSuggestionPress?: (suggestion: SearchSuggestion) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  onClear?: () => void;
  suggestions?: SearchSuggestion[];
  recentSearches?: SearchSuggestion[];
  showSuggestions?: boolean;
  isDark?: boolean;
  enableHaptics?: boolean;
  autoFocus?: boolean;
  containerStyle?: ViewStyle;
  showCancelButton?: boolean;
  cancelText?: string;
  searchIcon?: React.ReactNode;
  maxSuggestions?: number;
}

// ==================== ANIMATED COMPONENTS ====================

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// ==================== SUGGESTION ITEM ====================

interface SuggestionItemProps {
  suggestion: SearchSuggestion;
  searchText: string;
  onPress: () => void;
  isDark: boolean;
  index: number;
}

const SuggestionItem: React.FC<SuggestionItemProps> = ({
  suggestion,
  searchText,
  onPress,
  isDark,
  index,
}) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{scale: scale.value}],
  }));

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.98, SPRING_CONFIGS.snappy);
  }, [scale]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, SPRING_CONFIGS.snappy);
  }, [scale]);

  // Highlight matching text
  const highlightedText = useMemo(() => {
    if (!searchText) return suggestion.text;

    const index = suggestion.text
      .toLowerCase()
      .indexOf(searchText.toLowerCase());
    if (index === -1) return suggestion.text;

    const before = suggestion.text.slice(0, index);
    const match = suggestion.text.slice(index, index + searchText.length);
    const after = suggestion.text.slice(index + searchText.length);

    return (
      <Text>
        {before}
        <Text style={styles.highlightedText}>{match}</Text>
        {after}
      </Text>
    );
  }, [suggestion.text, searchText]);

  const getIcon = () => {
    if (suggestion.icon) return suggestion.icon;
    switch (suggestion.type) {
      case 'recent':
        return <Text style={styles.suggestionIcon}>🕐</Text>;
      case 'suggestion':
        return <Text style={styles.suggestionIcon}>💡</Text>;
      case 'result':
        return <Text style={styles.suggestionIcon}>📖</Text>;
      default:
        return <Text style={styles.suggestionIcon}>🔍</Text>;
    }
  };

  return (
    <AnimatedPressable
      entering={FadeIn.delay(index * 30).duration(200)}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        styles.suggestionItem,
        isDark && styles.suggestionItemDark,
        animatedStyle,
      ]}>
      <View style={styles.suggestionIconContainer}>{getIcon()}</View>
      <View style={styles.suggestionContent}>
        <Text
          style={[styles.suggestionText, isDark && styles.suggestionTextDark]}
          numberOfLines={1}>
          {highlightedText}
        </Text>
        {suggestion.subtitle && (
          <Text
            style={[
              styles.suggestionSubtitle,
              isDark && styles.suggestionSubtitleDark,
            ]}
            numberOfLines={1}>
            {suggestion.subtitle}
          </Text>
        )}
      </View>
      <Text style={styles.arrowIcon}>↗</Text>
    </AnimatedPressable>
  );
};

// ==================== MAIN COMPONENT ====================

export const SearchSpotlight: React.FC<SearchSpotlightProps> = ({
  placeholder = 'Buscar en la Biblia...',
  value = '',
  onChangeText,
  onSubmit,
  onSuggestionPress,
  onFocus,
  onBlur,
  onClear,
  suggestions = [],
  recentSearches = [],
  showSuggestions: showSuggestionsProp = true,
  isDark = false,
  enableHaptics = true,
  autoFocus = false,
  containerStyle,
  showCancelButton = true,
  cancelText = 'Cancelar',
  searchIcon,
  maxSuggestions = 8,
}) => {
  const inputRef = useRef<TextInput>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [internalValue, setInternalValue] = useState(value);

  // Animations
  const containerWidth = useSharedValue(1);
  const cancelOpacity = useSharedValue(0);
  const cancelTranslateX = useSharedValue(20);
  const inputScale = useSharedValue(1);

  // Sync external value
  useEffect(() => {
    setInternalValue(value);
  }, [value]);

  // Determine what suggestions to show
  const displaySuggestions = useMemo(() => {
    if (!showSuggestionsProp || !isFocused) return [];

    const query = internalValue.trim().toLowerCase();

    if (!query) {
      // Show recent searches
      return recentSearches.slice(0, maxSuggestions);
    }

    // Filter suggestions by query
    return suggestions
      .filter(s => s.text.toLowerCase().includes(query))
      .slice(0, maxSuggestions);
  }, [
    showSuggestionsProp,
    isFocused,
    internalValue,
    suggestions,
    recentSearches,
    maxSuggestions,
  ]);

  // Handle focus
  const handleFocus = useCallback(() => {
    setIsFocused(true);
    if (enableHaptics) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    if (showCancelButton) {
      containerWidth.value = withSpring(0.85, SPRING_CONFIGS.snappy);
      cancelOpacity.value = withTiming(1, {duration: DURATIONS.normal});
      cancelTranslateX.value = withSpring(0, SPRING_CONFIGS.snappy);
    }

    onFocus?.();
  }, [
    enableHaptics,
    showCancelButton,
    containerWidth,
    cancelOpacity,
    cancelTranslateX,
    onFocus,
  ]);

  // Handle blur
  const handleBlur = useCallback(() => {
    setIsFocused(false);

    if (showCancelButton) {
      containerWidth.value = withSpring(1, SPRING_CONFIGS.snappy);
      cancelOpacity.value = withTiming(0, {duration: DURATIONS.fast});
      cancelTranslateX.value = withSpring(20, SPRING_CONFIGS.snappy);
    }

    onBlur?.();
  }, [
    showCancelButton,
    containerWidth,
    cancelOpacity,
    cancelTranslateX,
    onBlur,
  ]);

  // Handle text change
  const handleChangeText = useCallback(
    (text: string) => {
      setInternalValue(text);
      onChangeText?.(text);
    },
    [onChangeText],
  );

  // Handle clear
  const handleClear = useCallback(() => {
    if (enableHaptics) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setInternalValue('');
    onChangeText?.('');
    onClear?.();
    inputRef.current?.focus();
  }, [enableHaptics, onChangeText, onClear]);

  // Handle cancel
  const handleCancel = useCallback(() => {
    if (enableHaptics) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setInternalValue('');
    onChangeText?.('');
    Keyboard.dismiss();
    handleBlur();
  }, [enableHaptics, onChangeText, handleBlur]);

  // Handle submit
  const handleSubmit = useCallback(() => {
    if (enableHaptics) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    onSubmit?.(internalValue);
    Keyboard.dismiss();
  }, [enableHaptics, onSubmit, internalValue]);

  // Handle suggestion press
  const handleSuggestionPress = useCallback(
    (suggestion: SearchSuggestion) => {
      if (enableHaptics) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      setInternalValue(suggestion.text);
      onChangeText?.(suggestion.text);
      onSuggestionPress?.(suggestion);
    },
    [enableHaptics, onChangeText, onSuggestionPress],
  );

  // Animated styles
  const animatedContainerStyle = useAnimatedStyle(() => ({
    flex: containerWidth.value,
  }));

  const animatedCancelStyle = useAnimatedStyle(() => ({
    opacity: cancelOpacity.value,
    transform: [{translateX: cancelTranslateX.value}],
  }));

  const animatedInputStyle = useAnimatedStyle(() => ({
    transform: [{scale: inputScale.value}],
  }));

  // Colors
  const colors = useMemo(
    () => ({
      background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
      border: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.08)',
      text: isDark ? '#FFFFFF' : '#1f2937',
      placeholder: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)',
      icon: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.4)',
    }),
    [isDark],
  );

  return (
    <View style={[styles.wrapper, containerStyle]}>
      {/* Search Input Row */}
      <View style={styles.searchRow}>
        <Animated.View style={[styles.inputContainer, animatedContainerStyle]}>
          <Animated.View
            style={[
              styles.inputWrapper,
              {backgroundColor: colors.background, borderColor: colors.border},
              isFocused && styles.inputWrapperFocused,
              animatedInputStyle,
            ]}>
            {/* Search Icon */}
            <View style={styles.searchIconContainer}>
              {searchIcon || (
                <Text style={[styles.searchIcon, {color: colors.icon}]}>
                  🔍
                </Text>
              )}
            </View>

            {/* Text Input */}
            <TextInput
              ref={inputRef}
              style={[styles.input, {color: colors.text}]}
              placeholder={placeholder}
              placeholderTextColor={colors.placeholder}
              value={internalValue}
              onChangeText={handleChangeText}
              onFocus={handleFocus}
              onBlur={handleBlur}
              onSubmitEditing={handleSubmit}
              returnKeyType="search"
              autoFocus={autoFocus}
              autoCapitalize="none"
              autoCorrect={false}
              clearButtonMode="never"
            />

            {/* Clear Button */}
            {internalValue.length > 0 && (
              <Animated.View
                entering={FadeIn.duration(150)}
                exiting={FadeOut.duration(100)}>
                <Pressable
                  onPress={handleClear}
                  style={styles.clearButton}
                  hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
                  <Text style={[styles.clearIcon, {color: colors.icon}]}>
                    ✕
                  </Text>
                </Pressable>
              </Animated.View>
            )}
          </Animated.View>
        </Animated.View>

        {/* Cancel Button */}
        {showCancelButton && (
          <AnimatedPressable
            onPress={handleCancel}
            style={[styles.cancelButton, animatedCancelStyle]}>
            <Text style={[styles.cancelText, isDark && styles.cancelTextDark]}>
              {cancelText}
            </Text>
          </AnimatedPressable>
        )}
      </View>

      {/* Suggestions List */}
      {displaySuggestions.length > 0 && isFocused && (
        <Animated.View
          entering={SlideInDown.duration(250).springify()}
          exiting={SlideOutDown.duration(150)}
          layout={Layout.springify()}
          style={[
            styles.suggestionsContainer,
            isDark && styles.suggestionsContainerDark,
          ]}>
          {/* Section Header */}
          {!internalValue && recentSearches.length > 0 && (
            <View style={styles.sectionHeader}>
              <Text
                style={[
                  styles.sectionTitle,
                  isDark && styles.sectionTitleDark,
                ]}>
                Búsquedas recientes
              </Text>
            </View>
          )}

          <FlatList
            data={displaySuggestions}
            keyExtractor={item => item.id}
            renderItem={({item, index}) => (
              <SuggestionItem
                suggestion={item}
                searchText={internalValue}
                onPress={() => handleSuggestionPress(item)}
                isDark={isDark}
                index={index}
              />
            )}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            style={styles.suggestionsList}
          />
        </Animated.View>
      )}
    </View>
  );
};

// ==================== STYLES ====================

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputContainer: {
    flex: 1,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
    height: 52,
  },
  inputWrapperFocused: {
    borderColor: '#6366f1',
  },
  searchIconContainer: {
    marginRight: 10,
  },
  searchIcon: {
    fontSize: 18,
  },
  input: {
    flex: 1,
    fontSize: 17,
    fontWeight: '500',
    paddingVertical: 0,
  },
  clearButton: {
    padding: 6,
    marginLeft: 8,
  },
  clearIcon: {
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginLeft: 8,
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6366f1',
  },
  cancelTextDark: {
    color: '#818cf8',
  },
  // Suggestions
  suggestionsContainer: {
    marginTop: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
    maxHeight: 320,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  suggestionsContainerDark: {
    backgroundColor: '#1f2937',
    borderColor: 'rgba(255,255,255,0.1)',
  },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(0,0,0,0.5)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionTitleDark: {
    color: 'rgba(255,255,255,0.5)',
  },
  suggestionsList: {
    paddingBottom: 8,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 12,
  },
  suggestionItemDark: {
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  suggestionIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  suggestionIcon: {
    fontSize: 14,
  },
  suggestionContent: {
    flex: 1,
  },
  suggestionText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
  },
  suggestionTextDark: {
    color: '#FFFFFF',
  },
  highlightedText: {
    fontWeight: '700',
    color: '#6366f1',
  },
  suggestionSubtitle: {
    fontSize: 13,
    color: 'rgba(0,0,0,0.5)',
    marginTop: 2,
  },
  suggestionSubtitleDark: {
    color: 'rgba(255,255,255,0.5)',
  },
  arrowIcon: {
    fontSize: 14,
    color: 'rgba(0,0,0,0.3)',
  },
});

// ==================== EXPORTS ====================

export default SearchSpotlight;
