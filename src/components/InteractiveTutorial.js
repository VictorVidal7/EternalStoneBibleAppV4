import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fadeIn, fadeOut } from '../utils/animations';
import HapticFeedback from '../services/HapticFeedback';

const tutorialSteps = [
  {
    title: 'Bienvenido a Eternal Stone Bible App',
    content: 'Desliza para explorar las características principales de la app.',
  },
  {
    title: 'Lectura de la Biblia',
    content: 'Accede a todos los libros de la Biblia y navega fácilmente entre capítulos y versículos.',
  },
  {
    title: 'Marcadores y Notas',
    content: 'Guarda tus versículos favoritos y añade notas personales para un estudio más profundo.',
  },
  {
    title: 'Planes de Lectura',
    content: 'Sigue planes de lectura estructurados para mantener tu estudio bíblico organizado.',
  },
  {
    title: '¡Comencemos!',
    content: 'Estás listo para empezar tu viaje espiritual con Eternal Stone Bible App.',
  },
];

const InteractiveTutorial = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [opacity] = useState(new Animated.Value(0));
  const { colors } = useTheme();

  useEffect(() => {
    fadeIn(opacity).start();
  }, []);

  const nextStep = () => {
    HapticFeedback.light();
    if (currentStep < tutorialSteps.length - 1) {
      fadeOut(opacity).start(() => {
        setCurrentStep(prevStep => prevStep + 1);
        fadeIn(opacity).start();
      });
    } else {
      completeTutorial();
    }
  };

  const completeTutorial = async () => {
    HapticFeedback.success();
    await AsyncStorage.setItem('tutorialCompleted', 'true');
    fadeOut(opacity).start(onComplete);
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.background,
      padding: 20,
    },
    content: {
      alignItems: 'center',
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 20,
      textAlign: 'center',
    },
    text: {
      fontSize: 18,
      color: colors.text,
      textAlign: 'center',
      marginBottom: 40,
    },
    button: {
      backgroundColor: colors.primary,
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 5,
    },
    buttonText: {
      color: colors.background,
      fontSize: 18,
      fontWeight: 'bold',
    },
  });

  return (
    <Animated.View style={[styles.container, { opacity }]}>
      <View style={styles.content}>
        <Text style={styles.title}>{tutorialSteps[currentStep].title}</Text>
        <Text style={styles.text}>{tutorialSteps[currentStep].content}</Text>
        <TouchableOpacity style={styles.button} onPress={nextStep}>
          <Text style={styles.buttonText}>
            {currentStep === tutorialSteps.length - 1 ? 'Comenzar' : 'Siguiente'}
          </Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

export default InteractiveTutorial;