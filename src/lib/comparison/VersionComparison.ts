/**
 * 📚 VERSION COMPARISON SERVICE
 *
 * Servicio para comparar múltiples versiones de la Biblia en paralelo
 * Permite análisis profundo con hasta 4 versiones simultáneas
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import * as SQLite from 'expo-sqlite';
import bibleDB from '../database';
import type {TranslationKeys} from '../../i18n/translations';
import {normalizeWord, commonWordsForVersions} from './wordContrast';
import {buildVersionList, type VersionMetaRow} from './versionList';

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
      // Usar la misma instancia de base de datos que el resto de la app
      await bibleDB.initialize();
      this.db = await bibleDB.getDatabase();
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
        id: 'rv1909',
        name: 'Reina Valera 1909',
        abbreviation: 'RV1909',
        language: 'es',
        description: 'Clásica revisión de dominio público',
        year: 1909,
        isPremium: false,
      },
      {
        id: 'sse1569',
        name: 'Sagradas Escrituras 1569',
        abbreviation: 'SSE1569',
        language: 'es',
        description: 'Casiodoro de Reina — Biblia del Oso',
        year: 1569,
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
        // Sprint 66: WEB is bundled + seeded like RVR1960/KJV, so it compares
        // for free with proper metadata (compareVerse matches case-insensitively
        // against the uppercase 'WEB' rows in the verses table).
        id: 'web',
        name: 'World English Bible',
        abbreviation: 'WEB',
        language: 'en',
        description: 'Modern, readable public-domain English',
        year: 2000,
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
   * Prioriza las que tienen contenido en la tabla 'verses'
   */
  async getAvailableVersions(language?: string): Promise<BibleVersion[]> {
    await this.initialize();

    // 1. Obtener versiones distintas presentes en la tabla 'verses'
    const versesResult = await this.db!.getAllAsync<{version: string}>(
      'SELECT DISTINCT version FROM verses',
    );
    const existingVersionIds = versesResult.map(r => r.version);

    // 2. Obtener metadatos de TODAS las versiones (sin filtrar por idioma).
    //    Sprint 71: filtrar por idioma aquí descartaba las filas de las
    //    versiones en inglés (KJV/WEB), que SÍ están en `verses`; al no
    //    resolver su metadata caían a la entrada genérica y se estampaban con
    //    el idioma de la UI, haciendo que un par cross-idioma (RVR1960+KJV)
    //    pareciera "mismo idioma" y encendiera el contraste de palabras.
    const metaRows = await this.db!.getAllAsync<VersionMetaRow>(
      'SELECT * FROM bible_versions',
    );

    // 3. Construir la lista final (pura) priorizando lo que el usuario
    //    "realmente tiene"; el idioma de la UI solo se usa como fallback para
    //    versiones sin metadata.
    return buildVersionList(existingVersionIds, metaRows, language || 'es');
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

    // 1. Intentar encontrar el book_id para este nombre de libro
    const bookInfo = await this.db!.getFirstAsync<{book_id: number}>(
      'SELECT book_id FROM verses WHERE book_name = ? LIMIT 1',
      [book],
    );

    // Si no encontramos por nombre exacto, intentamos una búsqueda por LIKE (por si hay variaciones de tildes)
    let bookId = bookInfo?.book_id;
    if (!bookId) {
      const bookInfoAlternative = await this.db!.getFirstAsync<{
        book_id: number;
      }>('SELECT book_id FROM verses WHERE book_name LIKE ? LIMIT 1', [
        `%${book}%`,
      ]);
      bookId = bookInfoAlternative?.book_id;
    }

    for (const versionId of versionIds) {
      // 2. Buscar el texto usando book_id si lo tenemos, si no, caemos a book_name
      let query = '';
      let params: any[] = [];

      if (bookId) {
        query = `
          SELECT text, version
          FROM verses 
          WHERE book_id = ? AND chapter = ? AND verse = ? AND (LOWER(version) = LOWER(?) OR version = ?)
        `;
        params = [bookId, chapter, verse, versionId, versionId.toUpperCase()];
      } else {
        query = `
          SELECT text, version
          FROM verses 
          WHERE book_name = ? AND chapter = ? AND verse = ? AND (LOWER(version) = LOWER(?) OR version = ?)
        `;
        params = [book, chapter, verse, versionId, versionId.toUpperCase()];
      }

      const result = await this.db!.getFirstAsync<{
        text: string;
        version: string;
      }>(query, params);

      if (result) {
        versions.push({
          versionId: versionId.toLowerCase(),
          versionName: result.version,
          versionAbbr: result.version,
          text: result.text,
          wordCount: result.text.split(/\s+/).length,
        });
      } else {
        // En el futuro buscaremos en verses_by_version si implementamos descarga de versiones
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
  analyzeComparison(
    comparison: VerseComparison,
    t: TranslationKeys,
  ): ComparisonAnalysis {
    const {versions} = comparison;

    if (versions.length < 2) {
      throw new Error(t.versionComparison.minVersionsError);
    }

    // Base version (primera en la lista)
    const baseVersion = versions[0];
    const baseWords = new Set(baseVersion.text.split(/\s+/).map(normalizeWord));

    const differences = new Map<string, ComparisonDifference[]>();
    const allWords = new Set<string>();
    // Palabras compartidas por TODAS las versiones (base ∩ cada otra). La misma
    // política pura que usa el modo multi-verso del screen, para que el
    // resaltado inline coincida en single y multi (ver wordContrast).
    const commonWords = commonWordsForVersions(versions.map(v => v.text));

    // Analizar cada versión
    versions.forEach((version, index) => {
      if (index === 0) return; // Skip base version

      const versionWords = new Set(
        version.text.split(/\s+/).map(normalizeWord),
      );

      // Agregar todas las palabras
      versionWords.forEach(word => allWords.add(word));

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
      insights.push(t.versionComparison.insightVerySimilar);
    } else if (similarity >= 70) {
      insights.push(t.versionComparison.insightMinorDiff);
    } else {
      insights.push(t.versionComparison.insightSignificantDiff);
    }

    const wordCountDiff =
      Math.max(...versions.map(v => v.wordCount)) -
      Math.min(...versions.map(v => v.wordCount));
    if (wordCountDiff > 5) {
      insights.push(
        t.versionComparison.insightWordDiff.replace(
          '{{count}}',
          String(wordCountDiff),
        ),
      );
    }

    if (uniqueWords.size > 10) {
      insights.push(
        t.versionComparison.insightUniqueWords.replace(
          '{{count}}',
          String(uniqueWords.size),
        ),
      );
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

  /**
   * Actualiza una comparación guardada
   */
  async updateComparison(comparisonId: string, name: string, notes: string) {
    await this.initialize();

    await this.db!.runAsync(
      `UPDATE saved_comparisons SET name = ?, notes = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [name, notes, comparisonId],
    );
  }
}

// Singleton instance
export const versionComparisonService = new VersionComparisonService();
