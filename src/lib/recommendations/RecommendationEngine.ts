/**
 * 🤖 RECOMMENDATION ENGINE
 *
 * Motor de recomendaciones personalizadas basado en:
 * - Historial de lectura del usuario
 * - Libros y géneros favoritos
 * - Patrones de lectura (horario, duración, frecuencia)
 * - Nivel y progreso del usuario
 * - Comportamiento similar a otros usuarios
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import {BibleDatabase} from '../database';
import {BibleVerse} from '../../types/bible';
import {BIBLE_BOOKS} from '../../constants/bible';

export enum RecommendationType {
  NEXT_READ = 'next_read',
  DISCOVER = 'discover',
  DAILY_CHALLENGE = 'daily_challenge',
  COMPLETE_SERIES = 'complete_series',
  THEME_BASED = 'theme_based',
  SEASONAL = 'seasonal',
}

export interface Recommendation {
  id: string;
  type: RecommendationType;
  title: string;
  description: string;
  bookName: string;
  chapter?: number;
  verses?: string; // e.g., "1-10"
  reason: string;
  confidence: number; // 0-100
  priority: number; // 1-10
  preview?: string; // First verse preview
  difficulty: 'easy' | 'medium' | 'hard';
  estimatedTime: number; // minutes
  tags: string[];
}

export interface UserPreferences {
  favoriteTestament: 'old' | 'new' | 'balanced';
  favoriteGenres: BookGenre[];
  averageSessionLength: number; // minutes
  preferredReadingTime: 'morning' | 'afternoon' | 'evening' | 'night' | 'any';
  readingSpeed: 'slow' | 'medium' | 'fast';
  completionRate: number; // percentage
}

export enum BookGenre {
  LAW = 'law', // Pentateuco
  HISTORY = 'history', // Históricos
  POETRY = 'poetry', // Poéticos
  PROPHECY = 'prophecy', // Proféticos
  GOSPEL = 'gospel', // Evangelios
  EPISTLE = 'epistle', // Epístolas
  APOCALYPTIC = 'apocalyptic', // Apocalíptico
}

// Mapeo de libros a géneros
const BOOK_GENRES: Record<string, BookGenre> = {
  Génesis: BookGenre.LAW,
  Éxodo: BookGenre.LAW,
  Levítico: BookGenre.LAW,
  Números: BookGenre.LAW,
  Deuteronomio: BookGenre.LAW,
  Josué: BookGenre.HISTORY,
  Jueces: BookGenre.HISTORY,
  Rut: BookGenre.HISTORY,
  '1 Samuel': BookGenre.HISTORY,
  '2 Samuel': BookGenre.HISTORY,
  '1 Reyes': BookGenre.HISTORY,
  '2 Reyes': BookGenre.HISTORY,
  '1 Crónicas': BookGenre.HISTORY,
  '2 Crónicas': BookGenre.HISTORY,
  Esdras: BookGenre.HISTORY,
  Nehemías: BookGenre.HISTORY,
  Ester: BookGenre.HISTORY,
  Job: BookGenre.POETRY,
  Salmos: BookGenre.POETRY,
  Proverbios: BookGenre.POETRY,
  Eclesiastés: BookGenre.POETRY,
  Cantares: BookGenre.POETRY,
  Isaías: BookGenre.PROPHECY,
  Jeremías: BookGenre.PROPHECY,
  Lamentaciones: BookGenre.PROPHECY,
  Ezequiel: BookGenre.PROPHECY,
  Daniel: BookGenre.PROPHECY,
  Oseas: BookGenre.PROPHECY,
  Joel: BookGenre.PROPHECY,
  Amós: BookGenre.PROPHECY,
  Abdías: BookGenre.PROPHECY,
  Jonás: BookGenre.PROPHECY,
  Miqueas: BookGenre.PROPHECY,
  Nahúm: BookGenre.PROPHECY,
  Habacuc: BookGenre.PROPHECY,
  Sofonías: BookGenre.PROPHECY,
  Hageo: BookGenre.PROPHECY,
  Zacarías: BookGenre.PROPHECY,
  Malaquías: BookGenre.PROPHECY,
  Mateo: BookGenre.GOSPEL,
  Marcos: BookGenre.GOSPEL,
  Lucas: BookGenre.GOSPEL,
  Juan: BookGenre.GOSPEL,
  Hechos: BookGenre.HISTORY,
  Romanos: BookGenre.EPISTLE,
  '1 Corintios': BookGenre.EPISTLE,
  '2 Corintios': BookGenre.EPISTLE,
  Gálatas: BookGenre.EPISTLE,
  Efesios: BookGenre.EPISTLE,
  Filipenses: BookGenre.EPISTLE,
  Colosenses: BookGenre.EPISTLE,
  '1 Tesalonicenses': BookGenre.EPISTLE,
  '2 Tesalonicenses': BookGenre.EPISTLE,
  '1 Timoteo': BookGenre.EPISTLE,
  '2 Timoteo': BookGenre.EPISTLE,
  Tito: BookGenre.EPISTLE,
  Filemón: BookGenre.EPISTLE,
  Hebreos: BookGenre.EPISTLE,
  Santiago: BookGenre.EPISTLE,
  '1 Pedro': BookGenre.EPISTLE,
  '2 Pedro': BookGenre.EPISTLE,
  '1 Juan': BookGenre.EPISTLE,
  '2 Juan': BookGenre.EPISTLE,
  '3 Juan': BookGenre.EPISTLE,
  Judas: BookGenre.EPISTLE,
  Apocalipsis: BookGenre.APOCALYPTIC,
};

// Temas comunes y versículos relacionados
const THEME_BOOKS: Record<string, string[]> = {
  amor: ['Juan', '1 Corintios', '1 Juan', 'Cantares'],
  fe: ['Hebreos', 'Santiago', 'Romanos', 'Gálatas'],
  esperanza: ['Salmos', 'Isaías', 'Romanos', '1 Pedro'],
  sabiduría: ['Proverbios', 'Eclesiastés', 'Santiago', 'Job'],
  perdón: ['Mateo', 'Lucas', 'Colosenses', 'Efesios'],
  gracia: ['Romanos', 'Efesios', 'Tito', '2 Corintios'],
  justicia: ['Miqueas', 'Amós', 'Isaías', 'Mateo'],
  paz: ['Filipenses', 'Juan', 'Isaías', 'Salmos'],
  oración: ['Lucas', 'Mateo', '1 Tesalonicenses', 'Santiago'],
  fortaleza: ['Salmos', 'Isaías', 'Filipenses', '2 Corintios'],
};

export class RecommendationEngine {
  private db: BibleDatabase;

  constructor(database: BibleDatabase) {
    this.db = database;
  }

  /**
   * Get personalized recommendations for a user
   */
  async getRecommendations(
    userId: string,
    limit: number = 5,
  ): Promise<Recommendation[]> {
    const preferences = await this.analyzeUserPreferences(userId);
    const readingHistory = await this.getReadingHistory(userId);

    const recommendations: Recommendation[] = [];

    // 1. Continue reading series (highest priority)
    const continueReading =
      await this.getContinueReadingRecommendation(readingHistory);
    if (continueReading) {
      recommendations.push(continueReading);
    }

    // 2. Discover new books based on favorites
    const discover = await this.getDiscoverRecommendations(
      preferences,
      readingHistory,
      2,
    );
    recommendations.push(...discover);

    // 3. Daily challenge
    const challenge = await this.getDailyChallengeRecommendation(preferences);
    if (challenge) {
      recommendations.push(challenge);
    }

    // 4. Theme-based recommendations
    const themeBased = await this.getThemeBasedRecommendation(readingHistory);
    if (themeBased) {
      recommendations.push(themeBased);
    }

    // 5. Seasonal recommendations
    const seasonal = await this.getSeasonalRecommendation();
    if (seasonal) {
      recommendations.push(seasonal);
    }

    // Sort by priority and return top N
    return recommendations
      .sort((a, b) => b.priority - a.priority)
      .slice(0, limit);
  }

  /**
   * Analyze user reading preferences
   */
  private async analyzeUserPreferences(
    userId: string,
  ): Promise<UserPreferences> {
    // In a real app, this would analyze actual user data
    // For now, we'll return reasonable defaults

    return {
      favoriteTestament: 'balanced',
      favoriteGenres: [BookGenre.GOSPEL, BookGenre.POETRY, BookGenre.EPISTLE],
      averageSessionLength: 15,
      preferredReadingTime: 'evening',
      readingSpeed: 'medium',
      completionRate: 65,
    };
  }

  /**
   * Get reading history
   */
  private async getReadingHistory(userId: string): Promise<string[]> {
    // In a real app, track which books user has read
    // For demo, return common starting books
    return ['Juan', 'Génesis', 'Salmos', 'Mateo'];
  }

  /**
   * Recommend continuing a book series
   */
  private async getContinueReadingRecommendation(
    readingHistory: string[],
  ): Promise<Recommendation | null> {
    // Check for incomplete series
    const series = [
      ['Génesis', 'Éxodo', 'Levítico', 'Números', 'Deuteronomio'],
      ['Mateo', 'Marcos', 'Lucas', 'Juan'],
      ['1 Samuel', '2 Samuel'],
      ['1 Reyes', '2 Reyes'],
      ['1 Corintios', '2 Corintios'],
    ];

    for (const bookSeries of series) {
      const readBooks = bookSeries.filter(book =>
        readingHistory.includes(book),
      );
      const unreadBooks = bookSeries.filter(
        book => !readingHistory.includes(book),
      );

      if (readBooks.length > 0 && unreadBooks.length > 0) {
        const nextBook = unreadBooks[0];

        return {
          id: `continue_${nextBook.toLowerCase().replace(/\s/g, '_')}`,
          type: RecommendationType.COMPLETE_SERIES,
          title: `Continúa tu viaje en ${nextBook}`,
          description: `Has leído ${readBooks.join(', ')}. ¡Completa la serie con ${nextBook}!`,
          bookName: nextBook,
          chapter: 1,
          reason: `Serie incompleta: ${readBooks.length}/${bookSeries.length} libros leídos`,
          confidence: 90,
          priority: 10,
          difficulty: 'medium',
          estimatedTime: 20,
          tags: ['serie', 'continuación', 'recomendado'],
        };
      }
    }

    return null;
  }

  /**
   * Discover new books based on preferences
   */
  private async getDiscoverRecommendations(
    preferences: UserPreferences,
    readingHistory: string[],
    count: number,
  ): Promise<Recommendation[]> {
    const recommendations: Recommendation[] = [];
    const favoriteGenre = preferences.favoriteGenres[0];

    // Find unread books in favorite genre
    const booksInGenre = Object.entries(BOOK_GENRES)
      .filter(([_, genre]) => genre === favoriteGenre)
      .map(([book, _]) => book)
      .filter(book => !readingHistory.includes(book));

    for (let i = 0; i < Math.min(count, booksInGenre.length); i++) {
      const book = booksInGenre[i];

      recommendations.push({
        id: `discover_${book.toLowerCase().replace(/\s/g, '_')}`,
        type: RecommendationType.DISCOVER,
        title: `Descubre ${book}`,
        description: `Basado en tu amor por ${this.getGenreName(favoriteGenre)}, creemos que te encantará ${book}`,
        bookName: book,
        chapter: 1,
        reason: `Género favorito: ${this.getGenreName(favoriteGenre)}`,
        confidence: 75,
        priority: 7,
        difficulty: this.estimateDifficulty(book),
        estimatedTime: preferences.averageSessionLength,
        tags: ['descubrir', this.getGenreName(favoriteGenre)],
      });
    }

    return recommendations;
  }

  /**
   * Generate daily challenge
   */
  private async getDailyChallengeRecommendation(
    preferences: UserPreferences,
  ): Promise<Recommendation | null> {
    const challenges = [
      {
        book: 'Salmos',
        chapter: Math.floor(Math.random() * 150) + 1,
        title: 'Desafío: Salmo Aleatorio',
        description: 'Explora un salmo diferente cada día',
        tags: ['desafío', 'poesía', 'adoración'],
      },
      {
        book: 'Proverbios',
        chapter: new Date().getDate(), // Day of month
        title: 'Sabiduría Diaria',
        description: 'Un proverbio para cada día del mes',
        tags: ['desafío', 'sabiduría', 'diario'],
      },
    ];

    const challenge = challenges[Math.floor(Math.random() * challenges.length)];

    return {
      id: `challenge_${Date.now()}`,
      type: RecommendationType.DAILY_CHALLENGE,
      title: challenge.title,
      description: challenge.description,
      bookName: challenge.book,
      chapter: challenge.chapter,
      reason: 'Desafío diario personalizado',
      confidence: 80,
      priority: 8,
      difficulty: 'easy',
      estimatedTime: 10,
      tags: challenge.tags,
    };
  }

  /**
   * Theme-based recommendation
   */
  private async getThemeBasedRecommendation(
    readingHistory: string[],
  ): Promise<Recommendation | null> {
    const themes = Object.keys(THEME_BOOKS);
    const randomTheme = themes[Math.floor(Math.random() * themes.length)];
    const themeBooks = THEME_BOOKS[randomTheme];

    // Find unread book in this theme
    const unreadThemeBook = themeBooks.find(
      book => !readingHistory.includes(book),
    );

    if (!unreadThemeBook) return null;

    return {
      id: `theme_${randomTheme}_${unreadThemeBook.toLowerCase().replace(/\s/g, '_')}`,
      type: RecommendationType.THEME_BASED,
      title: `Explora: ${this.capitalize(randomTheme)}`,
      description: `Descubre lo que la Biblia dice sobre ${randomTheme} en ${unreadThemeBook}`,
      bookName: unreadThemeBook,
      chapter: 1,
      reason: `Tema: ${this.capitalize(randomTheme)}`,
      confidence: 70,
      priority: 6,
      difficulty: 'medium',
      estimatedTime: 15,
      tags: ['tema', randomTheme],
    };
  }

  /**
   * Seasonal recommendation
   */
  private async getSeasonalRecommendation(): Promise<Recommendation | null> {
    const month = new Date().getMonth();

    // December - Christmas
    if (month === 11) {
      return {
        id: 'seasonal_christmas',
        type: RecommendationType.SEASONAL,
        title: '🎄 Especial Navidad',
        description: 'Celebra el nacimiento de Jesús leyendo Lucas 2',
        bookName: 'Lucas',
        chapter: 2,
        verses: '1-20',
        reason: 'Temporada navideña',
        confidence: 95,
        priority: 9,
        difficulty: 'easy',
        estimatedTime: 10,
        tags: ['navidad', 'estacional', 'nacimiento'],
      };
    }

    // April - Easter season
    if (month === 3) {
      return {
        id: 'seasonal_easter',
        type: RecommendationType.SEASONAL,
        title: '✝️ Semana Santa',
        description: 'Reflexiona sobre la resurrección en Juan 20',
        bookName: 'Juan',
        chapter: 20,
        reason: 'Temporada de Pascua',
        confidence: 95,
        priority: 9,
        difficulty: 'easy',
        estimatedTime: 12,
        tags: ['pascua', 'resurrección', 'estacional'],
      };
    }

    return null;
  }

  /**
   * Helper: Get genre name in Spanish
   */
  private getGenreName(genre: BookGenre): string {
    const names: Record<BookGenre, string> = {
      [BookGenre.LAW]: 'Ley',
      [BookGenre.HISTORY]: 'Historia',
      [BookGenre.POETRY]: 'Poesía',
      [BookGenre.PROPHECY]: 'Profecía',
      [BookGenre.GOSPEL]: 'Evangelios',
      [BookGenre.EPISTLE]: 'Epístolas',
      [BookGenre.APOCALYPTIC]: 'Apocalíptico',
    };
    return names[genre];
  }

  /**
   * Helper: Estimate difficulty based on book
   */
  private estimateDifficulty(bookName: string): 'easy' | 'medium' | 'hard' {
    const easyBooks = [
      'Salmos',
      'Proverbios',
      'Marcos',
      'Juan',
      'Santiago',
      'Filipenses',
    ];
    const hardBooks = [
      'Levítico',
      'Ezequiel',
      'Daniel',
      'Apocalipsis',
      'Romanos',
      'Hebreos',
    ];

    if (easyBooks.includes(bookName)) return 'easy';
    if (hardBooks.includes(bookName)) return 'hard';
    return 'medium';
  }

  /**
   * Helper: Capitalize first letter
   */
  private capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}
