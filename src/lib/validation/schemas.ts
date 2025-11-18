/**
 * Schemas de validación con Zod para la aplicación bíblica
 * Proporciona validación type-safe para datos críticos
 */

import { z } from 'zod';

/**
 * Schema para un versículo bíblico individual
 */
export const VerseSchema = z.object({
  number: z.number().int().positive(),
  text: z.string().min(1, 'El texto del versículo no puede estar vacío'),
});

/**
 * Schema para un capítulo completo
 */
export const ChapterSchema = z.array(VerseSchema);

/**
 * Schema para un libro de la Biblia
 */
export const BookSchema = z.record(z.string(), ChapterSchema);

/**
 * Schema para marcadores (bookmarks)
 */
export const BookmarkSchema = z.object({
  id: z.string().uuid().optional(),
  book: z.string().min(1),
  chapter: z.number().int().positive(),
  verse: z.number().int().positive(),
  text: z.string().min(1),
  createdAt: z.date().or(z.string()),
  updatedAt: z.date().or(z.string()).optional(),
});

/**
 * Schema para notas
 */
export const NoteSchema = z.object({
  id: z.string().uuid().optional(),
  book: z.string().min(1),
  chapter: z.number().int().positive(),
  verse: z.number().int().positive(),
  note: z.string().min(1, 'La nota no puede estar vacía'),
  createdAt: z.date().or(z.string()),
  updatedAt: z.date().or(z.string()).optional(),
});

/**
 * Schema para resaltados
 */
export const HighlightSchema = z.object({
  id: z.string().uuid().optional(),
  book: z.string().min(1),
  chapter: z.number().int().positive(),
  verse: z.number().int().positive(),
  color: z.enum(['yellow', 'green', 'blue', 'purple', 'pink', 'orange', 'red', 'gray']),
  category: z.enum([
    'promise',
    'prayer',
    'commandment',
    'wisdom',
    'prophecy',
    'favorite',
    'memorize',
    'study',
  ]).optional(),
  note: z.string().optional(),
  createdAt: z.date().or(z.string()),
});

/**
 * Schema para búsquedas
 */
export const SearchQuerySchema = z.object({
  query: z.string().min(1, 'La búsqueda no puede estar vacía').max(500),
  book: z.string().optional(),
  limit: z.number().int().positive().max(1000).default(100),
  offset: z.number().int().min(0).default(0),
});

/**
 * Schema para parámetros de navegación
 */
export const NavigationParamsSchema = z.object({
  book: z.string().min(1),
  chapter: z.number().int().positive().optional(),
  verse: z.number().int().positive().optional(),
});

/**
 * Schema para preferencias de usuario
 */
export const UserPreferencesSchema = z.object({
  theme: z.enum(['light', 'dark', 'auto']).default('auto'),
  fontSize: z.number().int().min(12).max(32).default(16),
  language: z.enum(['es', 'en']).default('en'),
  bibleVersion: z.string().default('RVR1960'),
  notificationsEnabled: z.boolean().default(true),
  dailyVerseEnabled: z.boolean().default(true),
  hapticFeedbackEnabled: z.boolean().default(true),
});

/**
 * Schema para logros
 */
export const AchievementSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  category: z.string(),
  difficulty: z.enum(['bronze', 'silver', 'gold', 'platinum', 'diamond']),
  points: z.number().int().positive(),
  unlocked: z.boolean().default(false),
  unlockedAt: z.date().or(z.string()).optional(),
  progress: z.number().min(0).max(1).default(0),
  requirement: z.number().int().positive(),
  current: z.number().int().min(0).default(0),
});

/**
 * Schema para estadísticas de lectura
 */
export const ReadingStatsSchema = z.object({
  versesRead: z.number().int().min(0).default(0),
  chaptersCompleted: z.number().int().min(0).default(0),
  booksCompleted: z.number().int().min(0).default(0),
  currentStreak: z.number().int().min(0).default(0),
  longestStreak: z.number().int().min(0).default(0),
  totalReadingTime: z.number().int().min(0).default(0),
  lastReadDate: z.date().or(z.string()).optional(),
  level: z.number().int().min(1).max(10).default(1),
  totalPoints: z.number().int().min(0).default(0),
});

/**
 * Schema para datos de analítica
 */
export const AnalyticsEventSchema = z.object({
  eventName: z.string().min(1),
  timestamp: z.date().or(z.string()),
  properties: z.record(z.unknown()).optional(),
  userId: z.string().optional(),
  sessionId: z.string().optional(),
});

/**
 * Tipos TypeScript inferidos de los schemas
 */
export type Verse = z.infer<typeof VerseSchema>;
export type Chapter = z.infer<typeof ChapterSchema>;
export type Book = z.infer<typeof BookSchema>;
export type Bookmark = z.infer<typeof BookmarkSchema>;
export type Note = z.infer<typeof NoteSchema>;
export type Highlight = z.infer<typeof HighlightSchema>;
export type SearchQuery = z.infer<typeof SearchQuerySchema>;
export type NavigationParams = z.infer<typeof NavigationParamsSchema>;
export type UserPreferences = z.infer<typeof UserPreferencesSchema>;
export type Achievement = z.infer<typeof AchievementSchema>;
export type ReadingStats = z.infer<typeof ReadingStatsSchema>;
export type AnalyticsEvent = z.infer<typeof AnalyticsEventSchema>;

/**
 * Validador genérico con manejo de errores mejorado
 */
export function validate<T>(schema: z.ZodSchema<T>, data: unknown): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors.map((err) => `${err.path.join('.')}: ${err.message}`);
      throw new Error(`Error de validación:\n${errorMessages.join('\n')}`);
    }
    throw error;
  }
}

/**
 * Validador seguro que retorna un resultado en lugar de lanzar errores
 */
export function safeValidate<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: string } {
  try {
    const result = schema.parse(data);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors.map((err) => `${err.path.join('.')}: ${err.message}`);
      return { success: false, error: errorMessages.join(', ') };
    }
    return { success: false, error: 'Error de validación desconocido' };
  }
}
