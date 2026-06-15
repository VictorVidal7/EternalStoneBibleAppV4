/**
 * 📱 WIDGET TASK HANDLER
 *
 * Feeds the in-app preview of the home-screen "Verse of the Day" widget with
 * the same calendar-deterministic verse the Home screen shows. The progress
 * and mission data providers were retired in Sprint 91 along with their
 * demo-only widget previews (no native counterpart existed for them).
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import bibleDB from '../lib/database';
import {getDailyVerseRef} from '../constants/daily-verses';

export interface VerseWidgetData {
  verse: string;
  reference: string;
  book: string;
  chapter: number;
  verseNumber: number;
  translation: string;
  theme: 'light' | 'dark';
}

class WidgetTaskHandler {
  private initialized = false;

  async initialize() {
    if (!this.initialized) {
      // Reuse the app's shared database instance.
      await bibleDB.initialize();
      this.initialized = true;
    }
  }

  /**
   * Today's verse for the widget preview — the same curated,
   * calendar-deterministic verse the Home screen shows (getDailyVerseRef),
   * so the widget and the app never disagree on "today's verse".
   */
  async getVerseOfTheDay(): Promise<VerseWidgetData> {
    try {
      await this.initialize();

      const ref = getDailyVerseRef();
      const verse = await bibleDB.getVerse(
        ref.book,
        ref.chapter,
        ref.verse,
        'RVR1960',
      );

      if (!verse) {
        return FALLBACK_VERSE;
      }

      return {
        verse: verse.text,
        reference: `${verse.book} ${verse.chapter}:${verse.verse}`,
        book: verse.book,
        chapter: verse.chapter,
        verseNumber: verse.verse,
        translation: 'RVR1960',
        theme: 'light',
      };
    } catch (error) {
      console.error('Error loading verse widget:', error);
      return FALLBACK_VERSE;
    }
  }
}

/** Shown if the curated daily ref can't be resolved (e.g. DB not ready). */
const FALLBACK_VERSE: VerseWidgetData = {
  verse:
    'Porque de tal manera amó Dios al mundo, que ha dado a su Hijo unigénito...',
  reference: 'Juan 3:16',
  book: 'Juan',
  chapter: 3,
  verseNumber: 16,
  translation: 'RVR1960',
  theme: 'light',
};

// Singleton instance
export const widgetTaskHandler = new WidgetTaskHandler();
