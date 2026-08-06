// Planes de lectura bíblica

import type {TranslationKeys} from '../i18n/translations';
import {BIBLE_BOOKS} from './bible';
import {getRegisteredCustomPlanById} from '../lib/reading/customPlans';

export interface ReadingPlanDay {
  day: number;
  readings: {
    book: string;
    chapter: number;
    verses?: string; // e.g., "1-10" o undefined para todo el capítulo
  }[];
}

/** Clave de traducción del plan dentro de `t.readingPlans`. */
export type ReadingPlanI18nKey =
  | 'proverbs'
  | 'psalms'
  | 'gospels'
  | 'newTestament'
  | 'genesis'
  | 'bibleYear'
  | 'redemption'
  | 'wisdom'
  | 'firstSteps'
  | 'iam'
  | 'parables'
  | 'miracles'
  | 'namesOfGod'
  | 'fruitOfSpirit'
  | 'heroesOfFaith'
  | 'propheticThread'
  | 'chronological';

export interface ReadingPlan {
  id: string;
  /** Nombre por defecto (español). Para mostrarlo usa `getLocalizedPlan`. */
  name: string;
  /** Descripción por defecto (español). Para mostrarla usa `getLocalizedPlan`. */
  description: string;
  /**
   * Clave para resolver nombre/descripción traducidos vía i18n. Ausente en los
   * planes personalizados del usuario (Sprint 108), que no tienen traducción y
   * muestran su nombre tal cual.
   */
  i18nKey?: ReadingPlanI18nKey;
  duration: number; // días
  icon: string;
  color: string;
  days: ReadingPlanDay[];
  /** Plan creado por el usuario (no curado), resuelto desde el registro local. */
  custom?: boolean;
}

// Plan: Nuevo Testamento en 30 días
const newTestament30Days: ReadingPlan = {
  id: 'nt-30',
  name: 'Nuevo Testamento en {{n}} Días',
  description: 'Lee todo el Nuevo Testamento a tu ritmo',
  i18nKey: 'newTestament',
  duration: 30,
  icon: 'book-outline',
  color: '#3498DB',
  days: [
    {
      day: 1,
      readings: [
        {book: 'Mateo', chapter: 1},
        {book: 'Mateo', chapter: 2},
        {book: 'Mateo', chapter: 3},
        {book: 'Mateo', chapter: 4},
        {book: 'Mateo', chapter: 5},
        {book: 'Mateo', chapter: 6},
        {book: 'Mateo', chapter: 7},
        {book: 'Mateo', chapter: 8},
      ],
    },
    {
      day: 2,
      readings: [
        {book: 'Mateo', chapter: 9},
        {book: 'Mateo', chapter: 10},
        {book: 'Mateo', chapter: 11},
        {book: 'Mateo', chapter: 12},
        {book: 'Mateo', chapter: 13},
        {book: 'Mateo', chapter: 14},
        {book: 'Mateo', chapter: 15},
        {book: 'Mateo', chapter: 16},
        {book: 'Mateo', chapter: 17},
      ],
    },
    {
      day: 3,
      readings: [
        {book: 'Mateo', chapter: 18},
        {book: 'Mateo', chapter: 19},
        {book: 'Mateo', chapter: 20},
        {book: 'Mateo', chapter: 21},
        {book: 'Mateo', chapter: 22},
        {book: 'Mateo', chapter: 23},
        {book: 'Mateo', chapter: 24},
        {book: 'Mateo', chapter: 25},
        {book: 'Mateo', chapter: 26},
      ],
    },
    {
      day: 4,
      readings: [
        {book: 'Mateo', chapter: 27},
        {book: 'Mateo', chapter: 28},
        {book: 'Marcos', chapter: 1},
        {book: 'Marcos', chapter: 2},
        {book: 'Marcos', chapter: 3},
        {book: 'Marcos', chapter: 4},
        {book: 'Marcos', chapter: 5},
        {book: 'Marcos', chapter: 6},
      ],
    },
    {
      day: 5,
      readings: [
        {book: 'Marcos', chapter: 7},
        {book: 'Marcos', chapter: 8},
        {book: 'Marcos', chapter: 9},
        {book: 'Marcos', chapter: 10},
        {book: 'Marcos', chapter: 11},
        {book: 'Marcos', chapter: 12},
        {book: 'Marcos', chapter: 13},
        {book: 'Marcos', chapter: 14},
        {book: 'Marcos', chapter: 15},
      ],
    },
    {
      day: 6,
      readings: [
        {book: 'Marcos', chapter: 16},
        {book: 'Lucas', chapter: 1},
        {book: 'Lucas', chapter: 2},
        {book: 'Lucas', chapter: 3},
        {book: 'Lucas', chapter: 4},
        {book: 'Lucas', chapter: 5},
        {book: 'Lucas', chapter: 6},
        {book: 'Lucas', chapter: 7},
        {book: 'Lucas', chapter: 8},
      ],
    },
    {
      day: 7,
      readings: [
        {book: 'Lucas', chapter: 9},
        {book: 'Lucas', chapter: 10},
        {book: 'Lucas', chapter: 11},
        {book: 'Lucas', chapter: 12},
        {book: 'Lucas', chapter: 13},
        {book: 'Lucas', chapter: 14},
        {book: 'Lucas', chapter: 15},
        {book: 'Lucas', chapter: 16},
      ],
    },
    {
      day: 8,
      readings: [
        {book: 'Lucas', chapter: 17},
        {book: 'Lucas', chapter: 18},
        {book: 'Lucas', chapter: 19},
        {book: 'Lucas', chapter: 20},
        {book: 'Lucas', chapter: 21},
        {book: 'Lucas', chapter: 22},
        {book: 'Lucas', chapter: 23},
        {book: 'Lucas', chapter: 24},
        {book: 'Juan', chapter: 1},
      ],
    },
    {
      day: 9,
      readings: [
        {book: 'Juan', chapter: 2},
        {book: 'Juan', chapter: 3},
        {book: 'Juan', chapter: 4},
        {book: 'Juan', chapter: 5},
        {book: 'Juan', chapter: 6},
        {book: 'Juan', chapter: 7},
        {book: 'Juan', chapter: 8},
        {book: 'Juan', chapter: 9},
        {book: 'Juan', chapter: 10},
      ],
    },
    {
      day: 10,
      readings: [
        {book: 'Juan', chapter: 11},
        {book: 'Juan', chapter: 12},
        {book: 'Juan', chapter: 13},
        {book: 'Juan', chapter: 14},
        {book: 'Juan', chapter: 15},
        {book: 'Juan', chapter: 16},
        {book: 'Juan', chapter: 17},
        {book: 'Juan', chapter: 18},
      ],
    },
    {
      day: 11,
      readings: [
        {book: 'Juan', chapter: 19},
        {book: 'Juan', chapter: 20},
        {book: 'Juan', chapter: 21},
        {book: 'Hechos', chapter: 1},
        {book: 'Hechos', chapter: 2},
        {book: 'Hechos', chapter: 3},
        {book: 'Hechos', chapter: 4},
        {book: 'Hechos', chapter: 5},
        {book: 'Hechos', chapter: 6},
      ],
    },
    {
      day: 12,
      readings: [
        {book: 'Hechos', chapter: 7},
        {book: 'Hechos', chapter: 8},
        {book: 'Hechos', chapter: 9},
        {book: 'Hechos', chapter: 10},
        {book: 'Hechos', chapter: 11},
        {book: 'Hechos', chapter: 12},
        {book: 'Hechos', chapter: 13},
        {book: 'Hechos', chapter: 14},
        {book: 'Hechos', chapter: 15},
      ],
    },
    {
      day: 13,
      readings: [
        {book: 'Hechos', chapter: 16},
        {book: 'Hechos', chapter: 17},
        {book: 'Hechos', chapter: 18},
        {book: 'Hechos', chapter: 19},
        {book: 'Hechos', chapter: 20},
        {book: 'Hechos', chapter: 21},
        {book: 'Hechos', chapter: 22},
        {book: 'Hechos', chapter: 23},
      ],
    },
    {
      day: 14,
      readings: [
        {book: 'Hechos', chapter: 24},
        {book: 'Hechos', chapter: 25},
        {book: 'Hechos', chapter: 26},
        {book: 'Hechos', chapter: 27},
        {book: 'Hechos', chapter: 28},
        {book: 'Romanos', chapter: 1},
        {book: 'Romanos', chapter: 2},
        {book: 'Romanos', chapter: 3},
        {book: 'Romanos', chapter: 4},
      ],
    },
    {
      day: 15,
      readings: [
        {book: 'Romanos', chapter: 5},
        {book: 'Romanos', chapter: 6},
        {book: 'Romanos', chapter: 7},
        {book: 'Romanos', chapter: 8},
        {book: 'Romanos', chapter: 9},
        {book: 'Romanos', chapter: 10},
        {book: 'Romanos', chapter: 11},
        {book: 'Romanos', chapter: 12},
        {book: 'Romanos', chapter: 13},
      ],
    },
    {
      day: 16,
      readings: [
        {book: 'Romanos', chapter: 14},
        {book: 'Romanos', chapter: 15},
        {book: 'Romanos', chapter: 16},
        {book: '1 Corintios', chapter: 1},
        {book: '1 Corintios', chapter: 2},
        {book: '1 Corintios', chapter: 3},
        {book: '1 Corintios', chapter: 4},
        {book: '1 Corintios', chapter: 5},
      ],
    },
    {
      day: 17,
      readings: [
        {book: '1 Corintios', chapter: 6},
        {book: '1 Corintios', chapter: 7},
        {book: '1 Corintios', chapter: 8},
        {book: '1 Corintios', chapter: 9},
        {book: '1 Corintios', chapter: 10},
        {book: '1 Corintios', chapter: 11},
        {book: '1 Corintios', chapter: 12},
        {book: '1 Corintios', chapter: 13},
        {book: '1 Corintios', chapter: 14},
      ],
    },
    {
      day: 18,
      readings: [
        {book: '1 Corintios', chapter: 15},
        {book: '1 Corintios', chapter: 16},
        {book: '2 Corintios', chapter: 1},
        {book: '2 Corintios', chapter: 2},
        {book: '2 Corintios', chapter: 3},
        {book: '2 Corintios', chapter: 4},
        {book: '2 Corintios', chapter: 5},
        {book: '2 Corintios', chapter: 6},
        {book: '2 Corintios', chapter: 7},
      ],
    },
    {
      day: 19,
      readings: [
        {book: '2 Corintios', chapter: 8},
        {book: '2 Corintios', chapter: 9},
        {book: '2 Corintios', chapter: 10},
        {book: '2 Corintios', chapter: 11},
        {book: '2 Corintios', chapter: 12},
        {book: '2 Corintios', chapter: 13},
        {book: 'Gálatas', chapter: 1},
        {book: 'Gálatas', chapter: 2},
      ],
    },
    {
      day: 20,
      readings: [
        {book: 'Gálatas', chapter: 3},
        {book: 'Gálatas', chapter: 4},
        {book: 'Gálatas', chapter: 5},
        {book: 'Gálatas', chapter: 6},
        {book: 'Efesios', chapter: 1},
        {book: 'Efesios', chapter: 2},
        {book: 'Efesios', chapter: 3},
        {book: 'Efesios', chapter: 4},
        {book: 'Efesios', chapter: 5},
      ],
    },
    {
      day: 21,
      readings: [
        {book: 'Efesios', chapter: 6},
        {book: 'Filipenses', chapter: 1},
        {book: 'Filipenses', chapter: 2},
        {book: 'Filipenses', chapter: 3},
        {book: 'Filipenses', chapter: 4},
        {book: 'Colosenses', chapter: 1},
        {book: 'Colosenses', chapter: 2},
        {book: 'Colosenses', chapter: 3},
        {book: 'Colosenses', chapter: 4},
      ],
    },
    {
      day: 22,
      readings: [
        {book: '1 Tesalonicenses', chapter: 1},
        {book: '1 Tesalonicenses', chapter: 2},
        {book: '1 Tesalonicenses', chapter: 3},
        {book: '1 Tesalonicenses', chapter: 4},
        {book: '1 Tesalonicenses', chapter: 5},
        {book: '2 Tesalonicenses', chapter: 1},
        {book: '2 Tesalonicenses', chapter: 2},
        {book: '2 Tesalonicenses', chapter: 3},
      ],
    },
    {
      day: 23,
      readings: [
        {book: '1 Timoteo', chapter: 1},
        {book: '1 Timoteo', chapter: 2},
        {book: '1 Timoteo', chapter: 3},
        {book: '1 Timoteo', chapter: 4},
        {book: '1 Timoteo', chapter: 5},
        {book: '1 Timoteo', chapter: 6},
        {book: '2 Timoteo', chapter: 1},
        {book: '2 Timoteo', chapter: 2},
        {book: '2 Timoteo', chapter: 3},
      ],
    },
    {
      day: 24,
      readings: [
        {book: '2 Timoteo', chapter: 4},
        {book: 'Tito', chapter: 1},
        {book: 'Tito', chapter: 2},
        {book: 'Tito', chapter: 3},
        {book: 'Filemón', chapter: 1},
        {book: 'Hebreos', chapter: 1},
        {book: 'Hebreos', chapter: 2},
        {book: 'Hebreos', chapter: 3},
        {book: 'Hebreos', chapter: 4},
      ],
    },
    {
      day: 25,
      readings: [
        {book: 'Hebreos', chapter: 5},
        {book: 'Hebreos', chapter: 6},
        {book: 'Hebreos', chapter: 7},
        {book: 'Hebreos', chapter: 8},
        {book: 'Hebreos', chapter: 9},
        {book: 'Hebreos', chapter: 10},
        {book: 'Hebreos', chapter: 11},
        {book: 'Hebreos', chapter: 12},
      ],
    },
    {
      day: 26,
      readings: [
        {book: 'Hebreos', chapter: 13},
        {book: 'Santiago', chapter: 1},
        {book: 'Santiago', chapter: 2},
        {book: 'Santiago', chapter: 3},
        {book: 'Santiago', chapter: 4},
        {book: 'Santiago', chapter: 5},
        {book: '1 Pedro', chapter: 1},
        {book: '1 Pedro', chapter: 2},
        {book: '1 Pedro', chapter: 3},
      ],
    },
    {
      day: 27,
      readings: [
        {book: '1 Pedro', chapter: 4},
        {book: '1 Pedro', chapter: 5},
        {book: '2 Pedro', chapter: 1},
        {book: '2 Pedro', chapter: 2},
        {book: '2 Pedro', chapter: 3},
        {book: '1 Juan', chapter: 1},
        {book: '1 Juan', chapter: 2},
        {book: '1 Juan', chapter: 3},
        {book: '1 Juan', chapter: 4},
      ],
    },
    {
      day: 28,
      readings: [
        {book: '1 Juan', chapter: 5},
        {book: '2 Juan', chapter: 1},
        {book: '3 Juan', chapter: 1},
        {book: 'Judas', chapter: 1},
        {book: 'Apocalipsis', chapter: 1},
        {book: 'Apocalipsis', chapter: 2},
        {book: 'Apocalipsis', chapter: 3},
        {book: 'Apocalipsis', chapter: 4},
      ],
    },
    {
      day: 29,
      readings: [
        {book: 'Apocalipsis', chapter: 5},
        {book: 'Apocalipsis', chapter: 6},
        {book: 'Apocalipsis', chapter: 7},
        {book: 'Apocalipsis', chapter: 8},
        {book: 'Apocalipsis', chapter: 9},
        {book: 'Apocalipsis', chapter: 10},
        {book: 'Apocalipsis', chapter: 11},
        {book: 'Apocalipsis', chapter: 12},
        {book: 'Apocalipsis', chapter: 13},
      ],
    },
    {
      day: 30,
      readings: [
        {book: 'Apocalipsis', chapter: 14},
        {book: 'Apocalipsis', chapter: 15},
        {book: 'Apocalipsis', chapter: 16},
        {book: 'Apocalipsis', chapter: 17},
        {book: 'Apocalipsis', chapter: 18},
        {book: 'Apocalipsis', chapter: 19},
        {book: 'Apocalipsis', chapter: 20},
        {book: 'Apocalipsis', chapter: 21},
        {book: 'Apocalipsis', chapter: 22},
      ],
    },
  ],
};

// Plan: Salmos en 30 días
const psalms30Days: ReadingPlan = {
  id: 'psalms-30',
  name: 'Salmos en {{n}} Días',
  description: 'Lee el libro de Salmos completo a tu ritmo',
  i18nKey: 'psalms',
  duration: 30,
  icon: 'musical-notes-outline',
  color: '#9B59B6',
  days: Array.from({length: 30}, (_, i) => ({
    day: i + 1,
    readings: Array.from({length: 5}, (_, j) => ({
      book: 'Salmos',
      chapter: i * 5 + j + 1,
    })).filter(r => r.chapter <= 150),
  })),
};

// Plan: Proverbios en un mes
const proverbsMonth: ReadingPlan = {
  id: 'proverbs-month',
  name: 'Sabiduría Diaria (Proverbios)',
  description: 'Un capítulo de Proverbios cada día',
  i18nKey: 'proverbs',
  duration: 31,
  icon: 'bulb-outline',
  color: '#F39C12',
  days: Array.from({length: 31}, (_, i) => ({
    day: i + 1,
    readings: [{book: 'Proverbios', chapter: i + 1}],
  })),
};

// Plan: Evangelios en 40 días
const gospels40Days: ReadingPlan = {
  id: 'gospels-40',
  name: 'Los 4 Evangelios en {{n}} Días',
  description: 'Conoce la vida de Jesús a través de los cuatro evangelios',
  i18nKey: 'gospels',
  duration: 40,
  icon: 'heart-outline',
  color: '#E74C3C',
  days: [
    // Mateo (28 capítulos en ~10 días)
    {
      day: 1,
      readings: [
        {book: 'Mateo', chapter: 1},
        {book: 'Mateo', chapter: 2},
        {book: 'Mateo', chapter: 3},
      ],
    },
    {
      day: 2,
      readings: [
        {book: 'Mateo', chapter: 4},
        {book: 'Mateo', chapter: 5},
      ],
    },
    {
      day: 3,
      readings: [
        {book: 'Mateo', chapter: 6},
        {book: 'Mateo', chapter: 7},
      ],
    },
    {
      day: 4,
      readings: [
        {book: 'Mateo', chapter: 8},
        {book: 'Mateo', chapter: 9},
      ],
    },
    {
      day: 5,
      readings: [
        {book: 'Mateo', chapter: 10},
        {book: 'Mateo', chapter: 11},
      ],
    },
    {
      day: 6,
      readings: [
        {book: 'Mateo', chapter: 12},
        {book: 'Mateo', chapter: 13},
      ],
    },
    {
      day: 7,
      readings: [
        {book: 'Mateo', chapter: 14},
        {book: 'Mateo', chapter: 15},
      ],
    },
    {
      day: 8,
      readings: [
        {book: 'Mateo', chapter: 16},
        {book: 'Mateo', chapter: 17},
        {book: 'Mateo', chapter: 18},
      ],
    },
    {
      day: 9,
      readings: [
        {book: 'Mateo', chapter: 19},
        {book: 'Mateo', chapter: 20},
        {book: 'Mateo', chapter: 21},
      ],
    },
    {
      day: 10,
      readings: [
        {book: 'Mateo', chapter: 22},
        {book: 'Mateo', chapter: 23},
      ],
    },
    {
      day: 11,
      readings: [
        {book: 'Mateo', chapter: 24},
        {book: 'Mateo', chapter: 25},
      ],
    },
    {
      day: 12,
      readings: [
        {book: 'Mateo', chapter: 26},
        {book: 'Mateo', chapter: 27},
      ],
    },
    {
      day: 13,
      readings: [
        {book: 'Mateo', chapter: 28},
        {book: 'Marcos', chapter: 1},
      ],
    },
    // Marcos (16 capítulos en ~7 días)
    {
      day: 14,
      readings: [
        {book: 'Marcos', chapter: 2},
        {book: 'Marcos', chapter: 3},
      ],
    },
    {
      day: 15,
      readings: [
        {book: 'Marcos', chapter: 4},
        {book: 'Marcos', chapter: 5},
      ],
    },
    {
      day: 16,
      readings: [
        {book: 'Marcos', chapter: 6},
        {book: 'Marcos', chapter: 7},
      ],
    },
    {
      day: 17,
      readings: [
        {book: 'Marcos', chapter: 8},
        {book: 'Marcos', chapter: 9},
      ],
    },
    {
      day: 18,
      readings: [
        {book: 'Marcos', chapter: 10},
        {book: 'Marcos', chapter: 11},
      ],
    },
    {
      day: 19,
      readings: [
        {book: 'Marcos', chapter: 12},
        {book: 'Marcos', chapter: 13},
      ],
    },
    {
      day: 20,
      readings: [
        {book: 'Marcos', chapter: 14},
        {book: 'Marcos', chapter: 15},
        {book: 'Marcos', chapter: 16},
      ],
    },
    // Lucas (24 capítulos en ~10 días)
    {
      day: 21,
      readings: [
        {book: 'Lucas', chapter: 1},
        {book: 'Lucas', chapter: 2},
      ],
    },
    {
      day: 22,
      readings: [
        {book: 'Lucas', chapter: 3},
        {book: 'Lucas', chapter: 4},
      ],
    },
    {
      day: 23,
      readings: [
        {book: 'Lucas', chapter: 5},
        {book: 'Lucas', chapter: 6},
      ],
    },
    {
      day: 24,
      readings: [
        {book: 'Lucas', chapter: 7},
        {book: 'Lucas', chapter: 8},
      ],
    },
    {
      day: 25,
      readings: [
        {book: 'Lucas', chapter: 9},
        {book: 'Lucas', chapter: 10},
      ],
    },
    {
      day: 26,
      readings: [
        {book: 'Lucas', chapter: 11},
        {book: 'Lucas', chapter: 12},
      ],
    },
    {
      day: 27,
      readings: [
        {book: 'Lucas', chapter: 13},
        {book: 'Lucas', chapter: 14},
      ],
    },
    {
      day: 28,
      readings: [
        {book: 'Lucas', chapter: 15},
        {book: 'Lucas', chapter: 16},
      ],
    },
    {
      day: 29,
      readings: [
        {book: 'Lucas', chapter: 17},
        {book: 'Lucas', chapter: 18},
        {book: 'Lucas', chapter: 19},
      ],
    },
    {
      day: 30,
      readings: [
        {book: 'Lucas', chapter: 20},
        {book: 'Lucas', chapter: 21},
        {book: 'Lucas', chapter: 22},
      ],
    },
    {
      day: 31,
      readings: [
        {book: 'Lucas', chapter: 23},
        {book: 'Lucas', chapter: 24},
      ],
    },
    // Juan (21 capítulos en ~9 días)
    {
      day: 32,
      readings: [
        {book: 'Juan', chapter: 1},
        {book: 'Juan', chapter: 2},
      ],
    },
    {
      day: 33,
      readings: [
        {book: 'Juan', chapter: 3},
        {book: 'Juan', chapter: 4},
      ],
    },
    {
      day: 34,
      readings: [
        {book: 'Juan', chapter: 5},
        {book: 'Juan', chapter: 6},
      ],
    },
    {
      day: 35,
      readings: [
        {book: 'Juan', chapter: 7},
        {book: 'Juan', chapter: 8},
      ],
    },
    {
      day: 36,
      readings: [
        {book: 'Juan', chapter: 9},
        {book: 'Juan', chapter: 10},
      ],
    },
    {
      day: 37,
      readings: [
        {book: 'Juan', chapter: 11},
        {book: 'Juan', chapter: 12},
      ],
    },
    {
      day: 38,
      readings: [
        {book: 'Juan', chapter: 13},
        {book: 'Juan', chapter: 14},
        {book: 'Juan', chapter: 15},
      ],
    },
    {
      day: 39,
      readings: [
        {book: 'Juan', chapter: 16},
        {book: 'Juan', chapter: 17},
        {book: 'Juan', chapter: 18},
      ],
    },
    {
      day: 40,
      readings: [
        {book: 'Juan', chapter: 19},
        {book: 'Juan', chapter: 20},
        {book: 'Juan', chapter: 21},
      ],
    },
  ],
};

// Plan: Génesis (historia de orígenes)
const genesisMonth: ReadingPlan = {
  id: 'genesis-month',
  name: 'Génesis - El Principio',
  description: 'Descubre el origen de todo en el libro de Génesis',
  i18nKey: 'genesis',
  duration: 25,
  icon: 'planet-outline',
  color: '#27AE60',
  days: Array.from({length: 25}, (_, i) => {
    const chaptersPerDay = i < 24 ? 2 : 2;
    const startChapter = i * 2 + 1;
    return {
      day: i + 1,
      readings: Array.from({length: chaptersPerDay}, (_, j) => ({
        book: 'Génesis',
        chapter: startChapter + j,
      })).filter(r => r.chapter <= 50),
    };
  }),
};

// Plan: Toda la Biblia en un año (365 días, orden canónico).
// Generado a partir de la tabla canónica de libros para no duplicar datos: se
// aplanan los 1189 capítulos en orden y se reparten lo más uniformemente
// posible en 365 días (≈3-4 capítulos diarios). El reparto usa límites
// proporcionales (floor) para no perder ni repetir capítulos; un día puede
// cerrar un libro y abrir el siguiente, lo cual es natural en un plan anual.
const BIBLE_YEAR_DAYS = 365;
const allCanonicalChapters: {book: string; chapter: number}[] = [...BIBLE_BOOKS]
  .sort((a, b) => a.id - b.id)
  .flatMap(b =>
    Array.from({length: b.chapters}, (_, i) => ({
      book: b.name,
      chapter: i + 1,
    })),
  );
const bibleInAYear: ReadingPlan = {
  id: 'bible-year',
  name: 'Toda la Biblia en {{n}} Días',
  description: 'Recorre toda la Escritura en {{n}} días, en orden canónico',
  i18nKey: 'bibleYear',
  duration: BIBLE_YEAR_DAYS,
  icon: 'calendar-outline',
  color: '#1D4ED8',
  days: Array.from({length: BIBLE_YEAR_DAYS}, (_, i) => {
    const total = allCanonicalChapters.length;
    const start = Math.floor((i * total) / BIBLE_YEAR_DAYS);
    const end = Math.floor(((i + 1) * total) / BIBLE_YEAR_DAYS);
    return {day: i + 1, readings: allCanonicalChapters.slice(start, end)};
  }),
};

// Plan: La Biblia en orden cronológico.
//
// Mismo alcance que `bibleInAYear` (los 1189 capítulos, 365 días), pero en
// vez del orden canónico, en el orden en que los sucesos y escritos de la
// Escritura realmente ocurrieron — la convención evangélica de "Biblia
// cronológica", ampliamente enseñada y no una invención de esta app. El
// orden histórico/narrativo es un hecho o una convención, no una expresión
// protegida por derechos de autor, pero la secuencia exacta de abajo fue
// derivada de forma independiente para esta app, a nivel de CAPÍTULO
// completo (nunca se dividen versículos de un capítulo entre dos días).
//
// Algunas ubicaciones son decisiones de juicio erudito genuinas, sin una
// única respuesta establecida entre los eruditos evangélicos. Cada una se
// marca con un comentario "JUDGMENT CALL" justo donde ocurre, para que
// Victor la revise antes de publicar este plan.
//
// El agrupamiento en días reutiliza el mismo método mecánico de
// `bibleInAYear`: se aplanan los capítulos ya reordenados y se reparten
// proporcionalmente en 365 días con los mismos límites `Math.floor` — el
// corte de días es mecánico, no una tabla escrita a mano.

type ChronoReading = {book: string; chapter: number};

/** A contiguous chapter range from ONE book, inclusive on both ends. */
function span(book: string, start: number, end: number): ChronoReading[] {
  const out: ChronoReading[] = [];
  for (let chapter = start; chapter <= end; chapter++) {
    out.push({book, chapter});
  }
  return out;
}

/** Explicit, possibly non-contiguous chapters from ONE book, in the given order. */
function picks(book: string, chapters: readonly number[]): ChronoReading[] {
  return chapters.map(chapter => ({book, chapter}));
}

// --- Los Salmos sin data interna --------------------------------------
//
// JUDGMENT CALL (Salmos sin data interna): el Salterio no trae una tabla de
// fechas. La regla seguida aquí es deliberadamente conservadora: SOLO se
// reubica un salmo cuando su propio título o texto da una ocasión histórica
// explícita (el conjunto bien conocido de superíndices davídicos ligados a
// sucesos de 1–2 Samuel, Sal 90 "oración de Moisés", Sal 137 "junto a los
// ríos de Babilonia"). Los salmos de Asaf y de los hijos de Coré se leen
// juntos en el punto en que David los nombra cantores levitas (1 Cr 15–16).
// Los Cánticos de las subidas (120–134) se leen juntos en el regreso del
// exilio por su tema de peregrinación a Sion, aunque algunos llevan título
// davídico — aquí se prioriza la coherencia de la colección sobre la fecha
// individual de cada uno. TODO el resto del Salterio (la mayoría, sin
// ninguna pista interna de fecha) no recibe una ocasión inventada: se
// agrupa según su propia división estructural en "Libros" (una
// característica real del texto — Libros I–III frente a IV–V, no algo que
// esta app decide) y se lee en dos bloques, uno en tiempos de David y otro
// en el regreso del exilio.
const ASAPH_PSALMS = [50, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83];
const KORAH_PSALMS = [42, 43, 44, 45, 46, 47, 48, 49, 84, 85, 87, 88];
const PSALMS_ASCENTS = [
  120, 121, 122, 123, 124, 125, 126, 127, 128, 129, 130, 131, 132, 133, 134,
];
const PSALMS_BOOKS_I_III_UNDATED = [
  1, 2, 4, 5, 6, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 19, 20, 21, 22, 23, 24,
  25, 26, 27, 28, 29, 31, 32, 33, 35, 36, 37, 38, 39, 40, 41, 53, 55, 58, 61,
  62, 64, 65, 66, 67, 68, 69, 70, 71, 86, 89,
];
const PSALMS_BOOKS_IV_V_UNDATED = [
  91, 92, 93, 94, 95, 96, 97, 98, 99, 100, 101, 102, 103, 104, 105, 106, 107,
  108, 109, 110, 111, 112, 113, 114, 115, 116, 117, 118, 119, 135, 136, 138,
  139, 140, 141, 143, 144, 145, 146, 147, 148, 149, 150,
];

// --- Orígenes y los patriarcas ------------------------------------------
const CHRONO_ORIGINS: ChronoReading[] = [
  ...span('Génesis', 1, 11), // Creación, caída, diluvio, Babel
  // JUDGMENT CALL (ubicación de Job): se sitúa aquí, antes del llamado de
  // Abraham. Su trasfondo (riqueza medida en rebaños, sacrificio patriarcal
  // sin sacerdocio levítico, longevidad) encaja en la edad de los
  // patriarcas, pero el libro mismo no fecha su historia con ningún rey ni
  // suceso verificable — esta es la ubicación más frecuente en las Biblias
  // cronológicas evangélicas, no un dato cierto.
  ...span('Job', 1, 42),
  ...span('Génesis', 12, 50), // Abraham, Isaac, Jacob, José
];

// --- Éxodo, ley y peregrinación ------------------------------------------
const CHRONO_EXODUS_AND_LAW: ChronoReading[] = [
  ...span('Éxodo', 1, 40),
  ...span('Levítico', 1, 27),
  ...span('Números', 1, 20),
  // Salmo 90, "oración de Moisés": la única atribución de autoría del
  // Salterio ubicada fuera de la época real-davídica. Su tema ("nuestros
  // años son setenta") encaja con la generación que muere en el desierto
  // (Nm 20 narra la muerte de Miriam, y más adelante la de Aarón).
  ...picks('Salmos', [90]),
  ...span('Números', 21, 36),
  ...span('Deuteronomio', 1, 34),
];

// --- Conquista y jueces ---------------------------------------------------
const CHRONO_CONQUEST_AND_JUDGES: ChronoReading[] = [
  ...span('Josué', 1, 24),
  // JUDGMENT CALL (orden interno de Jueces): se deja el libro en su propio
  // orden 1–21 en vez de adelantar los capítulos 17–21 al comienzo del
  // período de los jueces — una reubicación que algunas Biblias
  // cronológicas hacen por la mención de Finees, nieto de Aarón, todavía
  // vivo en 20:28. Este plan solo reordena LIBROS o rangos de capítulos
  // completos entre sí, nunca capítulos individuales fuera de secuencia
  // dentro de un mismo libro — un riesgo mayor que no vale la pena asumir
  // aquí.
  ...span('Jueces', 1, 21),
  ...span('Rut', 1, 4), // "en los días que gobernaban los jueces" (Rt 1:1)
];

// --- La monarquía unida: Saúl, David, Salomón -----------------------------
//
// JUDGMENT CALL (Samuel y 1 Crónicas): en vez de intercalar 1 Crónicas
// capítulo a capítulo dentro de 1–2 Samuel (arriesgando errores de
// colocación sin ganar precisión real a nivel de capítulo completo), este
// plan lee primero todo 1–2 Samuel y luego todo 1 Crónicas 1–29 seguido —
// el relato profético del mismo reinado, y después el relato del cronista
// del mismo reinado, uno a continuación del otro. Es una simplificación
// declarada, no una interleaving genuina.
const CHRONO_UNITED_MONARCHY: ChronoReading[] = [
  ...span('1 Samuel', 1, 19),
  ...picks('Salmos', [59]), // "cuando Saúl envió a vigilar la casa" (1 S 19:11)
  ...span('1 Samuel', 20, 21),
  ...picks('Salmos', [56, 34]), // huida a Gat, ante Abimelec/Aquis (1 S 21)
  ...span('1 Samuel', 22, 22),
  ...picks('Salmos', [52]), // Doeg delató a Saúl (1 S 22)
  ...span('1 Samuel', 23, 23),
  ...picks('Salmos', [54]), // los zifeos delataron a David (1 S 23)
  ...span('1 Samuel', 24, 24),
  ...picks('Salmos', [57, 142, 7]), // huida a la cueva, ante Saúl
  ...span('1 Samuel', 25, 31),
  ...span('1 Crónicas', 1, 9), // genealogías, prólogo del cronista
  ...span('1 Crónicas', 10, 10), // muerte de Saúl (paralelo a 1 S 31)
  ...span('2 Samuel', 1, 5),
  ...picks('Salmos', [30]), // dedicación de la casa de David
  ...span('2 Samuel', 6, 8),
  ...picks('Salmos', [60]), // tras las guerras de David (2 S 8)
  ...span('2 Samuel', 9, 12),
  ...picks('Salmos', [51]), // Natán vino a él tras su pecado (2 S 12)
  ...span('2 Samuel', 13, 15),
  ...picks('Salmos', [3, 63]), // huida de Absalón, desierto de Judá
  ...span('2 Samuel', 16, 22),
  ...picks('Salmos', [18]), // mismo cántico de liberación que 2 S 22
  ...span('2 Samuel', 23, 24),
  ...span('1 Crónicas', 11, 16), // reinado de David, el arca vuelve
  ...picks('Salmos', ASAPH_PSALMS), // David nombra a Asaf cantor (1 Cr 15–16)
  ...picks('Salmos', KORAH_PSALMS), // y a los hijos de Coré
  ...span('1 Crónicas', 17, 29), // pacto davídico, preparativos del templo
  ...picks('Salmos', PSALMS_BOOKS_I_III_UNDATED),
  ...span('1 Reyes', 1, 2), // Salomón sucede a David
  ...picks('Salmos', [72]), // "de Salomón": bendición sobre su reinado
  ...span('1 Reyes', 3, 3), // sabiduría concedida
  ...span('Cantares', 1, 8),
  ...span('1 Reyes', 4, 10), // administración, templo, la reina de Sabá
  ...span('Proverbios', 1, 31),
  ...span('1 Reyes', 11, 11), // decadencia, mujeres extranjeras, muerte
  ...span('Eclesiastés', 1, 12), // reflexión tardía sobre la vanidad
  ...span('2 Crónicas', 1, 9), // el mismo reinado, relato del cronista
];

// --- El reino dividido, con los profetas escritores intercalados ---------
//
// JUDGMENT CALL (Isaías completo): se lee entero en el reinado de Ezequías,
// donde están sus capítulos narrativos (36–39, casi idénticos a 2 R 18–20)
// y donde el propio libro registra a Isaías como consejero del rey (2 R
// 19–20; 2 Cr 32). Su capítulo del llamado (Is 6) ocurre antes, "el año que
// murió el rey Uzías", y el capítulo 7 está fechado en Acaz — pero dividir
// el libro entre esos puntos tomaría, de hecho, una postura sobre la
// composición del libro que este producto devocional prefiere no asumir.
// Mantenerlo entero en su ancla narrativa más clara evita esa postura.
// La misma razón aplica a Zacarías más abajo.
const CHRONO_DIVIDED_KINGDOM: ChronoReading[] = [
  ...span('1 Reyes', 12, 16), // Jeroboam I / Roboam, Abiam, Asa, ...Acab
  ...span('2 Crónicas', 10, 16), // el mismo tramo, solo Judá
  ...span('1 Reyes', 17, 22), // Acab, Elías, Josafat empieza
  ...span('2 Crónicas', 17, 20), // Josafat
  ...span('2 Reyes', 1, 11), // Elías, Eliseo, Jehú, Atalía
  ...span('2 Crónicas', 21, 23), // Joram, Ocozías, Atalía, Joás coronado
  ...span('2 Reyes', 12, 12), // Joás de Judá repara el templo
  ...span('2 Crónicas', 24, 24), // Joás, relato del cronista
  // JUDGMENT CALL (fecha de Joel): entre las más disputadas del AT (se ha
  // propuesto desde el siglo IX a.C. hasta la época postexílica). Se
  // ubica aquí, en tiempos de Joás/Joiada, la datación temprana más común
  // entre comentaristas conservadores — el culto del templo funcionando con
  // normalidad encaja mejor con una fecha preexílica que postexílica.
  ...span('Joel', 1, 3),
  ...span('2 Reyes', 13, 13), // Joacaz, Joás de Israel, muerte de Eliseo
  ...span('2 Reyes', 14, 14), // Amasías, Jeroboam II — 14:25 nombra a Jonás
  ...span('2 Crónicas', 25, 25), // Amasías
  ...span('Jonás', 1, 4), // "en días de Jeroboam hijo de Joás" (2 R 14:25)
  ...span('Amós', 1, 9), // "en días de Uzías... y Jeroboam" (Am 1:1)
  ...span('Oseas', 1, 14), // "en días de Uzías... hasta Ezequías" (Os 1:1)
  ...span('2 Reyes', 15, 15), // Uzías/Azarías, reyes efímeros de Israel, Jotam
  ...span('2 Crónicas', 26, 26), // Uzías
  ...span('2 Crónicas', 27, 27), // Jotam
  ...span('Miqueas', 1, 7), // "en días de Jotam, Acaz, Ezequías" (Miq 1:1)
  ...span('2 Reyes', 16, 16), // Acaz — trasfondo de la señal de Is 7
  ...span('2 Crónicas', 28, 28), // Acaz
  ...span('2 Reyes', 17, 17), // caída de Samaria, exilio de Israel
  ...span('2 Reyes', 18, 20), // Ezequías, Senaquerib, la enfermedad
  ...span('2 Crónicas', 29, 32), // Ezequías, relato del cronista
  ...span('Isaías', 1, 66),
  ...span('Nahúm', 1, 3), // Nínive, todavía la potencia dominante
  ...span('2 Reyes', 21, 21), // Manasés, Amón
  ...span('2 Crónicas', 33, 33), // Manasés, Amón — incluye su arrepentimiento
  ...span('2 Reyes', 22, 23), // Josías, hallazgo del libro de la ley
  ...span('2 Crónicas', 34, 35), // Josías, relato del cronista
  ...span('Sofonías', 1, 3), // "en días de Josías" (Sof 1:1)
  // JUDGMENT CALL (fecha de Habacuc): sin data interna explícita; se ubica
  // al final del reinado de Josías, cuando el peligro caldeo (babilónico)
  // ya se anunciaba en el horizonte (Hab 1:6).
  ...span('Habacuc', 1, 3),
  // JUDGMENT CALL (Jeremías dividido en su única costura natural): el
  // libro se divide en 1–38 (el ministerio de advertencia, que comienza
  // "en los días de Josías", Jer 1:2) y 39–52 (la caída misma de Jerusalén
  // y sus secuelas) — la única división que el propio libro ya marca con
  // el relato del sitio en el capítulo 39, no un corte arbitrario.
  ...span('Jeremías', 1, 38),
  ...span('2 Reyes', 24, 24), // Joacim, Joaquín, primera deportación
  ...span('Daniel', 1, 12), // comienza con la deportación de Joacim (Dn 1:1)
  ...span('Ezequiel', 1, 48), // comienza en el exilio de Joaquín (Ez 1:2)
  ...span('Jeremías', 39, 52),
  ...span('2 Reyes', 25, 25), // caída de Jerusalén, Gedalías, Joaquín liberado
  ...span('2 Crónicas', 36, 36), // los últimos reyes, la caída, el decreto de Ciro
  ...span('Lamentaciones', 1, 5),
  ...picks('Salmos', [137]), // "junto a los ríos de Babilonia" — el exilio mismo
  // JUDGMENT CALL (fecha de Abdías): algunos lo ubican temprano (siglo IX
  // a.C., un ataque edomita narrado en 2 Cr 21); se ubica aquí, tras la
  // caída de Jerusalén, porque su acusación central —Edom se regocijó y
  // colaboró "en el día de la calamidad" de su hermano Jacob (vv. 11–14)—
  // encaja mejor con el 586 a.C. (cf. Sal 137:7; Lm 4:21-22).
  ...span('Abdías', 1, 1),
];

// --- El regreso del exilio -------------------------------------------------
const CHRONO_RETURN_FROM_EXILE: ChronoReading[] = [
  ...span('Esdras', 1, 4), // decreto de Ciro, altar, cimiento del templo, oposición
  // Hageo y Zacarías (1–8) están fechados explícitamente "en el año segundo
  // de Darío" y son nombrados como los que animaron la obra en Esd 5:1;
  // 6:14 — la única ubicación de este plan tomada directamente del propio
  // texto histórico, sin ninguna inferencia de por medio.
  ...span('Hageo', 1, 2),
  ...span('Zacarías', 1, 14),
  ...span('Esdras', 5, 6), // el templo se termina y se dedica, bajo Darío
  ...picks('Salmos', PSALMS_ASCENTS), // adoración de peregrinación, templo ya en pie
  ...span('Ester', 1, 10), // reinado de Asuero/Jerjes, entre Esd 6 y Esd 7
  ...span('Esdras', 7, 10), // el regreso de Esdras, bajo Artajerjes
  ...span('Nehemías', 1, 13), // se reconstruye el muro, reformas finales
  ...span('Malaquías', 1, 4), // los mismos males que enfrenta Nehemías 13
  ...picks('Salmos', PSALMS_BOOKS_IV_V_UNDATED),
];

// --- Los cuatro evangelios: una vida de Cristo --------------------------
//
// JUDGMENT CALL (armonía de los evangelios): a nivel de CAPÍTULO completo
// (no de versículo) no se puede fusionar el contenido de dos evangelios en
// una sola lectura — así que "armonizar" aquí significa intercalar los 89
// capítulos de los cuatro evangelios en una sola línea de tiempo, de modo
// que los capítulos que narran el mismo tramo queden uno junto al otro.
// La columna vertebral usada es: la infancia sigue a Lucas (su propio
// relato reclama una "investigación ordenada", Lc 1:3, y es el más
// completo); el ministerio público sigue a Marcos, el evangelio más breve
// y de acción más directamente secuencial; los capítulos de Mateo y Lucas
// que Marcos no tiene paralelo (el Sermón del Monte, la larga sección de
// viaje de Lucas 10–17) se insertan en el punto de Marcos que les
// corresponde; los capítulos de Juan —en su mayoría materiales propios de
// Judea/Jerusalén, no sinópticos— se insertan en los propios anclajes de
// fiestas/viajes que el texto de Juan mismo da (bodas de Caná, fiesta de
// los Tabernáculos, dedicación, etc.); la Semana de la Pasión agrupa los
// capítulos de los cuatro por día del relato, no por libro.
const CHRONO_GOSPELS: ChronoReading[] = [
  ...span('Lucas', 1, 1), // anuncios del nacimiento de Juan y de Jesús
  ...span('Mateo', 1, 1), // genealogía y nacimiento, perspectiva de José
  ...span('Lucas', 2, 2), // nacimiento, pastores, presentación, Jesús niño
  ...span('Mateo', 2, 2), // magos, huida a Egipto, Nazaret
  ...span('Mateo', 3, 3), // Juan el Bautista, bautismo de Jesús
  ...span('Marcos', 1, 1), // bautismo, tentación, ministerio galileo comienza
  ...span('Lucas', 3, 4), // genealogía hasta Adán; tentación, Nazaret
  ...span('Mateo', 4, 4), // tentación, llamado de los primeros discípulos
  ...span('Juan', 1, 5), // prólogo; Caná; Nicodemo; la samaritana; Betesda
  ...span('Lucas', 5, 5), // pesca milagrosa, leproso, paralítico, Leví
  ...span('Marcos', 2, 3), // controversias de sábado, los Doce escogidos
  ...span('Mateo', 5, 7), // Sermón del Monte
  ...span('Lucas', 6, 6), // Sermón del Llano, los Doce
  ...span('Mateo', 8, 9), // sanidades, la tormenta calmada, llamado de Mateo
  ...span('Lucas', 7, 8), // el centurión, viuda de Naín, el sembrador
  ...span('Mateo', 10, 12), // envío de los Doce, controversias de sábado
  ...span('Marcos', 4, 4), // parábolas del reino
  ...span('Mateo', 13, 13), // parábolas del reino
  ...span('Marcos', 5, 5), // el gadareno, la hija de Jairo
  ...span('Mateo', 14, 14), // Juan el Bautista decapitado, los 5000
  ...span('Marcos', 6, 6), // Nazaret, los 5000, camina sobre el mar
  ...span('Juan', 6, 6), // los 5000, el Pan de Vida
  ...span('Mateo', 15, 15), // la sirofenicia, los 4000
  ...span('Marcos', 7, 7), // tradición de los ancianos, la sirofenicia
  ...span('Mateo', 16, 16), // confesión de Pedro, primer anuncio de la pasión
  ...span('Marcos', 8, 8), // los 4000, confesión de Pedro
  ...span('Lucas', 9, 9), // transfiguración, comienza el viaje a Jerusalén
  ...span('Mateo', 17, 17), // transfiguración, el muchacho endemoniado
  ...span('Marcos', 9, 9), // transfiguración, sobre la grandeza
  ...span('Mateo', 18, 18), // sobre la grandeza, el perdón
  ...span('Juan', 7, 10), // fiesta de los Tabernáculos, el buen Pastor
  ...span('Lucas', 10, 17), // los 72, el buen samaritano, hasta los diez leprosos
  ...span('Mateo', 19, 19), // el divorcio, los niños, el joven rico
  ...span('Marcos', 10, 10), // el joven rico, Bartimeo
  ...span('Lucas', 18, 18), // la viuda persistente, Bartimeo
  ...span('Mateo', 20, 20), // obreros de la viña, tercer anuncio de la pasión
  ...span('Juan', 11, 11), // resurrección de Lázaro
  ...span('Lucas', 19, 19), // Zaqueo, las minas, entrada triunfal
  ...span('Mateo', 21, 21), // entrada triunfal, purificación del templo
  ...span('Marcos', 11, 11), // entrada triunfal, la higuera, el templo
  ...span('Juan', 12, 12), // unción en Betania, entrada triunfal
  ...span('Mateo', 22, 22), // parábola de las bodas, tributo, el gran mandamiento
  ...span('Marcos', 12, 12), // controversias del templo, la viuda pobre
  ...span('Lucas', 20, 20), // controversias del templo
  ...span('Mateo', 23, 23), // ayes contra los escribas y fariseos
  ...span('Lucas', 21, 21), // la viuda pobre, discurso del Olivo
  ...span('Marcos', 13, 13), // discurso del Olivo
  ...span('Mateo', 24, 25), // discurso del Olivo, parábolas del juicio
  ...span('Lucas', 22, 22), // última cena, Getsemaní, arresto, negación
  ...span('Mateo', 26, 26), // última cena, Getsemaní, arresto, juicio ante el sanedrín
  ...span('Marcos', 14, 14), // última cena, Getsemaní, arresto, negación
  ...span('Juan', 13, 18), // lavado de pies, discurso de despedida, arresto
  ...span('Mateo', 27, 27), // juicio ante Pilato, crucifixión, sepultura
  ...span('Marcos', 15, 15), // juicio ante Pilato, crucifixión, sepultura
  ...span('Lucas', 23, 23), // Pilato, Herodes, crucifixión, sepultura
  ...span('Juan', 19, 19), // crucifixión, muerte, sepultura
  ...span('Mateo', 28, 28), // resurrección, gran comisión
  ...span('Marcos', 16, 16), // resurrección, gran comisión, ascensión
  ...span('Lucas', 24, 24), // camino a Emaús, apariciones, ascensión
  ...span('Juan', 20, 21), // Tomás, apariciones, restauración de Pedro
];

// --- Hechos y las cartas: la cronología misionera de Pablo ---------------
//
// Orden estándar entre los estudios del NT: las cartas de Pablo se leen en
// el punto de Hechos en que fueron escritas, y las cartas generales se
// ubican por su propia fecha tradicional relativa a esos mismos años.
const CHRONO_ACTS_AND_LETTERS: ChronoReading[] = [
  ...span('Hechos', 1, 9), // Pentecostés, Esteban, conversión de Saulo
  ...span('Hechos', 10, 12), // Cornelio, persecución de Herodes
  ...span('Santiago', 1, 5), // la carta más temprana del NT, antes del concilio
  ...span('Hechos', 13, 14), // primer viaje misionero
  // JUDGMENT CALL (fecha de Gálatas): se sigue la postura de "Galacia del
  // sur" con fecha temprana — escrita justo después del primer viaje, a las
  // iglesias recién visitadas, antes del concilio de Jerusalén (Hch 15).
  // La postura de "Galacia del norte" la fecharía más tarde, en el segundo
  // o tercer viaje; ambas son posiciones eruditas serias.
  ...span('Gálatas', 1, 6),
  ...span('Hechos', 15, 15), // concilio de Jerusalén
  ...span('Hechos', 16, 18), // segundo viaje: Filipos, Tesalónica, Corinto
  ...span('1 Tesalonicenses', 1, 5), // escrita desde Corinto (Hch 18)
  ...span('2 Tesalonicenses', 1, 3),
  ...span('Hechos', 19, 19), // tercer viaje, Éfeso
  ...span('1 Corintios', 1, 16), // escrita desde Éfeso (Hch 19)
  ...span('2 Corintios', 1, 13), // escrita desde Macedonia poco después
  ...span('Hechos', 20, 20), // regreso hacia Jerusalén
  ...span('Romanos', 1, 16), // escrita desde Corinto, al final del tercer viaje
  ...span('Hechos', 21, 23), // arresto en Jerusalén
  ...span('Hechos', 24, 26), // juicios ante Félix, Festo, Agripa
  ...span('Hechos', 27, 28), // viaje a Roma, naufragio, arresto domiciliario
  ...span('Efesios', 1, 6), // cartas de la prisión, escritas desde Roma
  ...span('Filipenses', 1, 4),
  ...span('Colosenses', 1, 4),
  ...span('Filemón', 1, 1),
  ...span('1 Timoteo', 1, 6), // tras una presunta liberación
  ...span('Tito', 1, 3),
  ...span('Hebreos', 1, 13), // autor y fecha inciertos; ubicada a mediados de los 60
  ...span('1 Pedro', 1, 5), // Pedro, a mediados de los 60
  ...span('2 Timoteo', 1, 4), // la última carta de Pablo, segunda prisión romana
  ...span('2 Pedro', 1, 3), // la última carta de Pedro
  ...span('Judas', 1, 1), // muy cercana a 2 Pedro en tema y fecha
  ...span('1 Juan', 1, 5), // las cartas de Juan, décadas de los 80–90
  ...span('2 Juan', 1, 1),
  ...span('3 Juan', 1, 1),
  ...span('Apocalipsis', 1, 22), // al final, tanto canónica como cronológicamente
];

/**
 * The full chronological chapter order behind `chronologicalBible`, exported
 * so the invariant test can verify BOTH the source ordering (every canonical
 * chapter exactly once) AND that the day-by-day split reproduces this exact
 * array when its days are flattened back together.
 */
export const CHRONOLOGICAL_CHAPTERS: ChronoReading[] = [
  ...CHRONO_ORIGINS,
  ...CHRONO_EXODUS_AND_LAW,
  ...CHRONO_CONQUEST_AND_JUDGES,
  ...CHRONO_UNITED_MONARCHY,
  ...CHRONO_DIVIDED_KINGDOM,
  ...CHRONO_RETURN_FROM_EXILE,
  ...CHRONO_GOSPELS,
  ...CHRONO_ACTS_AND_LETTERS,
];

const chronologicalBible: ReadingPlan = {
  id: 'chronological-bible',
  name: 'La Biblia en Orden Cronológico',
  description:
    'Recorre toda la Escritura en {{n}} días, en el orden en que sus sucesos ocurrieron',
  i18nKey: 'chronological',
  duration: BIBLE_YEAR_DAYS,
  icon: 'time-outline',
  color: '#78350F',
  days: Array.from({length: BIBLE_YEAR_DAYS}, (_, i) => {
    const total = CHRONOLOGICAL_CHAPTERS.length;
    const start = Math.floor((i * total) / BIBLE_YEAR_DAYS);
    const end = Math.floor(((i + 1) * total) / BIBLE_YEAR_DAYS);
    return {day: i + 1, readings: CHRONOLOGICAL_CHAPTERS.slice(start, end)};
  }),
};

// Plan: Cristo en toda la Biblia (la historia de la redención).
// Un capítulo clave por día, de Génesis a Apocalipsis, trazando el hilo del
// evangelio: cómo toda la Escritura apunta al Señor Jesús (Lc 24:27). No es
// un recorrido completo de un libro, sino las cumbres de la promesa cumplida
// en Cristo — para crecer en el conocimiento de Él (2 Pe 3:18).
const REDEMPTION_CHAPTERS: {book: string; chapter: number}[] = [
  {book: 'Génesis', chapter: 1}, // La creación por la Palabra
  {book: 'Génesis', chapter: 3}, // La caída y la primera promesa (3:15)
  {book: 'Génesis', chapter: 22}, // Abraham e Isaac: la sustitución
  {book: 'Éxodo', chapter: 12}, // El cordero de la Pascua
  {book: 'Levítico', chapter: 16}, // El día de la expiación
  {book: 'Números', chapter: 21}, // La serpiente de bronce (Jn 3:14)
  {book: 'Deuteronomio', chapter: 18}, // El profeta como Moisés
  {book: '2 Samuel', chapter: 7}, // El pacto con David: trono eterno
  {book: 'Salmos', chapter: 22}, // La cruz anunciada
  {book: 'Salmos', chapter: 110}, // El Señor a la diestra: sacerdote y rey
  {book: 'Isaías', chapter: 7}, // Emanuel
  {book: 'Isaías', chapter: 9}, // Un niño nos es nacido
  {book: 'Isaías', chapter: 53}, // El siervo sufriente
  {book: 'Jeremías', chapter: 31}, // El nuevo pacto
  {book: 'Ezequiel', chapter: 36}, // Un corazón nuevo
  {book: 'Daniel', chapter: 7}, // El Hijo del Hombre
  {book: 'Miqueas', chapter: 5}, // Belén
  {book: 'Zacarías', chapter: 9}, // Tu rey viene, humilde
  {book: 'Lucas', chapter: 1}, // La anunciación
  {book: 'Lucas', chapter: 2}, // El nacimiento de Jesús
  {book: 'Juan', chapter: 1}, // El Verbo hecho carne
  {book: 'Juan', chapter: 3}, // De tal manera amó Dios
  {book: 'Mateo', chapter: 5}, // El reino del Rey
  {book: 'Marcos', chapter: 10}, // Rescate por muchos (10:45)
  {book: 'Juan', chapter: 19}, // La crucifixión
  {book: 'Lucas', chapter: 24}, // La resurrección y "todas las Escrituras"
  {book: 'Hechos', chapter: 2}, // El Señor exaltado, Pentecostés
  {book: 'Romanos', chapter: 8}, // Ninguna condenación, más que vencedores
  {book: 'Hebreos', chapter: 9}, // El sacrificio de una vez para siempre
  {book: 'Apocalipsis', chapter: 5}, // El Cordero que fue inmolado
  {book: 'Apocalipsis', chapter: 21}, // Cielo nuevo y tierra nueva
];
const redemptionStory: ReadingPlan = {
  id: 'redemption-31',
  name: 'Cristo en toda la Biblia',
  description:
    'La historia de la redención: 31 pasajes clave que apuntan a Jesús, de Génesis a Apocalipsis',
  i18nKey: 'redemption',
  duration: REDEMPTION_CHAPTERS.length,
  icon: 'sparkles-outline',
  color: '#9D174D',
  days: REDEMPTION_CHAPTERS.map((reading, i) => ({
    day: i + 1,
    readings: [reading],
  })),
};

// Plan: Sabiduría diaria (un Salmo y un Proverbio cada día).
// Empareja un Salmo escogido con el capítulo de Proverbios del día (1..31) —
// la oración cantada de los Salmos junto a la sabiduría práctica de los
// Proverbios, una combinación devocional muy querida.
const WISDOM_PSALMS = [
  1, 8, 16, 19, 23, 27, 32, 34, 37, 40, 42, 46, 51, 63, 73, 84, 90, 91, 96, 100,
  103, 107, 111, 116, 121, 126, 130, 138, 139, 145, 150,
];
const wisdomDaily: ReadingPlan = {
  id: 'wisdom-31',
  name: 'Sabiduría Diaria: Salmo y Proverbio',
  description:
    'Cada día un Salmo y un capítulo de Proverbios, para empezar o cerrar el día',
  i18nKey: 'wisdom',
  duration: WISDOM_PSALMS.length,
  icon: 'leaf-outline',
  color: '#D97706',
  days: WISDOM_PSALMS.map((psalm, i) => ({
    day: i + 1,
    readings: [
      {book: 'Salmos', chapter: psalm},
      {book: 'Proverbios', chapter: i + 1},
    ],
  })),
};

// Plan: Primeros pasos con Jesús (21 días).
// Un camino suave para nuevos creyentes y para volver a empezar: quién es
// Jesús, el amor del Padre, el Sermón del Monte, la cruz y la resurrección, y
// la vida nueva en el Espíritu. Un capítulo manejable por día.
const FIRST_STEPS_CHAPTERS: {book: string; chapter: number}[] = [
  {book: 'Juan', chapter: 1}, // Quién es Jesús
  {book: 'Juan', chapter: 3}, // Nacer de nuevo / de tal manera amó Dios
  {book: 'Lucas', chapter: 15}, // El amor del Padre por el perdido
  {book: 'Juan', chapter: 4}, // La mujer junto al pozo
  {book: 'Marcos', chapter: 1}, // Jesús comienza su ministerio
  {book: 'Mateo', chapter: 5}, // El Sermón del Monte (I)
  {book: 'Mateo', chapter: 6}, // El Sermón del Monte (II): oración
  {book: 'Mateo', chapter: 7}, // El Sermón del Monte (III)
  {book: 'Salmos', chapter: 23}, // El Señor es mi pastor
  {book: 'Salmos', chapter: 1}, // Los dos caminos
  {book: 'Juan', chapter: 6}, // El pan de vida
  {book: 'Juan', chapter: 10}, // El buen pastor
  {book: 'Lucas', chapter: 24}, // La resurrección
  {book: 'Hechos', chapter: 2}, // Nace la iglesia
  {book: 'Romanos', chapter: 5}, // Paz con Dios
  {book: 'Romanos', chapter: 6}, // Muertos al pecado, vivos para Dios
  {book: 'Romanos', chapter: 8}, // La vida en el Espíritu
  {book: '1 Corintios', chapter: 13}, // El amor
  {book: 'Filipenses', chapter: 4}, // Gozo, oración, contentamiento
  {book: 'Efesios', chapter: 2}, // Salvos por gracia
  {book: 'Juan', chapter: 15}, // Permaneced en mí
];
const firstSteps: ReadingPlan = {
  id: 'first-steps-21',
  name: 'Primeros pasos con Jesús',
  description:
    'Un camino suave de {{n}} días para nuevos creyentes y para volver a empezar',
  i18nKey: 'firstSteps',
  duration: FIRST_STEPS_CHAPTERS.length,
  icon: 'footsteps-outline',
  color: '#0891B2',
  days: FIRST_STEPS_CHAPTERS.map((reading, i) => ({
    day: i + 1,
    readings: [reading],
  })),
};

// Plan: Los "Yo soy" de Jesús — siete declaraciones de Cristo en Juan, una por
// día, cada una con un breve contexto fiel (Sprint 99). Un plan corto y
// profundamente cristocéntrico: quién es Jesús, dicho por Él mismo.
const iamSayings: ReadingPlan = {
  id: 'iam-7',
  name: 'Los "Yo soy" de Jesús',
  description:
    'Siete días en el Evangelio de Juan: quién es Jesús, dicho por Él mismo',
  i18nKey: 'iam',
  duration: 7,
  icon: 'sparkles-outline',
  color: '#7C3AED',
  days: [
    {day: 1, readings: [{book: 'Juan', chapter: 6, verses: '25-40'}]},
    {day: 2, readings: [{book: 'Juan', chapter: 8, verses: '12-30'}]},
    {day: 3, readings: [{book: 'Juan', chapter: 10, verses: '1-10'}]},
    {day: 4, readings: [{book: 'Juan', chapter: 10, verses: '11-30'}]},
    {day: 5, readings: [{book: 'Juan', chapter: 11, verses: '17-44'}]},
    {day: 6, readings: [{book: 'Juan', chapter: 14, verses: '1-14'}]},
    {day: 7, readings: [{book: 'Juan', chapter: 15, verses: '1-17'}]},
  ],
};

// Plan: Las parábolas de Jesús — una parábola por día, cada una con un breve
// contexto fiel (Sprint 100). Las historias con que el Señor enseñó el reino.
const parablesOfJesus: ReadingPlan = {
  id: 'parables-10',
  name: 'Las parábolas de Jesús',
  description:
    'Diez días entre las historias con que Jesús enseñó el reino de Dios',
  i18nKey: 'parables',
  duration: 10,
  icon: 'leaf-outline',
  color: '#0EA5A4',
  days: [
    {day: 1, readings: [{book: 'Lucas', chapter: 15, verses: '11-32'}]},
    {day: 2, readings: [{book: 'Lucas', chapter: 10, verses: '25-37'}]},
    {day: 3, readings: [{book: 'Mateo', chapter: 13, verses: '1-23'}]},
    {day: 4, readings: [{book: 'Mateo', chapter: 13, verses: '24-43'}]},
    {day: 5, readings: [{book: 'Lucas', chapter: 15, verses: '1-10'}]},
    {day: 6, readings: [{book: 'Mateo', chapter: 18, verses: '21-35'}]},
    {day: 7, readings: [{book: 'Mateo', chapter: 25, verses: '1-13'}]},
    {day: 8, readings: [{book: 'Mateo', chapter: 25, verses: '14-30'}]},
    {day: 9, readings: [{book: 'Lucas', chapter: 18, verses: '9-14'}]},
    {day: 10, readings: [{book: 'Lucas', chapter: 14, verses: '15-24'}]},
  ],
};

// Plan: Los milagros de Jesús — una señal por día (Sprint 100). Las obras con
// que el Señor mostró su poder y su compasión, y reveló quién es.
const miraclesOfJesus: ReadingPlan = {
  id: 'miracles-10',
  name: 'Los milagros de Jesús',
  description: 'Diez días ante las señales con que Jesús mostró quién es',
  i18nKey: 'miracles',
  duration: 10,
  icon: 'flash-outline',
  color: '#2563EB',
  days: [
    {day: 1, readings: [{book: 'Juan', chapter: 2, verses: '1-11'}]},
    {day: 2, readings: [{book: 'Marcos', chapter: 4, verses: '35-41'}]},
    {day: 3, readings: [{book: 'Juan', chapter: 6, verses: '1-15'}]},
    {day: 4, readings: [{book: 'Mateo', chapter: 14, verses: '22-33'}]},
    {day: 5, readings: [{book: 'Marcos', chapter: 5, verses: '21-43'}]},
    {day: 6, readings: [{book: 'Juan', chapter: 9, verses: '1-12'}]},
    {day: 7, readings: [{book: 'Lucas', chapter: 7, verses: '11-17'}]},
    {day: 8, readings: [{book: 'Marcos', chapter: 2, verses: '1-12'}]},
    {day: 9, readings: [{book: 'Lucas', chapter: 17, verses: '11-19'}]},
    {day: 10, readings: [{book: 'Juan', chapter: 11, verses: '1-44'}]},
  ],
};

// Plan: Los nombres de Dios — siete días conociendo a Dios por los nombres con
// que se revela en su Palabra (Sprint 100), cada uno con un breve contexto.
const namesOfGod: ReadingPlan = {
  id: 'names-of-god-7',
  name: 'Los nombres de Dios',
  description: 'Siete días conociendo a Dios por los nombres con que se revela',
  i18nKey: 'namesOfGod',
  duration: 7,
  icon: 'flame-outline',
  color: '#B45309',
  days: [
    {day: 1, readings: [{book: 'Génesis', chapter: 22, verses: '1-14'}]},
    {day: 2, readings: [{book: 'Éxodo', chapter: 3, verses: '1-15'}]},
    {day: 3, readings: [{book: 'Éxodo', chapter: 17, verses: '8-16'}]},
    {day: 4, readings: [{book: 'Salmos', chapter: 23}]},
    {day: 5, readings: [{book: 'Jueces', chapter: 6, verses: '11-24'}]},
    {day: 6, readings: [{book: 'Éxodo', chapter: 15, verses: '22-27'}]},
    {day: 7, readings: [{book: 'Salmos', chapter: 91}]},
  ],
};

// Plan: El fruto del Espíritu — una gracia por día (Sprint 101). Las nueve
// facetas del fruto que el Espíritu cultiva en el creyente (Gálatas 5:22-23),
// cada una leída en un pasaje que la encarna y la cumple en Cristo.
const fruitOfSpirit: ReadingPlan = {
  id: 'fruit-of-spirit-9',
  name: 'El fruto del Espíritu',
  description:
    'Nueve días por el fruto que el Espíritu cultiva en el creyente (Gálatas 5:22-23)',
  i18nKey: 'fruitOfSpirit',
  duration: 9,
  icon: 'flower-outline',
  color: '#16A34A',
  days: [
    {day: 1, readings: [{book: '1 Corintios', chapter: 13, verses: '1-13'}]},
    {day: 2, readings: [{book: 'Filipenses', chapter: 4, verses: '4-9'}]},
    {day: 3, readings: [{book: 'Juan', chapter: 14, verses: '25-27'}]},
    {day: 4, readings: [{book: 'Santiago', chapter: 5, verses: '7-11'}]},
    {day: 5, readings: [{book: 'Efesios', chapter: 4, verses: '29-32'}]},
    {day: 6, readings: [{book: 'Romanos', chapter: 12, verses: '9-21'}]},
    {day: 7, readings: [{book: 'Mateo', chapter: 25, verses: '14-23'}]},
    {day: 8, readings: [{book: 'Mateo', chapter: 11, verses: '28-30'}]},
    {day: 9, readings: [{book: '1 Corintios', chapter: 9, verses: '24-27'}]},
  ],
};

// Plan: Los héroes de la fe — un recorrido por los testigos de Hebreos 11
// (Sprint 101), de Abel a la cruz. Cada día lee la historia de un creyente que
// confió en Dios, y el plan termina puestos los ojos en Jesús, meta de la fe.
const heroesOfFaith: ReadingPlan = {
  id: 'heroes-of-faith-8',
  name: 'Los héroes de la fe',
  description:
    'Ocho días entre los testigos de la fe de Hebreos 11, de Abel a Cristo',
  i18nKey: 'heroesOfFaith',
  duration: 8,
  icon: 'shield-outline',
  color: '#9333EA',
  days: [
    {day: 1, readings: [{book: 'Génesis', chapter: 4, verses: '1-10'}]},
    {day: 2, readings: [{book: 'Génesis', chapter: 6, verses: '11-22'}]},
    {day: 3, readings: [{book: 'Génesis', chapter: 12, verses: '1-9'}]},
    {day: 4, readings: [{book: 'Génesis', chapter: 22, verses: '1-18'}]},
    {day: 5, readings: [{book: 'Éxodo', chapter: 14, verses: '10-31'}]},
    {day: 6, readings: [{book: 'Josué', chapter: 6, verses: '1-20'}]},
    {day: 7, readings: [{book: 'Hebreos', chapter: 11}]},
    {day: 8, readings: [{book: 'Hebreos', chapter: 12, verses: '1-3'}]},
  ],
};

// Plan: El hilo profético (Hilo profético robustness round 3) — the
// chapter-level, day-by-day companion to the interactive Hilo profético
// (app/features/prophecies). Unlike `redemptionStory` above (a hand-picked
// 31-chapter highlights tour), this plan is DERIVED straight from
// MESSIANIC_PROPHECIES: one day per prophecy/shadow pair, in the thread's own
// order, reading that step's OT and NT CHAPTER (not just the single verse) for
// full context. Two entries that land on the exact same chapter pair (e.g. two
// Psalm 118 verses both fulfilled in the same Matthew 21 chapter) are merged
// into one day so the list never repeats a reading back-to-back — hence 77
// days for 79 catalog entries. Regenerate by re-running the entries through
// the same book+chapter+merge logic if the dataset grows again.
const PROPHETIC_THREAD_READINGS: ReadingPlanDay[] = [
  {
    day: 1,
    readings: [
      {book: 'Génesis', chapter: 3},
      {book: 'Gálatas', chapter: 4},
    ],
  },
  {
    day: 2,
    readings: [
      {book: 'Génesis', chapter: 22},
      {book: 'Gálatas', chapter: 3},
    ],
  },
  {
    day: 3,
    readings: [
      {book: 'Génesis', chapter: 49},
      {book: 'Hebreos', chapter: 7},
    ],
  },
  {
    day: 4,
    readings: [
      {book: 'Números', chapter: 24},
      {book: 'Mateo', chapter: 2},
    ],
  },
  {
    day: 5,
    readings: [
      {book: '2 Samuel', chapter: 7},
      {book: 'Lucas', chapter: 1},
    ],
  },
  {
    day: 6,
    readings: [
      {book: 'Isaías', chapter: 7},
      {book: 'Mateo', chapter: 1},
    ],
  },
  {
    day: 7,
    readings: [
      {book: 'Miqueas', chapter: 5},
      {book: 'Mateo', chapter: 2},
    ],
  },
  {
    day: 8,
    readings: [
      {book: 'Isaías', chapter: 9},
      {book: 'Lucas', chapter: 2},
    ],
  },
  {
    day: 9,
    readings: [
      {book: 'Oseas', chapter: 11},
      {book: 'Mateo', chapter: 2},
    ],
  },
  {
    day: 10,
    readings: [
      {book: 'Jeremías', chapter: 31},
      {book: 'Mateo', chapter: 2},
    ],
  },
  {
    day: 11,
    readings: [
      {book: 'Isaías', chapter: 11},
      {book: 'Romanos', chapter: 15},
    ],
  },
  {
    day: 12,
    readings: [
      {book: 'Jeremías', chapter: 23},
      {book: 'Apocalipsis', chapter: 22},
    ],
  },
  {
    day: 13,
    readings: [
      {book: 'Malaquías', chapter: 3},
      {book: 'Marcos', chapter: 1},
    ],
  },
  {
    day: 14,
    readings: [
      {book: 'Isaías', chapter: 40},
      {book: 'Mateo', chapter: 3},
    ],
  },
  {
    day: 15,
    readings: [
      {book: 'Malaquías', chapter: 4},
      {book: 'Mateo', chapter: 17},
    ],
  },
  {
    day: 16,
    readings: [
      {book: 'Deuteronomio', chapter: 18},
      {book: 'Hechos', chapter: 3},
    ],
  },
  {
    day: 17,
    readings: [
      {book: 'Isaías', chapter: 61},
      {book: 'Lucas', chapter: 4},
    ],
  },
  {
    day: 18,
    readings: [
      {book: 'Isaías', chapter: 9},
      {book: 'Mateo', chapter: 4},
    ],
  },
  {
    day: 19,
    readings: [
      {book: 'Isaías', chapter: 35},
      {book: 'Mateo', chapter: 11},
    ],
  },
  {
    day: 20,
    readings: [
      {book: 'Salmos', chapter: 78},
      {book: 'Mateo', chapter: 13},
    ],
  },
  {
    day: 21,
    readings: [
      {book: 'Zacarías', chapter: 9},
      {book: 'Mateo', chapter: 21},
    ],
  },
  {
    day: 22,
    readings: [
      {book: 'Isaías', chapter: 42},
      {book: 'Mateo', chapter: 12},
    ],
  },
  {
    day: 23,
    readings: [
      {book: 'Isaías', chapter: 53},
      {book: 'Mateo', chapter: 8},
    ],
  },
  {
    day: 24,
    readings: [
      {book: 'Salmos', chapter: 118},
      {book: 'Mateo', chapter: 21},
    ],
  },
  {
    day: 25,
    readings: [
      {book: 'Salmos', chapter: 8},
      {book: 'Mateo', chapter: 21},
    ],
  },
  {
    day: 26,
    readings: [
      {book: 'Isaías', chapter: 28},
      {book: '1 Pedro', chapter: 2},
    ],
  },
  {
    day: 27,
    readings: [
      {book: 'Salmos', chapter: 69},
      {book: 'Juan', chapter: 2},
    ],
  },
  {
    day: 28,
    readings: [
      {book: 'Isaías', chapter: 49},
      {book: 'Hechos', chapter: 13},
    ],
  },
  {
    day: 29,
    readings: [
      {book: 'Isaías', chapter: 53},
      {book: 'Juan', chapter: 1},
    ],
  },
  {
    day: 30,
    readings: [
      {book: 'Salmos', chapter: 69},
      {book: 'Juan', chapter: 15},
    ],
  },
  {
    day: 31,
    readings: [
      {book: 'Isaías', chapter: 53},
      {book: 'Juan', chapter: 12},
    ],
  },
  {
    day: 32,
    readings: [
      {book: 'Salmos', chapter: 41},
      {book: 'Juan', chapter: 13},
    ],
  },
  {
    day: 33,
    readings: [
      {book: 'Zacarías', chapter: 11},
      {book: 'Mateo', chapter: 26},
    ],
  },
  {
    day: 34,
    readings: [
      {book: 'Zacarías', chapter: 13},
      {book: 'Mateo', chapter: 26},
    ],
  },
  {
    day: 35,
    readings: [
      {book: 'Isaías', chapter: 53},
      {book: 'Mateo', chapter: 27},
    ],
  },
  {
    day: 36,
    readings: [
      {book: 'Isaías', chapter: 50},
      {book: 'Mateo', chapter: 26},
    ],
  },
  {
    day: 37,
    readings: [
      {book: 'Isaías', chapter: 53},
      {book: '1 Pedro', chapter: 2},
    ],
  },
  {
    day: 38,
    readings: [
      {book: 'Salmos', chapter: 22},
      {book: 'Juan', chapter: 20},
    ],
  },
  {
    day: 39,
    readings: [
      {book: 'Salmos', chapter: 22},
      {book: 'Juan', chapter: 19},
    ],
  },
  {
    day: 40,
    readings: [
      {book: 'Salmos', chapter: 69},
      {book: 'Juan', chapter: 19},
    ],
  },
  {
    day: 41,
    readings: [
      {book: 'Salmos', chapter: 22},
      {book: 'Mateo', chapter: 27},
    ],
  },
  {
    day: 42,
    readings: [
      {book: 'Salmos', chapter: 34},
      {book: 'Juan', chapter: 19},
    ],
  },
  {
    day: 43,
    readings: [
      {book: 'Zacarías', chapter: 12},
      {book: 'Juan', chapter: 19},
    ],
  },
  {
    day: 44,
    readings: [
      {book: 'Isaías', chapter: 53},
      {book: 'Mateo', chapter: 27},
    ],
  },
  {
    day: 45,
    readings: [
      {book: 'Isaías', chapter: 53},
      {book: 'Lucas', chapter: 22},
    ],
  },
  {
    day: 46,
    readings: [
      {book: 'Deuteronomio', chapter: 21},
      {book: 'Gálatas', chapter: 3},
    ],
  },
  {
    day: 47,
    readings: [
      {book: 'Isaías', chapter: 55},
      {book: 'Hechos', chapter: 13},
    ],
  },
  {
    day: 48,
    readings: [
      {book: 'Salmos', chapter: 16},
      {book: 'Hechos', chapter: 2},
    ],
  },
  {
    day: 49,
    readings: [
      {book: 'Salmos', chapter: 132},
      {book: 'Hechos', chapter: 2},
    ],
  },
  {
    day: 50,
    readings: [
      {book: 'Salmos', chapter: 2},
      {book: 'Hechos', chapter: 13},
    ],
  },
  {
    day: 51,
    readings: [
      {book: 'Salmos', chapter: 110},
      {book: 'Hechos', chapter: 2},
    ],
  },
  {
    day: 52,
    readings: [
      {book: 'Salmos', chapter: 68},
      {book: 'Efesios', chapter: 4},
    ],
  },
  {
    day: 53,
    readings: [
      {book: 'Salmos', chapter: 45},
      {book: 'Hebreos', chapter: 1},
    ],
  },
  {
    day: 54,
    readings: [
      {book: 'Salmos', chapter: 110},
      {book: 'Hebreos', chapter: 5},
    ],
  },
  {
    day: 55,
    readings: [
      {book: 'Daniel', chapter: 7},
      {book: 'Mateo', chapter: 26},
    ],
  },
  {
    day: 56,
    readings: [
      {book: 'Joel', chapter: 2},
      {book: 'Romanos', chapter: 10},
    ],
  },
  {
    day: 57,
    readings: [
      {book: 'Amós', chapter: 9},
      {book: 'Hechos', chapter: 15},
    ],
  },
  {
    day: 58,
    readings: [
      {book: 'Salmos', chapter: 102},
      {book: 'Hebreos', chapter: 1},
    ],
  },
  {
    day: 59,
    readings: [
      {book: 'Salmos', chapter: 8},
      {book: 'Hebreos', chapter: 2},
    ],
  },
  {
    day: 60,
    readings: [
      {book: 'Isaías', chapter: 25},
      {book: '1 Corintios', chapter: 15},
    ],
  },
  {
    day: 61,
    readings: [
      {book: 'Oseas', chapter: 13},
      {book: '1 Corintios', chapter: 15},
    ],
  },
  {
    day: 62,
    readings: [
      {book: 'Isaías', chapter: 65},
      {book: 'Apocalipsis', chapter: 21},
    ],
  },
  {
    day: 63,
    readings: [
      {book: 'Éxodo', chapter: 12},
      {book: '1 Corintios', chapter: 5},
    ],
  },
  {
    day: 64,
    readings: [
      {book: 'Éxodo', chapter: 24},
      {book: 'Mateo', chapter: 26},
    ],
  },
  {
    day: 65,
    readings: [
      {book: 'Números', chapter: 21},
      {book: 'Juan', chapter: 3},
    ],
  },
  {
    day: 66,
    readings: [
      {book: 'Génesis', chapter: 22},
      {book: 'Juan', chapter: 1},
    ],
  },
  {
    day: 67,
    readings: [
      {book: 'Éxodo', chapter: 16},
      {book: 'Juan', chapter: 6},
    ],
  },
  {
    day: 68,
    readings: [
      {book: 'Éxodo', chapter: 17},
      {book: '1 Corintios', chapter: 10},
    ],
  },
  {
    day: 69,
    readings: [
      {book: 'Éxodo', chapter: 25},
      {book: 'Juan', chapter: 1},
    ],
  },
  {
    day: 70,
    readings: [
      {book: 'Levítico', chapter: 16},
      {book: 'Hebreos', chapter: 9},
    ],
  },
  {
    day: 71,
    readings: [
      {book: 'Génesis', chapter: 14},
      {book: 'Hebreos', chapter: 7},
    ],
  },
  {
    day: 72,
    readings: [
      {book: 'Levítico', chapter: 23},
      {book: '1 Corintios', chapter: 15},
    ],
  },
  {
    day: 73,
    readings: [
      {book: 'Jonás', chapter: 1},
      {book: 'Mateo', chapter: 12},
    ],
  },
  {
    day: 74,
    readings: [
      {book: 'Génesis', chapter: 2},
      {book: '1 Corintios', chapter: 15},
    ],
  },
  {
    day: 75,
    readings: [
      {book: 'Éxodo', chapter: 26},
      {book: 'Hebreos', chapter: 10},
    ],
  },
  {
    day: 76,
    readings: [
      {book: 'Levítico', chapter: 16},
      {book: 'Hebreos', chapter: 9},
    ],
  },
  {
    day: 77,
    readings: [
      {book: 'Josué', chapter: 21},
      {book: 'Hebreos', chapter: 4},
    ],
  },
];
const propheticThread: ReadingPlan = {
  // Stable id (no day count baked in): the day count grows as
  // MESSIANIC_PROPHECIES grows, so a numbered id would drift and orphan
  // in-progress readers' saved completedDays on every future expansion.
  id: 'prophetic-thread',
  name: 'El hilo profético',
  description:
    'El Antiguo y el Nuevo Testamento, capítulo a capítulo: recorre cada profecía y su cumplimiento en Cristo',
  i18nKey: 'propheticThread',
  duration: PROPHETIC_THREAD_READINGS.length,
  icon: 'git-network-outline',
  color: '#6366f1',
  days: PROPHETIC_THREAD_READINGS,
};

export const READING_PLANS: ReadingPlan[] = [
  firstSteps,
  iamSayings,
  parablesOfJesus,
  miraclesOfJesus,
  namesOfGod,
  fruitOfSpirit,
  heroesOfFaith,
  redemptionStory,
  propheticThread,
  gospels40Days,
  newTestament30Days,
  wisdomDaily,
  psalms30Days,
  proverbsMonth,
  genesisMonth,
  bibleInAYear,
  chronologicalBible,
];

export function getReadingPlanById(id: string): ReadingPlan | undefined {
  return (
    READING_PLANS.find(plan => plan.id === id) ??
    getRegisteredCustomPlanById(id)
  );
}

/**
 * Resuelve el nombre y la descripción del plan en el idioma activo de la UI.
 * Cae al texto por defecto (español) si la clave i18n no estuviera presente.
 *
 * A few curated plans name their day count in the text itself ("Nuevo
 * Testamento en {{n}} Días") — pass the reader's `effectiveDuration` (Sprint
 * 111's duration picker) so a reflowed plan's name/description stays true;
 * omitting it (or a plan with no `{{n}}` at all) falls back to the plan's own
 * curated `duration`, which is a no-op replace for plans without the token.
 */
export function getLocalizedPlan(
  plan: ReadingPlan,
  t: TranslationKeys,
  effectiveDuration?: number,
): {name: string; description: string} {
  const localized = plan.i18nKey ? t.readingPlans?.[plan.i18nKey] : undefined;
  const n = String(effectiveDuration ?? plan.duration);
  return {
    name: (localized?.name ?? plan.name).replace('{{n}}', n),
    description: (localized?.description ?? plan.description).replace(
      '{{n}}',
      n,
    ),
  };
}

/**
 * A brief, faithful one-line context for a plan's given day, in the active UI
 * language, or undefined when the plan carries none (Sprint 99). Topical plans
 * (e.g. the "I am" sayings) add a `context` array to their i18n entry, indexed
 * by day; most plans have no per-day note. Typed loosely so only the plans that
 * opt in carry the field.
 */
export function getPlanDayContext(
  plan: ReadingPlan,
  day: number,
  t: TranslationKeys,
): string | undefined {
  const entry = plan.i18nKey
    ? (t.readingPlans?.[plan.i18nKey] as
        | {context?: readonly string[]}
        | undefined)
    : undefined;
  return entry?.context?.[day - 1];
}
