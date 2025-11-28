/**
 * 🎯 MISSION SYSTEM
 *
 * Sistema de misiones diarias, semanales y mensuales para aumentar engagement
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import {BibleDatabase} from '../database';

export enum MissionType {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  SPECIAL = 'special',
}

export enum MissionDifficulty {
  EASY = 'easy',
  MEDIUM = 'medium',
  HARD = 'hard',
  LEGENDARY = 'legendary',
}

export enum MissionRequirementType {
  READ_VERSES = 'read_verses',
  READ_CHAPTERS = 'read_chapters',
  COMPLETE_BOOK = 'complete_book',
  ADD_NOTE = 'add_note',
  ADD_HIGHLIGHT = 'add_highlight',
  SHARE_VERSE = 'share_verse',
  MAINTAIN_STREAK = 'maintain_streak',
  SEARCH = 'search',
  READ_AT_TIME = 'read_at_time', // Read at specific time (early bird, night owl)
  READ_SPECIFIC_BOOK = 'read_specific_book',
}

export enum RewardType {
  POINTS = 'points',
  BADGE = 'badge',
  THEME = 'theme',
  TITLE = 'title',
}

export interface MissionRequirement {
  type: MissionRequirementType;
  target: number;
  current: number;
  metadata?: {
    bookName?: string;
    startHour?: number;
    endHour?: number;
  };
}

export interface Reward {
  type: RewardType;
  value: string | number;
  displayName: string;
}

export interface Mission {
  id: string;
  type: MissionType;
  title: string;
  description: string;
  difficulty: MissionDifficulty;
  requirements: MissionRequirement[];
  rewards: Reward[];
  expiresAt: number; // Unix timestamp
  createdAt: number;
  isCompleted: boolean;
  completedAt?: number;
  claimedReward: boolean;
}

export class MissionService {
  private db: BibleDatabase;

  constructor(database: BibleDatabase) {
    this.db = database;
  }

  /**
   * Initialize missions table
   */
  async initialize(): Promise<void> {
    const dbInstance = await this.db.getDatabase();

    await dbInstance.execAsync(`
      CREATE TABLE IF NOT EXISTS missions (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        difficulty TEXT NOT NULL,
        requirements TEXT NOT NULL,
        rewards TEXT NOT NULL,
        expires_at INTEGER NOT NULL,
        created_at INTEGER NOT NULL,
        is_completed INTEGER DEFAULT 0,
        completed_at INTEGER,
        claimed_reward INTEGER DEFAULT 0
      )
    `);

    await dbInstance.execAsync(`
      CREATE TABLE IF NOT EXISTS mission_progress (
        mission_id TEXT PRIMARY KEY,
        progress TEXT NOT NULL,
        updated_at INTEGER NOT NULL,
        FOREIGN KEY(mission_id) REFERENCES missions(id)
      )
    `);

    // Generate initial missions
    await this.generateDailyMissions();
  }

  /**
   * Generate daily missions (called at midnight)
   */
  async generateDailyMissions(): Promise<Mission[]> {
    const now = Date.now();
    const tomorrow = new Date();
    tomorrow.setHours(23, 59, 59, 999);
    const expiresAt = tomorrow.getTime();

    const dailyMissions: Omit<
      Mission,
      'id' | 'createdAt' | 'expiresAt' | 'isCompleted' | 'claimedReward'
    >[] = [
      {
        type: MissionType.DAILY,
        title: 'Lector Diario',
        description: 'Lee al menos 5 versículos hoy',
        difficulty: MissionDifficulty.EASY,
        requirements: [
          {
            type: MissionRequirementType.READ_VERSES,
            target: 5,
            current: 0,
          },
        ],
        rewards: [
          {
            type: RewardType.POINTS,
            value: 100,
            displayName: '100 Puntos',
          },
        ],
      },
      {
        type: MissionType.DAILY,
        title: 'Reflexión Personal',
        description: 'Agrega 1 nota a un versículo',
        difficulty: MissionDifficulty.EASY,
        requirements: [
          {
            type: MissionRequirementType.ADD_NOTE,
            target: 1,
            current: 0,
          },
        ],
        rewards: [
          {
            type: RewardType.POINTS,
            value: 75,
            displayName: '75 Puntos',
          },
        ],
      },
      {
        type: MissionType.DAILY,
        title: 'Estudioso',
        description: 'Completa 1 capítulo completo',
        difficulty: MissionDifficulty.MEDIUM,
        requirements: [
          {
            type: MissionRequirementType.READ_CHAPTERS,
            target: 1,
            current: 0,
          },
        ],
        rewards: [
          {
            type: RewardType.POINTS,
            value: 150,
            displayName: '150 Puntos',
          },
        ],
      },
      {
        type: MissionType.DAILY,
        title: 'Compartir la Palabra',
        description: 'Comparte 1 versículo con alguien',
        difficulty: MissionDifficulty.EASY,
        requirements: [
          {
            type: MissionRequirementType.SHARE_VERSE,
            target: 1,
            current: 0,
          },
        ],
        rewards: [
          {
            type: RewardType.POINTS,
            value: 125,
            displayName: '125 Puntos',
          },
        ],
      },
    ];

    const missions: Mission[] = [];

    for (const missionData of dailyMissions) {
      const id = `daily_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const mission: Mission = {
        ...missionData,
        id,
        createdAt: now,
        expiresAt,
        isCompleted: false,
        claimedReward: false,
      };

      await this.saveMission(mission);
      missions.push(mission);
    }

    return missions;
  }

  /**
   * Generate weekly missions (called on Sunday midnight)
   */
  async generateWeeklyMissions(): Promise<Mission[]> {
    const now = Date.now();
    const nextSunday = new Date();
    nextSunday.setDate(nextSunday.getDate() + (7 - nextSunday.getDay()));
    nextSunday.setHours(23, 59, 59, 999);
    const expiresAt = nextSunday.getTime();

    const weeklyMissions: Omit<
      Mission,
      'id' | 'createdAt' | 'expiresAt' | 'isCompleted' | 'claimedReward'
    >[] = [
      {
        type: MissionType.WEEKLY,
        title: 'Lector Dedicado',
        description: 'Lee 50 versículos esta semana',
        difficulty: MissionDifficulty.MEDIUM,
        requirements: [
          {
            type: MissionRequirementType.READ_VERSES,
            target: 50,
            current: 0,
          },
        ],
        rewards: [
          {
            type: RewardType.POINTS,
            value: 500,
            displayName: '500 Puntos',
          },
          {
            type: RewardType.BADGE,
            value: 'weekly_reader',
            displayName: 'Badge: Lector Semanal',
          },
        ],
      },
      {
        type: MissionType.WEEKLY,
        title: 'Guerrero del Fin de Semana',
        description: 'Lee ambos días del fin de semana',
        difficulty: MissionDifficulty.EASY,
        requirements: [
          {
            type: MissionRequirementType.MAINTAIN_STREAK,
            target: 2,
            current: 0,
          },
        ],
        rewards: [
          {
            type: RewardType.POINTS,
            value: 300,
            displayName: '300 Puntos',
          },
        ],
      },
      {
        type: MissionType.WEEKLY,
        title: 'Maestro Organizador',
        description: 'Agrega 10 resaltados esta semana',
        difficulty: MissionDifficulty.MEDIUM,
        requirements: [
          {
            type: MissionRequirementType.ADD_HIGHLIGHT,
            target: 10,
            current: 0,
          },
        ],
        rewards: [
          {
            type: RewardType.POINTS,
            value: 400,
            displayName: '400 Puntos',
          },
        ],
      },
      {
        type: MissionType.WEEKLY,
        title: 'Evangelista',
        description: 'Comparte 5 versículos esta semana',
        difficulty: MissionDifficulty.HARD,
        requirements: [
          {
            type: MissionRequirementType.SHARE_VERSE,
            target: 5,
            current: 0,
          },
        ],
        rewards: [
          {
            type: RewardType.POINTS,
            value: 600,
            displayName: '600 Puntos',
          },
          {
            type: RewardType.BADGE,
            value: 'evangelist',
            displayName: 'Badge: Evangelista',
          },
        ],
      },
    ];

    const missions: Mission[] = [];

    for (const missionData of weeklyMissions) {
      const id = `weekly_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const mission: Mission = {
        ...missionData,
        id,
        createdAt: now,
        expiresAt,
        isCompleted: false,
        claimedReward: false,
      };

      await this.saveMission(mission);
      missions.push(mission);
    }

    return missions;
  }

  /**
   * Generate special missions
   */
  async generateSpecialMission(bookName: string): Promise<Mission> {
    const now = Date.now();
    const in3Days = new Date(now + 3 * 24 * 60 * 60 * 1000);
    const expiresAt = in3Days.getTime();

    const mission: Mission = {
      id: `special_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: MissionType.SPECIAL,
      title: `Explorando ${bookName}`,
      description: `Lee cualquier capítulo de ${bookName}`,
      difficulty: MissionDifficulty.EASY,
      requirements: [
        {
          type: MissionRequirementType.READ_SPECIFIC_BOOK,
          target: 1,
          current: 0,
          metadata: {bookName},
        },
      ],
      rewards: [
        {
          type: RewardType.POINTS,
          value: 200,
          displayName: '200 Puntos',
        },
      ],
      createdAt: now,
      expiresAt,
      isCompleted: false,
      claimedReward: false,
    };

    await this.saveMission(mission);
    return mission;
  }

  /**
   * Save mission to database
   */
  private async saveMission(mission: Mission): Promise<void> {
    const dbInstance = await this.db.getDatabase();

    await dbInstance.runAsync(
      `INSERT OR REPLACE INTO missions
       (id, type, title, description, difficulty, requirements, rewards, expires_at, created_at, is_completed, completed_at, claimed_reward)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        mission.id,
        mission.type,
        mission.title,
        mission.description,
        mission.difficulty,
        JSON.stringify(mission.requirements),
        JSON.stringify(mission.rewards),
        mission.expiresAt,
        mission.createdAt,
        mission.isCompleted ? 1 : 0,
        mission.completedAt || null,
        mission.claimedReward ? 1 : 0,
      ],
    );
  }

  /**
   * Get all active missions
   */
  async getActiveMissions(): Promise<Mission[]> {
    const now = Date.now();
    const dbInstance = await this.db.getDatabase();

    const rows = await dbInstance.getAllAsync<any>(
      'SELECT * FROM missions WHERE expires_at > ? AND is_completed = 0 ORDER BY created_at DESC',
      [now],
    );

    return rows.map(row => this.parseMissionFromRow(row));
  }

  /**
   * Get missions by type
   */
  async getMissionsByType(type: MissionType): Promise<Mission[]> {
    const now = Date.now();
    const dbInstance = await this.db.getDatabase();

    const rows = await dbInstance.getAllAsync<any>(
      'SELECT * FROM missions WHERE type = ? AND expires_at > ? ORDER BY created_at DESC',
      [type, now],
    );

    return rows.map(row => this.parseMissionFromRow(row));
  }

  /**
   * Update mission progress
   */
  async updateMissionProgress(
    missionId: string,
    requirementIndex: number,
    progress: number,
  ): Promise<Mission | null> {
    const dbInstance = await this.db.getDatabase();

    const row = await dbInstance.getFirstAsync<any>(
      'SELECT * FROM missions WHERE id = ?',
      [missionId],
    );

    if (!row) return null;

    const mission = this.parseMissionFromRow(row);
    if (mission.requirements[requirementIndex]) {
      mission.requirements[requirementIndex].current = Math.min(
        progress,
        mission.requirements[requirementIndex].target,
      );

      // Check if mission is completed
      const allRequirementsMet = mission.requirements.every(
        req => req.current >= req.target,
      );

      if (allRequirementsMet && !mission.isCompleted) {
        mission.isCompleted = true;
        mission.completedAt = Date.now();
      }

      await this.saveMission(mission);
    }

    return mission;
  }

  /**
   * Track action and update relevant missions
   */
  async trackAction(
    actionType: MissionRequirementType,
    value: number = 1,
    metadata?: any,
  ): Promise<Mission[]> {
    const activeMissions = await this.getActiveMissions();
    const updatedMissions: Mission[] = [];

    for (const mission of activeMissions) {
      let updated = false;

      for (let i = 0; i < mission.requirements.length; i++) {
        const req = mission.requirements[i];

        if (req.type === actionType) {
          // Check metadata if needed
          if (metadata && req.metadata) {
            if (
              req.metadata.bookName &&
              req.metadata.bookName !== metadata.bookName
            ) {
              continue;
            }
            if (
              req.metadata.startHour !== undefined &&
              req.metadata.endHour !== undefined
            ) {
              const currentHour = new Date().getHours();
              if (
                currentHour < req.metadata.startHour ||
                currentHour > req.metadata.endHour
              ) {
                continue;
              }
            }
          }

          const newProgress = req.current + value;
          const updatedMission = await this.updateMissionProgress(
            mission.id,
            i,
            newProgress,
          );

          if (updatedMission) {
            updatedMissions.push(updatedMission);
            updated = true;
          }
        }
      }
    }

    return updatedMissions;
  }

  /**
   * Claim mission rewards
   */
  async claimRewards(missionId: string): Promise<Reward[]> {
    const dbInstance = await this.db.getDatabase();

    const row = await dbInstance.getFirstAsync<any>(
      'SELECT * FROM missions WHERE id = ?',
      [missionId],
    );

    if (!row) return [];

    const mission = this.parseMissionFromRow(row);

    if (!mission.isCompleted || mission.claimedReward) {
      return [];
    }

    mission.claimedReward = true;
    await this.saveMission(mission);

    return mission.rewards;
  }

  /**
   * Clean up expired missions
   */
  async cleanupExpiredMissions(): Promise<void> {
    const now = Date.now();
    const dbInstance = await this.db.getDatabase();

    await dbInstance.runAsync('DELETE FROM missions WHERE expires_at < ?', [
      now,
    ]);
  }

  /**
   * Parse mission from database row
   */
  private parseMissionFromRow(row: any): Mission {
    return {
      id: row.id,
      type: row.type,
      title: row.title,
      description: row.description,
      difficulty: row.difficulty,
      requirements: JSON.parse(row.requirements),
      rewards: JSON.parse(row.rewards),
      expiresAt: row.expires_at,
      createdAt: row.created_at,
      isCompleted: Boolean(row.is_completed),
      completedAt: row.completed_at || undefined,
      claimedReward: Boolean(row.claimed_reward),
    };
  }

  /**
   * Get mission stats
   */
  async getMissionStats(): Promise<{
    totalCompleted: number;
    dailyCompleted: number;
    weeklyCompleted: number;
    totalRewardsClaimed: number;
  }> {
    const dbInstance = await this.db.getDatabase();

    const totalRow = await dbInstance.getFirstAsync<{count: number}>(
      'SELECT COUNT(*) as count FROM missions WHERE is_completed = 1',
    );

    const dailyRow = await dbInstance.getFirstAsync<{count: number}>(
      'SELECT COUNT(*) as count FROM missions WHERE type = ? AND is_completed = 1',
      [MissionType.DAILY],
    );

    const weeklyRow = await dbInstance.getFirstAsync<{count: number}>(
      'SELECT COUNT(*) as count FROM missions WHERE type = ? AND is_completed = 1',
      [MissionType.WEEKLY],
    );

    const rewardsRow = await dbInstance.getFirstAsync<{count: number}>(
      'SELECT COUNT(*) as count FROM missions WHERE claimed_reward = 1',
    );

    return {
      totalCompleted: totalRow?.count || 0,
      dailyCompleted: dailyRow?.count || 0,
      weeklyCompleted: weeklyRow?.count || 0,
      totalRewardsClaimed: rewardsRow?.count || 0,
    };
  }
}
