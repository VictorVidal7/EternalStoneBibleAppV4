/**
 * Hook personalizado para gestionar resaltados
 */

import { useState, useEffect, useCallback } from 'react';
import { HighlightService } from '../lib/highlights/HighlightService';
import { Highlight, HighlightColor, HighlightCategory } from '../lib/highlights';
import { BibleDatabase } from '../lib/database';

export function useHighlights(database: BibleDatabase | null) {
  const [service, setService] = useState<HighlightService | null>(null);
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [loading, setLoading] = useState(true);

  // Inicializar servicio
  useEffect(() => {
    if (!database) return;

    const highlightService = new HighlightService(database);
    highlightService.initialize().then(() => {
      setService(highlightService);
      setLoading(false);
    });
  }, [database]);

  /**
   * Añade un resaltado
   */
  const addHighlight = useCallback(
    async (
      verseId: string,
      bookId: string,
      chapter: number,
      verse: number,
      color: HighlightColor,
      category?: HighlightCategory,
      note?: string
    ): Promise<Highlight | null> => {
      if (!service) return null;

      try {
        const highlight = await service.addHighlight(
          verseId,
          bookId,
          chapter,
          verse,
          color,
          category,
          note
        );

        // Actualizar lista local
        setHighlights((prev) => {
          const filtered = prev.filter((h) => h.verseId !== verseId);
          return [...filtered, highlight];
        });

        return highlight;
      } catch (error) {
        console.error('Error adding highlight:', error);
        return null;
      }
    },
    [service]
  );

  /**
   * Actualiza un resaltado
   */
  const updateHighlight = useCallback(
    async (
      verseId: string,
      updates: Partial<Pick<Highlight, 'color' | 'category' | 'note'>>
    ): Promise<boolean> => {
      if (!service) return false;

      try {
        await service.updateHighlight(verseId, updates);

        // Actualizar lista local
        setHighlights((prev) =>
          prev.map((h) =>
            h.verseId === verseId
              ? { ...h, ...updates, updatedAt: Date.now() }
              : h
          )
        );

        return true;
      } catch (error) {
        console.error('Error updating highlight:', error);
        return false;
      }
    },
    [service]
  );

  /**
   * Elimina un resaltado
   */
  const removeHighlight = useCallback(
    async (verseId: string): Promise<boolean> => {
      if (!service) return false;

      try {
        await service.removeHighlight(verseId);

        // Actualizar lista local
        setHighlights((prev) => prev.filter((h) => h.verseId !== verseId));

        return true;
      } catch (error) {
        console.error('Error removing highlight:', error);
        return false;
      }
    },
    [service]
  );

  /**
   * Obtiene un resaltado por versículo
   */
  const getHighlightByVerse = useCallback(
    async (verseId: string): Promise<Highlight | null> => {
      if (!service) return null;

      try {
        return await service.getHighlightByVerse(verseId);
      } catch (error) {
        console.error('Error getting highlight:', error);
        return null;
      }
    },
    [service]
  );

  /**
   * Carga resaltados por libro
   */
  const loadHighlightsByBook = useCallback(
    async (bookId: string) => {
      if (!service) return;

      try {
        const bookHighlights = await service.getHighlightsByBook(bookId);
        setHighlights(bookHighlights);
      } catch (error) {
        console.error('Error loading highlights by book:', error);
      }
    },
    [service]
  );

  /**
   * Carga resaltados por capítulo
   */
  const loadHighlightsByChapter = useCallback(
    async (bookId: string, chapter: number) => {
      if (!service) return;

      try {
        const chapterHighlights = await service.getHighlightsByChapter(bookId, chapter);
        setHighlights(chapterHighlights);
      } catch (error) {
        console.error('Error loading highlights by chapter:', error);
      }
    },
    [service]
  );

  /**
   * Carga resaltados por categoría
   */
  const loadHighlightsByCategory = useCallback(
    async (category: HighlightCategory) => {
      if (!service) return;

      try {
        const categoryHighlights = await service.getHighlightsByCategory(category);
        setHighlights(categoryHighlights);
      } catch (error) {
        console.error('Error loading highlights by category:', error);
      }
    },
    [service]
  );

  /**
   * Carga todos los resaltados
   */
  const loadAllHighlights = useCallback(async () => {
    if (!service) return;

    try {
      const allHighlights = await service.getAllHighlights();
      setHighlights(allHighlights);
    } catch (error) {
      console.error('Error loading all highlights:', error);
    }
  }, [service]);

  /**
   * Obtiene estadísticas de resaltados
   */
  const getStats = useCallback(async () => {
    if (!service) return null;

    try {
      return await service.getHighlightStats();
    } catch (error) {
      console.error('Error getting highlight stats:', error);
      return null;
    }
  }, [service]);

  /**
   * Exporta resaltados
   */
  const exportHighlights = useCallback(async (): Promise<string | null> => {
    if (!service) return null;

    try {
      return await service.exportHighlights();
    } catch (error) {
      console.error('Error exporting highlights:', error);
      return null;
    }
  }, [service]);

  /**
   * Importa resaltados
   */
  const importHighlights = useCallback(
    async (jsonData: string): Promise<number> => {
      if (!service) return 0;

      try {
        const count = await service.importHighlights(jsonData);
        await loadAllHighlights();
        return count;
      } catch (error) {
        console.error('Error importing highlights:', error);
        return 0;
      }
    },
    [service, loadAllHighlights]
  );

  return {
    highlights,
    loading,
    addHighlight,
    updateHighlight,
    removeHighlight,
    getHighlightByVerse,
    loadHighlightsByBook,
    loadHighlightsByChapter,
    loadHighlightsByCategory,
    loadAllHighlights,
    getStats,
    exportHighlights,
    importHighlights,
  };
}
