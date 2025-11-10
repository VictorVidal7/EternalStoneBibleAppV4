import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, TouchableWithoutFeedback, AccessibilityInfo } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import CustomIconButton from './CustomIconButton';
import { useTranslation } from 'react-i18next';
import HapticFeedback from '../services/HapticFeedback';

const DistractionFreeMode = ({ verses, currentVerseIndex, onNextVerse, onPreviousVerse, onClose }) => {
  const { colors } = useTheme();
  const [controlsOpacity] = useState(new Animated.Value(1));
  const [textOpacity] = useState(new Animated.Value(1));
  const [screenReaderEnabled, setScreenReaderEnabled] = useState(false);
  const { t } = useTranslation();

  const currentVerse = verses[currentVerseIndex];

  useEffect(() => {
    Animated.timing(textOpacity, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    AccessibilityInfo.isScreenReaderEnabled().then(
      screenReaderEnabled => {
        setScreenReaderEnabled(screenReaderEnabled);
      }
    );

    const listener = AccessibilityInfo.addEventListener(
      'screenReaderChanged',
      screenReaderEnabled => {
        setScreenReaderEnabled(screenReaderEnabled);
      }
    );

    return () => {
      listener.remove();
    };
  }, [currentVerseIndex, textOpacity]);

  const showControls = () => {
    Animated.timing(controlsOpacity, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
    setTimeout(hideControls, 3000);
  };

  const hideControls = () => {
    Animated.timing(controlsOpacity, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const handleNextVerse = () => {
    HapticFeedback.light();
    onNextVerse();
  };

  const handlePreviousVerse = () => {
    HapticFeedback.light();
    onPreviousVerse();
  };

  const handleClose = () => {
    HapticFeedback.medium();
    onClose();
  };

  if (!currentVerse) {
    return null;
  }

  return (
    <TouchableWithoutFeedback onPress={showControls}>
      <View 
        style={[styles.container, { backgroundColor: colors.background }]}
        accessible={true}
        accessibilityLabel={t('Modo de lectura sin distracciones')}
        accessibilityHint={t('Toca la pantalla para mostrar los controles de navegación')}
      >
        <Animated.View 
          style={[styles.verseContainer, { opacity: textOpacity }]}
          accessible={true}
          accessibilityLabel={t('Versículo actual')}
          accessibilityRole="text"
        >
          <Text style={[styles.verseText, { color: colors.text }]}>
            {currentVerse.text}
          </Text>
          <Text style={[styles.verseReference, { color: colors.secondary }]}>
            {`${currentVerse.book} ${currentVerse.chapter}:${currentVerse.number}`}
          </Text>
        </Animated.View>
        <Animated.View style={[styles.controls, { opacity: controlsOpacity }]}>
          <CustomIconButton
            name="chevron-left"
            onPress={handlePreviousVerse}
            color={colors.primary}
            size={40}
            style={styles.navButton}
            accessibilityLabel={t('Versículo anterior')}
            accessibilityHint={t('Navegar al versículo anterior')}
          />
          <CustomIconButton
            name="close"
            onPress={handleClose}
            color={colors.primary}
            size={30}
            style={styles.closeButton}
            accessibilityLabel={t('Cerrar modo sin distracciones')}
            accessibilityHint={t('Volver a la vista normal de lectura')}
          />
          <CustomIconButton
            name="chevron-right"
            onPress={handleNextVerse}
            color={colors.primary}
            size={40}
            style={styles.navButton}
            accessibilityLabel={t('Siguiente versículo')}
            accessibilityHint={t('Navegar al siguiente versículo')}
          />
        </Animated.View>
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  verseContainer: {
    padding: 20,
    alignItems: 'center',
  },
  verseText: {
    fontSize: 24,
    textAlign: 'center',
    marginBottom: 20,
  },
  verseReference: {
    fontSize: 18,
    fontStyle: 'italic',
  },
  controls: {
    position: 'absolute',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    left: 0,
    right: 0,
    bottom: 40,
    paddingHorizontal: 20,
  },
  navButton: {
    padding: 10,
  },
  closeButton: {
    padding: 10,
  },
});

export default DistractionFreeMode;