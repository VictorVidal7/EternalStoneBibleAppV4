/**
 * Servicio de Gestión de Resaltados
 * Maneja todas las operaciones CRUD para highlights en la base de datos
 */

import { BibleDatabase } from '../database';
import { Highlight, HighlightColor, HighlightCategory } from './index';

export class HighlightService {
  private db: BibleDatabase;

  constructor(database: BibleDatabase) {
    this.db = database;
  }

  /**
   * Inicializa las tablas de highlights en la base de datos
   */
  async initialize(): Promise<void> {
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS highlights (
        id TEXT PRIMARY KEY,
        verse_id TEXT NOT NULL,
        book_id TEXT NOT NULL,
        chapter INTEGER NOT NULL,
        verse INTEGER NOT NULL,
        color TEXT NOT NULL,
        category TEXT,
        note TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        UNIQUE(verse_id)
      );

      CREATE INDEX IF NOT EXISTS idx_highlights_verse ON highlights(verse_id);
      CREATE INDEX IF NOT EXISTS idx_highlights_book ON highlights(book_id);
      CREATE INDEX IF NOT EXISTS idx_highlights_category ON highlights(category);
      CREATE INDEX IF NOT EXISTS idx_highlights_color ON highlights(color);
    `;

    await this.db.executeSql(createTableSQL);
  }

  /**
   * Crea o actualiza un resaltado
   */
  async addHighlight(
    verseId: string,
    bookId: string,
    chapter: number,
    verse: number,
    color: HighlightColor,
    category?: HighlightCategory,
    note?: string
  ): Promise<Highlight> {
    const now = Date.now();
    const id = `highlight_${verseId}_${now}`;

    const highlight: Highlight = {
      id,
      verseId,
      bookId,
      chapter,
      verse,
      color,
      category,
      note,
      createdAt: now,
      updatedAt: now,
    };

    const sql = `
      INSERT OR REPLACE INTO highlights
      (id, verse_id, book_id, chapter, verse, color, category, note, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await this.db.executeSql(sql, [
      id,
      verseId,
      bookId,
      chapter,
      verse,
      color,
      category || null,
      note || null,
      now,
      now,
    ]);

    return highlight;
  }

  /**
   * Actualiza un resaltado existente
   */
  async updateHighlight(
    verseId: string,
    updates: Partial<Pick<Highlight, 'color' | 'category' | 'note'>>
  ): Promise<void> {
    const existing = await this.getHighlightByVerse(verseId);
    if (!existing) {
      throw new Error(`Highlight not found for verse: ${verseId}`);
    }

    const now = Date.now();
    const fields: string[] = [];
    const values: any[] = [];

    if (updates.color !== undefined) {
      fields.push('color = ?');
      values.push(updates.color);
    }
    if (updates.category !== undefined) {
      fields.push('category = ?');
      values.push(updates.category || null);
    }
    if (updates.note !== undefined) {
      fields.push('note = ?');
      values.push(updates.note || null);
    }

    fields.push('updated_at = ?');
    values.push(now);

    const sql = `UPDATE highlights SET ${fields.join(', ')} WHERE verse_id = ?`;
    values.push(verseId);

    await this.db.executeSql(sql, values);
  }

  /**
   * Elimina un resaltado
   */
  async removeHighlight(verseId: string): Promise<void> {
    const sql = 'DELETE FROM highlights WHERE verse_id = ?';
    await this.db.executeSql(sql, [verseId]);
  }

  /**
   * Obtiene un resaltado por ID de versículo
   */
  async getHighlightByVerse(verseId: string): Promise<Highlight | null> {
    const sql = 'SELECT * FROM highlights WHERE verse_id = ? LIMIT 1';
    const result = await this.db.executeSql(sql, [verseId]);

    if (result.rows.length === 0) {
      return null;
    }

    return this.rowToHighlight(result.rows._array[0]);
  }

  /**
   * Obtiene todos los resaltados de un libro
   */
  async getHighlightsByBook(bookId: string): Promise<Highlight[]> {
    const sql = 'SELECT * FROM highlights WHERE book_id = ? ORDER BY chapter, verse';
    const result = await this.db.executeSql(sql, [bookId]);

    return result.rows._array.map(this.rowToHighlight);
  }

  /**
   * Obtiene todos los resaltados de un capítulo
   */
  async getHighlightsByChapter(bookId: string, chapter: number): Promise<Highlight[]> {
    const sql = 'SELECT * FROM highlights WHERE book_id = ? AND chapter = ? ORDER BY verse';
    const result = await this.db.executeSql(sql, [bookId, chapter]);

    return result.rows._array.map(this.rowToHighlight);
  }

  /**
   * Obtiene todos los resaltados por categoría
   */
  async getHighlightsByCategory(category: HighlightCategory): Promise<Highlight[]> {
    const sql = 'SELECT * FROM highlights WHERE category = ? ORDER BY created_at DESC';
    const result = await this.db.executeSql(sql, [category]);

    return result.rows._array.map(this.rowToHighlight);
  }

  /**
   * Obtiene todos los resaltados por color
   */
  async getHighlightsByColor(color: HighlightColor): Promise<Highlight[]> {
    const sql = 'SELECT * FROM highlights WHERE color = ? ORDER BY created_at DESC';
    const result = await this.db.executeSql(sql, [color]);

    return result.rows._array.map(this.rowToHighlight);
  }

  /**
   * Obtiene todos los resaltados
   */
  async getAllHighlights(): Promise<Highlight[]> {
    const sql = 'SELECT * FROM highlights ORDER BY created_at DESC';
    const result = await this.db.executeSql(sql);

    return result.rows._array.map(this.rowToHighlight);
  }

  /**
   * Obtiene estadísticas de resaltados
   */
  async getHighlightStats(): Promise<{
    total: number;
    byColor: Record<HighlightColor, number>;
    byCategory: Record<HighlightCategory, number>;
  }> {
    const allHighlights = await this.getAllHighlights();

    const byColor: Record<string, number> = {};
    const byCategory: Record<string, number> = {};

    allHighlights.forEach((highlight) => {
      byColor[highlight.color] = (byColor[highlight.color] || 0) + 1;
      if (highlight.category) {
        byCategory[highlight.category] = (byCategory[highlight.category] || 0) + 1;
      }
    });

    return {
      total: allHighlights.length,
      byColor: byColor as Record<HighlightColor, number>,
      byCategory: byCategory as Record<HighlightCategory, number>,
    };
  }

  /**
   * Exporta todos los resaltados a JSON
   */
  async exportHighlights(): Promise<string> {
    const highlights = await this.getAllHighlights();
    return JSON.stringify(highlights, null, 2);
  }

  /**
   * Importa resaltados desde JSON
   */
  async importHighlights(jsonData: string): Promise<number> {
    const highlights: Highlight[] = JSON.parse(jsonData);
    let imported = 0;

    for (const highlight of highlights) {
      try {
        await this.addHighlight(
          highlight.verseId,
          highlight.bookId,
          highlight.chapter,
          highlight.verse,
          highlight.color,
          highlight.category,
          highlight.note
        );
        imported++;
      } catch (error) {
        console.error(`Error importing highlight ${highlight.id}:`, error);
      }
    }

    return imported;
  }

  /**
   * Convierte una fila de la BD a un objeto Highlight
   */
  private rowToHighlight(row: any): Highlight {
    return {
      id: row.id,
      verseId: row.verse_id,
      bookId: row.book_id,
      chapter: row.chapter,
      verse: row.verse,
      color: row.color as HighlightColor,
      category: row.category as HighlightCategory | undefined,
      note: row.note || undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
