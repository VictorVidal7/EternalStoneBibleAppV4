/**
 * 🌍 BADGE TRANSLATION HELPER
 *
 * Ayudante para traducir badges y títulos dinámicamente
 * Traduce nombres y descripciones basados en el idioma actual
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import {Badge, Title, BadgeProgress} from './BadgeSystem';
import {getTranslations} from '../../i18n/languageUtils';

/**
 * Traduce un badge a partir de su ID
 */
export async function translateBadge(badge: Badge): Promise<Badge> {
  const t = await getTranslations();

  const badgeKey = badge.id as keyof typeof t.badgeSystem.badges;
  const translation = t.badgeSystem.badges[badgeKey];

  if (translation) {
    return {
      ...badge,
      name: translation.name,
      description: translation.description,
    };
  }

  return badge;
}

/**
 * Traduce un título a partir de su ID
 */
export async function translateTitle(title: Title): Promise<Title> {
  const t = await getTranslations();

  const titleKey = title.id as keyof typeof t.badgeSystem.titles;
  const translation = t.badgeSystem.titles[titleKey];

  if (translation) {
    return {
      ...title,
      name: translation.name,
      description: translation.description,
      prefix: translation.prefix,
      suffix: translation.suffix,
    };
  }

  return title;
}

/**
 * Traduce un array de badges
 */
export async function translateBadges(badges: Badge[]): Promise<Badge[]> {
  return Promise.all(badges.map(badge => translateBadge(badge)));
}

/**
 * Traduce un array de títulos
 */
export async function translateTitles(titles: Title[]): Promise<Title[]> {
  return Promise.all(titles.map(title => translateTitle(title)));
}

/**
 * Traduce el progreso de badges
 */
export async function translateBadgeProgress(
  progress: BadgeProgress[],
): Promise<BadgeProgress[]> {
  return Promise.all(
    progress.map(async p => ({
      ...p,
      badge: await translateBadge(p.badge),
    })),
  );
}
