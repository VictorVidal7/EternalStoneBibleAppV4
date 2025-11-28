/**
 * 📚 VERSION COMPARISON SERVICE
 *
 * Servicio para comparar múltiples versiones de la Biblia en paralelo
 * Permite análisis profundo con hasta 4 versiones simultáneas
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import * as SQLite from 'expo-sqlite';

export interface BibleVersion {
  id: string;
  name: string;
  abbreviation: string;
  language: string;
  description: string;
  year: number;
  isPremium: boolean;
}

export interface VerseComparison {
  book: string;
  chapter: number;
  verseNumber: number;
  versions: VersionText[];
}

export interface VersionText {
  versionId: string;
  versionName: string;
  versionAbbr: string;
  text: string;
  wordCount: number;
}

export interface ComparisonDifference {
  type: 'added' | 'removed' | 'modified' | 'same';
  text: string;
  position: number;
}

export interface ComparisonAnalysis {
  verse: VerseComparison;
  differences: Map<string, ComparisonDifference[]>; // key: versionId
  similarity: number; // 0-100%
  uniqueWords: Set<string>;
  commonWords: Set<string>;
  insights: string[];
}

class VersionComparisonService {
  private db: SQLite.SQLiteDatabase | null = null;

  async initialize() {
    if (!this.db) {
      this.db = await SQLite.openDatabaseAsync('EternalStone.db');
      await this.createVersionsTables();
    }
  }

  /**
   * Crea tablas necesarias para versiones múltiples
   */
  private async createVersionsTables() {
    await this.db!.execAsync(`
      -- Tabla de versiones disponibles
      CREATE TABLE IF NOT EXISTS bible_versions (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        abbreviation TEXT NOT NULL,
        language TEXT NOT NULL,
        description TEXT,
        year INTEGER,
        is_premium INTEGER DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );

      -- Tabla de versos por versión
      CREATE TABLE IF NOT EXISTS verses_by_version (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        version_id TEXT NOT NULL,
        book TEXT NOT NULL,
        chapter INTEGER NOT NULL,
        verse INTEGER NOT NULL,
        text TEXT NOT NULL,
        FOREIGN KEY (version_id) REFERENCES bible_versions(id),
        UNIQUE(version_id, book, chapter, verse)
      );

      CREATE INDEX IF NOT EXISTS idx_verses_version
      ON verses_by_version(version_id, book, chapter, verse);

      -- Tabla de comparaciones guardadas
      CREATE TABLE IF NOT EXISTS saved_comparisons (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        name TEXT NOT NULL,
        book TEXT NOT NULL,
        chapter INTEGER NOT NULL,
        verses_range TEXT NOT NULL,
        version_ids TEXT NOT NULL,
        notes TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_saved_comparisons_user
      ON saved_comparisons(user_id, created_at DESC);
    `);

    // Insertar versiones por defecto
    await this.insertDefaultVersions();
  }

  /**
   * Inserta versiones de la Biblia por defecto
   */
  private async insertDefaultVersions() {
    const defaultVersions: BibleVersion[] = [
      {
        id: 'rvr1960',
        name: 'Reina-Valera 1960',
        abbreviation: 'RVR1960',
        language: 'es',
        description: 'Versión tradicional más utilizada en español',
        year: 1960,
        isPremium: false,
      },
      {
        id: 'nvi',
        name: 'Nueva Versión Internacional',
        abbreviation: 'NVI',
        language: 'es',
        description: 'Traducción moderna y fácil de entender',
        year: 1999,
        isPremium: true,
      },
      {
        id: 'lbla',
        name: 'La Biblia de las Américas',
        abbreviation: 'LBLA',
        language: 'es',
        description: 'Traducción literal muy precisa',
        year: 1986,
        isPremium: true,
      },
      {
        id: 'dhh',
        name: 'Dios Habla Hoy',
        abbreviation: 'DHH',
        language: 'es',
        description: 'Lenguaje contemporáneo y accesible',
        year: 1979,
        isPremium: true,
      },
      {
        id: 'kjv',
        name: 'King James Version',
        abbreviation: 'KJV',
        language: 'en',
        description: 'Classic English translation',
        year: 1611,
        isPremium: false,
      },
      {
        id: 'nlt',
        name: 'New Living Translation',
        abbreviation: 'NLT',
        language: 'en',
        description: 'Modern, easy-to-read English',
        year: 1996,
        isPremium: true,
      },
    ];

    for (const version of defaultVersions) {
      await this.db!.runAsync(
        `
        INSERT OR IGNORE INTO bible_versions
        (id, name, abbreviation, language, description, year, is_premium)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
        [
          version.id,
          version.name,
          version.abbreviation,
          version.language,
          version.description,
          version.year,
          version.isPremium ? 1 : 0,
        ],
      );
    }
  }

  /**
   * Obtiene todas las versiones disponibles
   */
  async getAvailableVersions(language?: string): Promise<BibleVersion[]> {
    await this.initialize();

    const query = language
      ? `SELECT * FROM bible_versions WHERE language = ? ORDER BY is_premium ASC, year DESC`
      : `SELECT * FROM bible_versions ORDER BY language, is_premium ASC, year DESC`;

    const params = language ? [language] : [];

    const rows = await this.db!.getAllAsync<{
      id: string;
      name: string;
      abbreviation: string;
      language: string;
      description: string;
      year: number;
      is_premium: number;
    }>(query, params);

    return rows.map(row => ({
      id: row.id,
      name: row.name,
      abbreviation: row.abbreviation,
      language: row.language,
      description: row.description || '',
      year: row.year,
      isPremium: row.is_premium === 1,
    }));
  }

  /**
   * Compara un verso específico en múltiples versiones
   */
  async compareVerse(
    book: string,
    chapter: number,
    verse: number,
    versionIds: string[],
  ): Promise<VerseComparison> {
    await this.initialize();

    const versions: VersionText[] = [];

    for (const versionId of versionIds) {
      // Primero buscar en verses_by_version
      let result = await this.db!.getFirstAsync<{
        text: string;
        name: string;
        abbreviation: string;
      }>(
        `
        SELECT v.text, bv.name, bv.abbreviation
        FROM verses_by_version v
        JOIN bible_versions bv ON v.version_id = bv.id
        WHERE v.version_id = ? AND v.book = ? AND v.chapter = ? AND v.verse = ?
      `,
        [versionId, book, chapter, verse],
      );

      // Si no existe, usar la tabla principal (RVR1960 por defecto)
      if (!result && versionId === 'rvr1960') {
        result = await this.db!.getFirstAsync<{
          text: string;
          name: string;
          abbreviation: string;
        }>(
          `
          SELECT v.text, 'Reina-Valera 1960' as name, 'RVR1960' as abbreviation
          FROM verses v
          WHERE v.book = ? AND v.chapter = ? AND v.verse = ?
        `,
          [book, chapter, verse],
        );
      }

      if (result) {
        versions.push({
          versionId,
          versionName: result.name,
          versionAbbr: result.abbreviation,
          text: result.text,
          wordCount: result.text.split(/\s+/).length,
        });
      }
    }

    return {
      book,
      chapter,
      verseNumber: verse,
      versions,
    };
  }

  /**
   * Compara un rango de versos en múltiples versiones
   */
  async compareVerseRange(
    book: string,
    chapter: number,
    startVerse: number,
    endVerse: number,
    versionIds: string[],
  ): Promise<VerseComparison[]> {
    const comparisons: VerseComparison[] = [];

    for (let verse = startVerse; verse <= endVerse; verse++) {
      const comparison = await this.compareVerse(
        book,
        chapter,
        verse,
        versionIds,
      );
      comparisons.push(comparison);
    }

    return comparisons;
  }

  /**
   * Analiza diferencias entre versiones de un verso
   */
  analyzeComparison(comparison: VerseComparison): ComparisonAnalysis {
    const {versions} = comparison;

    if (versions.length < 2) {
      throw new Error('Se necesitan al menos 2 versiones para comparar');
    }

    // Base version (primera en la lista)
    const baseVersion = versions[0];
    const baseWords = new Set(
      baseVersion.text
        .toLowerCase()
        .split(/\s+/)
        .map(w => w.replace(/[.,;:!?¿¡()"""]/g, '')),
    );

    const differences = new Map<string, ComparisonDifference[]>();
    const allWords = new Set<string>();
    const commonWords = new Set<string>(baseWords);

    // Analizar cada versión
    versions.forEach((version, index) => {
      if (index === 0) return; // Skip base version

      const versionWords = new Set(
        version.text
          .toLowerCase()
          .split(/\s+/)
          .map(w => w.replace(/[.,;:!?¿¡()"""]/g, '')),
      );

      // Agregar todas las palabras
      versionWords.forEach(word => allWords.add(word));

      // Encontrar palabras comunes
      const wordsInCommon = new Set(
        [...versionWords].filter(w => baseWords.has(w)),
      );
      commonWords.forEach(word => {
        if (!wordsInCommon.has(word)) {
          commonWords.delete(word);
        }
      });

      // Detectar diferencias usando algoritmo simple
      const diffs: ComparisonDifference[] = [];
      const baseText = baseVersion.text.toLowerCase();
      const versionText = version.text.toLowerCase();

      if (baseText !== versionText) {
        // Palabras únicas en esta versión
        const uniqueInVersion = [...versionWords].filter(
          w => !baseWords.has(w),
        );
        const uniqueInBase = [...baseWords].filter(w => !versionWords.has(w));

        uniqueInVersion.forEach(word => {
          diffs.push({
            type: 'added',
            text: word,
            position: versionText.indexOf(word),
          });
        });

        uniqueInBase.forEach(word => {
          diffs.push({
            type: 'removed',
            text: word,
            position: baseText.indexOf(word),
          });
        });
      }

      differences.set(version.versionId, diffs);
    });

    // Calcular similaridad (Jaccard similarity)
    const uniqueWords = new Set([...allWords].filter(w => !commonWords.has(w)));
    const similarity = Math.round(
      (commonWords.size / (commonWords.size + uniqueWords.size)) * 100,
    );

    // Generar insights
    const insights: string[] = [];

    if (similarity >= 90) {
      insights.push('Las versiones son muy similares en este verso');
    } else if (similarity >= 70) {
      insights.push('Las versiones tienen diferencias menores');
    } else {
      insights.push('Las versiones tienen diferencias significativas');
    }

    const wordCountDiff =
      Math.max(...versions.map(v => v.wordCount)) -
      Math.min(...versions.map(v => v.wordCount));
    if (wordCountDiff > 5) {
      insights.push(
        `Diferencia de ${wordCountDiff} palabras entre la versión más corta y más larga`,
      );
    }

    if (uniqueWords.size > 10) {
      insights.push(`${uniqueWords.size} palabras únicas encontradas`);
    }

    return {
      verse: comparison,
      differences,
      similarity,
      uniqueWords,
      commonWords,
      insights,
    };
  }

  /**
   * Guarda una comparación para referencia futura
   */
  async saveComparison(
    userId: string,
    name: string,
    book: string,
    chapter: number,
    versesRange: string,
    versionIds: string[],
    notes?: string,
  ): Promise<string> {
    await this.initialize();

    const id = `comparison_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    await this.db!.runAsync(
      `
      INSERT INTO saved_comparisons
      (id, user_id, name, book, chapter, verses_range, version_ids, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `,
      [
        id,
        userId,
        name,
        book,
        chapter,
        versesRange,
        JSON.stringify(versionIds),
        notes || '',
      ],
    );

    return id;
  }

  /**
   * Obtiene comparaciones guardadas del usuario
   */
  async getSavedComparisons(userId: string) {
    await this.initialize();

    const rows = await this.db!.getAllAsync<{
      id: string;
      name: string;
      book: string;
      chapter: number;
      verses_range: string;
      version_ids: string;
      notes: string;
      created_at: string;
    }>(
      `
      SELECT * FROM saved_comparisons
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT 50
    `,
      [userId],
    );

    return rows.map(row => ({
      id: row.id,
      name: row.name,
      book: row.book,
      chapter: row.chapter,
      versesRange: row.verses_range,
      versionIds: JSON.parse(row.version_ids) as string[],
      notes: row.notes,
      createdAt: row.created_at,
    }));
  }

  /**
   * Elimina una comparación guardada
   */
  async deleteComparison(comparisonId: string) {
    await this.initialize();

    await this.db!.runAsync(`DELETE FROM saved_comparisons WHERE id = ?`, [
      comparisonId,
    ]);
  }
}

// Singleton instance
export const versionComparisonService = new VersionComparisonService();
