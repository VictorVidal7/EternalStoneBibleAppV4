import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ReadingPlanContext = createContext();

export const ReadingPlanProvider = ({ children }) => {
  const [currentPlan, setCurrentPlan] = useState(null);
  const [progress, setProgress] = useState({});

  useEffect(() => {
    loadProgress();
  }, []);

  const loadProgress = async () => {
    try {
      const savedProgress = await AsyncStorage.getItem('readingPlanProgress');
      if (savedProgress) {
        setProgress(JSON.parse(savedProgress));
      }
    } catch (error) {
      console.error('Error loading reading progress:', error);
    }
  };

  const savePlan = async (plan) => {
    setCurrentPlan(plan);
    await AsyncStorage.setItem('currentPlan', JSON.stringify(plan));
  };

  const startPlan = async () => {
    if (currentPlan) {
      const newProgress = { [currentPlan.id]: { 1: true } };
      setProgress(newProgress);
      await AsyncStorage.setItem('readingPlanProgress', JSON.stringify(newProgress));
    }
  };

  const continuePlan = () => {
    // Implement the logic to continue the plan
    console.log('Continuing plan');
  };

  const updateProgress = async (day) => {
    if (currentPlan) {
      const newProgress = {
        ...progress,
        [currentPlan.id]: { ...progress[currentPlan.id], [day]: true }
      };
      setProgress(newProgress);
      await AsyncStorage.setItem('readingPlanProgress', JSON.stringify(newProgress));
    }
  };

  return (
    <ReadingPlanContext.Provider
      value={{
        currentPlan,
        progress,
        savePlan,
        startPlan,
        continuePlan,
        updateProgress
      }}
    >
      {children}
    </ReadingPlanContext.Provider>
  );
};

export const useReadingPlan = () => {
  const context = useContext(ReadingPlanContext);
  if (context === undefined) {
    throw new Error('useReadingPlan must be used within a ReadingPlanProvider');
  }
  return context;
};