/**
 * 🌍 LANGUAGE UTILITIES
 *
 * Funciones de utilidad para acceder a traducciones fuera de componentes React
 * Permite a servicios y utilidades obtener texto traducido
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {translations, Language, TranslationKeys} from './translations';

const LANGUAGE_STORAGE_KEY = '@app_language';
let cachedLanguage: Language | null = null;

/**
 * Obtiene el idioma guardado desde AsyncStorage
 */
export async function getCurrentLanguage(): Promise<Language> {
  // Return cached language if available
  if (cachedLanguage) {
    return cachedLanguage;
  }

  try {
    const savedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);

    if (savedLanguage && (savedLanguage === 'es' || savedLanguage === 'en')) {
      cachedLanguage = savedLanguage;
      return cachedLanguage;
    }

    // Default to Spanish
    cachedLanguage = 'es';
    return cachedLanguage;
  } catch (error) {
    console.error('Error loading current language:', error);
    cachedLanguage = 'es';
    return cachedLanguage;
  }
}

/**
 * Obtiene las traducciones para el idioma actual
 */
export async function getTranslations(): Promise<TranslationKeys> {
  const language = await getCurrentLanguage();
  return translations[language];
}

/**
 * Invalida el caché del idioma (llamar cuando cambie el idioma)
 */
export function invalidateLanguageCache(): void {
  cachedLanguage = null;
}

/**
 * Obtiene una traducción específica de badge por ID
 */
export async function getBadgeTranslation(badgeId: string): Promise<{
  name: string;
  description: string;
} | null> {
  const t = await getTranslations();

  const badgeKey = badgeId as keyof typeof t.badgeSystem.badges;
  const badge = t.badgeSystem.badges[badgeKey];

  if (badge) {
    return {
      name: badge.name,
      description: badge.description,
    };
  }

  return null;
}

/**
 * Obtiene una traducción específica de title por ID
 */
export async function getTitleTranslation(titleId: string): Promise<{
  name: string;
  description: string;
  prefix?: string;
  suffix?: string;
} | null> {
  const t = await getTranslations();

  const titleKey = titleId as keyof typeof t.badgeSystem.titles;
  const title = t.badgeSystem.titles[titleKey];

  if (title) {
    return {
      name: title.name,
      description: title.description,
      prefix: title.prefix,
      suffix: title.suffix,
    };
  }

  return null;
}

/**
 * Obtiene traducción de misión diaria
 */
export async function getDailyMissionTranslation(missionKey: string): Promise<{
  title: string;
  description: string;
} | null> {
  const t = await getTranslations();

  const key = missionKey as keyof typeof t.missions.daily;
  const mission = t.missions.daily[key];

  if (mission) {
    return {
      title: mission.title,
      description: mission.description,
    };
  }

  return null;
}

/**
 * Obtiene traducción de misión semanal
 */
export async function getWeeklyMissionTranslation(missionKey: string): Promise<{
  title: string;
  description: string;
} | null> {
  const t = await getTranslations();

  const key = missionKey as keyof typeof t.missions.weekly;
  const mission = t.missions.weekly[key];

  if (mission) {
    return {
      title: mission.title,
      description: mission.description,
    };
  }

  return null;
}
