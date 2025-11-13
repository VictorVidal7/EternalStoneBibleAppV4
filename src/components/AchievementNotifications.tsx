/**
 * Componente Global de Notificaciones de Logros
 * Muestra modales cuando se desbloquean logros
 */

import React, { useState, useEffect } from 'react';
import { AchievementUnlockedModal } from './achievements/AchievementUnlockedModal';
import { useServices } from '../context/ServicesContext';
import { Achievement } from '../lib/achievements/types';

export const AchievementNotifications: React.FC = () => {
  const { newAchievements, clearNewAchievements } = useServices();
  const [currentAchievement, setCurrentAchievement] = useState<Achievement | null>(null);
  const [queue, setQueue] = useState<Achievement[]>([]);

  useEffect(() => {
    if (newAchievements.length > 0) {
      setQueue((prev) => [...prev, ...newAchievements]);
      clearNewAchievements();
    }
  }, [newAchievements, clearNewAchievements]);

  useEffect(() => {
    if (queue.length > 0 && !currentAchievement) {
      setCurrentAchievement(queue[0]);
      setQueue((prev) => prev.slice(1));
    }
  }, [queue, currentAchievement]);

  const handleClose = () => {
    setCurrentAchievement(null);
  };

  return (
    <AchievementUnlockedModal
      visible={!!currentAchievement}
      achievement={currentAchievement}
      onClose={handleClose}
    />
  );
};
