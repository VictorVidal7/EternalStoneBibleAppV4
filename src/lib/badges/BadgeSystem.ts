/**
 * 🏆 BADGE & TITLE SYSTEM
 *
 * Sistema completo de logros, badges y títulos coleccionables
 * Gamificación profunda para motivar el crecimiento espiritual
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import * as SQLite from 'expo-sqlite';
import bibleDB from '../database';

export type BadgeRarity = 'common' | 'rare' | 'epic' | 'legendary' | 'mythic';
export type BadgeCategory =
  | 'reading'
  | 'streak'
  | 'completion'
  | 'knowledge'
  | 'social'
  | 'special';

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: BadgeRarity;
  category: BadgeCategory;
  requirement: string;
  requirementValue: number;
  xpReward: number;
  titleUnlock?: string;
}

export interface Title {
  id: string;
  name: string;
  description: string;
  prefix?: string; // Ej: "El Sabio", "Maestro"
  suffix?: string; // Ej: "de Jerusalén"
  color: string;
  icon: string;
  rarity: BadgeRarity;
  unlockedBy: string; // Badge ID que desbloquea este título
}

export interface UserBadge {
  badgeId: string;
  unlockedAt: string;
  progress: number;
}

export interface UserTitle {
  titleId: string;
  unlockedAt: string;
  isEquipped: boolean;
}

export interface BadgeProgress {
  badge: Badge;
  currentProgress: number;
  isUnlocked: boolean;
  percentComplete: number;
}

class BadgeSystemService {
  private db: SQLite.SQLiteDatabase | null = null;

  async initialize() {
    if (!this.db) {
      // Usar la misma instancia de base de datos que el resto de la app
      await bibleDB.initialize();
      this.db = await bibleDB.getDatabase();
      await this.createBadgeTables();
      await this.insertDefaultBadges();
    }
  }

  /**
   * Crea tablas necesarias para el sistema de badges
   */
  private async createBadgeTables() {
    await this.db!.execAsync(`
      -- Tabla de badges/logros
      CREATE TABLE IF NOT EXISTS badges (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT NOT NULL,
        icon TEXT NOT NULL,
        rarity TEXT NOT NULL,
        category TEXT NOT NULL,
        requirement TEXT NOT NULL,
        requirement_value INTEGER NOT NULL,
        xp_reward INTEGER NOT NULL,
        title_unlock TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );

      -- Tabla de títulos
      CREATE TABLE IF NOT EXISTS titles (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT NOT NULL,
        prefix TEXT,
        suffix TEXT,
        color TEXT NOT NULL,
        icon TEXT NOT NULL,
        rarity TEXT NOT NULL,
        unlocked_by TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (unlocked_by) REFERENCES badges(id)
      );

      -- Tabla de badges de usuario
      CREATE TABLE IF NOT EXISTS user_badges (
        user_id TEXT NOT NULL,
        badge_id TEXT NOT NULL,
        unlocked_at TEXT DEFAULT CURRENT_TIMESTAMP,
        progress INTEGER DEFAULT 0,
        PRIMARY KEY (user_id, badge_id),
        FOREIGN KEY (badge_id) REFERENCES badges(id)
      );

      -- Tabla de títulos de usuario
      CREATE TABLE IF NOT EXISTS user_titles (
        user_id TEXT NOT NULL,
        title_id TEXT NOT NULL,
        unlocked_at TEXT DEFAULT CURRENT_TIMESTAMP,
        is_equipped INTEGER DEFAULT 0,
        PRIMARY KEY (user_id, title_id),
        FOREIGN KEY (title_id) REFERENCES titles(id)
      );

      CREATE INDEX IF NOT EXISTS idx_user_badges_user
      ON user_badges(user_id);

      CREATE INDEX IF NOT EXISTS idx_user_titles_user
      ON user_titles(user_id);

      CREATE INDEX IF NOT EXISTS idx_user_titles_equipped
      ON user_titles(user_id, is_equipped);
    `);
  }

  /**
   * Inserta badges y títulos por defecto
   */
  private async insertDefaultBadges() {
    const badges: Badge[] = [
      // READING BADGES
      {
        id: 'first_verse',
        name: 'Primera Lectura',
        description: 'Lee tu primer verso',
        icon: '📖',
        rarity: 'common',
        category: 'reading',
        requirement: 'verses_read',
        requirementValue: 1,
        xpReward: 10,
      },
      {
        id: 'hundred_verses',
        name: 'Lector Dedicado',
        description: 'Lee 100 versos',
        icon: '📚',
        rarity: 'common',
        category: 'reading',
        requirement: 'verses_read',
        requirementValue: 100,
        xpReward: 50,
        titleUnlock: 'title_reader',
      },
      {
        id: 'thousand_verses',
        name: 'Estudiante de la Palabra',
        description: 'Lee 1,000 versos',
        icon: '📜',
        rarity: 'rare',
        category: 'reading',
        requirement: 'verses_read',
        requirementValue: 1000,
        xpReward: 200,
        titleUnlock: 'title_scholar',
      },
      {
        id: 'five_thousand_verses',
        name: 'Maestro de las Escrituras',
        description: 'Lee 5,000 versos',
        icon: '✨',
        rarity: 'epic',
        category: 'reading',
        requirement: 'verses_read',
        requirementValue: 5000,
        xpReward: 500,
        titleUnlock: 'title_master',
      },

      // STREAK BADGES
      {
        id: 'week_streak',
        name: 'Constancia Semanal',
        description: 'Mantén una racha de 7 días',
        icon: '🔥',
        rarity: 'common',
        category: 'streak',
        requirement: 'streak_days',
        requirementValue: 7,
        xpReward: 75,
      },
      {
        id: 'month_streak',
        name: 'Fidelidad Mensual',
        description: 'Mantén una racha de 30 días',
        icon: '⭐',
        rarity: 'rare',
        category: 'streak',
        requirement: 'streak_days',
        requirementValue: 30,
        xpReward: 250,
        titleUnlock: 'title_faithful',
      },
      {
        id: 'hundred_day_streak',
        name: 'Centurión de la Fe',
        description: 'Mantén una racha de 100 días',
        icon: '💎',
        rarity: 'epic',
        category: 'streak',
        requirement: 'streak_days',
        requirementValue: 100,
        xpReward: 1000,
        titleUnlock: 'title_centurion',
      },
      {
        id: 'year_streak',
        name: 'Guardián del Pacto',
        description: 'Mantén una racha de 365 días',
        icon: '👑',
        rarity: 'legendary',
        category: 'streak',
        requirement: 'streak_days',
        requirementValue: 365,
        xpReward: 5000,
        titleUnlock: 'title_guardian',
      },

      // COMPLETION BADGES
      {
        id: 'first_book',
        name: 'Primer Libro Completado',
        description: 'Completa tu primer libro de la Biblia',
        icon: '📕',
        rarity: 'common',
        category: 'completion',
        requirement: 'books_completed',
        requirementValue: 1,
        xpReward: 100,
      },
      {
        id: 'new_testament',
        name: 'Testigo del Nuevo Pacto',
        description: 'Completa todo el Nuevo Testamento',
        icon: '✝️',
        rarity: 'epic',
        category: 'completion',
        requirement: 'new_testament_complete',
        requirementValue: 1,
        xpReward: 2000,
        titleUnlock: 'title_witness',
      },
      {
        id: 'old_testament',
        name: 'Guardián de la Ley',
        description: 'Completa todo el Antiguo Testamento',
        icon: '📜',
        rarity: 'epic',
        category: 'completion',
        requirement: 'old_testament_complete',
        requirementValue: 1,
        xpReward: 3000,
        titleUnlock: 'title_lawkeeper',
      },
      {
        id: 'full_bible',
        name: 'Conocedor de la Palabra',
        description: 'Completa toda la Biblia',
        icon: '🌟',
        rarity: 'legendary',
        category: 'completion',
        requirement: 'full_bible_complete',
        requirementValue: 1,
        xpReward: 10000,
        titleUnlock: 'title_wordbearer',
      },

      // KNOWLEDGE BADGES
      {
        id: 'quiz_master',
        name: 'Maestro del Conocimiento',
        description: 'Responde correctamente 50 preguntas',
        icon: '🎓',
        rarity: 'rare',
        category: 'knowledge',
        requirement: 'quiz_correct',
        requirementValue: 50,
        xpReward: 150,
      },
      {
        id: 'memory_verse_10',
        name: 'Mente Iluminada',
        description: 'Memoriza 10 versos',
        icon: '🧠',
        rarity: 'rare',
        category: 'knowledge',
        requirement: 'verses_memorized',
        requirementValue: 10,
        xpReward: 200,
        titleUnlock: 'title_illuminated',
      },
      {
        id: 'memory_verse_50',
        name: 'Tesoro Viviente',
        description: 'Memoriza 50 versos',
        icon: '💫',
        rarity: 'epic',
        category: 'knowledge',
        requirement: 'verses_memorized',
        requirementValue: 50,
        xpReward: 750,
        titleUnlock: 'title_treasure',
      },

      // SPECIAL BADGES
      {
        id: 'midnight_reader',
        name: 'Vigilia Nocturna',
        description: 'Lee entre la medianoche y las 3 AM',
        icon: '🌙',
        rarity: 'rare',
        category: 'special',
        requirement: 'midnight_reading',
        requirementValue: 1,
        xpReward: 100,
      },
      {
        id: 'early_bird',
        name: 'Madrugador de Dios',
        description: 'Lee antes de las 6 AM durante 7 días',
        icon: '🌅',
        rarity: 'rare',
        category: 'special',
        requirement: 'early_reading',
        requirementValue: 7,
        xpReward: 150,
        titleUnlock: 'title_earlybird',
      },
      {
        id: 'share_master',
        name: 'Evangelizador Digital',
        description: 'Comparte 25 versos',
        icon: '📱',
        rarity: 'rare',
        category: 'social',
        requirement: 'verses_shared',
        requirementValue: 25,
        xpReward: 100,
      },
      {
        id: 'christmas_special',
        name: 'Estrella de Belén',
        description: 'Lee en Navidad',
        icon: '⭐',
        rarity: 'mythic',
        category: 'special',
        requirement: 'christmas_reading',
        requirementValue: 1,
        xpReward: 500,
        titleUnlock: 'title_star',
      },
    ];

    const titles: Title[] = [
      {
        id: 'title_reader',
        name: 'Lector Devoto',
        description: 'Has demostrado dedicación a la lectura',
        prefix: 'Lector',
        color: '#3B82F6',
        icon: '📖',
        rarity: 'common',
        unlockedBy: 'hundred_verses',
      },
      {
        id: 'title_scholar',
        name: 'Estudiante de las Escrituras',
        description: 'Tu conocimiento de la Palabra es notable',
        prefix: 'Estudiante',
        color: '#8B5CF6',
        icon: '📚',
        rarity: 'rare',
        unlockedBy: 'thousand_verses',
      },
      {
        id: 'title_master',
        name: 'Maestro de la Palabra',
        description: 'Dominas las Escrituras',
        prefix: 'Maestro',
        color: '#F59E0B',
        icon: '✨',
        rarity: 'epic',
        unlockedBy: 'five_thousand_verses',
      },
      {
        id: 'title_faithful',
        name: 'El Fiel',
        description: 'Tu constancia es admirable',
        suffix: 'el Fiel',
        color: '#EF4444',
        icon: '⭐',
        rarity: 'rare',
        unlockedBy: 'month_streak',
      },
      {
        id: 'title_centurion',
        name: 'Centurión de la Fe',
        description: '100 días de devoción inquebrantable',
        prefix: 'Centurión',
        color: '#10B981',
        icon: '💎',
        rarity: 'epic',
        unlockedBy: 'hundred_day_streak',
      },
      {
        id: 'title_guardian',
        name: 'Guardián del Pacto',
        description: 'Un año de compromiso espiritual',
        prefix: 'Guardián',
        color: '#7C3AED',
        icon: '👑',
        rarity: 'legendary',
        unlockedBy: 'year_streak',
      },
      {
        id: 'title_witness',
        name: 'Testigo del Nuevo Pacto',
        description: 'Has completado el Nuevo Testamento',
        prefix: 'Testigo',
        color: '#06B6D4',
        icon: '✝️',
        rarity: 'epic',
        unlockedBy: 'new_testament',
      },
      {
        id: 'title_lawkeeper',
        name: 'Guardián de la Ley',
        description: 'Has completado el Antiguo Testamento',
        prefix: 'Guardián',
        suffix: 'de la Ley',
        color: '#D97706',
        icon: '📜',
        rarity: 'epic',
        unlockedBy: 'old_testament',
      },
      {
        id: 'title_wordbearer',
        name: 'Portador de la Palabra',
        description: 'Has leído toda la Biblia',
        prefix: 'Portador',
        suffix: 'de la Palabra',
        color: '#9333EA',
        icon: '🌟',
        rarity: 'legendary',
        unlockedBy: 'full_bible',
      },
      {
        id: 'title_illuminated',
        name: 'El Iluminado',
        description: 'Tu mente guarda la Palabra',
        suffix: 'el Iluminado',
        color: '#FCD34D',
        icon: '🧠',
        rarity: 'rare',
        unlockedBy: 'memory_verse_10',
      },
      {
        id: 'title_treasure',
        name: 'Tesoro Viviente',
        description: 'La Palabra vive en tu corazón',
        prefix: 'Tesoro Viviente',
        color: '#FDE047',
        icon: '💫',
        rarity: 'epic',
        unlockedBy: 'memory_verse_50',
      },
      {
        id: 'title_earlybird',
        name: 'Madrugador de Dios',
        description: 'Inicias el día con la Palabra',
        prefix: 'Madrugador',
        color: '#FB923C',
        icon: '🌅',
        rarity: 'rare',
        unlockedBy: 'early_bird',
      },
      {
        id: 'title_star',
        name: 'Estrella de Belén',
        description: 'Celebraste a Cristo en Su nacimiento',
        prefix: 'Estrella',
        suffix: 'de Belén',
        color: '#FBBF24',
        icon: '⭐',
        rarity: 'mythic',
        unlockedBy: 'christmas_special',
      },
    ];

    // Insertar badges
    for (const badge of badges) {
      await this.db!.runAsync(
        `
        INSERT OR IGNORE INTO badges
        (id, name, description, icon, rarity, category, requirement, requirement_value, xp_reward, title_unlock)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
        [
          badge.id,
          badge.name,
          badge.description,
          badge.icon,
          badge.rarity,
          badge.category,
          badge.requirement,
          badge.requirementValue,
          badge.xpReward,
          badge.titleUnlock || null,
        ],
      );
    }

    // Insertar títulos
    for (const title of titles) {
      await this.db!.runAsync(
        `
        INSERT OR IGNORE INTO titles
        (id, name, description, prefix, suffix, color, icon, rarity, unlocked_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
        [
          title.id,
          title.name,
          title.description,
          title.prefix || null,
          title.suffix || null,
          title.color,
          title.icon,
          title.rarity,
          title.unlockedBy,
        ],
      );
    }
  }

  /**
   * Verifica progreso y desbloquea badges automáticamente
   */
  async checkAndUnlockBadges(
    userId: string,
    requirementType: string,
    currentValue: number,
  ): Promise<Badge[]> {
    await this.initialize();

    const unlockedBadges: Badge[] = [];

    // Buscar badges que cumplan el requisito
    const eligibleBadges = await this.db!.getAllAsync<Badge>(
      `
      SELECT b.* FROM badges b
      LEFT JOIN user_badges ub ON b.id = ub.badge_id AND ub.user_id = ?
      WHERE b.requirement = ?
        AND b.requirement_value <= ?
        AND ub.badge_id IS NULL
    `,
      [userId, requirementType, currentValue],
    );

    // Desbloquear cada badge
    for (const badge of eligibleBadges) {
      await this.db!.runAsync(
        `
        INSERT INTO user_badges (user_id, badge_id, progress)
        VALUES (?, ?, ?)
      `,
        [userId, badge.id, currentValue],
      );

      // Si el badge desbloquea un título, desbloquearlo también
      if (badge.titleUnlock) {
        await this.unlockTitle(userId, badge.titleUnlock);
      }

      unlockedBadges.push(badge);
    }

    return unlockedBadges;
  }

  /**
   * Desbloquea un título para el usuario
   */
  private async unlockTitle(userId: string, titleId: string) {
    await this.db!.runAsync(
      `
      INSERT OR IGNORE INTO user_titles (user_id, title_id)
      VALUES (?, ?)
    `,
      [userId, titleId],
    );
  }

  /**
   * Obtiene todos los badges del usuario
   */
  async getUserBadges(userId: string): Promise<UserBadge[]> {
    await this.initialize();

    const rows = await this.db!.getAllAsync<{
      badge_id: string;
      unlocked_at: string;
      progress: number;
    }>(
      `
      SELECT badge_id, unlocked_at, progress
      FROM user_badges
      WHERE user_id = ?
      ORDER BY unlocked_at DESC
    `,
      [userId],
    );

    return rows.map(row => ({
      badgeId: row.badge_id,
      unlockedAt: row.unlocked_at,
      progress: row.progress,
    }));
  }

  /**
   * Obtiene progreso de todos los badges
   */
  async getAllBadgesProgress(userId: string): Promise<BadgeProgress[]> {
    await this.initialize();

    const allBadges = await this.db!.getAllAsync<Badge>(
      `SELECT * FROM badges ORDER BY rarity, requirement_value`,
    );

    const userBadges = await this.getUserBadges(userId);
    const userBadgeIds = new Set(userBadges.map(ub => ub.badgeId));

    // Obtener estadísticas actuales del usuario
    const stats = await this.getUserStats(userId);

    return allBadges.map(badge => {
      const isUnlocked = userBadgeIds.has(badge.id);
      const currentProgress = stats[badge.requirement] || 0;
      const percentComplete = Math.min(
        100,
        Math.round((currentProgress / badge.requirementValue) * 100),
      );

      return {
        badge,
        currentProgress,
        isUnlocked,
        percentComplete,
      };
    });
  }

  /**
   * Obtiene estadísticas del usuario para verificar progreso
   */
  private async getUserStats(_userId: string): Promise<Record<string, number>> {
    // En producción, esto obtendría stats reales de múltiples tablas
    // Por ahora retornamos valores de ejemplo
    return {
      verses_read: 150,
      streak_days: 12,
      books_completed: 2,
      quiz_correct: 25,
      verses_memorized: 5,
      verses_shared: 10,
    };
  }

  /**
   * Equipa un título para el usuario
   */
  async equipTitle(userId: string, titleId: string) {
    await this.initialize();

    // Desequipar todos los títulos
    await this.db!.runAsync(
      `UPDATE user_titles SET is_equipped = 0 WHERE user_id = ?`,
      [userId],
    );

    // Equipar el título seleccionado
    await this.db!.runAsync(
      `UPDATE user_titles SET is_equipped = 1 WHERE user_id = ? AND title_id = ?`,
      [userId, titleId],
    );
  }

  /**
   * Obtiene el título equipado del usuario
   */
  async getEquippedTitle(userId: string): Promise<Title | null> {
    await this.initialize();

    const result = await this.db!.getFirstAsync<Title>(
      `
      SELECT t.* FROM titles t
      JOIN user_titles ut ON t.id = ut.title_id
      WHERE ut.user_id = ? AND ut.is_equipped = 1
      LIMIT 1
    `,
      [userId],
    );

    return result || null;
  }

  /**
   * Obtiene todos los títulos desbloqueados del usuario
   */
  async getUserTitles(userId: string): Promise<Title[]> {
    await this.initialize();

    const rows = await this.db!.getAllAsync<Title>(
      `
      SELECT t.*, ut.is_equipped
      FROM titles t
      JOIN user_titles ut ON t.id = ut.title_id
      WHERE ut.user_id = ?
      ORDER BY ut.is_equipped DESC, ut.unlocked_at DESC
    `,
      [userId],
    );

    return rows;
  }
}

// Singleton instance
export const badgeSystemService = new BadgeSystemService();
